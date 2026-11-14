// Silas, 2026-11-14 PT: "Slime city needs music effects, both during game
// music, opening menu, and sound effects during play, both regular and
// unique. Also obv we need support for audio on and off."
//
//   - every music loop parses through the arcade sequencer, is whole bars with
//     lined-up tracks, and each screen picks its loop (SHOWDOWN once a boss is low);
//   - every cue has notes, short, audible and never loud, and each crew, attack
//     style, faction power and evolution effect sounds different (the unique set);
//   - a whole CPU Clash heard move by move gives the regular cues (bell-free plays,
//     strikes, knockouts, your turn, a result) from the rules diff alone, and a
//     reload, undo or new deal is silent;
//   - a PvP seat hears its own result from a redacted board;
//   - the on/off choices default to on, and a saved "off" stays off.
//
//   npx tsx utils/scripts/verifySlimeCitySound.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseLoop } from '../arcade/sound'
import {
  applyClashCommand,
  chooseClashCpu,
  createClash,
  type ClashState,
} from '../slimeCity/clash'
import { pvpBoard } from '../slimeCity/pvp'
import {
  ATTACK_STYLES,
  EVOLUTION_EFFECTS,
  SHOWDOWN_BOSS_LIFE,
  SLIME_CREWS,
  SLIME_MUSIC,
  SLIME_TEAMS,
  clashIsTense,
  clashSoundCues,
  clashSoundView,
  parseSlimeAudioPrefs,
  pvpSoundView,
  slimeCueNotes,
  slimeCueSequence,
  slimeMusicFor,
  type SlimeCue,
} from '../slimeCity/sound'

// ---- music
for (const [name, loop] of Object.entries(SLIME_MUSIC)) {
  const parsed = parseLoop(loop)
  const lengths = loop.tracks.map((t) => t.steps.trim().split(/\s+/).length)
  assert.ok(
    lengths.every((l) => l === lengths[0]),
    `${name}: every track is the same length (${lengths.join(', ')})`,
  )
  assert.equal(parsed.length % 8, 0, `${name}: whole 4/4 bars of eighths`)
  assert.ok(parsed.notes.length > 20, `${name}: has a real arrangement`)
  for (const note of parsed.notes) {
    assert.ok(note.vol <= 0.08, `${name}: no loud music voice`)
    if (!note.noise)
      assert.ok(note.freq > 40 && note.freq < 2000, `${name}: audible pitch`)
  }
}
assert.equal(slimeMusicFor('home'), 'title', 'the opening menu plays TITLE')
for (const view of ['settings', 'vs', 'cards', 'rewards', 'tower'] as const)
  assert.equal(slimeMusicFor(view), 'title', `${view} is a menu`)
assert.equal(slimeMusicFor('campaign'), 'city')
assert.equal(slimeMusicFor('city'), 'city')
assert.equal(slimeMusicFor('clash'), 'battle', 'a fight plays BATTLE')
assert.equal(slimeMusicFor('clash', true), 'showdown')
assert.equal(slimeMusicFor('home', true), 'title', 'tension only in a fight')
assert.equal(clashIsTense({ player: 30, enemy: 30 }, null), false)
assert.equal(
  clashIsTense({ player: 30, enemy: SHOWDOWN_BOSS_LIFE }, null),
  true,
)
assert.equal(clashIsTense({ player: 0, enemy: 30 }, 'enemy'), false)

// ---- every cue sounds, and stays in range
const general: SlimeCue[] = [
  'nav',
  'select',
  'pack',
  'bell',
  'your-turn',
  'spell',
  'trap-set',
  'trap-spring',
  'gear',
  'evolve',
  'legend',
  'boss-hit',
  'ko',
  'victory',
  'defeat',
  'draw',
]
const unique: SlimeCue[] = [
  ...SLIME_CREWS.map((c) => `summon-${c}` as SlimeCue),
  ...SLIME_CREWS.map((c) => `strike-${c}` as SlimeCue),
  ...ATTACK_STYLES.map((s) => `style-${s}` as SlimeCue),
  ...SLIME_TEAMS.map((t) => `power-${t}` as SlimeCue),
  ...EVOLUTION_EFFECTS.map((e) => `evo-${e}` as SlimeCue),
]
for (const cue of [...general, ...unique]) {
  const notes = slimeCueNotes(cue)
  assert.ok(notes.length > 0, `${cue} has notes`)
  for (const note of notes) {
    assert.ok((note.vol ?? 0) <= 0.2, `${cue}: never loud`)
    assert.ok((note.at ?? 0) + note.dur <= 2, `${cue}: short`)
    if (!note.noise)
      assert.ok(note.freq >= 30 && note.freq <= 4000, `${cue}: audible pitch`)
  }
}
const fingerprint = (cue: SlimeCue) => JSON.stringify(slimeCueNotes(cue))
for (const group of [
  SLIME_CREWS.map((c) => `summon-${c}` as SlimeCue),
  SLIME_CREWS.map((c) => `strike-${c}` as SlimeCue),
  ATTACK_STYLES.map((s) => `style-${s}` as SlimeCue),
  SLIME_TEAMS.map((t) => `power-${t}` as SlimeCue),
  EVOLUTION_EFFECTS.map((e) => `evo-${e}` as SlimeCue),
])
  assert.equal(
    new Set(group.map(fingerprint)).size,
    group.length,
    `each of ${group.join(', ')} sounds different`,
  )
assert.deepEqual(slimeCueNotes('summon-nobody' as SlimeCue), [])
const sequence = slimeCueSequence(['bell', 'ko'])
assert.ok(
  sequence.some((n) => (n.at ?? 0) > 0.1 && n.freq === 400),
  'later cues in a sequence start after the earlier ones',
)

// ---- a whole CPU Clash, heard from the player's seat
const heard = new Map<string, number>()
let s: ClashState = createClash('catgirls', 'ironjaw', 42)
let pvpPrev = pvpBoard(s, 'enemy')
const pvpHeard: string[] = []
for (let step = 0; !s.victor && step < 800; step++) {
  const next = applyClashCommand(s, chooseClashCpu(s, s.active))
  for (const cue of clashSoundCues(clashSoundView(s), clashSoundView(next)))
    heard.set(cue, (heard.get(cue) ?? 0) + 1)
  const pvpNext = pvpBoard(next, 'enemy')
  pvpHeard.push(
    ...clashSoundCues(pvpSoundView(pvpPrev), pvpSoundView(pvpNext), 'enemy'),
  )
  pvpPrev = pvpNext
  s = next
}
assert.ok(s.victor, 'the CPU game finishes')
for (const cue of ['summon-catgirls', 'summon-ironjaw', 'your-turn', 'ko'])
  assert.ok(heard.has(cue), `a full match plays ${cue}`)
assert.ok(
  [...heard.keys()].some(
    (cue) => cue.startsWith('strike-') || cue.startsWith('style-'),
  ),
  'strikes sound',
)
assert.ok(heard.has('boss-hit'), 'boss damage sounds')
const result =
  s.victor === 'draw' ? 'draw' : s.victor === 'player' ? 'victory' : 'defeat'
assert.equal(heard.get(result), 1, 'the result plays exactly once')
const mirrored =
  s.victor === 'draw' ? 'draw' : s.victor === 'enemy' ? 'victory' : 'defeat'
assert.ok(pvpHeard.includes(mirrored), 'a PvP seat hears its own result')
assert.ok(
  pvpHeard.some((cue) => cue.startsWith('summon-')),
  'a PvP seat hears fighters land',
)

// ---- silence for anything that is not the next move
const fresh = createClash('riot', 'undertow', 7)
assert.deepEqual(
  clashSoundCues(clashSoundView(s), clashSoundView(fresh)),
  [],
  'a new deal is silent',
)
assert.deepEqual(
  clashSoundCues(clashSoundView(s), clashSoundView(s)),
  [],
  'a re-render is silent',
)
assert.deepEqual(clashSoundCues(null, clashSoundView(s)), [])

// ---- on/off
assert.deepEqual(parseSlimeAudioPrefs(null), {
  version: 1,
  sound: true,
  music: true,
  effects: true,
})
assert.deepEqual(
  parseSlimeAudioPrefs({
    version: 1,
    sound: false,
    music: true,
    effects: false,
  }),
  { version: 1, sound: false, music: true, effects: false },
)
assert.equal(parseSlimeAudioPrefs('junk').sound, true)

// The page, the fight and the duel all reach the toggle and the store.
const page = readFileSync('pages/admin/slime-city.vue', 'utf8')
const clash = readFileSync('components/slime-city-clash.vue', 'utf8')
const duel = readFileSync('components/slime-city-pvp-game.vue', 'utf8')
for (const [name, source] of [
  ['page', page],
  ['clash', clash],
  ['duel', duel],
] as const) {
  assert.match(source, /<SlimeCitySoundToggle/, `${name} shows the toggle`)
  assert.match(source, /useSlimeCitySoundStore/, `${name} uses the store`)
}
assert.match(page, /data-testid="slime-settings-music"/)
assert.match(page, /data-testid="slime-settings-effects"/)
assert.match(clash, /clashSoundCues\(/, 'the fight cues from the rules diff')
assert.match(duel, /clashSoundCues\(/, 'the duel cues from the board diff')

console.log(
  `Slime City sound: ${Object.keys(SLIME_MUSIC).length} loops, ${general.length + unique.length} cues, ${heard.size} heard in a CPU match`,
)
