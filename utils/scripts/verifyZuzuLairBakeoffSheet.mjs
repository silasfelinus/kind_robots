import assert from 'node:assert/strict'
import { buildSheet } from './buildZuzuLairBakeoffSheet.mjs'

const manifest = {
  scenes: [
    { id: 'walk', label: '<b>Walk</b>', prompt: 'camera <push>' },
    { id: 'action', label: 'Action' },
    { id: 'acting', label: 'Acting' },
    { id: 'wide', label: 'Wide' },
  ],
  lanes: [
    { id: 'ltx-balanced', label: 'LTX balanced' },
    { id: 'ltx-quality', label: 'LTX full' },
    { id: 'wan-ti2v', label: 'WAN TI2V' },
    { id: 'wan-a14b', label: 'WAN A14B' },
  ],
  clips: [
    {
      sceneId: 'walk',
      laneId: 'wan-ti2v',
      file: 'clips/a test.mp4',
      jobId: 42,
      seed: 123,
    },
  ],
}

const html = buildSheet(manifest)
assert.equal((html.match(/<tr><th scope="row">/g) || []).length, 4)
assert.equal((html.match(/<td>/g) || []).length, 16)
assert.equal((html.match(/<video /g) || []).length, 1)
assert.equal((html.match(/Not rendered/g) || []).length, 15)
assert.match(html, /&lt;b&gt;Walk&lt;\/b&gt;/)
assert.match(html, /camera &lt;push&gt;/)
assert.match(html, /clips\/a%20test.mp4/)
assert.doesNotMatch(html, /<b>Walk<\/b>/)

for (const bad of [
  { ...manifest, clips: [...manifest.clips, manifest.clips[0]] },
  {
    ...manifest,
    clips: [{ sceneId: 'walk', laneId: 'wan-ti2v', file: '../escape.mp4' }],
  },
  {
    ...manifest,
    clips: [{ sceneId: 'unknown', laneId: 'wan-ti2v', file: 'clip.mp4' }],
  },
]) {
  assert.throws(() => buildSheet(bad))
}
console.log('Zuzu Lair clip comparison sheet: 10 checks passed')
