// src/hooks/useUiLogger.js
import { useCallback, useEffect, useRef } from "react";
import { logEvent } from "../lib/logger";
import { useAuth } from "../context/AuthContext";

export function useUiLogger(scope = "ui") {
  const { profile } = useAuth();
  const lastRef = useRef(new Map());

  // anti-spam (filtri/search): stesso evento+key max 1 ogni N ms
  const throttle = useCallback((key, ms = 1200) => {
    const now = Date.now();
    const last = lastRef.current.get(key) || 0;
    if (now - last < ms) return false;
    lastRef.current.set(key, now);
    return true;
  }, []);

  const uiLog = useCallback(
    (type, message, meta = {}) => {
      logEvent(type, message, {
        scope,
        actor_user_id: profile?.id ?? null,
        actor_discord_id: profile?.discord_id ?? null,
        ...meta,
      });
    },
    [profile?.id, profile?.discord_id, scope]
  );

  // page view automatico
  useEffect(() => {
    const path = window.location?.pathname || "";
    uiLog("PAGE_VIEW", `View: ${path}`, { path });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { uiLog, throttle };
}
