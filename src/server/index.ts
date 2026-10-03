/**
 * OpenEvent Guide server entry point.
 *
 * Resolves the security config, refusing to start when a non-local server has
 * no GUIDE_API_TOKEN (see src/server/security.ts), then serves the routes from
 * src/server/app.ts.
 */

import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { describeLlm } from "./brain.js";
import { resolveServerConfig, type ServerConfig } from "./security.js";

const PORT = Number(process.env.PORT ?? 3847);
const RATE_LIMIT = Number(process.env.GUIDE_RATE_LIMIT ?? 30); // requests per minute

let config: ServerConfig;
try {
  config = resolveServerConfig(process.env);
} catch (err) {
  console.error(`\n  Refusing to start: ${(err as Error).message}\n`);
  process.exit(1);
}

const { app, sweep } = createApp({ ...config, rateLimit: RATE_LIMIT });

setInterval(sweep, 5 * 60 * 1000);

serve({ fetch: app.fetch, port: PORT, hostname: config.host }, () => {
  console.log(`\n  OpenEvent Guide Server`);
  console.log(`  ---------------------`);
  console.log(`  http://${config.host.includes(":") ? `[${config.host}]` : config.host}:${PORT}`);
  console.log(`  Chat model: ${describeLlm()}`);
  console.log(`  GET  /sdk.js             (the SDK bundle)`);
  console.log(`  GET  /api/flows          (flow summaries)`);
  console.log(`  GET  /api/flow/:id       (one resolved flow)`);
  console.log(`  POST /api/chat           (chat)`);
  console.log(`  POST /api/voice-session  (voice token + instructions)`);
  console.log(`  POST /api/voice-sdp      (WebRTC SDP proxy)`);
  console.log(`  GET  /health\n`);
  if (config.local && !config.apiToken) {
    console.warn("  Local development mode: /api/* needs no token. Not reachable beyond this machine.\n");
  }
});
