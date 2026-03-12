# Tauri Smoke Coverage

The automated browser suite in this repository is the merge gate. Tauri smoke
coverage remains a thinner release check because desktop automation support is
not equally mature across kiosk targets.

## Windows

Use Tauri WebDriver support for a separate desktop smoke run on Windows. Keep
the scope limited to:

- app launches and opens the main window
- window is fullscreen with no decorations and is not resizable
- initial `1940s` scene renders
- one adjacent decade navigation succeeds
- language toggle succeeds
- hotspot callout opens and closes

Recommended command shape on a Windows runner:

```bash
cargo install tauri-driver --locked
tauri-driver --port 4444 --native-port 4445
```

Run that smoke suite separately from `bun run test:e2e`. The browser suite
should stay the primary gate unless the kiosk target becomes Windows-only.

## macOS

Keep macOS as a manual release smoke for now. Tauri's vendored `tauri-driver`
docs still mark macOS support as TODO / pre-alpha.

Manual checklist:

- `bun run tauri dev` launches the kiosk shell
- window opens fullscreen with no chrome
- decade navigation works forward and backward
- a non-adjacent jump completes without getting stuck
- English and Chinese toggles both work
- hotspot callout opens, animates, and closes with `Escape`
- no obvious blank stills or broken transition media
