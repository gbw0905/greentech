import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  CI_UNITS,
  CI_UNIT_BY_ID,
  DIRECT_FIELDS,
  ELECTRICITY_REGIONS,
  FEEDSTOCKS,
  FEEDSTOCK_BY_ID,
  MASS_UNITS,
  PATHWAYS,
  SOURCES,
  SOURCE_VARIANTS,
  UNIT_OPTIONS,
  applyFeedstock,
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

const CATEGORY_ORDER: LineItem["category"][] = [
  "Feedstock and land",
  "Process energy",
  "Process other",
  "Distribution and use",
  "Credits",
];

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
  const [units, setUnits] = useState<Partial<Record<SourceId, string>>>({});
  const [ciUnitId, setCiUnitId] = useState<string>("g-mj");
  const [massUnitId, setMassUnitId] = useState<string>("t");

  const result = useMemo(() => calculateScenario({ ...inputs, region }), [inputs, region]);

  const ciUnit = CI_UNIT_BY_ID[ciUnitId] ?? CI_UNITS[0]!;
  const massUnit = MASS_UNITS.find((m) => m.id === massUnitId) ?? MASS_UNITS[0]!;
  const ci = (g: number) => (g * ciUnit.factor).toFixed(ciUnit.decimals);

  const selectPathway = (id: string) => setInputs(scenarioFromPathway(id, region));
  const setDirect = (k: keyof DirectTerms, v: number) =>
    setInputs((p) => ({ ...p, direct: { ...p.direct, [k]: v }, feedstockId: "custom" }));
  const setEnergy = (k: SourceId, v: number) =>
    setInputs((p) => ({ ...p, energy: { ...p.energy, [k]: v } }));
  const setVariant = (k: SourceId, v: string) =>
    setInputs((p) => ({ ...p, sourceVariants: { ...p.sourceVariants, [k]: v } }));

  const maxAbs = Math.max(...result.lineItems.map((l) => Math.abs(l.gPerMj)), 0.001);
  const groups = Array.from(new Set(PATHWAYS.map((p) => p.group)));
  const feedstockGroups = Array.from(new Set(FEEDSTOCKS.map((f) => f.group)));
  const feedstock = FEEDSTOCK_BY_ID[inputs.feedstockId];

  const annualTonnes = result.annualTonnesCo2e * massUnit.factor;

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <h2 className="font-display text-lg font-extrabold text-foreground">
            Fuel pathway and feedstock
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
            label="Feedstock source"
            hint={feedstock ? feedstock.note : "Set your own feedstock terms below"}
          >
            <select
              className={inputCls}
              value={inputs.feedstockId}
              onChange={(e) => setInputs((p) => applyFeedstock(p, e.target.value))}
            >
              {feedstockGroups.map((g) => (
                <optgroup key={g} label={g}>
                  {FEEDSTOCKS.filter((f) => f.group === g).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
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

      <section className="glass-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <h2 className="font-display text-lg font-extrabold text-foreground">
            Process energy sources
          </h2>
          <span className="label-mono text-muted-foreground">
            Choose the supply, the amount and the unit
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {SOURCES.map((s) => {
            const unitList = UNIT_OPTIONS[s.unit];
            const unitId = units[s.id] ?? unitList[0]!.id;
            const unit = unitList.find((u) => u.id === unitId) ?? unitList[0]!;
            const base = inputs.energy[s.id] ?? 0;
            const shown = base / unit.toBase;
            const variants = SOURCE_VARIANTS[s.id];
            return (
              <div key={s.id} className="rounded-lg border border-border bg-background/40 p-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-foreground">{s.label}</span>
                  <span className="label-mono text-muted-foreground">{s.unit} basis</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <Field label="Source">
                      {s.id === "electricity" ? (
                        <select
                          className={inputCls}
                          value={region}
                          onChange={(e) => setRegion(e.target.value as ElectricityRegionId)}
                        >
                          {ELECTRICITY_REGIONS.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label} — {r.gPerKwh} gCO2e/kWh
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          className={inputCls}
                          value={inputs.sourceVariants[s.id] ?? variants[0]?.id}
                          onChange={(e) => setVariant(s.id, e.target.value)}
                        >
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label} — {v.factor} gCO2e/{s.unit}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Quantity">
                      <input
                        type="number"
                        min={0}
                        step={0.001}
                        className={inputCls}
                        value={Number(shown.toFixed(6))}
                        onChange={(e) =>
                          setEnergy(s.id, (Number(e.target.value) || 0) * unit.toBase)
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Unit">
                    <select
                      className={inputCls}
                      value={unitId}
                      onChange={(e) => setUnits((p) => ({ ...p, [s.id]: e.target.value }))}
                    >
                      {unitList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <p className="mt-2 text-[0.7rem] text-muted-foreground">{s.note}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-panel p-5">
        <h2 className="mb-3 border-b border-border pb-2 font-display text-lg font-extrabold text-foreground">
          Other emission terms (gCO2e/MJ)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div
          className="glass-panel card-motion border-t-4 p-5"
          style={{ borderTopColor: result.ciTotal < 0 ? "rgb(21,128,61)" : "rgb(29,78,216)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="kicker text-muted-foreground">Carbon intensity</span>
            <select
              className="h-9 rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
              value={ciUnitId}
              onChange={(e) => setCiUnitId(e.target.value)}
              aria-label="Carbon intensity unit"
            >
              {CI_UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 font-display text-5xl font-extrabold tabular-nums text-foreground">
            {ci(result.ciTotal)}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">
            {ciUnit.label} of {result.pathway.label.toLowerCase()}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            {[
              ["Gross emissions", `${ci(result.grossCi)} ${ciUnit.label}`],
              ["Credits applied", `${ci(result.creditsCi)} ${ciUnit.label}`],
              ["Annual energy", `${num(result.annualEnergyMj / 1e6)} TJ`],
              ["Annual footprint", `${num(annualTonnes, annualTonnes < 100 ? 2 : 0)} ${massUnit.label}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label-mono text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-display text-base font-extrabold tabular-nums text-foreground">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 border-t border-border pt-3">
            <Field label="Annual footprint unit">
              <select
                className={inputCls}
                value={massUnitId}
                onChange={(e) => setMassUnitId(e.target.value)}
              >
                {MASS_UNITS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2">
            <h2 className="font-display text-lg font-extrabold text-foreground">
              Contribution by emission source
            </h2>
            <span className="label-mono text-muted-foreground">{ciUnit.label}</span>
          </div>
          <ul className="space-y-3">
            {result.lineItems.map((l) => (
              <li key={l.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-sm font-semibold text-foreground">{l.label}</span>
                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
                    {ci(l.gPerMj)}
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
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="font-display text-lg font-extrabold text-foreground">
            Emissions from all inputs
          </h2>
          <span className="label-mono text-muted-foreground">
            {ciUnit.label} and {massUnit.label} per year
          </span>
        </div>
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="label-mono py-2 text-muted-foreground">Input</th>
              <th className="label-mono py-2 text-muted-foreground">Category</th>
              <th className="label-mono py-2 text-right text-muted-foreground">Basis</th>
              <th className="label-mono py-2 text-right text-muted-foreground">{ciUnit.label}</th>
              <th className="label-mono py-2 text-right text-muted-foreground">Share of gross</th>
              <th className="label-mono py-2 text-right text-muted-foreground">
                Annual ({massUnit.label})
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CATEGORY_ORDER.flatMap((cat) => {
              const rows = result.lineItems.filter((l) => l.category === cat);
              if (!rows.length) return [];
              const subtotal = rows.reduce((a, l) => a + l.gPerMj, 0);
              return [
                ...rows.map((l) => (
                  <tr key={l.key}>
                    <td className="py-2 pr-3">
                      <span
                        className="mr-2 inline-block size-2 rounded-full align-middle"
                        style={{ background: CATEGORY_TONE[l.category] }}
                      />
                      <span className="font-semibold text-foreground">{l.label}</span>
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{l.category}</td>
                    <td className="py-2 text-right text-xs text-muted-foreground">{l.detail}</td>
                    <td className="py-2 text-right font-mono tabular-nums">{ci(l.gPerMj)}</td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {result.grossCi === 0
                        ? "—"
                        : `${((l.gPerMj / result.grossCi) * 100).toFixed(1)}%`}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {num(
                        ((l.gPerMj * result.annualEnergyMj) / 1_000_000) * massUnit.factor,
                        massUnit.id === "t" ? 0 : 2,
                      )}
                    </td>
                  </tr>
                )),
                <tr key={`${cat}-sub`} className="bg-muted/40 text-xs font-bold">
                  <td className="py-1.5 pr-3 text-foreground" colSpan={3}>
                    {cat} subtotal
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{ci(subtotal)}</td>
                  <td className="py-1.5" />
                  <td className="py-1.5 text-right font-mono tabular-nums">
                    {num(
                      ((subtotal * result.annualEnergyMj) / 1_000_000) * massUnit.factor,
                      massUnit.id === "t" ? 0 : 2,
                    )}
                  </td>
                </tr>,
              ];
            })}
            <tr className="font-bold">
              <td className="py-2 text-foreground" colSpan={3}>
                Total carbon intensity
              </td>
              <td className="py-2 text-right font-mono tabular-nums">{ci(result.ciTotal)}</td>
              <td className="py-2" />
              <td className="py-2 text-right font-mono tabular-nums">
                {num(annualTonnes, massUnit.id === "t" ? 0 : 2)}
              </td>
            </tr>
          </tbody>
        </table>
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
              <th className="label-mono py-2 text-right text-muted-foreground">Gap</th>
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
                  {p.benchmark == null ? "—" : ci(p.benchmark)}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">{p.eer.toFixed(1)}</td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.savingPct == null ? "—" : `${p.savingPct.toFixed(1)}%`}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.gapPerMj == null ? "—" : ci(p.gapPerMj)}
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
