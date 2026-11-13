#!/usr/bin/env bash
# Create once. Never print the key, store it in git, or rotate it on subsequent deploys.
set -euo pipefail
worker_name="$1"
existing=$(npx wrangler secret list --config dist/server/wrangler.json --name "$worker_name")
has_key=$(node -e 'const rows=JSON.parse(process.argv[1]);if(!Array.isArray(rows))throw Error("Invalid secret list");process.stdout.write(rows.some(r=>r.name==="PORTAL_BANK_KEY")?"yes":"no")' "$existing")
if [ "$has_key" = "yes" ]; then
  echo "Bank encryption key already configured."
else
  node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))' | npx wrangler secret put PORTAL_BANK_KEY --config dist/server/wrangler.json --name "$worker_name"
fi
