import assert from 'node:assert/strict'
import {
  ENEMY_ANIMATIONS,
  bossAnimation,
} from '../arcade/games/savePlumberAnimations'
import {
  PLUMBER_ENEMIES,
  PLUMBER_WORLDS,
} from '../arcade/games/savePlumberWorlds'

assert.equal(PLUMBER_ENEMIES.length, 14)
assert.equal(new Set(PLUMBER_ENEMIES.map((e) => e.key)).size, 14)

for (const enemy of PLUMBER_ENEMIES) {
  const anim = ENEMY_ANIMATIONS[enemy.key]
  assert.ok(anim, `${enemy.key} has a painted animation`)
  assert.match(
    anim.src,
    /^\/images\/arcade\/save-the-plumber\/anim\/[a-z0-9-]+\.webp$/,
  )
  assert.equal(
    anim.still,
    `/images/arcade/save-the-plumber/enemies/${enemy.key}.webp`,
  )
  assert.ok(anim.loop.length >= 2, `${enemy.key} loops at least two poses`)
  assert.ok(anim.act.length >= 1)
  for (const pose of [...anim.loop, ...anim.act])
    assert.ok(Number.isInteger(pose) && pose >= 0 && pose < anim.frames)
}

const bosses = PLUMBER_WORLDS.map((w) => bossAnimation(w.boss.name))
assert.equal(new Set(bosses.map((b) => b.src)).size, PLUMBER_WORLDS.length)
assert.equal(
  bossAnimation('The Overripe Baron').src,
  '/images/arcade/save-the-plumber/anim/overripe-baron-attack.webp',
)
assert.equal(
  bossAnimation('Madame Pressure').still,
  '/images/arcade/save-the-plumber/bosses/madame-pressure-idle.webp',
)
for (const boss of bosses)
  for (const pose of [...boss.loop, ...boss.act])
    assert.ok(pose >= 0 && pose < boss.frames)

console.log('save the plumber animations: ok')
