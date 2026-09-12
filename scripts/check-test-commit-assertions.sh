#!/usr/bin/env bash
set -euo pipefail

base_ref="${1:-}"
if [[ -z "$base_ref" ]]; then
  echo "usage: $0 <base-ref>" >&2
  exit 2
fi

test_prefix_re='^test(\([^)]*\))?:[[:space:]]'

warned=0
while IFS= read -r commit; do
  [[ -z "$commit" ]] && continue
  subject="$(git log -1 --format=%s "$commit")"
  if [[ ! "$subject" =~ $test_prefix_re ]]; then
    continue
  fi

  if git diff-tree --no-commit-id --name-only -r "$commit" | grep -Eq '(^|/)[^/]+\.(test|spec)\.[^.]+$'; then
    continue
  fi

  if git show --format= --unified=0 "$commit" | grep -Eq '^\+[^+].*\b(assert|expect)[[:space:]]*\('; then
    continue
  fi

  echo "::warning title=Test commit without assertion::${commit:0:12} '${subject}' touches no *.test.*/*.spec.* file and adds no assert(...)/expect(...) call. Confirm this commit contains executable test coverage rather than fixtures, prose, or test infrastructure only."
  warned=1
done < <(git rev-list --reverse "${base_ref}..HEAD")

if [[ "$warned" -eq 1 ]]; then
  echo "Test-commit assertion audit completed with warnings."
else
  echo "Test-commit assertion audit clean."
fi
