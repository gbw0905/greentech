import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
        <span className="auth-label">{entryMode === "signup" ? "Sign up" : "Sign In"}</span>
      </Link>
    );
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" });
    navigate({ to: "/auth", replace: true });
  }

  const name = user.email || "Member";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="gbw-profile-avatar" aria-label="Open profile menu">
          <span aria-hidden>{String(name).slice(0, 1).toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="gbw-profile-menu">
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound size={16} /> View Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <LogOut size={16} /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
