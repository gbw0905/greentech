import React from "react";
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
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
const LOGO_URL = WEB_URL + "/email/gbw-official-wordmark-hq.jpg";
const PHOTO_URL = WEB_URL + "/email/gbw-industrial-agriculture-hq.jpg";
const GREEN = "#073b29";

const styles = {
  page: {
    margin: "0", padding: "22px 8px", backgroundColor: "#e9f0eb",
    fontFamily: "Arial, Helvetica, sans-serif", color: "#152e23",
  },
  container: {
    maxWidth: "620px", margin: "0 auto", border: "1px solid #d6e3da",
    backgroundColor: "#ffffff",
  },
  logoHeader: { padding: "18px 24px 17px", backgroundColor: "#ffffff" },
  logo: { display: "block", width: "330px", maxWidth: "100%", height: "auto" },
  darkTitle: {
    fontSize: "42px", lineHeight: "1.06", color: "#f5fbf7",
    margin: "12px 0 15px", fontWeight: 700, letterSpacing: "-1.3px",
  },
  eyebrow: {
    fontSize: "10px", color: "#b9ddc9", fontWeight: 700,
    letterSpacing: "1.3px", lineHeight: "16px", margin: "0 0 13px",
  },
  intro: { fontSize: "14px", color: "#d2e3d8", lineHeight: "22px", margin: "0 0 18px" },
  issue: { fontSize: "12px", color: "#e5f2eb", margin: "0 0 19px" },
  feature: {
    padding: "17px 0 11px", borderTop: "1px solid #678a7a", margin: "0",
  },
  num: {
    fontSize: "10px", color: "#b9ddc9", letterSpacing: "1px",
    fontWeight: 700, margin: "0 0 7px", lineHeight: "16px",
  },
  featureTitle: {
    fontSize: "18px", color: "#ffffff", lineHeight: "25px",
    fontWeight: 700, margin: "0 0 8px",
  },
  featureText: {
    fontSize: "13px", color: "#d8e8de", lineHeight: "20px", margin: "0 0 10px",
  },
  featureMeta: {
    fontSize: "11px", color: "#c5ddcf", lineHeight: "17px", margin: "0 0 9px",
  },
  featureLink: { fontSize: "12px", color: "#effaf2", textDecoration: "underline", fontWeight: 700 },
  bottomCard: {
    padding: "20px 26px", borderBottom: "1px solid #b5c9bd",
    backgroundColor: "#f3f8f5",
  },
  bottomTitle: {
    fontSize: "18px", color: "#123b29", lineHeight: "24px",
    fontWeight: 700, margin: "0 0 8px",
  },
  bottomText: { fontSize: "13px", lineHeight: "20px", color: "#385747", margin: "0 0 10px" },
  action: { padding: "23px 26px", backgroundColor: "#e5f2e9" },
  button: {
    padding: "12px 17px", backgroundColor: GREEN, color: "#ffffff",
    fontSize: "13px", fontWeight: 700, borderRadius: "3px",
  },
  footer: { padding: "20px 26px", backgroundColor: "#ffffff" },
  footerText: {
    fontSize: "11px", color: "#55685b", lineHeight: "18px", margin: "0 0 10px",
  },
  footerLink: { fontSize: "11px", color: "#145f46", textDecoration: "underline" },
};

function safeUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch { return null; }
}

function UpdateContent({
  item, index, dark,
}: { item: Item; index: number; dark: boolean }) {
  const href = safeUrl(item.url);
  const type = item.category === "market" ? "MARKET" : "POLICY";
  const metadata = [
    item.countryName, item.source ? "Source: " + item.source : "",
    ...(item.fuels ?? []), item.publishedAt,
  ].filter(Boolean).join(" · ");
  return (
    <Section style={dark ? styles.feature : styles.bottomCard}>
      <Text style={styles.num}>
        {String(index + 1).padStart(2, "0")} / {type} INTELLIGENCE
      </Text>
      <Heading as="h2" style={dark ? styles.featureTitle : styles.bottomTitle}>
        {item.title || "New bioenergy update"}
      </Heading>
      {item.summary ? (
        <Text style={dark ? styles.featureText : styles.bottomText}>{item.summary}</Text>
      ) : null}
      {metadata ? (
        <Text style={dark ? styles.featureMeta : styles.bottomText}>{metadata}</Text>
      ) : null}
      {href ? (
        <Link href={href} style={dark ? styles.featureLink : styles.footerLink}>
          Read original source →
        </Link>
      ) : null}
    </Section>
  );
}

const PolicyAlert = ({ dateLabel = "", items = [], unsubscribeUrl }: Props) => {
  const featured = items.slice(0, 2);
  const remaining = items.slice(2);
  const unsubscribeLink = safeUrl(unsubscribeUrl);
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <style>{'@media only screen and (max-width:540px){.gbw-photo{display:none!important;width:0!important;max-width:0!important;overflow:hidden!important}.gbw-editorial{width:100%!important}.gbw-headline{font-size:34px!important;line-height:1.09!important}}'}</style>
      </Head>
      <Preview>
        {"The Bioenergy Brief: " + items.length + " updates | " + dateLabel}
      </Preview>
      <Body style={styles.page}>
        <Container style={styles.container}>
          <Section style={styles.logoHeader}>
            <Img
              src={LOGO_URL}
              width={330}
              height={103}
              alt="Global Bioenergy Watch — Policy | Markets | Sustainable Fuels"
              style={styles.logo}
            />
          </Section>

          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}
            style={{ borderCollapse: "collapse", width: "100%", backgroundColor: GREEN }}>
            <tbody><tr>
              <td className="gbw-photo" width="126" valign="top"
                style={{ width: "126px", verticalAlign: "top", backgroundColor: "#c6cdd0" }}>
                <Img src={PHOTO_URL} width={126} height={697}
                  alt="Industrial bioenergy facility and agricultural field"
                  style={{ display: "block", width: "126px", height: "auto" }} />
              </td>
              <td className="gbw-editorial" valign="top"
                style={{ padding: "28px 25px 15px", verticalAlign: "top", backgroundColor: GREEN }}>
                <Text style={styles.eyebrow}>POLICY  |  MARKETS  |  SUSTAINABLE FUELS</Text>
                <Heading as="h1" className="gbw-headline" style={styles.darkTitle}>
                  The Daily Bioenergy Brief.
                </Heading>
                <Text style={styles.issue}>{dateLabel || "Global edition"}</Text>
                <Text style={styles.intro}>
                  Renewable fuel policy, market dynamics and compliance developments,
                  brought together in one concise daily intelligence digest.
                </Text>
                {featured.map((item, index) => (
                  <UpdateContent key={index} item={item} index={index} dark={true} />
                ))}
              </td>
            </tr></tbody>
          </table>

          {remaining.map((item, index) => (
            <UpdateContent key={index + 2} item={item} index={index + 2} dark={false} />
          ))}
          <Section style={styles.action}>
            <Button href={WEB_URL + "/timeline"} style={styles.button}>
              Explore the global policy timeline →
            </Button>
          </Section>
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              You are receiving this message because you subscribed to Global Bioenergy
              Watch's daily policy and market brief. These summaries may be AI-assisted
              and can contain errors or omissions. Verify numbers, effective dates and
              compliance requirements against the original authority before acting.
            </Text>
            <Text style={styles.footerText}>
              Global Bioenergy Watch · <Link href={WEB_URL} style={styles.footerLink}>
                globalbioenergywatch.org
              </Link>
            </Text>
            {unsubscribeLink ? (
              <Text style={styles.footerText}>
                Prefer not to receive these?{" "}
                <Link href={unsubscribeLink} style={styles.footerLink}>
                  Unsubscribe from daily briefs
                </Link>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: PolicyAlert,
  subject: (data: Record<string, any>) => {
    const items = Array.isArray(data["items"]) ? data["items"] : [];
    const date = String(data["dateLabel"] || new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }));
    return "GBW Daily Brief | " + date + " | " + items.length + " updates";
  },
  displayName: "High-resolution daily policy and market brief",
  previewData: {
    dateLabel: "Tuesday, 17 November 2026",
    unsubscribeUrl: WEB_URL + "/alerts/unsubscribe?token=preview-token",
    items: [
      {
        title: "Illustrative renewable fuel blending policy update",
        url: "https://example.com/policy",
        summary: "An illustrative update showing how changes to renewable fuel blending requirements, compliance timing and affected parties will appear in the daily subscriber edition.",
        source: "Policy authority", countryName: "United States",
        fuels: ["Ethanol", "Biodiesel"], category: "policy",
        publishedAt: "17 Nov 2026",
      },
      {
        title: "Illustrative sustainable aviation fuel supply announcement",
        url: "https://example.com/market",
        summary: "A sample market note on potential SAF supply, offtake arrangements and delivery constraints, with primary-source links in real editions.",
        source: "Producer announcement", countryName: "Global",
        fuels: ["SAF"], category: "market", publishedAt: "17 Nov 2026",
      },
      {
        title: "Illustrative compliance methodology watch",
        url: "https://example.com/methodology",
        summary: "A sample alert about carbon-intensity methodology and documentation requirements. Actual summaries will cite the applicable official sources.",
        source: "Regulatory update", countryName: "European Union",
        fuels: ["Renewable diesel"], category: "policy", publishedAt: "16 Nov 2026",
      },
    ],
  },
} satisfies TemplateEntry;
