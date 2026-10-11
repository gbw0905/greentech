import type { SupplyDatasetPayload, SupplyObservationValue } from "@/features/supply/contracts";

function formatNumber(value: number | null): string {
  if (value === null) return "Not reported";
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function sourceHost(value: string | null): string {
  if (!value) return "Source not recorded";
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function confidenceLabel(observation: SupplyObservationValue): string {
  const basis = observation.estimated ? "estimated" : observation.confidence;
  return basis.charAt(0).toUpperCase() + basis.slice(1);
}

export function SupplySourceFacts({ payload }: { payload: SupplyDatasetPayload | undefined }) {
  const rows = payload?.rows ?? [];
  const observationCount = rows.reduce((count, row) => count + row.observations.length, 0);

  if (!payload?.dynamic || rows.length === 0 || observationCount === 0) return null;

  return (
    <details className="mt-4 rounded-lg border border-border bg-card/80 p-4 shadow-sm">
      <summary className="cursor-pointer select-none text-sm font-semibold text-foreground">
        Source-backed facts ({rows.length} entities, {observationCount} observations)
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-medium">Entity</th>
              <th className="py-2 pr-4 font-medium">Metric</th>
              <th className="py-2 pr-4 font-medium">Value</th>
              <th className="py-2 pr-4 font-medium">Year</th>
              <th className="py-2 pr-4 font-medium">Confidence</th>
              <th className="py-2 pr-4 font-medium">Source</th>
              <th className="py-2 font-medium">Basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.flatMap((entity) =>
              entity.observations.map((observation) => (
                <tr key={`${entity.id}-${observation.metricKey}-${observation.reportingYear}-${observation.sourceId}`}>
                  <td className="py-2 pr-4 align-top">
                    <div className="font-medium text-foreground">{entity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entity.country ?? "Country not recorded"} · {entity.entityType}
                    </div>
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <div>{observation.metricLabel}</div>
                    <div className="label-mono text-xs text-muted-foreground">{observation.metricKey}</div>
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <div className="font-medium text-foreground">{formatNumber(observation.value)}</div>
                    <div className="text-xs text-muted-foreground">{observation.unit}</div>
                  </td>
                  <td className="py-2 pr-4 align-top">{observation.reportingYear ?? "Not recorded"}</td>
                  <td className="py-2 pr-4 align-top">{confidenceLabel(observation)}</td>
                  <td className="py-2 pr-4 align-top">{sourceHost(observation.sourceUrl)}</td>
                  <td className="max-w-[420px] py-2 align-top text-muted-foreground">
                    {observation.basis}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </details>
  );
}
