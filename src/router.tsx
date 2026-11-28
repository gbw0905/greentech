import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { authSessionQueryKey, type AuthUser } from "@/features/auth/hooks/useAuthSession";
import { routeTree } from "./routeTree.gen";
import { requestNonce } from "@/infrastructure/http/server/response-security.server";

const getNonce = createIsomorphicFn()
  .server(() => requestNonce.getStore())
  .client(() => undefined);

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 3, retryDelay: (i) => Math.min(1000 * 2 ** i, 8000) } },
  });

  const nonce = getNonce();
  const router = createRouter({
    routeTree,
    ...(nonce ? { ssr: { nonce } } : {}),
    context: { queryClient },
    dehydrate: () => {
      const session = queryClient.getQueryState<AuthUser | null>(authSessionQueryKey);
      return {
        authSession:
          session?.status === "success"
            ? { user: session.data ?? null, updatedAt: session.dataUpdatedAt }
            : null,
      };
    },
    hydrate: ({ authSession }) => {
      if (authSession) {
        queryClient.setQueryData(authSessionQueryKey, authSession.user, {
          updatedAt: authSession.updatedAt,
        });
      }
    },
    scrollRestoration: true,
    scrollRestorationBehavior: "instant",
    defaultPreload: "intent",
    defaultPreloadDelay: 75,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
