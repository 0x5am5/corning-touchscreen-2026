import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  getLocalizedText,
  interfaceCopy,
  type DecadeId,
  type Language,
  type SceneNode,
} from "../data/experience";
import {
  CHROME_ENTER_DURATION_MS,
  CHROME_ENTER_EASE,
  CHROME_EXIT_DURATION_MS,
  CHROME_EXIT_EASE,
  createChromeVariants,
  getChromeTransition,
  type ChromeMotionPhase,
} from "../lib/chromeMotion";

interface TimelineNavProps {
  ariaLabel: string;
  disabled: boolean;
  language: Language;
  scenes: SceneNode[];
  activeSceneId: DecadeId;
  chromeMotionPhase: ChromeMotionPhase;
  onActivity: () => void;
  resetSignal: number;
  onNavigate: (sceneId: DecadeId) => void;
  onStep: (direction: -1 | 1) => void;
}

const TIMELINE_CHROME_VARIANTS = createChromeVariants();
type TimelineExpandPhase = "collapsed" | "preOpening" | "opening" | "open" | "closing";

/** Translate distance (px) for arrow exit/enter animations. */
const ARROW_SHIFT_PX = 68;

/** Duration (seconds) for arrow exit slide. */
const ARROW_DURATION_S = CHROME_EXIT_DURATION_MS / 1000;
const TIMELINE_PREOPEN_DURATION_MS = CHROME_EXIT_DURATION_MS;
const TIMELINE_REVEAL_DURATION_S = 0.42;
const TIMELINE_COLLAPSE_DURATION_S = 0.34;
const TIMELINE_REVEAL_DURATION_MS = 420;
const TIMELINE_COLLAPSE_DURATION_MS = 340;
const TIMELINE_FRAME_PADDING_PX = 18;
const TIMELINE_COLLAPSED_FALLBACK_WIDTH_PX = 186;
const TIMELINE_REVEAL_EASE = [0.18, 1, 0.24, 1] as const;
const TIMELINE_COLLAPSE_EASE = [0.6, 0, 0.82, 0.28] as const;

function getTimelineShellTransition(
  phase: TimelineExpandPhase,
  prefersReducedMotion: boolean,
) {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  if (phase === "collapsed" || phase === "preOpening" || phase === "closing") {
    return { duration: TIMELINE_COLLAPSE_DURATION_S, ease: TIMELINE_COLLAPSE_EASE };
  }

  return {
    duration: TIMELINE_REVEAL_DURATION_S,
    ease: TIMELINE_REVEAL_EASE,
  };
}

function TimelineTransitionLines() {
  return (
    <img
      className="timeline__transition-lines"
      src="/svg/4%20trnsition%20lines.svg"
      alt=""
      aria-hidden="true"
    />
  );
}

/** Collapsed-state center anchor; the expanded rail owns the active decade label. */
function DecadeLabel({
  label,
  currentDisabled,
  showLabel,
  onExpand,
  openTimeline,
}: {
  label: string;
  currentDisabled: boolean;
  showLabel: boolean;
  onExpand: () => void;
  openTimeline: string;
}) {
  return (
    <div className="timeline__current-slot">
      <button
        type="button"
        className="timeline__current"
        disabled={currentDisabled}
        onClick={() => {
          if (currentDisabled) return;
          onExpand();
        }}
        aria-expanded="false"
        aria-label={openTimeline}
        aria-keyshortcuts="ArrowUp ArrowDown Escape"
        aria-hidden={!showLabel}
        data-testid="timeline-current"
        data-visible={showLabel ? "true" : "false"}
        style={{ pointerEvents: showLabel && !currentDisabled ? "auto" : "none" }}
      >
        {showLabel ? (
          <span className="timeline__current-plate">
            <span className="timeline__current-label">{label}</span>
          </span>
        ) : null}
      </button>
    </div>
  );
}

export function TimelineNav({
  ariaLabel,
  disabled,
  language,
  scenes,
  activeSceneId,
  chromeMotionPhase,
  onActivity,
  resetSignal,
  onNavigate,
  onStep,
}: TimelineNavProps) {
  const [expandPhase, setExpandPhase] = useState<TimelineExpandPhase>("collapsed");
  const [railRevealed, setRailRevealed] = useState(false);
  const [railWidths, setRailWidths] = useState({
    collapsed: TIMELINE_COLLAPSED_FALLBACK_WIDTH_PX,
    expanded: TIMELINE_COLLAPSED_FALLBACK_WIDTH_PX,
  });
  const prefersReducedMotion = useReducedMotion() ?? false;
  const phaseTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const pendingSceneIdRef = useRef<DecadeId | null>(null);
  const railShellRef = useRef<HTMLDivElement | null>(null);
  const railViewportRef = useRef<HTMLDivElement | null>(null);
  const railContentRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef(new Map<DecadeId, HTMLButtonElement | null>());
  const currentCopy = interfaceCopy[language];
  const indexById = useMemo(
    () => new Map(scenes.map((scene, index) => [scene.id, index] as const)),
    [scenes],
  );
  const activeIndex = indexById.get(activeSceneId) ?? 0;
  const hasPreviousScene = activeIndex > 0;
  const hasNextScene = activeIndex < scenes.length - 1;
  const activeScene = scenes[activeIndex] ?? scenes[0];
  const chromeVisible = chromeMotionPhase === "entering" || chromeMotionPhase === "visible";
  const chromeReady = chromeMotionPhase === "visible";
  const isExpanded = expandPhase !== "collapsed" && expandPhase !== "preOpening";
  const currentDisabled = disabled || !chromeReady || expandPhase !== "collapsed";
  const chipsInteractive = !disabled && expandPhase === "open";
  const currentLabel = getLocalizedText(activeScene.yearLabel, language);

  const clearPhaseTimer = useCallback(() => {
    if (phaseTimerRef.current === null) {
      return;
    }

    window.clearTimeout(phaseTimerRef.current);
    phaseTimerRef.current = null;
  }, []);

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current === null) {
      return;
    }

    window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = null;
  }, []);

  const syncRailWidths = useCallback(() => {
    const railShell = railShellRef.current;
    const railContent = railContentRef.current;
    const activeChip = chipRefs.current.get(activeSceneId);

    if (!railShell || !railContent || !activeChip) {
      return null;
    }

    const collapsed = Math.max(
      TIMELINE_COLLAPSED_FALLBACK_WIDTH_PX,
      activeChip.offsetWidth + TIMELINE_FRAME_PADDING_PX * 2,
    );
    const expanded = Math.max(
      collapsed,
      Math.min(
        railShell.clientWidth,
        railContent.scrollWidth + TIMELINE_FRAME_PADDING_PX * 2,
      ),
    );

    setRailWidths((current) => {
      if (current.collapsed === collapsed && current.expanded === expanded) {
        return current;
      }

      return { collapsed, expanded };
    });

    return { collapsed, expanded };
  }, [activeSceneId]);

  const centerActiveChip = useCallback(() => {
    const railViewport = railViewportRef.current;
    const activeChip = chipRefs.current.get(activeSceneId);
    const measuredWidths = syncRailWidths();

    if (!railViewport || !activeChip) {
      return;
    }

    const viewportWidth = Math.max(
      0,
      (measuredWidths?.expanded ?? railWidths.expanded) - TIMELINE_FRAME_PADDING_PX * 2,
    );
    const targetScrollLeft =
      activeChip.offsetLeft - (viewportWidth - activeChip.offsetWidth) / 2;
    const maxScrollLeft = Math.max(0, railViewport.scrollWidth - viewportWidth);
    const nextScrollLeft = Math.min(Math.max(0, targetScrollLeft), maxScrollLeft);

    railViewport.scrollTo({ left: nextScrollLeft, behavior: "auto" });
  }, [activeSceneId, railWidths.expanded, syncRailWidths]);

  const resetExpandedTimeline = useCallback(() => {
    clearPhaseTimer();
    clearRevealTimer();
    pendingSceneIdRef.current = null;
    setRailRevealed(false);
    setExpandPhase("collapsed");
  }, [clearPhaseTimer, clearRevealTimer]);

  const completeClose = useCallback(() => {
    clearPhaseTimer();
    clearRevealTimer();
    const pendingSceneId = pendingSceneIdRef.current;

    pendingSceneIdRef.current = null;
    setRailRevealed(false);
    setExpandPhase("collapsed");

    if (pendingSceneId) {
      onNavigate(pendingSceneId);
    }
  }, [clearPhaseTimer, clearRevealTimer, onNavigate]);

  const startOpen = useCallback(() => {
    if (disabled || !chromeReady || expandPhase !== "collapsed") {
      return;
    }

    pendingSceneIdRef.current = null;
    clearPhaseTimer();
    clearRevealTimer();
    centerActiveChip();

    if (prefersReducedMotion) {
      setRailRevealed(true);
      setExpandPhase("open");
      return;
    }

    setRailRevealed(false);
    setExpandPhase("preOpening");
    phaseTimerRef.current = window.setTimeout(() => {
      phaseTimerRef.current = null;
      setExpandPhase("opening");
      setRailRevealed(true);
      phaseTimerRef.current = window.setTimeout(() => {
        phaseTimerRef.current = null;
        setExpandPhase("open");
      }, TIMELINE_REVEAL_DURATION_MS);
    }, TIMELINE_PREOPEN_DURATION_MS);
  }, [
    centerActiveChip,
    chromeReady,
    clearPhaseTimer,
    clearRevealTimer,
    disabled,
    expandPhase,
    prefersReducedMotion,
  ]);

  const startClose = useCallback((nextSceneId: DecadeId | null = null) => {
    if (
      expandPhase === "collapsed" ||
      expandPhase === "preOpening" ||
      expandPhase === "closing"
    ) {
      return;
    }

    pendingSceneIdRef.current = nextSceneId;
    clearPhaseTimer();
    clearRevealTimer();
    centerActiveChip();

    if (prefersReducedMotion) {
      completeClose();
      return;
    }

    if (!railRevealed) {
      completeClose();
      return;
    }

    setExpandPhase("closing");
    phaseTimerRef.current = window.setTimeout(() => {
      completeClose();
    }, TIMELINE_COLLAPSE_DURATION_MS);
  }, [
    centerActiveChip,
    clearPhaseTimer,
    clearRevealTimer,
    completeClose,
    expandPhase,
    prefersReducedMotion,
    railRevealed,
  ]);

  useEffect(() => {
    resetExpandedTimeline();
  }, [activeSceneId, resetExpandedTimeline, resetSignal]);

  useEffect(() => {
    if (chromeMotionPhase !== "visible") {
      resetExpandedTimeline();
    }
  }, [chromeMotionPhase, resetExpandedTimeline]);

  useEffect(() => {
    syncRailWidths();
  }, [activeSceneId, language, scenes, syncRailWidths]);

  useEffect(() => {
    const handleResize = () => {
      syncRailWidths();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [syncRailWidths]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    centerActiveChip();
  }, [centerActiveChip, isExpanded]);

  useEffect(() => {
    return () => {
      clearPhaseTimer();
      clearRevealTimer();
    };
  }, [clearPhaseTimer, clearRevealTimer]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((disabled || !chromeReady) || event.repeat) {
        return;
      }

      if (event.key === "ArrowUp" && expandPhase === "collapsed") {
        onActivity();
        event.preventDefault();
        startOpen();
      }

      if (event.key === "ArrowDown" && expandPhase !== "collapsed" && expandPhase !== "preOpening") {
        onActivity();
        event.preventDefault();
        startClose();
        return;
      }

      if (event.key === "Escape" && expandPhase !== "collapsed" && expandPhase !== "preOpening") {
        onActivity();
        event.preventDefault();
        startClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [chromeReady, disabled, expandPhase, onActivity, startClose, startOpen]);

  const handleCollapsedStep = (direction: -1 | 1) => {
    if (disabled || !chromeReady || expandPhase !== "collapsed") {
      return;
    }

    onActivity();
    onStep(direction);
  };

  // --- Motion config for arrows ---
  // Arrows translate toward the direction they point; parent handles opacity.
  const arrowEnterDuration = prefersReducedMotion ? 0 : CHROME_ENTER_DURATION_MS / 1000;
  const arrowExitDuration = prefersReducedMotion ? 0 : ARROW_DURATION_S;

  const previousArrowVariants = {
    visible: { opacity: 1, x: 0, transition: { duration: arrowEnterDuration, ease: CHROME_ENTER_EASE } },
    hidden: { opacity: 0, x: -ARROW_SHIFT_PX, transition: { duration: arrowExitDuration, ease: CHROME_EXIT_EASE } },
  };

  const nextArrowVariants = {
    visible: { opacity: 1, x: 0, transition: { duration: arrowEnterDuration, ease: CHROME_ENTER_EASE } },
    hidden: { opacity: 0, x: ARROW_SHIFT_PX, transition: { duration: arrowExitDuration, ease: CHROME_EXIT_EASE } },
  };

  // Arrows are hidden when no adjacent scene OR chrome not yet entering.
  // Use chromeVisible (entering | visible) so arrows animate in sync with the
  // parent nav; chromeReady (visible only) still gates interactivity.
  const arrowsVisible = expandPhase === "collapsed";
  const prevArrowState = hasPreviousScene && chromeVisible && arrowsVisible ? "visible" : "hidden";
  const nextArrowState = hasNextScene && chromeVisible && arrowsVisible ? "visible" : "hidden";
  const maskWidth =
    expandPhase === "opening" || expandPhase === "open"
      ? railWidths.expanded
      : railWidths.collapsed;
  const maskWidthTransition = getTimelineShellTransition(expandPhase, prefersReducedMotion);

  return (
    <motion.nav
      className={`timeline ${isExpanded ? "timeline--expanded" : "timeline--collapsed"}`}
      aria-label={ariaLabel}
      data-testid="timeline-nav"
      data-expanded={isExpanded ? "true" : "false"}
      data-expand-phase={expandPhase}
      data-chrome-phase={chromeMotionPhase}
      data-active-scene-id={activeSceneId}
      data-display-scene-id={activeSceneId}
      initial={false}
      animate={chromeMotionPhase}
      variants={TIMELINE_CHROME_VARIANTS}
      transition={getChromeTransition(chromeMotionPhase, prefersReducedMotion)}
    >
      <div
        ref={railShellRef}
        className="timeline__rail-shell"
        role="group"
        aria-label={ariaLabel}
        aria-hidden={!isExpanded}
        data-testid="timeline-rail"
        data-expand-phase={expandPhase}
        style={{ pointerEvents: chipsInteractive ? "auto" : "none" }}
      >
        <motion.div
          className="timeline__rail-mask"
          initial={false}
          animate={{
            opacity: railRevealed ? 1 : 0,
            width: maskWidth,
          }}
          transition={{
            width: maskWidthTransition,
            opacity: { duration: 0 },
          }}
        >
          <div
            ref={railViewportRef}
            className="timeline__rail-viewport"
            data-expand-phase={expandPhase}
          >
            <div
              ref={railContentRef}
              className="timeline__rail"
              data-expand-phase={expandPhase}
            >
              <div className="timeline__graphic-lane">
                <TimelineTransitionLines />
              </div>
              <div className="timeline__chips">
                {scenes.map((scene) => {
                  const isActive = scene.id === activeSceneId;
                  return (
                    <button
                      key={scene.id}
                      ref={(node) => {
                        chipRefs.current.set(scene.id, node);
                      }}
                      type="button"
                      className={`timeline__chip ${isActive ? "timeline__chip--active" : ""}`}
                      disabled={!chipsInteractive}
                      data-testid="timeline-chip"
                      data-scene-id={scene.id}
                      data-state={isActive ? "active" : "idle"}
                      onClick={() => {
                        if (!chipsInteractive) {
                          return;
                        }

                        onActivity();

                        if (isActive) {
                          startClose();
                          return;
                        }

                        startClose(scene.id);
                      }}
                    >
                      {getLocalizedText(scene.yearLabel, language)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="timeline__cluster">
        <motion.button
          type="button"
          className="timeline__arrow timeline__arrow--previous"
          initial={false}
          animate={prevArrowState}
          variants={previousArrowVariants}
          onClick={() => {
            handleCollapsedStep(-1);
          }}
          aria-label={currentCopy.previousDecade}
          aria-keyshortcuts="ArrowLeft"
          disabled={disabled || !chromeReady || expandPhase !== "collapsed" || !hasPreviousScene}
          aria-hidden={!hasPreviousScene || !arrowsVisible}
          tabIndex={!disabled && chromeReady && hasPreviousScene && arrowsVisible ? 0 : -1}
          data-testid="timeline-previous"
          style={{
            pointerEvents:
              hasPreviousScene && chromeReady && arrowsVisible ? "auto" : "none",
          }}
        >
          <img src="/svg/left%20arrow.svg" alt="" />
        </motion.button>

        <DecadeLabel
          label={currentLabel}
          currentDisabled={currentDisabled}
          showLabel={expandPhase === "collapsed" || expandPhase === "preOpening"}
          onExpand={() => {
            onActivity();
            startOpen();
          }}
          openTimeline={currentCopy.openTimeline}
        />

        <motion.button
          type="button"
          className="timeline__arrow timeline__arrow--next"
          initial={false}
          animate={nextArrowState}
          variants={nextArrowVariants}
          onClick={() => {
            handleCollapsedStep(1);
          }}
          aria-label={currentCopy.nextDecade}
          aria-keyshortcuts="ArrowRight"
          disabled={disabled || !chromeReady || expandPhase !== "collapsed" || !hasNextScene}
          aria-hidden={!hasNextScene || !arrowsVisible}
          tabIndex={!disabled && chromeReady && hasNextScene && arrowsVisible ? 0 : -1}
          data-testid="timeline-next"
          style={{
            pointerEvents: hasNextScene && chromeReady && arrowsVisible ? "auto" : "none",
          }}
        >
          <img src="/svg/right%20arrow.svg" alt="" />
        </motion.button>
      </div>
    </motion.nav>
  );
}
