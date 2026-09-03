import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuthSession } from "@/hooks/useAuthSession";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Global Bioenergy Watch" },
      {
        name: "description",
        content:
          "Sign in to Global Bioenergy Watch to export chart data as CSV and receive AI-written analyst summaries by email.",
      },
      { property: "og:title", content: "Sign in — Global Bioenergy Watch" },
      {
        property: "og:description",
        content: "Free account access for CSV exports and emailed bioenergy analyst summaries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuthSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("Check your inbox and confirm your email address to finish signing up.");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-md">
        <div className="ink-bar mb-4 px-4 py-3">
          <h1 className="font-display text-xl font-extrabold tracking-tight">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1 text-xs opacity-90">
            Required for CSV exports and emailed analyst summaries.
          </p>
        </div>

        <div className="rounded-sm border border-border bg-card p-4">
          <button
            type="button"
            onClick={google}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-85"
          >
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="auth-email" className="label-mono block text-muted-foreground">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="chart-select mt-1 w-full"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="label-mono block text-muted-foreground">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="chart-select mt-1 w-full"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 border border-ink bg-ink px-3 py-2 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm font-semibold text-destructive">{error}</p> : null}
          {notice ? <p className="mt-3 text-sm font-semibold text-foreground">{notice}</p> : null}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
            className="mt-4 text-xs font-semibold text-foreground underline underline-offset-4"
          >
            {mode === "signin"
              ? "No account yet? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
