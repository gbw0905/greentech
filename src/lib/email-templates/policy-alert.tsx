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

interface Item {
  title?: string
  url?: string
  summary?: string
  source?: string
  countryName?: string | null
  fuels?: string[]
}

interface Props {
  dateLabel?: string
  items?: Item[]
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Calibri, Carlito, Segoe UI, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '640px' }
const heading = { fontSize: '22px', margin: '0 0 4px', color: '#0b1220' }
const sub = { fontSize: '13px', color: '#5b6577', margin: '0 0 18px' }
const itemTitle = { fontSize: '15px', fontWeight: 700, margin: '0 0 4px', color: '#0b1220' }
const itemMeta = {
  fontSize: '11px',
  color: '#6b7484',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px',
}
const itemText = { fontSize: '13px', color: '#2c3444', margin: '0 0 4px', lineHeight: '1.5' }
const link = { color: '#1257d6', fontSize: '13px' }
const foot = { fontSize: '11px', color: '#8a92a1', margin: '18px 0 0' }

const PolicyAlert = ({ dateLabel = '', items = [] }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${items.length} new bioenergy policy updates`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New bioenergy policy updates</Heading>
        <Text style={sub}>{dateLabel}</Text>

        {items.map((it, i) => (
          <div key={`${it.url}-${i}`}>
            <Text style={itemMeta}>
              {[it.countryName, it.source, (it.fuels ?? []).join(' · ')].filter(Boolean).join(' — ')}
            </Text>
            <Text style={itemTitle}>{it.title}</Text>
            {it.summary ? <Text style={itemText}>{it.summary}</Text> : null}
            <Link href={it.url} style={link}>
              Read the source
            </Link>
            <Hr />
          </div>
        ))}

        <Text style={foot}>
          Summaries are AI-generated from public sources — always cross-verify against the original
          announcement. Sent by globalbioenergywatch.org
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PolicyAlert,
  subject: (data: Record<string, any>) =>
    `Global Bioenergy Market and Policy Updates — ${data['dateLabel'] || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`,
  displayName: 'Policy update alert',
  previewData: {
    dateLabel: 'Saturday, 8 August 2026',
    items: [
      {
        title: 'Brazil raises the mandatory ethanol blend to E30',
        url: 'https://example.com/e30',
        summary: 'CNPE approved an increase in the anhydrous ethanol blend in gasoline.',
        source: 'gov.br',
        countryName: 'Brazil',
        fuels: ['Ethanol'],
      },
    ],
  },
} satisfies TemplateEntry