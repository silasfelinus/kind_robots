import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')
const nav = (path: string) => read(`content/channels/${path}.md`)

const channel = nav('projects/index')
assert.match(channel, /\nlabel: Projects\n/)
assert.match(channel, /\ndefaultTab: storybook\n/)
assert.equal(existsSync('content/channels/storybook/index.md'), false)
assert.equal(existsSync('content/channels/zuzu/index.md'), false)
assert.match(nav('projects/story-storybook'), /\ntabKey: storybook\n/)

for (const key of [
  'bots',
  'characters',
  'facets',
  'gallery',
  'model-builder',
  'rewards',
  'scenarios',
]) {
  const file = key === 'gallery' ? 'story-gallery' : `story-${key}`
  assert.match(nav(`projects/${file}`), /\nparentTabKey: storybook\n/)
}

for (const key of [
  'zuzu-gamebook',
  'zuzu-showdown',
  'zuzu-shifting-lands',
  'zuzu-pinball',
  'emperor-of-dust',
  'zuzu-ghost-trail',
  'crystal-street',
]) {
  assert.match(nav(`arcade/${key}`), /\nchannelKey: arcade\n/)
}
for (const key of ['zuzu-lair']) {
  assert.match(nav(`admin/${key}`), /\nchannelKey: admin\n/)
  assert.match(nav(`admin/${key}`), /\nrequiredRole: ADMIN\n/)
  assert.equal(existsSync(`content/channels/arcade/${key}.md`), false)
}

assert.match(
  nav('arcade/emperor-of-dust'),
  /\nroute: \/play\/emperor-of-dust\n/,
)
assert.doesNotMatch(nav('arcade/emperor-of-dust'), /requiredRole: ADMIN/)
for (const key of [
  'sliding-tile-gallery',
  'save-the-plumber',
  'rainbow-bullet-hell-space-princess',
]) {
  const tab = nav(`arcade/${key}`)
  assert.match(tab, /\nchannelKey: arcade\n/)
  assert.match(tab, /Work in progress/)
  assert.doesNotMatch(tab, /requiredRole: ADMIN/)
  assert.ok(tab.includes(`route: /play/${key}`))
  assert.equal(existsSync(`content/channels/admin/${key}.md`), false)
}

for (const key of ['hybridizer', 'slime-city'] as const) {
  const playTab = nav(`arcade/${key}`)
  const adminTab = nav(`admin/${key}`)
  const playPage = read(`pages/play/${key}.vue`)
  assert.match(playTab, /\nchannelKey: arcade\n/)
  assert.match(playTab, /\nrequiredPermission: authenticated\n/)
  assert.ok(playTab.includes(`route: /play/${key}`))
  assert.doesNotMatch(playTab, /\nrequiredRole: ADMIN\n/)
  assert.match(adminTab, /\nnavigation: false\n/)
  assert.match(adminTab, /\nrequiredRole: ADMIN\n/)
  assert.ok(adminTab.includes(`route: /admin/${key}`))
  assert.ok(
    playPage.includes(`~/pages/admin/${key}.vue`),
    'Play route reuses the existing game surface and Pinia state',
  )
  assert.ok(existsSync(`pages/admin/${key}.vue`))
}
assert.match(nav('arcade/index'), /Hybridizer, Slime City/)

assert.match(nav('admin/retired'), /\nsort: 9999\n/)
assert.match(nav('admin/zuzu-lair'), /\nroute: \/admin\/zuzu-lair\n/)
assert.equal(existsSync('pages/play/zuzu-lair.vue'), false)
assert.equal(existsSync('pages/admin/zuzu-lair.vue'), true)
assert.match(
  nav('arcade/zuzu-ghost-trail'),
  /\nroute: \/play\/zuzu-ghost-trail\n/,
)
assert.match(
  read('pages/play/zuzu-ghost-trail.vue'),
  /<ArcadeCabinet slug="zuzu-ghost-trail" \/>/,
)

for (const [route, cabinetSlug] of [
  ['zuzu-ghost-trail', 'zuzu-ghost-trail'],
  ['zuzu-pinball', 'zuzu-pinball'],
] as const) {
  const source = read(`pages/play/${route}.vue`)
  assert.match(source, /h-full min-h-0/)
  assert.match(source, /kr-scroll min-h-0 flex-1/)
  assert.equal((source.match(/kr-scroll/g) ?? []).length, 1)
  assert.ok(source.includes(`<ArcadeCabinet slug="${cabinetSlug}" />`))
}
const showdown = read('pages/play/zuzu-showdown.vue')
assert.match(showdown, /<details class="kr-panel/)
assert.match(showdown, /Match setup &amp; training/)
assert.doesNotMatch(showdown, /<h2 class="mb-2 font-bold">Controls<\/h2>/)
assert.match(nav('arcade/zuzu-showdown'), /Gamepad|gamepad/i)
const sitewideAudit = read('utils/scripts/auditResponsiveLayout.mjs')
assert.match(sitewideAudit, /clippedGalleries/)
assert.match(sitewideAudit, /viewportReadings/)
assert.match(
  read('.github/workflows/responsive-layout-audit.yml'),
  /--viewport-report audit-shots\/viewport-ownership\.json/,
)

for (const tab of ['aquarium', 'experiments', 'shifting-desks']) {
  assert.match(nav(`arcade/${tab}`), /\nchannelKey: arcade\n/)
  assert.equal(existsSync(`content/channels/projects/${tab}.md`), false)
}

for (const tab of ['art', 'video-generator', 'mandarin', 'button']) {
  assert.match(nav(`projects/${tab}`), /\nchannelKey: projects\n/)
}

assert.equal(existsSync('content/channels/projects/daily-pitches.md'), false)
assert.match(nav('admin/daily-pitches'), /\nchannelKey: admin\n/)
assert.match(nav('admin/daily-pitches'), /\nrequiredRole: ADMIN\n/)
for (const key of [
  'coat-dance',
  'zuzu-world',
  'zuzu-pinball-workshop',
  'butterfly-gallery',
  'art-archive',
  'art-review',
  'brainstorm',
  'playbook-manager',
  'playbook-kit',
]) {
  assert.match(nav(`admin/${key}`), /\nparentTabKey: retired\n/)
  assert.match(nav(`admin/${key}`), /\nrequiredRole: ADMIN\n/)
}
for (const key of [
  'zuzu-ghost-trail',
  'zuzu-pinball',
  'sliding-tile-gallery',
]) {
  assert.match(nav(`arcade/${key}`), /\nnavigation: false\n/)
}

assert.equal(existsSync('content/channels/projects/music-video.md'), false)
const videoStudio = nav('projects/video-generator')
assert.ok(videoStudio.includes('route: /play/video-generator'))
assert.match(videoStudio, /Music Videos tab/)
assert.equal(existsSync('components/music-video/music-video-studio.vue'), true)

console.log('Requested navigation grouping contract passed')
