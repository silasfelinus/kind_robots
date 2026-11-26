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
  FishingRegion,
  Rarity,
  RunSave,
} from '~/types/ruler-hooked'
import type { RngStream } from './seed'
import { clauseHolds } from './triggers'
import { rollTreasure } from './economy'
import { fishWeightForProclamation } from './dailyEvents'
import { isFishingRegion, locationUnlocked } from './fishingLocations'

/**
 * Species art key convention from docs/fish-ecology.md: creature slug plus
 * presentation variant. Only the `bestiary` variant has been generated so far
 * (ruler-hooked/t-019) — catch-card/silhouette variants don't exist yet.
 */
export function fishBestiaryImageSrc(slug: string): string {
  return `/images/ruler-hooked/fish/${slug}/bestiary.webp`
}

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
    slug: 'choirfish',
    name: 'Choirfish',
    source: 'cthulhuquarium',
    affinity: 'GOOD',
    rarity: 'RARE',
    habitats: ['village_edge', 'near_bank'],
    sizeRangeCm: [12, 24],
    silhouette:
      'three slender ribbon-finned fish moving as one ascending chord',
    distinction:
      'A three-fish choir caught as one specimen; their throats glow in different notes.',
    catchBehavior:
      'Three bites arrive in sequence while the line hums like a tuning fork.',
    fishopediaNote:
      'Sings only when the shore is quiet enough to hear it. Three specimens have never been recorded disagreeing on the key.',
    consequenceReveal:
      'Appeared after the kingdom became joyful enough to keep celebrating without stripping the living shoreline around it.',
    unlock: {
      all: [
        {
          sliders: { joy: { gte: 65 }, nature: { gte: 50 } },
          counters: { festivals: { gte: 1 } },
        },
      ],
    },
  },
  {
    slug: 'sunspoke-koi',
    name: 'Sunspoke Koi',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'UNCOMMON',
    habitats: ['near_bank', 'lake'],
    sizeRangeCm: [30, 65],
    silhouette:
      'deep-bodied koi with six long translucent fins radiating like sunbeams',
    distinction:
      'Its clear fins refract daylight into moving bands of color through the shallows.',
    catchBehavior:
      'Circles the lure until the angler stops pulling; patience produces the strike.',
    fishopediaNote:
      'The fins contain no pigment. The color belongs to whatever light the kingdom has managed to leave it.',
    consequenceReveal:
      'Returned once protected land or a reed nursery made bright shallows reliable again. Dredging the north cove drives it out.',
    unlock: {
      all: [{ sliders: { nature: { gte: 65 } } }],
      any: [
        { flags: ['treelineSanctuarySettled'] },
        { flags: ['shallowsNursery'] },
      ],
      closes: [{ flags: ['shallowsDredged'] }],
    },
  },
  {
    slug: 'orchardjaw-perch',
    name: 'Orchardjaw Perch',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'COMMON',
    habitats: ['village_edge', 'near_bank'],
    sizeRangeCm: [20, 42],
    silhouette:
      'chunky green perch with a mossy back carrying tiny flowering fruit trees',
    distinction:
      'Seeds sprout in the moss along its spine into miniature orchards.',
    catchBehavior:
      'Prefers fruit scraps; ripe specimens scatter tiny fruit when lifted.',
    fishopediaNote:
      'Carries an orchard because the shore once carried one first. The fish insists it discovered the arrangement independently.',
    consequenceReveal:
      'Appeared after Robin and Ash were given a garden beside the lake and the shore remained healthy enough to share it.',
    unlock: {
      all: [{ sliders: { joy: { gte: 55 }, nature: { gte: 50 } } }],
      any: [{ flags: ['newlywedsGarden'] }, { flags: ['workingWaterfront'] }],
      closes: [{ flags: ['exclusivePier'] }],
    },
  },
  {
    slug: 'bridgeback-sturgeon',
    name: 'Bridgeback Sturgeon',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'EPIC',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [180, 330],
    silhouette:
      'enormous silver sturgeon with broad flat stone-like scutes forming a stepped back',
    distinction: 'Frogs and waterfowl use its broad back as a moving causeway.',
    catchBehavior:
      'Hard pulling makes it settle to the bottom; steady low tension persuades it upstream.',
    fishopediaNote:
      'Smaller creatures cross on its back. None appear to know where it is going, which has not reduced traffic.',
    consequenceReveal:
      'Recorded after the ruler listened to the lake and left enough migration route intact for old giants to return. Netting the run at a closed weir ends it.',
    unlock: {
      any: [
        {
          flags: ['heededNix'],
          sliders: { nature: { gte: 70 }, order: { gte: 45 } },
        },
        {
          flags: ['riverCommons'],
          sliders: { nature: { gte: 70 }, order: { gte: 45 } },
        },
        {
          flags: ['publicTrust'],
          sliders: { nature: { gte: 45 }, order: { gte: 45 } },
        },
      ],
      closes: [{ flags: ['runBlocked'] }],
    },
  },
  {
    slug: 'crown-of-reeds-pike',
    name: 'Crown-of-Reeds Pike',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'LEGENDARY',
    habitats: ['lake', 'far_shore'],
    sizeRangeCm: [140, 250],
    silhouette:
      'immense pale pike crowned by branching living reeds and water lilies',
    distinction:
      'Its crown is a living wetland carrying insects, flowers, and tiny nesting birds.',
    catchBehavior:
      'Powerful runs alternate with still phases when tension must be released to protect the living crown.',
    fishopediaNote:
      'Old accounts call the crown a sign of royal favor. The pike appears not to have been consulted about the monarchy.',
    consequenceReveal:
      'Appeared only after protected woods and the strange bog were both allowed to flourish into connected habitat.',
    unlock: {
      all: [
        {
          flags: ['treelineSanctuarySettled', 'bogBloomed'],
          sliders: { nature: { gte: 85 }, joy: { gte: 60 } },
        },
      ],
    },
  },
  {
    slug: 'parlour-rustfish',
    name: 'Parlour Rustfish',
    source: 'cthulhuquarium',
    affinity: 'NEUTRAL',
    rarity: 'COMMON',
    habitats: ['near_bank', 'lake'],
    sizeRangeCm: [10, 30],
    baseWeight: 42,
    silhouette: 'small cheerful rust-orange fish with a flowing double tail',
    distinction:
      'Its copper sheen oxidizes out of water and clears again when released.',
    catchBehavior:
      'A forgiving, straightforward catch that teaches the normal fishing rhythm.',
    fishopediaNote:
      'Ornamental and harmless. Grows to the size of its container. The ocean is a container.',
    consequenceReveal:
      'Native to almost every version of the lake; policy mostly changes what appears beside it.',
  },
  {
    slug: 'errand-guppy',
    name: 'Errand Guppy',
    source: 'cthulhuquarium',
    affinity: 'NEUTRAL',
    rarity: 'COMMON',
    habitats: ['village_edge', 'near_bank'],
    sizeRangeCm: [3, 8],
    silhouette: 'tiny bright guppy carrying one improbable object in its mouth',
    distinction:
      'Every specimen is transporting a pebble, button, tiny key, seal fragment, or ribbon scrap.',
    catchBehavior:
      'Darts laterally in abrupt bursts while refusing to drop its cargo.',
    fishopediaNote:
      'Carries small objects from one end of the lake to the other and back. Neither end has requested this.',
    consequenceReveal:
      'Appeared when the generous trade accord made the kingdom busier moving messages and goods.',
    unlock: {
      all: [
        { flags: ['envoyTreatySigned'], sliders: { prosperity: { gte: 55 } } },
      ],
    },
  },
  {
    slug: 'moebius-crab',
    name: 'Moebius Crab',
    source: 'cthulhuquarium',
    affinity: 'NEUTRAL',
    rarity: 'EPIC',
    habitats: ['castle_grounds', 'lake'],
    sizeRangeCm: [10, 22],
    silhouette:
      'hermit crab carrying a shell that forms one impossible continuous loop',
    distinction:
      'Its shell has one side and appears simultaneously in front of and behind itself.',
    catchBehavior:
      'The line seems to reverse direction halfway through the fight.',
    fishopediaNote:
      'Its shell has one surface. It has been trying to get out for some time.',
    consequenceReveal:
      'Appeared after the ruler accepted Mossy’s hex, whose ecological meaning remains considerably less clear than its consequences.',
    unlock: {
      all: [{ flags: ['mossyHexAccepted'], sliders: { nature: { gte: 45 } } }],
    },
  },
  {
    slug: 'masquerade-ray',
    name: 'Masquerade Ray',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'RARE',
    habitats: ['lake', 'castle_grounds'],
    sizeRangeCm: [70, 145],
    silhouette:
      'broad ray whose back forms a theatrical mask with long ribbon fins',
    distinction:
      'Its mask-pattern changes to imitate whatever fashion currently dominates the royal court.',
    catchBehavior:
      'Glides in huge slow arcs and changes direction when courtly commotion reaches the shore.',
    fishopediaNote:
      'Has never attended court. This has not prevented it from being dressed for the occasion.',
    consequenceReveal:
      'Appeared once performance and spectacle became important enough for even the lake to start dressing for an audience.',
    unlock: {
      all: [{ rewards: ['bards-ballad'], sliders: { joy: { gte: 55 } } }],
    },
  },
  {
    slug: 'tollbell-sturgeon',
    name: 'Tollbell Sturgeon',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'UNCOMMON',
    habitats: ['far_shore', 'village_edge'],
    sizeRangeCm: [130, 225],
    silhouette:
      'long bronze-grey sturgeon with hollow bell-shaped scutes down both flanks',
    distinction:
      'Crossing invisible underwater boundaries rings one of its bell-shaped scutes.',
    catchBehavior:
      'Its bells reveal a turn before its body does, making the erratic fight audible.',
    fishopediaNote:
      'Rings whenever it crosses a boundary. The lake has declined to publish the boundaries.',
    consequenceReveal:
      'Appeared after the crown negotiated borders and tariffs hard enough for the lake to notice.',
    unlock: {
      all: [{ sliders: { treasury: { gte: 60 } } }],
      any: [
        { flags: ['envoyTreatyHard'] },
        { flags: ['riverConcession'] },
        { flags: ['floodToll'] },
      ],
      closes: [{ flags: ['floodplainRestored'] }],
    },
  },
  {
    slug: 'drowned-carp',
    name: 'Drowned Carp',
    source: 'cthulhuquarium',
    affinity: 'EVIL',
    rarity: 'COMMON',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [30, 65],
    silhouette:
      'bloated pale translucent carp with ragged fins and unmistakably dead eyes',
    distinction:
      'It is unquestionably dead and equally unquestionably still hungry.',
    catchBehavior:
      'Periodically goes corpse-slack; pulling during the dead phase works against the catch.',
    fishopediaNote:
      'Died some time ago. Continues to feed, and continues to be hungry.',
    consequenceReveal:
      'Appeared once development pushed the lake far enough from healthy that death stopped being a meaningful ecological boundary.',
    unlock: {
      all: [{ flags: ['metWarlock'], sliders: { nature: { lte: 40 } } }],
    },
  },
  {
    slug: 'lamplight-angler',
    name: 'Lamplight Angler',
    source: 'cthulhuquarium',
    affinity: 'EVIL',
    rarity: 'UNCOMMON',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [40, 85],
    silhouette:
      'rotund dark angler with an enormous underbite and a bright drooping lamp',
    distinction:
      'Its lure resembles the kingdom’s own work lamps after industrial development.',
    catchBehavior:
      'The visible lure moves separately from the hidden body; striking too soon catches only the false light.',
    fishopediaNote: 'The light is not for you. It has never been for you.',
    consequenceReveal:
      'Appeared when artificial light gave the lake’s hunters something new to imitate.',
    unlock: {
      all: [
        { flags: ['farShoreFleetSettled'], sliders: { nature: { lte: 45 } } },
      ],
    },
  },
  {
    slug: 'ashbelly-gar',
    name: 'Ashbelly Gar',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'RARE',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [100, 185],
    silhouette:
      'long armored black gar with a furnace-orange belly and chimney gills',
    distinction:
      'Soot plates its scales while ember-light pulses under the armor; each breath releases a neat smoke ring.',
    catchBehavior:
      'Powerful runs heat the line in pulses, rewarding moments of deliberate slack.',
    fishopediaNote:
      'Filters ash with remarkable efficiency. The report praising this fact does not say where the ash came from.',
    consequenceReveal:
      'Appeared when industrial success made pollution reliable enough to become habitat.',
    unlock: {
      all: [
        {
          flags: ['farShoreFleetSettled'],
          sliders: { nature: { lte: 30 }, prosperity: { gte: 60 } },
        },
      ],
    },
  },
  {
    slug: 'tithe-lamprey',
    name: 'Tithe Lamprey',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'EPIC',
    habitats: ['castle_grounds', 'village_edge'],
    sizeRangeCm: [50, 105],
    silhouette:
      'thick black-gold lamprey with a circular mouth ringed by coin-shaped teeth',
    distinction:
      'It swells with metallic scales stolen from other fish, becoming more golden and less mobile as it feeds.',
    catchBehavior:
      'Arrives attached to another hooked fish, turning the catch into an extraction-versus-rescue choice.',
    fishopediaNote:
      'Takes a modest portion from anything larger than itself. It has not defined modest.',
    consequenceReveal:
      'Appeared once repeated levies, or a moat preserve kept by fines, turned extraction from an emergency into a habitat.',
    unlock: {
      all: [{ sliders: { joy: { lte: 40 }, treasury: { gte: 60 } } }],
      any: [
        { counters: { taxHikes: { gte: 2 } } },
        { flags: ['poachersFined'] },
      ],
    },
  },
  {
    slug: 'the-pleasant-island',
    name: 'The Pleasant Island',
    source: 'cthulhuquarium',
    affinity: 'EVIL',
    rarity: 'LEGENDARY',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [1200, 3000],
    silhouette:
      'cheerful tiny tropical island above water attached to an enormous monster below',
    distinction:
      'What first reads as new scenery is the creature itself; palms, sand, and warm shallows are part of its body.',
    catchBehavior:
      'Begins as scenery; casting near it wakes a lake-scale legendary encounter.',
    fishopediaNote:
      'Presents as a small warm island. Visitors are encouraged to remain on the island.',
    consequenceReveal:
      'Appeared after the far shore became valuable enough that nobody asked what the new shoreline attraction was standing on.',
    unlock: {
      all: [
        {
          flags: ['farShoreFleetSettled'],
          sliders: {
            nature: { lte: 30 },
            prosperity: { gte: 70 },
            treasury: { gte: 60 },
          },
        },
      ],
    },
  },
  {
    slug: 'stairclimber-trout',
    name: 'Stairclimber Trout',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'UNCOMMON',
    habitats: ['village_edge', 'near_bank'],
    sizeRangeCm: [28, 60],
    silhouette:
      'lean silver-green trout with a row of small stair-step ridges down its back',
    distinction:
      'Climbs fish ladders one pool at a time and rests on each step for exactly one breath.',
    catchBehavior:
      'Jumps upward in short hops; reeling in rhythm with the hops lands it, pulling between them loses it.',
    fishopediaNote:
      'Has never once used a waterfall. Prefers stairs, and expects them to be maintained.',
    consequenceReveal:
      'Appeared after the millrace weir was built with a fish ladder, and the trout found a road that went somewhere.',
    unlock: {
      all: [{ flags: ['weirLadder'], sliders: { nature: { gte: 45 } } }],
    },
  },
  {
    slug: 'mooring-mullet',
    name: 'Mooring Mullet',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'COMMON',
    habitats: ['near_bank', 'lake'],
    sizeRangeCm: [25, 55],
    silhouette:
      'fat blunt grey mullet with a crust-brown belly and round sleepy eyes',
    distinction:
      'Lives under moored hulls and eats whatever falls off them, which is mostly bread.',
    catchBehavior:
      'Barely fights, then bolts without warning for the nearest hull to hide under.',
    fishopediaNote:
      'Has not swum more than a boat-length in its life. Has not needed to.',
    consequenceReveal:
      'Appeared once the north cove was dredged into a marina and the pleasure boats began feeding everything underneath them.',
    unlock: { all: [{ flags: ['shallowsDredged'] }] },
  },
  {
    slug: 'barebone-roach',
    name: 'Barebone Roach',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'COMMON',
    habitats: ['castle_grounds', 'village_edge'],
    sizeRangeCm: [8, 20],
    silhouette:
      'thin grey roach so lean its ribs show through translucent skin, with an oversized mouth',
    distinction:
      'Travels in thin shoals that strip a bait in seconds and then look around for more.',
    catchBehavior:
      'Strikes instantly and repeatedly; the fight is short and the hook often comes back bare.',
    fishopediaNote:
      'Thrives wherever everything else was caught first. Is never full.',
    consequenceReveal:
      'Appeared after the castle moat was fished without rules until only the hungriest thing was left in it.',
    unlock: {
      all: [{ flags: ['moatFishedOut'] }],
      closes: [{ flags: ['moatHonour'] }],
    },
  },
  {
    slug: 'dewbell-tench',
    name: 'Dewbell Tench',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'UNCOMMON',
    habitats: ['near_bank', 'lake'],
    sizeRangeCm: [22, 48],
    silhouette:
      'plump lilac tench covered in overlapping lily pad scales with three translucent dew-drop bells along its dorsal fin',
    distinction:
      'Each glassy bell holds a single bead of water and shakes out rainbow droplets when the fish turns.',
    catchBehavior:
      'Lingers among nursery reeds and bites in three soft taps before diving under the lilies.',
    fishopediaNote:
      'The nursery committee nominated it as a mascot. The tench has not attended a meeting.',
    consequenceReveal:
      'A living nursery returned the dewbell to waters where young fish can shelter.',
    unlock: {
      all: [{ flags: ['shallowsNursery'], sliders: { nature: { gte: 55 } } }],
      closes: [{ flags: ['shallowsDredged'] }],
    },
  },
  {
    slug: 'commons-kitebream',
    name: 'Commons Kitebream',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'RARE',
    habitats: ['far_shore', 'near_bank'],
    sizeRangeCm: [35, 75],
    silhouette:
      'wide silver and coral bream with two enormous translucent kite-shaped pectoral fins and long green reed tassels',
    distinction:
      'A moving rainbow pennant on the current, with each fin stretched taut by flowing water.',
    catchBehavior:
      'Rises into clean currents and makes long lateral sails whenever tension pulls it off course.',
    fishopediaNote:
      'Its fins fly freely over the commons. A previous council tried to license the wind.',
    consequenceReveal:
      'The shared river crossing left enough current for kitebream to make their aerial turns.',
    unlock: {
      all: [
        {
          flags: ['riverCommons'],
          sliders: { nature: { gte: 55 }, order: { gte: 45 } },
        },
      ],
      closes: [{ flags: ['riverConcession'] }],
    },
  },
  {
    slug: 'oaththread-dace',
    name: 'Oaththread Dace',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'COMMON',
    habitats: ['castle_grounds', 'village_edge'],
    sizeRangeCm: [9, 24],
    silhouette:
      'slender ice-blue dace with long braided golden algae trailing from both cheeks and a violet forked tail',
    distinction:
      'Its trailing algae form a neat knot whenever two fish meet nose to nose.',
    catchBehavior:
      'Never pulls against a partner; a hooked dace circles back toward its shoal.',
    fishopediaNote:
      'Two dace can tie a knot in water. The treaty scribes envy their handwriting.',
    consequenceReveal:
      'The crown made water a public trust and the tiny witnesses returned to the moat.',
    unlock: {
      all: [
        {
          flags: ['publicTrust'],
          sliders: { nature: { gte: 45 }, joy: { gte: 45 } },
        },
      ],
    },
  },
  {
    slug: 'clockwork-riffle-loach',
    name: 'Clockwork Riffle Loach',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'UNCOMMON',
    habitats: ['village_edge', 'near_bank'],
    sizeRangeCm: [16, 37],
    silhouette:
      'long olive loach with copper gear-shaped fin edges and a round striped belly resembling a waterwheel',
    distinction:
      'Its paddle-like fins rotate independently as it rests in fast-running mill channels.',
    catchBehavior:
      'Shifts one pool upstream at a time, pausing between narrow bursts of current.',
    fishopediaNote:
      'Keeps the mill on schedule despite never having signed the maintenance contract.',
    consequenceReveal:
      'The weir ladder created little racing channels and the loach discovered a new livelihood.',
    unlock: {
      all: [{ flags: ['weirLadder'], sliders: { prosperity: { gte: 45 } } }],
    },
  },
  {
    slug: 'chroma-cuttle',
    name: 'Chroma Cuttle',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'RARE',
    habitats: ['near_bank', 'lake'],
    sizeRangeCm: [28, 62],
    silhouette:
      'freshwater cuttlefish with eight delicate curling turquoise arms and an oval back striped in vivid magenta lime and gold',
    distinction:
      'Bright mineral ink streams from its arms in translucent ribbons that drift between dock pilings.',
    catchBehavior:
      'Pulses colored ink around moored boats and hides its outline before a sudden sideways dash.',
    fishopediaNote:
      'The harbor painters swear it copied their colors. It swears the harbor painters copied its.',
    consequenceReveal:
      'The public working waterfront left sheltered pilings and safe moorings for wild color to gather.',
    unlock: {
      all: [
        { flags: ['workingWaterfront'], sliders: { prosperity: { gte: 45 } } },
      ],
      closes: [{ flags: ['exclusivePier'] }],
    },
  },
  {
    slug: 'parcelglass-eel',
    name: 'Parcelglass Eel',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'EPIC',
    habitats: ['far_shore', 'village_edge'],
    sizeRangeCm: [65, 148],
    silhouette:
      'long transparent amber eel with rounded blue eyes and small copper ring-shaped scales enclosing bright pearl beads along its spine',
    distinction:
      'Every scale protects one colored pearl, and the pearls change places as the eel swims.',
    catchBehavior:
      'Slips between river barges, abruptly changing depth whenever a bell sounds.',
    fishopediaNote:
      'Moves valuables across the border with remarkable discretion. The customs office dislikes it.',
    consequenceReveal:
      'Cross-border trade brought pearl-carrying eels to the new shipping lanes.',
    unlock: {
      all: [
        { flags: ['envoyTreatySigned'], sliders: { prosperity: { gte: 55 } } },
      ],
    },
  },
  {
    slug: 'smokedglass-flounder',
    name: 'Smokedglass Flounder',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'COMMON',
    habitats: ['near_bank', 'lake'],
    sizeRangeCm: [17, 43],
    silhouette:
      'flat charcoal flounder with one enormous amber eye and sharp translucent smoked-glass fins',
    distinction:
      'Its mirror-dark scales reflect tiny distorted dock lamps and oil-slick rainbow colors.',
    catchBehavior:
      'Burrows into dredged silt and runs flat along the lake bottom when disturbed.',
    fishopediaNote:
      'Looks like a cracked window. It only appears where the lake has lost its own reflection.',
    consequenceReveal:
      'The dredged pleasure marina left black silt and scraps of glass where spawning grass once grew.',
    unlock: {
      all: [{ flags: ['shallowsDredged'], sliders: { nature: { lte: 50 } } }],
      closes: [{ flags: ['shallowsNursery'] }],
    },
  },
  {
    slug: 'turnstile-tetra',
    name: 'Turnstile Tetra',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'UNCOMMON',
    habitats: ['village_edge', 'far_shore'],
    sizeRangeCm: [10, 30],
    silhouette:
      'bright brass-green tetra with six rigid radial fins revolving around its midsection like a small turnstile',
    distinction:
      'Its rotating fins click against a copper ring of bony scales while it patrols narrow channels.',
    catchBehavior:
      'Rushes every opening and changes direction the instant a current lets it through.',
    fishopediaNote:
      'Refuses to enter a tributary until someone moves first. Its ancestors were never like this.',
    consequenceReveal:
      'Private river concessions divided once-open waterways into regulated narrow passages.',
    unlock: {
      all: [{ flags: ['riverConcession'], sliders: { treasury: { gte: 55 } } }],
    },
  },
  {
    slug: 'lockjaw-burbot',
    name: 'Lockjaw Burbot',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'RARE',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [55, 114],
    silhouette:
      'heavy ink-black burbot with an oversized squared iron-colored jaw and paired rigid bar-like whiskers',
    distinction:
      'Its mouth closes into a perfect grid of pale metallic teeth, like a miniature sluice gate.',
    catchBehavior:
      'Freezes beneath blocked water then surges against the line in one heavy burst.',
    fishopediaNote:
      'Has inherited every closed gate in the river and regards the keys as personal property.',
    consequenceReveal:
      'Blocked migration gates and stagnant weir water gave the burbot territory with nowhere to go.',
    unlock: {
      all: [{ flags: ['runBlocked'], sliders: { order: { gte: 50 } } }],
    },
  },
  {
    slug: 'reedglass-darter',
    name: 'Reedglass Darter',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'COMMON',
    habitats: ['near_bank', 'lake'],
    sizeRangeCm: [10, 24],
    silhouette:
      'slim jade darter with transparent leaf-shaped fins and tiny silver seed-like spots',
    distinction:
      'Its translucent fins resemble young reeds, and its shadow breaks into a spray of green light.',
    catchBehavior:
      'Darts through reeds in quick zigzags; brief taps work better than a long pull.',
    fishopediaNote:
      'The nursery has taught it to hide in plain sight. It is a poor student of staying still.',
    consequenceReveal:
      'Returned when the shallows were protected as a nursery instead of dredged for boats.',
    unlock: {
      all: [{ flags: ['shallowsNursery'], sliders: { nature: { gte: 55 } } }],
      closes: [{ flags: ['shallowsDredged'] }],
    },
  },
  {
    slug: 'commons-bellfin',
    name: 'Commons Bellfin',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'RARE',
    habitats: ['village_edge', 'near_bank'],
    sizeRangeCm: [35, 72],
    silhouette:
      'round cobalt fish with two broad bronze bell-shaped fins and a pale green belly',
    distinction:
      'The bell fins ring softly when river current passes through their hollow ribs.',
    catchBehavior:
      'Follows a steady current and only bites when the line is held still.',
    fishopediaNote:
      'No one owns its song, though several officials have tried to collect royalties.',
    consequenceReveal:
      'Gathered in the public river commons once fishers could share the water without private tolls.',
    unlock: {
      all: [{ flags: ['riverCommons'], sliders: { joy: { gte: 55 } } }],
      closes: [{ flags: ['exclusivePier'] }],
    },
  },
  {
    slug: 'oathscale-minnow',
    name: 'Oathscale Minnow',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'UNCOMMON',
    habitats: ['castle_grounds', 'near_bank'],
    sizeRangeCm: [12, 30],
    silhouette:
      'tiny turquoise minnow with overlapping pearly scales shaped like interlocking hands',
    distinction:
      'The scales shimmer in pairs, as though the whole shoal has made a promise.',
    catchBehavior:
      'Bites twice in a heartbeat, then waits for the angler to stop tugging.',
    fishopediaNote:
      'Its shoals hold together even when the water is muddy. The court calls that disloyalty.',
    consequenceReveal:
      'Flourished when the moat was restored as a public trust rather than a royal pantry.',
    unlock: {
      all: [{ flags: ['publicTrust'], sliders: { nature: { gte: 45 } } }],
      closes: [{ flags: ['moatFishedOut'] }],
    },
  },
  {
    slug: 'treaty-sailfish',
    name: 'Treaty Sailfish',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'RARE',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [65, 125],
    silhouette:
      'sleek indigo freshwater sailfish with a tall patchwork sail of copper and lilac membranes',
    distinction:
      'Its sail bears irregular natural color patches that shift as it crosses the border currents.',
    catchBehavior:
      'Changes direction when the line crosses a current seam; controlled slack preserves the catch.',
    fishopediaNote:
      'It crosses every border without papers. The border guards pretend not to notice.',
    consequenceReveal:
      'Appeared after the envoy treaty reopened the waterway to unfamiliar travelers.',
    unlock: {
      all: [
        { flags: ['envoyTreatySigned'], sliders: { prosperity: { gte: 50 } } },
      ],
    },
  },
  {
    slug: 'marina-mirrorling',
    name: 'Marina Mirrorling',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'COMMON',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [18, 40],
    silhouette:
      'flat silver-blue fish with mirror-bright flank plates and a narrow fan tail',
    distinction:
      'Its sides reflect boat hulls in miniature, making the fish appear to carry a fleet.',
    catchBehavior:
      "Follows the lure's reflection instead of the lure; a pause brings it close.",
    fishopediaNote:
      'A marina is just a forest of upside-down boats, according to this species.',
    consequenceReveal:
      'Settled among cleaned marina pilings once the water stopped tasting of bilge.',
    unlock: { all: [{ flags: ['marinaCleaned'] }] },
  },
  {
    slug: 'concession-coinfin',
    name: 'Concession Coinfin',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'UNCOMMON',
    habitats: ['village_edge', 'near_bank'],
    sizeRangeCm: [20, 48],
    silhouette:
      'bright copper fish with circular coinlike pectoral fins and a long ribbon tail',
    distinction:
      'Its fins rotate like tiny wheels, flashing copper whenever the current turns.',
    catchBehavior:
      'Steals loose bait, then returns for a second bite if the hook stays motionless.',
    fishopediaNote:
      'A fish that charges admission to its own feeding grounds would be popular at court.',
    consequenceReveal:
      'Followed the merchants when the river concession turned the bank into a trading corridor.',
    unlock: {
      all: [{ flags: ['riverConcession'], sliders: { treasury: { gte: 50 } } }],
    },
  },
  {
    slug: 'pierlock-eel',
    name: 'Pierlock Eel',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'UNCOMMON',
    habitats: ['near_bank', 'castle_grounds'],
    sizeRangeCm: [45, 105],
    silhouette:
      'long charcoal eel with brass padlock-shaped bony plates along its spine',
    distinction:
      'Each spine plate closes over the next like a row of locked gates.',
    catchBehavior:
      'Wraps the line around pier supports; a quick release of tension frees it.',
    fishopediaNote: 'It has never paid a toll. It has collected several.',
    consequenceReveal:
      'Thrived beneath the exclusive pier when public access was traded for private revenue.',
    unlock: {
      all: [{ flags: ['exclusivePier'], sliders: { joy: { lte: 50 } } }],
    },
  },
  {
    slug: 'sluice-ghost',
    name: 'Sluice Ghost',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'RARE',
    habitats: ['village_edge', 'lake'],
    sizeRangeCm: [35, 80],
    silhouette:
      'pale translucent fish with a ragged veil tail and black empty-looking eye sockets',
    distinction:
      'Its nearly invisible body trails white silt that gathers into little spectral ribbons.',
    catchBehavior:
      'Only becomes visible when the lure drifts into still water behind a blocked sluice.',
    fishopediaNote:
      'It remembers the river as it used to run. The river no longer returns its calls.',
    consequenceReveal:
      'Gathered where the blocked millrace left a stagnant pocket of water.',
    unlock: {
      all: [{ flags: ['runBlocked'], sliders: { nature: { lte: 45 } } }],
      closes: [{ flags: ['sluiceOpened'] }],
    },
  },
  {
    slug: 'gallows-gudgeon',
    name: 'Gallows Gudgeon',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'EPIC',
    habitats: ['far_shore', 'castle_grounds'],
    sizeRangeCm: [40, 90],
    silhouette:
      'deep crimson gudgeon with a hooked black dorsal spine and dangling pale whiskers',
    distinction:
      'Its dorsal spine bends like a crooked gallows while its whiskers knot around reeds.',
    catchBehavior:
      'Feigns a snapped line before a sudden heavy pull; waiting one beat saves the catch.',
    fishopediaNote:
      'The court has prohibited its name. The fish is thriving under the publicity.',
    consequenceReveal:
      'Appeared when high order and miserable subjects turned the far shore into a place of punishment.',
    unlock: { all: [{ sliders: { order: { gte: 80 }, joy: { lte: 30 } } }] },
  },
  {
    slug: 'lilypad-chorister',
    name: 'Lilypad Chorister',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'COMMON',
    habitats: ['near_bank', 'lake'],
    sizeRangeCm: [9, 25],
    silhouette:
      'small pearl-white fish with a crown of five flat green lily petals around its head and a tiny pink throat pouch',
    distinction:
      'The petal crown opens like a floating flower as the throat pouch swells into a bright violet singing bubble.',
    catchBehavior:
      'Travels in a singing shoal and takes the lure only between two synchronized ripples.',
    fishopediaNote:
      'It has never missed a festival rehearsal. The musicians refuse to admit it has perfect pitch.',
    consequenceReveal:
      'The protected nursery brought back shallow lily beds where these tiny choristers gather.',
    unlock: {
      all: [
        {
          flags: ['shallowsNursery'],
          sliders: { nature: { gte: 60 } },
        },
      ],
      closes: [{ flags: ['shallowsDredged'] }],
    },
  },
  {
    slug: 'covenant-glimmerfin',
    name: 'Covenant Glimmerfin',
    source: 'ruler-hooked',
    affinity: 'GOOD',
    rarity: 'RARE',
    habitats: ['castle_grounds', 'near_bank'],
    sizeRangeCm: [28, 63],
    silhouette:
      'slender cobalt shad with an oversized translucent fan tail split into seven radiant coral and gold rays',
    distinction:
      'Its seven tail rays overlap into a bright sunburst when two fish circle each other in clear moat water.',
    catchBehavior:
      'Circles the float in wide arcs and settles when the angler lets the line go slack.',
    fishopediaNote:
      'The court tried to appoint it keeper of promises. It declined the chain of office.',
    consequenceReveal:
      'The public moat trust made room for shimmering schools instead of a private royal fish pantry.',
    unlock: {
      all: [
        {
          flags: ['publicTrust'],
          sliders: { joy: { gte: 55 } },
        },
      ],
      closes: [{ flags: ['moatFishedOut'] }],
    },
  },
  {
    slug: 'border-accordionfish',
    name: 'Border Accordionfish',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'UNCOMMON',
    habitats: ['far_shore', 'lake'],
    sizeRangeCm: [19, 49],
    silhouette:
      'long jade pipefish with alternating wide and narrow body rings in turquoise orange and rose and a curled brass-colored snout',
    distinction:
      'Its concertina body flexes into a zigzag as it slips between two differently colored currents.',
    catchBehavior:
      'Folds into the trade current on a pause, then springs forward in three short pulls.',
    fishopediaNote:
      'It crosses the border twice per breath and still has no opinion on tariffs.',
    consequenceReveal:
      'The treaty opened a braided river route that these strange travelers could follow.',
    unlock: {
      all: [
        {
          flags: ['envoyTreatySigned'],
          sliders: { prosperity: { gte: 60 } },
        },
      ],
    },
  },
  {
    slug: 'millwhistle-rudd',
    name: 'Millwhistle Rudd',
    source: 'ruler-hooked',
    affinity: 'NEUTRAL',
    rarity: 'COMMON',
    habitats: ['village_edge', 'near_bank'],
    sizeRangeCm: [17, 41],
    silhouette:
      'rounded silver rudd with two spinning copper pinwheel fins and a narrow upward-pointing lavender mouth',
    distinction:
      'Each wheel fin holds four clean curved blades that scatter rainbow droplets in the millrace.',
    catchBehavior:
      'Moves in measured bursts with the waterwheel; holding the line steady catches it between turns.',
    fishopediaNote:
      'The miller says it keeps better time than his clock. The clock has lodged an appeal.',
    consequenceReveal:
      'A working fish ladder gave the millrace enough current for spinning-fin rudd.',
    unlock: {
      all: [
        {
          flags: ['weirLadder'],
          sliders: { prosperity: { gte: 50 } },
        },
      ],
      closes: [{ flags: ['runBlocked'] }],
    },
  },
  {
    slug: 'tarflower-catfish',
    name: 'Tarflower Catfish',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'RARE',
    habitats: ['village_edge', 'lake'],
    sizeRangeCm: [49, 116],
    silhouette:
      'broad midnight-blue catfish with four thick magenta whiskers ending in oily five-petal black flowers',
    distinction:
      'Each flower leaves a thin iridescent oil ring when the catfish brushes the water surface.',
    catchBehavior:
      'Stays motionless in the shadow of barges before one powerful dive under a floating slick.',
    fishopediaNote:
      'The concession clerk described it as a growth industry and had to wipe his boots afterward.',
    consequenceReveal:
      'Industrial toll barges left stagnant oily corners where tarflowers spread.',
    unlock: {
      all: [
        {
          flags: ['riverConcession'],
          sliders: { treasury: { gte: 60 }, nature: { lte: 45 } },
        },
      ],
      closes: [{ flags: ['riverCommons'] }],
    },
  },
  {
    slug: 'ironmandate-skate',
    name: 'Ironmandate Skate',
    source: 'ruler-hooked',
    affinity: 'EVIL',
    rarity: 'EPIC',
    habitats: ['far_shore', 'castle_grounds'],
    sizeRangeCm: [65, 143],
    silhouette:
      'wide dark-violet freshwater skate with squared brass-studded wings and a long crimson tail ending in a blunt iron paddle',
    distinction:
      'Its wing studs form two rows of raised geometric squares that flash copper as it rolls above the lakebed.',
    catchBehavior:
      'Pins itself to the silty bottom and releases in one violent sideways sweep when the line tightens.',
    fishopediaNote:
      'Its territory has posted opening hours. The lake does not recognize them.',
    consequenceReveal:
      'Guarded private docks created the quiet fenced shallows where ironmandate skates now lurk.',
    unlock: {
      all: [
        {
          flags: ['exclusivePier'],
          sliders: { order: { gte: 60 }, joy: { lte: 45 } },
        },
      ],
      closes: [{ flags: ['workingWaterfront'] }],
    },
  },
]

export function fishUnlocked(save: RunSave, fish: FishDefinition): boolean {
  const all = fish.unlock?.all ?? []
  if (all.some((clause) => !clauseHolds(save, clause))) return false
  const any = fish.unlock?.any ?? []
  if (any.length && !any.some((clause) => clauseHolds(save, clause)))
    return false
  const closes = fish.unlock?.closes ?? []
  if (closes.some((clause) => clauseHolds(save, clause))) return false
  return true
}

export function availableFish(save: RunSave): FishDefinition[] {
  return RULER_HOOKED_FISH.filter((fish) => fishUnlocked(save, fish))
}

export function fishAtLocation(
  save: RunSave,
  region: FishingRegion,
): FishDefinition[] {
  if (!locationUnlocked(save, region)) return []
  return availableFish(save).filter((fish) => fish.habitats.includes(region))
}

export function canFishAt(save: RunSave, region: FishingRegion): boolean {
  return fishAtLocation(save, region).length > 0
}

export function currentFishingRegion(save: RunSave): FishingRegion {
  const region = save.fishingRegion
  return isFishingRegion(region) && canFishAt(save, region) ? region : 'lake'
}

function quality(score: number): FishQuality {
  if (score >= 92) return 'TROPHY'
  if (score >= 78) return 'EXCEPTIONAL'
  if (score >= 58) return 'FINE'
  return 'ORDINARY'
}

function pickFish(save: RunSave, rng: RngStream): FishDefinition {
  const pool =
    save.fishingRegion === undefined
      ? availableFish(save)
      : fishAtLocation(save, currentFishingRegion(save))
  // Parlour Rustfish is intentionally unconditional, so this is defensive only.
  if (!pool.length)
    return RULER_HOOKED_FISH.find((f) => f.slug === 'parlour-rustfish')!
  const weights = pool.map((f) =>
    fishWeightForProclamation(
      save,
      f.slug,
      f.baseWeight ?? rarityWeight[f.rarity],
    ),
  )
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0)
  let roll = rng.next() * Math.max(total, 1)
  for (let i = 0; i < pool.length; i++) {
    roll -= Math.max(0, weights[i] ?? 0)
    if (roll <= 0) return pool[i]!
  }
  return pool[pool.length - 1]!
}

/** Resolve and record one successful cast. Mutates the caller-owned save clone. */
export function resolveFishingCatch(
  save: RunSave,
  rng: RngStream,
): CatchResult {
  const fish = pickFish(save, rng)
  const [lo, hi] = fish.sizeRangeCm
  const sizeCm = Math.round((lo + rng.next() * (hi - lo)) * 10) / 10
  const qualityScore = Math.max(
    1,
    Math.min(100, Math.floor(rng.next() * 100) + 1),
  )
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

  // Treasure roll consumes rng AFTER every draw above, so it never shifts
  // the fish/size/quality outcome an existing seed already depends on.
  const coinsFound = rollTreasure(fish.rarity, rng)
  if (coinsFound > 0) {
    save.counters.coins = (save.counters.coins ?? 0) + coinsFound
    save.counters.treasuresFound = (save.counters.treasuresFound ?? 0) + 1
  }

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
    coinsFound,
  }
}
