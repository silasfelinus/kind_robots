<!-- components/ruler-hooked/ruler-hooked-card.vue
     One event/decision slide (decks.md §2): narration + the featured characters +
     N choices. Emits `choose` with the chosen choice id; the store applies effects. -->
<template>
  <div class="rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg">
    <div class="mb-1 flex items-center gap-2">
      <span v-if="card.kind === 'arc-step'" class="badge badge-secondary badge-sm">story</span>
      <span v-else-if="card.kind === 'finale'" class="badge badge-accent badge-sm">finale</span>
      <span v-else class="badge badge-sm">the kingdom</span>
      <span v-if="card.characters?.length" class="text-xs opacity-60">
        {{ card.characters.join(' · ') }}
      </span>
    </div>
    <h3 class="text-lg font-bold">{{ card.title }}</h3>
    <p v-if="card.body" class="mt-1 text-sm opacity-80">{{ card.body }}</p>

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

defineProps<{ card: Card }>()
const emit = defineEmits<{ choose: [choiceId: string] }>()
</script>
