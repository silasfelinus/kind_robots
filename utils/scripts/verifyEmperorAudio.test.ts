// Emperor of Dust sound (conductor emperor-of-dust t-073), checked in Node
// without a browser or speakers: every effect is a well-formed recipe, every
// theme composes a deterministic phrase in a sane range, the act and context
// mapping covers all fifty days and every ending, the sound settings validate
// and migrate, the state diff earns the right effects, the player is a no-op
// without WebAudio and schedules only valid automation with it, and the engine
// never imports the sound.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import {
  EMPEROR_SFX,
  EMPEROR_SFX_NAMES,
  emperorSfxSeconds,
  type EmperorSfxName,
} from '../emperorOfDust/audio/sfx'
import {
  composeEmperorPhrase,
  emperorActOfDay,
  emperorCueBpm,
  emperorCueKey,
  emperorEndingTone,
  emperorMidiToHz,
  emperorMoodOfDay,
  emperorMusicCueFor,
  EMPEROR_MOODS,
  EMPEROR_MUSIC_CONTEXTS,
  EMPEROR_PHRASE_BEATS,
  EMPEROR_ROOM_STYLES,
  type EmperorMoodId,
  type EmperorMusicCue,
  type EmperorMusicState,
} from '../emperorOfDust/audio/music'
import {
  cleanEmperorAudioPref,
  cleanEmperorVolume,
  DEFAULT_EMPEROR_AUDIO_PREFS,
  emperorAudioLevels,
  readEmperorAudioPrefs,
} from '../emperorOfDust/audio/prefs'
import {
  emperorCuesFor,
  emperorRunJumped,
  EMPEROR_MAX_CUES,
} from '../emperorOfDust/audio/cues'
import { EmperorSound } from '../emperorOfDust/audio/player'
import { actOf, createRun } from '../emperorOfDust/fortress/engine'
import { ENDINGS, type EndingId } from '../emperorOfDust/fortress/endings'
import { ROOMS } from '../emperorOfDust/fortress/rooms'
import type { DawnReport, FortressRun } from '../emperorOfDust/fortress/types'

const finite = (value: number) => Number.isFinite(value)

// --- effects ------------------------------------------------------------------
{
  const expected: EmperorSfxName[] = [
    'click',
    'select',
    'confirm',
    'brassGain',
    'brassSpend',
    'questDispatched',
    'questWithdrawn',
    'questSuccess',
    'questFailure',
    'followerInjured',
    'followerDeath',
    'recruit',
    'dawnBell',
    'actChange',
    'achievement',
    'save',
    'load',
    'betrayal',
  ]
  assert.deepEqual([...EMPEROR_SFX_NAMES].sort(), [...expected].sort())
  const waves = new Set(['sine', 'triangle', 'square', 'sawtooth', 'noise'])
  for (const name of expected) {
    const voices = EMPEROR_SFX[name]
    assert.ok(voices?.length, `${name} has voices`)
    for (const [index, voice] of voices.entries()) {
      const where = `${name}[${index}]`
      assert.ok(waves.has(voice.wave), `${where} wave`)
      for (const hz of [voice.from, voice.to])
        assert.ok(finite(hz) && hz >= 20 && hz <= 12_000, `${where} Hz ${hz}`)
      assert.ok(finite(voice.at) && voice.at >= 0 && voice.at <= 3, where)
      assert.ok(
        finite(voice.seconds) && voice.seconds >= 0.02 && voice.seconds <= 4,
        `${where} seconds`,
      )
      assert.ok(
        finite(voice.peak) && voice.peak > 0.001 && voice.peak <= 0.3,
        `${where} peak ${voice.peak}`,
      )
      if (voice.q !== undefined)
        assert.ok(finite(voice.q) && voice.q > 0 && voice.q <= 30, where)
      if (voice.mod) {
        assert.notEqual(voice.wave, 'noise', `${where} noise is not modulated`)
        assert.ok(finite(voice.mod.ratio) && voice.mod.ratio > 0, where)
        assert.ok(
          finite(voice.mod.index) && voice.mod.index > 0 && voice.mod.index < 5,
          where,
        )
      }
    }
    const longest = emperorSfxSeconds(name)
    // A death is rare and solemn; everything else stays out of the way.
    assert.ok(
      longest <= (name === 'followerDeath' ? 5.5 : 3.2),
      `${name} lasts ${longest}s`,
    )
  }
  assert.ok(emperorSfxSeconds('click') < 0.1, 'a click is a tick')
}

// --- music: every context and mood composes ----------------------------------
const VOICES = new Set([
  'drone',
  'pluck',
  'bass',
  'flute',
  'bell',
  'drum',
  'tick',
])
const MOODS = Object.keys(EMPEROR_MOODS) as EmperorMoodId[]
{
  assert.deepEqual(
    [...EMPEROR_MUSIC_CONTEXTS].sort(),
    Object.keys(EMPEROR_ROOM_STYLES).sort(),
  )
  for (const context of [
    'title',
    'throne',
    'quests',
    'barracks',
    'market',
    'map',
    'dawn',
    'ending',
  ] as const)
    assert.ok(EMPEROR_MUSIC_CONTEXTS.includes(context), context)
  for (const mood of MOODS) {
    const def = EMPEROR_MOODS[mood]
    assert.equal(def.id, mood)
    assert.equal(def.progression.length, 4, `${mood} has four chords`)
    assert.ok(def.bpm >= 40 && def.bpm <= 90, `${mood} tempo`)
    assert.ok(def.echo >= 0 && def.echo < 0.6, `${mood} echo`)
  }
  for (const context of EMPEROR_MUSIC_CONTEXTS)
    for (const mood of MOODS) {
      const cue: EmperorMusicCue = { context, mood }
      const key = emperorCueKey(cue)
      const bpm = emperorCueBpm(cue)
      assert.ok(bpm >= 30 && bpm <= 100, `${key} tempo ${bpm}`)
      const voices = new Set<string>()
      const phrases: string[] = []
      for (let phrase = 0; phrase < 6; phrase += 1) {
        const notes = composeEmperorPhrase(cue, phrase)
        assert.ok(notes.length >= 4, `${key} #${phrase} is not empty`)
        assert.deepEqual(
          composeEmperorPhrase(cue, phrase),
          notes,
          `${key} #${phrase} is deterministic`,
        )
        for (const note of notes) {
          assert.ok(VOICES.has(note.voice), `${key} voice ${note.voice}`)
          assert.ok(
            Number.isInteger(note.midi) && note.midi >= 24 && note.midi <= 100,
            `${key} midi ${note.midi}`,
          )
          assert.ok(
            finite(note.beat) &&
              note.beat >= 0 &&
              note.beat < EMPEROR_PHRASE_BEATS,
            `${key} beat ${note.beat}`,
          )
          assert.ok(
            finite(note.beats) && note.beats > 0 && note.beats <= 16,
            key,
          )
          assert.ok(note.velocity > 0 && note.velocity <= 1, key)
          voices.add(note.voice)
        }
        for (let index = 1; index < notes.length; index += 1)
          assert.ok(notes[index - 1]!.beat <= notes[index]!.beat, 'sorted')
        phrases.push(JSON.stringify(notes))
      }
      assert.ok(voices.has('pluck'), `${key} has a plucked line`)
      assert.ok(
        voices.has('drone') || voices.has('bass'),
        `${key} has a floor under it`,
      )
      assert.ok(new Set(phrases).size > 1, `${key} varies phrase to phrase`)
    }
  // The rooms sound different from each other within one act.
  const act1 = EMPEROR_MUSIC_CONTEXTS.map((context) =>
    JSON.stringify(composeEmperorPhrase({ context, mood: 'act1' }, 0)),
  )
  assert.equal(new Set(act1).size, act1.length, 'every room has its own sound')
  // The acts sound different from each other in one room.
  const throne = (['act1', 'act2', 'act3', 'act4', 'act5', 'hideout'] as const)
    .map((mood) => composeEmperorPhrase({ context: 'throne', mood }, 0))
    .map((notes) => JSON.stringify(notes.map((note) => note.midi)))
  assert.equal(new Set(throne).size, throne.length, 'every act has its key')
  // The reign darkens: slower and darker each act, the hideout darkest.
  const order = ['act1', 'act2', 'act3', 'act4', 'act5', 'hideout'] as const
  for (let index = 1; index < order.length; index += 1) {
    const before = EMPEROR_MOODS[order[index - 1]!]
    const after = EMPEROR_MOODS[order[index]!]
    assert.ok(after.bpm < before.bpm, `${after.id} slower`)
    assert.ok(after.cutoff < before.cutoff, `${after.id} darker`)
  }
  // Quests drive; the barracks have no drum; dawn tolls its bell.
  const quests = composeEmperorPhrase({ context: 'quests', mood: 'act2' }, 3)
  assert.ok(quests.filter((note) => note.voice === 'pluck').length >= 16)
  for (let phrase = 0; phrase < 8; phrase += 1) {
    const barracks = composeEmperorPhrase(
      { context: 'barracks', mood: 'act3' },
      phrase,
    )
    assert.ok(!barracks.some((note) => note.voice === 'drum'))
    const dawn = composeEmperorPhrase({ context: 'dawn', mood: 'act3' }, phrase)
    assert.equal(dawn.filter((note) => note.voice === 'bell').length, 4)
  }
  assert.ok(Math.abs(emperorMidiToHz(69) - 440) < 1e-9)
  assert.ok(Math.abs(emperorMidiToHz(57) - 220) < 1e-9)
}

// --- the act and context mapping covers fifty days and every ending ---------
{
  const base: EmperorMusicState = {
    title: false,
    room: 'briefing',
    dawn: false,
    day: 1,
    hideout: false,
    over: false,
  }
  for (let day = 1; day <= 50; day += 1) {
    assert.equal(emperorActOfDay(day), actOf(day), `day ${day} act`)
    const expected = Math.ceil(day / 10)
    assert.equal(emperorActOfDay(day), expected)
    assert.equal(emperorMoodOfDay(day), `act${expected}`)
    const cue = emperorMusicCueFor({ ...base, day })
    assert.deepEqual(cue, { context: 'briefing', mood: `act${expected}` })
    // After Komodo's Day 40 betrayal the crown is in hiding: Act V darkens.
    const hidden = emperorMusicCueFor({ ...base, day, hideout: true })
    assert.equal(hidden.mood, day >= 41 ? 'hideout' : `act${expected}`)
    assert.deepEqual(emperorMusicCueFor({ ...base, day, dawn: true }), {
      context: 'dawn',
      mood: cue.mood,
    })
  }
  assert.equal(emperorActOfDay(51), 5, 'the day after the last stays Act V')
  assert.equal(emperorActOfDay(Number.NaN), 1)
  for (const room of ROOMS) {
    const cue = emperorMusicCueFor({ ...base, room: room.id, day: 23 })
    assert.ok(EMPEROR_MUSIC_CONTEXTS.includes(cue.context), room.id)
    if (room.id !== 'chronicle') {
      assert.equal(cue.context, room.id, `${room.id} has its own theme`)
      assert.equal(cue.mood, 'act3')
    } else assert.deepEqual(cue, { context: 'title', mood: 'title' })
  }
  assert.deepEqual(
    emperorMusicCueFor({ ...base, room: 'nowhere', day: 5 }).context,
    'briefing',
  )
  assert.deepEqual(emperorMusicCueFor({ ...base, title: true, day: 33 }), {
    context: 'title',
    mood: 'title',
  })
  const tones = new Set<string>()
  for (const ending of Object.keys(ENDINGS) as EndingId[]) {
    const cue = emperorMusicCueFor({
      ...base,
      day: 51,
      over: true,
      ending,
      title: true,
      dawn: true,
    })
    assert.equal(cue.context, 'ending', `${ending} plays the ending theme`)
    assert.equal(cue.mood, `ending-${emperorEndingTone(ending)}`)
    tones.add(cue.mood)
    assert.ok(composeEmperorPhrase(cue, 0).length > 0)
  }
  assert.equal(tones.size, 3, 'hopeful, hard and grim endings all occur')
  assert.equal(emperorEndingTone('long-night'), 'grim')
  assert.equal(emperorEndingTone('bell-restored'), 'hopeful')
  assert.equal(emperorEndingTone('no-such-ending'), 'hard')
}

// --- sound settings validate and migrate --------------------------------------
{
  const reading = {
    readingSize: 'large',
    readingFont: 'sans',
    readingWidth: 'wide',
    contrast: 'high',
    motion: 'reduced',
  }
  assert.deepEqual(
    readEmperorAudioPrefs(reading),
    DEFAULT_EMPEROR_AUDIO_PREFS,
    'prefs stored before t-073 read as the defaults',
  )
  assert.deepEqual(readEmperorAudioPrefs(null), DEFAULT_EMPEROR_AUDIO_PREFS)
  assert.equal(DEFAULT_EMPEROR_AUDIO_PREFS.muted, false, 'sound on by default')
  for (const key of ['masterVolume', 'musicVolume', 'sfxVolume'] as const) {
    const value = DEFAULT_EMPEROR_AUDIO_PREFS[key]
    assert.ok(value >= 0.4 && value <= 0.85, `${key} is moderate`)
  }
  assert.deepEqual(
    readEmperorAudioPrefs({
      ...reading,
      masterVolume: 7,
      musicVolume: -2,
      sfxVolume: 0.333333,
      muted: true,
    }),
    { masterVolume: 1, musicVolume: 0, sfxVolume: 0.33, muted: true },
    'out-of-range volumes clamp',
  )
  assert.deepEqual(
    readEmperorAudioPrefs({
      masterVolume: '0.2',
      musicVolume: Number.NaN,
      sfxVolume: null,
      muted: 'yes',
    }),
    DEFAULT_EMPEROR_AUDIO_PREFS,
    'unusable values fall back one by one',
  )
  assert.deepEqual(
    readEmperorAudioPrefs({ musicVolume: 0.25, sfxVolume: Infinity }),
    { ...DEFAULT_EMPEROR_AUDIO_PREFS, musicVolume: 0.25 },
  )
  assert.equal(cleanEmperorVolume(0.5), 0.5)
  assert.equal(cleanEmperorVolume(Number.POSITIVE_INFINITY), undefined)
  assert.equal(cleanEmperorAudioPref('muted', true), true)
  assert.equal(cleanEmperorAudioPref('muted', 1), undefined)
  assert.equal(cleanEmperorAudioPref('sfxVolume', 1.5), 1)
  assert.equal(cleanEmperorAudioPref('sfxVolume', 'loud'), undefined)
  assert.deepEqual(
    emperorAudioLevels({ ...DEFAULT_EMPEROR_AUDIO_PREFS, muted: true }),
    { master: 0, music: 0, sfx: 0 },
  )
  assert.deepEqual(emperorAudioLevels(DEFAULT_EMPEROR_AUDIO_PREFS), {
    master: DEFAULT_EMPEROR_AUDIO_PREFS.masterVolume,
    music: DEFAULT_EMPEROR_AUDIO_PREFS.musicVolume,
    sfx: DEFAULT_EMPEROR_AUDIO_PREFS.sfxVolume,
  })
}

// --- the state diff earns the right effects -----------------------------------
{
  const start = createRun(4242)
  const copy = (run: FortressRun): FortressRun => structuredClone(run)
  const quest = (
    tier: DawnReport['quests'][number]['tier'],
    extra: Partial<DawnReport['quests'][number]> = {},
  ): DawnReport['quests'][number] => ({
    questId: 'q-test',
    tier,
    party: ['f-test'],
    chance: 0.5,
    roll: 0.4,
    injuries: [],
    deaths: [],
    revealedTraits: [],
    effects: {},
    ...extra,
  })
  const dawn = (
    run: FortressRun,
    quests: DawnReport['quests'],
    extra: Partial<DawnReport> = {},
  ): FortressRun => {
    const next = copy(run)
    next.day = run.day + 1
    next.reports = [
      ...run.reports,
      {
        day: next.day,
        quests,
        taxes: 3,
        wages: 1,
        loanTaken: false,
        events: [],
        ...extra,
      },
    ]
    return next
  }

  assert.deepEqual(emperorCuesFor(null, start), [], 'the first load is silent')
  assert.deepEqual(emperorCuesFor(start, start), [])
  const richer = copy(start)
  richer.brass += 3
  assert.deepEqual(emperorCuesFor(start, richer), ['brassGain'])
  assert.deepEqual(emperorCuesFor(richer, start), ['brassSpend'])

  const hired = copy(start)
  hired.roster = [
    ...hired.roster,
    { id: 'f-test', joinedDay: hired.day, equipment: {} },
  ]
  hired.brass -= 2
  assert.deepEqual(emperorCuesFor(start, hired), ['recruit', 'brassSpend'])

  const sent = copy(start)
  sent.active = [
    ...sent.active,
    {
      questId: 'q-test',
      party: ['f-test'],
      departedDay: start.day,
      returnsDay: start.day + 1,
      postedDay: start.day,
      lastDay: start.day + 2,
    },
  ]
  assert.deepEqual(emperorCuesFor(start, sent), ['questDispatched'])
  assert.deepEqual(emperorCuesFor(sent, start), ['questWithdrawn'])

  assert.deepEqual(emperorCuesFor(start, dawn(start, [])), ['dawnBell'])
  assert.deepEqual(emperorCuesFor(start, dawn(start, [quest('success')])), [
    'dawnBell',
    'questSuccess',
  ])
  assert.deepEqual(
    emperorCuesFor(
      start,
      dawn(start, [
        quest('failure', { injuries: [{ followerId: 'f-test', days: 2 }] }),
      ]),
    ),
    ['dawnBell', 'followerInjured', 'questFailure'],
  )
  assert.deepEqual(
    emperorCuesFor(
      start,
      dawn(start, [
        quest('failure', {
          deaths: ['f-test'],
          injuries: [{ followerId: 'f-x', days: 2 }],
        }),
        quest('triumph'),
      ]),
    ),
    ['dawnBell', 'followerDeath', 'questSuccess'],
    'a death outranks a wound',
  )
  assert.deepEqual(
    emperorCuesFor(start, dawn(start, [quest('expired')])),
    ['dawnBell'],
    'an expired notice is not news',
  )
  const dayTen = copy(start)
  dayTen.day = 10
  assert.deepEqual(emperorCuesFor(dayTen, dawn(dayTen, [])), [
    'dawnBell',
    'actChange',
  ])
  const dayForty = copy(start)
  dayForty.day = 40
  const betrayed = dawn(dayForty, [quest('failure')], {
    betrayal: { buyer: 'black-verge', hideout: 'the cisterns', departed: [] },
  })
  assert.deepEqual(
    emperorCuesFor(dayForty, betrayed),
    ['betrayal', 'questFailure'],
    "Komodo's betrayal replaces the bell and the act change",
  )
  const dayFifty = copy(start)
  dayFifty.day = 50
  assert.deepEqual(emperorCuesFor(dayFifty, dawn(dayFifty, [])), ['dawnBell'])
  const busy = dawn(start, [
    quest('failure', { deaths: ['f-test'] }),
    quest('success'),
  ])
  assert.ok(emperorCuesFor(start, busy).length <= EMPEROR_MAX_CUES)

  // Jumps are not diffed: the page plays the load cue for those.
  const rewound = copy(start)
  rewound.branch += 1
  rewound.brass += 9
  assert.ok(emperorRunJumped(start, rewound))
  assert.deepEqual(emperorCuesFor(start, rewound), [])
  const other = createRun(99)
  assert.deepEqual(emperorCuesFor(start, other), [])
  const later = copy(start)
  later.day += 5
  assert.deepEqual(emperorCuesFor(start, later), [], 'a loaded later day')
  assert.deepEqual(emperorCuesFor(later, start), [], 'a rewound earlier day')
}

// --- the player is a no-op without WebAudio ----------------------------------
{
  assert.equal(typeof (globalThis as { window?: unknown }).window, 'undefined')
  assert.equal(EmperorSound.available, false)
  const silent = new EmperorSound()
  assert.equal(silent.start({ master: 1, music: 1, sfx: 1 }), false)
  assert.equal(silent.running, false)
  silent.play('dawnBell')
  silent.playMusic({ context: 'throne', mood: 'act1' })
  silent.setLevels({ master: 0.5, music: 0.5, sfx: 0.5 })
  silent.setAmbience({ night: true, hideout: true })
  silent.pause()
  silent.resume()
  silent.stopMusic()
  silent.stop()
  silent.dispose()
}

// --- with WebAudio, only valid automation is scheduled ------------------------
{
  let scheduled = 0
  let started = 0
  class FakeParam {
    value: number
    constructor(value = 0) {
      this.value = value
    }
    private check(value: number, time: number, what: string) {
      assert.ok(finite(value), `${what} value ${value}`)
      assert.ok(finite(time) && time >= 0, `${what} time ${time}`)
      scheduled += 1
    }
    setValueAtTime(value: number, time: number) {
      this.check(value, time, 'setValueAtTime')
      return this
    }
    linearRampToValueAtTime(value: number, time: number) {
      this.check(value, time, 'linearRamp')
      return this
    }
    exponentialRampToValueAtTime(value: number, time: number) {
      this.check(value, time, 'exponentialRamp')
      assert.ok(value > 0, 'an exponential ramp never targets zero')
      return this
    }
    cancelScheduledValues() {
      return this
    }
  }
  class FakeNode {
    connect<T>(target: T): T {
      assert.ok(target, 'connects to something')
      return target
    }
    disconnect() {}
  }
  class FakeSource extends FakeNode {
    frequency = new FakeParam(440)
    detune = new FakeParam(0)
    type = 'sine'
    buffer: unknown = null
    loop = false
    start(time = 0) {
      assert.ok(finite(time) && time >= 0, `start ${time}`)
      started += 1
    }
    stop(time = 0) {
      assert.ok(finite(time) && time >= 0, `stop ${time}`)
    }
  }
  class FakeContext {
    currentTime = 0
    sampleRate = 8000
    state: 'running' | 'suspended' | 'closed' = 'suspended'
    destination = new FakeNode()
    createGain() {
      return Object.assign(new FakeNode(), { gain: new FakeParam(1) })
    }
    createOscillator() {
      return new FakeSource()
    }
    createBufferSource() {
      return new FakeSource()
    }
    createBiquadFilter() {
      return Object.assign(new FakeNode(), {
        type: 'lowpass',
        frequency: new FakeParam(350),
        Q: new FakeParam(1),
      })
    }
    createDelay() {
      return Object.assign(new FakeNode(), { delayTime: new FakeParam(0) })
    }
    createBuffer(_channels: number, length: number) {
      const data = new Float32Array(length)
      return { getChannelData: () => data }
    }
    async resume() {
      this.state = 'running'
    }
    async suspend() {
      this.state = 'suspended'
    }
    async close() {
      this.state = 'closed'
    }
  }
  const contexts: FakeContext[] = []
  ;(globalThis as { window?: unknown }).window = {
    AudioContext: class extends FakeContext {
      constructor() {
        super()
        contexts.push(this)
      }
    },
  }
  try {
    assert.equal(EmperorSound.available, true)
    const sound = new EmperorSound()
    assert.equal(sound.start({ master: 0.7, music: 0.6, sfx: 0.8 }), true)
    const context = contexts[0]!
    await Promise.resolve()
    assert.equal(sound.running, true, 'started on a gesture')
    for (const name of EMPEROR_SFX_NAMES) sound.play(name, 0.25)
    sound.setAmbience({ night: true, hideout: false })
    let tick = 0
    for (const context_ of EMPEROR_MUSIC_CONTEXTS)
      for (const mood of MOODS) {
        sound.playMusic({ context: context_, mood })
        // Walk the clock forward through two phrases' worth of scheduling.
        for (let step = 0; step < 4; step += 1) {
          tick += 3
          context.currentTime = tick
          ;(sound as unknown as { scheduleMusic(): void }).scheduleMusic()
        }
      }
    sound.setLevels({ master: 0.2, music: 0, sfx: 1 })
    sound.setAmbience({ night: false, hideout: true })
    sound.stop()
    sound.dispose()
    assert.equal(context.state, 'closed', 'dispose closes the context')
    assert.ok(started > 1000, `many voices started (${started})`)
    assert.ok(scheduled > started, 'and every one was shaped')
  } finally {
    delete (globalThis as { window?: unknown }).window
  }
}

// --- the engine never imports the sound ---------------------------------------
{
  const dir = new URL('../emperorOfDust/fortress/', import.meta.url)
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.ts'))) {
    const source = readFileSync(new URL(file, dir), 'utf8')
    assert.doesNotMatch(source, /from ['"][^'"]*audio/, `${file} imports audio`)
    assert.doesNotMatch(source, /AudioContext/, `${file} touches WebAudio`)
  }
  const store = readFileSync(
    new URL('../../stores/emperorFortressStore.ts', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(store, /audio\/(player|useEmperorAudio)/)
  const page = readFileSync(
    new URL('../../pages/play/emperor-of-dust.vue', import.meta.url),
    'utf8',
  )
  assert.match(page, /useEmperorAudio\(/, 'the page wires the sound')
  const settings = readFileSync(
    new URL('../../components/EmperorFortressPreferences.vue', import.meta.url),
    'utf8',
  )
  for (const id of [
    'emperor-sound-mute',
    'emperor-sound-${volume.key}',
  ] as const)
    assert.ok(settings.includes(id), `settings expose ${id}`)
}

console.log(
  `Emperor of Dust audio: ok (${EMPEROR_SFX_NAMES.length} effects, ${EMPEROR_MUSIC_CONTEXTS.length} contexts x ${MOODS.length} moods)`,
)
