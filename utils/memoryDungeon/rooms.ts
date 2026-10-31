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

export type CombatRoomId =
  | 'vault-2'
  | 'sprite'
  | 'patrol'
  | 'hearth-guard'
  | 'housekeeper'
  | 'collector'
  | 'twinned-guard'
  | 'moss-judge'
  | 'unpaid-patrol'
  | 'empty-armor'

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
      'The Rootbound Warden, a towering guardian of knotted oak roots with rows of brass keys set into its bark and a smooth carved wooden mask for a face, guards a small golden bell set on a root pedestal in a chamber lit by glowing glass memory jars. Low-angle wide shot. Hand-painted gouache and ink illustration, warm candlelight and deep green shadows.',
  },
  // The House's own duels (HD-09, HD-22, HD-28) used to borrow the forest
  // boards; each guardian now fights with its own tempo and tools.
  'hearth-guard': {
    enemy: { name: 'Hearth-Guard', hp: 10, attack: 1, every: 3 },
    playerHp: 8,
    focus: 2,
    loadout: ['twinblade', 'lantern', 'staff'],
    intro:
      'The Hearth-Guard plants itself before the fire. Its markings pulse one, two, three, and it strikes on the third beat, never sooner.',
    artPrompt:
      'A man-sized defender shaped from glowing coal stands in front of a stone manor hearth in a wide fighting stance, fists raised. Three orange markings on its chest glow in a row, the third brightest. Sparks drift up around it. Firelight from below, deep green shadows in the room. Low-angle medium shot. Hand-painted gouache and ink illustration, warm candlelight and deep green shadows.',
  },
  housekeeper: {
    enemy: { name: 'Thornbound Housekeeper', hp: 11, attack: 1, every: 5 },
    playerHp: 9,
    focus: 2,
    loadout: ['twinblade', 'rapier', 'lantern'],
    intro:
      'The Thornbound Housekeeper offers a nonlethal test. Her broom sweeps every fifth beat, giving you time to remember each pair; winning earns her trust, never her keys.',
    artPrompt:
      'A sturdy middle-aged housekeeper in interlocking rootwood armor hung with dozens of brass keys stands in a candlelit manor corridor. She holds a long thorn broom across her body, testing an adult traveler in a fair memory duel. Four small luminous paired tiles float between them, her expression watchful rather than cruel. Medium-wide original hand-painted gouache and ink fantasy illustration, warm lanternlight and deep green shadows.',
  },
  collector: {
    enemy: { name: 'Index Collector', hp: 12, attack: 1, every: 2 },
    playerHp: 9,
    focus: 3,
    loadout: ['twinblade', 'hammer', 'spear', 'lantern'],
    intro:
      'The Index Collector opens its ledger and counts every unpaired card aloud. Its sweeps come quickly but light, and it names each one before it lands.',
    artPrompt:
      'A tall thin figure in armor of overlapping stiff paper sheets and an ink-stained black coat sweeps one paper gauntlet across a stone archive hall. A grid of glowing pale squares hangs in the air before it, two columns lit brighter. Loose paper slips swirl around its feet. Cold blue light. Low-angle wide shot. Hand-painted gouache and ink illustration, warm candlelight and deep green shadows.',
  },
  'twinned-guard': {
    enemy: { name: 'Twinned Guard', hp: 14, attack: 2, every: 5 },
    playerHp: 8,
    focus: 3,
    loadout: ['twinblade', 'spear', 'staff', 'lantern'],
    intro:
      'The Twinned Guard stand back to back, each shielding the other. Their blows are slow and heavy, and only matched pairs get past both shields.',
    artPrompt:
      'Two identical guardians in armor of rootwood and brass stand back to back in a stone hall, each holding a tall shield across the other. Between them, pairs of glowing matching tiles hover in the air. One raises a heavy mace. Cold light from a high window. Medium-wide shot. Hand-painted gouache and ink illustration, warm candlelight and deep green shadows.',
  },
  // The Dark Briar's optional bouts (DARK_BRIAR_DUELS): the forest's old
  // challengers met again in the reflected realm, each with its own rules.
  'moss-judge': {
    enemy: { name: 'Moss Judge', hp: 9, attack: 1, every: 4 },
    playerHp: 8,
    focus: 2,
    loadout: ['rapier', 'twinblade', 'lantern'],
    intro:
      'The Moss Judge blows her whistle and fights her own bout by her own rules: a light tap on every fourth beat, called before it lands. The Needle Rapier lands both points of a pair at once.',
    artPrompt:
      'A knee-high moss-covered sprite with a leaf cap, twig fingers and glinting green eyes stands on a stone chessboard set into a woodland clearing, a tiny wooden whistle between her lips and a thin twig sword raised in one hand. A grid of glowing pale squares hovers above the chessboard. Low-angle medium shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
  },
  'unpaid-patrol': {
    enemy: { name: 'Unpaid Patrol', hp: 11, attack: 2, every: 3 },
    playerHp: 9,
    focus: 3,
    loadout: ['twinblade', 'hammer', 'spear', 'lantern'],
    intro:
      'The Unpaid Patrol charge the duel their contract demands. Both spears come down together on every third beat, and the Rune Hammer can stagger them a beat late.',
    artPrompt:
      'Two forest guards in battered bark armor wrapped with thorny vines, one tall and lean, one short and broad, charge side by side down a moonlit shortcut path with narrow spears lowered, rows of grey cloth medals bouncing on their chests. A gate of woven thorns stands behind them. Low-angle medium-wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
  },
  'empty-armor': {
    enemy: { name: 'Empty Armor', hp: 13, attack: 2, every: 5 },
    playerHp: 9,
    focus: 3,
    loadout: ['twinblade', 'hammer', 'spear', 'staff', 'lantern'],
    intro:
      "The empty armor raises a gauntlet and gives orders in the vanished queen's voice. Every fifth order is a blow, and it counts each one aloud. Nobody inside it can be talked out of the fight, so remember the pairs.",
    artPrompt:
      'An empty suit of polished royal plate armor with a thin gold circlet on its helm stands upright on a rocky ridge beside an ancient signal fire, one gauntlet raised to strike, its open visor showing a hollow dark interior. An old sentinel in a worn grey cloak watches from behind a boulder. A huge moon hangs behind them. Low-angle wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
  },
}

/** Optional House duels each launch their own authored enemy. */
export const HOUSE_DUEL_ROOMS = {
  'HD-09': 'hearth-guard',
  'HD-16': 'housekeeper',
  'HD-22': 'collector',
  'HD-28': 'twinned-guard',
} as const satisfies Record<string, CombatRoomId>

export type HouseDuelOrigin = keyof typeof HOUSE_DUEL_ROOMS

export function isHouseDuelOrigin(
  id: string | null | undefined,
): id is HouseDuelOrigin {
  return id === 'HD-09' || id === 'HD-16' || id === 'HD-22' || id === 'HD-28'
}

export function isCombatRoom(
  id: string | null | undefined,
): id is CombatRoomId {
  return (
    typeof id === 'string' &&
    Object.prototype.hasOwnProperty.call(COMBAT_ROOMS, id)
  )
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
export function restoreBriarCombat(
  input: unknown,
  roomId?: CombatRoomId,
): BriarCombat | null {
  if (!input || typeof input !== 'object') return null
  const saved = input as Partial<BriarCombat>
  const state = restoreCombat(saved.state)
  if (!state || !Array.isArray(saved.images)) return null
  if (roomId) {
    const room = COMBAT_ROOMS[roomId]
    if (
      !room ||
      state.rows !== COMBAT_ROWS ||
      state.cols !== COMBAT_COLS ||
      state.enemy.name !== room.enemy.name ||
      state.enemy.maxHp !== room.enemy.hp ||
      state.enemy.attack !== room.enemy.attack ||
      state.enemy.every !== room.enemy.every ||
      state.enemy.beatsLeft < 1 ||
      state.enemy.beatsLeft > room.enemy.every ||
      state.playerHp > room.playerHp ||
      state.focus > room.focus ||
      (state.history !== undefined &&
        (state.history.initialPlayerHp !== room.playerHp ||
          state.history.initialFocus !== room.focus ||
          state.history.actions.some(
            (action) =>
              action.type === 'strike' &&
              !room.loadout.includes(action.weaponId),
          )))
    )
      return null
  }
  const images = saved.images.filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  )
  const pairs = state.cards.filter((c) => c.pair !== null).length / 2
  if (images.length < pairs) return null
  return { state, images: images.slice(0, pairs) }
}
