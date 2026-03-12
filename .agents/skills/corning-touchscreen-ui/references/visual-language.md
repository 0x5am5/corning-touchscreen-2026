# Visual Language

## Source Of Truth

- Any newer user-provided Corning board or concept image: Primary authority for color, composition, and overall brand attitude.
- `src/App.css`: Canonical layout, color, panel, motion, and control styling.
- `src/components/KioskExperience.tsx`: App chrome placement for brand, timeline, and language toggle.
- `src/components/SceneStage.tsx`: Hotspot trigger and callout card composition.
- `src/components/TimelineNav.tsx`: Timeline chip and arrow interaction model.
- `public/webfonts/stylesheet.css`: Available type families and weights.
- `public/svg/`: Branded UI shapes and icons.
- `assets/Corning - Display Touchscreen and Video MVP 2026 - Frame 1.jpg`: Secondary exhibition and kiosk-layout reference.
- `assets/Corning - Display Touchscreen and Video MVP 2026 - Wireframe.jpg`: Secondary framing reference.
- `assets/Corning - Display Touchscreen and Video MVP 2026 - Rooms.jpg`: Secondary environmental reference.

When a newer board conflicts with the existing CSS, treat the board as the target aesthetic and the CSS as the current implementation constraint.

## Typography

- Use `NN Nouvelle Grotesk STD` as the default family.
- Use the available weights from `public/webfonts/stylesheet.css`:
  - `300` light
  - `500` medium
  - `700` bold
  - `800` black
  - `900` fat via `NN Nouvelle Grotesk STD Fat`
- Use bold or black for headlines, buttons, chips, callout headings, and labels.
- Use regular to medium for body copy.
- Favor large, clean editorial headlines with tight to neutral tracking.
- Keep UI labels compact and purposeful. Use uppercase only when it serves the composition; do not force every control into a techno-HUD style.
- Preserve the clean sans-serif look. Do not swap in generic system fonts unless the user asks.

## Color System

- Canonical palette for new design work:
  - Main Corning blue: `#1B45D8` to `#2347DB`
  - White: `#FFFFFF`
  - Light gray fields: use very light neutral grays close to white
  - Black: `#000000`
  - Warm yellow: use sparingly as an accent for editorial contrast
- Existing scene accent variants still appear in the current app and can inform motion or media overlays:
  - `#2c5ef6`
  - `#3c68f4`
  - `#4a72ff`
  - `#2c58e8`
  - `#4f83ff`
- Legacy app shell values still present in code:
  - `#02050b`
  - `#060b14`
- Text treatment:
  - On blue or black surfaces: `#FFFFFF`
  - On white or light-gray surfaces: use Corning blue or black
  - Legacy muted text token in the app: `rgba(238, 243, 255, 0.72)`
  - Legacy dim text token in the app: `rgba(214, 223, 247, 0.56)`
- Legacy glass and panel treatment still exists in the app code:
  - Border: `rgba(255, 255, 255, 0.14)`
  - Panel fill: `rgba(3, 8, 20, 0.66)`
  - Strong panel fill: `rgba(3, 8, 20, 0.8)`
- Use blue as the dominant UI color. Use cyan sparingly and only when it supports an existing asset or motion cue.
- Keep yellow as a small supporting accent, not a second dominant brand color.
- Favor flat color fields, framed modules, and strong contrast over translucent neon or heavy glow treatments.

## Composition Rules

- Keep the experience anchored by a full-bleed still or video stage.
- Let UI elements feel like editorial brand overlays or exhibition graphics, not generic dashboard cards.
- Float the Corning logo in a clean top-left or top-edge position unless the composition clearly benefits from another placement.
- Keep the primary navigation centered near the bottom, but prefer framed blocks, rails, or modular plates over glassy capsules.
- Place supporting controls near the perimeter with enough negative space to feel intentional and graphic.
- Attach hotspot triggers to a product or screen detail and let the information card resolve into hard-edged blue or white information plates rather than soft speech-bubble cards.
- Prefer straight edges, stepped edges, bars, triangles, and cropped geometric forms. Avoid soft consumer-app pills unless you are preserving a legacy control.
- Use asymmetry and white space confidently. The board direction is sparse, graphic, and editorial.

## Motion Rules

- Use `180ms` to `260ms` transitions for most UI state changes.
- Prefer opacity and `translate3d` for entrance and exit motion.
- Keep hover motion subtle, typically `translateY(-1px)`.
- Favor precise wipes, slides, and reveals that feel architectural and branded.
- Avoid bouncy easing, large scaling, or decorative looping motion.

## Existing UI Assets

- Brand and navigation:
  - `public/svg/logo.svg`
  - `public/svg/left arrow.svg`
  - `public/svg/right arrow.svg`
- Callout and annotation shapes:
  - `public/svg/4 trnsition lines.svg`
  - `public/svg/big text box.svg`
  - `public/svg/small text box.svg`
  - `public/svg/menu box.svg`
  - `public/svg/zoom big box.svg`
  - `public/svg/zoom small box.svg`
  - `public/svg/minus.svg`
- Language-specific graphics:
  - `public/svg/english translation.svg`
  - `public/svg/chinesse translation.svg`

Inspect these SVGs before drawing new frames, labels, or arrows. Many already reflect the blue-first modular language and should be reused whenever they fit the task.

## Design Motifs To Reuse

- Vertical blue bars and stepped blocks
- Cropped triangles and diagonal cuts
- Large fields of white or light gray interrupted by bold blue modules
- Black blocks used for weight and contrast
- Small, deliberate warm yellow accents
- Large editorial headline moments paired with smaller technical copy
- Graphic framing devices that feel like signage, print layouts, or exhibition panels

## Legacy App Notes

- The current implementation still contains dark staging, glow, and glass-panel styling in `src/App.css`.
- The live app also includes solid blue hotspot callout blocks and blue SVG controls instead of the older written description of frosted cards.
- When extending an existing screen, reuse the structure and assets already in the app.
- When restyling or designing new surfaces, move the look toward the board direction unless the user explicitly asks for the legacy dark treatment.

## Reading The Board Direction

- Use white or light-gray space as an active compositional tool, not just empty background.
- Use Corning blue as the main organizing force: bars, plates, dividers, callouts, and logo moments.
- Let black anchor the composition when it is needed, not as the constant background.
- Use yellow rarely to create contrast or spotlight a feature area.
- Let the overlays feel precise, branded, and editorial, not playful or futuristic.
- Keep the design sparse. Most screens should breathe, with only a few strong modules doing the visual work.
