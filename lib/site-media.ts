/**
 * Photography slots for the homepage.
 *
 * The design is photo-led - a full-bleed control-room shot behind the hero, a
 * thumbnail on every service card, a strip of session photos in the gallery -
 * but the repository contains none of it. `public/` has the logo and three
 * partner marks; `assets/` has the same four files at full size. So each slot is
 * `null` and the UI renders a designed fallback instead of a broken image.
 *
 * To switch a slot on, drop the file into `public/` and set the path here. No
 * component changes are needed.
 *
 * Sizing guidance for whoever adds them:
 *   hero      ~2400x1350 (16:9), under ~400KB. It is the LCP element, so it is
 *             the one image worth compressing hard.
 *   services  ~800x450 (16:9), under ~150KB each - all eleven load together.
 *   gallery   ~600x600 (1:1), under ~120KB each.
 */

/**
 * Full-bleed hero background, e.g. `/hero-studio.jpg`.
 *
 * While null, the hero renders its gradient-and-glow treatment alone, which is
 * a deliberate look rather than an empty box - but the design clearly wants the
 * control-room photograph here, and the section will not match the reference
 * until it exists.
 */
export const HERO_IMAGE: string | null = null;
