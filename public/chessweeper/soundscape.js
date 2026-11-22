;(() => {
  const worlds = {
    sugar: {
      bpm: 126,
      wave: 'triangle',
      melody: [72, 76, 79, 84, 79, 76, 74, 76, 72, 79, 81, 84, 79, 76, 74, 72],
      bass: [48, 55, 53, 55],
    },
    ashen: {
      bpm: 76,
      wave: 'sine',
      melody: [
        50,
        null,
        null,
        57,
        null,
        55,
        null,
        53,
        48,
        null,
        50,
        null,
        55,
        null,
        53,
        null,
      ],
      bass: [38, 41, 36, 38],
    },
    jackpot: {
      bpm: 134,
      wave: 'sawtooth',
      melody: [
        64,
        null,
        67,
        70,
        74,
        null,
        70,
        67,
        64,
        67,
        71,
        null,
        76,
        71,
        67,
        null,
      ],
      bass: [40, 40, 43, 45],
    },
  }
  const cues = {
    move: [330, 440],
    capture: [280, 570, 780],
    mine: [120, 84, 60],
    blade: [420, 190],
    rush: [587, 740, 880, 1175],
    laststand: [175, 350, 523],
    wager: [392, 587, 784],
    jackpot: [659, 830, 988, 1318],
    damage: [170, 110],
    victory: [523, 659, 784, 1047],
    defeat: [220, 185, 147],
    achievement: [660, 880, 1320],
  }
  const TRACKS = {
    sugar: ['sugar-stage', 'sugar-finale'],
    ashen: ['ashen-stage', 'ashen-finale'],
    jackpot: ['jackpot-stage', 'jackpot-finale'],
  }
  const root = document.documentElement
  const settings = {
    sound: true,
    music: true,
    musicVolume: 0.32,
    effectsVolume: 0.58,
  }
  let context = null
  let master = null
  let musicBus = null
  let effectsBus = null
  let timer = null
  let nextTime = 0
  let step = 0
  let realm = root.dataset.realm || 'jackpot'
  let ended = false
  let requestedTrack = ''
  let activeTrack = ''
  let trackSource = null
  let trackGain = null
  const decodedTracks = new Map()
  const pendingTracks = new Map()

  function scoreKey() {
    const world = root.dataset.realm || 'jackpot'
    const chapter = window.__chessweeperCampaign?.current?.(world)?.chapter || 0
    const scores = TRACKS[world] || TRACKS.jackpot
    return scores[chapter === 3 ? 1 : 0]
  }

  function retireTrack() {
    if (!context || !trackSource) return
    const now = context.currentTime
    trackGain?.gain.setTargetAtTime(0, now, 0.12)
    try {
      trackSource.stop(now + 0.45)
    } catch {}
    trackSource = null
    trackGain = null
    activeTrack = ''
  }

  function startTrack(key) {
    if (
      !context ||
      !musicBus ||
      !settings.music ||
      ended ||
      context.state !== 'running' ||
      activeTrack === key ||
      !decodedTracks.has(key)
    ) {
      return
    }
    const source = context.createBufferSource()
    const gain = context.createGain()
    const now = context.currentTime
    source.buffer = decodedTracks.get(key)
    source.loop = true
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.setTargetAtTime(0.8, now, 0.18)
    source.connect(gain)
    gain.connect(musicBus)
    retireTrack()
    source.start(now + 0.02)
    trackSource = source
    trackGain = gain
    activeTrack = key
  }

  function fetchTrack(key) {
    if (
      !context?.decodeAudioData ||
      !window.fetch ||
      pendingTracks.has(key) ||
      decodedTracks.has(key)
    ) {
      return
    }
    const pending = window
      .fetch('/chessweeper/music/' + key + '.wav')
      .then((response) => {
        if (!response.ok) throw new Error('Missing Chessweeper music')
        return response.arrayBuffer()
      })
      .then((bytes) => context?.decodeAudioData(bytes))
      .then((buffer) => {
        if (buffer) decodedTracks.set(key, buffer)
        if (requestedTrack === key) startTrack(key)
      })
      .catch(() => {
        // Keep the original procedural score if offline or an asset is unavailable.
      })
      .finally(() => pendingTracks.delete(key))
    pendingTracks.set(key, pending)
  }

  function syncTrack() {
    if (!context || ended) return
    const key = scoreKey()
    if (key !== requestedTrack) {
      requestedTrack = key
      if (activeTrack !== key) retireTrack()
    }
    if (decodedTracks.has(key)) startTrack(key)
    else fetchTrack(key)
  }

  const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12)
  const level = (value, fallback) =>
    Number.isFinite(Number(value))
      ? Math.max(0, Math.min(1, Number(value)))
      : fallback

  function updateVolume() {
    if (!context || !musicBus || !effectsBus) return
    const now = context.currentTime
    musicBus.gain.setTargetAtTime(
      settings.music ? settings.musicVolume : 0,
      now,
      0.05,
    )
    effectsBus.gain.setTargetAtTime(
      settings.sound ? settings.effectsVolume : 0,
      now,
      0.03,
    )
  }

  function voice(pitch, when, duration, wave, bus, loudness = 0.18) {
    if (!context || !bus) return
    const source = context.createOscillator()
    const envelope = context.createGain()
    source.type = wave
    source.frequency.value = pitch
    envelope.gain.setValueAtTime(0.0001, when)
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.001, loudness),
      when + 0.025,
    )
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration)
    source.connect(envelope)
    envelope.connect(bus)
    source.start(when)
    source.stop(when + duration + 0.02)
  }

  function soundtrack() {
    if (!context || context.state !== 'running') return
    const current = root.dataset.realm || 'jackpot'
    if (current !== realm) {
      realm = current
      step = 0
      nextTime = context.currentTime + 0.08
    }
    syncTrack()
    const sampled = activeTrack === scoreKey()
    const theme = worlds[realm] || worlds.jackpot
    const beat = 30 / theme.bpm
    if (nextTime < context.currentTime - 0.5) {
      nextTime = context.currentTime + 0.04
    }
    while (nextTime < context.currentTime + 0.22) {
      const slot = step % theme.melody.length
      if (settings.music && !document.hidden && !ended && !sampled) {
        const note = theme.melody[slot]
        if (note !== null) {
          voice(frequency(note), nextTime, beat * 0.82, theme.wave, musicBus)
        }
        if (slot % 4 === 0) {
          const bass = theme.bass[Math.floor(slot / 4)]
          voice(
            frequency(bass),
            nextTime,
            beat * 2.7,
            'triangle',
            musicBus,
            0.13,
          )
        }
      }
      step++
      nextTime += beat
    }
  }

  function createAudio() {
    if (context) return context
    const Context = window.AudioContext || window.webkitAudioContext
    if (!Context) return null
    try {
      context = new Context()
      master = context.createGain()
      musicBus = context.createGain()
      effectsBus = context.createGain()
      master.gain.value = 0.55
      musicBus.connect(master)
      effectsBus.connect(master)
      master.connect(context.destination)
      updateVolume()
      nextTime = context.currentTime + 0.08
      return context
    } catch {
      context = null
      return null
    }
  }

  function gesture() {
    const audio = createAudio()
    if (!audio) return
    audio.resume()?.catch?.(() => {})
    if (timer === null) timer = setInterval(soundtrack, 115)
    syncTrack()
    soundtrack()
  }

  function cue(kind, pitch) {
    if (!context || !settings.sound || context.state !== 'running') return
    const notes = cues[kind]
    if (!notes) return
    const start = context.currentTime + 0.01
    const base = Number.isFinite(pitch) && pitch > 0 ? pitch : null
    notes.forEach((frequencyHz, index) => {
      voice(
        base ? base * 2 ** (index / 8) : frequencyHz,
        start + index * 0.065,
        kind === 'mine' || kind === 'blade' ? 0.25 : 0.15,
        kind === 'mine' || kind === 'damage' ? 'sawtooth' : 'triangle',
        effectsBus,
        0.19,
      )
    })
  }

  window.addEventListener('chessweeper:settings', (event) => {
    const next = event.detail || {}
    settings.sound = next.sound !== false
    settings.music = next.music !== false
    settings.musicVolume = level(next.musicVolume, 0.32)
    settings.effectsVolume = level(next.effectsVolume, 0.58)
    updateVolume()
    if (settings.music) syncTrack()
  })
  window.addEventListener('chessweeper:fx', (event) => {
    cue(event.detail?.kind)
  })
  window.addEventListener('chessweeper:sound', (event) => {
    cue(event.detail?.kind || 'achievement', event.detail?.frequency)
  })
  window.addEventListener('chessweeper:end', () => {
    ended = true
    retireTrack()
  })
  window.addEventListener('chessweeper:state', () => {
    const game = window.__fusionTest?.get?.()
    if (game && !game.over) {
      ended = false
      if (context) syncTrack()
    }
  })
  document.addEventListener('pointerdown', gesture, { passive: true })
  document.addEventListener('keydown', gesture)
  document.addEventListener('visibilitychange', () => {
    if (!context) return
    if (document.hidden) context.suspend()?.catch?.(() => {})
    else {
      context.resume()?.catch?.(() => {})
      nextTime = context.currentTime + 0.08
    }
  })
  window.addEventListener('pagehide', () => {
    if (timer !== null) clearInterval(timer)
    timer = null
    retireTrack()
    context?.close()?.catch?.(() => {})
    context = null
  })
})()
