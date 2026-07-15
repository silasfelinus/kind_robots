#!/usr/bin/env bash
# Vercel "Ignored Build Step" guard — build production (main) only.
#
# WHY: Vercel auto-deploys on every git push via its Git integration. With many
# agent branches (claude/*, agent/*) and PR previews each triggering their own
# preview build, deploy volume can bump Vercel plan limits (concurrent builds /
# daily deploy cap), which then delays the production deployment the Cypress
# workflow waits for ("Wait for deploy to go live") until it times out.
#
# This guard skips every non-production build so only main deploys automatically.
# vercel.json's git.deploymentEnabled can't do this — it only toggles *named*
# branches, not arbitrary agent branch patterns.
#
# SETUP (one-time, Vercel dashboard — cannot be set from the repo):
#   Project kind-robots → Settings → Git → Ignored Build Step → Command:
#       bash scripts/vercel-ignore-build.sh
#
# Exit code contract (per Vercel): 0 = skip the build, 1 = proceed with build.

if [ "$VERCEL_ENV" = "production" ]; then
  echo "VERCEL_ENV=production — proceeding with build."
  exit 1
fi

echo "VERCEL_ENV=${VERCEL_ENV:-unset} (non-production) — skipping build."
exit 0
