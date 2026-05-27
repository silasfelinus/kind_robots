<!-- components/dreams/dream-text.vue -->
<!-- Text/long input for dream fields with LLM assist. -->
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
          v-if="isLong"
          v-model="stagedValue"
          class="textarea textarea-bordered w-full resize-none rounded-2xl bg-base-100 text-base leading-relaxed focus:border-primary focus:outline-none"
          rows="5"
          :placeholder="activeStep?.placeholder ?? ''"
          :maxlength="activeStep?.maxLength ?? 1000"
        />
        <input
          v-else
          v-model="stagedValue"
          type="text"
          class="input input-bordered w-full rounded-2xl bg-base-100 focus:border-primary"
          :placeholder="activeStep?.placeholder ?? ''"
          :maxlength="activeStep?.maxLength ?? 255"
          @keydown.enter="store.finishCard()"
        />
      </div>
    </div>

    <div v-if="activeStep?.needsLLM" class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="btn btn-ghost btn-sm rounded-xl gap-1.5 border border-base-300"
        :disabled="llmLoading"
        @click="handleRefine"
      >
        <span v-if="llmLoading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
        {{ stagedValue.trim() ? 'Refine' : 'Generate' }}
      </button>
      <p v-if="llmError" class="text-xs text-error">{{ llmError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDreamBuilderStore } from '@/stores/dreamBuilderStore'

const store = useDreamBuilderStore()
const activeStep = computed(() => store.activeStep)
const isLong = computed(() => activeStep.value?.inputType === 'long')
const stepKey = computed(() => activeStep.value?.key ?? '')
const llmLoading = computed(() => store.llmLoading)
const llmError = computed(() => store.llmError)

const stagedValue = computed({
  get: () => store.stagedValues[stepKey.value] ?? '',
  set: (v: string) => store.setStagedValue(stepKey.value, v),
})

async function handleRefine() {
  const field = activeStep.value?.field ?? stepKey.value
  await store.callSuggest(field, stepKey.value, stagedValue.value.trim())
}
</script>
