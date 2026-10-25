import { useState } from "react";
import { ArrowDownRight, Check, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumberField } from "./OptimizerInputs";
import { ProUpgrade } from "@/features/ci-workspace/ProUpgrade";
import {
  regulatoryRows,
  sensitivity,
  solveTarget,
  pathwayFor,
  type Analysis,
  type Inputs,
  type Scenario,
  type SolveFor,
} from "./engine";

const number = (value: number, digits = 2) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="opt-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{unit}</small>
    </div>
  );
}
function ScenarioTable({ rows, target }: { rows: Scenario[]; target: number }) {
  const [sort, setSort] = useState<{
    key: "ci" | "annualized" | "capex" | "netBenefit";
    asc: boolean;
  }>({ key: "ci", asc: true });
  return (
    <div className="opt-table-wrap">
      <table className="opt-table">
        <caption>Scenario comparison · Target {number(target)} gCO₂e/MJ</caption>
        <thead>
          <tr>
            <th scope="col">Scenario</th>
            {(
              [
                ["ci", "CI · g/MJ"],
                ["capex", "Capital · $"],
                ["annualized", "Annual cost · $"],
                ["netBenefit", "Net benefit · $/yr"],
              ] as const
            ).map(([key, label]) => (
              <th
                scope="col"
                key={key}
                aria-sort={sort.key === key ? (sort.asc ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => setSort({ key, asc: sort.key !== key || !sort.asc })}
                >
                  {label}
                  {sort.key === key ? (sort.asc ? " ↑" : " ↓") : ""}
                </button>
              </th>
            ))}
            <th scope="col">Target</th>
          </tr>
        </thead>
        <tbody>
          {[...rows]
            .sort((a, b) => (a[sort.key] - b[sort.key]) * (sort.asc ? 1 : -1))
            .map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  {row.name}
                  {row.pareto && <small className="opt-pareto">Pareto-efficient</small>}
                </th>
                <td>{number(row.ci)}</td>
                <td>{money(row.capex)}</td>
                <td>{money(row.annualized)}</td>
                <td>{money(row.netBenefit)}</td>
                <td>
                  <span className={`opt-badge ${row.feasible ? "good" : "muted"}`}>
                    {row.feasible ? "Meets" : "Above"}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
function CostPlot({ analysis, target }: { analysis: Analysis; target: number }) {
  const minCi = Math.min(...analysis.all.map((r) => r.ci), target) - 1;
  const maxCi = Math.max(...analysis.all.map((r) => r.ci), target) + 1;
  const minCost = Math.min(0, ...analysis.all.map((r) => r.annualized));
  const maxCost = Math.max(1, ...analysis.all.map((r) => r.annualized)) * 1.15;
  const x = (v: number) => 70 + ((v - minCi) / (maxCi - minCi)) * 600;
  const y = (v: number) => 280 - ((v - minCost) / (maxCost - minCost)) * 240;
  return (
    <svg
      className="opt-scatter"
      viewBox="0 0 720 340"
      role="img"
      aria-label="All sixteen scenarios plotted by carbon intensity and annualized cost"
    >
      {[0, 0.5, 1].map((fraction) => (
        <g key={fraction}>
          <line
            x1="70"
            x2="670"
            y1={y(minCost + (maxCost - minCost) * fraction)}
            y2={y(minCost + (maxCost - minCost) * fraction)}
            stroke="#dce6ed"
            strokeDasharray="4 6"
          />
          <text x="60" y={y(minCost + (maxCost - minCost) * fraction) + 4} textAnchor="end">
            {money(minCost + (maxCost - minCost) * fraction)}
          </text>
        </g>
      ))}
      <line x1={x(target)} x2={x(target)} y1="25" y2="280" stroke="#178a6b" strokeDasharray="5 5" />
      <text x={x(target)} y="18" textAnchor="middle">
        CI target
      </text>
      {analysis.all.map((row) => (
        <circle
          key={row.key}
          cx={x(row.ci)}
          cy={y(row.annualized)}
          r={row.key === analysis.focus.key ? 8 : 5}
          fill={row.key === analysis.focus.key ? "#178a6b" : row.pareto ? "#2866a0" : "#a3b7c4"}
          stroke="white"
          strokeWidth="2"
        >
          <title>
            {row.name}: {number(row.ci)} gCO₂e/MJ; annualized {money(row.annualized)}
          </title>
        </circle>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <text key={f} x={x(minCi + (maxCi - minCi) * f)} y="303" textAnchor="middle">
          {number(minCi + (maxCi - minCi) * f, 1)}
        </text>
      ))}
      <text x="370" y="332" textAnchor="middle">
        Carbon intensity · gCO₂e/MJ
      </text>
    </svg>
  );
}
function TargetSolver({ input }: { input: Inputs }) {
  const [variable, setVariable] = useState<SolveFor>("ng");
  const [renewable, setRenewable] = useState(0);
  const [rail, setRail] = useState(0);
  const result = solveTarget(input, variable, renewable, rail);
  const labels: Record<SolveFor, [string, string]> = {
    ng: ["Maximum process gas", "MJ/MJ fuel"],
    kwh: ["Maximum grid power", "kWh/MJ fuel"],
    km: ["Maximum haul distance", "km"],
    renewable: ["Minimum renewable power", "%"],
  };
  return (
    <section className="opt-target-solver">
      <div>
        <h3>Operating target solver</h3>
        <p>
          Hold the other operating inputs constant and solve one setpoint. Uses your target CI and
          baseline inputs, independently of the measure checkboxes.
        </p>
      </div>
      <div className="opt-solver-grid">
        <label className="opt-field">
          <span>Solve for</span>
          <select value={variable} onChange={(e) => setVariable(e.target.value as SolveFor)}>
            {Object.entries(labels).map(([key, [label]]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <NumberField
          label="Renewable electricity share"
          unit="%"
          value={renewable}
          min={0}
          max={100}
          onChange={(v) => setRenewable(Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0)}
        />
        <NumberField
          label="Rail share of haul"
          unit="%"
          value={rail}
          min={0}
          max={100}
          onChange={(v) => setRail(Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0)}
        />
      </div>
      <div className={`opt-solver-answer ${result.feasible ? "" : "unavailable"}`}>
        <Target size={24} />
        <div>
          <small>{labels[variable][0]}</small>
          <strong>
            {result.value === null
              ? "No finite setpoint"
              : number(result.value, variable === "ng" || variable === "kwh" ? 4 : 2)}{" "}
            <span>{result.value === null ? "" : labels[variable][1]}</span>
          </strong>
          <p>{result.message}</p>
        </div>
      </div>
    </section>
  );
}
export function OptimizerResults({
  input,
  analysis,
  premium,
}: {
  input: Inputs;
  analysis: Analysis;
  premium: boolean;
}) {
  const [swing, setSwing] = useState(20);
  const focus = analysis.focus;
  const reduction =
    analysis.baseline.ci > 0
      ? ((analysis.baseline.ci - focus.ci) / analysis.baseline.ci) * 100
      : null;
  const sens = sensitivity(input, focus.measures, swing);
  const impact = Math.max(1, ...sens.flatMap((r) => [Math.abs(r.nbLo), Math.abs(r.nbHi)]));
  return (
    <div className="opt-results">
      <section className="opt-recommendation" aria-label="Optimizer recommendation">
        <div className="opt-recommend-top">
          <span>
            <Target size={16} />{" "}
            {analysis.recommended
              ? "LEAST-COST PLAN THAT MEETS YOUR TARGET"
              : "LOWEST CI AVAILABLE"}
          </span>
          <span className="opt-plan-status">
            {analysis.recommended ? (
              <>
                <Check size={13} /> Feasible
              </>
            ) : (
              "Target not reached"
            )}
          </span>
        </div>
        <h2>
          {number(focus.ci)} <span>gCO₂e/MJ</span>
        </h2>
        <p>{focus.name}</p>
        <div className="opt-plan-baseline">
          <span>
            Baseline <b>{number(analysis.baseline.ci)}</b>
          </span>
          <span>
            Target <b>{number(input.target)}</b>
          </span>
          <span>
            <ArrowDownRight size={15} />
            {reduction === null
              ? `${number(analysis.baseline.ci - focus.ci)} g/MJ reduction`
              : `${number(reduction, 1)}% lower CI`}
          </span>
        </div>
        {!analysis.recommended && (
          <p className="opt-plan-warning">
            None of the 16 combinations meets this target. Review the target, operating inputs or
            available measures.
          </p>
        )}
      </section>
      <div className="opt-metrics">
        <Metric label="Capital required" value={money(focus.capex)} unit="one-time investment" />
        <Metric label="Incremental opex" value={money(focus.opex)} unit="per year vs baseline" />
        <Metric
          label="Annualized cost"
          value={money(focus.annualized)}
          unit="capital recovery + opex"
        />
        <Metric
          label="Credit value"
          value={money(focus.creditValue)}
          unit="conditional gross USD/year"
        />
        <Metric label="Net benefit" value={money(focus.netBenefit)} unit="per year vs baseline" />
        <Metric
          label="Scenarios compared"
          value="16"
          unit={`${analysis.all.filter((s) => s.pareto).length} Pareto-efficient combinations`}
        />
      </div>
      <Tabs defaultValue="overview" className="opt-analysis">
        <TabsList className="opt-tabs" aria-label="Optimizer analysis">
          {[
            ["overview", "Overview"],
            ["cost", premium ? "Cost & CI" : "Cost & CI · Pro"],
            ["optimization", premium ? "Optimization" : "Optimization · Pro"],
            ["sensitivity", premium ? "Sensitivity" : "Sensitivity · Pro"],
            ["regulatory", "Regulatory"],
            ["evidence", "Evidence"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value!}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="opt-tab-content">
          <h3>Your route to a lower CI</h3>
          <p>
            Measures applied in merit order. Each step is its marginal contribution, so the
            reductions reconcile with the final CI.
          </p>
          <div className="opt-waterfall">
            <div className="opt-waterfall-row">
              <span>Baseline</span>
              <b>{number(analysis.baseline.ci, 3)}</b>
            </div>
            {analysis.waterfall.map((step) => (
              <div className="opt-waterfall-row" key={step.name}>
                <span>
                  <i /> {step.name}
                </span>
                <strong>{number(step.delta, 3)}</strong>
                <small>→ {number(step.to, 3)}</small>
              </div>
            ))}
            <div className="opt-waterfall-row final">
              <span>{analysis.recommended ? "Recommended CI" : "Lowest achievable CI"}</span>
              <b>{number(focus.ci, 3)}</b>
            </div>
          </div>
          <div className="opt-selection">
            <span>YOUR SELECTION</span>
            <h4>{analysis.user.name}</h4>
            <div>
              <b>
                {number(analysis.user.ci)} <small>gCO₂e/MJ</small>
              </b>
              <span className={`opt-badge ${analysis.user.feasible ? "good" : "muted"}`}>
                {analysis.user.feasible ? "Meets your target" : "Above your target"}
              </span>
            </div>
            <p>
              {money(analysis.user.annualized)} annualized cost · {money(analysis.user.netBenefit)}{" "}
              net annual benefit
            </p>
          </div>
          <h3>Abatement cost ranking</h3>
          <p>
            Each measure on its own, relative to baseline. Lower cost per tonne is better; negative
            cost indicates modeled savings.
          </p>
          <div className="opt-table-wrap">
            <table className="opt-table">
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  <th scope="col">CI reduction</th>
                  <th scope="col">Avoided t/year</th>
                  <th scope="col">Cost · $/tonne</th>
                </tr>
              </thead>
              <tbody>
                {analysis.mac.map((m) => (
                  <tr key={m.id}>
                    <th scope="row">{m.name}</th>
                    <td>{number(m.dCi, 3)}</td>
                    <td>{number(m.avoidedT, 1)}</td>
                    <td>{m.mac === null ? "No CI reduction" : money(m.mac)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="cost" className="opt-tab-content">
          {premium ? (
            <>
              <h3>Cost versus carbon intensity</h3>
              <p>
                Green is the recommended plan; blue marks Pareto-efficient choices. Compare every
                combination in the table below.
              </p>
              <CostPlot analysis={analysis} target={input.target} />
              <ScenarioTable rows={analysis.all} target={input.target} />
            </>
          ) : (
            <ProUpgrade
              title="Compare cost and CI together"
              detail="Explore all measure combinations on an interactive chart and sortable table."
            />
          )}
        </TabsContent>
        <TabsContent value="optimization" className="opt-tab-content">
          {premium ? (
            <>
              <h3>Find your operating setpoint</h3>
              <TargetSolver input={input} />
              <h3>All measure combinations</h3>
              <p>
                Sort by CI, capital, annualized cost or net benefit. The recommendation minimizes
                annualized cost among the scenarios that meet your target.
              </p>
              <ScenarioTable rows={analysis.all} target={input.target} />
            </>
          ) : (
            <ProUpgrade
              title="Solve for the operating target"
              detail="Find a workable setpoint and compare every measure combination."
            />
          )}
        </TabsContent>
        <TabsContent value="sensitivity" className="opt-tab-content">
          {premium ? (
            <>
              <div className="opt-heading-inline">
                <div>
                  <h3>What changes the outcome?</h3>
                  <p>
                    One assumption changes at a time. Measures stay fixed to the recommended plan.
                  </p>
                </div>
                <NumberField
                  label="Sensitivity range"
                  unit="± %"
                  value={swing}
                  min={0}
                  max={100}
                  onChange={(v) => setSwing(Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0)}
                />
              </div>
              <div className="opt-sensitivity">
                {sens.map((r) => (
                  <div key={r.key}>
                    <span>{r.label}</span>
                    <div className="opt-sensitivity-track">
                      <i style={{ width: `${(Math.abs(r.nbLo) / impact) * 46}%` }} />
                      <b style={{ width: `${(Math.abs(r.nbHi) / impact) * 46}%` }} />
                    </div>
                    <small>
                      {money(r.nbLo)} / {money(r.nbHi)}
                    </small>
                  </div>
                ))}
              </div>
              <div className="opt-table-wrap">
                <table className="opt-table">
                  <caption>
                    Change versus the unvaried recommended scenario · −{swing}% / +{swing}%
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Assumption</th>
                      <th scope="col">Δ CI low</th>
                      <th scope="col">Δ CI high</th>
                      <th scope="col">Δ net low · $/yr</th>
                      <th scope="col">Δ net high · $/yr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sens.map((r) => (
                      <tr key={r.key}>
                        <th scope="row">{r.label}</th>
                        <td>{number(r.ciLo, 3)}</td>
                        <td>{number(r.ciHi, 3)}</td>
                        <td>{money(r.nbLo)}</td>
                        <td>{money(r.nbHi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <ProUpgrade
              title="Understand what changes the outcome"
              detail="Test the sensitivity of costs and carbon intensity to your assumptions."
            />
          )}
        </TabsContent>
        <TabsContent value="regulatory" className="opt-tab-content">
          <h3>Regulatory context</h3>
          <p>
            2026 reference values from the existing CI Workspace. A positive gap is a numerical
            comparison; it does not establish pathway eligibility, certification or credit
            entitlement. Fuel type, energy basis, EER and program-specific boundaries still need
            review.
          </p>
          <div className="opt-regulatory">
            {regulatoryRows(input, focus.ci).map((r) => (
              <article key={r.id}>
                <div>
                  <h4>{r.name}</h4>
                  <p>{r.kind}</p>
                </div>
                <dl>
                  <div>
                    <dt>Reference CI</dt>
                    <dd>{number(r.benchmark)}</dd>
                  </div>
                  <div>
                    <dt>Gap · g/MJ</dt>
                    <dd>{number(r.gap)}</dd>
                  </div>
                  <div>
                    <dt>Relative saving</dt>
                    <dd>{number(r.saving, 1)}%</dd>
                  </div>
                </dl>
                <a href={r.url} target="_blank" rel="noreferrer">
                  Program source ↗
                </a>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="evidence" className="opt-tab-content">
          <h3>Model evidence & assumptions</h3>
          <p>
            The GBW-owned optimizer’s screening model, with the same 43 pathway presets and four
            measures. Imported 15 October 2026. Defaults are illustrative, not plant measurements.
          </p>
          <div className="opt-evidence">
            <article>
              <h4>Lifecycle contribution</h4>
              <p>
                CI = fixed pathway term × feedstock factor + gas × 63 + electricity × grid CI + haul
                distance × feedstock mass × haul factor.
              </p>
              <dl>
                {Object.entries({
                  "Fixed pathway term": focus.parts.fixed,
                  "Process gas": focus.parts.ng,
                  "Grid electricity": focus.parts.elec,
                  "Feedstock haul": focus.parts.transport,
                }).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{number(value, 4)} gCO₂e/MJ</dd>
                  </div>
                ))}
              </dl>
            </article>
            <article>
              <h4>Factors & operating changes</h4>
              <p>
                Natural gas: 63 gCO₂e/MJ. Truck: 100 gCO₂e/t-km. Rail: 22 gCO₂e/t-km. Default grid:
                400 gCO₂e/kWh. The renewable PPA replaces modeled grid emissions with zero; upstream
                PPA emissions are not separately modeled.
              </p>
              <p>
                The fixed term is calibrated to reproduce the source pathway CI, including the
                source fallback haul mass where transport is zero. Dairy RNG uses a screening preset
                here; use the CI Workspace for the farm model.
              </p>
            </article>
            <article>
              <h4>Economics</h4>
              <p>
                Annualized cost = capital × capital recovery factor + incremental opex. Incremental
                opex includes user costs, the PPA premium and process-gas savings. Net benefit =
                incremental credit value − annualized cost.
              </p>
              <p>
                Conditional credit value = max(0, benchmark − CI) × annual MJ ÷ 1,000,000 × credit
                price. Assumes EER 1 and all modeled energy eligible; deficits are not monetized. No
                RINs, taxes, subsidies or other eligibility rules are included.
              </p>
            </article>
            <article>
              <h4>Decision boundary</h4>
              <p>
                The least-cost plan considers only these 16 discrete combinations. A lower-cost
                project outside these measures may exist. Sensitivity holds the measure plan fixed.
                Negative CI can reflect baseline-relative adjustments rather than physical carbon
                removal.
              </p>
              <a
                href="https://globalbioenergywatch.org/civanta/optimizer"
                target="_blank"
                rel="noreferrer"
              >
                Original GBW optimizer ↗
              </a>
              <p>Selected pathway: {pathwayFor(input.pathwayId).label}</p>
            </article>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
