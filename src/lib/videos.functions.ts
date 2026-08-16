import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ keywords: z.array(z.string().min(2).max(80)).min(1).max(12) });

export const getLiveMediaFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { fetchLiveMedia } = await import("./video-search.server");
    return fetchLiveMedia(data.keywords, 6);
  });
