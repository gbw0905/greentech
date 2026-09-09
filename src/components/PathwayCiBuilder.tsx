import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  DIRECT_FIELDS,
  ELECTRICITY_REGIONS,
  PATHWAYS,
  SOURCES,
  calculateScenario,
  scenarioFromPathway,
  type DirectTerms,
  type ElectricityRegionId,
  type LineItem,
  type ScenarioInputs,
  type SourceId,
} from "@/lib/ci-model";

const num = (v: number, d = 0) =>
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const CATEGORY_TONE: Record<LineItem["category"], string> = {
  "Feedstock and land": "rgb(21, 128, 61)",
  "Process energy": "rgb(29, 78, 216)",
  "Process other": "rgb(217, 119, 6)",
  "Distribution and use": "rgb(124, 58, 237)",
  Credits: "rgb(220, 38, 38)",
};

const inputCls =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="label-mono block text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-[0.7rem] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function PathwayCiBuilder() {
  const [region, setRegion] = useState<ElectricityRegionId>("usAverage");
  const [inputs, setInputs] = useState<ScenarioInputs>(() =>
    scenarioFromPathway("rd-uco", "usAverage"),
  );

  const result = useMemo(() => calculateScenario({ ...inputs, region }), [inputs, region]);

  const selectPathway = (id: string) => setInputs(scenarioFromPathway(id, region));
  const setDirect = (k: keyof DirectTerms, v: number) =>
    setInputs((p) => ({ ...p, direct: { ...p.direct, [k]: v } }));
  const setEnergy = (k: SourceId, v: number) =>
    setInputs((p) => ({ ...p, energy: { ...p.energy, [k]: v } }));

  const maxAbs = Math.max(...result.lineItems.map((l) => Math.abs(l.gPerMj)), 0.001);
  const groups = Array.from(new Set(PATHWAYS.map((p) => p.group)));

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <h2 className="font-display text-lg font-extrabold text-foreground">
            Fuel pathway and grid
          </h2>
          <button
            type="button"
            onClick={() => setInputs(scenarioFromPathway(inputs.pathwayId, region))}
            className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
          >
            <RotateCcw className="size-3.5" />
            Reset pathway defaults
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Fuel pathway" hint={result.pathway.summary}>
            <select
              className={inputCls}
              value={inputs.pathwayId}
              onChange={(e) => selectPathway(e.target.value)}
            >
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {PATHWAYS.filter((p) => p.group === g).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field
            label="Electricity grid"
            hint={`${ELECTRICITY_REGIONS.find((r) => r.id === region)?.gPerKwh} gCO2e per kWh`}
          >
            <select
              className={inputCls}
              value={region}
              onChange={(e) => setRegion(e.target.value as ElectricityRegionId)}
            >
              {ELECTRICITY_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Annual production"
            hint={`${result.pathway.unitLabel}s per year · ${num(result.annualEnergyMj)} MJ`}
          >
            <input
              type="number"
              min={0}
              className={inputCls}
              value={inputs.annualVolume}
              onChange={(e) =>
                setInputs((p) => ({ ...p, annualVolume: Number(e.target.value) || 0 }))
              }
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h2 className="mb-3 border-b border-border pb-2 font-display text-lg font-extrabold text-foreground">
            Process energy sources
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOURCES.map((s) => (
              <Field
                key={s.id}
                label={`${s.label} (${s.unit}/MJ)`}
                hint={s.id === "electricity" ? "Uses the grid factor selected above" : s.note}
              >
                <input
                  type="number"
                  min={0}
                  step={0.001}
                  className={inputCls}
                  value={inputs.energy[s.id] ?? 0}
                  onChange={(e) => setEnergy(s.id, Number(e.target.value) || 0)}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5">
          <h2 className="mb-3 border-b border-border pb-2 font-display text-lg font-extrabold text-foreground">
            Other emission terms (gCO2e/MJ)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {DIRECT_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <input
                  type="number"
                  step={0.1}
                  className={inputCls}
                  value={inputs.direct[f.key]}
                  onChange={(e) => setDirect(f.key, Number(e.target.value) || 0)}
                />
              </Field>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div
          className="glass-panel card-motion border-t-4 p-5"
          style={{ borderTopColor: result.ciTotal < 0 ? "rgb(21,128,61)" : "rgb(29,78,216)" }}
        >
          <span className="kicker text-muted-foreground">Carbon intensity</span>
          <p className="mt-2 font-display text-5xl font-extrabold tabular-nums text-foreground">
            {result.ciTotal.toFixed(2)}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">
            gCO2e per MJ of {result.pathway.label.toLowerCase()}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            {[
              ["Gross emissions", `${result.grossCi.toFixed(1)} g/MJ`],
              ["Credits applied", `${result.creditsCi.toFixed(1)} g/MJ`],
              ["Annual energy", `${num(result.annualEnergyMj / 1e6)} TJ`],
              ["Annual footprint", `${num(result.annualTonnesCo2e)} t CO2e`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label-mono text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-display text-base font-extrabold tabular-nums text-foreground">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass-panel p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2">
            <h2 className="font-display text-lg font-extrabold text-foreground">
              Contribution by emission source
            </h2>
            <span className="label-mono text-muted-foreground">gCO2e/MJ</span>
          </div>
          <ul className="space-y-3">
            {result.lineItems.map((l) => (
              <li key={l.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-sm font-semibold text-foreground">{l.label}</span>
                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
                    {l.gPerMj.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(Math.abs(l.gPerMj) / maxAbs) * 100}%`,
                      background: CATEGORY_TONE[l.category],
                      opacity: l.gPerMj < 0 ? 0.65 : 1,
                    }}
                  />
                </div>
                <div className="mt-1 text-[0.7rem] text-muted-foreground">{l.detail}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass-panel overflow-x-auto p-5">
        <h2 className="mb-3 font-display text-lg font-extrabold text-foreground">
          Regulatory program comparison
        </h2>
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="label-mono py-2 text-muted-foreground">Program</th>
              <th className="label-mono py-2 text-right text-muted-foreground">Benchmark</th>
              <th className="label-mono py-2 text-right text-muted-foreground">EER</th>
              <th className="label-mono py-2 text-right text-muted-foreground">GHG saving</th>
              <th className="label-mono py-2 text-right text-muted-foreground">Gap (g/MJ)</th>
              <th className="label-mono py-2 text-right text-muted-foreground">Annual credits (t)</th>
              <th className="label-mono py-2 text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.programs.map((p) => (
              <tr key={p.program.id}>
                <td className="py-2 pr-3">
                  <div className="font-semibold text-foreground">{p.program.label}</div>
                  <div className="text-[0.7rem] text-muted-foreground">{p.program.jurisdiction}</div>
                </td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.benchmark == null ? "—" : p.benchmark.toFixed(2)}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">{p.eer.toFixed(1)}</td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.savingPct == null ? "—" : `${p.savingPct.toFixed(1)}%`}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.gapPerMj == null ? "—" : p.gapPerMj.toFixed(2)}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.annualCreditsTonnes == null || !p.program.creditMarket
                    ? "—"
                    : num(p.annualCreditsTonnes)}
                </td>
                <td className="py-2">
                  {p.benchmark == null ? (
                    <span className="text-xs text-muted-foreground">Fuel not covered</span>
                  ) : p.program.threshold != null ? (
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: p.meetsThreshold ? "rgb(21,128,61)" : "rgb(220,38,38)",
                      }}
                    >
                      {p.meetsThreshold ? "Meets" : "Below"} {(p.program.threshold * 100).toFixed(0)}%
                      threshold
                    </span>
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: (p.gapPerMj ?? 0) >= 0 ? "rgb(21,128,61)" : "rgb(220,38,38)",
                      }}
                    >
                      {(p.gapPerMj ?? 0) >= 0 ? "Generates credits" : "Generates deficits"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {result.programs.map((p) => (
            <li key={p.program.id}>
              <strong className="text-foreground">{p.program.label}:</strong> {p.program.note}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
