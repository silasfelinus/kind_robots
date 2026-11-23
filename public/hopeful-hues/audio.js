;(function (root) {
  'use strict'

  const MODES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
  }

  const PROGRESSIONS = [
    [0, 4, 5, 3],
    [0, 5, 3, 4],
    [0, 3, 4, 4],
    [5, 3, 0, 4],
  ]

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
      if (c && c.state === 'suspended') c.resume()
    }

    function setLevels(music, sfx) {
      musicLevel = music
      sfxLevel = sfx
      if (musicBus)
        musicBus.gain.setTargetAtTime(music * 0.45, ctx.currentTime, 0.05)
      if (sfxBus) sfxBus.gain.setTargetAtTime(sfx * 0.6, ctx.currentTime, 0.05)
      if (music <= 0) stopMusic()
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
      const c = ensure()
      if (!c || c.state !== 'running') return
      const fn = SFX[name]
      if (fn) fn(c.currentTime + 0.005, arg)
    }

    function scheduleStep(time) {
      const { root: rootNote, mode, tempo, progression } = song
      const scale = MODES[mode] || MODES.major
      const beat = 60 / tempo / 2
      const bar = Math.floor(step / 8) % progression.length
      const degree = progression[bar]
      const chordNote = (d) =>
        rootNote + scale[(degree + d) % 7] + 12 * Math.floor((degree + d) / 7)
      const s = step % 8
      if (s === 0) {
        ;[0, 2, 4].forEach((d) =>
          tone(musicBus, midiToHz(chordNote(d) - 12), time, beat * 8, {
            type: 'triangle',
            gain: 0.05,
            attack: 0.3,
            filter: 1400,
          }),
        )
        tone(musicBus, midiToHz(chordNote(0) - 24), time, beat * 3, {
          type: 'sine',
          gain: 0.12,
          attack: 0.02,
        })
      }
      if (s === 4)
        tone(musicBus, midiToHz(chordNote(0) - 24), time, beat * 3, {
          type: 'sine',
          gain: 0.1,
        })
      const arp = [0, 2, 4, 7, 4, 2, 4, 9][s]
      tone(musicBus, midiToHz(chordNote(arp) + 12), time, beat * 1.4, {
        type: 'sine',
        gain: 0.045,
      })
      if (song.melody[step % song.melody.length] !== null && s % 2 === 0) {
        const m = song.melody[step % song.melody.length]
        tone(
          musicBus,
          midiToHz(rootNote + 12 + scale[m % 7] + 12 * Math.floor(m / 7)),
          time,
          beat * 1.8,
          { type: 'triangle', gain: 0.04, filter: 3000 },
        )
      }
      if (s === 2 || s === 6) noise(musicBus, time, 0.05, 0.03, 7000)
    }

    function tick() {
      if (!ctx || !song) return
      const beat = 60 / song.tempo / 2
      while (nextTime < ctx.currentTime + 0.25) {
        scheduleStep(nextTime)
        nextTime += beat
        step++
      }
    }

    function startMusic(spec) {
      const c = ensure()
      if (!c || musicLevel <= 0) return
      const key = JSON.stringify(spec)
      if (song && song.key === key) return
      stopMusic()
      let seed = 0
      for (let i = 0; i < key.length; i++)
        seed = (seed * 31 + key.charCodeAt(i)) >>> 0
      const melody = []
      for (let i = 0; i < 32; i++) {
        seed = (seed * 1103515245 + 12345) >>> 0
        melody.push(seed % 5 === 0 ? null : (seed >>> 8) % 9)
      }
      song = {
        key,
        root: spec.root || 60,
        mode: spec.mode || 'major',
        tempo: spec.tempo || 96,
        progression: PROGRESSIONS[(seed >>> 4) % PROGRESSIONS.length],
        melody,
      }
      step = 0
      nextTime = c.currentTime + 0.1
      timer = setInterval(tick, 80)
    }

    function stopMusic() {
      if (timer) clearInterval(timer)
      timer = null
      song = null
    }

    return { unlock, play, startMusic, stopMusic, setLevels }
  }

  root.HopefulHuesAudio = { createAudio }
})(typeof globalThis !== 'undefined' ? globalThis : this)
