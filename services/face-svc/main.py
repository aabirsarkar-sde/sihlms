"""
Sahakar Setu face service (internal, port 8001).

POST /enroll    1–3 JPEG images            -> {embedding: float[512]} | {error: NO_FACE | MULTIPLE_FACES}
POST /identify  1–3 JPEG + candidates JSON  -> {traineeId, similarity, live} | {match: null, similarity, live}
GET  /health                                -> {ok: true, model}

Backend: insightface (buffalo_s) when available, else the `face_recognition` (dlib) library, padded to 512-d.
Liveness: with 3 frames, the head must turn (yaw proxy from 5-point landmarks changes by > LIVENESS_DELTA),
so a printed photo held still cannot mark attendance. Only embeddings leave this service; images are never stored.
"""
from __future__ import annotations

import json
import os
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

LIVENESS_DELTA = float(os.getenv("LIVENESS_DELTA", "0.12"))
MODEL_NAME = os.getenv("FACE_MODEL", "buffalo_s")

app = FastAPI(title="sahakar-face-svc", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Face:
    def __init__(self, embedding: np.ndarray, kps: Optional[np.ndarray], area: float):
        self.embedding = embedding
        self.kps = kps
        self.area = area


class Backend:
    name = "none"

    def faces(self, img_bgr: np.ndarray) -> List[Face]:
        raise NotImplementedError


class InsightFaceBackend(Backend):
    def __init__(self) -> None:
        from insightface.app import FaceAnalysis

        self.app = FaceAnalysis(name=MODEL_NAME, providers=["CPUExecutionProvider"], allowed_modules=["detection", "recognition"])
        self.app.prepare(ctx_id=-1, det_size=(640, 640))
        self.name = f"insightface/{MODEL_NAME}"

    def faces(self, img_bgr):
        out = []
        for f in self.app.get(img_bgr):
            x1, y1, x2, y2 = f.bbox
            out.append(Face(np.asarray(f.normed_embedding, dtype=np.float32), np.asarray(f.kps), float((x2 - x1) * (y2 - y1))))
        return out


class FaceRecognitionBackend(Backend):
    """dlib 128-d embeddings, zero-padded to 512 and re-normalised so the API contract holds."""

    def __init__(self) -> None:
        import face_recognition

        self.fr = face_recognition
        self.name = "face_recognition/dlib-128"

    def faces(self, img_bgr):
        rgb = img_bgr[:, :, ::-1]
        boxes = self.fr.face_locations(rgb, model="hog")
        encs = self.fr.face_encodings(rgb, boxes)
        lms = self.fr.face_landmarks(rgb, boxes, model="small")
        out = []
        for (top, right, bottom, left), e, lm in zip(boxes, encs, lms):
            v = np.zeros(512, dtype=np.float32)
            v[:128] = e
            v /= np.linalg.norm(v) or 1.0
            kps = None
            if lm.get("left_eye") and lm.get("right_eye") and lm.get("nose_tip"):
                le = np.mean(lm["left_eye"], axis=0)
                re = np.mean(lm["right_eye"], axis=0)
                nose = np.mean(lm["nose_tip"], axis=0)
                kps = np.array([le, re, nose, nose, nose])
            out.append(Face(v, kps, float((right - left) * (bottom - top))))
        return out


def load_backend() -> Backend:
    try:
        return InsightFaceBackend()
    except Exception as e:  # noqa: BLE001
        print(f"[face-svc] insightface unavailable ({e}); trying face_recognition")
    try:
        return FaceRecognitionBackend()
    except Exception as e:  # noqa: BLE001
        print(f"[face-svc] face_recognition unavailable ({e})")
    return Backend()


BACKEND = load_backend()


def decode(data: bytes) -> np.ndarray:
    import cv2

    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Not a valid image")
    return img


def yaw_proxy(kps: Optional[np.ndarray]) -> Optional[float]:
    """Horizontal nose offset from the eye midpoint, normalised by eye distance (~0 when facing the camera)."""
    if kps is None:
        return None
    le, re, nose = kps[0], kps[1], kps[2]
    d = float(np.linalg.norm(re - le)) or 1.0
    return float((nose[0] - (le[0] + re[0]) / 2) / d)


def main_face(img: np.ndarray) -> Face:
    if BACKEND.name == "none":
        raise HTTPException(status_code=503, detail="No face backend installed")
    faces = BACKEND.faces(img)
    if not faces:
        raise ValueError("NO_FACE")
    faces.sort(key=lambda f: f.area, reverse=True)
    # Two similarly-sized faces means we cannot tell whose attendance this is.
    if len(faces) > 1 and faces[1].area > 0.5 * faces[0].area:
        raise ValueError("MULTIPLE_FACES")
    return faces[0]


@app.get("/health")
def health():
    return {"ok": BACKEND.name != "none", "model": BACKEND.name}


@app.post("/enroll")
async def enroll(images: List[UploadFile] = File(...)):
    embs = []
    for up in images[:3]:
        try:
            embs.append(main_face(decode(await up.read())).embedding)
        except ValueError as e:
            return {"error": str(e)}
    mean = np.mean(np.stack(embs), axis=0)
    mean /= np.linalg.norm(mean) or 1.0
    return {"embedding": [round(float(x), 6) for x in mean]}


@app.post("/identify")
async def identify(images: List[UploadFile] = File(...), candidates: str = Form(...), threshold: float = Form(0.6), liveness: bool = Form(False)):
    try:
        cands = json.loads(candidates)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="candidates must be JSON")
    if not cands:
        return {"match": None, "similarity": 0.0, "live": None}
    faces = []
    for up in images[:3]:
        try:
            faces.append(main_face(decode(await up.read())))
        except ValueError as e:
            if str(e) == "MULTIPLE_FACES":
                return {"match": None, "error": "MULTIPLE_FACES", "live": None}
    if not faces:
        return {"match": None, "error": "NO_FACE", "live": None}

    live = None
    if liveness and len(faces) >= 3:
        yaws = [y for y in (yaw_proxy(f.kps) for f in faces) if y is not None]
        live = len(yaws) >= 3 and (max(yaws) - min(yaws)) > LIVENESS_DELTA
        if not live:
            return {"match": None, "live": False, "similarity": 0.0}

    probe = np.mean(np.stack([f.embedding for f in faces]), axis=0)
    probe /= np.linalg.norm(probe) or 1.0
    ids = [c["traineeId"] for c in cands]
    mat = np.asarray([c["embedding"] for c in cands], dtype=np.float32)
    mat /= np.linalg.norm(mat, axis=1, keepdims=True) + 1e-9
    sims = mat @ probe
    i = int(np.argmax(sims))
    sim = float(sims[i])
    if sim < threshold:
        return {"match": None, "similarity": round(sim, 4), "live": live}
    return {"traineeId": ids[i], "similarity": round(sim, 4), "live": live}
