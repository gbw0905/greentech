import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const schema = z.object({
  keywords: z.array(z.string().trim().min(2).max(80)).min(1).max(12),
});

export const getLiveMediaFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { clientIp, takeRequestSlot } =
      await import("@/infrastructure/http/server/request-limit.server");
    if (!takeRequestSlot(`media:${clientIp(getRequest())}`, 20))
      return { videos: [], cachedAt: Date.now(), stale: true };
    const { fetchLiveMedia } = await import("@/features/videos/server/search-videos.server");
    return fetchLiveMedia(data.keywords, 6);
  });

const recommendationSchema = z.object({
  keyword: z.string().trim().min(2).max(80),
  cursor: z
    .string()
    .max(2048)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});
export const getVideoRecommendationsFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => recommendationSchema.parse(data))
  .handler(async ({ data }) => {
    const { clientIp, takeRequestSlot } =
      await import("@/infrastructure/http/server/request-limit.server");
    if (!takeRequestSlot(`media:${clientIp(getRequest())}`, 20))
      return { videos: [], nextCursor: null };
    const { fetchRecommendationPage } =
      await import("@/features/videos/server/recommendations.server");
    return fetchRecommendationPage(data.keyword, data.cursor);
  });
