"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VinylRecordIcon } from "@phosphor-icons/react";
import { useAppModeStore } from "@/lib/stores/appModeStore";
import { cn } from "@/lib/utils/utils";

const RECORD_ROTATION_SECONDS_AT_NORMAL_SPEED = 1.8;
const PLAY_RAMP_MS = 250;
const PAUSE_RAMP_MS = 200;
const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const MIN_ICON_OPACITY = 0.65;
const MAX_ICON_OPACITY = 1;
const MIN_SPEED_EPSILON = 0.0001;

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function MusicToggle() {
  const songsList = useAppModeStore((state) => state.songsList);
  const selectedGarment = useAppModeStore((state) => state.selectedGarment);
  const setCurrentSong = useAppModeStore((state) => state.setCurrentSong);
  const setIsMusicPlaying = useAppModeStore((state) => state.setIsMusicPlaying);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRampingDown, setIsRampingDown] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<number[]>([]);
  const currentTrackIndexRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const rampTokenRef = useRef(0);
  const rampFrameRef = useRef<number | null>(null);

  const spinFrameRef = useRef<number | null>(null);
  const spinLastTimeRef = useRef<number | null>(null);
  const visualSpeedRef = useRef(0);
  const targetSpeedRef = useRef(0);
  const angleRef = useRef(0);
  const recordRef = useRef<HTMLSpanElement | null>(null);
  const runSpinFrameRef = useRef<(now: number) => void>(() => undefined);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const cancelRamp = useCallback(() => {
    rampTokenRef.current += 1;
    if (rampFrameRef.current !== null) {
      cancelAnimationFrame(rampFrameRef.current);
      rampFrameRef.current = null;
    }
  }, []);

  const applyRecordVisuals = useCallback((angle: number, speed: number) => {
    const recordEl = recordRef.current;
    if (!recordEl) return;
    const normalSpeed = 1 / RECORD_ROTATION_SECONDS_AT_NORMAL_SPEED;
    const normalizedSpeed = Math.max(0, Math.min(1, speed / normalSpeed));
    const opacity = MIN_ICON_OPACITY + (MAX_ICON_OPACITY - MIN_ICON_OPACITY) * normalizedSpeed;
    recordEl.style.transform = `rotate(${angle}deg)`;
    recordEl.style.opacity = opacity.toFixed(3);
  }, []);

  const runSpinFrame = useCallback((now: number) => {
    const last = spinLastTimeRef.current ?? now;
    spinLastTimeRef.current = now;

    const dtSeconds = Math.max(0, (now - last) / 1000);
    const normalSpeed = 1 / RECORD_ROTATION_SECONDS_AT_NORMAL_SPEED;
    const targetSpeed = targetSpeedRef.current;
    const currentSpeed = visualSpeedRef.current;
    const rampMs = targetSpeed > currentSpeed ? PLAY_RAMP_MS : PAUSE_RAMP_MS;
    const maxDelta = (normalSpeed / rampMs) * (dtSeconds * 1000);
    const speedDelta = targetSpeed - currentSpeed;

    let nextSpeed = currentSpeed;
    if (Math.abs(speedDelta) <= maxDelta) {
      nextSpeed = targetSpeed;
    } else {
      nextSpeed = currentSpeed + Math.sign(speedDelta) * maxDelta;
    }

    visualSpeedRef.current = Math.max(0, nextSpeed);
    angleRef.current = (angleRef.current + visualSpeedRef.current * dtSeconds * 360) % 360;
    applyRecordVisuals(angleRef.current, visualSpeedRef.current);

    if (targetSpeedRef.current > MIN_SPEED_EPSILON || visualSpeedRef.current > MIN_SPEED_EPSILON) {
      spinFrameRef.current = requestAnimationFrame(runSpinFrameRef.current);
    } else {
      visualSpeedRef.current = 0;
      spinLastTimeRef.current = null;
      spinFrameRef.current = null;
      applyRecordVisuals(angleRef.current, 0);
    }
  }, [applyRecordVisuals]);

  useEffect(() => {
    runSpinFrameRef.current = runSpinFrame;
  }, [runSpinFrame]);

  const startSpinLoop = useCallback(() => {
    if (spinFrameRef.current !== null) return;
    spinFrameRef.current = requestAnimationFrame(runSpinFrameRef.current);
  }, []);

  const rampVolume = useCallback(async (
    audio: HTMLAudioElement,
    fromVolume: number,
    toVolume: number,
    durationMs: number,
  ): Promise<boolean> => {
    const token = rampTokenRef.current + 1;
    rampTokenRef.current = token;

    if (rampFrameRef.current !== null) {
      cancelAnimationFrame(rampFrameRef.current);
      rampFrameRef.current = null;
    }

    return new Promise((resolve) => {
      const start = performance.now();

      const step = (now: number) => {
        if (rampTokenRef.current !== token) {
          resolve(false);
          return;
        }

        const progress = Math.min((now - start) / durationMs, 1);
        const volume = fromVolume + (toVolume - fromVolume) * progress;
        audio.volume = Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume));

        if (progress < 1) {
          rampFrameRef.current = requestAnimationFrame(step);
          return;
        }

        rampFrameRef.current = null;
        resolve(true);
      };

      rampFrameRef.current = requestAnimationFrame(step);
    });
  }, []);

  const pickNextTrackIndex = useCallback((lastPlayedIndex: number | null): number | null => {
    const total = songsList.length;
    if (total === 0) return null;

    if (queueRef.current.length === 0) {
      queueRef.current = shuffleIndices(total);

      // Avoid immediate repeat when starting a new cycle.
      if (total > 1 && lastPlayedIndex !== null) {
        const lastQueuePos = queueRef.current.length - 1;
        if (queueRef.current[lastQueuePos] === lastPlayedIndex) {
          const swapPos = Math.floor(Math.random() * lastQueuePos);
          [queueRef.current[lastQueuePos], queueRef.current[swapPos]] = [queueRef.current[swapPos], queueRef.current[lastQueuePos]];
        }
      }
    }

    return queueRef.current.pop() ?? null;
  }, [songsList.length]);

  const playTrack = useCallback(async (trackIndex: number, resetTime: boolean) => {
    const audio = audioRef.current;
    const song = songsList[trackIndex];
    if (!audio || !song?.fileUrl) return;

    cancelRamp();
    setIsRampingDown(false);

    const currentUrl = audio.src;
    if (currentUrl !== song.fileUrl) {
      audio.src = song.fileUrl;
      audio.load();
    }
    if (resetTime) {
      audio.currentTime = 0;
    }

    audio.volume = MIN_VOLUME;

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentSong(null);
      setIsMusicPlaying(false);
      return;
    }

    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsMusicPlaying(true);
    currentTrackIndexRef.current = trackIndex;
    setCurrentSong(song);
    await rampVolume(audio, MIN_VOLUME, MAX_VOLUME, PLAY_RAMP_MS);
  }, [cancelRamp, rampVolume, setCurrentSong, setIsMusicPlaying, songsList]);

  const playNextTrack = useCallback(async () => {
    const nextIndex = pickNextTrackIndex(currentTrackIndexRef.current);
    if (nextIndex === null) return;
    await playTrack(nextIndex, true);
  }, [pickNextTrackIndex, playTrack]);

  const pauseWithRamp = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;

    cancelRamp();
    setIsRampingDown(true);
    const ok = await rampVolume(audio, audio.volume, MIN_VOLUME, PAUSE_RAMP_MS);

    if (!ok) return;

    audio.pause();
    audio.volume = MAX_VOLUME;
    setIsRampingDown(false);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsMusicPlaying(false);
  }, [cancelRamp, rampVolume, setIsMusicPlaying]);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || songsList.length === 0) return;

    if (isPlayingRef.current && !audio.paused) {
      await pauseWithRamp();
      return;
    }

    if (currentTrackIndexRef.current !== null && audio.src) {
      await playTrack(currentTrackIndexRef.current, false);
      return;
    }

    await playNextTrack();
  }, [pauseWithRamp, playNextTrack, playTrack, songsList.length]);

  useEffect(() => {
    targetSpeedRef.current = (isPlaying || isRampingDown) ? 1 / RECORD_ROTATION_SECONDS_AT_NORMAL_SPEED : 0;
    startSpinLoop();
  }, [isPlaying, isRampingDown, startSpinLoop]);

  useEffect(() => {
    applyRecordVisuals(angleRef.current, visualSpeedRef.current);
  }, [applyRecordVisuals]);

  useEffect(() => {
    if (songsList.length === 0) {
      setCurrentSong(null);
      setIsMusicPlaying(false);
    }
  }, [setCurrentSong, setIsMusicPlaying, songsList.length]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleEnded = async () => {
      if (!isPlayingRef.current) return;
      await playNextTrack();
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      cancelRamp();
      if (spinFrameRef.current !== null) {
        cancelAnimationFrame(spinFrameRef.current);
        spinFrameRef.current = null;
      }
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
      setCurrentSong(null);
      setIsMusicPlaying(false);
    };
  }, [applyRecordVisuals, cancelRamp, playNextTrack, setCurrentSong, setIsMusicPlaying]);

  if (songsList.length === 0) return null;

  return (
    <div
      className={cn(
        "safe-area-content fixed right-4 md:right-6 z-50 flex items-center gap-2 rounded-full py-2",
        selectedGarment ? "bottom-56 md:bottom-20" : "bottom-72 md:bottom-36",
      )}
    >
      <button
        onClick={togglePlayback}
        className="pointer-events-auto bg-transparent border-0 p-0 m-0 text-base text-foreground leading-none"
        aria-label={isPlaying ? "Pause music" : "Play music"}
        aria-pressed={isPlaying}
      >
        <span className="inline-flex translate-x-1 translate-y-1">
          <span ref={recordRef} className="inline-flex will-change-transform will-change-opacity">
            <VinylRecordIcon className="cursor-pointer rounded-full h-6 w-6 p-1" />
          </span>
        </span>
      </button>
    </div>
  );
}
