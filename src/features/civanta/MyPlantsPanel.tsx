import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { usePremium } from "@/features/premium/hooks/usePremium";
import { getPremiumStatusFn } from "@/features/premium/server-functions";

interface Plant {
  id: string;
  name: string;
  pathway: string;
  calculated: boolean;
  ci: number | null;
}
interface Calculation {
  id: string;
  plant_id: string;
  ci: number;
  pathway_label: string;
  created_at: string;
}
interface StoredPlant {
  id: string;
  name: string;
  model?: {
    calculated?: boolean;
    ci?: number;
    sel?: { fuel?: string; feed?: string; tech?: string };
  };
}
interface ServerPlant {
  id: string;
  name: string;
  pathway_label: string;
  calculated: boolean;
  latest_ci: number | null;
}
const storageKey = "civanta-plants-v1";
const HISTORY_SHOWN = 10;

function plantsFromBrowser(): Plant[] {
  const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((p): p is StoredPlant => p && typeof p.id === "string" && typeof p.name === "string")
    .reverse()
    .map((p) => {
      const calculated = p.model?.calculated === true && Number.isFinite(p.model.ci);
      return {
        id: p.id,
        name: p.name,
        pathway: [p.model?.sel?.fuel, p.model?.sel?.feed, p.model?.sel?.tech]
          .filter(Boolean)
          .join(" · "),
        calculated,
        ci: calculated ? (p.model?.ci ?? null) : null,
      };
    });
}

async function plantsFromAccount() {
  const [plantsResponse, historyResponse] = await Promise.all([
    fetch("/api/civanta-plants?summary=1", { credentials: "same-origin", cache: "no-store" }),
    fetch("/api/civanta-calculations?limit=300", {
      credentials: "same-origin",
      cache: "no-store",
    }),
  ]);
  if (!plantsResponse.ok || !historyResponse.ok) throw new Error("Account plants unavailable");
  const { plants } = (await plantsResponse.json()) as { plants: ServerPlant[] };
  const { calculations } = (await historyResponse.json()) as { calculations: Calculation[] };
  return {
    plants: plants.map((p) => ({
      id: p.id,
      name: p.name,
      pathway: p.pathway_label,
      calculated: p.calculated && p.latest_ci !== null,
      ci: p.latest_ci === null ? null : Number(p.latest_ci),
    })),
    calculations: calculations.map((c) => ({ ...c, ci: Number(c.ci) })),
  };
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function MyPlantsPanel() {
  const access = usePremium();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [history, setHistory] = useState<Calculation[]>([]);
  const [fromAccount, setFromAccount] = useState(false);
  const [error, setError] = useState("");
  const [exportId, setExportId] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    const refresh = async () => {
      try {
        const saved = await plantsFromAccount();
        if (!current) return;
        setPlants(saved.plants);
        setHistory(saved.calculations);
        setFromAccount(true);
      } catch {
        // Fall back to this browser's copy when the account cannot be reached.
        try {
          if (current) {
            setPlants(plantsFromBrowser());
            setHistory([]);
            setFromAccount(false);
          }
        } catch {
          if (current) setError("Saved plants could not be read in this browser.");
        }
      }
    };
    void refresh();
    const changed = (event: StorageEvent) => {
      if (!event.key || event.key === storageKey) void refresh();
    };
    window.addEventListener("storage", changed);
    window.addEventListener("focus", refresh);
    return () => {
      current = false;
      window.removeEventListener("storage", changed);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    if (!exportId) return;
    let sent = false;
    const receive = (event: MessageEvent) => {
      const frame = document.getElementById("profile-plant-export") as HTMLIFrameElement | null;
      if (event.origin !== location.origin || event.source !== frame?.contentWindow) return;
      if (event.data?.type === "civanta-workspace-ready" && !sent) {
        sent = true;
        frame.contentWindow?.postMessage(
          { type: "civanta-profile-export", id: exportId },
          location.origin,
        );
      }
      if (event.data?.type === "civanta-profile-export-result" && event.data.id === exportId) {
        if (!event.data.ok)
          setError(event.data.error || "Excel download could not start. Please try again.");
        setExportId(null);
      }
    };
    window.addEventListener("message", receive);
    const timer = setTimeout(() => {
      setError("Excel preparation timed out. Please try again.");
      setExportId(null);
    }, 30000);
    return () => {
      window.removeEventListener("message", receive);
      clearTimeout(timer);
    };
  }, [exportId]);
  async function download(plant: Plant) {
    setError("");
    if (!access.premium || !plant.calculated || exportId) return;
    try {
      if (!(await getPremiumStatusFn()).premium) {
        setError("CIVanta Pro is required to download Excel.");
        return;
      }
      setExportId(plant.id);
    } catch {
      setError("Could not verify Pro access. Please try again.");
    }
  }
  return (
    <section className="account-card profile-plants" aria-labelledby="profile-plants-title">
      <div className="profile-plants-heading">
        <h2 id="profile-plants-title">
          My plants <span className="account-badge">{plants.length}</span>
        </h2>
        <Link to="/civanta" className="account-action">
          Open CIVanta →
        </Link>
      </div>
      <p>
        {fromAccount
          ? "Plants saved to your account. Open a plant to continue its calculation."
          : "Plants saved in this browser. Open a plant to continue its calculation."}
      </p>
      {error && <p role="alert">{error}</p>}
      {!plants.length ? (
        <p>No plants yet. Add your first plant in CIVanta.</p>
      ) : (
        <ul className="profile-plants-list">
          {plants.map((plant) => {
            const calculated = plant.calculated && plant.ci !== null;
            const runs = history.filter((run) => run.plant_id === plant.id);
            return (
              <li key={plant.id}>
                <div>
                  <strong>{plant.name}</strong>
                  <p>{plant.pathway || "Pathway not selected"}</p>
                  <small>
                    {calculated
                      ? `${plant.ci?.toFixed(2)} g CO₂e/MJ`
                      : "Draft · Run CI to prepare a report"}
                  </small>
                  {runs.length > 0 && (
                    <details className="profile-plant-history">
                      <summary>Past calculations ({runs.length})</summary>
                      <ol>
                        {runs.slice(0, HISTORY_SHOWN).map((run) => (
                          <li key={run.id}>
                            <time dateTime={run.created_at}>{formatDate(run.created_at)}</time>
                            <b>{run.ci.toFixed(2)} g CO₂e/MJ</b>
                            {run.pathway_label && <span>{run.pathway_label}</span>}
                          </li>
                        ))}
                      </ol>
                      {runs.length > HISTORY_SHOWN && (
                        <small>Showing the latest {HISTORY_SHOWN} calculations.</small>
                      )}
                    </details>
                  )}
                </div>
                <div className="profile-plant-actions">
                  <Link
                    to="/civanta"
                    className="account-action"
                    onClick={() => {
                      try {
                        sessionStorage.setItem("civanta-active-plant-v1", plant.id);
                      } catch {
                        /* The plant remains available in the list. */
                      }
                    }}
                  >
                    Open plant →
                  </Link>
                  <button
                    className="account-action profile-excel"
                    type="button"
                    disabled={access.loading || !access.premium || !calculated || Boolean(exportId)}
                    title={
                      !access.premium
                        ? "CIVanta Pro is required"
                        : !calculated
                          ? "Run CI in this plant first"
                          : "Download this plant’s Excel report"
                    }
                    onClick={() => void download(plant)}
                  >
                    {exportId === plant.id ? "Preparing Excel…" : "Download Excel"}
                    {!access.loading && !access.premium && (
                      <>
                        <LockKeyhole size={15} aria-hidden="true" />
                        <span className="profile-pro-badge">Pro</span>
                      </>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!access.loading && !access.premium && (
        <p>
          <Link to="/pricing">Go for Pro to unlock Excel downloads →</Link>
        </p>
      )}
      {exportId && (
        <iframe
          id="profile-plant-export"
          src="/civanta-workspace/index.html?profileExport=1"
          title="Preparing plant Excel report"
          onLoad={(event) => {
            const frame = event.currentTarget;
            if (frame.contentDocument?.body?.hasAttribute("data-workspace-ready"))
              frame.contentWindow?.postMessage(
                { type: "civanta-profile-export", id: exportId },
                location.origin,
              );
          }}
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: "fixed", left: -10000, top: 0, width: 1, height: 1, border: 0 }}
        />
      )}
    </section>
  );
}
