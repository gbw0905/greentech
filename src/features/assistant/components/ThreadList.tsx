import { Plus, Trash2 } from "lucide-react";
import type { ChatThreadSummary } from "@/features/assistant/server-functions";

export function ThreadList({
  threads,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  className,
}: {
  threads: ChatThreadSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onCreate}
        className="mb-2 inline-flex w-full items-center justify-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85"
      >
        <Plus className="size-3.5" />
        New conversation
      </button>

      <ul className="space-y-1">
        {threads.length === 0 ? (
          <li className="px-2 py-1 text-xs text-muted-foreground">No saved conversations yet.</li>
        ) : null}
        {threads.map((t) => (
          <li
            key={t.id}
            className={`flex items-center gap-1 rounded-sm border px-2 py-1.5 ${
              t.id === activeId ? "border-primary bg-secondary" : "border-transparent"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              className="min-w-0 flex-1 truncate text-left text-xs font-medium"
              title={t.title}
            >
              {t.title}
            </button>
            <button
              type="button"
              onClick={() => onDelete(t.id)}
              aria-label={`Delete conversation ${t.title}`}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
