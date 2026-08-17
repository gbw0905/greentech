import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Mail } from "lucide-react";
import { requestPolicyBrief } from "@/lib/alerts.functions";

export function BriefRequestButton({ updateId }: { updateId: string }) {
  const request = useServerFn(requestPolicyBrief);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { email: string; updateId: string }) => request({ data: input }),
  });

  const status = mutation.data?.status;

  if (status === "sent") {
    return (
      <span className="label-mono inline-flex items-center gap-1 text-primary">
        <Check className="size-3" /> Brief sent
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label-mono inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Mail className="size-3" />
        Email me the AI brief
      </button>
    );
  }

  return (
    <form
      className="flex w-full flex-wrap items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim()) return;
        mutation.mutate({ email: email.trim(), updateId });
      }}
    >
      <input
        type="email"
        required
        maxLength={255}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        aria-label="Email address for the AI brief"
        className="min-w-0 flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="label-mono inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-60"
      >
        {mutation.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
        Send brief
      </button>
      {status === "rate_limited" && (
        <span className="label-mono w-full text-muted-foreground">
          Too many briefs requested from this address — try again in an hour.
        </span>
      )}
      {status === "suppressed" && (
        <span className="label-mono w-full text-muted-foreground">
          This address previously unsubscribed or bounced, so we can't email it.
        </span>
      )}
      {status === "not_found" && (
        <span className="label-mono w-full text-muted-foreground">
          This update is no longer available.
        </span>
      )}
      {mutation.isError && (
        <span className="label-mono w-full text-destructive">
          Could not generate the brief right now. Please try again.
        </span>
      )}
      {mutation.isPending && (
        <span className="label-mono w-full text-muted-foreground">
          Writing your 200-300 word brief…
        </span>
      )}
    </form>
  );
}
