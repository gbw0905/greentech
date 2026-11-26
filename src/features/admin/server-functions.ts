import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getAdminAccessFn = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  if (!request) return { admin: false };
  const { adminFromRequest } = await import("./admin-access.server");
  return { admin: Boolean(await adminFromRequest(request)) };
});
