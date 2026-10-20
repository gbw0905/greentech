import { Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole } from "lucide-react";
import "./SignInPrompt.css";

/** Inline notice shown when an action requires an authenticated account. */
export function SignInPrompt({
  action,
  title = "Continue with your account",
  description,
}: {
  action: string;
  title?: string;
  description?: string;
}) {
  return (
    <aside className="sign-in-prompt" aria-label={title}>
      <span className="sign-in-prompt-icon" aria-hidden="true">
        <LockKeyhole size={23} />
      </span>
      <div className="sign-in-prompt-copy">
        <strong>{title}</strong>
        <p>{description ?? `Sign in to ${action}.`}</p>
      </div>
      <Link to="/auth" className="sign-in-prompt-link">
        Sign in
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </aside>
  );
}
