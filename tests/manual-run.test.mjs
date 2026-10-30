import test from "node:test";
import assert from "node:assert/strict";
import { createManualRun } from "../public/tools/manual-run.mjs";

function harness(t) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let input = "first";
  let rendered = 0;
  let pending = 0;
  let busy = false;
  let html = "";
  let writes = 0;
  const attributes = new Map();
  const target = {
    get innerHTML() {
      return html;
    },
    set innerHTML(value) {
      html = value;
      writes++;
    },
    classList: { add() {}, remove() {} },
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
  };
  const controller = createManualRun({
    target,
    snapshot: () => input,
    render: () => {
      target.innerHTML = `Result for ${input}`;
      rendered++;
    },
    pending: () => {
      pending++;
      target.innerHTML = "Ready to calculate";
    },
    onStart() {},
    onBusy: (value) => {
      busy = value;
    },
  });
  return {
    controller,
    target,
    attributes,
    change(value) {
      input = value;
    },
    counts: () => ({ rendered, pending, busy, writes }),
  };
}

test("initial and changed inputs wait for Run, with a visible pending interval", (t) => {
  const h = harness(t);
  h.controller.update();
  assert.equal(h.counts().rendered, 0);
  h.controller.run();
  assert.match(h.target.innerHTML, /Calculating your scenario/);
  assert.equal(h.attributes.get("aria-busy"), "true");
  t.mock.timers.tick(649);
  assert.equal(h.counts().rendered, 0);
  t.mock.timers.tick(1);
  assert.equal(h.counts().rendered, 1);
  assert.equal(h.target.innerHTML, "Result for first");
  assert.equal(h.controller.isCurrent(), true);
  assert.equal(h.counts().busy, false);
  assert.equal(h.attributes.has("aria-busy"), false);
  const writesBeforeEdit = h.counts().writes;
  h.change("second");
  h.controller.update();
  assert.equal(h.controller.isCurrent(), false);
  assert.equal(h.counts().rendered, 1);
  assert.equal(h.target.innerHTML, "Result for first");
  assert.equal(h.counts().writes, writesBeforeEdit);
  h.controller.run();
  assert.match(h.target.innerHTML, /Calculating your scenario/);
  t.mock.timers.tick(650);
  assert.equal(h.target.innerHTML, "Result for second");
});

test("editing while running cancels the old result", (t) => {
  const h = harness(t);
  h.controller.run();
  h.change("changed during run");
  h.controller.invalidate();
  t.mock.timers.tick(1000);
  assert.equal(h.counts().rendered, 0);
  assert.equal(h.controller.isCurrent(), false);
  assert.equal(h.counts().busy, false);
});

test("a changed snapshot cannot publish even if an input event was missed", (t) => {
  const h = harness(t);
  h.controller.run();
  h.change("changed");
  t.mock.timers.tick(650);
  assert.equal(h.counts().rendered, 0);
  assert.equal(h.controller.isCurrent(), false);
});
