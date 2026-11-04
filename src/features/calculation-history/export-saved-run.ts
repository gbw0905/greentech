import { getCalculationRunFn } from "./server-functions";

/** Fetches the account-owned snapshot through the server's Pro check. */
export async function exportSavedRun(id: string) {
  const run = await getCalculationRunFn({ data: { id } });
  const snapshot = JSON.parse(run.snapshot);
  if (run.kind === "optimizer") {
    const [{ analyze }, { exportOptimizerReport }] = await Promise.all([
      import("@/features/optimizer/engine"),
      import("@/features/optimizer/export-report"),
    ]);
    await exportOptimizerReport(
      snapshot.state,
      analyze(snapshot.state, snapshot.selected),
      "excel",
    );
  } else if (run.kind === "ci") {
    const moduleUrl = new URL("/tools/workspace-export.mjs", window.location.origin).href;
    const [{ buildWorkspacePayload }, { exportWorkspaceWorkbook }] = await Promise.all([
      import(/* @vite-ignore */ moduleUrl),
      import("@/features/ci-workspace/export-workbook"),
    ]);
    await exportWorkspaceWorkbook(
      buildWorkspacePayload(
        { ...snapshot.state, name: run.name },
        undefined,
        snapshot.baseline ?? null,
      ),
    );
  } else {
    const moduleUrl = new URL("/tools/credit-engine.mjs", window.location.origin).href;
    const [engine, { exportCreditWorkbook }] = await Promise.all([
      import(/* @vite-ignore */ moduleUrl),
      import("@/features/ci-workspace/export-credit-workbook"),
    ]);
    const { errors, ...result } = engine.calculate(snapshot.state);
    if (errors.length || result.rinError)
      throw new Error("Open this run and review its inputs before exporting.");
    await exportCreditWorkbook({
      version: engine.VERSION,
      reviewed: "2026-10-01",
      fuelName: engine.FUELS[snapshot.state.fuel].name,
      state: snapshot.state,
      result,
      warnings: result.warnings,
      sources: engine.SOURCES,
    });
  }
}
