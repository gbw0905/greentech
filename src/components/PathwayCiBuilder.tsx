import { useMemo, useState } from "react";
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
import { ExportExcelButton } from "@/components/ExportExcelButton";
import type { SheetSection, WorkbookExport } from "@/lib/excel-workbook";



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
      <input
        type="number"
        step={step}
        className={inputCls}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
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
}: {
  title: string;
  description: string;
  total: string;
  totalLabel: string;
  children: React.ReactNode;
  tone?: SectionTone;
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
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
          >
            {open ? "Hide" : "Edit"}
            <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {open ? <div className="mt-4 space-y-4">{children}</div> : null}
    </section>
  );
}



function DetailSection({
  title,
  description,
  enabled,
  onToggle,
  total,
  totalLabel,
  children,
  tone = "blue",
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  total: string;
  totalLabel: string;
  children: React.ReactNode;
  tone?: SectionTone;
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
        </div>
      </div>
      {open ? <div className="mt-4 space-y-4">{children}</div> : null}
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
  const setEnergy = (k: SourceId, v: number) =>
    setInputs((p) => ({ ...p, energy: { ...p.energy, [k]: v } }));
  const setVariant = (k: SourceId, v: string) =>
    setInputs((p) => ({ ...p, sourceVariants: { ...p.sourceVariants, [k]: v } }));

  const detail: DetailModules = inputs.detail ?? defaultDetailModules();
  const setModule = <K extends DetailModuleKey>(key: K, patch: Partial<DetailModules[K]>) =>
    setInputs((p) => {
      const base = p.detail ?? defaultDetailModules();
      return { ...p, detail: { ...base, [key]: { ...base[key], ...patch } } };
    });
  const moduleTotal = (key: DetailModuleKey) => `${ci(result.moduleTotals[key] ?? 0)} ${ciUnit.label}`;

  const groups = Array.from(new Set(PATHWAYS.map((p) => p.group)));
  const feedstock = FEEDSTOCK_BY_ID[inputs.feedstockId];

  const annualTonnes = result.annualTonnesCo2e * massUnit.factor;

  const buildWorkbook = (): WorkbookExport => {
    const annual = (g: number) => ((g * result.annualEnergyMj) / 1_000_000) * massUnit.factor;
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
        ["Annual energy (MJ)", Number(result.annualEnergyMj.toFixed(0)), ""],
        ["Carbon intensity unit", ciUnit.label, ""],
        ["Annual footprint unit", massUnit.label, ""],
      ],
    });

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

    const lineHeader = [
      "Item",
      "Basis / detail",
      `Value (${ciUnit.label})`,
      "Unit",
      `Annual (${massUnit.label})`,
    ];
    for (const section of EXPORT_SECTIONS) {
      const items = result.lineItems.filter((item) => exportSectionFor(item) === section);
      if (!items.length) continue;
      const rows: (string | number)[][] = items.map((l) => [
        l.label,
        l.detail ?? "",
        Number(ci(l.gPerMj)),
        ciUnit.label,
        Number(annual(l.gPerMj).toFixed(2)),
      ]);
      const subtotal = items.reduce((a, l) => a + l.gPerMj, 0);
      rows.push([
        `${section} subtotal`,
        "",
        Number(ci(subtotal)),
        ciUnit.label,
        Number(annual(subtotal).toFixed(2)),
      ]);
      calcSections.push({ title: section, header: lineHeader, rows });
    }

    calcSections.push({
      title: "Results",
      header: ["Result", "", `Value (${ciUnit.label})`, "Unit", `Annual (${massUnit.label})`],
      rows: [
        ["Gross emissions", "", Number(ci(result.grossCi)), ciUnit.label, Number(annual(result.grossCi).toFixed(2))],
        ["Credits applied", "", Number(ci(result.creditsCi)), ciUnit.label, Number(annual(result.creditsCi).toFixed(2))],
        ["Total carbon intensity", "", Number(ci(result.ciTotal)), ciUnit.label, Number(annualTonnes.toFixed(2))],
      ],
    });

    calcSections.push({
      title: "Regulatory program comparison",
      header: ["Program", "Jurisdiction", "Benchmark", "Saving vs benchmark", "Annual credits (t)"],
      rows: result.programs.map((p) => [
        p.program.label,
        p.program.jurisdiction,
        p.benchmark == null ? "Fuel not covered" : `${ci(p.benchmark)} ${ciUnit.label}`,
        p.savingPct == null ? "—" : `${p.savingPct.toFixed(1)}%`,
        p.annualCreditsTonnes == null || !p.program.creditMarket
          ? "—"
          : Number(p.annualCreditsTonnes.toFixed(0)),
      ]),
    });

    const factors = backgroundFactors();
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
          [ciUnit.label, "Carbon intensity unit selected for this export."],
          [massUnit.label, "Annual footprint mass unit selected for this export."],
          ["MJ", "Megajoule of finished fuel energy (lower heating value basis)."],
          ["gCO2e", "Grams of carbon dioxide equivalent using 100-year global warming potentials."],
          ["Gross emissions", "Sum of all positive lifecycle emission line items before credits."],
          ["Credits applied", "Co-product and avoided-emission credits subtracted from gross emissions."],
          ["Benchmark", "The regulatory program's comparison carbon intensity for this fuel type."],
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
          columnWidths: [42, 46, 18, 16, 20],
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
          <button
            type="button"
            onClick={() => setInputs(scenarioFromPathway(inputs.pathwayId, region))}
            className="label-mono inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 font-bold text-foreground hover:border-accent"
          >
            <RotateCcw className="size-3.5" />
            Reset pathway defaults
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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


      <DetailSection

        title="Feedstock production"
        description="Cultivation, fertiliser and field N2O, collection, rendering and drying, per tonne of feedstock."
        enabled={detail.feedstockProduction.enabled}
        onToggle={(v) => setModule("feedstockProduction", { enabled: v })}
        total={moduleTotal("feedstockProduction")}
        totalLabel="Calculated"
        tone="green"
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
                    <input
                      type="number"
                      min={0}
                      step={0.001}
                      className={inputCls}
                      value={Number(shown.toFixed(6))}
                      onChange={(e) => setEnergy(s.id, (Number(e.target.value) || 0) * unit.toBase)}
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
                const total = items.reduce((s, l) => s + l.gPerMj, 0);
                return { category: c, items, total };
              })
              .filter((c) => c.items.length > 0);
            const scale = Math.max(...cols.map((c) => Math.abs(c.total)), 0.001);
            return (
              <>
                <div className="overflow-x-auto">
                  <div className="flex min-w-full items-end gap-3 sm:gap-4" style={{ height: 260 }}>
                    {cols.map((c) => {
                      const negative = c.total < 0;
                      return (
                        <div key={c.category} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
                            {ci(c.total)}
                          </span>
                          <div
                            className="flex w-full max-w-24 flex-col-reverse overflow-hidden rounded-t-md transition-all duration-500"
                            style={{
                              height: `${(Math.abs(c.total) / scale) * 190}px`,
                              minHeight: 4,
                            }}
                          >
                            {c.items.map((l, idx) => (
                              <div
                                key={l.key}
                                title={`${l.label}: ${ci(l.gPerMj)} ${ciUnit.label}`}
                                style={{
                                  flexGrow: Math.abs(l.gPerMj) || 0.0001,
                                  background: CATEGORY_TONE[c.category],
                                  opacity: negative ? 0.4 + idx * 0.12 : 0.55 + idx * 0.15,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-center text-[0.7rem] leading-tight text-muted-foreground">
                            {c.category}
                            {negative ? " (credit)" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
      </section>

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
      </section>
    </div>
  );
}
