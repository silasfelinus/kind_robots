// IRONJAW CHROME OGRES: a foundry union in chrome jaws. Their evolutions are
// solidarity (armor and shift shields for the whole crew), heavy industry
// (bulldozing straight through to the boss) and the furnace that never cools.
import {
  armor,
  boss,
  cleanse,
  damage,
  draw,
  grant,
  guard,
  heal,
  life,
  mend,
  on,
  power,
  sharpen,
  stage,
  stun,
  summon,
  type CardEvolution,
} from './dsl'

export const IRONJAW_EVOLUTIONS: Record<string, CardEvolution> = {
  'union-millwright': {
    2: stage('Shop Steward', [on('roundEnd', heal(1, 'adjacentAllies'))]),
    3: stage('Master Millwright', [
      on('enter', armor(1, 'adjacentAllies'), heal(2, 'adjacentAllies')),
      on('roundEnd', heal(1, 'adjacentAllies')),
    ]),
  },
  'spare-pistons': {
    2: stage('Hydraulic Brace', [on('turnStart', guard(1, 'self'))]),
    3: stage('Piston Fortress', [
      on('enter', guard(2, 'adjacentAllies')),
      on('turnStart', guard(1, 'self')),
    ]),
  },
  's1-walking-foundry': {
    2: stage('Molten Core', [on('roundEnd', damage(1, 'across'))]),
    3: stage('Foundry Meltdown', [
      on('enter', damage(2, 'laneFoes')),
      on('roundEnd', damage(1, 'laneFoes')),
    ]),
  },
  's1-scrap-welder': {
    2: stage('Barricade Welder', [on('enter', guard(2, 'adjacentAllies'))]),
    3: stage('Scrapyard Fortress', [
      on('enter', summon('neighbors', 1, 4), armor(1, 'adjacentAllies')),
    ]),
  },
  's1-hydraulic-shift': {
    2: stage('Double Shift', [on('enter', guard(1, 'target'))]),
    3: stage('Wildcat Overtime', [
      on('enter', power(2, 'allies'), guard(1, 'allies')),
    ]),
  },
  's1-forge-spark': {
    2: stage('Arc Flash', [on('enter', stun('target'))]),
    3: stage('Forge Lightning Storm', [
      on('enter', damage(2, 'adjacentFoes'), stun('target')),
    ]),
  },
  's1-bolt-clamp': {
    2: stage('Torque Clamp', [on('spring', damage(1, 'target', true))]),
    3: stage('Lockout-Tagout', [
      on('spring', stun('laneFoes'), guard(1, 'allies')),
    ]),
  },
  's1-union-plate': {
    2: stage('Grievance Plating', [on('enter', guard(1, 'adjacentAllies'))]),
    3: stage('Collective Armor', [on('enter', armor(1, 'allies'))]),
  },
  's2-ironjaw-union-bridgebearer': {
    2: stage('Load-Bearing Shoulders', [
      on('turnStart', guard(1, 'adjacentAllies')),
    ]),
    3: stage('The Bridge Holds', [
      on('enter', life(3, 'self'), guard(2, 'adjacentAllies')),
      on('turnStart', guard(1, 'adjacentAllies')),
    ]),
  },
  's2-ironjaw-foundry-lion': {
    2: stage('Crane Roar', [on('enter', stun('across'))]),
    3: stage('Lion of the Last Crane', [
      on('enter', damage(3, 'across'), boss(2)),
      on('kill', boss(2)),
    ]),
  },
  's2-ironjaw-shift-change-shove': {
    2: stage('Picket Wedge', [on('enter', power(2, 'target'))]),
    3: stage('General Strike', [
      on('enter', grant('bulldoze', 'allies'), power(1, 'allies')),
    ]),
  },
  's2-ironjaw-spare-rivet-shower': {
    2: stage('Rivet Gun', [on('enter', damage(1, 'across'))]),
    3: stage('Rivet Hailstorm', [
      on('enter', damage(1, 'allFoes'), armor(1, 'adjacentAllies')),
    ]),
  },
  's2-ironjaw-hydraulic-lockjaw': {
    2: stage('Pressure Bite', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Crusher Jaw', [on('spring', damage(3, 'target', true), boss(2))]),
  },
  's2-ironjaw-overtime-pistons': {
    2: stage('Time and a Half', [on('turnStart', power(1, 'self'))]),
    3: stage('Double-Time Pistons', [
      on('enter', sharpen(2, 'self'), cleanse('self')),
      on('turnStart', power(1, 'self')),
    ]),
  },
  's3-ironjaw-night-welder': {
    2: stage('Graveyard Shift', [on('hit', damage(1, 'target', true))]),
    3: stage('Midnight Torchlight', [
      on('enter', damage(2, 'across', true), armor(1, 'self')),
    ]),
  },
  's3-ironjaw-dreadnought': {
    2: stage('Dozer Blade', [on('kill', boss(2))]),
    3: stage('Scrapyard Juggernaut', [
      on('enter', damage(2, 'laneFoes'), armor(1, 'self')),
      on('kill', boss(2)),
    ]),
  },
  's3-ironjaw-union-cook': {
    2: stage('Hot Soup Line', [on('roundEnd', heal(1, 'woundedAlly'))]),
    3: stage('Union Potluck', [
      on('enter', heal(3, 'allies'), life(1, 'allies')),
      on('roundEnd', heal(1, 'adjacentAllies')),
    ]),
  },
  's3-ironjaw-bridgebreaker': {
    2: stage('I-Beam Swing', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('Bridge Demolition', [
      on('enter', stun('laneFoes')),
      on('hit', damage(1, 'adjacentFoes')),
    ]),
  },
  's3-ironjaw-coal-racer': {
    2: stage('Full Steam', [on('boss', boss(1))]),
    3: stage('Runaway Coal Train', [
      on('enter', damage(2, 'across'), power(2, 'self')),
      on('boss', boss(2)),
    ]),
  },
  's3-ironjaw-matriarch': {
    2: stage('Union Mother', [], { aura: { n: 1, to: 'adjacentAllies' } }),
    3: stage(
      'Iron Matriarch of the Foundry',
      [on('enter', armor(1, 'allies'), heal(2, 'allies'))],
      { aura: { n: 1, to: 'otherAllies' } },
    ),
  },
  's3-ironjaw-bonus-plate': {
    2: stage('Overtime Plating', [on('enter', life(2, 'target'))]),
    3: stage('Bonus Season', [
      on('enter', armor(1, 'adjacentAllies'), mend(3)),
    ]),
  },
  's3-ironjaw-reallocation': {
    2: stage('Show of Hands', [on('enter', power(2, 'target'), draw(1))]),
    3: stage('Seize the Means', [
      on('enter', sharpen(2, 'target'), grant('bulldoze', 'adjacentAllies')),
    ]),
  },
  's3-ironjaw-hammer-register': {
    2: stage('Hammer Number Two', [on('enter', sharpen(1, 'adjacentAllies'))]),
    3: stage('Hammer Distribution Day', [on('enter', sharpen(1, 'allies'))]),
  },
  's3-ironjaw-weld-patch': {
    2: stage('Hot Weld', [on('enter', armor(1, 'target'))]),
    3: stage('Full Rebuild', [
      on('enter', life(3, 'target'), cleanse('allies'), heal(2, 'allies')),
    ]),
  },
  's3-ironjaw-furnace-overdrive': {
    2: stage('Red-Hot Fists', [on('enter', sharpen(1, 'target'))]),
    3: stage('White-Hot Overdrive', [
      on('enter', sharpen(2, 'target'), damage(2, 'laneFoes')),
    ]),
  },
  's3-ironjaw-forklift-chock': {
    2: stage('Pallet Jam', [on('spring', guard(1, 'allies'))]),
    3: stage('Forklift Pileup', [
      on('spring', stun('laneFoes'), summon('nearest', 1, 4)),
    ]),
  },
  's3-ironjaw-slag-spill': {
    2: stage('Spreading Slag', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Slag River', [on('spring', damage(2, 'allFoes'))]),
  },
  's3-ironjaw-overtime-toll': {
    2: stage('Union Dues', [on('spring', mend(2))]),
    3: stage('Strike Fund Collection', [on('spring', boss(3), mend(3))]),
  },
  's3-ironjaw-toe-pistons': {
    2: stage('Steel Stomp', [on('hit', stun('target'))]),
    3: stage('Earthquake Boots', [
      on('enter', stun('laneFoes')),
      on('hit', stun('target')),
    ]),
  },
  's3-ironjaw-foreman-crowbar': {
    2: stage("Foreman's Leverage", [on('kill', boss(2))]),
    3: stage('Crowbar Through the Front Office', [
      on('enter', sharpen(2, 'self'), damage(2, 'across', true)),
      on('kill', boss(2)),
    ]),
  },
}
