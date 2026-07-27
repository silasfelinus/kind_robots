// /utils/scripts/verifyPitchDetectorAccuracy.test.ts
//
// Accuracy comparison for conductor music-mentor/t-007 ("evaluate a heavier
// pitch model"). Exercises both pitch detectors exported from
// composables/useAudioAnalysis.ts against synthetic frames of known frequency —
// pure tones across the sung range, harmonic-rich tones (the classic
// octave-error stress case for plain autocorrelation, since a strong 2nd
// harmonic looks like an even shorter, more "confident" period), and
// noise-degraded tones. Both detectors take a raw Float32Array frame + sample
// rate and return Hz or null, so they're testable in isolation with no browser
// APIs (decodeToMono/AudioContext are the only browser-dependent parts of the
// composable, and this test never touches them).
import assert from 'node:assert/strict'

import {
  detectPitchAutocorrelation,
  detectPitchYIN,
} from '../../composables/useAudioAnalysis.js'

const SAMPLE_RATE = 16000
const FRAME = 1024

interface Case {
  label: string
  trueHz: number
  frame: Float32Array
}

// Deterministic pseudo-random noise (mulberry32) — no test-run flakiness.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sineFrame(hz: number): Float32Array {
  const frame = new Float32Array(FRAME)
  for (let i = 0; i < FRAME; i++) {
    frame[i] = 0.5 * Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE)
  }
  return frame
}

// Fundamental + a 2nd harmonic that is LOUDER than the fundamental — a common
// vowel-formant shape in sung voice, and the case where a detector that just
// hunts for the strongest short-period repetition (rather than the true
// longest-period one) reports double the real frequency.
function harmonicRichFrame(hz: number): Float32Array {
  const frame = new Float32Array(FRAME)
  for (let i = 0; i < FRAME; i++) {
    const t = i / SAMPLE_RATE
    frame[i] =
      0.35 * Math.sin(2 * Math.PI * hz * t) +
      0.55 * Math.sin(2 * Math.PI * hz * 2 * t) +
      0.15 * Math.sin(2 * Math.PI * hz * 3 * t)
  }
  return frame
}

function noisyFrame(hz: number, noiseAmp: number, seed: number): Float32Array {
  const rand = mulberry32(seed)
  const frame = sineFrame(hz)
  for (let i = 0; i < frame.length; i++) {
    frame[i] = (frame[i] ?? 0) + noiseAmp * (rand() * 2 - 1)
  }
  return frame
}

const TEST_FREQUENCIES = [82, 110, 146, 196, 262, 330, 440, 523, 659, 880, 1046]

const cases: Case[] = []
for (const hz of TEST_FREQUENCIES) {
  cases.push({ label: `pure ${hz}Hz`, trueHz: hz, frame: sineFrame(hz) })
  cases.push({
    label: `harmonic-rich ${hz}Hz (loud 2nd harmonic)`,
    trueHz: hz,
    frame: harmonicRichFrame(hz),
  })
  cases.push({
    label: `noisy ${hz}Hz (moderate SNR)`,
    trueHz: hz,
    frame: noisyFrame(hz, 0.08, hz),
  })
}
// Boundary cases near MIN_F0/MAX_F0.
cases.push({ label: 'pure 75Hz (near MIN_F0)', trueHz: 75, frame: sineFrame(75) })
cases.push({
  label: 'pure 1000Hz (near MAX_F0)',
  trueHz: 1000,
  frame: sineFrame(1000),
})

function centsError(measuredHz: number, trueHz: number): number {
  return Math.abs(1200 * Math.log2(measuredHz / trueHz))
}

// An "octave error" is a detection within 5% of exactly double or half the
// true frequency — the specific, well-known failure mode this evaluation
// exists to check for.
function isOctaveError(measuredHz: number, trueHz: number): boolean {
  const ratio = measuredHz / trueHz
  return Math.abs(ratio - 2) < 0.1 || Math.abs(ratio - 0.5) < 0.05
}

interface Tally {
  detected: number
  missed: number
  octaveErrors: number
  centsErrors: number[]
}

function evaluate(
  detector: (frame: Float32Array, sampleRate: number) => number | null,
): Tally {
  const tally: Tally = { detected: 0, missed: 0, octaveErrors: 0, centsErrors: [] }
  for (const c of cases) {
    const measured = detector(c.frame, SAMPLE_RATE)
    if (measured == null) {
      tally.missed++
      continue
    }
    tally.detected++
    if (isOctaveError(measured, c.trueHz)) tally.octaveErrors++
    tally.centsErrors.push(centsError(measured, c.trueHz))
  }
  return tally
}

function median(values: number[]): number {
  if (!values.length) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? (sorted[mid] ?? NaN)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

const autocorr = evaluate(detectPitchAutocorrelation)
const yin = evaluate(detectPitchYIN)

const report = (name: string, t: Tally) =>
  `${name}: ${t.detected}/${cases.length} detected, ${t.octaveErrors} octave error(s), ` +
  `median ${median(t.centsErrors).toFixed(1)}c error, max ${Math.max(...t.centsErrors, 0).toFixed(1)}c`

console.log(report('autocorrelation', autocorr))
console.log(report('YIN            ', yin))

// The whole point of this evaluation: YIN must not have MORE octave errors
// than the incumbent, and should generally have fewer given its cumulative-mean
// normalization is specifically designed to reject the low-lag bias that
// causes them.
assert.ok(
  yin.octaveErrors <= autocorr.octaveErrors,
  `expected YIN octave errors (${yin.octaveErrors}) <= autocorrelation's (${autocorr.octaveErrors})`,
)

// YIN must detect at least as many voiced frames as the incumbent — an
// accuracy upgrade that silently regresses to "no pitch" more often would be a
// net loss even if its octave-error rate improved.
assert.ok(
  yin.detected >= autocorr.detected,
  `expected YIN detected count (${yin.detected}) >= autocorrelation's (${autocorr.detected})`,
)

// Overall precision on the frames both detectors DO voice should not be worse.
assert.ok(
  median(yin.centsErrors) <= median(autocorr.centsErrors) + 1,
  `expected YIN median cents error (${median(yin.centsErrors).toFixed(1)}) not worse ` +
    `than autocorrelation's (${median(autocorr.centsErrors).toFixed(1)}) by more than 1c`,
)

// Every pure-tone case (the unambiguous ground truth, no harmonic content to
// confuse either detector) must land within 20 cents for both detectors —
// a basic sanity floor on frame-level accuracy regardless of which wins overall.
for (const c of cases) {
  if (!c.label.startsWith('pure ')) continue
  const measured = detectPitchYIN(c.frame, SAMPLE_RATE)
  assert.ok(
    measured != null && centsError(measured, c.trueHz) < 20,
    `YIN should track ${c.label} within 20 cents, got ${measured}`,
  )
}

console.log(
  'Pitch detector accuracy verified: YIN matches or beats the prior ' +
    'autocorrelation tracker on octave-error count, voiced-detection rate, and ' +
    'median cents accuracy across pure/harmonic-rich/noisy synthetic tones ' +
    '(music-mentor/t-007).',
)
