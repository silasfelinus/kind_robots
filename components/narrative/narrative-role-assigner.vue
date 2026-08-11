<!-- /components/narrative/narrative-role-assigner.vue -->
<!--
  THE CASTING BOARD — lay the cast out as cards and give each one a part.

  Silas, 2026-08-06: "I'm imagining a layout that lets the user feel like they
  are selecting cards and creating a playboard that turns into a story."

  The board arranges BY role. Protagonist(s) and antagonist(s) get the lead
  row, supporting parts hold the middle row, and ensemble/unassigned share a
  smaller back row. Card markup lives in narrative-cast-card.vue.

  Presentational and controlled: the parent owns the cast and role map, this
  emits changes, and it imports no store. Roles stay optional, and the role
  chips remain the keyboard/accessibility path alongside drag-and-drop.
-->
<template>
  <div v-if="members.length" class="space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <p class="text-sm font-black">The casting board</p>
        <p class="mt-0.5 text-xs leading-relaxed text-base-content/55">
          Drag a card onto a part, or use its buttons. Leave a card blank and
          the story decides.
        </p>
      </div>
      <span
        v-if="assignedCount"
        class="badge badge-secondary badge-sm shrink-0"
      >
        {{ assignedCount }} cast
      </span>
    </div>

    <div class="rounded-2xl border border-base-300 bg-base-200/40 p-2.5">
      <div
        class="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(7.5rem,100%),1fr))]"
        role="group"
        aria-label="Casting role drop zones"
      >
        <div
          v-for="option in NARRATIVE_ROLES"
          :key="option.key"
          :data-cast-role="option.key"
          class="flex min-h-12 items-center gap-2 rounded-xl border border-dashed px-2.5 py-2 text-xs font-bold transition"
          :class="
            dragOverRole === option.key
              ? 'border-secondary bg-secondary/15 ring-2 ring-secondary/30'
              : draggingSlug
                ? 'border-base-content/35 bg-base-100'
                : 'border-base-300 bg-base-100/70'
          "
          @dragenter.prevent="dragOverRole = option.key"
          @dragover.prevent="dragOverRole = option.key"
          @dragleave="dragOverRole = null"
          @drop.prevent="dropRole(option.key)"
        >
          <Icon :name="option.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span>{{ option.label }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="protagonists.length || antagonists.length"
      class="flex flex-wrap items-start justify-between gap-3"
    >
      <ul class="flex flex-wrap gap-3" role="group" aria-label="Protagonist(s)">
        <narrative-cast-card
          v-for="member in protagonists"
          :key="member.slug"
          class="w-36 sm:w-44"
          :member="member"
          :role="roleFor(member.slug)"
          size="lead"
          @toggle-role="toggle(member.slug, $event)"
          @drag-start="startDrag(member.slug)"
          @drag-move="trackPointerDrag"
          @drag-end="finishPointerDrag"
          @drag-cancel="cancelDrag"
        />
      </ul>
      <ul
        class="flex flex-wrap justify-end gap-3"
        role="group"
        aria-label="Antagonist(s)"
      >
        <narrative-cast-card
          v-for="member in antagonists"
          :key="member.slug"
          class="w-36 sm:w-44"
          :member="member"
          :role="roleFor(member.slug)"
          size="lead"
          @toggle-role="toggle(member.slug, $event)"
          @drag-start="startDrag(member.slug)"
          @drag-move="trackPointerDrag"
          @drag-end="finishPointerDrag"
          @drag-cancel="cancelDrag"
        />
      </ul>
    </div>

    <ul
      v-if="supportingCast.length"
      class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(11rem,100%),1fr))]"
    >
      <narrative-cast-card
        v-for="member in supportingCast"
        :key="member.slug"
        :member="member"
        :role="roleFor(member.slug)"
        size="support"
        @toggle-role="toggle(member.slug, $event)"
        @drag-start="startDrag(member.slug)"
        @drag-move="trackPointerDrag"
        @drag-end="finishPointerDrag"
        @drag-cancel="cancelDrag"
      />
    </ul>

    <ul
      v-if="backCast.length"
      class="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(min(8.5rem,100%),1fr))]"
    >
      <narrative-cast-card
        v-for="member in backCast"
        :key="member.slug"
        :member="member"
        :role="roleFor(member.slug)"
        size="back"
        @toggle-role="toggle(member.slug, $event)"
        @drag-start="startDrag(member.slug)"
        @drag-move="trackPointerDrag"
        @drag-end="finishPointerDrag"
        @drag-cancel="cancelDrag"
      />
    </ul>

    <p
      v-if="duplicateWarning"
      class="kr-note kr-note-warning text-xs"
      role="status"
    >
      {{ duplicateWarning }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  duplicateSingularRoles,
  NARRATIVE_ROLES,
  narrativeCastTier,
  narrativeRoleLabel,
} from '@/utils/narrativeRoles'
import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'

const props = defineProps<{
  members: NarrativeIngredientOption[]
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const draggingSlug = ref<string | null>(null)
const dragOverRole = ref<string | null>(null)

const roleFor = (slug: string): string | null => props.modelValue[slug] ?? null

const protagonists = computed(() =>
  props.members.filter(
    (member) => narrativeCastTier(roleFor(member.slug)) === 'protagonist',
  ),
)
const antagonists = computed(() =>
  props.members.filter(
    (member) => narrativeCastTier(roleFor(member.slug)) === 'antagonist',
  ),
)
const supportingCast = computed(() =>
  props.members.filter(
    (member) => narrativeCastTier(roleFor(member.slug)) === 'support',
  ),
)
const backCast = computed(() =>
  props.members.filter(
    (member) => narrativeCastTier(roleFor(member.slug)) === 'back',
  ),
)

function toggle(slug: string, key: string): void {
  const next = Object.fromEntries(
    Object.entries(props.modelValue).filter(([entry]) => entry !== slug),
  )
  if (roleFor(slug) !== key) next[slug] = key
  emit('update:modelValue', next)
}

function assignRole(slug: string, key: string): void {
  emit('update:modelValue', { ...props.modelValue, [slug]: key })
}

function startDrag(slug: string): void {
  draggingSlug.value = slug
}

function cancelDrag(): void {
  draggingSlug.value = null
  dragOverRole.value = null
}

function dropRole(key: string): void {
  if (draggingSlug.value) assignRole(draggingSlug.value, key)
  cancelDrag()
}

function roleAtPoint(x: number, y: number): string | null {
  if (typeof document === 'undefined') return null
  const slot = document
    .elementFromPoint(x, y)
    ?.closest('[data-cast-role]') as HTMLElement | null
  const key = slot?.dataset.castRole ?? null
  return key && NARRATIVE_ROLES.some((role) => role.key === key) ? key : null
}

function trackPointerDrag(x: number, y: number): void {
  dragOverRole.value = roleAtPoint(x, y)
}

function finishPointerDrag(x: number, y: number): void {
  const role = roleAtPoint(x, y)
  if (role) dropRole(role)
  else cancelDrag()
}

const assignedCount = computed(
  () => props.members.filter((member) => roleFor(member.slug)).length,
)

const duplicateWarning = computed(() => {
  const duplicates = duplicateSingularRoles(
    props.members.map((member) => roleFor(member.slug)),
  )
  if (!duplicates.length) return ''
  const named = duplicates.map((key) => narrativeRoleLabel(key)).join(' and ')
  return `More than one ${named} — unusual, but the story will run with it.`
})
</script>
