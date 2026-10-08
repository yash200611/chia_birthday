# Doji's Fifteenth Summer

A mobile-first birthday film and interactive five-chapter story for Doji:

1. User-started full-screen film with all nine photos, cinematic dissolves, scene progress, pause, replay, skip, and reduced-motion support
2. Sunset opening with overlapping Polaroids
3. “Previously, in your life…” filmstrip
4. Draggable desktop / scroll-safe mobile scrapbook
5. Exactly 15 message reveals, a sibling letter, 15-candle cake, wish, confetti, and replay

The nine supplied photos are preserved in the workspace as `File 1.jpeg` through `File 9.jpeg`. Web-ready copies live in `dist/assets/photos/` and are used by the site. The full uncropped image is always available in the photo viewer.

## Personalize everything in one place

Edit [`dist/content.js`](dist/content.js). The labeled sections contain:

- `sister`: her name, display name, age, and optional birthday date
- `sender`: your name and handwritten sign-off
- `hero`: the featured and Polaroid photo IDs
- `film`: scene order and scene timing for the full-screen birthday film
- `timeline`: ordered photos for the recap
- `scrapbook`: the draggable photo collection
- `messages`: exactly 15 birthday notes
- `letter`: the final sibling letter
- `audio`: optional owned/licensed local audio or a separate official music embed
- `bonusScene`: optional hidden seashell scene

The current copy is complete and personalized for Doji. It stays intentionally general where no real memory details were supplied, so you can safely replace any line with a more specific family story later.

## Add or replace photos

1. Copy JPG files into `dist/assets/photos/`.
2. Add or update the corresponding record in `dist/content.js`.
3. Give each photo a stable `id`, `path`, meaningful `alt`, `shortCaption`, optional `longMemory`, `chapterLabel`, and `focalPoint` such as `"50% 35%"`.
4. Reference the record from `timeline`, `scrapbook`, or `hero.polaroidPhotoIds`.

The arrays can grow or shrink. Portrait and landscape images are detected automatically, later images lazy-load, and a styled non-personal placeholder appears if any file is unavailable.

## Music

The site offers the official Spotify embed for “Feather” by Sabrina Carpenter. It loads only after a visitor chooses to load it, may require a Spotify login, and stays separate from the photo film rather than being synchronized to it.

To use a local track you own or are allowed to use, place it in `dist/assets/audio/`, then edit:

Put a track you own or are allowed to use in `dist/assets/audio/`, then edit:

```js
audio: {
  enabled: true,
  src: "assets/audio/your-track.mp3",
  label: "Track title",
}
```

Playback only begins after an intentional tap, the control reflects real media events, failures fall back to silence, and the visitor’s pause choice is remembered when browser storage works.

## Enable the bonus scene

Set `bonusScene.enabled` to `true` and provide both a `photo` path and `caption`. Until all three are present, the seashell Easter egg is omitted.

## Run and verify

```sh
npm run check
npm start
```

Then open `http://localhost:4173`. The dependency-free check validates the five chapters, required controls, local assets, 15 messages, and 15 candles.
