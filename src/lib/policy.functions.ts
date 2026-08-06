import { createServerFn } from "@tanstack/react-start";
import { getCachedPolicyFeed } from "./policy.server";

export const getPolicyFeed = createServerFn({ method: "GET" }).handler(async () => {
  return getCachedPolicyFeed();
});