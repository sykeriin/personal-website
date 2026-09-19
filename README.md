# Durva Sharma — Volume 02

My personal portfolio site, live at [durva.xyz](https://www.durva.xyz).

It's built as a hand-drawn, manga-styled 3D world instead of a scrolling page: you
walk through a sequence of rooms — origin, training, projects, skill tree, and a
creative "cover B" side — clicking on props to read about the person who owns them.
The whole thing is one continuously-running React Three Fiber canvas, post-processed
through a custom two-pass ink shader (edge detection + halftone) so every surface
reads like it's been inked rather than rendered.

The site never assumes a capability it hasn't checked for. A render-tier system
detects GPU/CPU capability and screen type on load and picks between four tiers —
full 3D with the ink pipeline, 3D without post-processing, a flat/no-3D fallback, and
a plain-text/no-WebGL mode — with a small toggle to override it by hand at any time.
Phones and tablets default to the text-only mode, since a touch screen is better for
reading than for walking a room; laptops and desktops get the real hardware-based
pick.

## Stack

- **React 19 + TypeScript**, routed with `react-router-dom`
- **`@react-three/fiber`** / **`three`** for the 3D world, **`@react-three/drei`** for
  a handful of helpers
- A custom shader pipeline (`src/three/`) doing a G-buffer pass (normals + depth)
  followed by a composite pass (edge detection + halftone + bloom)
- **Vite** for dev/build, self-hosted **Fontsource** fonts (no external font requests)
- Deployed as a static site to **GitHub Pages** behind a custom domain

## Structure

```
src/
  world/        the 3D scenes, props, camera rig, and per-route manifest
  three/        the ink shader pipeline and its materials/uniforms
  components/   DOM overlays: nav tabs, reveal panels, the book reader, entry gate
  pages/        one thin route component per chapter (mostly metadata + layout)
  data/         site copy — bio, experience, projects, skills (content.ts)
  hooks/        render-tier detection, presence/time-of-day, document meta
  assets/       hand-drawn ink textures, marks, and the pixel-art character sprites
lab/            standalone dev-only pages (shader tuning, mark generation) —
                not part of the production build
```

Site copy lives entirely in [`src/data/content.ts`](src/data/content.ts); the 3D
world reads from it rather than hardcoding text, so updating a bio line or a project
blurb doesn't touch any scene code.

## Running it

```bash
npm install
npm run dev       # dev server
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
```

## Deploying

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the site and publishes `dist/` to GitHub Pages automatically. No manual
deploy step.
