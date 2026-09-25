/**
 * Decorative full-bleed video behind a hero.
 *
 * Muted, looping, and hidden when the visitor prefers reduced motion so the
 * gradient treatment underneath stays the readable fallback.
 */
export function HeroVideo({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 motion-reduce:hidden">
      <video
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        src={src}
        className="size-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-950 to-transparent"
      />
    </div>
  );
}
