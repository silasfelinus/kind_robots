<!-- components/ruler-hooked/ruler-hooked-card.vue
     One event/decision slide (decks.md §2): narration + the featured characters +
     N choices. Emits `choose` with the chosen choice id; the store applies effects.

     ruler-hooked/t-028: a card with no authored `characters` used to render
     with no speaker at all -- "kingdom decisions arrive from a system
     message" was the exact complaint. It now falls back to the standing
     advisor as the one relaying it, so every card has someone attached.

     ruler-hooked/t-030, Silas: "no ability to see text based prompts with an
     image that asks me to decide important things" -- decks.md §2 already
     defines a per-card `art:` key and every card can list `characters:`, but
     neither was ever rendered here. Now shows the card's own art if authored,
     else the featured (or relaying-advisor) character's portrait, degrading
     through cardArt.ts's ladder to no image at all -- never a broken one --
     exactly like the advisor's own portrait already does. -->
<template>
  <div class="rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg">
    <img
      v-if="imgSrc"
      :src="imgSrc"
      :alt="card.title"
      class="mb-3 aspect-video w-full rounded-lg object-cover"
      loading="lazy"
      @error="onImgError"
    />
    <div class="mb-1 flex items-center gap-2">
      <span v-if="card.kind === 'arc-step'" class="kr-badge-secondary-sm"
        >story</span
      >
      <span v-else-if="card.kind === 'finale'" class="kr-badge-accent-sm"
        >finale</span
      >
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
import { cardImageCandidates } from '~/utils/rulerHooked/cardArt'
import type { Card } from '~/types/ruler-hooked'

const props = defineProps<{
  card: Card
  advisorName?: string
  /** The relaying advisor's Character slug -- the same fallback the byline
   *  text already uses when the card names no `characters` of its own. */
  advisorSlug?: string
}>()
const emit = defineEmits<{ choose: [choiceId: string] }>()

const candidates = computed(() =>
  cardImageCandidates(
    props.card.art,
    props.card.characters?.[0] ?? props.advisorSlug,
  ),
)
const errIndex = ref(0)
watch(
  () => props.card.id,
  () => {
    errIndex.value = 0
  },
)
const imgSrc = computed(() => candidates.value[errIndex.value] ?? null)
function onImgError() {
  errIndex.value += 1
}
</script>
