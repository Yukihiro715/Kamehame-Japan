#!/usr/bin/env bash
# Find or create the R2 bucket named $1 and export its name as
# KAMEHAME_R2_BUCKET for the build (vite.config.ts binds it as MEDIA, the
# review form's photo and video store). Needs CLOUDFLARE_API_TOKEN with
# Workers R2 Storage edit permission; without it the step fails, the workflow
# continues (continue-on-error) and the Worker is deployed without the binding,
# so the form falls back to photos by email.
set -u
name="${1:?bucket name}"

if npx wrangler r2 bucket list 2>/dev/null | grep -qE "^name:\s+${name}\$|\"name\":\s*\"${name}\""; then
  echo "R2 bucket $name: exists"
else
  out=$(npx wrangler r2 bucket create "$name" 2>&1) || {
    if echo "$out" | grep -qi "already exists"; then echo "R2 bucket $name: exists"; else echo "could not create the R2 bucket $name:"; echo "$out"; exit 1; fi
  }
  echo "R2 bucket $name: created"
fi
echo "KAMEHAME_R2_BUCKET=$name" >> "${GITHUB_ENV:-/dev/null}"
