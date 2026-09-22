<!-- /components/art/art-batch-randomizer.vue -->
<template>
  <section class="kr-panel-flat p-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <h2 class="flex items-center gap-2 text-base font-bold text-primary">
          <Icon name="kind-icon:dice" class="kr-icon-4" />
          Random batch
        </h2>
        <p class="kr-text-dim-xs-55 mt-0.5">
          Write {character} running in {style} and queue ten of them, each with
          its own LoRAs rolled in.
        </p>
      </div>

      <label class="form-control w-28 shrink-0">
        <span class="label py-0">
          <span class="label-text kr-text-dim-xs-55 font-bold">Batch</span>
        </span>
        <input
          v-model.number="batch"
          type="number"
          min="1"
          :max="MAX_RANDOM_BATCH"
          class="input input-bordered input-sm rounded-2xl bg-base-200 text-center"
          :disabled="busy"
        />
      </label>
    </div>

    <div class="mt-2 flex flex-wrap gap-1.5">
      <button
        v-for="chip in placeholderChips"
        :key="chip.placeholder"
        type="button"
        class="badge badge-outline h-auto min-h-6 rounded-xl py-1 hover:badge-primary"
        :title="chip.hint"
        :disabled="busy"
        @click="insertPlaceholder(chip.placeholder)"
      >
        {{ token(chip.placeholder) }}
      </button>
    </div>

    <p v-if="hasPlaceholders" class="kr-note kr-note-info mt-3 p-2 text-xs">
      This prompt has placeholders. Roll and queue it here — plain Generate
      sends the braces to the renderer as literal text.
    </p>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="kr-text-black-base btn btn-secondary min-h-10 rounded-2xl"
        :disabled="!canRoll"
        @click="rollAndQueue"
      >
        <span v-if="busy" class="flex items-center gap-2">
          <span class="kr-spinner-sm-dots" />
          Queueing…
        </span>
        <span v-else class="flex items-center gap-2">
          <Icon name="kind-icon:sparkles" class="kr-icon-4" />
          Roll &amp; queue {{ batch }}
        </span>
      </button>

      <span class="kr-text-dim-xs">{{ readiness }}</span>
    </div>

    <div v-if="plan" class="mt-3 flex flex-col gap-2">
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="pool in plan.pools"
          :key="pool.key"
          class="badge h-auto min-h-6 gap-1 rounded-xl py-1"
          :class="pool.size ? 'badge-success badge-outline' : 'badge-warning'"
          :title="
            pool.size
              ? `${pool.size} option(s) from ${pool.source}`
              : 'Nothing to roll from — classify some LoRAs or Facets for this slot.'
          "
        >
          {{ token(pool.key) }}
          <span class="opacity-70">{{
            pool.size ? `×${pool.size}` : 'empty'
          }}</span>
        </span>
      </div>

      <p v-if="emptyPools.length" class="kr-note kr-note-error p-2 text-xs">
        Nothing to roll for
        {{ emptyPoolTokens }}. Those stayed in the prompt as written — classify
        LoRAs for them in the LoRA editor, or use a placeholder with a pool
        behind it.
      </p>

      <ul class="flex flex-col gap-1">
        <li
          v-for="variant in plan.variants"
          :key="variant.variantKey"
          class="kr-text-dim-xs truncate rounded-xl bg-base-200 px-2 py-1"
          :title="variant.promptString"
        >
          {{ variant.promptString }}
        </li>
      </ul>

      <p class="kr-text-dim-xs-55">Seed {{ plan.seed }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import {
  MAX_RANDOM_BATCH,
  emptyRandomPools,
  type ArtRandomBatchPlan,
} from '@/utils/artRandomBatch'

const artStore = useArtStore()
const promptStore = usePromptStore()

const batch = ref(4)
const busy = ref(false)

const plan = computed<ArtRandomBatchPlan | null>(
  () => artStore.lastRandomBatchPlan,
)

const emptyPools = computed(() =>
  plan.value ? emptyRandomPools(plan.value) : [],
)

const emptyPoolTokens = computed(() =>
  emptyPools.value.map((pool) => token(pool.key)).join(', '),
)

/*
 * One chip per placeholder word, deduplicated, LoRA slots first. The catalog
 * of words is only known to the server (it depends on which Facet taxonomies
 * exist), so the chips are seeded from the last roll's `known` list and fall
 * back to the handful that always exist before the first roll.
 */
const FALLBACK_CHIPS = [
  {
    placeholder: 'character',
    hint: 'A character LoRA, or a Character record.',
  },
  { placeholder: 'style', hint: 'A style LoRA, or a STYLE Facet.' },
  { placeholder: 'setting', hint: 'A setting LoRA, or a SETTING Facet.' },
  { placeholder: 'action', hint: 'An action or pose LoRA.' },
  { placeholder: 'clothing', hint: 'A clothing LoRA.' },
  { placeholder: 'creature', hint: 'A creature LoRA, or an ANIMAL Facet.' },
]

const placeholderChips = computed(() => {
  const known = plan.value?.known ?? []
  if (!known.length) return FALLBACK_CHIPS

  const seen = new Set<string>()
  return known
    .filter((entry) => {
      if (seen.has(entry.placeholder)) return false
      seen.add(entry.placeholder)
      return true
    })
    .slice(0, 18)
})

/*
 * Matches server/utils/promptVariants.ts's single-brace pattern. It is a
 * lookalike rather than an import on purpose: this is a nudge in the UI, and
 * a false positive here costs a hint nobody needed, while pulling a server
 * util into a component to be exact would cost the layering rule.
 */
const hasPlaceholders = computed(() =>
  /\{\s*[a-zA-Z0-9_:-]+\s*\}/.test(artStore.finalPromptString ?? ''),
)

const canRoll = computed(
  () =>
    !busy.value &&
    !artStore.isGenerating &&
    Boolean(artStore.finalPromptString) &&
    batch.value >= 1 &&
    batch.value <= MAX_RANDOM_BATCH,
)

const readiness = computed(() => {
  if (!artStore.finalPromptString) return 'Write a prompt first.'
  if (batch.value > MAX_RANDOM_BATCH) return `Maximum ${MAX_RANDOM_BATCH}.`
  return `${batch.value} job${batch.value === 1 ? '' : 's'}, ${batch.value} rolls.`
})

/*
 * Built in script rather than inline in the template: a `{{ \`{${x}}\` }}`
 * interpolation ends the mustache on the first `}}` it meets, which is a
 * template parse error rather than the literal `{style}` it looks like.
 */
function token(placeholder: string): string {
  return `{${placeholder}}`
}

function insertPlaceholder(placeholder: string): void {
  const current = promptStore.promptField?.trim() ?? ''
  const next = token(placeholder)
  promptStore.promptField = current ? `${current} ${next}` : next
}

async function rollAndQueue(): Promise<void> {
  busy.value = true
  try {
    await artStore.enqueueRandomizedArtBatch({ batch: batch.value })
  } finally {
    busy.value = false
  }
}
</script>
