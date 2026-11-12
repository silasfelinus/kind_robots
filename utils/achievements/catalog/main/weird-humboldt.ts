// /utils/achievements/catalog/main/weird-humboldt.ts
//
// Ecotone: Weird Humboldt. Judged by utils/ecotone/achievements.ts from a
// played step in useEcotoneStore().update(), never from a loaded or imported
// save. No achievement rewards choosing an opening lens.

import type { GameAchievementDef } from '../../gameAchievements'

const STYLE =
  'Painted North Coast storybook illustration, fog-silver and redwood-rust palette with moss green and Pacific teal, soft lantern light through mist, gentle grain, centered emblem composition, no text or lettering, every surface bare and unmarked.'

export const WEIRD_HUMBOLDT_ACHIEVEMENTS: GameAchievementDef[] = [
  {
    game: 'weird-humboldt',
    key: 'first-weekend',
    tier: 1,
    label: 'Sunday Night',
    message:
      'The festival packs up, the fog rolls back in, and you made it to the end of a weekend in Humboldt.',
    tooltip: 'In Ecotone, play a weekend through to any ending.',
    subtleHint: 'Every weekend ends. Stay until this one does.',
    icon: 'kind-icon:moon',
    rule: { kind: 'event' },
    artPrompt: `A lone camp chair on a foggy bluff above a quiet Humboldt beach at Sunday dusk, a folded festival wristband and a thermos resting on its arm, redwoods dark behind, the last lanterns of a packed-up fair glowing down the shore. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'hopeful-county',
    tier: 1,
    label: 'Fog Lifts',
    message:
      'You earned a hopeful future: the county is a little kinder for the weekend you spent in it.',
    tooltip: 'In Ecotone, reach any hopeful ending.',
    subtleHint:
      'Goodwill, evidence and a steady nerve add up by the last morning.',
    icon: 'kind-icon:sun',
    rule: { kind: 'event' },
    artPrompt: `Morning sun breaking through a lifting bank of coastal fog over a small Humboldt town, light spilling across a farmers market, a bay full of rowers and a redwood ridge, a heron rising from the marsh into clear blue. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'dark-county',
    tier: 1,
    label: 'Fog Stays',
    message:
      'Not every weekend ends well. The fog kept this one, and you will remember why.',
    tooltip: 'In Ecotone, reach any dark ending.',
    subtleHint: 'Some futures are earned the hard way.',
    icon: 'kind-icon:fog',
    rule: { kind: 'event' },
    artPrompt: `A two-lane highway disappearing into thick gray fog between towering redwoods at night, one taillight fading ahead, a dropped festival ribbon caught on a mile marker, the forest quiet and watchful, melancholy but tender. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'free-hour',
    tier: 1,
    label: 'An Hour Well Spent',
    message:
      'A guide offered you a free hour and you took it. That is how people stop being strangers.',
    tooltip: 'In Ecotone, spend a free evening hour with a guide you have met.',
    subtleHint: 'When the day winds down, someone may ask if you are busy.',
    icon: 'kind-icon:clock',
    rule: { kind: 'event' },
    artPrompt: `Two mugs of coffee steaming on the tailgate of an old pickup parked at the edge of a meadow at golden hour, a guitar case and a sketchbook between them, swallows over tall grass, fog waiting at the tree line. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'all-guides',
    tier: 2,
    label: 'Everybody Knows Everybody',
    message:
      'Mara, Kit, Juniper and Cedar: you met all four guides in a single weekend. Small county.',
    tooltip: 'In Ecotone, meet all four guides in one run.',
    subtleHint:
      'Say yes to the race, the forest, the studio and the back roads.',
    icon: 'kind-icon:people',
    rule: { kind: 'event' },
    artPrompt: `Four keepsakes arranged on a weathered redwood picnic table: a six-winged bird sketched in tattoo ink, a pair of juggling clubs with a brass gear, a fern tied with a green ribbon, and a crackling CB radio handset, all under a string of festival lights. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'full-car',
    tier: 2,
    label: 'Full Car',
    message:
      'Three of you in the car and the windows down. Nobody is doing this weekend alone.',
    tooltip: 'In Ecotone, travel with a party of three or more guides.',
    subtleHint: 'A lead is a start. Ask the others along.',
    icon: 'kind-icon:users',
    rule: { kind: 'event' },
    artPrompt: `A dented teal station wagon rolling down a redwood-lined back road with every window down, arms waving from each seat, a kinetic sculpture part strapped to the roof rack and a fern sticking out of the trunk, sunbeams cutting through the trees. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'long-shot',
    tier: 2,
    label: 'Long Shot',
    message:
      'Worse than one chance in three, and the dice came up for you anyway. Humboldt luck.',
    tooltip:
      'In Ecotone, pass a check whose chance of success was under 30 percent.',
    subtleHint: 'Sometimes the hard roll is the one worth taking.',
    icon: 'kind-icon:dice',
    rule: { kind: 'event' },
    artPrompt: `Two carved wooden dice tumbling through the air above a mossy stump in a misty redwood grove, each showing six pips, glowing faintly as if the forest itself nudged them, ferns leaning in to watch. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'case-closed',
    tier: 2,
    label: 'Case Closed',
    message:
      'You followed a county mystery all the way to its real ending. The Case Files have a new answer.',
    tooltip: "In Ecotone, reach one of a mystery's real endings.",
    subtleHint:
      'Pass enough of the case gates and the truth asks you to choose.',
    icon: 'kind-icon:magnify',
    rule: { kind: 'event' },
    artPrompt: `A manila case folder lying open on a diner counter at night, a brass magnifying glass resting on a strange photograph of lights in the fog, a slice of pie and a cold cup of coffee beside it, neon reflected in the window. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'mara-hope',
    tier: 2,
    label: "Mara's Line",
    message:
      "You finished the weekend with Mara and the future came out clean, like a line she'd ink.",
    tooltip: 'In Ecotone, reach a hopeful ending with Mara as your lead.',
    subtleHint: 'Find the tattoo table at the Kinetic race.',
    icon: 'kind-icon:feather',
    rule: { kind: 'event' },
    artPrompt: `A tattoo artist's quiet studio at dawn, a finished sketch of a six-winged bird glowing on the light table, steady hands cleaning a needle, sunlight through the window catching drifting dust like feathers. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'kit-hope',
    tier: 2,
    label: "Kit's Cascade",
    message:
      'You finished with Kit, and every club stayed in the air. The future caught them all.',
    tooltip: 'In Ecotone, reach a hopeful ending with Kit as your lead.',
    subtleHint: 'Somebody at the Kinetic race is juggling more than clubs.',
    icon: 'kind-icon:gearhammer',
    rule: { kind: 'event' },
    artPrompt: `Juggling clubs arcing in a perfect cascade above a whimsical pedal-powered kinetic sculpture shaped like a giant snail crossing a sunlit finish line on the sand, confetti and seagulls in the air, the crowd a soft blur. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'juniper-hope',
    tier: 2,
    label: "Juniper's Grove",
    message:
      'You finished with Juniper, and the grove let you both walk out. Something green is growing.',
    tooltip: 'In Ecotone, reach a hopeful ending with Juniper as your lead.',
    subtleHint: 'Follow the green ribbon into the trees.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'event' },
    artPrompt: `A circle of ancient redwoods with a green ribbon tied around a sapling at its center, morning light pouring down in long shafts, sword ferns unfurling, a faint shimmer in the air where a forest spirit might have just stepped away. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'cedar-hope',
    tier: 2,
    label: "Cedar's Road",
    message:
      'You finished with Cedar, and the back roads finally went somewhere good.',
    tooltip: 'In Ecotone, reach a hopeful ending with Cedar as your lead.',
    subtleHint: 'Somebody out on the back roads is listening to the radio.',
    icon: 'kind-icon:wrench',
    rule: { kind: 'event' },
    artPrompt: `A mechanic's open garage at the end of a gravel back road, an old truck with its hood up and a CB radio glowing on the workbench, radio waves drawn as soft rings in the evening fog, a hand-painted welcome sign leaning against a cedar tree. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'alone-hope',
    tier: 2,
    label: 'Your Own Two Feet',
    message:
      'No lead, no crew, and still a hopeful future. You found your way across the county on your own.',
    tooltip: 'In Ecotone, reach a hopeful ending without a lead guide.',
    subtleHint: 'Turn down every guide and still leave the county better.',
    icon: 'kind-icon:compass',
    rule: { kind: 'event' },
    artPrompt: `A single pair of muddy hiking boots standing on a ridge trail above a sea of fog at sunrise, a brass compass hanging from the laces, the whole coastline of Humboldt spread out below in soft gold light. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'clear-eyed',
    tier: 2,
    label: 'Clear-Eyed',
    message:
      'You started the weekend sober and finished it hopeful. Nothing between you and the view.',
    tooltip:
      'In Ecotone, reach a hopeful ending after a sober opening weekend.',
    subtleHint: 'Every future is open to someone who keeps a clear head.',
    icon: 'kind-icon:eye',
    rule: { kind: 'event' },
    artPrompt: `A pair of clear spring-water glasses on a sunny porch rail overlooking a crisp green valley and a bright river mouth, every detail sharp and luminous, a hummingbird hovering at a fuchsia flower, the fog burned away entirely. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'wild-way',
    tier: 3,
    label: 'The Wild Way',
    message:
      'Alone on the quiet route, you kept choosing the animals. The county remembered.',
    tooltip:
      'In Ecotone, finish the quiet route alone with a hopeful Wild Way ending.',
    subtleHint: 'On the quiet weekend, let the animals come first.',
    icon: 'kind-icon:tree',
    rule: { kind: 'event' },
    artPrompt: `Elk, river otters, a great blue heron, a banana slug and a black bear gathered peacefully around a restored creek in an old-growth redwood forest, salmon flashing upstream, a lone hiker sitting quietly at the edge, everything bathed in green-gold light. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'long-table',
    tier: 3,
    label: 'The Long Table',
    message:
      'You found your people and asked them out loud. There is a chair for you at the long table.',
    tooltip:
      'In Ecotone, reach the chosen-family ending: a hopeful finish after free hours with enough guides.',
    subtleHint: 'Spend your evenings with the people you want to keep.',
    icon: 'kind-icon:hand-heart',
    rule: { kind: 'event' },
    artPrompt: `A long mismatched wooden table set outside a ramshackle house at the edge of the forest at sunrise, too many chairs, half-finished breakfasts, a chore wheel on the wall, a tattoo sketch, juggling clubs, a fern and a CB radio among the plates. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'all-cases',
    tier: 3,
    label: 'Twelve Strange Files',
    message:
      'Every one of the county’s twelve mysteries has a folder with your notes in it.',
    tooltip: 'In Ecotone, open all twelve mysteries in the Case Files.',
    subtleHint: 'Each weekend brings a new text about something strange.',
    icon: 'kind-icon:folder',
    rule: { kind: 'event' },
    artPrompt: `Twelve worn case folders fanned across a corkboard wall in a cluttered cabin, red string linking photographs of glowing fog, a bigfoot footprint cast, a ghost ship, strange lights and an old lighthouse, a desk lamp throwing warm light. ${STYLE}`,
  },
  {
    game: 'weird-humboldt',
    key: 'half-gallery',
    tier: 3,
    label: 'Half the County',
    message:
      'Forty-two endings found. You have seen half of every future Humboldt could have.',
    tooltip: 'In Ecotone, unlock 42 of the endings in the Endings gallery.',
    subtleHint: 'Different guides, different weekends, different futures.',
    icon: 'kind-icon:gallery',
    rule: { kind: 'event' },
    artPrompt: `A long gallery wall in a small-town art collective covered with painted postcards of different Humboldt futures, half glowing in gold frames and half still blank, a visitor's shadow on the floor, fog pressing at the tall windows. ${STYLE}`,
  },
]
