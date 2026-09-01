import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ keywords: z.array(z.string().min(2).max(80)).min(1).max(12) });

export const getLiveMediaFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { fetchLiveMedia } = await import("./video-search.server");
    return fetchLiveMedia(data.keywords, 6);
  });

const entityNewsSchema = z.object({ query: z.string().min(2).max(160), limit: z.number().int().min(1).max(12).optional() });

/** Latest headlines for one entity, used by the Supply & producers detail sheet. */
export const getEntityNewsFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => entityNewsSchema.parse(d))
  .handler(async ({ data }) => {
    const { fetchEntityNews } = await import("./video-search.server");
    return fetchEntityNews(data.query, data.limit ?? 8);
  });
