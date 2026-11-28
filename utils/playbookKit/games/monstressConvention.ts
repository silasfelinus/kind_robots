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
    {
      id: 2,
      title: 'Beach Hex',
      blurb:
        'The knife says Starlite Pictures, 1964. Run an old reel, read an unpaid invoice and find the face scratched off a sleeve.',
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
        src: '/monstress-convention/endings/lead-earned.webp',
        alt: 'Iris photographs a glittering convention display of monster starlets while Norb holds up the bagged Beach Hex prop dagger, a beach towel under his arm.',
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
        src: '/monstress-convention/endings/reckless.webp',
        alt: 'Norb hunches at a glowing motel computer while Iris covers her mouth and an angry crowd with flashlights gathers outside the rainy window.',
      },
    },
    {
      id: 'fifth-hexblade',
      title: 'The Fifth Hexblade',
      tone: 'secret',
      summary:
        'The full file: the lobby shrine is missing a knife, and the vanished ice bucket points to someone who still wears a stage face.',
      hint: 'The motel keeps a few secrets after the lead is filed. Count what is missing before you leave for the convention.',
      about: ['iris', 'nico', 'violet', 'unknown-killer'],
      art: {
        brief:
          'Iris pins the last photo to a motel-room cork board while tiny gloved Norb points at a chalk outline of a fifth jewelled dagger, red string running from the shrine, bucket and fangs photos, neon noir comedy',
        alt: 'Iris pins the last photo to a cork board of motel clues while Norb, at arm’s length with a pointer, taps a chalk outline of a fifth jewelled dagger.',
      },
    },
    {
      id: 'five-knives',
      title: 'I Made Five Knives',
      tone: 'secret',
      summary:
        'Chapter Two: the reel, the invoice and the scratched sleeve bring Francesca Stein to admit she made five Hexblades, and only four were ever photographed.',
      hint: 'Chapter Two. Prove the stitched woman was there, then ask her what she made.',
      about: ['iris', 'nico'],
      art: {
        brief:
          'A stitched scientist actress with a lightning-streaked beehive holds up an empty velvet case with five dagger-shaped hollows between two crackling Tesla coils, Iris with her camera and tiny gloved Norb peeking from behind a tin robot costume, neon noir comedy',
        alt: 'Francesca Stein holds an empty five-slot knife case between two Tesla coils while Iris listens and Norb hides behind a tin robot costume.',
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
    {
      id: 'midnight-matinee',
      title: 'Midnight Matinee',
      caption:
        'Clem threads the 1964 reel and the Starlite screen shows the day they cut Francesca.',
      kind: 'scene',
      act: 2,
      about: ['iris', 'nico'],
      art: {
        brief:
          'A forty-foot drive-in screen over moonlit surf playing a black-and-white beach-party film of monster starlets receiving jewelled knives, Iris photographing it from the gravel lot, Norb standing on a towel',
      },
    },
    {
      id: 'scratched-sleeve',
      title: 'The Scratched Sleeve',
      caption:
        'A low flash and a carhop’s gossip put a name to the face scratched off the 1964 sleeve.',
      kind: 'scene',
      act: 2,
      about: ['iris', 'nico'],
      art: {
        brief:
          'Iris holds her camera flash low beside a glass memorabilia case in a retro drive-in snack bar, the raking light revealing a scratched-away beehive silhouette on an old surf-record sleeve, a bat-woman carhop leaning in to gossip',
      },
    },
    {
      id: 'francesca-confesses',
      title: 'Five Knives',
      caption:
        'Francesca Stein: “I made five knives. Four went on the poster.”',
      kind: 'scene',
      act: 2,
      about: ['iris', 'nico'],
      art: {
        brief:
          'A stitched scientist actress in a lab coat beside a blueprint of five numbered jewelled daggers and an empty velvet case, Tesla coils arcing blue, comic noir mystery, no gore',
      },
    },
  ],
  trailer: {
    tagline: 'Two murders, two ghosts, a franchise convention across town.',
    beats: [],
  },
}
