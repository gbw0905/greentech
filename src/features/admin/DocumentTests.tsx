import { useEffect, useMemo, useRef, useState } from "react";
import type { AuditReport } from "./civanta-audit-contracts";
import {
  liveEngineVersion,
  runTest,
  waitForWorkspace,
  type LiveWindow,
  type TestRun,
} from "./engine-compare";

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "—";

/** Runs the selected report's worked examples through the live engine. */
export function DocumentTests({ report }: { report: AuditReport }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [win, setWin] = useState<LiveWindow | null>(null);
  const [version, setVersion] = useState("");
  const [loadError, setLoadError] = useState("");
  const [runs, setRuns] = useState<Record<string, TestRun>>({});
  const tests = useMemo(() => report.tests ?? [], [report.tests]);

  useEffect(() => {
    if (!frame.current) return;
    waitForWorkspace(frame.current)
      .then((target) => {
        setWin(target);
        setVersion(liveEngineVersion(target));
      })
      .catch((error: Error) => setLoadError(error.message));
  }, []);

  useEffect(() => {
    if (!win) return;
    setRuns(Object.fromEntries(tests.map((test) => [test.id, runTest(win, test)])));
  }, [win, tests]);

  return (
    <div className="admin-tests">
      <div className="admin-card-heading">
        <h3>Worked examples from the document</h3>
        <span className="admin-pill">{version ? `Live engine ${version}` : "Loading engine…"}</span>
      </div>
      <p className="admin-muted">
        The AI copied these examples and their stated results from the document. The live engine
        then calculates them itself, so the result column is real engine output.
      </p>
      {loadError && (
        <p role="alert" className="admin-error">
          {loadError}
        </p>
      )}
      {!tests.length ? (
        <p className="admin-muted">
          No worked examples with stated results were found in this document.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Example</th>
                <th>Document says</th>
                <th>Live engine</th>
                <th>Difference</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => {
                const run = runs[test.id];
                return (
                  <tr key={test.id}>
                    <td>
                      <strong>{test.title}</strong>
                      <small>{test.source}</small>
                      <details>
                        <summary>Inputs used</summary>
                        <small>
                          {[
                            test.kind === "dairy"
                              ? `digester: ${test.digester}`
                              : `pathway: ${test.pathwayId}`,
                            ...Object.entries(test.inputs).map(([k, v]) => `${k}: ${v}`),
                            test.allocation.method !== "none" &&
                              `allocation: ${test.allocation.method}`,
                            ...Object.entries(test.levers).map(([k, v]) => `${k} lever: ${v}%`),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      </details>
                    </td>
                    <td>
                      {fmt(test.expected)} <small>{test.expectedLabel} · g CO₂e/MJ</small>
                    </td>
                    <td>{run ? fmt(run.actual) : "…"}</td>
                    <td>
                      {run && Number.isFinite(run.actual) ? fmt(run.actual - test.expected) : ""}
                    </td>
                    <td>
                      {run && (
                        <span className={run.pass ? "admin-pass" : "admin-fail"}>
                          {run.pass ? "Pass" : run.error ? "Error" : "Mismatch"}
                        </span>
                      )}
                      {run?.error && <small>{run.error}</small>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <iframe
        ref={frame}
        src="/civanta-workspace/index.html?audit=1"
        title="Live CIVanta engine"
        aria-hidden="true"
        tabIndex={-1}
        className="admin-engine-frame"
      />
    </div>
  );
}
