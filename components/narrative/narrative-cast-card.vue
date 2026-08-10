<!-- /components/narrative/narrative-cast-card.vue -->
<!--
  One card on the casting board (narrative-role-assigner.vue). Extracted so
  the board can render the SAME card at three different sizes -- lead,
  support, back -- without tripling the markup across the three tiers a real
  playboard arranges by (see narrative-role-assigner.vue's own header comment
  for why the board is tiered at all).

  Presentational only: the parent owns the role map and passes down which
  role (if any) this member currently holds; this emits the chip press back
  up rather than mutating anything itself.
-->
<template>
  <li
    class="flex flex-col overflow-hidden rounded-2xl border bg-base-100 transition"
    :class="[
      role ? 'border-secondary/60 ring-1 ring-secondary/30' : 'border-base-300',
      size === 'back' ? 'opacity-90' : '',
    ]"
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

      <!-- The part, worn on the card. This is what makes the board readable
           without reading: a glance says who leads and who opposes. -->
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

    <!--
      Chips, not a dropdown. Pressing the active part again clears it, so
      removing someone from a role costs the same one tap as giving them
      one -- a dropdown makes "none" a hunt back through the list.
    -->
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
  /** This member's current role key, or null when unassigned. */
  role: string | null
  /**
   * Board tier this card renders at. 'lead' is given prominence (protagonist
   * / antagonist), 'support' is the default size, 'back' is ranked behind
   * (ensemble and anyone not yet given a part) and reads as slightly
   * receded rather than fully de-emphasised -- an unassigned card is still
   * drawn quietly, not hidden.
   */
  size: 'lead' | 'support' | 'back'
}>()

const emit = defineEmits<{
  'toggle-role': [key: string]
}>()

const roleLabel = computed(() => narrativeRoleLabel(props.role))
const roleIcon = computed(() => narrativeRole(props.role)?.icon ?? '')
</script>
