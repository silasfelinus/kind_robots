import type { LegacyPowerId } from './specialPowers'
import { CAMPAIGN_VILLAINS, type VillainPlan } from './campaign'

/** First-week foreshadowing for each mastermind. Omens are spoiler-safe city
 * broadcasts; the interference is a real night effect on days 5-7 that jams
 * one power field until the player names the right mastermind. */
export type VillainSigns = {
  id: string
  /** Days 2, 3, 4, 6 and 7: what an attentive student notices in town. */
  omens: Record<2 | 3 | 4 | 6 | 7, string>
  interference: {
    jams: LegacyPowerId
    /** Shown on the night board for days 5-7 while the interference holds. */
    text: string
    /** Shown once the player has named the right mastermind. */
    broken: string
  }
}

export const OMEN_DAYS = [2, 3, 4, 6, 7] as const
export const INTERFERENCE_DAYS = [5, 6, 7] as const
/** Naming a suspect opens after the midweek interference and closes when the
 * day-15 dossier reveals the mastermind to everyone. */
export const ACCUSATION_WINDOW = { first: 5, last: 14 } as const

export const VILLAIN_SIGNS: readonly VillainSigns[] = [
  {
    id: 'the-architect',
    omens: {
      2: 'A street mural of the prom lights has been repainted overnight with twelve sharp points.',
      3: 'Shield-grid inspectors measure the ballroom ceiling and refuse to say why.',
      4: 'Bus shelters downtown cast prism-shaped shadows at noon, although the sun is not behind them.',
      6: 'A tower crane outside the academy turns a slow quarter-circle every hour, like a compass needle.',
      7: 'Glaziers are booked solid all week. Nobody will say who paid for the glass.',
    },
    interference: {
      jams: 'kinetic',
      text: 'A warped shield lens hangs over the city tonight. Every kinetic shield bends a few degrees off true.',
      broken:
        'You named the Glass Architect. Engineers re-angle the grid and kinetic shields hold true again.',
    },
  },
  {
    id: 'the-registrar',
    omens: {
      2: 'The rescue honor roll in the lobby lists a graduate nobody in the senior class has ever met.',
      3: 'Two students receive diplomas in the mail, for degrees they have not finished.',
      4: 'An archive clerk says three enrollment files rewrote themselves while she watched.',
      6: 'The city directory goes quiet for an hour. Every powered resident shows up as unregistered.',
      7: 'Your own student card blinks NULL at the cafeteria scanner, then works on the second swipe.',
    },
    interference: {
      jams: 'technopathy',
      text: 'A suppression signal hides inside the registry tonight. Machines stop answering anyone with powers.',
      broken:
        'You named the Null Registrar. Sol patches the registry and machines answer again.',
    },
  },
  {
    id: 'the-tidemaker',
    omens: {
      2: 'Brass dials replace two more harbor flood markers. The old painted lines have been sanded off.',
      3: 'The waterfront market receives eviction warnings "for their own safety" from an unnamed trust.',
      4: 'High tide comes forty minutes early, and only on the east side of the harbor.',
      6: 'Insurance flyers advertise flood relief for a flood that has not happened yet.',
      7: 'Storm drains on Pier Street run backward for a full minute at dusk.',
    },
    interference: {
      jams: 'elemental',
      text: 'The harbor tide is being pulled from somewhere offshore. Weather powers answer late and sideways.',
      broken:
        'You named the Tidemaker. The harbor crews seize a rogue pump and the weather answers on time.',
    },
  },
  {
    id: 'the-eclipse',
    omens: {
      2: 'The school band rehearses a chord nobody wrote. The conductor swears it was not on the sheet.',
      3: 'Emergency radios play four bars of a waltz before every weather report.',
      4: 'Shield operators hum the same tune on their breaks and cannot say where they heard it.',
      6: 'A busker plays the waltz backward in the transit tunnel and three commuters wake up crying.',
      7: 'The prom committee is offered a free orchestra by a sponsor who never gives a name.',
    },
    interference: {
      jams: 'empathy',
      text: 'A false lullaby runs under every emergency broadcast. Empaths hear the song instead of the people.',
      broken:
        'You named the Eclipse Choir. Imani teaches the radio crews to sing over the false note, and empaths hear clearly again.',
    },
  },
  {
    id: 'the-mercy',
    omens: {
      2: 'Free medkits arrive at the infirmary with a flower stamped on every seal.',
      3: 'A volunteer clinic reports patients who healed overnight and cannot remember the treatment.',
      4: 'Bandages in the gym first-aid box move very slightly when nobody touches them.',
      6: 'Hospital staff receive a memo: consent forms are now "optional for emergency wellness".',
      7: 'Kit finds a flower-shaped capsule in a donated jacket and asks you not to touch it bare-handed.',
    },
    interference: {
      jams: 'biotech',
      text: 'Nanite reservoirs in donated medkits wake up tonight. Healing powers fight the swarm instead of the injury.',
      broken:
        'You named the Mercy Circuit. The infirmary quarantines the flower kits and healing works cleanly again.',
    },
  },
  {
    id: 'the-mirror',
    omens: {
      2: 'Two witnesses swear you were in two different places at lunch. Both are certain.',
      3: 'The security footage from the library shows a rescue that the librarian says never happened.',
      4: 'A councillor gives a speech about a fire that the fire crews never answered.',
      6: 'Mirrored panels go up on the shield towers "for efficiency". They face inward.',
      7: 'Your own memory of Tuesday has a second version. Only one of them has rain in it.',
    },
    interference: {
      jams: 'spatial',
      text: 'Mirrored towers bounce false routes across the city tonight. Portal anchors land one street off.',
      broken:
        'You named the Mirror Chancellor. The towers are turned outward and portal anchors land where they should.',
    },
  },
  {
    id: 'the-orchard',
    omens: {
      2: 'A sapling has split the sidewalk outside the shield repeater on Grove Street. It was not there yesterday.',
      3: 'The botanical conservatory reports a missing seed vault and a very calm night guard.',
      4: 'Pollen drifts through the academy halls in a straight line toward the greenhouse.',
      6: 'Roots crack the transit platform tiles in a perfect circle around a signal box.',
      7: 'Every potted plant in the dean office now faces the same direction.',
    },
    interference: {
      jams: 'elemental',
      text: 'A spore haze rises from the greenhouse network tonight. Wind and weather work tangle in living roots.',
      broken:
        'You named the Orchard Engine. Gardeners seal the spore vents and the weather answers cleanly again.',
    },
  },
  {
    id: 'the-static',
    omens: {
      2: 'Your phone drops a quarter-second of every call. So does everyone else on campus.',
      3: 'A distress call from the harbor arrives a full minute after the caller hung up.',
      4: 'The emergency frequency plays a recorded evacuation drill nobody scheduled.',
      6: 'Independent rescue crews lose their radio licenses "pending review".',
      7: 'Jo Mercer broadcasts the missing quarter-second, slowed down. It is someone breathing.',
    },
    interference: {
      jams: 'technopathy',
      text: 'A quarter-second gap is cut into every distress signal tonight. Machines miss the calls that matter.',
      broken:
        'You named the Static Commissioner. Independent operators reclaim the frequency and the calls come through again.',
    },
  },
]

export function villainSignsFor(id: string | undefined): VillainSigns | null {
  return VILLAIN_SIGNS.find((signs) => signs.id === id) ?? null
}

/** The broadcast an attentive student hears today, or null on a quiet day. */
export function villainOmenFor(
  villain: VillainPlan,
  day: number,
): string | null {
  const signs = villainSignsFor(villain.id)
  return signs?.omens[day as keyof VillainSigns['omens']] ?? null
}

export function villainNameById(id: string): string {
  return CAMPAIGN_VILLAINS.find((villain) => villain.id === id)?.name ?? id
}
