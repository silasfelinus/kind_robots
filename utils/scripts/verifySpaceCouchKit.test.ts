import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { auditPlaybookKit, fitsTier } from '../playbookKit/budget'
import { kitPlaybook } from '../playbookKit/games'
import { SPACE_COUCH_KIT } from '../playbookKit/games/spaceCouch'
import { WARP_ENDINGS, slugify } from '../gameOfCaptains/artSlots'
import { UNCLAIMED_ENDINGS } from '../gameOfCaptains/baseEndingCaptains'
import { ANTAGONISTS, CAPTAINS, CREW } from '../gameOfCaptains/rules'

// The Space Couch kit spec is declared from the shipped game, not a preview:
// every id it carries is one the game itself uses, so the kit shell can unlock
// endings and cast straight from a VoyageRun. Reachability of each ending log
// from a new voyage is proven by verifyGameOfCaptains.test.ts (one seeded
// trace per family) and the counter-council branch of finishVoyage.

const spec = SPACE_COUCH_KIT
assert.equal(kitPlaybook('game-of-captains'), spec, 'registered under its slug')

const report = auditPlaybookKit(spec)
assert.ok(
  report.ok,
  report.issues
    .filter((i) => i.level === 'error')
    .map((i) => i.message)
    .join('\n'),
)
assert.equal(spec.tier, 'saga')
assert.equal(fitsTier(spec), 'saga', 'the shipped game is saga-sized')

// Endings: exactly the logs finishVoyage can write, by the game's art key.
const gameEndings = new Set([...WARP_ENDINGS, ...UNCLAIMED_ENDINGS])
assert.equal(gameEndings.size, 18, '4 base + 12 galactic + 2 counter logs')
const gameEndingIds = [...gameEndings].map(slugify).sort()
assert.deepEqual(
  spec.endings.map((e) => e.id).sort(),
  gameEndingIds,
  'one kit ending per game ending log, no extras',
)
for (const ending of spec.endings) {
  const title = [...gameEndings].find((t) => slugify(t) === ending.id)!
  assert.equal(
    ending.title.toUpperCase(),
    title,
    `${ending.id}: kit title matches the game log`,
  )
}

// Cast: the six captains (player choices, so figures), all twelve crew as
// followers, and every seeded nemesis as a villain.
const role = (r: string) =>
  spec.cast
    .filter((c) => c.role === r)
    .map((c) => c.id)
    .sort()
assert.deepEqual(role('follower'), CREW.map((c) => c.id).sort())
assert.deepEqual(role('villain'), ANTAGONISTS.map((a) => a.id).sort())
for (const c of CAPTAINS)
  assert.equal(
    spec.cast.find((m) => m.id === c.id)?.role,
    'figure',
    `${c.id} is a choice, not a follower`,
  )
for (const member of spec.cast) {
  const source =
    CREW.find((c) => c.id === member.id) ??
    CAPTAINS.find((c) => c.id === member.id) ??
    ANTAGONISTS.find((a) => a.id === member.id)
  if (source) assert.equal(member.name, source.name, member.id)
}

// Every follower has a scrapbook moment of their own.
for (const id of role('follower'))
  assert.ok(
    spec.moments.some((m) => m.kind === 'follower' && m.about.includes(id)),
    `${id} has a follower moment`,
  )

// Any declared rendered art exists in public/.
const declared = [
  spec.keyArt,
  ...spec.cast.map((c) => c.portrait),
  ...spec.endings.map((e) => e.art),
  ...spec.moments.map((m) => m.art),
].filter((art) => art.src)
for (const art of declared)
  assert.ok(
    existsSync(new URL(`../../public${art.src}`, import.meta.url)),
    `missing ${art.src}`,
  )

console.log(
  `Space Couch kit: ${spec.endings.length} endings, ${spec.cast.length} cast and ${declared.length} rendered pictures match the shipped game.`,
)
