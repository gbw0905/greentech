import { createFileRoute } from "@tanstack/react-router";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

async function signedInUser(request: Request) {
  const { userIdFromRequest } = await import("@/features/auth/server/user-from-request.server");
  return userIdFromRequest(request);
}

const signInRequired = () =>
  Response.json({ error: "Sign in to save plants." }, { status: 401, headers });

export const Route = createFileRoute("/api/civanta-plants")({
  server: {
    handlers: {
      // ?summary=1 omits each plant's full model for lightweight lists such as the profile.
      GET: async ({ request }) => {
        const plants = await import("@/features/civanta/plants.server");
        try {
          const userId = await signedInUser(request);
          if (!userId) return signInRequired();
          const summary = new URL(request.url).searchParams.get("summary") === "1";
          return Response.json(
            { userId, plants: await plants.listPlants(userId, summary) },
            { headers },
          );
        } catch (error) {
          return plants.civantaErrorResponse(error, "Could not load your plants.");
        }
      },
      PUT: async ({ request }) => {
        const plants = await import("@/features/civanta/plants.server");
        try {
          const userId = await signedInUser(request);
          if (!userId) return signInRequired();
          const saved = await plants.savePlant(userId, await plants.readJsonBody(request));
          return Response.json(saved, { headers });
        } catch (error) {
          return plants.civantaErrorResponse(error, "Could not save this plant.");
        }
      },
      DELETE: async ({ request }) => {
        const plants = await import("@/features/civanta/plants.server");
        try {
          const userId = await signedInUser(request);
          if (!userId) return signInRequired();
          await plants.deletePlant(userId, new URL(request.url).searchParams.get("id"));
          return Response.json({ ok: true }, { headers });
        } catch (error) {
          return plants.civantaErrorResponse(error, "Could not remove this plant.");
        }
      },
    },
  },
});
