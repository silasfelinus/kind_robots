from pathlib import Path


def replace(path_name: str, pairs: list[tuple[str, str]]) -> None:
    path = Path(path_name)
    text = path.read_text()
    for old, new in pairs:
        if old not in text:
            raise SystemExit(f'Missing expected text in {path_name}: {old!r}')
        text = text.replace(old, new)
    path.write_text(text)


def move(old_name: str, new_name: str) -> None:
    old = Path(old_name)
    new = Path(new_name)
    if not old.exists():
        raise SystemExit(f'Missing expected source file: {old_name}')
    if new.exists():
        raise SystemExit(f'Canonical destination already exists: {new_name}')
    old.rename(new)


move('content/serendipity-voice.md', 'content/serendipity.md')
replace(
    'content/serendipity.md',
    [
        ('title: Serendipity Voice', 'title: Serendipity'),
        ('tabKey: serendipity-voice', 'tabKey: serendipity'),
        ('dashboardTab: serendipity-voice', 'dashboardTab: serendipity'),
        (':serendipity-voice-page', ':serendipity-page'),
    ],
)

move(
    'content/channels/play/serendipity-voice.md',
    'content/channels/play/serendipity.md',
)
replace(
    'content/channels/play/serendipity.md',
    [
        ('tabKey: serendipity-voice', 'tabKey: serendipity'),
        ('dashboardTab: serendipity-voice', 'dashboardTab: serendipity'),
        ('label: Serendipity Voice', 'label: Serendipity'),
        ('title: Serendipity Voice', 'title: Serendipity'),
        ('route: /serendipity-voice', 'route: /serendipity'),
    ],
)

move(
    'components/pages/serendipity-voice-page.vue',
    'components/pages/serendipity-page.vue',
)
replace(
    'components/pages/serendipity-page.vue',
    [
        (
            '<!-- /components/pages/serendipity-voice-page.vue -->',
            '<!-- /components/pages/serendipity-page.vue -->',
        ),
        (
            'Serendipity Voice — the Kind Robots front end for the Alexa voice surface.',
            'Serendipity — the Kind Robots front end for the Alexa voice surface.',
        ),
        (
            '<h1 class="text-2xl font-black tracking-tight">Serendipity Voice</h1>',
            '<h1 class="text-2xl font-black tracking-tight">Serendipity</h1>',
        ),
    ],
)

replace(
    'stores/helpers/dashboardHelper.ts',
    [
        ("key: 'serendipity-voice',", "key: 'serendipity',"),
        ("label: 'Serendipity Voice',", "label: 'Serendipity',"),
        ("title: 'Serendipity (Voice)',", "title: 'Serendipity',"),
        (
            "'The spoken-word version of Serendipity — listen, answer aloud, keep moving.',",
            "'Talk to Serendipity, answer aloud, and keep the Kind Robots voice surface moving.',",
        ),
        (
            "'Serendipity with a voice: hear the story, answer out loud, and let a hands-free narrator carry the helpful little fairy tale while you keep your hands busy.',",
            "'Hear Serendipity, answer out loud, and let a hands-free narrator carry the helpful little fairy tale while you keep your hands busy.',",
        ),
        ("route: '/serendipity-voice',", "route: '/serendipity',"),
    ],
)

replace(
    'components/conductor/voice-lab-page.vue',
    [
        ('to="/serendipity-voice"', 'to="/serendipity"'),
        ('Open the full Serendipity Voice view', 'Open the full Serendipity view'),
        ("label: 'Open Serendipity Voice view',", "label: 'Open Serendipity view',"),
        ("href: '/serendipity-voice',", "href: '/serendipity',"),
    ],
)

boundary = Path('docs/products/storymaker-taskmaster-boundary.md')
boundary_text = boundary.read_text()
old_boundary = '''## Serendipity name

The former task-story product is renamed completely to Taskmaster.

- `/taskmaster` is the sole product route.
- `/serendipity` must not remain as a redirect, alias, compatibility page, deprecated wrapper, content slug, store alias, or dashboard key.
- Obsolete Serendipity task-story files are deleted after their Taskmaster replacements are wired.
- Serendipity Voice is a separate product and keeps its existing name and route.
'''
new_boundary = '''## Serendipity name

The former task-story product is renamed completely to Taskmaster, leaving the Serendipity name and route free for the voice-led experience.

- `/taskmaster` is the sole task-story product route.
- `/serendipity` is the sole Serendipity product route and hosts the voice-led experience.
- `/serendipity-voice` must not remain as a route, redirect, alias, compatibility page, content slug, component identity, or dashboard key.
- The separate voice-relay repository and internal integration types may retain `serendipity-voice` only where they specifically name that relay subsystem.
- Obsolete Serendipity task-story files remain deleted after their Taskmaster replacements are wired.
'''
if old_boundary not in boundary_text:
    raise SystemExit('Missing expected Serendipity boundary block')
boundary.write_text(boundary_text.replace(old_boundary, new_boundary))

Path('docs/contracts/serendipity-route-contract.md').write_text('''# Serendipity Route Contract

Serendipity is the canonical voice-led product identity in Kind Robots.

- The public product route is `/serendipity`.
- The Play tab, dashboard key, root content page, and page component use `serendipity` directly.
- `/serendipity-voice` is not a redirect, alias, compatibility route, content slug, component identity, or dashboard key.
- The external relay repository and internal voice integration types may retain the `serendipity-voice` name when referring specifically to that subsystem.
- Voice Lab links to `/serendipity`.
''')

Path('utils/scripts/verifySerendipityRouteCutover.mjs').write_text(r'''import assert from 'node:assert/strict'
import fs from 'node:fs'

const rootPath = 'content/serendipity.md'
const channelPath = 'content/channels/play/serendipity.md'
const componentPath = 'components/pages/serendipity-page.vue'

for (const path of [rootPath, channelPath, componentPath]) {
  assert.equal(fs.existsSync(path), true, `missing canonical Serendipity file: ${path}`)
}

for (const path of [
  'content/serendipity-voice.md',
  'content/channels/play/serendipity-voice.md',
  'components/pages/serendipity-voice-page.vue',
]) {
  assert.equal(fs.existsSync(path), false, `obsolete Serendipity Voice identity remains: ${path}`)
}

const root = fs.readFileSync(rootPath, 'utf8')
const channel = fs.readFileSync(channelPath, 'utf8')
const component = fs.readFileSync(componentPath, 'utf8')
const dashboard = fs.readFileSync('stores/helpers/dashboardHelper.ts', 'utf8')
const voiceLab = fs.readFileSync('components/conductor/voice-lab-page.vue', 'utf8')
const boundary = fs.readFileSync('docs/products/storymaker-taskmaster-boundary.md', 'utf8')

assert.match(root, /^title: Serendipity$/m)
assert.match(root, /^tabKey: serendipity$/m)
assert.match(root, /^dashboardTab: serendipity$/m)
assert.match(root, /:serendipity-page\s*$/m)
assert.doesNotMatch(root, /serendipity-voice-page/)

assert.match(channel, /^tabKey: serendipity$/m)
assert.match(channel, /^dashboardTab: serendipity$/m)
assert.match(channel, /^label: Serendipity$/m)
assert.match(channel, /^title: Serendipity$/m)
assert.match(channel, /^route: \/serendipity$/m)
assert.doesNotMatch(channel, /^route: \/serendipity-voice$/m)

assert.match(component, /<h1 class="text-2xl font-black tracking-tight">Serendipity<\/h1>/)
assert.doesNotMatch(component, /components\/pages\/serendipity-voice-page\.vue/)

const serendipityTab = dashboard.match(
  /\{\s*key: 'serendipity',[\s\S]*?route: '\/serendipity',\s*\}/,
)
assert.ok(serendipityTab, 'dashboard must expose a canonical Serendipity tab')
assert.doesNotMatch(dashboard, /route: '\/serendipity-voice'/)
assert.doesNotMatch(dashboard, /key: 'serendipity-voice'/)

assert.match(voiceLab, /to="\/serendipity"/)
assert.match(voiceLab, /href: '\/serendipity'/)
assert.doesNotMatch(voiceLab, /(?:to="|href: ')\/serendipity-voice/)

assert.match(boundary, /`\/serendipity` is the sole Serendipity product route/)
assert.match(boundary, /`\/serendipity-voice` must not remain as a route/)

console.log('Serendipity route cutover contract passed.')
''')

Path('.github/workflows/serendipity-route-contract.yml').write_text('''name: Serendipity Route Contract

on:
  push:
    branches: [main]
    paths:
      - '.github/workflows/serendipity-route-contract.yml'
      - 'content/serendipity.md'
      - 'content/channels/play/serendipity.md'
      - 'components/pages/serendipity-page.vue'
      - 'components/conductor/voice-lab-page.vue'
      - 'stores/helpers/dashboardHelper.ts'
      - 'docs/products/storymaker-taskmaster-boundary.md'
      - 'docs/contracts/serendipity-route-contract.md'
      - 'utils/scripts/verifySerendipityRouteCutover.mjs'
  pull_request:
    branches: [main]
    paths:
      - '.github/workflows/serendipity-route-contract.yml'
      - 'content/serendipity.md'
      - 'content/channels/play/serendipity.md'
      - 'components/pages/serendipity-page.vue'
      - 'components/conductor/voice-lab-page.vue'
      - 'stores/helpers/dashboardHelper.ts'
      - 'docs/products/storymaker-taskmaster-boundary.md'
      - 'docs/contracts/serendipity-route-contract.md'
      - 'utils/scripts/verifySerendipityRouteCutover.mjs'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: serendipity-route-${{ github.ref }}
  cancel-in-progress: true

jobs:
  contract:
    name: Canonical Serendipity route
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Verify canonical route and identities
        run: node utils/scripts/verifySerendipityRouteCutover.mjs
''')
