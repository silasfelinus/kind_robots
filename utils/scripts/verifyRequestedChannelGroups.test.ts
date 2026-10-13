import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')
const nav = (path: string) => read(`content/channels/${path}.md`)
const channel = nav('projects/index')
assert.match(channel, /\nlabel: Projects\n/)
assert.match(channel, /\ndefaultTab: storybook\n/)
assert.equal(existsSync('content/channels/storybook/index.md'), false)
assert.match(nav('projects/story-storybook'), /\ntabKey: storybook\n/)
for (const key of ['bots', 'characters', 'facets', 'gallery', 'model-builder', 'rewards', 'scenarios']) {
  const file = key === 'gallery' ? 'story-gallery' : `story-${key}`
  assert.match(nav(`projects/${file}`), /\nparentTabKey: storybook\n/)
}
for (const key of ['zuzu-gamebook', 'zuzu-showdown', 'zuzu-shifting-lands', 'zuzu-pinball', 'zuzu-lair', 'emperor-of-dust', 'zuzu-ghost-trail']) {
  assert.match(nav(`zuzu/${key}`), /\nchannelKey: zuzu\n/)
}
for (const key of ['zuzu-lair', 'emperor-of-dust']) {
  assert.match(nav(`zuzu/${key}`), /\nrequiredRole: ADMIN\n/)
  assert.equal(existsSync(`content/channels/admin/${key}.md`), false)
}
assert.match(nav('admin/retired'), /\nsort: 9999\n/)
assert.match(nav('zuzu/zuzu-ghost-trail'), /\nroute: \/play\/zuzu-ghost-trail\n/)
assert.match(read('pages/play/zuzu-ghost-trail.vue'), /<ArcadeCabinet slug="zuzu-ghost-trail" \/>/)
for (const tab of ['aquarium', 'experiments', 'shifting-desks']) {
  assert.match(nav(`arcade/${tab}`), /\nchannelKey: arcade\n/)
  assert.equal(existsSync(`content/channels/projects/${tab}.md`), false)
}
for (const tab of ['art', 'video-generator', 'mandarin', 'button', 'daily-pitches', 'music-video']) {
  assert.match(nav(`projects/${tab}`), /\nchannelKey: projects\n/)
}
console.log('Requested navigation grouping contract passed')
