import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

/**
 * Generated Open Graph / Twitter card for the site root.
 *
 * Rendered at build/request time by Satori, so there is no binary asset to keep
 * in sync with the brand copy. Satori supports only a flexbox subset of CSS -
 * every element below sets `display: flex` explicitly.
 */
export const alt = `${siteConfig.name} - ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #171717 55%, #2a1a0f 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#f59e0b",
            }}
          >
            Studio Mashariki
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#a3a3a3",
            }}
          >
            {siteConfig.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 62,
            lineHeight: 1.15,
            color: "#fafafa",
            maxWidth: "960px",
          }}
        >
          Cinematic films, motion graphics and music - preserved in 4K.
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 27,
            color: "#d4d4d4",
          }}
        >
          Ruracio · Arusi · Choir Chorals · Music Videos · Graduations
        </div>
      </div>
    ),
    size,
  );
}
