function isQueryEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("e2e") === "1";
}

const enabled = import.meta.env.VITE_E2E === "1" || isQueryEnabled();

export const e2eSettings = {
  enabled,
  flashCoverDurationMs: enabled ? 120 : 1000,
  flashRevealDurationMs: enabled ? 160 : 2000,
  transitionFadeDurationMs: enabled ? 40 : 200,
  transitionHandoffDelayMs: enabled ? 160 : 0,
};

export function formatDataState(value: boolean) {
  return value ? "true" : "false";
}
