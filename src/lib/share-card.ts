import type { DebutApp } from "../data/apps";

export type ShareCardPhase = "upcoming" | "today" | "past";

export interface ShareCardCopy {
  phase: ShareCardPhase;
  eyebrow: string;
  headline: string;
  supporting: string;
}

export function getShareCardCopy(app: Pick<DebutApp, "name" | "debutDate">, now = new Date()): ShareCardCopy {
  const today = now.toISOString().slice(0, 10);
  const date = new Date(`${app.debutDate}T00:00:00Z`);
  const shortDate = date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  const longDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  if (app.debutDate > today) {
    return {
      phase: "upcoming",
      eyebrow: `I claimed ${shortDate}.`,
      headline: `${app.name} is coming to Debut Day.`,
      supporting: "One app. One entire day.",
    };
  }

  if (app.debutDate === today) {
    return {
      phase: "today",
      eyebrow: "Today is ours.",
      headline: `${app.name} owns Debut Day today.`,
      supporting: "One app. One entire day.",
    };
  }

  return {
    phase: "past",
    eyebrow: longDate,
    headline: `${app.name} owned Debut Day.`,
    supporting: "A first release with a day of its own.",
  };
}
