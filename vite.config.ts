// The preset below already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, and error logger plugins.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Without this, nitro falls back to its `cloudflare-module` default and emits
  // a Worker bundle, which Vercel cannot run as a server — every route then
  // fails SSR with "This page didn't load". NITRO_PRESET still wins if set, so
  // another target can override this without editing the file.
  nitro: { preset: process.env["NITRO_PRESET"] ?? "vercel" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
