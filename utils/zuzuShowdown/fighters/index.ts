// /utils/zuzuShowdown/fighters/index.ts
//
// The selectable roster. Real fighters join as their kits land (t-014 to
// t-017: Storm Crow and River Croc in t-016, the Hyena Matriarch and Old
// Komodo in t-017). The stand-ins left the picker once real fighters replaced them
// (Silas, 2026-10-09 PT); they stay in placeholders.ts for engine tests.
// Zuzu vs the Coyote, the rivals of Book One's chapter 1, is the default
// matchup.

import type { Motion } from '../motion'
import type { FighterData } from '../types'
import { ABBESS } from './abbess'
import { COYOTE } from './coyote'
import { HYENA_MATRIARCH } from './hyena-matriarch'
import { OLD_KOMODO } from './old-komodo'
import { RIVER_CROC } from './river-croc'
import { SIBLINGS } from './siblings'
import { STORM_CROW } from './storm-crow'
import { ZUZU } from './zuzu'

export const FIGHTERS: FighterData[] = [
  ZUZU,
  COYOTE,
  ABBESS,
  SIBLINGS,
  STORM_CROW,
  RIVER_CROC,
  HYENA_MATRIARCH,
  OLD_KOMODO,
]

export const DEFAULT_FIGHTERS: [string, string] = ['zuzu', 'coyote-vagrant']

export function findFighter(slug: string): FighterData {
  return FIGHTERS.find((fighter) => fighter.slug === slug) ?? FIGHTERS[0]!
}

const MOTION_LABELS: Record<Motion, string> = {
  qcf: '↓↘→',
  qcb: '↓↙←',
  dp: '→↓↘',
  hcb: '→↘↓↙←',
  '360': '360',
  '720': '720',
  qcf2: '↓↘→ ↓↘→',
  qcb2: '↓↙← ↓↙←',
  chargeBF: '[←] →',
  chargeDU: '[↓] ↑',
  dd: '↓ ↓',
}

export type MoveListRow = {
  id: string
  name: string
  input: string
  note: string
}

/** 'hook-and-reel' -> 'Hook And Reel'. */
function titleOf(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** A fighter's command list, written for a player (inputs facing right). */
export function moveList(data: FighterData): MoveListRow[] {
  return data.specials.map((special) => {
    const name = titleOf(special.id)
    const cost = special.move.meterCost ?? 0
    const note = [
      special.air ? 'in the air' : '',
      special.level === 'super'
        ? `${cost / 1000} bar${cost === 1000 ? '' : 's'}`
        : '',
    ]
      .filter(Boolean)
      .join(' · ')
    // A follow-up (Erupt) is its source move's buttons, not a motion.
    const source = special.followUp
      ? data.specials.find((s) => s.move.followUp?.move === special.id)
      : undefined
    const input = source
      ? `${source.move.followUp!.buttons.map((b) => b.toUpperCase()).join('/')} during ${titleOf(source.id)}`
      : `${MOTION_LABELS[special.motion]} + ${special.button}`
    return { id: special.id, name, input, note }
  })
}
