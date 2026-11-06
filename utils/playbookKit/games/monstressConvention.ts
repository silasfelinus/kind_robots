import type { PlaybookKitSpec } from '../types'

export const MONSTRESS_CONVENTION: PlaybookKitSpec = {
  id: 'monstress-convention',
  conductorSlug: 'monstress-convention',
  title: 'Monstrique',
  tagline: "Everybody's a monster. Somebody's a murderer.",
  premise:
    'In Midnight City, the agent behind MONSTRIQUE has been murdered at a seedy motel, and her ghost hires the city’s most squeamish blogger to find out who did it. You are his assistant. You touch everything.',
  tier: 'vignette',
  route: '/admin/monstrique',
  keyArt: {
    brief:
      'A neon, rain-soaked two-storey Last Call Motor Lodge in Midnight City, ice machine glowing, two ghost women in the Room 205 window and a MONSTRIQUE: REAWAKENED billboard',
    alt: 'Last Call Motor Lodge under a Monstrique billboard',
  },
  acts: [
    {
      id: 1,
      title: 'The Last Call',
      blurb:
        'Your client is dead. Work the motel, satisfy two ghosts and earn a lead into sixty years of Monstrique.',
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
        'Assistant, photographer and the only pair of hands at The Unwashed Truth. Flirts with anyone who stands still.',
      portrait: {
        brief:
          'Charming resourceful grown woman photojournalist with camera, practical coat and sharp expression, illustrated retro adventure-game portrait',
      },
    },
    {
      id: 'nico',
      name: 'Norbert “Norb” Vale',
      role: 'figure',
      tagline:
        'Midnight City’s premiere blogger: four foot eleven, double-gloved, all about the case. Always says no.',
      portrait: {
        brief:
          'Very SHORT genuinely ugly geeky comic figure: enormous bulbous nose, buck teeth, tiny hunched torso, scrawny limbs, thick round glasses, nervous bulging eyes, crooked cardigan, rubber gloves and handkerchief. Cartoon caricature, decidedly NOT suave, handsome, muscular or romantic. An original absurd mystery-game sidekick.',
      },
    },
    {
      id: 'odette',
      name: 'Odette Harker',
      role: 'figure',
      tagline:
        'The agent who built Monstrique. Murdered, furious and now your client.',
      portrait: {
        brief:
          'Spectral woman talent agent with stern glamorous appearance, elegant evening outfit, expressive theatrical noir ghost portrait',
      },
    },
    {
      id: 'violet',
      name: 'Violet Wisp',
      role: 'figure',
      tagline:
        'Hired for one night as a vampire, now haunting Room 205 with her client forever. The sharpest witness in the room.',
      romance: {
        arc: 'A working woman stuck in the afterlife with an unpaid bill. Square her night and she may square yours.',
        moments: ['cold-kiss'],
      },
      portrait: {
        brief:
          'Adult woman ghost with lavender aura in a rented satin vampire cape and plastic fangs, wry observant face, glamorous pin-up noir portrait',
      },
    },
    {
      id: 'unknown-killer',
      name: 'The Hidden Hand',
      role: 'villain',
      primary: true,
      tagline: 'One ornamental blade, two deaths, too many contracts.',
      portrait: {
        brief:
          'Unidentifiable silhouetted hand holding an elaborate jewel-handled stage knife outside motel room, no graphic violence',
      },
    },
  ],
  reveals: [
    {
      id: 'ghost-accounts',
      title: 'Two Ghosts, Two Stories',
      teaser:
        'An agent remembers contracts; her companion remembers the sounds.',
      text: 'Odette and Violet have different evidence and neither knows who killed them.',
      act: 1,
      about: ['odette', 'violet'],
    },
  ],
  endings: [
    {
      id: 'lead-earned',
      title: 'The Convention Lead',
      tone: 'hopeful',
      summary:
        'Iris and Norb trace the knife to a 1964 Beach Hex prop and follow it to the convention.',
      hint: 'Document the knife, establish the time, clear the stalker and ask both ghosts.',
      about: ['iris', 'nico', 'odette', 'violet'],
      art: {
        brief:
          'Iris and tiny gloved Norb under a Six Decades of Screams banner outside the convention hall, neon noir comedy illustration',
      },
    },
    {
      id: 'reckless',
      title: 'A Headline Too Early',
      tone: 'dark',
      summary:
        'An unverified headline hurts people before the true case can be solved.',
      hint: 'Both ghost accounts are essential, but neither alone proves a culprit.',
      about: ['iris', 'nico'],
      art: {
        brief:
          'A hasty tabloid blog headline on motel computer, Iris concerned, Norb recoiling in dismay, noir retro game',
      },
    },
  ],
  moments: [
    {
      id: 'double-murder',
      title: 'Two Women in Room 205',
      caption:
        'Iris finds two murder victims and one unusual ceremonial-looking knife.',
      kind: 'scene',
      act: 1,
      about: ['odette', 'violet', 'unknown-killer'],
      art: {
        brief:
          'Respectful noir aftermath of a double murder in dim motel room, mostly obscured body silhouettes and ornate knife as evidence, no gore',
      },
    },
    {
      id: 'dead-client',
      title: 'Your New Client',
      caption: 'Odette hires Norb from beyond the grave and pays in blackmail.',
      kind: 'scene',
      act: 1,
      about: ['odette', 'nico'],
      art: {
        brief:
          'Glamorous silver-blue ghost agent waving a contract at a tiny gloved germophobe blogger recoiling behind his tall assistant, seedy motel room, comic noir',
      },
    },
    {
      id: 'rental-fangs',
      title: 'Forty-Dollar Fangs',
      caption: 'Iris digs Violet’s rental fangs out of the ice machine.',
      kind: 'scene',
      act: 1,
      about: ['iris', 'violet'],
      art: {
        brief:
          'Iris elbow-deep in a glowing motel ice machine holding up plastic vampire fangs, a horrified tiny man in gloves behind her, neon comedy',
      },
    },
    {
      id: 'cold-kiss',
      title: 'A Cold Kiss',
      caption:
        'Fangs back, fee paid. Violet says thank you the way only a ghost can.',
      kind: 'romance',
      act: 1,
      about: ['iris', 'violet'],
      art: {
        brief:
          'Tasteful pin-up: a lavender ghost woman in a vampire cape kissing Iris, frost blooming on the mirror, Norb visible in the hallway facing the wall, non-explicit',
      },
    },
    {
      id: 'two-ghosts',
      title: 'The Other Two Witnesses',
      caption:
        'Odette and Violet return as distinct ghosts who heard different things.',
      kind: 'scene',
      act: 1,
      about: ['odette', 'violet'],
      art: {
        brief:
          'Two expressive spectral adult women, one agent and one observant companion, appear in a gloomy motel room mirror, playful supernatural mystery',
      },
    },
  ],
  trailer: {
    tagline: 'Two murders, two ghosts, a franchise convention across town.',
    beats: [],
  },
}
