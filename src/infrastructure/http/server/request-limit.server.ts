import { isIP } from "node:net";
import { getRequestIP } from "@tanstack/react-start/server";

const WINDOW_MS = 60_000;
const hits = new Map<string, { reset: number; count: number }>();

export function takeRequestSlot(key: string, max: number) {
  const now = Date.now();
  for (const [id, hit] of hits) {
    if (hit.reset > now) break;
    hits.delete(id);
  }

  const hit = hits.get(key);
  if (hit) {
    if (hit.count >= max) return false;
    hit.count++;
  } else {
    if (hits.size >= 10_000) return false;
    hits.set(key, { reset: now + WINDOW_MS, count: 1 });
  }
  return true;
}

export function clientIp(request: Request) {
  const ip = process.env["VERCEL"]
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : getRequestIP();
  return ip && isIP(ip) ? ip : "unknown";
}
