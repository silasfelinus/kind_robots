// PUNK BLOODFAIRIES: a riot-grrrl blood choir. Their evolutions grow the
// crowd (swarm echoes), sip life back (leech), and turn the speakers up until
// the whole street shakes. Level three is always the encore.
import {
  boss,
  cleanse,
  damage,
  draw,
  grant,
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

export const BLOODFAIRY_EVOLUTIONS: Record<string, CardEvolution> = {
  'pogo-punk': {
    2: stage('Pogo Pit Starter', [on('enter', power(1, 'adjacentAllies'))]),
    3: stage('Human Pyramid Pogo', [
      on('enter', summon('neighbors', 1, 2, ['swarm'])),
      on('hit', heal(1, 'adjacentAllies')),
    ]),
  },
  'amp-tripwire': {
    2: stage('Power Chord Snap', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Wall of Sound', [
      on('spring', stun('target'), damage(2, 'laneFoes')),
    ]),
  },
  's1-riot-choir': {
    2: stage('Harmonized Scream', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('Choir of Broken Glass', [
      on('enter', damage(1, 'allFoes')),
      on('hit', heal(1, 'allies')),
    ]),
  },
  's1-pocket-punk': {
    2: stage('Soda-Can Stowaway', [
      on('death', summon('nearest', 1, 2, ['swarm'])),
    ]),
    3: stage('Six-Pack of Problems', [
      on('enter', summon('everyEmpty', 1, 1, ['swarm'])),
    ]),
  },
  's1-confetti-cannon': {
    2: stage('Glitter Shrapnel', [on('enter', stun('target'))]),
    3: stage('Ticker-Tape Massacre', [
      on('enter', damage(1, 'allFoes'), power(1, 'allies')),
    ]),
  },
  's1-stage-dive': {
    2: stage('Crowd-Surf', [on('enter', grant('swarm', 'target'))]),
    3: stage('Into the Pit', [
      on('enter', damage(2, 'across'), power(2, 'adjacentAllies')),
    ]),
  },
  's1-feedback-wire': {
    2: stage('Squealing Lead', [on('spring', stun('adjacentFoes'))]),
    3: stage('Speaker Blowout', [on('spring', damage(2, 'laneFoes'), boss(2))]),
  },
  's1-blood-mic': {
    2: stage('Mic Drop Sip', [on('hit', heal(1, 'adjacentAllies'))]),
    3: stage('Blood Karaoke Finale', [
      on('enter', damage(2, 'across'), heal(2, 'self')),
      on('hit', mend(1)),
    ]),
  },
  's2-bloodfairies-mosquito-disc-jockey': {
    2: stage('Bloodline Remix', [], { aura: { n: 1, to: 'adjacentAllies' } }),
    3: stage('Drop the Bloodbeat', [on('enter', grant('leech', 'allies'))], {
      aura: { n: 1, to: 'adjacentAllies' },
    }),
  },
  's2-bloodfairies-bassquake-colossus': {
    2: stage('Sub-Bass Tremor', [on('roundEnd', damage(1, 'across'))]),
    3: stage('Bassquake', [
      on('enter', stun('laneFoes')),
      on('death', damage(2, 'allFoes')),
    ]),
  },
  's2-bloodfairies-glitterglass-flood': {
    2: stage('Window Wave', [on('enter', damage(1, 'adjacentFoes'))]),
    3: stage('Glitterglass Tsunami', [
      on('enter', damage(2, 'allFoes'), boss(2)),
    ]),
  },
  's2-bloodfairies-afterparty-first-aid': {
    2: stage('Nobody Left Behind', [
      on('enter', cleanse('target'), heal(1, 'allies')),
    ]),
    3: stage('Afterparty Resurrection', [
      on(
        'enter',
        summon('nearest', 2, 3, ['swarm', 'leech']),
        heal(2, 'allies'),
      ),
    ]),
  },
  's2-bloodfairies-earworm-feedback': {
    2: stage('Stuck in Your Head', [on('spring', stun('adjacentFoes'))]),
    3: stage('Earworm Epidemic', [
      on('spring', stun('laneFoes'), damage(1, 'laneFoes')),
    ]),
  },
  's2-bloodfairies-roadie-megaphone': {
    2: stage('Roadie Rally', [on('enter', grant('swarm', 'adjacentAllies'))]),
    3: stage(
      'Megaphone Mob',
      [on('enter', summon('neighbors', 1, 2, ['swarm']))],
      { pack: 1 },
    ),
  },
  's3-bloodfairies-mosh-firefly': {
    2: stage('Glowstick Scout', [on('enter', power(2, 'self'))]),
    3: stage('Firefly Light Show', [
      on('enter', summon('neighbors', 1, 2, ['swarm']), stun('across')),
    ]),
  },
  's3-bloodfairies-pollen-queen': {
    2: stage('Pollen Cloud', [on('roundEnd', heal(1, 'adjacentAllies'))]),
    3: stage('Queen of the Bloom', [
      on('enter', summon('everyEmpty', 1, 2, ['swarm'])),
      on('roundEnd', heal(1, 'allies')),
    ]),
  },
  's3-bloodfairies-backstage-vamp': {
    2: stage('VIP Bite', [on('kill', life(2, 'self'))]),
    3: stage('Backstage Bloodbath', [
      on('enter', damage(2, 'weakestFoe'), heal(2, 'self')),
      on('kill', life(2, 'self')),
    ]),
  },
  's3-bloodfairies-karaoke-oracle': {
    2: stage('Prophetic Duet', [on('hit', stun('target'))]),
    3: stage('Song of the End Times', [
      on('enter', damage(3, 'strongestFoe'), power(1, 'allies')),
    ]),
  },
  's3-bloodfairies-tour-bus': {
    2: stage('Bus Unloads', [
      on('death', summon('neighbors', 1, 2, ['swarm'])),
    ]),
    3: stage('Whole Tour Arrives', [
      on('enter', summon('everyEmpty', 2, 2, ['swarm'])),
    ]),
  },
  's3-bloodfairies-headliner': {
    2: stage('Spotlight Hog', [], { pack: 2 }),
    3: stage(
      'Blood Moon Encore',
      [on('enter', power(2, 'allies'), heal(2, 'allies'))],
      { aura: { n: 1, to: 'otherAllies' } },
    ),
  },
  's3-bloodfairies-feedback-burst': {
    2: stage('Overdriven', [on('enter', power(1, 'adjacentAllies'))]),
    3: stage('Feedback Supernova', [
      on('enter', damage(1, 'allFoes'), stun('target')),
    ]),
  },
  's3-bloodfairies-encore': {
    2: stage('One More Song', [on('enter', life(2, 'target'))]),
    3: stage('Encore or Die Forever', [
      on('enter', grant('leech', 'allies'), power(1, 'allies')),
    ]),
  },
  's3-bloodfairies-rafter-dive': {
    2: stage('Rafter Swing', [on('enter', grant('ambush', 'target'))]),
    3: stage('Cannonball from the Rafters', [
      on('enter', damage(3, 'across'), stun('adjacentFoes')),
    ]),
  },
  's3-bloodfairies-festival-triage': {
    2: stage('Medic Tent', [on('enter', heal(2, 'adjacentAllies'))]),
    3: stage('Festival Field Hospital', [
      on('enter', heal(3, 'allies'), cleanse('allies'), mend(2)),
    ]),
  },
  's3-bloodfairies-cathedral-noise': {
    2: stage('Organ of Feedback', [on('enter', stun('target'))]),
    3: stage('Cathedral Collapse', [
      on('enter', damage(2, 'allFoes'), boss(3)),
    ]),
  },
  's3-bloodfairies-tripcord': {
    2: stage('Shoelace Tangle', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Pit Pile-Up', [
      on('spring', stun('laneFoes'), summon('nearest', 1, 2, ['swarm'])),
    ]),
  },
  's3-bloodfairies-amp-socket': {
    2: stage('Live Wire', [on('spring', stun('target'))]),
    3: stage('Amp Overload', [
      on('spring', damage(2, 'adjacentFoes'), stun('target'), boss(2)),
    ]),
  },
  's3-bloodfairies-banana-bouncer': {
    2: stage('Banana Cascade', [on('spring', mend(2))]),
    3: stage('Slip-and-Slide Riot', [on('spring', stun('laneFoes'), mend(2))]),
  },
  's3-bloodfairies-van-radio': {
    2: stage('Request Line', [on('turnStart', heal(1, 'adjacentAllies'))]),
    3: stage(
      'Pirate Broadcast',
      [on('enter', draw(1), grant('swarm', 'allies'))],
      { pack: 1 },
    ),
  },
  's3-bloodfairies-encore-boots': {
    2: stage('Stomp Boots', [on('enter', sharpen(1, 'self'))]),
    3: stage('Last Encore Stomp', [
      on('enter', sharpen(2, 'self'), damage(2, 'laneFoes')),
    ]),
  },
}
