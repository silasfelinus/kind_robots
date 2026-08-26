// utils/rulerHooked/fish.ts
//
// Consequence-driven fantasy fishing for The Ruler Is Hooked. The roster is
// deliberately plain data plus a small deterministic resolver: kingdom choices
// determine which species exist in the current lake, rarity determines draw
// weight, and the run RNG determines species/specimen details. No wall clock.

import type {
  CatchResult,
  FishDefinition,
  FishQuality,
  Rarity,
  RunSave,
} from '~/types/ruler-hooked'
import type { RngStream } from './seed'
import { clauseHolds } from './triggers'

const rarityWeight: Record<Rarity, number> = {
  COMMON: 60,
  UNCOMMON: 30,
  RARE: 14,
  EPIC: 6,
  LEGENDARY: 2,
  MYTHIC: 1,
}

export const RULER_HOOKED_FISH: FishDefinition[] = [
  {
    slug: 'choirfish', name: 'Choirfish', source: 'cthulhuquarium', affinity: 'GOOD', rarity: 'RARE',
    habitats: ['village_edge', 'near_bank'], sizeRangeCm: [12, 24],
    silhouette: 'three slender ribbon-finned fish moving as one ascending chord',
    distinction: 'A three-fish choir caught as one specimen; their throats glow in different notes.',
    catchBehavior: 'Three bites arrive in sequence while the line hums like a tuning fork.',
    fishopediaNote: 'Sings only when the shore is quiet enough to hear it. Three specimens have never been recorded disagreeing on the key.',
    consequenceReveal: 'Appeared after the kingdom became joyful enough to keep celebrating without stripping the living shoreline around it.',
    unlock: { all: [{ sliders: { joy: { gte: 65 }, nature: { gte: 50 } }, counters: { festivals: { gte: 1 } } }] },
  },
  {
    slug: 'sunspoke-koi', name: 'Sunspoke Koi', source: 'ruler-hooked', affinity: 'GOOD', rarity: 'UNCOMMON',
    habitats: ['near_bank', 'lake'], sizeRangeCm: [30, 65],
    silhouette: 'deep-bodied koi with six long translucent fins radiating like sunbeams',
    distinction: 'Its clear fins refract daylight into moving bands of color through the shallows.',
    catchBehavior: 'Circles the lure until the angler stops pulling; patience produces the strike.',
    fishopediaNote: 'The fins contain no pigment. The color belongs to whatever light the kingdom has managed to leave it.',
    consequenceReveal: 'Returned once protected land and healthier water made bright shallows reliable again.',
    unlock: { all: [{ flags: ['treelineSanctuarySettled'], sliders: { nature: { gte: 65 } } }] },
  },
  {
    slug: 'orchardjaw-perch', name: 'Orchardjaw Perch', source: 'ruler-hooked', affinity: 'GOOD', rarity: 'COMMON',
    habitats: ['village_edge', 'near_bank'], sizeRangeCm: [20, 42],
    silhouette: 'chunky green perch with a mossy back carrying tiny flowering fruit trees',
    distinction: 'Seeds sprout in the moss along its spine into miniature orchards.',
    catchBehavior: 'Prefers fruit scraps; ripe specimens scatter tiny fruit when lifted.',
    fishopediaNote: 'Carries an orchard because the shore once carried one first. The fish insists it discovered the arrangement independently.',
    consequenceReveal: 'Appeared after Robin and Ash were given a garden beside the lake and the shore remained healthy enough to share it.',
    unlock: { all: [{ flags: ['newlywedsGarden'], sliders: { joy: { gte: 55 }, nature: { gte: 50 } } }] },
  },
  {
    slug: 'bridgeback-sturgeon', name: 'Bridgeback Sturgeon', source: 'ruler-hooked', affinity: 'GOOD', rarity: 'EPIC',
    habitats: ['far_shore', 'lake'], sizeRangeCm: [180, 330],
    silhouette: 'enormous silver sturgeon with broad flat stone-like scutes forming a stepped back',
    distinction: 'Frogs and waterfowl use its broad back as a moving causeway.',
    catchBehavior: 'Hard pulling makes it settle to the bottom; steady low tension persuades it upstream.',
    fishopediaNote: 'Smaller creatures cross on its back. None appear to know where it is going, which has not reduced traffic.',
    consequenceReveal: 'Recorded after the ruler listened to the lake and left enough migration route intact for old giants to return.',
    unlock: { all: [{ flags: ['heededNix'], sliders: { nature: { gte: 70 }, order: { gte: 45 } } }] },
  },
  {
    slug: 'crown-of-reeds-pike', name: 'Crown-of-Reeds Pike', source: 'ruler-hooked', affinity: 'GOOD', rarity: 'LEGENDARY',
    habitats: ['lake', 'far_shore'], sizeRangeCm: [140, 250],
    silhouette: 'immense pale pike crowned by branching living reeds and water lilies',
    distinction: 'Its crown is a living wetland carrying insects, flowers, and tiny nesting birds.',
    catchBehavior: 'Powerful runs alternate with still phases when tension must be released to protect the living crown.',
    fishopediaNote: 'Old accounts call the crown a sign of royal favor. The pike appears not to have been consulted about the monarchy.',
    consequenceReveal: 'Appeared only after protected woods and the strange bog were both allowed to flourish into connected habitat.',
    unlock: { all: [{ flags: ['treelineSanctuarySettled', 'bogBloomed'], sliders: { nature: { gte: 85 }, joy: { gte: 60 } } }] },
  },
  {
    slug: 'parlour-rustfish', name: 'Parlour Rustfish', source: 'cthulhuquarium', affinity: 'NEUTRAL', rarity: 'COMMON',
    habitats: ['near_bank', 'lake'], sizeRangeCm: [10, 30], baseWeight: 42,
    silhouette: 'small cheerful rust-orange fish with a flowing double tail',
    distinction: 'Its copper sheen oxidizes out of water and clears again when released.',
    catchBehavior: 'A forgiving, straightforward catch that teaches the normal fishing rhythm.',
    fishopediaNote: 'Ornamental and harmless. Grows to the size of its container. The ocean is a container.',
    consequenceReveal: 'Native to almost every version of the lake; policy mostly changes what appears beside it.',
  },
  {
    slug: 'errand-guppy', name: 'Errand Guppy', source: 'cthulhuquarium', affinity: 'NEUTRAL', rarity: 'COMMON',
    habitats: ['village_edge', 'near_bank'], sizeRangeCm: [3, 8],
    silhouette: 'tiny bright guppy carrying one improbable object in its mouth',
    distinction: 'Every specimen is transporting a pebble, button, tiny key, seal fragment, or ribbon scrap.',
    catchBehavior: 'Darts laterally in abrupt bursts while refusing to drop its cargo.',
    fishopediaNote: 'Carries small objects from one end of the lake to the other and back. Neither end has requested this.',
    consequenceReveal: 'Appeared when the generous trade accord made the kingdom busier moving messages and goods.',
    unlock: { all: [{ flags: ['envoyTreatySigned'], sliders: { prosperity: { gte: 55 } } }] },
  },
  {
    slug: 'moebius-crab', name: 'Moebius Crab', source: 'cthulhuquarium', affinity: 'NEUTRAL', rarity: 'EPIC',
    habitats: ['castle_grounds', 'lake'], sizeRangeCm: [10, 22],
    silhouette: 'hermit crab carrying a shell that forms one impossible continuous loop',
    distinction: 'Its shell has one side and appears simultaneously in front of and behind itself.',
    catchBehavior: 'The line seems to reverse direction halfway through the fight.',
    fishopediaNote: 'Its shell has one surface. It has been trying to get out for some time.',
    consequenceReveal: 'Appeared after the ruler accepted Mossy’s hex, whose ecological meaning remains considerably less clear than its consequences.',
    unlock: { all: [{ flags: ['mossyHexAccepted'], sliders: { nature: { gte: 45 } } }] },
  },
  {
    slug: 'masquerade-ray', name: 'Masquerade Ray', source: 'ruler-hooked', affinity: 'NEUTRAL', rarity: 'RARE',
    habitats: ['lake', 'castle_grounds'], sizeRangeCm: [70, 145],
    silhouette: 'broad ray whose back forms a theatrical mask with long ribbon fins',
    distinction: 'Its mask-pattern changes to imitate whatever fashion currently dominates the royal court.',
    catchBehavior: 'Glides in huge slow arcs and changes direction when courtly commotion reaches the shore.',
    fishopediaNote: 'Has never attended court. This has not prevented it from being dressed for the occasion.',
    consequenceReveal: 'Appeared once performance and spectacle became important enough for even the lake to start dressing for an audience.',
    unlock: { all: [{ rewards: ['bards-ballad'], sliders: { joy: { gte: 55 } } }] },
  },
  {
    slug: 'tollbell-sturgeon', name: 'Tollbell Sturgeon', source: 'ruler-hooked', affinity: 'NEUTRAL', rarity: 'UNCOMMON',
    habitats: ['far_shore', 'village_edge'], sizeRangeCm: [130, 225],
    silhouette: 'long bronze-grey sturgeon with hollow bell-shaped scutes down both flanks',
    distinction: 'Crossing invisible underwater boundaries rings one of its bell-shaped scutes.',
    catchBehavior: 'Its bells reveal a turn before its body does, making the erratic fight audible.',
    fishopediaNote: 'Rings whenever it crosses a boundary. The lake has declined to publish the boundaries.',
    consequenceReveal: 'Appeared after the crown negotiated borders and tariffs hard enough for the lake to notice.',
    unlock: { all: [{ flags: ['envoyTreatyHard'], sliders: { treasury: { gte: 60 } } }] },
  },
  {
    slug: 'drowned-carp', name: 'Drowned Carp', source: 'cthulhuquarium', affinity: 'EVIL', rarity: 'COMMON',
    habitats: ['far_shore', 'lake'], sizeRangeCm: [30, 65],
    silhouette: 'bloated pale translucent carp with ragged fins and unmistakably dead eyes',
    distinction: 'It is unquestionably dead and equally unquestionably still hungry.',
    catchBehavior: 'Periodically goes corpse-slack; pulling during the dead phase works against the catch.',
    fishopediaNote: 'Died some time ago. Continues to feed, and continues to be hungry.',
    consequenceReveal: 'Appeared once development pushed the lake far enough from healthy that death stopped being a meaningful ecological boundary.',
    unlock: { all: [{ flags: ['metWarlock'], sliders: { nature: { lte: 40 } } }] },
  },
  {
    slug: 'lamplight-angler', name: 'Lamplight Angler', source: 'cthulhuquarium', affinity: 'EVIL', rarity: 'UNCOMMON',
    habitats: ['far_shore', 'lake'], sizeRangeCm: [40, 85],
    silhouette: 'rotund dark angler with an enormous underbite and a bright drooping lamp',
    distinction: 'Its lure resembles the kingdom’s own work lamps after industrial development.',
    catchBehavior: 'The visible lure moves separately from the hidden body; striking too soon catches only the false light.',
    fishopediaNote: 'The light is not for you. It has never been for you.',
    consequenceReveal: 'Appeared when artificial light gave the lake’s hunters something new to imitate.',
    unlock: { all: [{ flags: ['farShoreFleetSettled'], sliders: { nature: { lte: 45 } } }] },
  },
  {
    slug: 'ashbelly-gar', name: 'Ashbelly Gar', source: 'ruler-hooked', affinity: 'EVIL', rarity: 'RARE',
    habitats: ['far_shore', 'lake'], sizeRangeCm: [100, 185],
    silhouette: 'long armored black gar with a furnace-orange belly and chimney gills',
    distinction: 'Soot plates its scales while ember-light pulses under the armor; each breath releases a neat smoke ring.',
    catchBehavior: 'Powerful runs heat the line in pulses, rewarding moments of deliberate slack.',
    fishopediaNote: 'Filters ash with remarkable efficiency. The report praising this fact does not say where the ash came from.',
    consequenceReveal: 'Appeared when industrial success made pollution reliable enough to become habitat.',
    unlock: { all: [{ flags: ['farShoreFleetSettled'], sliders: { nature: { lte: 30 }, prosperity: { gte: 60 } } }] },
  },
  {
    slug: 'tithe-lamprey', name: 'Tithe Lamprey', source: 'ruler-hooked', affinity: 'EVIL', rarity: 'EPIC',
    habitats: ['castle_grounds', 'village_edge'], sizeRangeCm: [50, 105],
    silhouette: 'thick black-gold lamprey with a circular mouth ringed by coin-shaped teeth',
    distinction: 'It swells with metallic scales stolen from other fish, becoming more golden and less mobile as it feeds.',
    catchBehavior: 'Arrives attached to another hooked fish, turning the catch into an extraction-versus-rescue choice.',
    fishopediaNote: 'Takes a modest portion from anything larger than itself. It has not defined modest.',
    consequenceReveal: 'Appeared once repeated levies turned extraction from an emergency into a habitat.',
    unlock: { all: [{ counters: { taxHikes: { gte: 2 } }, sliders: { joy: { lte: 40 }, treasury: { gte: 60 } } }] },
  },
  {
    slug: 'the-pleasant-island', name: 'The Pleasant Island', source: 'cthulhuquarium', affinity: 'EVIL', rarity: 'LEGENDARY',
    habitats: ['far_shore', 'lake'], sizeRangeCm: [1200, 3000],
    silhouette: 'cheerful tiny tropical island above water attached to an enormous monster below',
    distinction: 'What first reads as new scenery is the creature itself; palms, sand, and warm shallows are part of its body.',
    catchBehavior: 'Begins as scenery; casting near it wakes a lake-scale legendary encounter.',
    fishopediaNote: 'Presents as a small warm island. Visitors are encouraged to remain on the island.',
    consequenceReveal: 'Appeared after the far shore became valuable enough that nobody asked what the new shoreline attraction was standing on.',
    unlock: { all: [{ flags: ['farShoreFleetSettled'], sliders: { nature: { lte: 30 }, prosperity: { gte: 70 }, treasury: { gte: 60 } } }] },
  },
]

export function fishUnlocked(save: RunSave, fish: FishDefinition): boolean {
  const all = fish.unlock?.all ?? []
  if (all.some((clause) => !clauseHolds(save, clause))) return false
  const any = fish.unlock?.any ?? []
  if (any.length && !any.some((clause) => clauseHolds(save, clause))) return false
  return true
}

export function availableFish(save: RunSave): FishDefinition[] {
  return RULER_HOOKED_FISH.filter((fish) => fishUnlocked(save, fish))
}

function quality(score: number): FishQuality {
  if (score >= 92) return 'TROPHY'
  if (score >= 78) return 'EXCEPTIONAL'
  if (score >= 58) return 'FINE'
  return 'ORDINARY'
}

function pickFish(save: RunSave, rng: RngStream): FishDefinition {
  const pool = availableFish(save)
  // Parlour Rustfish is intentionally unconditional, so this is defensive only.
  if (!pool.length) return RULER_HOOKED_FISH.find((f) => f.slug === 'parlour-rustfish')!
  const weights = pool.map((f) => f.baseWeight ?? rarityWeight[f.rarity])
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0)
  let roll = rng.next() * Math.max(total, 1)
  for (let i = 0; i < pool.length; i++) {
    roll -= Math.max(0, weights[i] ?? 0)
    if (roll <= 0) return pool[i]!
  }
  return pool[pool.length - 1]!
}

/** Resolve and record one successful cast. Mutates the caller-owned save clone. */
export function resolveFishingCatch(save: RunSave, rng: RngStream): CatchResult {
  const fish = pickFish(save, rng)
  const [lo, hi] = fish.sizeRangeCm
  const sizeCm = Math.round((lo + rng.next() * (hi - lo)) * 10) / 10
  const qualityScore = Math.max(1, Math.min(100, Math.floor(rng.next() * 100) + 1))
  const specimenQuality = quality(qualityScore)
  const previous = save.fishopedia[fish.slug]
  const isNew = !previous
  const entry = previous ?? {
    fishSlug: fish.slug,
    firstCaughtTurn: save.turnCount,
    countCaught: 0,
    bestSizeCm: 0,
    bestQualityScore: 0,
  }
  entry.countCaught += 1
  entry.bestSizeCm = Math.max(entry.bestSizeCm, sizeCm)
  entry.bestQualityScore = Math.max(entry.bestQualityScore, qualityScore)
  save.fishopedia[fish.slug] = entry
  save.counters.fishCaught = (save.counters.fishCaught ?? 0) + 1

  return {
    fishSlug: fish.slug,
    name: fish.name,
    affinity: fish.affinity,
    rarity: fish.rarity,
    sizeCm,
    qualityScore,
    quality: specimenQuality,
    newDiscovery: isNew,
    countCaught: entry.countCaught,
    fishopediaNote: fish.fishopediaNote,
    consequenceReveal: fish.consequenceReveal,
    catchBehavior: fish.catchBehavior,
  }
}
