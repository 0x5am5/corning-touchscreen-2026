import { useEffect, useRef } from "react";

import { e2eSettings } from "../lib/e2e";

/**
 * Triggers a callback after a period of inactivity. The timer resets whenever
 * `activityToken` changes and only runs while `enabled` is true.
 */
export function useInactivityTimer(
  activityToken: number,
  enabled: boolean,
  onInactive: () => void,
) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      onInactive();
    }, e2eSettings.inactivityTimeoutMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activityToken, enabled, onInactive]);
}
