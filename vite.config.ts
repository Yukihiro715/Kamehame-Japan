import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// The commission ledger's D1 database (lib/referral, migrations/). The deploy
// workflows create it and pass its id in KAMEHAME_D1_ID; a local build uses a
// placeholder id so wrangler dev/miniflare can run the migrations locally. In
// CI without an id (the API token cannot manage D1 yet) the binding is left out
// and the referral features stay off, so a deploy never points at a database
// that does not exist.
const LOCAL_D1_PLACEHOLDER_ID = "00000000-0000-4000-8000-00000000d1d1";
const ledgerD1Id = process.env.KAMEHAME_D1_ID || (process.env.CI ? undefined : LOCAL_D1_PLACEHOLDER_ID);
const ledgerD1Name = process.env.KAMEHAME_D1_NAME || "kamehame-ledger";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  // Contact-form delivery. No destination is pinned here: the route sends to
  // the CONTACT_TO secret, which must be a verified Email Routing address.
  send_email: [{ name: "EMAIL" }],
  // Workers AI: translates what a visitor typed into Japanese for the team's
  // notification (lib/translate.ts). No key needed; the free tier covers it.
  ai: { binding: "AI" },
  // Checkout readiness (lib/experience-checkout.ts): a cron asks the ledger
  // every five minutes and publishes the answer to KV, so page renders never
  // wait for Google Apps Script. The namespace is created by the deploy
  // workflow, which passes its id in READY_STATE_KV_ID; without it the
  // binding is omitted and pages fall back to the in-request cache.
  triggers: { crons: ["*/5 * * * *"] },
  kv_namespaces: process.env.READY_STATE_KV_ID
    ? [{ binding: "READY_STATE", id: process.env.READY_STATE_KV_ID }]
    : [],
  // ARCHIVE_TO (optional secret) would add a second recipient to the team
  // notification; the booking ledger (lib/ledger.ts) is the record instead.
  d1_databases: ledgerD1Id
    ? [{ binding: "DB", database_name: ledgerD1Name, database_id: ledgerD1Id, migrations_dir: "migrations" }]
    : d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
