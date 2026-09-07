import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { COUNTRIES } from "@/lib/policy-taxonomy";

const BASE_URL = "https://globalbioenergywatch.org";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/timeline", changefreq: "daily", priority: "0.9" },
          { path: "/profiles", changefreq: "weekly", priority: "0.8" },
          ...COUNTRIES.map((c) => ({
            path: `/countries/${c.slug}`,
            changefreq: "weekly" as const,
            priority: "0.7",
          })),
          { path: "/jobs", changefreq: "daily", priority: "0.6" },
          { path: "/videos", changefreq: "weekly", priority: "0.6" },
          ...[
            "stations",
            "uco",
            "ethanol",
            "biopower",
            "rng",
            "biochar",
            "pellets",
            "terminals",
            "marine",
            "oil",
            "saf",
            "carriers",
          ].map((panel) => ({
            path: `/supply/${panel}`,
            changefreq: "weekly" as const,
            priority: "0.7",
          })),
          { path: "/get-alerts", changefreq: "monthly", priority: "0.6" },
          { path: "/data-sources", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/about/mission-vision", changefreq: "monthly", priority: "0.4" },
          { path: "/about/team", changefreq: "monthly", priority: "0.4" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
