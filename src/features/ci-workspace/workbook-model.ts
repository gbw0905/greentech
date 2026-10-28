import { z } from "zod";

const finite = z.number().finite();
const record = z.record(z.string(), z.unknown());
const payloadSchema = z
  .object({
    name: z.string().max(120),
    pathwayId: z.string(),
    pathwayLabel: z.string().max(240),
    ciTotal: finite,
    grossCi: finite,
    creditsCi: finite,
    annualEnergyMj: finite.nonnegative(),
    annualTonnesCo2e: finite,
    lines: z
      .array(
        z
          .object({
            key: z.string(),
            label: z.string(),
            gPerMj: finite,
            activity: finite,
            factor: finite,
            divisor: finite.optional(),
            sign: finite.optional(),
            allocation: finite.optional(),
            activityUnit: z.string().optional(),
            factorUnit: z.string().optional(),
            category: z.string().optional(),
            detail: z.string().optional(),
            scope: z.string().optional(),
            scope1: finite.optional(),
            scope2: finite.optional(),
            scope3: finite.optional(),
            adjustments: finite.optional(),
            unallocated: finite.optional(),
          })
          .passthrough(),
      )
      .min(1)
      .max(500),
    programs: z.array(record).max(50),
    factorTable: z.array(record).max(1000),
    library: z.array(record).max(5000),
  })
  .passthrough();

export type FormulaCell = { formula: string; result: number | string; format?: string };
export type ExportCell = string | number | boolean | null | FormulaCell;
export type ExportRow = {
  key?: string;
  refCol?: number;
  cells: ExportCell[];
  total?: boolean;
  editable?: number[];
};
export type ExportSection = { title: string; headers: string[]; rows: ExportRow[] };
export type ExportSheet = {
  name: string;
  intro: string;
  widths: number[];
  sections: ExportSection[];
};
export type WorkspaceSpec = { title: string; pathwayLabel: string; sheets: ExportSheet[] };

const value = (input: unknown): string | number | boolean | null =>
  typeof input === "number" && !Number.isFinite(input)
    ? null
    : typeof input === "string" || typeof input === "boolean" || typeof input === "number"
      ? input
      : input == null
        ? null
        : JSON.stringify(input);
const row = (cells: ExportCell[], extra: Omit<ExportRow, "cells"> = {}): ExportRow => ({
  cells,
  ...extra,
});
const formula = (formula: string, result: number | string, format?: string): FormulaCell => ({
  formula,
  result,
  ...(format ? { format } : {}),
});
const ref = (key: string) => `{{${key}}}`;
const sum = (keys: string[]) => (keys.length ? `SUM(${keys.map(ref).join(",")})` : "0");
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(b));

export const LIFECYCLE_SECTIONS = [
  "Feedstock production",
  "Land use change",
  "Transportation",
  "Process energy",
  "Chemicals and fugitive emissions",
  "Co-products and avoided emissions",
  "Fuel distribution",
  "Tailpipe and end use",
  "Custom emissions",
];
export function lifecycleSection(item: { key: string; category?: string | undefined }) {
  const key = item.key;
  if (key.startsWith("custom-")) return "Custom emissions";
  if (key === "landUseChange") return "Land use change";
  if (key === "feedstockTransport" || key.startsWith("tr-")) return "Transportation";
  if (item.category === "Process energy") return "Process energy";
  if (/avoided|diverted/.test(key) || key === "coProductCredit" || key.startsWith("cp-"))
    return "Co-products and avoided emissions";
  if (key === "processNonEnergy" || key.startsWith("chem-") || /lcfs-(flaring|fugitives)/.test(key))
    return "Chemicals and fugitive emissions";
  if (key === "distribution" || key.startsWith("dist-") || /lcfs-(pipeline|compression)/.test(key))
    return "Fuel distribution";
  if (key === "endUse" || key.startsWith("tp-") || key === "lcfs-tailpipe")
    return "Tailpipe and end use";
  return "Feedstock production";
}

/** All exported calculation cells reference editable inputs, with numeric caches for previewers. */
export function buildWorkspaceSpec(input: unknown): WorkspaceSpec {
  const data = payloadSchema.parse(input);
  const scenario = (data["scenarioSnapshot"] ?? data) as Record<string, unknown>;
  const dairy = scenario["dairy"] as Record<string, unknown> | undefined;
  const inventory = dairy?.["inventory"] as Record<string, unknown> | undefined;
  const months = Number(inventory?.["reportingMonths"] ?? 12);
  if (dairy && !(months >= 1 && months <= 12)) throw new Error("Invalid farm reporting period.");
  const sourceRows: ExportRow[] = [];
  const flatten = (prefix: string, item: unknown) => {
    if (item != null && typeof item === "object") {
      for (const [key, child] of Object.entries(item)) flatten(`${prefix}.${key}`, child);
    } else
      sourceRows.push(
        row([prefix, value(item), "Scenario source snapshot"], { key: `raw-${prefix}` }),
      );
  };
  if (dairy) flatten("dairy", dairy);
  else {
    flatten("energy", scenario["energy"] ?? data["energy"]);
    flatten("direct", scenario["direct"] ?? data["direct"]);
  }
  // Retain the complete scenario, including custom emissions, overrides and program settings.
  for (const [key, item] of Object.entries(scenario))
    if (!["dairy", "energy", "direct"].includes(key)) flatten(key, item);
  const baselineRows: ExportRow[] = [];
  if (data["baselineSnapshot"]) {
    const start = sourceRows.length;
    flatten("baseline", data["baselineSnapshot"]);
    baselineRows.push(...sourceRows.splice(start));
  }

  const scenarioRows: ExportRow[] = [
    row(["Scenario name", data.name, "", "Calculated scenario"]),
    row(["Fuel pathway", data.pathwayLabel, "", data.pathwayId]),
    row([
      "Electricity region",
      value(scenario["region"] ?? data["region"]),
      "",
      "Applied factors are listed separately",
    ]),
    row(
      [
        "Annual volume",
        value(scenario["annualVolume"] ?? data["annualVolume"]),
        "fuel units",
        dairy
          ? "Farm output is derived from reporting-period dispensable RNG below"
          : "Annual fuel production",
      ],
      { key: "annualVolume", editable: dairy ? [] : [2] },
    ),
    row(
      [
        "Fuel LHV",
        value(scenario["energyDensity"] ?? data["energyDensity"]),
        "MJ/unit",
        "Lower heating value",
      ],
      { key: "lhv", editable: dairy ? [] : [2] },
    ),
    ...(dairy
      ? [
          row(
            [
              "Reporting-period dispensable RNG",
              (data.annualEnergyMj * months) / 12,
              "MJ",
              "Fuel energy after pipeline losses; reporting-period model result",
            ],
            { key: "periodMj", editable: [2] },
          ),
        ]
      : []),
    row(
      [
        "Annual energy",
        formula(
          dairy
            ? `${ref("periodMj")}*12/${ref("raw-dairy.inventory.reportingMonths")}`
            : `${ref("annualVolume")}*${ref("lhv")}`,
          data.annualEnergyMj,
        ),
        "MJ/year",
        dairy ? "Reporting-period energy × 12 ÷ reporting months" : "Annual volume × LHV",
      ],
      { key: "annualMj" },
    ),
    row([
      "Process input basis",
      value(scenario["inputBasis"] ?? data["inputBasis"]),
      "",
      "Line activities below use the basis stated beside each item",
    ]),
    row(
      [
        "Comparison CI",
        value(scenario["comparator"] ?? data["comparator"]),
        "gCO2e/MJ",
        "User-defined comparator",
      ],
      { key: "comparator", editable: [2] },
    ),
  ];
  const rin = data["rinEstimate"] as Record<string, unknown> | null | undefined;
  const program = (scenario["programs"] ?? {}) as Record<string, unknown>;
  const rinInputs: ExportRow[] = rin
    ? [
        row(["RFS compliance year", value(program["year"] ?? 2026), "year", "2026 or 2027"], {
          key: "rfs-year",
          editable: [2],
        }),
        row(
          [
            "RFS eligible quantity",
            value(program["rfsShare"] ?? 0),
            "%",
            "Eligible share of annual fuel quantity",
          ],
          { key: "rfs-share", editable: [2] },
        ),
        row(
          [
            "Registered RFS D-code",
            value(program["dcode"] ?? ""),
            "",
            "Approved pathway D-code; not inferred from CI",
          ],
          { key: "rfs-dcode", editable: [2] },
        ),
        row(
          [
            "RFS equivalence value source",
            value(program["evMode"] ?? "standard"),
            "",
            "standard or custom",
          ],
          { key: "rfs-ev-mode", editable: [2] },
        ),
        row(
          [
            "EPA-approved custom equivalence value",
            value(program["customEV"] ?? 1.7),
            "RIN/gal",
            "Used only when the source is custom",
          ],
          { key: "rfs-custom-ev", editable: [2] },
        ),
        row(["RIN planning price", 1, "USD/RIN", "Companion engine default; user assumption"], {
          key: "rfs-price",
          editable: [2],
        }),
      ]
    : [];
  const rng = data.pathwayId.startsWith("rng-");
  const rd = data.pathwayId.startsWith("rd-");
  const bd = data.pathwayId.startsWith("biodiesel-");
  const standardEv = rd ? `IF(${ref("rfs-year")}=2026,1.7,1.5)` : bd ? "1.5" : "1";
  const rfsChecks = [
    [`AND(${ref("rfs-year")}<>2026,${ref("rfs-year")}<>2027)`, "Choose 2026 or 2027."],
    [
      `OR(${ref("rfs-share")}<0,${ref("rfs-share")}>100)`,
      "RFS eligible share must be between 0 and 100%.",
    ],
    [
      `AND(${ref("rfs-ev-mode")}<>"standard",${ref("rfs-ev-mode")}<>"custom")`,
      "Select an equivalence value source.",
    ],
    [
      `AND(${ref("rfs-ev-mode")}="custom",OR(${ref("rfs-custom-ev")}<=0,${ref("rfs-custom-ev")}>5))`,
      "Approved equivalence value must be greater than 0 and at most 5.",
    ],
    [
      `AND(${rd ? "TRUE" : "FALSE"},${ref("rfs-year")}=2026,${ref("rfs-ev-mode")}="standard",${ref("lhv")}/0.00105505585262<123500)`,
      "The 2026 1.7 factor requires LHV ≥ 123,500 Btu/gal. Enter an EPA-approved alternative equivalence value.",
    ],
    [
      `${ref("rfs-dcode")}=""`,
      "Select the D-code from the registered/approved pathway to calculate RINs.",
    ],
    [
      `AND(${ref("rfs-dcode")}<>"D3",${ref("rfs-dcode")}<>"D4",${ref("rfs-dcode")}<>"D5",${ref("rfs-dcode")}<>"D6",${ref("rfs-dcode")}<>"D7")`,
      "Choose a supported D-code.",
    ],
  ];
  const rfsError = rfsChecks.reduceRight(
    (next, [condition, message]) => `IF(${condition},"${message}",${next})`,
    '""',
  );

  const rinFormulas: Record<string, string> = {
    energyMj: ref("annualMj"),
    gallons: rng ? '""' : ref("annualVolume"),
    ev: rng ? "1" : `IF(${ref("rfs-ev-mode")}="custom",${ref("rfs-custom-ev")},${standardEv})`,
    rinError: rfsError,
    rins: `IF(${ref("rfs-rinError")}<>"","",${rng ? `${ref("annualMj")}/(77000*0.00105505585262)` : `${ref("rfs-gallons")}*${ref("rfs-ev")}`}*${ref("rfs-share")}/100)`,
    rinValue: `IF(ISNUMBER(${ref("rfs-rins")}),${ref("rfs-rins")}*${ref("rfs-price")},"")`,
  };
  if (
    !dairy &&
    !close(
      Number(scenario["annualVolume"] ?? data["annualVolume"]) *
        Number(scenario["energyDensity"] ?? data["energyDensity"]),
      data.annualEnergyMj,
    )
  )
    throw new Error("Annual energy does not reconcile with the scenario inputs.");

  const activities: ExportRow[] = [],
    factors: ExportRow[] = [],
    allocations: ExportRow[] = [];
  const lineKeys: string[] = [],
    contributions: ExportRow[] = [],
    calculationSections: ExportSection[] = [];
  const items = data.lines.map((item, index) => {
    const divisor = item.divisor ?? 1;
    if (!(divisor > 0)) throw new Error(`${item.label}: fuel energy divisor must be positive.`);
    const allocation = item.allocation ?? 1;
    const raw = ((item.activity * item.factor) / divisor) * allocation;
    let sign = item.sign ?? 1;
    // A signed activity/factor already contains its direction; do not apply the sign twice.
    if (!close(raw * sign, item.gPerMj) && close(raw, item.gPerMj)) sign = 1;
    if (!close(raw * sign, item.gPerMj))
      throw new Error(
        `${item.label}: activity, factor and divisor do not reconcile with the calculated CI.`,
      );
    const key = `line-${index}`;
    lineKeys.push(key);
    activities.push(
      row([item.label, item.activity, item.activityUnit ?? "", "Calculation activity"], {
        key: `activity-${index}`,
        editable: [2],
      }),
    );
    activities.push(
      row(
        [
          `${item.label} — divisor`,
          divisor,
          "Normalisation basis",
          "Use 1 for inputs already expressed per MJ fuel",
        ],
        { key: `divisor-${index}`, editable: [2] },
      ),
    );
    allocations.push(
      row(
        [item.label, sign, allocation, "Signed activity/factors already include their direction"],
        { key: `sign-${index}`, editable: [2, 3] },
      ),
    );
    factors.push(
      row(
        [
          item.key,
          item.label,
          item.factor,
          item.factorUnit ?? "",
          `${dairy ? "CARB LCFS Tier 1 / CA-GREET 4.0" : "GBW scenario engine"}${item.detail ? ` · ${item.detail}` : ""}`,
          "Calculation",
        ],
        { key: `factor-${index}`, refCol: 3, editable: [3] },
      ),
    );
    const cells: ExportCell[] = [
      item.label,
      item.detail ?? item.key,
      formula(ref(`activity-${index}`), item.activity),
      item.activityUnit ?? "",
      formula(ref(`factor-${index}`), item.factor),
      item.factorUnit ?? "",
      formula(ref(`divisor-${index}`), divisor),
      formula(`${ref(`sign-${index}`)}*${ref(`sign-${index}:3`)}`, sign * allocation),
      formula("C{r}*E{r}/G{r}*H{r}", item.gPerMj),
      formula(`I{r}*${ref("annualMj")}/1000000`, (item.gPerMj * data.annualEnergyMj) / 1e6),
      item.scope ?? "Unallocated",
      formula("FORMULATEXT(I{r})", ""),
    ];
    return { item, key, index, exportRow: row(cells, { key, refCol: 9 }) };
  });
  const headers = [
    "Item",
    "Basis / detail",
    "Activity",
    "Activity unit",
    "Emission factor",
    "Factor unit",
    "Divisor",
    "Sign × allocation",
    "Value (gCO2e/MJ)",
    "Annual (t CO2e)",
    "Scope classification",
    "Formula used (trace)",
  ];
  const subtotalKeys: string[] = [];
  for (const section of LIFECYCLE_SECTIONS) {
    const entries = items.filter(({ item }) => lifecycleSection(item) === section);
    if (!entries.length) continue;
    const key = `subtotal-${subtotalKeys.length}`;
    subtotalKeys.push(key);
    const result = entries.reduce((total, { item }) => total + item.gPerMj, 0);
    const cells: ExportCell[] = [
      section + " subtotal",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      formula(sum(entries.map((x) => x.key)), result),
      formula(`I{r}*${ref("annualMj")}/1000000`, (result * data.annualEnergyMj) / 1e6),
    ];
    calculationSections.push({
      title: section,
      headers,
      rows: [...entries.map((x) => x.exportRow), row(cells, { key, refCol: 9, total: true })],
    });
    contributions.push(
      row(
        [
          section,
          formula(ref(key), result),
          formula(`ABS(B{r})/${ref("absoluteTotal")}`, 0, "0.0%"),
        ],
        { key: `chart-${key}` },
      ),
    );
  }
  const total = items.reduce((sum, { item }) => sum + item.gPerMj, 0);
  if (!close(total, data.ciTotal))
    throw new Error("Calculation ledger does not reconcile with net CI.");
  const gross = items.reduce((sum, { item }) => sum + Math.max(item.gPerMj, 0), 0);
  const credits = items.reduce((sum, { item }) => sum + Math.min(item.gPerMj, 0), 0);
  if (
    !close(gross, data.grossCi) ||
    !close(credits, data.creditsCi) ||
    !close((total * data.annualEnergyMj) / 1e6, data.annualTonnesCo2e)
  )
    throw new Error("Export summary does not reconcile with the scenario result.");
  const output = (label: string, expression: string, result: number, key: string) =>
    row(
      [
        label,
        formula(expression, result),
        "gCO2e/MJ",
        formula(`B{r}*${ref("annualMj")}/1000000`, (result * data.annualEnergyMj) / 1e6),
      ],
      { key, total: true },
    );
  const results = [
    output(
      "Gross emissions",
      lineKeys.map((key) => `MAX(${ref(key)},0)`).join("+"),
      gross,
      "grossCi",
    ),
    output(
      "Credits applied (signed)",
      lineKeys.map((key) => `MIN(${ref(key)},0)`).join("+"),
      credits,
      "creditsCi",
    ),
    output("Total carbon intensity", sum(subtotalKeys), total, "ciTotal"),
    row(["Annual fuel energy", formula(ref("annualMj"), data.annualEnergyMj), "MJ/year", null]),
  ];
  const scopeNames = ["scope1", "scope2", "scope3", "adjustments", "unallocated"] as const;
  const scopeLabels = [
    "Scope 1 — direct",
    "Scope 2 — purchased energy",
    "Scope 3 — value chain",
    "Signed lifecycle adjustments (separate)",
    "Unallocated",
  ];
  const scopeRows = scopeNames.map((scope, s) => {
    const terms: string[] = [];
    let result = 0;
    for (const { item, key, index } of items) {
      const part =
        item[scope] ??
        (scope === "unallocated" && !scopeNames.some((name) => item[name] !== undefined)
          ? item.gPerMj
          : 0);
      result += part;
      const weight = item.gPerMj ? part / item.gPerMj : scope === "unallocated" ? 1 : 0;
      allocations[index]!.cells.push(weight);
      terms.push(`${ref(key)}*${ref(`sign-${index}:${5 + s}`)}`);
    }
    return row(
      [
        scopeLabels[s]!,
        formula(terms.join("+"), result),
        formula(`B{r}*${ref("annualMj")}/1000000`, (result * data.annualEnergyMj) / 1e6),
        s < 3 ? formula(`${ref("grossCi")}=0`, 0) : null,
      ],
      { key: `scope-${scope}` },
    );
  });
  // Scope weights preserve mixed farm energy allocations and keep negative adjustments separate.
  scopeRows.forEach((r, i) => {
    const result = Number((r.cells[1] as FormulaCell).result);
    r.cells[3] =
      i < 3
        ? formula(
            `IF(${ref("grossCi")}=0,0,MAX(B{r},0)/${ref("grossCi")})`,
            gross ? Math.max(result, 0) / gross : 0,
            "0.0%",
          )
        : null;
  });
  const absolute = items.reduce((sum, { item }) => sum + Math.abs(item.gPerMj), 0);
  for (const r of contributions) {
    const amount = Number((r.cells[1] as FormulaCell).result);
    r.cells[2] = formula(
      `IF(${ref("absoluteTotal")}=0,0,ABS(B{r})/${ref("absoluteTotal")})`,
      absolute ? Math.abs(amount) / absolute : 0,
      "0.0%",
    );
  }
  const programCodes = ["ca", "or", "wa", "cfr", "red", "corsia", "fueleu", "reno"];
  const programSettings = ((scenario["programs"] as Record<string, unknown> | undefined)?.[
    "rows"
  ] ?? {}) as Record<string, { ci?: number | null }>;
  const approvedCi = (p: Record<string, unknown>, i: number) => {
    const explicit = programSettings[programCodes[i] ?? ""]?.ci;
    return typeof explicit === "number"
      ? explicit
      : typeof p["ci"] === "number" && p["ci"] !== data.ciTotal
        ? p["ci"]
        : "";
  };
  const comparisonRows = data.programs.map((p, i) => {
    const supported =
      p["supported"] === true && !(data["programErrors"] as unknown[] | undefined)?.length;
    const ci = typeof p["ci"] === "number" ? p["ci"] : data.ciTotal;
    const energy = typeof p["energy"] === "number" ? p["energy"] : 0;
    const benchmark = typeof p["benchmark"] === "number" ? p["benchmark"] : null;
    return row(
      [
        value(p["name"]),
        benchmark,
        formula(
          `IF(${ref(`program-ci-override-${i}`)}="",${ref("ciTotal")},${ref(`program-ci-override-${i}`)})`,
          ci,
        ),
        formula(`${ref("annualMj")}*${ref(`program-energy-share-${i}`)}`, energy),
        supported && benchmark !== null
          ? formula(`(B{r}-C{r})*D{r}/1000000`, Number(p["credits"]))
          : "Unsupported / invalid",
        value(p["url"]),
      ],
      { editable: [2] },
    );
  });
  const programInputs = data.programs.flatMap((p, i) => [
    row(
      [
        `${String(p["name"])} — approved CI override`,
        approvedCi(p, i),
        "gCO2e/MJ",
        "Blank uses scenario CI; a numeric override stays fixed when the scenario changes",
      ],
      { key: `program-ci-override-${i}`, editable: [2] },
    ),
    row(
      [
        `${String(p["name"])} — eligible energy share`,
        data.annualEnergyMj ? Number(p["energy"] ?? 0) / data.annualEnergyMj : 0,
        "fraction",
        "Applied to annual fuel energy",
      ],
      { key: `program-energy-share-${i}`, editable: [2] },
    ),
  ]);
  const coProducts = items.filter(
    ({ item }) => item.key === "coProductCredit" || item.key.startsWith("cp-"),
  );
  const coProductTotal = coProducts.reduce((total, { item }) => total + item.gPerMj, 0);
  const warnings = [
    ...(Array.isArray(data["warnings"]) ? data["warnings"] : []),
    ...(Array.isArray(data["programErrors"]) ? data["programErrors"] : []),
  ];
  const applied = data.factorTable.map((f) =>
    row([
      value(f["key"]),
      value(f["label"]),
      value(f["value"]),
      value(f["unit"]),
      value(f["source"]),
    ]),
  );
  const groups = new Map<string, ExportRow[]>();
  for (const entry of data.library) {
    const group = String(entry["group"] ?? "Reference factors");
    groups.set(group, [
      ...(groups.get(group) ?? []),
      row([
        value(entry["item"]),
        value(entry["detail"]),
        value(entry["value"]),
        value(entry["unit"]),
        value(entry["source"]),
      ]),
    ]);
  }
  return {
    title: data.name || "Carbon intensity calculation",
    pathwayLabel: data.pathwayLabel,
    sheets: [
      {
        name: "Calculation",
        intro:
          "Live formulas link activity and divisors to Inputs, and emission factors to Emission factors. Edit amber cells to recalculate.",
        widths: [38, 48, 20, 24, 22, 24, 22, 18, 23, 25, 28, 48],
        sections: [
          {
            title: "Results",
            headers: ["Result", "Value", "Unit", "Annual (tonnes CO2e)"],
            rows: results,
          },
          ...calculationSections,
          {
            title: "Indicative scope allocation",
            headers: [
              "Classification",
              "gCO2e/MJ",
              "Annual (tonnes CO2e)",
              "Share of gross emissions",
            ],
            rows: scopeRows,
          },
          {
            title: "Lifecycle contribution by emission source",
            headers: ["Lifecycle section", "gCO2e/MJ", "Share of absolute line contributions"],
            rows: [
              ...contributions,
              row(
                [
                  "Absolute line contributions",
                  formula(lineKeys.map((k) => `ABS(${ref(k)})`).join("+"), absolute),
                  "gCO2e/MJ",
                ],
                { key: "absoluteTotal" },
              ),
            ],
          },
          {
            title: "Regulatory program comparison",
            headers: [
              "Program",
              "Benchmark (gCO2e/MJ)",
              "CI used",
              "Eligible energy (MJ)",
              "Conditional credits / deficits (tonnes CO2e)",
              "Source",
            ],
            rows: comparisonRows,
          },
          ...(!dairy
            ? [
                {
                  title: "Co-product credit method",
                  headers: ["Item", "Value", "Unit", "Note"],
                  rows: [
                    row([
                      "Method",
                      "Single aggregate lifecycle credit",
                      "",
                      "The current scenario supplies one combined value; no itemised co-product quantity is inferred",
                    ]),
                    row([
                      "CI before co-product credits",
                      formula(
                        `${ref("ciTotal")}-(${sum(coProducts.map((x) => x.key))})`,
                        total - coProductTotal,
                      ),
                      "gCO2e/MJ",
                      "All other lifecycle contributions",
                    ]),
                    row([
                      "Co-product credits",
                      formula(sum(coProducts.map((x) => x.key)), coProductTotal),
                      "gCO2e/MJ",
                      "Signed credit applied once",
                    ]),
                    row([
                      "Net CI",
                      formula(ref("ciTotal"), total),
                      "gCO2e/MJ",
                      "CI before co-product credits plus signed co-product credit",
                    ]),
                    row([
                      "Method note",
                      "Do not count the same co-product through both allocation and displacement",
                      "",
                      "",
                    ]),
                  ],
                },
              ]
            : []),
          ...(data["baseline"]
            ? [
                {
                  title: "Saved baseline",
                  headers: ["Metric", "Value", "Unit"],
                  rows: [
                    row([
                      "Baseline name",
                      value((data["baseline"] as Record<string, unknown>)["name"]),
                      "",
                    ]),
                    row(
                      [
                        "Baseline CI",
                        value((data["baseline"] as Record<string, unknown>)["ci"]),
                        "gCO2e/MJ",
                      ],
                      { key: "baselineCi", editable: [2] },
                    ),
                    row([
                      "CI difference",
                      formula(
                        `${ref("ciTotal")}-${ref("baselineCi")}`,
                        data.ciTotal - Number((data["baseline"] as Record<string, unknown>)["ci"]),
                      ),
                      "gCO2e/MJ",
                    ]),
                  ],
                },
              ]
            : []),
          ...(warnings.length
            ? [
                {
                  title: "Inventory and program warnings",
                  headers: ["Review item"],
                  rows: warnings.map((w) => row([String(w)])),
                },
              ]
            : []),
          ...(data["rinEstimate"]
            ? [
                {
                  title: "RFS estimate",
                  headers: ["Metric", "Value"],
                  rows: Object.entries(rin!).map(([key, item]) =>
                    row(
                      [
                        key,
                        rinFormulas[key]
                          ? formula(
                              rinFormulas[key],
                              typeof item === "number" || typeof item === "string" ? item : "",
                            )
                          : value(item),
                      ],
                      { key: `rfs-${key}` },
                    ),
                  ),
                },
              ]
            : []),
        ],
      },
      {
        name: "Inputs",
        intro:
          "Amber cells feed the calculation. Farm/process source snapshots preserve the original model inputs for review and a website rerun.",
        widths: [52, 25, 30, 65, 18, 18, 18, 20, 18],
        sections: [
          { title: "Scenario", headers: ["Input", "Value", "Unit", "Note"], rows: scenarioRows },
          {
            title: "Line-item activity data",
            headers: ["Item", "Value (editable)", "Unit", "Used in"],
            rows: activities,
          },
          {
            title: "Signs, allocation and scope shares",
            headers: [
              "Item",
              "Sign",
              "Allocation",
              "Note",
              "Scope 1 share",
              "Scope 2 share",
              "Scope 3 share",
              "Adjustment share",
              "Unallocated share",
            ],
            rows: allocations,
          },
          {
            title: dairy
              ? "CARB LCFS Tier 1 — dairy farm inventory and scenario snapshot"
              : "Process energy, direct lifecycle inputs and scenario snapshot",
            headers: ["Input", "Value", "Basis"],
            rows: sourceRows.map((r) =>
              r.key === "raw-dairy.inventory.reportingMonths" ? { ...r, editable: [2] } : r,
            ),
          },
          {
            title: "Program assumptions",
            headers: ["Input", "Value", "Unit", "Note"],
            rows: [...programInputs, ...rinInputs],
          },
          ...(baselineRows.length
            ? [
                {
                  title: "Saved baseline inputs",
                  headers: ["Input", "Value", "Basis"],
                  rows: baselineRows,
                },
              ]
            : []),
        ],
      },
      {
        name: "Emission factors",
        intro:
          "The first table feeds Calculation directly. Applied and reference factors retain their units, sources and full precision.",
        widths: [38, 44, 24, 28, 68, 25],
        sections: [
          {
            title: "Factors linked to the Calculation sheet",
            headers: ["Key", "Item", "Factor (editable)", "Unit", "Source", "Used in"],
            rows: factors,
          },
          {
            title: dairy
              ? "CARB LCFS Tier 1 emission factors (CA-GREET 4.0)"
              : "Applied emission factors",
            headers: ["Key", "Factor", "Value", "Unit", "Source"],
            rows: applied,
          },
          {
            title: "Line-item factors (reference)",
            headers: ["Key", "Item", "Factor applied at export", "Unit", "Basis"],
            rows: data.lines.map((x) =>
              row([x.key, x.label, x.factor, x.factorUnit ?? "", x.detail ?? "Engine ledger"]),
            ),
          },
        ],
      },
      {
        name: "Global factor library",
        intro:
          "Complete engine reference library: grid regions, fuels, materials, GWPs, feedstock defaults and program benchmarks.",
        widths: [44, 60, 24, 30, 68],
        sections: [...groups].map(([title, rows]) => ({
          title,
          headers: ["Item", "Detail", "Value", "Unit", "Source"],
          rows,
        })),
      },
      {
        name: "Keys",
        intro:
          "Workbook navigation, calculation definitions, model boundaries and source references.",
        widths: [38, 105],
        sections: [
          {
            title: "Sheets in this workbook",
            headers: ["Sheet", "Contents"],
            rows: [
              row([
                "Calculation",
                "Lifecycle sections, results, annual emissions, scope allocation, program comparisons and live formula traces",
              ]),
              row([
                "Inputs",
                "Scenario settings, editable line activities/divisors/signs/allocation, complete farm/process snapshots and baseline",
              ]),
              row([
                "Emission factors",
                "Editable factors linked to each line, applied factors and reference factors with sources",
              ]),
              row(["Global factor library", "All engine reference factors without truncation"]),
              row(["Keys", "Definitions, limitations and references"]),
            ],
          },
          {
            title: "Units and terms",
            headers: ["Term", "Meaning"],
            rows: [
              row(["CI", "Lifecycle carbon intensity of finished fuel, gCO2e/MJ on an LHV basis"]),
              row(["Activity", "Quantity behind the line item, using the unit shown"]),
              row(["Emission factor", "Emissions per unit of activity"]),
              row([
                "Divisor",
                "Normalises the item to finished-fuel MJ. Already-normalised rows use 1",
              ]),
              row([
                "Sign × allocation",
                "Applied once. A negative activity or factor already carries its direction",
              ]),
              row(["Annual", "CI × annual fuel energy ÷ 1,000,000, in tonnes CO2e"]),
              row([
                "Scope 1 / 2 / 3",
                "Indicative direct / purchased energy / value-chain allocations; mixed farm energy is split, with signed adjustments separate",
              ]),
              row([
                "Conditional credits",
                "Screening estimates only; confirm eligibility, delivery allocation and approved pathway CI",
              ]),
              row(["RINs", "No RIN eligibility or D-code is inferred from a CI score"]),
              row(["MJ", "Megajoule. Fuel energy uses a lower heating value basis"]),
              row([
                "Formula trace",
                "Calculation column L shows the live formula used by column I",
              ]),
              row([
                "Calculation equation",
                "Contribution = activity × emission factor ÷ divisor × sign × allocation",
              ]),
              row([
                "Editing the workbook",
                "Amber line inputs and factors recalculate linked cells. Full farm/process inventories are source snapshots: rerun the website when changing those raw model assumptions",
              ]),
              row(["Model version", value(data["modelVersion"])]),
            ],
          },
          {
            title: "Lifecycle sections",
            headers: ["Section", "Covers"],
            rows: LIFECYCLE_SECTIONS.map((s) =>
              row([s, "Lifecycle contribution from the active scenario ledger"]),
            ),
          },
          {
            title: "References and limitations",
            headers: ["Source", "Reference"],
            rows: [
              row(["Argonne GREET", "https://www.energy.gov/cmei/greet"]),
              row([
                "CARB",
                "LCFS Tier 1 Dairy and Swine Manure Biomethane workbook (2025) and CA-GREET 4.0",
              ]),
              ...data.programs.map((p) => row([value(p["name"]), value(p["url"])])),
              row([
                "Model boundary",
                "Indicative screening results, not a certified fuel pathway score. Preset values require project-specific verification.",
              ]),
            ],
          },
        ],
      },
    ],
  };
}

/** Resolve all references in two passes so sheet order and branding never shift formulas. */
export function layoutWorkspaceSpec(spec: WorkspaceSpec) {
  const refs = new Map<string, string>();
  const sheets = spec.sheets.map((sheet) => {
    let next = 8;
    const sections = sheet.sections.map((section) => {
      const titleRow = next++,
        headerRow = next++;
      const rows = section.rows.map((source) => {
        const number = next++;
        if (source.key) {
          source.cells.forEach((_, index) =>
            refs.set(
              `${source.key}:${index + 1}`,
              `'${sheet.name}'!${columnLetter(index + 1)}${number}`,
            ),
          );
          refs.set(source.key, `'${sheet.name}'!${columnLetter(source.refCol ?? 2)}${number}`);
        }
        return { ...source, number };
      });
      next++;
      return { ...section, titleRow, headerRow, rows };
    });
    return { ...sheet, sections, rowCount: next - 1 };
  });
  for (const sheet of sheets)
    for (const section of sheet.sections)
      for (const row of section.rows)
        row.cells = row.cells.map((cell) => {
          if (!cell || typeof cell !== "object") return cell;
          const resolved = cell.formula
            .replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
              const address = refs.get(key);
              if (!address) throw new Error(`Missing Excel reference: ${key}`);
              return address;
            })
            .replaceAll("{r}", String(row.number));
          return {
            ...cell,
            formula: resolved,
            result: resolved.startsWith("FORMULATEXT")
              ? `=C${row.number}*E${row.number}/G${row.number}*H${row.number}`
              : cell.result,
          };
        });
  return { ...spec, sheets, refs };
}
export function columnLetter(number: number): string {
  let letter = "";
  for (; number > 0; number = Math.floor((number - 1) / 26))
    letter = String.fromCharCode(65 + ((number - 1) % 26)) + letter;
  return letter;
}
