import { useEffect } from "react";

import {
  getNextLanguage,
  getSceneIndex,
  sceneList,
  type DecadeId,
  type Language,
  type PlaybackState,
} from "../data/experience";
import type { FlashState } from "./useKioskState";

const modifierOnlyKeys = new Set([
  "Alt",
  "AltGraph",
  "Control",
  "Meta",
  "Shift",
]);

function isModifierOnlyKey(event: KeyboardEvent) {
  return modifierOnlyKeys.has(event.key);
}

interface KeyboardShortcutsConfig {
  chromeInteractive: boolean;
  currentSceneId: DecadeId;
  flashState: FlashState;
  isLanguageMenuOpen: boolean;
  language: Language;
  playbackState: PlaybackState;
  screensaverActive: boolean;
  onCloseCallout: () => void;
  onCloseLanguageMenu: () => void;
  onNavigate: (targetId: DecadeId) => void;
  onRegisterActivity: () => void;
  onSetLanguage: (language: Language) => void;
  onToggleCallout: () => void;
}

/**
 * Registers keyboard shortcuts for the kiosk experience: arrow keys for
 * navigation, space for callout toggle, escape for dismissals, and 'a'
 * for language cycling.
 */
export function useKeyboardShortcuts({
  chromeInteractive,
  currentSceneId,
  flashState,
  isLanguageMenuOpen,
  language,
  playbackState,
  screensaverActive,
  onCloseCallout,
  onCloseLanguageMenu,
  onNavigate,
  onRegisterActivity,
  onSetLanguage,
  onToggleCallout,
}: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (screensaverActive || event.repeat) {
        return;
      }

      if (isModifierOnlyKey(event)) {
        return;
      }

      const isSpaceKey =
        event.key === " " ||
        event.key === "Spacebar" ||
        event.code === "Space";

      if (event.key === "Escape" && isLanguageMenuOpen) {
        onRegisterActivity();
        event.preventDefault();
        onCloseLanguageMenu();
        return;
      }

      if (event.key.toLowerCase() === "a") {
        onRegisterActivity();
        event.preventDefault();
        onCloseLanguageMenu();
        onSetLanguage(getNextLanguage(language));
        return;
      }

      if (isLanguageMenuOpen) {
        return;
      }

      if (event.key === "Escape" && playbackState === "calloutOpen") {
        onRegisterActivity();
        event.preventDefault();
        onCloseCallout();
        return;
      }

      if (
        isSpaceKey &&
        flashState === "idle" &&
        (playbackState === "scenePaused" || playbackState === "calloutOpen")
      ) {
        onRegisterActivity();
        event.preventDefault();
        onToggleCallout();
        return;
      }

      if (!chromeInteractive) {
        return;
      }

      if (event.key === "ArrowLeft") {
        onRegisterActivity();
        event.preventDefault();
        const nextIndex = getSceneIndex(currentSceneId) - 1;

        if (nextIndex >= 0) {
          onNavigate(sceneList[nextIndex].id);
        }

        return;
      }

      if (event.key === "ArrowRight") {
        onRegisterActivity();
        event.preventDefault();
        const nextIndex = getSceneIndex(currentSceneId) + 1;

        if (nextIndex < sceneList.length) {
          onNavigate(sceneList[nextIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    chromeInteractive,
    currentSceneId,
    flashState,
    isLanguageMenuOpen,
    language,
    onCloseCallout,
    onCloseLanguageMenu,
    onNavigate,
    onRegisterActivity,
    onSetLanguage,
    onToggleCallout,
    playbackState,
    screensaverActive,
  ]);
}
