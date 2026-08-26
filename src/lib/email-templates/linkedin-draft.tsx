import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
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
  source?: string
  countryName?: string | null
}

interface Props {
  dateLabel?: string
  postText?: string
  publishUrl?: string
  destinationNote?: string
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
const postBox = {
  border: '1px solid #e4e8ef',
  borderLeft: '4px solid #1d4ed8',
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '0 0 16px',
  backgroundColor: '#f8fafc',
}
const postTextStyle = {
  fontSize: '14px',
  color: '#0b1220',
  lineHeight: '1.55',
  whiteSpace: 'pre-wrap' as const,
  margin: '0',
}
const ctaButton = {
  backgroundColor: '#0f766e',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 700,
  padding: '12px 22px',
  textDecoration: 'none',
}
const note = { fontSize: '12px', color: '#4a5364', lineHeight: '1.5', margin: '14px 0 0' }
const sourceCard = {
  border: '1px solid #e4e8ef',
  borderRadius: '8px',
  padding: '8px 12px',
  margin: '0 0 8px',
}
const sourceTitle = { fontSize: '13px', fontWeight: 700, color: '#0b1220', margin: '0', lineHeight: '1.4' }
const sourceMeta = { fontSize: '11px', color: '#7b8394', margin: '2px 0 0' }
const foot = { fontSize: '11px', color: '#8a92a1', margin: '18px 0 0' }

const LinkedInDraft = ({
  dateLabel = '',
  postText = '',
  publishUrl = '',
  destinationNote = 'The button publishes this exact text through the destination selected in your LinkedIn posting settings.',
  items = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your LinkedIn post for ${dateLabel} is ready to review`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={banner}>
          <Text style={bannerTitle}>Global Bioenergy Watch</Text>
          <Text style={bannerSub}>Daily LinkedIn draft · {dateLabel}</Text>
        </Section>

        <Section style={inner}>
          <Text style={kicker}>Review, then approve — nothing is posted automatically</Text>

          <Section style={postBox}>
            <Text style={postTextStyle}>{postText}</Text>
          </Section>

          <Button href={publishUrl} style={ctaButton}>
            Approve &amp; publish to LinkedIn
          </Button>

          <Text style={note}>
            {destinationNote} The approval link is single-use and expires once used.
          </Text>

          {items.length > 0 ? (
            <>
              <Hr />
              <Text style={kicker}>Source headlines used</Text>
              {items.map((it, i) => (
                <Section key={it.url ?? i} style={sourceCard}>
                  <Text style={sourceTitle}>
                    <Link href={it.url} style={{ color: '#0b1220', textDecoration: 'none' }}>
                      {it.title}
                    </Link>
                  </Text>
                  <Text style={sourceMeta}>
                    {[it.countryName, it.source].filter(Boolean).join(' · ')}
                  </Text>
                </Section>
              ))}
            </>
          ) : null}

          <Hr />
          <Text style={foot}>
            Drafted automatically each day at 13:00 UTC from globalbioenergywatch.org. AI-drafted —
            always review before publishing.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LinkedInDraft,
  subject: (data: Record<string, any>) =>
    `Your LinkedIn post is ready — ${data['dateLabel'] || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`,
  displayName: 'Daily LinkedIn draft',
  previewData: {
    dateLabel: 'Wednesday, 12 August 2026',
    postText:
      'Global bioenergy policy moved on several fronts today.\n\n• United States — EPA finalised 2027 RFS volumes (epa.gov)\n• Brazil — ANP raised the biodiesel blend to B15 (gov.br)\n\nWatch feedstock and credit markets into Q4.\n\n#biofuels #bioenergy #SAF #ethanol #policy\nFull tracker: https://globalbioenergywatch.org',
    publishUrl: 'https://globalbioenergywatch.org/api/public/linkedin-publish?token=preview',
    items: [
      {
        title: 'EPA finalises 2027 Renewable Fuel Standard volumes',
        url: 'https://example.com/rfs',
        source: 'epa.gov',
        countryName: 'United States',
      },
    ],
  },
} satisfies TemplateEntry
