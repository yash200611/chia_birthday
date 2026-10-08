# Doji's Fifteenth Summer

A mobile-first birthday film and interactive five-chapter story for Doji:

1. A 59-second portrait MP4 with all nine photos, a tap-to-play premiere popup, and a download control
2. User-started interactive cut with cinematic dissolves, scene progress, pause, replay, skip, and reduced-motion support
3. Sunset opening with overlapping Polaroids
4. “Previously, in your life…” filmstrip
5. Draggable desktop / scroll-safe mobile scrapbook
6. Exactly 15 message reveals, a sibling letter, 15-candle cake, wish, confetti, and replay

The nine supplied photos are preserved in the workspace as `File 1.jpeg` through `File 9.jpeg`. Web-ready copies live in `dist/assets/photos/` and are used by the site. The full uncropped image is always available in the photo viewer.

## Personalize everything in one place

Edit [`dist/content.js`](dist/content.js). The labeled sections contain:

- `sister`: her name, display name, age, and optional birthday date
- `sender`: your name and handwritten sign-off
- `hero`: the featured and Polaroid photo IDs
- `film`: scene order and scene timing for the full-screen birthday film
- `video`: the rendered MP4 path, poster, download name, title, duration label, and soundtrack credit
- `timeline`: ordered photos for the recap
- `scrapbook`: the draggable photo collection
- `messages`: exactly 15 birthday notes
- `letter`: the final sibling letter
- `bonusScene`: optional hidden seashell scene

The current copy is complete and personalized for Doji. It stays intentionally general where no real memory details were supplied, so you can safely replace any line with a more specific family story later.

## Add or replace photos

1. Copy JPG files into `dist/assets/photos/`.
2. Add or update the corresponding record in `dist/content.js`.
3. Give each photo a stable `id`, `path`, meaningful `alt`, `shortCaption`, optional `longMemory`, `chapterLabel`, and `focalPoint` such as `"50% 35%"`.
4. Reference the record from `timeline`, `scrapbook`, or `hero.polaroidPhotoIds`.

The arrays can grow or shrink. Portrait and landscape images are detected automatically, later images lazy-load, and a styled non-personal placeholder appears if any file is unavailable.

## Birthday film

The finished film lives at `dist/assets/video/doji-fifteenth-birthday.mp4`. It is a 59-second portrait MP4 with the soundtrack mixed in. On page load, the premiere popup waits for an intentional tap before opening and playing the video. The film dialog also includes a direct download control.

To render the film again, install FFmpeg and pass its executable path to the renderer:

```sh
node scripts/render-birthday-film.mjs /absolute/path/to/ffmpeg
```

The command replaces the MP4 at the path above. Run `npm run check` afterward to verify that the rendered file, configuration, dialogs, video player, and download control are all present.

## Music

The finished film currently uses “deja vu” by Olivia Rodrigo. Make sure you have permission to share the soundtrack anywhere you publish or send the MP4.

## Enable the bonus scene

Set `bonusScene.enabled` to `true` and provide both a `photo` path and `caption`. Until all three are present, the seashell Easter egg is omitted.

## Run and verify

```sh
npm run check
npm start
```

Then open `http://localhost:4173`. The dependency-free check validates the five chapters, required controls, local assets, 15 messages, and 15 candles.
