// /utils/arcade/stationSweep/bosses.ts
//
// Station Sweep's slice-2 bosses as data (conductor kr-arcade/t-142). Like every critter, they are
// never hurt: they're swept up, and the Terrarium (a later slice) gives them a home.
//
//   Nest Mother        every station's mid-boss, in the middle deck's nest room: she lays fresh sacs
//                      (swelling first) until she's swept.
//   Mother Gloop       the Greenhouse Ring's Queen, a pond of goo filling a room.
//                      1  she slops blobs off her surface (her surface bulges first): sweep them;
//                      2  she splits into four gloops that re-form if left: foam them;
//                      3  she pours herself into the vents: ride a lift after her and finish her in
//                         the nest room on the deck above.
//   The Laundry Kraken the Laundry Moon's Queen, tentacles out of six washing machines.
//                      1  tentacles slam down, a shadow on the floor first: sweep them while down;
//                      2  it flings socks while the room's conveyor speeds up;
//                      3  its head rises from the big machine, armoured: Steam Wand it, then sweep.

export type BossKind = 'nestMother' | 'motherGloop' | 'kraken'

export const BOSS_NAMES: Record<BossKind, string> = {
  nestMother: 'NEST MOTHER',
  motherGloop: 'MOTHER GLOOP',
  kraken: 'LAUNDRY KRAKEN',
}

export const NEST_MOTHER = {
  hp: 14,
  /** She lays a sac this often (swelling for `layTell` first), keeping at most `maxSacs`. */
  layEvery: 360,
  layTell: 60,
  maxSacs: 4,
  hitH: 34,
  halfW: 20,
  points: 3000,
  credits: 4,
} as const

export const MOTHER_GLOOP = {
  hp: 24,
  /** Phase 2 starts at this much left; phase 3, in the nest room above, has its own pool. */
  splitAt: 16,
  poolHp: 8,
  /** A blob slops off this often (after a bulge of `slopTell`), by phase. */
  slopEvery: [0, 110, 0, 75] as const,
  slopTell: 30,
  parts: 4,
  /** Left alone this long, her parts flow back together. */
  reform: 60 * 9,
  hitH: 24,
  halfW: 40,
  points: 15000,
  credits: 10,
} as const

export const KRAKEN = {
  hp: 30,
  /** Phase 2 at this much left, phase 3 at this much. */
  phase2: 20,
  phase3: 10,
  /** The six machines along the back of its room, and the big one its head rises from. */
  machines: [96, 152, 208, 312, 368, 424] as const,
  bigMachine: 260,
  /** A slam: its shadow for `slamTell`, then the tentacle lies on the floor for `slamDown`. */
  slamTell: 45,
  slamDown: 75,
  slamEvery: [0, 70, 130, 170] as const,
  slamDamage: 12,
  tentacleHalfW: 15,
  /** Socks flung this often from phase 2. */
  sockEvery: 75,
  /** The room's conveyor, by phase. */
  conveyor: [0, 0.35, 0.9, 0.6] as const,
  /** The head is soft this long after a blast of steam. */
  headStun: 60 * 3,
  /** Where the risen head floats: at beam height, so a standing sweep reaches it. */
  headY: 180,
  headHalfW: 18,
  points: 20000,
  credits: 12,
} as const
