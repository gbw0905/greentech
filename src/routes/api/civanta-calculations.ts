import { createFileRoute } from "@tanstack/react-router";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

async function signedInUser(request: Request) {
  const { userIdFromRequest } = await import("@/features/auth/server/user-from-request.server");
  return userIdFromRequest(request);
}

const signInRequired = () =>
  Response.json({ error: "Sign in to view calculation history." }, { status: 401, headers });

export const Route = createFileRoute("/api/civanta-calculations")({
  server: {
    handlers: {
      // ?id= returns one calculation with its inputs; otherwise a summary list,
      // optionally filtered by ?plantId= and capped by ?limit=.
      GET: async ({ request }) => {
        const plants = await import("@/features/civanta/plants.server");
        try {
          const userId = await signedInUser(request);
          if (!userId) return signInRequired();
          const params = new URL(request.url).searchParams;
          if (params.has("id"))
            return Response.json(await plants.getCalculation(userId, params.get("id")), {
              headers,
            });
          return Response.json(
            { calculations: await plants.listCalculations(userId, params) },
            { headers },
          );
        } catch (error) {
          return plants.civantaErrorResponse(error, "Could not load calculation history.");
        }
      },
      POST: async ({ request }) => {
        const plants = await import("@/features/civanta/plants.server");
        try {
          const userId = await signedInUser(request);
          if (!userId) return signInRequired();
          const saved = await plants.recordCalculation(userId, await plants.readJsonBody(request));
          return Response.json(saved, { status: saved.duplicate ? 200 : 201, headers });
        } catch (error) {
          return plants.civantaErrorResponse(error, "Could not record this calculation.");
        }
      },
    },
  },
});
