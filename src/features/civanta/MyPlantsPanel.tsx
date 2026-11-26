import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { usePremium } from "@/features/premium/hooks/usePremium";
import { getPremiumStatusFn } from "@/features/premium/server-functions";

interface Plant {
  id: string;
  name: string;
  model?: {
    calculated?: boolean;
    ci?: number;
    sel?: { fuel?: string; feed?: string; tech?: string };
  };
}
const storageKey = "civanta-plants-v1";
export function MyPlantsPanel() {
  const access = usePremium();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [error, setError] = useState("");
  const [exportId, setExportId] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
        setPlants(
          Array.isArray(stored)
            ? stored
                .filter(
                  (p): p is Plant => p && typeof p.id === "string" && typeof p.name === "string",
                )
                .reverse()
            : [],
        );
      } catch {
        setError("Saved plants could not be read in this browser.");
      }
    };
    refresh();
    const changed = (event: StorageEvent) => {
      if (!event.key || event.key === storageKey) refresh();
    };
    window.addEventListener("storage", changed);
    window.addEventListener("focus", refresh);
    return () => {
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
    if (!access.premium || !plant.model?.calculated || exportId) return;
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
      <p>Plants saved in this browser. Open a plant to continue its calculation.</p>
      {error && <p role="alert">{error}</p>}
      {!plants.length ? (
        <p>No plants yet. Add your first plant in CIVanta.</p>
      ) : (
        <ul className="profile-plants-list">
          {plants.map((plant) => {
            const calculated = plant.model?.calculated === true && Number.isFinite(plant.model.ci);
            return (
              <li key={plant.id}>
                <div>
                  <strong>{plant.name}</strong>
                  <p>
                    {[plant.model?.sel?.fuel, plant.model?.sel?.feed, plant.model?.sel?.tech]
                      .filter(Boolean)
                      .join(" · ") || "Pathway not selected"}
                  </p>
                  <small>
                    {calculated
                      ? `${plant.model?.ci?.toFixed(2)} g CO₂e/MJ`
                      : "Draft · Run CI to prepare a report"}
                  </small>
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
