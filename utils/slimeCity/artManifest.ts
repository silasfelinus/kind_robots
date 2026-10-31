// Source: conductor/projects/slime-city/art/CREWS-DISTRICTS-CARDS-ROUND-1.yaml
// Each ID is a completed ArtJob's ArtImage according to the Conductor ledger.
// Actual delivery is verified only after an authenticated image response succeeds.
// Never treat a ledger DONE status as proof of usable image bytes.
export const SLIME_CITY_ART = {
  crews: {
    catgirls: 258339,
    bloodfairies: 258340,
    ironjaw: 258341,
    riot: 258342,
    undertow: 258343,
    exchange: 258344,
  },
  districts: {
    pitworks: 258345,
    chimera: 258346,
    needles: 258347,
    foundry: 258348,
    undertow: 258349,
    crown: 258350,
    redline: 258351,
  },
  cards: {
    lynx: 258352,
    mau: 258353,
    chimera: 258354,
    pounce: 258355,
    scentmine: 258356,
    reknit: 258357,
    sprite: 258358,
    razor: 258359,
    queen: 258360,
    mosh: 258361,
    bloodwire: 258362,
    spurs: 258363,
    scrapper: 258364,
    bulldozer: 258365,
    juggernaut: 258366,
    overclock: 258367,
    shocktrap: 258368,
    plating: 258390,
    rat: 258369,
    firebrand: 258370,
    bomber: 258371,
    firestorm: 258372,
    badluck: 258373,
    fuse: 258374,
    watcher: 258375,
    frogtrooper: 258376,
    oracle: 258377,
    blackout: 258378,
    tripwire: 258379,
    visor: 258380,
    collector: 258381,
    broker: 258382,
    mogul: 258383,
    collection: 258384,
    debttrap: 258385,
    contract: 258386,
  },
  boards: {
    blackout: 258387,
    gridiron: 258388,
    bloodrush: 258389,
  },
} as const

export type SlimeCityArtGroup = keyof typeof SLIME_CITY_ART

/** Unillustrated cards intentionally return null, never a borrowed image. */
export function slimeArtId(group: SlimeCityArtGroup, slug: string): number | null {
  const ids: Readonly<Record<string, number>> = SLIME_CITY_ART[group]
  return ids[slug] ?? null
}

export const SLIME_CITY_ART_COUNT = 52
