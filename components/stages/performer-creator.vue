<!-- components/stages/performer-creator.vue -->
<!--
  Modal for creating a custom temporary stage performer.
  Species and personality choices pulled directly from ADVENTURE_CARDS
  and displayed as illustrated thumbnail grids — same aesthetic as the
  adventure builder's preset selector.
  LLM suggest via /api/suggest with builder: 'stage'.
  Emits: assign(TemporaryParticipant) | close
-->
<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    @click.self="emit('close')"
  >
    <div
      class="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-base-300 bg-base-100 shadow-2xl sm:rounded-3xl"
      style="max-height: 92vh"
    >
      <!-- Header -->
      <div
        class="flex shrink-0 items-center justify-between border-b border-base-300 px-5 py-4"
      >
        <div>
          <h2 class="text-lg font-black text-base-content">
            Create a Performer
          </h2>
          <p class="mt-0.5 text-xs text-base-content/50">
            Build a custom cast member from scratch.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          @click="emit('close')"
        >
          <Icon name="mdi:close" class="h-4 w-4" />
        </button>
      </div>

      <!-- Tab nav -->
      <div class="flex shrink-0 border-b border-base-300 bg-base-200/50">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          type="button"
          class="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold transition-colors"
          :class="
            activeTab === tab.key
              ? 'border-b-2 border-primary bg-base-100 text-primary'
              : 'text-base-content/50 hover:text-base-content'
          "
          @click="activeTab = tab.key"
        >
          <Icon :name="tab.icon" class="h-3.5 w-3.5" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Body -->
      <div class="flex flex-1 flex-col overflow-y-auto">
        <!-- ── Basics ─────────────────────────────────────────────────── -->
        <div v-show="activeTab === 'basics'" class="flex flex-col gap-4 p-5">
          <!-- Name + species preview row -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Name *</label
              >
              <input
                v-model="form.name"
                type="text"
                class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
                placeholder="Captain Breadcrumbs, Lady Verdict..."
                maxlength="100"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
              >
                Voice / Notes
              </label>
              <input
                v-model="form.comments"
                type="text"
                class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
                placeholder="How they speak, what drives them..."
                maxlength="300"
              />
            </div>
          </div>

          <!-- Selection summary chips -->
          <div
            v-if="form.species || selectedTraits.length"
            class="flex flex-wrap gap-1.5"
          >
            <span
              v-if="form.species"
              class="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary"
            >
              {{ form.species }}
              <button
                type="button"
                @click="form.species = ''"
                class="hover:text-error"
              >
                <Icon name="mdi:close" class="h-3 w-3" />
              </button>
            </span>
            <span
              v-for="trait in selectedTraits"
              :key="trait"
              class="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-bold text-primary"
            >
              {{ traitLabel(trait) }}
              <button
                type="button"
                @click="removeTrait(trait)"
                class="hover:text-error"
              >
                <Icon name="mdi:close" class="h-3 w-3" />
              </button>
            </span>
            <button
              v-if="!form.species"
              type="button"
              class="rounded-full border border-dashed border-secondary/40 px-2.5 py-0.5 text-xs text-base-content/40 hover:border-secondary hover:text-secondary"
              @click="activeTab = 'species'"
            >
              + species
            </button>
            <button
              v-if="!selectedTraits.length"
              type="button"
              class="rounded-full border border-dashed border-primary/40 px-2.5 py-0.5 text-xs text-base-content/40 hover:border-primary hover:text-primary"
              @click="activeTab = 'personality'"
            >
              + personality
            </button>
          </div>

          <!-- Stage prompt -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Stage Prompt</label
              >
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-xl gap-1 border border-base-300"
                :disabled="!form.name.trim() || llmLoading"
                @click="generatePrompt"
              >
                <span
                  v-if="llmLoading"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="mdi:sparkles" class="h-3.5 w-3.5" />
                {{ form.prompt ? 'Regenerate' : 'Generate' }}
              </button>
            </div>
            <textarea
              v-model="form.prompt"
              class="textarea textarea-bordered resize-none rounded-2xl bg-base-100 text-sm focus:border-primary"
              rows="4"
              placeholder="Perform as [Name]. [Voice, mannerisms, perspective, what they care about]..."
              maxlength="500"
            />
            <p v-if="llmError" class="text-xs text-error">{{ llmError }}</p>
          </div>

          <!-- Art / avatar -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Avatar Image</label
              >
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-xl gap-1 border border-base-300"
                :disabled="!form.name.trim()"
                @click="buildArtPrompt"
              >
                <Icon name="mdi:auto-fix" class="h-3.5 w-3.5" /> Build art
                prompt
              </button>
            </div>
            <div class="flex gap-3">
              <div
                class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-base-300 bg-base-200"
              >
                <img
                  v-if="form.imagePath"
                  :src="String(form.imagePath)"
                  alt="Avatar"
                  class="h-full w-full object-cover"
                />
                <Icon
                  v-else
                  name="mdi:account"
                  class="h-8 w-8 text-base-content/20"
                />
              </div>
              <div class="flex flex-1 flex-col gap-2 min-w-0">
                <textarea
                  v-model="artPrompt"
                  class="textarea textarea-bordered textarea-sm resize-none rounded-xl bg-base-100 text-xs focus:border-primary"
                  rows="2"
                  placeholder="Art prompt for image generation..."
                />
                <input
                  v-model="form.imagePath"
                  type="text"
                  class="input input-bordered input-xs rounded-xl bg-base-100 focus:border-primary"
                  placeholder="Or paste image URL directly..."
                />
              </div>
            </div>
            <p class="text-xs text-base-content/30">
              Use the art prompt with your art server, then paste the image URL
              above.
            </p>
          </div>
        </div>

        <!-- ── Species ────────────────────────────────────────────────── -->
        <div v-show="activeTab === 'species'" class="flex flex-col gap-3 p-5">
          <p class="text-sm text-base-content/60">
            What is this entity? Choose from illustrated options or type your
            own.
          </p>

          <!-- Selected -->
          <div
            v-if="form.species"
            class="flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/8 px-3 py-2"
          >
            <span class="text-sm font-black text-secondary">{{
              form.species
            }}</span>
            <button
              type="button"
              class="ml-auto text-secondary/50 hover:text-error"
              @click="form.species = ''"
            >
              <Icon name="mdi:close" class="h-3.5 w-3.5" />
            </button>
          </div>

          <!-- Search -->
          <input
            v-model="speciesSearch"
            type="text"
            class="input input-bordered input-sm rounded-xl bg-base-100 focus:border-primary"
            placeholder="Filter species..."
          />

          <!-- Illustrated grid (same pattern as adventure-preset) -->
          <div
            class="grid gap-2"
            style="
              grid-template-columns: repeat(
                auto-fill,
                minmax(min(96px, 100%), 1fr)
              );
            "
          >
            <button
              v-for="choice in filteredSpecies"
              :key="choice.value || choice.label"
              type="button"
              class="group flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-150"
              :class="
                choice.opensCustom
                  ? 'border-dashed border-base-300 hover:border-primary/40'
                  : form.species === choice.value && choice.value
                    ? 'border-primary shadow-md shadow-primary/20'
                    : 'border-base-300 hover:border-primary/40'
              "
              @click="onSpeciesPick(choice)"
            >
              <!-- Thumbnail -->
              <div class="relative h-16 w-full overflow-hidden bg-base-200">
                <img
                  v-if="choice.image"
                  :src="choice.image"
                  :alt="choice.label"
                  class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <Icon
                    name="mdi:pencil"
                    class="h-5 w-5 text-base-content/20"
                  />
                </div>
                <!-- Selected overlay -->
                <div
                  v-if="form.species === choice.value && choice.value"
                  class="absolute inset-0 flex items-center justify-center bg-primary/40"
                >
                  <Icon name="mdi:check-circle" class="h-6 w-6 text-white" />
                </div>
              </div>
              <!-- Label -->
              <div class="px-1.5 py-1 text-center">
                <p
                  class="truncate text-[10px] font-bold leading-tight text-base-content"
                >
                  {{ choice.label }}
                </p>
              </div>
            </button>
          </div>

          <!-- Custom input shown when opensCustom picked or value not in list -->
          <div v-if="speciesCustomMode" class="flex gap-2">
            <input
              v-model="form.species"
              type="text"
              class="input input-bordered input-sm flex-1 rounded-xl bg-base-100 focus:border-primary"
              placeholder="Enter species name..."
              maxlength="100"
              autofocus
            />
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl"
              @click="speciesCustomMode = false"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- ── Personality ─────────────────────────────────────────────── -->
        <div
          v-show="activeTab === 'personality'"
          class="flex flex-col gap-3 p-5"
        >
          <p class="text-sm text-base-content/60">
            How do they move through the world? Pick as many as apply. The
            combination is the character.
          </p>

          <!-- Selected chips -->
          <div v-if="selectedTraits.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="trait in selectedTraits"
              :key="trait"
              class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary"
            >
              {{ traitLabel(trait) }}
              <button
                type="button"
                class="hover:text-error"
                @click="removeTrait(trait)"
              >
                <Icon name="mdi:close" class="h-3 w-3" />
              </button>
            </span>
            <span
              class="rounded-full bg-base-200 px-2.5 py-0.5 text-xs text-base-content/40"
            >
              {{ selectedTraits.length }} selected
            </span>
          </div>

          <!-- Search -->
          <input
            v-model="traitSearch"
            type="text"
            class="input input-bordered input-sm rounded-xl bg-base-100 focus:border-primary"
            placeholder="Filter traits..."
          />

          <!-- Illustrated grid — same as adventure personality step -->
          <div
            class="grid gap-2"
            style="
              grid-template-columns: repeat(
                auto-fill,
                minmax(min(96px, 100%), 1fr)
              );
            "
          >
            <button
              v-for="choice in filteredPersonality"
              :key="choice.value || choice.label"
              type="button"
              class="group flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-150"
              :class="
                choice.opensCustom
                  ? 'border-dashed border-base-300 hover:border-primary/40'
                  : isTraitSelected(choice.value)
                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/20'
                    : 'border-base-300 hover:border-primary/40'
              "
              @click="onTraitPick(choice)"
            >
              <!-- Thumbnail -->
              <div class="relative h-14 w-full overflow-hidden bg-base-200">
                <img
                  v-if="choice.image"
                  :src="choice.image"
                  :alt="choice.label"
                  class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <Icon
                    name="mdi:pencil"
                    class="h-4 w-4 text-base-content/20"
                  />
                </div>
                <!-- Selected check badge -->
                <div
                  v-if="isTraitSelected(choice.value)"
                  class="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow"
                >
                  <Icon
                    name="mdi:check"
                    class="h-2.5 w-2.5 text-primary-content"
                  />
                </div>
              </div>
              <!-- Label -->
              <div class="px-1 py-1 text-center">
                <p
                  class="truncate text-[10px] font-bold leading-tight text-base-content"
                >
                  {{ choice.label }}
                </p>
              </div>
            </button>
          </div>

          <!-- Custom trait input -->
          <div v-if="traitCustomMode" class="flex gap-2">
            <input
              v-model="customTraitInput"
              type="text"
              class="input input-bordered input-sm flex-1 rounded-xl bg-base-100 focus:border-primary"
              placeholder="Describe a personality trait..."
              maxlength="100"
              @keydown.enter="addCustomTrait"
            />
            <button
              type="button"
              class="btn btn-primary btn-xs rounded-xl"
              @click="addCustomTrait"
            >
              Add
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl"
              @click="traitCustomMode = false"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex shrink-0 items-center justify-between border-t border-base-300 px-5 py-4"
      >
        <div class="text-xs text-base-content/40 flex flex-wrap gap-1.5">
          <span v-if="form.species" class="font-semibold text-secondary">{{
            form.species
          }}</span>
          <span v-if="selectedTraits.length" class="text-primary"
            >· {{ selectedTraits.length }} trait{{
              selectedTraits.length === 1 ? '' : 's'
            }}</span
          >
          <span v-if="!form.species && !selectedTraits.length"
            >Nothing selected yet</span
          >
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-xl gap-1.5"
            :disabled="!form.name.trim()"
            @click="handleAssign"
          >
            <Icon name="mdi:account-plus" class="h-4 w-4" />
            Add to Cast
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useServerStore } from '@/stores/serverStore'
import {
  ADVENTURE_CARDS,
  type PresetChoice,
} from '@/stores/helpers/adventureCards'
import type { TemporaryParticipant } from '@/stores/helpers/stageHelper'

// ── Props / Emits ──────────────────────────────────────────────────────────

const props = defineProps<{
  roleKey?: string
  stageLabel?: string
  genre?: string
}>()

const emit = defineEmits<{
  assign: [performer: TemporaryParticipant]
  close: []
}>()

// ── Tabs ───────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'basics', label: 'Basics', icon: 'mdi:account-edit' },
  { key: 'species', label: 'Species', icon: 'mdi:paw' },
  { key: 'personality', label: 'Personality', icon: 'mdi:heart-outline' },
] as const
type TabKey = (typeof TABS)[number]['key']
const activeTab = ref<TabKey>('basics')

// ── Pull choices straight from ADVENTURE_CARDS ────────────────────────────

// Species — origin card → species step
const SPECIES_CHOICES: PresetChoice[] =
  ADVENTURE_CARDS.find((c) => c.key === 'origin')?.steps.find(
    (s) => s.key === 'species',
  )?.choices ?? []

// Personality — personality card → personality step (multiSelect: true)
const PERSONALITY_CHOICES: PresetChoice[] =
  ADVENTURE_CARDS.find((c) => c.key === 'personality')?.steps.find(
    (s) => s.key === 'personality',
  )?.choices ?? []

// ── Form state ─────────────────────────────────────────────────────────────

const form = reactive<{
  name: string
  species: string
  comments: string
  prompt: string
  imagePath: string | null
}>({ name: '', species: '', comments: '', prompt: '', imagePath: null })

const artPrompt = ref('')
const selectedTraits = ref<string[]>([])
const traitSearch = ref('')
const speciesSearch = ref('')
const speciesCustomMode = ref(false)
const traitCustomMode = ref(false)
const customTraitInput = ref('')
const llmLoading = ref(false)
const llmError = ref<string | null>(null)

// ── Filtered lists ─────────────────────────────────────────────────────────

const filteredSpecies = computed<PresetChoice[]>(() => {
  const q = speciesSearch.value.toLowerCase().trim()
  if (!q) return SPECIES_CHOICES
  return SPECIES_CHOICES.filter(
    (c) =>
      c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q),
  )
})

const filteredPersonality = computed<PresetChoice[]>(() => {
  const q = traitSearch.value.toLowerCase().trim()
  if (!q) return PERSONALITY_CHOICES
  return PERSONALITY_CHOICES.filter(
    (c) =>
      c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q),
  )
})

// ── Species helpers ────────────────────────────────────────────────────────

function onSpeciesPick(choice: PresetChoice): void {
  if (choice.opensCustom) {
    speciesCustomMode.value = true
    form.species = ''
    return
  }
  form.species = choice.value
  speciesCustomMode.value = false
}

// ── Trait helpers ─────────────────────────────────────────────────────────

function isTraitSelected(v: string): boolean {
  return Boolean(v) && selectedTraits.value.includes(v)
}

function onTraitPick(choice: PresetChoice): void {
  if (choice.opensCustom) {
    traitCustomMode.value = true
    return
  }
  if (!choice.value) return
  const idx = selectedTraits.value.indexOf(choice.value)
  if (idx >= 0) selectedTraits.value.splice(idx, 1)
  else selectedTraits.value.push(choice.value)
}

function removeTrait(v: string): void {
  selectedTraits.value = selectedTraits.value.filter((t) => t !== v)
}

function addCustomTrait(): void {
  const val = customTraitInput.value.trim()
  if (val && !selectedTraits.value.includes(val)) {
    selectedTraits.value.push(val)
  }
  customTraitInput.value = ''
  traitCustomMode.value = false
}

function traitLabel(v: string): string {
  return PERSONALITY_CHOICES.find((c) => c.value === v)?.label ?? v
}

// ── Server snapshot ────────────────────────────────────────────────────────

function serverSnapshot() {
  const serverStore = useServerStore()
  const activeServer = serverStore.activeTextServer
  return activeServer
    ? {
        serverType: activeServer.serverType ?? null,
        baseUrl: activeServer.baseUrl ?? null,
        endpointPath: activeServer.endpointPath ?? null,
        model: activeServer.model ?? null,
      }
    : undefined
}

// ── LLM: generate stage prompt ────────────────────────────────────────────

async function generatePrompt(): Promise<void> {
  if (!form.name.trim()) return
  llmLoading.value = true
  llmError.value = null
  try {
    type SuggestResult = { value: string }
    const result = await performFetch<SuggestResult>('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        builder: 'stage',
        server: serverSnapshot(),
        field: 'performerPrompt',
        stepKey: 'performerPrompt',
        current: form.prompt,
        context: {
          name: form.name,
          species: form.species,
          personality: selectedTraits.value
            .map((v) => traitLabel(v))
            .join(', '),
          comments: form.comments,
          roleKey: props.roleKey,
          stageLabel: props.stageLabel,
          genre: props.genre,
        },
      }),
    })
    if (result.success && result.data?.value) {
      form.prompt = result.data.value
    } else {
      llmError.value = result.message ?? 'Nothing useful returned.'
    }
  } catch (error) {
    llmError.value = error instanceof Error ? error.message : 'Request failed.'
  } finally {
    llmLoading.value = false
  }
}

// ── Build art prompt ───────────────────────────────────────────────────────

function buildArtPrompt(): void {
  const parts: string[] = []
  if (form.name) parts.push(form.name)
  if (form.species) parts.push(form.species)
  const labels = selectedTraits.value.slice(0, 3).map((v) => traitLabel(v))
  if (labels.length) parts.push(labels.join(', '))
  if (props.stageLabel) parts.push(`performing in ${props.stageLabel}`)
  if (props.genre) parts.push(props.genre)
  parts.push('character portrait, stage performer, stylized illustration')
  artPrompt.value = parts.filter(Boolean).join(', ')
}

// ── Assign ────────────────────────────────────────────────────────────────

function handleAssign(): void {
  if (!form.name.trim()) return
  emit('assign', {
    name: form.name.trim(),
    species: form.species.trim() || undefined,
    personality: selectedTraits.value.length
      ? selectedTraits.value.map((v) => traitLabel(v)).join(', ')
      : undefined,
    comments: form.comments.trim() || undefined,
    prompt: form.prompt.trim() || undefined,
    imagePath: form.imagePath || null,
    artImageId: null,
  })
}
</script>
