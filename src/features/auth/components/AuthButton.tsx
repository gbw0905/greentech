import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

/** Header sign-in / sign-out affordance, driven by the live session. */
export function AuthButton({ entryMode = "signin" }: { entryMode?: "signin" | "signup" }) {
  const { user, loading } = useAuthSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        to="/auth"
        search={entryMode === "signup" ? { mode: "signup" } : {}}
        className="label-mono pill-motion inline-flex shrink-0 items-center gap-2 border border-menubar-fg/40 bg-menubar-nav px-2.5 py-1.5 font-bold text-menubar-fg hover:border-menubar-fg hover:bg-menubar-fg/10 sm:px-3.5 sm:py-2"
      >
        {entryMode === "signin" && <LogIn className="size-3.5" />}
        <span className="auth-label">{entryMode === "signup" ? "Sign up" : "Sign in"}</span>
      </Link>
    );
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="hidden max-w-[12rem] truncate font-mono text-xs text-menubar-muted lg:inline">
        {user.email}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="label-mono pill-motion inline-flex shrink-0 items-center gap-2 border border-menubar-fg/40 bg-menubar-nav px-2.5 py-1.5 font-bold text-menubar-fg hover:border-menubar-fg hover:bg-menubar-fg/10 sm:px-3.5 sm:py-2"
      >
        <LogOut className="size-3.5" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
