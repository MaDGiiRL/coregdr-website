import { useEffect, useState } from "react";

export function useServerStatus() {
  const [status, setStatus] = useState({
    online: false,
    players: 0,
    maxPlayers: 0,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    fetch("/api/server-status")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setStatus({
          online: !!data.online,
          players: data.players ?? 0,
          maxPlayers: data.maxPlayers ?? 0,
          loading: false,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setStatus((s) => ({ ...s, loading: false }));
      });

    return () => {
      mounted = false;
    };
  }, []);

  return status;
}
