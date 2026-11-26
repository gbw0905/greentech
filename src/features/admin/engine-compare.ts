import type { AuditTest } from "./civanta-audit-contracts";

// Runs the live CIVanta engine (the exact scripts users load, inside a hidden
// workspace frame) on worked examples extracted from the uploaded document.

export type LiveWindow = Window & { eval: (code: string) => unknown; __civantaAudit?: unknown };

export interface TestRun {
  actual: number;
  pass: boolean;
  error?: string;
}

const NO_LEVERS = { power: 0, rail: 0, heat: 0, tuning: 0, leak: 0, demand: 0, gas: 0 };

/** The live workspace's allocation state for a test. */
function allocationState(test: AuditTest) {
  const a = test.allocation;
  const products = [0, 1, 2, 3].map((i) => a.coProducts[i] ?? {});
  return {
    method: a.method,
    context: a.method === "none" ? "" : "iso",
    classification: a.method === "none" ? "unreviewed" : "product",
    confirmed: a.method !== "none",
    scope: a.sharedStages,
    products,
    fuelMass: a.fuelMass,
    fuelPrice: a.fuelPrice,
    avoided: a.displacementCredit,
    evidence: a.method === "displacement" ? "Reference document worked example" : "",
  };
}

function runLive(win: LiveWindow, test: AuditTest) {
  win.__civantaAudit = {
    test,
    allocation: allocationState(test),
    levers: { ...NO_LEVERS, ...test.levers },
  };
  // Indirect eval runs in the workspace's global scope, where the engine's
  // `sel`, `generic`, `dairy` and `allocation` bindings live.
  const raw = win.eval(`(() => {
    const {test, allocation: a, levers} = window.__civantaAudit;
    sel = {fuel: '', feed: '', tech: '', id: test.pathwayId};
    let b;
    if (test.kind === 'dairy') {
      dairy = {...test.inputs, digester: test.digester};
      b = computeDairy();
    } else {
      generic = {...test.inputs, _mode: 'detailed'};
      allocation = a;
      b = computeGeneric();
    }
    const scenario = Object.values(levers).some(v => v > 0) ? scenarioFor(b, levers) : null;
    return JSON.stringify(scenario ? scenario.ci : b.ci);
  })()`);
  return Number(JSON.parse(String(raw)));
}

/** Documents round their results, so allow the last stated digit plus a small relative margin. */
export function matchesExpected(actual: number, expected: number) {
  return (
    Number.isFinite(actual) &&
    Math.abs(actual - expected) <= Math.max(5e-4, 1e-4 * Math.abs(expected))
  );
}

export function runTest(win: LiveWindow, test: AuditTest): TestRun {
  try {
    const actual = runLive(win, test);
    if (!Number.isFinite(actual))
      return { actual, pass: false, error: "The engine returned no result." };
    return { actual, pass: matchesExpected(actual, test.expected) };
  } catch (error) {
    // Errors thrown inside the workspace frame come from another realm, so
    // `instanceof Error` is false; read the message directly.
    const message = (error as { message?: unknown } | null)?.message;
    return { actual: NaN, pass: false, error: typeof message === "string" ? message : "Failed" };
  }
}

export function liveEngineVersion(win: LiveWindow) {
  return String(
    win.eval("typeof CIVANTA_ENGINE_VERSION === 'string' ? CIVANTA_ENGINE_VERSION : 'unknown'"),
  );
}

/** Waits for the hidden workspace frame to finish loading its scripts. */
export function waitForWorkspace(frame: HTMLIFrameElement, timeoutMs = 20000) {
  return new Promise<LiveWindow>((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      const win = frame.contentWindow as LiveWindow | null;
      if (win?.document.body?.hasAttribute("data-workspace-ready")) return resolve(win);
      if (Date.now() - started > timeoutMs)
        return reject(new Error("The live engine did not load. Reload the page and try again."));
      setTimeout(check, 150);
    };
    check();
  });
}
