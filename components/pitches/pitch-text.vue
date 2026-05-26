<!-- components/pitch/pitch-text.vue -->
<!-- Text input step for pitch builder — used for the pitch/title field. -->
<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-2">
      <label
        v-if="activeStep?.inputLabel"
        class="text-xs font-bold uppercase tracking-widest text-base-content/50"
      >
        {{ activeStep.inputLabel }}
      </label>

      <div class="relative">
        <textarea
          v-model="stagedValue"
          class="textarea textarea-bordered w-full resize-none rounded-2xl bg-base-100 text-base leading-relaxed focus:border-primary focus:outline-none"
          rows="3"
          :placeholder="activeStep?.placeholder ?? 'Enter your pitch...'"
          :maxlength="activeStep?.maxLength ?? 256"
          @keydown.enter.prevent="handleEnter"
        />
        <span class="absolute bottom-2.5 right-3 text-xs text-base-content/30">
          {{ stagedValue.length }}/{{ activeStep?.maxLength ?? 256 }}
        </span>
      </div>
    </div>

    <!-- LLM refine -->
    <div v-if="activeStep?.needsLLM" class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="btn btn-ghost btn-sm rounded-xl gap-1.5 border border-base-300"
        :disabled="!stagedValue.trim() || llmLoading"
        @click="handleRefine"
      >
        <span v-if="llmLoading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
        Refine with AI
      </button>
      <p v-if="llmError" class="text-xs text-error">{{ llmError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchBuilderStore } from '@/stores/pitchBuilderStore'

const store = usePitchBuilderStore()

const activeStep = computed(() => store.activeStep)
const llmLoading = computed(() => store.llmLoading)
const llmError = computed(() => store.llmError)
const stepKey = computed(() => activeStep.value?.key ?? '')

const stagedValue = computed({
  get: () => store.stagedValues[stepKey.value] ?? '',
  set: (val: string) => store.setStagedValue(stepKey.value, val),
})

function handleEnter() {
  if (stagedValue.value.trim()) store.finishCard()
}

async function handleRefine() {
  const field = activeStep.value?.field ?? stepKey.value
  await store.callSuggest(field, stepKey.value, stagedValue.value.trim())
}
</script>
