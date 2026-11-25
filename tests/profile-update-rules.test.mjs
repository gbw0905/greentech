import { test } from "node:test";
import assert from "node:assert/strict";
import { judgeProposal } from "../src/features/policy/profile-update-rules.ts";

const profile = {
  slug: "indonesia",
  name: "Indonesia",
  blurb: "Indonesia runs a palm biodiesel mandate.",
  mandates: [{ label: "Biodiesel blend", value: "B40" }],
  frameworks: ["ESDM regulation"],
  policyStatus: "Mandated",
};
const articles = [
  {
    id: "a1",
    url: "https://en.antaranews.com/news/1",
    title: "Indonesia raises biodiesel mandate to B50 from January",
    summary:
      "The energy ministry said the B50 biodiesel blending mandate will take effect on January 1 nationwide.",
    source: "Antara",
    publishedAt: "2026-11-10T00:00:00Z",
  },
];
const b50 = { mandates: [{ label: "Biodiesel blend", value: "B50 from 1 Jan 2027" }] };
const quote = "the B50 biodiesel blending mandate will take effect on January 1 nationwide";

test("accepts a change backed by an exact quote", () => {
  const verdict = judgeProposal(
    { changes: b50, article: "a1", quote, reason: "r" },
    profile,
    articles,
  );
  assert.equal(verdict.kind, "accepted");
  assert.equal(verdict.proposal.article.url, articles[0].url);
  assert.deepEqual(Object.keys(verdict.proposal.changes), ["mandates"]);
});

test("rejects a quote that is not in the article", () => {
  const verdict = judgeProposal(
    {
      changes: b50,
      article: "a1",
      quote: "the government has confirmed B60 will start next month for all fuel",
      reason: "r",
    },
    profile,
    articles,
  );
  assert.equal(verdict.kind, "rejected");
});

test("rejects a change citing an unknown article", () => {
  const verdict = judgeProposal(
    { changes: b50, article: "a9", quote, reason: "r" },
    profile,
    articles,
  );
  assert.equal(verdict.kind, "rejected");
});

test("rejects a short quote", () => {
  const verdict = judgeProposal(
    { changes: b50, article: "a1", quote: "B50 biodiesel", reason: "r" },
    profile,
    articles,
  );
  assert.equal(verdict.kind, "rejected");
});

test("rejects wiping every mandate", () => {
  const verdict = judgeProposal(
    { changes: { mandates: [] }, article: "a1", quote, reason: "r" },
    profile,
    articles,
  );
  assert.equal(verdict.kind, "rejected");
});

test("rejects an unknown status", () => {
  const verdict = judgeProposal(
    { changes: { policy_status: "Banned" }, article: "a1", quote, reason: "r" },
    profile,
    articles,
  );
  assert.equal(verdict.kind, "rejected");
});

test("returns none when nothing actually changes", () => {
  const verdict = judgeProposal(
    {
      changes: { policy_status: "Mandated", mandates: profile.mandates },
      article: "a1",
      quote,
      reason: "r",
    },
    profile,
    articles,
  );
  assert.equal(verdict.kind, "none");
});

test("tolerates curly quotes and spacing differences", () => {
  const curly = {
    ...articles[0],
    summary:
      "Officials said “the B50  biodiesel blending mandate will take effect on January 1 nationwide”.",
  };
  const verdict = judgeProposal({ changes: b50, article: "a1", quote, reason: "r" }, profile, [
    curly,
  ]);
  assert.equal(verdict.kind, "accepted");
});
