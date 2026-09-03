# Explainer Video — Global Bioenergy Watch

A 20–25 second motion-graphics explainer video (MP4, 1920×1080, 30fps) that tells visitors what Global Bioenergy Watch does. Delivered as a downloadable file; not embedded in the site yet.

## Creative direction

- **Style:** Editorial Minimal to match the site — navy/off-white palette (existing theme tokens), Sora display type + IBM Plex Mono accents, lots of negative space.
- **Motion system:** spring-in entrances with slight overshoot, clip/scale reveals for stats, wipe or slide transitions between scenes, subtle sinusoidal drift on background accents. No CSS animations — all `useCurrentFrame()` + `interpolate()`/`spring()`.
- **Motifs:** world-map/grid lines, rising bar columns, colored policy (red) vs market (blue) accent ticks echoing the site's update badges.

## Scene plan (30fps, ~660 frames)

1. **Hook (0–3s):** "Global Bioenergy Watch" logo/wordmark spring-in over dark navy, tagline "AI-powered global bioenergy outlook" fades up.
2. **Problem (3–7s):** scattered policy/market headlines flicker across a stylized world grid — "Biofuel policy moves fast. It's scattered everywhere."
3. **Product (7–14s):** animated feed of update cards with red POLICY / blue MARKET badges stacking in; jurisdiction map dots light up; counters tick (jurisdictions tracked, sources scanned).
4. **Features (14–20s):** three quick beats — charts/heat maps rise, email alert envelope, video briefing icon — each with a one-line label.
5. **Close (20–25s):** wordmark returns with "Track it all in one place." + globalbioenergywatch.org; gentle resolve, no abrupt cut.

## Technical details

- Scaffold `remotion/` in the project (bun init, remotion + @remotion/cli/renderer/bundler/transitions/google-fonts), with the NixOS compositor fix (musl binary over gnu) and ffmpeg/ffprobe symlinks per the video-creator skill.
- Fonts: Sora + IBM Plex Mono via `@remotion/google-fonts`.
- 5 scene files under `remotion/src/scenes/`, sequenced with `<TransitionSeries>` in `MainVideo.tsx`; muted render (sandbox ffmpeg lacks AAC).
- Spot-check key frames with `bunx remotion still`, fix, then render via the programmatic render script (`chromeMode: "chrome-for-testing"`, `concurrency: 1`).
- Final output: `/mnt/documents/global-bioenergy-watch-explainer.mp4`; report path and file size.

## Verification

- Render stills at scene midpoints and inspect them before the full render.
- Confirm MP4 exists, plays (ffprobe duration/resolution), and passes the mute/squint tests.
