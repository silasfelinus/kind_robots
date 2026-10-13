import assert from 'node:assert/strict'
import { HALL_GAMES, findArcadeGame, isPlausibleScore } from '../arcade/games'
import { CHAPTER_1 } from '../zuzuLair/chapter1'
import {
  NO_DEATH_BONUS,
  POINTS_BASE,
  POINTS_SPEED,
  TIME_BONUS_MAX,
} from '../zuzuLair/engine'

const meta = findArcadeGame('zuzu-lair')
assert.ok(meta, 'zuzu-lair is registered so the score API accepts it')
assert.equal(meta.route, undefined)
assert.ok(!HALL_GAMES.some((g) => g.slug === 'zuzu-lair'), 'unfinished Lair must not be public')

const moments = JSON.stringify(CHAPTER_1).split('"success"').length - 1
const best =
  moments * (POINTS_BASE + POINTS_SPEED) + NO_DEATH_BONUS + TIME_BONUS_MAX
assert.ok(best <= meta.maxPlausibleScore, 'a perfect run stays plausible')
assert.ok(isPlausibleScore('zuzu-lair', 1500))
assert.ok(!isPlausibleScore('zuzu-lair', meta.maxPlausibleScore + 1))
console.log('zuzu-lair arcade registration ok')
