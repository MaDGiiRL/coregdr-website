export const buildRulesMotion = (reduce) => {
    const fadeUp = {
        hidden: { opacity: 0, y: reduce ? 0 : 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
        exit: {
            opacity: 0,
            y: reduce ? 0 : -12,
            transition: { duration: 0.2, ease: "easeIn" },
        },
    };

    const fadeIn = {
        hidden: { opacity: 0, scale: reduce ? 1 : 0.98 },
        show: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: "easeOut" },
        },
        exit: {
            opacity: 0,
            scale: reduce ? 1 : 0.98,
            transition: { duration: 0.2, ease: "easeIn" },
        },
    };

    const stagger = (delay = 0.05, step = 0.06) => ({
        hidden: {},
        show: { transition: { delayChildren: delay, staggerChildren: step } },
    });

    return { fadeUp, fadeIn, stagger };
};
