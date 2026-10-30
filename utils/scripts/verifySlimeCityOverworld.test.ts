// Slime City overworld contract (conductor slime-city t-007 first slice):
// streets connect all seven districts, travel follows streets, each district
// has a distinct rival and one street decision whose consequences reach the
// rival bout and the city's gates, and bout results open the Grand Pit.
import assert from 'node:assert/strict'
import {
  applyTerms,
  boutBlocked,
  boutTerms,
  CITY_PLAN,
  cityWon,
  createCity,
  decide,
  decideStreet,
  streetStory,
  STREET_STORIES,
  gateReason,
  HEAT_LIMIT,
  recordBout,
  STREETS,
  streetsFrom,
  totalStanding,
  travel,
  type CityState,
  type DistrictId,
} from '../slimeCity/city'
import { createMatch, DISTRICTS, TEAMS } from '../slimeCity/prototypes'

const classicBlackout = (
  team: Parameters<typeof createMatch>[1],
  foe: Parameters<typeof createMatch>[2],
  seed: number,
) => createMatch('blackout', team, foe, seed, { classicFog: true })

const ids = Object.keys(CITY_PLAN) as DistrictId[]
assert.deepEqual(
  [...ids].sort(),
  DISTRICTS.map((d) => d.id).sort(),
  'Every map district has a plan',
)

// Streets: two-way, named, and the whole city is reachable from the Pitworks
assert.equal(new Set(STREETS.map((s) => s[2])).size, STREETS.length)
const seen = new Set<DistrictId>(['pitworks'])
const queue: DistrictId[] = ['pitworks']
while (queue.length) {
  for (const { to } of streetsFrom(queue.shift()!))
    if (!seen.has(to)) {
      seen.add(to)
      queue.push(to)
    }
}
assert.equal(seen.size, 7, 'All districts connected')
for (const [a, b] of STREETS) {
  assert.ok(streetsFrom(a).some((s) => s.to === b))
  assert.ok(streetsFrom(b).some((s) => s.to === a))
}

// Rivals: distinct names, every crew appears, all three formats appear
const rivals = ids.map((id) => CITY_PLAN[id].rival)
assert.equal(new Set(rivals.map((r) => r.name)).size, 7)
for (const team of TEAMS)
  assert.ok(
    rivals.some((r) => r.team === team.id),
    team.id + ' has a rival',
  )
assert.deepEqual(
  new Set(rivals.map((r) => r.mode)),
  new Set(['blackout', 'gridiron', 'bloodrush']),
)
for (const id of ids) {
  const plan = CITY_PLAN[id]
  assert.equal(plan.choices.length, 2)
  assert.notDeepEqual(plan.choices[0].terms, plan.choices[1].terms)
  assert.notEqual(
    plan.choices[0].standing,
    plan.choices[1].standing,
    id + ' choices pull reputation different ways',
  )
}

// Each road has a unique, authored first-crossing decision with actual stakes.
assert.deepEqual(
  new Set(Object.keys(STREET_STORIES)),
  new Set(STREETS.map((street) => street[2])),
  'Every road has exactly one authored encounter',
)
for (const [from, to, street] of STREETS) {
  const seed = { ...createCity(), location: from }
  const arriving = travel(seed, to)
  assert.equal(arriving.pendingStreet, street)
  assert.equal(arriving.nights, 1)
  assert.equal(
    travel(arriving, from),
    arriving,
    'No walking away from a pending story',
  )
  assert.equal(decide(arriving, CITY_PLAN[to].choices[0].id), arriving)
  assert.equal(boutBlocked(arriving, to), 'Settle the street encounter first.')
  assert.equal(decideStreet(arriving, 'invalid'), arriving)
  const plan = streetStory(arriving)
  assert.ok(plan?.title && plan?.scene)
  assert.equal(plan.choices.length, 2)
  assert.notEqual(plan.choices[0].id, plan.choices[1].id)
  for (const choice of plan.choices) {
    const next = decideStreet(arriving, choice.id)
    assert.notEqual(next, arriving)
    assert.equal(next.pendingStreet, null)
    assert.equal(next.streetChoices[street], choice.id)
    assert.equal(next.standing[to], choice.standing)
    assert.equal(next.heat, Math.max(0, choice.heat))
    assert.deepEqual(next.streetTerms[to], choice.terms)
    assert.deepEqual(boutTerms(next, to), choice.terms)
    assert.equal(
      decideStreet(next, plan.choices[0].id),
      next,
      'Choice only once',
    )
    const returning = travel(next, from)
    assert.equal(
      returning.pendingStreet,
      null,
      'A resolved street does not demand replay',
    )
    assert.equal(returning.streetChoices[street], choice.id)
  }
}
assert.equal(streetStory(createCity()), null)

// Travel follows streets only and costs a night
let city: CityState = createCity()
assert.equal(city.location, 'pitworks')
assert.equal(travel(city, 'crown'), city, 'No street from Pitworks to Crown')
city = travel(city, 'chimera')
assert.equal(city.location, 'chimera')
assert.equal(city.nights, 1)
assert.equal(city.pendingStreet, 'Splice Avenue')
assert.equal(decide(city, 'chimera-serum'), city)
city = decideStreet(city, 'splice-smuggle')
assert.equal(city.pendingStreet, null)

// Decisions: once per district, with standing, heat and bout consequences
const helped = decide(city, 'chimera-serum')
assert.equal(helped.standing.chimera, 2)
assert.equal(helped.heat, 2)
assert.equal(decide(helped, 'chimera-guards'), helped, 'Decide once')
assert.deepEqual(boutTerms(helped, 'chimera'), { playerHp: 2 })
const sold = decide(city, 'chimera-guards')
assert.equal(sold.standing.chimera, -1)
assert.equal(totalStanding(sold), -1, 'Selling out costs citywide standing')

// Terms change the actual match
const base = classicBlackout( 'riot', 'catgirls', 77)
const hardy = applyTerms(base, boutTerms(helped, 'chimera'))
const p0 = base.units.filter((u) => u.side === 'player')
const p1 = hardy.units.filter((u) => u.side === 'player')
assert.deepEqual(
  p1.map((u) => u.maxHp),
  p0.map((u) => u.maxHp + 2),
)
const thinned = applyTerms(base, boutTerms(sold, 'chimera'))
assert.equal(
  thinned.units.filter((u) => u.side === 'enemy').length,
  base.units.filter((u) => u.side === 'enemy').length - 1,
)
assert.equal(base.units.length, 10, 'applyTerms does not mutate its input')
const trapped = applyTerms(classicBlackout( 'riot', 'undertow', 5), {
  rivalTrap: true,
})
assert.equal(trapped.traps.filter((t) => t.side === 'enemy').length, 1)
const armored = applyTerms(createMatch('gridiron', 'riot', 'ironjaw', 5), {
  enemyArmor: 1,
  playerMana: 2,
  rounds: -100,
})
assert.ok(
  armored.units.filter((u) => u.side === 'enemy').every((u) => u.armor >= 2),
)
assert.equal(armored.mana, 3)
assert.equal(armored.maxRounds, 8, 'Round limits never collapse below 8')

// Gates: Needle Alley needs a friend, Crown Market needs 3 standing,
// the Grand Pit needs three champions beaten
assert.ok(gateReason(createCity(), 'needles'))
assert.equal(gateReason(helped, 'needles'), null)
assert.ok(gateReason(helped, 'crown'))
assert.ok(boutBlocked(createCity(), 'pitworks'))
assert.equal(decide(createCity(), 'pit-crowd').choices.pitworks, undefined)
let run = createCity()
for (const id of ['chimera', 'foundry', 'undertow'] as DistrictId[])
  run = recordBout(run, id, 'player')
assert.equal(run.cleared.length, 3)
assert.equal(gateReason(run, 'pitworks'), null, 'Grand Pit opens')
assert.equal(boutBlocked(run, 'chimera'), 'Already beaten.')
assert.equal(recordBout(run, 'chimera', 'player'), run, 'No double wins')
assert.equal(totalStanding(run), 3)
assert.equal(gateReason(run, 'crown'), null, 'Wins open the Gilt Gate')
assert.equal(cityWon(run), false)
assert.equal(cityWon(recordBout(run, 'pitworks', 'player')), true)

// Losses raise heat; too much heat bankrolls every rival
let hot = createCity()
for (let i = 0; i < HEAT_LIMIT; i++) hot = recordBout(hot, 'foundry', 'enemy')
assert.equal(hot.heat, HEAT_LIMIT)
assert.equal(hot.losses, HEAT_LIMIT)
assert.equal(boutTerms(hot, 'foundry').enemyMana, 1)
assert.equal(boutTerms(createCity(), 'foundry').enemyMana, undefined)

console.log(
  'Slime City overworld: 7 districts, 9 streets, rivals, decisions, gates and heat PASS',
)

// Store flow: walk a street, decide, fight the rival under those terms,
// and the finished bout changes the city.
const { createPinia, setActivePinia } = await import('pinia')
const { useSlimeCityStore } = await import('../../stores/slimeCity')
setActivePinia(createPinia())
const lab = useSlimeCityStore()
lab.chooseTeam('catgirls')
assert.equal(lab.city.location, 'pitworks')
lab.visit('crown')
lab.walk()
assert.equal(lab.city.location, 'pitworks', 'No street, no walk')
lab.visit('chimera')
assert.equal(lab.route?.street, 'Splice Avenue')
lab.walk()
assert.equal(lab.city.location, 'chimera')
assert.equal(lab.streetEvent?.title, 'THE RUNAWAY AMBULANCE')
assert.equal(lab.streetProgress, 0)
lab.chooseStreet('splice-smuggle')
assert.equal(lab.streetProgress, 1)
assert.equal(lab.streetEvent, null)
lab.choose('chimera-serum')
lab.fightRival()
assert.equal(lab.view, 'arena')
assert.equal(lab.mode, 'blackout')
assert.equal(lab.match.foeId, 'catgirls', 'Mirror rival bout')
assert.equal(lab.match.units.length, 0, 'New Blackout starts with open deployment')
assert.equal(lab.hand.length, 4, 'New Blackout deals four cards')
assert.ok(
  lab.match.units
    .filter((u) => u.side === 'player')
    .every((u) => u.maxHp === u.hp && u.maxHp >= 3),
  'Street and serum terms stack (+2 HP)',
)
lab.closeGuide()
for (let i = 0; i < 40 && !lab.match.victor; i++) lab.nextRound()
assert.ok(lab.match.victor)
assert.equal(lab.bout, null, 'Bout settled')
assert.equal(lab.lastBout, 'chimera')
if (lab.match.victor === 'player')
  assert.ok(lab.city.cleared.includes('chimera'))
if (lab.match.victor === 'enemy') assert.equal(lab.city.heat, 3)
lab.showCity()
lab.resetCity()
assert.equal(lab.city.nights, 0)
console.log('Slime City overworld store flow PASS')
