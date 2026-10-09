import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  BOSS_CARD,
  HOMESTEAD_CARDS,
  createHomestead,
  drawHomestead,
  resolveHomestead,
  confrontAbbess,
  isHomesteadState,
} from '../shiftingLands/homestead'

const a = createHomestead(99),
  b = createHomestead(99)
assert.deepEqual(a, b, 'seeded deck order must be reproducible')
assert.equal(a.deck.length, 3)
assert.equal(new Set(a.deck).size, 3)
assert.equal(HOMESTEAD_CARDS.length, 3)
assert.equal(BOSS_CARD.id, 'abbess')
assert.ok(
  HOMESTEAD_CARDS.every((c) => c.art.startsWith('/zuzu-gamebook/scenes/')),
)
let state = a
for (let i = 0; i < 3; i++) {
  const next = drawHomestead(state)
  assert.notEqual(next, state)
  assert.equal(
    drawHomestead(next),
    next,
    'cannot draw a second card while one is active',
  )
  assert.equal(next.revealed.includes(next.active!), true)
  state = resolveHomestead(next, 'help')
  assert.equal(state.active, null)
}
assert.equal(state.deck.length, 0)
assert.equal(state.discard.length, 3)
assert.equal(state.revealed.length, 3)
assert.ok(isHomesteadState(JSON.parse(JSON.stringify(state))))
assert.equal(drawHomestead(state), state)
const finish = confrontAbbess(state, 'confront')
assert.equal(finish.bossResolved, true)
assert.equal(confrontAbbess(finish, 'confront'), finish)
assert.equal(
  isHomesteadState({
    ...state,
    deck: ['farm', 'farm'],
    discard: ['well'],
    active: null,
  }),
  false,
)
const page = readFileSync(
  fileURLToPath(
    new URL('../../pages/admin/zuzu-shifting-lands.vue', import.meta.url),
  ),
  'utf8',
)
const content = readFileSync(
  fileURLToPath(
    new URL(
      '../../content/channels/admin/zuzu-shifting-lands.md',
      import.meta.url,
    ),
  ),
  'utf8',
)
assert.match(content, /requiredRole: ADMIN/)
assert.match(content, /channelKey: admin/)
assert.match(content, /route: \/admin\/zuzu-shifting-lands/)
assert.match(page, /NavigationFlipCard/)
assert.match(page, /images\/adventure\/card\/card-back1.webp/)
assert.match(page, /game\.state\.discard/)
assert.match(page, /game\.initialize/)
console.log('Shifting Lands first-land gameplay contract passed')
