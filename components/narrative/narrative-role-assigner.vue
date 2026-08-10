<!-- /components/narrative/narrative-role-assigner.vue -->
<!--
  THE CASTING BOARD — lay the cast out as cards and give each one a part.

  Silas, 2026-08-06: "I'm imagining a layout that lets the user feel like they
  are selecting cards and creating a playboard that turns into a story."

  The first version of this was a list of rows with a <select> in each. It
  worked, and it was wrong twice over: it did not feel like anything, and it
  did not even match the step directly above it, where the cast is chosen from
  art-forward cards with selected rings and check badges
  (narrative-ingredient-card.vue). Dropping from cards to a dropdown mid-flow
  is the same hodgepodge this whole pass exists to remove.

  It also, at first, put every card in one uniform auto-fill grid regardless
  of part — reading order, not story order. t-011 (2026-08-10) fixed that:
  the board now arranges BY role instead. Protagonist(s) and antagonist(s) get
  the lead row, given prominence and set facing each other rather than side by
  side in the same line — a protagonist and an antagonist read as opposed, not
  as neighbours. Supporting parts (love interest, mentor, foil, ally,
  wildcard) hold the middle row at the original size. Ensemble and anyone not
  yet given a part share the back row, smaller and slightly receded — ranked
  behind without being hidden, since an unassigned card still has to be
  readable and pressable. A board with nothing assigned collapses to exactly
  one back row, which is the old uniform grid: this is additive, not a
  rewrite of the unassigned state.

  Card markup itself lives in narrative-cast-card.vue so the three tiers don't
  triple it.

  Presentational and controlled, the contract kr-gallery keeps: the parent owns
  the cast and the role map, this emits changes, and it imports no store so it
  can drop into Storybook now and Taskmaster or the Stage system later.

  Roles stay OPTIONAL. An unassigned card is drawn quietly and produces exactly
  the story-bible line it always did (see castLineWithRole), so a story that
  ignores casting generates identically to before.
-->
<template>
  <div v-if="members.length" class="space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <p class="text-sm font-black">The casting board</p>
        <p class="mt-0.5 text-xs leading-relaxed text-base-content/55">
          Give anyone a part and the narrator is told what it means — a
          protagonist is followed, an antagonist is opposed. Leave a card blank
          and the story decides.
        </p>
      </div>
      <span
        v-if="assignedCount"
        class="badge badge-secondary badge-sm shrink-0"
      >
        {{ assignedCount }} cast
      </span>
    </div>

    <!-- Lead row: protagonist(s) given prominence on one side, antagonist(s)
         set opposite on the other. Only renders once someone actually holds
         one of these parts. -->
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
        />
      </ul>
    </div>

    <!-- Supporting row: everyone with a part that isn't lead or ensemble,
         at the board's original card size. -->
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
      />
    </ul>

    <!-- Back row: ensemble and anyone not yet given a part. Ranked behind —
         smaller and a touch quieter — but still fully readable and pressable,
         since roles stay optional. This is the whole board when nothing has
         been assigned yet. -->
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
      />
    </ul>

    <!--
      A WARNING, not a block. Two protagonists is unusual, not invalid, and
      refusing to render it would be the tool arguing with the author.
    -->
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
import { computed } from 'vue'
import {
  duplicateSingularRoles,
  narrativeRoleLabel,
} from '@/utils/narrativeRoles'
import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'

const props = defineProps<{
  /** The chosen cast, in the parent's order. */
  members: NarrativeIngredientOption[]
  /** slug -> role key. Members absent from the map are unassigned. */
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const roleFor = (slug: string): string | null => props.modelValue[slug] ?? null

/*
 * The board's three tiers. A member falls into exactly one, decided purely
 * by their current role — reassigning a part moves the card, nothing else
 * to track. `protagonist`/`antagonist` lead; the other five real roles hold
 * the supporting middle; `ensemble` and unassigned share the back row, since
 * neither has been given prominence.
 */
const protagonists = computed(() =>
  props.members.filter((member) => roleFor(member.slug) === 'protagonist'),
)
const antagonists = computed(() =>
  props.members.filter((member) => roleFor(member.slug) === 'antagonist'),
)
const supportingCast = computed(() =>
  props.members.filter((member) => {
    const role = roleFor(member.slug)
    return (
      role !== null &&
      role !== 'protagonist' &&
      role !== 'antagonist' &&
      role !== 'ensemble'
    )
  }),
)
const backCast = computed(() =>
  props.members.filter((member) => {
    const role = roleFor(member.slug)
    return role === null || role === 'ensemble'
  }),
)

function toggle(slug: string, key: string): void {
  /*
   * An unassigned member is ABSENT from the map rather than stored as ''. The
   * map is persisted in the setup draft, and empty entries would survive there
   * forever for cast members long since removed. Rebuilt by filtering rather
   * than deleting a computed key, which the lint config forbids.
   */
  const next = Object.fromEntries(
    Object.entries(props.modelValue).filter(([entry]) => entry !== slug),
  )
  if (roleFor(slug) !== key) next[slug] = key
  emit('update:modelValue', next)
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
