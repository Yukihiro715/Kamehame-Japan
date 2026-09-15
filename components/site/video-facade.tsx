"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import type { Experience } from "@/lib/catalog";

type Video = NonNullable<Experience["video"]>;

/** Poster + play button; the player itself loads only on click, and never
 *  autoplays with sound. Keeps the source's aspect ratio and caps portrait
 *  video to a sensible column instead of stretching it across a desktop. */
export function VideoFacade({ video, title }: { video: Video; title: string }) {
  const [playing, setPlaying] = useState(false);
  const portrait = video.aspect === "9/16";

  return (
    <div className={`video-frame ${portrait ? "portrait" : ""}`} style={{ aspectRatio: video.aspect }}>
      {!playing ? (
        <button type="button" className="video-poster" onClick={() => setPlaying(true)} aria-label={`Play: ${title}`}>
          <img src={video.poster} alt="" loading="lazy" />
          <span className="video-play"><Play size={26} /></span>
        </button>
      ) : video.kind === "mp4" ? (
        <video src={video.src} poster={video.poster} controls autoPlay playsInline preload="none" />
      ) : (
        <iframe
          src={video.kind === "youtube"
            ? `https://www.youtube-nocookie.com/embed/${video.src}?autoplay=1&rel=0&modestbranding=1`
            : `https://player.vimeo.com/video/${video.src}?autoplay=1&dnt=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
