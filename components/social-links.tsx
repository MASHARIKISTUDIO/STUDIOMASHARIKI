import type { SVGProps } from "react";
import { socialLinks, type SocialPlatform } from "@/lib/site";

/**
 * Social marks, drawn inline.
 *
 * Why inline instead of `lucide-react`: brand icons were removed from lucide,
 * and this project is on `lucide-react@1.40.0` where `Instagram`, `Youtube`,
 * `Facebook` and friends genuinely no longer exist. Importing them compiles to
 * `undefined` and crashes at render.
 *
 * ⚠️ These are simplified geometric marks drawn to match the stroke weight of
 * the lucide icons around them - they are NOT the official brand logos. Meta and
 * TikTok both publish brand guidelines that require their supplied assets. If
 * this site is ever brand-audited, swap in the official SVGs.
 *
 * All three are `aria-hidden`; the accessible name lives on the wrapping link.
 */

const ICON_PROPS: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function InstagramMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      {/* The flash dot. A zero-length capped line is how lucide drew these, so
          it inherits stroke width instead of needing its own radius. */}
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YouTubeMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <rect x="2" y="5" width="20" height="14" rx="4.5" />
      <path d="m10.5 9 5 3-5 3z" />
    </svg>
  );
}

function TikTokMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS} {...props}>
      {/* Note head, stem, and the flag hooking right off the top - the three
          shapes that make the mark readable at 16px. */}
      <circle cx="10" cy="14.5" r="3.5" />
      <path d="M13.5 14.5V4" />
      <path d="M13.5 4c0 2.5 2 4.5 4.5 4.5" />
    </svg>
  );
}

const MARKS: Record<
  SocialPlatform,
  (props: SVGProps<SVGSVGElement>) => React.JSX.Element
> = {
  instagram: InstagramMark,
  youtube: YouTubeMark,
  tiktok: TikTokMark,
};

export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={className}>
      {socialLinks.map(({ platform, label, href }) => {
        const Mark = MARKS[platform];
        return (
          <li key={platform}>
            <a
              href={href}
              // Third-party destination in a new tab. `noreferrer` alongside
              // `noopener` so the studio's URL is not leaked as a referrer.
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <span className="sr-only">{label}</span>
              <Mark className="size-[1.15rem]" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
