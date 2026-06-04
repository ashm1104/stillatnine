import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a parent-level lockfile exists on
  // this machine, which otherwise makes Next infer the wrong root).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // The Dodo webhook reads the welcome email HTML at runtime via fs. Trace it
  // into that function's bundle so it exists on Vercel (see lib/welcome-email).
  outputFileTracingIncludes: {
    "/api/webhooks/dodo": ["./emails/welcome-template.html"],
  },
};

export default nextConfig;
