import { buildWorkspacePayload } from "./workspace-export.mjs";
import { readDraft, attachAutosave } from "./browser-draft.mjs";
import { activityToCi, changedInputs } from "./workspace-activity.mjs";
import {
  __modules,
  CI,
  PROGRAM,
  DAIRY,
  PRESETS,
  DIRECT_FIELDS,
  SOURCES,
  ELECTRICITY_REGIONS,
  newScenario,
  assess,
  customRows,
  customG,
  G_PER,
  scopeOf,
  scopeLabel,
  scopeContributions,
  changeBasis,
  exportRows,
  MODEL_VERSION,
} from "./workspace-engine.mjs";
const $ = (id) => document.getElementById(id);
let proAccess = false;
function requestUpgrade() {
  if (window.parent !== window)
    window.parent.postMessage({ type: "civanta-upgrade-request" }, location.origin);
  else location.assign("/auth?next=%2Fpricing");
}
window.addEventListener("message", (event) => {
  if (
    event.origin !== location.origin ||
    event.source !== window.parent ||
    event.data?.type !== "civanta-plan-state"
  )
    return;
  proAccess = event.data.premium === true;
  document.body.dataset.plan = proAccess ? "pro" : "free";
  $("export").textContent = proAccess ? "Download Excel" : "Pro · Download Excel";
  if (ran && !dirty) resultsNow();
});
if (window.parent !== window)
  window.parent.postMessage({ type: "civanta-access-request" }, location.origin);
document.getElementById("workspace-pro-cta")?.addEventListener("click", requestUpgrade);
const esc = (x) =>
  String(x ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const fmt = (n, d = 3) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
// Start with an empty numeric inventory; defaults are an explicit user action.
function blankScenario(pathwayId = "rng-dairy", region = "usAverage") {
  const clear = (value) =>
    typeof value === "number"
      ? NaN
      : Array.isArray(value)
        ? value.map(clear)
        : value && typeof value === "object"
          ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clear(item)]))
          : value;
  const defaults = newScenario(pathwayId, region);
  const scenario = clear(defaults);
  scenario.name = "";
  const shownSources = new Set(["electricity", "renewableElectricity", "naturalGas", "hydrogenSmr"]);
  // Hidden, unused fuels are optional. They must not create errors after Clear inputs.
  scenario.energy = Object.fromEntries(
    SOURCES.map((source) => [source.id, shownSources.has(source.id) ? NaN : 0]),
  );
  scenario.factors = Object.fromEntries(
    SOURCES.map((source) => [
      source.id,
      shownSources.has(source.id) ? NaN : defaults.factors[source.id],
    ]),
  );
  // The annual-temperature setting hides monthly entries, but the model still
  // expects a finite twelve-month series. Keep those hidden defaults valid.
  if (scenario.dairy?.inventory && !scenario.dairy.useMonthlyTemperature)
    scenario.dairy.inventory.monthlyTemperatureC = [
      ...defaults.dairy.inventory.monthlyTemperatureC,
    ];
  scenario.entryMode = "direct";
  scenario.activityData = {};
  scenario.directEntry = {
    feedstock: scenario.direct.feedstock,
    feedstockTransport: scenario.direct.feedstockTransport,
  };
  return scenario;
}
let state = blankScenario(),
  baseline = null,
  energyExpanded = true,
  optionalEnergyExpanded = false;
let activeProgramId = "ca";
let currentLifecycle = null;
function prepareInputModes() {
  state.entryMode ??= "direct";
  state.activityData ??= {};
  state.evidence ??= {};
  state.directEntry ??= {};
  state.directEntry.feedstock ??= state.direct?.feedstock;
  state.directEntry.feedstockTransport ??= state.direct?.feedstockTransport;
}
function runName() {
  return state.name || "Untitled CI scenario";
}
const EVIDENCE_GROUPS = [
  ["feedstock", "Feedstock"],
  ["transport", "Feedstock transport"],
  ["electricity", "Electricity"],
  ["lhv", "Fuel LHV"],
];
function evidenceMarkup() {
  return `<section class="panel evidence-panel"><div class="section-title"><span class="step">EV</span><h2>Assumptions & evidence</h2></div><p class="note">Record the source of important inputs before using a result in a decision. Blank fields mean the assumption is not documented.</p><div class="evidence-grid">${EVIDENCE_GROUPS.map(
    ([key, label]) => {
      const record = state.evidence[key] || {};
      return `<fieldset><legend>${label}</legend><div class="grid"><label class="field">Status<select id="evidence_${key}_status"><option value="example" ${record.status !== "measured" && record.status !== "published" ? "selected" : ""}>Example / user estimate</option><option value="measured" ${record.status === "measured" ? "selected" : ""}>Measured</option><option value="published" ${record.status === "published" ? "selected" : ""}>Published factor</option></select></label><label class="field">Source<input id="evidence_${key}_source" type="text" maxlength="160" value="${esc(record.source || "")}" placeholder="Document, supplier or study"></label><label class="field">Date<input id="evidence_${key}_date" type="date" value="${esc(record.date || "")}"></label><label class="field">Geography<input id="evidence_${key}_geography" type="text" maxlength="100" value="${esc(record.geography || "")}" placeholder="Country, region or facility"></label></div></fieldset>`;
    },
  ).join("")}</div></section>`;
}
function updateActivityCi() {
  if (state.entryMode !== "activity") return;
  const value = activityToCi(state.activityData, state.annualVolume * state.energyDensity);
  state.direct.feedstock = value.errors.length ? NaN : value.feedstock;
  state.direct.feedstockTransport = value.errors.length ? NaN : value.transport;
}
const numberField = (id, label, value, help = "", min = "") =>
  `<label class="field">${label}<input type="number" id="${id}" step="any" ${min !== "" ? `min="${min}"` : ""} value="${Number.isFinite(value) ? value : ""}"><small>${help}</small></label>`;
const pathwaySelect = () => {
  const g = {};
  for (const p of [{ id: "rng-dairy", group: "Renewable gas" }, ...PRESETS]) {
    const k = p.id === "rng-dairy" ? "Renewable gas" : p.group || "Other";
    (g[k] ??= []).push(p);
  }
  return `<label class="field">Fuel pathway<select id="pathwayId">${Object.entries(g)
    .map(
      ([k, a]) =>
        `<optgroup label="${esc(k)}">${a.map((p) => `<option value="${esc(p.id)}" ${p.id === state.pathwayId ? "selected" : ""}>${esc(p.id === "rng-dairy" ? "Dairy RNG — farm calculator" : p.label)}</option>`).join("")}</optgroup>`,
    )
    .join("")}</select><small>Switching pathways loads that fuel’s illustrative example inputs. Review them before running.</small></label>`;
};
const select = (id, label, items, value, help = "") =>
  `<label class="field">${label}<select id="${id}">${items.map(([v, t]) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(t)}</option>`).join("")}</select><small>${help}</small></label>`;

const MJ_PER = { MJ: 1, GJ: 1000, MMBtu: 1055.05585262, kWh: 3.6, therm: 105.505585262 };
const UNIT_DEFS = {
  kWh: ["energy", 3.6],
  MJ: ["energy", 1],
  GJ: ["energy", 1000],
  MMBtu: ["energy", 1055.05585262],
  therm: ["energy", 105.505585262],
  gal: ["volume", 3.785411784],
  L: ["volume", 1],
  kg: ["mass", 1],
  tonne: ["mass", 1000],
  km: ["distance", 1],
  mile: ["distance", 1.609344],
  unit: ["other", 1],
};

const CI_UNITS = {
  "g/MJ": ["gCO₂e/MJ", 1],
  "g/GJ": ["gCO₂e/GJ", 1000],
  "g/MMBtu": ["gCO₂e/MMBtu", 1055.05585262],
  "kg/MMBtu": ["kgCO₂e/MMBtu", 1.05505585262],
};
const MASS_UNITS = {
  t: ["tonnes CO₂e", 1e6],
  kg: ["kg CO₂e", 1e3],
  st: ["short tons CO₂e", 907184.74],
};
const ui = { qty: "native", ci: "g/MJ", mass: "t", eu: {} };
const cv = (x) => x * CI_UNITS[ui.ci][1],
  ciLabel = () => CI_UNITS[ui.ci][0];
const ms = (t, d = 2) => fmt((t * 1e6) / MASS_UNITS[ui.mass][1], d) + " " + MASS_UNITS[ui.mass][0];
const energyDisp = (mj) => {
  const u = ["GJ", "MMBtu"].includes(ui.qty) ? ui.qty : "MJ";
  return fmt(mj / MJ_PER[u], 0) + " " + u;
};
function nativeUnitName() {
  const p = PRESETS.find((x) => x.id === state.pathwayId);
  return p ? (p.unitLabel === "gallon" ? "US gallon" : p.unitLabel) : "MJ";
}
function volDisplay(v) {
  const u = ui.qty,
    n = nativeUnitName();
  if (!Number.isFinite(v)) return v;
  if (u === "native") return v;
  if (MJ_PER[u]) return (v * state.energyDensity) / MJ_PER[u];
  return n === "US gallon" ? v * 3.785411784 : v / 3.785411784;
}
function volNative(d) {
  const u = ui.qty,
    n = nativeUnitName();
  if (!Number.isFinite(d)) return d;
  if (u === "native") return d;
  if (MJ_PER[u]) return (d * MJ_PER[u]) / state.energyDensity;
  return n === "US gallon" ? d / 3.785411784 : d * 3.785411784;
}
function qtyLabel() {
  const u = ui.qty,
    n = nativeUnitName();
  return u === "native" ? n : u === "alt" ? (n === "US gallon" ? "litre" : "US gallon") : u;
}
function stageCalc(r) {
  const groups = {};
  r.lineItems.forEach((x) => {
    if (Math.abs(x.gPerMj) < 1e-12 && !x.userData && !Number(x.activity)) return;
    (groups[x.category || "Other"] ??= []).push(x);
  });
  const row = (x) => {
    const custom = String(x.key).startsWith("custom-"),
      direct = x.factorUnit === "—" || x.factorUnit === "-";
    const div = x.divisor ? ` ÷ <b>${fmt(x.divisor, 0)}</b> MJ fuel` : "";
    const alloc =
      x.allocation && x.allocation < 1 ? ` × ${fmt(x.allocation * 100, 1)}% allocation` : "";
    const inp = (f, v) =>
      custom
        ? `<b>${fmt(v, 4)}</b>`
        : `<input type="number" step="any" inputmode="decimal" data-ov="${esc(x.key)}" data-ovf="${f}" value="${Number.isFinite(v) ? +Number(v).toPrecision(8) : ""}" aria-label="${esc(x.label)} ${f}">`;
    return `<div class="sc-row${x.userData ? " sc-user" : ""}"><div class="sc-name">${esc(x.label)}${x.userData ? ' <span class="badge">your data</span>' : ""}</div><div class="sc-formula">${direct ? `${inp("activity", x.activity)} gCO₂e/MJ <small>(entered directly per MJ)</small>` : `${inp("activity", x.activity)} <small>${esc(x.activityUnit || "")}</small> × ${inp("factor", x.factor)} <small>${esc(x.factorUnit || "")}</small>${div}${alloc}`} = <strong>${fmt(cv(x.gPerMj), 4)} ${ciLabel()}</strong></div></div>`;
  };
  return `<section class="panel compact stage-calc"><h3>How each stage’s gCO₂e/MJ is calculated</h3><p class="note">Every stage is <b>activity × emission factor ÷ fuel energy (MJ)</b>. Rows already expressed “per MJ fuel” need no further division. Replace any grey value with your own measured data, then press Run.</p>${Object.entries(
    groups,
  )
    .map(
      ([g, xs]) =>
        `<div class="sc-group"><h4>${esc(g)} <span>${fmt(cv(xs.reduce((a, x) => a + x.gPerMj, 0)), 4)} ${ciLabel()}</span></h4>${xs.map(row).join("")}</div>`,
    )
    .join(
      "",
    )}<p class="note">Sum of all stages = <b>${fmt(cv(r.ciTotal), 4)} ${ciLabel()}</b> (net CI).${Object.keys(state.overrides || {}).length ? ' <button type="button" data-ov-clear>Restore default stage data</button>' : ""}</p></section>`;
}
document.addEventListener("change", (e) => {
  const t = e.target;
  if (!t.matches?.("[data-ov]")) return;
  const k = t.dataset.ov,
    f = t.dataset.ovf,
    v = t.value.trim() === "" ? NaN : Number(t.value);
  state.overrides = { ...(state.overrides || {}) };
  const o = { ...(state.overrides[k] || {}) };
  const signed =
    f === "activity" && ["coProductCredit", "processNonEnergy", "landUseChange"].includes(k);
  if (Number.isFinite(v) && (v >= 0 || signed)) o[f] = v;
  else if (t.value.trim() === "") delete o[f];
  else {
    $("status").textContent =
      "Enter a finite " + (signed ? "signed" : "nonnegative") + " stage value.";
    return;
  }
  if (Object.keys(o).length) state.overrides[k] = o;
  else delete state.overrides[k];
  t.closest(".sc-row")?.classList.add("sc-user");
  results();
});
document.addEventListener("click", (e) => {
  if (e.target.closest?.("[data-ov-clear]")) {
    state.overrides = {};
    resultsNow();
  }
});
function renderTools() {
  const dairy = state.pathwayId === "rng-dairy",
    n = nativeUnitName();
  const qOpts = [
    ["native", n],
    ...(n !== "MJ" ? [["MJ", "MJ"]] : []),
    ["GJ", "GJ"],
    ["MMBtu", "MMBtu"],
    ...(n === "US gallon" ? [["alt", "litre"]] : n === "litre" ? [["alt", "US gallon"]] : []),
  ];
  $("toolsTop").innerHTML =
    `<section class="unit-settings"><div class="grid">${dairy ? "" : `<label class="field">Fuel quantity<select id="u_qty">${qOpts.map(([v, t]) => `<option value="${v}" ${v === ui.qty ? "selected" : ""}>${esc(t)}</option>`).join("")}</select><small>Unit used to enter annual production.</small></label>`}<label class="field">CI result<select id="u_ci">${Object.entries(
      CI_UNITS,
    )
      .map(([v, a]) => `<option value="${v}" ${v === ui.ci ? "selected" : ""}>${a[0]}</option>`)
      .join(
        "",
      )}</select><small>Display unit for carbon intensity.</small></label><label class="field">Emissions totals<select id="u_mass">${Object.entries(
      MASS_UNITS,
    )
      .map(([v, a]) => `<option value="${v}" ${v === ui.mass ? "selected" : ""}>${a[0]}</option>`)
      .join(
        "",
      )}</select><small>Display unit for annual emissions.</small></label></div><p class="note">Changing a unit converts the displayed numbers only; the calculation and exports stay in gCO₂e/MJ and MJ. Process-energy rows below have their own unit selector.</p></section>`;
  const rows = customRows(state),
    unitOpts = (v) =>
      Object.keys(UNIT_DEFS)
        .map(
          (u) =>
            `<option value="${u}" ${u === v ? "selected" : ""}>${u === "unit" ? "other unit" : u}</option>`,
        )
        .join("");
  const total = rows.filter((x) => x.include !== false).reduce((a, x) => a + customG(x), 0);
  $("toolsBottom").innerHTML =
    `<section class="panel"><div class="section-title"><span class="step">EM</span><h2>Calculate emissions</h2></div><p class="note">Emissions = annual activity × emission factor. Each included row is added to the scenario as a line item (per MJ of annual fuel energy) and appears in the scopes card and exports.</p>${rows
      .map(
        (x) =>
          `<div class="energy-row" data-row="${esc(x.id)}"><div class="grid"><label class="field">Label<input type="text" maxlength="80" id="ce_${esc(x.id)}_label" value="${esc(x.label)}"></label><label class="field">Source preset<select id="ce_${esc(x.id)}_preset"><option value="">Custom</option>${SOURCES.map((f) => `<option value="${f.id}" ${x.preset === f.id ? "selected" : ""}>${esc(f.label)}</option>`).join("")}</select></label><label class="field">Annual activity<input type="number" step="any" min="0" id="ce_${esc(x.id)}_activity" value="${Number.isFinite(x.activity) ? x.activity : ""}"></label><label class="field">Activity unit<select id="ce_${esc(x.id)}_aUnit">${unitOpts(x.aUnit)}</select></label><label class="field">Emission factor<input type="number" step="any" id="ce_${esc(x.id)}_factor" value="${Number.isFinite(x.factor) ? x.factor : ""}"></label><label class="field">Factor basis<select id="ce_${esc(x.id)}_fMass">${[
            ["g", "gCO₂e"],
            ["kg", "kgCO₂e"],
            ["t", "tCO₂e"],
          ]
            .map(
              ([v, t]) =>
                `<option value="${v}" ${(x.fMass || "g") === v ? "selected" : ""}>${t} per ${x.aUnit === "unit" ? "unit" : esc(x.aUnit)}</option>`,
            )
            .join(
              "",
            )}</select></label><label class="field">GHG scope<select id="ce_${esc(x.id)}_scope">${[1, 2, 3].map((k) => `<option value="${k}" ${(x.scope || 1) === k ? "selected" : ""}>Scope ${k}</option>`).join("")}</select></label><label class="field">Include in scenario<select id="ce_${esc(x.id)}_include"><option value="true" ${x.include !== false ? "selected" : ""}>Yes</option><option value="false" ${x.include === false ? "selected" : ""}>No</option></select></label></div><p class="note"><b>${fmt(customG(x) / 1e3, 3)} kg CO₂e / year</b> · ${fmt(customG(x) / 1e6, 4)} t CO₂e · <button type="button" class="ghost" id="ce_${esc(x.id)}_remove">Remove</button></p></div>`,
      )
      .join(
        "",
      )}<p class="note">${rows.length ? "Total of included rows: <b>" + fmt(total / 1e6, 4) + " t CO₂e / year</b>." : "No rows yet."}</p><button type="button" id="ce_add">+ Add emission source</button></section>`;
  const on = (id, fn) => {
    const el = $(id);
    if (el) el.addEventListener("change", () => fn(el));
  };
  on("u_qty", (el) => {
    ui.qty = el.value;
    render();
  });
  on("u_ci", (el) => {
    ui.ci = el.value;
    refreshDisplay();
  });
  on("u_mass", (el) => {
    ui.mass = el.value;
    refreshDisplay();
  });
  $("ce_add").addEventListener("click", () => {
    state.customEmissions ??= [];
    state.customEmissions.push({
      id: Math.random().toString(36).slice(2, 8),
      label: "Custom source " + (state.customEmissions.length + 1),
      preset: "",
      activity: 0,
      aUnit: "kWh",
      factor: 0,
      fMass: "g",
      scope: 1,
      include: true,
    });
    renderTools();
    results();
  });
  for (const x of rows) {
    const f = (k) => "ce_" + x.id + "_" + k;
    on(f("label"), (el) => {
      x.label = el.value.slice(0, 80);
      results();
    });
    on(f("preset"), (el) => {
      x.preset = el.value;
      const src = SOURCES.find((v) => v.id === el.value);
      if (src) {
        x.label = src.label;
        x.aUnit = src.unit;
        x.factor = state.factors[src.id];
        x.fMass = "g";
        x.scope = ["electricity", "renewableElectricity"].includes(src.id) ? 2 : 1;
      }
      renderTools();
      results();
    });
    on(f("activity"), (el) => {
      x.activity = el.value.trim() === "" ? NaN : Number(el.value);
      renderTools();
      results();
    });
    on(f("factor"), (el) => {
      x.factor = el.value.trim() === "" ? NaN : Number(el.value);
      renderTools();
      results();
    });
    on(f("fMass"), (el) => {
      x.fMass = el.value;
      renderTools();
      results();
    });
    on(f("scope"), (el) => {
      x.scope = Number(el.value);
      results();
    });
    on(f("include"), (el) => {
      x.include = el.value === "true";
      renderTools();
      results();
    });
    on(f("aUnit"), (el) => {
      const o = UNIT_DEFS[x.aUnit],
        nw = UNIT_DEFS[el.value];
      if (o[0] === nw[0] && o[0] !== "other") {
        if (Number.isFinite(x.activity)) x.activity = (x.activity * o[1]) / nw[1];
        if (Number.isFinite(x.factor)) x.factor = (x.factor * nw[1]) / o[1];
      }
      x.aUnit = el.value;
      renderTools();
      results();
    });
    $(f("remove")).addEventListener("click", () => {
      state.customEmissions = state.customEmissions.filter((v) => v !== x);
      renderTools();
      results();
    });
  }
}

function render() {
  prepareInputModes();
  if (state.pathwayId === "rng-dairy") {
    renderDairy();
    return;
  }
  const p = PRESETS.find((x) => x.id === state.pathwayId),
    unit = p.unitLabel === "gallon" ? "US gallon" : p.unitLabel;
  $("inputs").innerHTML =
    `<section class="panel"><div class="section-title"><span class="step">01</span><h2>Pathway & production</h2></div><div class="grid">${pathwaySelect()}${numberField("annualVolume", "Annual production · " + esc(qtyLabel()), volDisplay(state.annualVolume), "Annual quantity changes annual emissions, not CI.", 0)}${numberField("energyDensity", "Fuel LHV · MJ / " + esc(unit), state.energyDensity, "For an MJ-denominated pathway, keep this at 1. Replace physical energy densities with your measured value.", 0)}${select(
      "region",
      "Electricity preset",
      ELECTRICITY_REGIONS.map((r) => [r.id, r.label]),
      state.region,
      "Inherited indicative factors; selecting a region resets the editable grid factor below.",
    )}${select(
      "inputBasis",
      "Process-input basis",
      [
        ["perMJ", "Per MJ of finished fuel"],
        ["perUnit", "Per " + unit + " of finished fuel"],
      ],
      state.inputBasis,
      "Switching basis converts the activity values and preserves the result.",
    )}</div><div class="method-summary"><strong>Calculation basis</strong><span>Boundary: feedstock through fuel distribution and use</span><span>LHV fuel energy · direct terms after your chosen allocation</span><span>Factors: GBW engine ${esc(MODEL_VERSION)} · September 2026 snapshot</span><span>Geography: ${esc(ELECTRICITY_REGIONS.find((item) => item.id === state.region)?.label || "user selected")}</span></div><p class="source-note">${esc(p.summary)}<br>Example factors are illustrative, not measured or independently verified. Replace them with documented data for your method.</p></section>
 <section class="panel"><div class="section-title"><span class="step">02</span><h2>Feedstock & logistics</h2></div>${select(
   "entryMode",
   "How do you want to enter feedstock and transport?",
   [
     ["direct", "Direct CI contribution"],
     ["activity", "Activity data and emission factors"],
   ],
   state.entryMode,
   "Activity mode converts annual tonnes and haul distance to gCO₂e/MJ using annual fuel energy.",
 )}${
   state.entryMode === "activity"
     ? `<div class="grid activity-entry">${numberField("activity_feedstockTonnes", "Feedstock · tonnes/year", state.activityData.feedstockTonnes, "Your measured annual feedstock quantity.", 0)}${numberField("activity_feedstockFactorKgPerTonne", "Feedstock factor · kgCO₂e/tonne", state.activityData.feedstockFactorKgPerTonne, "Supply a factor from your chosen methodology.", 0)}${numberField("activity_transportTonnes", "Transported feedstock · tonnes/year", state.activityData.transportTonnes, "Quantity transported in the modeled leg.", 0)}${numberField("activity_transportKm", "Haul distance · km", state.activityData.transportKm, "One modeled transport leg.", 0)}${numberField("activity_transportFactorKgPerTonneKm", "Transport factor · kgCO₂e/tonne-km", state.activityData.transportFactorKgPerTonneKm, "Supply a factor for this transport mode.", 0)}</div><p class="note">Converted direct CI: feedstock ${fmt(state.direct.feedstock, 3)}, transport ${fmt(state.direct.feedstockTransport, 3)} gCO₂e/MJ. One transport leg only; document additional legs separately.</p>`
     : `<div class="grid">${DIRECT_FIELDS.filter((f) =>
         ["feedstock", "landUseChange", "feedstockTransport"].includes(f.key),
       )
         .map((f) =>
           numberField(
             "direct_" + f.key,
             esc(f.label) + " · gCO₂e/MJ",
             state.direct[f.key],
             esc(f.hint),
             f.key === "landUseChange" ? "" : 0,
           ),
         )
         .join(
           "",
         )}</div><p class="note">Direct CI terms are already normalized per MJ of finished fuel. Select activity data above if you have tonnes, distance and documented factors instead.</p>`
 }${state.entryMode === "activity" ? numberField("direct_landUseChange", "Land use change · gCO₂e/MJ", state.direct.landUseChange, "Enter a documented CI contribution for land use change.") : ""}<p class="input-provenance">Example values: GBW September 2026 snapshot · not verified measurements. Your edits are screening assumptions until you document the source, date and geography.</p></section>
 <section class="panel"><div class="section-title"><span class="step">03</span><h2>Process energy</h2></div><details id="energyDetail" ${energyExpanded ? "open" : ""}><summary>Edit quantities and emission factors</summary>${SOURCES.filter(
   (f) =>
     ["electricity", "renewableElectricity", "naturalGas", "hydrogenSmr"].includes(f.id) ||
     state.energy[f.id] > 0,
 )
   .map((f) => {
     const du = ui.eu[f.id] || f.unit,
       k = MJ_PER[f.unit] / MJ_PER[du];
     return `<div class="energy-row"><h3>${esc(f.label)}</h3><div class="grid">${select(
       "eunit_" + f.id,
       "Unit",
       Object.keys(MJ_PER).map((u) => [u, u]),
       du,
       "Converts activity and factor together.",
     )}${numberField("energy_" + f.id, "Activity · " + du + "/" + (state.inputBasis === "perMJ" ? "MJ fuel" : esc(unit) + " fuel"), (state.energy[f.id] ?? 0) * k, esc(f.note), 0)}${numberField("factor_" + f.id, "Emission factor · gCO₂e/" + du, state.factors[f.id] / k, "Editable screening assumption. Include the correct upstream/combustion boundary.", 0)}</div></div>`;
   })
   .join(
     "",
   )}<details class="optional-energy" ${optionalEnergyExpanded ? "open" : ""}><summary>Add another energy source</summary>${SOURCES.filter(
   (f) =>
     !["electricity", "renewableElectricity", "naturalGas", "hydrogenSmr"].includes(f.id) &&
     !(state.energy[f.id] > 0),
 )
   .map((f) => {
     const du = ui.eu[f.id] || f.unit,
       k = MJ_PER[f.unit] / MJ_PER[du];
     return `<div class="energy-row"><h3>${esc(f.label)}</h3><div class="grid">${select(
       "eunit_" + f.id,
       "Unit",
       Object.keys(MJ_PER).map((u) => [u, u]),
       du,
     )}${numberField("energy_" + f.id, "Activity · " + du + "/" + (state.inputBasis === "perMJ" ? "MJ fuel" : esc(unit) + " fuel"), (state.energy[f.id] ?? 0) * k, esc(f.note), 0)}${numberField("factor_" + f.id, "Emission factor · gCO₂e/" + du, state.factors[f.id] / k, "Editable screening assumption.", 0)}</div></div>`;
   })
   .join("")}</details></details></section>
 ${evidenceMarkup()}<section class="panel"><div class="section-title"><span class="step">04</span><h2>Other lifecycle terms</h2></div><div class="grid">${DIRECT_FIELDS.filter(
   (f) => !["feedstock", "landUseChange", "feedstockTransport"].includes(f.key),
 )
   .map((f) =>
     numberField(
       "direct_" + f.key,
       esc(f.label) + " · gCO₂e/MJ",
       state.direct[f.key],
       esc(f.hint),
       ["coProductCredit", "processNonEnergy"].includes(f.key) ? "" : 0,
     ),
   )
   .join(
     "",
   )}${numberField("comparator", "Comparison CI · gCO₂e/MJ", state.comparator, "User-defined comparator. The default 100 is illustrative; it is not an annual credit benchmark.", 0)}</div><p class="note">Negative process-other inputs can represent documented carbon storage. Check whether your selected methodology permits each credit. Avoid counting the same co-product benefit through both allocation and displacement.</p></section>`;
  $("energyDetail").addEventListener("toggle", () => {
    energyExpanded = $("energyDetail").open;
  });
  $("inputs")
    .querySelector(".optional-energy")
    ?.addEventListener("toggle", (event) => {
      optionalEnergyExpanded = event.currentTarget.open;
    });
  for (const el of $("inputs").querySelectorAll("input,select"))
    el.addEventListener("change", () => {
      const id = el.id,
        value = el.type === "number" ? (el.value.trim() === "" ? NaN : Number(el.value)) : el.value;
      if (id === "pathwayId") {
        selectPathway(value);
        return;
      }
      if (id === "entryMode") {
        if (state.entryMode === "direct") {
          state.directEntry.feedstock = state.direct.feedstock;
          state.directEntry.feedstockTransport = state.direct.feedstockTransport;
        }
        state.entryMode = value;
        if (value === "direct") {
          state.direct.feedstock = state.directEntry.feedstock;
          state.direct.feedstockTransport = state.directEntry.feedstockTransport;
        } else updateActivityCi();
        render();
        return;
      }
      if (id.startsWith("evidence_")) {
        const [, group, field] = id.split("_");
        state.evidence[group] ??= {};
        state.evidence[group][field] = value;
        render();
        return;
      }
      if (id === "inputBasis") {
        if (!Number.isFinite(state.energyDensity) || state.energyDensity <= 0) {
          $("status").textContent =
            "Enter a positive fuel energy density before converting activity units.";
          render();
          return;
        }
        state = changeBasis(state, value);
        render();
        return;
      }
      if (id.startsWith("eunit_")) {
        ui.eu[id.slice(6)] = value;
        render();
        return;
      }
      const eid = id.slice(7),
        ek = SOURCES.find((x) => x.id === eid),
        ekk = ek ? MJ_PER[ek.unit] / MJ_PER[ui.eu[eid] || ek.unit] : 1;
      if (id === "annualVolume") state.annualVolume = volNative(value);
      else if (id.startsWith("activity_")) state.activityData[id.slice(9)] = value;
      else if (id.startsWith("direct_")) {
        state.direct[id.slice(7)] = value;
        if (["feedstock", "feedstockTransport"].includes(id.slice(7)))
          state.directEntry[id.slice(7)] = value;
      } else if (id.startsWith("energy_")) state.energy[eid] = value / ekk;
      else if (id.startsWith("factor_")) state.factors[eid] = value * ekk;
      else state[id] = value;
      if (id === "region")
        state.factors.electricity = ELECTRICITY_REGIONS.find((x) => x.id === value).gPerKwh;
      updateActivityCi();
      render();
    });
  state.programs ??= PROGRAM.settings();
  renderTools();
  results();
  if (showInputErrors) markInvalidFields();
}
let ran = false,
  dirty = false;
let lastSavedSnapshot = null;
let showInputErrors = false;
let lastFloatingSummary = null;
let publishedFloatingSummary = null;
let pendingFloatingInput = null;
function markInvalidFields() {
  for (const message of document.querySelectorAll(".field-validation")) message.remove();
  for (const input of $("inputs").querySelectorAll("[aria-invalid='true']")) {
    input.removeAttribute("aria-invalid");
    input.closest(".field")?.classList.remove("field-has-error");
    const previous = input.dataset.validationId;
    if (previous) {
      const describedBy = (input.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter((id) => id && id !== previous);
      if (describedBy.length) input.setAttribute("aria-describedby", describedBy.join(" "));
      else input.removeAttribute("aria-describedby");
      delete input.dataset.validationId;
    }
  }
  const issues = [];
  for (const input of $("inputs").querySelectorAll("input[type='number']")) {
    if (input.closest(".energy-row")?.querySelector("select[id$='_include']")?.value === "false")
      continue;
    if (input.id.startsWith("program_") && input.id.endsWith("_ci") && !input.value.trim())
      continue;
    const value = input.value.trim();
    const number = Number(value);
    const positive = ["energyDensity", "comparator"].includes(input.id) ||
      input.id.endsWith("biomethaneInjectedMmbtuHhv");
    const fractional = /(?:rawBiogasCh4|biogasToUpgradingCh4|flaredBiomethaneCh4|ventedBiogasCh4|exportedElectricityShare|vsRemovedBeforePond|msAnaerobic|fractions)/.test(input.id);
    let message = "";
    if (!value || input.validity.badInput || !Number.isFinite(number))
      message = positive
        ? "Required — enter a value greater than 0."
        : input.id === "annualVolume"
          ? "Required — enter annual production."
          : "Required — enter a number (use 0 if none).";
    else if (positive && number <= 0) message = "Enter a value greater than 0.";
    else if (input.id === "direct_coProductCredit" && number > 0)
      message = "Enter 0 or a negative value for avoided emissions.";
    else if (input.min !== "" && number < Number(input.min))
      message = `Enter ${input.min} or a higher value.`;
    else if (input.max !== "" && number > Number(input.max))
      message = `Enter ${input.max} or a lower value.`;
    else if (fractional && (number < 0 || number > 1))
      message = "Enter a fraction from 0 to 1.";
    else if (input.id.endsWith("reportingMonths") && (!Number.isInteger(number) || number < 1 || number > 12))
      message = "Enter a whole number of months from 1 to 12.";
    if (!message) continue;
    const label = input.closest("label")?.firstChild?.textContent?.trim() || "This input";
    const errorId = `validation-${issues.length}`;
    const hint = document.createElement("small");
    hint.id = errorId;
    hint.className = "field-validation";
    hint.textContent = message;
    input.insertAdjacentElement("afterend", hint);
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", [input.getAttribute("aria-describedby"), errorId].filter(Boolean).join(" "));
    input.dataset.validationId = errorId;
    input.closest(".field")?.classList.add("field-has-error");
    issues.push({ input, label, message });
  }
  const summary = $("results").querySelector(".validation-summary");
  if (summary) {
    const heading = summary.querySelector("h2");
    const detail = summary.querySelector("p");
    if (heading) heading.textContent = issues.length ? "Complete the highlighted inputs" : "Inputs ready to check";
    if (detail)
      detail.textContent = issues.length
      ? `${issues.length} ${issues.length === 1 ? "field needs" : "fields need"} a valid value. Start with ${issues[0].label}.`
        : "Results update automatically with your entries.";
  }
  return issues;
}
function focusFirstInvalid(issues) {
  const first = issues[0]?.input;
  if (!first) return;
  for (let parent = first.parentElement; parent; parent = parent.parentElement)
    if (parent.tagName === "DETAILS") parent.open = true;
  requestAnimationFrame(() => {
    first.focus({ preventScroll: true });
    first.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  });
}
function floatingSummary(summary) {
  publishedFloatingSummary = summary;
  if (window.parent !== window)
    window.parent.postMessage(
      { type: "civanta-floating-summary", kind: "ci", summary, height: document.documentElement.scrollHeight },
      location.origin,
    );
}
document.addEventListener("input", (event) => {
  if (!event.target.matches?.("#inputs input, #inputs select")) return;
  if (showInputErrors) markInvalidFields();
  pendingFloatingInput = event.target;
  if (ran)
    floatingSummary(lastFloatingSummary
      ? { ...lastFloatingSummary, detail: "Updating inputs", state: "stale" }
      : { value: "—", unit: "gCO₂e/MJ", detail: "Updating inputs", state: "stale" });
});
document.addEventListener("change", (event) => {
  if (event.target === pendingFloatingInput) pendingFloatingInput = null;
});
function calculationFlow(r) {
  const dairy = !!r.dairyResult;
  const steps = dairy
    ? [
        ["feedstock", "Manure collection", "Livestock & storage"],
        ["transport", "Digestion", "Biogas production"],
        ["conversion", "Upgrading", "Biomethane purification"],
        ["distribution", "Delivery & compression", "Pipeline / CNG"],
        ["use", "Fuel use", "End-use emissions"],
      ]
    : [
        ["feedstock", "Feedstock supply", "Production & land"],
        ["transport", "Feedstock transport", "Delivery to plant"],
        ["conversion", "Fuel conversion", "Energy, chemicals & losses"],
        ["distribution", "Fuel distribution", "Storage & delivery"],
        ["use", "Fuel use", "End-use emissions"],
      ];
  const icons = {
    feedstock:
      '<path d="M22 38V17M22 25C8 25 8 10 8 10 22 10 22 25 22 25M22 19C22 5 37 5 37 5 37 19 22 19 22 19"/>',
    transport: dairy
      ? '<path d="M10 12h24v26H10zM15 12V6h14v6M15 23h14M22 16v15M7 38h30"/>'
      : '<path d="M3 12h23v22H3zM26 20h9l6 8v6H26M8 34a4 4 0 1 0 8 0M29 34a4 4 0 1 0 8 0"/>',
    conversion: '<path d="M6 38V17l10 6v-6l10 6V10h8l4 28H6M13 29v4M22 29v4M30 29v4M28 6h4"/>',
    distribution: '<path d="M4 10h14v10h12v14h10M4 6v8M12 6v8M36 30v8M26 26h8M30 22v8"/>',
    use: '<path d="M10 7h18v31H10zM10 17h18M14 11h10M28 14h5l5 8v11h-5V22M7 38h24"/>',
  };
  const groupFor = (x) => {
    const k = x.key || "",
      l = (x.label + " " + k).toLowerCase();
    if (k.startsWith("custom-")) return "custom";
    if (/tailpipe|end.?use/.test(l)) return "use";
    if (/distribution|pipeline|cng.production/.test(l)) return "distribution";
    if (/feedstock.transport/.test(l)) return "transport";
    if (/feedstock|land.use/.test(l)) return "feedstock";
    if (dairy && /digester.energy/.test(l)) return "transport";
    return "conversion";
  };
  const entries = r.lineItems;
  const signed = (n) => (n > 0 ? "+" : "") + fmt(cv(n), 3);
  const ledgerRow = (x, credit) => {
    const direct = !dairy && !x.key?.startsWith("custom-") && !SOURCES.some((v) => v.id === x.key);
    const purpose = /avoided.*methane|avoided.*ch4/i.test(x.label + " " + x.key)
      ? "Avoided methane compares baseline manure management with the project. It is an accounting adjustment, not a co-product or a physical stream."
      : /co.?product/i.test(x.label)
        ? "This entered adjustment does not identify a physical co-product. Allocation and displacement are different treatments; do not count the same benefit twice."
        : credit
          ? "This negative ledger contribution is an accounting adjustment. A negative sign alone does not establish carbon removal or regulatory eligibility."
          : "";
    return `<details class="flow-row"><summary><span>${esc(x.label)}</span><b class="flow-row-value">${signed(x.gPerMj)} ${ciLabel()}</b></summary><p>${esc(x.detail || "Scenario ledger contribution")}</p><dl><dt>Ledger key</dt><dd>${esc(x.key)}</dd><dt>Indicative scope group</dt><dd>${scopeLabel(x)}</dd>${Number.isFinite(x.activity) ? `<dt>${direct ? "Entered normalized contribution" : "Ledger activity"}</dt><dd>${fmt(x.activity, 6)} ${esc(x.activityUnit)}</dd>` : ""}${!direct && Number.isFinite(x.factor) ? `<dt>Ledger factor</dt><dd>${fmt(x.factor, 6)} ${esc(x.factorUnit)}</dd>` : ""}${Number.isFinite(x.divisor) ? `<dt>Fuel-energy divisor</dt><dd>${fmt(x.divisor, 3)} ${esc(x.divisorUnit || "MJ")}</dd>` : ""}<dt>Contribution per finished fuel</dt><dd>${signed(x.gPerMj)} ${ciLabel()}</dd></dl>${direct ? "<p>Already normalized to fuel energy; no second division by MJ is applied.</p>" : ""}${purpose ? `<p class="flow-detail-note">${purpose}</p>` : ""}</details>`;
  };
  const positives = entries.filter((x) => x.gPerMj >= 0),
    negatives = entries.filter((x) => x.gPerMj < 0);
  const groups = [...steps, ["custom", "Additional inventory", "User-defined activities"]];
  const groupMarkup = groups
    .map(([id, label]) => {
      const rows = positives.filter((x) => groupFor(x) === id),
        sum = rows.reduce((a, x) => a + x.gPerMj, 0);
      return `<details class="flow-group" id="flow-group-${id}"><summary><span>${esc(label)}</span><b>${fmt(cv(sum), 3)}</b></summary>${rows.length ? rows.map((x) => ledgerRow(x, false)).join("") : '<p class="flow-empty">No separate contribution is recorded for this step in this scenario. This is not evidence of zero physical emissions.</p>'}</details>`;
    })
    .join("");
  return `<section class="calculation-flow" aria-label="Lifecycle calculation flow"><div class="flow-heading"><div><span class="eyebrow">CALCULATED SCENARIO · LIFECYCLE REVIEW</span><h2>From feedstock to fuel — then carbon accounting</h2></div><p>${esc(r.pathway.label)}</p></div><div class="flow-production">${steps.map(([id, label, sub], i) => `<div class="flow-step"><button type="button" class="flow-stage-button" data-flow-stage="${id}" aria-controls="flow-group-${id}" aria-expanded="false"><svg viewBox="0 0 44 44" aria-hidden="true">${icons[id]}</svg><span><b>${i + 1}. ${label}</b><small>${sub}</small></span></button></div>`).join("")}</div><p class="flow-production-note">Fuel lifecycle sequence · Arrows show process order, not measured mass or energy flows. Energy use, flaring and fugitive losses are contributions within operations, not successive fuel-production steps.</p><div class="flow-accounting"><div class="flow-lane"><span class="eyebrow">A · EMISSIONS LEDGER</span><h3>Lifecycle emissions & inputs</h3><p>Contributions per MJ of finished fuel, grouped by operation. Zero-value rows reflect the model inputs, not verified zero emissions.</p>${groupMarkup}</div><div class="flow-lane credit"><span class="eyebrow">B · SEPARATE ACCOUNTING ADJUSTMENTS</span><h3>${dairy ? "Avoided emissions & other adjustments" : "Co-product & other adjustments"}</h3><p>Not a physical process step. These signed terms reduce the modeled CI; they are not issued LCFS credits, RINs, or proof of carbon removal.</p>${negatives.length ? negatives.map((x) => ledgerRow(x, true)).join("") : '<p class="flow-empty">No negative adjustments in this scenario.</p>'}<p class="flow-boundary">${dairy ? "The dairy model compares manure-management baseline emissions with project emissions. Avoided methane must not be presented as a co-product benefit." : "Co-product treatment depends on the selected methodology and system boundary. The aggregate input does not specify co-product quantity or establish which credit treatment is permitted."} Each program requires its own boundary, evidence and eligibility assessment.</p></div></div><div class="flow-equation"><div><small>A · Gross emissions</small><strong>${fmt(cv(r.grossCi), 3)}</strong></div><span>+</span><div><small>B · Signed adjustments</small><strong>${fmt(cv(r.creditsCi), 3)}</strong></div><span>=</span><div><small>Net lifecycle CI · ${ciLabel()}</small><strong>${fmt(cv(r.ciTotal), 3)}</strong></div></div><p class="flow-state">Calculated scenario · ${Math.abs(entries.reduce((a, x) => a + x.gPerMj, 0) - r.ciTotal) < 1e-8 ? "Ledger reconciles with net CI" : "Reconciliation needs review"}.</p><p class="flow-boundary">A negative net CI can result from baseline-relative avoided emissions; it does not necessarily mean the fuel physically removes CO₂ from the atmosphere. Scope labels classify ledger rows and do not certify a corporate GHG inventory.</p></section>`;
}
document.addEventListener("click", (e) => {
  const trigger = e.target.closest?.("[data-flow-stage]");
  if (!trigger) return;
  const detail = $("flow-group-" + trigger.dataset.flowStage);
  if (!detail) return;
  detail.open = !detail.open;
  trigger.setAttribute("aria-expanded", String(detail.open));
  if (detail.open)
    detail.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "nearest",
    });
});
document.addEventListener(
  "toggle",
  (e) => {
    if (e.target.matches?.(".flow-group")) {
      const trigger = $("processFlow").querySelector(
        '[data-flow-stage="' + e.target.id.replace("flow-group-", "") + '"]',
      );
      trigger?.setAttribute("aria-expanded", String(e.target.open));
    }
  },
  true,
);

function baselinePanel(result = null, base = null) {
  const delta = result && base ? result.ciTotal - base.ciTotal : null;
  const changes = base ? changedInputs(baseline, state) : [];
  const electricity = (rows) =>
    rows
      .filter((row) => ["electricity", "renewableElectricity"].includes(row.key))
      .reduce((total, row) => total + row.gPerMj, 0);
  const electricityDelta =
    result && base ? electricity(result.lineItems) - electricity(base.lineItems) : null;
  const changeLine = (item) =>
    `${esc(item.label)}: ${fmt(item.previous, 4)} → ${fmt(item.current, 4)}`;
  const changesMarkup = changes.length
    ? changes.slice(0, 5).map(changeLine).join("<br>") +
      (changes.length > 5
        ? `<details><summary>Show ${changes.length - 5} more changes</summary><div>${changes.slice(5).map(changeLine).join("<br>")}</div></details>`
        : "")
    : "No tracked numeric input changes";
  return `<section class="combined baseline-card decision-summary"><span>Decision summary${baseline ? " · " + esc(baseline.name) : ""}</span><strong>${delta === null ? (baseline ? "Baseline ready" : "Compare an improvement") : (delta > 0 ? "+" : "") + fmt(delta, 3) + " gCO₂e/MJ"}</strong><small>${delta === null ? (baseline ? "Change an input to compare against your baseline." : "Choose Use as baseline to compare changes.") : "Baseline " + fmt(base.ciTotal, 3) + " → current " + fmt(result.ciTotal, 3) + " gCO₂e/MJ. " + (delta < 0 ? "Lower CI" : delta > 0 ? "Higher CI" : "No CI change") + "."}</small>${
    delta !== null
      ? `<dl><dt>Grid & renewable electricity contribution to change</dt><dd>${electricityDelta > 0 ? "+" : ""}${fmt(electricityDelta, 3)} gCO₂e/MJ</dd><dt>Changed inputs</dt><dd>${changesMarkup}</dd><dt>Additional annual cost</dt><dd>Not supplied in CI Workspace</dd><dt>Evidence to confirm</dt><dd>Factor source, date, geography, allocation and program eligibility</dd></dl>`
      : ""
  }<details><summary>How to compare</summary><ol><li>Fill the inputs.</li><li>Click <b>Use as baseline</b>.</li><li>Change an input; the result updates automatically.</li></ol></details></section>`;
}
function results() {
  const result = assess(state);
  if (!result.errors.length) {
    resultsNow();
    return;
  }
  ran = false;
  dirty = false;
  $("processFlow").innerHTML = "";
  $("results").innerHTML = `${baselinePanel()}<section class="panel"><h2>Complete your inputs</h2><p class="note">Results appear automatically when the required values are ready.</p></section>`;
  floatingSummary({ value: "—", unit: "gCO₂e/MJ", detail: "Complete inputs to see results", state: "ready" });
}
function refreshDisplay() {
  results();
}
document.addEventListener("click", (event) => {
  if (!event.target.closest?.("[data-save]")) return;
  if (!valid()) return;
  window.parent.postMessage({ type: "civanta-save-request", kind: "ci", suggestedName: state.name || `${assess(state).pathway.label} scenario` }, location.origin);
});
function stageLines(r, stage) {
  if (stage.label === "Process energy")
    return r.lineItems.filter((line) => line.category === "Process energy");
  if (stage.label === "Co-products / avoided emissions")
    return r.lineItems.filter((line) =>
      line.category === "Credits" || /co-product|avoided/i.test(line.label),
    );
  return r.lineItems.filter((line) => line.label === stage.label);
}
function stageEvidence(stage) {
  const label = stage.label.toLowerCase();
  const key = label.includes("transport") ? "transport" :
    label.includes("feedstock") ? "feedstock" :
      label.includes("electricity") ? "electricity" : null;
  return key ? state.evidence?.[key] : null;
}
function lifecycleDetail(r, base, index) {
  const stage = r.stages[index];
  if (!stage) return "";
  const lines = stageLines(r, stage);
  const old = base?.pathway?.id === r.pathway.id
    ? base.stages.find((item) => item.label === stage.label)?.value : null;
  const evidence = stageEvidence(stage);
  const evidenceBits = evidence ? [evidence.source, evidence.date, evidence.geography].filter(Boolean) : [];
  const share = stage.value > 0 && r.grossCi > 0
    ? `<span>${fmt(stage.value / r.grossCi * 100, 1)}% of gross emissions</span>` :
      stage.value < 0 ? "<span>Signed reduction to modeled CI</span>" :
        "<span>Zero in this scenario; not verified zero emissions</span>";
  return `<div class="lifecycle-detail-heading"><div><span class="eyebrow">SELECTED CONTRIBUTION</span><h4>${esc(stage.label)}</h4></div><strong>${fmt(cv(stage.value), 3)} <small>${ciLabel()}</small></strong></div><div class="lifecycle-detail-meta">${share}${old == null ? "" : `<span>Change vs baseline: ${fmt(cv(stage.value - old), 3)} ${ciLabel()}</span>`}</div>${lines.length ? `<div class="lifecycle-detail-lines">${lines.map((line) => `<div><div><span>${esc(line.label)}</span><small>${line.factorUnit === "—" || line.factorUnit === "-" ? "Entered as a direct CI contribution" : `Activity ${fmt(line.activity, 4)} ${esc(line.activityUnit)} · factor ${fmt(line.factor, 3)} ${esc(line.factorUnit)}${line.divisor ? ` · divisor ${fmt(line.divisor, 0)} MJ` : ""}`}</small></div><b>${fmt(cv(line.gPerMj), 3)} ${ciLabel()}</b></div>`).join("")}</div>` : `<p class="note">No separate calculation row is recorded for this zero-valued stage.</p>`}<p class="note">${evidenceBits.length ? `${esc(evidence.status || "Example / user estimate")} · ${evidenceBits.map(esc).join(" · ")}` : "Source, date and geography are not documented for this contribution."}</p><a class="lifecycle-ledger-link" href="#ci-ledger" data-open-ledger>View calculation ledger ↗</a>`;
}
function lifecyclePlot(r, base) {
  currentLifecycle = { r, base };
  const values = r.stages.map((stage) => stage.value);
  const low = Math.min(0, ...values);
  const high = Math.max(1, ...values);
  const span = high - low;
  const zero = -low / span * 100;
  const selected = values.reduce((best, value, index) =>
    Math.abs(value) > Math.abs(values[best]) ? index : best, 0);
  return `<section class="panel compact lifecycle-insight" aria-labelledby="lifecycle-title"><div class="chart-heading"><div><span class="eyebrow">LIFECYCLE ACCOUNTING</span><h3 id="lifecycle-title">What drives this result</h3></div><span class="badge">${Math.abs(r.reconciliation) < 1e-8 ? "Reconciled" : "Review totals"}</span></div><div class="lifecycle-equation"><div><span>Gross emissions</span><strong>${fmt(cv(r.grossCi), 3)}</strong></div><span aria-hidden="true">+</span><div><span>Signed adjustments</span><strong>${fmt(cv(r.creditsCi), 3)}</strong></div><span aria-hidden="true">=</span><div><span>Net CI</span><strong>${fmt(cv(r.ciTotal), 3)} <small>${ciLabel()}</small></strong></div></div><p class="chart-intro">Select a contribution to inspect its calculation. Right of zero adds emissions; left of zero reduces modeled CI.</p><div class="lifecycle-layout"><div class="lifecycle-stage-list" role="group" aria-label="Lifecycle contributions">${r.stages.map((stage, index) => {
    const position = (stage.value - low) / span * 100;
    const left = Math.min(position, zero);
    const width = Math.max(Math.abs(position - zero), .65);
    return `<button type="button" class="lifecycle-stage ${index === selected ? "is-active" : ""}" data-stage-index="${index}" aria-pressed="${index === selected}" aria-controls="lifecycle-detail"><span class="lifecycle-stage-name">${esc(stage.label)}</span><span class="lifecycle-stage-track" style="--zero:${zero}%"><span class="lifecycle-stage-bar ${stage.value < 0 ? "is-adjustment" : ""}" style="left:${left}%;width:${width}%"></span></span><strong>${fmt(cv(stage.value), 2)}</strong></button>`;
  }).join("")}</div><aside class="lifecycle-detail" id="lifecycle-detail" aria-live="polite">${lifecycleDetail(r, base, selected)}</aside></div><p class="note">Values in ${ciLabel()} of finished fuel. Signed adjustments are accounting terms, not proof of physical carbon removal or issued credits.</p></section>`;
}
function selectLifecycleStage(index) {
  if (!currentLifecycle || !currentLifecycle.r.stages[index]) return;
  const detail = $("lifecycle-detail");
  if (!detail) return;
  for (const button of document.querySelectorAll(".lifecycle-stage")) {
    const selected = Number(button.dataset.stageIndex) === index;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  detail.innerHTML = lifecycleDetail(currentLifecycle.r, currentLifecycle.base, index);
}
document.addEventListener("pointerover", (event) => {
  const button = event.target.closest?.(".lifecycle-stage");
  if (button && button.getAttribute("aria-pressed") !== "true")
    selectLifecycleStage(Number(button.dataset.stageIndex));
});
document.addEventListener("focusin", (event) => {
  const button = event.target.closest?.(".lifecycle-stage");
  if (button) selectLifecycleStage(Number(button.dataset.stageIndex));
});
document.addEventListener("click", (event) => {
  const button = event.target.closest?.(".lifecycle-stage");
  if (button) selectLifecycleStage(Number(button.dataset.stageIndex));
  const ledgerLink = event.target.closest?.("[data-open-ledger]");
  if (ledgerLink) {
    const ledger = $("ci-ledger");
    if (ledger) ledger.open = true;
  }
  const programLink = event.target.closest?.("[data-open-program]");
  if (programLink) {
    const details = $(programLink.dataset.openProgram);
    if (details) details.open = true;
  }
});
function resultsNow(focusInvalid = false) {
  ran = true;
  dirty = false;
  const r = assess(state);
  if (r.errors.length) {
    const activityError =
      state.entryMode === "activity"
        ? activityToCi(state.activityData, state.annualVolume * state.energyDensity).errors[0]
        : null;
    showInputErrors = true;
    const issues = markInvalidFields();
    $("processFlow").innerHTML = "";
    const guidance = issues.length
      ? `${issues.length} ${issues.length === 1 ? "field needs" : "fields need"} a valid value. Start with ${issues[0].label}.`
      : activityError || "Review the selected pathway and calculation settings.";
    $("results").innerHTML = `<section class="panel error validation-summary" role="alert"><h2>Complete the highlighted inputs</h2><p>${esc(guidance)}</p><p class="note">Enter 0 where an activity does not apply.</p></section>`;
    floatingSummary({ value: "—", unit: "gCO₂e/MJ", detail: issues.length ? `${issues.length} input ${issues.length === 1 ? "needs" : "need"} attention` : activityError || "Check your inputs", state: "invalid" });
    if (focusInvalid) focusFirstInvalid(issues);
    return;
  }
  showInputErrors = false;
  markInvalidFields();
  $("processFlow").innerHTML = proAccess ? calculationFlow(r) : "";
  const b = baseline ? assess(baseline) : null;
  const base = b && !b.errors.length ? b : null;
  const sensitivity = state.dairy
    ? ["digesterGridKwh", "upgradingGridKwh", "digesterNgMmbtuHhv"].map((k) => ({
        label: dairyLabel(k),
        low: assess({
          ...state,
          dairy: {
            ...state.dairy,
            inventory: { ...state.dairy.inventory, [k]: state.dairy.inventory[k] * 0.75 },
          },
        }).ciTotal,
        high: assess({
          ...state,
          dairy: {
            ...state.dairy,
            inventory: { ...state.dairy.inventory, [k]: state.dairy.inventory[k] * 1.25 },
          },
        }).ciTotal,
      }))
    : ["electricity", "naturalGas", "hydrogenSmr"].map((k) => ({
        label: SOURCES.find((x) => x.id === k).label,
        low: assess({ ...state, factors: { ...state.factors, [k]: state.factors[k] * 0.75 } })
          .ciTotal,
        high: assess({ ...state, factors: { ...state.factors, [k]: state.factors[k] * 1.25 } })
          .ciTotal,
      }));
  const fuel = r.pathway.id.startsWith("rd-")
    ? "rd"
    : r.pathway.id.startsWith("biodiesel-")
      ? "bd"
      : r.pathway.id.startsWith("ethanol-")
        ? "ethanol"
        : r.pathway.id.startsWith("rng-")
          ? "rng"
          : null;
  const params = new URLSearchParams({
    ci: String(r.ciTotal),
    fuel: fuel ?? "",
    quantity: String(fuel === "rng" ? r.annualEnergyMj / 1055.05585262 : state.annualVolume),
    energy: String(fuel === "rng" ? 1055.05585262 : r.annualEnergyMj / state.annualVolume),
  });
  $("results").innerHTML =
    `<section class="result-hero"><span class="eyebrow">MODELED CI · LHV BASIS</span><h2>${esc(state.name)}</h2><p>${esc(r.pathway.label)}</p></section><section class="metric"><div><span>Net lifecycle carbon intensity</span><em>Screening estimate</em></div><strong>${fmt(cv(r.ciTotal), 3)}<small>${ciLabel()} of finished fuel</small></strong><div class="metric-foot"><span>Gross emissions</span><b>${fmt(cv(r.grossCi), 3)}</b></div><div class="metric-foot"><span>Signed adjustments</span><b>${fmt(cv(r.creditsCi), 3)}</b></div><p class="note">${fmt(cv(r.grossCi), 3)} + (${fmt(cv(r.creditsCi), 3)}) = ${fmt(cv(r.ciTotal), 3)} ${ciLabel()}. Display rounding may affect the last decimal.</p></section>${baselinePanel(r, base)}${lifecyclePlot(r, base)}${proAccess ? `<details class="panel calculation-details"><summary>View calculation details <span>Activity, factors & stage formulas</span></summary>${stageCalc(r)}</details>` : ""}${(() => {
      const sc = { 1: 0, 2: 0, 3: 0, adjustments: 0, unallocated: 0 };
      r.lineItems.forEach((line) => {
        for (const [key, value] of Object.entries(scopeContributions(line))) sc[key] += value;
      });
      const names = {
        1: ["Scope 1", "Direct operations"],
        2: ["Scope 2", "Purchased electricity and steam"],
        3: ["Scope 3", "Other lifecycle emissions"],
        adjustments: ["Lifecycle adjustments", "Signed accounting terms, shown separately"],
        unallocated: ["Unallocated", "Manual contributions without a scope split"],
      };
      return `<section class="panel compact"><h3>Indicative scope allocation</h3>${[1, 2, 3, "adjustments", ...(sc.unallocated ? ["unallocated"] : [])].map((key) => `<div class="chart-row"><div class="labels"><span><b>${names[key][0]}</b> · ${names[key][1]}</span><b>${fmt(cv(sc[key]), 3)} ${ciLabel()}</b></div><div class="bar-track"><div class="bar-fill ${sc[key] < 0 ? "credit" : ""}" style="width:${Math.min(100, (Math.abs(sc[key]) / Math.max(r.grossCi, 1e-9)) * 100)}%"></div></div><small>${ms((sc[key] * r.annualEnergyMj) / 1e6)} / year</small></div>`).join("")}<p class="note">Lifecycle factor grouping, not a verified corporate GHG inventory. Gross scopes plus signed adjustments = ${fmt(cv(r.ciTotal), 3)} ${ciLabel()}.</p></section>`;
    })()}
 <section class="panel compact"><h3>Annual impact & comparison</h3><dl><dt>Annual fuel energy</dt><dd>${energyDisp(r.annualEnergyMj)}</dd><dt>Annual modeled emissions</dt><dd>${ms(r.annualTonnesCo2e)}</dd><dt>User comparator</dt><dd>${fmt(state.comparator, 2)} gCO₂e/MJ</dd><dt>Reduction vs comparator</dt><dd>${fmt(r.savingPct, 2)}%</dd></dl><p class="note">Negative annual emissions reflect the accounting scenario and its credits. A comparator reduction is not a determination of regulatory eligibility.</p></section>

 <section class="panel compact"><h3>${state.dairy ? "Farm energy-input" : "Emission-factor"} sensitivity</h3><p class="note">Each selected ${state.dairy ? "energy input" : "factor"} varies ±25%; all other inputs stay fixed.</p><table><thead><tr><th>Factor</th><th>−25% CI</th><th>+25% CI</th></tr></thead><tbody>${sensitivity.map((x) => `<tr><td>${esc(x.label)}</td><td>${fmt(x.low, 3)}</td><td>${fmt(x.high, 3)}</td></tr>`).join("")}</tbody></table></section>
 <section class="panel compact"><details id="ci-ledger"><summary>Line-by-line calculation ledger</summary><div class="table-wrap"><table class="line-table"><thead><tr><th>Source</th><th>${state.dairy ? "Period activity" : "Activity / MJ"}</th><th>Factor</th>${state.dairy ? "<th>Divisor MJ</th>" : ""}<th>gCO₂e/MJ</th></tr></thead><tbody>${r.lineItems.map((x) => `<tr><td>${esc(x.label)}</td><td>${fmt(x.activity, 6)} ${esc(x.activityUnit)}</td><td>${fmt(x.factor, 3)} ${esc(x.factorUnit)}</td>${state.dairy ? `<td>${fmt(x.divisor, 0)}</td>` : ""}<td>${fmt(x.gPerMj, 6)}</td></tr>`).join("")}</tbody></table></div><p class="note">${state.dairy ? "Farm rows use period inventory and the dispensable RNG LHV denominator. Avoided-emission rows carry a negative sign. The editable grid factor is applied to farm electricity quantities." : "Direct inputs have a factor of 1 because the entered value is already normalized to gCO₂e/MJ. Process rows are normalized activity × emission factor. No second division by fuel energy is applied."}</p><p class="note">${esc(MODEL_VERSION)}</p></details></section>
 ${state.dairy ? dairyResults(r) : ""}${programPanel(r)}${fuel ? `<section class="panel compact"><h3>Next: credit & RIN estimates</h3><p class="note">Pass this modeled CI and fuel quantity to the companion calculator. Select the approved pathway and eligible volume separately.</p><a href="/credit-calculator?${esc(params.toString())}" target="_top">Open Credit & RIN Calculator ↗</a></section>` : ""}`;
  for (const el of $("results").querySelectorAll("input,select"))
    el.addEventListener("change", () => {
      if (el.id === "programFocus") {
        activeProgramId = el.value;
        const current = PROGRAM.comparePrograms(state, r, state.programs);
        $("programFocusContent").innerHTML = programFocusMarkup(current, activeProgramId);
        return;
      }
      const parts = el.id.split("_"),
        v = el.type === "number" ? (el.value.trim() === "" ? null : Number(el.value)) : el.value;
      if (parts.length === 3) state.programs.rows[parts[1]][parts[2]] = v;
      else state.programs[parts[1]] = parts[1] === "year" ? Number(v) : v;
      resultsNow();
    });
  lastFloatingSummary = {
    value: fmt(cv(r.ciTotal), 3),
    unit: ciLabel(),
    detail: r.pathway.label,
    state: lastSavedSnapshot === JSON.stringify(state) ? "current" : "preview",
  };
  floatingSummary(lastFloatingSummary);
}
function dairyLabel(k) {
  const names = {
    annualTemperatureC: "Annual mean temperature · °C",
    reportingMonths: "Reporting period · months",
    rawBiogasScf: "Raw biogas · scf / period",
    rawBiogasCh4: "Raw biogas CH₄ · fraction",
    biogasToUpgradingScf: "Biogas to upgrading · scf / period",
    biogasToUpgradingCh4: "Upgrading inlet CH₄ · fraction",
    biomethaneInjectedMmbtuHhv: "Injected biomethane · MMBtu HHV / period",
    flaredBiomethaneScf: "Flared biomethane · scf / period",
    flaredBiomethaneCh4: "Flared biomethane CH₄ · fraction",
    ventedBiogasScf: "Vented biogas · scf / period",
    ventedBiogasCh4: "Vented biogas CH₄ · fraction",
    onsiteElectricityRngMmbtuHhv: "RNG to onsite electricity · MMBtu HHV / period",
    exportedElectricityShare: "Electricity exported · fraction",
    vsRemovedBeforePond: "Volatile solids removed before pond · fraction",
    digesterGridKwh: "Digester electricity · kWh / period",
    digesterNgMmbtuHhv: "Digester natural gas · MMBtu HHV / period",
    digesterDieselGal: "Digester diesel · US gal / period",
    digesterRawBiogasMmbtuLhv: "Digester raw biogas · MMBtu LHV / period",
    digesterBiomethaneMmbtuHhv: "Digester biomethane · MMBtu HHV / period",
    upgradingGridKwh: "Upgrading electricity · kWh / period",
    upgradingNgMmbtuHhv: "Upgrading natural gas · MMBtu HHV / period",
    upgradingDieselGal: "Upgrading diesel · US gal / period",
    upgradingPropaneGal: "Upgrading propane · US gal / period",
    upgradingOnsiteElecKwh: "Upgrading onsite electricity · kWh / period",
    upgradingRawBiogasMmbtuLhv: "Upgrading raw biogas · MMBtu LHV / period",
    upgradingBiomethaneMmbtuHhv: "Upgrading biomethane · MMBtu HHV / period",
    pipelineMiles: "Pipeline distance · miles",
  };
  return names[k] ?? k;
}
function renderDairy() {
  const d = state.dairy,
    i = d.inventory;
  const input = (key) =>
    numberField(
      "farm|inventory|" + key,
      dairyLabel(key),
      i[key],
      "Enter measured reporting-period inventory; fractions use 0–1.",
      key === "annualTemperatureC" ? "" : 0,
    );
  const group = (title, keys) =>
    `<section class="panel"><h2>${title}</h2><div class="grid">${keys.map(input).join("")}</div></section>`;
  $("inputs").innerHTML =
    `<section class="panel"><div class="section-title"><span class="step">01</span><h2>Pathway & farm setup</h2></div><div class="grid">${pathwaySelect()}${select(
      "farm|inventory|digesterType",
      "Digester type",
      DAIRY.LCFS_DIGESTER_TYPES.map((x) => [x, x]),
      i.digesterType,
      "Snapshot leakage factor: " + fmt(DAIRY.DIGESTER_LEAKAGE[i.digesterType] * 100, 1) + "%.",
    )}${input("reportingMonths")}${select(
      "farm|inventory|electricityRegion",
      "Farm grid preset",
      DAIRY.EGRID_REGIONS.map((x) => [x, x]),
      i.electricityRegion,
    )}${numberField("farm|gridFactor", "Farm grid factor · gCO₂e/kWh", d.gridFactor, "Editable; changing grid preset restores its snapshot factor.", 0)}${numberField("comparator", "Comparison CI · gCO₂e/MJ LHV", state.comparator, "Illustrative comparator, not a regulatory approval test.", 0)}</div></section>
 <section class="panel"><h2>Livestock & manure volatile solids</h2><p class="note">This model uses volatile solids directly. Wet manure moisture is already reflected in the measured VS rate; it is not applied again. Herd size alone does not predict RNG production: enter measured gas output below.</p>${i.livestock.map((a, n) => `<h3>${esc(a.label)}</h3><div class="grid">${numberField("farm|inventory|livestock|" + n + "|population", "Head count", a.population, "", 0)}${numberField("farm|inventory|livestock|" + n + "|vsRate", "Volatile solids · kg / head / day", a.vsRate, "", 0)}${numberField("farm|inventory|livestock|" + n + "|bo", "Methane potential · m³ CH₄ / kg VS", a.bo, "", 0)}${numberField("farm|inventory|livestock|" + n + "|msAnaerobic", "Baseline anaerobic storage · fraction", a.msAnaerobic, "0–1", 0)}</div>`).join("")}</section>
 <section class="panel"><h2>Climate & manure storage</h2><div class="grid">${input("annualTemperatureC")}${select(
   "farm|useMonthlyTemperature",
   "Anaerobic-storage temperature series",
   [
     [true, "Monthly temperatures"],
     [false, "Annual mean for every month"],
   ],
   d.useMonthlyTemperature,
 )}${select(
   "farm|inventory|septemberCleanout",
   "September full cleanout",
   [
     [true, "Yes"],
     [false, "No"],
   ],
   i.septemberCleanout,
 )}${input("vsRemovedBeforePond")}</div>${d.useMonthlyTemperature ? `<details><summary>Monthly temperatures · °C</summary><div class="grid">${i.monthlyTemperatureC.map((a, n) => numberField("farm|inventory|monthlyTemperatureC|" + n, ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][n], a)).join("")}</div></details>` : ""}${[
   "otherStorage",
   "nonBcsStorage",
 ]
   .map(
     (k) =>
       `<details><summary>${k === "otherStorage" ? "Other baseline storage" : "Project storage outside biogas collection"}</summary>${i[
         k
       ]
         .map(
           (a, n) =>
             `<div class="grid">${select(
               "farm|inventory|" + k + "|" + n + "|system",
               "Storage / treatment system",
               DAIRY.STORAGE_SYSTEMS.map((x) => [x, x]),
               a.system,
             )}${a.fractions.map((v, j) => numberField("farm|inventory|" + k + "|" + n + "|fractions|" + j, i.livestock[j].label + " · fraction", v, "0–1; set 0 for unused systems.", 0)).join("")}</div>`,
         )
         .join("")}</details>`,
   )
   .join("")}</section>
 ${group("Gas production, upgrading & losses", ["rawBiogasScf", "rawBiogasCh4", "biogasToUpgradingScf", "biogasToUpgradingCh4", "biomethaneInjectedMmbtuHhv", "flaredBiomethaneScf", "flaredBiomethaneCh4", "ventedBiogasScf", "ventedBiogasCh4", "onsiteElectricityRngMmbtuHhv", "exportedElectricityShare"])}
 ${group("Digester & upgrading energy", ["digesterGridKwh", "digesterNgMmbtuHhv", "digesterDieselGal", "digesterRawBiogasMmbtuLhv", "digesterBiomethaneMmbtuHhv", "upgradingGridKwh", "upgradingNgMmbtuHhv", "upgradingDieselGal", "upgradingPropaneGal", "upgradingOnsiteElecKwh", "upgradingRawBiogasMmbtuLhv", "upgradingBiomethaneMmbtuHhv", "pipelineMiles"])}`;
  for (const el of $("inputs").querySelectorAll("input,select"))
    el.addEventListener("change", () => {
      if (el.id === "pathwayId") {
        selectPathway(el.value);
        return;
      }
      let v = el.type === "number" ? (el.value.trim() === "" ? NaN : Number(el.value)) : el.value;
      if (el.id.startsWith("farm|")) {
        const keys = el.id.split("|").slice(1);
        if (["useMonthlyTemperature", "septemberCleanout"].includes(keys.at(-1))) v = v === "true";
        let obj = state.dairy;
        for (const key of keys.slice(0, -1)) obj = obj[key];
        obj[keys.at(-1)] = v;
        if (keys.at(-1) === "electricityRegion") state.dairy.gridFactor = DAIRY.LCFS_EF.grid[v];
      } else state[el.id] = v;
      render();
    });
  state.programs ??= PROGRAM.settings();
  renderTools();
  results();
  if (showInputErrors) markInvalidFields();
}
function dairyResults(r) {
  const f = r.dairyResult;
  return `<section class="panel compact"><h3>Farm methane balance</h3>${plot(
    "Baseline and project methane tonnes CH4 per month",
    [
      { label: "Baseline methane", value: f.baselineCh4PerMonth },
      { label: "Project methane", value: f.projectCh4PerMonth, color: "#4d82b8" },
      { label: "Effluent pond", value: f.effluentPondPerMonth },
      { label: "Digester leakage", value: f.digesterLeakagePerMonth },
      { label: "Upgrading fugitives", value: f.upgradingFugitivePerMonth },
    ],
  )}<p class="note">Project total includes venting, pond storage, non-collection storage, digester leakage, upgrading fugitives and flared methane. This balance is separate from the signed CI credit calculation.</p><dl><dt>Annual dispensable RNG · LHV</dt><dd>${fmt(r.annualEnergyMj / 1055.05585, 0)} MMBtu</dd><dt>Reporting period RNG · LHV</dt><dd>${fmt(f.dispensableMmbtu, 0)} MMBtu</dd><dt>Avoided methane contribution</dt><dd>${fmt(f.avoidedCh4GPerMj, 3)} gCO₂e/MJ</dd><dt>Diverted CO₂ contribution</dt><dd>${fmt(f.divertedCo2GPerMj, 3)} gCO₂e/MJ</dd><dt>Upgrading fugitive fraction</dt><dd>${fmt(f.upgradingFugitiveFraction * 100, 2)}%</dd></dl>${r.warnings?.length ? `<div class="source-note"><b>Review farm inventory</b><ul>${r.warnings.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>` : ""}<p class="note">Annual results extrapolate the reporting period using 12 ÷ reporting months. No additional generic pathway terms are added to the farm model. State and Canada liquid credit estimates remain unsupported for RNG; use the companion calculator with the applicable approved pathway and reporting basis.</p></section>`;
}
function plot(title, items) {
  const lo = Math.min(0, ...items.map((x) => x.value)),
    hi = Math.max(1, ...items.map((x) => x.value)),
    span = hi - lo;
  const x = (v) => 150 + ((v - lo) / span) * 240,
    h = items.length * 34 + 38;
  return `<svg class="plot" viewBox="0 0 470 ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><line x1="${x(0)}" x2="${x(0)}" y1="5" y2="${h - 25}" stroke="#b9cbc6"/>${items.map((a, i) => `<text x="4" y="${i * 34 + 22}" font-size="11">${esc(a.label.length > 25 ? a.label.slice(0, 24) + "…" : a.label)}</text><rect x="${Math.min(x(0), x(a.value))}" y="${i * 34 + 8}" width="${Math.max(1, Math.abs(x(a.value) - x(0)))}" height="20" rx="3" fill="${a.color ?? (a.value < 0 ? "#4d82b8" : "#087a59")}"/><text x="400" y="${i * 34 + 22}" font-size="11">${fmt(a.value, 2)}</text>`).join("")}<text x="150" y="${h - 3}" font-size="10">${fmt(lo, 1)}</text><text x="350" y="${h - 3}" font-size="10">${fmt(hi, 1)}</text></svg>`;
}
function curve(rows, r) {
  const min = Math.min(-20, r.ciTotal - 20, ...rows.map((a) => a.ci - 10)),
    max = Math.max(110, r.ciTotal + 20, ...rows.map((a) => a.ci + 10)),
    points = rows.filter((x) => x.supported && x.share > 0);
  if (!points.length)
    return '<p class="note">Enter eligible volume shares above to plot annual credits as CI changes.</p>';
  const vals = points.flatMap((x) => [min, max].map((ci) => ((x.benchmark - ci) * x.energy) / 1e6)),
    low = Math.min(0, ...vals),
    high = Math.max(1, ...vals),
    xp = (ci) => 50 + ((ci - min) / (max - min)) * 350,
    yp = (v) => 180 - ((v - low) / (high - low)) * 140,
    colors = ["#087a59", "#4d82b8", "#bb7520", "#9a57ac"];
  return `<svg class="plot" viewBox="0 0 460 240" role="img" aria-label="Annual program credits versus carbon intensity"><title>Annual program credits versus CI at fixed eligible energy</title><line x1="50" x2="400" y1="${yp(0)}" y2="${yp(0)}" stroke="#b9cbc6"/><line x1="${xp(r.ciTotal)}" x2="${xp(r.ciTotal)}" y1="35" y2="180" stroke="#102f35" stroke-dasharray="4 3"/>${points.map((a, i) => `<path d="M${xp(min)},${yp(((a.benchmark - min) * a.energy) / 1e6)} L${xp(max)},${yp(((a.benchmark - max) * a.energy) / 1e6)}" fill="none" stroke="${colors[i]}" stroke-width="3"/><circle cx="${xp(a.ci)}" cy="${yp(a.credits)}" r="4" fill="${colors[i]}"/><text x="50" y="${204 + i * 11}" fill="${colors[i]}" font-size="10">${esc(a.name)}</text>`).join("")}<text x="50" y="25" font-size="10">Credits / deficits: ${fmt(low, 0)} to ${fmt(high, 0)} tonnes CO₂e</text><text x="50" y="195" font-size="10">CI ${fmt(min, 1)} → ${fmt(max, 1)} gCO₂e/MJ · dashed: modeled CI</text></svg>`;
}
function programFocusMarkup(out, id) {
  const a = out.rows.find((row) => row.id === id) || out.rows[0];
  if (!a) return "";
  if (![a.ci, a.benchmark, a.energy].every(Number.isFinite))
    return `<div class="program-focus-card"><h4>${esc(a.name)}</h4><p class="error-text" role="alert">Check this programme's CI, eligible share and reporting energy inputs before comparing.</p><a href="#program-detail-${esc(a.id)}" data-open-program="program-detail-${esc(a.id)}">Edit programme inputs ↗</a></div>`;
  const low = Math.min(0, a.ci, a.benchmark);
  const high = Math.max(1, a.ci, a.benchmark);
  const span = high - low;
  const zero = -low / span * 100;
  const bar = (value, type) => {
    const position = (value - low) / span * 100;
    return `<span class="program-focus-track" style="--zero:${zero}%"><span class="program-focus-bar ${type}" style="left:${Math.min(zero, position)}%;width:${Math.max(.7, Math.abs(position-zero))}%"></span></span>`;
  };
  const difference = Number.isFinite(a.delta)
    ? `${a.delta >= 0 ? "+" : ""}${fmt(a.delta, 2)} gCO₂e/MJ` : "—";
  const status = a.delta > 0 ? "Below reference" : a.delta < 0 ? "Above reference" : "At reference";
  const credit = out.errors.length ? "Check programme inputs" :
    !a.supported ? (a.ref ? "Reference comparison only" : "No supported credit estimate for this fuel") :
      a.share <= 0 ? "Enter eligible volume to estimate credits" :
        `${fmt(a.credits, 2)} tCO₂e conditional ${a.credits < 0 ? "deficit" : "credits"}`;
  const basis = state.programs.rows[a.id]?.ci == null
    ? "Screening CI used as a fallback; enter an approved programme CI below." :
      "Uses the programme-specific CI entered below.";
  return `<div class="program-focus-card"><div class="program-focus-head"><div><span class="eyebrow">SELECTED PROGRAMME · ${esc(state.programs.year)}</span><h4>${esc(a.name)}</h4><p>${esc(a.kind)}</p></div><span class="program-status ${a.delta < 0 ? "is-above" : ""}">${status}</span></div><div class="program-focus-bars"><div><span>Programme CI used</span>${bar(a.ci, "is-ci")}<strong>${fmt(a.ci, 2)}</strong></div><div><span>Reference value</span>${bar(a.benchmark, "is-reference")}<strong>${fmt(a.benchmark, 2)}</strong></div></div><p class="program-focus-unit">Values in gCO₂e/MJ · zero line shown for negative CI</p><div class="program-focus-facts"><div><span>Reference − CI</span><strong>${difference}</strong></div><div><span>Eligible reporting energy</span><strong>${fmt(a.energy, 0)} MJ</strong></div><div><span>Conditional result</span><strong>${esc(credit)}</strong></div></div><p class="note">${basis} ${a.ref ? "This reference has a different regulatory purpose and does not produce a credit estimate here." : "Crossing this reference does not establish programme eligibility or issue credits."}</p><div class="program-focus-actions"><a href="#program-detail-${esc(a.id)}" data-open-program="program-detail-${esc(a.id)}">Edit programme inputs ↗</a><a href="${esc(a.url)}" target="_blank" rel="noopener">Official source ↗</a></div></div>`;
}
function programPanel(r) {
  const c = (state.programs ??= PROGRAM.settings()),
    out = PROGRAM.comparePrograms(state, r, c);
  return `<section class="panel compact regulatory-insight"><h3>Regulatory benchmark comparison</h3><div class="grid">${select(
   "program_year",
   "Reporting year",
   [
     [2026, "2026"],
     [2027, "2027"],
   ],
   c.year,
 )}${select(
   "program_reference",
   "Displaced road fuel",
   [
     ["diesel", "Diesel"],
     ["gasoline", "Gasoline"],
   ],
   c.reference,
 )}</div><p class="note">Reference schedule review: 1 October 2026; Oregon road-fuel standards corrected 15 October 2026. Annual state standards and Canada’s section 94 liquid credit reference have different purposes. Each estimate uses its program CI and reporting energy. This shared modeled CI is an illustrative fallback.</p><div class="program-focus-selector"><label class="field">Focus on one programme<select id="programFocus">${out.rows.map((row) => `<option value="${esc(row.id)}" ${row.id === activeProgramId ? "selected" : ""}>${esc(row.name)}</option>`).join("")}</select></label><p>Programmes have different boundaries and purposes. Compare one at a time.</p></div><div id="programFocusContent">${programFocusMarkup(out, activeProgramId)}</div>
 ${out.rows.map((a) => `<details id="program-detail-${esc(a.id)}"><summary>${esc(a.name)} · ${fmt(a.benchmark, 2)} gCO₂e/MJ</summary><p class="note">${esc(a.kind)} · <a href="${a.url}" target="_blank" rel="noopener">Official source ↗</a></p><div class="grid">${numberField("program_" + a.id + "_share", "Eligible annual volume · %", c.rows[a.id].share, "Default 0. Enter eligible deliveries to this jurisdiction.", 0)}<label class="field">Program-specific CI · gCO₂e/MJ<input type="number" step="any" id="program_${a.id}_ci" value="${c.rows[a.id].ci ?? ""}" placeholder="Modeled CI"><small>Blank uses screening CI. Enter the approved / reporting-method CI.</small></label>${numberField("program_" + a.id + "_energyFactor", "Reporting energy / modeled LHV energy", c.rows[a.id].energyFactor, "Match the program’s prescribed energy density and basis.", 0)}</div><p class="note">Benchmark − program CI = ${fmt(a.delta, 3)} gCO₂e/MJ. Eligible reporting energy: ${fmt(a.energy, 0)} MJ.</p></details>`).join("")}
 ${out.errors.length ? `<p class="error-text" role="alert">${esc(out.errors.join(" "))}</p>` : ""}<div class="table-wrap"><table><thead><tr><th>Program</th><th>CI used</th><th>Conditional credits / deficits</th></tr></thead><tbody>${out.rows.map((a) => `<tr><td>${esc(a.name)}</td><td>${fmt(a.ci, 3)}</td><td>${out.errors.length ? "Check inputs" : a.supported ? fmt(a.credits, 2) + " tCO₂e" : a.ref ? "Benchmark comparison only (no credits)" : "Unsupported fuel"}</td></tr>`).join("")}</tbody></table></div><p class="note">Supported estimates: renewable diesel, biodiesel and ethanol, road-fuel displacement with EER = 1; Canada liquid class under section 94. Positive = potential credits, negative = signed deficit comparison. No credits are issued here. Other fuels need a dedicated pathway method. These jurisdictional alternatives are not summed; do not allocate the same delivered volume to multiple jurisdictions.</p>
 <h3>Credit sensitivity to CI</h3>${out.errors.length ? "" : curve(out.rows, r)}<p class="note">Fixed eligible reporting energy. Each 1 gCO₂e/MJ reduction adds eligible MJ ÷ 1,000,000 tonnes of potential credits.</p></section>
 <section class="panel compact"><h3>U.S. RFS · RIN estimate</h3><p class="note">RINs are calculated separately from CI credits. CI reductions do not change the RIN quantity for a fixed approved pathway, factor and eligible quantity.</p><div class="grid">${numberField("program_rfsShare", "RFS eligible quantity · %", c.rfsShare, "Requires approved pathway, registration and eligible fuel use.", 0)}${select(
   "program_dcode",
   "Approved pathway D-code",
   [
     ["", "Select approved D-code"],
     ["D3", "D3"],
     ["D4", "D4"],
     ["D5", "D5"],
     ["D6", "D6"],
     ["D7", "D7"],
   ],
   c.dcode,
 )}${select(
   "program_evMode",
   "Equivalence value",
   [
     ["standard", "Rule-based factor"],
     ["custom", "EPA-approved custom factor"],
   ],
   c.evMode,
 )}${c.evMode === "custom" ? numberField("program_customEV", "Approved equivalence value", c.customEV, "Enter the actual EPA-approved factor.", 0) : ""}</div><p><strong>${out.errors.length ? "Check inputs" : out.rin?.rins != null ? fmt(out.rin.rins, 0) + " conditional RINs" : esc(out.rin?.rinError ?? "Unsupported fuel pathway")}</strong></p><p class="note">${out.rin?.ev != null ? "Factor: " + fmt(out.rin.ev, 3) + ". " : ""}D-code selection is a user assumption, not approval verification. Renewable diesel 2026 standard factor needs LHV ≥123,500 Btu/gal; otherwise supply an approved alternative. RNG uses eligible LHV MJ ÷ (77,000 Btu × 0.00105505585262). <a href="https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-80/subpart-M/section-80.1415" target="_blank" rel="noopener">RIN rules ↗</a></p></section>`;
}
function download(name, content, type) {
  if (window.parent === window) {
    $("status").textContent =
      "Open this calculator through the CI Workspace page to download reports.";
    return;
  }
  window.parent.postMessage(
    { type: "civanta-ci-text-export", name, content, mime: type },
    window.location.origin,
  );
  $("status").textContent = "Preparing report…";
}
function valid() {
  const r = assess(state);
  if (r.errors.length) {
    const activityError =
      state.entryMode === "activity"
        ? activityToCi(state.activityData, state.annualVolume * state.energyDensity).errors[0]
        : null;
    showInputErrors = true;
    const issues = markInvalidFields();
    $("status").textContent = issues.length
      ? `Complete ${issues.length} highlighted ${issues.length === 1 ? "field" : "fields"} first.`
      : activityError || "Review the selected pathway and calculation settings.";
    focusFirstInvalid(issues);
    return null;
  }
  return r;
}
$("baseline").addEventListener("click", () => {
  if (!valid()) return;
  baseline = structuredClone(state);
  resultsNow();
  $("baseline").textContent = "Replace baseline";
  $("status").textContent = "Baseline captured. Change an input to compare.";
});
function clearCalculatedView() {
  ran = false;
  dirty = false;
  showInputErrors = false;
  lastFloatingSummary = null;
  lastSavedSnapshot = null;
  pendingFloatingInput = null;
  $("processFlow").innerHTML = "";
}
function selectPathway(pathwayId) {
  if (pathwayId === state.pathwayId) return;
  // Pathway-specific example data is safer than carrying another fuel's inputs.
  // Keep Clear inputs as the explicit way to start from an empty scenario.
  state = newScenario(pathwayId, state.region);
  baseline = null;
  $("baseline").textContent = "Use as baseline";
  clearCalculatedView();
  render();
  $("status").textContent =
    "Illustrative example values loaded. Review and replace them with your data.";
}
$("reset").addEventListener("click", () => {
  state = blankScenario(state.pathwayId, state.region);
  baseline = null;
  $("baseline").textContent = "Use as baseline";
  clearCalculatedView();
  render();
  $("status").textContent = "Inputs cleared. Enter your values or fill with default values.";
});
$("fill-defaults").addEventListener("click", () => {
  state = newScenario(state.pathwayId, state.region);
  prepareInputModes();
  clearCalculatedView();
  render();
  $("status").textContent =
    "Default values filled. Review the inputs.";
});
const HIST_KEY = "gbw-ci-workspace-history-v1";
function histLoad() {
  try {
    const h = JSON.parse(localStorage.getItem(HIST_KEY));
    return Array.isArray(h) ? h : [];
  } catch {
    return [];
  }
}
function histSave(h) {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 100)));
    return true;
  } catch {
    return false;
  }
}
function histRecord() {
  const r = assess(state);
  if (r.errors.length) return;
  const h = histLoad(),
    snap = JSON.stringify(state);
  h.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    at: new Date().toISOString(),
    name: runName(),
    pathway: r.pathway.label,
    ci: r.ciTotal,
    state: JSON.parse(snap),
  });
  if (!histSave(h))
    $("status").textContent = "Run history could not be saved (browser storage unavailable).";
  histRender();
}
function histRender() {
  const h = histLoad(),
    el = $("runHistory");
  if (!el) return;
  el.innerHTML =
    `<h3>Saved scenarios <small class="note">(${h.length} on this device)</small></h3>` +
    (h.length
      ? `<div class="table-wrap"><table><thead><tr><th>Run</th><th>Pathway</th><th>CI (gCO₂e/MJ)</th><th>When</th><th></th></tr></thead><tbody>${h.map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.pathway)}</td><td>${fmt(x.ci, 3)}</td><td>${esc(new Date(x.at).toLocaleString())}</td><td style="white-space:nowrap"><button type="button" data-hist-restore="${esc(x.id)}">Restore</button> <button type="button" data-hist-del="${esc(x.id)}" aria-label="Delete run">Delete</button></td></tr>`).join("")}</tbody></table></div><p><button type="button" data-hist-csv>Download history (CSV)</button> <button type="button" data-hist-clear>Clear all</button></p>`
      : '<p class="note">No saved scenarios yet.</p>');
}
document.addEventListener("click", (e) => {
  const t =
    e.target.closest &&
    e.target.closest(
      "[data-hist-restore],[data-hist-del],[data-hist-clear],[data-hist-csv]",
    );
  if (!t) return;
  const h = histLoad();
  if (t.dataset.histRestore) {
    const x = h.find((y) => y.id === t.dataset.histRestore);
    if (!x) return;
    state = structuredClone(x.state);
    lastSavedSnapshot = JSON.stringify(state);
    render();
    resultsNow();
    $("status").textContent = 'Run "' + x.name + '" restored.';
  } else if (t.dataset.histDel !== undefined) {
    histSave(h.filter((y) => y.id !== t.dataset.histDel));
    histRender();
  } else if (t.hasAttribute("data-hist-clear")) {
    if (confirm("Delete all saved runs on this device?")) {
      histSave([]);
      histRender();
    }
  } else if (t.hasAttribute("data-hist-csv")) {
    if (!proAccess) {
      requestUpgrade();
      return;
    }
    const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    download(
      "ci-run-history.csv",
      [
        "Run,Pathway,CI gCO2e/MJ,Run at (UTC)",
        ...h.map((x) => [q(x.name), q(x.pathway), x.ci, q(x.at)].join(",")),
      ].join("\n"),
      "text/csv",
    );
  }
});
histRender();
$("export").addEventListener("click", () => {
  if (!proAccess) {
    requestUpgrade();
    return;
  }
  const r = valid();
  if (!r) return;
  const payload = buildWorkspacePayload(state, r, baseline);
  if (window.parent === window) {
    $("status").textContent =
      "Open this calculator through the CI Workspace page to export the Excel workbook.";
    return;
  }
  window.parent.postMessage({ type: "civanta-ci-export", payload }, window.location.origin);
  $("status").textContent = "Preparing Excel workbook…";
});
window.addEventListener("message", (event) => {
  if (
    event.source === window.parent &&
    event.origin === window.location.origin &&
    event.data?.type === "civanta-ci-export-status"
  )
    $("status").textContent = event.data.message;
});
let browserDraft = null;
try {
  browserDraft = readDraft(localStorage, "gbw-ci-workspace-v1", (draft) => {
    const candidate = draft?.state;
    return (
      candidate &&
      typeof candidate === "object" &&
      (candidate.pathwayId === "rng-dairy" || PRESETS.some((p) => p.id === candidate.pathwayId)) &&
      candidate.energy &&
      candidate.factors &&
      candidate.direct &&
      ELECTRICITY_REGIONS.some((r) => r.id === candidate.region) &&
      (candidate.pathwayId !== "rng-dairy" || candidate.dairy?.inventory?.livestock)
    );
  });
} catch {
  /* Storage may be disabled in this browser. */
}
if (browserDraft) {
  state = browserDraft.state;
  baseline =
    browserDraft.baseline && !assess(browserDraft.baseline).errors.length
      ? browserDraft.baseline
      : null;
  const savedUi = browserDraft.ui;
  if (savedUi && CI_UNITS[savedUi.ci] && MASS_UNITS[savedUi.mass]) Object.assign(ui, savedUi);
  $("baseline").textContent = baseline ? "Replace baseline" : "Use as baseline";
}
render();
if (browserDraft?.hadRun) {
  resultsNow();
}
const persistDraft = attachAutosave({
  key: "gbw-ci-workspace-v1",
  snapshot: () => ({ state, baseline, ui, hadRun: ran }),
  pending: browserDraft?.pending,
  restored: Boolean(browserDraft),
});
if (window.parent !== window && typeof ResizeObserver !== "undefined")
  new ResizeObserver(() =>
    window.parent.postMessage(
      { type: "civanta-ci-height", height: document.documentElement.scrollHeight },
      location.origin,
    ),
  ).observe(document.body);

// Live calculation never writes history. Only the named save action does.
function persistScenario(name) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) return;
  state.name = name.trim();
  const r = assess(state);
  if (r.errors.length) {
    resultsNow(true);
    return;
  }
  histRecord();
  lastSavedSnapshot = JSON.stringify(state);
  resultsNow();
  $("status").textContent = `Saved “${state.name}”.`;
  window.parent.postMessage(
    {
      type: "civanta-history-save",
      payload: {
        kind: "ci",
        name: runName(),
        pathway: r.pathway.label,
        snapshot: JSON.stringify({
          state: structuredClone(state),
          baseline: baseline ? structuredClone(baseline) : null,
        }),
        metrics: { ci: r.ciTotal, lcfs: null, rins: null, value: null },
      },
    },
    location.origin,
  );
}
window.addEventListener("message", (e) => {
  if (e.source === window.parent && e.origin === location.origin && e.data?.type === "civanta-save-confirm" && e.data.kind === "ci") {
    if (pendingFloatingInput?.isConnected) pendingFloatingInput.dispatchEvent(new Event("change", { bubbles: true }));
    pendingFloatingInput = null;
    persistScenario(e.data.name);
    return;
  }
  if (
    e.source === window.parent &&
    e.origin === location.origin &&
    e.data?.type === "civanta-floating-sync-request"
  ) {
    if (publishedFloatingSummary) floatingSummary(publishedFloatingSummary);
    window.parent.postMessage(
      { type: "civanta-ci-height", height: document.documentElement.scrollHeight },
      location.origin,
    );
    return;
  }
  if (
    e.source === window.parent &&
    e.origin === location.origin &&
    e.data?.type === "civanta-floating-save-request"
  ) {
    if (pendingFloatingInput?.isConnected)
      pendingFloatingInput.dispatchEvent(new Event("change", { bubbles: true }));
    pendingFloatingInput = null;
    $("save").click();
    return;
  }
  if (
    e.source === window.parent &&
    e.origin === location.origin &&
    e.data?.type === "civanta-history-ping"
  ) {
    window.parent.postMessage({ type: "civanta-history-ready" }, location.origin);
    return;
  }
  if (
    e.source !== window.parent ||
    e.origin !== location.origin ||
    e.data?.type !== "civanta-history-restore" ||
    e.data.kind !== "ci"
  )
    return;
  const reply = (message) =>
    window.parent.postMessage(
      { type: "civanta-history-restored", requestId: e.data.requestId, message },
      location.origin,
    );
  try {
    const snap = e.data.snapshot;
    if (!snap?.state || typeof snap.state !== "object") throw new Error("Invalid saved scenario.");
    state = structuredClone(snap.state);
    lastSavedSnapshot = JSON.stringify(state);
    baseline =
      snap.baseline && !assess(snap.baseline).errors.length ? structuredClone(snap.baseline) : null;
    $("baseline").textContent = baseline ? "Replace baseline" : "Use as baseline";
    render();
    persistDraft();
    const result = assess(state);
    resultsNow();
    const message = result.errors.length
      ? "Inputs restored. Review the highlighted values before calculating."
      : "Inputs restored and recalculated with the current model. The original run remains in your history.";
    $("status").textContent = message;
    reply(message);
  } catch {
    $("status").textContent = "Could not restore these saved inputs.";
    reply("Could not restore these saved inputs.");
  }
});
window.parent.postMessage({ type: "civanta-history-ready" }, location.origin);
