import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { GAME_LINK_PREVIEWS } from '../gameLinkPreview'

const root = process.cwd()
const read = (file: string) => readFileSync(join(root, file), 'utf8')

// 1. Share cards must not promise open access to a page a visitor cannot open.
// Silas, 2026-11-14: share cards match the games as they ship. A route gated
// to ADMIN says "private preview"; one that needs any account says "sign in".
type Gate = { role: string; permission: string }
const gates = new Map<string, Gate>()
const channels = join(root, 'content/channels')
for (const dir of readdirSync(channels)) {
  const folder = join(channels, dir)
  if (!existsSync(folder) || !folder.length) continue
  let files: string[]
  try {
    files = readdirSync(folder).filter((file) => file.endsWith('.md'))
  } catch {
    continue
  }
  for (const file of files) {
    const front =
      readFileSync(join(folder, file), 'utf8').split(/^---$/m)[1] ?? ''
    const route = front.match(/^route: (\S+)$/m)?.[1]
    if (!route) continue
    gates.set(route, {
      role: front.match(/^requiredRole: (\S+)$/m)?.[1] ?? '',
      permission: front.match(/^requiredPermission: (\S+)$/m)?.[1] ?? '',
    })
  }
}

const openPromise =
  /free (to browse|to try|in your browser)|no account needed|open it in your browser/i
let gatedCards = 0
for (const [slug, preview] of Object.entries(GAME_LINK_PREVIEWS)) {
  const gate = gates.get(preview.path ?? `/play/${slug}`)
  if (!gate) continue
  const svgPath = join(root, 'public', slug, 'link-preview.svg')
  const svg = existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : ''
  if (gate.role && gate.role !== 'GUEST') {
    gatedCards++
    assert.doesNotMatch(
      preview.description,
      openPromise,
      `${slug}: admin-only page promises open access`,
    )
    assert.match(
      preview.description,
      /private preview/i,
      `${slug}: say it is a private preview`,
    )
    assert.doesNotMatch(
      svg,
      openPromise,
      `${slug}: card art promises open access`,
    )
  } else if (gate.permission === 'authenticated') {
    gatedCards++
    assert.doesNotMatch(
      preview.description,
      openPromise,
      `${slug}: sign-in page promises open access`,
    )
    assert.match(
      preview.description,
      /sign in/i,
      `${slug}: say it needs a free sign-in`,
    )
    if (svg)
      assert.match(svg, /sign in/i, `${slug}: card art names the sign-in`)
  }
}
assert.ok(
  gatedCards >= 6,
  `expected the gated share cards to be checked, saw ${gatedCards}`,
)

// 2. Dedicated pages never inherit a stale content title or the "Robots" fallback.
const app = read('app.vue')
assert.match(
  app,
  /pageStore\.describesPath\(route\.path\)/,
  'app.vue scopes page titles to the route',
)
assert.match(
  app,
  /title: \(\) => routePageTitle\.value \|\| SITE_NAME/,
  'tab title falls back to the site name',
)
for (const page of ['pages/build-bench.vue', 'pages/shared-with-me.vue']) {
  assert.match(
    read(page),
    /useSeoMeta\(\{\s*title: '[^']+\| Kind Robots'/,
    `${page}: own tab title`,
  )
}

// 3. The homepage mission line wraps on phones instead of cutting off mid-word.
const directory = read('components/home/home-visitor-directory.vue')
const mission = directory.match(/<p\s+class="visitor-mission-line([^"]*)"/)
assert.ok(mission, 'mission line present')
assert.doesNotMatch(
  mission?.[1] ?? '',
  /\btruncate\b/,
  'mission line must not truncate',
)
assert.match(directory, /Helping fund mosquito nets\./)

console.log(`front door polish checks passed (${gatedCards} gated share cards)`)
