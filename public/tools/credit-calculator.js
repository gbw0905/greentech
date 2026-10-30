import { createManualRun } from "./manual-run.mjs";
import { readDraft, attachAutosave } from "./browser-draft.mjs";
import {
  VERSION,
  BTU_TO_MJ,
  LITRES_PER_US_GALLON,
  FUELS,
  SOURCES,
  defaults,
  standardEV,
  calculate,
} from "./credit-engine.mjs";
const $ = (id) => document.getElementById(id);
let proAccess = false;
function requestUpgrade() {
  if (window.parent !== window) window.parent.postMessage({ type: "civanta-upgrade-request" }, location.origin);
  else location.assign("/auth?next=%2Fpricing");
}
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== "civanta-plan-state") return;
  proAccess = event.data.premium === true;
  document.body.dataset.plan = proAccess ? "pro" : "free";
  $("export").textContent = proAccess ? "Download Excel" : "Pro · Download Excel";
  results();
});
if (window.parent !== window) window.parent.postMessage({ type: "civanta-access-request" }, location.origin);
document.getElementById("credit-pro-cta")?.addEventListener("click", requestUpgrade);
let state = defaults();
let committedSnapshot = null;
let publishedFloatingSummary = null;
const fmt = (n, d = 0) =>
  n == null ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
const money = (n) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);
function floatingSummary(r, forcedState) {
  if (window.parent === window) return;
  const invalid = r.errors.length || r.rinError;
  const stateLabel = forcedState || (invalid ? "invalid" : committedSnapshot === JSON.stringify(state) ? "current" : "preview");
  if (forcedState === "ready" || forcedState === "running") {
    publishedFloatingSummary = { value: "—", unit: "", detail: forcedState === "running" ? "Calculating your scenario" : "Select Run to calculate", state: forcedState };
    window.parent.postMessage({ type: "civanta-floating-summary", kind: "credit", summary: publishedFloatingSummary, height: document.documentElement.scrollHeight }, location.origin);
    return;
  }
  const both = state.mode === "both";
  const value = invalid
    ? "—"
    : both && r.combined !== null
      ? money(r.combined)
      : state.mode !== "rfs"
        ? fmt(Math.abs(r.lcfsTonnes), 2)
        : fmt(r.rins);
  const unit = invalid ? "" : both && r.combined !== null ? "USD gross" : state.mode !== "rfs" ? "tonnes CO₂e" : "RINs";
  const summary = {
    value,
    unit,
    detail: invalid ? r.errors[0] || r.rinError : `${FUELS[state.fuel].name} · ${state.year}`,
    state: stateLabel,
  };
  publishedFloatingSummary = summary;
  window.parent.postMessage(
    {
      type: "civanta-floating-summary",
      kind: "credit",
      summary,
      height: document.documentElement.scrollHeight,
    },
    location.origin,
  );
}
let pendingFloatingInput = null;
document.addEventListener("input", (event) => {
  if (!event.target.matches?.("#inputs input, #inputs select")) return;
  pendingFloatingInput = event.target;
  manualRun.invalidate();
  if (publishedFloatingSummary)
    window.parent.postMessage(
      {
        type: "civanta-floating-summary",
        kind: "credit",
        summary: { ...publishedFloatingSummary, detail: "Updating inputs", state: "stale" },
        height: document.documentElement.scrollHeight,
      },
      location.origin,
    );
});
document.addEventListener("change", (event) => {
  if (event.target === pendingFloatingInput) pendingFloatingInput = null;
});
function field(id, label, value, help = "", min = "", step = "any") {
  return `<label class="field">${label}<input id="${id}" type="number" value="${value}" step="${step}" ${min !== "" ? `min="${min}"` : ""}><small>${help}</small></label>`;
}
function select(id, label, options, value, help = "") {
  return `<label class="field">${label}<select id="${id}">${options.map(([v, t]) => `<option value="${v}" ${v === String(value) ? "selected" : ""}>${t}</option>`).join("")}</select><small>${help}</small></label>`;
}
function render() {
  setMode();
  const rng = state.fuel === "rng",
    lcfs = state.mode !== "rfs",
    rfs = state.mode !== "lcfs";
  $("inputs").innerHTML =
    `<section class="panel"><div class="section-title"><span class="step">01</span><h2>Fuel & reporting period</h2></div><div class="grid">${select(
      "fuel",
      "Fuel",
      Object.entries(FUELS).map(([k, v]) => [k, v.name]),
      state.fuel,
    )}${select(
      "year",
      "Compliance year",
      [
        ["2026", "2026"],
        ["2027", "2027"],
      ],
      state.year,
    )}${field("quantity", "Renewable fuel quantity", state.quantity, "For the period being assessed; liquids standardized to 60°F. Exclude fossil blend volume.", 0)}${select(
      "unit",
      "Quantity unit",
      rng
        ? [
            ["MMBtu", "MMBtu"],
            ["MJ", "MJ"],
          ]
        : [
            ["gal", "US gallons"],
            ["litre", "Litres"],
          ],
      state.unit,
    )}${
      rng
        ? select(
            "basis",
            "Reported energy basis",
            [
              ["LHV", "Lower heating value (LHV)"],
              ["HHV", "Higher heating value (HHV)"],
            ],
            state.basis,
          )
        : field(
            "energy",
            "Fuel energy · MJ / US gallon",
            state.energy,
            "Illustrative preset. Replace with the reporting energy density applicable to your fuel.",
            0,
          )
    }${rng && state.basis === "HHV" ? field("hhvToLhv", "LHV / HHV ratio", state.hhvToLhv, "Illustrative 0.90. Supply the factor for your gas composition.", 0) : ""}</div></section>
 ${
   lcfs
     ? `<section class="panel"><div class="section-title"><span class="step">02</span><h2>California LCFS</h2></div><div class="grid">${field("ci", "Pathway CI · gCO₂e/MJ", state.ci, "Use the applicable certified CI for reporting, or a modeled CI for planning. Negative CI is supported.")}${select(
         "reference",
         "Displaced fuel",
         [
           ["diesel", "Diesel"],
           ["gasoline", "Gasoline"],
         ],
         state.reference,
         "Match your vehicle/end-use category.",
       )}${select(
         "benchmarkMode",
         "Benchmark source",
         state.year === 2026
           ? [
               ["preset", "CARB 2026 benchmark"],
               ["custom", "Enter verified benchmark"],
             ]
           : [["custom", "Enter verified 2027 benchmark"]],
         state.benchmarkMode,
       )}${field("benchmark", "Annual benchmark · gCO₂e/MJ", state.benchmark, state.benchmarkMode === "preset" ? "2026: gasoline 75.16; diesel 80.17." : "Verify the current annual benchmark with CARB.", 0)}${rng ? field("lcfsBasisFactor", "LCFS energy basis multiplier", state.lcfsBasisFactor, "Reported gas energy × multiplier = LCFS reporting energy. Confirm CARB energy-density basis independently of the RFS LHV factor.", 0) : ""}${field("eer", "Energy economy ratio (EER)", state.eer, "1.0 for this liquid-fuel example. Verify the vehicle/fuel EER; do not use an already EER-adjusted CI.", 0)}${field("lcfsShare", "Quantity eligible for LCFS · %", state.lcfsShare, "Share delivered for qualifying California use. Do not use all production automatically.", 0)}${field("lcfsPrice", "LCFS credit price · USD / tonne", state.lcfsPrice, "User price assumption; no live market feed.", 0)}</div><label class="check"><input id="lcfsConfirmed" type="checkbox" ${state.lcfsConfirmed ? "checked" : ""}>I have confirmed the pathway, qualifying delivery/use, and entitlement for this scenario.</label></section>`
     : ""
 }
 ${
   rfs
     ? `<section class="panel"><div class="section-title"><span class="step">03</span><h2>U.S. RFS · RINs</h2></div><div class="grid">${select(
         "dcode",
         "Registered pathway D-code",
         [
           ["", "Select approved pathway D-code"],
           ["D3", "D3 · Cellulosic biofuel"],
           ["D4", "D4 · Biomass-based diesel"],
           ["D5", "D5 · Advanced biofuel"],
           ["D6", "D6 · Renewable fuel"],
           ["D7", "D7 · Cellulosic diesel"],
         ],
         state.dcode,
         "Choose from the approved registration; fuel name or CI does not assign a D-code.",
       )}${field("rfsShare", "Quantity eligible for RFS · %", state.rfsShare, "Share qualifying under the approved RFS pathway and use. Exclude non-qualifying quantity.", 0)}${
         !rng
           ? select(
               "evMode",
               "Equivalence value source",
               [
                 ["standard", "Year-specific standard factor"],
                 ["custom", "EPA-approved alternative factor"],
               ],
               state.evMode,
             )
           : ""
       }${!rng && state.evMode === "custom" ? field("customEV", "Approved RINs / gallon", state.customEV, "Enter the equivalence value in your EPA approval.", 0) : `<div class="factor"><small>${rng ? "RNG LHV conversion" : "Year-specific equivalence value"}</small><strong>${rng ? "77,000 Btu / RIN" : standardEV(state.fuel, state.year) + " RINs / gallon"}</strong><small>${state.fuel === "rd" && state.year === 2026 ? "The 1.7 factor requires LHV ≥ 123,500 Btu/gal." : state.fuel === "rd" ? "2027 standard factor: 1.5. Alternative values require EPA approval." : "Confirm all applicable pathway and fuel requirements."}</small></div>`}${field("rinPrice", "Selected D-code price · USD / RIN", state.rinPrice, "User price assumption; match D-code, vintage and transaction terms.", 0)}</div><label class="check"><input id="rfsConfirmed" type="checkbox" ${state.rfsConfirmed ? "checked" : ""}>I have confirmed the approved pathway, registration, qualifying use, and entitlement.</label><p class="note">The calculator estimates quantities. It does not generate serial RINs, assign an EPA pathway, or submit to EMTS.</p></section>`
     : ""
 }`;
  if (state.benchmarkMode === "preset" && $("benchmark")) $("benchmark").readOnly = true;
  for (const el of $("inputs").querySelectorAll("input,select"))
    el.addEventListener("change", () => {
      const id = el.id;
      state[id] =
        el.type === "checkbox"
          ? el.checked
          : el.type === "number"
            ? el.value.trim() === ""
              ? NaN
              : Number(el.value)
            : el.value;
      if (id === "year") {
        state.year = Number(el.value);
        state.lcfsConfirmed = false;
        state.rfsConfirmed = false;
        if (state.year === 2027) {
          state.benchmarkMode = "custom";
          state.benchmark = NaN;
        } else {
          state.benchmarkMode = "preset";
          state.benchmark = state.reference === "gasoline" ? 75.16 : 80.17;
        }
      }
      if (id === "fuel") {
        const f = FUELS[state.fuel];
        state.energy = f.energy;
        state.ci = f.exampleCI;
        state.unit = state.fuel === "rng" ? "MMBtu" : "gal";
        state.quantity = state.fuel === "rng" ? 100000 : 1000000;
        state.reference = state.fuel === "ethanol" ? "gasoline" : "diesel";
        state.dcode = "";
        state.eer = 1;
        state.evMode = "standard";
        state.lcfsConfirmed = false;
        state.rfsConfirmed = false;
      }
      if (["reference", "fuel", "benchmarkMode"].includes(id) && state.benchmarkMode === "preset")
        state.benchmark = state.reference === "gasoline" ? 75.16 : 80.17;
      render();
    });
  results();
}
function results() { manualRun.update(); }
function renderResults() {
  $("results").classList.remove("show-result-animation");
  const r = calculate(state),
    lcfs = state.mode !== "rfs",
    rfs = state.mode !== "lcfs";
  if (r.errors.length) {
    $("results").innerHTML =
      `<section class="panel error" role="alert"><h2>Check your inputs</h2><ul>${r.errors.map((x) => `<li>${x}</li>`).join("")}</ul></section>`;
    floatingSummary(r);
    return;
  }
  $("results").innerHTML =
    ` ${lcfs ? `<section class="metric"><div><span>LCFS ${r.lcfsTonnes < 0 ? "deficits" : "credits"}</span><em>${state.lcfsConfirmed ? "User-confirmed assumptions" : "Conditional estimate"}</em></div><strong class="${r.lcfsTonnes < 0 ? "negative" : ""}">${fmt(Math.abs(r.lcfsTonnes), 2)}<small>tonnes CO₂e</small></strong><div class="metric-foot"><span>${r.lcfsTonnes < 0 ? "Estimated acquisition cost" : "Gross credit value"}</span><b>${money(Math.abs(r.lcfsValue))}</b></div></section>` : ""}
 ${rfs ? `<section class="metric"><div><span>RIN quantity ${state.dcode ? "· " + state.dcode : ""}</span><em>${state.rfsConfirmed ? "User-confirmed assumptions" : "Conditional estimate"}</em></div><strong>${fmt(r.rins)}<small>estimated gallon-RINs</small></strong>${r.rinError ? `<p class="note error-text">${r.rinError}</p>` : ""}<div class="metric-foot"><span>Gross RIN value</span><b>${money(r.rinValue)}</b></div></section>` : ""}
 ${state.mode === "both" ? `<section class="combined"><span>Combined gross value / net deficit cost</span><strong>${money(r.combined)}</strong><small>${r.combined === null ? "Confirm eligibility and entitlement for both programs to show a combined planning value." : "Assumes you hold both revenue streams. Excludes fees, taxes, revenue sharing and sale timing."}</small></section>` : ""}
 <section class="panel compact"><h3>Calculation trail</h3><dl><dt>Total fuel energy (LHV)</dt><dd>${fmt(r.energyMj, 2)} MJ</dd>${lcfs ? `<dt>LCFS-eligible energy</dt><dd>${fmt(r.lcfsEnergy, 2)} MJ</dd><dt>Benchmark × EER − pathway CI</dt><dd>${fmt(r.delta, 3)} gCO₂e/MJ</dd><dt>Signed credits / deficits</dt><dd>${fmt(r.lcfsTonnes, 4)} tonnes</dd>` : ""}${rfs ? `<dt>${state.fuel === "rng" ? "RNG energy per RIN" : "Equivalence value"}</dt><dd>${state.fuel === "rng" ? fmt(77000 * BTU_TO_MJ, 6) + " MJ LHV" : r.ev + " RINs/gal"}</dd>` : ""}</dl><details><summary>Equations & sources</summary><p>LCFS = (benchmark × EER − CI) × eligible fuel energy ÷ 1,000,000.</p><p>Liquid RIN estimate = eligible standardized renewable gallons × equivalence value. RNG RIN estimate = eligible biomethane Btu (LHV) ÷ 77,000.</p><p>Do not multiply the full CI difference by EER. Use an unadjusted pathway CI. Actual batch rounding and regulatory submissions are outside this planning estimate.</p>${SOURCES.map((x) => `<p><a href="${x.url}" target="_blank" rel="noopener noreferrer">${x.title} ↗</a></p>`).join("")}<p>Reviewed 1 October 2026 · Engine ${VERSION}. Energy-density and price presets are illustrative; the benchmark and equivalence values are source-based.</p></details></section>
 ${proAccess ? `<section class="panel compact pro-analysis"><h3>Price sensitivity</h3><p class="note">Quantity held constant; price assumptions ±25%.</p><table><thead><tr><th>Scenario</th>${lcfs ? "<th>LCFS value</th>" : ""}${rfs ? "<th>RIN value</th>" : ""}</tr></thead><tbody>${[
   ["Low", 0.75],
   ["Base", 1],
   ["High", 1.25],
 ]
   .map(
     ([label, m]) =>
       `<tr><td>${label}</td>${lcfs ? `<td>${money(r.lcfsValue * m)}</td>` : ""}${rfs ? `<td>${r.rinValue === null ? "—" : money(r.rinValue * m)}</td>` : ""}</tr>`,
   )
   .join("")}</tbody></table></section>` : ""}
 <section class="panel compact"><h3>Assumptions to review</h3><ul>${r.warnings.map((x) => `<li>${x}</li>`).join("")}<li>Confirm credit ownership and contracts separately for each program. A checkbox records your assumption; it is not verification.</li></ul></section>`;
  floatingSummary(r);
}
$("export").addEventListener("click", () => {
  if (!manualRun.isCurrent()) { $("status").textContent = "Select Run before downloading results."; return; }
  if (!proAccess) { requestUpgrade(); return; }
  const r = calculate(state);
  if (r.errors.length || r.rinError) {
    $("status").textContent = r.errors[0] || r.rinError;
    return;
  }
  if (window.parent !== window) {
    const { errors, ...res } = r;
    window.parent.postMessage(
      {
        type: "civanta-credit-export",
        payload: {
          version: VERSION,
          reviewed: "2026-10-01",
          state: JSON.parse(JSON.stringify(state)),
          result: res,
          warnings: r.warnings,
          sources: SOURCES,
          fuelName: FUELS[state.fuel].name,
        },
      },
      location.origin,
    );
    $("status").textContent = "Preparing Excel workbook…";
    return;
  }
  $("status").textContent = "Open this calculator through the Credit & RIN page to download reports.";
});
window.addEventListener("message", (e) => {
  if (
    e.source === window.parent &&
    e.origin === location.origin &&
    e.data?.type === "civanta-floating-sync-request"
  ) {
    if (publishedFloatingSummary)
      window.parent.postMessage(
        { type: "civanta-floating-summary", kind: "credit", summary: publishedFloatingSummary, height: document.documentElement.scrollHeight },
        location.origin,
      );
    window.parent.postMessage(
      { type: "civanta-credit-height", height: document.documentElement.scrollHeight },
      location.origin,
    );
    return;
  }
  if (
    e.source === window.parent &&
    e.origin === location.origin &&
    e.data?.type === "civanta-credit-export-status"
  )
    $("status").textContent = e.data.message;
});
$("reset").addEventListener("click", () => {
  manualRun.invalidate();
  state = defaults();
  state.dcode = "D4";
  render();
  $("status").textContent =
    "Illustrative 2026 renewable diesel example loaded. Eligibility is unconfirmed.";
});
for (const b of document.querySelectorAll("[data-mode]"))
  b.addEventListener("click", () => {
    manualRun.invalidate();
    state.mode = b.dataset.mode;
    setMode();
    render();
  });
function setMode() {
  for (const b of document.querySelectorAll("[data-mode]")) {
    b.classList.toggle("active", b.dataset.mode === state.mode);
    b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
  }
}
let browserDraft = null;
try {
  browserDraft = readDraft(localStorage, "gbw-credit-v1", (draft) => {
    const candidate = draft?.state ?? draft;
    return (
      candidate &&
      Object.hasOwn(FUELS, candidate.fuel) &&
      ["both", "lcfs", "rfs"].includes(candidate.mode)
    );
  });
  if (browserDraft) state = { ...defaults(), ...(browserDraft.state ?? browserDraft) };
} catch {
  /* Storage may be disabled in this browser. */
}
try {
  const q = new URLSearchParams(location.search);
  if (q.has("ci") && q.get("ci").trim() !== "" && Number.isFinite(Number(q.get("ci"))))
    state.ci = Number(q.get("ci"));
  if (
    q.has("quantity") &&
    Number(q.get("quantity")) >= 0 &&
    Number.isFinite(Number(q.get("quantity")))
  )
    state.quantity = Number(q.get("quantity"));
  if (q.has("fuel") && Object.hasOwn(FUELS, q.get("fuel"))) {
    state.fuel = q.get("fuel");
    state.energy = FUELS[state.fuel].energy;
    state.unit = state.fuel === "rng" ? "MMBtu" : "gal";
    state.reference = state.fuel === "ethanol" ? "gasoline" : "diesel";
    state.benchmark = state.reference === "gasoline" ? 75.16 : 80.17;
  }
  if (q.has("unit")) {
    const u = q.get("unit");
    const ok = state.fuel === "rng" ? ["MMBtu", "MJ"] : ["gal", "litre"];
    if (ok.includes(u)) state.unit = u;
  }
  if (
    q.has("energy") &&
    Number(q.get("energy")) > 0 &&
    Number.isFinite(Number(q.get("energy"))) &&
    state.fuel !== "rng"
  )
    state.energy = Number(q.get("energy"));
} catch {}
setMode();
function pendingResults() {
  $("results").innerHTML = '<section class="calculator-run-state"><span class="calculator-run-ready" aria-hidden="true">↗</span><h2>Ready to calculate</h2><p>Review your inputs, then select Run to see your results.</p></section>';
  floatingSummary({ errors: [] }, "ready");
}
const manualRun = createManualRun({
  target: $("results"),
  snapshot: () => JSON.stringify(state),
  render: renderResults,
  pending: pendingResults,
  onBusy: (busy) => { $("run").disabled = busy; $("run").textContent = busy ? "Running…" : "Run"; },
  onStart: () => floatingSummary({ errors: [] }, "running"),
});
function runCalculation() {
  if (pendingFloatingInput?.isConnected) pendingFloatingInput.dispatchEvent(new Event("change", { bubbles: true }));
  pendingFloatingInput = null;
  manualRun.run();
}
$("run").addEventListener("click", runCalculation);
window.addEventListener("message", (event) => {
  if (event.source === window.parent && event.origin === location.origin && event.data?.type === "civanta-floating-run-request") runCalculation();
});

render();
const inboundScenario = ["ci", "fuel", "quantity", "energy", "unit"].some((key) =>
  new URLSearchParams(location.search).has(key),
);
attachAutosave({
  key: "gbw-credit-v1",
  snapshot: () => ({ state }),
  pending: inboundScenario ? null : browserDraft?.pending,
  restored: Boolean(browserDraft) && !inboundScenario,
});
// Resize the optional same-origin React frame after edits and on mobile.
if (window.parent !== window && typeof ResizeObserver !== "undefined") {
  const observer = new ResizeObserver(() =>
    window.parent.postMessage(
      { type: "civanta-credit-height", height: document.documentElement.scrollHeight },
      location.origin,
    ),
  );
  observer.observe(document.body);
}

$("save").addEventListener("click", () => {
  if (!manualRun.isCurrent()) { $("status").textContent = "Select Run before saving this scenario."; return; }
  const r = calculate(state);
  results();
  if (r.errors.length) {
    $("status").textContent = r.errors[0];
    return;
  }
  if (r.rinError) {
    $("status").textContent = `${r.rinError} Choose LCFS credits only if you want to save that result without RINs.`;
    return;
  }
  window.parent.postMessage({ type: "civanta-save-request", kind: "credit", suggestedName: FUELS[state.fuel].name + " · " + state.year }, location.origin);
});
function persistScenario(name) {
  if (!manualRun.isCurrent()) { $("status").textContent = "Select Run before saving this scenario."; return; }
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) return;
  const r = calculate(state);
  if (r.errors.length || r.rinError) {
    $("status").textContent = r.errors[0] || r.rinError;
    results();
    return;
  }
  committedSnapshot = JSON.stringify(state);
  results();
  $("status").textContent = `Saved “${name.trim()}”.`;
  window.parent.postMessage(
    {
      type: "civanta-history-save",
      payload: {
        kind: "credit",
        name: name.trim(),
        pathway:
          state.mode === "both"
            ? "LCFS + RFS"
            : state.mode === "lcfs"
              ? "California LCFS"
              : "U.S. RFS RINs",
        snapshot: JSON.stringify({ state: structuredClone(state) }),
        metrics: {
          ci: state.mode === "rfs" ? null : state.ci,
          lcfs: r.lcfsTonnes,
          rins: r.rins,
          value:
            r.combined ??
            (state.mode === "lcfs" ? r.lcfsValue : state.mode === "rfs" ? r.rinValue : null),
        },
      },
    },
    location.origin,
  );
}
window.addEventListener("message", (e) => {
  if (e.source === window.parent && e.origin === location.origin && e.data?.type === "civanta-save-confirm" && e.data.kind === "credit") {
    if (pendingFloatingInput?.isConnected) pendingFloatingInput.dispatchEvent(new Event("change", { bubbles: true }));
    pendingFloatingInput = null;
    persistScenario(e.data.name);
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
    e.data.kind !== "credit"
  )
    return;
  const reply = (message) =>
    window.parent.postMessage(
      { type: "civanta-history-restored", requestId: e.data.requestId, message },
      location.origin,
    );
  try {
    const saved = e.data.snapshot?.state;
    if (!saved || typeof saved !== "object") throw new Error("Invalid saved scenario.");
    const result = calculate(saved);
    if (result.errors.length) {
      reply("Could not restore this run: " + result.errors[0]);
      return;
    }
    manualRun.invalidate();
    state = structuredClone(saved);
    committedSnapshot = JSON.stringify(state);
    render();
    $("status").textContent =
      "Inputs restored. Select Run to calculate. The original run remains in your history.";
    reply($("status").textContent);
  } catch {
    reply("Could not restore these saved inputs.");
  }
});
window.parent.postMessage({ type: "civanta-history-ready" }, location.origin);
