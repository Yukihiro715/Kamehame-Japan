#!/usr/bin/env bash
# Find or create the D1 database named $1 and export its id as KAMEHAME_D1_ID
# for the build (vite.config.ts binds it as DB). Used by the deploy workflows.
# Needs CLOUDFLARE_API_TOKEN with D1 edit permission; without it the step
# fails, the workflow continues (continue-on-error) and the Worker is deployed
# without the binding, so nothing points at a database that does not exist.
set -u
name="${1:?database name}"

id=$(npx wrangler d1 list --json 2>/dev/null | node -e '
  let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
    try { const l = JSON.parse(s); const n = l.find(x => x.name === process.argv[1]); console.log(n ? n.uuid : ""); }
    catch { console.log(""); }
  })' "$name")

if [ -z "$id" ]; then
  out=$(npx wrangler d1 create "$name" 2>&1) || { echo "could not create the D1 database $name:"; echo "$out"; exit 1; }
  id=$(echo "$out" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
fi

if [ -n "$id" ]; then
  echo "KAMEHAME_D1_ID=$id" >> "${GITHUB_ENV:-/dev/null}"
  echo "D1 database $name: $id"
else
  echo "no D1 database id for $name"
  exit 1
fi
