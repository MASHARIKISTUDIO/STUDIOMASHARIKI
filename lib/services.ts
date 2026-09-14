import {
  AudioLines,
  CalendarDays,
  Camera,
  FileText,
  Film,
  LayoutGrid,
  type LucideIcon,
  Mic,
  Palette,
  SlidersHorizontal,
  Video,
  WandSparkles,
} from "lucide-react";
import type { GalleryCategory } from "@/convex/categories";

/**
 * What Studio Mashariki sells, in the order the homepage grid shows it.
 *
 * Single source of truth for BOTH the services grid and the "Services" dropdown
 * in the site header. Two hardcoded copies of an eleven-item list would drift
 * the first time a service is renamed.
 *
 * Note the relationship to `convex/categories.ts`: that module is the *gallery*
 * taxonomy (what a piece of delivered work is filed under), this one is the
 * *service* menu (what someone can hire us for). They overlap but are not the
 * same list - "Mixing & Mastering" is a service with no gallery category, and
 * "Choir Chorals" is a gallery category with no standalone service card. Where
 * a service does map onto categories, it links to them via `categoryLinks`
 * rather than duplicating their copy.
 */

export type ServiceLink = {
  label: string;
  category: GalleryCategory;
};

export type Service = {
  /** URL-safe id, also the expected thumbnail filename. */
  slug: string;
  /** Title case in the data, uppercased by CSS at render time. */
  title: string;
  /**
   * The one or two short lines under the title. Kept as an array because the
   * design sets them as separate lines, not a wrapped paragraph.
   */
  lines: string[];
  icon: LucideIcon;
  /**
   * Thumbnail under `public/services/`.
   *
   * `null` for every service today because the repository ships no studio
   * photography - only the logo and three partner marks live in `public/`. The
   * cards render a branded gradient tile in the meantime; drop a file in and set
   * this to `/services/<slug>.jpg` to light it up. Keep them ~16:9 and under
   * ~150KB, as the grid renders all eleven at once.
   */
  image: string | null;
  /**
   * Where the card, the header dropdown and the menu panel all go.
   *
   * Every service has its own landing page. Booking is a top-level route
   * (`/book-a-session`) because it also sits in the primary nav; the rest live
   * under `/services/<slug>`.
   */
  href: string;
  /**
   * Gallery categories to surface as links inside the card, for services that
   * map onto the delivery taxonomy. This is what keeps the category pages
   * linked from the homepage now that the old 12-tile category grid is gone.
   */
  categoryLinks?: ServiceLink[];
};

export const SERVICES: readonly Service[] = [
  {
    slug: "book-a-session",
    title: "Book a Session",
    lines: ["Create. Record. Bring", "your vision to life."],
    icon: Mic,
    image: null,
    href: "/book-a-session",
  },
  {
    slug: "mixing-and-mastering",
    title: "Mixing & Mastering",
    lines: ["Polish your sound.", "Professional results."],
    icon: SlidersHorizontal,
    image: null,
    href: "/services/mixing-and-mastering",
  },
  {
    slug: "beat-production",
    title: "Beat Production",
    lines: ["Original beats. Your vibe."],
    icon: AudioLines,
    image: null,
    href: "/services/beat-production",
  },
  {
    slug: "video-production",
    title: "Video Production",
    lines: ["Music videos, Reels,", "Adverts etc."],
    icon: Video,
    image: null,
    href: "/services/video-production",
    categoryLinks: [
      { label: "Music Videos", category: "music-videos" },
      { label: "Choir Chorals", category: "choir-chorals" },
    ],
  },
  {
    /**
     * The widest card in the design. Instead of a blurb it lists the occasions
     * we cover, and each one is a real link to that category's landing page.
     */
    slug: "events",
    title: "Events",
    lines: [],
    icon: CalendarDays,
    image: null,
    href: "/services/events",
    categoryLinks: [
      { label: "Weddings", category: "arusi" },
      { label: "Burials", category: "funeral" },
      { label: "Ruracio", category: "ruracio" },
      { label: "Anniversaries", category: "anniversaries" },
      { label: "Graduations", category: "graduations" },
      { label: "Social Media Reels", category: "social-media-reels" },
      { label: "Corporate Events", category: "events" },
    ],
  },
  {
    slug: "video-editing-and-colour-grading",
    title: "Video Editing & Colour Grading",
    lines: ["Turn raw footage into magic.", "Cinematic edits. Perfect colours."],
    icon: Film,
    image: null,
    href: "/services/video-editing-and-colour-grading",
  },
  {
    slug: "motion-graphic-designs",
    title: "Motion Graphic Designs",
    lines: ["Logos. Lyric Videos. Animations.", "Visuals that speak."],
    icon: WandSparkles,
    image: null,
    href: "/services/motion-graphic-designs",
  },
  {
    slug: "graphic-design",
    title: "Graphic Design",
    lines: ["Flyers. Posters. Logos.", "Branding. Social Media."],
    icon: Palette,
    image: null,
    href: "/services/graphic-design",
  },
  {
    slug: "beat-making",
    title: "Beat Making",
    lines: ["Crafting beats from scratch.", "Your sound, your way."],
    icon: LayoutGrid,
    image: null,
    href: "/services/beat-making",
  },
  {
    slug: "photography",
    title: "Photography",
    lines: ["Events. Portraits. Products.", "Stories in every shot."],
    icon: Camera,
    image: null,
    href: "/services/photography",
  },
  {
    slug: "script-writing",
    title: "Script Writing",
    lines: ["Ideas to scripts.", "Stories that hit."],
    icon: FileText,
    image: null,
    href: "/services/script-writing",
  },
] as const;
