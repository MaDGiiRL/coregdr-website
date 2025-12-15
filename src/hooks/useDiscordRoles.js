import { useEffect, useState } from "react";

export function useDiscordRoles(discordIds = [], deps = []) {
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!discordIds.length) return;

    setLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || '';

    fetch(`${API_URL}/api/checkroles?ids=${discordIds.join(",")}`)
      .then(res => res.json())
      .then(data => {
        setRoles(data);
      })
      .catch(err => {
        console.error("Errore fetch ruoli:", err);
        setRoles({});
      })
      .finally(() => setLoading(false));
  }, deps);

  const id = discordIds[0];
  return {
    isAdmin: roles[id]?.isAdmin ?? false,
    isMod: roles[id]?.isMod ?? false,
    isStaff: (roles[id]?.isAdmin || roles[id]?.isMod) ?? false,
    loading,
  };
}