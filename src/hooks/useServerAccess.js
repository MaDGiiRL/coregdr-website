// src/hooks/useServerAccess.js
import { useEffect, useState } from "react";

export function useServerAccess({ enabled }) {
  const [map, setMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    let alive = true; // evita setState su component unmounted
    setLoading(true);
    setError(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    fetch(`${API_URL}/api/access`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore fetch server-access");
        return res.json();
      })
      .then((data) => {
        if (!alive) return;

        const m = new Map();

        data.forEach((r) => {
          const { discordId, userId, lastServerJoinAt, hoursPlayed } = r;

          if (!m.has(discordId)) {
            m.set(discordId, []);
          }

          // Ogni elemento della lista è una Map<userId, { lastServerJoinAt, hoursPlayed }>
          const userMap = new Map();
          userMap.set(userId, {
            lastServerJoinAt: lastServerJoinAt ?? null,
            hoursPlayed: hoursPlayed ?? 0,
          });

          m.get(discordId).push(userMap);
        });

        setMap(m);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("Errore fetch server-access:", err);
        setMap(new Map());
        setError(err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [enabled]);

  return { accessMap: map, loading, error };
}
