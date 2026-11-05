import { expandCausalAlienRows, type CausalAlienRow } from './alienCausalRows'

const rows: CausalAlienRow[] = [
  [
    'moon-that-molts',
    'You offer the molting moon a quiet orbit outside the mining consortium’s claim.',
    'You study the coastal world beneath the falling fragments of old lunar skin.',
    'You turn the couch force bubble into a gigantic net for discarded moon shells.',
    'The living moon pulls its glittering skin closer when survey machines approach.',
    'It releases a drop of new seawater and waits to see whether you return it.',
    'The falling fragments are drifting toward a coastal world that cannot move.',
    'The moon hides beyond the charts, leaving investors to audit an empty sky.',
    'The collected shell becomes a ring of tiny oceans that immediately rain on the shareholders.',
    'The fragments miss the coast, and the moon gives the couch a pearl shaped like a horizon.',
  ],
  [
    'grandmother-gravity',
    'You offer Grandmother Gravity help with the debris without claiming custody of her planets.',
    'You watch the smallest world wobble near the development authority’s towships.',
    'You construct an enormous orbital training mobile with the couch shield.',
    'Grandmother pulls the three worlds closer whenever developers advance.',
    'She sends one small pebble around the couch and waits for a steadier orbit.',
    'The youngest planet is drifting toward a field of dangerous debris.',
    'Grandmother departs with all three worlds; the authority advertises luxury views of nothing.',
    'Nearby moons join the training mobile and demand equal playtime on the cosmic playground.',
    'The debris is cleared, and the youngest world completes its first solo orbit.',
  ],
  [
    'velvet-aurora-hatchling',
    'You offer the aurora hatchling permission to ask a question out loud.',
    'You look for the lost novice near the dark monastery walkway.',
    'You assemble a ridiculous aurora translation horn from the couch cushions.',
    'The hatchling folds its bright wings when the elders demand silence.',
    'Its wings change from jade to violet and wait for an answering color.',
    'A novice is lost in the darkness beyond the monastery lanterns.',
    'The hatchling flies away from the rules, leaving the elders whispering about its absence.',
    'One tiny question becomes a roaring proclamation, and every elder answers with contradictory silence.',
    'The novice reaches home, and the monastery learns that the sky can survive curiosity.',
  ],
  [
    'unfinished-constellation',
    'You offer the seahorse constellation an open invitation rather than a finished name.',
    'You locate the missing member beyond the fading light bridge.',
    'You project a spectacular gallery of possible constellations from the couch.',
    'The cluster contracts into darkness whenever cartographers present completed maps.',
    'Three seahorses form a question mark and invite a new shape in reply.',
    'The missing member cannot cross the bridge before its glow runs out.',
    'The stars disperse without a chosen shape; the mapmaker publishes an inaccurate crown.',
    'A hundred conflicting shapes fill the sky, leaving astronomers unable to navigate the sector.',
    'The missing star returns, and the completed group chooses the shape of an open door.',
  ],
]

export const LEGENDARY_CAUSAL_ALIENS_B = expandCausalAlienRows(rows)
