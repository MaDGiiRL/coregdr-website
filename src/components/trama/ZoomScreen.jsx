import { useEffect, useRef } from "react";

export default function ZoomScreen({ act }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, [act?.src]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover bg-black"
      src={act.src}
      poster={act.poster}
      controls
      autoPlay
      muted={false}
      playsInline
      preload="metadata"
    />
  );
}
