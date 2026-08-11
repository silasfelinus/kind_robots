<!-- /components/narrative/narrative-cast-card.vue -->
<!--
  One card on the casting board (narrative-role-assigner.vue). Extracted so
  the board can render the SAME card at three different sizes -- lead,
  support, back -- without tripling the markup across the three tiers a real
  playboard arranges by (see narrative-role-assigner.vue's own header comment
  for why the board is tiered at all).

  Presentational only: the parent owns the role map and passes down which
  role (if any) this member currently holds; this emits the chip press and
  drag gestures back up rather than mutating anything itself.
-->
<template>
  <li
    class="flex flex-col overflow-hidden rounded-2xl border bg-base-100 transition"
    :class="[
      role ? 'border-secondary/60 ring-1 ring-secondary/30' : 'border-base-300',
      size === 'back' ? 'opacity-90' : '',
    ]"
  >
    <div
      class="relative cursor-grab active:cursor-grabbing"
      draggable="true"
      @dragstart="startNativeDrag"
      @dragend="emit('drag-cancel')"
    >
      <kr-art-plate
        :source="member"
        variant="card"
        shape="card"
        frame="none"
        :alt="member.title"
        :placeholder-icon="member.icon || 'kind-icon:user'"
      />

      <button
        type="button"
        class="absolute right-2 top-2 z-10 cursor-grab touch-none rounded-lg bg-base-100/90 px-2 py-1 text-xs font-black shadow active:cursor-grabbing"
        :aria-label="`Drag ${member.title} to a part`"
        title="Drag to a part"
        @pointerdown="startPointerDrag"
        @pointermove="movePointerDrag"
        @pointerup="finishPointerDrag"
        @pointercancel="cancelPointerDrag"
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>

      <span
        v-if="role"
        class="badge badge-secondary badge-sm absolute left-2 top-2 gap-1 rounded-xl shadow"
      >
        <Icon
          v-if="roleIcon"
          :name="roleIcon"
          class="size-3"
          aria-hidden="true"
        />
        {{ roleLabel }}
      </span>

      <span
        class="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-base-100 to-transparent px-2 pb-1.5 pt-6 text-xs font-black"
      >
        {{ member.title }}
      </span>
    </div>

    <div
      class="flex flex-wrap gap-1 p-2"
      role="group"
      :aria-label="`Part for ${member.title}`"
    >
      <button
        v-for="option in NARRATIVE_ROLES"
        :key="option.key"
        type="button"
        class="btn btn-xs rounded-lg px-1.5 text-[0.65rem] font-bold"
        :class="role === option.key ? 'btn-secondary' : 'btn-ghost'"
        :aria-pressed="role === option.key"
        :title="`${option.label} — ${option.description}`"
        @click="emit('toggle-role', option.key)"
      >
        {{ option.label }}
      </button>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NARRATIVE_ROLES,
  narrativeRole,
  narrativeRoleLabel,
} from '@/utils/narrativeRoles'
import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'

const props = defineProps<{
  member: NarrativeIngredientOption
  role: string | null
  size: 'lead' | 'support' | 'back'
}>()

const emit = defineEmits<{
  'toggle-role': [key: string]
  'drag-start': []
  'drag-move': [x: number, y: number]
  'drag-end': [x: number, y: number]
  'drag-cancel': []
}>()

const roleLabel = computed(() => narrativeRoleLabel(props.role))
const roleIcon = computed(() => narrativeRole(props.role)?.icon ?? '')

let pointerId: number | null = null
let pointerStartX = 0
let pointerStartY = 0
let pointerDragging = false

function startNativeDrag(event: DragEvent): void {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.member.slug)
  }
  emit('drag-start')
}

function startPointerDrag(event: PointerEvent): void {
  if (event.pointerType === 'mouse') return
  pointerId = event.pointerId
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  pointerDragging = false
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function movePointerDrag(event: PointerEvent): void {
  if (event.pointerId !== pointerId) return
  if (!pointerDragging) {
    const distance = Math.hypot(
      event.clientX - pointerStartX,
      event.clientY - pointerStartY,
    )
    if (distance < 8) return
    pointerDragging = true
    emit('drag-start')
  }
  emit('drag-move', event.clientX, event.clientY)
}

function finishPointerDrag(event: PointerEvent): void {
  if (event.pointerId !== pointerId) return
  if (pointerDragging) emit('drag-end', event.clientX, event.clientY)
  resetPointerDrag()
}

function cancelPointerDrag(event: PointerEvent): void {
  if (event.pointerId !== pointerId) return
  if (pointerDragging) emit('drag-cancel')
  resetPointerDrag()
}

function resetPointerDrag(): void {
  pointerId = null
  pointerDragging = false
}
</script>
