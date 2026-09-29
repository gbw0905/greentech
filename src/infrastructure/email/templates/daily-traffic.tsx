import React from "react";
import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "../registry";

interface TopPath {
  path?: string;
  views?: number;
}

interface Props {
  dateLabel?: string;
  viewsToday?: number;
  uniqueVisitors?: number;
  totalViews?: number;
  views7d?: number;
  liveNow?: number;
  topPaths?: TopPath[];
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "Calibri, Carlito, Segoe UI, Arial, sans-serif",
};
const container = { padding: "24px 28px", maxWidth: "600px" };
const heading = { fontSize: "22px", margin: "0 0 4px", color: "#0b1220" };
const sub = { fontSize: "13px", color: "#5b6577", margin: "0 0 20px" };
const statBox = {
  border: "1px solid #e4e8ef",
  borderRadius: "10px",
  padding: "12px 14px",
  margin: "0 6px 12px 0",
};
const statValue = { fontSize: "24px", fontWeight: 700, color: "#0b1220", margin: "0" };
const statLabel = {
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  color: "#6b7484",
  margin: "2px 0 0",
};
const rowText = { fontSize: "13px", color: "#2c3444", margin: "0 0 6px" };
const foot = { fontSize: "11px", color: "#8a92a1", margin: "16px 0 0" };

const DailyTraffic = ({
  dateLabel = "",
  viewsToday = 0,
  uniqueVisitors = 0,
  totalViews = 0,
  views7d = 0,
  liveNow = 0,
  topPaths = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${viewsToday} views in the last 24h on Global Bioenergy Watch`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Global Bioenergy Watch — daily traffic</Heading>
        <Text style={sub}>{dateLabel}</Text>

        <Section>
          <Row>
            <Column style={statBox}>
              <Text style={statValue}>{viewsToday}</Text>
              <Text style={statLabel}>Views today</Text>
            </Column>
            <Column style={statBox}>
              <Text style={statValue}>{views7d}</Text>
              <Text style={statLabel}>Views (7 days)</Text>
            </Column>
          </Row>
          <Row>
            <Column style={statBox}>
              <Text style={statValue}>{uniqueVisitors}</Text>
              <Text style={statLabel}>Unique visitors</Text>
            </Column>
            <Column style={statBox}>
              <Text style={statValue}>{totalViews}</Text>
              <Text style={statLabel}>All-time views</Text>
            </Column>
          </Row>
        </Section>

        <Text style={rowText}>
          Readers active in the last 5 minutes: <strong>{liveNow}</strong>
        </Text>

        <Hr />
        <Text style={{ ...rowText, fontWeight: 700 }}>Most visited pages</Text>
        {topPaths.length === 0 ? (
          <Text style={rowText}>No page views recorded yet.</Text>
        ) : (
          topPaths.map((p) => (
            <Text key={p.path} style={rowText}>
              {p.path || "/"} — {p.views ?? 0} views
            </Text>
          ))
        )}

        <Text style={foot}>Sent automatically each day from globalbioenergywatch.org</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: DailyTraffic,
  subject: (data: Record<string, any>) =>
    `Daily traffic — ${data["viewsToday"] ?? 0} views on Global Bioenergy Watch`,
  displayName: "Daily traffic digest",
  previewData: {
    dateLabel: "Thursday, 6 August 2026",
    viewsToday: 412,
    uniqueVisitors: 1893,
    totalViews: 12045,
    views7d: 2310,
    liveNow: 7,
    topPaths: [
      { path: "/", views: 820 },
      { path: "/countries/brazil", views: 214 },
      { path: "/countries/india", views: 168 },
    ],
  },
} satisfies TemplateEntry;
