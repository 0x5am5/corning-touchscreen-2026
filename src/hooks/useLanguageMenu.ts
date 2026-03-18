import { useEffect, useRef, useState } from "react";

import type { ChromeMotionPhase } from "../lib/chromeMotion";

interface LanguageMenuResult {
  isLanguageMenuOpen: boolean;
  languageMenuRef: React.RefObject<HTMLDivElement | null>;
  closeLanguageMenu: () => void;
  toggleLanguageMenu: () => void;
}

/**
 * Manages the language menu open/close state, including click-outside
 * dismissal and automatic closing when chrome phase changes.
 */
export function useLanguageMenu(
  chromeMotionPhase: ChromeMotionPhase,
  screensaverActive: boolean,
  uiResetToken: number,
): LanguageMenuResult {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  // Close on click outside
  useEffect(() => {
    if (!isLanguageMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (languageMenuRef.current?.contains(target)) {
        return;
      }

      setIsLanguageMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isLanguageMenuOpen]);

  // Close when chrome is not fully visible or screensaver activates
  useEffect(() => {
    if (chromeMotionPhase !== "visible" || screensaverActive) {
      setIsLanguageMenuOpen(false);
    }
  }, [chromeMotionPhase, screensaverActive]);

  // Close on UI reset
  useEffect(() => {
    setIsLanguageMenuOpen(false);
  }, [uiResetToken]);

  return {
    isLanguageMenuOpen,
    languageMenuRef,
    closeLanguageMenu: () => setIsLanguageMenuOpen(false),
    toggleLanguageMenu: () => setIsLanguageMenuOpen((v) => !v),
  };
}
