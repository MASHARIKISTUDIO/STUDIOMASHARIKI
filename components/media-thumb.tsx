import type { LucideIcon } from "lucide-react";
import Image from "next/image";

/**
 * A photo slot that degrades into a branded tile.
 *
 * The repository ships no studio photography - `public/` holds the logo and
 * three partner marks and nothing else - so every service card and most gallery
 * tiles have no image to show yet. Rendering `<Image src={undefined}>` throws,
 * and rendering a path to a missing file gives a broken-image icon, so this
 * component makes "no photo yet" an explicit, designed state: a blue-tinted
 * gradient with the section's own icon ghosted into it.
 *
 * Once real images land, pass `src` and the placeholder disappears with no other
 * change at the call site.
 *
 * The parent owns the aspect ratio; this fills whatever box it is given.
 */
export function MediaThumb({
  src,
  alt,
  icon: Icon,
  sizes,
  priority = false,
}: {
  src: string | null | undefined;
  /**
   * Empty string marks the image as decorative. Use a real description when the
   * photo carries information the surrounding copy does not.
   */
  alt: string;
  icon: LucideIcon;
  sizes: string;
  priority?: boolean;
}) {
  if (src !== null && src !== undefined && src !== "") {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(120%_120%_at_20%_0%,oklch(0.282_0.091_267.935),oklch(0.16_0.03_262)_70%)]"
    >
      {/* Faint diagonal sheen, so a grid of eleven placeholders does not read as
          eleven identical flat rectangles. */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(59,130,246,0.12)_50%,transparent_65%)]" />
      <Icon className="size-8 text-blue-400/25" strokeWidth={1.5} />
    </div>
  );
}
