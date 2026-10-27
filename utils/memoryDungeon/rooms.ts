/**
 * Briar Camp's combat rooms (conductor memory-dungeon t-007): which match rooms
 * fight on the weapon engine, against whom, and with which tools. The Echo
 * Chamber (vault-1) stays a gentle Classic match room; the Rootbound Warden
 * and the two forest duels become 4x4 fights with a telegraphed enemy.
 */
import {
  createCombat,
  restoreCombat,
  type CombatState,
  type WeaponId,
} from './combat'

export type CombatRoomId = 'vault-2' | 'sprite' | 'patrol'

export type CombatRoom = {
  enemy: { name: string; hp: number; attack: number; every: number }
  playerHp: number
  focus: number
  /** Tools on the weapon bar, after Scout (which every fight has). */
  loadout: WeaponId[]
  intro: string
  /** The enemy's combat illustration. */
  artPrompt: string
}

export const COMBAT_ROWS = 4
export const COMBAT_COLS = 4
/** Distinct images a combat room needs: one per pair on a 4x4 board. */
export const COMBAT_PAIRS = (COMBAT_ROWS * COMBAT_COLS) / 2

export const COMBAT_ROOMS: Record<CombatRoomId, CombatRoom> = {
  sprite: {
    enemy: { name: 'Moss Sprite', hp: 8, attack: 1, every: 3 },
    playerHp: 8,
    focus: 2,
    loadout: ['twinblade', 'lantern'],
    intro:
      'The Moss Sprite giggles and counts down on its fingers. Match pairs before it pounces.',
    artPrompt:
      'A knee-high moss-covered sprite with a leaf cap, twig fingers and glinting green eyes springs from a gnarled oak branch, grinning, fingers spread as it counts down. A sunlit forest clearing below with dappled light on the moss. Medium shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
  },
  patrol: {
    enemy: { name: 'Thorn Patrol', hp: 8, attack: 2, every: 4 },
    playerHp: 8,
    focus: 2,
    loadout: ['twinblade', 'hammer', 'lantern'],
    intro:
      'A Thorn Patrol blocks the trail. Aim the Rune Hammer at pairs you remember.',
    artPrompt:
      'Two forest guards in bark armor wrapped with thorny vines, carrying narrow spears, block a narrow bramble road with their spears crossed, one tall and lean, one short and broad. Violet moonlight and a lantern hanging from a branch. Medium-wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
  },
  'vault-2': {
    enemy: { name: 'Rootbound Warden', hp: 12, attack: 2, every: 4 },
    playerHp: 8,
    focus: 3,
    loadout: ['twinblade', 'hammer', 'spear', 'staff', 'lantern'],
    intro:
      'The Rootbound Warden guards the Bramble Chime. Every action is a beat of its countdown.',
    artPrompt:
      'The Rootbound Warden, a towering guardian of knotted oak roots with brass keys set into its bark like armor plates and a smooth carved wooden mask for a face, guards a small golden bell set on a root pedestal in a chamber lit by glowing glass memory jars. Low-angle wide shot. Hand-painted gouache and ink illustration, warm candlelight and deep green shadows.',
  },
}

export function isCombatRoom(
  id: string | null | undefined,
): id is CombatRoomId {
  return id === 'vault-2' || id === 'sprite' || id === 'patrol'
}

/** A saved combat room: the fight plus one image per pair id. */
export type BriarCombat = {
  state: CombatState
  images: string[]
}

export function startCombatRoom(
  roomId: CombatRoomId,
  seed: number,
  images: string[],
): BriarCombat {
  const room = COMBAT_ROOMS[roomId]
  return {
    state: createCombat({
      seed,
      rows: COMBAT_ROWS,
      cols: COMBAT_COLS,
      enemy: room.enemy,
      playerHp: room.playerHp,
      focus: room.focus,
    }),
    images: images.slice(0, COMBAT_PAIRS),
  }
}

/** A saved combat room, validated; null if any part is unusable. */
export function restoreBriarCombat(input: unknown): BriarCombat | null {
  if (!input || typeof input !== 'object') return null
  const saved = input as Partial<BriarCombat>
  const state = restoreCombat(saved.state)
  if (!state || !Array.isArray(saved.images)) return null
  const images = saved.images.filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  )
  const pairs = state.cards.filter((c) => c.pair !== null).length / 2
  if (images.length < pairs) return null
  return { state, images: images.slice(0, pairs) }
}
