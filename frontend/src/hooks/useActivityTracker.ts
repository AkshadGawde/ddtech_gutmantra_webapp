import { useEffect, useRef, useCallback } from "react";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes of inactivity before logout
const CHECK_INTERVAL_MS = 30_000;      // poll every 30 seconds for tighter accuracy

interface UseActivityTrackerOptions {
  enabled: boolean;
  onInactive: () => void;
}

/**
 * Tracks user activity (mouse, keyboard, touch, scroll) in the browser.
 * Calls onInactive after 10 minutes of no interaction.
 *
 * IMPORTANT: lastActivityRef is reset to Date.now() each time tracking
 * activates (i.e. when the user logs in). Without this, a tab that was
 * open for several minutes before login would immediately count those
 * pre-login minutes as inactivity, causing premature logout.
 */
export function useActivityTracker({ enabled, onInactive }: UseActivityTrackerOptions) {
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Reset clock to NOW whenever tracking starts (covers login and page-load-while-logged-in).
    lastActivityRef.current = Date.now();

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
