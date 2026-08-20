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
  whyItsHere: string;
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
export const aster: DebutApp = {
  slug: "aster",
  name: "Aster",
  tagline: "Keep the little things worth remembering.",
  description: [
    "Aster is a quiet place for the ideas, moments, and small things you want to come back to. There's no folder to choose, no tag to remember, no format to pick. Open it, save the thing, get on with your day.",
    "What you save resurfaces on its own — a line from last week, a photo from a walk, a thought that didn't fit anywhere else — gently, and only when you open the app. Nothing pushes. Nothing asks you to keep a streak.",
  ],
  whyItsHere:
    "One clear idea, careful details, and no debut-day bloat. Aster makes sense within the first minute — and that's rarer than it sounds.",
  icon: "A",
  platform: "both",
  storeUrlIos: "#",
  storeUrlAndroid: "#",
  debutDate: "2026-08-20",
  screens: [
    { icon: "A", title: "Aster", sub: "Keep the little things<br/>worth remembering.", caption: "Home · saving something takes one tap" },
    { icon: "✚", title: "Quick capture", sub: "Save a thought in<br/>under two seconds.", caption: "Capture · text, a photo, or a link" },
    { icon: "◐", title: "Come back to it", sub: "Resurfaced gently,<br/>never a wall of notes.", caption: "Resurface · things come back gently" },
    { icon: "☾", title: "Made for quiet", sub: "No badges, no streaks,<br/>nothing asking for more.", caption: "Design · quiet by default" },
  ],
  maker: {
    name: "Maya Ionescu",
    role: "Made Aster, solo",
    interview: [
      {
        q: "Why build another place to save things?",
        a: "Because the other places all wanted to be something else too — a task list, a wiki, a social feed. I wanted one app that only did the small thing well: catch it, keep it, hand it back later without asking anything of me.",
      },
      {
        q: "What took the longest to get right?",
        a: "The moment something resurfaces. Early versions felt like notifications in disguise, and I hated using my own app. I spent most of the build slowing that moment down until it felt like finding something, not being reminded of it.",
      },
      {
        q: "What's next for Aster?",
        a: "Nothing loud. A better way to browse what's piled up, and proper iPad support. I'd rather ship two things well this year than ten things half-finished.",
      },
    ],
  },
};

export const archiveMock: { date: string; slug: string; name: string; platform: string }[] = [
  { date: "2026-08-03", slug: "aster", name: "Morrow", platform: "iPhone" },
  { date: "2026-08-04", slug: "aster", name: "Luma", platform: "Android" },
  { date: "2026-08-05", slug: "aster", name: "Nook", platform: "iPhone" },
  { date: "2026-08-06", slug: "aster", name: "June", platform: "iPhone + Android" },
  { date: "2026-08-07", slug: "aster", name: "Folio", platform: "iPhone" },
  { date: "2026-08-10", slug: "aster", name: "Drift", platform: "Android" },
  { date: "2026-08-11", slug: "aster", name: "Still", platform: "iPhone" },
  { date: "2026-08-12", slug: "aster", name: "Cove", platform: "iPhone" },
  { date: "2026-08-13", slug: "aster", name: "North", platform: "iPhone + Android" },
  { date: "2026-08-14", slug: "aster", name: "Wisp", platform: "iPhone" },
  { date: "2026-08-17", slug: "aster", name: "Mori", platform: "Android" },
  { date: "2026-08-18", slug: "aster", name: "Kite", platform: "iPhone" },
  { date: "2026-08-19", slug: "aster", name: "Frame", platform: "iPhone" },
  { date: "2026-08-20", slug: "aster", name: "Aster", platform: "iPhone + Android" },
];
