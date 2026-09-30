"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrImage({ value, size = 280, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: "M" }).then(setSrc).catch(() => {});
  }, [value, size]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={size} height={size} alt={label} className="rounded-lg bg-white p-2" />
  ) : (
    <div style={{ width: size, height: size }} className="animate-pulse rounded-lg bg-gray-200" />
  );
}
