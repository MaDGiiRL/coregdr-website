// src/hooks/useGameTime.js
import { useEffect, useState } from "react";

// CONFIGURAZIONE
const GAME_SPEED = 60; // 1 minuto reale = 1 ora in-game

export function useGameTime() {
    const [time, setTime] = useState({ h: 12, m: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            setTime((prev) => {
                let minutes = prev.m + GAME_SPEED;
                let hours = prev.h;

                if (minutes >= 60) {
                    hours = (hours + Math.floor(minutes / 60)) % 24;
                    minutes = minutes % 60;
                }

                return { h: hours, m: minutes };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatted = `${String(time.h).padStart(2, "0")}:${String(
        time.m
    ).padStart(2, "0")}`;

    return formatted;
}
