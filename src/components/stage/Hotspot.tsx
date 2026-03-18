import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  getCalloutPhase,
  getLocalizedText,
  interfaceCopy,
  type DecadeId,
  type Language,
  type PlaybackState,
  type SceneHotspot,
  type SceneTheme,
} from "../../data/experience";
import { CalloutContentHost } from "../callouts/CalloutContentHost";
import { formatDataState } from "../../lib/e2e";
import { getHotspotSurfaceOffset } from "../../lib/hotspotOpenState";
import {
  CHROME_ENTER_EASE,
  CHROME_EXIT_EASE,
  createChromeVariants,
  getChromeTransition,
  getStaggeredChromeTransition,
  type ChromeMotionPhase,
} from "../../lib/chromeMotion";

interface HotspotProps {
  chromeMotionPhase: ChromeMotionPhase;
  controlsDisabled: boolean;
  hotspot: SceneHotspot;
  language: Language;
  playbackState: PlaybackState;
  sceneId: DecadeId;
  theme: SceneTheme;
  uiVisible: boolean;
  onCalloutClosed: () => void;
  onCalloutOpened: () => void;
  onToggleCallout: () => void;
}

const HOTSPOT_LAYER_VARIANTS = createChromeVariants({ y: 18 });
const HOTSPOT_CORNER_VARIANTS = createChromeVariants({ x: -14, y: -14 });
const HOTSPOT_ICON_VARIANTS = createChromeVariants({ y: 8, scale: 0.92 });
const HOTSPOT_SURFACE_ENTER_DURATION_S = 0.84;
const HOTSPOT_SURFACE_EXIT_DURATION_S = 0.36;
const HOTSPOT_CONTENT_ENTER_DURATION_S = 0.26;
const HOTSPOT_CONTENT_EXIT_DURATION_S = 0.16;

interface SurfaceMetrics {
  closedScale: number;
  openOffsetX: number;
  openOffsetY: number;
}

function getClosedSurfaceScale() {
  if (typeof window === "undefined") {
    return 0.02;
  }

  return Math.max(56 / (Math.max(window.innerWidth, window.innerHeight) * 2), 0.01);
}

function getSurfaceMetrics(hotspot: SceneHotspot): SurfaceMetrics {
  if (typeof window === "undefined") {
    return {
      closedScale: 0.02,
      openOffsetX: 0,
      openOffsetY: 0,
    };
  }

  const openOffset = getHotspotSurfaceOffset(
    hotspot,
    window.innerWidth,
    window.innerHeight,
  );

  return {
    closedScale: getClosedSurfaceScale(),
    openOffsetX: openOffset.x,
    openOffsetY: openOffset.y,
  };
}

function getSurfaceTransition(
  playbackState: PlaybackState,
  prefersReducedMotion: boolean,
) {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  if (playbackState === "calloutOpening") {
    return {
      duration: HOTSPOT_SURFACE_ENTER_DURATION_S,
      ease: CHROME_ENTER_EASE,
      opacity: { duration: 0 },
    };
  }

  if (playbackState === "calloutClosing") {
    return {
      duration: HOTSPOT_SURFACE_EXIT_DURATION_S,
      ease: CHROME_EXIT_EASE,
      delay: HOTSPOT_CONTENT_EXIT_DURATION_S,
      opacity: {
        duration: HOTSPOT_SURFACE_EXIT_DURATION_S,
        ease: CHROME_EXIT_EASE,
        delay: HOTSPOT_CONTENT_EXIT_DURATION_S,
      },
    };
  }

  return { duration: 0 };
}

function getCalloutTransition(
  playbackState: PlaybackState,
  prefersReducedMotion: boolean,
) {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  if (playbackState === "calloutOpen") {
    return {
      duration: HOTSPOT_CONTENT_ENTER_DURATION_S,
      ease: CHROME_ENTER_EASE,
    };
  }

  if (playbackState === "calloutClosing") {
    return {
      duration: HOTSPOT_CONTENT_EXIT_DURATION_S,
      ease: CHROME_EXIT_EASE,
    };
  }

  return { duration: 0 };
}

export function Hotspot({
  chromeMotionPhase,
  controlsDisabled,
  hotspot,
  language,
  playbackState,
  sceneId,
  theme,
  uiVisible,
  onCalloutClosed,
  onCalloutOpened,
  onToggleCallout,
}: HotspotProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const currentCopy = interfaceCopy[language];
  const calloutPhase = getCalloutPhase(playbackState);
  const calloutIsActive = calloutPhase !== "closed";
  const surfaceIsExpanded =
    playbackState === "calloutOpening" || playbackState === "calloutOpen";
  const [surfaceMetrics, setSurfaceMetrics] = useState(() =>
    getSurfaceMetrics(hotspot),
  );
  const calloutPhaseRef = useRef(calloutPhase);
  const openingSettledRef = useRef(false);
  const closingSettledRef = useRef(false);

  useEffect(() => {
    const updateSurfaceMetrics = () => {
      setSurfaceMetrics(getSurfaceMetrics(hotspot));
    };

    updateSurfaceMetrics();
    window.addEventListener("resize", updateSurfaceMetrics);

    return () => {
      window.removeEventListener("resize", updateSurfaceMetrics);
    };
  }, [hotspot]);

  useEffect(() => {
    calloutPhaseRef.current = calloutPhase;

    if (calloutPhase === "opening") {
      openingSettledRef.current = false;
    }

    if (calloutPhase === "closing") {
      closingSettledRef.current = false;
    }
  }, [calloutPhase]);

  useEffect(() => {
    if (!prefersReducedMotion) {
      return;
    }

    if (calloutPhase === "opening" && !openingSettledRef.current) {
      openingSettledRef.current = true;
      onCalloutOpened();
    }

    if (calloutPhase === "closing" && !closingSettledRef.current) {
      closingSettledRef.current = true;
      onCalloutClosed();
    }
  }, [calloutPhase, onCalloutClosed, onCalloutOpened, prefersReducedMotion]);

  const hotspotStyle = {
    "--hotspot-trigger-x": `${hotspot.trigger.x * 100}%`,
    "--hotspot-trigger-y": `${hotspot.trigger.y * 100}%`,
    "--hotspot-trigger-x-vw": `${hotspot.trigger.x * 100}vw`,
    "--hotspot-trigger-y-vh": `${hotspot.trigger.y * 100}vh`,
    "--hotspot-callout-block-x": `${hotspot.calloutBlock.x * 100}%`,
    "--hotspot-callout-block-y": `${hotspot.calloutBlock.y * 100}%`,
    "--hotspot-callout-block-width": `${hotspot.calloutBlock.width * 100}%`,
    "--hotspot-callout-block-height": `${hotspot.calloutBlock.height * 100}%`,
    "--hotspot-accent": theme.accent,
    "--hotspot-glow": theme.glow,
  } as CSSProperties;

  return (
    <motion.div
      className={`hotspot ${!controlsDisabled ? "hotspot--interactive" : ""}`}
      style={hotspotStyle}
      data-testid="hotspot-layer"
      data-open={formatDataState(calloutIsActive)}
      data-visible={formatDataState(uiVisible)}
      data-chrome-phase={chromeMotionPhase}
      data-callout-phase={calloutPhase}
      initial={false}
      animate={chromeMotionPhase}
      variants={HOTSPOT_LAYER_VARIANTS}
      transition={getChromeTransition(chromeMotionPhase, prefersReducedMotion)}
    >
      <div className="hotspot__surface-anchor">
        <motion.div
          className="hotspot__surface-mask"
          initial={false}
          animate={surfaceIsExpanded ? "open" : "closed"}
          variants={{
            closed: {
              opacity: 0,
              scale: surfaceMetrics.closedScale,
              x: 0,
              y: 0,
            },
            open: {
              opacity: 1,
              scale: 1,
              x: surfaceMetrics.openOffsetX,
              y: surfaceMetrics.openOffsetY,
            },
          }}
          transition={getSurfaceTransition(playbackState, prefersReducedMotion)}
          onAnimationComplete={() => {
            if (calloutPhaseRef.current === "opening" && !openingSettledRef.current) {
              openingSettledRef.current = true;
              onCalloutOpened();
            }

            if (calloutPhaseRef.current === "closing" && !closingSettledRef.current) {
              closingSettledRef.current = true;
              onCalloutClosed();
            }
          }}
        >
          <div className="hotspot__surface" aria-hidden="true" />

          <div className="hotspot__surface-layout">
            <motion.div
              className="hotspot__callout-block"
              data-testid="hotspot-callout"
              data-open={formatDataState(calloutIsActive)}
              data-callout-phase={calloutPhase}
              initial={false}
              animate={playbackState === "calloutOpen" ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={getCalloutTransition(playbackState, prefersReducedMotion)}
            >
              {calloutIsActive ? (
                <CalloutContentHost
                  key={sceneId}
                  contentId={hotspot.calloutContent.id}
                  sceneId={sceneId}
                  language={language}
                  isOpen={calloutIsActive}
                  playbackState={playbackState}
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

              <button
                type="button"
                className="hotspot__close-trigger"
                onClick={onToggleCallout}
                disabled={controlsDisabled || playbackState !== "calloutOpen"}
                aria-label={currentCopy.closeHotspot}
                data-testid="hotspot-close-trigger"
              >
                <span className="hotspot__icon-frame" aria-hidden="true">
                  <img
                    className="hotspot__icon hotspot__icon--asset"
                    src="/svg/minus.svg"
                    alt=""
                  />
                </span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="hotspot__trigger-position">
        <button
          type="button"
          className="hotspot__trigger"
          onClick={onToggleCallout}
          disabled={controlsDisabled || calloutIsActive}
          aria-expanded={calloutIsActive}
          aria-label={getLocalizedText(hotspot.label, language)}
          aria-keyshortcuts="Space"
          data-testid="hotspot-trigger"
        >
          <motion.img
            className="hotspot__corner-square"
            src="/svg/zoom%20small%20box.svg"
            alt=""
            aria-hidden="true"
            initial={false}
            animate={chromeMotionPhase}
            variants={HOTSPOT_CORNER_VARIANTS}
            transition={getChromeTransition(chromeMotionPhase, prefersReducedMotion)}
          />

          <motion.span
            className="hotspot__icon-frame"
            aria-hidden="true"
            initial={false}
            animate={chromeMotionPhase}
            variants={HOTSPOT_ICON_VARIANTS}
            transition={getStaggeredChromeTransition(
              chromeMotionPhase,
              prefersReducedMotion,
              0.08,
            )}
          >
            <img
              className="hotspot__icon hotspot__icon--asset"
              src="/svg/zoom%20big%20box.svg"
              alt=""
            />
          </motion.span>
        </button>
      </div>
    </motion.div>
  );
}
