import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, ArrowLeft, Linkedin } from "lucide-react";
import siteLogo from "@/assets/logo.png";

const OFFICIAL_EMAIL = "info@globalbioenergywatch.org";

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(120),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
});

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData();
        const payload = {
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        };
        const parsed = contactSchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json({ ok: false, error: "Please check all fields and try again." }, { status: 400 });
        }
        try {
          await sendTemplateEmail("contact-form", OFFICIAL_EMAIL, {
            templateData: parsed.data,
            replyTo: parsed.data.email,
            idempotencyKey: `contact-${parsed.data.email}-${Date.now()}`,
          });
          return Response.json({ ok: true });
        } catch (error) {
          console.error("Contact form send failed:", error);
          return Response.json({ ok: false, error: "Message could not be sent. Please try again later." }, { status: 500 });
        }
      },
    },
  },
});

function ContactPage() {
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await fetch("/contact", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (result.ok) {
      form.reset();
      alert("Thank you — your message has been sent.");
    } else {
      alert(result.error || "Something went wrong.");
    }
    router.invalidate();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/30 bg-black text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-5 sm:py-2.5 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Link to="/" className="shrink-0">
              <img
                src={siteLogo}
                alt="Global Bioenergy Watch logo"
                width={1024}
                height={1024}
                className="size-8 rounded-md object-contain sm:size-9"
              />
            </Link>
            <div className="min-w-0">
              <Link
                to="/"
                className="block truncate font-display text-base leading-none font-extrabold tracking-tight text-white transition-colors hover:text-white/80 sm:text-xl lg:text-[1.4rem]"
              >
                Global Bioenergy Watch
              </Link>
            </div>
          </div>
          <Link
            to="/"
            className="label-mono inline-flex shrink-0 items-center gap-2 border border-white/40 bg-black px-2.5 py-1.5 font-bold text-white transition-all hover:border-white hover:bg-white/10 sm:px-3.5 sm:py-2"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[80rem] px-5 py-8 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="ink-bar mb-6 px-5 py-6 sm:px-7">
            <div className="flex items-center gap-2 text-accent">
              <Mail className="size-3.5" />
              <span className="kicker text-accent">Contact</span>
            </div>
            <h1 className="mt-2 font-display text-3xl leading-[1.05] font-extrabold tracking-[-0.03em] text-ink-foreground sm:text-[2.6rem]">
              Get in touch
            </h1>
            <p className="mt-2 max-w-3xl text-sm/relaxed text-ink-muted">
              Reach the Global Bioenergy Watch desk. For press, partnerships, data corrections, or general inquiries, email{" "}
              <a href={`mailto:${OFFICIAL_EMAIL}`} className="font-bold text-accent underline">
                {OFFICIAL_EMAIL}
              </a>
              .
            </p>
            <div className="mt-4 h-0.5 w-24 rounded-full bg-accent" />
          </div>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="font-display text-xl font-bold">Send a message</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                All fields are required. We aim to reply within two business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required maxLength={120} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required maxLength={120} placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" required maxLength={200} placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={6}
                    placeholder="Tell us what you need..."
                  />
                </div>
                <Button type="submit" className="w-full bg-accent text-white hover:bg-accent/90">
                  <Mail className="mr-2 size-4" />
                  Send message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Receiving inbox note</p>
            <p className="mt-1">
              Lovable's managed email service sends outbound messages only. To actually receive replies at{" "}
              <strong>{OFFICIAL_EMAIL}</strong>, you need a mailbox with an external email provider (e.g., Google Workspace,
              Zoho Mail, or Microsoft 365) and add its MX records at your domain registrar. The delegated{" "}
              <code>notify.globalbioenergywatch.org</code> subdomain used for sending can stay in place.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-black py-8 text-white">
        <div className="mx-auto max-w-[80rem] px-5 lg:px-8">
          <p className="text-xs text-white/70">
            Updates are aggregated from live web sources and auto-classified by jurisdiction and fuel type. Verify
            against primary legislation before use in compliance decisions.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-white">
            <span>© 2026 All rights reserved — Global Bioenergy Watch —</span>
            <a
              href="https://www.linkedin.com/in/asifulalam0905024/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0A66C2]/20 px-2 py-1 text-[#93C5FD] transition-colors hover:bg-[#0A66C2]/30"
            >
              <Linkedin className="size-4 fill-current" />
              <span>Syed Asiful Alam, PhD</span>
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
