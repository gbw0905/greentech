/** Shared manual-run lifecycle for the two embedded calculators. */
export function createManualRun({
  target,
  snapshot,
  render,
  pending,
  onStart,
  onBusy,
  onReady = () => {},
}) {
  let completed = null;
  let timer = null;
  let lastResult = null;
  let pendingVisible = false;
  const current = () => completed !== null && completed === snapshot();
  const stop = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    target.removeAttribute("aria-busy");
    onBusy(false);
  };
  const invalidate = () => {
    const wasRunning = timer !== null;
    if (wasRunning) stop();
    completed = null;
    onReady(false);
    if (wasRunning && lastResult !== null) target.innerHTML = lastResult;
    else if (lastResult === null && !pendingVisible) {
      pending();
      pendingVisible = true;
    }
  };
  return {
    isCurrent: current,
    clear() {
      stop();
      completed = null;
      lastResult = null;
      pendingVisible = false;
      invalidate();
    },
    invalidate,
    update() {
      if (current()) {
        render();
        lastResult = target.innerHTML;
      } else invalidate();
    },
    run() {
      stop();
      completed = null;
      onReady(false);
      const requested = snapshot();
      target.setAttribute("aria-busy", "true");
      target.innerHTML =
        '<section class="calculator-run-state" role="status"><span class="calculator-run-spinner" aria-hidden="true"></span><h2>Calculating your scenario</h2><p>Preparing your results…</p></section>';
      pendingVisible = false;
      onBusy(true);
      onStart();
      timer = setTimeout(() => {
        if (requested !== snapshot()) {
          invalidate();
          return;
        }
        timer = null;
        completed = requested;
        try {
          render();
          lastResult = target.innerHTML;
          onReady(true);
          target.classList.remove("calculator-results-enter");
          void target.offsetWidth;
          target.classList.add("calculator-results-enter");
        } finally {
          stop();
        }
      }, 650);
    },
  };
}
