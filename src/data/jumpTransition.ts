import type { DecadeId } from "./experience";

interface JumpTransitionConfig {
  forwardSrc: string;
  forwardMarkers: Record<DecadeId, number>;
  fps: number;
  reverseSrc: string;
  reverseMarkers: Record<DecadeId, number>;
}

// Marker frames come from the embedded decade guides in the V2 jump reels.
export const jumpTransitionConfig = {
  forwardSrc: "/Jump_transistions_8xspeed_forward_V2.mp4",
  fps: 25,
  forwardMarkers: {
    "1940s": 0,
    "1960s": 25,
    "1980s": 50,
    "1990s": 75,
    "2000s": 100,
    "2010s": 125,
    "202X": 149,
  },
  reverseSrc: "/reverse/Jump_transistions_8xspeed_forward_V2_reverse.mp4",
  reverseMarkers: {
    "1940s": 149,
    "1960s": 124,
    "1980s": 99,
    "1990s": 74,
    "2000s": 49,
    "2010s": 24,
    "202X": 0,
  },
} as const satisfies JumpTransitionConfig;

export function getForwardJumpMarkerFrame(sceneId: DecadeId) {
  return jumpTransitionConfig.forwardMarkers[sceneId];
}

export function getReverseJumpMarkerFrame(sceneId: DecadeId) {
  return jumpTransitionConfig.reverseMarkers[sceneId];
}

export function getJumpDurationMs(startFrame: number, endFrame: number) {
  return (Math.max(endFrame - startFrame, 1) * 1000) / jumpTransitionConfig.fps;
}
