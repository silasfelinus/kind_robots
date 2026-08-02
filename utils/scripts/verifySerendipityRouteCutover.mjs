import assert from 'node:assert/strict'
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

// Semantic identity assertion, not an exact-tag lock: the layout-contract
// (interface-vision/t-017) forbids page components from owning an <h1> — the
// app shell renders the page title — so this only pins the visual identity
// marker (bold text-2xl "Serendipity" label beside the icon), not its tag.
assert.match(
  component,
  /<[a-z][a-z0-9]*[^>]*class="text-2xl font-black tracking-tight"[^>]*>Serendipity<\/[a-z][a-z0-9]*>/,
)
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
