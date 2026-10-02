import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Linkedin } from "lucide-react";

const LINKEDIN_URL = "https://www.linkedin.com/company/global-bioenergy-watch/";

const TITLE = "Contact Global Bioenergy Watch";
const DESCRIPTION =
  "Get in touch with the Global Bioenergy Watch desk about biofuel policy updates, data corrections or partnerships.";
const URL = "https://globalbioenergywatch.org/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div>
      <main className="mx-auto max-w-[80rem] px-5 py-8 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="ink-bar mb-6 px-5 py-6 sm:px-7">
            <div className="flex items-center gap-2 text-accent">
              <Linkedin className="size-3.5" />
              <span className="kicker text-accent">Contact</span>
            </div>
            <h1 className="mt-2 font-display text-3xl leading-[1.05] font-extrabold tracking-[-0.03em] text-ink-foreground sm:text-[2.6rem]">
              Get in touch
            </h1>
            <p className="mt-2 max-w-3xl text-sm/relaxed text-ink-muted">
              Reach the Global Bioenergy Watch desk on LinkedIn for press, partnerships, data
              corrections, or general inquiries.
            </p>
            <div className="mt-4 h-0.5 w-24 rounded-full bg-accent" />
          </div>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="font-display text-xl font-bold">Connect on LinkedIn</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Messages are managed through the Global Bioenergy Watch company page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-4 transition-colors hover:bg-muted"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[#0A66C2] text-white">
                  <Linkedin className="size-6 fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-foreground">
                    Global Bioenergy Watch
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    linkedin.com/company/global-bioenergy-watch
                  </p>
                </div>
              </a>
              <Button asChild className="mt-4 w-full bg-accent text-white hover:bg-accent/90">
                <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 size-4 fill-current" />
                  Message on LinkedIn
                </a>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Contact method</p>
            <p className="mt-1">
              LinkedIn is the fastest way to reach the Global Bioenergy Watch desk for press,
              partnerships, data corrections, or general inquiries.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
