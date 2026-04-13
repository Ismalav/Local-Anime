"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  src: string;
  title?: string;
}

export default function VideoPlayer({ src, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHLS = src.includes(".m3u8");

    if (isHLS) {
      import("hls.js").then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          return () => hls.destroy();
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
        }
      });
    } else {
      video.src = src;
    }
  }, [src]);

  return (
    <div className="w-full bg-black">
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <video
          ref={videoRef}
          controls
          className="absolute inset-0 h-full w-full"
          autoPlay
          playsInline
        />
      </div>
    </div>
  );
}
