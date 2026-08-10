import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Produce a self-contained `.next/standalone` build so the web app can run
  // in a Docker container without a full `node_modules` install. Used for
  // local development, CI, and as a portability fallback — production web
  // still runs on Vercel, which builds the same app natively.
  output: "standalone",
  // This is a workspace monorepo; trace from the repo root so hoisted
  // node_modules and any shared files resolve correctly in standalone output.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default withNextIntl(nextConfig);