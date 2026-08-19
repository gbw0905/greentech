import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  title?: string
  brief?: string
  jurisdiction?: string
  fuels?: string[]
  source?: string
  dateLabel?: string
  category?: string
  url?: string
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Calibri, Carlito, Segoe UI, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '640px' }
const kicker = {
  fontSize: '11px',
  color: '#1257d6',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.09em',
  fontWeight: 700,
  margin: '0 0 6px',
}
const heading = { fontSize: '23px', lineHeight: '1.25', margin: '0 0 8px', color: '#0b1220' }
const meta = {
  fontSize: '11px',
  color: '#6b7484',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 16px',
}
const sectionLabel = {
  fontSize: '11px',
  color: '#0b1220',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.09em',
  fontWeight: 700,
  margin: '0 0 6px',
}
const text = { fontSize: '14px', color: '#2c3444', margin: '0 0 14px', lineHeight: '1.6' }
const link = { color: '#1257d6', fontSize: '13px', fontWeight: 700 }
const foot = { fontSize: '11px', color: '#8a92a1', margin: '18px 0 0', lineHeight: '1.5' }

const PolicyBrief = ({
  title = '',
  brief = '',
  jurisdiction = 'Global',
  fuels = [],
  source = '',
  dateLabel = '',
  category = 'policy',
  url = '#',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`AI brief: ${title}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>
          Global Bioenergy Watch — {category === 'market' ? 'Market brief' : 'Policy brief'}
        </Text>
        <Heading style={heading}>{title}</Heading>
        <Text style={meta}>
          {[jurisdiction, fuels.join(' · '), source, dateLabel].filter(Boolean).join(' — ')}
        </Text>

        <Hr />
        <Text style={sectionLabel}>AI brief</Text>
        {brief
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((p, i) => (
            <Text key={i} style={text}>
              {p}
            </Text>
          ))}

        <Link href={url} style={link}>
          Read the original source →
        </Link>

        <Hr />
        <Text style={foot}>
          This brief is AI-generated from public reporting and may contain errors or omissions.
          Always cross-verify against the original announcement before acting on it. Sent by
          globalbioenergywatch.org
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PolicyBrief,
  subject: (data: Record<string, any>) =>
    `Global Bioenergy Market and Policy Updates — ${data['dateLabel'] || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`,
  displayName: 'AI policy brief',
  previewData: {
    title: 'Brazil raises the mandatory ethanol blend to E30',
    jurisdiction: 'Brazil',
    fuels: ['Ethanol'],
    source: 'gov.br',
    dateLabel: '8 August 2026',
    category: 'policy',
    url: 'https://example.com/e30',
    brief:
      'Brazil’s National Energy Policy Council approved an increase in the mandatory anhydrous ethanol blend in gasoline from 27% to 30%, effective from the start of the next compliance window.\n\nThe move lifts structural domestic demand for sugarcane and corn ethanol, tightens the balance available for export, and forces fuel distributors to revalidate blending infrastructure and quality controls ahead of the deadline.',
  },
} satisfies TemplateEntry
