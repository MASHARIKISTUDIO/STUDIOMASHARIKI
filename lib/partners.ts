/**
 * Studios and directors Studio Mashariki has worked with.
 *
 * Logos live in `public/partners/`, downscaled to a 480px longest edge from the
 * originals in `assets/testimonials/attachments/`. The source files were
 * 1.5-2.3 MB each, which is untenable for a strip that renders every logo above
 * the fold; `assets/` remains the untouched master copy.
 *
 * All four are transparent PNGs (verified alpha = 0 in the corners), so they sit
 * directly on the black surface with no plate behind them.
 */

export type Partner = {
  /** Company/brand name, used as the accessible label. */
  name: string;
  /** Path under `public/`. */
  logo: string;
  /**
   * Intrinsic dimensions after downscaling. Passed to `next/image` so the
   * marquee reserves the right space and does not reflow as logos decode.
   */
  width: number;
  height: number;
};

export const PARTNERS: readonly Partner[] = [
  {
    name: "Midoh Films",
    logo: "/partners/midoh-films.png",
    width: 480,
    height: 480,
  },
  {
    name: "Slim Director",
    logo: "/partners/slim-director.png",
    width: 480,
    height: 320,
  },
  {
    name: "Director Bito",
    logo: "/partners/director-bito.png",
    width: 320,
    height: 480,
  },
] as const;

/**
 * Studio Mashariki's own mark, deliberately NOT in `PARTNERS`.
 *
 * `STUDIO LOGO.png` was in the same attachments folder as the partner logos, but
 * putting our own logo in a "worked with" strip would claim we are our own
 * client. It is exported here for the header and for the watermark instead.
 */
export const STUDIO_LOGO = {
  src: "/mashariki-studios-logo.png",
  width: 480,
  height: 480,
} as const;
