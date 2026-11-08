// GENE RIOT CATGIRLS: a street clinic of escaped lab cats. Their evolutions
// lean into rescue medicine, rooftop ambushes and pirated surgical patents:
// level two adds a new interaction, level three makes the alley feel it.
import {
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

export const CATGIRL_EVOLUTIONS: Record<string, CardEvolution> = {
  'splice-runner': {
    2: stage('Contraband Courier', [on('enter', heal(2, 'woundedAlly'))]),
    3: stage('Midnight Ambulance', [
      on('enter', heal(3, 'allies')),
      on('roundEnd', heal(1, 'adjacentAllies')),
    ]),
  },
  'mutual-aid': {
    2: stage('Free Clinic Night', [on('enter', heal(1, 'adjacentAllies'))]),
    3: stage("People's Pharmacy", [on('enter', heal(2, 'allies'), mend(3))]),
  },
  's1-roof-phantom': {
    2: stage('Chimney Ghost', [on('hit', stun('target'))]),
    3: stage('Skyline Specter', [
      on('enter', damage(2, 'strongestFoe')),
      on('hit', stun('target')),
    ]),
  },
  's1-alley-vet': {
    2: stage('Night Shift Vet', [on('roundEnd', heal(1, 'adjacentAllies'))]),
    3: stage('Saint of Stray Cats', [
      on('enter', summon('neighbors', 1, 3, ['regen'])),
      on('roundEnd', heal(2, 'adjacentAllies')),
    ]),
  },
  's1-clone-salvage': {
    2: stage('Dumpster Miracle', [on('enter', life(2, 'target'))]),
    3: stage('Back From the Bin', [
      on('enter', grant('regen', 'target'), life(3, 'target')),
    ]),
  },
  's1-nine-lives': {
    2: stage('Eighth Life', [
      on('enter', cleanse('target'), guard(1, 'target')),
    ]),
    3: stage('All Nine at Once', [
      on('enter', power(1, 'allies'), cleanse('allies')),
    ]),
  },
  's1-catnip-tripwire': {
    2: stage('Catnip Cloud', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Nip Storm', [
      on('spring', stun('laneFoes'), damage(1, 'laneFoes')),
    ]),
  },
  's1-surgical-piercers': {
    2: stage('Scalpel Fingers', [on('hit', damage(1, 'target', true))]),
    3: stage('Patent Breaker', [on('enter', sharpen(2, 'self'))], { bully: 2 }),
  },
  's2-catgirls-backstreet-organ-donor': {
    2: stage('Spare Parts', [on('death', heal(3, 'adjacentAllies'))]),
    3: stage('Open-Heart Donor', [
      on('enter', life(2, 'adjacentAllies')),
      on('death', heal(4, 'allies')),
    ]),
  },
  's2-catgirls-parapet-ghost-kitten': {
    2: stage('Gargoyle Kitten', [on('kill', guard(2, 'self'))]),
    3: stage('Nightmare of the Parapets', [
      on('enter', damage(2, 'laneFoes')),
      on('kill', guard(2, 'self')),
    ]),
  },
  's2-catgirls-emergency-molt': {
    2: stage('Shed Skin', [on('enter', cleanse('target'), guard(2, 'target'))]),
    3: stage('Brand-New Hide', [
      on('enter', grant('regen', 'target'), life(2, 'target')),
    ]),
  },
  's2-catgirls-needle-thread-ambush': {
    2: stage('Stitched Strike Team', [
      on('enter', grant('ambush', 'adjacentAllies')),
    ]),
    3: stage('Silent Surgery', [
      on('enter', grant('ambush', 'allies'), power(1, 'allies')),
    ]),
  },
  's2-catgirls-sterile-alley-wire': {
    2: stage('Hospital-Grade Snare', [on('spring', mend(2))]),
    3: stage('Quarantine Line', [
      on('spring', stun('laneFoes'), heal(1, 'allies')),
    ]),
  },
  's2-catgirls-lab-escape-atlas': {
    2: stage('Marked Weakness', [], { bully: 2 }),
    3: stage(
      'Every Exit Mapped',
      [on('enter', draw(1), grant('ambush', 'self'))],
      { bully: 2 },
    ),
  },
  's3-catgirls-glasswalker': {
    2: stage('Shard Dancer', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('Gutterglass Prism', [
      on('enter', summon('neighbors', 1, 2, ['ambush'])),
      on('hit', damage(1, 'adjacentFoes')),
    ]),
  },
  's3-catgirls-patent-saboteur': {
    2: stage('Corporate Spy', [on('enter', stun('across'))]),
    3: stage('Patent Wrecker', [
      on('enter', damage(3, 'strongestFoe', true), boss(2)),
    ]),
  },
  's3-catgirls-alley-vet': {
    2: stage('Noodle Broth Clinic', [
      on('roundEnd', heal(1, 'woundedAlly'), mend(1)),
    ]),
    3: stage('All-Night Noodle Clinic', [
      on('enter', heal(2, 'allies'), mend(3)),
      on('roundEnd', heal(1, 'adjacentAllies')),
    ]),
  },
  's3-catgirls-scalpel-captain': {
    2: stage('Velvet Command', [], { aura: { n: 1, to: 'adjacentAllies' } }),
    3: stage(
      'Captain of Knives',
      [on('enter', power(2, 'allies'), grant('ambush', 'adjacentAllies'))],
      { aura: { n: 1, to: 'adjacentAllies' } },
    ),
  },
  's3-catgirls-bicycle-clinic': {
    2: stage('Blood Bag Bell', [on('hit', heal(1, 'adjacentAllies'))]),
    3: stage('Ambulance Parade', [
      on('enter', summon('neighbors', 1, 3, ['regen'])),
      on('hit', heal(1, 'allies')),
    ]),
  },
  's3-catgirls-escaped-tiger': {
    2: stage('Loose in the Lab', [
      on('kill', heal(3, 'self'), sharpen(1, 'self')),
    ]),
    3: stage('Apex Escapee', [on('enter', damage(3, 'across'))], { lone: 2 }),
  },
  's3-catgirls-sidewalk-stitches': {
    2: stage('Curbside Triage', [on('enter', heal(1, 'adjacentAllies'))]),
    3: stage("Street Surgeon's Marathon", [
      on('enter', heal(2, 'allies'), cleanse('allies')),
    ]),
  },
  's3-catgirls-stolen-saw': {
    2: stage('Hot Saw', [on('enter', sharpen(1, 'target'))]),
    3: stage('Bone Saw Concerto', [
      on('enter', sharpen(2, 'target'), damage(2, 'across')),
    ]),
  },
  's3-catgirls-fire-escape': {
    2: stage('Rooftop Shortcut', [on('enter', grant('ambush', 'target'))]),
    3: stage('Fire Escape Rush', [
      on('enter', power(2, 'adjacentAllies'), draw(1)),
    ]),
  },
  's3-catgirls-counterfeit-heart': {
    2: stage('Black-Market Pulse', [on('enter', life(2, 'target'))]),
    3: stage('Two Hearts Beating', [
      on('enter', grant('regen', 'target'), grant('leech', 'target'), mend(2)),
    ]),
  },
  's3-catgirls-spare-lives': {
    2: stage('Backup Lives', [on('enter', life(2, 'target'))]),
    3: stage('Spare Lives Stockpile', [on('enter', grant('regen', 'allies'))]),
  },
  's3-catgirls-suture-line': {
    2: stage('Leftover Thread', [on('spring', heal(2, 'woundedAlly'))]),
    3: stage('Sewn Into the Crew', [
      on('spring', summon('nearest', 2, 2, ['regen'])),
    ]),
  },
  's3-catgirls-garrote': {
    2: stage('Catwalk Drop', [on('spring', boss(2))]),
    3: stage("Hangman's Catwalk", [
      on('spring', damage(3, 'target', true), boss(2)),
    ]),
  },
  's3-catgirls-false-clinic': {
    2: stage('Fake Waiting Room', [on('spring', mend(3))]),
    3: stage('Clinic of Lies', [
      on('spring', stun('target'), damage(2, 'adjacentFoes'), mend(3)),
    ]),
  },
  's3-catgirls-hollow-scalpel': {
    2: stage('Hidden Blade', [on('kill', sharpen(1, 'self'))]),
    3: stage('Hollow-Point Surgery', [
      on('enter', damage(2, 'across', true)),
      on('kill', heal(3, 'self'), sharpen(1, 'self')),
    ]),
  },
  's3-catgirls-pounce-rig': {
    2: stage('Spring-Loaded', [], { pack: 1 }),
    3: stage('Second Pounce', [
      on('enter', power(3, 'self'), cleanse('self')),
      on('kill', power(2, 'self')),
    ]),
  },
}
