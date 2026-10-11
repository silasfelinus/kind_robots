// /utils/scripts/verifyZuzuShowdownArcade.test.ts
//
// Zuzu Showdown Arcade mode (conductor zuzu-showdown t-021): every fighter's ladder holds every other
// fighter once, ends on their rival and then the Swamp Witch (her own ends on her rival), and is the
// same for the same seed; the CPU climbs two levels over it; the score adds up from the match's own
// events and stays under the leaderboard's ceiling; the initials entry turns, steps and refuses a
// blocked name; each ending has two clean lines; the game posts to the arcade leaderboard without
// joining the hall; and the arcade screens draw on screen.
//
//   npx tsx utils/scripts/verifyZuzuShowdownArcade.test.ts

import assert from 'node:assert/strict'
import { ARCADE_GAMES, findArcadeGame, isPlausibleScore } from '../arcade/games'
import { measureText } from '../arcade/font'
import {
  ARCADE_GAME_SLUG,
  AVATAR_SLUG,
  DIFFICULTY_MULTIPLIER,
  ENDINGS,
  MAX_PLAUSIBLE_SCORE,
  RIVALS,
  SCORE,
  advanceInitials,
  arcadeLadder,
  arcadeReady,
  fightBonus,
  initialsDone,
  initialsText,
  newArcadeScore,
  newInitials,
  rungLevel,
  scoreStep,
} from '../zuzuShowdown/arcade'
import {
  ENDING_STILL_FRAMES,
  drawArcadeHud,
  drawContinueScreen,
  drawEndingScreen,
  drawInitialsScreen,
  drawLadderScreen,
  endingStill,
  formatScore,
  ladderSlot,
} from '../zuzuShowdown/arcadeScreens'
import { CPU_LEVELS } from '../zuzuShowdown/cpu'
import { FIGHTERS, findFighter } from '../zuzuShowdown/fighters'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../zuzuShowdown/render'
import { FPS, createMatch } from '../zuzuShowdown/sim'
import type { SimEvent } from '../zuzuShowdown/types'

let passed = 0
function check(name: string, fn: () => void): void {
  try {
    fn()
    passed += 1
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

const SLUGS = FIGHTERS.map((f) => f.slug)
// conductor tools/check_matchups.py BANNED: never in a line the game shows.
const BANNED = [
  'human',
  'humans',
  'humanity',
  'mankind',
  'people',
  'pharmacy',
  'great wall',
  'skyscraper',
  'highway',
  'billboard',
  'road sign',
  'english lettering',
]

check('every fighter has a rival and an ending', () => {
  assert.ok(arcadeReady(FIGHTERS))
  for (const slug of SLUGS) {
    assert.ok(SLUGS.includes(RIVALS[slug]!), `${slug} rival`)
    assert.notEqual(RIVALS[slug], slug)
  }
})

check(
  'each ladder holds every other fighter once, rival then Witch last',
  () => {
    for (const player of SLUGS) {
      for (const seed of [1, 7, 123456789, 0xdeadbeef]) {
        const ladder = arcadeLadder(player, SLUGS, seed)
        assert.equal(ladder.length, SLUGS.length - 1, player)
        assert.equal(new Set(ladder).size, ladder.length, `${player} repeats`)
        assert.ok(!ladder.includes(player), `${player} fights itself`)
        if (player === AVATAR_SLUG) {
          assert.equal(
            ladder.at(-1),
            RIVALS[player],
            'the Witch ends on her rival',
          )
        } else {
          assert.equal(
            ladder.at(-1),
            AVATAR_SLUG,
            `${player} ends on the Witch`,
          )
          assert.equal(
            ladder.at(-2),
            RIVALS[player],
            `${player} rival second-to-last`,
          )
        }
      }
    }
  },
)

check('the same seed climbs the same ladder; seeds differ', () => {
  assert.deepEqual(
    arcadeLadder('zuzu', SLUGS, 42),
    arcadeLadder('zuzu', SLUGS, 42),
  )
  const orders = new Set(
    [1, 2, 3, 4, 5, 6, 7, 8].map((seed) =>
      arcadeLadder('zuzu', SLUGS, seed).join(','),
    ),
  )
  assert.ok(orders.size > 1, 'the shuffle shuffles')
})

check('the CPU climbs two levels over the ladder, never down', () => {
  const fights = SLUGS.length - 1
  for (const start of CPU_LEVELS) {
    const levels = Array.from({ length: fights }, (_, rung) =>
      CPU_LEVELS.indexOf(rungLevel(start, rung, fights)),
    )
    const base = CPU_LEVELS.indexOf(start)
    assert.equal(levels[0], base, `${start} starts where picked`)
    for (let i = 1; i < levels.length; i += 1)
      assert.ok(levels[i]! >= levels[i - 1]!, `${start} never eases off`)
    assert.equal(
      levels.at(-1),
      Math.min(CPU_LEVELS.length - 1, base + 2),
      `${start} tops out two levels up`,
    )
  }
})

check('the score adds up from the events, scaled by difficulty', () => {
  const roster: [
    ReturnType<typeof findFighter>,
    ReturnType<typeof findFighter>,
  ] = [findFighter('zuzu'), findFighter('coyote-vagrant')]
  const s = createMatch(roster)
  const hits: SimEvent[] = [
    {
      type: 'hit',
      attacker: 0,
      move: 'stand_lp',
      damage: 30,
      combo: 1,
      counter: false,
    },
    {
      type: 'hit',
      attacker: 0,
      move: 'stand_lk',
      damage: 35,
      combo: 2,
      counter: false,
    },
    {
      type: 'hit',
      attacker: 0,
      move: 'stand_hp',
      damage: 70,
      combo: 3,
      counter: false,
    },
    {
      type: 'hit',
      attacker: 1,
      move: 'stand_lp',
      damage: 30,
      combo: 1,
      counter: false,
    },
    { type: 'read', side: 0, kind: 'strike' },
    { type: 'read', side: 1, kind: 'grab' },
  ]
  const one = scoreStep(newArcadeScore(), hits, s, 0, roster[0].health, 1)
  assert.equal(one.total, 135 + 3 * SCORE.comboStep + SCORE.read)
  assert.equal(one.bestCombo, 3)
  assert.equal(one.reads, 1)
  const four = scoreStep(newArcadeScore(), hits, s, 0, roster[0].health, 4)
  assert.equal(four.total, one.total * 4)

  // A Perfect KO with 30 seconds left.
  s.timer = 30 * FPS
  s.fighters[0].health = roster[0].health
  const ko = scoreStep(
    newArcadeScore(),
    [{ type: 'ko', result: 0 }],
    s,
    0,
    roster[0].health,
    1,
  )
  assert.equal(ko.total, SCORE.round + 30 * SCORE.timeSecond + SCORE.perfect)
  assert.equal(ko.perfects, 1)
  // Hurt, it is no Perfect; and the opponent's KO pays nothing.
  s.fighters[0].health = roster[0].health - 1
  const hurt = scoreStep(
    newArcadeScore(),
    [{ type: 'ko', result: 0 }],
    s,
    0,
    roster[0].health,
    1,
  )
  assert.equal(hurt.perfects, 0)
  const lost = scoreStep(
    newArcadeScore(),
    [{ type: 'ko', result: 1 }],
    s,
    0,
    roster[0].health,
    1,
  )
  assert.equal(lost.total, 0)

  const won = fightBonus(newArcadeScore(), 2, 2)
  assert.equal(won.total, SCORE.fight * 3 * 2)
  assert.equal(won.fights, 1)
})

check(
  'an impossible climb on Showdown stays under the leaderboard ceiling',
  () => {
    // Worse than any real run: every fight goes five full rounds, each dealing twice the biggest
    // health in the game (red health regrows) in 30-hit combos of 10-damage hits (the combo scaling
    // floor), with a READ! every second, two rounds Perfect on a full clock; then the boss's bonus.
    // An honest score must never be refused.
    const multiplier = DIFFICULTY_MULTIPLIER.showdown
    const biggest = Math.max(...FIGHTERS.map((f) => f.health))
    let total = 0
    const fights = SLUGS.length
    for (let rung = 0; rung < fights; rung += 1) {
      const rounds = 5
      const damage = biggest * rounds * 2
      const chains = damage / 10 / 30
      const combos = chains * ((29 * 30) / 2) * SCORE.comboStep
      const reads = 99 * rounds * SCORE.read
      const roundBonus =
        2 * (SCORE.round + 99 * SCORE.timeSecond + SCORE.perfect)
      total += (damage + combos + reads + roundBonus) * multiplier
      total += SCORE.fight * (rung + 1) * multiplier
    }
    total += SCORE.boss * multiplier
    assert.ok(
      total < MAX_PLAUSIBLE_SCORE,
      `${total} under ${MAX_PLAUSIBLE_SCORE}`,
    )
  },
)

check('initials turn, step back and refuse a blocked name', () => {
  let e = newInitials('ZZZ')
  assert.equal(initialsText(e), 'ZZZ')
  e = advanceInitials(e, { up: true })
  assert.equal(initialsText(e), '0ZZ', 'wraps past Z to the digits')
  e = advanceInitials(e, { down: true })
  assert.equal(initialsText(e), 'ZZZ')
  e = advanceInitials(e, { lp: true })
  assert.equal(e.pos, 1)
  e = advanceInitials(e, { hp: true })
  assert.equal(e.pos, 0)
  e = newInitials('AAA')
  for (const _ of [0, 1, 2]) e = advanceInitials(e, { lp: true })
  assert.ok(initialsDone(e))
  // A blocked word goes back to its last letter.
  let bad = newInitials('WTF')
  for (const _ of [0, 1, 2]) bad = advanceInitials(bad, { lp: true })
  assert.ok(!initialsDone(bad))
  assert.equal(bad.pos, 2)
  assert.equal(initialsText(newInitials('')), 'AAA')
})

check('each ending has two short, clean lines', () => {
  for (const slug of SLUGS) {
    const stills = ENDINGS[slug]!
    assert.equal(stills.length, 2, slug)
    for (const still of stills) {
      assert.ok(still.line.length <= 60, still.line)
      assert.ok(measureText(still.line) <= VIEW_WIDTH - 40, still.line)
      const lower = still.line.toLowerCase()
      for (const term of BANNED)
        assert.ok(!new RegExp(`\\b${term}\\b`).test(lower), `${slug}: ${term}`)
      assert.match(still.file, /^[a-z]+-ending-[12]$/)
    }
  }
})

check('it posts to the leaderboard but stays out of the hall', () => {
  assert.ok(findArcadeGame(ARCADE_GAME_SLUG), 'the scores API knows it')
  assert.ok(isPlausibleScore(ARCADE_GAME_SLUG, 123456))
  assert.ok(!isPlausibleScore(ARCADE_GAME_SLUG, MAX_PLAUSIBLE_SCORE + 1))
  assert.ok(!isPlausibleScore(ARCADE_GAME_SLUG, 0))
  assert.ok(
    !ARCADE_GAMES.some((g) => g.slug === ARCADE_GAME_SLUG),
    'not in the hall until t-025',
  )
  assert.equal(
    findArcadeGame(ARCADE_GAME_SLUG)!.maxPlausibleScore,
    MAX_PLAUSIBLE_SCORE,
  )
})

// ---------------------------------------------------------------- drawing

type Call = { op: string; args: number[] }

function stubContext() {
  const calls: Call[] = []
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({
        op,
        args: args.filter((a): a is number => typeof a === 'number'),
      })
    }
  const g = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    filter: 'none',
    fillRect: record('fillRect'),
    drawImage: record('drawImage'),
    save: record('save'),
    restore: record('restore'),
    translate: record('translate'),
    scale: record('scale'),
    beginPath: record('beginPath'),
    rect: record('rect'),
    clip: record('clip'),
    strokeRect: record('strokeRect'),
  }
  return { g: g as unknown as CanvasRenderingContext2D, calls }
}

function assertOnScreen(calls: Call[], label: string) {
  for (const call of calls) {
    for (const n of call.args)
      assert.ok(Number.isFinite(n), `${label} ${call.op} got ${n}`)
    if (call.op !== 'fillRect') continue
    const [x, y, w, h] = call.args as [number, number, number, number]
    assert.ok(
      x >= 0 && y >= 0 && x + w <= VIEW_WIDTH && y + h <= VIEW_HEIGHT,
      `${label} fillRect ${call.args}`,
    )
  }
}

check('the arcade screens draw on screen', () => {
  const score = { ...newArcadeScore(), total: 12_345_678, fights: 8 }
  for (const player of SLUGS) {
    const ladder = arcadeLadder(player, SLUGS, 9).map(findFighter)
    for (let rung = 0; rung <= ladder.length; rung += 1) {
      const { g, calls } = stubContext()
      drawLadderScreen(
        g,
        findFighter(player),
        ladder,
        rung,
        score,
        undefined,
        rung * 7,
        false,
      )
      assertOnScreen(calls, `ladder ${player} ${rung}`)
    }
    const last = ladderSlot(ladder.length, ladder.length + 1)
    assert.ok(
      last.x + last.w <= VIEW_WIDTH && ladderSlot(0, ladder.length + 1).x >= 0,
    )
    for (const t of [0, 10, ENDING_STILL_FRAMES, 2 * ENDING_STILL_FRAMES - 1]) {
      const { g, calls } = stubContext()
      drawEndingScreen(g, findFighter(player), undefined, undefined, t, false)
      assertOnScreen(calls, `ending ${player} t${t}`)
    }
  }
  assert.equal(endingStill(0), 0)
  assert.equal(endingStill(ENDING_STILL_FRAMES), 1)
  assert.equal(endingStill(2 * ENDING_STILL_FRAMES), 2)
  for (const t of [0, 60, 600]) {
    const c = stubContext()
    drawContinueScreen(c.g, score, t)
    assertOnScreen(c.calls, `continue t${t}`)
  }
  for (const cleared of [true, false]) {
    const c = stubContext()
    drawInitialsScreen(c.g, score, newInitials('KR1'), cleared, 5, false)
    assertOnScreen(c.calls, 'initials')
  }
  const hud = stubContext()
  drawArcadeHud(hud.g, score, 3, 9)
  assertOnScreen(hud.calls, 'hud')
  assert.equal(formatScore(12_345_678), '12,345,678')
  assert.equal(formatScore(0), '0')
})

console.log(`verifyZuzuShowdownArcade: ${passed} checks passed`)
