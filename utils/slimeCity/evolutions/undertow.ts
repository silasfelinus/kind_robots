// UNDERTOW INTELLIGENCE: the sewer's spy bureau. Their evolutions gather
// intelligence (draws), choke the rival (stuns and hexes), and turn patience
// into precision snipes. Level three is the moment the file is opened.
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

export const UNDERTOW_EVOLUTIONS: Record<string, CardEvolution> = {
  'pipe-seer': {
    2: stage('Flow Reader', [on('enter', draw(1))]),
    3: stage(
      'Oracle of the Drains',
      [on('enter', draw(1), damage(2, 'weakestFoe', true))],
      { bully: 1 },
    ),
  },
  'snitch-grate': {
    2: stage('Polished Informant', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Grate Expectations', [on('spring', stun('laneFoes'), mend(2))]),
  },
  's1-basement-ghost': {
    2: stage('Vent Phantom', [on('kill', guard(2, 'self'))]),
    3: stage('Ghost in the Pipes', [
      on('enter', damage(2, 'weakestFoe', true), stun('strongestFoe')),
    ]),
  },
  's1-static-listener': {
    2: stage('Tapped Streetlight', [], { hex: { n: 1, to: 'across' } }),
    3: stage('Whole-Grid Wiretap', [on('enter', stun('laneFoes'))], {
      hex: { n: 1, to: 'laneFoes' },
    }),
  },
  's1-floodlight-sweep': {
    2: stage('Spotlight Pin', [on('enter', stun('across'))]),
    3: stage('Searchlight Dragnet', [on('enter', stun('laneFoes'), draw(1))]),
  },
  's1-wiretap-order': {
    2: stage('Sealed Warrant', [on('enter', damage(1, 'target'))]),
    3: stage('Citywide Gag Order', [
      on('enter', stun('adjacentFoes'), draw(1)),
    ]),
  },
  's1-blue-ink-deadfall': {
    2: stage('Ink Blot', [on('spring', damage(1, 'target', true))]),
    3: stage('Redacted Pit', [
      on('spring', damage(2, 'target', true), stun('adjacentFoes')),
    ]),
  },
  's1-needle-wire': {
    2: stage('Live Antenna', [], { bully: 1 }),
    3: stage(
      'Signal Spike',
      [on('enter', damage(2, 'across', true), stun('across'))],
      { bully: 1 },
    ),
  },
  's2-undertow-drainpipe-interrogator': {
    2: stage('Leading Questions', [on('hit', damage(1, 'target', true))]),
    3: stage(
      'Full Confession',
      [
        on('enter', stun('across'), draw(1)),
        on('hit', damage(1, 'target', true)),
      ],
      { bully: 1 },
    ),
  },
  's2-undertow-subsurface-warden': {
    2: stage('Deep Watch', [on('turnStart', guard(1, 'self'))]),
    3: stage('Warden of the Deep', [
      on('enter', stun('laneFoes'), life(2, 'self')),
      on('turnStart', guard(1, 'adjacentAllies')),
    ]),
  },
  's2-undertow-floodlight-leak': {
    2: stage('Leaked Memo', [on('enter', draw(1))]),
    3: stage('Total Exposure', [on('enter', draw(2), stun('strongestFoe'))]),
  },
  's2-undertow-backwater-iou': {
    2: stage('Compound Interest', [on('enter', boss(1))]),
    3: stage('Underwater Mortgage', [
      on('enter', damage(2, 'adjacentFoes'), boss(2), mend(2)),
    ]),
  },
  's2-undertow-culvert-tollwire': {
    2: stage('Toll Collected', [on('spring', mend(2))]),
    3: stage('Culvert Checkpoint', [on('spring', stun('laneFoes'), boss(2))]),
  },
  's2-undertow-wiretap-spikes': {
    2: stage('Listening Claws', [on('hit', damage(1, 'target'))]),
    3: stage('Signal Jammer', [on('enter', stun('laneFoes'))], {
      hex: { n: 1, to: 'across' },
    }),
  },
  's3-undertow-drain-sniper': {
    2: stage('Steady Scope', [on('turnStart', power(1, 'self'))]),
    3: stage('Headshot from the Drain', [
      on('enter', damage(4, 'strongestFoe', true)),
    ]),
  },
  's3-undertow-interrogation-eel': {
    2: stage('Coiling Question', [on('hit', stun('adjacentFoes'))]),
    3: stage('Electric Interrogation', [
      on('enter', damage(1, 'allFoes'), stun('across')),
      on('hit', stun('adjacentFoes')),
    ]),
  },
  's3-undertow-quiet-listener': {
    2: stage('Quiet Notes', [on('turnStart', heal(1, 'self'))]),
    3: stage('Room of Secrets', [
      on('enter', draw(2), guard(2, 'adjacentAllies')),
    ]),
  },
  's3-undertow-needle-rain-agent': {
    2: stage('Drizzle', [on('turnStart', damage(1, 'randomFoe'))]),
    3: stage('Needle Monsoon', [
      on('enter', damage(1, 'allFoes', true), stun('strongestFoe')),
      on('turnStart', damage(1, 'randomFoe')),
    ]),
  },
  's3-undertow-basement-watchdog': {
    2: stage('Good Boy', [on('turnStart', guard(1, 'adjacentAllies'))]),
    3: stage(
      'Hound of the Undertow',
      [on('enter', summon('neighbors', 1, 2, ['snare']))],
      { bully: 2 },
    ),
  },
  's3-undertow-sewer-leviathan': {
    2: stage('Rising Tide', [on('roundEnd', damage(1, 'across'))]),
    3: stage('Leviathan Surfaces', [
      on('enter', damage(2, 'laneFoes', true), stun('across')),
      on('roundEnd', heal(2, 'self')),
    ]),
  },
  's3-undertow-weep-holes': {
    2: stage('Seep', [on('enter', damage(1, 'across'))]),
    3: stage('The Walls Weep Secrets', [
      on('enter', draw(1), damage(1, 'allFoes')),
    ]),
  },
  's3-undertow-long-drain-sting': {
    2: stage('Barbed Sting', [on('enter', damage(1, 'adjacentFoes'))]),
    3: stage('Drain-Length Lance', [
      on('enter', damage(2, 'laneFoes', true), stun('laneFoes')),
    ]),
  },
  's3-undertow-reveal-the-ledger': {
    2: stage('Second Ledger', [on('enter', draw(1))]),
    3: stage('Ledger Goes Public', [
      on('enter', draw(1), damage(2, 'strongestFoe'), boss(2)),
    ]),
  },
  's3-undertow-quiet-interdiction': {
    2: stage('Silent Order', [on('enter', stun('across'))]),
    3: stage('Total Interdiction', [
      on('enter', grant('snare', 'allies'), stun('across')),
    ]),
  },
  's3-undertow-citywide-blackmail': {
    2: stage('Dirty Photos', [on('enter', stun('target'))]),
    3: stage('Everybody Has a File', [
      on('enter', damage(1, 'allFoes'), stun('strongestFoe'), mend(3)),
    ]),
  },
  's3-undertow-red-tape-sensor': {
    2: stage('Paperwork Snarl', [on('spring', stun('adjacentFoes'))]),
    3: stage('Bureaucratic Gridlock', [
      on('spring', stun('laneFoes'), damage(1, 'laneFoes')),
    ]),
  },
  's3-undertow-floodgate-clamp': {
    2: stage('Backflow', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Open the Floodgates', [
      on('spring', damage(2, 'allFoes'), cleanse('allies')),
    ]),
  },
  's3-undertow-anonymous-invoice': {
    2: stage('Late Fee', [on('spring', boss(2))]),
    3: stage('Final Notice', [on('spring', boss(3), mend(3))]),
  },
  's3-undertow-periscope-lens': {
    2: stage('Up Periscope', [on('enter', draw(1))]),
    3: stage('Seen Through Walls', [
      on('enter', sharpen(2, 'self'), damage(2, 'strongestFoe', true)),
    ]),
  },
  's3-undertow-tunnel-harpoon': {
    2: stage('Barbed Line', [on('hit', damage(1, 'target'))]),
    3: stage('Reel Them Under', [
      on('enter', damage(3, 'across', true), stun('across')),
      on('kill', heal(3, 'self')),
    ]),
  },
}
