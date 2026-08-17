import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s['authorization_id'] === "string" ? (s['authorization_id'] as string) : "",
  }),
  component: Consent,
});

function Consent() {
  const { authorization_id } = Route.useSearch();
  const [details, setDetails] = useState<any>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setSignedIn(false);
      return;
    }
    setSignedIn(true);
    const res = await oauth().getAuthorizationDetails(authorization_id);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    const immediate = res.data?.redirect_url ?? res.data?.redirect_to;
    if (immediate && !res.data?.client) {
      window.location.href = immediate;
      return;
    }
    setDetails(res.data);
  };

  if (signedIn === null && authorization_id) void load();

  async function signIn(mode: "in" | "up") {
    setBusy(true);
    setError(null);
    const res =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.href },
          });
    setBusy(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setSignedIn(null);
    void load();
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (!authorization_id) {
    return <main className="mx-auto max-w-md p-8">Missing authorization request.</main>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Global Bioenergy Watch</h1>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {signedIn === false && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Sign in to authorize this connection.</p>
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
              disabled={busy}
              onClick={() => signIn("in")}
            >
              Sign in
            </button>
            <button
              className="rounded-md border border-border px-4 py-2"
              disabled={busy}
              onClick={() => signIn("up")}
            >
              Create account
            </button>
          </div>
        </div>
      )}
      {signedIn && details && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            Connect {details?.client?.name ?? "an app"} to your account
          </h2>
          <p className="text-sm text-muted-foreground">
            This lets {details?.client?.name ?? "the client"} use Global Bioenergy Watch tools as you.
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
              disabled={busy}
              onClick={() => decide(true)}
            >
              Approve
            </button>
            <button
              className="rounded-md border border-border px-4 py-2"
              disabled={busy}
              onClick={() => decide(false)}
            >
              Deny
            </button>
          </div>
        </div>
      )}
      {signedIn && !details && !error && <p className="text-sm">Loading authorization request…</p>}
    </main>
  );
}
