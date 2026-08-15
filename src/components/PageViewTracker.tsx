"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const send = () => {
      const body = JSON.stringify({ path: pathname });
      try {
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon("/api/analytics", blob);
          return;
        }
      } catch {
        /* fallthrough */
      }
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(send, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(send, 300);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
