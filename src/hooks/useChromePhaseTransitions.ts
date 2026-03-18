import { useCallback, useEffect, useRef, useState } from "react";

import {
  CHROME_ENTER_DURATION_MS,
  CHROME_EXIT_DURATION_MS,
  isChromeInteractive,
  isChromeVisible,
  type ChromeMotionPhase,
} from "../lib/chromeMotion";

interface ChromePhaseResult {
  chromeInteractive: boolean;
  chromeMotionPhase: ChromeMotionPhase;
  chromeVisible: boolean;
}

/**
 * Manages the four-phase chrome motion state machine (hidden → entering → visible → exiting → hidden).
 * Phase transitions are driven by `shouldShow` and respect reduced motion preferences.
 */
export function useChromePhaseTransitions(
  shouldShow: boolean,
  prefersReducedMotion: boolean,
): ChromePhaseResult {
  const [chromeMotionPhase, setChromeMotionPhase] = useState<ChromeMotionPhase>(() =>
    shouldShow ? "visible" : "hidden",
  );
  const chromePhaseTimerRef = useRef<number | null>(null);

  const clearChromePhaseTimer = useCallback(() => {
    if (chromePhaseTimerRef.current === null) {
      return;
    }

    window.clearTimeout(chromePhaseTimerRef.current);
    chromePhaseTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearChromePhaseTimer();
    };
  }, [clearChromePhaseTimer]);

  // Handle exit transitions
  useEffect(() => {
    if (prefersReducedMotion) {
      const nextPhase = shouldShow ? "visible" : "hidden";

      clearChromePhaseTimer();

      if (chromeMotionPhase !== nextPhase) {
        setChromeMotionPhase(nextPhase);
      }

      return;
    }

    if (shouldShow || chromeMotionPhase === "hidden" || chromeMotionPhase === "exiting") {
      return;
    }

    clearChromePhaseTimer();
    chromePhaseTimerRef.current = window.setTimeout(() => {
      chromePhaseTimerRef.current = null;
      setChromeMotionPhase("hidden");
    }, CHROME_EXIT_DURATION_MS);
    setChromeMotionPhase("exiting");
  }, [chromeMotionPhase, clearChromePhaseTimer, prefersReducedMotion, shouldShow]);

  // Handle enter transitions
  useEffect(() => {
    if (prefersReducedMotion || !shouldShow || chromeMotionPhase !== "hidden") {
      return;
    }

    clearChromePhaseTimer();
    chromePhaseTimerRef.current = window.setTimeout(() => {
      chromePhaseTimerRef.current = null;
      setChromeMotionPhase("visible");
    }, CHROME_ENTER_DURATION_MS);
    setChromeMotionPhase("entering");
  }, [chromeMotionPhase, clearChromePhaseTimer, prefersReducedMotion, shouldShow]);

  return {
    chromeInteractive: isChromeInteractive(chromeMotionPhase),
    chromeMotionPhase,
    chromeVisible: isChromeVisible(chromeMotionPhase),
  };
}
