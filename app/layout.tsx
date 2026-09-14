import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Bangers, Dancing_Script, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/site";
import { Providers } from "./providers";
import "./globals.css";

/**
 * `--font-sans` is the variable `app/globals.css` maps into the Tailwind theme
 * (`@theme inline { --font-sans: var(--font-sans) }`), so the CSS variable name
 * here must stay `--font-sans`.
 */
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Display script for the "Your Sound / Our Mission" accent in the header.
 *
 * Loaded for exactly two short strings, which is why it is pinned to a single
 * weight and the latin subset - the whole point of a signature flourish is lost
 * if it costs a render-blocking download of the full family. `next/font`
 * self-hosts it and emits a `size-adjust` fallback, so there is no layout shift
 * while it loads.
 */
const dancingScript = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "600",
});

/**
 * Brush / poster titles on service landing pages.
 *
 * Loaded as a single weight for the handful of H1s that use it, so the rest of
 * the site does not pay for a display face it never renders.
 */
const bangers = Bangers({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiomashariki.com";

export const metadata: Metadata = {
  // Makes every relative OG/canonical URL in child pages resolve absolutely.
  metadataBase: new URL(siteUrl),
  // Sourced from `siteConfig` rather than retyped, so the positioning cannot
  // drift between the document title and the copy on the page.
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      /**
       * Clerk renders its own sign-in/sign-up UI in an iframe-free portal that
       * does not inherit our Tailwind tokens, so the brand colour and radius
       * have to be handed to it explicitly. Without this the auth modal stays
       * Clerk-default purple and visibly breaks the light-blue theme at exactly
       * the moment we are asking someone to trust us with a password.
       */
      appearance={{
        /**
         * Variable names follow Clerk Core 3 (`@clerk/types` v4): the older
         * `colorText` / `colorTextSecondary` / `colorInputBackground` keys were
         * renamed and no longer typecheck.
         */
        variables: {
          colorPrimary: "#2563eb", // blue-600, matches --primary
          colorPrimaryForeground: "#ffffff",
          colorForeground: "#f9fafb", // gray-50
          colorMutedForeground: "#99a1af", // gray-400
          colorBackground: "#111827", // gray-900, the modal surface
          colorInput: "#030712", // gray-950
          colorInputForeground: "#f9fafb",
          colorBorder: "#1e2939", // gray-800
          colorRing: "#3b82f6", // blue-500
          colorNeutral: "white", // dark themes need light-shade neutrals
          borderRadius: "0.5rem",
          fontFamily: "var(--font-sans)",
        },
        /**
         * `elements` keys map to the stable `cl-*` classes Clerk puts on its own
         * DOM (`cl-formButtonPrimary`, `cl-card`, ...), so these strings are
         * appended to Clerk's classes rather than replacing its layout.
         *
         * The blue bloom on the primary button is what ties the Clerk form to
         * the glowing pill CTAs in the rest of the site - without it the submit
         * button on `/sign-in` is the one flat control on an otherwise lit page.
         * It replaces the previous `shadow-none`, which was there to strip
         * Clerk's default grey drop shadow; a coloured glow does that too.
         */
        elements: {
          formButtonPrimary:
            "normal-case font-medium shadow-[0_0_24px_-6px_oklch(0.546_0.245_262.881/0.75)] hover:opacity-90",
          card: "shadow-none border border-white/10",
        },
      }}
    >
      {/* `dark` is applied statically. The palette in globals.css `:root` is
          already the black-and-blue theme, so this class is not what makes the
          site dark - it is what enables the `dark:` variants the shadcn
          primitives use for their borders and input fills. */}
      <html
        lang="en"
        className={`dark ${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} ${bangers.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-gray-950 text-gray-50">
          <Providers>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
