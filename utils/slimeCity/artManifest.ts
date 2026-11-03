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
    // Curated 2026-11-02 PT from conductor slime-city BLACKOUT-STORY-ROUND-2 (starter cards) and
    // GUTTER-CROWN-RESERVE-CARDS-ROUND-3 / GUTTER-CROWN-WAVE-TWO-ROUND-4 (keep verdicts only).
    'audit-fiend': 260651,
    drink: 259949,
    ducttape: 259944,
    'firebreak-parade': 260648,
    handshake: 259956,
    kaboom: 259946,
    'pipe-seer': 260649,
    'pogo-punk': 260643,
    repo: 259954,
    's1-alley-vet': 260654,
    's1-basement-ghost': 260677,
    's1-blast-radius': 260672,
    's1-blue-ink-deadfall': 260681,
    's1-bolt-clamp': 260669,
    's1-catnip-tripwire': 260657,
    's1-chaos-firecracker': 260674,
    's1-clone-salvage': 260655,
    's1-confetti-cannon': 260661,
    's1-executive-repo': 260683,
    's1-fuse-alley': 260675,
    's1-golden-handshake': 260692,
    's1-hydraulic-shift': 260667,
    's1-margin-call': 260685,
    's1-mime-fuse': 260671,
    's1-needle-wire': 260682,
    's1-nine-lives': 260656,
    's1-no-witnesses': 260673,
    's1-riot-choir': 260659,
    's1-roof-phantom': 260653,
    's1-scrap-welder': 260666,
    's1-stage-dive': 260662,
    's1-static-listener': 260678,
    's1-union-plate': 260670,
    'snitch-grate': 260650,
    'spare-pistons': 260646,
    'splice-runner': 260641,
    welder: 259942,
  },
  boards: {
    blackout: 258387,
    gridiron: 258388,
    bloodrush: 258389,
    // District floors, round 4 (conductor projects/slime-city/art/
    // DISTRICT-BOARDS-ROUND-4.yaml, ArtJobs 53120-53133, all DONE).
    'pitworks-blackout': 260433,
    'pitworks-bloodrush': 260434,
    'chimera-blackout': 260435,
    'chimera-bloodrush': 260436,
    'needles-blackout': 260437,
    'needles-bloodrush': 260438,
    'foundry-blackout': 260439,
    'foundry-bloodrush': 260440,
    'undertow-blackout': 260441,
    'undertow-bloodrush': 260442,
    'crown-blackout': 260443,
    'crown-bloodrush': 260444,
    'redline-blackout': 260445,
    'redline-bloodrush': 260446,
  },
  /**
   * Campaign story plates, curated 2026-11-02 PT from conductor slime-city
   * BLACKOUT-STORY-ROUND-2: '<crew>/opening', '<crew>/<chapter>/scene', '<crew>/<chapter>/conviction'
   * or 'cunning' (the won approach), '<crew>/<chapter>/defeat', '<crew>/ending-triumph' or
   * 'ending-compromise'. Missing plates fall back to the crew poster.
   */
  story: {
    'bloodfairies/1/conviction': 259979,
    'bloodfairies/1/cunning': 259980,
    'bloodfairies/2/conviction': 259983,
    'bloodfairies/3/cunning': 259988,
    'bloodfairies/4/scene': 259990,
    'bloodfairies/5/cunning': 259996,
    'catgirls/1/defeat': 259961,
    'catgirls/1/scene': 259958,
    'catgirls/2/conviction': 259963,
    'catgirls/2/cunning': 259964,
    'catgirls/2/defeat': 259965,
    'catgirls/2/scene': 259962,
    'catgirls/3/defeat': 259969,
    'catgirls/4/defeat': 259973,
    'catgirls/5/defeat': 259977,
    'catgirls/5/scene': 259974,
    'exchange/1/conviction': 260059,
    'exchange/1/cunning': 260060,
    'exchange/1/defeat': 260061,
    'exchange/1/scene': 260058,
    'exchange/2/conviction': 260063,
    'exchange/2/cunning': 260064,
    'exchange/2/defeat': 260065,
    'exchange/2/scene': 260062,
    'exchange/3/defeat': 260069,
    'exchange/3/scene': 260066,
    'exchange/4/cunning': 260072,
    'exchange/4/scene': 260070,
    'exchange/ending-compromise': 260089,
    'exchange/ending-triumph': 260088,
    'exchange/opening': 260640,
    'ironjaw/1/defeat': 260001,
    'ironjaw/2/conviction': 260003,
    'ironjaw/2/defeat': 260005,
    'ironjaw/2/scene': 260002,
    'ironjaw/3/conviction': 260007,
    'ironjaw/3/defeat': 260009,
    'ironjaw/3/scene': 260006,
    'ironjaw/4/conviction': 260011,
    'ironjaw/4/defeat': 260013,
    'ironjaw/4/scene': 260010,
    'ironjaw/ending-compromise': 260083,
    'ironjaw/ending-triumph': 260082,
    'ironjaw/opening': 260637,
    'riot/1/conviction': 260019,
    'riot/1/cunning': 260020,
    'riot/1/defeat': 260021,
    'riot/1/scene': 260018,
    'riot/2/defeat': 260025,
    'riot/2/scene': 260022,
    'riot/3/defeat': 260029,
    'riot/4/conviction': 260031,
    'riot/4/defeat': 260033,
    'riot/4/scene': 260030,
    'riot/5/cunning': 260036,
    'riot/5/defeat': 260037,
    'riot/5/scene': 260034,
    'riot/opening': 260638,
    'undertow/1/conviction': 260039,
    'undertow/1/cunning': 260040,
    'undertow/1/defeat': 260041,
    'undertow/1/scene': 260038,
    'undertow/3/conviction': 260047,
    'undertow/3/cunning': 260048,
    'undertow/3/defeat': 260049,
    'undertow/3/scene': 260046,
    'undertow/4/conviction': 260051,
    'undertow/4/cunning': 260052,
    'undertow/4/defeat': 260053,
    'undertow/4/scene': 260050,
    'undertow/5/conviction': 260055,
    'undertow/5/cunning': 260056,
    'undertow/5/defeat': 260057,
    'undertow/5/scene': 260054,
    'undertow/ending-compromise': 260087,
    'undertow/ending-triumph': 260086,
    'undertow/opening': 260639,
  },
  /** Attack-family icons, same round. */
  attacks: {
    bite: 260094,
    claw: 260093,
    spell: 260092,
    sword: 260090,
  },
  /** UI art, round 4 (ArtJob 53119). */
  ui: {
    'card-back': 260371,
  },
  /**
   * Board tokens: one painted reaction-face portrait per creature and mood,
   * keyed '<cardId>/<mood>' (fierce, guard, hurt), from Conductor
   * projects/slime-city/art/BOARD-TOKENS-ROUND-6.yaml.
   * Silas, 2026-11-02: "we need custom tokens for all cards on the board.
   * Images with reaction faces would probably work." Until a creature's
   * portraits render, its token uses the card art with a reaction badge.
   */
  tokens: {} as Readonly<Record<string, number>>,
} as const

export type SlimeCityArtGroup = keyof typeof SLIME_CITY_ART

/** Unillustrated cards intentionally return null, never a borrowed image. */
export function slimeArtId(
  group: SlimeCityArtGroup,
  slug: string,
): number | null {
  const ids: Readonly<Record<string, number>> = SLIME_CITY_ART[group]
  return ids[slug] ?? null
}

/**
 * Each district fights on its own floor: the district board for this mode when
 * it has rendered, otherwise the shared board for the mode.
 */
export function slimeBoardArtId(district: string, mode: string): number | null {
  return (
    slimeArtId('boards', district + '-' + mode) ??
    slimeArtId('boards', mode) ??
    // TURF fights on the district's Blackout floor until its own board renders.
    (mode === 'turf' ? slimeBoardArtId(district, 'blackout') : null)
  )
}

export const SLIME_CITY_ART_COUNT = 185
