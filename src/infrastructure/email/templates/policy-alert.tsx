import React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "../registry";

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
  unsubscribeUrl?: string;
}

const WEB_URL = "https://www.globalbioenergywatch.org";
const LOGO_URL = `${WEB_URL}/icon-192.png`;

// Keep all key presentation styles inline for Outlook and Gmail compatibility.
const styles = {
  body: {
    margin: "0",
    padding: "24px 8px",
    backgroundColor: "#f4f7f9",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#15262d",
  },
  container: {
    maxWidth: "620px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e9e8",
  },
  header: {
    padding: "23px 24px 20px",
    borderBottom: "3px solid #08785a",
  },
  logoColumn: { width: "56px", verticalAlign: "middle" as const },
  logo: { width: "44px", height: "44px", borderRadius: "8px", display: "block" },
  brand: {
    color: "#102d2a",
    fontSize: "18px",
    fontWeight: 800,
    lineHeight: "23px",
    margin: "0 0 3px",
  },
  brandSub: {
    color: "#527066",
    fontSize: "10px",
    letterSpacing: "1.3px",
    fontWeight: 700,
    lineHeight: "15px",
    margin: "0",
  },
  intro: { padding: "22px 24px 11px" },
  eyebrow: {
    fontSize: "11px",
    lineHeight: "17px",
    color: "#0b785b",
    fontWeight: 700,
    letterSpacing: "0.8px",
    textTransform: "uppercase" as const,
    margin: "0 0 10px",
  },
  heading: {
    fontSize: "27px",
    lineHeight: "34px",
    color: "#142823",
    margin: "0 0 10px",
    fontWeight: 800,
  },
  introText: { fontSize: "14px", lineHeight: "22px", color: "#526761", margin: "0" },
  card: {
    margin: "12px 24px",
    padding: "17px 19px 19px",
    border: "1px solid #dbe9e3",
    borderLeft: "4px solid #0c8969",
    backgroundColor: "#ffffff",
  },
  cardMeta: {
    color: "#176b55",
    fontSize: "10px",
    lineHeight: "16px",
    letterSpacing: "0.6px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    margin: "0 0 8px",
  },
  cardTitle: {
    color: "#152a25",
    fontSize: "18px",
    lineHeight: "25px",
    fontWeight: 700,
    margin: "0 0 9px",
  },
  cardSummary: {
    color: "#3b504c",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 12px",
  },
  cardSource: { color: "#61756f", fontSize: "11px", lineHeight: "17px", margin: "0 0 11px" },
  sourceLink: { fontSize: "13px", fontWeight: 700, color: "#0a7054", textDecoration: "underline" },
  action: { padding: "14px 24px 23px" },
  actionButton: {
    padding: "12px 18px",
    color: "#ffffff",
    backgroundColor: "#08785a",
    fontSize: "13px",
    fontWeight: 700,
    borderRadius: "5px",
  },
  footer: { padding: "20px 24px 22px", backgroundColor: "#f4f8f6" },
  footText: {
    color: "#5b6c68",
    fontSize: "11px",
    lineHeight: "18px",
    margin: "0 0 10px",
  },
  footerLink: { color: "#0a7054", fontSize: "11px", textDecoration: "underline" },
};

// Never put malformed or unsupported protocols into an email link.
function httpLink(value?: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

const PolicyAlert = ({ dateLabel = "", items = [], unsubscribeUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`GBW Daily Brief: ${items.length} policy and market updates`}</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Row>
            <Column style={styles.logoColumn}>
              <Img src={LOGO_URL} alt="Global Bioenergy Watch globe logo" style={styles.logo} />
            </Column>
            <Column>
              <Text style={styles.brand}>Global Bioenergy Watch</Text>
              <Text style={styles.brandSub}>POLICY &amp; MARKET INTELLIGENCE</Text>
            </Column>
          </Row>
        </Section>

        <Section style={styles.intro}>
          <Text style={styles.eyebrow}>Daily subscriber briefing · {dateLabel}</Text>
          <Heading as="h1" style={styles.heading}>The Bioenergy Brief</Heading>
          <Text style={styles.introText}>
            {items.length} new {items.length === 1 ? "development" : "developments"} matched your
            policy and fuel-market coverage. Read the summary, then follow each original source
            for full details.
          </Text>
        </Section>

        {items.map((item, index) => {
          const href = httpLink(item.url);
          const category = item.category === "market" ? "Market" : "Policy";
          const details = [item.countryName, ...(item.fuels ?? []), item.publishedAt]
            .filter(Boolean)
            .join(" · ");
          return (
            <Section key={`${item.url ?? item.title ?? "update"}-${index}`} style={styles.card}>
              <Text style={styles.cardMeta}>
                {String(index + 1).padStart(2, "0")} / {category} update
                {item.countryName ? ` · ${item.countryName}` : ""}
              </Text>
              <Heading as="h2" style={styles.cardTitle}>{item.title || "New bioenergy update"}</Heading>
              {item.summary ? <Text style={styles.cardSummary}>{item.summary}</Text> : null}
              {details || item.source ? (
                <Text style={styles.cardSource}>
                  {[item.source ? `Source: ${item.source}` : "", details].filter(Boolean).join(" | ")}
                </Text>
              ) : null}
              {href ? <Link href={href} style={styles.sourceLink}>Read original source →</Link> : null}
            </Section>
          );
        })}

        <Section style={styles.action}>
          <Button href={`${WEB_URL}/timeline`} style={styles.actionButton}>
            Explore the global policy timeline
          </Button>
        </Section>
        <Hr style={{ margin: "0", borderColor: "#dce7e2" }} />
        <Section style={styles.footer}>
          <Text style={styles.footText}>
            You are receiving this email because you subscribed to Global Bioenergy Watch's daily
            policy and market updates. Summaries may be AI-assisted and can contain errors or
            omissions; confirm regulatory requirements, dates and figures with the original
            authority before relying on them.
          </Text>
          <Text style={styles.footText}>
            Global Bioenergy Watch · <Link href={WEB_URL} style={styles.footerLink}>
              globalbioenergywatch.org
            </Link>
          </Text>
          {httpLink(unsubscribeUrl) ? (
            <Text style={{ ...styles.footText, margin: "0" }}>
              No longer want these emails?{" "}
              <Link href={httpLink(unsubscribeUrl)!} style={styles.footerLink}>
                Unsubscribe from daily briefs
              </Link>
            </Text>
          ) : null}
        </Section>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: PolicyAlert,
  subject: (data: Record<string, any>) => {
    const items = Array.isArray(data["items"]) ? data["items"] : [];
    const date = String(data["dateLabel"] || new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }));
    return `GBW Daily Brief | ${date} | ${items.length} updates`;
  },
  displayName: "Daily policy and market subscriber brief",
  previewData: {
    dateLabel: "Tuesday, 17 November 2026",
    unsubscribeUrl: `${WEB_URL}/alerts/unsubscribe?token=preview-token`,
    items: [
      {
        title: "Illustrative biofuel blending policy update",
        url: "https://example.com/policy",
        summary: "A government is considering adjustments to its renewable-fuel blending obligations. The exact proposal, timeline and obligations should be checked against the official announcement.",
        source: "Official agency",
        countryName: "United States",
        fuels: ["Ethanol", "Biodiesel"],
        category: "policy",
        publishedAt: "17 Nov 2026",
      },
      {
        title: "Illustrative sustainable aviation fuel supply announcement",
        url: "https://example.com/market",
        summary: "A producer announced a possible expansion in sustainable aviation fuel supply. Verify production capacity and commercialization status with the source.",
        source: "Producer announcement",
        countryName: "Global",
        fuels: ["SAF"],
        category: "market",
        publishedAt: "16 Nov 2026",
      },
    ],
  },
} satisfies TemplateEntry;
