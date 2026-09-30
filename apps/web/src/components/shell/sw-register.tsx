"use client";
import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let devOptIn = false;
    try {
      devOptIn = !!localStorage.getItem("sw-dev");
    } catch {
      /* storage blocked */
    }
    if (process.env.NODE_ENV !== "production" && !devOptIn) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
