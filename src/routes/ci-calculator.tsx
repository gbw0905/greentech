import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, RotateCcw } from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";
import {
  calculateCi,
  CFP_DIESEL_BASELINE,
  DEFAULT_CI_INPUTS,
  type CiInputs,
  type DryingEnergy,
  type ElectricityMix,
  type FeedstockSize,
  type FuelType,
  type TreePart,
} from "@/lib/ci-calculator";

const TITLE = "Biofuel Carbon Intensity Calculator | Forest Residue Pyrolysis CI";
const DESCRIPTION =
  "Model the lifecycle carbon intensity of renewable diesel and renewable gasoline made from forest residue pyrolysis: feedstock, transport, drying, pyrolysis and co-product allocation, in gCO2e/MJ.";

export const Route = createFileRoute("/ci-calculator")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/ci-calculator" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/ci-calculator" }],
  }),
  component: CiCalculatorPage,
});

const num = (v: number, d = 0) =>
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const STAGE_TONE: Record<string, string> = {
  "Collection and field processing": "rgb(220, 38, 38)",
  "Transport to bio-refinery": "rgb(217, 119, 6)",
  "Feedstock preprocessing": "rgb(21, 128, 61)",
  "Fuel conversion (pyrolyzer)": "rgb(29, 78, 216)",
  "Fuel conversion (post-processing)": "rgb(124, 58, 237)",
  "Transport to wholesaler": "rgb(15, 118, 110)",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="label-mono block text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-[0.7rem] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none";

function CiCalculatorPage() {
  const [tab, setTab] = useState<"pathway" | "pyrolysis">("pathway");

  return (
    <PageShell>
      <PageHeading
        icon={Calculator}
        title="Carbon intensity calculator"
        subtitle="Lifecycle carbon intensity for every biofuel pathway — ethanol, biodiesel, renewable diesel, SAF, renewable gas, hydrogen, methanol, LPG and pellets — with electricity, natural gas, propane, diesel, hydrogen and transport emissions, benchmarked against the major regulatory programs."
      />

      <div className="flex flex-wrap gap-2">
        {[
          ["pathway", "All fuels and programs"],
          ["pyrolysis", "Forest residue pyrolysis (OSU / NREL model)"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as "pathway" | "pyrolysis")}
            className={`label-mono h-11 rounded-md border px-4 font-bold transition-colors ${
              tab === id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background text-foreground hover:border-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pathway" ? <PathwayCiBuilder /> : <PyrolysisModel />}

      <section className="glass-panel border-l-4 border-l-accent p-5">
        <h2 className="font-display text-base font-bold text-foreground">Method and limitations</h2>
        <p className="mt-2 text-sm/relaxed text-muted-foreground">
          Pathway defaults are indicative averages compiled from public GREET and CA-GREET
          documentation, CARB LCFS certified pathway summaries, EU RED II and III Annex V typical
          values and equivalent program guidance. Every line item is editable, so you can replace a
          default with plant-specific data. Program benchmarks are the published comparator or
          baseline carbon intensities; annual compliance standards step down from them.
        </p>
        <p className="mt-2 text-sm/relaxed text-muted-foreground">
          Results are indicative and pathway-specific. They are not a certified CI score: regulatory
          pathway certification requires site-specific data, verification and approval by the
          administering agency.
        </p>
      </section>
    </PageShell>
  );
}

function PyrolysisModel() {
  const [inputs, setInputs] = useState<CiInputs>(DEFAULT_CI_INPUTS);
  const result = useMemo(() => calculateCi(inputs), [inputs]);
  const set = <K extends keyof CiInputs>(k: K, v: CiInputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }));

  const maxCi = Math.max(...result.stages.map((s) => s.gCo2ePerMj), 0.0001);

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <h2 className="font-display text-lg font-extrabold text-foreground">Scenario inputs</h2>
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_CI_INPUTS)}
            className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
          >
            <RotateCcw className="size-3.5" />
            Reset to baseline
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Annual residue supply" hint="green US tons per year">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={inputs.greenTons}
              onChange={(e) => set("greenTons", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Supply multiplier" hint="scale the annual supply">
            <input
              type="number"
              min={0}
              step={0.1}
              className={inputCls}
              value={inputs.supplyMultiplier}
              onChange={(e) => set("supplyMultiplier", Number(e.target.value) || 0)}
            />
          </Field>
          <Field
            label={`Douglas fir share — ${num(inputs.douglasFirShare * 100)}%`}
            hint={`Red alder ${num(100 - inputs.douglasFirShare * 100)}%`}
          >
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              className="h-11 w-full accent-[rgb(21,128,61)]"
              value={inputs.douglasFirShare * 100}
              onChange={(e) => set("douglasFirShare", Number(e.target.value) / 100)}
            />
          </Field>
          <Field label="Moisture content" hint="% of green weight">
            <input
              type="number"
              min={0}
              max={90}
              className={inputCls}
              value={inputs.moisturePct}
              onChange={(e) => set("moisturePct", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Fuel product">
            <select
              className={inputCls}
              value={inputs.fuelType}
              onChange={(e) => set("fuelType", e.target.value as FuelType)}
            >
              <option>Renewable Diesel + Renewable Gasoline</option>
              <option>Renewable Diesel</option>
              <option>Renewable Gasoline</option>
            </select>
          </Field>
          <Field label="Feedstock tree part">
            <select
              className={inputCls}
              value={inputs.treePart}
              onChange={(e) => set("treePart", e.target.value as TreePart)}
            >
              <option value="<3cm">&lt;3cm</option>
              <option value="NREL Mix">NREL Mix</option>
            </select>
          </Field>
          <Field label="Feedstock size" hint="grind size, mm">
            <select
              className={inputCls}
              value={inputs.feedstockSizeMm}
              onChange={(e) => set("feedstockSizeMm", Number(e.target.value) as FeedstockSize)}
            >
              <option value={0.5}>0.5 mm</option>
              <option value={2}>2 mm</option>
            </select>
          </Field>
          <Field label="Drying energy source">
            <select
              className={inputCls}
              value={inputs.dryingEnergy}
              onChange={(e) => set("dryingEnergy", e.target.value as DryingEnergy)}
            >
              <option>Electricity</option>
              <option>Natural Gas</option>
            </select>
          </Field>
          <Field label="Electricity mix">
            <select
              className={inputCls}
              value={inputs.electricityMix}
              onChange={(e) => set("electricityMix", e.target.value as ElectricityMix)}
            >
              <option>High CI-Oregon Statewide Electricity Mix</option>
              <option>Low CI- Salem Electricity Mix</option>
            </select>
          </Field>
          <Field label="Forest → refinery" hint="round trip, miles">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={inputs.forestToRefineryMiles}
              onChange={(e) => set("forestToRefineryMiles", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Refinery → wholesaler" hint="round trip, miles">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={inputs.refineryToWholesalerMiles}
              onChange={(e) => set("refineryToWholesalerMiles", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div
          className="glass-panel card-motion border-t-4 p-5"
          style={{ borderTopColor: "rgb(21, 128, 61)" }}
        >
          <span className="kicker text-muted-foreground">Carbon intensity</span>
          <p className="mt-2 font-display text-5xl font-extrabold tabular-nums text-foreground">
            {result.ciTotal.toFixed(2)}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">gCO2e per MJ of finished fuel</p>
          <p className="mt-3 text-sm/relaxed text-muted-foreground">
            {result.reductionVsDiesel >= 0 ? "Reduction of " : "Increase of "}
            <strong className="text-foreground">
              {Math.abs(result.reductionVsDiesel).toFixed(1)}%
            </strong>{" "}
            against the Oregon Clean Fuels Program diesel benchmark of {CFP_DIESEL_BASELINE} gCO2e/MJ.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            {[
              ["Dry feedstock", `${num(result.dryTons)} dry tons`],
              ["Fuel produced", `${num(result.fuelGallons)} gal`],
              ["Gasoline equivalent", `${num(result.fuelGge)} GGE`],
              ["Fuel yield", `${result.fuelYieldGgePerDryTon.toFixed(2)} GGE/dry ton`],
              ["Biochar", `${num(result.biocharTons)} tons`],
              ["Allocation to fuel", `${(result.allocationFuel * 100).toFixed(1)}%`],
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
              CI by production stage
            </h2>
            <span className="label-mono text-muted-foreground">gCO2e/MJ</span>
          </div>
          <ul className="space-y-3">
            {result.stages.map((s) => (
              <li key={s.stage}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-sm font-semibold text-foreground">{s.stage}</span>
                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
                    {s.gCo2ePerMj.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(s.gCo2ePerMj / maxCi) * 100}%`,
                      background: STAGE_TONE[s.stage] ?? "rgb(29, 78, 216)",
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[0.7rem] text-muted-foreground">
                  <span>{num(s.energyMj)} MJ of process energy</span>
                  <span>{s.sharePct.toFixed(1)}% of total CI</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass-panel overflow-x-auto p-5">
        <h2 className="mb-3 font-display text-lg font-extrabold text-foreground">Stage detail</h2>
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="label-mono py-2 text-muted-foreground">Stage</th>
              <th className="label-mono py-2 text-right text-muted-foreground">Energy (MJ)</th>
              <th className="label-mono py-2 text-right text-muted-foreground">gCO2e</th>
              <th className="label-mono py-2 text-right text-muted-foreground">gCO2e/MJ</th>
              <th className="label-mono py-2 text-right text-muted-foreground">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.stages.map((s) => (
              <tr key={s.stage}>
                <td className="py-2 font-semibold text-foreground">{s.stage}</td>
                <td className="py-2 text-right font-mono tabular-nums">{num(s.energyMj)}</td>
                <td className="py-2 text-right font-mono tabular-nums">{num(s.gCo2e)}</td>
                <td className="py-2 text-right font-mono tabular-nums">{s.gCo2ePerMj.toFixed(3)}</td>
                <td className="py-2 text-right font-mono tabular-nums">{s.sharePct.toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-2 text-foreground">Total</td>
              <td className="py-2 text-right font-mono tabular-nums">{num(result.totalEnergyMj)}</td>
              <td className="py-2 text-right font-mono tabular-nums">
                {num(result.stages.reduce((a, s) => a + s.gCo2e, 0))}
              </td>
              <td className="py-2 text-right font-mono tabular-nums">{result.ciTotal.toFixed(3)}</td>
              <td className="py-2 text-right font-mono tabular-nums">100.0%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted-foreground">Scenario: {result.scenarioLabel}</p>
      </section>

      <section className="glass-panel border-l-4 border-l-accent p-5">
        <h2 className="font-display text-base font-bold text-foreground">Method and limitations</h2>
        <p className="mt-2 text-sm/relaxed text-muted-foreground">
          Calculations follow the Oregon State University and NREL carbon intensity model for forest
          residue pyrolysis under the Oregon Clean Fuels Program (co-product allocation draft), using
          that model&apos;s equipment energy intensities, GREET-derived emission factors and energy-based
          allocation between liquid fuel and biochar. At the model&apos;s baseline settings this page
          reproduces its published result of 91.41 gCO2e/MJ.
        </p>
        <p className="mt-2 text-sm/relaxed text-muted-foreground">
          Results are indicative and pathway-specific. They are not a certified CI score: regulatory
          pathway certification requires site-specific data, verification and approval by the
          administering agency.
        </p>
      </section>
    </PageShell>
  );
}
