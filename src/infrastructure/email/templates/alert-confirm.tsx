import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "../registry";

interface Props {
  confirmUrl?: string;
  fuels?: string[];
  countries?: string[];
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "Calibri, Carlito, Segoe UI, Arial, sans-serif",
};
const container = { padding: "24px 28px", maxWidth: "600px" };
const heading = { fontSize: "22px", margin: "0 0 8px", color: "#0b1220" };
const text = { fontSize: "14px", color: "#2c3444", margin: "0 0 14px", lineHeight: "1.55" };
const button = {
  backgroundColor: "#1257d6",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "12px 20px",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};
const foot = { fontSize: "11px", color: "#8a92a1", margin: "20px 0 0" };

const AlertConfirm = ({ confirmUrl = "#", fuels = [], countries = [] }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your Global Bioenergy Watch policy alerts</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Confirm your policy alerts</Heading>
        <Text style={text}>
          You asked to receive a daily AI-written brief whenever new bioenergy policy or market
          updates land on Global Bioenergy Watch. Confirm the address to start receiving them.
        </Text>
        <Text style={text}>
          Coverage: <strong>{fuels.length > 0 ? fuels.join(", ") : "all fuel types"}</strong>
        </Text>
        <Text style={text}>
          Countries:{" "}
          <strong>{countries.length > 0 ? countries.join(", ") : "all countries"}</strong>
        </Text>
        <Button href={confirmUrl} style={button}>
          Confirm subscription
        </Button>
        <Text style={foot}>
          If you did not request this, ignore this email and nothing will be sent.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: AlertConfirm,
  subject: "Confirm your Global Bioenergy Watch policy alerts",
  displayName: "Alert subscription confirmation",
  previewData: {
    confirmUrl: "https://www.globalbioenergywatch.org/alerts/confirm?token=example",
    fuels: ["Ethanol", "SAF"],
    countries: ["United States", "Brazil"],
  },
} satisfies TemplateEntry;
