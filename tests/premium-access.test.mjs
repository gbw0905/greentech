import test from "node:test";
import assert from "node:assert/strict";
import { premiumStatusForEmail } from "../src/features/premium/access.server.ts";

const request = new Request("https://globalbioenergywatch.org/civanta-new");
function database(active, error = null) {
  return {
    from(table) {
      assert.equal(table, "premium_members");
      return {
        select(column) {
          assert.equal(column, "active");
          return {
            eq(column, email) {
              assert.equal(column, "email");
              assert.equal(email, "member@example.com");
              return {
                maybeSingle: async () => ({ data: active === null ? null : { active }, error }),
              };
            },
          };
        },
      };
    },
  };
}
test("only an active premium membership grants a normal authenticated account access", async () => {
  for (const active of [true, false, null]) {
    assert.equal(
      (await premiumStatusForEmail(database(active), "MEMBER@example.com", request)).premium,
      active === true,
    );
  }
  assert.equal(
    (
      await premiumStatusForEmail(
        database(true, new Error("Database failed")),
        "member@example.com",
        request,
      )
    ).premium,
    false,
  );
});
test("existing owner and curated Pro accounts retain access", async () => {
  const db = {
    from() {
      throw Error("Curated members do not query membership storage");
    },
  };
  assert.deepEqual(await premiumStatusForEmail(db, "asifurp09@gmail.com", request), {
    premium: true,
    canEdit: true,
  });
  assert.deepEqual(await premiumStatusForEmail(db, "info@globalbioenergywatch.org", request), {
    premium: true,
    canEdit: false,
  });
  assert.deepEqual(await premiumStatusForEmail(db, undefined, request), {
    premium: false,
    canEdit: false,
  });
});
test("demo access remains limited to development localhost", async (t) => {
  const previous = process.env.NODE_ENV;
  t.after(() => {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  });
  const db = {
    from() {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
    },
  };
  process.env.NODE_ENV = "development";
  assert.equal(
    (
      await premiumStatusForEmail(
        db,
        "demo@globalbioenergywatch.org",
        new Request("http://localhost:8080"),
      )
    ).premium,
    true,
  );
  assert.equal(
    (await premiumStatusForEmail(db, "demo@globalbioenergywatch.org", request)).premium,
    false,
  );
  process.env.NODE_ENV = "production";
  assert.equal(
    (
      await premiumStatusForEmail(
        db,
        "demo@globalbioenergywatch.org",
        new Request("http://localhost:8080"),
      )
    ).premium,
    false,
  );
});
