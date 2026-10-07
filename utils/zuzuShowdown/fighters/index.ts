// /utils/zuzuShowdown/fighters/index.ts
//
// The selectable roster. Real fighters join as their kits land (t-014 to
// t-017); the stand-ins stay for engine testing.

import type { Motion } from '../motion'
import type { FighterData } from '../types'
import { PLACEHOLDER_A, PLACEHOLDER_B } from './placeholders'
import { ZUZU } from './zuzu'

export const FIGHTERS: FighterData[] = [ZUZU, PLACEHOLDER_A, PLACEHOLDER_B]

export const DEFAULT_FIGHTERS: [string, string] = ['zuzu', 'placeholder-b']

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

/** A fighter's command list, written for a player (inputs facing right). */
export function moveList(data: FighterData): MoveListRow[] {
  return data.specials.map((special) => {
    const name = special.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    const cost = special.move.meterCost ?? 0
    const note = [
      special.air ? 'in the air' : '',
      special.level === 'super'
        ? `${cost / 1000} bar${cost === 1000 ? '' : 's'}`
        : '',
    ]
      .filter(Boolean)
      .join(' · ')
    return {
      id: special.id,
      name,
      input: `${MOTION_LABELS[special.motion]} + ${special.button}`,
      note,
    }
  })
}
