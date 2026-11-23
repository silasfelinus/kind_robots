;(function (root) {
  'use strict'

  const MODES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    minor: [0, 2, 3, 5, 7, 8, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
  }

  const TIMBRES = {
    bell: {
      pad: 'triangle',
      padGain: 0.05,
      bass: 'sine',
      lead: 'sine',
      leadGain: 0.045,
      melody: 'triangle',
      hat: true,
      release: 1.4,
    },
    chip: {
      pad: 'square',
      padGain: 0.018,
      bass: 'square',
      lead: 'square',
      leadGain: 0.022,
      melody: 'square',
      hat: true,
      release: 0.6,
      filter: 2600,
    },
    organ: {
      pad: 'sawtooth',
      padGain: 0.03,
      bass: 'sine',
      lead: 'triangle',
      leadGain: 0.03,
      melody: 'sawtooth',
      hat: false,
      release: 2.2,
      filter: 1100,
    },
    lounge: {
      pad: 'sine',
      padGain: 0.05,
      bass: 'triangle',
      lead: 'sine',
      leadGain: 0.05,
      melody: 'sine',
      hat: true,
      release: 1.1,
      swing: 0.18,
      filter: 3200,
    },
    musicbox: {
      pad: 'sine',
      padGain: 0.018,
      bass: 'sine',
      lead: 'sine',
      leadGain: 0.06,
      melody: 'triangle',
      hat: false,
      release: 0.5,
      octave: 24,
    },
    harp: {
      pad: 'sine',
      padGain: 0.035,
      bass: 'triangle',
      lead: 'triangle',
      leadGain: 0.05,
      melody: 'sine',
      hat: false,
      release: 2.4,
    },
    accordion: {
      pad: 'sawtooth',
      padGain: 0.022,
      bass: 'triangle',
      lead: 'sawtooth',
      leadGain: 0.02,
      melody: 'square',
      hat: true,
      release: 0.9,
      filter: 1800,
    },
    synth: {
      pad: 'sawtooth',
      padGain: 0.02,
      bass: 'sawtooth',
      lead: 'square',
      leadGain: 0.02,
      melody: 'sawtooth',
      hat: true,
      release: 0.8,
      filter: 2400,
      kick: true,
    },
    choir: {
      pad: 'sine',
      padGain: 0.06,
      bass: 'sine',
      lead: 'sine',
      leadGain: 0.03,
      melody: 'sine',
      hat: false,
      release: 2.8,
      attack: 0.5,
    },
  }

  const THEMES = {
    bell: [0, 2, 4, 6, 4, 2, 3, 5, 7, 6, 4, 2],
    chip: [0, 0, 4, 2, 5, 4, 2, 0, 3, 5, 4, 1],
    organ: [0, 2, 1, 4, 3, 2, 5, 4, 3, 1, 6, 0],
    lounge: [4, null, 2, 3, 5, 4, null, 2, 6, 5, 3, 1],
    musicbox: [7, 4, 2, 4, 6, 3, 1, 3, 5, 2, 1, 0],
    harp: [0, 2, 4, 7, 6, 4, 3, 2, 1, 3, 5, 4],
    accordion: [0, 4, 2, 5, 3, 1, 4, 6, 4, 3, 1, 0],
    synth: [0, null, 0, 4, 5, null, 3, 2, 7, 4, 3, 1],
    choir: [0, 2, null, 4, 5, null, 3, 2, 4, 3, 1, 0],
    title: [0, 2, 4, 7, 6, 4, 5, 3, 2, 4, 6, 7],
    ending: [4, 2, 0, null, 3, 5, 4, null, 2, 1, 0, null],
  }

  function compose(spec) {
    const tag = spec.tag || ''
    const ending = tag.startsWith('ending-')
    const theme = ending ? 'ending' : tag === 'title' ? 'title' : spec.timbre
    const meter = spec.meter === 3 ? 3 : 4
    const motif = THEMES[theme] || THEMES.bell
    const tier = ending || tag === 'title' ? 0 : spec.tier || 0
    const melody = Array.from({ length: meter * 8 }, (_, i) => {
      if (i % 2 !== 0) return null
      const beat = i / 2
      if (beat === meter * 4 - 1) return 0
      return motif[(beat + tier * 3) % motif.length]
    })
    return {
      progression: ending
        ? [0, 3, 4, 0]
        : [[0, 5, 3, 4], [0, 3, 5, 4], [5, 3, 4, 0]][tier] || [0, 5, 3, 4],
      melody,
    }
  }

  function midiToHz(note) {
    return 440 * Math.pow(2, (note - 69) / 12)
  }

  function createAudio() {
    let ctx = null
    let master = null
    let musicBus = null
    let sfxBus = null
    let musicLevel = 0.5
    let sfxLevel = 0.8
    let song = null
    let requestedMusic = null
    let timer = null
    let step = 0
    let nextTime = 0

    function ensure() {
      if (ctx) return ctx
      const AudioCtx = root.AudioContext || root.webkitAudioContext
      if (!AudioCtx) return null
      ctx = new AudioCtx()
      master = ctx.createGain()
      master.gain.value = 0.9
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.ratio.value = 3
      master.connect(comp)
      comp.connect(ctx.destination)
      musicBus = ctx.createGain()
      musicBus.gain.value = musicLevel * 0.45
      musicBus.connect(master)
      sfxBus = ctx.createGain()
      sfxBus.gain.value = sfxLevel * 0.6
      sfxBus.connect(master)
      return ctx
    }

    function unlock() {
      const c = ensure()
      if (!c) return
      if (c.state === 'running') {
        resumeMusic()
      } else if (c.state === 'suspended') {
        c.resume().then(resumeMusic).catch(() => {})
      }
    }

    function setLevels(music, sfx) {
      musicLevel = music
      sfxLevel = sfx
      if (musicBus)
        musicBus.gain.setTargetAtTime(music * 0.45, ctx.currentTime, 0.05)
      if (sfxBus) sfxBus.gain.setTargetAtTime(sfx * 0.6, ctx.currentTime, 0.05)
      if (music <= 0) haltMusic()
      else resumeMusic()
    }

    function tone(bus, freq, start, duration, opts) {
      const o = opts || {}
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = o.type || 'sine'
      osc.frequency.setValueAtTime(freq, start)
      if (o.slide)
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(30, freq * o.slide),
          start + duration,
        )
      const peak = o.gain || 0.2
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(peak, start + (o.attack || 0.01))
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      let node = osc
      if (o.filter) {
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = o.filter
        osc.connect(filter)
        node = filter
      }
      node.connect(gain)
      gain.connect(bus)
      osc.start(start)
      osc.stop(start + duration + 0.05)
    }

    function noise(bus, start, duration, gainValue, highpass) {
      const length = Math.floor(ctx.sampleRate * duration)
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / length)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = highpass || 3000
      const gain = ctx.createGain()
      gain.gain.value = gainValue
      src.connect(filter)
      filter.connect(gain)
      gain.connect(bus)
      src.start(start)
    }

    const SFX = {
      tap(t) {
        tone(sfxBus, 880, t, 0.06, { type: 'triangle', gain: 0.12 })
      },
      swap(t) {
        tone(sfxBus, 520, t, 0.12, { type: 'sine', gain: 0.16, slide: 1.5 })
      },
      invalid(t) {
        tone(sfxBus, 300, t, 0.12, { type: 'triangle', gain: 0.12, slide: 0.8 })
        tone(sfxBus, 260, t + 0.1, 0.14, {
          type: 'triangle',
          gain: 0.1,
          slide: 0.8,
        })
      },
      match(t, depth) {
        const base = 72 + Math.min(12, (depth || 0) * 2)
        ;[0, 4, 7].forEach((n, i) =>
          tone(sfxBus, midiToHz(base + n), t + i * 0.035, 0.22, {
            type: 'sine',
            gain: 0.12,
          }),
        )
        noise(sfxBus, t, 0.08, 0.04, 6000)
      },
      special(t) {
        ;[0, 4, 7, 12, 16].forEach((n, i) =>
          tone(sfxBus, midiToHz(79 + n), t + i * 0.04, 0.3, {
            type: 'triangle',
            gain: 0.1,
          }),
        )
      },
      comb(t) {
        tone(sfxBus, 400, t, 0.35, {
          type: 'sawtooth',
          gain: 0.07,
          slide: 4,
          filter: 3000,
        })
        noise(sfxBus, t, 0.3, 0.05, 2000)
      },
      bomb(t) {
        tone(sfxBus, 160, t, 0.4, { type: 'sine', gain: 0.25, slide: 0.4 })
        noise(sfxBus, t, 0.5, 0.12, 900)
        ;[0, 5, 9].forEach((n, i) =>
          tone(sfxBus, midiToHz(88 + n), t + 0.05 + i * 0.05, 0.2, {
            gain: 0.06,
          }),
        )
      },
      rainbow(t) {
        for (let i = 0; i < 10; i++)
          tone(
            sfxBus,
            midiToHz(72 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21][i]),
            t + i * 0.035,
            0.35,
            { type: 'sine', gain: 0.09 },
          )
      },
      rescue(t) {
        ;[0, 7, 12, 19].forEach((n, i) =>
          tone(sfxBus, midiToHz(76 + n), t + i * 0.06, 0.18, {
            type: 'square',
            gain: 0.05,
            filter: 2500,
          }),
        )
      },
      gloom(t) {
        tone(sfxBus, midiToHz(96), t, 0.25, { type: 'sine', gain: 0.05 })
      },
      undo(t) {
        tone(sfxBus, 700, t, 0.2, { type: 'sine', gain: 0.14, slide: 0.5 })
        tone(sfxBus, 1050, t + 0.03, 0.18, {
          type: 'sine',
          gain: 0.06,
          slide: 0.5,
        })
      },
      win(t) {
        const notes = [72, 76, 79, 84, 79, 84, 88]
        notes.forEach((n, i) =>
          tone(sfxBus, midiToHz(n), t + i * 0.11, 0.35, {
            type: 'triangle',
            gain: 0.14,
          }),
        )
        notes.forEach((n, i) =>
          tone(sfxBus, midiToHz(n - 12), t + i * 0.11, 0.35, {
            type: 'sine',
            gain: 0.08,
          }),
        )
      },
      fail(t) {
        ;[72, 69, 67, 64].forEach((n, i) =>
          tone(sfxBus, midiToHz(n), t + i * 0.16, 0.4, {
            type: 'sine',
            gain: 0.1,
          }),
        )
      },
      star(t, index) {
        tone(sfxBus, midiToHz(84 + (index || 0) * 4), t, 0.4, {
          type: 'triangle',
          gain: 0.14,
        })
        noise(sfxBus, t, 0.15, 0.03, 8000)
      },
      chime(t) {
        ;[84, 88, 91].forEach((n, i) =>
          tone(sfxBus, midiToHz(n), t + i * 0.07, 0.5, {
            type: 'sine',
            gain: 0.1,
          }),
        )
      },
    }

    function play(name, arg) {
      if (sfxLevel <= 0) return
      const c = ctx
      if (!c || c.state !== 'running') return
      const fn = SFX[name]
      if (fn) fn(c.currentTime + 0.005, arg)
    }

    function scheduleStep(time) {
      const { root: rootNote, mode, tempo, progression } = song
      const t = TIMBRES[song.timbre] || TIMBRES.bell
      const scale = MODES[mode] || MODES.major
      const beat = 60 / tempo / 2
      const perBar = song.meter === 3 ? 6 : 8
      const bar = Math.floor(step / perBar) % progression.length
      const degree = progression[bar]
      const chordNote = (d) =>
        rootNote + scale[(degree + d) % 7] + 12 * Math.floor((degree + d) / 7)
      const s = step % perBar
      const at = time + (t.swing && s % 2 === 1 ? beat * t.swing : 0)
      if (s === 0) {
        ;[0, 2, 4].forEach((d) =>
          tone(musicBus, midiToHz(chordNote(d) - 12), at, beat * perBar, {
            type: t.pad,
            gain: t.padGain,
            attack: t.attack || 0.3,
            filter: t.filter || 1400,
          }),
        )
      }
      const bassBeats = song.meter === 3 ? [0] : [0, 4]
      if (bassBeats.includes(s))
        tone(musicBus, midiToHz(chordNote(0) - 24), at, beat * 3, {
          type: t.bass,
          gain: 0.11,
          attack: 0.02,
          filter: t.filter,
        })
      if (song.meter === 3 && (s === 2 || s === 4))
        [2, 4].forEach((d) =>
          tone(musicBus, midiToHz(chordNote(d) - 12), at, beat * 0.9, {
            type: t.bass,
            gain: 0.035,
            filter: t.filter,
          }),
        )
      const arpPattern =
        song.meter === 3 ? [0, 2, 4, 7, 4, 2] : [0, 2, 4, 7, 4, 2, 4, 9]
      tone(
        musicBus,
        midiToHz(chordNote(arpPattern[s]) + (t.octave || 12)),
        at,
        beat * t.release,
        {
          type: t.lead,
          gain: t.leadGain,
          filter: t.filter,
        },
      )
      if (song.melody[step % song.melody.length] !== null && s % 2 === 0) {
        const m = song.melody[step % song.melody.length]
        tone(
          musicBus,
          midiToHz(rootNote + 12 + scale[m % 7] + 12 * Math.floor(m / 7)),
          at,
          beat * 1.8,
          {
            type: t.melody,
            gain: 0.035,
            filter: t.filter || 3000,
            attack: t.attack ? 0.15 : 0.01,
          },
        )
      }
      if (t.kick && s % 2 === 0)
        tone(musicBus, 110, at, 0.18, { type: 'sine', gain: 0.16, slide: 0.35 })
      if (t.hat && (s === 2 || s === 6 || (song.meter === 3 && s === 4)))
        noise(musicBus, at, 0.05, 0.03, 7000)
    }

    function tick() {
      if (!ctx || ctx.state !== 'running' || !song) return
      const beat = 60 / song.tempo / 2
      if (nextTime < ctx.currentTime - 0.25) nextTime = ctx.currentTime + 0.05
      while (nextTime < ctx.currentTime + 0.25) {
        scheduleStep(nextTime)
        nextTime += beat
        step++
      }
    }

    function startMusic(spec) {
      requestedMusic = { ...spec }
      resumeMusic()
    }

    function resumeMusic() {
      const c = ctx
      const spec = requestedMusic
      if (!c || c.state !== 'running' || !spec || musicLevel <= 0) return
      const key = JSON.stringify(spec)
      if (song && song.key === key) return
      haltMusic()
      song = {
        key,
        root: spec.root || 60,
        mode: spec.mode || 'major',
        tempo: spec.tempo || 96,
        timbre: spec.timbre || 'bell',
        meter: spec.meter || 4,
        ...compose(spec),
      }
      step = 0
      nextTime = c.currentTime + 0.1
      timer = setInterval(tick, 80)
    }

    function stopMusic() {
      requestedMusic = null
      haltMusic()
    }

    function haltMusic() {
      if (timer) clearInterval(timer)
      timer = null
      song = null
    }

    return { unlock, play, startMusic, stopMusic, setLevels }
  }

  root.HopefulHuesAudio = { createAudio, compose }
})(typeof globalThis !== 'undefined' ? globalThis : this)
