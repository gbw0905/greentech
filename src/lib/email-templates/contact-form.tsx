import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const ContactFormEmail = ({ name, email, subject, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New message from {name || 'Global Bioenergy Watch contact form'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New contact form submission</Heading>
        <Section style={section}>
          <Text style={label}>From</Text>
          <Text style={value}>{name || 'Anonymous'} &lt;{email || 'no-reply'}&gt;</Text>

          <Text style={label}>Subject</Text>
          <Text style={value}>{subject || 'No subject'}</Text>

          <Text style={label}>Message</Text>
          <Text style={messageStyle}>{message || 'No message provided.'}</Text>
        </Section>
        <Text style={footer}>Reply to this email to respond directly to the sender.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactFormEmail,
  subject: (data: Record<string, any>) => `[Global Bioenergy Watch] Contact: ${data['subject'] || 'New message'}`,
  displayName: 'Contact form submission',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Partnership inquiry',
    message: 'I would like to discuss a research collaboration on biofuel policy tracking.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', padding: '20px 0' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px', backgroundColor: '#ffffff' }
const heading = { fontSize: '22px', fontWeight: 'bold', color: '#0a1f3d', marginBottom: '20px' }
const section = { marginBottom: '24px' }
const label = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }
const value = { fontSize: '16px', color: '#0a1f3d', marginTop: '0', marginBottom: '16px' }
const messageStyle = { fontSize: '15px', lineHeight: '1.5', color: '#0a1f3d', whiteSpace: 'pre-wrap' as const, marginTop: '0' }
const footer = { fontSize: '12px', color: '#64748b', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }
