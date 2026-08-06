import { createServerFn } from "@tanstack/react-start";
import { fetchPolicyFeed } from "./policy.server";

export const getPolicyFeed = createServerFn({ method: "GET" }).handler(async () => {
  return fetchPolicyFeed();
});