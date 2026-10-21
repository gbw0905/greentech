import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Server routes need non-VITE_ env vars (e.g. GEMINI_API_KEY) in process.env.
Object.assign(process.env, loadEnv(process.env["NODE_ENV"] || "development", process.cwd(), ""));

export default defineConfig(async ({ command, mode }) => {
  const plugins: any[] = [];

  // TanStack devtools (dev only)
  if (mode === "development") {
    const { devtools } = await import("@tanstack/devtools-vite");
    plugins.push(
      devtools({
        logging: false,
        eventBusConfig: { enabled: false },
        enhancedLogs: { enabled: false },
        consolePiping: { enabled: false },
        removeDevtoolsOnBuild: false,
        injectSource: { enabled: true },
      }),
    );
  }

  plugins.push(tailwindcss());
  plugins.push(tsConfigPaths({ projects: ["./tsconfig.json"] }));

  plugins.push(
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      server: { entry: "server" },
    }),
  );

  // Nitro deploy plugin (build only)
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(
      nitro({
        preset: process.env.LOCAL_PREVIEW ? "node" : "vercel",
      }),
    );
  }

  plugins.push(react());

  // Inject VITE_* env vars as import.meta.env defines
  const envDefine: Record<string, string> = {};
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      exclude: ["@napi-rs/canvas", "pdf-parse", "pdfjs-dist"],
    },
    server: { host: "::", port: 8080 },
    plugins,
  };
});
