import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/civanta-workspace/pro-access.js", import.meta.url), "utf8");
function button() {
  return {
    dataset: {}, badge: null, locked: false,
    classList: { toggle() {} },
    querySelector() { return this.badge; },
    append(badge) { this.badge = badge; badge.remove = () => { this.badge = null; }; },
  };
}
function setup() {
  const main = button(), floating = button(), listeners = {}, requests = [];
  const document = {
    hidden: false,
    getElementById: () => ({}),
    createElement: () => ({}),
    querySelectorAll: () => [main],
    addEventListener: (event, callback) => { listeners[event] = callback; },
  };
  const window = {
    frameElement: { ownerDocument: { querySelectorAll: () => [floating] } },
    addEventListener: (event, callback) => { listeners[event] = callback; },
  };
  const access = runInNewContext(source + "\ncivantaPro", {
    document, window, stage: 1, location: {origin:"http://localhost"},
    fetch: () => new Promise((resolve, reject) => requests.push({resolve,reject})),
  });
  return {access,main,floating,listeners,requests};
}
function assertBadges(state, visible) {
  for (const button of [state.main,state.floating]) assert.equal(Boolean(button.badge), visible);
}
test("slow Pro verification never displays badges on initial or newly decorated buttons", async () => {
  const state = setup();
  state.listeners.DOMContentLoaded();
  assertBadges(state, false);
  state.listeners["civanta-stage-changed"]();
  state.access.decorate(state.floating);
  assertBadges(state, false);
  const pending = state.access.refresh();
  state.requests[0].resolve({ok:true,json:async()=>({signedIn:true,premium:true})});
  await pending;
  assertBadges(state, false);
  assert.equal(state.access.premium, true);
});
test("badges appear only after Free verification and disappear while the account is rechecked", async () => {
  const state = setup();
  let pending = state.access.refresh();
  assertBadges(state, false);
  state.requests[0].resolve({ok:true,json:async()=>({signedIn:true,premium:false})});
  await pending;
  assertBadges(state, true);
  pending = state.access.refresh();
  assertBadges(state, false);
  state.requests[1].resolve({ok:true,json:async()=>({signedIn:true,premium:true})});
  await pending;
  assertBadges(state, false);
});
test("a failed or malformed access check never paints a Free badge", async () => {
  for (const response of [{ok:false}, {ok:true,json:async()=>({premium:false})}]) {
    const state = setup();
    const pending = state.access.refresh();
    state.requests[0].resolve(response);
    assert.equal(await pending,false);
    assertBadges(state,false);
  }
});
