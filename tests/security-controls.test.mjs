import test from "node:test";
import assert from "node:assert/strict";
import {
  readJson,
  RequestBodyError,
} from "../src/infrastructure/http/server/request-body.server.ts";
import { ownedDocumentPath } from "../src/features/documents/server/document-storage.server.ts";
import { authorizeCron } from "../src/features/supply/server/ingest-auth.server.ts";

test("JSON parser accepts bounded JSON regardless of content-type casing", async () => {
  const req = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "Application/JSON; charset=utf-8" },
    body: JSON.stringify({ name: "Plant" }),
  });
  assert.deepEqual(await readJson(req, 32), { name: "Plant" });
});

test("JSON body limit also covers streamed requests without a content-length header", async () => {
  const req = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: new Blob(['"Plant scenario"']).stream(),
    duplex: "half",
  });
  assert.equal(req.headers.get("content-length"), null);
  await assert.rejects(
    readJson(req, 8),
    (error) => error instanceof RequestBodyError && error.status === 413,
  );
});

test("stored document paths belong to the requesting user's exact analysis", () => {
  const user = "8aaadd75-91e7-4539-9760-ce69bc6d5c5d";
  const analysis = "358fde43-56e9-487b-947f-63d10105f5b9";
  assert.equal(
    ownedDocumentPath(`${user}/${analysis}.pdf`, user, analysis),
    `${user}/${analysis}.pdf`,
  );
  assert.equal(ownedDocumentPath(`other/${analysis}.pdf`, user, analysis), null);
  assert.equal(ownedDocumentPath(`${user}/another-analysis.pdf`, user, analysis), null);
  assert.equal(ownedDocumentPath(`${user}/${analysis}.html`, user, analysis), null);
});

test("scheduled jobs require the cron credential and fail closed without configuration", (t) => {
  const original = process.env.CRON_SECRET;
  t.after(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });
  const url = "https://example.test/api/public/policy-alert-digest";
  delete process.env.CRON_SECRET;
  assert.equal(authorizeCron(new Request(url))?.status, 503);
  process.env.CRON_SECRET = "unit-test-credential";
  assert.equal(authorizeCron(new Request(url))?.status, 401);
  assert.equal(
    authorizeCron(new Request(url, { headers: { authorization: "Bearer other" } }))?.status,
    401,
  );
  assert.equal(
    authorizeCron(new Request(url, { headers: { authorization: "Bearer unit-test-credential" } })),
    null,
  );
});
