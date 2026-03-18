import type { SceneHotspot } from "../data/experience";

export const DEFAULT_HOTSPOT_OPEN_SCALE = 1.14;

export function getHotspotOpenScale(hotspot: SceneHotspot) {
  return hotspot.openState?.scale ?? DEFAULT_HOTSPOT_OPEN_SCALE;
}

export function getHotspotSurfaceOffset(
  hotspot: SceneHotspot,
  viewportWidth: number,
  viewportHeight: number,
) {
  const focus = hotspot.openState?.focus;

  if (!focus) {
    return { x: 0, y: 0 };
  }

  return {
    x: (focus.x - hotspot.trigger.x) * viewportWidth,
    y: (focus.y - hotspot.trigger.y) * viewportHeight,
  };
}

export function getHotspotStageOffset(
  hotspot: SceneHotspot,
  viewportWidth: number,
  viewportHeight: number,
) {
  const focus = hotspot.openState?.focus;

  if (!focus) {
    return { x: 0, y: 0 };
  }

  const scale = getHotspotOpenScale(hotspot);
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const triggerX = hotspot.trigger.x * viewportWidth;
  const triggerY = hotspot.trigger.y * viewportHeight;
  const focusX = focus.x * viewportWidth;
  const focusY = focus.y * viewportHeight;

  return {
    x: focusX - centerX - ((triggerX - centerX) * scale),
    y: focusY - centerY - ((triggerY - centerY) * scale),
  };
}
