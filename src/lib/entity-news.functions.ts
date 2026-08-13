import { createServerFn } from "@tanstack/react-start";
import { fetchEntityNews } from "./entity-news.server";

export const getEntityNewsFn = createServerFn({ method: "GET" })
  .inputValidator((data: { query: string }) => ({ query: String(data?.query ?? "").slice(0, 160) }))
  .handler(async ({ data }) => {
    if (!data.query) return { items: [] };
    const items = await fetchEntityNews(data.query);
    return { items };
  });
