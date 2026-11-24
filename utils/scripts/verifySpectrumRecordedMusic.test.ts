import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseLoop } from '../arcade/sound'
import {
  SPECTRUM_THEMES,
  SPECTRUM_BOSS_MUSIC,
  SPECTRUM_CLASSIC_MUSIC,
  SPECTRUM_MENU_MUSIC,
} from '../arcade/superkateSpectrum/music'

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
  assert.ok(Math.abs(count / rate - parsed.length * parsed.stepDur * repeats) < 0.001)
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
  assert.equal(wav.readInt16LE(44), 0)
  assert.equal(wav.readInt16LE(wav.length - 2), 0)
}
for (const theme of SPECTRUM_THEMES) {
  assert.equal(parseLoop(theme).length, 32)
  const lead = theme.tracks[0]!.steps.split(/\s+/)
  assert.notDeepEqual(lead.slice(0, 16), lead.slice(16))
}
console.log('Spectrum: 14 distinct recorded music masters passed')
