import {
  startTransition,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import { SceneStage } from "./SceneStage";
import { TimelineNav } from "./TimelineNav";
import {
  getProjectedSceneId,
  getSceneDistance,
  getSceneIndex,
  getTransitionStep,
  sceneList,
  scenes,
  type DecadeId,
  type Language,
  type PlaybackState,
  type TransitionStep,
} from "../data/experience";
import { preloadSceneStills } from "../lib/stillPreload";
import { e2eSettings, formatDataState } from "../lib/e2e";

type FlashState = "idle" | "cover" | "reveal";

interface ExperienceState {
  activeTransition: TransitionStep | null;
  currentSceneId: DecadeId;
  flashState: FlashState;
  flashTarget: DecadeId | null;
  language: Language;
  playbackState: PlaybackState;
}

type ExperienceAction =
  | { type: "navigate"; targetId: DecadeId }
  | { type: "setLanguage"; language: Language }
  | { type: "toggleCallout" }
  | { type: "closeCallout" }
  | { type: "transitionComplete" }
  | { type: "flashMidpoint" }
  | { type: "flashComplete" };

const shouldHideCursor = import.meta.env.PROD;

const initialState: ExperienceState = {
  activeTransition: null,
  currentSceneId: "1940s",
  flashState: "idle",
  flashTarget: null,
  language: "en",
  playbackState: "scenePaused",
};

function getNextLanguage(language: Language): Language {
  return language === "en" ? "zh" : "en";
}

function getAdjacentTransition(sceneId: DecadeId, direction: -1 | 1) {
  const nextSceneIndex = getSceneIndex(sceneId) + direction;

  if (nextSceneIndex < 0 || nextSceneIndex >= sceneList.length) {
    return null;
  }

  return getTransitionStep(sceneId, sceneList[nextSceneIndex].id);
}

function beginAdjacentTransition(
  state: ExperienceState,
  from: DecadeId,
  to: DecadeId,
) {
  return {
    ...state,
    activeTransition: getTransitionStep(from, to),
    flashState: "idle" as FlashState,
    flashTarget: null,
    playbackState: "transitioning" as PlaybackState,
  };
}

function beginFlashJump(state: ExperienceState, targetId: DecadeId) {
  return {
    ...state,
    activeTransition: null,
    flashState: "cover" as FlashState,
    flashTarget: targetId,
    playbackState: "scenePaused" as PlaybackState,
  };
}

function reducer(state: ExperienceState, action: ExperienceAction): ExperienceState {
  switch (action.type) {
    case "navigate": {
      const navigationOrigin = getProjectedSceneId(
        state.currentSceneId,
        state.activeTransition,
        state.flashTarget,
      );
      const distance = getSceneDistance(navigationOrigin, action.targetId);

      if (distance === 0) {
        if (state.playbackState === "transitioning" || state.flashState !== "idle") {
          return state;
        }

        return {
          ...state,
          playbackState: "scenePaused",
        };
      }

      if (state.playbackState === "transitioning") {
        return distance > 1 ? beginFlashJump(state, action.targetId) : state;
      }

      if (distance === 1) {
        return beginAdjacentTransition(state, navigationOrigin, action.targetId);
      }

      return beginFlashJump(state, action.targetId);
    }

    case "setLanguage":
      return {
        ...state,
        language: action.language,
      };

    case "toggleCallout":
      if (state.playbackState === "transitioning" || state.flashState !== "idle") {
        return state;
      }

      return {
        ...state,
        playbackState:
          state.playbackState === "calloutOpen" ? "scenePaused" : "calloutOpen",
      };

    case "closeCallout":
      if (state.playbackState !== "calloutOpen") {
        return state;
      }

      return {
        ...state,
        playbackState: "scenePaused",
      };

    case "transitionComplete": {
      if (!state.activeTransition) {
        return state;
      }

      return {
        ...state,
        activeTransition: null,
        currentSceneId: state.activeTransition.to,
        flashState: "idle",
        flashTarget: null,
        playbackState: "scenePaused",
      };
    }

    case "flashMidpoint":
      if (state.flashState !== "cover" || !state.flashTarget) {
        return state;
      }

      return {
        ...state,
        currentSceneId: state.flashTarget,
        flashState: "reveal",
        flashTarget: null,
      };

    case "flashComplete":
      if (state.flashState === "idle") {
        return state;
      }

      return {
        ...state,
        flashState: "idle",
      };

    default:
      return state;
  }
}

export function KioskExperience() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) {
      return;
    }

    let disposed = false;

    void import("@tauri-apps/api/window")
      .then(async ({ getCurrentWindow }) => {
        if (disposed) {
          return;
        }

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
    if (state.flashState !== "cover") {
      return;
    }

    const midpointTimer = window.setTimeout(() => {
      dispatch({ type: "flashMidpoint" });
    }, e2eSettings.flashCoverDurationMs);

    return () => {
      window.clearTimeout(midpointTimer);
    };
  }, [state.flashState]);

  useEffect(() => {
    if (state.flashState !== "reveal") {
      return;
    }

    const completeTimer = window.setTimeout(() => {
      dispatch({ type: "flashComplete" });
    }, e2eSettings.flashRevealDurationMs);

    return () => {
      window.clearTimeout(completeTimer);
    };
  }, [state.flashState]);

  const currentScene = scenes[state.currentSceneId];
  const projectedSceneId = useMemo(
    () =>
      getProjectedSceneId(
        state.currentSceneId,
        state.activeTransition,
        state.flashTarget,
      ),
    [
      state.activeTransition,
      state.currentSceneId,
      state.flashTarget,
    ],
  );
  const projectedIndex = getSceneIndex(projectedSceneId);
  const uiVisible =
    state.playbackState !== "transitioning" &&
    state.flashState === "idle";
  const isCalloutOpen = state.playbackState === "calloutOpen";
  const chromeVisible = uiVisible && !isCalloutOpen;
  const controlsDisabled = !uiVisible;
  const chromeDisabled = controlsDisabled || isCalloutOpen;
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

  const interfaceCopy = useMemo(
    () => ({
      en: {
        timeline: "Historical display timeline",
        language: "Language",
      },
      zh: {
        timeline: "历史显示时间线",
        language: "语言",
      },
    }),
    [],
  );

  const currentCopy = interfaceCopy[state.language];

  const handleNavigate = (targetId: DecadeId) => {
    startTransition(() => {
      dispatch({ type: "navigate", targetId });
    });
  };

  const handleStep = (direction: -1 | 1) => {
    const nextIndex = projectedIndex + direction;

    if (nextIndex < 0 || nextIndex >= sceneList.length) {
      return;
    }

    handleNavigate(sceneList[nextIndex].id);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const isSpaceKey =
        event.key === " " ||
        event.key === "Spacebar" ||
        event.code === "Space";

      if (event.key === "Escape" && state.playbackState === "calloutOpen") {
        event.preventDefault();
        dispatch({ type: "closeCallout" });
        return;
      }

      if (
        isSpaceKey &&
        state.flashState === "idle" &&
        state.playbackState !== "transitioning"
      ) {
        event.preventDefault();
        dispatch({ type: "toggleCallout" });
        return;
      }

      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        dispatch({
          type: "setLanguage",
          language: getNextLanguage(state.language),
        });
        return;
      }

      if (chromeDisabled) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleStep(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleStep(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [chromeDisabled, handleStep, state.flashState, state.language, state.playbackState]);

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
      data-ui-visible={formatDataState(uiVisible)}
    >
      <SceneStage
        controlsDisabled={controlsDisabled}
        currentScene={currentScene}
        destinationScene={destinationScene}
        language={state.language}
        playbackState={state.playbackState}
        activeTransition={state.activeTransition}
        previousTransition={previousTransition}
        nextTransition={nextTransition}
        uiVisible={uiVisible}
        onTransitionSettled={() => dispatch({ type: "transitionComplete" })}
        onToggleCallout={() => dispatch({ type: "toggleCallout" })}
      />

      <div
        className={`experience-shell__flash ${
          state.flashState === "cover"
            ? "experience-shell__flash--cover"
            : state.flashState === "reveal"
              ? "experience-shell__flash--reveal"
              : ""
        }`}
        aria-hidden="true"
        data-testid="experience-flash"
        data-flash-state={state.flashState}
      />

      <header className="experience-header">
        <img
          src="/svg/logo.svg"
          alt="Corning"
          className="brand-pill__logo brand-pill__logo--asset"
        />
      </header>

      <div
        className={`timeline-wrap ${chromeVisible ? "timeline-wrap--visible" : ""}`}
        data-testid="timeline-wrap"
        data-visible={formatDataState(chromeVisible)}
      >
        <div aria-label={currentCopy.timeline}>
          <TimelineNav
            ariaLabel={currentCopy.timeline}
            disabled={chromeDisabled}
            language={state.language}
            scenes={sceneList}
            activeSceneId={state.currentSceneId}
            projectedSceneId={projectedSceneId}
            onNavigate={handleNavigate}
            onStep={handleStep}
          />
        </div>
      </div>

      <div
        className={`language-switch-wrap ${chromeVisible ? "language-switch-wrap--visible" : ""}`}
        data-testid="language-switch-wrap"
        data-visible={formatDataState(chromeVisible)}
      >
        <div role="group" aria-label={currentCopy.language}>
          <button
            type="button"
            className={`language-switch__button language-switch__button--en ${
              state.language === "en" ? "language-switch__button--active" : ""
            }`}
            disabled={chromeDisabled}
            onClick={() => dispatch({ type: "setLanguage", language: "en" })}
            aria-label="English"
            aria-keyshortcuts="A"
          >
            <img
              src="/svg/english%20translation.svg"
              alt=""
              className="language-switch__icon language-switch__icon--asset language-switch__icon--en"
            />
          </button>
          <button
            type="button"
            className={`language-switch__button language-switch__button--zh ${
              state.language === "zh" ? "language-switch__button--active" : ""
            }`}
            disabled={chromeDisabled}
            onClick={() => dispatch({ type: "setLanguage", language: "zh" })}
            aria-label="Chinese"
            aria-keyshortcuts="A"
          >
            <img
              src="/svg/chinesse%20translation.svg"
              alt=""
              className="language-switch__icon language-switch__icon--asset language-switch__icon--zh"
            />
          </button>
        </div>
      </div>
    </main>
  );
}
