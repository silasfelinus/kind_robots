// /composables/useAudioAnalysis.ts
//
// Client-side audio feature extraction for the Music Mentor page. Accepts audio
// or video files (the audio track is pulled out of mp4/mov, so an iPhone video
// recording works without converting first). Runs entirely in the browser via
// the Web Audio API — the raw audio never leaves the device; only the compact
// numeric summary this returns is sent to the server for the LLM to reason over.
// Deliberately dependency-free (a hand-rolled autocorrelation pitch tracker):
// good for monophonic vocal takes, and honestly flagged as less reliable on
// mixed/polyphonic material. A heavier pitch model can later slot in behind this
// same AudioFeatureSummary shape (see conductor music-mentor/t-007).

export interface FeatureSegment {
  startSec: number
  endSec: number
  relativeLoudness: 'soft' | 'medium' | 'loud'
}

export interface AudioFeatureSummary {
  durationSec: number
  analyzedSampleRate: number
  pitch: {
    voicedPercent: number
    medianPitchHz: number | null
    medianNoteName: string | null
    meanAbsCentsOff: number | null
    pitchJitterCents: number | null
    estimatedKey: string | null
    vibratoRateHz: number | null
    rangeSemitones: number | null
  }
  timing: {
    estimatedTempoBpm: number | null
    tempoStability: number | null
    onsetCount: number
    rushDragTrend: 'steady' | 'rushing' | 'dragging' | null
  }
  dynamics: {
    loudnessRangeDb: number | null
    dynamicContrastDb: number | null
    overallTrend: 'steady' | 'building' | 'fading' | null
    clippingSuspected: boolean
  }
  structure: {
    approxSectionCount: number | null
    segments: FeatureSegment[]
  }
  notes: string[]
}

const TARGET_RATE = 16000
const FRAME = 1024
const MIN_F0 = 70 // Hz — below this we treat a frame as unvoiced
const MAX_F0 = 1100 // Hz — top of a comfortable sung range
const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]

// Krumhansl–Schmuckler key profiles (major / minor), used to guess a key from
// the pitch-class distribution of the voiced frames.
const MAJOR_PROFILE = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
]
const MINOR_PROFILE = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
]

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    AudioContext?: typeof AudioContext
    webkitAudioContext?: typeof AudioContext
  }
  return w.AudioContext || w.webkitAudioContext || null
}

function getOfflineCtor(): typeof OfflineAudioContext | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    OfflineAudioContext?: typeof OfflineAudioContext
    webkitOfflineAudioContext?: typeof OfflineAudioContext
  }
  return w.OfflineAudioContext || w.webkitOfflineAudioContext || null
}

// Decode any browser-supported media file, then downmix to mono and resample to
// TARGET_RATE using an OfflineAudioContext (handles anti-aliasing for us).
async function decodeToMono(file: File): Promise<Float32Array> {
  const Ctx = getAudioContextCtor()
  const Offline = getOfflineCtor()
  if (!Ctx || !Offline) {
    throw new Error('This browser does not support the Web Audio API.')
  }

  const arrayBuf = await file.arrayBuffer()
  const decodeCtx = new Ctx()
  let decoded: AudioBuffer
  try {
    // decodeAudioData pulls the audio track out of the container, so this works
    // for plain audio (mp3/m4a/wav/ogg) AND for video files (mp4/mov) — we never
    // touch the video, just its audio. Support varies by browser/codec, so a
    // decode failure gets a friendly, actionable message rather than a raw throw.
    decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0))
  } catch {
    throw new Error(
      'Could not read audio from this file. Most mp3/m4a/wav and iPhone mp4/mov recordings work; if this one does not, try a different browser (Safari/Chrome) or export an audio file (m4a/mp3).',
    )
  } finally {
    await decodeCtx.close()
  }

  const frames = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE))
  const offline = new Offline(1, frames, TARGET_RATE)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start()
  const rendered = await offline.startRendering()
  return rendered.getChannelData(0).slice()
}

function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440)
}

function noteNameFromMidi(midi: number): string {
  const rounded = Math.round(midi)
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12] ?? '?'
  const octave = Math.floor(rounded / 12) - 1
  return `${name}${octave}`
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((p / 100) * (sorted.length - 1))),
  )
  return sorted[idx] ?? 0
}

function mean(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)))
}

function autocorrAt(frame: Float32Array, lag: number): number {
  if (lag < 1 || lag >= frame.length) return 0
  let corr = 0
  for (let i = 0; i < frame.length - lag; i++) {
    corr += (frame[i] ?? 0) * (frame[i + lag] ?? 0)
  }
  return corr
}

// Normalized autocorrelation pitch detector for a single frame. Returns the
// fundamental in Hz, or null when the frame is too quiet or has no clear period.
function detectPitch(frame: Float32Array, sampleRate: number): number | null {
  let energy = 0
  for (const s of frame) energy += s * s
  const rms = Math.sqrt(energy / frame.length)
  if (rms < 0.01) return null // silence / unvoiced gate

  const minLag = Math.floor(sampleRate / MAX_F0)
  const maxLag = Math.min(frame.length - 1, Math.floor(sampleRate / MIN_F0))

  let bestLag = -1
  let bestCorr = 0
  let lastCorr = 0
  let ascending = false

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0
    for (let i = 0; i < frame.length - lag; i++) {
      corr += (frame[i] ?? 0) * (frame[i + lag] ?? 0)
    }
    // Only consider peaks that come after the correlation first starts rising —
    // avoids latching onto the zero-lag shoulder and halving/doubling errors.
    if (!ascending && corr > lastCorr) ascending = true
    if (ascending && corr > bestCorr) {
      bestCorr = corr
      bestLag = lag
    }
    lastCorr = corr
  }

  if (bestLag < 0 || energy <= 0 || bestCorr / energy < 0.5) return null

  // Parabolic interpolation around the peak for sub-sample precision.
  const y0 = autocorrAt(frame, bestLag - 1)
  const y1 = bestCorr
  const y2 = autocorrAt(frame, bestLag + 1)
  const denom = 2 * (2 * y1 - y0 - y2)
  const shift = denom !== 0 ? (y2 - y0) / denom : 0
  const refinedLag = bestLag + shift

  const f0 = sampleRate / refinedLag
  return f0 >= MIN_F0 && f0 <= MAX_F0 ? f0 : null
}

function estimateKey(pitchClassWeights: number[]): string | null {
  const total = pitchClassWeights.reduce((s, v) => s + v, 0)
  if (total <= 0) return null

  const modes: ReadonlyArray<readonly [string, number[]]> = [
    ['major', MAJOR_PROFILE],
    ['minor', MINOR_PROFILE],
  ]

  let best: { score: number; tonic: number; mode: string } | null = null
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const [mode, profile] of modes) {
      let score = 0
      for (let pc = 0; pc < 12; pc++) {
        score +=
          (pitchClassWeights[pc] ?? 0) * (profile[(pc - tonic + 12) % 12] ?? 0)
      }
      if (!best || score > best.score) best = { score, tonic, mode }
    }
  }

  if (!best) return null
  return `${NOTE_NAMES[best.tonic] ?? '?'} ${best.mode}`
}

// Estimate tempo (BPM) from the onset-strength envelope via autocorrelation over
// a plausible tempo band. Returns null when no periodicity stands out.
function estimateTempo(onsetEnv: number[], hopSec: number): number | null {
  if (onsetEnv.length < 8 || hopSec <= 0) return null
  const minBpm = 50
  const maxBpm = 200
  const minLag = Math.max(1, Math.floor(60 / maxBpm / hopSec))
  const maxLag = Math.min(onsetEnv.length - 1, Math.ceil(60 / minBpm / hopSec))

  let bestLag = -1
  let bestScore = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0
    for (let i = 0; i + lag < onsetEnv.length; i++) {
      score += (onsetEnv[i] ?? 0) * (onsetEnv[i + lag] ?? 0)
    }
    if (score > bestScore) {
      bestScore = score
      bestLag = lag
    }
  }
  if (bestLag < 1 || bestScore <= 0) return null
  return Math.round(60 / (bestLag * hopSec))
}

async function yieldToUi(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Extract a compact, LLM-friendly feature summary from an audio OR video file
 * (the audio track is decoded out of mp4/mov containers), fully in the browser.
 * Yields periodically so the page stays responsive while a longer clip is
 * analyzed.
 */
export async function analyzeAudioFile(
  file: File,
): Promise<AudioFeatureSummary> {
  const samples = await decodeToMono(file)
  const durationSec = samples.length / TARGET_RATE
  const notes: string[] = []

  // Adaptive hop: keep the total frame count bounded (~3000) so a long medley
  // still analyzes in a couple of seconds without freezing the tab.
  const rawHop = Math.floor(FRAME / 2)
  const maxFrames = 3000
  const naturalFrames = Math.floor((samples.length - FRAME) / rawHop)
  const hop =
    naturalFrames > maxFrames
      ? Math.ceil((samples.length - FRAME) / maxFrames)
      : rawHop
  const hopSec = hop / TARGET_RATE

  const pitchesHz: number[] = []
  const voicedMidi: number[] = []
  const pitchClassWeights = new Array<number>(12).fill(0)
  const frameDb: number[] = []
  const onsetEnv: number[] = []
  let voicedFrames = 0
  let totalFrames = 0
  let prevEnergy = 0
  let clippingSuspected = false

  for (let start = 0; start + FRAME <= samples.length; start += hop) {
    const frame = samples.subarray(start, start + FRAME)

    // Dynamics: frame RMS in dBFS.
    let sumSq = 0
    let peak = 0
    for (const s of frame) {
      sumSq += s * s
      const a = Math.abs(s)
      if (a > peak) peak = a
    }
    if (peak >= 0.999) clippingSuspected = true
    const rms = Math.sqrt(sumSq / frame.length)
    const db = 20 * Math.log10(Math.max(rms, 1e-6))
    frameDb.push(db)

    // Onset strength: positive change in energy (half-wave rectified flux).
    onsetEnv.push(Math.max(0, rms - prevEnergy))
    prevEnergy = rms

    // Pitch.
    const f0 = detectPitch(frame, TARGET_RATE)
    totalFrames++
    if (f0 != null) {
      voicedFrames++
      pitchesHz.push(f0)
      const midi = hzToMidi(f0)
      voicedMidi.push(midi)
      const pc = ((Math.round(midi) % 12) + 12) % 12
      pitchClassWeights[pc] = (pitchClassWeights[pc] ?? 0) + 1
    }

    if (totalFrames % 200 === 0) await yieldToUi()
  }

  // ---- Pitch summary ----
  const voicedPercent = totalFrames
    ? Math.round((voicedFrames / totalFrames) * 1000) / 10
    : 0
  const medianPitchHz = median(pitchesHz)
  const medianNoteName =
    medianPitchHz != null ? noteNameFromMidi(hzToMidi(medianPitchHz)) : null

  // Intonation: average absolute distance (cents) from the nearest semitone.
  let meanAbsCentsOff: number | null = null
  if (voicedMidi.length) {
    const centsOff = voicedMidi.map((m) => Math.abs(m - Math.round(m)) * 100)
    meanAbsCentsOff = Math.round(mean(centsOff))
  }
  // Jitter: median frame-to-frame pitch wobble within voiced regions (cents).
  let pitchJitterCents: number | null = null
  if (voicedMidi.length > 2) {
    const diffs: number[] = []
    for (let i = 1; i < voicedMidi.length; i++) {
      diffs.push(
        Math.abs((voicedMidi[i] ?? 0) - (voicedMidi[i - 1] ?? 0)) * 100,
      )
    }
    pitchJitterCents = Math.round(median(diffs) ?? 0)
  }
  const rangeSemitones =
    voicedMidi.length > 1
      ? Math.round(Math.max(...voicedMidi) - Math.min(...voicedMidi))
      : null
  const estimatedKey = estimateKey(pitchClassWeights)

  // Vibrato: rate of oscillation of the pitch contour in voiced spans. Count
  // direction changes of the frame-differenced pitch track per second.
  let vibratoRateHz: number | null = null
  if (voicedMidi.length > 8 && hopSec > 0) {
    let signChanges = 0
    let prevDir = 0
    for (let i = 1; i < voicedMidi.length; i++) {
      const d = (voicedMidi[i] ?? 0) - (voicedMidi[i - 1] ?? 0)
      const dir = d > 0 ? 1 : d < 0 ? -1 : prevDir
      if (dir !== 0 && prevDir !== 0 && dir !== prevDir) signChanges++
      if (dir !== 0) prevDir = dir
    }
    const voicedDurSec = voicedMidi.length * hopSec
    // Each vibrato cycle produces two direction changes.
    if (voicedDurSec > 0) {
      const rate = signChanges / 2 / voicedDurSec
      vibratoRateHz = rate >= 3 && rate <= 9 ? Math.round(rate * 10) / 10 : null
    }
  }

  // ---- Timing summary ----
  const positiveOnsets = onsetEnv.filter((v) => v > 0)
  const onsetThreshold = mean(onsetEnv) + 1.2 * stdDev(positiveOnsets)
  const onsetTimes: number[] = []
  for (let i = 1; i < onsetEnv.length - 1; i++) {
    const cur = onsetEnv[i] ?? 0
    if (
      cur > onsetThreshold &&
      cur >= (onsetEnv[i - 1] ?? 0) &&
      cur > (onsetEnv[i + 1] ?? 0)
    ) {
      onsetTimes.push(i * hopSec)
    }
  }
  const estimatedTempoBpm = estimateTempo(onsetEnv, hopSec)

  let tempoStability: number | null = null
  let rushDragTrend: 'steady' | 'rushing' | 'dragging' | null = null
  if (onsetTimes.length > 3) {
    const iois: number[] = []
    for (let i = 1; i < onsetTimes.length; i++) {
      iois.push((onsetTimes[i] ?? 0) - (onsetTimes[i - 1] ?? 0))
    }
    const ioiMean = mean(iois)
    if (ioiMean > 0) {
      const cv = stdDev(iois) / ioiMean
      tempoStability = Math.max(
        0,
        Math.min(1, Math.round((1 - cv) * 100) / 100),
      )
      // Trend: are the later gaps shorter (rushing) or longer (dragging)?
      const half = Math.floor(iois.length / 2)
      const drift =
        (mean(iois.slice(half)) - mean(iois.slice(0, half))) / ioiMean
      rushDragTrend =
        drift < -0.08 ? 'rushing' : drift > 0.08 ? 'dragging' : 'steady'
    }
  }

  // ---- Dynamics summary ----
  let loudnessRangeDb: number | null = null
  let dynamicContrastDb: number | null = null
  let overallTrend: 'steady' | 'building' | 'fading' | null = null
  const audibleDb = frameDb.filter((d) => d > -60)
  if (audibleDb.length) {
    const sorted = [...audibleDb].sort((a, b) => a - b)
    loudnessRangeDb = Math.round(percentile(sorted, 95) - percentile(sorted, 5))
    dynamicContrastDb = Math.round(stdDev(audibleDb) * 10) / 10
    const half = Math.floor(frameDb.length / 2)
    const delta = mean(frameDb.slice(half)) - mean(frameDb.slice(0, half))
    overallTrend = delta > 2 ? 'building' : delta < -2 ? 'fading' : 'steady'
  }

  // ---- Structure summary ----
  const segments = segmentByLoudness(frameDb, hopSec)
  const approxSectionCount = segments.length || null

  // ---- Honest caveats ----
  if (voicedPercent < 40) {
    notes.push(
      'Less than half the take registered a clear pitch — likely quiet, breathy, heavily mixed, or instrumental passages, so pitch stats are approximate.',
    )
  }
  if (clippingSuspected) {
    notes.push(
      'The recording appears to clip (peaks at full scale); loudness range and tone may be affected by distortion.',
    )
  }
  if (durationSec < 5) {
    notes.push('Short clip — tempo and structure estimates are rough.')
  }
  notes.push(
    'Pitch is tracked monophonically; on full-mix or polyphonic audio the intonation and key estimates are less reliable than on an isolated vocal.',
  )

  return {
    durationSec: Math.round(durationSec * 10) / 10,
    analyzedSampleRate: TARGET_RATE,
    pitch: {
      voicedPercent,
      medianPitchHz: medianPitchHz != null ? Math.round(medianPitchHz) : null,
      medianNoteName,
      meanAbsCentsOff,
      pitchJitterCents,
      estimatedKey,
      vibratoRateHz,
      rangeSemitones,
    },
    timing: {
      estimatedTempoBpm,
      tempoStability,
      onsetCount: onsetTimes.length,
      rushDragTrend,
    },
    dynamics: {
      loudnessRangeDb,
      dynamicContrastDb,
      overallTrend,
      clippingSuspected,
    },
    structure: {
      approxSectionCount,
      segments,
    },
    notes,
  }
}

// Segment the take into coarse sections by sustained loudness level. Smooths the
// dB envelope over ~1.5s, then splits where the level shifts by >6 dB and holds
// for at least ~3s. Returns segments tagged soft/medium/loud.
function segmentByLoudness(
  frameDb: number[],
  hopSec: number,
): FeatureSegment[] {
  if (!frameDb.length || hopSec <= 0) return []

  const smoothWin = Math.max(1, Math.round(1.5 / hopSec))
  const smoothed: number[] = []
  for (let i = 0; i < frameDb.length; i++) {
    const from = Math.max(0, i - smoothWin)
    const to = Math.min(frameDb.length, i + smoothWin + 1)
    smoothed.push(mean(frameDb.slice(from, to)))
  }

  const minSegFrames = Math.max(1, Math.round(3 / hopSec))
  const changeDb = 6
  const boundaries: number[] = [0]
  let anchor = smoothed[0] ?? 0
  let lastBoundary = 0
  for (let i = 1; i < smoothed.length; i++) {
    const level = smoothed[i] ?? 0
    if (
      Math.abs(level - anchor) > changeDb &&
      i - lastBoundary >= minSegFrames
    ) {
      boundaries.push(i)
      lastBoundary = i
      anchor = level
    }
  }
  boundaries.push(smoothed.length)

  const audible = smoothed.filter((d) => d > -60)
  const sortedAudible = [...audible].sort((a, b) => a - b)
  const lowCut = percentile(sortedAudible, 33)
  const highCut = percentile(sortedAudible, 66)

  const segments: FeatureSegment[] = []
  for (let b = 0; b < boundaries.length - 1; b++) {
    const startIdx = boundaries[b] ?? 0
    const endIdx = boundaries[b + 1] ?? 0
    if (endIdx <= startIdx) continue
    const level = mean(smoothed.slice(startIdx, endIdx))
    const relativeLoudness =
      level <= lowCut ? 'soft' : level >= highCut ? 'loud' : 'medium'
    segments.push({
      startSec: Math.round(startIdx * hopSec * 10) / 10,
      endSec: Math.round(endIdx * hopSec * 10) / 10,
      relativeLoudness,
    })
  }
  return segments
}
