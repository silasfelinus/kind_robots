import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (name: string) =>
  readFileSync(new URL('../../components/' + name, import.meta.url), 'utf8')

const armor = read('slime-city-armor-stat.vue')
assert.match(armor, /<svg viewBox="0 0 24 26"/)
assert.match(armor, /v-if="armor \+ guard > 0"/)
assert.match(armor, /\{\{ armor \+ guard \}\}/)
assert.doesNotMatch(armor, /🛡/)

for (const [file, defense] of [
  ['slime-city-clash.vue', 'clash-defense'],
  ['slime-city-pvp-game.vue', 'scpvp-defense'],
]) {
  const source = read(file!)
  assert.match(
    source,
    new RegExp(
      'class="' + defense + '"[\\s\\S]*?is-life[\\s\\S]*?<SlimeCityArmorStat',
    ),
  )
  assert.match(source, /:armor="unit\(side, lane\)!\.armor"/)
  assert.match(source, /:guard="unit\(side, lane\)!\.guard"/)
  assert.doesNotMatch(source, /🛡/)
}
console.log('Slime City armor overlay contract passed')
