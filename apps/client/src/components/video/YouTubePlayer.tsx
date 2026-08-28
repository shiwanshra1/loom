import { useEffect, useRef } from 'react';

// Minimal slice of the YouTube IFrame Player API we actually use — the full
// typings live in a separate @types package we don't depend on, and this is
// the only file that needs them.
interface YouTubePlayerInstance {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface YouTubePlayerOptions {
  videoId: string;
  playerVars?: { start?: number };
  events?: {
    onStateChange?: (event: { data: number }) => void;
  };
}

interface YouTubeNamespace {
  Player: new (container: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const REPORT_INTERVAL_MS = 15000;

let apiLoadPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT) {
    return Promise.resolve(window.YT);
  }
  if (apiLoadPromise) {
    return apiLoadPromise;
  }

  apiLoadPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return apiLoadPromise;
}

interface YouTubePlayerProps {
  videoId: string;
  initialPositionSeconds?: number;
  onProgress: (positionSeconds: number, durationSeconds: number) => void;
}

export function YouTubePlayer({
  videoId,
  initialPositionSeconds = 0,
  onProgress,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const intervalRef = useRef<number | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    let cancelled = false;

    function reportNow() {
      const player = playerRef.current;
      if (!player) return;
      const duration = player.getDuration();
      if (duration > 0) {
        onProgressRef.current(player.getCurrentTime(), duration);
      }
    }

    void loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: { start: Math.floor(initialPositionSeconds) },
        events: {
          onStateChange: (event) => {
            if (event.data === YT_PLAYING) {
              if (intervalRef.current) window.clearInterval(intervalRef.current);
              intervalRef.current = window.setInterval(reportNow, REPORT_INTERVAL_MS);
            } else {
              if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              if (event.data === YT_PAUSED) {
                reportNow();
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      reportNow();
      playerRef.current?.destroy();
    };
    // Re-create the player only when the video itself changes — onProgress is
    // read through a ref so it doesn't need to be a dependency.
  }, [videoId, initialPositionSeconds]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
