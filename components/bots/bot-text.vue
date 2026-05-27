<!-- components/bots/bot-personality.vue -->
<!--
  Multi-select personality trait picker for the Bot Builder.
  Same pattern as adventure-preset multiSelect mode.
  Traits stored pipe-separated in botForm.personality.
-->
<template>
  <div class="flex flex-col gap-3">
    <!-- Selected chips bar -->
    <div v-if="builder.selectedTraits.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="trait in builder.selectedTraits"
        :key="trait"
        class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary"
      >
        {{ trait }}
        <button
          type="button"
          class="hover:text-error"
          @click="builder.removeTrait(trait)"
        >
          <Icon name="kind-icon:x" class="h-3 w-3" />
        </button>
      </span>
      <span
        class="rounded-full bg-base-200 px-2.5 py-0.5 text-xs text-base-content/40"
      >
        {{ builder.selectedTraits.length }} selected
      </span>
    </div>

    <!-- Search -->
    <input
      v-model="search"
      type="text"
      class="input input-bordered input-sm w-full rounded-xl bg-base-100 focus:border-primary"
      placeholder="Filter traits..."
    />

    <!-- Trait grid -->
    <div class="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      <button
        v-for="trait in filteredTraits"
        :key="trait.value"
        type="button"
        class="rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all text-center"
        :class="
          isSelected(trait.value)
            ? 'border-primary bg-primary/15 text-primary shadow-sm'
            : 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/40 hover:text-primary'
        "
        @click="builder.toggleTrait(trait.value)"
      >
        {{ trait.label }}
      </button>
    </div>

    <p class="text-xs text-base-content/30">
      {{ filteredTraits.length }} traits{{
        search ? ` matching "${search}"` : ''
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBotBuilderStore } from '@/stores/botBuilderStore'
import { BOT_PERSONALITY_TRAITS } from '@/stores/helpers/botCards'

const builder = useBotBuilderStore()
const search = ref('')

const filteredTraits = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return BOT_PERSONALITY_TRAITS
  return BOT_PERSONALITY_TRAITS.filter((t) => t.label.toLowerCase().includes(q))
})

function isSelected(value: string): boolean {
  return builder.selectedTraits.includes(value)
}
</script>
