import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getEntityNewsFn } from "@/lib/entity-news.functions";

export type NewsTarget = { name: string; query: string } | null;

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(d)) return "";
  const h = Math.floor(d / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function EntityNewsDialog({
  target,
  onClose,
}: {
  target: NewsTarget;
  onClose: () => void;
}) {
  const fetchNews = useServerFn(getEntityNewsFn);
  const q = useQuery({
    queryKey: ["entity-news", target?.query],
    queryFn: () => fetchNews({ data: { query: target!.query } }),
    enabled: !!target,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {target?.name} — latest global news
          </DialogTitle>
        </DialogHeader>
        {q.isLoading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-surface-2" />
            ))}
          </div>
        ) : q.data?.items?.length ? (
          <ol className="divide-y divide-border">
            {q.data.items.map((n, i) => (
              <li key={n.link + i} className="py-2.5">
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="flex gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-snug group-hover:text-primary">
                        {n.title}
                      </div>
                      <div className="label-mono mt-0.5 text-[11px] text-muted-foreground">
                        {n.source}
                        {n.publishedAt ? ` · ${timeAgo(n.publishedAt)}` : ""}
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-6 text-sm text-muted-foreground">
            No recent headlines found for {target?.name}.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
