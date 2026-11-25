import type { Chronicle } from './chronicle'
import { HOARD_GOLD, partyIds } from './engine'
import { activeSynergies } from './party'
import { CHARACTERS } from './roster'
import type { EndingId, RunState } from './types'

// Deepheart achievements, judged from the chronicle and the live run. The
// store awards each new code once, through the site achievement store, at the
// moment the deed happens. Loading a slot never awards on its own: it only
// proves what the loaded run already did.

export const DH_ACHIEVEMENT_CODES = {
  firstDelve: 'deepheart-first-delve',
  warden: 'deepheart-warden',
  brine: 'deepheart-brine',
  hollowKing: 'deepheart-hollow-king',
  firstEnding: 'deepheart-first-ending',
  everyEnding: 'deepheart-every-ending',
  lanternsOut: 'deepheart-lanterns-out',
  heartfelt: 'deepheart-heartfelt',
  hearth: 'deepheart-hearth',
  sworn: 'deepheart-sworn',
  kindred: 'deepheart-kindred',
  duo: 'deepheart-duo',
  perfectParty: 'deepheart-perfect-party',
  riddler: 'deepheart-riddler',
  mimic: 'deepheart-mimic',
  hoard: 'deepheart-hoard',
  dawn: 'deepheart-dawn',
  redeemer: 'deepheart-redeemer',
  metAll: 'deepheart-met-all',
  untouched: 'deepheart-untouched',
} as const

export type DhAchievementCode =
  (typeof DH_ACHIEVEMENT_CODES)[keyof typeof DH_ACHIEVEMENT_CODES]

const C = DH_ACHIEVEMENT_CODES

export const ALL_ENDINGS: EndingId[] = [
  'delver',
  'usurper',
  'lichbound',
  'dawnbringer',
  'redemption',
  'sealed',
  'gilded',
  'hearthbound',
  'fallen',
]

export const KINDRED_SCENES = 10
export const RIDDLER_PUZZLES = 10
export const PERFECT_SYNERGIES = 3

export function achievementsProven(
  chronicle: Chronicle,
  run: RunState | null,
): DhAchievementCode[] {
  const earned = new Set<DhAchievementCode>()
  const endings = new Set(chronicle.endings)
  if (chronicle.delves > 0) earned.add(C.firstDelve)
  if (endings.size > 0) earned.add(C.firstEnding)
  if (ALL_ENDINGS.every((e) => endings.has(e))) earned.add(C.everyEnding)
  if (endings.has('fallen')) earned.add(C.lanternsOut)
  if (endings.has('dawnbringer')) earned.add(C.dawn)
  if (endings.has('redemption')) earned.add(C.redeemer)
  if (chronicle.supports.length >= KINDRED_SCENES) earned.add(C.kindred)
  if (chronicle.puzzles >= RIDDLER_PUZZLES) earned.add(C.riddler)
  if (CHARACTERS.every((c) => chronicle.met.includes(c.id)))
    earned.add(C.metAll)
  if (
    chronicle.runs.some(
      (r) => r.companions.length === 1 && r.ending !== 'fallen',
    )
  )
    earned.add(C.duo)
  if (run) {
    if (run.moments.includes('warden-falls')) earned.add(C.warden)
    if (run.moments.includes('brine-falls')) earned.add(C.brine)
    if (run.moments.includes('empty-throne')) earned.add(C.hollowKing)
    const courted = run.partners.filter(
      (id) =>
        id !== CHARACTERS.find((c) => c.id === run.hero.presetId)?.partner,
    )
    if (courted.length) earned.add(C.heartfelt)
    if (courted.includes('brannoc') && courted.includes('thessaly'))
      earned.add(C.hearth)
    if (run.oaths.length) earned.add(C.sworn)
    if (
      activeSynergies(partyIds(run), run.hero).length >= PERFECT_SYNERGIES
    )
      earned.add(C.perfectParty)
    if (run.mimics > 0) earned.add(C.mimic)
    if (run.peakGold >= HOARD_GOLD) earned.add(C.hoard)
    if (run.cleanLayers > 0) earned.add(C.untouched)
  }
  return Object.values(C).filter((code) => earned.has(code))
}
