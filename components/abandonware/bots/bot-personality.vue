<!-- /components/bots/bot-personality.vue -->
<template>
  <div class="flex flex-col gap-3">
    <div v-if="selectedTraits.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="trait in selectedTraits"
        :key="trait"
        class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary"
      >
        {{ trait }}

        <button
          type="button"
          class="hover:text-error"
          @click="removeTrait(trait)"
        >
          <Icon name="kind-icon:x" class="h-3 w-3" />
        </button>
      </span>

      <span
        class="rounded-full bg-base-200 px-2.5 py-0.5 text-xs text-base-content/40"
      >
        {{ selectedTraits.length }} selected
      </span>
    </div>

    <input
      v-model="search"
      type="text"
      class="input input-bordered input-sm w-full rounded-xl bg-base-100 focus:border-primary"
      placeholder="Filter traits..."
    />

    <div class="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      <button
        v-for="trait in filteredTraits"
        :key="trait.value"
        type="button"
        class="rounded-xl border px-2.5 py-2 text-center text-xs font-semibold transition-all"
        :class="
          isSelected(trait.value)
            ? 'border-primary bg-primary/15 text-primary shadow-sm'
            : 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/40 hover:text-primary'
        "
        @click="toggleTrait(trait.value)"
      >
        {{ trait.label }}
      </button>
    </div>

    <p class="text-xs text-base-content/30">
      {{ filteredTraits.length }} traits{{
        search ? ` matching &quot;${search}&quot;` : ''
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import { BOT_PERSONALITY_TRAITS } from '@/stores/helpers/botCards'

const builder = useBuilderStore()
const search = ref('')

const selectedTraits = computed(() => {
  const value = builder.sheet.personality

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }

  if (typeof value === 'string') {
    return value
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
})

const filteredTraits = computed(() => {
  const q = search.value.toLowerCase().trim()

  if (!q) return BOT_PERSONALITY_TRAITS

  return BOT_PERSONALITY_TRAITS.filter((trait) => {
    return trait.label.toLowerCase().includes(q)
  })
})

function writeTraits(values: string[]) {
  builder.updateSheet({
    personality: values.join('|'),
  })
}

function toggleTrait(value: string) {
  const current = selectedTraits.value
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value]

  writeTraits(next)
}

function removeTrait(value: string) {
  writeTraits(
    selectedTraits.value.filter((entry) => {
      return entry !== value
    }),
  )
}

function isSelected(value: string): boolean {
  return selectedTraits.value.includes(value)
}
</script>
