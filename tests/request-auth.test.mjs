import test from "node:test";
import assert from "node:assert/strict";
import { userIdFromRequest } from "../src/features/auth/server/user-from-request.server.ts";

function configure(t) {
  const previous = { ...process.env };
  process.env.SUPABASE_URL = "https://auth-test.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  t.after(() => {
    for (const key of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
}

test("request authentication rejects absent and unsupported credentials without a network call", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => {
    throw Error("Unexpected network call");
  });
  for (const authorization of [undefined, "Basic abc", "Bearer "]) {
    const request = new Request("https://example.test/api/document-analyze", {
      headers: authorization ? { authorization } : {},
    });
    assert.equal(await userIdFromRequest(request), null);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("request authentication verifies the session with the publishable key and no service role", async (t) => {
  configure(t);
  const fetch = t.mock.method(globalThis, "fetch", async (input, init) => {
    assert.equal(String(input), "https://auth-test.supabase.co/auth/v1/user");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("authorization"), "Bearer user-session-token");
    assert.equal(headers.get("apikey"), "sb_publishable_test");
    return Response.json({ id: "verified-user", aud: "authenticated" });
  });
  const request = new Request("https://example.test/api/document-analyze", {
    headers: { authorization: "bEaReR user-session-token" },
  });
  assert.equal(await userIdFromRequest(request), "verified-user");
  assert.equal(fetch.mock.callCount(), 1);
});

test("a token rejected by the auth server cannot authorize a request", async (t) => {
  configure(t);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ msg: "Invalid token" }, { status: 401 }),
  );
  const request = new Request("https://example.test/api/document-analyze", {
    headers: { authorization: "Bearer invalid-token" },
  });
  assert.equal(await userIdFromRequest(request), null);
});

test("missing local configuration fails closed", async (t) => {
  configure(t);
  delete process.env.SUPABASE_URL;
  const request = new Request("https://example.test/api/document-analyze", {
    headers: { authorization: "Bearer user-session-token" },
  });
  assert.equal(await userIdFromRequest(request), null);
});
