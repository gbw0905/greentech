import React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "../registry";

interface Props {
  confirmUrl?: string;
  fuels?: string[];
  countries?: string[];
}

const site = "https://www.globalbioenergywatch.org";
const page = {
  backgroundColor: "#f4f7f9",
  fontFamily: "Arial, Helvetica, sans-serif",
  margin: "0",
  padding: "24px 8px",
};
const container = {
  maxWidth: "600px",
  border: "1px solid #e1e9e4",
  backgroundColor: "#ffffff",
};
const header = { padding: "23px 24px", borderBottom: "3px solid #08785a" };
const body = { padding: "26px 24px 16px" };
const heading = {
  color: "#142823",
  fontSize: "25px",
  lineHeight: "32px",
  margin: "0 0 10px",
};
const text = {
  color: "#41564e",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 15px",
};
const button = {
  backgroundColor: "#08785a",
  color: "#ffffff",
  borderRadius: "5px",
  padding: "13px 21px",
  fontSize: "14px",
  fontWeight: 700,
};
const footer = {
  padding: "18px 24px",
  backgroundColor: "#f4f8f6",
  color: "#5d7069",
  fontSize: "11px",
  lineHeight: "18px",
};

const AlertConfirm = ({ confirmUrl = "#", fuels = [], countries = [] }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>One quick step to activate your GBW Daily Brief subscription</Preview>
    <Body style={page}>
      <Container style={container}>
        <Section style={header}>
          <Row>
            <Column style={{ width: "56px", verticalAlign: "middle" }}>
              <Img
                src={`${site}/icon-192.png`}
                alt="Global Bioenergy Watch globe logo"
                width="44"
                height="44"
                style={{ display: "block", borderRadius: "8px" }}
              />
            </Column>
            <Column>
              <Text style={{ color: "#102d2a", fontSize: "18px", fontWeight: 800, margin: "0 0 3px" }}>
                Global Bioenergy Watch
              </Text>
              <Text style={{ color: "#527066", fontSize: "10px", letterSpacing: "1.3px", fontWeight: 700, margin: "0" }}>
                POLICY &amp; MARKET INTELLIGENCE
              </Text>
            </Column>
          </Row>
        </Section>
        <Section style={body}>
          <Text style={{ color: "#08785a", fontSize: "11px", letterSpacing: "0.8px", fontWeight: 700, margin: "0 0 8px" }}>
            SUBSCRIPTION CONFIRMATION
          </Text>
          <Heading as="h1" style={heading}>Confirm your daily brief</Heading>
          <Text style={text}>
            Thanks for signing up. Confirm your email address to begin receiving one daily digest
            of the bioenergy policy and market developments that match your preferences.
          </Text>
          <Section style={{ padding: "13px 16px", backgroundColor: "#f1f7f4", margin: "0 0 23px" }}>
            <Text style={{ ...text, margin: "0 0 5px" }}>
              <strong>Countries:</strong> {countries.length ? countries.join(", ") : "All countries"}
            </Text>
            <Text style={{ ...text, margin: "0" }}>
              <strong>Fuel types:</strong> {fuels.length ? fuels.join(", ") : "All fuel types"}
            </Text>
          </Section>
          <Button href={confirmUrl} style={button}>Confirm subscription</Button>
          <Text style={{ ...text, fontSize: "12px", margin: "18px 0 0" }}>
            If the button does not work, copy this link into your browser: {confirmUrl}
          </Text>
        </Section>
        <Section style={footer}>
          You are receiving this one-time confirmation because someone submitted this address
          to Global Bioenergy Watch. If it wasn't you, ignore this email. No daily briefs will be
          sent unless you confirm.
        </Section>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: AlertConfirm,
  subject: "Confirm your GBW Daily Brief subscription",
  displayName: "Daily brief subscription confirmation",
  previewData: {
    confirmUrl: `${site}/alerts/confirm?token=example`,
    fuels: ["Ethanol", "SAF"],
    countries: ["United States", "Brazil"],
  },
} satisfies TemplateEntry;
