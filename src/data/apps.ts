export interface AppScreen {
  icon?: string;
  imageUrl?: string;
  title: string;
  sub: string;
  caption: string;
}

export interface QA {
  q: string;
  a: string;
}

export interface DebutApp {
  slug: string;
  name: string;
  tagline: string;
  description: string[];
  whyItsHere?: string;
  icon: string;
  iconUrl?: string;
  platform: "ios" | "android" | "both";
  storeUrlIos?: string;
  storeUrlAndroid?: string;
  debutDate: string;       // ISO date
  campaignSource?: "shipaton";
  updatedAt?: string;
  screens: AppScreen[];
  maker?: {
    name: string;
    role: string;
    interview: QA[];
  };
}

// In production this record comes from a D1 query — see src/lib/db.ts.
// Shape matches the `apps` table exactly so swapping the data source
// later is a one-file change.
export const smol: DebutApp = {
  slug: "smol-pet-health-tracker",
  name: "smol: Pet Health Tracker",
  tagline: "Meds, reminders & daily care",
  description: [
    "smol helps you keep day-to-day pet care organized without turning your pet's life into a spreadsheet.",
    "Log food, water, potty, activity, weight, symptoms, behaviour, medications, vaccines, parasite care, and hygiene.",
    "Build routines and reminders so care does not depend on memory.",
    "See calendar history, reports, health snapshots, and trends when you need a clearer view.",
    "Manage food, medications, anti-parasitics, sharing groups, check-ins, and pet profiles in one place.",
    "Use smol+ for premium tracking, reports, sharing, additional pets, and extended history.",
    "smol is a pet-care organizer and reminder app. It is not veterinary advice and does not diagnose, treat, or replace care from a veterinarian.",
    "Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
  ],
  icon: "s",
  iconUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/42/bd/77/42bd7788-6688-bfd1-c168-88a9d360249f/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg",
  platform: "ios",
  storeUrlIos: "https://apps.apple.com/us/app/smol-pet-health-tracker/id6756193369?uo=4",
  debutDate: "2026-08-21",
  screens: [
    {
      imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/22/b1/a2/22b1a2cc-bb9f-eb74-60ab-339b58c65c0e/new-image-en-2.png/640x960bb.jpg",
      title: "Pet care shouldn’t live in your head.",
      sub: "",
      caption: "See what's done, what's due, and what your pet needs today.",
    },
    {
      imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/c9/38/9d/c9389de5-bac9-90f2-16e9-de22020654b4/02.png/640x960bb.jpg",
      title: "Log everyday care as it happens.",
      sub: "",
      caption: "Meals, water, potty, activity, weight, symptoms, and medication notes.",
    },
    {
      imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/4f/40/f4/4f40f42d-4a00-c300-ccb2-acc160870799/03.png/640x960bb.jpg",
      title: "Know what’s done, and what’s next.",
      sub: "",
      caption: "Build daily routines and reminders so care doesn't depend on memory.",
    },
    {
      imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/6c/35/fa/6c35fa56-bdbe-8a73-8a8e-fb6e15226b7b/04.png/640x960bb.jpg",
      title: "Notice the little changes.",
      sub: "",
      caption: "Daily check-ins turn day-to-day details into a clearer weekly picture.",
    },
    {
      imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/4a/5e/e5/4a5ee541-04ec-8f12-5f3c-4814367640ef/05.png/640x960bb.jpg",
      title: "Your recent care, all in one place.",
      sub: "",
      caption: "Review recent logs and check-ins in one clear timeline.",
    },
  ],
};

export const archiveMock: { date: string; slug: string; name: string; platform: string }[] = [
  { date: "2026-08-21", slug: "smol-pet-health-tracker", name: "smol: Pet Health Tracker", platform: "iPhone" },
];
