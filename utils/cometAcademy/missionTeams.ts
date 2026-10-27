import type { StudentId } from './rules'

export type HeroMood = 'positive' | 'neutral' | 'negative'
export type HeroReaction = { mood: HeroMood; line: string }

const PERSONAL_RESPONSES: Record<StudentId, Record<string, HeroReaction>> = {
  mina: {
    monorail: {
      mood: 'positive',
      line: "I'm not leaving passengers in that train.",
    },
    museum: {
      mood: 'neutral',
      line: 'I want the museum guests safe, whatever the sponsor wants.',
    },
    flood: {
      mood: 'positive',
      line: 'We can save the lower market if we move now.',
    },
    garden: {
      mood: 'positive',
      line: "The vine's fear matters as much as ours.",
    },
    broadcast: {
      mood: 'neutral',
      line: 'An accurate warning needs a safe route.',
    },
    skybridge: {
      mood: 'positive',
      line: 'The cleaners have names. I know them.',
    },
  },
  sol: {
    monorail: {
      mood: 'positive',
      line: 'That train was hacked. I want the logs.',
    },
    museum: { mood: 'negative', line: "A robbery isn't a graduation project." },
    flood: { mood: 'neutral', line: 'Give me the seawall control map.' },
    garden: { mood: 'neutral', line: "I'll isolate the spore sensors." },
    broadcast: {
      mood: 'positive',
      line: 'Someone is lying on those airwaves.',
    },
    skybridge: {
      mood: 'positive',
      line: "The bridge's maintenance records were altered.",
    },
  },
  imani: {
    monorail: {
      mood: 'positive',
      line: 'Talk to the people inside before cutting power.',
    },
    museum: {
      mood: 'negative',
      line: 'The gala guests did not consent to your theft.',
    },
    flood: {
      mood: 'positive',
      line: 'Ask the vendors what they need to carry.',
    },
    garden: {
      mood: 'positive',
      line: 'The greenhouse is a frightened living thing.',
    },
    broadcast: {
      mood: 'positive',
      line: 'Panic is not an excuse to hoard the truth.',
    },
    skybridge: {
      mood: 'positive',
      line: 'The cleaners must direct their own rescue.',
    },
  },
  ash: {
    monorail: { mood: 'neutral', line: 'Check the real wind loads first.' },
    museum: { mood: 'neutral', line: 'That glass will shatter if we rush.' },
    flood: {
      mood: 'positive',
      line: 'Weather and tidal pressure are my specialty.',
    },
    garden: { mood: 'positive', line: 'Roots and rain share a language.' },
    broadcast: { mood: 'neutral', line: 'The forecast needs sources.' },
    skybridge: {
      mood: 'positive',
      line: 'Nobody listened when maintenance reported this.',
    },
  },
  nix: {
    monorail: {
      mood: 'positive',
      line: 'I can open a safe exit by the last carriage.',
    },
    museum: {
      mood: 'positive',
      line: "I've slipped through stricter security.",
    },
    flood: {
      mood: 'neutral',
      line: 'The portal current is wrong near the seawall.',
    },
    garden: {
      mood: 'negative',
      line: 'Trapping a living thing feels too familiar.',
    },
    broadcast: {
      mood: 'positive',
      line: 'Evacuation corridors are what I do.',
    },
    skybridge: {
      mood: 'positive',
      line: 'There is still an anchor point across the gap.',
    },
  },
  kit: {
    monorail: { mood: 'positive', line: 'I can keep the injured stable.' },
    museum: { mood: 'negative', line: 'If this is a theft, count me out.' },
    flood: { mood: 'positive', line: 'The market pharmacy must be protected.' },
    garden: {
      mood: 'positive',
      line: 'Nobody burns an organism before we understand it.',
    },
    broadcast: { mood: 'neutral', line: 'I can staff the emergency clinic.' },
    skybridge: {
      mood: 'positive',
      line: 'Medical supplies to the bridge, now.',
    },
  },
  veda: {
    monorail: {
      mood: 'positive',
      line: "I've survived this kind of stunt without a harness.",
    },
    museum: {
      mood: 'positive',
      line: 'Finally a challenge worthy of the training hall.',
    },
    flood: {
      mood: 'neutral',
      line: 'Someone wants a celebrity rescue. Be careful.',
    },
    garden: {
      mood: 'negative',
      line: 'I will not perform for a corporate lab.',
    },
    broadcast: {
      mood: 'neutral',
      line: 'Give me a camera and a fact-checker.',
    },
    skybridge: {
      mood: 'positive',
      line: 'I know how to rig a safe crossing under pressure.',
    },
  },
  mara: {
    monorail: {
      mood: 'positive',
      line: "The conductor is a union member. I'm going.",
    },
    museum: {
      mood: 'negative',
      line: "Don't make security guards your disposable extras.",
    },
    flood: { mood: 'positive', line: 'The vendors are my neighbors.' },
    garden: {
      mood: 'neutral',
      line: 'If the fire lane closes, shift workers get hurt.',
    },
    broadcast: {
      mood: 'positive',
      line: 'I know the neighborhoods the broadcast overlooks.',
    },
    skybridge: {
      mood: 'positive',
      line: 'Those cleaners deserve names and hazard pay.',
    },
  },
  drift: {
    monorail: { mood: 'neutral', line: 'The machines sound frightened.' },
    museum: {
      mood: 'negative',
      line: 'Another institution keeping property in cages.',
    },
    flood: {
      mood: 'positive',
      line: 'Contaminated water can hurt people like me.',
    },
    garden: {
      mood: 'positive',
      line: "I was grown in a lab too. Don't destroy it.",
    },
    broadcast: {
      mood: 'negative',
      line: 'A broadcaster wants to classify us as threats.',
    },
    skybridge: {
      mood: 'neutral',
      line: 'I can adapt tissue to keep people breathing.',
    },
  },
  tessel: {
    monorail: {
      mood: 'positive',
      line: 'I can fold the route outside the tracks.',
    },
    museum: {
      mood: 'neutral',
      line: "Museum security isn't designed for other dimensions.",
    },
    flood: {
      mood: 'positive',
      line: "I've crossed worse tides between worlds.",
    },
    garden: {
      mood: 'positive',
      line: 'That vine may have grown through the gate.',
    },
    broadcast: {
      mood: 'neutral',
      line: 'I hear two futures in the broadcast.',
    },
    skybridge: {
      mood: 'positive',
      line: 'A bridge is simply a promise between shores.',
    },
  },
  jo: {
    monorail: { mood: 'positive', line: "I'll put the dispatch logs on air." },
    museum: {
      mood: 'positive',
      line: 'This reeks of a donor laundering stolen goods.',
    },
    flood: {
      mood: 'positive',
      line: 'The city deserves to know who diverted the seawall.',
    },
    garden: { mood: 'neutral', line: 'Get the lab director on record first.' },
    broadcast: {
      mood: 'positive',
      line: 'This is my broadcast. I can correct it.',
    },
    skybridge: {
      mood: 'positive',
      line: 'My audience knows the workers inside.',
    },
  },
  lark: {
    monorail: { mood: 'positive', line: 'I have emergency beds ready.' },
    museum: {
      mood: 'negative',
      line: "I won't be hired to hurt museum staff.",
    },
    flood: {
      mood: 'positive',
      line: 'Bring the medicine first; money can be replaced.',
    },
    garden: {
      mood: 'positive',
      line: 'Treat the botanist and the roots with care.',
    },
    broadcast: {
      mood: 'positive',
      line: 'Let me check the evacuation instructions.',
    },
    skybridge: {
      mood: 'positive',
      line: 'Those cleaners need triage, not a photo opportunity.',
    },
  },
}

export function missionReaction(
  person: StudentId,
  mission: string,
): HeroReaction {
  return (
    PERSONAL_RESPONSES[person]?.[mission] ?? {
      mood: 'neutral',
      line: 'I need the briefing before I can commit.',
    }
  )
}

export type RouteUnlock = { label: string; result: string; boost: number }
const ROUTES: Record<string, { people: StudentId[]; route: RouteUnlock }[]> = {
  monorail: [
    {
      people: ['mara', 'sol'],
      route: {
        label: 'The Union Override',
        result:
          'Mara secures the transit workers’ trust while Sol patches the corrupt routing. A union-built emergency route opens beyond the academy network.',
        boost: 2,
      },
    },
    {
      people: ['nix'],
      route: {
        label: 'The Impossible Platform',
        result:
          'Nix opens a temporary platform in folded space and returns with the conductor’s handwritten manifest.',
        boost: 1,
      },
    },
  ],
  museum: [
    {
      people: ['jo', 'veda'],
      route: {
        label: 'The Live Exhibition',
        result:
          'Jo broadcasts the theft while Veda stages a decoy performance. The buyer exposes their financier in public.',
        boost: 2,
      },
    },
    {
      people: ['sol'],
      route: {
        label: 'A Copy Without a Theft',
        result:
          'Sol duplicates the access key without removing the original, preserving the conservator’s trust.',
        boost: 1,
      },
    },
  ],
  flood: [
    {
      people: ['mara', 'ash'],
      route: {
        label: 'The Workers’ Seawall',
        result:
          'Mara mobilizes dock crews while Ash redirects the surge. Residents control which buildings are protected.',
        boost: 2,
      },
    },
    {
      people: ['tessel'],
      route: {
        label: 'A Tide in Two Worlds',
        result:
          'Tessel diverts a fraction of the wave through a temporary dimensional estuary, revealing an abandoned city beyond.',
        boost: 1,
      },
    },
  ],
  garden: [
    {
      people: ['drift', 'kit'],
      route: {
        label: 'The Living Negotiation',
        result:
          'DRIFT-9 shares the research lab’s language with Kit, and the terrified vines release their captive without extermination.',
        boost: 2,
      },
    },
    {
      people: ['imani'],
      route: {
        label: 'An Unheard Witness',
        result:
          'Imani speaks for the frightened botanist and persuades the institute to pause its incinerators.',
        boost: 1,
      },
    },
  ],
  broadcast: [
    {
      people: ['jo', 'imani'],
      route: {
        label: 'The People’s Emergency Frequency',
        result:
          'Jo supplies uncensored evidence while Imani hosts a civilian-led response; the false alert loses its audience.',
        boost: 2,
      },
    },
    {
      people: ['sol'],
      route: {
        label: 'The Unedited Source',
        result:
          'Sol reconstructs the source transmission and tags the altered portions without suppressing the warning.',
        boost: 1,
      },
    },
  ],
  skybridge: [
    {
      people: ['veda', 'mara'],
      route: {
        label: 'The Stunt Crew Strike',
        result:
          'Veda rigs a temporary crossing as Mara recruits union riggers. The cleaners later demand and win a public inquiry.',
        boost: 2,
      },
    },
    {
      people: ['lark'],
      route: {
        label: 'The Night-Shift Corridor',
        result:
          'Lark opens the old hospital stairwell and creates a triage corridor the academy did not know existed.',
        boost: 1,
      },
    },
  ],
}

export function missionRoute(
  mission: string,
  team: readonly StudentId[],
): RouteUnlock | null {
  return (
    ROUTES[mission]?.find((entry) =>
      entry.people.every((id) => team.includes(id)),
    )?.route ?? null
  )
}

export const missionRouteRoster = (mission: string): readonly StudentId[][] =>
  ROUTES[mission]?.map((entry) => entry.people) ?? []

export function reactionSuitability(mood: HeroMood): number {
  return mood === 'positive' ? 1 : mood === 'negative' ? -1 : 0
}
