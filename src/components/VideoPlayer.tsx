"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, ChevronDown
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);

  const speeds = [0.25, 0.5, 1, 1.5, 2, 4, 8, 16, 32];

  // Formater le temps
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Gérer le timeupdate
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  }, []);

  // Gérer le loadedmetadata
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // Gérer le buffering
  const handleProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBufferProgress((bufferedEnd / videoRef.current.duration) * 100);
    }
  }, []);

  // Lecture / Pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  // Gérer le clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          if (videoRef.current) videoRef.current.currentTime -= 5;
          break;
        case "ArrowRight":
          if (videoRef.current) videoRef.current.currentTime += 5;
          break;
        case "KeyM":
          toggleMute();
          break;
        case "KeyF":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  // Mute / Unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  // Playback speed
  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
    setShowSpeedMenu(false);
  };

  // Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative group rounded-2xl overflow-hidden bg-black shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-contain bg-black cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onProgress={handleProgress}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        playsInline
      />

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Play button overlay (when paused) */}
      {!isPlaying && !isBuffering && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-blue-500/80 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 group/progress hover:h-2.5 transition-all"
          onClick={handleSeek}
        >
          {/* Buffer */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-white/30"
            style={{ width: `${bufferProgress}%` }}
          />
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>

          {/* Skip back 10s */}
          <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Skip forward 10s */}
          <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Volume */}
          <div
            className="relative flex items-center gap-1"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            {showVolumeSlider && (
              <div className="flex items-center gap-1 animate-in slide-in-from-left-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 appearance-none bg-white/20 rounded-full cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            )}
          </div>

          {/* Time */}
          <span className="text-xs text-white/70 font-mono min-w-[100px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Title */}
          {title && (
            <span className="text-xs text-white/50 hidden md:block truncate max-w-[200px]">
              {title}
            </span>
          )}

          {/* Speed control */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-all"
            >
              {playbackRate}x
              <ChevronDown className={`w-3 h-3 transition-transform ${showSpeedMenu ? "rotate-180" : ""}`} />
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 p-1.5 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[90px]">
                <div className="grid grid-cols-3 gap-1">
                  {speeds.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        playbackRate === speed
                          ? "bg-blue-500/30 text-blue-400 border border-blue-500/30"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
                <div className="mt-1 pt-1.5 border-t border-white/10 text-[10px] text-gray-500 text-center">
                  Espace: Pause • ← →: 5s • F: Plein écran
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}