import { detectPitchYIN } from './audioAnalysisHelper'
import {
  parsePinyinToneTargets,
  type MandarinToneNumber,
} from '@/utils/mandarinPronunciation'

export type ObservedToneShape =
  | 'level'
  | 'rising'
  | 'falling'
  | 'dipping'
  | 'mixed'
  | 'unvoiced'

export type MandarinToneObservation = {
  syllable: string
  expectedTone: MandarinToneNumber
  expectedLabel: string
  expectedArrow: string
  observedShape: ObservedToneShape
  verdict: 'good' | 'practice' | 'uncertain'
  feedback: string
}

export type MandarinToneAnalysis = {
  durationSec: number
  voicedPercent: number
  observations: MandarinToneObservation[]
  note: string
}

type PitchPoint = {
  timeSec: number
  hz: number
}

const FRAME_SIZE = 1024
const HOP_SIZE = 256

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  const candidate = window as typeof window & {
    webkitAudioContext?: typeof AudioContext
  }
  return window.AudioContext || candidate.webkitAudioContext || null
}

async function decodeMono(file: File): Promise<{
  samples: Float32Array
  sampleRate: number
  durationSec: number
}> {
  const Ctx = getAudioContextCtor()
  if (!Ctx) throw new Error('This browser cannot analyze microphone pitch.')

  const context = new Ctx()
  try {
    const decoded = await context.decodeAudioData((await file.arrayBuffer()).slice(0))
    const samples = new Float32Array(decoded.length)

    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const data = decoded.getChannelData(channel)
      for (let index = 0; index < data.length; index++) {
        samples[index] =
          (samples[index] ?? 0) + (data[index] ?? 0) / decoded.numberOfChannels
      }
    }

    return {
      samples,
      sampleRate: decoded.sampleRate,
      durationSec: decoded.duration,
    }
  } catch {
    throw new Error('The recording could not be decoded for local tone analysis.')
  } finally {
    await context.close()
  }
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? (sorted[middle] ?? null)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}

function percentile(values: number[], fraction: number): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((sorted.length - 1) * fraction)),
  )
  return sorted[index] ?? null
}

function medianSlice(values: number[], from: number, to: number): number | null {
  if (!values.length) return null
  const start = Math.floor(values.length * from)
  const end = Math.max(start + 1, Math.ceil(values.length * to))
  return median(values.slice(start, end))
}

function classifyShape(points: PitchPoint[]): ObservedToneShape {
  if (points.length < 4) return 'unvoiced'
  const center = median(points.map((point) => point.hz))
  if (!center || center <= 0) return 'unvoiced'

  const semitones = points.map((point) => 12 * Math.log2(point.hz / center))
  const first = medianSlice(semitones, 0, 0.28)
  const middle = medianSlice(semitones, 0.36, 0.64)
  const last = medianSlice(semitones, 0.72, 1)
  const low = percentile(semitones, 0.1)
  const high = percentile(semitones, 0.9)

  if (
    first == null ||
    middle == null ||
    last == null ||
    low == null ||
    high == null
  ) {
    return 'unvoiced'
  }

  const delta = last - first
  const robustRange = high - low

  if (middle < first - 0.7 && middle < last - 0.7) return 'dipping'
  if (delta >= 1.0) return 'rising'
  if (delta <= -1.0) return 'falling'
  if (robustRange <= 1.6) return 'level'
  return 'mixed'
}

function feedbackForTone(
  tone: MandarinToneNumber,
  shape: ObservedToneShape,
): Pick<MandarinToneObservation, 'verdict' | 'feedback'> {
  if (shape === 'unvoiced') {
    return {
      verdict: 'uncertain',
      feedback: 'Not enough stable voiced pitch was detected for this syllable. Try a clean, natural repetition a little closer to the microphone.',
    }
  }

  if (tone === 5) {
    return {
      verdict: 'uncertain',
      feedback: 'Neutral tone is mainly about being short and light. This pitch-only check intentionally does not pretend to grade it.',
    }
  }

  if (tone === 1) {
    return shape === 'level'
      ? {
          verdict: 'good',
          feedback: 'The pitch stayed broadly level, which matches the first-tone target.',
        }
      : {
          verdict: 'practice',
          feedback: 'Aim for a steadier high pitch without a noticeable rise or drop.',
        }
  }

  if (tone === 2) {
    return shape === 'rising'
      ? {
          verdict: 'good',
          feedback: 'A clear rise was detected, matching the second-tone target.',
        }
      : {
          verdict: 'practice',
          feedback: 'Start comfortably low-to-mid and let the pitch climb through the syllable.',
        }
  }

  if (tone === 4) {
    return shape === 'falling'
      ? {
          verdict: 'good',
          feedback: 'A clear fall was detected, matching the fourth-tone target.',
        }
      : {
          verdict: 'practice',
          feedback: 'Start higher and make the drop decisive rather than level or rising.',
        }
  }

  // Third tone is context-sensitive: in connected speech it is frequently a
  // low "half third" rather than a theatrical full dip-and-rise. We only call
  // a visible dip a clear match; other shapes get guidance rather than a false
  // hard failure.
  if (shape === 'dipping') {
    return {
      verdict: 'good',
      feedback: 'A low dip was detected, which is a good isolated third-tone shape.',
    }
  }

  return {
    verdict: 'uncertain',
    feedback: 'Third tone often stays low in connected speech. Aim for a distinctly low center; a full rise is not always required.',
  }
}

export async function analyzeMandarinToneShapes(
  file: File,
  pinyin: string,
): Promise<MandarinToneAnalysis> {
  const targets = parsePinyinToneTargets(pinyin)
  const decoded = await decodeMono(file)
  const points: PitchPoint[] = []
  let totalFrames = 0

  for (
    let start = 0;
    start + FRAME_SIZE <= decoded.samples.length;
    start += HOP_SIZE
  ) {
    const frame = decoded.samples.subarray(start, start + FRAME_SIZE)
    const hz = detectPitchYIN(frame, decoded.sampleRate)
    totalFrames += 1
    if (hz != null) {
      points.push({
        timeSec: (start + FRAME_SIZE / 2) / decoded.sampleRate,
        hz,
      })
    }
  }

  const voicedPercent = totalFrames
    ? Math.round((points.length / totalFrames) * 1000) / 10
    : 0

  if (!targets.length || !points.length) {
    return {
      durationSec: decoded.durationSec,
      voicedPercent,
      observations: targets.map((target) => ({
        syllable: target.syllable,
        expectedTone: target.spokenTone,
        expectedLabel: target.label,
        expectedArrow: target.arrow,
        observedShape: 'unvoiced',
        verdict: 'uncertain',
        feedback: 'No stable pitch contour was available for comparison.',
      })),
      note: 'Tone analysis is a rough on-device pitch guide, not a phonetic exam score.',
    }
  }

  // Trim silence by using the first/last voiced frame, then divide that voiced
  // span among the known pinyin syllables. This is intentionally a lightweight
  // MVP heuristic; later forced alignment can replace it without changing the
  // UI contract.
  const firstTime = points[0]?.timeSec ?? 0
  const lastTime = points.at(-1)?.timeSec ?? decoded.durationSec
  const voicedSpan = Math.max(0.05, lastTime - firstTime)

  const observations = targets.map((target, index) => {
    const start = firstTime + (voicedSpan * index) / targets.length
    const end = firstTime + (voicedSpan * (index + 1)) / targets.length
    const segment = points.filter((point) => point.timeSec >= start && point.timeSec <= end)
    const observedShape = classifyShape(segment)
    const assessment = feedbackForTone(target.spokenTone, observedShape)

    return {
      syllable: target.syllable,
      expectedTone: target.spokenTone,
      expectedLabel: target.label,
      expectedArrow: target.arrow,
      observedShape,
      ...assessment,
    }
  })

  return {
    durationSec: decoded.durationSec,
    voicedPercent,
    observations,
    note: 'Tone analysis stays in your browser and compares broad pitch movement only. Consonants, vowels, rhythm, and native-like naturalness need separate pronunciation evidence.',
  }
}
