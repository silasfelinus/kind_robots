import assert from 'node:assert/strict'
import {
  RAIN_GARDENS,
  rainWaveForLevel,
  weatherForVolley,
} from '../arcade/rainCatcher/waves'
import { RAIN_CATCHER_MUSIC } from '../arcade/rainCatcher/music'
import { parseLoop } from '../arcade/sound'

assert.equal(RAIN_GARDENS.length, 6)
const weather = new Set<string>()
for (let wave = 1; wave <= 30; wave++) {
  const profile = rainWaveForLevel(wave)
  assert.equal(profile.number, wave)
  assert.ok(RAIN_GARDENS.some((garden) => garden === profile.garden))
  assert.ok(profile.rainShare > 0 && profile.rainShare < 0.5)
  assert.ok(profile.hailCount >= 10 && profile.hailCount <= 40)
  assert.ok(profile.skyBand >= 0 && profile.skyBand < 6)
  assert.ok(profile.par > 0)
  assert.equal(profile.localWave, ((wave - 1) % 5) + 1)
  for (let shot = 0; shot < 45; shot++) {
    const kind = weatherForVolley(profile, shot)
    weather.add(kind)
    assert.equal(kind, weatherForVolley(profile, shot))
    assert.ok(profile.threatMix.includes(kind))
  }
}
assert.deepEqual([...weather].sort(), [
  'hail',
  'moth',
  'rain',
  'sleet',
  'snowball',
])
assert.equal(rainWaveForLevel(31).garden, RAIN_GARDENS[0])
assert.equal(rainWaveForLevel(1).wind, 0)
const music = parseLoop(RAIN_CATCHER_MUSIC)
assert.equal(music.length, 16, 'loop spans two bars')
assert.ok(music.notes.some((note) => note.steps > 1))
assert.ok(music.notes.some((note) => note.noise))
console.log('Rain Catcher: 30 authored forecasts and original loop')

