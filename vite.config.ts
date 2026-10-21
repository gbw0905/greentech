// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Server routes need non-VITE_ env vars (e.g. LOVABLE_API_KEY) in process.env.
Object.assign(process.env, loadEnv(process.env['NODE_ENV'] || "development", process.cwd(), ""));

export default defineConfig({
  nitro: {
    preset: process.env.LOCAL_PREVIEW ? "node" : "vercel",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    optimizeDeps: {
      // These document parsers run on the server. Prebundling their native
      // canvas binary for the browser fails and blocks every client module.
      exclude: ["@napi-rs/canvas", "pdf-parse", "pdfjs-dist"],
    },
    // The MCP plugin currently compares Windows paths without normalizing
    // separators and rejects this otherwise valid routes directory. MCP is
    // Lovable editor tooling, not part of the application runtime.
    plugins: process.platform === "win32" ? [] : [mcpPlugin()],
    optimizeDeps: {
      exclude: ["@napi-rs/canvas"],
    },
  },
});
