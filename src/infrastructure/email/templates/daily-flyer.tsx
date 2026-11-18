import React from "react";
import type { TemplateEntry } from "../registry";
import { PolicyAlert } from "./policy-alert";

interface Item {
  title?: string;
  url?: string;
  summary?: string;
  source?: string;
  countryName?: string | null;
  fuels?: string[];
  category?: string;
  publishedAt?: string;
}

interface Props {
  dateLabel?: string;
  items?: Item[];
}

/**
 * The daily editorial flyer shares the same high-resolution dark-green visual
 * system as the subscriber brief. The "desk-flyer" edition keeps its own
 * intro/footer language and does not display subscriber unsubscribe controls.
 * This prevents future style changes from drifting between the two emails.
 */
const DailyFlyer = ({ dateLabel = "", items = [] }: Props) => (
  <PolicyAlert dateLabel={dateLabel} items={items} edition="desk-flyer" />
);

export const template = {
  component: DailyFlyer,
  subject: (data: Record<string, unknown>) => {
    const date = String(data["dateLabel"] || new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    }));
    const headlines = Array.isArray(data["items"]) ? data["items"].length : 0;
    return `GBW Daily Flyer | ${date} | ${headlines} headlines`;
  },
  displayName: "High-resolution GBW editorial daily flyer",
  previewData: {
    dateLabel: "Wednesday, 18 November 2026",
    items: [
      {
        title: "Illustrative renewable fuel policy announcement",
        url: "https://example.com/policy",
        summary: "Sample explanation of how a change to a renewable fuel obligation could affect market participants.",
        countryName: "United States",
        source: "Official government agency",
        fuels: ["Biodiesel", "Ethanol"],
        category: "policy",
        publishedAt: "18 Nov 2026",
      },
      {
        title: "Illustrative sustainable aviation fuel supply update",
        url: "https://example.com/market",
        summary: "A sample market summary about SAF production, supply commitments and delivery constraints.",
        source: "Producer announcement",
        countryName: "Global",
        fuels: ["SAF"],
        category: "market",
        publishedAt: "18 Nov 2026",
      },
    ],
  },
} satisfies TemplateEntry;
