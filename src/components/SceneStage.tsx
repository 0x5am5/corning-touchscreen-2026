import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  getLocalizedText,
  type Language,
  type PlaybackState,
  type SceneNode,
  type TransitionStep,
} from "../data/experience";
import { CalloutContentHost } from "./callouts/CalloutContentHost";
import { preloadCalloutAsset } from "../lib/calloutAssetPreload";
import { e2eSettings, formatDataState } from "../lib/e2e";
import {
  getStillLoadStatus,
  preloadStill,
  subscribeToStill,
  type StillLoadStatus,
} from "../lib/stillPreload";

type TransitionSlotName = "previous" | "next";
type StillSlotName = "primary" | "secondary";

type FrameAwareVideoElement = HTMLVideoElement & {
  cancelVideoFrameCallback?: (handle: number) => void;
  requestVideoFrameCallback?: (callback: () => void) => number;
};

interface SceneStageProps {
  controlsDisabled: boolean;
  currentScene: SceneNode;
  destinationScene: SceneNode | null;
  language: Language;
  playbackState: PlaybackState;
  activeTransition: TransitionStep | null;
  previousTransition: TransitionStep | null;
  nextTransition: TransitionStep | null;
  uiVisible: boolean;
  onToggleCallout: () => void;
  onTransitionSettled: () => void;
}

const TRANSITION_FADE_DURATION_MS = e2eSettings.transitionFadeDurationMs;

function getTransitionKey(transition: TransitionStep | null) {
  if (!transition) {
    return null;
  }

  return `${transition.from}-${transition.to}-${transition.direction}`;
}

function getHiddenStillSlot(slot: StillSlotName): StillSlotName {
  return slot === "primary" ? "secondary" : "primary";
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

function syncTransitionSlot(
  video: HTMLVideoElement | null,
  transition: TransitionStep | null,
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

export function SceneStage({
  controlsDisabled,
  currentScene,
  destinationScene,
  language,
  playbackState,
  activeTransition,
  previousTransition,
  nextTransition,
  uiVisible,
  onToggleCallout,
  onTransitionSettled,
}: SceneStageProps) {
  const previousVideoRef = useRef<HTMLVideoElement | null>(null);
  const nextVideoRef = useRef<HTMLVideoElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const settleFrameRef = useRef<number | null>(null);
  const activeSlotRef = useRef<TransitionSlotName | null>(null);
  const completionRequestedRef = useRef(false);
  const handoffRequestedRef = useRef(false);
  const videoFadingOutRef = useRef(false);
  const primaryStillSrcRef = useRef<string | null>(currentScene.holdImageSrc);
  const secondaryStillSrcRef = useRef<string | null>(null);
  const baseStillSlotRef = useRef<StillSlotName>("primary");
  const [activeSlot, setActiveSlot] = useState<TransitionSlotName | null>(null);
  const [handoffRequested, setHandoffRequested] = useState(false);
  const [primaryStillSrc, setPrimaryStillSrc] = useState<string | null>(currentScene.holdImageSrc);
  const [secondaryStillSrc, setSecondaryStillSrc] = useState<string | null>(null);
  const [baseStillSlot, setBaseStillSlot] = useState<StillSlotName>("primary");
  const [overlayStillVisible, setOverlayStillVisible] = useState(false);
  const destinationStillStatus = useStillStatus(destinationScene?.holdImageSrc ?? null);
  const activeTransitionKey = getTransitionKey(activeTransition);
  const destinationStillReady = destinationStillStatus === "ready";
  const destinationStillResolved = destinationStillStatus !== "loading";
  const overlayStillSlot = getHiddenStillSlot(baseStillSlot);
  const isCalloutOpen = playbackState === "calloutOpen";
  const stageClassName = `stage ${isCalloutOpen ? "stage--callout-open" : ""}`.trim();
  const hotspot = currentScene.hotspot;
  const activeTrigger = isCalloutOpen ? hotspot.triggerOpen : hotspot.trigger;
  const hotspotStyle = {
    "--hotspot-trigger-x": `${activeTrigger.x * 100}%`,
    "--hotspot-trigger-y": `${activeTrigger.y * 100}%`,
    "--hotspot-callout-block-x": `${hotspot.calloutBlock.x * 100}%`,
    "--hotspot-callout-block-y": `${hotspot.calloutBlock.y * 100}%`,
    "--hotspot-callout-block-width": `${hotspot.calloutBlock.width * 100}%`,
    "--hotspot-callout-block-height": `${hotspot.calloutBlock.height * 100}%`,
    "--hotspot-accent": currentScene.theme.accent,
    "--hotspot-glow": currentScene.theme.glow,
  } as CSSProperties;

  const clearFadeTimer = () => {
    if (fadeTimerRef.current === null) {
      return;
    }

    window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = null;
  };

  const clearSettleFrame = () => {
    if (settleFrameRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(settleFrameRef.current);
    settleFrameRef.current = null;
  };

  const updatePrimaryStillSrc = (src: string | null) => {
    if (primaryStillSrcRef.current === src) {
      return;
    }

    primaryStillSrcRef.current = src;
    setPrimaryStillSrc(src);
  };

  const updateSecondaryStillSrc = (src: string | null) => {
    if (secondaryStillSrcRef.current === src) {
      return;
    }

    secondaryStillSrcRef.current = src;
    setSecondaryStillSrc(src);
  };

  const getStillSrc = (slot: StillSlotName) =>
    slot === "primary" ? primaryStillSrcRef.current : secondaryStillSrcRef.current;

  const setStillSrc = (slot: StillSlotName, src: string | null) => {
    if (slot === "primary") {
      updatePrimaryStillSrc(src);
      return;
    }

    updateSecondaryStillSrc(src);
  };

  const setBaseStillSlotValue = (slot: StillSlotName) => {
    if (baseStillSlotRef.current === slot) {
      return;
    }

    baseStillSlotRef.current = slot;
    setBaseStillSlot(slot);
  };

  const setActiveSlotValue = (slot: TransitionSlotName | null) => {
    activeSlotRef.current = slot;
    setActiveSlot(slot);
  };

  const setHandoffRequestedValue = (nextValue: boolean) => {
    if (handoffRequestedRef.current === nextValue) {
      return;
    }

    handoffRequestedRef.current = nextValue;
    setHandoffRequested(nextValue);
  };

  const setVideoFadingOutValue = (nextValue: boolean) => {
    videoFadingOutRef.current = nextValue;
  };

  const setOverlayStillVisibleValue = (nextValue: boolean) => {
    setOverlayStillVisible(nextValue);
  };

  const pauseSlot = (slot: TransitionSlotName) => {
    const video = slot === "previous" ? previousVideoRef.current : nextVideoRef.current;

    if (!video) {
      return;
    }

    video.pause();
  };

  const requestTransitionSettle = () => {
    if (completionRequestedRef.current) {
      return;
    }

    completionRequestedRef.current = true;
    clearFadeTimer();
    clearSettleFrame();
    onTransitionSettled();
  };

  const requestHandoff = () => {
    if (completionRequestedRef.current || handoffRequestedRef.current) {
      return;
    }

    setHandoffRequestedValue(true);
  };

  const promoteOverlayStill = () => {
    const previousBaseSlot = baseStillSlotRef.current;
    const nextBaseSlot = getHiddenStillSlot(previousBaseSlot);

    setBaseStillSlotValue(nextBaseSlot);
    setOverlayStillVisibleValue(false);
    clearSettleFrame();
    settleFrameRef.current = window.requestAnimationFrame(() => {
      setStillSrc(previousBaseSlot, null);
      requestTransitionSettle();
    });
  };

  const startStillReveal = () => {
    if (
      completionRequestedRef.current ||
      videoFadingOutRef.current ||
      !destinationScene
    ) {
      return;
    }

    const nextOverlaySlot = getHiddenStillSlot(baseStillSlotRef.current);

    if (getStillSrc(nextOverlaySlot) !== destinationScene.holdImageSrc) {
      setStillSrc(nextOverlaySlot, destinationScene.holdImageSrc);
    }

    setOverlayStillVisibleValue(true);
    setVideoFadingOutValue(true);
    clearFadeTimer();
    fadeTimerRef.current = window.setTimeout(() => {
      promoteOverlayStill();
    }, TRANSITION_FADE_DURATION_MS);
  };

  const handleVideoEnded = (slot: TransitionSlotName) => {
    if (completionRequestedRef.current || activeSlotRef.current !== slot) {
      return;
    }

    requestHandoff();
  };

  const handleVideoError = (slot: TransitionSlotName) => {
    if (completionRequestedRef.current || activeSlotRef.current !== slot) {
      return;
    }

    pauseSlot(slot);
    requestHandoff();
  };

  useEffect(() => {
    syncTransitionSlot(previousVideoRef.current, previousTransition);
  }, [previousTransition?.src]);

  useEffect(() => {
    syncTransitionSlot(nextVideoRef.current, nextTransition);
  }, [nextTransition?.src]);

  useEffect(() => {
    return () => {
      clearFadeTimer();
      clearSettleFrame();
    };
  }, []);

  useEffect(() => {
    const assetSrc = currentScene.hotspot.calloutContent.assetSrc;

    if (!assetSrc) {
      return;
    }

    void preloadCalloutAsset(assetSrc);
  }, [currentScene.hotspot.calloutContent.assetSrc]);

  useEffect(() => {
    if (activeTransition) {
      return;
    }

    const visibleStillSlot = baseStillSlotRef.current;
    const hiddenStillSlot = getHiddenStillSlot(visibleStillSlot);

    if (getStillSrc(visibleStillSlot) !== currentScene.holdImageSrc) {
      setStillSrc(visibleStillSlot, currentScene.holdImageSrc);
    }

    if (getStillSrc(hiddenStillSlot) !== null) {
      setStillSrc(hiddenStillSlot, null);
    }

    setOverlayStillVisibleValue(false);
    setHandoffRequestedValue(false);
    setVideoFadingOutValue(false);
  }, [activeTransition, currentScene.holdImageSrc]);

  useEffect(() => {
    if (!activeTransition || !destinationScene) {
      return;
    }

    const hiddenStillSlot = getHiddenStillSlot(baseStillSlotRef.current);

    if (getStillSrc(hiddenStillSlot) !== destinationScene.holdImageSrc) {
      setStillSrc(hiddenStillSlot, destinationScene.holdImageSrc);
    }
  }, [activeTransition, destinationScene?.holdImageSrc]);

  useEffect(() => {
    clearFadeTimer();
    clearSettleFrame();
    completionRequestedRef.current = false;
    setHandoffRequestedValue(false);
    setOverlayStillVisibleValue(false);
    setVideoFadingOutValue(false);

    if (!activeTransition) {
      previousVideoRef.current?.pause();
      nextVideoRef.current?.pause();
      setActiveSlotValue(null);
      return;
    }

    const nextActiveSlot =
      previousTransition?.src === activeTransition.src
        ? "previous"
        : nextTransition?.src === activeTransition.src
          ? "next"
          : null;

    if (!nextActiveSlot) {
      requestTransitionSettle();
      return;
    }

    const video = nextActiveSlot === "previous" ? previousVideoRef.current : nextVideoRef.current;

    if (!video) {
      requestTransitionSettle();
      return;
    }

    setActiveSlotValue(nextActiveSlot);
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
        requestHandoff();
      }, e2eSettings.transitionHandoffDelayMs);

      return () => {
        window.clearTimeout(handoffTimer);
        clearFadeTimer();
        clearSettleFrame();
      };
    }

    void video.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      handleVideoError(nextActiveSlot);
    });

    return () => {
      clearFadeTimer();
      clearSettleFrame();
    };
  }, [
    activeTransition,
    activeTransitionKey,
    nextTransition?.src,
    onTransitionSettled,
    previousTransition?.src,
  ]);

  useEffect(() => {
    if (e2eSettings.enabled || !activeTransition || !activeSlot || handoffRequested) {
      return;
    }

    const video = activeSlot === "previous" ? previousVideoRef.current : nextVideoRef.current;

    if (!video) {
      return;
    }

    const handoffThresholdSeconds = TRANSITION_FADE_DURATION_MS / 1000;
    const frameAwareVideo = video as FrameAwareVideoElement;
    let frameRequestId: number | null = null;
    let disposed = false;
    const fallbackTimerId = window.setTimeout(() => {
      requestHandoff();
    }, Math.max(activeTransition.durationMs - TRANSITION_FADE_DURATION_MS, 0));

    const maybeRequestHandoff = () => {
      if (disposed || completionRequestedRef.current || handoffRequestedRef.current) {
        return true;
      }

      const durationSeconds =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : activeTransition.durationMs / 1000;
      const remainingSeconds = durationSeconds - video.currentTime;

      if (remainingSeconds <= handoffThresholdSeconds) {
        requestHandoff();
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
    activeSlot,
    handoffRequested,
  ]);

  useEffect(() => {
    if (!activeTransition || !handoffRequested) {
      return;
    }

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
  ]);

  const primaryStillClassName = `stage__still stage__still-slot ${
    baseStillSlot === "primary"
      ? "stage__still-slot--base"
      : "stage__still-slot--overlay"
  } ${
    overlayStillSlot === "primary" && overlayStillVisible
      ? "stage__still-slot--overlay-visible"
      : ""
  }`.trim();
  const secondaryStillClassName = `stage__still stage__still-slot ${
    baseStillSlot === "secondary"
      ? "stage__still-slot--base"
      : "stage__still-slot--overlay"
  } ${
    overlayStillSlot === "secondary" && overlayStillVisible
      ? "stage__still-slot--overlay-visible"
      : ""
  }`.trim();

  return (
    <section
      className={stageClassName}
      aria-label={getLocalizedText(currentScene.yearLabel, language)}
      data-testid="scene-stage"
      data-scene-id={currentScene.id}
      data-language={language}
      data-playback-state={playbackState}
      data-active-transition={activeTransitionKey ?? ""}
      data-active-transition-src={activeTransition?.src ?? ""}
      data-destination-scene-id={destinationScene?.id ?? ""}
      data-destination-still-status={destinationStillStatus}
      data-overlay-still-visible={formatDataState(overlayStillVisible)}
      data-ui-visible={formatDataState(uiVisible)}
    >
      <img
        className={primaryStillClassName}
        src={primaryStillSrc ?? undefined}
        alt=""
        aria-hidden="true"
        data-testid="stage-still-primary"
        data-slot="primary"
      />

      <img
        className={secondaryStillClassName}
        src={secondaryStillSrc ?? undefined}
        alt=""
        aria-hidden="true"
        data-testid="stage-still-secondary"
        data-slot="secondary"
      />

      <video
        ref={previousVideoRef}
        className={`stage__video stage__video-slot ${
          activeSlot === "previous" ? "stage__video-slot--active" : ""
        }`}
        playsInline
        preload="auto"
        aria-hidden="true"
        muted={e2eSettings.enabled}
        data-testid="transition-video-previous"
        data-slot="previous"
        onEnded={() => handleVideoEnded("previous")}
        onError={() => handleVideoError("previous")}
      />

      <video
        ref={nextVideoRef}
        className={`stage__video stage__video-slot ${
          activeSlot === "next" ? "stage__video-slot--active" : ""
        }`}
        playsInline
        preload="auto"
        aria-hidden="true"
        muted={e2eSettings.enabled}
        data-testid="transition-video-next"
        data-slot="next"
        onEnded={() => handleVideoEnded("next")}
        onError={() => handleVideoError("next")}
      />

      <div className="stage__scrim" />

      <div
        className={`hotspot ${uiVisible ? "hotspot--visible" : ""} ${
          isCalloutOpen ? "hotspot--callout-open" : ""
        }`}
        style={hotspotStyle}
        data-testid="hotspot-layer"
        data-open={formatDataState(isCalloutOpen)}
        data-visible={formatDataState(uiVisible)}
      >
        <div className="hotspot__backdrop" aria-hidden="true" />
        <div
          className={`hotspot__callout-block ${
            isCalloutOpen ? "hotspot__callout-block--visible" : ""
          }`}
          data-testid="hotspot-callout"
          data-open={formatDataState(isCalloutOpen)}
        >
          {isCalloutOpen ? (
            <CalloutContentHost
              key={currentScene.id}
              contentId={hotspot.calloutContent.id}
              sceneId={currentScene.id}
              language={language}
              isOpen={isCalloutOpen}
              assetSrc={hotspot.calloutContent.assetSrc}
            />
          ) : null}

          <div className="hotspot__content">
            <div className="hotspot__callout-title" data-testid="hotspot-title">
              {getLocalizedText(hotspot.title, language)}
            </div>
            <p className="hotspot__callout-body" data-testid="hotspot-body">
              {getLocalizedText(hotspot.body, language)}
            </p>
          </div>
        </div>

        <div className="hotspot__trigger-position">
          <button
            type="button"
            className="hotspot__trigger"
            onClick={onToggleCallout}
            disabled={controlsDisabled}
            aria-expanded={isCalloutOpen}
            aria-label={getLocalizedText(hotspot.label, language)}
            aria-keyshortcuts="Space"
            data-testid="hotspot-trigger"
          >
            <img
              src="/svg/zoom%20small%20box.svg"
              style={{
                position: "absolute",
                bottom: "100%",
                right: "100%",
                opacity: isCalloutOpen ? 0 : 1,
              }}
              width={54}
              alt=""
            />

            <span className="hotspot__icon-frame" aria-hidden="true">
              <img
                className="hotspot__icon hotspot__icon--asset"
                src={isCalloutOpen ? "/svg/minus.svg" : "/svg/zoom%20big%20box.svg"}
                alt=""
              />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
