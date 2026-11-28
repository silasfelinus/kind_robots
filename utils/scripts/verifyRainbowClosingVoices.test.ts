import assert from 'node:assert/strict'
import { CROWN_REEF, reefDialogue } from '../arcade/games/rainbowCrownReef'
import {
  FINALE,
  finaleCredits,
  finaleDialogue,
  finaleEndingFrames,
  finaleScene,
  finaleTurnLines,
  type FinaleChoice,
  type FinaleDialogue,
  type FinaleFlags,
} from '../arcade/games/rainbowEclipseFinale'
import { rainbowContinueLine } from '../arcade/games/rainbowFailure'
import {
  RAINBOW_PARTY_TRACKS,
  rainbowPartyTrack,
} from '../arcade/games/rainbowPartyComms'
import { ROSEFIN, rosefinDialogue } from '../arcade/games/rainbowRosefin'
import {
  NO_ROUTE,
  type RainbowRouteFlags,
} from '../arcade/games/rainbowRouteBeats'

// Independent story critic, round 2 (kind_robots branch claude/rainbow-review2-story,
// projects-review/rainbow-story-critic-r2.md): R2-1 the stood-down credits, R2-2 and R2-5 the ending's closing
// voices and the dead rebel send-offs, R2-7 solo address, R2-9 the route beat at the final choice and R2-10 an
// empty captive count.

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const
const CHOICES: FinaleChoice[] = ['restore', 'evacuate', 'sever']
const NONE: FinaleFlags = {
  rescuedNemi: false,
  securedSalvage: false,
  rescuedCourier: false,
  freedDepot: false,
  stoppedRelay: false,
  rescuedNavigator: false,
  captivesFreed: 0,
}
const EVERY: FinaleFlags = {
  rescuedNemi: true,
  securedSalvage: true,
  rescuedCourier: true,
  freedDepot: true,
  stoppedRelay: true,
  rescuedNavigator: true,
  captivesFreed: 9,
}
const crewOf = (mask: number) =>
  PILOTS.filter((_, pilot) => mask & (1 << pilot))

/** Every A09.AFTER line, as the engine asks for them. */
function ending(
  mask: number,
  road: 'rebel' | 'loyal' | null,
  choice: FinaleChoice,
  stoodDown = false,
): FinaleDialogue[] {
  const lines: FinaleDialogue[] = []
  for (let line = 0; line < 12; line++) {
    const said = finaleDialogue(
      'A09.AFTER',
      line * FINALE.endingLineFrames + 1,
      crewOf(mask).length,
      EVERY,
      choice,
      road,
      mask,
      undefined,
      stoodDown,
    )
    if (!said) break
    lines.push(said)
  }
  return lines
}

// R2-1: a crew that stood down never fought the flagship, so the credits never say it was defeated; the Crown it
// spared has its own line. A rebel crew that did fight it keeps the DEFEATED block.
for (let players = 1; players <= 4; players++)
  for (const choice of CHOICES) {
    const spared = finaleCredits(EVERY, players, choice, 'rebel', {
      stoodDown: true,
    })
    assert.ok(
      !spared.includes('DEFEATED'),
      `${players}p ${choice}: no DEFEATED`,
    )
    assert.ok(
      !spared.some((line) => line.includes('Motherland Flagship')),
      `${players}p ${choice}: no flagship in a stand-down`,
    )
    assert.ok(spared.includes('SPARED · B09 Eclipse Crown'))
    assert.ok(spared.includes('THE ROAD: TURNED AT THE CROWN'))
    const fought = finaleCredits(EVERY, players, choice, 'rebel')
    assert.ok(fought.includes('DEFEATED'))
    assert.ok(fought.includes('B09 Motherland Flagship'))
    assert.ok(!fought.includes('SPARED · B09 Eclipse Crown'))
    assert.ok(
      !finaleCredits(EVERY, players, choice, 'loyal').includes('DEFEATED'),
    )
  }

// R2-10: an empty count is not read out in the credits.
assert.ok(
  !finaleCredits(NONE, 2, 'evacuate', 'loyal', { stoodDown: true }).some(
    (line) => line.includes('captive'),
  ),
)
assert.ok(
  finaleCredits(EVERY, 2, 'evacuate', 'rebel').includes(
    '9 captives of the Eclipse Palace',
  ),
)

// R2-2 and R2-5: for every crew on both roads, every choice and a stand-down, the ending's last two lines never
// share a speaker or a text; the choice's own send-off plays last; the road epilogue comes from a different pilot
// than the party epilogue; only the crew and Lilt speak; and the ending is as long as the engine waits for.
const roadVoices: Record<'rebel' | 'loyal', Record<string, number>> = {
  rebel: {},
  loyal: {},
}
for (let mask = 1; mask <= 15; mask++) {
  const crew = crewOf(mask)
  const party = rainbowPartyTrack(mask).epilogue
  for (const road of ['rebel', 'loyal'] as const) {
    const lasts = new Set<string>()
    for (const choice of CHOICES)
      for (const stoodDown of road === 'rebel' ? [false, true] : [false]) {
        const lines = ending(mask, road, choice, stoodDown)
        const where = `mask ${mask} ${road} ${choice}${stoodDown ? ' stood down' : ''}`
        assert.equal(
          lines.length * FINALE.endingLineFrames,
          finaleEndingFrames(road, mask),
          `${where}: the engine waits for every line`,
        )
        const [before, last] = lines.slice(-2) as [
          FinaleDialogue,
          FinaleDialogue,
        ]
        assert.notEqual(before.speaker, last.speaker, `${where}: two voices`)
        assert.notEqual(before.text, last.text, `${where}: two lines`)
        for (const [i, line] of lines.entries()) {
          assert.ok(
            line.speaker === 'Lilt-7' ||
              (crew as readonly string[]).includes(line.speaker) ||
              (i === 1 && line.speaker === 'Maribel'),
            `${where}: ${line.speaker} is flying`,
          )
          if (i > 2)
            assert.notEqual(
              line.speaker,
              lines[i - 1]!.speaker,
              `${where}: ${line.speaker} does not speak twice in a row`,
            )
        }
        assert.match(
          last.text,
          road === 'rebel' ? /Let us fly\.$/ : /Motherland expects us|said no/,
          `${where}: the send-off closes`,
        )
        if (crew.length === 1) assert.equal(last.speaker, 'Lilt-7')
        lasts.add(last.text)
        if (road === 'rebel') {
          assert.equal(lines[3]!.speaker, party.speaker)
          assert.equal(lines[3]!.text, party.text)
          if (crew.length > 1) {
            assert.equal(lines.length, 6)
            assert.notEqual(lines[4]!.speaker, party.speaker, where)
            if (choice === 'restore' && !stoodDown)
              roadVoices.rebel[lines[4]!.speaker] =
                (roadVoices.rebel[lines[4]!.speaker] ?? 0) + 1
          } else assert.equal(lines.length, 5, `${where}: no repeat`)
        } else {
          assert.equal(lines.length, 5)
          if (crew.length > 1) {
            assert.notEqual(lines[3]!.speaker, party.speaker, where)
            if (choice === 'restore')
              roadVoices.loyal[lines[3]!.speaker] =
                (roadVoices.loyal[lines[3]!.speaker] ?? 0) + 1
          }
        }
      }
    if (road === 'rebel')
      assert.equal(lasts.size, 3, `mask ${mask}: each choice its own send-off`)
  }
}
// The road epilogue rotates: every pilot speaks it for some crews and none for most (Vivi had 8 of 15).
for (const road of ['rebel', 'loyal'] as const) {
  for (const pilot of PILOTS)
    assert.ok(
      (roadVoices[road][pilot] ?? 0) >= 2 &&
        (roadVoices[road][pilot] ?? 0) <= 4,
      `${road}: ${pilot} closes ${roadVoices[road][pilot] ?? 0} crews`,
    )
}
// Solo Vivi no longer says nearly the same thing twice, and the setting is the Ocean.
const vivi = ending(8, 'rebel', 'evacuate')
assert.ok(!vivi.some((line) => /No ranks on this broadcast/.test(line.text)))
assert.doesNotMatch(rainbowPartyTrack(8).epilogue.text, /broadcast|names|ranks/)
for (const track of Object.values(RAINBOW_PARTY_TRACKS))
  for (const line of [...track.reveal, track.epilogue])
    assert.doesNotMatch(line.text, /galaxy/i)
// The unsworn road (older saves) also closes on a second voice.
for (let mask = 1; mask <= 15; mask++) {
  const [before, last] = ending(mask, null, 'restore').slice(-2)
  assert.notEqual(before!.speaker, last!.speaker, `mask ${mask} unsworn`)
  assert.match(last!.text, /the sky is open/)
}

// R2-7: a lone pilot is not addressed or spoken for as a group.
assert.doesNotMatch(rainbowContinueLine(1, 1), /pilots/)
assert.match(rainbowContinueLine(1, 2), /pilots/)
assert.doesNotMatch(
  rosefinDialogue('A04.AFTER', 2 * ROSEFIN.lineFrames + 1, 1)!.text,
  /together/,
)
assert.match(
  rosefinDialogue('A04.AFTER', 2 * ROSEFIN.lineFrames + 1, 2)!.text,
  /together/,
)
assert.doesNotMatch(
  reefDialogue('A06.FORK', CROWN_REEF.lineFrames + 1, 1)!.text,
  /together/,
)
assert.match(
  reefDialogue('A06.FORK', CROWN_REEF.lineFrames + 1, 3)!.text,
  /together/,
)
for (const road of ['rebel', 'loyal', null] as const)
  assert.doesNotMatch(
    finaleDialogue(
      'A09.AFTER',
      FINALE.endingLineFrames + 1,
      1,
      EVERY,
      'restore',
      road,
      1,
    )!.text,
    /\bwe\b|\bus\b/i,
    `solo ${road} verdict`,
  )

// R2-9: a flown route's beat follows the crew's line at the final choice instead of replacing it, and the choice
// scene stays open long enough to read it.
const ROUTE: RainbowRouteFlags = {
  ...NO_ROUTE,
  viaX4: true,
  crownEcho: true,
}
assert.equal(finaleTurnLines(NO_ROUTE), 3)
assert.equal(finaleTurnLines(undefined), 3)
assert.equal(finaleTurnLines(ROUTE), 4)
for (let players = 1; players <= 4; players++) {
  const turn = (line: number, route?: RainbowRouteFlags) =>
    finaleDialogue(
      'A09.TURN',
      line * FINALE.lineFrames + 1,
      players,
      undefined,
      null,
      'rebel',
      null,
      route,
    )
  assert.equal(turn(2, ROUTE)!.text, turn(2)!.text, `${players}p crew line`)
  assert.notEqual(turn(2, ROUTE)!.speaker, 'Lilt-7')
  assert.equal(turn(3, ROUTE)!.speaker, 'Lilt-7')
  assert.match(turn(3, ROUTE)!.text, /echo/)
  assert.equal(turn(3), null)
}
assert.equal(
  finaleScene(9000, 3 * FINALE.lineFrames + 1, null, null, null, {
    turnLines: 4,
  })?.id,
  'A09.TURN',
)
assert.equal(
  finaleScene(9000, 3 * FINALE.lineFrames + 1, null, null)?.id,
  undefined,
)
assert.ok(FINALE.choiceFrames >= 4 * FINALE.lineFrames + 120)

console.log(
  `rainbow closing voices: ok (road epilogues rebel ${JSON.stringify(roadVoices.rebel)}, loyal ${JSON.stringify(roadVoices.loyal)})`,
)
