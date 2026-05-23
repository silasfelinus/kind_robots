<!-- components/adventure/adventure-art.vue -->
<!--
  Portrait builder: final step of the adventure.
  1. User toggles which sheet fields inform the portrait.
  2. "Assemble" builds the prompt string via store.buildArtPrompt().
  3. "Refine with AI" sends it to /api/adventure/suggest for polish.
  4. <art-creator> generates the image.
  5. store.updateArt() records the result.
  No emits.
-->
<template>
  <div class="flex flex-col gap-5">
    <!-- Field selector -->
    <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
      <div class="mb-3 flex items-center justify-between gap-2">
        <p
          class="text-xs font-bold uppercase tracking-widest text-base-content/50"
        >
          Include in portrait
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="text-xs text-base-content/40 underline-offset-2 hover:text-primary hover:underline"
            @click="selectAll"
          >
            all
          </button>
          <span class="text-base-content/20">·</span>
          <button
            type="button"
            class="text-xs text-base-content/40 underline-offset-2 hover:text-base-content/70 hover:underline"
            @click="selectCore"
          >
            core only
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label
          v-for="field in PORTRAIT_FIELDS"
          :key="field.key"
          class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2 transition-all hover:border-primary/40 hover:bg-primary/5"
          :class="
            selectedFields.includes(field.key)
              ? 'border-primary/40 bg-primary/8'
              : ''
          "
        >
          <input
            v-model="selectedFields"
            type="checkbox"
            :value="field.key"
            class="checkbox checkbox-xs checkbox-primary"
          />
          <span class="text-xs font-semibold text-base-content/75">
            {{ field.label }}
          </span>
          <!-- Preview value -->
          <span
            v-if="fieldValue(field.key)"
            class="ml-auto max-w-[4rem] truncate text-[0.6rem] text-base-content/30"
          >
            {{ fieldValue(field.key) }}
          </span>
        </label>
      </div>
    </div>

    <!-- Prompt assembly -->
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-primary gap-2 rounded-xl"
          @click="assemblePrompt"
        >
          <Icon name="kind-icon:wand" class="h-3.5 w-3.5" />
          Assemble Prompt
        </button>

        <button
          type="button"
          class="btn btn-sm btn-ghost gap-2 rounded-xl border border-base-300 hover:border-primary hover:bg-primary/8"
          :disabled="llmLoading || !store.sheet.artPrompt.trim()"
          @click="refineWithAI"
        >
          <span v-if="llmLoading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:sparkles" class="h-3.5 w-3.5" />
          Refine with AI
        </button>

        <p v-if="llmError" class="text-xs text-error">{{ llmError }}</p>
      </div>

      <label class="form-control">
        <div class="label pb-1">
          <span class="label-text font-bold">Portrait Prompt</span>
          <span class="label-text-alt tabular-nums text-base-content/30">
            {{ store.sheet.artPrompt.length }} chars
          </span>
        </div>
        <textarea
          v-model="store.sheet.artPrompt"
          class="textarea textarea-bordered min-h-32 w-full rounded-2xl bg-base-100 text-sm leading-relaxed focus:border-primary"
          placeholder="Portrait prompt will appear here after assembly. You can edit it freely — it belongs to the character."
        />
      </label>
    </div>

    <!-- Art creator -->
    <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
      <p
        class="mb-3 text-xs font-bold uppercase tracking-widest text-base-content/50"
      >
        Generate Portrait
      </p>

      <art-creator
        purpose="character"
        :model-id="null"
        :model-title="store.sheet.name || 'Unnamed Entity'"
        :prompt="store.sheet.artPrompt"
        image-role="portrait"
        @update="handleArtUpdate"
      />
    </div>

    <!-- Current portrait preview -->
    <Transition name="portrait-reveal">
      <div
        v-if="store.sheet.imagePath"
        class="relative overflow-hidden rounded-2xl border border-base-300"
      >
        <img
          :src="store.sheet.imagePath"
          :alt="`Portrait of ${store.sheet.name || 'Unnamed Entity'}`"
          class="w-full object-cover"
          style="max-height: 320px"
        />
        <div
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base-100/90 to-transparent p-4"
        >
          <p class="text-sm font-black text-base-content">
            {{ store.sheet.name || 'Unnamed Entity' }}
          </p>
          <p class="text-xs text-base-content/60">
            Portrait recorded. The universe has been notified.
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import { performFetch } from '@/stores/utils'

const store = useAdventureStore()

// ── Field definitions ───────────────────────────────────────────────────────

const PORTRAIT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'species', label: 'Species' },
  { key: 'class', label: 'Calling' },
  { key: 'role', label: 'Role' },
  { key: 'genre', label: 'Genre' },
  { key: 'alignment', label: 'Alignment' },
  { key: 'gender', label: 'Gender' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'personality', label: 'Personality' },
  { key: 'backstory', label: 'Backstory' },
  { key: 'skills', label: 'Skills' },
] as const

const CORE_FIELDS = ['name', 'species', 'class', 'presentation', 'genre']

const selectedFields = ref<string[]>([...CORE_FIELDS, 'skills'])

function selectAll() {
  selectedFields.value = PORTRAIT_FIELDS.map((f) => f.key)
}
function selectCore() {
  selectedFields.value = [...CORE_FIELDS]
}

function fieldValue(key: string): string {
  if (key === 'skills') {
    return Object.values(store.sheet.rewards)
      .map((r) => r.label)
      .join(', ')
  }
  const val = (store.sheet as Record<string, unknown>)[key]
  return typeof val === 'string' ? val.slice(0, 20) : ''
}

// ── Prompt assembly ─────────────────────────────────────────────────────────

function assemblePrompt() {
  store.buildArtPrompt(selectedFields.value)
}

// ── LLM refinement ──────────────────────────────────────────────────────────

const llmLoading = ref(false)
const llmError = ref<string | null>(null)

async function refineWithAI() {
  const current = store.sheet.artPrompt.trim()
  if (!current || llmLoading.value) return

  llmLoading.value = true
  llmError.value = null

  try {
    type SuggestResult = { value: string }

    const result = await performFetch<SuggestResult>('/api/adventure/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'artPrompt',
        current,
        sheet: store.sheet,
        stepKey: 'art',
      }),
    })

    if (result.success && result.data?.value) {
      store.sheet.artPrompt = result.data.value
    } else {
      llmError.value =
        result.message ?? 'The AI returned something unusable. Try again.'
    }
  } catch {
    llmError.value = 'Connection failed. The portrait artist is unreachable.'
  } finally {
    llmLoading.value = false
  }
}

// ── Art creator callback ────────────────────────────────────────────────────

function handleArtUpdate(payload: {
  prompt?: string
  imagePath?: string | null
  artImageId?: number | null
}) {
  store.updateArt({
    artPrompt: payload.prompt,
    imagePath: payload.imagePath,
    artImageId: payload.artImageId,
  })
}

// ── Initialise with an assembled prompt if none exists ──────────────────────

onMounted(() => {
  if (!store.sheet.artPrompt.trim()) {
    assemblePrompt()
  }
})
</script>

<style scoped>
.portrait-reveal-enter-active {
  transition:
    opacity 400ms ease,
    transform 400ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.portrait-reveal-leave-active {
  transition: opacity 200ms ease;
}
.portrait-reveal-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
.portrait-reveal-leave-to {
  opacity: 0;
}
</style>
