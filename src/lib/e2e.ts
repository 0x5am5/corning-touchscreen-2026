function getQueryParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

const queryParams = getQueryParams();
const enabled = import.meta.env.VITE_E2E === "1" || queryParams.get("e2e") === "1";
const screensaverTestMode = enabled && queryParams.get("screensaver") === "1";

export const e2eSettings = {
  enabled,
  flashCoverDurationMs: enabled ? 120 : 1000,
  flashRevealDurationMs: enabled ? 160 : 2000,
  inactivityTimeoutMs: screensaverTestMode ? 1500 : 15 * 60 * 1000,
  jumpTransitionHandoffDelayMs: enabled ? 180 : 0,
  longPressDurationMs: screensaverTestMode ? 240 : 2000,
  transitionArmingHoldMs: enabled ? 80 : 0,
  transitionFadeDurationMs: enabled ? 80 : 200,
  transitionHandoffDelayMs: enabled ? 160 : 0,
  transitionHandoffLeadMs: 100,
};

export function formatDataState(value: boolean) {
  return value ? "true" : "false";
}
