import { useEffect, useRef, useCallback } from "react";

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes — mirrors EC2 auto-stop threshold
const CHECK_INTERVAL_MS = 60_000;      // check every minute

interface UseActivityTrackerOptions {
  enabled: boolean;
  onInactive: () => void;
}

/**
 * Tracks user activity (mouse, keyboard, touch, scroll) in the browser.
 * Calls onInactive after 15 minutes of no interaction — matching the EC2
 * auto-stop threshold so the client session and server state stay in sync.
 */
export function useActivityTracker({ enabled, onInactive }: UseActivityTrackerOptions) {
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll", "pointerdown"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_MS) {
        onInactive();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearInterval(intervalId);
    };
  }, [enabled, onInactive, resetTimer]);
}
