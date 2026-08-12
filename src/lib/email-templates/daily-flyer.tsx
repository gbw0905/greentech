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
  Section,
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
const container = { padding: '0 0 24px', maxWidth: '620px' }
const banner = {
  background: 'linear-gradient(90deg, #0f766e 0%, #1d4ed8 55%, #7c3aed 100%)',
  backgroundColor: '#1d4ed8',
  padding: '22px 28px',
  borderRadius: '12px',
}
const bannerTitle = { fontSize: '25px', fontWeight: 700, color: '#ffffff', margin: '0' }
const bannerSub = { fontSize: '13px', color: '#dbeafe', margin: '6px 0 0' }
const inner = { padding: '20px 28px 0' }
const kicker = {
  fontSize: '11px',
  letterSpacing: '0.09em',
  textTransform: 'uppercase' as const,
  color: '#6b7484',
  margin: '0 0 12px',
}
const card = {
  border: '1px solid #e4e8ef',
  borderLeft: '4px solid #0f766e',
  borderRadius: '10px',
  padding: '12px 14px',
  margin: '0 0 12px',
}
const rank = { fontSize: '11px', fontWeight: 700, color: '#0f766e', margin: '0 0 4px', letterSpacing: '0.06em' }
const title = { fontSize: '16px', fontWeight: 700, color: '#0b1220', margin: '0 0 6px', lineHeight: '1.35' }
const linkStyle = { color: '#0b1220', textDecoration: 'none' }
const summary = { fontSize: '13px', color: '#4a5364', margin: '0 0 6px', lineHeight: '1.45' }
const meta = { fontSize: '11px', color: '#7b8394', margin: '0' }
const foot = { fontSize: '11px', color: '#8a92a1', margin: '18px 0 0' }
const cta = { fontSize: '13px', color: '#1d4ed8', margin: '14px 0 0' }

const DailyFlyer = ({ dateLabel = '', items = [] }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Top ${items.length} global bioenergy policy headlines — ${dateLabel}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={banner}>
          <Text style={bannerTitle}>Global Bioenergy Watch</Text>
          <Text style={bannerSub}>Daily flyer · Top {items.length} biofuel policy headlines · {dateLabel}</Text>
        </Section>

        <Section style={inner}>
          <Text style={kicker}>Ready to post — copy any headline straight to your page</Text>

          {items.length === 0 ? (
            <Text style={summary}>No new policy headlines landed in the last 24 hours.</Text>
          ) : (
            items.map((it, i) => (
              <Section key={it.url ?? i} style={card}>
                <Text style={rank}>#{i + 1}</Text>
                <Text style={title}>
                  <Link href={it.url} style={linkStyle}>
                    {it.title}
                  </Link>
                </Text>
                {it.summary ? <Text style={summary}>{it.summary}</Text> : null}
                <Text style={meta}>
                  {[it.countryName, it.source, (it.fuels ?? []).join(', ')].filter(Boolean).join(' · ')}
                </Text>
              </Section>
            ))
          )}

          <Hr />
          <Text style={cta}>
            <Link href="https://globalbioenergywatch.org/timeline" style={{ color: '#1d4ed8' }}>
              See the full policy timeline →
            </Link>
          </Text>
          <Text style={foot}>Sent automatically each day from globalbioenergywatch.org</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DailyFlyer,
  subject: (data: Record<string, any>) =>
    `Daily flyer — top ${Array.isArray(data['items']) ? data['items'].length : 10} bioenergy policy headlines`,
  displayName: 'Daily headlines flyer',
  previewData: {
    dateLabel: 'Wednesday, 12 August 2026',
    items: [
      {
        title: 'EPA finalises 2027 Renewable Fuel Standard volumes',
        url: 'https://example.com/rfs',
        summary: 'The agency set higher cellulosic and advanced biofuel obligations for obligated parties.',
        source: 'epa.gov',
        countryName: 'United States',
        fuels: ['Ethanol'],
      },
    ],
  },
} satisfies TemplateEntry
