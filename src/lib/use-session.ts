"use client";

import { useEffect, useState } from "react";
import type { SessionPayload } from "./auth";

let shared: SessionPayload | null | undefined = undefined;
let inflight: Promise<SessionPayload | null> | null = null;
const listeners = new Set<(s: SessionPayload | null) => void>();

function notify(s: SessionPayload | null) {
  shared = s;
  listeners.forEach((fn) => fn(s));
}

async function fetchSession(): Promise<SessionPayload | null> {
  if (inflight) return inflight;
  inflight = fetch("/api/auth/me")
    .then((r) => r.json())
    .then((d) => (d.session as SessionPayload) ?? null)
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useSession() {
  const [session, setSession] = useState<SessionPayload | null | undefined>(shared);

  useEffect(() => {
    let mounted = true;
    const onUpdate = (s: SessionPayload | null) => {
      if (mounted) setSession(s);
    };
    listeners.add(onUpdate);

    if (shared !== undefined) {
      setSession(shared);
    } else {
      fetchSession().then((s) => {
        notify(s);
      });
    }

    return () => {
      mounted = false;
      listeners.delete(onUpdate);
    };
  }, []);

  return session;
}

/** بعد از login/logout صدا شود */
export function refreshSession() {
  shared = undefined;
  return fetchSession().then((s) => {
    notify(s);
    return s;
  });
}
