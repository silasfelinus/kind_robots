<!-- /components/content/composition/composition-interact.vue -->
<!--
  The synthesis engine. Takes a saved Composition (with any mix of ingredient
  FKs / blurbs) and calls the text server to generate narrativeText and/or
  artPrompt outputs, then patches them back onto the record.
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md"
    >
      <h1 class="text-2xl font-bold text-primary md:text-3xl">
        Synthesis Engine
      </h1>
      <p
        class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base"
      >
        Combine your ingredients into a narrative scene, an art prompt, or both.
      </p>
    </header>

    <div
      v-if="statusMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ statusMessage }}
    </div>

    <section
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]"
    >
      <!-- Left: ingredient summary + outputs -->
      <main
        class="flex min-h-0 flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <!-- Ingredient overview -->
        <section class="shrink-0">
          <h2 class="mb-3 text-lg font-bold text-base-content">Ingredients</h2>

          <div
            v-if="hasAnyIngredient"
            class="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            <div
              v-for="ingredient in activeIngredients"
              :key="ingredient.slot"
              class="flex items-start gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <Icon
                :name="ingredient.icon"
                class="mt-0.5 h-6 w-6 shrink-0 text-primary"
              />
              <div class="min-w-0">
                <div
                  class="text-xs font-bold uppercase tracking-wide text-base-content/50"
                >
                  {{ ingredient.slot }}
                </div>
                <div class="truncate text-sm font-semibold text-base-content">
                  {{ ingredient.label }}
                </div>
                <div class="line-clamp-2 text-xs text-base-content/60">
                  {{ ingredient.summary }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-base-content/50"
          >
            <Icon name="kind-icon:sparkles" class="h-8 w-8 text-primary/50" />
            <p class="text-sm">
              No ingredients set. Add at least one FK or blurb to synthesize.
            </p>
          </div>
        </section>

        <!-- Synthesis prompt preview -->
        <section
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-200"
        >
          <div
            class="flex items-center justify-between gap-2 border-b border-base-300 bg-base-100 p-3"
          >
            <div>
              <h2 class="text-base font-bold text-base-content">
                Synthesis Prompt
              </h2>
              <p class="text-xs text-base-content/50">
                What gets sent to the AI.
              </p>
            </div>
            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="!synthesisPrompt"
              @click="copyPrompt"
            >
              <Icon name="kind-icon:copy" class="h-4 w-4" />
              Copy
            </button>
          </div>
          <div class="min-h-0 overflow-auto p-3">
            <pre
              v-if="synthesisPrompt"
              class="whitespace-pre-wrap rounded-2xl bg-base-300 p-3 text-sm leading-relaxed text-base-content/80"
              >{{ synthesisPrompt }}</pre
            >
            <div
              v-else
              class="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-4 text-center text-sm text-base-content/50"
            >
              Add ingredients to preview the synthesis prompt.
            </div>
          </div>
        </section>

        <!-- Outputs -->
        <section class="shrink-0 space-y-3">
          <div
            v-if="composition?.narrativeText"
            class="rounded-2xl border border-success/30 bg-success/10 p-4"
          >
            <div class="mb-1 flex items-center justify-between">
              <h3 class="text-sm font-bold text-success">Narrative</h3>
              <button
                class="btn btn-xs btn-ghost rounded-xl"
                @click="copyNarrative"
              >
                <Icon name="kind-icon:copy" class="h-3 w-3" />
              </button>
            </div>
            <p
              class="whitespace-pre-wrap text-sm leading-relaxed text-base-content/80"
            >
              {{ composition.narrativeText }}
            </p>
          </div>

          <div
            v-if="composition?.artPrompt"
            class="rounded-2xl border border-primary/30 bg-primary/10 p-4"
          >
            <div class="mb-1 flex items-center justify-between">
              <h3 class="text-sm font-bold text-primary">Art Prompt</h3>
              <button
                class="btn btn-xs btn-ghost rounded-xl"
                @click="copyArtPrompt"
              >
                <Icon name="kind-icon:copy" class="h-3 w-3" />
              </button>
            </div>
            <p
              class="whitespace-pre-wrap text-sm leading-relaxed text-base-content/80"
            >
              {{ composition.artPrompt }}
            </p>
          </div>
        </section>
      </main>

      <!-- Right: controls -->
      <aside class="flex min-h-0 flex-col gap-4 overflow-auto">
        <!-- Mode selector -->
        <section
          class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <h2 class="mb-3 text-base font-bold text-base-content">
            Output Mode
          </h2>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="m in modes"
              :key="m.value"
              class="btn justify-start rounded-2xl text-left normal-case"
              :class="selectedMode === m.value ? 'btn-primary' : 'btn-outline'"
              type="button"
              :disabled="isSynthesizing"
              @click="selectedMode = m.value"
            >
              <Icon :name="m.icon" class="h-5 w-5" />
              <span class="flex min-w-0 flex-col items-start">
                <span class="font-bold">{{ m.label }}</span>
                <span class="text-xs opacity-70">{{ m.description }}</span>
              </span>
            </button>
          </div>
        </section>

        <!-- Style nudge -->
        <section
          class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <h2 class="mb-1 text-base font-bold text-base-content">
            Style Direction
          </h2>
          <p class="mb-3 text-xs text-base-content/60">
            Optional tone, genre, or constraint to guide the output.
          </p>
          <textarea
            v-model="styleDirection"
            class="textarea textarea-bordered min-h-24 w-full rounded-2xl bg-base-200 text-sm"
            placeholder="e.g. 'gothic fantasy', 'whimsical', 'noir, rainy city', 'Studio Ghibli vibes'..."
            :disabled="isSynthesizing"
          />
        </section>

        <!-- Save outputs toggle -->
        <section
          class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <label class="flex cursor-pointer items-center justify-between gap-3">
            <div>
              <div class="text-sm font-bold text-base-content">
                Save outputs to record
              </div>
              <div class="text-xs text-base-content/60">
                Patches narrativeText / artPrompt back to DB.
              </div>
            </div>
            <input
              v-model="saveOutputs"
              type="checkbox"
              class="toggle toggle-primary"
            />
          </label>
        </section>

        <!-- Actions -->
        <footer
          class="mt-auto grid grid-cols-1 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md sm:grid-cols-2"
        >
          <button
            class="btn btn-ghost rounded-xl"
            type="button"
            :disabled="isSynthesizing"
            @click="clearOutputs"
          >
            <Icon name="kind-icon:refresh" class="h-5 w-5" />
            Clear
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            :disabled="!canSynthesize"
            @click="runSynthesis"
          >
            <span
              v-if="isSynthesizing"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else name="kind-icon:wand" class="h-5 w-5" />
            Synthesize
          </button>
        </footer>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCompositionStore } from '@/stores/compositionStore'
import { performFetch } from '@/stores/utils'

type CompositionMode = 'narrative' | 'art' | 'both'

type StatusTone = 'success' | 'error'

type IngredientSlot = 'character' | 'dream' | 'scenario' | 'pitch' | 'reward'

const compositionStore = useCompositionStore()

const selectedMode = ref<CompositionMode>('both')
const styleDirection = ref('')
const saveOutputs = ref(true)
const statusMessage = ref('')
const statusTone = ref<StatusTone>('success')
const isSynthesizing = ref(false)

const modes = [
  {
    value: 'both' as CompositionMode,
    label: 'Both',
    icon: 'kind-icon:sparkles',
    description: 'Generate narrative scene + art prompt.',
  },
  {
    value: 'narrative' as CompositionMode,
    label: 'Narrative',
    icon: 'kind-icon:scroll',
    description: 'Story text only.',
  },
  {
    value: 'art' as CompositionMode,
    label: 'Art Prompt',
    icon: 'kind-icon:image',
    description: 'Stable Diffusion / ComfyUI prompt only.',
  },
]

const composition = computed(() => compositionStore.selected)

// ── Ingredient resolution ─────────────────────────────────────────────────

type ResolvedIngredient = {
  slot: IngredientSlot
  label: string
  summary: string
  icon: string
  promptFragment: string
}

function resolveCharacter(): ResolvedIngredient | null {
  const c = (composition.value as any)?.Character
  const blurb = composition.value?.characterBlurb
  if (!c && !blurb) return null
  const label = c?.name || 'Custom character'
  const summary =
    blurb || [c?.class, c?.species].filter(Boolean).join(' · ') || ''
  const fragment = blurb
    ? `CHARACTER: ${blurb}`
    : [
        `CHARACTER: ${c.name}`,
        c.class ? `Class: ${c.class}` : '',
        c.species ? `Species: ${c.species}` : '',
        c.backstory ? `Backstory: ${c.backstory}` : '',
        c.drive ? `Drive: ${c.drive}` : '',
        c.quirks ? `Quirks: ${c.quirks}` : '',
        c.artPrompt ? `Visual: ${c.artPrompt}` : '',
      ]
        .filter(Boolean)
        .join('\n')
  return {
    slot: 'character',
    label,
    summary,
    icon: 'kind-icon:user',
    promptFragment: fragment,
  }
}

function resolveDream(): ResolvedIngredient | null {
  const d = (composition.value as any)?.Dream
  const blurb = composition.value?.dreamBlurb
  if (!d && !blurb) return null
  const label = d?.title || 'Custom location'
  const summary = blurb || d?.description?.slice(0, 80) || ''
  const fragment = blurb
    ? `LOCATION: ${blurb}`
    : [
        `LOCATION: ${d.title}`,
        d.description ? `Description: ${d.description}` : '',
        d.currentVibe ? `Vibe: ${d.currentVibe}` : '',
        d.artPrompt ? `Visual: ${d.artPrompt}` : '',
      ]
        .filter(Boolean)
        .join('\n')
  return {
    slot: 'dream',
    label,
    summary,
    icon: 'kind-icon:map',
    promptFragment: fragment,
  }
}

function resolveScenario(): ResolvedIngredient | null {
  const s = (composition.value as any)?.Scenario
  const blurb = composition.value?.scenarioBlurb
  if (!s && !blurb) return null
  const label = s?.title || 'Custom scenario'
  const summary = blurb || s?.description?.slice(0, 80) || ''
  const fragment = blurb
    ? `SCENARIO: ${blurb}`
    : [
        `SCENARIO: ${s.title}`,
        s.description ? `Situation: ${s.description}` : '',
        s.locations ? `Locations: ${s.locations}` : '',
        s.artPrompt ? `Visual: ${s.artPrompt}` : '',
      ]
        .filter(Boolean)
        .join('\n')
  return {
    slot: 'scenario',
    label,
    summary,
    icon: 'kind-icon:scroll',
    promptFragment: fragment,
  }
}

function resolvePitch(): ResolvedIngredient | null {
  const p = (composition.value as any)?.Pitch
  const blurb = composition.value?.pitchBlurb
  if (!p && !blurb) return null
  const label = p?.title || 'Custom concept'
  const summary = blurb || p?.pitch?.slice(0, 80) || ''
  const fragment = blurb
    ? `CONCEPT: ${blurb}`
    : [
        `CONCEPT: ${p.title || p.pitch}`,
        p.flavorText ? `Flavor: ${p.flavorText}` : '',
        p.artPrompt ? `Visual: ${p.artPrompt}` : '',
      ]
        .filter(Boolean)
        .join('\n')
  return {
    slot: 'pitch',
    label,
    summary,
    icon: 'kind-icon:lightbulb',
    promptFragment: fragment,
  }
}

function resolveReward(): ResolvedIngredient | null {
  const r = (composition.value as any)?.Reward
  const blurb = composition.value?.rewardBlurb
  if (!r && !blurb) return null
  const label = r?.label || 'Custom reward'
  const summary = blurb || r?.text?.slice(0, 80) || ''
  const fragment = blurb
    ? `REWARD/LOOT: ${blurb}`
    : [
        `REWARD/LOOT: ${r.label || r.rewardType}`,
        r.text ? `Description: ${r.text}` : '',
        r.power ? `Power: ${r.power}` : '',
        r.rarity ? `Rarity: ${r.rarity}` : '',
      ]
        .filter(Boolean)
        .join('\n')
  return {
    slot: 'reward',
    label,
    summary,
    icon: 'kind-icon:star',
    promptFragment: fragment,
  }
}

const activeIngredients = computed((): ResolvedIngredient[] => {
  return [
    resolveCharacter(),
    resolveDream(),
    resolveScenario(),
    resolvePitch(),
    resolveReward(),
  ].filter((i): i is ResolvedIngredient => i !== null)
})

const hasAnyIngredient = computed(() => activeIngredients.value.length > 0)

const canSynthesize = computed(
  () => hasAnyIngredient.value && !isSynthesizing.value,
)

// ── Synthesis prompt construction ─────────────────────────────────────────

const synthesisPrompt = computed(() => {
  if (!hasAnyIngredient.value) return ''

  const mode = selectedMode.value
  const ingredientBlock = activeIngredients.value
    .map((i) => i.promptFragment)
    .join('\n\n')

  const outputInstructions =
    mode === 'narrative'
      ? 'Write a vivid narrative scene (2-4 paragraphs) that incorporates all the ingredients above. Focus on story, atmosphere, and character voice.'
      : mode === 'art'
        ? 'Write a detailed Stable Diffusion / ComfyUI art prompt (comma-separated descriptors) that visually captures the essence of all the ingredients above. Include style, lighting, composition, and mood cues.'
        : `Produce TWO outputs separated by "---ART---":
1. A vivid narrative scene (2-4 paragraphs) incorporating all ingredients.
2. A detailed Stable Diffusion art prompt capturing the same scene visually.`

  const styleBlock = styleDirection.value.trim()
    ? `\nSTYLE DIRECTION: ${styleDirection.value.trim()}`
    : ''

  return `You are a creative synthesis engine for Kind Robots.
Combine the following ingredients into a coherent output.${styleBlock}

${ingredientBlock}

─────────────────────────────────────
${outputInstructions}`
})

// ── Synthesis execution ───────────────────────────────────────────────────

function setStatus(message: string, tone: StatusTone = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

async function runSynthesis() {
  if (!canSynthesize.value || !composition.value) return

  isSynthesizing.value = true
  statusMessage.value = ''

  try {
    // Call the text server via the existing bot/prompt pipeline.
    // Adjust the endpoint to match your actual text generation route.
    const res = await performFetch<{ content: string }>('/api/bots/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: synthesisPrompt.value,
        botName: 'ami', // or whatever your default synthesis bot is
        maxTokens: 1200,
      }),
    })

    if (!res.success || !res.data?.content) {
      throw new Error(res.message || 'No content returned from synthesis.')
    }

    const rawContent = res.data.content
    let narrativeText: string | undefined
    let artPrompt: string | undefined

    if (selectedMode.value === 'both') {
      const parts = rawContent.split(/---ART---/i)
      narrativeText = parts[0]?.trim() || undefined
      artPrompt = parts[1]?.trim() || undefined
    } else if (selectedMode.value === 'narrative') {
      narrativeText = rawContent.trim()
    } else {
      artPrompt = rawContent.trim()
    }

    if (saveOutputs.value && composition.value.id) {
      const saved = await compositionStore.saveSynthesisOutputs(
        composition.value.id,
        {
          narrativeText,
          artPrompt,
        },
      )
      if (!saved.success)
        throw new Error(saved.message || 'Failed to save outputs.')
      setStatus('Synthesis complete and saved.')
    } else {
      // Optimistic local update without persisting
      compositionStore.selected = {
        ...composition.value,
        narrativeText: narrativeText ?? composition.value.narrativeText,
        artPrompt: artPrompt ?? composition.value.artPrompt,
      }
      setStatus(
        'Synthesis complete. (Not saved — toggle "Save outputs" to persist.)',
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synthesis failed.'
    setStatus(message, 'error')
  } finally {
    isSynthesizing.value = false
  }
}

// ── Clipboard helpers ─────────────────────────────────────────────────────

async function copyPrompt() {
  if (!synthesisPrompt.value) return
  await navigator.clipboard.writeText(synthesisPrompt.value)
  setStatus('Synthesis prompt copied.')
}

async function copyNarrative() {
  if (!composition.value?.narrativeText) return
  await navigator.clipboard.writeText(composition.value.narrativeText)
  setStatus('Narrative copied.')
}

async function copyArtPrompt() {
  if (!composition.value?.artPrompt) return
  await navigator.clipboard.writeText(composition.value.artPrompt)
  setStatus('Art prompt copied.')
}

function clearOutputs() {
  statusMessage.value = ''
  styleDirection.value = ''
  selectedMode.value = 'both'
}
</script>
