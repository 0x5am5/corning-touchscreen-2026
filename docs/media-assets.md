# Media Assets

Guidance for adding or replacing video files in the kiosk app.

## Goals

- Keep the delivered experience visually loss-minimal.
- Preserve the display raster at `3840x2160` unless there is an explicit product decision to ship lower resolution.
- Reduce file size and decode cost enough for smooth kiosk playback.
- Keep source masters out of the shipped app bundle.

## Current App Constraints

- Transition videos are loaded directly from `public/`.
- The app seeks within some clips for jump transitions, so delivery files must remain seek-friendly.
- Browser and Tauri compatibility matter more than chasing the smallest possible encode.

## Rules

1. Keep original masters outside `public/` and outside git when possible. Ship delivery encodes, not edit masters.
2. Do not place temporary exports, alternate versions, or research folders under `public/`.
3. Remove audio tracks from shipped transition and screensaver files unless audio is explicitly required.
4. Add `faststart` metadata so MP4 playback can begin without waiting on the file tail.
5. Prefer H.264 MP4 for the default shipped asset because it is the safest decode path across browsers and WebViews.
6. Use frequent keyframes so timeline seeking remains responsive.

## Recommended Delivery Encode

Use this as the default starting point for new 4K source files:

```bash
ffmpeg -i input.mov \
  -an \
  -c:v libx264 \
  -preset slow \
  -crf 18 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -g 25 \
  -keyint_min 25 \
  -sc_threshold 0 \
  output.mp4
```

Notes:

- `-crf 18` is the default quality target for kiosk delivery. If a clip still looks oversized after review, test `19` or `20`.
- `-g 25` keeps a keyframe about every second at the app's current `25 fps`.
- `-an` strips unused audio.
- `-movflags +faststart` improves start time.

For repeatable repo-local encoding, use:

```bash
scripts/encode-kiosk-video.sh input.mov output.mp4
```

Optional arguments:

- third arg: CRF, defaults to `18`
- fourth arg: preset, defaults to `slow`

## Optional HEVC Pass

If the target deployment hardware is fixed and fully validated, an HEVC version can cut file size further:

```bash
ffmpeg -i input.mov \
  -an \
  -c:v libx265 \
  -preset slow \
  -crf 20 \
  -tag:v hvc1 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  output-hevc.mp4
```

Only ship HEVC after verifying seek behavior and playback stability in the actual kiosk runtime.

## Review Checklist

Before committing a new video asset:

1. Check codec, bitrate, duration, and raster:

```bash
ffprobe -v error \
  -select_streams v:0 \
  -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,bit_rate \
  -show_entries format=filename,size,duration,bit_rate \
  -of json public/your-file.mp4
```

2. Confirm the file is actually referenced from `src/`.
3. Verify there are no duplicate exports or old alternates left in `public/`.
4. Run `bun run build`.
5. Manually test playback, loop behavior, and jump-transition seeking in the kiosk app.

## Heuristics

- Short 4-second transitions should not need triple-digit Mbps bitrates to look good in this app.
- If a file is visually static or graphic-heavy, it should compress very well.
- If a clip is used only as a hold state or background plate, consider whether a still image is sufficient.
- If multiple alternate exports exist, keep only the version that is referenced by the app.
