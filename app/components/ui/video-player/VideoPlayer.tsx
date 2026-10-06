"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FullscreenIcon, PauseIcon, PlayIcon, VolumeIcon, VolumeMutedIcon } from "@/app/components/icons";

type VideoPlayerProps = {
  src: string;
  /** Accessible name of the video */
  label: string;
  poster?: string;
  /** Layout only: size, radius, aspect ratio */
  className?: string;
};

const IDLE_MS = 2200;

const formatTime = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const controlButton =
  "grid size-44 shrink-0 place-items-center rounded-8 text-white transition-colors duration-200 ease-out-expo hover:bg-white/12 [&_svg]:size-20";

/** Clean video player: big play button, glass control bar that hides while playing. */
export default function VideoPlayer({ src, label, poster, className }: VideoPlayerProps) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [awake, setAwake] = useState(true);

  const wake = useCallback(() => {
    setAwake(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setAwake(false), IDLE_MS);
  }, []);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const toggleMute = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.current?.requestFullscreen?.();
  };

  const progress = duration ? (time / duration) * 100 : 0;
  const showControls = !playing || awake;

  return (
    <div
      ref={box}
      onPointerMove={wake}
      onPointerLeave={() => playing && setAwake(false)}
      onFocus={wake}
      className={`group relative isolate overflow-hidden bg-surface-deep ${className ?? ""}`}
    >
      <video
        ref={video}
        src={`${src}#t=0.1`}
        poster={poster}
        preload="metadata"
        playsInline
        aria-label={label}
        onClick={toggle}
        onPlay={() => {
          setPlaying(true);
          wake();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="size-full cursor-pointer object-cover"
      />

      {/* Soft scrim so the controls stay readable on any frame */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 -z-1 h-120 bg-linear-to-t from-black/60 to-transparent motion-safe:transition-opacity motion-safe:duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
      />

      {/* Big play button while paused */}
      <button
        type="button"
        onClick={toggle}
        aria-label={`Play ${label}`}
        tabIndex={playing ? -1 : 0}
        className={`absolute top-1/2 left-1/2 grid size-50 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-action-primary text-on-action shadow-glow motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out-quint hover:bg-action-primary-bright hover:shadow-glow-strong lg:size-60 [&_svg]:size-24 lg:[&_svg]:size-28 ${playing ? "pointer-events-none scale-90 opacity-0" : "opacity-100"}`}
      >
        <PlayIcon />
      </button>

      {/* Control bar */}
      <div
        className={`glass glass-dense absolute inset-x-12 bottom-12 flex items-center gap-8 rounded-12 px-8 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out-quint lg:inset-x-16 lg:bottom-16 ${showControls ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}
      >
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className={controlButton}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <span className="type-label-14 w-40 shrink-0 text-right font-normal text-white tabular-nums max-sm:hidden">
          {formatTime(time)}
        </span>

        {/* Visual track; the invisible range input on top handles pointer, touch and keyboard seeking */}
        <div className="relative h-44 flex-1">
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 rounded-full bg-white/20">
            <span className="absolute inset-y-0 left-0 rounded-full bg-action-primary" style={{ width: `${progress}%` }} />
          </span>
          <span
            aria-hidden
            className="absolute top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
            style={{ left: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            aria-label="Seek"
            aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
            onChange={(e) => {
              const v = video.current;
              if (v) v.currentTime = Number(e.target.value);
              setTime(Number(e.target.value));
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </div>

        <span className="type-label-14 w-40 shrink-0 font-normal text-white/60 tabular-nums max-sm:hidden">
          {formatTime(duration)}
        </span>

        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className={controlButton}>
          {muted ? <VolumeMutedIcon /> : <VolumeIcon />}
        </button>
        <button type="button" onClick={fullscreen} aria-label="Fullscreen" className={controlButton}>
          <FullscreenIcon />
        </button>
      </div>
    </div>
  );
}
