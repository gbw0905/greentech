import { takeRequestSlot } from "@/infrastructure/http/server/request-limit.server";

export function assertAiQuota(key: string, max = 8) {
  if (!takeRequestSlot(`ai:${key}`, max)) {
    throw new Error("Too many AI requests — please wait a minute and try again.");
  }
}
