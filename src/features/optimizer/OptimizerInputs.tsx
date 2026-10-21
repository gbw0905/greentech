import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { MEASURES, PATHWAYS, type Inputs, type MeasureId } from "./engine";

import { FIELD_LABELS, type NumericKey } from "./fields";

export function NumberField({
  label,
  unit,
  value,
  step = 1,
  min,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="opt-field">
      <span>
        {label}
        <small>{unit}</small>
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value === "" ? NaN : Number(event.target.value))}
      />
    </label>
  );
}
const groups = [...new Set(PATHWAYS.map((p) => p.group))];
export function OptimizerInputs({
  input,
  selected,
  onChange,
  onPathway,
  onSelected,
}: {
  input: Inputs;
  selected: MeasureId[];
  onChange: (input: Inputs) => void;
  onPathway: (id: string) => void;
  onSelected: (ids: MeasureId[]) => void;
}) {
  const field = (key: NumericKey) => {
    const [label, unit, step] = FIELD_LABELS[key];
    return (
      <NumberField
        key={key}
        label={label}
        unit={unit}
        value={input[key]}
        step={step}
        {...(key !== "target" && key !== "benchmark" ? { min: 0 } : {})}
        {...(key === "heatPct" || key === "tuningPct" ? { max: 100 } : {})}
        onChange={(value) => onChange({ ...input, [key]: value })}
      />
    );
  };
  return (
    <aside className="opt-inputs" aria-label="Optimizer inputs">
      <div className="opt-section-title">
        <span className="opt-icon">
          <SlidersHorizontal size={18} />
        </span>
        <div>
          <h2>Inputs & constraints</h2>
          <p>Shape your operating scenario</p>
        </div>
      </div>
      <label className="opt-field opt-pathway">
        <span>
          Fuel pathway<small>43 pathways</small>
        </span>
        <select value={input.pathwayId} onChange={(e) => onPathway(e.target.value)}>
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {PATHWAYS.filter((p) => p.group === group).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="opt-field-grid">
        {(
          ["target", "benchmark", "ng", "kwh", "gridCi", "km", "feedstockAdj", "volumeMj"] as const
        ).map(field)}
      </div>
      <details className="opt-details" open>
        <summary>
          Economic assumptions
          <ChevronDown size={15} />
        </summary>
        <div className="opt-field-grid">
          {(["creditPrice", "ngPrice", "ppaPremium", "discountRate", "lifeYears"] as const).map(
            field,
          )}
        </div>
        <p className="opt-note">
          Costs and prices are editable planning assumptions. A PPA adds the premium to the same
          electricity volume; the base electricity price cancels in this comparison.
        </p>
      </details>
      <details className="opt-details" open>
        <summary>
          Measures to compare
          <ChevronDown size={15} />
        </summary>
        <p className="opt-note">
          Tick measures for “Your selection”. All 16 combinations are compared to find the
          least-cost plan.
        </p>
        {MEASURES.map((measure) => (
          <fieldset key={measure.id} className="opt-measure">
            <legend>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(measure.id)}
                  onChange={(event) =>
                    onSelected(
                      event.target.checked
                        ? [...selected, measure.id]
                        : selected.filter((id) => id !== measure.id),
                    )
                  }
                />
                {measure.name}
              </label>
            </legend>
            <p>{measure.detail}</p>
            <div className="opt-field-grid">
              {(["capex", "opex"] as const).map((key) => (
                <NumberField
                  key={key}
                  label={`${measure.name} ${key === "capex" ? "capital" : "operating cost"}`}
                  unit={key === "capex" ? "USD" : "USD/year"}
                  value={input.costs[measure.id][key]}
                  min={0}
                  step={1000}
                  onChange={(value) =>
                    onChange({
                      ...input,
                      costs: {
                        ...input.costs,
                        [measure.id]: { ...input.costs[measure.id], [key]: value },
                      },
                    })
                  }
                />
              ))}
            </div>
            {measure.id === "heat"
              ? field("heatPct")
              : measure.id === "tuning"
                ? field("tuningPct")
                : null}
          </fieldset>
        ))}
        <p className="opt-note">
          Gas reductions compound: 15% heat recovery and 10% tuning reduce process gas by 23.5%.
        </p>
      </details>
    </aside>
  );
}
