---
name: corning-touchscreen-ui
description: Preserve and extend the visual language of the Corning touchscreen kiosk app. Use when Codex is asked to design, restyle, or add UI in this repository, especially full-screen kiosk layouts, timelines, language toggles, hotspot overlays, typography, color systems, graphic plates, or branded SVG treatments that should match `src/App.css`, `public/webfonts`, `public/svg`, and the concept frames in `assets/`.
---

# Corning Touchscreen UI

## Overview

Preserve and extend the Corning visual system indicated by the latest concept boards and user-provided references instead of inventing a new aesthetic. Favor a crisp editorial look built from cobalt Corning blue, white or light-gray fields, black contrast, restrained warm yellow accents, and hard-edged geometric composition. Treat the older dark glass-heavy kiosk styling in the current app as legacy implementation, not the default target, unless the user explicitly asks to preserve it.

## Start Here

- Read `references/visual-language.md` for exact tokens, asset paths, and component patterns.
- Inspect `src/App.css`, `src/components/KioskExperience.tsx`, `src/components/SceneStage.tsx`, and `src/components/TimelineNav.tsx` before changing structure.
- Treat the newest user-provided Corning board or concept image as the primary style reference when one is available in the thread.
- Use the concept boards in `assets/` as secondary references for composition, exhibition context, and kiosk framing, not as pixel-perfect wireframes.

## Working Rules

- Keep the stage full-screen and immersive, but do not default to dark HUD chrome when the task is brand-led rather than implementation-matching.
- Reuse `NN Nouvelle Grotesk STD` from `public/webfonts/` for UI copy. Introduce another typeface only when the user explicitly asks.
- Build from the existing CSS custom properties in `src/App.css`. Extend the token set when needed instead of scattering unrelated hard-coded values.
- Keep Corning blue in the `#1B45D8` to `#2347DB` range as the dominant brand color. Pair it primarily with white, light gray, and black. Use warm yellow only as a restrained supporting accent. Treat cyan as optional and secondary, not the default highlight color.
- Favor sharp geometric modules, bars, triangles, stepped blocks, and editorial whitespace over glassmorphism, soft glows, and rounded consumer-app panels.
- Reuse the supplied SVG assets when a control already has a branded version. Do not replace them with generic icon sets unless the user asks.
- Favor concise labels, bold hierarchy, and confident headline scale. Keep longer explanations inside modular content blocks or supporting overlays.
- Use restrained motion: short fades, simple slide-ins, and precise wipes or reveals. Avoid playful or spring-heavy animation.

## Implementation Pattern

1. Anchor the change in existing tokens, component classes, and asset paths.
2. Decide whether the task should preserve a specific existing screen or move the experience toward the newer editorial brand direction. Default to the newer direction when the user provides a board or asks for a restyle.
3. Build new control surfaces from flat or lightly layered brand plates, framed modules, and graphic dividers before reaching for frosted glass treatments.
4. Match the current chrome layout only when the user is extending the existing screen. Otherwise preserve the kiosk information architecture while restyling the surfaces to fit the board.
5. Verify the result against desktop kiosk sizing first, then confirm smaller-width behavior if the change affects responsive layouts.

## Deliverables

- Explain which existing tokens, assets, and patterns the work reused.
- State whether the result follows the legacy in-app treatment or the newer concept-board direction when that distinction matters.
- Update `references/visual-language.md` if the canonical palette, typography, or asset inventory changes.
