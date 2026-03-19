import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";
import { Globe } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SceneStage } from "./SceneStage";
import { TimelineNav } from "./TimelineNav";
import {
  isCalloutPlaybackState,
  getProjectedSceneId,
  getSceneIndex,
  interfaceCopy,
  languageOptions,
  sceneList,
  scenes,
  type DecadeId,
  type Language,
} from "../data/experience";
import {
  createChromeVariants,
  getChromeTransition,
} from "../lib/chromeMotion";
import { preloadSceneStills } from "../lib/stillPreload";
import { e2eSettings, formatDataState } from "../lib/e2e";
import {
  getAdjacentTransition,
  useKioskState,
} from "../hooks/useKioskState";
import { useChromePhaseTransitions } from "../hooks/useChromePhaseTransitions";
import { useInactivityTimer } from "../hooks/useInactivityTimer";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useLanguageMenu } from "../hooks/useLanguageMenu";

const shouldHideCursor = import.meta.env.PROD;
const modifierOnlyKeys = new Set([
  "Alt",
  "AltGraph",
  "Control",
  "Meta",
  "Shift",
]);
const SCREENSAVER_ENTER_EASE = [0.22, 1, 0.36, 1] as const;
const SCREENSAVER_EXIT_EASE = [0.4, 0, 1, 1] as const;
const SCREENSAVER_VIDEO_SRC = "/Corning_Display_Screen Saver_V1.mp4";
const LANGUAGE_CHROME_VARIANTS = createChromeVariants({ x: 56 });

function isModifierOnlyKey(event: KeyboardEvent) {
  return modifierOnlyKeys.has(event.key);
}

export function KioskExperience() {
  const [state, dispatch] = useKioskState();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const brandHoldTimerRef = useRef<number | null>(null);
  const screensaverRef = useRef<HTMLDivElement | null>(null);
  const languageMenuId = useId();

  const currentScene = scenes[state.currentSceneId];
  const projectedSceneId = useMemo(
    () =>
      getProjectedSceneId(
        state.currentSceneId,
        state.activeTransition,
        state.flashTarget,
      ),
    [state.activeTransition, state.currentSceneId, state.flashTarget],
  );
  const uiVisible =
    state.sessionMode === "interactive" &&
    state.playbackState !== "transitioning" &&
    state.flashState === "idle";
  const isCalloutActive = isCalloutPlaybackState(state.playbackState);
  const controlsDisabled = !uiVisible;
  const screensaverActive = state.sessionMode === "screensaver";
  const shouldShowSceneChrome =
    state.sessionMode === "interactive" &&
    state.playbackState !== "transitioning" &&
    state.flashState === "idle" &&
    !isCalloutActive;

  const { chromeMotionPhase, chromeVisible, chromeInteractive } =
    useChromePhaseTransitions(shouldShowSceneChrome, prefersReducedMotion);

  const shouldShowHotspot =
    state.sessionMode === "interactive" &&
    state.playbackState !== "transitioning" &&
    state.flashState === "idle";

  const { chromeMotionPhase: hotspotChromeMotionPhase } =
    useChromePhaseTransitions(shouldShowHotspot, prefersReducedMotion);

  const {
    isLanguageMenuOpen,
    languageMenuRef,
    closeLanguageMenu,
    toggleLanguageMenu,
  } = useLanguageMenu(chromeMotionPhase, screensaverActive, state.uiResetToken);

  const shellClassName = [
    "experience-shell",
    shouldHideCursor ? "experience-shell--cursor-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const previousTransition = useMemo(
    () => getAdjacentTransition(state.currentSceneId, -1),
    [state.currentSceneId],
  );
  const nextTransition = useMemo(
    () => getAdjacentTransition(state.currentSceneId, 1),
    [state.currentSceneId],
  );
  const destinationScene = state.activeTransition
    ? scenes[state.activeTransition.to]
    : null;
  const currentCopy = interfaceCopy[state.language];
  const currentLanguageOption =
    languageOptions.find((option) => option.value === state.language) ??
    languageOptions[0];
  const screensaverRootTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.46, ease: SCREENSAVER_ENTER_EASE };
  const screensaverExitTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.34, ease: SCREENSAVER_EXIT_EASE };

  // --- Stable callbacks ---

  const clearBrandHoldTimer = useCallback(() => {
    if (brandHoldTimerRef.current === null) return;
    window.clearTimeout(brandHoldTimerRef.current);
    brandHoldTimerRef.current = null;
  }, []);

  const onInactive = useCallback(() => {
    dispatch({ type: "activateScreensaver" });
  }, [dispatch]);

  const handleNavigate = useCallback((targetId: DecadeId) => {
    startTransition(() => {
      dispatch({ type: "navigate", targetId });
    });
  }, [dispatch]);

  const handleStep = useCallback((direction: -1 | 1) => {
    const nextIndex = getSceneIndex(state.currentSceneId) + direction;

    if (nextIndex < 0 || nextIndex >= sceneList.length) {
      return;
    }

    handleNavigate(sceneList[nextIndex].id);
  }, [handleNavigate, state.currentSceneId]);

  const handleBrandPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (screensaverActive) return;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    clearBrandHoldTimer();
    brandHoldTimerRef.current = window.setTimeout(() => {
      brandHoldTimerRef.current = null;
      dispatch({ type: "activateScreensaver" });
    }, e2eSettings.longPressDurationMs);
  }, [clearBrandHoldTimer, dispatch, screensaverActive]);

  const dismissScreensaver = useCallback(() => {
    dispatch({ type: "dismissScreensaverAndReset" });
  }, [dispatch]);

  const handleLanguageMenuToggle = useCallback(() => {
    dispatch({ type: "registerActivity" });
    toggleLanguageMenu();
  }, [dispatch, toggleLanguageMenu]);

  const handleLanguageChange = useCallback((language: Language) => {
    dispatch({ type: "registerActivity" });
    dispatch({ type: "setLanguage", language });
    closeLanguageMenu();
  }, [closeLanguageMenu, dispatch]);

  const onRegisterActivity = useCallback(() => {
    dispatch({ type: "registerActivity" });
  }, [dispatch]);

  const onCloseCallout = useCallback(() => {
    dispatch({ type: "closeCallout" });
  }, [dispatch]);

  const onCalloutOpened = useCallback(() => {
    dispatch({ type: "calloutOpened" });
  }, [dispatch]);

  const onCalloutClosed = useCallback(() => {
    dispatch({ type: "calloutClosed" });
  }, [dispatch]);

  const onToggleCallout = useCallback(() => {
    dispatch({ type: "toggleCallout" });
  }, [dispatch]);

  const onSetLanguage = useCallback((language: Language) => {
    dispatch({ type: "setLanguage", language });
  }, [dispatch]);

  // --- Hooks ---

  useInactivityTimer(
    state.activityToken,
    state.sessionMode === "interactive",
    onInactive,
  );

  useKeyboardShortcuts({
    chromeInteractive,
    currentSceneId: state.currentSceneId,
    flashState: state.flashState,
    isLanguageMenuOpen,
    language: state.language,
    playbackState: state.playbackState,
    screensaverActive,
    onCloseCallout,
    onCloseLanguageMenu: closeLanguageMenu,
    onNavigate: handleNavigate,
    onRegisterActivity,
    onSetLanguage,
    onToggleCallout,
  });

  // --- One-time setup effects ---

  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;

    let disposed = false;

    void import("@tauri-apps/api/window")
      .then(async ({ getCurrentWindow }) => {
        if (disposed) return;

        const appWindow = getCurrentWindow();

        await Promise.allSettled([
          appWindow.setDecorations(false),
          appWindow.setResizable(false),
          appWindow.setFullscreen(true),
        ]);
      })
      .catch(() => {
        // The web build should stay functional outside the Tauri shell.
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    preloadSceneStills();
  }, []);

  useEffect(() => {
    return () => {
      clearBrandHoldTimer();
    };
  }, [clearBrandHoldTimer]);

  // Global activity listeners
  useEffect(() => {
    const handlePointerDown = () => {
      dispatch({ type: "registerActivity" });
    };
    const handleWheel = () => {
      dispatch({ type: "registerActivity" });
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [dispatch]);

  // Flash cover → midpoint → complete
  useEffect(() => {
    if (state.flashState !== "cover") return;

    const midpointTimer = window.setTimeout(() => {
      dispatch({ type: "flashMidpoint" });
    }, e2eSettings.flashCoverDurationMs);

    return () => {
      window.clearTimeout(midpointTimer);
    };
  }, [dispatch, state.flashState]);

  useEffect(() => {
    if (state.flashState !== "reveal") return;

    const completeTimer = window.setTimeout(() => {
      dispatch({ type: "flashComplete" });
    }, e2eSettings.flashRevealDurationMs);

    return () => {
      window.clearTimeout(completeTimer);
    };
  }, [dispatch, state.flashState]);

  // Clear brand hold timer on session mode change
  useEffect(() => {
    clearBrandHoldTimer();
  }, [clearBrandHoldTimer, state.sessionMode]);

  // Screensaver keyboard/wheel handling
  useEffect(() => {
    if (state.sessionMode !== "screensaver") return;

    screensaverRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isModifierOnlyKey(event)) return;

      event.preventDefault();
      event.stopPropagation();
      dismissScreensaver();
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dismissScreensaver();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("wheel", handleWheel, true);
    };
  }, [dismissScreensaver, state.sessionMode]);

  return (
    <main
      className={shellClassName}
      data-testid="experience-shell"
      data-e2e={formatDataState(e2eSettings.enabled)}
      data-scene-id={state.currentSceneId}
      data-projected-scene-id={projectedSceneId}
      data-language={state.language}
      data-playback-state={state.playbackState}
      data-flash-state={state.flashState}
      data-active-transition-kind={state.activeTransition?.kind ?? ""}
      data-jump-direction={
        state.activeTransition?.kind === "jump"
          ? state.activeTransition.direction
          : ""
      }
      data-jump-start-frame={
        state.activeTransition?.kind === "jump"
          ? String(state.activeTransition.startFrame)
          : ""
      }
      data-jump-end-frame={
        state.activeTransition?.kind === "jump"
          ? String(state.activeTransition.endFrame)
          : ""
      }
      data-session-mode={state.sessionMode}
      data-ui-visible={formatDataState(uiVisible)}
      data-chrome-phase={chromeMotionPhase}
    >
      <SceneStage
        chromeMotionPhase={hotspotChromeMotionPhase}
        controlsDisabled={controlsDisabled}
        currentScene={currentScene}
        destinationScene={destinationScene}
        language={state.language}
        playbackState={state.playbackState}
        activeTransition={state.activeTransition}
        previousTransition={previousTransition}
        nextTransition={nextTransition}
        uiVisible={uiVisible}
        onCalloutOpened={onCalloutOpened}
        onCalloutClosed={onCalloutClosed}
        onTransitionFailed={() => dispatch({ type: "transitionFailed" })}
        onTransitionSettled={() => dispatch({ type: "transitionComplete" })}
        onToggleCallout={onToggleCallout}
      />

      <header className="experience-header">
        <button
          type="button"
          className="brand-button"
          data-testid="brand-button"
          onBlur={clearBrandHoldTimer}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
          onPointerCancel={clearBrandHoldTimer}
          onPointerDown={handleBrandPointerDown}
          onPointerLeave={clearBrandHoldTimer}
          onPointerUp={clearBrandHoldTimer}
        >
          <img
            src="/svg/logo.svg"
            alt="Corning"
            className="brand-pill__logo brand-pill__logo--asset"
          />
        </button>
      </header>

      <div
        className="timeline-wrap"
        data-testid="timeline-wrap"
        data-visible={formatDataState(chromeVisible)}
        data-chrome-phase={chromeMotionPhase}
        style={{ pointerEvents: chromeInteractive ? "auto" : "none" }}
      >
        <TimelineNav
          ariaLabel={currentCopy.timeline}
          activeSceneId={state.currentSceneId}
          chromeMotionPhase={chromeMotionPhase}
          disabled={controlsDisabled}
          language={state.language}
          onActivity={onRegisterActivity}
          onNavigate={handleNavigate}
          onStep={handleStep}
          resetSignal={state.uiResetToken}
          scenes={sceneList}
        />
      </div>

      <div
        className="language-switch-wrap"
        data-testid="language-switch-wrap"
        data-visible={formatDataState(chromeVisible)}
        data-chrome-phase={chromeMotionPhase}
        style={{ pointerEvents: chromeInteractive ? "auto" : "none" }}
      >
        <motion.div
          className="language-switch-wrap__inner"
          initial={false}
          animate={chromeMotionPhase}
          variants={LANGUAGE_CHROME_VARIANTS}
          transition={getChromeTransition(chromeMotionPhase, prefersReducedMotion)}
        >
          <div
            ref={languageMenuRef}
            className={`language-switch ${isLanguageMenuOpen ? "language-switch--open" : ""}`}
            role="group"
            aria-label={currentCopy.language}
          >
            <button
              type="button"
              className="language-switch__button"
              disabled={controlsDisabled || !chromeInteractive}
              onClick={handleLanguageMenuToggle}
              aria-controls={languageMenuId}
              aria-expanded={isLanguageMenuOpen}
              aria-haspopup="listbox"
              aria-label={`${currentCopy.languageMenuOpen}: ${currentLanguageOption.label}`}
              aria-keyshortcuts="A"
              data-testid="language-menu-button"
            >
              <Globe aria-hidden="true" className="language-switch__icon" strokeWidth={1.85} />
            </button>
            <div
              id={languageMenuId}
              className={`language-switch__menu ${isLanguageMenuOpen ? "language-switch__menu--open" : ""}`}
              role="listbox"
              aria-label={currentCopy.languageMenuLabel}
              aria-hidden={!isLanguageMenuOpen}
              data-testid="language-menu"
            >
              {languageOptions.map((option) => {
                const isActive = option.value === state.language;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    className={`language-switch__option ${
                      isActive ? "language-switch__option--active" : ""
                    }`}
                    aria-selected={isActive}
                    data-testid="language-option"
                    data-language={option.value}
                    onClick={() => handleLanguageChange(option.value)}
                  >
                    <span className="language-switch__option-label">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {screensaverActive ? (
          <motion.div
            ref={screensaverRef}
            className="screensaver"
            role="button"
            aria-label={currentCopy.screensaverPrompt}
            tabIndex={0}
            data-testid="screensaver"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{
              opacity: 1,
              transition: screensaverRootTransition,
            }}
            exit={{
              opacity: 0,
              transition: screensaverExitTransition,
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dismissScreensaver();
            }}
            onPointerDownCapture={(event) => {
              event.stopPropagation();
            }}
            onWheel={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dismissScreensaver();
            }}
          >
            <video
              className="screensaver__video"
              data-testid="screensaver-video"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              src={SCREENSAVER_VIDEO_SRC}
              aria-hidden="true"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
