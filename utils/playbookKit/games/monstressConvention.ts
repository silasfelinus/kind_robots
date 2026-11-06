import type { PlaybookKitSpec } from '../types'

export const MONSTRESS_CONVENTION: PlaybookKitSpec = {
  id: 'monstress-convention',
  conductorSlug: 'monstress-convention',
  title: 'Monstress Convention',
  tagline: "Everybody's a monster. Somebody's a murderer.",
  premise:
    'Can two broke investigators find the truth behind a monster-film convention murder without destroying the people they interview?',
  tier: 'vignette',
  route: '/admin/monstress-convention',
  keyArt: {
    brief:
      'Rainy two-storey worn convention hotel with hot pink neon marquee, warm lobby windows, steam rising from rear courtyard, silhouettes of eccentric grown-up monster actresses',
    alt: 'Grand Gloaming Hotel lit by pink neon in a rainy night',
  },
  acts: [
    {
      id: 1,
      title: 'Check In, Check Out',
      blurb:
        'Get through the convention doors and investigate a locked-room death.',
    },
  ],
  meters: [{ id: 'leads', label: 'Leads', min: 0, max: 10, start: 0 }],
  factions: [],
  cast: [
    {
      id: 'iris',
      name: 'Iris Quill',
      role: 'follower',
      tagline:
        'Photojournalist. The sharper half of a two-person news operation.',
      portrait: {
        brief:
          'Adult photojournalist with cropped curly hair, practical leather jacket, sharp expression, camera strap and heavy reporter notebook, warm noir cartoon portrait',
      },
    },
    {
      id: 'celestine',
      name: 'Celestine Veil',
      role: 'figure',
      tagline:
        'Franchise icon. A difficult witness to interview after her death.',
      portrait: {
        brief:
          'Elegant adult classic horror actress in a flowing vintage silver screen robe, spectral mirror reflection and theatrical poised expression',
      },
    },
    {
      id: 'unknown-killer',
      name: 'The Hidden Hand',
      role: 'villain',
      primary: true,
      tagline:
        'Someone inside the hotel knows more about a murdered star than they admit.',
      portrait: {
        brief:
          'Gloved hand holding a hotel master key beside a half-open hotel service door, eerie warm corridor light, cropped mystery silhouette',
      },
    },
  ],
  reveals: [
    {
      id: 'service-route',
      title: 'The service route',
      teaser:
        'The locked suite did not belong to the only path through the hotel.',
      text: 'A second bell from the laundry lift proves someone moved through the service stairs during the blackout.',
      act: 1,
      about: ['unknown-killer', 'celestine'],
    },
  ],
  endings: [
    {
      id: 'responsible',
      title: 'An Honest First Edition',
      tone: 'hopeful',
      summary:
        'A careful bulletin clears the wrong suspect and preserves the case.',
      hint: 'A witness, a clock and a very uncomfortable correction.',
      about: ['iris', 'unknown-killer'],
      art: {
        brief:
          'Two journalists at a battered motel desk illuminated by a typewriter lamp, a rain-streaked window behind them, carefully prepared newspaper proof',
      },
    },
    {
      id: 'reckless',
      title: 'A Headline Too Early',
      tone: 'dark',
      summary:
        'The blog gains clicks by printing a story before the evidence is ready.',
      hint: 'Sometimes the deadline is not the real enemy.',
      about: ['iris', 'unknown-killer'],
      art: {
        brief:
          'A battered laptop flashing an irresponsible news headline in a dark hotel office, two tense journalists standing behind it, gloomy red light',
      },
    },
  ],
  moments: [
    {
      id: 'panel-blackout',
      title: 'Lights Out',
      caption: 'The panel ends with a scream from the upper floor.',
      kind: 'scene',
      act: 1,
      about: ['celestine', 'unknown-killer'],
      art: {
        brief:
          'A crowded, shabby retro monster-movie convention ballroom suddenly plunged into darkness, one sharp silhouette against the emergency exit',
      },
    },
    {
      id: 'mirror-witness',
      title: 'The Other Side of the Mirror',
      caption: 'The murder victim is a very opinionated ghost.',
      kind: 'scene',
      act: 1,
      about: ['celestine', 'iris'],
      art: {
        brief:
          'A fogging bathroom mirror in a seedy hotel suite reflecting an elegant adult ghost actress, two reporters in the foreground with camera and notepad',
      },
    },
  ],
  trailer: {
    tagline: 'One convention. One murder. Two very different interview styles.',
    beats: [],
  },
}
