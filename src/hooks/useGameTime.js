// src/hooks/useGameTime.js
import { useEffect, useState } from "react";

const ORIGIN_HOUR = 15;      // 15:00 reali = 00:00 game
const TICK_MS = 30_000;     // 1 minuto game ogni 30 secondi

function getInitialGameTime() {
    const now = new Date();

    const realMinutes = now.getHours() * 60 + now.getMinutes();
    let deltaMinutes = realMinutes - ORIGIN_HOUR * 60;

    if (deltaMinutes < 0) {
        deltaMinutes += 24 * 60;
    }

    // tempo dimezzato
    const gameMinutes = (deltaMinutes * 2) % (24 * 60);

    return {
        h: Math.floor(gameMinutes / 60),
        m: gameMinutes % 60,
    };
}

export function useGameTime() {
    const [time, setTime] = useState(getInitialGameTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime((prev) => {
                let m = prev.m + 1;
                let h = prev.h;

                if (m >= 60) {
                    m = 0;
                    h = (h + 1) % 24;
                }

                return { h, m };
            });
        }, TICK_MS);

        return () => clearInterval(interval);
    }, []);

    return `${String(time.h).padStart(2, "0")}:${String(time.m).padStart(2, "0")}`;
}
