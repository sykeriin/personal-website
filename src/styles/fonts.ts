/**
 * Self-hosted faces. The v1 site pulled five families from a render-blocking
 * Google Fonts <link>, on a page whose whole first impression is a slam cut.
 *
 * Four faces, not five: RocknRoll One is cut. It occupied the same slot as Dela
 * Gothic One — heavy display, just rounded — and everything it did is covered by
 * Dela at smaller size with letter-spacing.
 *
 * Latin subsets only. Dela Gothic One and Rampart One carry full CJK coverage
 * and run past a megabyte unsubsetted; Google's unicode-range splitting hides
 * that, and naive self-hosting would have made the site slower, not faster.
 *
 * Newsreader uses the wght-axis variable file (57KB) rather than the opsz one
 * (129KB). Optical sizing is not worth 72KB on a portfolio.
 *
 * Rampart One is deliberately absent: it is the in-world SFX face, rendered
 * through troika inside the 3D layer, so it loads with that chunk instead of
 * blocking first paint.
 */
import '@fontsource/anton/latin-400.css'
import '@fontsource-variable/newsreader/wght.css'
import '@fontsource-variable/newsreader/wght-italic.css'
import '@fontsource/space-mono/latin-400.css'
import '@fontsource/space-mono/latin-700.css'
