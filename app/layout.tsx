import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Bangers, Dancing_Script, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { clerkPublishableKey, isClerkConfigured } from "@/lib/clerk-config";
import { siteConfig, siteUrl } from "@/lib/site";
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

/**
 * Clerk renders its own sign-in/sign-up UI in an iframe-free portal that
 * does not inherit our Tailwind tokens, so the brand colour and radius
 * have to be handed to it explicitly.
 */
const clerkAppearance = {
  variables: {
    colorPrimary: "#2563eb",
    colorPrimaryForeground: "#ffffff",
    colorForeground: "#f9fafb",
    colorMutedForeground: "#99a1af",
    colorBackground: "#111827",
    colorInput: "#030712",
    colorInputForeground: "#f9fafb",
    colorBorder: "#1e2939",
    colorRing: "#3b82f6",
    colorNeutral: "white",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    formButtonPrimary:
      "normal-case font-medium shadow-[0_0_24px_-6px_oklch(0.546_0.245_262.881/0.75)] hover:opacity-90",
    card: "shadow-none border border-white/10",
  },
} as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const tree = (
    <Providers clerkConfigured={isClerkConfigured}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </Providers>
  );

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} ${bangers.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-50">
        {isClerkConfigured ? (
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            appearance={clerkAppearance}
          >
            {tree}
          </ClerkProvider>
        ) : (
          tree
        )}
      </body>
    </html>
  );
}
