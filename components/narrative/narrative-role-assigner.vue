<!-- /components/narrative/narrative-role-assigner.vue -->
<!--
  Give each chosen cast member a part to play.

  Storybook could already say WHICH Characters were in a story and not what any
  of them were FOR, so a story bible listed a cast and left the narrator to
  guess which one it was about. Silas, 2026-08-06: "a user can choose specific
  characters and assign them as protagonist, villain, love interest....etc."

  Presentational and controlled, the same contract kr-gallery keeps: the parent
  owns the cast list and the role map, this emits changes. No store import --
  it has to drop into Storybook, and later Taskmaster and the Stage system,
  without dragging any one of their models along.

  Roles are OPTIONAL by design. An unassigned member produces exactly the cast
  line it always did (see castLineWithRole), so a story that ignores this
  feature generates identically to before.
-->
<template>
  <div v-if="members.length" class="space-y-2">
    <div class="flex items-baseline justify-between gap-2">
      <p class="text-sm font-bold">Who is who</p>
      <p class="text-xs text-base-content/50">Optional</p>
    </div>

    <p class="text-xs leading-relaxed text-base-content/55">
      Give anyone a part and the narrator is told what it means — a protagonist
      is followed, an antagonist is opposed. Leave them unassigned and the story
      decides.
    </p>

    <ul class="space-y-2">
      <li
        v-for="member in members"
        :key="member.slug"
        class="flex flex-wrap items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
      >
        <img
          v-if="artworkFor(member)"
          :src="artworkFor(member) || ''"
          :alt="member.title"
          class="size-10 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
        <span
          v-else
          class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-base-200"
        >
          <Icon
            :name="member.icon || 'kind-icon:user'"
            class="size-5 opacity-60"
          />
        </span>

        <span class="min-w-0 flex-1 truncate text-sm font-semibold">
          {{ member.title }}
        </span>

        <select
          class="select select-bordered select-sm w-full max-w-[13rem] rounded-xl"
          :value="modelValue[member.slug] ?? ''"
          :aria-label="`Role for ${member.title}`"
          @change="assign(member.slug, $event)"
        >
          <option value="">Unassigned</option>
          <option
            v-for="role in NARRATIVE_ROLES"
            :key="role.key"
            :value="role.key"
          >
            {{ role.label }}
          </option>
        </select>
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

    <p v-if="describedRole" class="text-xs italic text-base-content/55">
      {{ describedRole }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NARRATIVE_ROLES,
  duplicateSingularRoles,
  narrativeRole,
  narrativeRoleLabel,
} from '@/utils/narrativeRoles'
import {
  narrativeIngredientArtwork,
  type NarrativeIngredientOption,
} from '@/utils/narrativeIngredients'

const props = defineProps<{
  /** The chosen cast, in the parent's order. */
  members: NarrativeIngredientOption[]
  /** slug -> role key. Members absent from the map are unassigned. */
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const lastAssigned = ref<string | null>(null)

function artworkFor(member: NarrativeIngredientOption): string | null {
  return narrativeIngredientArtwork(member)
}

function assign(slug: string, event: Event): void {
  const key = (event.target as HTMLSelectElement).value
  /*
   * An unassigned member is ABSENT from the map rather than stored as ''. The
   * map is persisted in the setup draft, and a pile of empty-string entries
   * would survive there forever for cast members long since removed. Rebuilt
   * by filtering rather than deleting a computed key, which the lint config
   * forbids and which mutates a fresh copy for no benefit.
   */
  const next = Object.fromEntries(
    Object.entries(props.modelValue).filter(([entry]) => entry !== slug),
  )
  if (key) next[slug] = key
  lastAssigned.value = key || null
  emit('update:modelValue', next)
}

/** Explains the part just chosen, so the effect on the story is visible here. */
const describedRole = computed(() => {
  const role = narrativeRole(lastAssigned.value)
  return role ? `${role.label}: ${role.description}` : ''
})

const duplicateWarning = computed(() => {
  const duplicates = duplicateSingularRoles(
    props.members.map((member) => props.modelValue[member.slug]),
  )
  if (!duplicates.length) return ''
  const named = duplicates.map((key) => narrativeRoleLabel(key)).join(' and ')
  return `More than one ${named} — unusual, but the story will run with it.`
})
</script>
