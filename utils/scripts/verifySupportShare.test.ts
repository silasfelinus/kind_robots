import assert from 'node:assert/strict'
import {
  EMPTY_SUPPORT_PROGRESS,
  FUNDRAISER_URL,
  GAVE_QUIET_MS,
  PROMPT_COOLDOWN_MS,
  absoluteSiteUrl,
  buildShareTargets,
  parseSupportProgress,
  playSlugFromPath,
  playTitleFromPath,
  promptIsDue,
} from '../supportShare'

assert.equal(
  absoluteSiteUrl('/play/crystal-street#top'),
  'https://kindrobots.org/play/crystal-street',
)
assert.equal(
  absoluteSiteUrl('/play/arcade?game=kind-pinball'),
  'https://kindrobots.org/play/arcade?game=kind-pinball',
)
assert.equal(
  absoluteSiteUrl('play/memory'),
  'https://kindrobots.org/play/memory',
)
assert.equal(absoluteSiteUrl(''), 'https://kindrobots.org/')
assert.equal(absoluteSiteUrl(FUNDRAISER_URL), FUNDRAISER_URL)

const targets = buildShareTargets({
  url: 'https://kindrobots.org/play/memory',
  text: 'Play & win',
})
assert.deepEqual(
  targets.map((t) => t.key),
  ['x', 'facebook', 'bluesky', 'reddit', 'whatsapp', 'email'],
)
for (const target of targets) {
  assert.ok(
    target.href.includes('kindrobots.org%2Fplay%2Fmemory'),
    target.key + ' carries the encoded url',
  )
  assert.ok(
    !target.href.includes('Play & win'),
    target.key + ' encodes the text',
  )
}

assert.equal(playSlugFromPath('/play/crystal-street'), 'crystal-street')
assert.equal(playSlugFromPath('/play/arcade?game=kind-pinball'), 'arcade')
assert.equal(playSlugFromPath('/Play/Zuzu-Gamebook/'), 'zuzu-gamebook')
assert.equal(playSlugFromPath('/art'), null)
assert.equal(playSlugFromPath('/players'), null)

const now = 10 * GAVE_QUIET_MS
const fresh = { ...EMPTY_SUPPORT_PROGRESS }
assert.equal(promptIsDue(0, fresh, now), false)
assert.equal(promptIsDue(1, fresh, now), false)
assert.equal(promptIsDue(2, fresh, now), false)
assert.equal(promptIsDue(3, fresh, now), true)
assert.equal(promptIsDue(6, fresh, now), true)
assert.equal(
  promptIsDue(3, { ...fresh, lastPromptAt: now - PROMPT_COOLDOWN_MS + 1 }, now),
  false,
)
assert.equal(
  promptIsDue(3, { ...fresh, lastPromptAt: now - PROMPT_COOLDOWN_MS }, now),
  true,
)
assert.equal(promptIsDue(3, { ...fresh, gaveAt: now - 1000 }, now), false)
assert.equal(
  promptIsDue(3, { ...fresh, gaveAt: now - GAVE_QUIET_MS }, now),
  true,
)

assert.deepEqual(parseSupportProgress(null), EMPTY_SUPPORT_PROGRESS)
assert.deepEqual(parseSupportProgress('not json'), EMPTY_SUPPORT_PROGRESS)
assert.deepEqual(
  parseSupportProgress(
    '{"plays":4.7,"runs":-2,"lastPromptAt":"x","gaveAt":12}',
  ),
  { plays: 4, runs: 0, lastPromptAt: 0, gaveAt: 12 },
)

assert.equal(
  playTitleFromPath('/play/crystal-street'),
  'Terrors on Crystal Street',
)
assert.equal(playTitleFromPath('/play/new-thing'), 'New Thing')
assert.equal(playTitleFromPath('/art'), undefined)
assert.equal(
  playTitleFromPath('/play/arcade?game=kind-pinball', (slug) =>
    slug === 'kind-pinball' ? 'Kind Pinball' : undefined,
  ),
  'Kind Pinball',
)
assert.equal(
  playTitleFromPath('/play/arcade', () => 'unused'),
  'the Kind Robots Arcade',
)

console.log('Support share contract verified')
