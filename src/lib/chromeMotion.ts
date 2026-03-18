import type { TargetAndTransition, Transition } from "motion/react";

export type ChromeMotionPhase = "hidden" | "entering" | "visible" | "exiting";

interface ChromeOffset {
  x?: number;
  y?: number;
  scale?: number;
}

/**
 * Phase timer durations control the state-machine tick speed
 * (entering → visible, exiting → hidden). These must stay fast
 * so interactive gating (chromeReady) doesn't lag behind.
 */
export const CHROME_ENTER_DURATION_MS = 220;
export const CHROME_EXIT_DURATION_MS = 200;

/**
 * Visual animation durations used by the motion library.
 * Deliberately slower than the phase timers for a more
 * deliberate, polished feel.
 */
const CHROME_ENTER_ANIMATION_S = 0.42;
const CHROME_EXIT_ANIMATION_S = 0.34;

/** Smooth ease-out for entering elements. */
export const CHROME_ENTER_EASE = [0.22, 1, 0.36, 1] as const;

/** Ease-in for exiting elements. */
export const CHROME_EXIT_EASE = [0.55, 0, 1, 0.45] as const;

/** Creates motion variants for a chrome element that slides between hidden and visible states. */
export function createChromeVariants(
  hiddenOffset: ChromeOffset = {},
  visibleOffset: ChromeOffset = {},
): Record<ChromeMotionPhase, TargetAndTransition> {
  const hiddenState = {
    opacity: 0,
    x: hiddenOffset.x ?? 0,
    y: hiddenOffset.y ?? 0,
    scale: hiddenOffset.scale ?? 1,
  };
  const visibleState = {
    opacity: 1,
    x: visibleOffset.x ?? 0,
    y: visibleOffset.y ?? 0,
    scale: visibleOffset.scale ?? 1,
  };

  return {
    hidden: hiddenState,
    entering: visibleState,
    visible: visibleState,
    exiting: hiddenState,
  };
}

/** Returns the visual transition config for a given chrome phase, respecting reduced motion. */
export function getChromeTransition(
  phase: ChromeMotionPhase,
  prefersReducedMotion: boolean,
): Transition {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  if (phase === "hidden" || phase === "exiting") {
    return {
      duration: CHROME_EXIT_ANIMATION_S,
      ease: CHROME_EXIT_EASE,
    };
  }

  return {
    duration: CHROME_ENTER_ANIMATION_S,
    ease: CHROME_ENTER_EASE,
  };
}

/** Returns a staggered chrome transition with a delay offset, useful for multi-part elements like the hotspot. */
export function getStaggeredChromeTransition(
  phase: ChromeMotionPhase,
  prefersReducedMotion: boolean,
  delaySeconds: number,
): Transition {
  const base = getChromeTransition(phase, prefersReducedMotion);

  if (prefersReducedMotion) {
    return base;
  }

  return { ...base, delay: delaySeconds };
}

export function isChromeVisible(phase: ChromeMotionPhase) {
  return phase !== "hidden";
}

export function isChromeInteractive(phase: ChromeMotionPhase) {
  return phase === "visible";
}
