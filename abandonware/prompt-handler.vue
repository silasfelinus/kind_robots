<!-- /components/content/art/prompt-handler.vue -->
<template>
  <div class="w-full max-w-full space-y-6 overflow-x-hidden">
    <!-- Prompt Input -->
    <div class="space-y-2">
      <label class="font-semibold text-base-content">📝 Prompt</label>
      <input
        v-model="promptStore.promptField"
        placeholder="Enter your creative prompt..."
        class="input input-bordered w-full text-lg bg-base-200 placeholder-gray-500 shadow-inner"
        :disabled="loading"
        @input="syncPrompt"
      />
    </div>

    <!-- Negative Toggle -->
    <div class="flex items-center space-x-3">
      <label class="label cursor-pointer space-x-2 flex-shrink-0">
        <span class="label-text font-semibold">🚫 Negative Auto</span>
        <input
          type="checkbox"
          class="toggle toggle-error"
          v-model="useNegative"
          @change="toggleNegativePrompt"
        />
      </label>
    </div>

    <!-- Negative Prompt Field -->
    <div class="space-y-2">
      <label class="font-semibold text-base-content">Negative Prompt</label>
      <input
        v-model="artStore.artForm.negativePrompt"
        placeholder="Things to avoid (e.g. blurry, extra limbs...)"
        class="input input-bordered w-full text-lg bg-base-200 placeholder-gray-500 shadow-inner"
        :disabled="loading"
      />
    </div>

    <!-- CFG Slider -->
    <div class="space-y-2 w-full">
      <label class="block font-semibold"> 🎚 CFG Scale: {{ localCfg }} </label>
      <input
        type="range"
        min="0"
        max="30"
        step="0.5"
        v-model.number="localCfg"
        class="range range-primary w-full"
      />
    </div>

    <!-- Steps Slider -->
    <div class="space-y-2 w-full">
      <label class="block font-semibold">
        🧮 Steps: {{ artStore.artForm.steps }}
      </label>
      <input
        type="range"
        min="5"
        max="50"
        step="1"
        v-model.number="artStore.artForm.steps"
        class="range range-secondary w-full"
      />
    </div>

    <!-- Public Toggle -->
    <div class="flex items-center justify-start space-x-4">
      <span class="font-semibold">🔓 Public?</span>
      <input
        type="checkbox"
        class="toggle toggle-success"
        v-model="artStore.artForm.isPublic"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/prompt-handler.vue
import { ref, computed, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { negativeList } from '@/stores/seeds/artList' // ✅ correct source

const artStore = useArtStore()
const promptStore = usePromptStore()

const useNegative = ref(false)
const loading = computed(() => artStore.loading)

const localCfg = ref<number>(
  (artStore.artForm.cfg ?? 3) + (artStore.artForm.cfgHalf ? 0.5 : 0),
)

watch(localCfg, (val) => {
  artStore.artForm.cfg = Math.floor(val)
  artStore.artForm.cfgHalf = val % 1 >= 0.5
})

function toggleNegativePrompt() {
  const list = useNegative.value ? negativeList : []
  artStore.updateArtListSelection('__negative__', list)
}

function syncPrompt() {
  promptStore.syncToLocalStorage()
  artStore.artForm.promptString = promptStore.promptField
}
</script>
