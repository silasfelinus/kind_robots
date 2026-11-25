import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseLoop } from '../arcade/sound'
import {
  SPECTRUM_THEMES,
  SPECTRUM_BOSS_MUSIC,
  SPECTRUM_CLASSIC_MUSIC,
  SPECTRUM_MENU_MUSIC,
} from '../arcade/superkateSpectrum/music'

/** Every master's RMS, for the music/effects balance check below. */
const masterRms: number[] = []

const loops = [
  ...SPECTRUM_THEMES,
  ...SPECTRUM_BOSS_MUSIC,
  SPECTRUM_CLASSIC_MUSIC,
  SPECTRUM_MENU_MUSIC,
]
assert.equal(loops.length, 14)
assert.equal(new Set(loops.map((loop) => loop.recorded?.src)).size, 14)
for (const loop of loops) {
  assert.ok(loop.recorded)
  const wav = readFileSync(`public${loop.recorded.src}`)
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF')
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE')
  assert.equal(wav.readUInt32LE(4), wav.length - 8)
  assert.equal(wav.readUInt16LE(20), 1)
  assert.equal(wav.readUInt16LE(22), 1)
  assert.equal(wav.readUInt16LE(34), 16)
  assert.equal(wav.readUInt32LE(40), wav.length - 44)
  const rate = wav.readUInt32LE(24)
  const count = (wav.length - 44) / 2
  const parsed = parseLoop(loop)
  const repeats = parsed.length < 32 ? 2 : 1
  assert.ok(
    Math.abs(count / rate - parsed.length * parsed.stepDur * repeats) < 0.001,
  )
  let peak = 0
  let square = 0
  for (let i = 0; i < count; i++) {
    const value = wav.readInt16LE(44 + i * 2) / 32767
    peak = Math.max(peak, Math.abs(value))
    square += value * value
  }
  assert.ok(peak > 0.02 && peak <= 0.55)
  const rms = Math.sqrt(square / count)
  assert.ok(rms >= 0.02 && rms <= 0.15)
  masterRms.push(rms)
  assert.equal(wav.readInt16LE(44), 0)
  assert.equal(wav.readInt16LE(wav.length - 2), 0)
}
for (const theme of SPECTRUM_THEMES) {
  assert.equal(parseLoop(theme).length, 32)
  const lead = theme.tracks[0]!.steps.split(/\s+/)
  assert.notDeepEqual(lead.slice(0, 16), lead.slice(16))
}
console.log('Spectrum: 14 distinct recorded music masters passed')

// Music/effects balance (t-182): at default levels every effect Spectrum plays lands between half and
// four times the recorded music's RMS, so pops read over the music without blasting it. Mixed levels
// (MUSIC/EFFECTS LEVEL) only scale from here; real-speaker listening stays a human playtest item.
{
  const { presetPeak } = await import('../arcade/sound')
  const { arcadeAudioTheme } = await import('../arcade/soundtrackBriefs')
  const theme = arcadeAudioTheme('superkate-spectrum')
  assert.ok(masterRms.length >= 14, 'every master was measured')
  const quiet = Math.min(...masterRms) * theme.music
  const loud = Math.max(...masterRms) * theme.music
  for (const name of [
    'shoot',
    'pop',
    'boom',
    'level',
    'die',
    'blip',
  ] as const) {
    const peak = presetPeak(name) * theme.sfx
    assert.ok(
      peak >= 0.5 * loud,
      `${name} (${peak}) is audible over the loudest master (RMS ${loud.toFixed(3)})`,
    )
    assert.ok(
      peak <= 4 * quiet,
      `${name} (${peak}) does not blast over the quietest master (RMS ${quiet.toFixed(3)})`,
    )
  }
  console.log(
    `Spectrum balance: music RMS ${quiet.toFixed(3)}-${loud.toFixed(3)} after theme, effects peak ${['shoot', 'pop', 'boom', 'level', 'die', 'blip'].map((n) => presetPeak(n as 'pop').toFixed(2)).join('/')}`,
  )
}
