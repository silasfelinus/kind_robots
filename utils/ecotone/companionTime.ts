import type { CompanionId, EncounterCard } from './content'

/**
 * A free hour with a guide the player has already met (weird-humboldt t-045).
 * Every met guide offers one per run, whether they are traveling with you,
 * went their own way, or were turned down at the opening. Nothing is rolled:
 * it is a light scene, not a test. Each guide has two warm ways to spend the
 * hour, each leaving a remembered moment (a bond on the Guides tab and a line
 * in the chosen-family ending): a quiet one that also steadies your nerve by
 * one, and one spent among other people, whose payoff is the relationship
 * itself. A "not tonight" answer costs nothing and changes nothing. Effects
 * stay small on purpose: the free hours must not quietly decide the county's
 * fate (seeded dark endings stay reachable; verifyEcotoneCompanionTime).
 * Not part of the random fork deck; the engine offers these at day breaks and
 * before the finale (engine.ts companionTimeBefore).
 */
export const COMPANION_TIME_DECLINE = 'not-now'

export const COMPANION_TIME: Record<CompanionId, EncounterCard> = {
  mara: {
    id: 'CT-MARA-01',
    kind: 'encounter',
    chapter: 3,
    place: 'Mara’s studio after closing',
    title: 'A Practice Grapefruit',
    scene: 'plaza',
    body: [
      'Mara catches your sleeve at the end of the day. “I have one hour before I have to be a responsible adult again,” she says. “I am spending it at the studio. You can come if you don’t touch the needles.” The studio smells of green soap and coffee. One of the printed birds drying on her light table has grown a seventh feather since lunch. She initials the extra feather like a receipt.',
      'She sets a grapefruit on a paper towel: the practice skin every apprentice starts on. “Nobody here owes anybody a story tonight,” she says. “But if you want to stay, there is work for your hands.” Through the window, a nervous kid holding a printout is working up the courage to knock.',
    ],
    leadLines: {
      kit: 'Kit waves the two of you off. “Go. I will guard the snacks and ruin nothing.”',
      juniper:
        'Juniper says she will wait outside with the ferns in the planter, who apparently have a lot to say.',
      cedar:
        'Cedar says he will be in the truck with the CB, and to holler if the bird grows an eighth feather.',
    },
    choices: [
      {
        id: 'grapefruit',
        label:
          'Let her teach you to pull one clean line on the practice grapefruit',
        success: {
          text: 'Your first line wobbles like a rumor. Your fourth is almost honest. Mara does not praise it; she just slides the grapefruit back toward you, which from her is a standing ovation. You leave with steadier hands and the strange comfort of knowing patience can be taught.',
          effects: { nerve: 1, flag: 'bond_mara_time_line' },
        },
      },
      {
        id: 'walk-in',
        label:
          'Open the door for the nervous kid and help Mara talk them through it',
        success: {
          text: 'The kid wants their late dog’s name in a font they found online. Mara talks them into her own lettering, a smaller size and a second appointment so they can sleep on it. You hold the printout and then the kid’s hand, in that order. They leave grinning and still un-inked, which Mara calls the best outcome a first consult can have.',
          effects: { flag: 'bond_mara_time_walkin' },
        },
      },
      {
        id: COMPANION_TIME_DECLINE,
        label: 'Tell her you need sleep more than coffee tonight',
        success: {
          text: 'Mara caps her pen. “Correct answer,” she says. “The grapefruit will keep.” Nothing is lost. The offer stays exactly where she left it.',
          effects: {},
        },
      },
    ],
    provenance:
      'Fictional independent tattoo studio, client and conversation. Practice skins (fruit) are a common apprentice exercise; no real artist or client is implied.',
  },
  kit: {
    id: 'CT-KIT-01',
    kind: 'encounter',
    chapter: 3,
    place: 'A parking lot under one buzzing streetlight',
    title: 'Forty Drops Before Midnight',
    scene: 'plaza',
    body: [
      'Kit is under a streetlight with three juggling clubs, a unicycle missing its seat and four middle-schoolers who should probably be home by now. “Free hour!” she shouts when she sees you. “Do you know what free means? It means nobody is filming and everybody is allowed to be bad at something.”',
      'The streetlight hums in a rhythm that matches her cascade a little too exactly, and when she stops, it stops. She files this under weekend problems with total confidence. “Pick a job,” she says. “Learner or roadie. Both are honorable. Both get pizza.”',
    ],
    leadLines: {
      mara: 'Mara sits on the curb with a sketchbook and says she is only here to document the injuries.',
      juniper:
        'Juniper lies on the warm hood of a parked car and heckles the streetlight on Kit’s behalf.',
      cedar:
        'Cedar sizes up the seatless unicycle and says nothing, which means he is already planning to fix it.',
    },
    choices: [
      {
        id: 'cascade',
        label: 'Learn a three-club cascade and drop everything forty times',
        success: {
          text: 'You drop the clubs forty-one times. On the forty-second try you catch three in a row, and Kit screams like you have won a medal. The middle-schoolers count every drop out loud, which somehow makes each one funnier. You walk away sore from laughing and lighter than you have felt all weekend.',
          effects: { nerve: 1, flag: 'bond_kit_time_cascade' },
        },
      },
      {
        id: 'roadie',
        label:
          'Be her roadie: pass the hat for the kids’ club and count it with them',
        success: {
          text: 'The hat comes back with nine dollars, a guitar pick and a coupon for half a burrito. You and the kids count it twice, out loud, and write it on a napkin so their club has its first-ever budget. Kit tapes the napkin inside her club case and swears it is going in a frame.',
          effects: { flag: 'bond_kit_time_roadie' },
        },
      },
      {
        id: COMPANION_TIME_DECLINE,
        label: 'Wave from the curb; you could not catch a cold tonight',
        success: {
          text: 'Kit tosses you a club anyway, gently, so you have something to hold while you rest. “Some other weekend,” she says, and goes back to teaching. The streetlight hums along without you, which is fine.',
          effects: {},
        },
      },
    ],
    provenance:
      'Fictional street-juggling lesson and youth club in a real Humboldt setting; no claim about a real performer, venue or organization.',
  },
  juniper: {
    id: 'CT-JUNIPER-01',
    kind: 'encounter',
    chapter: 3,
    place: 'A redwood grove at dusk',
    title: 'The Redwood Takes Its Time',
    scene: 'grove',
    body: [
      'Juniper is lying flat in the duff with her boots off and her hands folded on her stomach, as if she has been waiting for you specifically and also for nobody at all. “This tree is about to finish a thought,” she says. “It started it around 1850. I would like company for the ending.”',
      'Down the trail, two night hikers are picking up festival litter by headlamp and losing an argument with a raccoon about a bag of chips. The redwood creaks once, like a very old person settling into a chair. Juniper pats the ground beside her and does not insist.',
    ],
    leadLines: {
      mara: 'Mara takes a stump at a respectful distance and says she will believe the tree finished a thought when it signs something.',
      kit: 'Kit tries to lie still for one full minute and fails magnificently, then goes to help the hikers instead.',
      cedar:
        'Cedar knocks once on the trunk the way his dad taught him and says it sounds healthy. Juniper takes this as a compliment to the tree.',
    },
    choices: [
      {
        id: 'listen',
        label:
          'Lie down in the duff beside her and wait for the tree to finish',
        success: {
          text: 'You lie there long enough for the stars to rearrange themselves. The tree says nothing you could write down. Juniper laughs softly when it is over, as if it told a good joke. You get up with needles in your hair and a heartbeat slow enough to hear.',
          effects: { nerve: 1, flag: 'bond_juniper_time_listen' },
        },
      },
      {
        id: 'hikers',
        label:
          'Help the night hikers clear the trail and broker a truce with the raccoon',
        success: {
          text: 'The raccoon accepts half the chips and full custody of the bag. The hikers turn out to be a retired schoolteacher and her grandson, and by the time the trail is clean they have invited Juniper on their Sunday walks. She pretends to consider it and says yes before the sentence ends.',
          effects: { flag: 'bond_juniper_time_trail' },
        },
      },
      {
        id: COMPANION_TIME_DECLINE,
        label: 'Tell her you are too wired to lie still tonight',
        success: {
          text: '“That is fair,” Juniper says, without opening her eyes. “The tree will finish without us. It is used to that.” She means it kindly, and you take the long way back to the road.',
          effects: {},
        },
      },
    ],
    provenance:
      'Fictional grove scene, hikers and dialogue; no claim about a specific tree, trail or supernatural event.',
  },
  cedar: {
    id: 'CT-CEDAR-01',
    kind: 'encounter',
    chapter: 3,
    place: 'A pullout above the Eel River',
    title: 'Supper on the Tailgate',
    scene: 'highway',
    body: [
      'Cedar has the tailgate down and a foil pan balanced on the cooler. “Folks sent leftovers,” he says. “Mom made it, Dad corrected it. They have argued about the salt for twenty-six years and both versions are in here. Left side is hers.” The CB on the dash murmurs truckers’ handles up and down the 101.',
      'Over the ridge, a light moves in a slow, smug zigzag. “That one is a satellite, a drone or my uncle,” Cedar says. “I have theories about all three.” He hands you a fork and leaves the passenger door open, in case you would rather sit in the warm.',
    ],
    leadLines: {
      mara: 'Mara eats from the left side of the pan only, on principle, and declines to say which principle.',
      kit: 'Kit climbs onto the cab roof for a better look at the zigzag light and narrates it like a sports announcer.',
      juniper:
        'Juniper eats from both sides of the pan and announces that the marriage is clearly working.',
    },
    choices: [
      {
        id: 'radio',
        label:
          'Get on the CB and let him teach you the handles of the night’s truckers',
        success: {
          text: 'By the end of the hour you have a handle of your own, three truckers who will vouch for you and a standing invitation to a diner in Garberville. Cedar is prouder of your radio manners than you are. Up and down the highway, somebody now asks after you by name.',
          effects: { flag: 'bond_cedar_time_radio' },
        },
      },
      {
        id: 'stars',
        label: 'Lie in the truck bed and let him explain which lights are real',
        success: {
          text: 'He knows every satellite by name and two he swears are on no list. You argue about the uncle theory until neither of you can finish a sentence. When the zigzag light finally slips behind the ridge, Cedar waves at it, just in case.',
          effects: { nerve: 1, flag: 'bond_cedar_time_stars' },
        },
      },
      {
        id: COMPANION_TIME_DECLINE,
        label: 'Thank him, take a plate to go and call it a night',
        success: {
          text: 'Cedar packs you a plate with both sides of the pan on it, carefully, so neither parent wins. “Don’t tell me which side was better,” he says. “I have to live with them.” Both sides are good.',
          effects: {},
        },
      },
    ],
    provenance:
      'Fictional supper, CB conversation and family in a real Humboldt setting. Cedar’s parents are invented and, per canon, still together.',
  },
}

/** Every flag a free hour can leave, mapped to the guide it belongs to. */
export const COMPANION_TIME_FLAGS: Record<string, CompanionId> =
  Object.fromEntries(
    (Object.entries(COMPANION_TIME) as [CompanionId, EncounterCard][]).flatMap(
      ([id, card]) =>
        card.choices.flatMap((choice) =>
          choice.success.effects.flag
            ? [[choice.success.effects.flag, id] as const]
            : [],
        ),
    ),
  )

/** Guides the player chose to spend a free hour with, in meeting order. */
export function companionTimeSpent(
  flags: readonly string[],
  order: readonly CompanionId[],
): CompanionId[] {
  const spent = new Set(
    flags
      .map((flag) => COMPANION_TIME_FLAGS[flag])
      .filter((id): id is CompanionId => Boolean(id)),
  )
  return order.filter(
    (id, index) => spent.has(id) && order.indexOf(id) === index,
  )
}
