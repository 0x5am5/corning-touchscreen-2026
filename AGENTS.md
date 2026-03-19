# AGENTS.md

Instructions for AI coding agents working with this codebase.

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->

## Media Assets

- For new or replacement video files, follow [docs/media-assets.md](/Users/samuelgregory/Sites/NXT/corning/touchscreen-2026/docs/media-assets.md).
- Keep source masters and temporary exports out of `public/`; only checked, in-use delivery assets belong there.
- When reviewing `public/`, watch for unused alternates and accidentally copied folders.
- Default delivery encode for new 4K kiosk assets:
  `scripts/encode-kiosk-video.sh input.mov output.mp4`
- Default settings behind that script:
  `H.264`, `3840x2160`, `yuv420p`, `CRF 18`, `preset slow`, no audio, `+faststart`, GOP matched to source fps.
- Keep frequent keyframes because the app seeks within transition clips.
- Replace shipped assets only when the new encode is materially smaller and still passes visual playback checks.
- Known exception: the current jump-transition files did not shrink under the default conservative recipe, so do not assume every clip should be replaced automatically.
