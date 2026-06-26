#!/usr/bin/env bash
# Publish an EAS Update (OTA) to the "staging" channel/branch with the staging
# EXPO_PUBLIC_* env baked into the JS bundle.
#
# Why this wrapper exists: `eas update` inlines EXPO_PUBLIC_* from the shell at
# bundle time, and the app falls back to http://localhost:4000 when
# EXPO_PUBLIC_API_URL is unset (see apps/mobile/lib/api.ts). Publishing bare
# would ship a localhost bundle that breaks on device. We source the SAME values
# the APK is built with (eas.json → build.preview.env) so the OTA bundle is
# identical to the installed build — it can never ship the localhost fallback.
#
# Usage (from apps/mobile, or via `pnpm update:staging`):
#   pnpm update:staging --message "what changed"
# Extra args are passed straight through to `eas update`.
set -euo pipefail

# Run from apps/mobile (where app.json / eas.json live) regardless of caller cwd.
cd "$(dirname "$0")/.."

# Export every EXPO_PUBLIC_* var from the preview build profile — eas.json is the
# single source of truth, so these stay in lockstep with the APK build.
eval "$(node -e "const e=require('./eas.json').build.preview.env || {}; for (const [k, v] of Object.entries(e)) if (k.startsWith('EXPO_PUBLIC_')) console.log('export ' + k + '=' + JSON.stringify(v));")"

if [ -z "${EXPO_PUBLIC_API_URL:-}" ]; then
  echo "ERROR: EXPO_PUBLIC_API_URL is empty — refusing to publish a localhost bundle." >&2
  exit 1
fi

echo "Publishing OTA → branch 'staging'  (EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL)"
exec eas update --branch staging "$@"
