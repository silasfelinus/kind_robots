import type { PlaybookKitSpec } from '../types'

export const MONSTRESS_CONVENTION: PlaybookKitSpec = {
  id: 'monstress-convention',
  conductorSlug: 'monstress-convention',
  title: 'Monstrexx',
  tagline: "Everybody's a monster. Somebody's a murderer.",
  premise:
    'Iris investigates a double murder at the motel while her germophobic boss deduces clues; two ghosts reveal different leads to the Monstrexx celebrities.',
  tier: 'vignette',
  route: '/admin/monstress-convention',
  keyArt: {
    brief:
      'A shabby rain-soaked two-storey Last Call Motor Lodge, ice machine, front office, two ghost women in Room 205 and a distant Monstrexx Convention billboard',
    alt: 'Last Call Motor Lodge with distant Monstrexx billboard',
  },
  acts: [
    {
      id: 1,
      title: 'Two Ghosts at Last Call',
      blurb:
        'Investigate the double murder and unlock the separate convention center.',
    },
  ],
  meters: [{ id: 'leads', label: 'Leads', min: 0, max: 10, start: 0 }],
  factions: [],
  cast: [
    { id: 'iris', name: 'Iris Quill', role: 'follower',
      tagline: 'Lead field investigator, capable assistant and photojournalist.',
      portrait: { brief: 'Charming resourceful grown woman photojournalist with camera, practical coat and sharp expression, illustrated retro adventure-game portrait' } },
    { id: 'nico', name: 'Nico Vale', role: 'figure',
      tagline: 'Brilliant hunched germophobic boss, never willing to touch the evidence.',
      portrait: { brief: 'Original odd-looking hunched adult journalist with wide worried eyes, shabby suit, spotless handkerchief and clever demeanor, theatrical noir cartoon portrait' } },
    { id: 'odette', name: 'Odette Harker', role: 'figure',
      tagline: 'Smarmy talent agent, murdered at the motel and now a demanding ghost witness.',
      portrait: { brief: 'Spectral woman talent agent with stern glamorous appearance, elegant evening outfit, expressive theatrical noir ghost portrait' } },
    { id: 'violet', name: 'Violet Wisp', role: 'figure',
      tagline: 'Observant woman, a second murder victim and a distinct ghost witness.',
      portrait: { brief: 'Adult woman ghost with lavender aura, confident observant face, elegant party clothes, whimsical theatrical portrait' } },
    { id: 'celestine', name: 'Celestine Veil', role: 'figure',
      tagline: 'Living Monstrexx mummy movie star and idol-group veteran.',
      portrait: { brief: 'Elegant adult mummy woman star in layered bandage fashion and silver-screen makeup, original movie-monster celebrity portrait' } },
    { id: 'unknown-killer', name: 'The Hidden Hand', role: 'villain', primary: true,
      tagline: 'One ornamental blade, two deaths, too many contracts.',
      portrait: { brief: 'Unidentifiable silhouetted hand holding an elaborate jewel-handled stage knife outside motel room, no graphic violence' } },
  ],
  reveals: [
    { id: 'ghost-accounts', title: 'Two Ghosts, Two Stories',
      teaser: 'An agent remembers contracts; her companion remembers the sounds.',
      text: 'Odette and Violet have different evidence and neither knows who killed them.',
      act: 1, about: ['odette', 'violet'] },
  ],
  endings: [
    { id: 'lead-earned', title: 'The Convention Lead', tone: 'hopeful',
      summary: 'Iris and Nico find a defensible lead to the separate Monstrexx Convention Center.',
      hint: 'Document the knife, establish the time, clear the stalker and ask both ghosts.',
      about: ['iris', 'nico', 'odette', 'violet'],
      art: { brief: 'Iris and Nico following the Monstrexx idol-group schedule outside the separate convention venue, mystery adventure illustration' } },
    { id: 'reckless', title: 'A Headline Too Early', tone: 'dark',
      summary: 'An unverified headline hurts people before the true case can be solved.',
      hint: 'Both ghost accounts are essential, but neither alone proves a culprit.',
      about: ['iris', 'nico'],
      art: { brief: 'A hasty tabloid blog headline on motel computer, Iris concerned, Nico recoiling in dismay, noir retro game' } },
  ],
  moments: [
    { id: 'double-murder', title: 'Two Women in Room 205',
      caption: 'Iris finds two murder victims and one unusual ceremonial-looking knife.',
      kind: 'scene', act: 1, about: ['odette', 'violet', 'unknown-killer'],
      art: { brief: 'Respectful noir aftermath of a double murder in dim motel room, mostly obscured body silhouettes and ornate knife as evidence, no gore' } },
    { id: 'two-ghosts', title: 'The Other Two Witnesses',
      caption: 'Odette and Violet return as distinct ghosts who heard different things.',
      kind: 'scene', act: 1, about: ['odette', 'violet'],
      art: { brief: 'Two expressive spectral adult women, one agent and one observant companion, appear in a gloomy motel room mirror, playful supernatural mystery' } },
  ],
  trailer: {
    tagline: 'Two murders, two ghosts, a franchise convention across town.',
    beats: [],
  },
}
