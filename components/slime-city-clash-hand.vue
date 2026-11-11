<!-- /components/slime-city-clash-hand.vue -->
<!--
  CLASH HAND. Silas, 2026-11-07 PT: "The cards shift the layout in and out
  during turns and it's awkward ... I really want it to look like a floating
  icon when closed, and a hand of fanned out cards that grow large and show the
  text when selected. This needs great and fluid animation."

  The hand never takes layout space: it floats in a fixed-height zone at the
  bottom of the Clash screen. Closed, it is a deck icon; open, the cards fan
  out of that icon. A selected card straightens, grows to full size and shows
  its rules; drag a card onto an alley or tap a glowing alley to play it.
  Cards are authored at full size and scaled down at rest, so the big card's
  text renders crisp. Each card sits in a still wrapper (the TransitionGroup
  child) so Vue's move-FLIP never fights the fan's own transforms.
-->
<template>
  <div
    class="cxh"
    :class="{ open: isOpen, holding: big !== null || !!inspectCard }"
    data-testid="clash-hand"
  >
    <TransitionGroup
      tag="div"
      name="cxh-deal"
      class="cxh-fan"
      aria-label="Cards in your hand"
      @before-leave="markLeaving"
    >
      <div
        v-for="(cardId, index) in cards"
        :key="cardId"
        class="cxh-slot"
        :data-id="cardId"
        :style="fanStyle(index)"
      >
        <button
          type="button"
          class="cxh-card"
          :class="{
            big: big === index,
            dim: !playable(cardId),
            dragging: drag?.index === index && drag.moved,
          }"
          :style="
            drag?.index === index && drag.moved
              ? { '--dx': drag.dx + 'px', '--dy': drag.dy + 'px' }
              : undefined
          "
          :tabindex="isOpen ? 0 : -1"
          :aria-pressed="held === index"
          :aria-label="
            cardById(cardId).name +
            '. ' +
            (isFree(cardId) ? 'Free play. ' : '') +
            clashCardText(cardById(cardId), clashLevel(game, 'player', cardId))
          "
          :data-testid="'clash-hand-' + index"
          @pointerdown="grab($event, index)"
          @pointerenter="hoverOn($event, index)"
          @pointerleave="hoverOff(index)"
          @click="tap(index)"
        >
          <SlimeCityClashCardFace
            :card-id="cardId"
            :level="
              big === index && previewLevel
                ? previewLevel
                : clashLevel(game, 'player', cardId)
            "
            :preview="
              big === index &&
              !!previewLevel &&
              previewLevel !== clashLevel(game, 'player', cardId)
            "
          />
          <span
            v-if="isFree(cardId)"
            class="cxh-free"
            data-testid="clash-free-play"
            >FREE</span
          >
        </button>
      </div>
    </TransitionGroup>

    <Transition name="cxh-pop">
      <div
        v-if="peekCard"
        :key="'peek-' + peekCard.id"
        class="cxh-card big cxh-inspect cxh-peek"
        :class="'dock-' + peekCard.dock"
        data-testid="clash-peek"
        aria-hidden="true"
      >
        <SlimeCityClashCardFace
          :card-id="peekCard.id"
          :note="peekCard.note"
          :level="peekCard.level"
          :pick="peekCard.pick"
        />
      </div>
      <div
        v-else-if="inspectCard"
        :key="inspectCard.id + inspectCard.note"
        class="cxh-card big cxh-inspect"
        :class="'dock-' + (inspectCard.dock ?? 'right')"
        data-testid="clash-detail"
        aria-live="polite"
      >
        <SlimeCityClashCardFace
          :card-id="inspectCard.id"
          :note="previewLevel ? '' : inspectCard.note"
          :level="previewLevel ?? inspectCard.level"
          :pick="previewLevel ? undefined : inspectCard.pick"
          :preview="!!previewLevel && previewLevel !== inspectCard.level"
        />
      </div>
    </Transition>

    <div
      v-if="shown && !peekCard"
      class="cxh-levels"
      :class="{
        docked: big === null,
        'dock-left': inspectCard?.dock === 'left',
      }"
      role="tablist"
      aria-label="Preview this card at each level"
      data-testid="clash-level-tabs"
    >
      <button
        v-for="n in CLASH_MAX_LEVEL"
        :key="n"
        type="button"
        role="tab"
        :aria-selected="(previewLevel ?? shown.level) === n"
        :class="{
          on: (previewLevel ?? shown.level) === n,
          now: shown.level === n,
        }"
        @click="previewLevel = n === shown.level ? null : n"
      >
        LV {{ n }}<small>{{ shown.level === n ? 'NOW' : 'PREVIEW' }}</small>
      </button>
    </div>

    <Transition name="cxh-toast">
      <p
        v-if="toast"
        :key="toast.key"
        class="cxh-levelup"
        :class="{ max: toast.max }"
        data-testid="clash-level-up"
        aria-live="polite"
      >
        <b>{{ toast.max ? 'MAX LEVEL' : 'LEVEL UP' }}</b>
        <span>{{ toast.text }}</span>
      </p>
    </Transition>

    <Teleport to="#clash-hand-dock" defer>
      <button
        type="button"
        class="cxh-toggle"
        :aria-expanded="isOpen"
        :aria-label="
          isOpen
            ? 'Close your hand'
            : 'Open your hand: ' + cards.length + ' cards'
        "
        data-testid="clash-hand-toggle"
        @click="toggle"
      >
        <span class="cxh-stack" aria-hidden="true"
          ><i v-for="n in 3" :key="n" :style="{ '--n': n }"
        /></span>
        <b>{{ cards.length }}</b>
        <small>{{ game.decks.player.length }} DECK</small>
      </button>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { cardById, type Side } from '~/utils/slimeCity/prototypes'
import {
  CLASH_MAX_LEVEL,
  clashPlayLimit,
  canClashPlay,
  CLASH_LANES,
  clashCardText,
  clashLevel,
  clashEffectivePlayCost,
  type ClashState,
} from '~/utils/slimeCity/clash'

const props = defineProps<{
  game: ClashState
  held: number | null
  inspect: {
    id: string
    note: string
    level: number
    pick?: 0 | 1
    hover?: boolean
    dock?: 'left' | 'right'
  } | null
}>()
const emit = defineEmits<{
  pick: [index: number | null]
  drop: [index: number, side: Side, lane: number]
}>()

const cards = computed(() => props.game.hands.player)
const ready = computed(
  () =>
    !props.game.victor &&
    props.game.active === 'player' &&
    props.game.phase === 'play',
)
const userClosed = ref(false)
const userPeek = ref(false)
const isOpen = computed(() =>
  ready.value ? !userClosed.value : userPeek.value && cards.value.length > 0,
)
watch(ready, (now) => {
  userClosed.value = false
  if (now) userPeek.value = false
})
function toggle(): void {
  if (ready.value) userClosed.value = !userClosed.value
  else userPeek.value = !userPeek.value
  if (!isOpen.value) emit('pick', null)
}
const big = computed(() => (isOpen.value ? props.held : null))
/** Silas, 2026-11-07 PT: "The user should be able to select to see the upgraded versions." */
const previewLevel = ref<number | null>(null)
const inspectCard = computed(() =>
  props.inspect &&
  !props.inspect.hover &&
  (props.held === null || !isOpen.value)
    ? props.inspect
    : null,
)
/**
 * Silas, 2026-11-10 PT: "When we hover over cards, we should see them bigger
 * and have the full info of the card." A mouse hover docks the full card to
 * one side of the board, where it never sits under the pointer.
 */
const hoverIndex = ref<number | null>(null)
function hoverOn(event: PointerEvent, index: number): void {
  if (event.pointerType === 'mouse' && isOpen.value && !drag.value)
    hoverIndex.value = index
}
function hoverOff(index: number): void {
  if (hoverIndex.value === index) hoverIndex.value = null
}
watch(isOpen, (open) => {
  if (!open) hoverIndex.value = null
})
const peekCard = computed<{
  id: string
  note: string
  level: number
  pick?: 0 | 1
  dock: 'left' | 'right'
} | null>(() => {
  // Something clicked (a held card or a pinned fighter) keeps its level tabs;
  // hover previews only while nothing is pinned.
  if (props.held !== null || (props.inspect && !props.inspect.hover))
    return null
  const index = hoverIndex.value
  const id = index === null ? null : cards.value[index]
  if (id && !drag.value)
    return {
      id,
      note: '',
      level: clashLevel(props.game, 'player', id),
      dock: index! < cards.value.length / 2 ? 'right' : 'left',
    }
  return props.inspect?.hover
    ? { ...props.inspect, dock: props.inspect.dock ?? 'right' }
    : null
})
const shown = computed<{ id: string; level: number } | null>(() => {
  const id = big.value === null ? null : cards.value[big.value]
  if (id) return { id, level: clashLevel(props.game, 'player', id) }
  return inspectCard.value
    ? { id: inspectCard.value.id, level: inspectCard.value.level }
    : null
})
watch(
  () => shown.value?.id,
  () => (previewLevel.value = null),
)

function isFree(id: string): boolean {
  return (
    ready.value &&
    clashEffectivePlayCost(props.game, 'player', cardById(id)) === 0
  )
}
function playable(id: string): boolean {
  return (
    ready.value &&
    clashEffectivePlayCost(props.game, 'player', cardById(id)) +
      props.game.plays.player <=
      clashPlayLimit(props.game, 'player') &&
    Array.from({ length: CLASH_LANES }, (_, lane) => lane).some((lane) =>
      canClashPlay(props.game, 'player', id, lane),
    )
  )
}
function fanStyle(index: number): Record<string, string> {
  const n = cards.value.length
  const offset = index - (n - 1) / 2
  return {
    '--i': String(index),
    '--o': offset.toFixed(2),
    '--n1': String(Math.max(1, n - 1)),
    '--rot': (offset * 7).toFixed(2) + 'deg',
    '--drop': (Math.abs(offset) ** 2 * 0.22).toFixed(3) + 'rem',
  }
}

/** The last card the player played leaves upward; the rest sweep to the deck. */
const lastPlayed = computed(() => {
  for (let i = props.game.commands.length - 1; i >= 0; i--) {
    const c = props.game.commands[i]!
    if (c.t === 'play' && c.side === 'player') return c.card
    if (c.t === 'end') return null
  }
  return null
})
const toast = ref<{ key: number; text: string; max: boolean } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => props.game.commands.length,
  (now, before) => {
    const c = props.game.commands[now - 1]
    if (now <= before || c?.t !== 'play' || c.side !== 'player') return
    const level = clashLevel(props.game, 'player', c.card)
    toast.value = {
      key: now,
      text: cardById(c.card).name + ' · LV ' + level,
      max: level >= CLASH_MAX_LEVEL,
    }
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = null), 1700)
  },
)
onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
function markLeaving(el: Element): void {
  ;(el as HTMLElement).classList.toggle(
    'played',
    (el as HTMLElement).dataset.id === lastPlayed.value,
  )
}

const drag = ref<{
  index: number
  pointer: number
  x: number
  y: number
  dx: number
  dy: number
  moved: boolean
} | null>(null)
let swallowClick = false
function grab(event: PointerEvent, index: number): void {
  if (event.button !== 0 || !playable(cards.value[index]!)) return
  drag.value = {
    index,
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    dx: 0,
    dy: 0,
    moved: false,
  }
  window.addEventListener('pointermove', follow)
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', abandon)
}
function follow(event: PointerEvent): void {
  const d = drag.value
  if (!d || event.pointerId !== d.pointer) return
  const dx = event.clientX - d.x
  const dy = event.clientY - d.y
  if (!d.moved && Math.hypot(dx, dy) < 10) return
  if (!d.moved && props.held !== d.index) emit('pick', d.index)
  hoverIndex.value = null
  drag.value = { ...d, dx, dy, moved: true }
}
function release(event: PointerEvent): void {
  const d = drag.value
  if (d?.moved && event.pointerId === d.pointer) {
    swallowClick = true
    const slot = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-clash-lane]')
    if (slot)
      emit(
        'drop',
        d.index,
        slot.dataset.clashSide as Side,
        Number(slot.dataset.clashLane),
      )
  }
  abandon()
}
function abandon(): void {
  drag.value = null
  window.removeEventListener('pointermove', follow)
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', abandon)
}
onBeforeUnmount(abandon)
function tap(index: number): void {
  if (swallowClick) {
    swallowClick = false
    return
  }
  if (!isOpen.value) return
  emit('pick', props.held === index ? null : index)
}
</script>

<style scoped>
.cxh {
  --W: clamp(8rem, min(30cqw, 40cqh), 15rem);
  --rest: 0.5;
  --peek: 0.6;
  --ease: cubic-bezier(0.2, 0.9, 0.25, 1.12);
  container-type: size;
  position: absolute;
  inset: 0;
  overflow: clip;
  pointer-events: none;
  z-index: 6;
}
.cxh-fan {
  position: absolute;
  inset: 0;
}
.cxh-slot {
  --icon-x: calc(50cqw + var(--shift, 0rem));
  position: absolute;
  left: calc(50% - var(--shift, 0rem));
  bottom: 0;
  width: 0;
  height: 0;
}
.cxh-card {
  --dx: 0px;
  --dy: 0px;
  --x: calc(
    var(--o) *
      min(
        var(--W) * var(--rest) * 0.74,
        (100cqw - var(--W) * var(--rest) - 2rem) / var(--n1, 1)
      )
  );
  --y: calc(var(--W) * 1.5 * var(--rest) * (1 - var(--peek)) + var(--drop));
  --s: var(--rest);
  --r: var(--rot);
  position: absolute;
  left: 0;
  bottom: 0;
  width: var(--W);
  aspect-ratio: 2 / 3;
  padding: 0;
  border: 0;
  border-radius: 1rem;
  background: none;
  color: #f3fbf6;
  pointer-events: auto;
  transform-origin: 50% 100%;
  transform: translate(
      calc(-50% + var(--x) + var(--dx)),
      calc(var(--y) + var(--dy))
    )
    rotate(var(--r)) scale(var(--s));
  opacity: 1;
  transition:
    transform 0.46s var(--ease),
    opacity 0.3s ease,
    filter 0.3s ease;
  transition-delay: calc(var(--i, 0) * 32ms);
  cursor: pointer;
  touch-action: none;
}
.cxh:not(.open) .cxh-card {
  --x: var(--icon-x);
  --y: 1.2rem;
  --s: 0.18;
  --r: calc(var(--rot) + 14deg);
  opacity: 0;
  pointer-events: none;
}
.cxh.open .cxh-card:hover:not(.big):not(.dragging) {
  --y: calc(
    var(--W) * 1.5 * var(--rest) * (1 - var(--peek)) * 0.25 + var(--drop)
  );
  --s: calc(var(--rest) * 1.08);
  --r: 0deg;
  transition-delay: 0ms;
  z-index: 2;
}
.cxh.holding .cxh-card:not(.big) {
  --y: calc(var(--W) * 1.5 * var(--rest) * 0.78);
  transition-delay: 0ms;
}
.cxh-card.dim {
  filter: saturate(0.35) brightness(0.7);
}
.cxh-free {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  z-index: 2;
  padding: 0.18rem 0.45rem;
  border-radius: 0.4rem;
  border: 1px solid #fff4ad;
  background: #113d30ed;
  color: #f5ffbf;
  font-weight: 950;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  pointer-events: none;
}
.cxh-card.big {
  --x: 0px;
  --y: -0.5rem;
  --s: 1;
  --r: 0deg;
  z-index: 5;
  transition-delay: 0ms;
}
.cxh-card.dragging {
  --s: 0.42;
  --r: 0deg;
  z-index: 8;
  transition:
    transform 0.08s linear,
    opacity 0.2s;
  pointer-events: none;
}
.cxh-levelup {
  position: absolute;
  left: 50%;
  bottom: calc(var(--W) * 1.5 * var(--rest) * var(--peek) + 1.2rem);
  transform: translateX(-50%);
  margin: 0;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 2px solid #ffd34d;
  background: #1b1405ee;
  color: #ffe6a6;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  white-space: nowrap;
  box-shadow: 0 0 22px #ffb80077;
  pointer-events: none;
  z-index: 9;
}
.cxh-levelup b {
  font-size: 0.8rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  color: #ffd34d;
}
.cxh-levelup span {
  font-size: 0.78rem;
  font-weight: 800;
}
.cxh-levelup.max {
  border-color: #ff8fd2;
  box-shadow: 0 0 22px #ff5fa288;
}
.cxh-toast-enter-active {
  animation: cxh-toast 0.55s var(--ease) both;
}
.cxh-toast-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.cxh-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -1.2rem);
}
@keyframes cxh-toast {
  from {
    opacity: 0;
    transform: translate(-50%, 1rem) scale(0.6);
  }
  60% {
    opacity: 1;
    transform: translate(-50%, -0.3rem) scale(1.12);
  }
}
.cxh-levels {
  position: absolute;
  left: 50%;
  bottom: calc(var(--W) * 1.5 + 0.9rem);
  transform: translateX(-50%);
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: #061418ee;
  border: 1px solid #b9f15155;
  box-shadow: 0 6px 18px #000a;
  pointer-events: auto;
  z-index: 9;
  animation: cxh-tabs 0.35s var(--ease) both;
}
.cxh-levels button {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3.4rem;
  padding: 0.25rem 0.55rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #cfe3dc;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}
.cxh-levels button small {
  font-size: 0.52rem;
  letter-spacing: 0.1em;
  opacity: 0.75;
}
.cxh-levels button.on {
  background: #ffd34d;
  color: #1b1405;
}
.cxh-levels button.now:not(.on) {
  color: #b9f151;
}
@keyframes cxh-tabs {
  from {
    opacity: 0;
    transform: translate(-50%, 0.6rem);
  }
}
.cxh-inspect {
  --pop-x: 0rem;
  top: 50%;
  bottom: auto;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
}
.cxh-inspect.dock-right {
  left: auto;
  right: 0.6rem;
  --pop-x: 2rem;
}
.cxh-inspect.dock-left {
  left: 0.6rem;
  --pop-x: -2rem;
}
.cxh .cxh-card.cxh-inspect {
  opacity: 1;
  filter: none;
}
.cxh-levels.docked {
  left: auto;
  right: calc(0.6rem + var(--W) / 2);
  bottom: auto;
  top: calc(50% - var(--W) * 0.75 - 2.9rem);
  transform: translateX(50%);
  animation: none;
}
.cxh-levels.docked.dock-left {
  right: auto;
  left: calc(0.6rem + var(--W) / 2);
  transform: translateX(-50%);
}
.cxh-card.big {
  --rules-open: 1;
}
.cxh-card.big :deep(.ccf) {
  border-color: #f8ffad;
  box-shadow:
    0 0 0 3px #f8ffad44,
    0 0 34px #b9f15166,
    0 18px 40px #000c;
}
.cxh-toggle {
  position: relative;
  flex: none;
  width: 3.4rem;
  height: 3.4rem;
  cursor: pointer;
  border-radius: 999px;
  border: 2px solid #b9f15199;
  background: radial-gradient(circle at 35% 30%, #2c5a4f, #0b1f24);
  color: #f3fbf6;
  pointer-events: auto;
  display: grid;
  place-items: center;
  box-shadow:
    0 6px 18px #000b,
    0 0 16px #b9f15133;
  animation: cxh-float 3.2s ease-in-out infinite;
  transition:
    transform 0.3s var(--ease),
    border-color 0.3s;
  z-index: 7;
}
.cxh-toggle[aria-expanded='true'] {
  transform: scale(0.9);
  border-color: #ffffff55;
  animation: none;
}
.cxh-stack {
  position: absolute;
  inset: 0;
}
.cxh-stack i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1.35rem;
  height: 2rem;
  margin: -1.15rem 0 0 -0.68rem;
  border-radius: 0.25rem;
  border: 1px solid #d7ff8999;
  background: repeating-linear-gradient(45deg, #1d4a40 0 4px, #13332e 4px 8px);
  transform: rotate(calc((var(--n) - 2) * 14deg))
    translateX(calc((var(--n) - 2) * 0.28rem));
  transition: transform 0.35s var(--ease);
}
.cxh-toggle[aria-expanded='true'] .cxh-stack i {
  transform: rotate(calc((var(--n) - 2) * 24deg))
    translateX(calc((var(--n) - 2) * 0.45rem));
}
.cxh-toggle b {
  position: absolute;
  top: -0.3rem;
  right: -0.3rem;
  min-width: 1.4rem;
  height: 1.4rem;
  border-radius: 999px;
  background: #ff5fa2;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 950;
  display: grid;
  place-items: center;
}
.cxh-toggle small {
  position: absolute;
  bottom: -0.95rem;
  font-size: 0.52rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: #b5dfd1;
}
@keyframes cxh-float {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -0.3rem;
  }
}
/* Deal: each card flies out of the deck icon and flips into the fan. */
.cxh-deal-enter-active {
  animation: cxh-deal 0.6s var(--ease) both;
  animation-delay: calc(var(--i) * 70ms);
}
.cxh-deal-leave-active {
  animation: cxh-discard 0.42s cubic-bezier(0.5, 0, 0.75, 0) both;
  animation-delay: calc(var(--i) * 40ms);
}
.cxh-deal-leave-active.played {
  animation: cxh-played 0.42s cubic-bezier(0.5, 0, 0.75, 0) both;
}
@keyframes cxh-deal {
  from {
    transform: translate(
        calc(var(--icon-x) - var(--o) * var(--W) * var(--rest) * 0.74),
        3rem
      )
      rotate(35deg) scale(0.3);
    opacity: 0;
  }
  35% {
    opacity: 1;
  }
}
@keyframes cxh-discard {
  to {
    transform: translate(
        calc(var(--icon-x) - var(--o) * var(--W) * var(--rest) * 0.74),
        3rem
      )
      rotate(-25deg) scale(0.25);
    opacity: 0;
  }
}
@keyframes cxh-played {
  to {
    transform: translateY(-45cqw) scale(0.6);
    opacity: 0;
  }
}
.cxh-pop-enter-active,
.cxh-pop-leave-active {
  transition:
    transform 0.4s var(--ease),
    opacity 0.25s ease;
}
.cxh-pop-enter-from,
.cxh-pop-leave-to {
  transform: translate(var(--pop-x), -50%) scale(0.7);
  opacity: 0;
}
@container (max-width: 40rem) {
  .cxh-card {
    --rest: 0.4;
    --peek: 0.72;
  }
}
/*
  Silas, 2026-11-11 PT, on an iPhone: "Those cards are tiny, this is
  unreadable ... the cards should start at the very screen bottom." On narrow
  or tall screens the hand spans the whole Clash layout and rests in its own
  bottom row at readable size; between turns it stays in view, dimmed.
*/
@container clash (max-width: 46rem) or (max-aspect-ratio: 1 / 1) {
  .cxh {
    --W: min(15rem, 44cqw, 42cqh);
  }
  .cxh-card {
    --rest: 0.62;
    --peek: 0.74;
  }
  .cxh:not(.open) .cxh-card {
    --x: calc(
      var(--o) *
        min(
          var(--W) * var(--rest) * 0.74,
          (100cqw - var(--W) * var(--rest) - 2rem) / var(--n1, 1)
        )
    );
    --y: calc(var(--W) * 1.5 * var(--rest) * (1 - var(--peek)) + var(--drop));
    --s: var(--rest);
    --r: var(--rot);
    opacity: 0.55;
  }
  .cxh-card.big {
    --s: 0.8;
  }
  .cxh-levels:not(.docked) {
    top: 0.3rem;
    bottom: auto;
  }
  .cxh-levels button {
    min-width: 2.9rem;
    padding: 0.2rem 0.45rem;
  }
}
@media (max-width: 700px) {
  .cxh-toggle {
    width: 3rem;
    height: 3rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cxh-card,
  .cxh-stack i {
    transition-duration: 0.12s;
    transition-delay: 0ms;
  }
  .cxh-toggle {
    animation: none;
  }
  .cxh-deal-enter-active,
  .cxh-deal-leave-active,
  .cxh-deal-leave-active.played {
    animation-duration: 0.15s;
    animation-delay: 0ms;
  }
}
</style>
