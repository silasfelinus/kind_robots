import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createRun,
  restoreRun,
  chooseBeat,
  findCard,
  originPerkAvailable,
} from '../ecotone/engine'
import { EVENTS, EVENT_CHOICE } from '../ecotone/story'
import {
  PLAYER_AVATARS,
  PLAYER_PERSONALITIES,
  normalizePlayerIdentity,
  playerAvatarSrc,
} from '../ecotone/playerIdentity'
import {
  contextualOpeningChoices,
  contextualOfferLine,
  sceneMomentOffer,
} from '../ecotone/sceneOffers'

assert.equal(
  playerAvatarSrc('/images/ecotone/avatars/glitter.webp'),
  'https://media.acrocatranch.com/images/ecotone/avatars/glitter.webp',
)
assert.equal(PLAYER_AVATARS.length, 12)
assert.deepEqual(
  PLAYER_AVATARS.map((avatar) => avatar.portrait),
  PLAYER_AVATARS.map((avatar) => `/images/ecotone/avatars/${avatar.id}.webp`),
  'each stable saved-avatar ID needs its own canonical portrait path',
)
assert.equal(
  new Set(PLAYER_AVATARS.map((avatar) => avatar.portrait)).size,
  12,
  'no two avatar identities may share the same painted portrait',
)
assert.ok(PLAYER_AVATARS.length >= 10)
assert.ok(PLAYER_PERSONALITIES.length >= 5)
assert.equal(
  new Set(PLAYER_AVATARS.map((p) => p.id)).size,
  PLAYER_AVATARS.length,
)
assert.equal(
  new Set(PLAYER_PERSONALITIES.map((p) => p.id)).size,
  PLAYER_PERSONALITIES.length,
)

assert.equal(EVENT_CHOICE.body.length, 3)
assert.ok(EVENT_CHOICE.body.every((paragraph) => paragraph.length < 160))
assert.ok(EVENTS.every((event) => event.arrival && event.possibilities))
assert.ok(
  EVENTS.every(
    (event) =>
      !/\b(kit|juniper|cedar|mara|drugs?|meth|cocaine|mdma|stoned|psychedelic|drink|sobriety)\b/i.test(
        `${event.blurb} ${event.kind} ${event.arrival} ${event.possibilities}`,
      ),
  ),
  'opening routes must describe possibilities, not reveal companions or chemical paths',
)
const custom = createRun(3030, 'mechanic', undefined, {
  avatarId: 'custom',
  portraitArtId: 45678,
})
assert.equal(
  restoreRun(JSON.parse(JSON.stringify(custom)))?.portraitArtId,
  45678,
)
assert.equal(restoreRun(JSON.parse(JSON.stringify(custom)))?.avatarId, 'custom')
assert.equal(
  normalizePlayerIdentity({ avatarId: 'custom', portraitArtId: 0 }).avatarId,
  'glitter',
)
assert.equal(restoreRun({ ...custom, portraitArtId: -2 }), null)

const identity = normalizePlayerIdentity({
  playerName: '   River   Rabbit   ',
  avatarId: 'elder',
  personalityId: 'skeptical',
})
assert.equal(identity.playerName, 'River Rabbit')
assert.equal(identity.avatarId, 'elder')
assert.equal(identity.personalityId, 'skeptical')
assert.equal(
  normalizePlayerIdentity({ playerName: '   ', avatarId: 'not-real' })
    .playerName,
  'Wanderer',
)
assert.equal(
  normalizePlayerIdentity({ avatarId: 'not-real' }).avatarId,
  'glitter',
)
assert.equal(
  normalizePlayerIdentity({ playerName: 'z'.repeat(200) }).playerName.length,
  32,
)
const current = createRun(2026, 'mechanic', undefined, identity)
assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(current))), current)
const old = { ...createRun(2026, 'mechanic') }
delete old.playerName
delete old.avatarId
delete old.personalityId
assert.equal(
  restoreRun(old)?.playerName,
  'Wanderer',
  'legacy version-4 runs gain non-destructive defaults',
)
assert.deepEqual(
  restoreRun(old)?.skills,
  current.skills,
  'identity does not change skills',
)

for (const [id, event] of [
  ['KN-2', 'kinetic'],
  ['GR-2', 'green-ribbon'],
  ['QW-2', 'quiet'],
] as const) {
  const card = findCard(id)!
  const run = {
    ...current,
    event,
    phase: 'beat' as const,
    step: 1,
    day: 1,
    card: id,
    prospect: id === 'KN-2' ? ('cedar' as const) : ('juniper' as const),
  }
  const options = contextualOpeningChoices(card, run)
  assert.ok(options.length >= 2 && options.length <= 3)
  assert.ok(options.some((choice) => choice.lens === 'sober'))
  assert.ok(options.every((choice) => !choice.locked && choice.lens))
  for (const option of options) {
    const resolved = chooseBeat(run, option.id)
    assert.notEqual(resolved, run)
    assert.equal(resolved.openingState, option.lens)
    assert.equal(originPerkAvailable(run, option.id), false)
    assert.equal(resolved.rolls, run.rolls, 'opening outlooks never roll dice')
    assert.equal(resolved.pending?.entry.roll, null)
    assert.ok(
      [option.success.text, option.failure?.text]
        .filter(Boolean)
        .some((text) => resolved.pending?.entry.text.includes(text!)),
      'opening choice must deliver an authored outcome, not skip its story',
    )
    if (option.check) {
      const later = chooseBeat(
        {
          ...run,
          openingState: 'sober' as const,
          currentState: 'sober' as const,
        },
        option.id,
      )
      assert.equal(later.rolls, run.rolls + 1, 'later skill tests still roll')
      assert.ok(later.pending?.entry.roll)
    }
    assert.equal(
      restoreRun(JSON.parse(JSON.stringify(resolved)))?.openingState,
      option.lens,
    )
  }
  if (id === 'KN-2') assert.match(contextualOfferLine(card, run) ?? '', /offer/)
  else assert.equal(contextualOfferLine(card, run), null)
}
const momentRun = {
  ...current,
  phase: 'beat' as const,
  openingState: 'sober' as const,
}
assert.equal(sceneMomentOffer(findCard('GR-3')!, momentRun)?.id, 'cannabis')
assert.equal(sceneMomentOffer(findCard('KN-3')!, momentRun)?.id, 'alcohol')
assert.equal(sceneMomentOffer(findCard('QW-4')!, momentRun), null)
assert.equal(sceneMomentOffer(findCard('GR-4')!, momentRun), null)

const store = readFileSync('stores/ecotoneStore.ts', 'utf8')
const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.match(store, /UNDO_KEY/)
assert.match(store, /undoSnapshot/)
assert.match(store, /function undo\(/)
assert.match(store, /function saveSlot\(/)
assert.match(store, /function loadSlot\(/)
assert.match(store, /function exportSave\(/)
assert.match(store, /function importSave\(/)
assert.match(store, /restoreRun\(payload\.run\)/)
assert.match(board, /portraitRetry/)
assert.match(board, /:art="option.thumb.art"/)
assert.match(board, /option.possibilities/)
assert.match(board, /uploadPortrait/)
assert.match(board, /game.setPlayerLook/)
assert.match(board, /max-h-none/)
assert.ok(store.includes('function setPlayerLook('))
assert.match(board, /:aria-pressed="pickedAvatar === avatar.id"/)
assert.ok(board.includes('failedAvatarPortraits.push(avatar.id)'))
assert.ok(
  !board.includes('grid grid-cols-6 gap-1.5'),
  'emoji-only selection grid was retired',
)
assert.match(board, /Opening choice · No roll/)
assert.match(
  board,
  /function queueDecision\(option: Option\) \{\s+if \(option.disabled\) return\s+option.act\(\)/,
)
assert.doesNotMatch(board, /Confirm your decision|confirmDecision|stagedChoice/)
assert.doesNotMatch(board, /Change my mind/)
assert.match(board, /Undo last decision/)
assert.match(board, /tab === 'settings'/)
assert.match(board, /Text reveal speed/)
assert.match(board, /Text size/)
assert.match(board, /Export save as JSON/)
assert.match(board, /Import saved journey/)
assert.match(board, /prefers-reduced-motion/)
assert.match(board, /:style="\{ '--eco-text-scale': displayScale \}"/)
assert.match(board, /contextualOpeningChoices\(card, run\)/)
assert.ok(!board.includes('SUBSTANCE_CHOICES'))
assert.match(board, /v-for="\(paragraph, index\) in revealedBody"/)
assert.match(
  board,
  /@4xl:col-start-1 @4xl:row-start-1 @4xl:overflow-y-auto/,
  'story has its own vertical scroll on wide screens',
)
assert.match(
  board,
  /@4xl:col-start-1 @4xl:row-start-2 @4xl:max-h-\[42vh\] @4xl:overflow-y-auto/,
  'choices share the text column and can scroll when crowded',
)
assert.match(
  board,
  /@4xl:left-\[55%\] @4xl:right-0 @4xl:h-full/,
  'illustration has its own unobstructed right-hand column',
)
assert.match(board, /pt-\[calc\(clamp\(13rem,32vh,22rem\)\+1\.25rem\)\]/)
assert.match(
  board,
  /game.endings.includes\(game.ending.id\)/,
  'earned ending card is visible in the same illustration column',
)
assert.match(board, /Ending earned/)
assert.match(board, /:art="endingArtKey\(game.ending.id\)"/)

console.log(
  'Ecotone first impressions: 12 avatars, personal runs, fewer opening temptations, undo and settings contract passed',
)
