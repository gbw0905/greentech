import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/civanta-workspace/allocation.js", import.meta.url), "utf8");
const { allocate, apply, create } = runInNewContext(
  source + "\n({ allocate: allocateCivanta, apply: applyCivantaAllocation, create: newAllocation })",
);

const gross = { Upstream: 5, "Process heat": 12, Electricity: 20, "Fuel distribution": 2, "End use": null };
function inventory(method) {
  return {
    ...create(), method, confirmed: true, classification: "product",
    fuelMass: 800, fuelPrice: 1, scope: ["Process heat", "Electricity"],
    products: [{ name: "Co-product", mass: 200, lhv: 10, price: 0 }],
  };
}

test("mass and energy allocation use only the documented shared stages", () => {
  const mass = allocate(inventory("mass"), 80530, gross);
  const energy = allocate(inventory("energy"), 80530, gross);
  assert.equal(mass.factor, 0.8);
  assert.equal(energy.factor, 80530 / 82530);
  assert.equal(mass.shared, 32);
  const optimized = apply({ ...gross, Electricity: 10 }, mass);
  assert.ok(Math.abs(optimized["Co-product allocation adjustment"] + 4.4) < 1e-12);
  assert.equal(optimized["Fuel distribution"], 2);
  assert.ok(!Object.hasOwn(optimized, "End use"));
});

test("an economic co-product price must be entered, and explicit zero is accepted", () => {
  const a = inventory("economic");
  assert.equal(allocate(a, 80530, gross).factor, 1);
  delete a.products[0].price;
  assert.throws(() => allocate(a, 80530, gross), { field: "alloc0price" });
});

test("displacement is applied once and never stacked on proportional allocation", () => {
  const a = { ...inventory("displacement"), avoided: 4 };
  assert.throws(() => allocate(a, 80530, gross), { field: "allocEvidence" });
  a.evidence = "Documented substitution";
  const parts = apply(gross, allocate(a, 80530, gross));
  assert.equal(parts["Co-product displacement credit"], -4);
  assert.ok(!Object.hasOwn(parts, "Co-product allocation adjustment"));
});

test("preallocated, negative and unreported shared inputs cannot be allocated", () => {
  const a = inventory("mass");
  assert.throws(() => allocate({ ...a, confirmed: false }, 80530, gross), { field: "allocConfirmed" });
  assert.throws(() => allocate(a, 80530, { ...gross, Electricity: null }), { field: "allocScope3" });
  assert.throws(() => allocate(a, 80530, { ...gross, Electricity: -3 }), { field: "allocScope3" });
  assert.equal(allocate(create(), 80530, gross).adjustment, 0);
});
