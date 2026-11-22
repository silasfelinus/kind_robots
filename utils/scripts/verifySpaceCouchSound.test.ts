// Space Couch sound and music (conductor game-of-captains t-046), checked in
// Node without a browser or speakers: every mood's score is well formed and
// deterministic, every voyage phase maps to music, the run diff earns the
// right cues, the mix parses and clamps, the player is silent until a gesture
// and with no WebAudio, and the page wires the master switch and mixer.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  COUCH_CUE_TONES,
  COUCH_MIX_KEY,
  COUCH_MOODS,
  COUCH_SCORES,
  CouchSound,
  DEFAULT_COUCH_MIX,
  couchCuesFor,
  couchMoodFor,
  midiToHz,
  parseCouchMix,
  scoreEvents,
  scoreLength,
  swingOffset,
  stepSeconds,
} from '../gameOfCaptains/sound'
import type { VoyageRun } from '../gameOfCaptains/rules'

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`ok - ${name}`)
}

check('every mood has a well-formed original loop', () => {
  assert.deepEqual(Object.keys(COUCH_SCORES).sort(), [...COUCH_MOODS].sort())
  for (const mood of COUCH_MOODS) {
    const score = COUCH_SCORES[mood]
    const length = scoreLength(score)
    assert.ok(score.chords.length >= 4, `${mood} chords`)
    assert.equal(score.bass.length, length, `${mood} bass covers the loop`)
    assert.equal(score.lead.length, length, `${mood} lead covers the loop`)
    assert.equal(score.drums.length, 16, `${mood} drum bar`)
    assert.match(score.drums, /^[xo.]{16}$/)
    assert.ok(score.bpm >= 60 && score.bpm <= 150, `${mood} tempo`)
    assert.ok(score.swing >= 0 && score.swing < 0.5)
    assert.ok(score.level > 0 && score.level <= 1)
    const notes = [
      ...score.chords.flat(),
      ...score.bass.filter((x): x is number => x != null),
      ...score.lead.filter((x): x is number => x != null),
    ]
    for (const note of notes) {
      assert.ok(
        Number.isInteger(note) && note >= 24 && note <= 96,
        `${mood} ${note}`,
      )
    }
    assert.ok(
      score.lead.some((x) => x != null),
      `${mood} has a melody`,
    )
  }
})

check('moods are distinct pieces, not one loop re-tempoed', () => {
  const signatures = new Set(
    COUCH_MOODS.map((m) => JSON.stringify(COUCH_SCORES[m].lead)),
  )
  assert.equal(signatures.size, COUCH_MOODS.length)
})

check('scheduling is deterministic and loops seamlessly', () => {
  const score = COUCH_SCORES.title
  const loop = scoreLength(score)
  const a = scoreEvents(score, 0, loop)
  const b = scoreEvents(score, loop, loop * 2)
  assert.deepEqual(scoreEvents(score, 0, loop), a)
  assert.equal(a.length, b.length)
  for (let i = 0; i < a.length; i++) {
    assert.equal(b[i]!.step, a[i]!.step + loop)
    assert.deepEqual(b[i]!.notes, a[i]!.notes)
    assert.equal(b[i]!.voice, a[i]!.voice)
  }
  // A pad on every bar, and the window splits cleanly.
  assert.equal(a.filter((e) => e.voice === 'pad').length, score.chords.length)
  assert.deepEqual(
    [...scoreEvents(score, 0, 37), ...scoreEvents(score, 37, loop)],
    a,
  )
  assert.equal(swingOffset(score, 0), 0)
  assert.ok(
    swingOffset(score, 1) > 0 && swingOffset(score, 1) < stepSeconds(score),
  )
  assert.equal(Math.round(midiToHz(69)), 440)
  assert.equal(Math.round(midiToHz(60)), 262)
})

function run(patch: Partial<VoyageRun> = {}): VoyageRun {
  return {
    version: 1,
    seed: 7,
    phase: 'briefing',
    captain: 'fluke',
    crew: ['brin', 'fen'],
    away: [],
    chapter: 1,
    antagonist: 0,
    supplies: 5,
    trust: 0,
    intervention: 0,
    reputation: 0,
    scene: '',
    report: null,
    log: [],
    ending: null,
    ...patch,
  } as VoyageRun
}

check('every voyage phase maps to music', () => {
  assert.equal(couchMoodFor(null), 'title')
  const expected: Record<string, string> = {
    briefing: 'bridge',
    debrief: 'bridge',
    'crew-quest': 'bridge',
    travel: 'away',
    transit: 'away',
    expedition: 'away',
    decision: 'tension',
    finale: 'finale',
    ending: 'ending',
  }
  for (const [phase, mood] of Object.entries(expected)) {
    assert.equal(
      couchMoodFor(run({ phase } as Partial<VoyageRun>)),
      mood,
      phase,
    )
  }
  assert.equal(couchMoodFor(run({ phase: 'debrief', ending: 'x' })), 'ending')
})

check('the run diff earns the right cues', () => {
  const base = run()
  assert.deepEqual(couchCuesFor(null, base), ['launch'])
  assert.deepEqual(couchCuesFor(base, null), [])
  assert.deepEqual(couchCuesFor(base, base), [])
  assert.deepEqual(couchCuesFor(base, run({ seed: 8 })), ['launch'])
  assert.deepEqual(couchCuesFor(base, run({ phase: 'travel' })), ['warp'])
  assert.deepEqual(couchCuesFor(base, run({ phase: 'expedition' })), ['arrive'])
  assert.deepEqual(couchCuesFor(base, run({ chapter: 2 })), ['chapter'])
  const report = {
    missionId: 'bar',
    result: 'disaster' as const,
    names: '',
    text: '',
  }
  assert.deepEqual(
    couchCuesFor(
      base,
      run({
        phase: 'debrief',
        report,
        redshirtFallen: [
          { id: 'r1', chapter: 1, encounterId: 'e', missionId: 'bar' },
        ],
      }),
    ),
    ['redshirt-lost', 'result-disaster'],
  )
  const reported = run({ phase: 'debrief', report })
  // Carrying the same report forward is silent; a fresh report sounds.
  assert.deepEqual(
    couchCuesFor(reported, run({ phase: 'debrief', report })),
    [],
  )
  assert.deepEqual(
    couchCuesFor(reported, run({ phase: 'debrief', report: { ...report } })),
    ['result-disaster'],
  )
  assert.deepEqual(couchCuesFor(reported, reported), [])
  assert.deepEqual(
    couchCuesFor(base, run({ crew: ['brin', 'fen', 'gleam'] })),
    ['crew-joined'],
  )
  assert.deepEqual(couchCuesFor(base, run({ redshirtRoster: ['r9'] })), [
    'redshirt-hired',
  ])
  // An ending drowns out everything else in the same move.
  assert.deepEqual(
    couchCuesFor(base, run({ ending: 'home', chapter: 9, report })),
    ['ending'],
  )
})

check('every cue is a short, valid tone sketch', () => {
  for (const [cue, tones] of Object.entries(COUCH_CUE_TONES)) {
    assert.ok(tones.length > 0, cue)
    for (const tone of tones) {
      assert.ok(tone.at >= 0 && tone.at < 2, cue)
      assert.ok(tone.dur > 0 && tone.dur <= 2, cue)
      assert.ok(tone.gain > 0 && tone.gain <= 0.35, `${cue} gain`)
      assert.ok(tone.note >= 24 && tone.note <= 100, cue)
    }
  }
  for (const result of ['flawless', 'success', 'costly', 'disaster']) {
    assert.ok(COUCH_CUE_TONES[`result-${result}` as const], result)
  }
})

check('the mix parses, clamps and defaults', () => {
  assert.deepEqual(parseCouchMix(null), DEFAULT_COUCH_MIX)
  assert.deepEqual(parseCouchMix('not json'), DEFAULT_COUCH_MIX)
  assert.deepEqual(parseCouchMix('{"music":2,"effects":-1}'), {
    music: 1,
    effects: 0,
  })
  assert.deepEqual(parseCouchMix('{"music":0.3}'), {
    music: 0.3,
    effects: DEFAULT_COUCH_MIX.effects,
  })
  assert.equal(COUCH_MIX_KEY, 'space-couch-mix-v1')
})

check('the player is silent without a gesture or WebAudio', () => {
  const player = new CouchSound()
  assert.equal(player.unlocked, false)
  player.setMood('away')
  player.play(['launch', 'warp'])
  player.unlock() // no window in Node: stays locked, never throws
  assert.equal(player.unlocked, false)
  player.setEnabled(false)
  player.setHidden(true)
  player.dispose()
})

check('the page wires the master switch, gestures and mixer', () => {
  const page = readFileSync('pages/play/game-of-captains.vue', 'utf8')
  assert.match(page, /@pointerdown\.capture="onSoundGesture"/)
  assert.match(page, /kit\.settings\.sound === 'off'/)
  assert.match(page, /couchCuesFor\(prev, next\)/)
  assert.match(page, /couchMoodFor\(store\.run\)/)
  assert.match(page, /visibilitychange/)
  assert.equal((page.match(/<SpaceCouchSoundMixer \/>/g) ?? []).length, 2)
  const shell = readFileSync(
    'components/playbook-kit/playbook-kit-shell.vue',
    'utf8',
  )
  assert.match(shell, /<slot name="settings-extra" \/>/)
  const store = readFileSync('stores/spaceCouchSoundStore.ts', 'utf8')
  assert.match(store, /localStorage\.setItem\(COUCH_MIX_KEY/)
  // The audio engine stays out of the rules: no sound import in game logic.
  const rules = readFileSync('utils/gameOfCaptains/rules.ts', 'utf8')
  assert.doesNotMatch(rules, /from '\.\/sound'/)
})

console.log(`\n${passed} Space Couch sound checks passed`)
