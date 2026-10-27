import type { Incident } from './rules'

// Six more night calls for the thirty-day run (conductor comet-city-academy
// t-020). Runs started with incidentDeckVersion 2 draw from all twelve; older
// saves keep the original six-card rotation, so no assignment ever points at
// a case its night no longer offers. Each new call pairs with the original
// case at the same position and asks for a different power.

export const LATE_INCIDENTS: Incident[] = [
  {
    id: 'ferris',
    title: 'The Stalled Pier Wheel',
    site: 'Comet Pier',
    briefing:
      'A holographic Ferris wheel stops with its top car swinging in a gale. The simulation insists the riders are mannequins. One of them is holding a ring box.',
    need: 'kinetic',
    risk: 3,
    allegiance: 'hero',
    art: 'A storm-lit harbor Ferris wheel stalled with one car swinging at the top.',
  },
  {
    id: 'blackout',
    title: 'The Hospital Blackout',
    site: 'Civic Hospital Substation',
    briefing:
      'A simulated hospital loses power. The scenario offers you a generator with its serial numbers filed off and waits to see whether you ask where it came from.',
    need: 'elemental',
    risk: 4,
    allegiance: 'villain',
    art: 'A dark hospital ward lit by emergency lamps while ventilators run on batteries.',
  },
  {
    id: 'quarry',
    title: 'Cave-In on the Quarry Line',
    site: 'Old Quarry Line',
    briefing:
      'A training tunnel collapses around four holographic workers. The scenario clock stops on day six, and nobody on the faculty will say why.',
    need: 'spatial',
    risk: 4,
    allegiance: 'shared',
    art: 'A collapsed subway tunnel lit by headlamps, a rescue shaft cut through broken rock.',
  },
  {
    id: 'rally',
    title: "The Crush at Founders' Square",
    site: "Founders' Square",
    briefing:
      'A simulated victory rally panics when a famous hero lands too hard. The scenario grades crowd flow, and quietly grades whom you blame.',
    need: 'empathy',
    risk: 3,
    allegiance: 'hero',
    art: 'A packed square under falling confetti, a cracked landing crater and a surging crowd.',
  },
  {
    id: 'refinery',
    title: 'Smoke Over the East Side',
    site: 'East Side Refinery',
    briefing:
      'A training refinery leaks a cloud its sensors cannot see. The hidden objective is to learn who switched off the alarms.',
    need: 'biotech',
    risk: 4,
    allegiance: 'rogue',
    art: 'A refinery venting yellow smoke over row houses at night while its sensor masts stay dark.',
  },
  {
    id: 'vault',
    title: 'The Bank That Asked for Heroes',
    site: 'Harbor Trust Bank',
    briefing:
      'A simulated bank robbery: the robbers wear decommissioned academy training armor. The scenario never explains where they got it.',
    need: 'technopathy',
    risk: 3,
    allegiance: 'rogue',
    art: 'A marble bank lobby in lockdown, robbers in battered training armor and hostages on the floor.',
  },
]
