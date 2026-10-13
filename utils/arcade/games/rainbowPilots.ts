export const RAINBOW_PORTRAIT_ROOT = '/rainbow-princess-portraits'
export const RAINBOW_HERO_ART = '/rainbow-princess-art/hero-pearl-palace.webp'

export type RainbowPilotGlyph = {
  shape: 'path' | 'rings'
  d?: string
}

export type RainbowPilot = {
  seat: 0 | 1 | 2 | 3
  key: 'maribel' | 'azure' | 'solenne' | 'vivi'
  name: string
  pronouns: string
  color: string
  colorName: string
  glyphName: string
  glyph: RainbowPilotGlyph
  ship: string
  shipShape: string
  primary: string
  superName: string
  superDetail: string
  hook: string
  portrait: string
  portraitAlt: string
}

export const RAINBOW_PILOTS: readonly RainbowPilot[] = [
  {
    seat: 0,
    key: 'maribel',
    name: 'Maribel Rowan',
    pronouns: 'she/they',
    color: '#ffd2ef',
    colorName: 'Rose pink',
    glyphName: 'Four-petal diamond',
    glyph: {
      shape: 'path',
      d: 'M12 2c2 3 2 5 0 8-2-3-2-5 0-8Zm0 20c-2-3-2-5 0-8 2 3 2 5 0 8ZM2 12c3-2 5-2 8 0-3 2-5 2-8 0Zm20 0c-3 2-5 2-8 0 3-2 5-2 8 0Z',
    },
    ship: 'Petal Wing',
    shipShape: 'rose-gold swallowtail, four swept blades',
    primary: 'Wide Petal Spray / tight Rose Needle',
    superName: 'Bloom Nova',
    superDetail: 'cancels nearby shots and breaks light armor',
    hook: 'Radio tinkerer who answers every distress call, then learns to call for backup.',
    portrait: `${RAINBOW_PORTRAIT_ROOT}/p1-maribel.webp`,
    portraitAlt:
      'Maribel Rowan, a short freckled pilot with a cropped copper haircut and a crooked grin, holding a wrench in a scuffed rose-pink flight jacket.',
  },
  {
    seat: 1,
    key: 'azure',
    name: 'Azure Lin',
    pronouns: 'she/her',
    color: '#b8f8ff',
    colorName: 'Powder cyan',
    glyphName: 'Long needle',
    glyph: { shape: 'path', d: 'M12 1 15 12 12 23 9 12Z' },
    ship: 'Prism Lance',
    shipShape: 'long single needle fin',
    primary: 'Piercing Prism Thread / charged Narrow Beam',
    superName: 'Tidal Prism',
    superDetail: 'sustained forward beam with a guard wedge',
    hook: 'Star-cartographer who always sees the fastest route, and learns to hear testimony too.',
    portrait: `${RAINBOW_PORTRAIT_ROOT}/p2-azure.webp`,
    portraitAlt:
      'Azure Lin, a tall pilot with a long black braid and side undercut, seated at a glowing star chart in a cyan flight coat.',
  },
  {
    seat: 2,
    key: 'solenne',
    name: 'Solenne Adisa',
    pronouns: 'she/her',
    color: '#ffe99f',
    colorName: 'Butter gold',
    glyphName: 'Double ring',
    glyph: { shape: 'rings' },
    ship: 'Halo Fin',
    shipShape: 'broad disc with twin rings',
    primary: 'Two orbit drones / linked focus shots',
    superName: 'Halo Harbor',
    superDetail: 'brief shared shield and one team revive',
    hook: 'Squad captain and secret composer who learns to share the load.',
    portrait: `${RAINBOW_PORTRAIT_ROOT}/p3-solenne.webp`,
    portraitAlt:
      'Solenne Adisa, a powerfully muscular dark-skinned pilot with twists gathered up, smiling over a music notebook in gold shoulder armor.',
  },
  {
    seat: 3,
    key: 'vivi',
    name: 'Vivi Reyes',
    pronouns: 'they/she',
    color: '#b9a9ff',
    colorName: 'Lilac',
    glyphName: 'Three-point star',
    glyph: { shape: 'path', d: 'M12 1 15 15 23 20 12 17 1 20 9 15Z' },
    ship: 'Comet Crown',
    shipShape: 'three-pronged arrowhead',
    primary: 'Rapid Spark Lances / ricochet arc',
    superName: 'Comet Parade',
    superDetail: 'a target-locked rainbow fleet of drones',
    hook: 'Punk street-orchestra pilot who chases glory and learns that shared credit counts.',
    portrait: `${RAINBOW_PORTRAIT_ROOT}/p4-vivi.webp`,
    portraitAlt:
      'Vivi Reyes, a curvy punk pilot with a shaved side and lilac-streaked hair, grinning with a keytar in a patched lilac jacket.',
  },
]
