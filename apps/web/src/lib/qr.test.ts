import { describe, expect, it } from "vitest";
import { makeSessionToken, QR_WINDOW_MS, traineeQr, verifySessionToken, verifyTraineeQr } from "./qr";

describe("rotating session QR", () => {
  const t0 = 1_790_000_000_000;
  it("accepts current window", () => {
    const { token } = makeSessionToken("s1", "secret", t0);
    expect(verifySessionToken(token, "secret", t0).ok).toBe(true);
  });
  it("accepts previous window only", () => {
    const { token } = makeSessionToken("s1", "secret", t0);
    expect(verifySessionToken(token, "secret", t0 + QR_WINDOW_MS).ok).toBe(true);
    const r = verifySessionToken(token, "secret", t0 + 2 * QR_WINDOW_MS);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("EXPIRED");
  });
  it("rejects wrong secret or tampering", () => {
    const { token } = makeSessionToken("s1", "secret", t0);
    expect(verifySessionToken(token, "other", t0).reason).toBe("BAD_SIGNATURE");
    expect(verifySessionToken(token.replace("s1", "s2"), "secret", t0).ok).toBe(false);
    expect(verifySessionToken("garbage", "secret", t0).reason).toBe("MALFORMED");
  });
  it("trainee QR round trips and rejects forgeries", () => {
    expect(verifyTraineeQr(traineeQr("u1"))).toBe("u1");
    expect(verifyTraineeQr("TR:u1:fake")).toBeNull();
  });
});
