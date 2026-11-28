import { createFileRoute } from "@tanstack/react-router";

async function run({ request }: { request: Request }) {
  const auth = request.headers.get("authorization");
  const expected = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!expected || auth !== `Bearer ${expected}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const { seedCountryProfiles } = await import("@/features/policy/server/seed-profiles.server");
    const result = await seedCountryProfiles();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("country seed failed", error);
    return Response.json({ ok: false, error: "Could not seed country data." }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/seed-country-data")({
  server: { handlers: { POST: run } },
});
