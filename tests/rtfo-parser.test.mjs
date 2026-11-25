import test from "node:test";
import assert from "node:assert/strict";
import { rtfoAnnualReportParser } from "../src/features/supply/server/parsers/rtfo-annual-report.server.ts";

const reportUrl = "https://www.gov.uk/statistics/rtfo-statistics-2024-final-report";

for (const [sentence, expected] of [
  ["3.5 billion litres of verified renewable fuel supplied in 2024", 3500],
  ["In 2024, 3.5 billion litres of verified renewable fuel were supplied", 3500],
  ["20 million litres of verified renewable fuel supplied in 2024", 20],
]) {
  test(`RTFO annual total keeps amount and year separate: ${sentence}`, async (t) => {
    t.mock.method(globalThis, "fetch", async (url) => {
      assert.equal(String(url), reportUrl);
      return new Response(`<p>${sentence}</p>`);
    });
    const result = await rtfoAnnualReportParser.parse({
      datasetId: "fuel-stations",
      url: reportUrl,
      year: 2023,
    });
    assert.equal(result.reportingYear, 2024);
    assert.equal(result.entities.length, 1);
    assert.equal(result.entities[0].observations[0].value, expected);
    assert.equal(result.entities[0].observations[0].reportingYear, 2024);
  });
}

test("RTFO collection selects the latest final report", async (t) => {
  const collectionUrl = "https://www.gov.uk/government/collections/rtfo-statistics";
  t.mock.method(globalThis, "fetch", async (url) => {
    if (String(url) === collectionUrl) {
      return new Response(`<a href="/statistics/rtfo-statistics-2023-final-report">2023</a>
        <a href="/statistics/rtfo-statistics-2024-final-report">2024</a>`);
    }
    assert.equal(String(url), reportUrl);
    return new Response("3.5 billion litres of verified renewable fuel supplied in 2024");
  });
  const result = await rtfoAnnualReportParser.parse({
    datasetId: "fuel-stations",
    url: collectionUrl,
    year: 2023,
  });
  assert.equal(result.sourceUrl, reportUrl);
  assert.equal(result.reportingYear, 2024);
});
