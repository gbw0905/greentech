import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { MotionReveal } from "@/components/MotionReveal";

export function AuthPage({
  initialMode = "signin",
  callbackError,
  next,
}: {
  initialMode?: "signin" | "signup";
  callbackError?: string;
  next?: "/pricing";
}) {
  const { user, loading, refreshSession } = useAuthSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(callbackError ?? "");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function changeMode(nextMode: "signin" | "signup") {
    if (busy || mode === nextMode) return;
    setMode(nextMode);
    setError("");
    setNotice("");
    setShowPassword(false);
  }

  useEffect(() => {
    if (!loading && user) navigate({ to: next ?? "/", replace: true });
  }, [loading, user, navigate, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const endpoint = mode === "signup" ? "/api/auth/sign-up" : "/api/auth/sign-in";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      if (data.needsConfirmation) {
        setNotice("Check your inbox and confirm your email address to finish signing up.");
      } else {
        await refreshSession();
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
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback${next ? "?next=%2Fpricing" : ""}`,
        },
      });
      if (err) throw err;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  async function microsoft() {
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback${next ? "?next=%2Fpricing" : ""}`,
        },
      });
      if (err) throw err;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Microsoft sign-in failed.");
    }
  }

  return (
    <main className="auth-page">
      <MotionReveal className="auth-page-content">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-mode-switch" role="group" aria-label="Account access">
            <button
              type="button"
              aria-pressed={mode === "signin"}
              disabled={busy}
              onClick={() => changeMode("signin")}
            >
              Login
            </button>
            <button
              type="button"
              aria-pressed={mode === "signup"}
              disabled={busy}
              onClick={() => changeMode("signup")}
            >
              Register
            </button>
          </div>

          <header className="auth-card-heading">
            <h1 id="auth-title">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
            <p>
              {mode === "signin"
                ? "Access your chart exports and bioenergy analyst summaries."
                : "Join Global Bioenergy Watch for chart exports and analyst summaries."}
            </p>
          </header>

          <div className="auth-social-buttons">
            <button type="button" onClick={google} disabled={busy} className="auth-social-button">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.31 2.98-7.36Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.04.97-3.39.97-2.61 0-4.82-1.76-5.61-4.12H3.05v2.59A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.39 13.93a6 6 0 0 1 0-3.86V7.48H3.05a10 10 0 0 0 0 9.04l3.34-2.59Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.95 5.48l3.34 2.59C7.18 7.71 9.39 5.95 12 5.95Z"
                />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={microsoft}
              disabled={busy}
              className="auth-social-button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#F25022" d="M2 2h9v9H2z" />
                <path fill="#7FBA00" d="M13 2h9v9h-9z" />
                <path fill="#00A4EF" d="M2 13h9v9H2z" />
                <path fill="#FFB900" d="M13 13h9v9h-9z" />
              </svg>
              Continue with Microsoft
            </button>
          </div>

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          <form onSubmit={submit} className="auth-form" aria-busy={busy}>
            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                placeholder="you@company.com"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-password-field">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  placeholder="At least 8 characters"
                  aria-describedby={mode === "signup" ? "auth-password-hint" : undefined}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-controls="auth-password"
                  aria-pressed={showPassword}
                  disabled={busy}
                  onClick={() => setShowPassword((shown) => !shown)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {mode === "signup" ? <p id="auth-password-hint">Use at least 8 characters.</p> : null}
            </div>

            {error ? (
              <p className="auth-message auth-error" role="alert">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="auth-message auth-notice" role="status">
                {notice}
              </p>
            ) : null}

            <button type="submit" disabled={busy} className="auth-submit">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {busy
                ? mode === "signin"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="auth-mode-prompt">
            {mode === "signin" ? "No account yet?" : "Already have an account?"}
            <button
              type="button"
              disabled={busy}
              onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </section>
        <p className="auth-page-caption">
          Global Bioenergy Watch <span aria-hidden="true">·</span> Independent monitoring
        </p>
      </MotionReveal>
    </main>
  );
}
