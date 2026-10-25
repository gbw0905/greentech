// Converts user-supplied activity and emission factors into direct CI terms.
// Factor units are explicit; no preset or certification is implied.
export function activityToCi(data, annualEnergyMj) {
  const values = [
    data.feedstockTonnes,
    data.feedstockFactorKgPerTonne,
    data.transportTonnes,
    data.transportKm,
    data.transportFactorKgPerTonneKm,
  ];
  if (!(annualEnergyMj > 0) || !Number.isFinite(annualEnergyMj))
    return { errors: ["Enter positive annual production and fuel LHV for activity-based inputs."] };
  if (values.some((value) => !Number.isFinite(value) || value < 0))
    return {
      errors: ["Enter non-negative feedstock quantity, haul distance and both emission factors."],
    };
  const feedstock = (data.feedstockTonnes * data.feedstockFactorKgPerTonne * 1000) / annualEnergyMj;
  const transport =
    (data.transportTonnes * data.transportKm * data.transportFactorKgPerTonneKm * 1000) /
    annualEnergyMj;
  if (![feedstock, transport].every(Number.isFinite))
    return { errors: ["Activity values exceed the supported numeric range."] };
  return { errors: [], feedstock, transport };
}

export function changedInputs(before, after) {
  if (!before || !after) return [];
  const changes = [];
  const add = (label, previous, current) => {
    if ((Number.isFinite(previous) || Number.isFinite(current)) && previous !== current)
      changes.push({ label, previous, current });
  };
  add("Annual production", before.annualVolume, after.annualVolume);
  add("Fuel LHV", before.energyDensity, after.energyDensity);
  const activityLabels = {
    feedstockTonnes: "Feedstock quantity · tonnes/year",
    feedstockFactorKgPerTonne: "Feedstock factor · kgCO₂e/tonne",
    transportTonnes: "Transported feedstock · tonnes/year",
    transportKm: "Haul distance · km",
    transportFactorKgPerTonneKm: "Transport factor · kgCO₂e/tonne-km",
  };
  for (const key of new Set([
    ...Object.keys(before.activityData ?? {}),
    ...Object.keys(after.activityData ?? {}),
  ]))
    add(activityLabels[key] ?? `Activity · ${key}`, before.activityData?.[key], after.activityData?.[key]);
  for (const key of new Set([
    ...Object.keys(before.direct ?? {}),
    ...Object.keys(after.direct ?? {}),
  ]))
    add(`Direct CI · ${key}`, before.direct?.[key], after.direct?.[key]);
  for (const key of new Set([
    ...Object.keys(before.energy ?? {}),
    ...Object.keys(after.energy ?? {}),
  ]))
    add(`Energy use · ${key}`, before.energy?.[key], after.energy?.[key]);
  for (const key of new Set([
    ...Object.keys(before.factors ?? {}),
    ...Object.keys(after.factors ?? {}),
  ]))
    add(`Emission factor · ${key}`, before.factors?.[key], after.factors?.[key]);
  return changes;
}
