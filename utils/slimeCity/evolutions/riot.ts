// RIOT SAINTS: an order of firework martyrs. Their evolutions gamble (seeded,
// replayable chances), go out in holy blasts, and occasionally singe the
// congregation. Level three always lights something big.
import {
  boss,
  chance,
  damage,
  grant,
  guard,
  heal,
  mend,
  on,
  power,
  sharpen,
  stage,
  stun,
  summon,
  type CardEvolution,
} from './dsl'

export const RIOT_EVOLUTIONS: Record<string, CardEvolution> = {
  'spark-diver': {
    2: stage('Sparkler Dive', [on('death', damage(2, 'across'))]),
    3: stage('Human Roman Candle', [
      on('enter', chance(50, damage(3, 'randomFoe')), damage(1, 'across')),
      on('death', damage(2, 'laneFoes')),
    ]),
  },
  'firebreak-parade': {
    2: stage('Marching Fuse', [on('enter', chance(50, stun('target')))]),
    3: stage('Parade of Catherine Wheels', [
      on('enter', damage(1, 'allFoes'), chance(50, boss(3))),
    ]),
  },
  's1-mime-fuse': {
    2: stage('Invisible Dynamite', [on('death', stun('laneFoes'))]),
    3: stage('Silent Detonation', [
      on('enter', stun('across')),
      on('death', damage(3, 'across'), stun('adjacentFoes')),
    ]),
  },
  's1-blast-radius': {
    2: stage('Peer-Reviewed Blast', [on('kill', damage(1, 'adjacentFoes'))]),
    3: stage('Thesis Defense', [
      on('enter', damage(2, 'laneFoes'), damage(1, 'adjacentAllies')),
      on('kill', damage(1, 'adjacentFoes')),
    ]),
  },
  's1-no-witnesses': {
    2: stage('Clean Getaway', [on('enter', guard(1, 'allies'))]),
    3: stage('Scorched Alibi', [on('enter', damage(2, 'laneFoes'), boss(2))]),
  },
  's1-chaos-firecracker': {
    2: stage('Double-Bang Flavor', [
      on('enter', chance(50, damage(2, 'randomFoe'))),
    ]),
    3: stage('Flavor of the Month', [
      on(
        'enter',
        chance(50, damage(3, 'randomFoe')),
        chance(50, damage(3, 'randomFoe')),
        chance(50, boss(3)),
      ),
    ]),
  },
  's1-fuse-alley': {
    2: stage('Shaken, Not Stirred', [on('spring', chance(50, stun('target')))]),
    3: stage('Bottled Lightning', [
      on('spring', damage(2, 'laneFoes'), chance(50, boss(3))),
    ]),
  },
  's1-volunteer-vest': {
    2: stage('Reflective Martyrdom', [on('death', heal(2, 'adjacentAllies'))]),
    3: stage('Volunteer of the Year', [
      on('enter', guard(2, 'self')),
      on('death', damage(2, 'laneFoes')),
    ]),
  },
  's2-riot-fuse-lit-bicycle-courier': {
    2: stage('Express Delivery', [on('boss', boss(1))]),
    3: stage('Package for the Boss', [
      on('enter', chance(50, boss(4)), power(2, 'self')),
      on('death', boss(2)),
    ]),
  },
  's2-riot-radioactive-parade-float': {
    2: stage('Glowing Confetti', [on('roundEnd', damage(1, 'laneFoes'))]),
    3: stage('Meltdown Parade', [
      on('enter', damage(1, 'allFoes'), stun('across')),
      on('roundEnd', damage(1, 'laneFoes')),
    ]),
  },
  's2-riot-friendly-fire-rehearsal': {
    2: stage('Dress Rehearsal', [on('enter', guard(1, 'allies'))]),
    3: stage('Opening Night Inferno', [
      on(
        'enter',
        damage(2, 'allFoes'),
        damage(1, 'allies'),
        power(2, 'allies'),
      ),
    ]),
  },
  's2-riot-homemade-bottle-rocket': {
    2: stage('Second Stage Booster', [
      on('enter', chance(50, damage(2, 'adjacentFoes'))),
    ]),
    3: stage('Garage Rocket Program', [
      on('enter', damage(2, 'strongestFoe'), chance(50, boss(3))),
    ]),
  },
  's2-riot-fusebox-fireworks': {
    2: stage('Under-Bridge Sparkler', [
      on('spring', damage(1, 'adjacentFoes')),
    ]),
    3: stage('Bridge Lights Up', [on('spring', damage(2, 'allFoes'))]),
  },
  's2-riot-last-stand-matchbook': {
    2: stage('Strike Anywhere', [on('death', damage(2, 'across'))]),
    3: stage('Burn the Matchbook', [
      on('enter', sharpen(2, 'self')),
      on('death', damage(2, 'allFoes')),
    ]),
  },
  's3-riot-bottle-rocket': {
    2: stage('Habit of Sparks', [on('hit', chance(50, damage(2, 'target')))]),
    3: stage('Sister Skyrocket', [
      on('enter', damage(2, 'randomFoe'), damage(2, 'randomFoe')),
    ]),
  },
  's3-riot-detonation-deacon': {
    2: stage('Bell Tower Charge', [on('kill', damage(2, 'adjacentFoes'))]),
    3: stage('Toll of Doom', [
      on('enter', stun('laneFoes'), boss(2)),
      on('kill', damage(2, 'adjacentFoes')),
    ]),
  },
  's3-riot-alley-prophet': {
    2: stage('Foretold Fireworks', [
      on('turnStart', chance(50, damage(1, 'randomFoe'))),
    ]),
    3: stage('Prophecy Fulfilled', [
      on('enter', damage(1, 'allFoes')),
      on('turnStart', chance(50, damage(2, 'randomFoe'))),
    ]),
  },
  's3-riot-firework-bishop': {
    2: stage('Blessing of Sparks', [on('roundEnd', heal(1, 'adjacentAllies'))]),
    3: stage('High Mass of Fire', [
      on('enter', damage(2, 'allFoes'), heal(2, 'allies')),
    ]),
  },
  's3-riot-riot-bike-messenger': {
    2: stage('Hand-Delivered Fuse', [on('hit', stun('target'))]),
    3: stage('Messenger of the Apocalypse', [
      on(
        'enter',
        damage(2, 'across'),
        grant('volatile', 'self'),
        power(2, 'self'),
      ),
    ]),
  },
  's3-riot-thermite-archangel': {
    2: stage('Burning Halo', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('Thermite Ascension', [
      on('enter', damage(3, 'strongestFoe', true), damage(1, 'allFoes')),
    ]),
  },
  's3-riot-low-budget-grenade': {
    2: stage('Coupon Shrapnel', [on('enter', damage(1, 'adjacentFoes'))]),
    3: stage('Clearance Sale Grenades', [
      on('enter', damage(2, 'randomFoe'), damage(2, 'randomFoe')),
    ]),
  },
  's3-riot-wrong-side-of-blast': {
    2: stage('Duck and Cover', [on('enter', guard(1, 'allies'))]),
    3: stage('Right Side of the Blast', [
      on('enter', guard(2, 'allies'), damage(2, 'allFoes')),
    ]),
  },
  's3-riot-horrible-idea': {
    2: stage('Somewhat Worse Idea', [
      on('enter', chance(50, damage(3, 'across'))),
    ]),
    3: stage('The Worst Idea Ever Had', [
      on(
        'enter',
        chance(50, damage(4, 'allFoes')),
        chance(50, damage(2, 'allies')),
        boss(2),
      ),
    ]),
  },
  's3-riot-stolen-detonator': {
    2: stage('Remote Trigger', [on('enter', power(2, 'target'))]),
    3: stage('Big Red Button', [
      on('enter', damage(3, 'across'), grant('volatile', 'allies')),
    ]),
  },
  's3-riot-final-benediction': {
    2: stage('Last Rites Ablaze', [on('enter', mend(2))]),
    3: stage('Apocalypse Benediction', [
      on('enter', damage(2, 'allFoes'), boss(3), mend(3)),
    ]),
  },
  's3-riot-fusewire': {
    2: stage('Burning Beads', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Rosary of Ruin', [
      on('spring', stun('laneFoes'), chance(50, damage(3, 'target'))),
    ]),
  },
  's3-riot-night-market-rocket': {
    2: stage('Two-for-One Rocket', [on('spring', damage(2, 'randomFoe'))]),
    3: stage('Night Market Finale', [
      on('spring', damage(2, 'allFoes'), boss(2)),
    ]),
  },
  's3-riot-confession-booth': {
    2: stage('Penance', [on('spring', mend(2))]),
    3: stage('Absolution by Fire', [
      on('spring', damage(3, 'target'), stun('adjacentFoes'), mend(2)),
    ]),
  },
  's3-riot-charred-sneakers': {
    2: stage('Hot Feet', [on('boss', boss(1))]),
    3: stage('Fire-Walk Sneakers', [
      on('enter', power(3, 'self'), grant('ambush', 'self')),
      on('boss', boss(1)),
    ]),
  },
  's3-riot-posthumous-saint': {
    2: stage('Medal of Sparks', [
      on('death', summon('nearest', 2, 2, ['volatile'])),
    ]),
    3: stage('Canonized in Flame', [
      on('enter', guard(2, 'self'), damage(1, 'allFoes')),
      on('death', summon('nearest', 3, 3, ['volatile'])),
    ]),
  },
}
