<!-- /components/navigation/swipe-deck.vue
     Tinder-style art-first swipe deck. Art fills the card in portrait orientation.
     Drag/swipe right = select, left = skip. Touch and mouse pointer events both work.
     Cards behind the active one are visible as a depth stack. -->
<template>
  <div class="flex h-full min-h-[32rem] flex-col items-center gap-4 overflow-hidden rounded-2xl bg-base-300/40 p-4 sm:p-6">
    <!-- ── Card stack ────────────────────────────────────────────────── -->
    <div class="relative flex w-full max-w-xs flex-1 items-center justify-center sm:max-w-sm">
      <!-- Depth cards — purely visual, show next items -->
      <template v-for="depth in [2, 1]" :key="depth">
        <div
          v-if="peekItem(depth)"
          class="absolute w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow"
          :style="depthCardStyle(depth)"
          aria-hidden="true"
        >
          <div class="aspect-[3/4] w-full overflow-hidden">
            <img
              v-if="peekItem(depth)?.imagePath"
              :src="peekItem(depth)!.imagePath"
              :alt="peekItem(depth)!.title"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <div v-else class="flex h-full items-center justify-center bg-base-300">
              <Icon name="kind-icon:image" class="h-10 w-10 text-base-content/15" />
            </div>
          </div>
          <div class="p-3">
            <p class="truncate text-sm font-black text-base-content/30">{{ peekItem(depth)?.title }}</p>
          </div>
        </div>
      </template>

      <!-- Active card -->
      <div
        v-if="currentItem"
        ref="cardEl"
        class="relative w-full cursor-grab select-none overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl active:cursor-grabbing"
        :style="activeCardStyle"
        @pointerdown.prevent="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <!-- LIKE indicator (right swipe) -->
        <div
          class="absolute left-4 top-4 z-10 rounded-xl border-2 border-success px-3 py-1 text-lg font-black uppercase text-success transition-opacity duration-75"
          :style="{ opacity: likeOpacity }"
          aria-hidden="true"
        >
          Like
        </div>
        <!-- NOPE indicator (left swipe) -->
        <div
          class="absolute right-4 top-4 z-10 rounded-xl border-2 border-error px-3 py-1 text-lg font-black uppercase text-error transition-opacity duration-75"
          :style="{ opacity: nopeOpacity }"
          aria-hidden="true"
        >
          Nope
        </div>

        <!-- Art (portrait orientation) -->
        <div class="relative aspect-[3/4] w-full overflow-hidden bg-base-300">
          <img
            v-if="currentItem.imagePath"
            :src="currentItem.imagePath"
            :alt="currentItem.title"
            class="h-full w-full object-cover"
            draggable="false"
            loading="eager"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10"
          >
            <Icon name="kind-icon:image" class="h-20 w-20 text-base-content/15" />
          </div>
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent" />
        </div>

        <!-- Info panel -->
        <div class="p-4">
          <h3 class="text-xl font-black leading-tight text-base-content">
            {{ currentItem.title }}
          </h3>
          <p v-if="currentItem.description" class="mt-1 line-clamp-2 text-sm text-base-content/65">
            {{ currentItem.description }}
          </p>
          <!-- Deck position hint -->
          <p class="mt-2 text-xs font-semibold tabular-nums text-base-content/30">
            {{ deckPosition }}
          </p>
        </div>
      </div>

      <!-- All-done state -->
      <div
        v-else
        class="flex flex-col items-center gap-4 py-12 text-center"
      >
        <Icon name="kind-icon:sparkles" class="h-16 w-16 text-primary/40" />
        <p class="text-lg font-black text-base-content/60">Deck complete!</p>
        <p class="text-sm text-base-content/40">You've seen everything in this stack.</p>
        <button type="button" class="btn btn-primary btn-sm rounded-xl" @click="reset">
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Reset deck
        </button>
      </div>
    </div>

    <!-- ── Action buttons ────────────────────────────────────────────── -->
    <div v-if="currentItem" class="flex shrink-0 items-center gap-5">
      <!-- Skip -->
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-error/40 bg-base-100 shadow transition hover:border-error hover:bg-error/10 hover:shadow-md"
        aria-label="Skip"
        @click="swipeLeft"
      >
        <Icon name="kind-icon:x" class="h-6 w-6 text-error" />
      </button>

      <!-- Info / open -->
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-base-300 bg-base-100 shadow transition hover:border-primary/60 hover:bg-primary/10"
        aria-label="Open"
        @click="onInfoClick"
      >
        <Icon name="kind-icon:info" class="h-5 w-5 text-base-content/60" />
      </button>

      <!-- Select / like -->
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-success/40 bg-base-100 shadow transition hover:border-success hover:bg-success/10 hover:shadow-md"
        aria-label="Select"
        @click="swipeRight"
      >
        <Icon name="kind-icon:check" class="h-6 w-6 text-success" />
      </button>
    </div>

    <!-- Mini dot progress (capped at 12 dots) -->
    <div v-if="items.length > 1 && currentItem" class="flex shrink-0 items-center gap-1">
      <template v-if="items.length <= 12">
        <div
          v-for="(_, i) in items"
          :key="i"
          class="rounded-full bg-base-300 transition-all"
          :class="
            i < swipedCount
              ? 'h-1.5 w-1.5 bg-primary/40'
              : i === swipedCount
                ? 'h-1.5 w-3 bg-primary'
                : 'h-1.5 w-1.5'
          "
        />
      </template>
      <span v-else class="text-xs tabular-nums text-base-content/35">
        {{ swipedCount + 1 }}&thinsp;/&thinsp;{{ items.length }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'

interface GalleryItem {
  id: number | string
  title: string
  imagePath: string
  description: string
}

const props = defineProps<{
  items: GalleryItem[]
}>()

const emit = defineEmits<{
  select: [{ id: number | string }]
}>()

// ── State ─────────────────────────────────────────────────────────────
const swipedCount = ref(0)
const dragX = ref(0)
const isDragging = ref(false)
const isFlying = ref(false)
const flyDir = ref<'left' | 'right' | null>(null)
const cardEl = ref<HTMLElement | null>(null)

let pointerId = -1
let startX = 0

// ── Derived ───────────────────────────────────────────────────────────
const currentItem = computed<GalleryItem | null>(
  () => props.items[swipedCount.value] ?? null,
)

const deckPosition = computed(() => {
  const remaining = props.items.length - swipedCount.value
  return remaining <= 1 ? 'Last one!' : `${remaining} in stack`
})

function peekItem(depth: number): GalleryItem | null {
  return props.items[swipedCount.value + depth] ?? null
}

// ── Gesture constants ─────────────────────────────────────────────────
const SWIPE_THRESHOLD = 80
const FLY_X = 600
const FLY_DURATION_MS = 320

// ── Card styles ───────────────────────────────────────────────────────
const activeCardStyle = computed<CSSProperties>(() => {
  if (isFlying.value) {
    const rotation = flyDir.value === 'right' ? 22 : -22
    return {
      transform: `translateX(${flyDir.value === 'right' ? FLY_X : -FLY_X}px) rotate(${rotation}deg)`,
      transition: `transform ${FLY_DURATION_MS}ms cubic-bezier(0.2, 0.0, 1.0, 1.0)`,
      zIndex: 3,
    }
  }

  if (isDragging.value) {
    const rotation = dragX.value * 0.04
    return {
      transform: `translateX(${dragX.value}px) rotate(${rotation}deg)`,
      transition: 'none',
      zIndex: 3,
    }
  }

  return {
    transform: 'translateX(0) rotate(0deg)',
    transition: 'transform 0.28s cubic-bezier(0.17, 0.67, 0.46, 1.0)',
    zIndex: 3,
  }
})

function depthCardStyle(depth: number): CSSProperties {
  // As drag progresses, depth cards shift toward their promoted position
  const progress = Math.min(1, Math.abs(dragX.value) / SWIPE_THRESHOLD)
  const targetScale = depth === 1 ? 1.0 : 0.95
  const restScale = depth === 1 ? 0.95 : 0.90
  const scale = restScale + (targetScale - restScale) * progress
  const translateY = depth === 1 ? `${8 - 8 * progress}px` : `${16 - 16 * progress}px`

  return {
    transform: `scale(${scale}) translateY(${translateY})`,
    zIndex: 3 - depth,
    transition: isDragging.value ? 'none' : 'transform 0.28s ease',
  }
}

// ── Indicators ────────────────────────────────────────────────────────
const likeOpacity = computed(() => Math.max(0, Math.min(1, dragX.value / SWIPE_THRESHOLD)))
const nopeOpacity = computed(() => Math.max(0, Math.min(1, -dragX.value / SWIPE_THRESHOLD)))

// ── Pointer handlers ──────────────────────────────────────────────────
function onPointerDown(e: PointerEvent) {
  if (isFlying.value || !currentItem.value) return
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  pointerId = e.pointerId
  startX = e.clientX
  dragX.value = 0
  isDragging.value = true
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || e.pointerId !== pointerId) return
  dragX.value = e.clientX - startX
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value || e.pointerId !== pointerId) return
  isDragging.value = false

  if (dragX.value > SWIPE_THRESHOLD) {
    swipeRight()
  } else if (dragX.value < -SWIPE_THRESHOLD) {
    swipeLeft()
  } else {
    dragX.value = 0
  }
}

// ── Actions ───────────────────────────────────────────────────────────
function flyOff(dir: 'left' | 'right', andSelect = false) {
  if (isFlying.value || !currentItem.value) return
  if (andSelect) emit('select', { id: currentItem.value.id })
  flyDir.value = dir
  isFlying.value = true
  dragX.value = 0

  setTimeout(() => {
    swipedCount.value++
    isFlying.value = false
    flyDir.value = null
    dragX.value = 0
  }, FLY_DURATION_MS)
}

function swipeLeft() {
  flyOff('left', false)
}

function swipeRight() {
  flyOff('right', true)
}

function onInfoClick() {
  if (currentItem.value) emit('select', { id: currentItem.value.id })
  flyOff('right', false)
}

function reset() {
  swipedCount.value = 0
  dragX.value = 0
  isDragging.value = false
  isFlying.value = false
  flyDir.value = null
}
</script>
