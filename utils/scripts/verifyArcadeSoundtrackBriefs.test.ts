import assert from 'node:assert/strict'
import { ARCADE_GAMES, LINKED_GAMES } from '../arcade/games'
import {
  ARCADE_MUSIC_BRIEFS,
  PRIORITY_ARCADE_AUDIO_GAMES,
  SHARED_ARCADE_EVENT_BRIEFS,
  VERIFIED_ARCADE_AUDIO_ASSETS,
  arcadeAudioJobKey,
  publishedArcadeAudioPath,
  type ArcadeAudioAsset,
} from '../arcade/soundtrackBriefs'

const knownGames = new Set([...ARCADE_GAMES, ...LINKED_GAMES].map((game) => game.slug))
assert.equal(PRIORITY_ARCADE_AUDIO_GAMES.length, 4)
for (const game of PRIORITY_ARCADE_AUDIO_GAMES) {
  assert.ok(knownGames.has(game), `soundtrack brief must reference a real cabinet: ${game}`)
  const [level, boss] = [ARCADE_MUSIC_BRIEFS[game].level, ARCADE_MUSIC_BRIEFS[game].boss]
  assert.notEqual(level.prompt, boss.prompt, `boss needs an actual variant for ${game}`)
  for (const cue of [level, boss]) {
    assert.equal(cue.kind, 'music')
    assert.equal(cue.loop, true)
    assert.ok(cue.bpm && cue.bpm >= 80 && cue.bpm <= 180)
    assert.ok(cue.seconds >= 30 && cue.seconds <= 90)
    assert.match(cue.prompt, /no vocals/i)
  }
  assert.notEqual(arcadeAudioJobKey(game, 'level'), arcadeAudioJobKey(game, 'boss'))
}

assert.equal(Object.keys(SHARED_ARCADE_EVENT_BRIEFS).length, 4)
for (const cue of Object.values(SHARED_ARCADE_EVENT_BRIEFS)) {
  assert.equal(cue.kind, 'sfx')
  assert.ok(cue.seconds > 0 && cue.seconds <= 4)
}

assert.deepEqual(VERIFIED_ARCADE_AUDIO_ASSETS, [], 'no generated assets may be invented')
const good: ArcadeAudioAsset = {
  game: 'gloom-invaders',
  cue: 'level',
  path: '/images/arcade/audio/gloom-invaders/level.ogg',
  approvedAt: '2026-10-13T12:00:00Z',
  verifiedAt: '2026-10-13T12:10:00Z',
  contentSha256: 'a'.repeat(64),
}
const audible = new Set([good.path])
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'level', audible), null)
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'level', new Set(), [good]), null)
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'level', audible, [good]), good.path)
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'boss', audible, [good]), null)
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'level', audible, [{ ...good, approvedAt: '' }]), null)
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'level', audible, [{ ...good, verifiedAt: '' }]), null)
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'level', audible, [{ ...good, contentSha256: 'unknown' }]), null)
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'level', audible, [{ ...good, path: '/admin/private.wav' }]), null)
assert.equal(publishedArcadeAudioPath('gloom-invaders', 'level', audible, [{ ...good, path: '/images/arcade/audio/../secret.wav' }]), null)

console.log('verifyArcadeSoundtrackBriefs: ok')
