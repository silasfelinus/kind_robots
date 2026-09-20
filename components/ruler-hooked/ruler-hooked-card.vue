<!-- components/ruler-hooked/ruler-hooked-card.vue
     One event/decision slide (decks.md §2): narration + the featured characters +
     N choices. Emits `choose` with the chosen choice id; the store applies effects.

     ruler-hooked/t-028: a card with no authored `characters` used to render
     with no speaker at all -- "kingdom decisions arrive from a system
     message" was the exact complaint. It now falls back to the standing
     advisor as the one relaying it, so every card has someone attached. -->
<template>
  <div class="rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg">
    <div class="mb-1 flex items-center gap-2">
      <span v-if="card.kind === 'arc-step'" class="kr-badge-secondary-sm">story</span>
      <span v-else-if="card.kind === 'finale'" class="kr-badge-accent-sm">finale</span>
      <span v-else class="kr-badge-sm">the kingdom</span>
      <span v-if="card.characters?.length" class="kr-text-faded-xs">
        {{ card.characters.join(' · ') }}
      </span>
      <span v-else-if="advisorName" class="kr-text-faded-xs">
        — relayed by {{ advisorName }}
      </span>
    </div>
    <h3 class="kr-text-bold-lg">{{ card.title }}</h3>
    <p v-if="card.body" class="kr-text-faded-sm-80 mt-1">{{ card.body }}</p>

    <div class="mt-4 flex flex-col gap-2">
      <button
        v-for="choice in card.choices"
        :key="choice.id"
        type="button"
        class="btn btn-sm justify-start text-left normal-case"
        :class="choice.requeue ? 'btn-ghost' : 'btn-primary btn-outline'"
        @click="emit('choose', choice.id)"
      >
        {{ choice.text }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '~/types/ruler-hooked'

defineProps<{ card: Card; advisorName?: string }>()
const emit = defineEmits<{ choose: [choiceId: string] }>()
</script>
