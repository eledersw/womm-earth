"use client";
// The demo plays muted on a loop, with controls; it stays on its poster when the
// visitor prefers reduced motion.
import { useEffect, useRef } from "react";

export function LandingVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Play only while on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.35 });
    io.observe(video);
    return () => io.disconnect();
  }, []);
  return (
    <video ref={ref} src={src} poster={poster} aria-label={label} muted loop playsInline controls preload="metadata"
      className="block aspect-video w-full rounded-[calc(var(--radius-panel)-6px)] bg-space" />
  );
}
