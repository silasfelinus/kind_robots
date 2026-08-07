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

  So this is a board. Character art at 2:3 through the shared kr-art-plate, the
  assigned part worn as a badge on the card itself, and the parts offered as
  chips you press rather than options you unfold. The cast is capped at five,
  which is what makes chips affordable: five cards of eight chips is a board
  you can read at a glance, where five dropdowns is a form.

  Presentational and controlled, the contract kr-gallery keeps: the parent owns
  the cast and the role map, this emits changes, and it imports no store so it
  can drop into Storybook now and Taskmaster or the Stage system later.

  Roles stay OPTIONAL. An unassigned card is drawn quietly and produces exactly
  the story-bible line it always did (see castLineWithRole), so a story that
  ignores casting generates identically to before.
-->
<template>
  <div v-if="members.length" class="space-y-3">
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

    <ul
      class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(11rem,100%),1fr))]"
    >
      <li
        v-for="member in members"
        :key="member.slug"
        class="flex flex-col overflow-hidden rounded-2xl border bg-base-100 transition"
        :class="
          roleFor(member.slug)
            ? 'border-secondary/60 ring-1 ring-secondary/30'
            : 'border-base-300'
        "
      >
        <div class="relative">
          <kr-art-plate
            :source="member"
            variant="card"
            shape="card"
            frame="none"
            :alt="member.title"
            :placeholder-icon="member.icon || 'kind-icon:user'"
          />

          <!-- The part, worn on the card. This is what makes the board
               readable without reading: a glance says who leads and who
               opposes. -->
          <span
            v-if="roleFor(member.slug)"
            class="badge badge-secondary badge-sm absolute left-2 top-2 gap-1 rounded-xl shadow"
          >
            <Icon
              v-if="roleIcon(member.slug)"
              :name="roleIcon(member.slug)"
              class="size-3"
              aria-hidden="true"
            />
            {{ roleLabel(member.slug) }}
          </span>

          <span
            class="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-base-100 to-transparent px-2 pb-1.5 pt-6 text-xs font-black"
          >
            {{ member.title }}
          </span>
        </div>

        <!--
          Chips, not a dropdown. Pressing the active part again clears it, so
          removing someone from a role costs the same one tap as giving them
          one — a dropdown makes "none" a hunt back through the list.
        -->
        <div
          class="flex flex-wrap gap-1 p-2"
          role="group"
          :aria-label="`Part for ${member.title}`"
        >
          <button
            v-for="role in NARRATIVE_ROLES"
            :key="role.key"
            type="button"
            class="btn btn-xs rounded-lg px-1.5 text-[0.65rem] font-bold"
            :class="
              roleFor(member.slug) === role.key ? 'btn-secondary' : 'btn-ghost'
            "
            :aria-pressed="roleFor(member.slug) === role.key"
            :title="`${role.label} — ${role.description}`"
            @click="toggle(member.slug, role.key)"
          >
            {{ role.label }}
          </button>
        </div>
      </li>
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
  NARRATIVE_ROLES,
  duplicateSingularRoles,
  narrativeRole,
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
const roleLabel = (slug: string): string => narrativeRoleLabel(roleFor(slug))
const roleIcon = (slug: string): string =>
  narrativeRole(roleFor(slug))?.icon ?? ''

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
