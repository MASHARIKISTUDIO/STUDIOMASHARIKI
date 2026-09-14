import {
  Aperture,
  AudioLines,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Check,
  Clapperboard,
  Cloud,
  Crosshair,
  Film,
  Flower2,
  Heart,
  Home,
  Image as ImageIcon,
  Landmark,
  Layers,
  LayoutGrid,
  type LucideIcon,
  Mic,
  Mountain,
  Music,
  Package,
  Palette,
  PenTool,
  Play,
  Scissors,
  Share2,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Trees,
  User,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";

/**
 * Copy and structure for every service landing page.
 *
 * The homepage grid and header dropdown read `href` from `lib/services.ts`;
 * this module is what those URLs render. Layouts are named after the five
 * designed pages (photography, beats, design, booking, video); everything else
 * uses the shared `standard` layout so a new service does not need a new
 * component, only a new entry.
 */

export type ServicePageLayout =
  | "photography"
  | "beats"
  | "design"
  | "booking"
  | "video"
  | "standard";

export type ServiceHighlight = {
  icon: LucideIcon;
  label: string;
};

export type ServiceOffering = {
  title: string;
  text: string;
  icon: LucideIcon;
  image?: string;
  href?: string;
};

export type ServiceReason = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export type ServiceRate = {
  title: string;
  detail: string;
  price: string;
  featured?: boolean;
  icon: LucideIcon;
};

export type ServiceStep = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export type BookingOffer = {
  id: "beatmaking" | "vocal-recording" | "mixing-mastering";
  title: string;
  kicker: string;
  text: string;
  price: string;
  icon: LucideIcon;
  image: string;
};

export type VideoSubService = {
  title: string;
  text: string;
  icon: LucideIcon;
  href: string;
};

export type VideoTier = {
  id: string;
  label: string;
  badge: string;
  kicker: string;
  text: string;
  theme: "gold" | "cyan";
  services: VideoSubService[];
};

export type ServicePageContent = {
  slug: string;
  title: string;
  layout: ServicePageLayout;
  /** Small back-link above the title. */
  backHref: string;
  backLabel: string;
  /** CAPTURE × CREATE × PRESERVE */
  kicker: string;
  description: string;
  /** Meta description; can be tighter than the on-page paragraph. */
  seoDescription: string;
  highlights: ServiceHighlight[];
  flourish: string;
  heroImage: string;
  offeringsHeading?: string;
  offerings?: ServiceOffering[];
  reasonsHeading?: string;
  reasons?: ServiceReason[];
  packsHeading?: string;
  packs?: ServiceOffering[];
  ratesHeading?: string;
  rates?: ServiceRate[];
  rateNotes?: string[];
  processHeading?: string;
  process?: ServiceStep[];
  bookingHeading?: string;
  bookingOffers?: BookingOffer[];
  videoTiers?: VideoTier[];
  cta: {
    script: string;
    label: string;
    href: string;
    sub?: string;
  };
  footerTags?: string[];
};

const img = (id: string, width = 1800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const HERO = {
  photography: img("photo-1516035069371-29a1b244cc32"),
  beats: img("photo-1598488035139-bdbb2231ce04"),
  design: img("photo-1626785774573-4b799315345d"),
  booking: img("photo-1598653222000-6b7b7a552625"),
  video: img("photo-1492691527719-9d1e07e534b4"),
  mixing: img("photo-1598653222000-6b7b7a552625"),
  events: img("photo-1519741497674-611481863552"),
  editing: img("photo-1574717024653-61fd2cf4dcd6"),
  motion: img("photo-1550745165-9bc8b375bee5"),
  script: img("photo-1455390582262-044cdead277a"),
} as const;

export const SERVICE_PAGES: Record<string, ServicePageContent> = {
  photography: {
    slug: "photography",
    title: "Photography",
    layout: "photography",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Capture  ×  Create  ×  Preserve",
    description:
      "From stunning portraits to unforgettable events, we capture the moments that matter. Our photography services are designed to bring your story to life with creativity, precision and a unique visual style.",
    seoDescription:
      "Portrait, event, product and commercial photography from Studio Mashariki in Nairobi — creative, precise, and built to tell your story.",
    highlights: [
      { icon: Camera, label: "Professional equipment" },
      { icon: Star, label: "Creative vision" },
      { icon: ShieldCheck, label: "High quality output" },
      { icon: Zap, label: "Fast & reliable delivery" },
    ],
    flourish: "Good photos tell great stories",
    heroImage: HERO.photography,
    offeringsHeading: "Our photography services",
    offerings: [
      {
        title: "Portrait Photography",
        text: "Professional portraits for individuals, brands and creatives.",
        icon: User,
        image: img("photo-1531746020798-e6953c6e8e04", 800),
      },
      {
        title: "Event Photography",
        text: "Weddings, birthdays, corporate events and special occasions.",
        icon: CalendarDays,
        image: img("photo-1519741497674-611481863552", 800),
      },
      {
        title: "Product Photography",
        text: "High-quality product shots that sell.",
        icon: Package,
        image: img("photo-1542291026-7eec264c27ff", 800),
      },
      {
        title: "Real Estate Photography",
        text: "Showcasing properties with stunning visuals.",
        icon: Home,
        image: img("photo-1600596542815-ffad4c1539a9", 800),
      },
      {
        title: "Lifestyle Photography",
        text: "Real moments. Real people. Real stories.",
        icon: Heart,
        image: img("photo-1449824913935-59a10b8d2000", 800),
      },
      {
        title: "Commercial Photography",
        text: "For businesses, brands and advertising campaigns.",
        icon: Briefcase,
        image: img("photo-1556761175-b413da4baf72", 800),
      },
      {
        title: "Nature & Landscape",
        text: "Breathtaking views, perfectly captured.",
        icon: Mountain,
        image: img("photo-1469474968028-56623f02e42e", 800),
      },
      {
        title: "Photo Editing & Retouching",
        text: "Clean, sharp and professional finishing.",
        icon: Aperture,
        image: img("photo-1611532736597-de2d4265fba3", 800),
      },
    ],
    reasonsHeading: "Why choose us?",
    reasons: [
      {
        icon: Camera,
        title: "Experienced shooters",
        text: "Skilled and creative team",
      },
      {
        icon: Star,
        title: "Quality assurance",
        text: "Top-notch results always",
      },
      {
        icon: Zap,
        title: "On-time delivery",
        text: "Because your time matters",
      },
      {
        icon: Heart,
        title: "Your vision, our priority",
        text: "We bring your ideas to life",
      },
    ],
    cta: {
      script: "Let's capture your story.",
      label: "Book a photography session",
      href: "#enquire",
      sub: "Portraits  ·  Events  ·  Brands  ·  More",
    },
    footerTags: ["Nairobi & beyond"],
  },

  "beat-making": {
    slug: "beat-making",
    title: "Beat Making",
    layout: "beats",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Original beats  ×  Your vibe  ×  Our sound",
    description:
      "We create high-quality, custom beats tailored to your style. Whether you're a rapper, singer or content creator, we bring your sound to life with professional, industry-ready instrumentals across multiple genres.",
    seoDescription:
      "Custom trap, afrobeat, dancehall, trapsoul, lofi and drill beats from Studio Mashariki. Original instrumentals in WAV and MP3.",
    highlights: [
      { icon: AudioLines, label: "Custom beats" },
      { icon: Music, label: "All genres" },
      { icon: ShieldCheck, label: "High quality WAV & MP3" },
      { icon: Zap, label: "Fast delivery" },
    ],
    flourish: "Beats that tell your story",
    heroImage: HERO.beats,
    packsHeading: "Our beat packs",
    packs: [
      {
        title: "Trap Beats",
        text: "Hard hitting 808s, dark vibes, perfect for the streets.",
        icon: Music,
        image: img("photo-1571330735066-03aaa9439d4c", 600),
      },
      {
        title: "Afrobeat Beats",
        text: "Smooth, groovy and full of energy. Made for the culture.",
        icon: AudioLines,
        image: img("photo-1487180144351-b8472da7d246", 600),
      },
      {
        title: "Dancehall Beats",
        text: "Riddims that move. Real Jamaican vibes.",
        icon: Trees,
        image: img("photo-1507525428034-b723cf961d3e", 600),
      },
      {
        title: "Trapsoul Beats",
        text: "Emotional, melodic and deep. For the real ones.",
        icon: Heart,
        image: img("photo-1493225457124-a3eb161ffa5f", 600),
      },
      {
        title: "Lofi Beats",
        text: "Chill vibes for focus, study and creativity.",
        icon: Cloud,
        image: img("photo-1519681393784-d120267933ba", 600),
      },
      {
        title: "Drill Beats",
        text: "Raw, dark and aggressive. For the real heads.",
        icon: Crosshair,
        image: img("photo-1470225620780-dba8ba36b745", 600),
      },
    ],
    ratesHeading: "Beat rates",
    rates: [
      {
        title: "Basic Beat",
        detail: "MP3 (Non Exclusive)",
        price: "KSh 2,000/=",
        icon: Music,
      },
      {
        title: "Premium Beat",
        detail: "WAV + MP3 (Non Exclusive)",
        price: "KSh 3,500/=",
        featured: true,
        icon: Sparkles,
      },
      {
        title: "Exclusive Beat",
        detail: "WAV + MP3 (Full Rights)",
        price: "KSh 8,000/=",
        icon: Star,
      },
    ],
    rateNotes: [
      "Custom made beats",
      "Unlimited revisions (within reason)",
      "Fast delivery (24–72hrs)",
      "100% original",
    ],
    processHeading: "Our beat making process",
    process: [
      {
        title: "Your idea",
        text: "Share your style, mood or a reference (optional).",
        icon: Sparkles,
      },
      {
        title: "Create",
        text: "We cook up the beat based on your idea.",
        icon: AudioLines,
      },
      {
        title: "Review",
        text: "Listen, give feedback and request changes.",
        icon: Play,
      },
      {
        title: "Final files",
        text: "Get your beat in WAV & MP3 format.",
        icon: Check,
      },
    ],
    cta: {
      script: "Custom beats. Real vibes.",
      label: "Order a beat",
      href: "#enquire",
    },
    footerTags: ["Trap", "Afrobeat", "Dancehall", "Trapsoul", "Lofi", "Drill"],
  },

  "graphic-design": {
    slug: "graphic-design",
    title: "Graphic Design",
    layout: "design",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Ideas  ×  Visuals  ×  Impact",
    description:
      "We turn your ideas into eye-catching designs that speak, connect and leave a lasting impression. From logos to flyers, we create visuals that bring your brand to life.",
    seoDescription:
      "Logo, flyer, poster, social and brand identity design from Studio Mashariki in Nairobi.",
    highlights: [
      { icon: Palette, label: "Creative designs" },
      { icon: Zap, label: "Fast delivery" },
      { icon: ShieldCheck, label: "High quality results" },
    ],
    flourish: "Good design builds brands",
    heroImage: HERO.design,
    offeringsHeading: "Our services",
    offerings: [
      {
        title: "Logo Design",
        text: "Unique and memorable logos for your brand.",
        icon: PenTool,
      },
      {
        title: "Flyer Design",
        text: "Eye-catching flyers for events, promotions and businesses.",
        icon: ImageIcon,
      },
      {
        title: "Poster Design",
        text: "Bold and creative posters that get noticed.",
        icon: LayoutGrid,
      },
      {
        title: "Social Media Graphics",
        text: "Engaging posts, banners and covers for all platforms.",
        icon: Share2,
      },
      {
        title: "Brand Identity",
        text: "Complete brand kits for a consistent look.",
        icon: Shirt,
      },
      {
        title: "Business Cards",
        text: "Professional cards that make a strong first impression.",
        icon: Landmark,
      },
    ],
    cta: {
      script: "Let's create something great",
      label: "Contact us",
      href: "#enquire",
      sub: "Have a design idea in mind? Get in touch with us and let's bring it to life.",
    },
  },

  "book-a-session": {
    slug: "book-a-session",
    title: "Book a Session",
    layout: "booking",
    backHref: "/",
    backLabel: "Back to home",
    kicker: "Turn your ideas into professional sounds",
    description:
      "At Studio Mashariki, we offer professional studio services tailored to your needs. Whether you're laying down vocals, crafting beats, or polishing your sound, we've got you covered.",
    seoDescription:
      "Book a Studio Mashariki session in Nairobi — beatmaking, vocal recording, mixing and mastering. Mon–Sat, 9am–10pm by appointment.",
    highlights: [
      { icon: AudioLines, label: "Professional equipment" },
      { icon: Mic, label: "Skilled engineers" },
      { icon: ShieldCheck, label: "Clean & comfortable environment" },
    ],
    flourish: "Good music builds better days.",
    heroImage: HERO.booking,
    bookingHeading: "Our services & rates",
    bookingOffers: [
      {
        id: "beatmaking",
        title: "Beatmaking",
        kicker: "Your vision. Our sound.",
        text: "Get custom beats tailored to your style. From Afrobeat to Trap, Drill to Dancehall, we create beats that fit your vibe.",
        price: "4,000/=",
        icon: LayoutGrid,
        image: img("photo-1571330735066-03aaa9439d4c", 900),
      },
      {
        id: "vocal-recording",
        title: "Vocal Recording",
        kicker: "Your voice. Our focus.",
        text: "High-quality vocal recording with crystal clear sound, professional setup and expert guidance.",
        price: "1,000/=",
        icon: Mic,
        image: img("photo-1598653222000-6b7b7a552625", 900),
      },
      {
        id: "mixing-mastering",
        title: "Mixing & Mastering",
        kicker: "Polish your sound.",
        text: "We bring out the best in your music with professional mixing and mastering for a clean, balanced, industry-ready sound.",
        price: "1,500/=",
        icon: SlidersHorizontal,
        image: img("photo-1598488035139-bdbb2231ce04", 900),
      },
    ],
    cta: {
      script: "Let's make some fire",
      label: "Book your session now",
      href: "#enquire",
    },
  },

  "video-production": {
    slug: "video-production",
    title: "Video Production",
    layout: "video",
    backHref: "/",
    backLabel: "Back to home",
    kicker: "Ideas  ×  Shoot  ×  Edit  ×  Deliver",
    description:
      "From concept to final cut, we bring your vision to life with cinematic quality, creative storytelling and professional production standards. Whether it's a music video, ad, reel or a full production, we've got you covered.",
    seoDescription:
      "4K and HD video production in Nairobi — music videos, reels, adverts, documentaries, short films, events and corporate films.",
    highlights: [
      { icon: Film, label: "Cinematic quality" },
      { icon: Sparkles, label: "Creative storytelling" },
      { icon: Camera, label: "Professional equipment" },
      { icon: Zap, label: "Fast & reliable delivery" },
    ],
    flourish: "Turning ideas into visual stories",
    heroImage: HERO.video,
    videoTiers: [
      {
        id: "4k",
        label: "4K",
        badge: "Ultra HD",
        kicker: "Cinematic. Detailed. Breathtaking.",
        text: "Experience unmatched clarity and detail with our 4K production services. Perfect for high-end projects, premium brands and cinematic visuals that stand out.",
        theme: "gold",
        services: [
          {
            title: "Music Videos",
            text: "Bring your sound to life with cinematic visuals.",
            icon: Music,
            href: "/categories/music-videos",
          },
          {
            title: "Reels",
            text: "Short, catchy, impactful content for social media.",
            icon: Smartphone,
            href: "/categories/social-media-reels",
          },
          {
            title: "Adverts",
            text: "Promote your brand with professional ads.",
            icon: Play,
            href: "#enquire",
          },
          {
            title: "Documentaries",
            text: "Real stories. Real people. Powerful storytelling.",
            icon: Film,
            href: "#enquire",
          },
          {
            title: "Short Films",
            text: "Creative films that inspire and entertain.",
            icon: Clapperboard,
            href: "#enquire",
          },
          {
            title: "Event Coverage",
            text: "Capture your special moments, professionally.",
            icon: CalendarDays,
            href: "/categories/events",
          },
          {
            title: "Corporate Videos",
            text: "Professional videos for your business.",
            icon: Building2,
            href: "#enquire",
          },
          {
            title: "Social Media Content",
            text: "Engaging content that grows your audience.",
            icon: Share2,
            href: "/categories/social-media-reels",
          },
        ],
      },
      {
        id: "hd",
        label: "HD",
        badge: "HD",
        kicker: "Clean. Professional. Versatile.",
        text: "Get high-quality visuals without compromise. Our HD production services deliver crisp, clear and professional content for all your needs.",
        theme: "cyan",
        services: [
          {
            title: "Music Videos",
            text: "Bring your sound to life with cinematic visuals.",
            icon: Music,
            href: "/categories/music-videos",
          },
          {
            title: "Reels",
            text: "Short, catchy, impactful content for social media.",
            icon: Smartphone,
            href: "/categories/social-media-reels",
          },
          {
            title: "Adverts",
            text: "Promote your brand with professional ads.",
            icon: Play,
            href: "#enquire",
          },
          {
            title: "Documentaries",
            text: "Real stories. Real people. Powerful storytelling.",
            icon: Film,
            href: "#enquire",
          },
          {
            title: "Short Films",
            text: "Creative films that inspire and entertain.",
            icon: Clapperboard,
            href: "#enquire",
          },
          {
            title: "Event Coverage",
            text: "Capture your special moments, professionally.",
            icon: CalendarDays,
            href: "/categories/events",
          },
          {
            title: "Corporate Videos",
            text: "Professional videos for your business.",
            icon: Building2,
            href: "#enquire",
          },
          {
            title: "Social Media Content",
            text: "Engaging content that grows your audience.",
            icon: Share2,
            href: "/categories/social-media-reels",
          },
        ],
      },
    ],
    processHeading: "How a production runs",
    process: [
      {
        title: "Your idea",
        text: "Share your vision with us and let's make it real.",
        icon: Sparkles,
      },
      {
        title: "Shoot",
        text: "We handle the production with professional gear.",
        icon: Camera,
      },
      {
        title: "Edit",
        text: "We bring it all together with creative editing.",
        icon: Scissors,
      },
      {
        title: "Deliver",
        text: "Get your final video in the format you need.",
        icon: Check,
      },
    ],
    cta: {
      script: "Let's create something amazing",
      label: "Get a quote",
      href: "#enquire",
    },
  },

  "mixing-and-mastering": {
    slug: "mixing-and-mastering",
    title: "Mixing & Mastering",
    layout: "standard",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Polish  ×  Balance  ×  Deliver",
    description:
      "We bring out the best in your music with professional mixing and mastering for a clean, balanced, industry-ready sound. Send the session — we send back a record that holds up on every speaker.",
    seoDescription:
      "Professional mixing and mastering in Nairobi from Studio Mashariki. Industry-ready sound, all genres, from KSh 1,500.",
    highlights: [
      { icon: SlidersHorizontal, label: "Industry-ready mixes" },
      { icon: ShieldCheck, label: "All genres" },
      { icon: Zap, label: "Fast turnaround" },
    ],
    flourish: "Polish your sound.",
    heroImage: HERO.mixing,
    offeringsHeading: "What you get",
    offerings: [
      {
        title: "Mixing",
        text: "Balance, depth and punch so every part of the song sits right.",
        icon: SlidersHorizontal,
      },
      {
        title: "Mastering",
        text: "Loud, clean and consistent across streaming, radio and live.",
        icon: AudioLines,
      },
      {
        title: "Stem mixing",
        text: "Bring grouped stems when a full session is not on the table.",
        icon: Layers,
      },
      {
        title: "Revisions",
        text: "We stay on the song with you until it feels finished.",
        icon: Check,
      },
    ],
    ratesHeading: "Rate",
    rates: [
      {
        title: "Mix & Master",
        detail: "Per song, including revisions",
        price: "KSh 1,500/=",
        featured: true,
        icon: SlidersHorizontal,
      },
    ],
    processHeading: "How it works",
    process: [
      {
        title: "Send the session",
        text: "Export stems or the project and tell us the references.",
        icon: Sparkles,
      },
      {
        title: "Mix",
        text: "We balance, shape and glue the record.",
        icon: SlidersHorizontal,
      },
      {
        title: "Review",
        text: "Listen, note changes, we revise.",
        icon: Play,
      },
      {
        title: "Master",
        text: "Final polish and delivery in the formats you need.",
        icon: Check,
      },
    ],
    cta: {
      script: "Let's finish the record.",
      label: "Book mixing & mastering",
      href: "/book-a-session",
    },
  },

  "beat-production": {
    slug: "beat-production",
    title: "Beat Production",
    layout: "standard",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Your vision  ×  Our sound",
    description:
      "Sit with a producer and build the record from the ground up — arrangement, sound selection and the pocket that fits your voice. For ready-made instrumentals, see Beat Making.",
    seoDescription:
      "Custom beat production sessions at Studio Mashariki in Nairobi. Original beats built around your voice, from Afrobeat to trap and drill.",
    highlights: [
      { icon: AudioLines, label: "Custom production" },
      { icon: Music, label: "Any genre" },
      { icon: Mic, label: "Built around your voice" },
    ],
    flourish: "Original beats. Your vibe.",
    heroImage: HERO.beats,
    offeringsHeading: "In the session",
    offerings: [
      {
        title: "Custom beats",
        text: "We write to your references, your cadence and your story.",
        icon: AudioLines,
      },
      {
        title: "Arrangement",
        text: "Intros, drops, bridges — a full song, not a loop.",
        icon: Layers,
      },
      {
        title: "Ready to record",
        text: "Walk out with a beat you can cut vocals on the same day.",
        icon: Mic,
      },
      {
        title: "Beat packs",
        text: "Want a finished instrumental without a session? Order from Beat Making.",
        icon: Music,
        href: "/services/beat-making",
      },
    ],
    processHeading: "How a production session runs",
    process: [
      {
        title: "Brief",
        text: "Mood, references and the story you want the beat to carry.",
        icon: Sparkles,
      },
      {
        title: "Build",
        text: "We produce in the room with you, or from your notes.",
        icon: AudioLines,
      },
      {
        title: "Lock it",
        text: "Tweak the arrangement until it feels like your record.",
        icon: Check,
      },
    ],
    cta: {
      script: "Turn your ideas into hits.",
      label: "Book a production session",
      href: "/book-a-session",
    },
  },

  events: {
    slug: "events",
    title: "Events",
    layout: "standard",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Moments  ×  Stories  ×  Memory",
    description:
      "Weddings, ruracio, funerals, graduations, corporates and the days in between — we cover the room properly, then deliver a gallery you can actually share.",
    seoDescription:
      "Event coverage from Studio Mashariki in Nairobi — weddings, ruracio, funerals, graduations, corporates and social reels.",
    highlights: [
      { icon: CalendarDays, label: "Ceremony & reception" },
      { icon: Camera, label: "Photo and film" },
      { icon: Zap, label: "Galleries delivered" },
    ],
    flourish: "Your day, told properly.",
    heroImage: HERO.events,
    offeringsHeading: "Events we cover",
    offerings: [
      {
        title: "Weddings",
        text: "Arusi films made to be rewatched.",
        icon: Heart,
        href: "/categories/arusi",
      },
      {
        title: "Ruracio",
        text: "Dowry ceremony coverage, honoured properly.",
        icon: Users,
        href: "/categories/ruracio",
      },
      {
        title: "Burials",
        text: "Respectful, complete funeral films.",
        icon: Flower2,
        href: "/categories/funeral",
      },
      {
        title: "Anniversaries",
        text: "Milestone days, captured with care.",
        icon: Star,
        href: "/categories/anniversaries",
      },
      {
        title: "Graduations",
        text: "The walk, the moment, the people who got you there.",
        icon: Landmark,
        href: "/categories/graduations",
      },
      {
        title: "Corporate events",
        text: "Conferences, launches and brand days.",
        icon: Building2,
        href: "/categories/events",
      },
      {
        title: "Social media reels",
        text: "Short, shareable cuts from the day.",
        icon: Smartphone,
        href: "/categories/social-media-reels",
      },
    ],
    cta: {
      script: "Let's cover the day.",
      label: "Get a quote",
      href: "#enquire",
    },
  },

  "video-editing-and-colour-grading": {
    slug: "video-editing-and-colour-grading",
    title: "Video Editing & Colour Grading",
    layout: "standard",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Cut  ×  Colour  ×  Finish",
    description:
      "Turn raw footage into a finished film. Cinematic edits, colour that holds, sound that sits — whether you shot with us or brought the cards in.",
    seoDescription:
      "Cinematic video editing and colour grading from Studio Mashariki in Nairobi. Cuts, grades and finishing for films, ads and reels.",
    highlights: [
      { icon: Film, label: "Cinematic edits" },
      { icon: Aperture, label: "Colour grading" },
      { icon: Zap, label: "Any format delivered" },
    ],
    flourish: "Turn raw footage into magic.",
    heroImage: HERO.editing,
    offeringsHeading: "Finishing services",
    offerings: [
      {
        title: "Cinematic editing",
        text: "Pace, story and music working as one piece.",
        icon: Scissors,
      },
      {
        title: "Colour grading",
        text: "A look that is consistent, rich and on-brand.",
        icon: Aperture,
      },
      {
        title: "Reels & shorts",
        text: "Vertical cuts that still feel like cinema.",
        icon: Smartphone,
      },
      {
        title: "Sound pass",
        text: "Dialogue, music and mix so the picture is not working alone.",
        icon: AudioLines,
      },
    ],
    processHeading: "From cards to delivery",
    process: [
      {
        title: "Ingest",
        text: "We take the footage, the brief and the references.",
        icon: Sparkles,
      },
      {
        title: "Cut",
        text: "A story pass you can react to before we grade.",
        icon: Scissors,
      },
      {
        title: "Grade & finish",
        text: "Colour, titles, sound — then files in the formats you need.",
        icon: Check,
      },
    ],
    cta: {
      script: "Let's finish the film.",
      label: "Get a quote",
      href: "#enquire",
    },
  },

  "motion-graphic-designs": {
    slug: "motion-graphic-designs",
    title: "Motion Graphic Designs",
    layout: "standard",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Logos  ×  Lyrics  ×  Motion",
    description:
      "Logos that move, lyric videos that carry the song, animations that say the thing a still cannot. Visuals that speak.",
    seoDescription:
      "Motion graphics from Studio Mashariki — logo animation, lyric videos and social motion design in Nairobi.",
    highlights: [
      { icon: WandSparkles, label: "Logo animation" },
      { icon: Play, label: "Lyric videos" },
      { icon: Zap, label: "Social-ready exports" },
    ],
    flourish: "Visuals that speak.",
    heroImage: HERO.motion,
    offeringsHeading: "Motion we make",
    offerings: [
      {
        title: "Logo animation",
        text: "A mark that intro's the film, the reel, the channel.",
        icon: Sparkles,
      },
      {
        title: "Lyric videos",
        text: "The song on screen, timed and designed, not templated.",
        icon: Music,
      },
      {
        title: "Lower thirds & titles",
        text: "Clean, branded type for interviews and films.",
        icon: Layers,
      },
      {
        title: "Social motion",
        text: "Loops, stings and story frames built for the feed.",
        icon: Smartphone,
      },
    ],
    cta: {
      script: "Let's make it move.",
      label: "Start a motion brief",
      href: "#enquire",
    },
  },

  "script-writing": {
    slug: "script-writing",
    title: "Script Writing",
    layout: "standard",
    backHref: "/#services",
    backLabel: "Back to services",
    kicker: "Idea  ×  Story  ×  Script",
    description:
      "A brief becomes a script you can actually shoot — ads, music videos, short films and brand films with a story that hits.",
    seoDescription:
      "Script writing for ads, music videos and films from Studio Mashariki in Nairobi. Ideas to shootable scripts.",
    highlights: [
      { icon: PenTool, label: "Shootable scripts" },
      { icon: Film, label: "Ads, videos, films" },
      { icon: Users, label: "Written with you" },
    ],
    flourish: "Stories that hit.",
    heroImage: HERO.script,
    offeringsHeading: "What we write",
    offerings: [
      {
        title: "Music video treatments",
        text: "The world, the beats, the shots — before cameras roll.",
        icon: Music,
      },
      {
        title: "Ads & brand films",
        text: "A line, a story, a reason to watch to the end.",
        icon: Play,
      },
      {
        title: "Short films",
        text: "Character, turn, landing. Built for the runtime you have.",
        icon: Clapperboard,
      },
      {
        title: "Voiceover scripts",
        text: "Words that sound like a person when they hit the mic.",
        icon: Mic,
      },
    ],
    processHeading: "From idea to pages",
    process: [
      {
        title: "Brief",
        text: "What the piece has to do, who it is for, how long it runs.",
        icon: Sparkles,
      },
      {
        title: "Outline",
        text: "Structure first, so we agree the story before the lines.",
        icon: Layers,
      },
      {
        title: "Draft & polish",
        text: "A script you can take into a shoot or a session.",
        icon: Check,
      },
    ],
    cta: {
      script: "Let's write it down.",
      label: "Start a script",
      href: "#enquire",
    },
  },
};

export function getServicePage(slug: string): ServicePageContent | undefined {
  return SERVICE_PAGES[slug];
}

export function listServicePageSlugs(): string[] {
  return Object.keys(SERVICE_PAGES);
}
