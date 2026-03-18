import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getLocalizedText,
  isCalloutPlaybackState,
  isAdjacentTransition,
  isJumpTransition,
  type AdjacentTransitionStep,
  type JumpTransitionStep,
  type Language,
  type PlaybackState,
  type SceneNode,
  type TransitionStep,
} from "../data/experience";
import { preloadCalloutAsset } from "../lib/calloutAssetPreload";
import { e2eSettings, formatDataState } from "../lib/e2e";
import {
  getStillLoadStatus,
  preloadStill,
  subscribeToStill,
  type StillLoadStatus,
} from "../lib/stillPreload";
import {
  getHiddenStillSlot,
  useVideoHandoff,
  type TransitionSlotName,
} from "../hooks/useVideoHandoff";
import {
  getHotspotOpenScale,
  getHotspotStageOffset,
} from "../lib/hotspotOpenState";
import { Hotspot } from "./stage/Hotspot";
import type { ChromeMotionPhase } from "../lib/chromeMotion";

const TRANSITION_FADE_DURATION_MS = e2eSettings.transitionFadeDurationMs;
const TRANSITION_HANDOFF_LEAD_MS = e2eSettings.transitionHandoffLeadMs;
const JUMP_DESTINATION_HOLD_DURATION_MS = 1000;

type FrameAwareVideoElement = HTMLVideoElement & {
  cancelVideoFrameCallback?: (handle: number) => void;
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: { mediaTime: number }) => void,
  ) => number;
};

interface SceneStageProps {
  chromeMotionPhase: ChromeMotionPhase;
  controlsDisabled: boolean;
  currentScene: SceneNode;
  destinationScene: SceneNode | null;
  language: Language;
  playbackState: PlaybackState;
  activeTransition: TransitionStep | null;
  previousTransition: AdjacentTransitionStep | null;
  nextTransition: AdjacentTransitionStep | null;
  uiVisible: boolean;
  onCalloutClosed: () => void;
  onCalloutOpened: () => void;
  onToggleCallout: () => void;
  onTransitionFailed: () => void;
  onTransitionSettled: () => void;
}

interface StageOpenView {
  offsetX: number;
  offsetY: number;
  scale: number;
}

function getTransitionKey(transition: TransitionStep | null) {
  if (!transition) {
    return null;
  }

  if (isJumpTransition(transition)) {
    return `${transition.kind}-${transition.from}-${transition.to}-${transition.direction}-${transition.startFrame}-${transition.endFrame}`;
  }

  return `${transition.kind}-${transition.from}-${transition.to}-${transition.direction}`;
}

function useStillStatus(src: string | null) {
  const [status, setStatus] = useState<StillLoadStatus>(() =>
    src ? getStillLoadStatus(src) : "idle",
  );

  useEffect(() => {
    if (!src) {
      setStatus("idle");
      return;
    }

    setStatus(getStillLoadStatus(src));
    void preloadStill(src);

    return subscribeToStill(src, setStatus);
  }, [src]);

  return status;
}

function getStageOpenView(hotspot: SceneNode["hotspot"]): StageOpenView {
  const scale = getHotspotOpenScale(hotspot);

  if (typeof window === "undefined") {
    return {
      offsetX: 0,
      offsetY: 0,
      scale,
    };
  }

  const offset = getHotspotStageOffset(
    hotspot,
    window.innerWidth,
    window.innerHeight,
  );

  return {
    offsetX: offset.x,
    offsetY: offset.y,
    scale,
  };
}

function syncTransitionSlot(
  video: HTMLVideoElement | null,
  transition: AdjacentTransitionStep | null,
) {
  if (!video) {
    return;
  }

  video.pause();

  try {
    video.currentTime = 0;
  } catch {
    // Ignore seek errors while metadata is still pending.
  }

  const nextSrc = transition?.src ?? "";
  const currentSrc = video.dataset.transitionSrc ?? "";

  if (!nextSrc) {
    if (currentSrc) {
      delete video.dataset.transitionSrc;
      video.removeAttribute("src");
      video.load();
    }
    return;
  }

  if (currentSrc === nextSrc) {
    return;
  }

  video.dataset.transitionSrc = nextSrc;
  video.src = nextSrc;
  video.load();
}

function syncJumpVideo(video: HTMLVideoElement | null, src: string | null) {
  if (!video) {
    return;
  }

  const nextSrc = src ?? "";
  const currentSrc = video.dataset.transitionSrc ?? "";

  if (!nextSrc) {
    if (currentSrc) {
      video.pause();
      delete video.dataset.transitionSrc;
      video.removeAttribute("src");
      video.load();
    }
    return;
  }

  if (currentSrc === nextSrc) {
    return;
  }

  video.pause();
  video.dataset.transitionSrc = nextSrc;
  video.src = nextSrc;
  video.load();
}

function getFrameAtTime(timeSeconds: number, fps: number) {
  return Math.floor((timeSeconds * fps) + 0.5);
}

function seekVideoToFrame(video: HTMLVideoElement, frame: number, fps: number) {
  const nextTime = frame / fps;

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
    };

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    };

    const handleError = () => {
      finish(() => reject(new Error("Failed to prepare jump transition video")));
    };

    const handleSeeked = () => {
      finish(resolve);
    };

    const requestSeek = () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);

      if (Math.abs(video.currentTime - nextTime) < 0.001) {
        finish(resolve);
        return;
      }

      video.addEventListener("seeked", handleSeeked, { once: true });

      try {
        video.currentTime = nextTime;
      } catch (error) {
        finish(() => {
          reject(
            error instanceof Error
              ? error
              : new Error("Failed to seek jump transition video"),
          );
        });
      }
    };

    const handleLoadedMetadata = () => {
      requestSeek();
    };

    video.addEventListener("error", handleError, { once: true });

    if (video.readyState >= 1) {
      requestSeek();
      return;
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
  });
}

export function SceneStage({
  chromeMotionPhase,
  controlsDisabled,
  currentScene,
  destinationScene,
  language,
  playbackState,
  activeTransition,
  previousTransition,
  nextTransition,
  uiVisible,
  onCalloutClosed,
  onCalloutOpened,
  onToggleCallout,
  onTransitionFailed,
  onTransitionSettled,
}: SceneStageProps) {
  const previousVideoRef = useRef<HTMLVideoElement | null>(null);
  const nextVideoRef = useRef<HTMLVideoElement | null>(null);
  const jumpVideoRef = useRef<HTMLVideoElement | null>(null);
  const jumpFrameHoldRequestedRef = useRef(false);
  const jumpFrameHoldTimerRef = useRef<number | null>(null);
  const jumpFrameHoldRequestIdRef = useRef(0);

  const activeTransitionKey = getTransitionKey(activeTransition);
  const destinationStillStatus = useStillStatus(destinationScene?.holdImageSrc ?? null);
  const isCalloutActive = isCalloutPlaybackState(playbackState);
  const stageClassName = `stage ${isCalloutActive ? "stage--callout-open" : ""}`.trim();
  const [stageOpenView, setStageOpenView] = useState(() =>
    getStageOpenView(currentScene.hotspot),
  );

  useEffect(() => {
    const updateStageOpenView = () => {
      setStageOpenView(getStageOpenView(currentScene.hotspot));
    };

    updateStageOpenView();
    window.addEventListener("resize", updateStageOpenView);

    return () => {
      window.removeEventListener("resize", updateStageOpenView);
    };
  }, [currentScene.hotspot]);

  const stageStyle = {
    "--hotspot-callout-scale": String(stageOpenView.scale),
    "--hotspot-stage-offset-x": `${stageOpenView.offsetX}px`,
    "--hotspot-stage-offset-y": `${stageOpenView.offsetY}px`,
  } as CSSProperties;

  const getVideoForSlot = useCallback((slot: TransitionSlotName) => {
    if (slot === "previous") return previousVideoRef.current;
    if (slot === "next") return nextVideoRef.current;
    return jumpVideoRef.current;
  }, []);

  const clearJumpFrameHoldTimer = useCallback(() => {
    if (jumpFrameHoldTimerRef.current === null) {
      return;
    }

    window.clearTimeout(jumpFrameHoldTimerRef.current);
    jumpFrameHoldTimerRef.current = null;
  }, []);

  const handoff = useVideoHandoff({
    activeTransition,
    destinationHoldImageSrc: destinationScene?.holdImageSrc ?? null,
    destinationStillStatus,
    getVideoForSlot,
    initialHoldImageSrc: currentScene.holdImageSrc,
    onTransitionFailed,
    onTransitionSettled,
  });

  const overlayStillSlot = getHiddenStillSlot(handoff.baseStillSlot);

  // Sync adjacent video slots
  useEffect(() => {
    syncTransitionSlot(previousVideoRef.current, previousTransition);
  }, [previousTransition?.src]);

  useEffect(() => {
    syncTransitionSlot(nextVideoRef.current, nextTransition);
  }, [nextTransition?.src]);

  // Preload callout assets
  useEffect(() => {
    const assetSrc = currentScene.hotspot.calloutContent.assetSrc;
    if (!assetSrc) return;
    void preloadCalloutAsset(assetSrc);
  }, [currentScene.hotspot.calloutContent.assetSrc]);

  // Reset handoff state on transition change
  useEffect(() => {
    jumpFrameHoldRequestedRef.current = false;
    jumpFrameHoldRequestIdRef.current += 1;
    clearJumpFrameHoldTimer();
    handoff.resetForTransition();
    handoff.setActiveSlot(null);

    if (!activeTransition) {
      previousVideoRef.current?.pause();
      nextVideoRef.current?.pause();
      jumpVideoRef.current?.pause();
    }
  }, [
    activeTransition,
    activeTransitionKey,
    clearJumpFrameHoldTimer,
    nextTransition?.src,
    previousTransition?.src,
  ]);

  const requestJumpFrameHold = useCallback(() => {
    if (jumpFrameHoldRequestedRef.current) {
      return true;
    }

    if (!activeTransition || !isJumpTransition(activeTransition)) {
      handoff.requestHandoff();
      return true;
    }

    const video = jumpVideoRef.current;

    if (!video) {
      return true;
    }

    jumpFrameHoldRequestedRef.current = true;
    const requestId = ++jumpFrameHoldRequestIdRef.current;
    video.pause();

    void seekVideoToFrame(video, activeTransition.endFrame, activeTransition.fps)
      .then(() => {
        if (jumpFrameHoldRequestIdRef.current !== requestId) {
          return;
        }

        clearJumpFrameHoldTimer();
        jumpFrameHoldTimerRef.current = window.setTimeout(() => {
          if (jumpFrameHoldRequestIdRef.current !== requestId) {
            return;
          }

          handoff.requestHandoff();
        }, JUMP_DESTINATION_HOLD_DURATION_MS);
      })
      .catch((error: unknown) => {
        if (jumpFrameHoldRequestIdRef.current !== requestId) {
          return;
        }

        jumpFrameHoldRequestedRef.current = false;

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        handoff.handleVideoError("jump");
      });

    return true;
  }, [
    activeTransition,
    clearJumpFrameHoldTimer,
    handoff.handleVideoError,
    handoff.requestHandoff,
  ]);

  // Start adjacent transition playback
  useEffect(() => {
    if (!activeTransition || !isAdjacentTransition(activeTransition)) {
      return;
    }

    const nextActiveSlot =
      previousTransition?.src === activeTransition.src
        ? "previous"
        : nextTransition?.src === activeTransition.src
          ? "next"
          : null;

    if (!nextActiveSlot) {
      handoff.requestTransitionSettle();
      return;
    }

    const video = getVideoForSlot(nextActiveSlot);

    if (!video) {
      handoff.requestTransitionSettle();
      return;
    }

    handoff.setActiveSlot(nextActiveSlot);
    video.pause();

    try {
      video.currentTime = 0;
    } catch {
      // Ignore seek errors while metadata is still pending.
    }

    if (!video.dataset.transitionSrc) {
      video.dataset.transitionSrc = activeTransition.src;
      video.src = activeTransition.src;
      video.load();
    }

    if (e2eSettings.enabled) {
      const handoffTimer = window.setTimeout(() => {
        handoff.requestHandoff();
      }, e2eSettings.transitionHandoffDelayMs);

      return () => {
        window.clearTimeout(handoffTimer);
      };
    }

    void video.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      handoff.handleVideoError(nextActiveSlot);
    });
  }, [
    activeTransition,
    nextTransition?.src,
    previousTransition?.src,
  ]);

  // Start jump transition playback
  useEffect(() => {
    if (!activeTransition || !isJumpTransition(activeTransition)) {
      return;
    }

    const video = jumpVideoRef.current;

    if (!video) {
      onTransitionFailed();
      return;
    }

    let disposed = false;
    let handoffTimerId: number | null = null;

    handoff.setActiveSlot("jump");
    syncJumpVideo(video, activeTransition.src);

    const startJumpPlayback = async (transition: JumpTransitionStep) => {
      try {
        await seekVideoToFrame(video, transition.startFrame, transition.fps);

        if (disposed) {
          return;
        }

        if (e2eSettings.enabled) {
          handoffTimerId = window.setTimeout(() => {
            handoff.requestHandoff();
          }, e2eSettings.jumpTransitionHandoffDelayMs);
          return;
        }

        await video.play();
      } catch (error) {
        if (disposed) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        handoff.handleVideoError("jump");
      }
    };

    void startJumpPlayback(activeTransition);

    return () => {
      disposed = true;

      if (handoffTimerId !== null) {
        window.clearTimeout(handoffTimerId);
      }
      video.pause();
    };
  }, [activeTransition]);

  // Adjacent transition frame-watching for early handoff
  useEffect(() => {
    if (
      e2eSettings.enabled ||
      !activeTransition ||
      !handoff.activeSlot ||
      handoff.handoffRequested ||
      !isAdjacentTransition(activeTransition)
    ) {
      return;
    }

    const video = getVideoForSlot(handoff.activeSlot);

    if (!video) {
      return;
    }

    const handoffThresholdSeconds =
      (TRANSITION_FADE_DURATION_MS + TRANSITION_HANDOFF_LEAD_MS) / 1000;
    const frameAwareVideo = video as FrameAwareVideoElement;
    let frameRequestId: number | null = null;
    let disposed = false;
    const fallbackTimerId = window.setTimeout(() => {
      handoff.requestHandoff();
    }, Math.max(
      activeTransition.durationMs -
        (TRANSITION_FADE_DURATION_MS + TRANSITION_HANDOFF_LEAD_MS),
      0,
    ));

    const maybeRequestHandoff = () => {
      if (disposed) {
        return true;
      }

      const durationSeconds =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : activeTransition.durationMs / 1000;
      const remainingSeconds = durationSeconds - video.currentTime;

      if (remainingSeconds <= handoffThresholdSeconds) {
        handoff.requestHandoff();
        return true;
      }

      return false;
    };

    if (typeof frameAwareVideo.requestVideoFrameCallback === "function") {
      const watchFrame = () => {
        if (maybeRequestHandoff()) {
          return;
        }

        frameRequestId = frameAwareVideo.requestVideoFrameCallback?.(watchFrame) ?? null;
      };

      frameRequestId = frameAwareVideo.requestVideoFrameCallback(watchFrame);
    } else {
      const handleTimeUpdate = () => {
        maybeRequestHandoff();
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      maybeRequestHandoff();

      return () => {
        disposed = true;
        window.clearTimeout(fallbackTimerId);
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimerId);

      if (
        frameRequestId !== null &&
        typeof frameAwareVideo.cancelVideoFrameCallback === "function"
      ) {
        frameAwareVideo.cancelVideoFrameCallback(frameRequestId);
      }
    };
  }, [
    activeTransition,
    handoff.activeSlot,
    handoff.handoffRequested,
  ]);

  // Jump transition frame-watching for end-frame hold
  useEffect(() => {
    if (
      e2eSettings.enabled ||
      !activeTransition ||
      !handoff.activeSlot ||
      handoff.handoffRequested ||
      handoff.activeSlot !== "jump" ||
      !isJumpTransition(activeTransition)
    ) {
      return;
    }

    const video = jumpVideoRef.current;

    if (!video) {
      return;
    }

    const frameAwareVideo = video as FrameAwareVideoElement;
    let frameRequestId: number | null = null;
    let disposed = false;
    const fallbackTimerId = window.setTimeout(() => {
      requestJumpFrameHold();
    }, activeTransition.durationMs + TRANSITION_FADE_DURATION_MS);

    const maybeRequestHandoff = (timeSeconds = video.currentTime) => {
      if (disposed) {
        return true;
      }

      if (getFrameAtTime(timeSeconds, activeTransition.fps) >= activeTransition.endFrame) {
        return requestJumpFrameHold();
      }

      return false;
    };

    if (typeof frameAwareVideo.requestVideoFrameCallback === "function") {
      const watchFrame = (
        _now: number,
        metadata: { mediaTime: number },
      ) => {
        if (maybeRequestHandoff(metadata.mediaTime)) {
          return;
        }

        frameRequestId = frameAwareVideo.requestVideoFrameCallback?.(watchFrame) ?? null;
      };

      frameRequestId = frameAwareVideo.requestVideoFrameCallback(watchFrame);
    } else {
      const handleTimeUpdate = () => {
        maybeRequestHandoff();
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      maybeRequestHandoff();

      return () => {
        disposed = true;
        window.clearTimeout(fallbackTimerId);
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimerId);

      if (
        frameRequestId !== null &&
        typeof frameAwareVideo.cancelVideoFrameCallback === "function"
      ) {
        frameAwareVideo.cancelVideoFrameCallback(frameRequestId);
      }
    };
  }, [
    activeTransition,
    handoff.activeSlot,
    handoff.handoffRequested,
    requestJumpFrameHold,
  ]);

  const primaryStillClassName = `stage__still stage__still-slot ${
    handoff.baseStillSlot === "primary"
      ? "stage__still-slot--base"
      : "stage__still-slot--overlay"
  } ${
    overlayStillSlot === "primary" && handoff.overlayStillVisible
      ? "stage__still-slot--overlay-visible"
      : ""
  }`.trim();
  const secondaryStillClassName = `stage__still stage__still-slot ${
    handoff.baseStillSlot === "secondary"
      ? "stage__still-slot--base"
      : "stage__still-slot--overlay"
  } ${
    overlayStillSlot === "secondary" && handoff.overlayStillVisible
      ? "stage__still-slot--overlay-visible"
      : ""
  }`.trim();

  return (
    <section
      className={stageClassName}
      style={stageStyle}
      aria-label={getLocalizedText(currentScene.yearLabel, language)}
      data-testid="scene-stage"
      data-scene-id={currentScene.id}
      data-language={language}
      data-playback-state={playbackState}
      data-active-transition={activeTransitionKey ?? ""}
      data-active-transition-kind={activeTransition?.kind ?? ""}
      data-active-transition-src={activeTransition?.src ?? ""}
      data-jump-direction={
        activeTransition?.kind === "jump" ? activeTransition.direction : ""
      }
      data-jump-start-frame={
        activeTransition?.kind === "jump"
          ? String(activeTransition.startFrame)
          : ""
      }
      data-jump-end-frame={
        activeTransition?.kind === "jump"
          ? String(activeTransition.endFrame)
          : ""
      }
      data-destination-scene-id={destinationScene?.id ?? ""}
      data-destination-still-status={destinationStillStatus}
      data-handoff-phase={handoff.handoffPhase}
      data-overlay-still-visible={formatDataState(handoff.overlayStillVisible)}
      data-video-fading-out={formatDataState(handoff.videoFadingOut)}
      data-ui-visible={formatDataState(uiVisible)}
    >
      <img
        className={primaryStillClassName}
        src={handoff.primaryStillSrc ?? undefined}
        alt=""
        aria-hidden="true"
        data-testid="stage-still-primary"
        data-slot="primary"
      />

      <img
        className={secondaryStillClassName}
        src={handoff.secondaryStillSrc ?? undefined}
        alt=""
        aria-hidden="true"
        data-testid="stage-still-secondary"
        data-slot="secondary"
      />

      <video
        ref={previousVideoRef}
        className={`stage__video stage__video-slot ${
          handoff.activeSlot === "previous" ? "stage__video-slot--active" : ""
        } ${
          handoff.activeSlot === "previous" && handoff.videoFadingOut
            ? "stage__video-slot--fading-out"
            : ""
        }`.trim()}
        playsInline
        preload="auto"
        aria-hidden="true"
        muted={e2eSettings.enabled}
        data-testid="transition-video-previous"
        data-slot="previous"
        onEnded={() => handoff.handleVideoEnded("previous")}
        onError={() => handoff.handleVideoError("previous")}
      />

      <video
        ref={nextVideoRef}
        className={`stage__video stage__video-slot ${
          handoff.activeSlot === "next" ? "stage__video-slot--active" : ""
        } ${
          handoff.activeSlot === "next" && handoff.videoFadingOut
            ? "stage__video-slot--fading-out"
            : ""
        }`.trim()}
        playsInline
        preload="auto"
        aria-hidden="true"
        muted={e2eSettings.enabled}
        data-testid="transition-video-next"
        data-slot="next"
        onEnded={() => handoff.handleVideoEnded("next")}
        onError={() => handoff.handleVideoError("next")}
      />

      <video
        ref={jumpVideoRef}
        className={`stage__video stage__video-slot ${
          handoff.activeSlot === "jump" ? "stage__video-slot--active" : ""
        } ${
          handoff.activeSlot === "jump" && handoff.videoFadingOut
            ? "stage__video-slot--fading-out"
            : ""
        }`.trim()}
        playsInline
        preload="auto"
        aria-hidden="true"
        muted={e2eSettings.enabled}
        data-testid="transition-video-jump"
        data-slot="jump"
        onEnded={requestJumpFrameHold}
        onError={() => handoff.handleVideoError("jump")}
      />

      <Hotspot
        chromeMotionPhase={chromeMotionPhase}
        controlsDisabled={controlsDisabled}
        hotspot={currentScene.hotspot}
        language={language}
        playbackState={playbackState}
        sceneId={currentScene.id}
        theme={currentScene.theme}
        uiVisible={uiVisible}
        onCalloutClosed={onCalloutClosed}
        onCalloutOpened={onCalloutOpened}
        onToggleCallout={onToggleCallout}
      />
    </section>
  );
}
