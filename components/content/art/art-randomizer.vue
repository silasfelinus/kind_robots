<!-- /components/content/art/randomizer-section.vue -->
<template>
  <div class="space-y-4">
    <div
      v-for="entry in artListPresets"
      :key="entry.id"
      class="border p-4 rounded-xl bg-base-200"
    >
      <h3 class="font-semibold mb-2">{{ entry.title }}</h3>

      <div v-if="entry.presetType === 'dropdown'">
        <select
          class="select w-full"
          :multiple="entry.allowMultiple"
          v-model="localSelections[entry.id]"
        >
          <option
            v-for="option in entry.content"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </div>

      <div v-else-if="entry.presetType === 'radio'">
        <div class="space-y-1">
          <label
            v-for="option in entry.content"
            :key="option"
            class="flex items-center gap-2"
          >
            <input
              type="radio"
              :name="entry.id"
              :value="option"
              v-model="localSelections[entry.id]"
              class="radio radio-primary"
            />
            <span>{{ option }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { artListPresets } from '@/stores/seeds/artList'
import { useArtStore } from '@/stores/artStore'

const artStore = useArtStore()

const localSelections = ref<Record<string, string[]>>({})

watchEffect(() => {
  for (const entry of artListPresets) {
    const val = localSelections.value[entry.id] || []
    artStore.updateArtListSelection(entry.id, Array.isArray(val) ? val : [val])
  }
})
</script>
