export const CAPTAIN_ORIGINS = [
  {
    id: 'courier',
    glyph: '✦',
    name: 'Interstellar Courier',
    summary: 'You know every shortcut and who owns the tollbooths.',
    prologue:
      'Your courier satchel contains emergency rations and a delivery that nobody will sign for.',
    perk: 'Start with 2 extra supplies.',
    bonus: { supplies: 2 },
  },
  {
    id: 'refugee',
    glyph: '☽',
    name: 'Displaced Diplomat',
    summary: 'You lost your home port and remember exactly who closed it.',
    prologue:
      'Your first command is to leave the couch open to someone with nowhere else to sit.',
    perk: 'Start with 1 extra crew trust.',
    bonus: { trust: 1 },
  },
  {
    id: 'archivist',
    glyph: '⌘',
    name: 'Forbidden Archivist',
    summary: 'Your degree was revoked for asking the correct question.',
    prologue:
      'You bring a blacklisted star chart and the inconvenient answer written on its back.',
    perk: 'Start with 1 extra reputation.',
    bonus: { reputation: 1 },
  },
  {
    id: 'mechanic',
    glyph: '⚙',
    name: 'Cushion-Side Mechanic',
    summary: 'You once repaired a force bubble using a bread knife.',
    prologue:
      'You have checked the couch seams twice. The invisible safety bubble is ready for a third passenger complaint.',
    perk: 'Start with a fully charged force bubble.',
    bonus: { shieldCharge: 1 },
  },
  {
    id: 'auditor',
    glyph: '◇',
    name: 'Former Galactic Auditor',
    summary: 'You have seen a civilization destroyed by a misplaced form.',
    prologue:
      'Your resignation letter is twelve pages long and now qualifies as a distress signal.',
    perk: 'Start with 1 extra intervention standing.',
    bonus: { intervention: 1 },
  },
  {
    id: 'entertainer',
    glyph: '✧',
    name: 'Casino Floor Escapee',
    summary: 'You can read a bluff faster than a navigation manual.',
    prologue:
      'You leave your casino badge beneath the left cushion and declare the galaxy an unusually difficult table.',
    perk: 'Start with 1 extra supply and 1 crew trust.',
    bonus: { supplies: 1, trust: 1 },
  },
] as const

export type CaptainOriginId = (typeof CAPTAIN_ORIGINS)[number]['id']
