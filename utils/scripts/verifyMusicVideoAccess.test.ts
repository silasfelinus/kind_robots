// utils/scripts/verifyMusicVideoAccess.test.ts
// Silas, 2026-10-07: public music videos show to everyone in the Play
// gallery, private ones stay with their owner, and any logged-in user can
// remix one they can see.
import assert from 'node:assert/strict'
import {
  canPlayMusicVideoFinal,
  canViewMusicVideo,
  remixMusicVideoDoc,
  remixMusicVideoTitle,
  type MusicVideoViewer,
} from '../musicVideoAccess'
import { normalizeMusicVideoDoc } from '../musicVideoDoc'
import { musicVideoSpecByKey, specToDoc } from '../musicVideoSpecs'

const viewer = (patch: Partial<MusicVideoViewer> = {}): MusicVideoViewer => ({
  userId: 2,
  isAdmin: false,
  showMature: false,
  restricted: false,
  ...patch,
})
const anonymous = viewer({ userId: null, restricted: true })
const video = { userId: 1, isPublic: true, finalArtImageId: 50 }
const final = { userId: 1, isActive: true, isMature: false }

// Public with a final cut: everyone, signed in or not.
assert.equal(canViewMusicVideo(video, final, viewer()), true)
assert.equal(canViewMusicVideo(video, final, anonymous), true)
assert.equal(canPlayMusicVideoFinal(video, final, anonymous), true)

// Private: only the owner (and an admin).
const hidden = { ...video, isPublic: false }
assert.equal(canViewMusicVideo(hidden, final, viewer()), false)
assert.equal(canViewMusicVideo(hidden, final, anonymous), false)
assert.equal(canViewMusicVideo(hidden, final, viewer({ userId: 1 })), true)
assert.equal(canViewMusicVideo(hidden, final, viewer({ isAdmin: true })), true)

// A public draft with no final cut is not in anyone else's gallery.
const draft = { ...video, finalArtImageId: null }
assert.equal(canViewMusicVideo(draft, null, viewer()), false)
assert.equal(canViewMusicVideo(draft, null, viewer({ userId: 1 })), true)
assert.equal(canPlayMusicVideoFinal(draft, null, viewer({ userId: 1 })), false)

// A final pointing at someone else's ArtImage never publishes it.
const borrowed = { ...final, userId: 99 }
assert.equal(canViewMusicVideo(video, borrowed, viewer()), false)
assert.equal(
  canPlayMusicVideoFinal(video, borrowed, viewer({ userId: 1 })),
  false,
)
assert.equal(
  canViewMusicVideo(video, { ...final, isActive: false }, viewer()),
  false,
)

// Mature cuts: opted-in adults only; restricted accounts never, even admins.
const mature = { ...final, isMature: true }
assert.equal(canViewMusicVideo(video, mature, viewer()), false)
assert.equal(canViewMusicVideo(video, mature, anonymous), false)
assert.equal(
  canViewMusicVideo(video, mature, viewer({ showMature: true })),
  true,
)
assert.equal(
  canViewMusicVideo(video, mature, viewer({ isAdmin: true, restricted: true })),
  false,
)

// Remix titles stay inside the column.
assert.equal(remixMusicVideoTitle('Robot Lullaby'), 'Robot Lullaby (remix)')
assert.equal(remixMusicVideoTitle('x'.repeat(300)).length, 255)
assert.equal(remixMusicVideoTitle('  '), 'Untitled music video (remix)')

// Remix keeps every setting; art carries over only when the remixer may read it.
const spec = musicVideoSpecByKey('kind-robots-theme-classic')!
const base = normalizeMusicVideoDoc(specToDoc(spec)).doc
const source = {
  ...base,
  song: { source: 'comfy-acestep' as const, artImageId: 70, jobId: 71 },
  scenes: base.scenes.map((scene, index) => ({
    ...scene,
    image: { ...scene.image, artImageId: 100 + index, jobId: 200 + index },
    motion: {
      ...scene.motion,
      clipArtImageId: 300 + index,
      jobId: 400 + index,
    },
  })),
}

{
  const remix = remixMusicVideoDoc(source, false)
  assert.deepEqual(remix.settings, source.settings)
  assert.equal(remix.pitch, source.pitch)
  assert.deepEqual(remix.lyrics, source.lyrics)
  assert.deepEqual(remix.timeline, source.timeline)
  assert.equal(remix.song, null)
  assert.equal(remix.scenes.length, source.scenes.length)
  for (const [index, scene] of remix.scenes.entries()) {
    assert.equal(scene.prompt, source.scenes[index]!.prompt)
    assert.equal(scene.image.source, 'generated')
    assert.equal(scene.image.artImageId, undefined)
    assert.equal(scene.image.jobId, undefined)
    assert.equal(scene.motion.clipArtImageId, undefined)
    assert.equal(scene.motion.jobId, undefined)
  }
  assert.deepEqual(normalizeMusicVideoDoc(remix).errors, [])
}

{
  const remix = remixMusicVideoDoc(source, true)
  assert.deepEqual(remix.song, { source: 'comfy-acestep', artImageId: 70 })
  for (const [index, scene] of remix.scenes.entries()) {
    assert.equal(scene.image.artImageId, 100 + index)
    assert.equal(scene.image.jobId, undefined)
    assert.equal(scene.motion.clipArtImageId, 300 + index)
    assert.equal(scene.motion.jobId, undefined)
  }
  assert.equal(source.scenes[0]!.image.jobId, 200)
  assert.deepEqual(normalizeMusicVideoDoc(remix).errors, [])
}

console.log('music video access and remix contract: ok')
