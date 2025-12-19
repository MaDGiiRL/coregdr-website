// src/hooks/useServerAccess.js
import { useEffect, useState } from "react";

export function useServerPGs({ enabled }) {
  const [map, setMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    setLoading(true);
    setError(null);

    const API_URL = import.meta.env.VITE_API_URL || "";

    fetch(`${API_URL}/api/pgs`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore fetch pgs");
        return res.json();
      })
      .then((data) => {
        if (!alive) return;

        const m = new Map();

        data.forEach(({ discord_id, data: characters }) => {
          const pgList = [];

          characters.forEach((pg) => {
            const {
              identifier,
              firstname,
              lastname,
              job,
              jobGrade,
              job2,
              job2Grade,
              lastServerJoinAt,
              hoursPlayed,
            } = pg;

            // Manteniamo la struttura Map<identifier, dati PG>
            const pgMap = new Map();
            pgMap.set(identifier, {
              firstname,
              lastname,
              job,
              jobGrade,
              job2,
              job2Grade,
              lastServerJoinAt: lastServerJoinAt ?? null,
              hoursPlayed: hoursPlayed ?? 0,
            });

            pgList.push(pgMap);
          });

          m.set(discord_id, pgList);
        });

        setMap(m);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("Errore fetch server-pgs:", err);
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

  return { pgMap: map, loading, error };
}
