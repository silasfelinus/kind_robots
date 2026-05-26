<!-- components/rewards/reward-text.vue -->
<!-- Text/long input for reward name and power, with LLM assist and examples. -->
<template>
  <div class="flex flex-col gap-3">
    <!-- Example chips (power step only) -->
    <div v-if="showExamples && examples.length" class="flex flex-col gap-2">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Examples
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="ex in examples"
          :key="ex.text"
          type="button"
          class="rounded-xl border border-base-300 bg-base-200 px-2.5 py-1 text-left text-xs text-base-content/70 transition-all hover:border-primary/40 hover:text-primary"
          @click="useExample(ex)"
        >
          <span class="font-bold">{{ ex.text }}</span>
          <span class="ml-1 text-base-content/40"
            >— {{ ex.power.slice(0, 50) }}...</span
          >
        </button>
      </div>
    </div>

    <!-- Input -->
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
          rows="4"
          :placeholder="activeStep?.placeholder ?? ''"
          :maxlength="activeStep?.maxLength ?? 512"
        />
        <input
          v-else
          v-model="stagedValue"
          type="text"
          class="input input-bordered w-full rounded-2xl bg-base-100 focus:border-primary"
          :placeholder="activeStep?.placeholder ?? ''"
          :maxlength="activeStep?.maxLength ?? 256"
          @keydown.enter="store.finishCard()"
        />
      </div>
    </div>

    <!-- LLM assist -->
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
import { useRewardBuilderStore } from '@/stores/rewardBuilderStore'

const store = useRewardBuilderStore()

const activeStep = computed(() => store.activeStep)
const isLong = computed(() => activeStep.value?.inputType === 'long')
const stepKey = computed(() => activeStep.value?.key ?? '')
const llmLoading = computed(() => store.llmLoading)
const llmError = computed(() => store.llmError)

// Show examples only on the power step
const showExamples = computed(() => stepKey.value === 'rewardPower')
const examples = computed(() => store.currentTypeExamples)

const stagedValue = computed({
  get: () => store.stagedValues[stepKey.value] ?? '',
  set: (v: string) => store.setStagedValue(stepKey.value, v),
})

function useExample(ex: { text: string; power: string }) {
  // If on name step, use text; if on power step, use power
  if (stepKey.value === 'rewardText') {
    store.setStagedValue(stepKey.value, ex.text)
  } else {
    store.setStagedValue(stepKey.value, ex.power)
  }
}

async function handleRefine() {
  const field = activeStep.value?.field ?? stepKey.value
  await store.callSuggest(field, stepKey.value, stagedValue.value.trim())
}
</script>
