// /utils/scripts/verifyWorkflowPipefail.ts
//
// A CI step that pipes cannot fail unless pipefail is on.
//
// interface-vision t-063: `verifyFacetArtworkMigration.ts` had been FAILING on
// main for some time and nobody noticed, because the step ran it as
//
//     run: npx tsx utils/scripts/verifyFacetArtworkMigration.ts 2>&1 | tee report.txt
//
// A pipeline's exit status is its LAST command's, so the step reported `tee`'s
// zero no matter what the verifier did. GitHub's default shell for `run:` is
// `bash -e {0}` — `-e` but NOT `-o pipefail` — so this is silent by default.
//
// The damage compounds: every `if: steps.<id>.outcome == 'failure'` that hangs
// off such a step is unreachable too. facet-catalog-contract.yml had an explicit
//
//     - name: Enforce illustrated Builder Facet coverage
//       if: steps.builder-coverage.outcome == 'failure'
//       run: exit 1
//
// written specifically to force a failure — and it could never fire, because the
// outcome it tested was always `success`. A workaround defeated by the same bug
// it was working around.
//
// Five steps across two workflows were inert when this was written. This is the
// same class as a test that never asserts: job green, badge green, check dead.
//
// THE FIX a step must carry: name `shell: bash` explicitly. GitHub then runs
// `bash --noprofile --norc -eo pipefail {0}`. `set -o pipefail` inside a
// multi-line `run:` works too, and is accepted here.

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const WORKFLOW_DIR = '.github/workflows'

/** Pipes into these are plumbing, not a verifier whose status matters. */
const HARMLESS_SINKS = /\|\s*(head|tail|wc|sort|uniq|jq|grep -c)\b/

const failures: string[] = []
let piped = 0

for (const entry of await readdir(WORKFLOW_DIR)) {
  if (!/\.ya?ml$/.test(entry)) continue

  const path = join(WORKFLOW_DIR, entry)
  const lines = (await readFile(path, 'utf8')).split('\n')

  // A file-level or job-level `defaults.run.shell: bash` covers every step in
  // scope, so a workflow that sets one is exempt wholesale.
  const wholeFile = lines.join('\n')
  if (/defaults:\s*\n\s*run:\s*\n\s*shell:\s*bash/.test(wholeFile)) continue

  lines.forEach((line, i) => {
    const isRun = /^\s*run:\s*\S/.test(line)
    if (!isRun || !line.includes('|')) return
    // `run: |` is a block scalar, not a pipe.
    if (/run:\s*\|\s*$/.test(line)) return
    if (HARMLESS_SINKS.test(line)) return

    piped += 1

    // `shell:` may sit either side of `run:` within the same step; scan a small
    // window rather than assuming an order.
    const window = lines.slice(Math.max(0, i - 6), i + 3).join('\n')
    if (/shell:\s*bash/.test(window) || /pipefail/.test(window)) return

    failures.push(
      `${path}:${i + 1}\n` +
        `           ${line.trim().slice(0, 96)}\n` +
        "           This step pipes, so its exit status is the LAST command's and the\n" +
        '           check before the pipe can never fail the job. Add `shell: bash`\n' +
        '           (GitHub then uses -eo pipefail) or `set -o pipefail` in the run block.',
    )
  })
}

console.log(`ok - scanned ${piped} piped workflow step(s)`)

if (failures.length) {
  console.error('\nWorkflow pipefail contract FAILED:\n')
  for (const f of failures) console.error(`  ✗ ${f}\n`)
  process.exit(1)
}

console.log(
  'Workflow pipefail contract passed: every piped step can still fail its job.',
)
