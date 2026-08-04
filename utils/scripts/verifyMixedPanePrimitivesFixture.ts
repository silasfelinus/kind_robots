import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const FIXTURE_RELATIVE_PATH =
  'components/__layout-contract-mixed-pane-primitives-fixture.vue'
const FIXTURE_PATH = join(ROOT, FIXTURE_RELATIVE_PATH)
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const fixture = `<template>
  <section class="kr-panes kr-anchor-panes">
    <aside class="kr-pane-scroll"></aside>
    <div class="kr-anchor-scroll"></div>
  </section>
</template>
`

try {
  writeFileSync(FIXTURE_PATH, fixture)
  const output = execFileSync(
    npm,
    ['run', 'test:layout-contract', '--', '--report'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  if (!output.includes(FIXTURE_RELATIVE_PATH)) {
    throw new Error(
      'A component mixing kr-panes and kr-anchor-panes was not reported as a one-scroll violation.',
    )
  }

  console.log(
    'Mixed pane primitive fixture holds: kr-panes and kr-anchor-panes cannot be combined.',
  )
} finally {
  rmSync(FIXTURE_PATH, { force: true })
}
