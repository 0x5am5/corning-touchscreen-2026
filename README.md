# Corning Touchscreen 2026

Interactive kiosk experience for Corning that lets visitors move through
display history from the `1940s` through the `2020s+`, with decade navigation,
cinematic transitions, language switching, and hotspot callouts.

## Stack

- React 19
- TypeScript
- Vite
- Tauri v2
- Bun
- Playwright

## Local Development

Install dependencies:

```bash
bun install
```

Run the web app:

```bash
bun run dev
```

Run the Tauri shell:

```bash
bun run tauri dev
```

Build the web bundle:

```bash
bun run build
```

## Playwright

The main automated coverage is a Playwright CLI suite against the web runtime at
`http://127.0.0.1:1420`.

Install the Playwright browser once:

```bash
bun run test:e2e:install
```

Run the default suite:

```bash
bun run test:e2e
```

Run headed:

```bash
bun run test:e2e:headed
```

Run with the Playwright UI:

```bash
bun run test:e2e:ui
```

### Coverage Shape

- `e2e/smoke.spec.ts`: boot, branding, initial chrome, still loading, transition media
- `e2e/navigation.spec.ts`: adjacent navigation, expanded timeline, non-adjacent jumps, boundary states
- `e2e/language.spec.ts`: English/Chinese toggles via buttons and keyboard, translated hotspot copy
- `e2e/callout.spec.ts`: hotspot open/close flow, disabled states during motion, scene-specific callout content

The test harness launches the experience with `/?e2e=1`. That mode shortens
flash and transition timing and exposes stable `data-*` state hooks for waiting
on scene changes without changing production behavior.

## Desktop Smoke

Browser automation is the merge gate. Tauri smoke remains a smaller release
check because desktop automation support differs by platform.

- Windows: use Tauri WebDriver for a separate smoke layer
- macOS: keep a manual release smoke until driver support matures

Details and checklists live in
[docs/testing/tauri-smoke.md](/Users/samuelgregory/Sites/NXT/corning/touchscreen-2026/docs/testing/tauri-smoke.md).
