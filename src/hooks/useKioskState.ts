import { useReducer } from "react";

import {
  getAdjacentTransitionStep,
  getProjectedSceneId,
  getSceneDistance,
  getSceneIndex,
  getTransitionStep,
  sceneList,
  type DecadeId,
  type Language,
  type PlaybackState,
  type TransitionStep,
} from "../data/experience";

export type FlashState = "idle" | "cover" | "reveal";
export type SessionMode = "interactive" | "screensaver";

export interface ExperienceState {
  activeTransition: TransitionStep | null;
  activityToken: number;
  currentSceneId: DecadeId;
  flashState: FlashState;
  flashTarget: DecadeId | null;
  language: Language;
  playbackState: PlaybackState;
  sessionMode: SessionMode;
  uiResetToken: number;
}

export type ExperienceAction =
  | { type: "activateScreensaver" }
  | { type: "dismissScreensaverAndReset" }
  | { type: "navigate"; targetId: DecadeId }
  | { type: "registerActivity" }
  | { type: "setLanguage"; language: Language }
  | { type: "toggleCallout" }
  | { type: "closeCallout" }
  | { type: "calloutOpened" }
  | { type: "calloutClosed" }
  | { type: "transitionComplete" }
  | { type: "transitionFailed" }
  | { type: "flashMidpoint" }
  | { type: "flashComplete" };

export const SCREENSAVER_RESET_SCENE_ID: DecadeId = "1940s";

const initialState: ExperienceState = {
  activeTransition: null,
  activityToken: 0,
  currentSceneId: SCREENSAVER_RESET_SCENE_ID,
  flashState: "idle",
  flashTarget: null,
  language: "en",
  playbackState: "scenePaused",
  sessionMode: "interactive",
  uiResetToken: 0,
};

/**
 * Resolves the adjacent transition step for a given scene and direction.
 * Returns null if navigation would go out of bounds.
 */
export function getAdjacentTransition(sceneId: DecadeId, direction: -1 | 1) {
  const nextSceneIndex = getSceneIndex(sceneId) + direction;

  if (nextSceneIndex < 0 || nextSceneIndex >= sceneList.length) {
    return null;
  }

  return getAdjacentTransitionStep(
    sceneId,
    sceneList[nextSceneIndex].id,
  );
}

function beginSceneTransition(
  state: ExperienceState,
  from: DecadeId,
  to: DecadeId,
) {
  try {
    return {
      ...state,
      activeTransition: getTransitionStep(from, to),
      flashState: "idle" as FlashState,
      flashTarget: null,
      playbackState: "transitioning" as PlaybackState,
    };
  } catch {
    return beginFlashJump(state, to);
  }
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
  if (state.sessionMode === "screensaver") {
    switch (action.type) {
      case "activateScreensaver":
        return state;

      case "dismissScreensaverAndReset":
        return {
          ...state,
          activeTransition: null,
          activityToken: state.activityToken + 1,
          currentSceneId: SCREENSAVER_RESET_SCENE_ID,
          flashState: "idle",
          flashTarget: null,
          playbackState: "scenePaused",
          sessionMode: "interactive",
          uiResetToken: state.uiResetToken + 1,
        };

      case "registerActivity":
        return state;

      default:
        return state;
    }
  }

  switch (action.type) {
    case "activateScreensaver":
      return {
        ...state,
        activeTransition: null,
        flashState: "idle",
        flashTarget: null,
        playbackState: "scenePaused",
        sessionMode: "screensaver",
      };

    case "dismissScreensaverAndReset":
      return {
        ...state,
        activeTransition: null,
        activityToken: state.activityToken + 1,
        currentSceneId: SCREENSAVER_RESET_SCENE_ID,
        flashState: "idle",
        flashTarget: null,
        playbackState: "scenePaused",
        uiResetToken: state.uiResetToken + 1,
      };

    case "registerActivity":
      return {
        ...state,
        activityToken: state.activityToken + 1,
      };

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
        return distance > 1
          ? beginSceneTransition(state, navigationOrigin, action.targetId)
          : state;
      }

      return beginSceneTransition(state, navigationOrigin, action.targetId);
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

      if (state.playbackState === "calloutOpening" || state.playbackState === "calloutClosing") {
        return state;
      }

      return {
        ...state,
        playbackState:
          state.playbackState === "calloutOpen"
            ? "calloutClosing"
            : "calloutOpening",
      };

    case "closeCallout":
      if (state.playbackState !== "calloutOpen") {
        return state;
      }

      return {
        ...state,
        playbackState: "calloutClosing",
      };

    case "calloutOpened":
      if (state.playbackState !== "calloutOpening") {
        return state;
      }

      return {
        ...state,
        playbackState: "calloutOpen",
      };

    case "calloutClosed":
      if (state.playbackState !== "calloutClosing") {
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

    case "transitionFailed":
      if (!state.activeTransition) {
        return state;
      }

      return beginFlashJump(
        {
          ...state,
          activeTransition: null,
        },
        state.activeTransition.to,
      );

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

/**
 * Manages the core kiosk experience state machine including scene navigation,
 * transitions, screensaver mode, language selection, and callout state.
 */
export function useKioskState() {
  return useReducer(reducer, initialState);
}
