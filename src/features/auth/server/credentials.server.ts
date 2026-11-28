import { z } from "zod";
import { readJson, RequestBodyError } from "@/infrastructure/http/server/request-body.server";

const schema = z.object({
  email: z.string().trim().max(254).email(),
  password: z.string().min(1).max(1024),
});

export async function readCredentials(request: Request) {
  const credentials = schema.safeParse(await readJson(request, 8192));
  if (!credentials.success) throw new RequestBodyError(400, "Enter a valid email and password.");
  return credentials.data;
}
