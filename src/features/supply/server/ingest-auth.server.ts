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
  return authorizeJob(requestKey(request), acceptedKeys());
}

export function authorizeCron(request: Request): Response | null {
  const secret = process.env["CRON_SECRET"];
  const authorization = request.headers.get("authorization");
  const provided = authorization?.match(/^Bearer (\S+)$/i)?.[1] ?? "";
  return authorizeJob(provided, secret ? [secret] : []);
}

function authorizeJob(provided: string, keys: string[]): Response | null {
  if (keys.length === 0) {
    return Response.json({ ok: false, error: "Scheduled job unavailable." }, { status: 503 });
  }

  if (!provided || !keys.some((key) => constantTimeEquals(provided, key))) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
