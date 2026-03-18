import { useCallback, useEffect, useRef, useState } from "react";

import type { TransitionStep } from "../data/experience";
import { e2eSettings } from "../lib/e2e";
import type { StillLoadStatus } from "../lib/stillPreload";

export type HandoffPhase = "idle" | "arming" | "fading";
export type TransitionSlotName = "previous" | "next" | "jump";
export type StillSlotName = "primary" | "secondary";

const TRANSITION_FADE_DURATION_MS = e2eSettings.transitionFadeDurationMs;
const HANDOFF_ARM_FRAME_COUNT = 2;

/** Returns the still slot not currently used as the base. */
export function getHiddenStillSlot(slot: StillSlotName): StillSlotName {
  return slot === "primary" ? "secondary" : "primary";
}

interface VideoHandoffOptions {
  activeTransition: TransitionStep | null;
  destinationHoldImageSrc: string | null;
  destinationStillStatus: StillLoadStatus;
  getVideoForSlot: (slot: TransitionSlotName) => HTMLVideoElement | null;
  initialHoldImageSrc: string;
  onTransitionFailed: () => void;
  onTransitionSettled: () => void;
}

interface VideoHandoffState {
  activeSlot: TransitionSlotName | null;
  baseStillSlot: StillSlotName;
  handoffPhase: HandoffPhase;
  handoffRequested: boolean;
  overlayStillVisible: boolean;
  primaryStillSrc: string | null;
  secondaryStillSrc: string | null;
  videoFadingOut: boolean;
}

interface VideoHandoffActions {
  handleVideoEnded: (slot: TransitionSlotName) => void;
  handleVideoError: (slot: TransitionSlotName) => void;
  pauseSlot: (slot: TransitionSlotName) => void;
  requestHandoff: () => void;
  requestTransitionSettle: () => void;
  resetForTransition: () => void;
  setActiveSlot: (slot: TransitionSlotName | null) => void;
}

/**
 * Manages the video-to-still handoff pipeline for scene transitions.
 * Coordinates the double-buffered still slots, video fade-out timing,
 * and overlay reveal sequence.
 */
export function useVideoHandoff({
  activeTransition,
  destinationHoldImageSrc,
  destinationStillStatus,
  getVideoForSlot,
  initialHoldImageSrc,
  onTransitionFailed,
  onTransitionSettled,
}: VideoHandoffOptions): VideoHandoffState & VideoHandoffActions {
  const armFrameRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const settleFrameRef = useRef<number | null>(null);
  const activeSlotRef = useRef<TransitionSlotName | null>(null);
  const completionRequestedRef = useRef(false);
  const handoffRequestedRef = useRef(false);
  const handoffPhaseRef = useRef<HandoffPhase>("idle");
  const videoFadingOutRef = useRef(false);
  const primaryStillSrcRef = useRef<string | null>(initialHoldImageSrc);
  const secondaryStillSrcRef = useRef<string | null>(null);
  const baseStillSlotRef = useRef<StillSlotName>("primary");

  const [activeSlot, setActiveSlotState] = useState<TransitionSlotName | null>(null);
  const [handoffRequested, setHandoffRequestedState] = useState(false);
  const [handoffPhase, setHandoffPhaseState] = useState<HandoffPhase>("idle");
  const [primaryStillSrc, setPrimaryStillSrc] = useState<string | null>(initialHoldImageSrc);
  const [secondaryStillSrc, setSecondaryStillSrc] = useState<string | null>(null);
  const [baseStillSlot, setBaseStillSlotState] = useState<StillSlotName>("primary");
  const [overlayStillVisible, setOverlayStillVisible] = useState(false);
  const [videoFadingOut, setVideoFadingOutState] = useState(false);

  const destinationStillReady = destinationStillStatus === "ready";
  const destinationStillResolved =
    destinationStillStatus === "ready" || destinationStillStatus === "error";

  // --- Ref-synced setters ---
  const updatePrimaryStillSrc = useCallback((src: string | null) => {
    if (primaryStillSrcRef.current === src) return;
    primaryStillSrcRef.current = src;
    setPrimaryStillSrc(src);
  }, []);

  const updateSecondaryStillSrc = useCallback((src: string | null) => {
    if (secondaryStillSrcRef.current === src) return;
    secondaryStillSrcRef.current = src;
    setSecondaryStillSrc(src);
  }, []);

  const getStillSrc = useCallback((slot: StillSlotName) =>
    slot === "primary" ? primaryStillSrcRef.current : secondaryStillSrcRef.current, []);

  const setStillSrc = useCallback((slot: StillSlotName, src: string | null) => {
    if (slot === "primary") {
      updatePrimaryStillSrc(src);
    } else {
      updateSecondaryStillSrc(src);
    }
  }, [updatePrimaryStillSrc, updateSecondaryStillSrc]);

  const setBaseStillSlotValue = useCallback((slot: StillSlotName) => {
    if (baseStillSlotRef.current === slot) return;
    baseStillSlotRef.current = slot;
    setBaseStillSlotState(slot);
  }, []);

  const setActiveSlot = useCallback((slot: TransitionSlotName | null) => {
    activeSlotRef.current = slot;
    setActiveSlotState(slot);
  }, []);

  const setHandoffRequestedValue = useCallback((nextValue: boolean) => {
    if (handoffRequestedRef.current === nextValue) return;
    handoffRequestedRef.current = nextValue;
    setHandoffRequestedState(nextValue);
  }, []);

  const setHandoffPhaseValue = useCallback((nextValue: HandoffPhase) => {
    if (handoffPhaseRef.current === nextValue) return;
    handoffPhaseRef.current = nextValue;
    setHandoffPhaseState(nextValue);
  }, []);

  const setVideoFadingOutValue = useCallback((nextValue: boolean) => {
    videoFadingOutRef.current = nextValue;
    setVideoFadingOutState(nextValue);
  }, []);

  // --- Timer management ---
  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current === null) return;
    window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = null;
  }, []);

  const clearArmFrame = useCallback(() => {
    if (armFrameRef.current === null) return;
    window.cancelAnimationFrame(armFrameRef.current);
    armFrameRef.current = null;
  }, []);

  const clearSettleFrame = useCallback(() => {
    if (settleFrameRef.current === null) return;
    window.cancelAnimationFrame(settleFrameRef.current);
    settleFrameRef.current = null;
  }, []);

  // --- Core handoff operations ---
  const pauseSlot = useCallback((slot: TransitionSlotName) => {
    const video = getVideoForSlot(slot);
    if (video) video.pause();
  }, [getVideoForSlot]);

  const requestTransitionSettle = useCallback(() => {
    if (completionRequestedRef.current) return;
    completionRequestedRef.current = true;
    clearArmFrame();
    clearFadeTimer();
    clearSettleFrame();
    onTransitionSettled();
  }, [clearArmFrame, clearFadeTimer, clearSettleFrame, onTransitionSettled]);

  const requestHandoff = useCallback(() => {
    if (completionRequestedRef.current || handoffRequestedRef.current) return;
    if (activeSlotRef.current) {
      pauseSlot(activeSlotRef.current);
    }
    setHandoffRequestedValue(true);
  }, [pauseSlot, setHandoffRequestedValue]);

  const promoteOverlayStill = useCallback(() => {
    const previousBaseSlot = baseStillSlotRef.current;
    const nextBaseSlot = getHiddenStillSlot(previousBaseSlot);

    setBaseStillSlotValue(nextBaseSlot);
    setOverlayStillVisible(false);
    clearSettleFrame();
    settleFrameRef.current = window.requestAnimationFrame(() => {
      setStillSrc(previousBaseSlot, null);
      requestTransitionSettle();
    });
  }, [clearSettleFrame, requestTransitionSettle, setBaseStillSlotValue, setStillSrc]);

  const beginVideoFade = useCallback(() => {
    if (completionRequestedRef.current || handoffPhaseRef.current !== "arming") return;

    setHandoffPhaseValue("fading");
    setVideoFadingOutValue(true);
    clearFadeTimer();
    fadeTimerRef.current = window.setTimeout(() => {
      promoteOverlayStill();
    }, TRANSITION_FADE_DURATION_MS);
  }, [clearFadeTimer, promoteOverlayStill, setHandoffPhaseValue, setVideoFadingOutValue]);

  const queueVideoFade = useCallback(() => {
    clearArmFrame();
    let remainingFrames = HANDOFF_ARM_FRAME_COUNT;

    const waitForStablePaint = () => {
      if (completionRequestedRef.current || handoffPhaseRef.current !== "arming") {
        armFrameRef.current = null;
        return;
      }

      remainingFrames -= 1;

      if (remainingFrames <= 0) {
        armFrameRef.current = null;

        if (e2eSettings.transitionArmingHoldMs > 0) {
          clearFadeTimer();
          fadeTimerRef.current = window.setTimeout(() => {
            beginVideoFade();
          }, e2eSettings.transitionArmingHoldMs);
          return;
        }

        beginVideoFade();
        return;
      }

      armFrameRef.current = window.requestAnimationFrame(waitForStablePaint);
    };

    armFrameRef.current = window.requestAnimationFrame(waitForStablePaint);
  }, [beginVideoFade, clearArmFrame, clearFadeTimer]);

  const startStillReveal = useCallback(() => {
    if (
      completionRequestedRef.current ||
      handoffPhaseRef.current !== "idle" ||
      !destinationHoldImageSrc
    ) {
      return;
    }

    const slot = activeSlotRef.current;

    if (!slot) {
      requestTransitionSettle();
      return;
    }

    const nextOverlaySlot = getHiddenStillSlot(baseStillSlotRef.current);

    if (getStillSrc(nextOverlaySlot) !== destinationHoldImageSrc) {
      setStillSrc(nextOverlaySlot, destinationHoldImageSrc);
    }

    pauseSlot(slot);
    setOverlayStillVisible(true);
    setHandoffPhaseValue("arming");
    queueVideoFade();
  }, [destinationHoldImageSrc, getStillSrc, pauseSlot, queueVideoFade, requestTransitionSettle, setHandoffPhaseValue, setStillSrc]);

  const handleVideoEnded = useCallback((slot: TransitionSlotName) => {
    if (completionRequestedRef.current || activeSlotRef.current !== slot) return;
    requestHandoff();
  }, [requestHandoff]);

  const handleVideoError = useCallback((slot: TransitionSlotName) => {
    if (completionRequestedRef.current || activeSlotRef.current !== slot) return;
    pauseSlot(slot);

    if (slot === "jump") {
      onTransitionFailed();
      return;
    }

    requestHandoff();
  }, [onTransitionFailed, pauseSlot, requestHandoff]);

  /**
   * Resets all handoff pipeline state for a new transition cycle.
   * Must be called whenever activeTransition changes.
   */
  const resetForTransition = useCallback(() => {
    clearArmFrame();
    clearFadeTimer();
    clearSettleFrame();
    completionRequestedRef.current = false;
    setHandoffPhaseValue("idle");
    setHandoffRequestedValue(false);
    setOverlayStillVisible(false);
    setVideoFadingOutValue(false);
  }, [clearArmFrame, clearFadeTimer, clearSettleFrame, setHandoffPhaseValue, setHandoffRequestedValue, setVideoFadingOutValue]);

  // --- Effects ---

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearArmFrame();
      clearFadeTimer();
      clearSettleFrame();
    };
  }, [clearArmFrame, clearFadeTimer, clearSettleFrame]);

  // Sync base still when not transitioning
  useEffect(() => {
    if (activeTransition) return;

    const visibleStillSlot = baseStillSlotRef.current;
    const hiddenStillSlot = getHiddenStillSlot(visibleStillSlot);

    if (getStillSrc(visibleStillSlot) !== initialHoldImageSrc) {
      setStillSrc(visibleStillSlot, initialHoldImageSrc);
    }

    if (getStillSrc(hiddenStillSlot) !== null) {
      setStillSrc(hiddenStillSlot, null);
    }

    setOverlayStillVisible(false);
    setHandoffPhaseValue("idle");
    setHandoffRequestedValue(false);
    setVideoFadingOutValue(false);
  }, [activeTransition, getStillSrc, initialHoldImageSrc, setHandoffPhaseValue, setHandoffRequestedValue, setStillSrc, setVideoFadingOutValue]);

  // Pre-load destination still into hidden slot
  useEffect(() => {
    if (!activeTransition || !destinationHoldImageSrc) return;

    const hiddenStillSlot = getHiddenStillSlot(baseStillSlotRef.current);

    if (getStillSrc(hiddenStillSlot) !== destinationHoldImageSrc) {
      setStillSrc(hiddenStillSlot, destinationHoldImageSrc);
    }
  }, [activeTransition, destinationHoldImageSrc, getStillSrc, setStillSrc]);

  // Handoff trigger: start still reveal when handoff requested and destination ready
  useEffect(() => {
    if (!activeTransition || !handoffRequested) return;

    if (!destinationStillReady) {
      if (destinationStillResolved) {
        requestTransitionSettle();
      }
      return;
    }

    startStillReveal();
  }, [
    activeTransition,
    destinationStillReady,
    destinationStillResolved,
    handoffRequested,
    requestTransitionSettle,
    startStillReveal,
  ]);

  return {
    // State
    activeSlot,
    baseStillSlot,
    handoffPhase,
    handoffRequested,
    overlayStillVisible,
    primaryStillSrc,
    secondaryStillSrc,
    videoFadingOut,
    // Actions
    handleVideoEnded,
    handleVideoError,
    pauseSlot,
    requestHandoff,
    requestTransitionSettle,
    resetForTransition,
    setActiveSlot,
  };
}
