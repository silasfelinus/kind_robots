import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  achievementCode,
  achievementsForGame,
} from '../achievements/gameAchievements'
import {
  RAINBOW_ACHIEVEMENT_CODES,
  isRainbowFeat,
  rainbowMedalFeats,
} from '../arcade/games/rainbowAchievements'
import {
  RAINBOW_ENDING_PARTS,
  RAINBOW_MASTERY,
} from '../arcade/games/rainbowLoadouts'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

const GAME = 'rainbow-bullet-hell-space-princess'

// The catalog and the game's queue agree, with the cabinet's arcade- prefix.
const catalog = achievementsForGame(GAME)
assert.ok(catalog.length >= 12 && catalog.length <= 30)
assert.deepEqual(
  catalog.map((entry) => entry.key).sort(),
  Object.keys(RAINBOW_ACHIEVEMENT_CODES).sort(),
)
for (const [key, code] of Object.entries(RAINBOW_ACHIEVEMENT_CODES)) {
  assert.equal(code, achievementCode({ game: GAME, key }))
  assert.ok(code.startsWith('arcade-'))
}
assert.ok(isRainbowFeat('kitty-power'))
assert.ok(!isRainbowFeat('toString'))
assert.ok(!isRainbowFeat('act1-maribel'))

// Every mastery goal and ending part is an achievement, so held mastery backfills.
for (const id of [...RAINBOW_MASTERY.map((g) => g.id), ...RAINBOW_ENDING_PARTS])
  assert.ok(isRainbowFeat(id), `${id} backfills from mastery`)

// Every other key is queued at its deed in the engine.
const engine = readFileSync(
  'utils/arcade/games/rainbowPrincessPreview.ts',
  'utf8',
)
const mastery = new Set<string>([
  ...RAINBOW_MASTERY.map((g) => g.id),
  ...RAINBOW_ENDING_PARTS,
])
for (const key of Object.keys(RAINBOW_ACHIEVEMENT_CODES)) {
  if (mastery.has(key)) continue
  assert.ok(
    engine.includes(`feat('${key}')`) ||
      engine.includes(`'${key}'`) ||
      key === 'no-continue' ||
      key === 'all-gold',
    `${key} is queued in the engine`,
  )
}
assert.ok(engine.includes('rainbowMedalFeats(medals)'))
assert.ok(engine.includes('partsComplete(RAINBOW_MASTERY, held)'))
assert.ok(engine.includes('drainFeats()'))

// The campaign medal feats.
const nine = (medal: 'gold' | 'silver' | 'bronze') =>
  Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((act) => [act, medal]),
  ) as Record<1, 'gold'>
assert.deepEqual(rainbowMedalFeats(nine('gold')), ['no-continue', 'all-gold'])
assert.deepEqual(rainbowMedalFeats(nine('silver')), ['no-continue'])
assert.deepEqual(rainbowMedalFeats(nine('bronze')), [])
assert.deepEqual(
  rainbowMedalFeats({ ...nine('gold'), 9: undefined } as never),
  [],
  'a flight resumed without every medal proves nothing',
)
assert.deepEqual(rainbowMedalFeats({ ...nine('gold'), 4: 'bronze' }), [])

// The attract demo meets goals but never queues an achievement.
{
  const game = createRainbowPrincessPreview({
    players: 1,
    demo: true,
    rng: () => 0.5,
    sound: { play() {} },
    hiScore: 0,
  })
  let drained = 0
  for (let frame = 0; frame < 60000; frame++) {
    game.update(emptyInput())
    drained += game.drainFeats?.().length ?? 0
    if (game.snapshot.earned.includes('first-light')) break
  }
  assert.ok(game.snapshot.earned.includes('first-light'))
  assert.equal(drained, 0)
}

console.log(
  `Rainbow achievements: ${catalog.length} codes, demo queues none, mastery backfills.`,
)
