#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

# GNU timeout keeps CI builds bounded. macOS ships without it (Homebrew
# coreutils installs it as gtimeout), so fall back to an unbounded build
# rather than failing local deploys.
timeout_bin=""
if command -v timeout >/dev/null 2>&1; then
  timeout_bin="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  timeout_bin="gtimeout"
fi

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

if [[ -n "${timeout_bin}" ]]; then
  echo "Running bounded vinext build..."
  "${timeout_bin}" \
    --signal=TERM \
    --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
    "${SITES_BUILD_TIMEOUT:-3m}" \
    "${vinext}" build
else
  echo "GNU timeout not found; running vinext build without a time bound..."
  "${vinext}" build
fi

# The D1 migrations travel with the generated deploy config: wrangler resolves
# `migrations_dir` relative to dist/server/wrangler.json (vite.config.ts), so the
# deploy workflows can run `wrangler d1 migrations apply --config dist/server/wrangler.json`.
if [[ -d "${SITES_PROJECT_ROOT}/migrations" && -d "${SITES_PROJECT_ROOT}/dist/server" ]]; then
  rm -rf "${SITES_PROJECT_ROOT}/dist/server/migrations"
  cp -R "${SITES_PROJECT_ROOT}/migrations" "${SITES_PROJECT_ROOT}/dist/server/migrations"
fi
