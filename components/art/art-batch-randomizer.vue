<!-- /components/art/art-batch-randomizer.vue -->
<template>
  <section class="kr-panel-flat p-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <h2 class="flex items-center gap-2 text-base font-bold text-primary">
          <Icon name="kind-icon:dice" class="kr-icon-4" />
          Batch & randomizers
        </h2>
        <p class="kr-text-dim-xs-55 mt-0.5">
          Choose how many images Generate should queue, and add random LoRAs,
          Facets, or Kind Robots objects to the prompt.
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
          :disabled="artStore.isGenerating"
        />
      </label>
    </div>

    <div class="mt-3 grid gap-2">
      <div
        v-for="group in optionGroups"
        :key="group.label"
        class="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2"
      >
        <span
          class="kr-text-eyebrow pt-1.5 text-[10px] tracking-wide text-base-content/45"
        >
          {{ group.label }}
        </span>
        <div
          class="max-h-20 overflow-y-auto rounded-xl border border-base-content/10 bg-base-200/40 p-1.5"
        >
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="option in group.options"
              :key="option.placeholder"
              type="button"
              class="badge badge-outline h-auto min-h-6 rounded-xl py-1 hover:badge-primary"
              :title="`${option.hint} Inserts ${token(option.placeholder)}.`"
              :disabled="artStore.isGenerating"
              @click="insertPlaceholder(option.placeholder)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <p class="kr-note kr-note-info mt-3 p-2 text-xs">
      <span v-if="hasPlaceholders">
        Generate rolls every placeholder before queueing, so the braces never
        become a stray literal image.
      </span>
      <span v-else>
        Generate queues {{ batch }} {{ batch === 1 ? 'image' : 'images' }} with
        the current prompt.
      </span>
    </p>

    <div class="mt-3">
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
              : 'Nothing to roll from for this source yet.'
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
        {{ emptyPoolTokens }}. Those stayed in the prompt as written. Add or
        classify values for that source, or choose another random slot.
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
import { computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { FACET_TAXONOMIES } from '@/stores/facetCatalogStore'
import { LORA_CATEGORIES, LORA_CATEGORY_META } from '@/utils/loraCategory'
import { ART_RANDOM_OBJECT_OPTIONS } from '@/utils/artRandomOptions'
import {
  MAX_RANDOM_BATCH,
  emptyRandomPools,
  type ArtRandomBatchPlan,
} from '@/utils/artRandomBatch'

const artStore = useArtStore()
const promptStore = usePromptStore()

const batch = computed<number>({
  get: () => artStore.generationBatchSize,
  set: (value) => artStore.setGenerationBatchSize(value),
})

const plan = computed<ArtRandomBatchPlan | null>(
  () => artStore.lastRandomBatchPlan,
)

const emptyPools = computed(() =>
  plan.value ? emptyRandomPools(plan.value) : [],
)

const emptyPoolTokens = computed(() =>
  emptyPools.value.map((pool) => token(pool.key)).join(', '),
)

type PromptOption = {
  placeholder: string
  label: string
  hint: string
}

function labelFromTaxonomy(taxonomy: string): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const loraOptions: PromptOption[] = LORA_CATEGORIES.map((category) => {
  const meta = LORA_CATEGORY_META[category]
  const placeholder = meta.placeholders[0] || category.toLowerCase()
  return {
    placeholder: `lora:${placeholder}`,
    label: meta.label,
    hint: meta.hint,
  }
})

const facetOptions: PromptOption[] = FACET_TAXONOMIES.filter(
  (taxonomy) => taxonomy !== 'OTHER',
).map((taxonomy) => ({
  placeholder: `facet:${taxonomy.toLowerCase()}`,
  label: labelFromTaxonomy(taxonomy),
  hint: `A random ${labelFromTaxonomy(taxonomy)} Facet.`,
}))

const objectOptions: PromptOption[] = ART_RANDOM_OBJECT_OPTIONS.map(
  (option) => ({
    placeholder: option.placeholder,
    label: option.label,
    hint: option.hint,
  }),
)

const optionGroups: Array<{ label: string; options: PromptOption[] }> = [
  { label: 'LoRAs', options: loraOptions },
  { label: 'Facets', options: facetOptions },
  { label: 'Objects', options: objectOptions },
]

/*
 * Matches server/utils/promptVariants.ts's single-brace pattern. It is a
 * lookalike rather than an import on purpose: this is a nudge in the UI, and
 * a false positive here costs a hint nobody needed, while pulling a server
 * util into a component to be exact would cost the layering rule.
 */
const hasPlaceholders = computed(() =>
  /\{\s*[a-zA-Z0-9_:-]+\s*\}/.test(artStore.finalPromptString ?? ''),
)

const readiness = computed(() => {
  if (!artStore.finalPromptString) return 'Write a prompt first.'
  if (batch.value > MAX_RANDOM_BATCH) return `Maximum ${MAX_RANDOM_BATCH}.`
  if (hasPlaceholders.value) {
    return `${batch.value} job${batch.value === 1 ? '' : 's'}, placeholders rolled automatically.`
  }
  return `${batch.value} job${batch.value === 1 ? '' : 's'} on Generate.`
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

</script>
