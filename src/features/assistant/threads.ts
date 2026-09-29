import type { UIMessage } from "ai";
import type { StoredMessage } from "@/features/assistant/server-functions";

/** Turns saved rows back into AI SDK messages for the chat window. */
export function toUiMessages(rows: StoredMessage[]): UIMessage[] {
  return rows.map((row) => {
    let parts: UIMessage["parts"] = [];
    try {
      const parsed = JSON.parse(row.partsJson);
      if (Array.isArray(parsed)) parts = parsed as UIMessage["parts"];
    } catch {
      parts = [];
    }
    return { id: row.id, role: row.role, parts } as UIMessage;
  });
}
