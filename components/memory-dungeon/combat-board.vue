<template>
  <div class="flex min-h-0 flex-1 flex-col gap-2" @keydown="onKey">
    <div
      class="flex shrink-0 flex-wrap items-stretch justify-between gap-2 text-xs"
    >
      <div
        class="min-w-[11rem] flex-1 rounded-lg border border-[#8c4b3a] bg-[#2a1a1a]/85 px-3 py-2"
      >
        <div class="flex items-center justify-between font-black">
          <span>{{ fight.enemy.name }}</span>
          <span>{{ fight.enemy.hp }}/{{ fight.enemy.maxHp }}</span>
        </div>
        <div
          class="mt-1 h-2 overflow-hidden rounded bg-[#4a2c26]"
          role="meter"
          :aria-valuenow="fight.enemy.hp"
          :aria-valuemax="fight.enemy.maxHp"
          aria-valuemin="0"
          :aria-label="`${fight.enemy.name} health`"
        >
          <div
            class="h-full bg-[#e0664f] motion-safe:transition-all"
            :style="{ width: `${(100 * fight.enemy.hp) / fight.enemy.maxHp}%` }"
          />
        </div>
        <p class="mt-1 font-bold text-[#f3c9a8]">
          ⚔ Strikes for {{ fight.enemy.attack }} in
          <span class="text-base">{{ fight.enemy.beatsLeft }}</span>
          {{ fight.enemy.beatsLeft === 1 ? 'action' : 'actions' }}
        </p>
      </div>
      <div
        class="flex items-center gap-3 rounded-lg border border-[#c4aa72] bg-[#172120]/85 px-3 py-2 font-bold"
      >
        <span :aria-label="`Health ${fight.playerHp}`"
          >❤ {{ fight.playerHp }}</span
        >
        <span :aria-label="`Focus ${fight.focus}`">✦ {{ fight.focus }}</span>
        <span :aria-label="`Guard ${fight.guard}`">🛡 {{ fight.guard }}</span>
      </div>
    </div>

    <div
      class="flex shrink-0 flex-wrap gap-1.5"
      role="toolbar"
      aria-label="Weapons"
    >
      <button
        v-for="tool in tools"
        :key="tool.id"
        type="button"
        class="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-bold"
        :class="
          selected === tool.id
            ? 'border-[#f2d68f] bg-[#5b4a26] text-[#fff4da]'
            : 'border-[#7f6a45] bg-[#2b2a24] text-[#e8dcc0]'
        "
        :aria-pressed="selected === tool.id"
        :disabled="tool.blocked !== null"
        :title="tool.blocked ?? tool.hint"
        @click="choose(tool.id)"
      >
        <span
          class="grid gap-px"
          :style="{
            gridTemplateColumns: `repeat(${tool.icon.cols}, 0.4rem)`,
          }"
          aria-hidden="true"
        >
          <span
            v-for="(on, k) in tool.icon.cells"
            :key="k"
            class="h-[0.4rem] w-[0.4rem] rounded-[1px]"
            :class="on === 2 ? 'bg-[#f2d68f]' : on === 1 ? 'bg-[#c9b78f]' : ''"
          />
        </span>
        <span>{{ tool.label }}</span>
        <span v-if="tool.cost" class="font-normal opacity-80"
          >✦{{ tool.cost }}</span
        >
        <span v-if="tool.cooling" class="font-normal opacity-80"
          >⏳{{ tool.cooling }}</span
        >
      </button>
      <button
        v-if="rotations.length > 1"
        type="button"
        class="rounded-lg border border-[#7f6a45] bg-[#2b2a24] px-2 py-1.5 text-xs font-bold"
        aria-keyshortcuts="R"
        @click="rotate()"
      >
        ⟳ Rotate
      </button>
    </div>

    <div
      class="flex min-h-0 flex-1 items-center justify-center [container-type:size]"
    >
      <div
        class="grid aspect-square gap-1.5 sm:gap-2"
        :style="{
          width: 'min(100cqw, 100cqh)',
          gridTemplateColumns: `repeat(${fight.cols}, minmax(0, 1fr))`,
        }"
        role="grid"
        :aria-label="`${fight.rows} by ${fight.cols} memory board. Arrow keys move, Enter acts, R rotates, Escape returns to Scout.`"
      >
        <div v-for="r in fight.rows" :key="r" role="row" class="contents">
          <button
            v-for="c in fight.cols"
            :key="c"
            :ref="(el) => setCellRef(el, r - 1, c - 1)"
            type="button"
            role="gridcell"
            class="relative aspect-square min-h-0 min-w-0 overflow-hidden rounded-lg border-2 shadow-lg focus-visible:outline-2 focus-visible:outline-white motion-safe:transition"
            :class="cellClass(r - 1, c - 1)"
            :tabindex="isFocus(r - 1, c - 1) ? 0 : -1"
            :aria-label="cellLabel(r - 1, c - 1)"
            :disabled="world.turnLocked || fight.outcome !== 'fighting'"
            @mouseenter="aim(r - 1, c - 1)"
            @focus="aim(r - 1, c - 1)"
            @click="act(r - 1, c - 1)"
          >
            <img
              v-if="faceUp(r - 1, c - 1)"
              :src="imageAt(r - 1, c - 1)"
              class="h-full w-full object-cover"
              :class="cardAt(r - 1, c - 1)?.matched ? 'opacity-55' : ''"
              alt=""
              draggable="false"
            />
            <span
              v-else
              class="flex h-full w-full items-center justify-center bg-[#29384b] text-2xl text-[#dec28a]"
              aria-hidden="true"
              >✦</span
            >
            <span
              v-if="bullseyeAt(r - 1, c - 1)"
              class="pointer-events-none absolute inset-0 m-auto h-1/2 w-1/2 rounded-full border-4 border-[#f2d68f]"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>

    <p
      class="shrink-0 rounded-lg bg-[#172120]/85 px-3 py-2 text-xs"
      aria-live="polite"
    >
      <span v-if="previewProblem" class="font-bold text-[#f3a08f]">{{
        previewProblem
      }}</span>
      <span v-else>{{ world.combatNote || hint }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import {
  WEAPONS,
  cellName,
  includesCell,
  index as cellIndex,
  maskAt,
  strikeBlocked,
  weaponMask,
  type Cell,
  type CombatState,
  type WeaponId,
} from '~/utils/memoryDungeon/combat'
import { COMBAT_ROOMS, isCombatRoom } from '~/utils/memoryDungeon/rooms'

type ToolId = 'scout' | WeaponId

const world = useMemoryWorldStore()
const fight = computed(() => world.state.combat!.state as CombatState)
const selected = ref<ToolId>('scout')
const rotation = ref(0)
const focus = ref<Cell>({ row: 0, col: 0 })
const cellRefs = new Map<string, HTMLButtonElement>()

const loadout = computed<WeaponId[]>(() =>
  isCombatRoom(world.state.roomId)
    ? COMBAT_ROOMS[world.state.roomId].loadout
    : [],
)

function shapeIcon(id: ToolId) {
  if (id === 'scout') return { cols: 2, cells: [1, 0, 0, 1] }
  const mask = weaponMask({ rows: 8, cols: 8 }, id, { row: 0, col: 0 }, 0)
  const rows = Math.max(...mask.cells.map((c) => c.row)) + 1
  const cols = Math.max(...mask.cells.map((c) => c.col)) + 1
  const cells: number[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cell = { row: r, col: c }
      cells.push(
        includesCell(mask.bullseye, cell)
          ? 2
          : includesCell(mask.cells, cell)
            ? 1
            : 0,
      )
    }
  return { cols, cells }
}

const tools = computed(() =>
  (['scout', ...loadout.value] as ToolId[]).map((id) => {
    if (id === 'scout')
      return {
        id,
        label: 'Scout',
        hint: 'Flip two cards, choosing the second after seeing the first.',
        cost: 0,
        cooling: 0,
        blocked: null as string | null,
        icon: shapeIcon(id),
      }
    const weapon = WEAPONS[id]
    const cooling = fight.value.cooldowns[id] ?? 0
    const blocked =
      cooling > 0
        ? 'Still cooling down.'
        : fight.value.focus < weapon.focusCost
          ? 'Not enough Focus.'
          : null
    return {
      id,
      label: weapon.name,
      hint: weapon.matches
        ? 'Reveals its shape at once; pairs inside it hit, a pair on the bullseye hits harder.'
        : 'Reveals its square to scout; it never resolves a pair.',
      cost: weapon.focusCost,
      cooling,
      blocked,
      icon: shapeIcon(id),
    }
  }),
)

const rotations = computed(() =>
  selected.value === 'scout' ? [0] : [...WEAPONS[selected.value].rotations],
)

const preview = computed(() =>
  selected.value === 'scout'
    ? null
    : maskAt(fight.value, selected.value, focus.value, rotation.value),
)

const previewProblem = computed(() => {
  if (!preview.value || selected.value === 'scout') return ''
  return strikeBlocked(fight.value, selected.value, preview.value.mask) ?? ''
})

const hint = computed(() =>
  selected.value === 'scout'
    ? 'Scout: flip a card, then its partner. Every action is one beat of the enemy countdown.'
    : `${WEAPONS[selected.value].name}: aim at ${cellName(focus.value)} and strike. Pairs fully inside the shape hit.`,
)

function choose(id: ToolId) {
  selected.value = selected.value === id ? 'scout' : id
  rotation.value = 0
}

function rotate() {
  const list = rotations.value
  const at = list.indexOf(rotation.value)
  rotation.value = list[(at + 1) % list.length] ?? 0
}

const cardAt = (row: number, col: number) =>
  fight.value.cards[cellIndex(fight.value.cols, { row, col })]

function faceUp(row: number, col: number) {
  const i = cellIndex(fight.value.cols, { row, col })
  const card = fight.value.cards[i]
  if (!card || card.pair === null) return false
  return card.matched || world.combatShown.includes(i) || world.combatPick === i
}

function imageAt(row: number, col: number) {
  const pair = cardAt(row, col)?.pair
  return pair === null || pair === undefined
    ? ''
    : (world.state.combat?.images[pair] ?? '')
}

const inPreview = (row: number, col: number) =>
  !!preview.value && includesCell(preview.value.mask.cells, { row, col })

const bullseyeAt = (row: number, col: number) =>
  !!preview.value && includesCell(preview.value.mask.bullseye, { row, col })

function cellClass(row: number, col: number) {
  const card = cardAt(row, col)
  if (inPreview(row, col))
    return previewProblem.value
      ? 'border-[#e0664f] brightness-75'
      : 'border-[#f2d68f] ring-2 ring-[#f2d68f]'
  if (card?.matched) return 'border-[#b6dc88]'
  return 'border-[#c1a56f] hover:brightness-110'
}

function cellLabel(row: number, col: number) {
  const card = cardAt(row, col)
  const where = cellName({ row, col })
  const state = card?.matched
    ? 'matched'
    : faceUp(row, col)
      ? 'showing its picture'
      : 'face down'
  const aimed = inPreview(row, col)
    ? `, in the ${WEAPONS[selected.value as WeaponId].name} shape${bullseyeAt(row, col) ? ', bullseye' : ''}`
    : ''
  return `${where}, ${state}${aimed}`
}

const isFocus = (row: number, col: number) =>
  focus.value.row === row && focus.value.col === col

function aim(row: number, col: number) {
  focus.value = { row, col }
}

function act(row: number, col: number) {
  focus.value = { row, col }
  if (selected.value === 'scout') {
    world.combatScout({ row, col })
    return
  }
  const placed = preview.value
  if (!placed || previewProblem.value) return
  world.combatStrike(selected.value, placed.anchor, rotation.value)
  selected.value = 'scout'
  rotation.value = 0
}

function setCellRef(el: unknown, row: number, col: number) {
  if (el instanceof HTMLButtonElement) cellRefs.set(`${row},${col}`, el)
}

function onKey(event: KeyboardEvent) {
  const moves: Record<string, [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  }
  const move = moves[event.key]
  if (move) {
    event.preventDefault()
    const row = Math.min(
      fight.value.rows - 1,
      Math.max(0, focus.value.row + move[0]),
    )
    const col = Math.min(
      fight.value.cols - 1,
      Math.max(0, focus.value.col + move[1]),
    )
    focus.value = { row, col }
    nextTick(() => cellRefs.get(`${row},${col}`)?.focus())
  } else if (event.key === 'r' || event.key === 'R') {
    if (rotations.value.length > 1) rotate()
  } else if (event.key === 'Escape') {
    selected.value = 'scout'
    rotation.value = 0
  }
}

// A weapon that cools down or runs out of Focus drops back to Scout.
watch(tools, (list) => {
  const current = list.find((t) => t.id === selected.value)
  if (current?.blocked) selected.value = 'scout'
})
</script>
