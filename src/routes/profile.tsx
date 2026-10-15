import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { usePremium } from "@/features/premium/hooks/usePremium";
import { HistoryPanel } from "@/features/calculation-history/HistoryPanel";
import { AccountLayout } from "@/features/account/AccountLayout";
export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile | Global Bioenergy Watch" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});
function ProfilePage() {
  const { user, loading } = useAuthSession();
  const access = usePremium();
  const name = String(
    user?.user_metadata["full_name"] ||
      user?.user_metadata["name"] ||
      user?.email?.split("@")[0] ||
      "Member",
  );
  const avatar = user?.user_metadata["avatar_url"];
  return (
    <AccountLayout
      title="My profile"
      description="Your account details and a shortcut to your saved carbon intensity scenarios."
      section="profile"
    >
      {loading ? (
        <p role="status" className="account-loading">
          Loading your profile…
        </p>
      ) : user ? (
        <div className="account-profile-grid">
          <section className="account-card" aria-label="Account details">
            <div className="account-identity">
              <div className="account-avatar">
                {typeof avatar === "string" && /^https:\/\//.test(avatar) ? (
                  <img src={avatar} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span aria-hidden>{name.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h2>{name}</h2>
                <p className="account-email">{user.email}</p>
                <span className="account-badge">
                  {access.loading
                    ? "Checking membership…"
                    : access.premium
                      ? "Premium member"
                      : "Member"}
                </span>
              </div>
            </div>
            <dl className="account-details">
              <div>
                <dt>Email address</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </dd>
              </div>
            </dl>
          </section>
          <section className="account-card">
            <div className="account-icon">
              <LayoutDashboard size={24} />
            </div>
            <h2>Your CI scenario library</h2>
            <p>
              Review the scenarios saved to your account and compare their carbon intensity with
              regulatory benchmarks.
            </p>
            <Link to="/my-results" className="account-action">
              View saved results
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      ) : (
        <section className="account-card account-empty">
          <h2>Your account, in one place.</h2>
          <p>Sign in to view your profile and saved scenarios.</p>
          <Link to="/auth" className="account-action">
            Sign In
            <ArrowRight size={16} />
          </Link>
        </section>
      )}
      {user && <HistoryPanel preview />}
    </AccountLayout>
  );
}
