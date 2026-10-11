import { createHash, timingSafeEqual } from "crypto";

function constantTimeEquals(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

function requestKey(request: Request): string {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }
  return request.headers.get("x-supply-ingest-key")?.trim() ?? "";
}

function acceptedKeys(): string[] {
  return [process.env["SUPPLY_INGEST_ADMIN_KEY"], process.env["CRON_SECRET"]].filter(
    (value): value is string => Boolean(value),
  );
}

export function authorizeSupplyIngest(request: Request): Response | null {
  const keys = acceptedKeys();
  if (keys.length === 0) {
    return Response.json(
      { ok: false, error: "SUPPLY_INGEST_ADMIN_KEY or CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  const provided = requestKey(request);
  if (!provided || !keys.some((key) => constantTimeEquals(provided, key))) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
