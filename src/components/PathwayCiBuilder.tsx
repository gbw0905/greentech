import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  CHEMICAL_PRESETS,
  CI_UNITS,
  CI_UNIT_BY_ID,
  COPRODUCT_PRESETS,
  backgroundFactors,
  ELECTRICITY_REGIONS,
  END_USE_MODES,
  
  FEEDSTOCK_BY_ID,
  MASS_UNITS,
  PATHWAYS,
  SOURCES,
  SOURCE_VARIANTS,
  TRANSPORT_MODES,
  UNIT_OPTIONS,
  
  calculateScenario,
  defaultDetailModules,
  scenarioFromPathway,
  type ChemicalItem,
  type CoProductItem,
  type DairyMethod,
  type DetailModuleKey,
  type DetailModules,
  type ElectricityRegionId,
  type EndUseModeId,
  type LineItem,
  type ScenarioInputs,
  type SourceId,
  type TransportLeg,
  type TransportModeId,
} from "@/lib/ci-model";
import {
  DIGESTER_LEAKAGE,
  EGRID_REGIONS,
  STORAGE_SYSTEMS,
  type DairyRngLcfsInputs,
  type DairyRngLcfsResult,
  type LivestockCategory,
  type StorageAllocation,
} from "@/lib/rng-dairy-lcfs";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { SaveCiRunButton } from "@/components/SaveCiRunButton";
import type { SheetRow, SheetSection, WorkbookChart, WorkbookExport } from "@/lib/excel-workbook";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";

/** Shown in place of the detailed results when the account is not on the premium list. */
function PremiumLocked({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="glass-panel border-l-4 p-5" style={{ borderLeftColor: "rgb(180, 35, 24)" }}>
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="font-display text-lg font-extrabold text-foreground">
            Detailed results are a premium feature
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The free calculator shows the headline carbon intensity for your scenario. Premium
            members also get the emission source breakdown, the full line-by-line emissions table,
            the regulatory program comparison and the Excel export with all background factors.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {signedIn ? null : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 border border-ink bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85"
              >
                Sign in
              </Link>
            )}
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground"
            >
              Request premium access
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}



const num = (v: number, d = 0) =>
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const CATEGORY_TONE: Record<LineItem["category"], string> = {
  "Feedstock and land": "rgb(21, 128, 61)",
  "Process energy": "rgb(29, 78, 216)",
  "Process other": "rgb(217, 119, 6)",
  "Distribution and use": "rgb(124, 58, 237)",
  Credits: "rgb(220, 38, 38)",
};

type SectionTone = "red" | "green" | "blue";
const SECTION_TONE: Record<string, SectionTone> = {
  "Fuel pathway": "green",
  "Process energy sources": "red",
  "Feedstock production": "green",
  "Feedstock transport": "blue",
  "Chemicals and fugitive emissions": "red",
  "Co-products and avoided emissions": "green",
  "Fuel distribution": "blue",
  "Tailpipe and end use": "red",
  "Carbon intensity": "blue",
  "Contribution by emission source": "blue",
  "Emissions from all inputs": "blue",
  "Regulatory program comparison": "blue",
  "Export results": "green",
};
const TONE_COLOR: Record<SectionTone, string> = {
  red: "var(--tracker-red)",
  green: "var(--tracker-green)",
  blue: "var(--tracker-blue)",
};
const ENERGY_TONES: SectionTone[] = ["red", "green", "blue"];

const CATEGORY_ORDER: LineItem["category"][] = [
  "Feedstock and land",
  "Process energy",
  "Process other",
  "Distribution and use",
  "Credits",
];

const EXPORT_SECTIONS = [
  "Feedstock production",
  "Land use change",
  "Transportation",
  "Process energy",
  "Chemicals and fugitive emissions",
  "Co-products and avoided emissions",
  "Fuel distribution",
  "Tailpipe and end use",
] as const;

type ExportSection = (typeof EXPORT_SECTIONS)[number];

function exportSectionFor(item: LineItem): ExportSection {
  if (item.key === "landUseChange") return "Land use change";
  if (item.key === "feedstockTransport" || item.key.startsWith("tr-")) return "Transportation";
  if (item.category === "Process energy") return "Process energy";
  if (item.key === "processNonEnergy" || item.key.startsWith("chem-")) {
    return "Chemicals and fugitive emissions";
  }
  if (item.key === "coProductCredit" || item.key.startsWith("cp-")) {
    return "Co-products and avoided emissions";
  }
  if (item.key === "distribution" || item.key.startsWith("dist-")) return "Fuel distribution";
  if (item.key === "endUse" || item.key.startsWith("tp-")) return "Tailpipe and end use";
  return "Feedstock production";
}

const inputCls =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
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

/** Kept for compatibility; results are always shown. */
const CalcTouchContext = createContext<() => void>(() => {});

/** Editable number input pre-filled with the current pathway value. */
function BlankNumInput({
  value,
  onChange,
  min,
  step = 0.1,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  ariaLabel?: string;
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      aria-label={ariaLabel}
      className={inputCls}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}

function Num({
  label,
  hint,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <BlankNumInput value={value} onChange={onChange} step={step} ariaLabel={label} />
    </Field>
  );
}

/** Same minimise/expand behaviour as DetailSection, without the enable toggle. */
function CollapsibleSection({
  title,
  description,
  total,
  totalLabel,
  children,
  tone = "blue",
  locked = false,
}: {
  title: string;
  description: string;
  total: string;
  totalLabel: string;
  children: React.ReactNode;
  tone?: SectionTone;
  locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="glass-panel border-l-4 p-5" style={{ borderLeftColor: TONE_COLOR[tone] }}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-2 inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: TONE_COLOR[tone] }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold text-foreground">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <span className="label-mono block text-muted-foreground">{totalLabel}</span>
            <span className="font-display text-base font-extrabold tabular-nums text-foreground">
              {total}
            </span>
          </div>
          {locked ? null : (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
            >
              {open ? "Hide" : "Edit"}
              <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
      {open && !locked ? <div className="mt-4 space-y-4">{children}</div> : null}
    </section>
  );
}




/** Input groups for the CARB LCFS Tier 1 dairy/swine manure method. */
function DairyLcfsFields({
  value,
  onChange,
  result,
  num,
}: {
  value: DairyRngLcfsInputs;
  onChange: (patch: Partial<DairyRngLcfsInputs>) => void;
  result: DairyRngLcfsResult | null;
  num: (n: number) => string;
}) {
  const setAnimal = (idx: number, patch: Partial<LivestockCategory>) =>
    onChange({ livestock: value.livestock.map((a, i) => (i === idx ? { ...a, ...patch } : a)) });
  const setStorage = (
    field: "otherStorage" | "nonBcsStorage",
    idx: number,
    patch: Partial<StorageAllocation>,
  ) =>
    onChange({
      [field]: value[field].map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    } as Partial<DairyRngLcfsInputs>);
  const setFraction = (
    field: "otherStorage" | "nonBcsStorage",
    idx: number,
    animalIdx: number,
    v: number,
  ) =>
    setStorage(field, idx, {
      fractions: value[field][idx]!.fractions.map((f, i) => (i === animalIdx ? v : f)),
    });

  const storageBlock = (field: "otherStorage" | "nonBcsStorage", label: string, hint: string) => (
    <div className="space-y-3">
      <h3 className="label-mono text-muted-foreground">{label}</h3>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {value[field].map((row, idx) => (
        <div key={`${field}-${idx}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Storage or treatment system">
            <select
              className={inputCls}
              value={row.system}
              onChange={(e) => setStorage(field, idx, { system: e.target.value })}
            >
              {STORAGE_SYSTEMS.map((sys) => (
                <option key={sys} value={sys}>
                  {sys}
                </option>
              ))}
            </select>
          </Field>
          {value.livestock.map((a, ai) => (
            <Num
              key={`${field}-${idx}-${ai}`}
              label={`Share of ${a.label.toLowerCase()} manure`}
              step={0.01}
              value={row.fractions[ai] ?? 0}
              onChange={(v) => setFraction(field, idx, ai, v)}
            />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="label-mono text-muted-foreground">1. Project background</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Digester type">
            <select
              className={inputCls}
              value={value.digesterType}
              onChange={(e) => onChange({ digesterType: e.target.value })}
            >
              {Object.keys(DIGESTER_LEAKAGE).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Electricity region (eGRID)">
            <select
              className={inputCls}
              value={value.electricityRegion}
              onChange={(e) => onChange({ electricityRegion: e.target.value })}
            >
              {EGRID_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Num
            label="Average ambient temperature (°C)"
            step={0.1}
            value={value.annualTemperatureC}
            onChange={(v) => onChange({ annualTemperatureC: v })}
          />
          <Num
            label="Project reporting months"
            step={1}
            value={value.reportingMonths}
            onChange={(v) => onChange({ reportingMonths: v })}
          />
          <Field label="Full lagoon cleanout each September in the baseline">
            <select
              className={inputCls}
              value={value.septemberCleanout ? "yes" : "no"}
              onChange={(e) => onChange({ septemberCleanout: e.target.value === "yes" })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {MONTH_LABELS.map((m, idx) => (
            <Num
              key={m}
              label={`${m} temp (°C)`}
              step={0.1}
              value={value.monthlyTemperatureC[idx] ?? value.annualTemperatureC}
              onChange={(v) =>
                onChange({
                  monthlyTemperatureC: MONTH_LABELS.map((_, i) =>
                    i === idx ? v : (value.monthlyTemperatureC[i] ?? value.annualTemperatureC),
                  ),
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="label-mono text-muted-foreground">2. Herd and baseline manure</h3>
        {value.livestock.map((a, idx) => (
          <div key={a.label} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Livestock category">
              <input
                className={inputCls}
                value={a.label}
                onChange={(e) => setAnimal(idx, { label: e.target.value })}
              />
            </Field>
            <Num
              label="Average population (head)"
              step={1}
              value={a.population}
              onChange={(v) => setAnimal(idx, { population: v })}
            />
            <Num
              label="Volatile solids (kg/head/day)"
              step={0.01}
              value={a.vsRate}
              onChange={(v) => setAnimal(idx, { vsRate: v })}
            />
            <Num
              label="Max methane potential Bo (m³/kg VS)"
              step={0.01}
              value={a.bo}
              onChange={(v) => setAnimal(idx, { bo: v })}
            />
            <Num
              label="Share sent to the anaerobic system"
              step={0.01}
              value={a.msAnaerobic}
              onChange={(v) => setAnimal(idx, { msAnaerobic: v })}
            />
          </div>
        ))}
        {storageBlock(
          "otherStorage",
          "Baseline non-anaerobic storage",
          "Manure that did not go to the lagoon in the baseline, by system.",
        )}
      </div>

      <div className="space-y-3">
        <h3 className="label-mono text-muted-foreground">3. Project gas</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Raw biogas produced (scf)"
            step={1000}
            value={value.rawBiogasScf}
            onChange={(v) => onChange({ rawBiogasScf: v })}
          />
          <Num
            label="Raw biogas methane content"
            step={0.01}
            value={value.rawBiogasCh4}
            onChange={(v) => onChange({ rawBiogasCh4: v })}
          />
          <Num
            label="Biogas to upgrading (scf)"
            step={1000}
            value={value.biogasToUpgradingScf}
            onChange={(v) => onChange({ biogasToUpgradingScf: v })}
          />
          <Num
            label="Inlet methane content"
            step={0.01}
            value={value.biogasToUpgradingCh4}
            onChange={(v) => onChange({ biogasToUpgradingCh4: v })}
          />
          <Num
            label="Biomethane injected (MMBtu HHV)"
            step={10}
            value={value.biomethaneInjectedMmbtuHhv}
            onChange={(v) => onChange({ biomethaneInjectedMmbtuHhv: v })}
          />
          <Num
            label="Flared biomethane (scf)"
            step={100}
            value={value.flaredBiomethaneScf}
            onChange={(v) => onChange({ flaredBiomethaneScf: v })}
          />
          <Num
            label="Flared gas methane content"
            step={0.01}
            value={value.flaredBiomethaneCh4}
            onChange={(v) => onChange({ flaredBiomethaneCh4: v })}
          />
          <Num
            label="RNG to on-site electricity (MMBtu HHV)"
            step={10}
            value={value.onsiteElectricityRngMmbtuHhv}
            onChange={(v) => onChange({ onsiteElectricityRngMmbtuHhv: v })}
          />
          <Num
            label="Share of on-site electricity exported"
            step={0.01}
            value={value.exportedElectricityShare}
            onChange={(v) => onChange({ exportedElectricityShare: v })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="label-mono text-muted-foreground">4. Project methane losses</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Vented biogas (scf)"
            step={100}
            value={value.ventedBiogasScf}
            onChange={(v) => onChange({ ventedBiogasScf: v })}
          />
          <Num
            label="Vented gas methane content"
            step={0.01}
            value={value.ventedBiogasCh4}
            onChange={(v) => onChange({ ventedBiogasCh4: v })}
          />
          <Num
            label="Volatile solids removed before the effluent pond"
            step={0.01}
            value={value.vsRemovedBeforePond}
            onChange={(v) => onChange({ vsRemovedBeforePond: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Digester leakage uses the CARB standard value for the selected digester type
          ({((DIGESTER_LEAKAGE[value.digesterType] ?? 0.02) * 100).toFixed(0)}%). Upgrading
          fugitives are derived from the methane balance, with CARB&rsquo;s 2% floor applied.
        </p>
        {storageBlock(
          "nonBcsStorage",
          "Project non-BCS storage",
          "Manure handled outside the biogas control system during the project.",
        )}
      </div>

      <div className="space-y-3">
        <h3 className="label-mono text-muted-foreground">5. Energy use</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num label="Digester grid electricity (kWh)" step={100} value={value.digesterGridKwh} onChange={(v) => onChange({ digesterGridKwh: v })} />
          <Num label="Digester natural gas (MMBtu HHV)" step={10} value={value.digesterNgMmbtuHhv} onChange={(v) => onChange({ digesterNgMmbtuHhv: v })} />
          <Num label="Digester diesel (gallons)" step={10} value={value.digesterDieselGal} onChange={(v) => onChange({ digesterDieselGal: v })} />
          <Num label="Digester raw biogas (MMBtu LHV)" step={10} value={value.digesterRawBiogasMmbtuLhv} onChange={(v) => onChange({ digesterRawBiogasMmbtuLhv: v })} />
          <Num label="Digester biomethane (MMBtu HHV)" step={10} value={value.digesterBiomethaneMmbtuHhv} onChange={(v) => onChange({ digesterBiomethaneMmbtuHhv: v })} />
          <Num label="Upgrading grid electricity (kWh)" step={100} value={value.upgradingGridKwh} onChange={(v) => onChange({ upgradingGridKwh: v })} />
          <Num label="Upgrading natural gas (MMBtu HHV)" step={10} value={value.upgradingNgMmbtuHhv} onChange={(v) => onChange({ upgradingNgMmbtuHhv: v })} />
          <Num label="Upgrading diesel (gallons)" step={10} value={value.upgradingDieselGal} onChange={(v) => onChange({ upgradingDieselGal: v })} />
          <Num label="Upgrading propane (gallons)" step={10} value={value.upgradingPropaneGal} onChange={(v) => onChange({ upgradingPropaneGal: v })} />
          <Num label="Upgrading on-site biogas electricity (kWh)" step={100} value={value.upgradingOnsiteElecKwh} onChange={(v) => onChange({ upgradingOnsiteElecKwh: v })} />
          <Num label="Upgrading raw biogas (MMBtu LHV)" step={10} value={value.upgradingRawBiogasMmbtuLhv} onChange={(v) => onChange({ upgradingRawBiogasMmbtuLhv: v })} />
          <Num label="Upgrading biomethane (MMBtu HHV)" step={10} value={value.upgradingBiomethaneMmbtuHhv} onChange={(v) => onChange({ upgradingBiomethaneMmbtuHhv: v })} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="label-mono text-muted-foreground">6. Delivery</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Pipeline distance to the fuelling stations (miles)"
            step={10}
            value={value.pipelineMiles}
            onChange={(v) => onChange({ pipelineMiles: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          CNG compression and tailpipe emissions use CARB&rsquo;s standard values.
        </p>
      </div>

      {result ? (
        <p className="text-xs text-muted-foreground">
          {num(result.baselineCh4PerMonth)} MT CH4 per month in the baseline against{" "}
          {num(result.projectCh4PerMonth)} MT CH4 per month in the project ·{" "}
          {(result.allocationFactor * 100).toFixed(1)}% of the credit allocated to the RNG sold ·{" "}
          {num(result.dispensableMmbtu)} MMBtu dispensed ({num(result.annualMj)} MJ per year)
        </p>
      ) : null}
    </div>
  );
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function DetailSection({
  title,
  description,
  enabled,
  onToggle,
  total,
  totalLabel,
  children,
  tone = "blue",
  locked = false,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  total: string;
  totalLabel: string;
  children: React.ReactNode;
  tone?: SectionTone;
  locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="glass-panel border-l-4 p-5"
      style={{ borderLeftColor: TONE_COLOR[tone] }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-2 inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: TONE_COLOR[tone] }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold text-foreground">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <span className="label-mono block text-muted-foreground">{totalLabel}</span>
            <span className="font-display text-base font-extrabold tabular-nums text-foreground">
              {total}
            </span>
          </div>
          {locked ? null : (
            <>
              <label className="label-mono inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-[rgb(21,128,61)]"
                  checked={enabled}
                  onChange={(e) => {
                    onToggle(e.target.checked);
                    if (e.target.checked) setOpen(true);
                  }}
                />
                Use detailed inputs
              </label>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
              >
                {open ? "Hide" : "Edit"}
                <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            </>
          )}
        </div>
      </div>
      {open && !locked ? <div className="mt-4 space-y-4">{children}</div> : null}
    </section>
  );
}

function LegEditor({
  legs,
  onChange,
  addLabel,
}: {
  legs: TransportLeg[];
  onChange: (legs: TransportLeg[]) => void;
  addLabel: string;
}) {
  const patch = (i: number, p: Partial<TransportLeg>) =>
    onChange(legs.map((l, idx) => (idx === i ? { ...l, ...p } : l)));
  return (
    <div className="space-y-3">
      {legs.map((leg, i) => (
        <div key={leg.id} className="rounded-lg border border-border bg-background/40 p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Leg name">
              <input
                className={inputCls}
                value={leg.label}
                onChange={(e) => patch(i, { label: e.target.value })}
              />
            </Field>
            <Field label="Mode">
              <select
                className={inputCls}
                value={leg.mode}
                onChange={(e) => patch(i, { mode: e.target.value as TransportModeId })}
              >
                {TRANSPORT_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.gPerTonneKm} g/t-km
                  </option>
                ))}
              </select>
            </Field>
            <Num
              label="Distance (km)"
              step={1}
              value={leg.distanceKm}
              onChange={(v) => patch(i, { distanceKm: v })}
            />
            <Num
              label="Share of mass (%)"
              step={1}
              value={leg.sharePct}
              onChange={(v) => patch(i, { sharePct: v })}
            />
            <Num
              label="Empty return factor"
              hint="1.0 = no empty running"
              step={0.05}
              value={leg.emptyReturn}
              onChange={(v) => patch(i, { emptyReturn: v })}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(legs.filter((_, idx) => idx !== i))}
            className="label-mono mt-2 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-3.5" /> Remove leg
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...legs,
            {
              id: `leg-${Date.now()}`,
              label: "New leg",
              mode: "truckHeavy",
              distanceKm: 100,
              sharePct: 100,
              emptyReturn: 1.2,
            },
          ])
        }
        className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
      >
        <Plus className="size-3.5" /> {addLabel}
      </button>
    </div>
  );
}

function ItemEditor<T extends ChemicalItem | CoProductItem>({
  items,
  onChange,
  presets,
  doseLabel,
  factorLabel,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  presets: { id: string; label: string; gPerKg: number }[];
  doseLabel: string;
  factorLabel: string;
  addLabel: string;
}) {
  const patch = (i: number, p: Partial<T>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)) as T[]);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id} className="rounded-lg border border-border bg-background/40 p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Input">
              <select
                className={inputCls}
                value={presets.find((p) => p.label === item.label)?.id ?? "custom"}
                onChange={(e) => {
                  const preset = presets.find((p) => p.id === e.target.value);
                  if (preset) patch(i, { label: preset.label, gPerKg: preset.gPerKg } as Partial<T>);
                }}
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Num
              label={doseLabel}
              step={0.1}
              value={item.kgPerTonneFuel}
              onChange={(v) => patch(i, { kgPerTonneFuel: v } as Partial<T>)}
            />
            <Num
              label={factorLabel}
              step={10}
              value={item.gPerKg}
              onChange={(v) => patch(i, { gPerKg: v } as Partial<T>)}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="label-mono mt-2 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            {
              id: `item-${Date.now()}`,
              label: presets[0]!.label,
              kgPerTonneFuel: 0,
              gPerKg: presets[0]!.gPerKg,
            } as T,
          ])
        }
        className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
      >
        <Plus className="size-3.5" /> {addLabel}
      </button>
    </div>
  );
}

/**
 * "general" renders the multi-pathway lifecycle calculator (dairy manure model excluded).
 * "dairy" renders the standalone dairy manure RNG farm model only.
 */
export type CiBuilderMode = "general" | "dairy";

export function PathwayCiBuilder({ mode = "general" }: { mode?: CiBuilderMode } = {}) {
  const dairyMode = mode === "dairy";
  const [region, setRegion] = useState<ElectricityRegionId>("usAverage");
  const [inputs, setInputs] = useState<ScenarioInputs>(() =>
    scenarioFromPathway(dairyMode ? "rng-dairy" : "rd-uco", "usAverage"),
  );
  const [units, setUnits] = useState<Partial<Record<SourceId, string>>>({});
  const [ciUnitId, setCiUnitId] = useState<string>("g-mj");
  const [massUnitId, setMassUnitId] = useState<string>("t");
  /** Results stay hidden until the user has typed at least one value. */
  const [touched, setTouched] = useState(true);
  const markTouched = useCallback(() => setTouched(true), []);

  const { premium, canEdit, signedIn } = usePremium();

  const result = useMemo(() => calculateScenario({ ...inputs, region }), [inputs, region]);

  const ciUnit = CI_UNIT_BY_ID[ciUnitId] ?? CI_UNITS[0]!;
  const massUnit = MASS_UNITS.find((m) => m.id === massUnitId) ?? MASS_UNITS[0]!;
  const ci = (g: number) => (g * ciUnit.factor).toFixed(ciUnit.decimals);

  const selectPathway = (id: string) => {
    setTouched(true);
    setInputs(scenarioFromPathway(id, region));
  };
  const setEnergy = (k: SourceId, v: number) =>
    setInputs((p) => ({ ...p, energy: { ...p.energy, [k]: v } }));
  const setVariant = (k: SourceId, v: string) =>
    setInputs((p) => ({ ...p, sourceVariants: { ...p.sourceVariants, [k]: v } }));

  const detail: DetailModules = inputs.detail ?? defaultDetailModules(inputs.feedstockId);
  const setModule = <K extends Exclude<DetailModuleKey, "dairyMethod">>(
    key: K,
    patch: Partial<DetailModules[K]>,
  ) =>
    setInputs((p) => {
      const base = p.detail ?? defaultDetailModules(p.feedstockId);
      return { ...p, detail: { ...base, [key]: { ...(base[key] as object), ...patch } } };
    });
  const setDairyMethod = (method: DairyMethod) =>
    setInputs((p) => {
      const base = p.detail ?? defaultDetailModules(p.feedstockId);
      return { ...p, detail: { ...base, dairyMethod: method } };
    });
  const moduleTotal = (key: DetailModuleKey) => `${ci(result.moduleTotals[key] ?? 0)} ${ciUnit.label}`;

  const availablePathways = dairyMode
    ? PATHWAYS.filter((p) => p.id === "rng-dairy")
    : PATHWAYS.filter((p) => p.id !== "rng-dairy");
  const groups = Array.from(new Set(availablePathways.map((p) => p.group)));
  const feedstock = FEEDSTOCK_BY_ID[inputs.feedstockId];

  const annualTonnes = result.annualTonnesCo2e * massUnit.factor;

  const buildWorkbook = (): WorkbookExport => {
    
    const regionLabel =
      ELECTRICITY_REGIONS.find((r) => r.id === region)?.label ?? String(region);

    const calcSections: SheetSection[] = [];

    calcSections.push({
      title: "Scenario",
      header: ["Setting", "Value", "Note"],
      rows: [
        ["Fuel pathway", result.pathway.label, result.pathway.summary],
        ["Feedstock source", feedstock ? feedstock.label : "Custom", ""],
        ["Electricity region", regionLabel, ""],
        ["Annual volume", inputs.annualVolume, ""],
        {
          key: "annualMj",
          cells: ["Annual energy (MJ)", Number(result.annualEnergyMj.toFixed(0)), "Annual volume × energy per unit"],
        },
        ["Carbon intensity unit", ciUnit.label, ""],
        {
          key: "ciFactor",
          cells: ["Carbon intensity unit factor", ciUnit.factor, `Multiplier from gCO2e/MJ to ${ciUnit.label}`],
        },
        ["Annual footprint unit", massUnit.label, ""],
        {
          key: "massFactor",
          cells: ["Annual footprint unit factor", massUnit.factor, `Multiplier from tonnes CO2e to ${massUnit.label}`],
        },
      ],
    });

    // Dairy manure RNG: the farm model replaces the generic lifecycle inputs, so
    // every entered field is written out explicitly here.
    if (detail.dairyRng.enabled && detail.dairyMethod === "lcfs") {
      const d = detail.dairyLcfs;
      const num2 = (v: number) => Number(v);
      calcSections.push({
        title: "CARB LCFS Tier 1 — project background",
        header: ["Input", "Value", "Unit / note"],
        rows: [
          ["Digester type", d.digesterType, "Sets collection efficiency and leakage rate"],
          ["Electricity region", d.electricityRegion, "eGRID region for grid power"],
          ["Average annual temperature", num2(d.annualTemperatureC), "°C"],
          ["September full cleanout", d.septemberCleanout ? "Yes" : "No", "Livestock Protocol cleanout rule"],
          ["Reporting months", num2(d.reportingMonths), "months in the reporting period"],
          ...d.monthlyTemperatureC.map((t, idx) => [
            `Monthly temperature — month ${idx + 1}`,
            num2(t),
            "°C",
          ] as SheetRow),
        ],
      });

      calcSections.push({
        title: "CARB LCFS Tier 1 — herd and baseline manure",
        header: [
          "Livestock category",
          "Population (head)",
          "VS excretion (kg/head/day)",
          "Max methane potential Bo (m3 CH4/kg VS)",
          "Fraction to anaerobic storage",
        ],
        rows: d.livestock.map((c) => [
          c.label,
          num2(c.population),
          num2(c.vsRate),
          num2(c.bo),
          num2(c.msAnaerobic),
        ]),
      });

      const storageRows = (list: typeof d.otherStorage, tag: string): SheetRow[] =>
        list.map((s) => [
          tag,
          s.system,
          ...d.livestock.map((_, idx) => num2(s.fractions?.[idx] ?? 0)),
        ] as SheetRow);
      calcSections.push({
        title: "CARB LCFS Tier 1 — storage systems (share of manure by category)",
        header: ["Set", "Storage system", ...d.livestock.map((c) => c.label)],
        rows: [
          ...storageRows(d.otherStorage, "Baseline non-anaerobic"),
          ...storageRows(d.nonBcsStorage, "Project non-BCS"),
        ],
      });

      calcSections.push({
        title: "CARB LCFS Tier 1 — project gas and methane losses",
        header: ["Input", "Value", "Unit / note"],
        rows: [
          ["Raw biogas produced", num2(d.rawBiogasScf), "scf over the reporting period"],
          ["Raw biogas methane content", num2(d.rawBiogasCh4), "fraction"],
          ["Biogas to upgrading", num2(d.biogasToUpgradingScf), "scf"],
          ["Biogas to upgrading methane content", num2(d.biogasToUpgradingCh4), "fraction"],
          ["Biomethane injected", num2(d.biomethaneInjectedMmbtuHhv), "MMBtu HHV"],
          ["Flared biomethane", num2(d.flaredBiomethaneScf), "scf"],
          ["Flared biomethane methane content", num2(d.flaredBiomethaneCh4), "fraction"],
          ["Vented biogas", num2(d.ventedBiogasScf), "scf"],
          ["Vented biogas methane content", num2(d.ventedBiogasCh4), "fraction"],
          ["Biomethane to on-site electricity", num2(d.onsiteElectricityRngMmbtuHhv), "MMBtu HHV"],
          ["Exported share of on-site electricity", num2(d.exportedElectricityShare), "fraction"],
          ["VS removed before effluent ponds", num2(d.vsRemovedBeforePond), "fraction"],
        ],
      });

      calcSections.push({
        title: "CARB LCFS Tier 1 — energy use and delivery",
        header: ["Input", "Value", "Unit / note"],
        rows: [
          ["Digester grid electricity", num2(d.digesterGridKwh), "kWh"],
          ["Digester natural gas", num2(d.digesterNgMmbtuHhv), "MMBtu HHV"],
          ["Digester diesel", num2(d.digesterDieselGal), "gal"],
          ["Digester raw biogas", num2(d.digesterRawBiogasMmbtuLhv), "MMBtu LHV"],
          ["Digester biomethane", num2(d.digesterBiomethaneMmbtuHhv), "MMBtu HHV"],
          ["Upgrading grid electricity", num2(d.upgradingGridKwh), "kWh"],
          ["Upgrading natural gas", num2(d.upgradingNgMmbtuHhv), "MMBtu HHV"],
          ["Upgrading diesel", num2(d.upgradingDieselGal), "gal"],
          ["Upgrading propane", num2(d.upgradingPropaneGal), "gal"],
          ["Upgrading on-site electricity", num2(d.upgradingOnsiteElecKwh), "kWh"],
          ["Upgrading raw biogas", num2(d.upgradingRawBiogasMmbtuLhv), "MMBtu LHV"],
          ["Upgrading biomethane", num2(d.upgradingBiomethaneMmbtuHhv), "MMBtu HHV"],
          ["Pipeline distance to station", num2(d.pipelineMiles), "miles"],
        ],
      });

      const r = result.dairyLcfs;
      if (r) {
        calcSections.push({
          title: "CARB LCFS Tier 1 — intermediate results",
          header: ["Quantity", "Value", "Unit"],
          rows: [
            ["Dispensable biomethane", Number(r.dispensableMmbtu.toFixed(2)), "MMBtu LHV over the period"],
            ["Energy basis", Number(r.periodMj.toFixed(0)), "MJ over the period"],
            ["Annualised energy", Number(r.annualMj.toFixed(0)), "MJ/yr"],
            ["Annual footprint", Number(r.annualTonnesCo2e.toFixed(2)), "t CO2e/yr"],
            ["Baseline methane", Number(r.baselineCh4PerMonth.toFixed(3)), "MT CH4/month"],
            ["  of which anaerobic storage", Number(r.baselineAnaerobicPerMonth.toFixed(3)), "MT CH4/month"],
            ["  of which other storage", Number(r.baselineOtherPerMonth.toFixed(3)), "MT CH4/month"],
            ["Project methane", Number(r.projectCh4PerMonth.toFixed(3)), "MT CH4/month"],
            ["  effluent ponds", Number(r.effluentPondPerMonth.toFixed(3)), "MT CH4/month"],
            ["  non-BCS storage", Number(r.nonBcsPerMonth.toFixed(3)), "MT CH4/month"],
            ["  digester leakage", Number(r.digesterLeakagePerMonth.toFixed(3)), "MT CH4/month"],
            ["  upgrading fugitives", Number(r.upgradingFugitivePerMonth.toFixed(3)), "MT CH4/month"],
            ["  venting", Number(r.ventedPerMonth.toFixed(3)), "MT CH4/month"],
            ["  flaring", Number(r.flaredPerMonth.toFixed(3)), "MT CH4/month"],
            ["Upgrading fugitive fraction", Number(r.upgradingFugitiveFraction.toFixed(4)), "fraction of inlet methane"],
            ["Allocation factor", Number(r.allocationFactor.toFixed(4)), "share of credit to RNG sold"],
            ["Net methane avoided", Number(r.netCh4AvoidedMt.toFixed(3)), "MT CH4 over the period"],
            ["Avoided methane credit", Number(r.avoidedCh4GPerMj.toFixed(3)), "gCO2e/MJ"],
          ],
        });
      }
    }

    if (detail.dairyRng.enabled && detail.dairyMethod === "greet") {
      const g = detail.dairyRng;
      calcSections.push({
        title: "Dairy RNG farm model (GREET) inputs",
        header: ["Input", "Value", "Unit"],
        rows: [
          ["Milking cows", g.dairyCows, "head"],
          ["Dry cows", g.dryCows, "head"],
          ["Heifers", g.heifers, "head"],
          ["Moisture of wet manure", g.moisture, "fraction"],
          ["Manure, milking cow", g.manureDairyCowTpy, "t/head/yr"],
          ["Manure, dry cow", g.manureDryCowTpy, "t/head/yr"],
          ["Manure, heifer", g.manureHeiferTpy, "t/head/yr"],
          ["RNG yield", g.rngBtuPerLbTs, "Btu/lb dry solids"],
          ["Baseline MCF, cows", g.mcfCow, "fraction"],
          ["Baseline MCF, heifers", g.mcfHeifer, "fraction"],
          ["Biogas flaring", g.flaringBtuPerLbTs, "Btu/lb dry manure"],
          ["Natural gas use", g.ngBtuPerMmbtu, "Btu/mmBtu RNG"],
          ["Digester electricity", g.elecAdBtuPerMmbtu, "Btu/mmBtu RNG"],
          ["Upgrading electricity", g.elecRngBtuPerMmbtu, "Btu/mmBtu RNG"],
          ["Feed loss in digestion", g.feedLossAd, "fraction"],
          ["Feed loss in upgrading", g.feedLossUpgrading, "fraction"],
          ["Pipeline transmission", g.pipelineMiles, "miles"],
          ["On-farm truck", g.truckMiles, "miles/yr"],
          ["GWP of methane", g.gwpCh4, "—"],
          ["GWP of nitrous oxide", g.gwpN2o, "—"],
        ],
      });
    }

    const energyRows = SOURCES.flatMap((s) => {
      const qty = inputs.energy[s.id] ?? 0;
      if (!qty) return [];
      const variant = SOURCE_VARIANTS[s.id]?.find((v) => v.id === inputs.sourceVariants?.[s.id]);
      return [[s.label, variant ? variant.label : "", qty, `${s.unit}/MJ fuel`]];
    });
    if (energyRows.length) {
      calcSections.push({
        title: "Process energy inputs",
        header: ["Energy source", "Source variant", "Quantity", "Unit"],
        rows: energyRows,
      });
    }

    // Every lifecycle row is written as a live formula: the activity, factor,
    // divisor and sign/allocation sit in their own cells so the workbook can be
    // re-run with different numbers.
    const lineHeader = [
      "Item",
      "Basis / detail",
      "Activity",
      "Activity unit",
      "Emission factor",
      "Factor unit",
      "Divisor",
      "Sign × allocation",
      `Value (${ciUnit.label})`,
      `Annual (${massUnit.label})`,
    ];
    const VALUE_COL = 9;
    const positiveKeys: string[] = [];
    const negativeKeys: string[] = [];
    const subtotalKeys: string[] = [];
    let rowIndex = 0;

    for (const section of EXPORT_SECTIONS) {
      const items = result.lineItems.filter((item) => exportSectionFor(item) === section);
      if (!items.length) continue;
      const sectionKeys: string[] = [];
      const rows: SheetRow[] = items.map((l) => {
        const key = `li-${rowIndex++}`;
        sectionKeys.push(key);
        (l.gPerMj < 0 ? negativeKeys : positiveKeys).push(key);
        const activity = l.activity ?? l.gPerMj;
        const factor = l.factor ?? 1;
        const divisor = l.divisor ?? 1;
        const multiplier = (l.sign ?? 1) * (l.allocation ?? 1);
        return {
          key,
          refCol: VALUE_COL,
          cells: [
            l.label,
            l.detail ?? "",
            activity,
            l.activityUnit ?? "gCO2e/MJ",
            factor,
            l.factorUnit ?? "—",
            divisor,
            multiplier,
            { formula: `C{r}*E{r}/G{r}*H{r}*{{cell:ciFactor}}` },
            { formula: `I{r}/{{cell:ciFactor}}*{{cell:annualMj}}/1000000*{{cell:massFactor}}` },
          ],
        } satisfies SheetRow;
      });
      const subtotalKey = `sub-${section}`;
      subtotalKeys.push(subtotalKey);
      rows.push({
        key: subtotalKey,
        refCol: VALUE_COL,
        bold: true,
        cells: [
          `${section} subtotal`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          {
            formula: `SUM(${sectionKeys.map((k) => `{{cell:${k}}}`).join(",")})`,
          },
          { formula: `I{r}/{{cell:ciFactor}}*{{cell:annualMj}}/1000000*{{cell:massFactor}}` },
        ],
      });
      calcSections.push({ title: section, header: lineHeader, rows });
    }

    const sumOf = (keys: string[]) =>
      keys.length ? `SUM(${keys.map((k) => `{{cell:${k}}}`).join(",")})` : "0";
    const annualFormula = `I{r}/{{cell:ciFactor}}*{{cell:annualMj}}/1000000*{{cell:massFactor}}`;

    calcSections.push({
      title: "Results",
      header: ["Result", "Basis", "", "", "", "", "", "", `Value (${ciUnit.label})`, `Annual (${massUnit.label})`],
      rows: [
        {
          key: "grossCi",
          refCol: VALUE_COL,
          bold: true,
          cells: ["Gross emissions", "Sum of all positive line items", "", "", "", "", "", "", { formula: sumOf(positiveKeys) }, { formula: annualFormula }],
        },
        {
          key: "creditsCi",
          refCol: VALUE_COL,
          bold: true,
          cells: ["Credits applied", "Sum of all credit line items", "", "", "", "", "", "", { formula: sumOf(negativeKeys) }, { formula: annualFormula }],
        },
        {
          key: "ciTotal",
          refCol: VALUE_COL,
          bold: true,
          cells: [
            "Total carbon intensity",
            "Sum of every section subtotal",
            "",
            "",
            "",
            "",
            "",
            "",
            { formula: sumOf(subtotalKeys) },
            { formula: annualFormula },
          ],
        },
      ],
    });

    calcSections.push({
      title: "Regulatory program comparison",
      header: [
        "Program",
        "Jurisdiction",
        `Benchmark (${ciUnit.label})`,
        "EER applied",
        `Adjusted benchmark (${ciUnit.label})`,
        "Benchmark basis",
        "Saving vs benchmark",
        "Annual credits (t CO2e)",
      ],
      rows: result.programs.map((p) => {
        if (p.benchmark == null) {
          return [p.program.label, p.program.jurisdiction, "Fuel not covered", "", "", p.program.benchmarkBasis, "—", "—"];
        }
        return {
          cells: [
            p.program.label,
            p.program.jurisdiction,
            Number(ci(p.benchmark)),
            p.eer,
            { formula: `C{r}*D{r}` },
            p.program.benchmarkBasis,
            { formula: `(C{r}-{{cell:ciTotal}})/C{r}` },
            p.program.creditMarket
              ? { formula: `(E{r}-{{cell:ciTotal}})/{{cell:ciFactor}}*{{cell:annualMj}}/1000000` }
              : "—",
          ],
        } satisfies SheetRow;
      }),
    });

    const factors = backgroundFactors();
    const contributionValues = EXPORT_SECTIONS.map((section) =>
      result.lineItems
        .filter((item) => exportSectionFor(item) === section)
        .reduce((sum, item) => sum + item.gPerMj * ciUnit.factor, 0),
    );
    const comparisonPrograms = result.programs.filter((program) => program.benchmark != null);
    const calcCharts: WorkbookChart[] = [
      {
        title: "Lifecycle contribution by emission source",
        kind: "contribution",
        categories: [...EXPORT_SECTIONS],
        series: [
          {
            name: "Contribution",
            values: contributionValues,
            color: "#15803D",
          },
        ],
        unit: ciUnit.label,
      },
      {
        title: "Regulatory program comparison",
        kind: "comparison",
        categories: comparisonPrograms.map((program) => program.program.label),
        series: [
          {
            name: "Pathway CI",
            values: comparisonPrograms.map(() => result.ciTotal * ciUnit.factor),
            color: "#15803D",
          },
          {
            name: "Program benchmark",
            values: comparisonPrograms.map((program) => (program.benchmark ?? 0) * ciUnit.factor),
            color: "#1D4ED8",
          },
        ],
        unit: ciUnit.label,
      },
    ];
    const factorGroups = Array.from(new Set(factors.map((f) => f.group)));
    const factorSections: SheetSection[] = factorGroups.map((group) => ({
      title: group,
      header: ["Item", "Detail", "Value", "Unit", "Source"],
      rows: factors
        .filter((f) => f.group === group)
        .map((f) => [f.item, f.detail, f.value, f.unit, f.source]),
    }));

    const keySections: SheetSection[] = [
      {
        title: "Sheets in this workbook",
        header: ["Sheet", "Contents"],
        rows: [
          ["Calculation", "Scenario settings and every lifecycle stage, section by section, with subtotals, results and program comparison."],
          ["Emission factors", "All background emission factors used in the calculation, grouped by type, with sources."],
          ["Keys", "Definitions of terms, units, lifecycle sections and references."],
        ],
      },
      {
        title: "Units and terms",
        header: ["Term", "Meaning"],
        rows: [
          ["CI", "Carbon intensity — lifecycle greenhouse gas emissions per unit of fuel energy."],
          ["Activity", "The quantity used in each line (fuel, electricity, fertiliser, tonne-kilometres). Editable — every value cell recalculates."],
          ["Emission factor", "Emissions released per unit of activity for that line."],
          ["Divisor", "Converts the line to a per-megajoule basis (feedstock yield, MJ per tonne of fuel, MJ per GJ)."],
          ["Sign × allocation", "−1 marks a credit; values below 1 apply the energy allocation share to co-products."],
          ["Value", "Live formula: Activity × Emission factor ÷ Divisor × Sign × allocation × unit factor."],
          ["Annual", "Live formula: Value ÷ unit factor × Annual energy ÷ 1,000,000 × annual footprint unit factor."],
          [ciUnit.label, "Carbon intensity unit selected for this export."],
          [massUnit.label, "Annual footprint mass unit selected for this export."],
          ["MJ", "Megajoule of finished fuel energy (lower heating value basis)."],
          ["gCO2e", "Grams of carbon dioxide equivalent using 100-year global warming potentials."],
          ["Gross emissions", "Sum of all positive lifecycle emission line items before credits."],
          ["Credits applied", "Co-product and avoided-emission credits subtracted from gross emissions."],
          ["Benchmark", "The comparison carbon intensity each program uses for this fuel type: a fossil comparator in threshold programs and an annual compliance standard or baseline in credit programs."],
          ["Saving vs benchmark", "(Benchmark − pathway CI) ÷ benchmark, always measured against the unadjusted benchmark."],
          ["EER", "Energy economy ratio: applied to the benchmark only when calculating credits in credit-market programs."],
        ],
      },
      {
        title: "Lifecycle sections",
        header: ["Section", "Covers"],
        rows: [
          ["Feedstock production", "Cultivation, fertiliser, collection, rendering and other feedstock supply emissions."],
          ["Land use change", "Amortised direct and indirect land use change emissions where applied."],
          ["Transportation", "Feedstock and intermediate movement by truck, rail, barge, ship or pipeline."],
          ["Process energy", "Electricity, natural gas, propane, diesel, steam, hydrogen and other conversion energy."],
          ["Chemicals and fugitive emissions", "Process chemicals, catalysts, hydrogen inputs and fugitive/venting losses."],
          ["Co-products and avoided emissions", "Credits from co-products, exported power and displaced products."],
          ["Fuel distribution", "Finished fuel movement and storage to the blending or dispensing point."],
          ["Tailpipe and end use", "Combustion or end-use emissions for the selected end-use mode."],
        ],
      },
      {
        title: "References",
        header: ["Source"],
        rows: [
          ["Argonne National Laboratory GREET model documentation"],
          ["CARB CA-GREET and LCFS certified pathway summaries"],
          ["EU RED II / RED III Annex V typical and default values"],
          ["Program guidance: Oregon CFP, Washington CFS, Canada CFR, UK RTFO, US RFS, RenovaBio, CORSIA, FuelEU Maritime"],
          ["Indicative results for information only — not a certified pathway CI score."],
        ],
      },
    ];

    return {
      title: `Carbon intensity calculation — ${result.pathway.label}`,
      filename: `ci-calculation-${result.pathway.id}`,
      note: `Electricity region: ${regionLabel}. Indicative results, not a certified pathway CI score.`,
      sheets: [
        {
          name: "Calculation",
          intro: "Lifecycle carbon intensity, section by section.",
          sections: calcSections,
          columnWidths: [40, 42, 14, 18, 16, 20, 12, 16, 18, 20],
          charts: calcCharts,
        },
        {
          name: "Emission factors",
          intro: "Background factors applied in this calculation.",
          sections: factorSections,
          columnWidths: [40, 46, 16, 22, 48],
        },
        { name: "Keys", sections: keySections, columnWidths: [34, 90] },
      ],
    };
  };


  return (
    <CalcTouchContext.Provider value={markTouched}>
    <div className="space-y-4">
      <section
        className="glass-panel border-l-4 p-5"
        style={{ borderLeftColor: TONE_COLOR.green }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-start gap-2.5">
            <span
              className="mt-2 inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: TONE_COLOR.green }}
              aria-hidden="true"
            />
            <h2 className="font-display text-lg font-extrabold text-foreground">
              Fuel pathway
            </h2>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                setInputs(scenarioFromPathway(inputs.pathwayId, region));
              }}
              className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
            >
              <RotateCcw className="size-3.5" />
              Reset pathway defaults
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fuel pathway" hint={result.pathway.summary}>
            {canEdit ? (
              <select
                className={inputCls}
                value={inputs.pathwayId}
                onChange={(e) => selectPathway(e.target.value)}
              >
                {groups.map((g) => (
                  <optgroup key={g} label={g}>
                    {availablePathways.filter((p) => p.group === g).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <p className="flex min-h-11 items-center rounded-md border border-border bg-muted/30 px-3 text-sm font-medium text-foreground">
                {result.pathway.label}
              </p>
            )}
          </Field>



          <Field
            label="Annual production"
            hint={`${result.pathway.unitLabel}s per year · ${num(result.annualEnergyMj)} MJ`}
          >
            {canEdit ? (
              <BlankNumInput
                min={0}
                ariaLabel="Annual production"
                value={inputs.annualVolume}
                onChange={(v) => setInputs((p) => ({ ...p, annualVolume: v }))}
              />
            ) : (
              <p className="flex h-11 items-center rounded-md border border-border bg-muted/30 px-3 text-sm font-medium text-foreground">
                {num(inputs.annualVolume)} {result.pathway.unitLabel}s per year
              </p>
            )}
          </Field>
        </div>
      </section>


      {dairyMode && inputs.feedstockId === "manure" ? (
        <DetailSection
          title="Dairy manure farm model"
          description={
            detail.dairyMethod === "lcfs"
              ? "The CARB LCFS Tier 1 method for dairy and swine manure biomethane — herd, baseline manure storage, project gas, methane losses, energy use and delivery."
              : "Herd size, manure, digester and upgrading energy. Built on the GREET 2024 dairy RNG workbook."
          }
          enabled={detail.dairyRng.enabled}
          onToggle={(v) => setModule("dairyRng", { enabled: v })}
          total={moduleTotal("dairyRng")}
          totalLabel="Calculated"
          tone="green"
          locked={!canEdit}
        >
          <Field
            label="Calculation method"
            hint={
              detail.dairyMethod === "lcfs"
                ? "CARB Tier 1 CI Calculator for Dairy and Swine Manure Biomethane, release 07/01/2025."
                : "Argonne GREET 2024 farm-level dairy RNG model."
            }
          >
            <select
              className={inputCls}
              value={detail.dairyMethod}
              onChange={(e) => setDairyMethod(e.target.value as DairyMethod)}
            >
              <option value="lcfs">CARB LCFS Tier 1 (dairy/swine manure)</option>
              <option value="greet">GREET 2024 farm model</option>
            </select>
          </Field>

          {detail.dairyMethod === "lcfs" ? (
            <DairyLcfsFields
              value={detail.dairyLcfs}
              onChange={(patch) => setModule("dairyLcfs", patch)}
              result={result.dairyLcfs ?? null}
              num={num}
            />
          ) : (
            <>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Num label="Milking cows (head)" step={10} value={detail.dairyRng.dairyCows} onChange={(v) => setModule("dairyRng", { dairyCows: v })} />
            <Num label="Dry cows (head)" step={10} value={detail.dairyRng.dryCows} onChange={(v) => setModule("dairyRng", { dryCows: v })} />
            <Num label="Heifers (head)" step={10} value={detail.dairyRng.heifers} onChange={(v) => setModule("dairyRng", { heifers: v })} />
            <Num label="Moisture of wet manure (fraction)" step={0.01} value={detail.dairyRng.moisture} onChange={(v) => setModule("dairyRng", { moisture: v })} />
            <Num label="Manure, milking cow (t/head/yr)" step={0.1} value={detail.dairyRng.manureDairyCowTpy} onChange={(v) => setModule("dairyRng", { manureDairyCowTpy: v })} />
            <Num label="Manure, dry cow (t/head/yr)" step={0.1} value={detail.dairyRng.manureDryCowTpy} onChange={(v) => setModule("dairyRng", { manureDryCowTpy: v })} />
            <Num label="Manure, heifer (t/head/yr)" step={0.1} value={detail.dairyRng.manureHeiferTpy} onChange={(v) => setModule("dairyRng", { manureHeiferTpy: v })} />
            <Num
              label="RNG yield (Btu/lb dry manure)"
              step={10}
              value={detail.dairyRng.rngBtuPerLbTs}
              onChange={(v) => setModule("dairyRng", { rngBtuPerLbTs: v })}
            />
            <Num
              label="Baseline MCF, cows"
              hint="Methane conversion factor of the reference manure system"
              step={0.01}
              value={detail.dairyRng.mcfCow}
              onChange={(v) => setModule("dairyRng", { mcfCow: v })}
            />
            <Num label="Baseline MCF, heifers" step={0.01} value={detail.dairyRng.mcfHeifer} onChange={(v) => setModule("dairyRng", { mcfHeifer: v })} />
            <Num label="Biogas flaring (Btu/lb dry manure)" step={1} value={detail.dairyRng.flaringBtuPerLbTs} onChange={(v) => setModule("dairyRng", { flaringBtuPerLbTs: v })} />
            <Num label="Natural gas use (Btu/mmBtu RNG)" step={1000} value={detail.dairyRng.ngBtuPerMmbtu} onChange={(v) => setModule("dairyRng", { ngBtuPerMmbtu: v })} />
            <Num label="Digester electricity (Btu/mmBtu RNG)" step={1000} value={detail.dairyRng.elecAdBtuPerMmbtu} onChange={(v) => setModule("dairyRng", { elecAdBtuPerMmbtu: v })} />
            <Num label="Upgrading electricity (Btu/mmBtu RNG)" step={1000} value={detail.dairyRng.elecRngBtuPerMmbtu} onChange={(v) => setModule("dairyRng", { elecRngBtuPerMmbtu: v })} />
            <Num label="Feed loss in digestion (fraction)" step={0.005} value={detail.dairyRng.feedLossAd} onChange={(v) => setModule("dairyRng", { feedLossAd: v })} />
            <Num label="Feed loss in upgrading (fraction)" step={0.005} value={detail.dairyRng.feedLossUpgrading} onChange={(v) => setModule("dairyRng", { feedLossUpgrading: v })} />
            <Num label="Pipeline transmission (miles)" step={10} value={detail.dairyRng.pipelineMiles} onChange={(v) => setModule("dairyRng", { pipelineMiles: v })} />
            <Num label="On-farm truck (miles/yr)" step={10} value={detail.dairyRng.truckMiles} onChange={(v) => setModule("dairyRng", { truckMiles: v })} />
            <Num label="GWP of methane" step={1} value={detail.dairyRng.gwpCh4} onChange={(v) => setModule("dairyRng", { gwpCh4: v })} />
            <Num label="GWP of nitrous oxide" step={1} value={detail.dairyRng.gwpN2o} onChange={(v) => setModule("dairyRng", { gwpN2o: v })} />
          </div>
          {result.dairy ? (
            <p className="text-xs text-muted-foreground">
              {num(result.dairy.wetManureTonnes)} tonnes of wet manure per year ·{" "}
              {num(result.dairy.totalSolidsTonnes)} tonnes dry solids ·{" "}
              {num(result.dairy.rngMmbtu)} mmBtu of RNG ({num(result.dairy.annualMj)} MJ) ·{" "}
              {num(result.dairy.avoidedTonnesCo2e)} tonnes CO2e of avoided baseline emissions
            </p>
          ) : null}
            </>
          )}
        </DetailSection>
      ) : null}


      {dairyMode ? null : (
      <>
      <DetailSection


        title="Feedstock production"
        description="Cultivation, fertiliser and field N2O, collection, rendering and drying, per tonne of feedstock."
        enabled={detail.feedstockProduction.enabled}
        onToggle={(v) => setModule("feedstockProduction", { enabled: v })}
        total={moduleTotal("feedstockProduction")}
        totalLabel="Calculated"
        tone="green"
        locked={!canEdit}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Fuel yield (MJ per tonne feedstock)"
            step={100}
            value={detail.feedstockProduction.yieldMjPerTonne}
            onChange={(v) => setModule("feedstockProduction", { yieldMjPerTonne: v })}
          />
          <Num
            label="Cultivation diesel (L/t)"
            value={detail.feedstockProduction.cultivationDieselL}
            onChange={(v) => setModule("feedstockProduction", { cultivationDieselL: v })}
          />
          <Num
            label="Cultivation electricity (kWh/t)"
            value={detail.feedstockProduction.cultivationElectricityKwh}
            onChange={(v) => setModule("feedstockProduction", { cultivationElectricityKwh: v })}
          />
          <Num
            label="Irrigation electricity (kWh/t)"
            value={detail.feedstockProduction.irrigationElectricityKwh}
            onChange={(v) => setModule("feedstockProduction", { irrigationElectricityKwh: v })}
          />
          <Num
            label="Nitrogen fertiliser (kg N/t)"
            value={detail.feedstockProduction.nitrogenKg}
            onChange={(v) => setModule("feedstockProduction", { nitrogenKg: v })}
          />
          <Num
            label="Field N2O emission factor"
            hint="Fraction of applied N lost as N2O-N, IPCC default 0.01"
            step={0.001}
            value={detail.feedstockProduction.n2oEmissionFactor}
            onChange={(v) => setModule("feedstockProduction", { n2oEmissionFactor: v })}
          />
          <Num
            label="Phosphate (kg P2O5/t)"
            value={detail.feedstockProduction.phosphateKg}
            onChange={(v) => setModule("feedstockProduction", { phosphateKg: v })}
          />
          <Num
            label="Potash (kg K2O/t)"
            value={detail.feedstockProduction.potashKg}
            onChange={(v) => setModule("feedstockProduction", { potashKg: v })}
          />
          <Num
            label="Lime (kg/t)"
            value={detail.feedstockProduction.limeKg}
            onChange={(v) => setModule("feedstockProduction", { limeKg: v })}
          />
          <Num
            label="Pesticide (kg/t)"
            step={0.01}
            value={detail.feedstockProduction.pesticideKg}
            onChange={(v) => setModule("feedstockProduction", { pesticideKg: v })}
          />
          <Num
            label="Seed (kg/t)"
            value={detail.feedstockProduction.seedKg}
            onChange={(v) => setModule("feedstockProduction", { seedKg: v })}
          />
          <Num
            label="Collection and baling diesel (L/t)"
            value={detail.feedstockProduction.collectionDieselL}
            onChange={(v) => setModule("feedstockProduction", { collectionDieselL: v })}
          />
          <Num
            label="Rendering heat (MJ gas/t)"
            step={10}
            value={detail.feedstockProduction.renderingGasMj}
            onChange={(v) => setModule("feedstockProduction", { renderingGasMj: v })}
          />
          <Num
            label="Rendering electricity (kWh/t)"
            value={detail.feedstockProduction.renderingElectricityKwh}
            onChange={(v) => setModule("feedstockProduction", { renderingElectricityKwh: v })}
          />
          <Num
            label="Feedstock drying (MJ gas/t)"
            step={10}
            value={detail.feedstockProduction.dryingGasMj}
            onChange={(v) => setModule("feedstockProduction", { dryingGasMj: v })}
          />
          <Num
            label="Soil carbon change (kgCO2e/t)"
            hint="Negative for sequestration"
            value={detail.feedstockProduction.soilCarbonKgPerTonne}
            onChange={(v) => setModule("feedstockProduction", { soilCarbonKgPerTonne: v })}
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Feedstock transport"
        description="Add one leg per movement, choose the mode and distance; emissions scale with the mass hauled."
        enabled={detail.transport.enabled}
        onToggle={(v) => setModule("transport", { enabled: v })}
        total={moduleTotal("transport")}
        totalLabel="Calculated"
        tone="blue"
        locked={!canEdit}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Feedstock mass (tonnes per GJ of fuel)"
            step={0.001}
            value={detail.transport.tonnesPerGj}
            onChange={(v) => setModule("transport", { tonnesPerGj: v })}
          />
        </div>
        <LegEditor
          legs={detail.transport.legs}
          onChange={(legs) => setModule("transport", { legs })}
          addLabel="Add transport leg"
        />
      </DetailSection>

      <CollapsibleSection
        title="Process energy sources"
        description="One parameter per row — choose the supply, the amount and the unit."
        tone="red"
        totalLabel="Process energy"
        locked={!canEdit}
        total={`${ci(
          result.lineItems
            .filter((l) => l.category === "Process energy")
            .reduce((a, l) => a + l.gPerMj, 0),
        )} ${ciUnit.label}`}
      >
        <div className="space-y-3">

          {SOURCES.map((s, i) => {
            const unitList = UNIT_OPTIONS[s.unit];
            const unitId = units[s.id] ?? unitList[0]!.id;
            const unit = unitList.find((u) => u.id === unitId) ?? unitList[0]!;
            const base = inputs.energy[s.id] ?? 0;
            const shown = base / unit.toBase;
            const variants = SOURCE_VARIANTS[s.id];
            const tone = TONE_COLOR[ENERGY_TONES[i % ENERGY_TONES.length]!];
            return (
              <div
                key={s.id}
                className="rounded-lg border border-l-4 border-border p-3"
                style={{
                  borderLeftColor: tone,
                  background: `color-mix(in oklab, ${tone} 9%, transparent)`,
                }}
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-foreground">{s.label}</span>
                  <span className="label-mono text-muted-foreground">{s.unit} basis</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
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
                  <Field label="Quantity">
                    <BlankNumInput
                      min={0}
                      step={0.001}
                      ariaLabel={`${s.label} quantity`}
                      value={Number(shown.toFixed(6))}
                      onChange={(v) => setEnergy(s.id, v * unit.toBase)}
                    />
                  </Field>
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
      </CollapsibleSection>


      <DetailSection
        title="Chemicals and fugitive emissions"
        description="Process chemicals and catalysts per tonne of fuel, plus methane, nitrous oxide, vented CO2 and carbon storage."
        enabled={detail.chemicals.enabled}
        onToggle={(v) => setModule("chemicals", { enabled: v })}
        total={moduleTotal("chemicals")}
        totalLabel="Calculated"
        tone="red"
        locked={!canEdit}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Fuel mass (tonnes per GJ)"
            hint="0.0234 t/GJ is a typical liquid fuel"
            step={0.0001}
            value={detail.chemicals.fuelTonnesPerGj}
            onChange={(v) => setModule("chemicals", { fuelTonnesPerGj: v })}
          />
          <Num
            label="Fugitive methane (kg CH4/t fuel)"
            step={0.01}
            value={detail.chemicals.fugitiveCh4KgPerTonne}
            onChange={(v) => setModule("chemicals", { fugitiveCh4KgPerTonne: v })}
          />
          <Num
            label="Fugitive nitrous oxide (kg N2O/t fuel)"
            step={0.001}
            value={detail.chemicals.fugitiveN2oKgPerTonne}
            onChange={(v) => setModule("chemicals", { fugitiveN2oKgPerTonne: v })}
          />
          <Num
            label="Vented or flared CO2 (kg/t fuel)"
            step={1}
            value={detail.chemicals.ventedCo2KgPerTonne}
            onChange={(v) => setModule("chemicals", { ventedCo2KgPerTonne: v })}
          />
          <Num
            label="CO2 captured and stored (kg/t fuel)"
            hint="Enter positive; applied as a credit"
            step={1}
            value={detail.chemicals.capturedCo2KgPerTonne}
            onChange={(v) => setModule("chemicals", { capturedCo2KgPerTonne: v })}
          />
        </div>
        <ItemEditor
          items={detail.chemicals.items}
          onChange={(items) => setModule("chemicals", { items })}
          presets={CHEMICAL_PRESETS}
          doseLabel="Dose (kg per tonne fuel)"
          factorLabel="Emission factor (gCO2e/kg)"
          addLabel="Add chemical input"
        />
      </DetailSection>

      <DetailSection
        title="Co-products and avoided emissions"
        description="Displacement credits for co-products, exported power and avoided methane, plus optional energy allocation."
        enabled={detail.coProducts.enabled}
        onToggle={(v) => setModule("coProducts", { enabled: v })}
        total={moduleTotal("coProducts")}
        totalLabel="Calculated"
        tone="green"
        locked={!canEdit}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Fuel mass (tonnes per GJ)"
            step={0.0001}
            value={detail.coProducts.fuelTonnesPerGj}
            onChange={(v) => setModule("coProducts", { fuelTonnesPerGj: v })}
          />
          <Num
            label="Exported electricity (kWh per MJ fuel)"
            step={0.001}
            value={detail.coProducts.exportedElectricityKwhPerMj}
            onChange={(v) => setModule("coProducts", { exportedElectricityKwhPerMj: v })}
          />
          <Num
            label="Displaced grid factor (g/kWh)"
            step={1}
            value={detail.coProducts.exportedElectricityCreditPerKwh}
            onChange={(v) => setModule("coProducts", { exportedElectricityCreditPerKwh: v })}
          />
          <Num
            label="Avoided methane credit (gCO2e/MJ)"
            hint="Manure, landfill or wastewater methane"
            value={detail.coProducts.avoidedMethaneGPerMj}
            onChange={(v) => setModule("coProducts", { avoidedMethaneGPerMj: v })}
          />
          <Num
            label="Energy allocation to the fuel (%)"
            hint="Below 100% shifts part of the burden to co-products"
            step={1}
            value={detail.coProducts.allocationPct}
            onChange={(v) => setModule("coProducts", { allocationPct: v })}
          />
        </div>
        <ItemEditor
          items={detail.coProducts.items}
          onChange={(items) => setModule("coProducts", { items })}
          presets={COPRODUCT_PRESETS}
          doseLabel="Output (kg per tonne fuel)"
          factorLabel="Avoided emissions (gCO2e/kg)"
          addLabel="Add co-product"
        />
      </DetailSection>

      <DetailSection
        title="Fuel distribution"
        description="Finished fuel movements, terminal storage, blending, dispensing, compression and losses."
        enabled={detail.distribution.enabled}
        onToggle={(v) => setModule("distribution", { enabled: v })}
        total={moduleTotal("distribution")}
        totalLabel="Calculated"
        tone="blue"
        locked={!canEdit}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Fuel mass (tonnes per GJ)"
            step={0.0001}
            value={detail.distribution.fuelTonnesPerGj}
            onChange={(v) => setModule("distribution", { fuelTonnesPerGj: v })}
          />
          <Num
            label="Terminal storage (gCO2e/MJ)"
            value={detail.distribution.storageGPerMj}
            onChange={(v) => setModule("distribution", { storageGPerMj: v })}
          />
          <Num
            label="Blending and additives (gCO2e/MJ)"
            value={detail.distribution.blendingGPerMj}
            onChange={(v) => setModule("distribution", { blendingGPerMj: v })}
          />
          <Num
            label="Retail dispensing (gCO2e/MJ)"
            value={detail.distribution.dispensingGPerMj}
            onChange={(v) => setModule("distribution", { dispensingGPerMj: v })}
          />
          <Num
            label="Compression or liquefaction (gCO2e/MJ)"
            value={detail.distribution.compressionGPerMj}
            onChange={(v) => setModule("distribution", { compressionGPerMj: v })}
          />
          <Num
            label="Distribution losses (% of fuel)"
            step={0.05}
            value={detail.distribution.lossPct}
            onChange={(v) => setModule("distribution", { lossPct: v })}
          />
        </div>
        <LegEditor
          legs={detail.distribution.legs}
          onChange={(legs) => setModule("distribution", { legs })}
          addLabel="Add distribution leg"
        />
      </DetailSection>

      <DetailSection
        title="Tailpipe and end use"
        description="Point-of-use methane and nitrous oxide by end-use mode, fossil carbon share and aftertreatment."
        enabled={detail.tailpipe.enabled}
        onToggle={(v) => setModule("tailpipe", { enabled: v })}
        total={moduleTotal("tailpipe")}
        totalLabel="Calculated"
        tone="red"
        locked={!canEdit}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="End use mode"
            hint={END_USE_MODES.find((m) => m.id === detail.tailpipe.modeId)?.note}
          >
            <select
              className={inputCls}
              value={detail.tailpipe.modeId}
              onChange={(e) => setModule("tailpipe", { modeId: e.target.value as EndUseModeId })}
            >
              {END_USE_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Num
            label="Fossil carbon in the fuel (%)"
            hint="0% for a fully biogenic fuel"
            step={1}
            value={detail.tailpipe.fossilCarbonPct}
            onChange={(v) => setModule("tailpipe", { fossilCarbonPct: v })}
          />
          <Num
            label="Combustion CO2 (gCO2/MJ)"
            step={1}
            value={detail.tailpipe.combustionCo2GPerMj}
            onChange={(v) => setModule("tailpipe", { combustionCo2GPerMj: v })}
          />
          <Num
            label="Methane override (gCO2e/MJ)"
            hint="Leave at -1 to use the mode default"
            step={0.01}
            value={detail.tailpipe.ch4Override}
            onChange={(v) => setModule("tailpipe", { ch4Override: v })}
          />
          <Num
            label="Nitrous oxide override (gCO2e/MJ)"
            hint="Leave at -1 to use the mode default"
            step={0.01}
            value={detail.tailpipe.n2oOverride}
            onChange={(v) => setModule("tailpipe", { n2oOverride: v })}
          />
          <Num
            label="Aftertreatment reagent (gCO2e/MJ)"
            step={0.01}
            value={detail.tailpipe.aftertreatmentGPerMj}
            onChange={(v) => setModule("tailpipe", { aftertreatmentGPerMj: v })}
          />
        </div>
      </DetailSection>
      </>
      )}




      {touched ? (
      <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div
          className="glass-panel card-motion min-w-0 border-t-4 border-l-4 p-5"
          style={{
            borderTopColor: result.ciTotal < 0 ? TONE_COLOR.green : TONE_COLOR.blue,
            borderLeftColor: TONE_COLOR.blue,
          }}
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
          {premium ? (<>
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
          </>) : null}
        </div>

        {premium ? (
        <div
          className="glass-panel min-w-0 border-l-4 p-5"
          style={{ borderLeftColor: TONE_COLOR.blue }}
        >
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2">
            <div className="flex items-start gap-2.5">
              <span
                className="mt-2 inline-block size-2.5 shrink-0 rounded-full"
                style={{ background: TONE_COLOR.blue }}
                aria-hidden="true"
              />
              <h2 className="font-display text-lg font-extrabold text-foreground">
                Contribution by emission source
              </h2>
            </div>
            <span className="label-mono text-muted-foreground">{ciUnit.label}</span>
          </div>
          {(() => {
            const cats = Array.from(new Set(result.lineItems.map((l) => l.category)));
            const cols = cats
              .map((c) => {
                const items = result.lineItems.filter(
                  (l) => l.category === c && Math.abs(l.gPerMj) > 0.0001,
                );
                const pos = items.filter((l) => l.gPerMj > 0);
                const neg = items.filter((l) => l.gPerMj < 0);
                return {
                  category: c,
                  items,
                  pos,
                  neg,
                  posTotal: pos.reduce((s, l) => s + l.gPerMj, 0),
                  negTotal: neg.reduce((s, l) => s + l.gPerMj, 0),
                  total: items.reduce((s, l) => s + l.gPerMj, 0),
                };
              })
              .filter((c) => c.items.length > 0);
            const maxPos = Math.max(...cols.map((c) => c.posTotal), 0);
            const maxNeg = Math.max(...cols.map((c) => -c.negTotal), 0);
            const span = Math.max(maxPos + maxNeg, 0.001);
            const PLOT = 220;
            const hAbove = Math.max((maxPos / span) * PLOT, maxPos > 0 ? 8 : 0);
            const hBelow = Math.max((maxNeg / span) * PLOT, maxNeg > 0 ? 8 : 0);
            const px = (v: number) => (Math.abs(v) / span) * PLOT;
            return (
              <>
                <div className="overflow-x-auto">
                  <div className="flex min-w-full gap-3 sm:gap-4">
                    {cols.map((c) => (
                      <div key={c.category} className="flex min-w-0 flex-1 flex-col items-center">
                        <div
                          className="flex w-full flex-col justify-end"
                          style={{ height: hAbove }}
                        >
                          <div className="mx-auto flex w-full max-w-24 flex-col-reverse overflow-hidden rounded-t-md">
                            {c.pos.map((l, idx) => (
                              <div
                                key={l.key}
                                title={`${l.label}: ${ci(l.gPerMj)} ${ciUnit.label}`}
                                style={{
                                  height: `${px(l.gPerMj)}px`,
                                  background: CATEGORY_TONE[c.category],
                                  opacity: 0.55 + idx * 0.12,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="h-px w-full bg-foreground/40" aria-hidden="true" />
                        <div className="flex w-full flex-col justify-start" style={{ height: hBelow }}>
                          <div className="mx-auto flex w-full max-w-24 flex-col overflow-hidden rounded-b-md">
                            {c.neg.map((l, idx) => (
                              <div
                                key={l.key}
                                title={`${l.label}: ${ci(l.gPerMj)} ${ciUnit.label} (credit)`}
                                style={{
                                  height: `${px(l.gPerMj)}px`,
                                  background: CATEGORY_TONE[c.category],
                                  opacity: 0.3 + idx * 0.1,
                                  backgroundImage:
                                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0 4px, transparent 4px 8px)",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="mt-2 font-mono text-xs font-bold tabular-nums text-foreground">
                          {ci(c.total)}
                        </span>
                        <span className="text-center text-[0.7rem] leading-tight text-muted-foreground">
                          {c.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[0.7rem] text-muted-foreground">
                  Bars above the zero line add emissions; hatched bars below the line are credits
                  (negative values), plotted downward.
                </p>
                <ul className="mt-4 space-y-2 border-t border-border pt-3">
                  {result.lineItems.map((l) => (
                    <li key={l.key} className="flex items-baseline justify-between gap-3">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span
                          className="inline-block size-2 shrink-0 rounded-sm"
                          style={{ background: CATEGORY_TONE[l.category] }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 text-sm font-semibold text-foreground">
                          {l.label}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
                        {ci(l.gPerMj)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </div>
      ) : null}
      </section>
      {premium ? null : <PremiumLocked signedIn={signedIn} />}

      {premium ? (
      <section
        className="glass-panel overflow-x-auto border-l-4 p-5"
        style={{ borderLeftColor: TONE_COLOR.blue }}
      >
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
          <div className="flex items-start gap-2.5">
            <span
              className="mt-2 inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: TONE_COLOR.blue }}
              aria-hidden="true"
            />
            <h2 className="font-display text-lg font-extrabold text-foreground">
              Emissions from all inputs
            </h2>
          </div>
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
      ) : null}

      {premium ? (
      <section
        className="glass-panel overflow-x-auto border-l-4 p-5"
        style={{ borderLeftColor: TONE_COLOR.blue }}
      >
        <div className="mb-3 flex items-start gap-2.5">
          <span
            className="mt-2 inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: TONE_COLOR.blue }}
            aria-hidden="true"
          />
          <h2 className="mb-3 font-display text-lg font-extrabold text-foreground">
            Regulatory program comparison
          </h2>
        </div>
        {(() => {
          const rows = result.programs.filter((p) => p.benchmark != null);
          if (rows.length === 0) return null;
          const PLOT = 220;
          const benchmarkValues = rows.map((p) => p.benchmark as number);
          const rawMin = Math.min(0, result.ciTotal, ...benchmarkValues);
          const rawMax = Math.max(0, result.ciTotal, ...benchmarkValues);
          const rawRange = Math.max(rawMax - rawMin, 0.001);
          const domainMin = rawMin < 0 ? rawMin - rawRange * 0.08 : 0;
          const domainMax = rawMax + rawRange * 0.08;
          const domainRange = Math.max(domainMax - domainMin, 0.001);
          const yForValue = (value: number) => ((domainMax - value) / domainRange) * PLOT;
          const zeroY = yForValue(0);
          const ticks = Array.from(
            { length: 5 },
            (_, index) => domainMax - (domainRange * index) / 4,
          );
          const barPosition = (value: number) => {
            const valueY = yForValue(value);
            return {
              top: Math.min(valueY, zeroY),
              height: Math.max(Math.abs(valueY - zeroY), 2),
            };
          };
          return (
            <div className="overflow-x-auto pb-2">
              <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="size-3 rounded-sm" style={{ background: TONE_COLOR.green }} />
                  Pathway CI
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="size-3 rounded-sm" style={{ background: TONE_COLOR.blue }} />
                  Program benchmark
                </span>
                <span className="font-mono tabular-nums">{ciUnit.label}</span>
              </div>
              <div className="flex min-w-[56rem]">
                <div className="relative w-14 shrink-0" style={{ height: PLOT + 58 }}>
                  {ticks.map((tick) => (
                    <span
                      key={tick}
                      className="absolute right-3 -translate-y-1/2 font-mono text-[0.65rem] tabular-nums text-muted-foreground"
                      style={{ top: yForValue(tick) }}
                    >
                      {ci(tick)}
                    </span>
                  ))}
                </div>
                <div className="relative flex min-w-0 flex-1 items-start border-b border-border" style={{ height: PLOT + 58 }}>
                  {ticks.map((tick) => (
                    <span
                      key={tick}
                      className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                      style={{ top: yForValue(tick) }}
                    />
                  ))}
                  <span
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-foreground/60"
                    style={{ top: zeroY }}
                    aria-hidden="true"
                  />
                  {rows.map((p) => (
                    <div key={p.program.id} className="relative flex h-full min-w-24 flex-1 justify-center gap-1.5 px-2">
                      <div className="relative h-[220px] w-7">
                        <span
                          className="absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-center font-mono text-[0.65rem] font-bold tabular-nums text-foreground"
                          style={{
                            top: Math.max(
                              0,
                              Math.min(PLOT - 14, yForValue(result.ciTotal) + (result.ciTotal < 0 ? 4 : -16)),
                            ),
                          }}
                        >
                          {ci(result.ciTotal)}
                        </span>
                        <div
                          className="absolute w-full rounded-sm"
                          style={{
                            top: barPosition(result.ciTotal).top,
                            height: barPosition(result.ciTotal).height,
                            background: TONE_COLOR.green,
                          }}
                          title={`Pathway CI: ${ci(result.ciTotal)} ${ciUnit.label}`}
                        />
                      </div>
                      <div className="relative h-[220px] w-7">
                        <span
                          className="absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-center font-mono text-[0.65rem] font-bold tabular-nums text-foreground"
                          style={{
                            top: Math.max(
                              0,
                              Math.min(PLOT - 14, yForValue(p.benchmark as number) - 16),
                            ),
                          }}
                        >
                          {ci(p.benchmark as number)}
                        </span>
                        <div
                          className="absolute w-full rounded-sm"
                          style={{
                            top: barPosition(p.benchmark as number).top,
                            height: barPosition(p.benchmark as number).height,
                            background: TONE_COLOR.blue,
                          }}
                          title={`${p.program.label}: ${ci(p.benchmark as number)} ${ciUnit.label}`}
                        />
                      </div>
                      <span className="absolute inset-x-1 top-[228px] text-center text-[0.65rem] leading-tight font-semibold text-foreground">
                        {p.program.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ml-14 mt-2 flex min-w-[52rem]">
                {rows.map((p) => (
                  <div key={p.program.id} className="min-w-24 flex-1 px-2 text-center">
                    <span
                      className="font-mono text-[0.65rem] font-bold tabular-nums"
                      style={{ color: (p.gapPerMj ?? 0) >= 0 ? TONE_COLOR.green : TONE_COLOR.red }}
                    >
                      {(p.gapPerMj ?? 0) >= 0 ? "Below" : "Above"} by {ci(Math.abs(p.gapPerMj ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </section>
      ) : null}

      {premium ? (
      <section
        className="glass-panel border-l-4 p-5"
        style={{ borderLeftColor: TONE_COLOR.green }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className="mt-2 inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: TONE_COLOR.green }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 className="font-display text-lg font-extrabold text-foreground">Export results</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Download the full calculation as an Excel workbook — a Calculation sheet with every
                lifecycle stage section by section, an Emission factors sheet with all background
                factors and sources, and a Keys sheet with definitions.
              </p>
            </div>
          </div>
          <ExportExcelButton build={buildWorkbook} />

        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <h3 className="font-display text-base font-extrabold text-foreground">
              Save to my results dashboard
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep this scenario in your private dashboard and compare its carbon intensity with the
              regulatory benchmarks any time.{" "}
              <Link to="/my-results" className="font-semibold text-foreground underline">
                My results
              </Link>
            </p>
          </div>
          <SaveCiRunButton
            build={() => ({
              pathwayId: result.pathway.id,
              pathwayLabel: result.pathway.label,
              feedstockLabel: feedstock?.label ?? "",
              regionLabel:
                ELECTRICITY_REGIONS.find((r) => r.id === region)?.label ?? String(region),
              ciTotal: result.ciTotal,
              grossCi: result.grossCi,
              creditsCi: result.creditsCi,
              annualEnergyMj: result.annualEnergyMj,
              annualTonnesCo2e: result.annualTonnesCo2e,
              inputs,
              programs: result.programs.map((p) => ({
                id: p.program.id,
                label: p.program.label,
                jurisdiction: p.program.jurisdiction,
                benchmark: p.benchmark,
                savingPct: p.savingPct,
                gapPerMj: p.gapPerMj,
                meetsThreshold: p.meetsThreshold,
              })),
            })}
          />
        </div>
      </section>
      ) : null}
      </>
      ) : (
      <section
        className="glass-panel border-l-4 p-5"
        style={{ borderLeftColor: TONE_COLOR.blue }}
      >
        <div className="flex items-start gap-2.5">
          <span
            className="mt-2 inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: TONE_COLOR.blue }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold text-foreground">
              Carbon intensity
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your values in any field above to calculate the carbon intensity. Grey values
              show the defaults that will be used for anything you leave blank.
            </p>
          </div>
        </div>
      </section>
      )}
    </div>
    </CalcTouchContext.Provider>
  );
}
