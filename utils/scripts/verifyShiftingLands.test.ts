import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  BOSS_CARD,
  HOMESTEAD_CARDS,
  HOMESTEAD_ROLES,
  HOMESTEAD_SPECIES,
  confrontAbbess,
  createHomestead,
  drawHomestead,
  isHomesteadState,
  resolveHomestead,
  restoreHomestead,
} from '../shiftingLands/homestead'

const a = createHomestead(99)
const b = createHomestead(99)
assert.deepEqual(a, b, 'seeded deck order must be reproducible')
assert.equal(a.deck.length, 3)
assert.equal(new Set(a.deck).size, 3)
assert.equal(a.version, 2)
assert.equal(HOMESTEAD_CARDS.length, 3)
assert.equal(BOSS_CARD.id, 'abbess')
assert.ok(HOMESTEAD_CARDS.every((card) => card.art.startsWith('/zuzu-gamebook/scenes/')))
assert.equal(HOMESTEAD_SPECIES.length, 3)
assert.equal(HOMESTEAD_ROLES.length, 3)

let state = a
for (let i = 0; i < 3; i++) {
  const next = drawHomestead(state)
  assert.notEqual(next, state)
  assert.equal(drawHomestead(next), next, 'only one unresolved encounter at a time')
  assert.ok(next.active)
  assert.ok(next.activeEncounter)
  assert.equal(next.activeEncounter.locationId, next.active)
  assert.ok(next.revealed.includes(next.active!))
  const saved = JSON.parse(JSON.stringify(next))
  assert.ok(isHomesteadState(saved))
  assert.deepEqual(resolveHomestead(saved, 'insight'), resolveHomestead(next, 'insight'),
    'dice results must be deterministic after save/refresh')
  state = resolveHomestead(next, 'insight')
  assert.equal(state.active, null)
  assert.equal(state.activeEncounter, null)
  assert.ok(state.lastCheck)
  assert.equal(state.lastCheck.dice.length, 2)
  assert.equal(state.lastCheck.dice.every((die) => die >= 1 && die <= 6), true)
  assert.equal(state.lastCheck.total, state.lastCheck.dice[0] + state.lastCheck.dice[1] + state.lastCheck.modifier)
  assert.equal(state.lastCheck.success, state.lastCheck.total >= state.lastCheck.difficulty)
}
assert.equal(state.deck.length, 0)
assert.equal(state.discard.length, 3)
assert.equal(state.revealed.length, 3)
assert.ok(isHomesteadState(JSON.parse(JSON.stringify(state))))
assert.equal(drawHomestead(state), state)
const finish = confrontAbbess(state, 'confront')
assert.equal(finish.bossResolved, true)
assert.equal(confrontAbbess(finish, 'confront'), finish)
assert.equal(isHomesteadState({ ...state, deck: ['farm', 'farm'], discard: ['well'] }), false)
assert.equal(isHomesteadState({ ...state, lastCheck: { ...state.lastCheck, dice: null } }), false)
assert.equal(isHomesteadState({ ...state, lastCheck: undefined }), false)
assert.equal(isHomesteadState({ ...state, active: 'well', activeEncounter: undefined, deck: [] }), false)

const migrated = restoreHomestead({
  ...a,
  version: 1,
  rngState: undefined,
  activeEncounter: undefined,
  lastCheck: undefined,
})
assert.ok(migrated)
assert.equal(migrated.version, 2)
assert.deepEqual(migrated.deck, a.deck)
assert.equal(restoreHomestead({ version: 10 }), null)
let sawRabbitHomesteader = false
let sawOtterHomesteader = false
let sawRabbitCaretaker = false
let sawOtterCaretaker = false
const dispositionsBySpecies = new Map<string, Set<string>>()
for (let seed = 1; seed <= 200; seed++) {
  const encountered = drawHomestead(createHomestead(seed)).activeEncounter!
  if (encountered.species === 'rabbit' && encountered.role === 'homesteader') sawRabbitHomesteader = true
  if (encountered.species === 'otter' && encountered.role === 'homesteader') sawOtterHomesteader = true
  if (encountered.species === 'rabbit' && encountered.role === 'caretaker') sawRabbitCaretaker = true
  if (encountered.species === 'otter' && encountered.role === 'caretaker') sawOtterCaretaker = true
  if (!dispositionsBySpecies.has(encountered.species))
    dispositionsBySpecies.set(encountered.species, new Set())
  dispositionsBySpecies.get(encountered.species)!.add(encountered.disposition)
}
assert.ok(sawRabbitHomesteader && sawOtterHomesteader && sawRabbitCaretaker && sawOtterCaretaker,
  'species and occupation vary independently')
assert.ok([...dispositionsBySpecies.values()].every((values) => values.size > 1),
  'species never determines a unique disposition')

const toPath = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url))
const page = readFileSync(toPath('../../pages/admin/zuzu-shifting-lands.vue'), 'utf8')
const channel = readFileSync(toPath('../../content/channels/admin/zuzu-shifting-lands.md'), 'utf8')
const world = readFileSync(toPath('../zuzuWorld.ts'), 'utf8')
assert.match(channel, /channelKey: admin/)
assert.match(channel, /route: \/admin\/zuzu-shifting-lands/)
assert.match(channel, /requiredRole: ADMIN/)
assert.doesNotMatch(channel, /navigation: false/)
assert.match(world, /route: '\/admin\/zuzu-shifting-lands'/)
assert.match(page, /NavigationFlipCard/)
assert.match(page, /game\.state\.activeEncounter/)
assert.match(page, /game\.state\.lastCheck/)
assert.match(page, /images\/adventure\/card\/card-back1.webp/)
assert.match(page, /game\.state\.discard/)
assert.match(page, /game\.initialize/)
assert.equal(existsSync(toPath('../../pages/play/zuzu-shifting-lands.vue')), false)
assert.equal(existsSync(toPath('../../content/channels/projects/zuzu-shifting-lands.md')), false)
console.log('Shifting Lands admin-route, independent Facet and saved-roll contracts passed')
