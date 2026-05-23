<!-- components/adventure/adventure-text.vue -->
<!--
  Handles inputType: 'text' (single line) and 'long' (textarea).
  Reads/writes store.stagedValues via computed setter.
  Suggest button: non-LLM steps use generatorStore via store.suggestCurrentStep().
  LLM steps call /api/adventure/suggest directly and write back to stagedValues.
  No emits.
-->
<template>
  <div class="flex flex-col gap-3">
    <!-- Input field -->
    <label class="form-control w-full">
      <div class="label pb-1">
        <span class="label-text font-bold text-base-content/80">
          {{ activeStep?.inputLabel ?? activeStep?.title ?? 'Your answer' }}
        </span>
        <span
          v-if="charCount > 0"
          class="label-text-alt tabular-nums text-base-content/40"
        >
          {{ charCount }}
        </span>
      </div>

      <!-- Textarea — long -->
      <textarea
        v-if="isLong"
        v-model="stagedValue"
        class="textarea textarea-bordered min-h-36 w-full rounded-2xl bg-base-100 text-base leading-relaxed transition-colors focus:border-primary focus:bg-base-100"
        :placeholder="activeStep?.placeholder ?? 'Write anything that fits...'"
      />

      <!-- Input — short -->
      <input
        v-else
        v-model="stagedValue"
        type="text"
        class="input input-bordered w-full rounded-2xl bg-base-100 transition-colors focus:border-primary"
        :placeholder="activeStep?.placeholder ?? 'Enter a value...'"
        @keydown.enter="handleEnter"
      />
    </label>

    <!-- Suggest strip -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Generator suggest (always available) -->
      <button
        type="button"
        class="btn btn-sm btn-ghost gap-2 rounded-xl border border-base-300 hover:border-secondary hover:bg-secondary/10"
        :disabled="llmLoading"
        @click="handleSuggest"
      >
        <Icon name="kind-icon:dice" class="h-3.5 w-3.5" />
        Suggest
      </button>

      <!-- LLM refine (only for needsLLM steps) -->
      <button
        v-if="activeStep?.needsLLM"
        type="button"
        class="btn btn-sm btn-ghost gap-2 rounded-xl border border-base-300 hover:border-primary hover:bg-primary/10"
        :disabled="llmLoading || !stagedValue.trim()"
        @click="handleLLMRefine"
      >
        <span v-if="llmLoading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:sparkles" class="h-3.5 w-3.5" />
        Refine with AI
      </button>

      <!-- Clear -->
      <button
        v-if="stagedValue.trim()"
        type="button"
        class="btn btn-sm btn-ghost gap-1 rounded-xl text-base-content/40 hover:text-error"
        @click="stagedValue = ''"
      >
        <Icon name="kind-icon:x" class="h-3 w-3" />
        Clear
      </button>

      <!-- LLM error inline -->
      <p v-if="llmError" class="text-xs text-error">
        {{ llmError }}
      </p>
    </div>

    <!-- Char preview for long inputs — shows first 2 lines grayed out if empty -->
    <div
      v-if="isLong && !stagedValue.trim()"
      class="rounded-xl border border-dashed border-base-300 bg-base-200/50 px-4 py-3"
    >
      <p class="text-sm italic text-base-content/30 line-clamp-2">
        {{ activeStep?.placeholder ?? 'Your answer will appear here.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import { performFetch } from '@/stores/utils'

const store = useAdventureStore()

// ── Store reads ─────────────────────────────────────────────────────────────

const activeStep = computed(() => store.activeStep)
const isLong = computed(() => activeStep.value?.inputType === 'long')
const stepKey = computed(() => activeStep.value?.key ?? '')

// ── Two-way staged value ────────────────────────────────────────────────────

const stagedValue = computed({
  get: () => store.stagedValues[stepKey.value] ?? '',
  set: (val: string) => store.setStagedValue(stepKey.value, val),
})

const charCount = computed(() => stagedValue.value.length)

// ── LLM state (local — does not need to live in store) ──────────────────────

const llmLoading = ref(false)
const llmError = ref<string | null>(null)

// ── Interactions ────────────────────────────────────────────────────────────

/** Enter on short input: advance / finish if value present */
function handleEnter() {
  if (!isLong.value && stagedValue.value.trim()) {
    store.finishCard()
  }
}

/** Generator suggest — no API, instant */
function handleSuggest() {
  llmError.value = null
  store.suggestCurrentStep()
}

/**
 * LLM refine — sends current sheet context + existing value to the API.
 * On success, overwrites stagedValues[stepKey] with the refined string.
 * Writes directly to store — no emit needed.
 */
async function handleLLMRefine() {
  const current = stagedValue.value.trim()
  if (!current || llmLoading.value) return

  llmLoading.value = true
  llmError.value = null

  try {
    type SuggestResult = { value: string }

    const result = await performFetch<SuggestResult>('/api/adventure/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: activeStep.value?.field ?? stepKey.value,
        current,
        sheet: store.sheet,
        stepKey: stepKey.value,
      }),
    })

    if (result.success && result.data?.value) {
      store.setStagedValue(stepKey.value, result.data.value)
    } else {
      llmError.value =
        result.message ?? 'The AI returned something inscrutable. Try again.'
    }
  } catch {
    llmError.value = 'Connection failed. The AI is unavailable or confused.'
  } finally {
    llmLoading.value = false
  }
}
</script>
