#!/usr/bin/env bash
# scripts/check-deploy-ancestry.sh <target_sha> <live_sha>
#
# Shared by .github/workflows/cypress.yml's "Wait for deploy to go live" step
# and utils/scripts/verifyDeployWaitAncestry.ts's regression test, so a future
# edit to this ancestry check is exercised by both the real deploy-wait loop
# and a hermetic CI test -- not just re-verified by hand in scratch repos
# (see kind-robots/t-018 and t-023 in conductor's roadmap.yaml).
#
# Exits 0 (accept) when <live_sha> is a commit this checkout knows about and
# that already contains <target_sha> as an ancestor -- i.e. TARGET_SHA's
# changes are live via a newer, superseding commit. Exits 1 (reject)
# otherwise, including when <live_sha> isn't a commit this checkout has seen.
#
# Callers are responsible for fetching/deepening the checkout first so
# <live_sha> is resolvable when it should be -- this script does no network
# I/O, which is what keeps it hermetic and fast to test.
set -euo pipefail

target_sha="$1"
live_sha="$2"

git cat-file -e "${live_sha}^{commit}" 2>/dev/null \
  && git merge-base --is-ancestor "$target_sha" "$live_sha"
