import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ keywords: z.array(z.string().min(2).max(80)).min(1).max(8) });

export const getHiringNewsFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { fetchHiringNews } = await import("@/features/jobs/server/search-jobs.server");
    return fetchHiringNews(data.keywords, 5);
  });
