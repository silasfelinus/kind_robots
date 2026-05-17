<!-- /components/builders/pitch-builder.vue -->
<template>
  <builder-shell
    builder-key="pitch"
    title="Pitch Builder"
    :sections="sections"
    :summary-items="summaryItems"
    initial-section="idea"
    summary-title="Pitch Summary"
    summary-subtitle="Review the big idea, generated ingredients, art direction, and save status."
    @section-change="activeSection = $event"
  >
    <template
      #default="{ activeSection: currentSection, setSection, goNext, goBack }"
    >
      <section v-if="currentSection === 'idea'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:idea" class="h-6 w-6 text-primary" />
            Start with the Big Picture
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            A pitch is the seed idea. Keep it loose, bold, and strange enough to make the next builder stages worth opening.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_18rem]">
            <div class="flex flex-col gap-3">
              <label class="form-control">
                <span class="label-text font-bold">Pitch Title</span>

                <input
                  v-model="title"
                  class="input input-bordered rounded-2xl text-base"
                  type="text"
                  placeholder="Example: The Yokai Steamhouse"
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Pitch</span>

                <textarea
                  v-model="pitch"
                  class="textarea textarea-bordered min-h-48 rounded-2xl text-base"
                  placeholder="Describe the big-picture idea..."
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Optional Prompt Notes</span>

                <textarea
                  v-model="promptNotes"
                  class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
                  placeholder="Tone, genre, must-have elements, forbidden tropes, or loose inspiration..."
                />
              </label>
            </div>

            <aside class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="flex items-center gap-2 font-bold text-base-content">
                <Icon name="kind-icon:sparkles" class="h-5 w-5 text-primary" />
                Pitch Mode
              </h4>

              <p class="mt-1 text-sm text-base-content/60">
                Write it yourself, or let the random goblin hand you suspiciously useful ingredients.
              </p>

              <div class="mt-4 flex flex-col gap-2">
                <button
                  class="btn rounded-xl"
                  :class="
                    pitchMode === 'manual'
                      ? 'btn-primary'
                      : 'btn-ghost border border-base-300'
                  "
                  type="button"
                  @click="pitchMode = 'manual'"
                >
                  <Icon name="kind-icon:edit" class="h-4 w-4" />
                  Manual
                </button>

                <button
                  class="btn rounded-xl"
                  :class="
                    pitchMode === 'creator'
                      ? 'btn-primary'
                      : 'btn-ghost border border-base-300'
                  "
                  type="button"
                  @click="pitchMode = 'creator'"
                >
                  <Icon name="kind-icon:dice" class="h-4 w-4" />
                  Pitch Creator
                </button>
              </div>

              <div class="mt-4 rounded-2xl border border-base-300 bg-base-200 p-3">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Current Shape
                </p>

                <p class="mt-2 line-clamp-4 text-sm text-base-content/70">
                  {{ pitchPreview }}
                </p>
              </div>
            </aside>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'creator'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:dice" class="h-6 w-6 text-primary" />
            Pitch Creator
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Use the random store to mash together genres, nouns, characters, objects, and problems until a pitch starts screaming in a productive way.
          </p>

          <pitch-creator
            class="mt-4"
            :prompt-notes="promptNotes"
            @apply="applyGeneratedPitch"
          />
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'art'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:palette" class="h-6 w-6 text-primary" />
            Pitch Art
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Give this idea a visual anchor. Upload a reference, pick existing art, or prepare a cover prompt for the art builder.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="flex items-center gap-2 font-bold text-base-content">
                <Icon name="kind-icon:save" class="h-5 w-5 text-primary" />
                Upload or Select
              </h4>

              <p class="mt-1 text-sm text-base-content/60">
                Use the existing image tools. This should point to ArtImage as the new standard path.
              </p>

              <div class="mt-3 flex flex-col gap-3">
                <image-upload />
                <art-gallery />
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="flex items-center gap-2 font-bold text-base-content">
                <Icon name="kind-icon:wand" class="h-5 w-5 text-primary" />
                Cover Prompt
              </h4>

              <p class="mt-1 text-sm text-base-content/60">
                This prompt can be sent into the art builder or saved with the pitch as visual direction.
              </p>

              <textarea
                v-model="artPrompt"
                class="textarea textarea-bordered mt-3 min-h-48 w-full rounded-2xl text-base"
                placeholder="A cinematic cover image for..."
              />

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  class="btn btn-secondary rounded-xl"
                  type="button"
                  @click="generateArtPrompt"
                >
                  <Icon name="kind-icon:sparkles" class="h-4 w-4" />
                  Make Art Prompt
                </button>

                <button
                  class="btn rounded-xl"
                  type="button"
                  @click="setSection('summary')"
                >
                  Skip to Summary
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Summary
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'summary'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-primary">
            <Icon name="kind-icon:blueprint" class="h-6 w-6" />
            Pitch Summary
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Review the pitch before saving it or sending it forward into collections, art, and dreams.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_22rem]">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <div class="flex flex-col gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Title
                </p>

                <h3 class="mt-1 text-2xl font-bold text-base-content">
                  {{ title || 'Untitled Pitch' }}
                </h3>
              </div>

              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Pitch
                </p>

                <p class="mt-1 whitespace-pre-wrap text-base text-base-content/80">
                  {{ pitch || 'No pitch text yet.' }}
                </p>
              </div>

              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Art Prompt
                </p>

                <p class="mt-1 whitespace-pre-wrap text-sm text-base-content/70">
                  {{ artPrompt || 'No art prompt yet.' }}
                </p>
              </div>
            </div>
          </div>

          <aside class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4">
            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('idea')"
            >
              <Icon name="kind-icon:edit" class="h-4 w-4" />
              Edit Pitch
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('creator')"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Rebuild Randoms
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('art')"
            >
              <Icon name="kind-icon:palette" class="h-4 w-4" />
              Edit Art
            </button>

            <button
              class="btn btn-primary rounded-xl"
              type="button"
              :disabled="isSaving || !canSave"
              @click="savePitch"
            >
              <Icon name="kind-icon:save" class="h-4 w-4" />
              {{ isSaving ? 'Saving...' : 'Save Pitch' }}
            </button>

            <p
              v-if="saveMessage"
              class="rounded-2xl border border-success/30 bg-success/10 p-3 text-sm text-success"
            >
              {{ saveMessage }}
            </p>

            <p
              v-if="saveError"
              class="rounded-2xl border border-error/30 bg-error/10 p-3 text-sm text-error"
            >
              {{ saveError }}
            </p>
          </aside>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="item in summaryItems"
            :key="item.key"
            class="rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.label"
                  class="h-full w-full object-cover"
                />

                <Icon
                  v-else
                  :name="item.icon || 'kind-icon:sparkles'"
                  class="h-7 w-7 text-primary"
                />
              </div>

              <div class="min-w-0">
                <p class="font-bold text-base-content">
                  {{ item.label }}
                </p>

                <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
                  {{ displaySummaryValue(item.value) }}
                </p>

                <p
                  v-if="item.description"
                  class="mt-1 line-clamp-2 text-xs text-base-content/50"
                >
                  {{ item.description }}
                </p>
              </div>
            </div>

            <button
              v-if="item.editSection"
              class="btn btn-sm mt-3 rounded-xl"
              type="button"
              @click="setSection(item.editSection)"
            >
              Reconfigure
            </button>
          </article>
        </div>
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown pitch builder section: {{ currentSection }}
      </div>
    </template>
  </builder-shell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Pitch } from '~/prisma/generated/prisma/client'
import type {
  BuilderChoiceSummary,
  BuilderSectionConfig,
} from '@/components/builders/builder-shell.vue'
import { useUserStore } from '@/stores/userStore'
import { handleError, performFetch } from '@/stores/utils'

type PitchBuilderSectionKey = 'idea' | 'creator' | 'art' | 'summary'
type PitchMode = 'manual' | 'creator'

type GeneratedPitchPayload = {
  title: string
  pitch: string
  artPrompt: string
  ingredients: string[]
}

type PerformFetchResult<T> = {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
}

const userStore = useUserStore()

const activeSection = ref<string>('idea')
const pitchMode = ref<PitchMode>('manual')
const title = ref('')
const pitch = ref('')
const promptNotes = ref('')
const artPrompt = ref('')
const ingredients = ref<string[]>([])
const selectedPitchId = ref<number | null>(null)
const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const sections: BuilderSectionConfig[] = [
  {
    key: 'idea',
    label: 'Idea',
    icon: 'kind-icon:idea',
    title: 'Big Picture Idea',
    summary:
      'Write the pitch directly or give the creator enough direction to generate one.',
  },
  {
    key: 'creator',
    label: 'Creator',
    icon: 'kind-icon:dice',
    title: 'Pitch Creator',
    summary:
      'Use random words, custom lists, and prompt notes to assemble a new pitch.',
  },
  {
    key: 'art',
    label: 'Art',
    icon: 'kind-icon:palette',
    title: 'Pitch Art',
    summary:
      'Upload, select, or prepare an art prompt for the pitch cover and visual direction.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Pitch Summary',
    summary:
      'Review the pitch, visual direction, and generated ingredients before saving.',
  },
]

const canSave = computed(() => {
  return title.value.trim().length > 0 && pitch.value.trim().length > 0
})

const pitchPreview = computed(() => {
  if (pitch.value.trim()) return pitch.value.trim()
  if (promptNotes.value.trim()) return promptNotes.value.trim()

  return 'No pitch yet. The idea goblin is pacing.'
})

const summaryItems = computed<BuilderChoiceSummary[]>(() => [
  {
    key: 'title',
    label: 'Pitch Title',
    value: title.value,
    icon: 'kind-icon:idea',
    description: 'The public-facing name of this big-picture idea.',
    editSection: 'idea',
  },
  {
    key: 'pitch',
    label: 'Pitch',
    value: pitch.value,
    icon: 'kind-icon:prompt',
    description: 'The core premise that can grow into dreams and scenarios.',
    editSection: 'idea',
  },
  {
    key: 'ingredients',
    label: 'Random Ingredients',
    value: ingredients.value.length ? ingredients.value.join(', ') : '',
    icon: 'kind-icon:dice',
    description: 'The random-store fuel used by the pitch creator.',
    editSection: 'creator',
  },
  {
    key: 'art',
    label: 'Art Direction',
    value: artPrompt.value,
    icon: 'kind-icon:palette',
    description: 'The cover or inspiration image prompt for this pitch.',
    editSection: 'art',
  },
  {
    key: 'save',
    label: 'Save Status',
    value: selectedPitchId.value ? `Saved as #${selectedPitchId.value}` : 'Not saved yet',
    icon: selectedPitchId.value ? 'kind-icon:check' : 'kind-icon:save',
    description: 'Saved pitches can become collections, dreams, characters, rewards, and scenarios.',
    editSection: 'summary',
  },
])

function applyGeneratedPitch(payload: GeneratedPitchPayload) {
  title.value = payload.title
  pitch.value = payload.pitch
  artPrompt.value = payload.artPrompt
  ingredients.value = payload.ingredients
  pitchMode.value = 'creator'
  saveMessage.value = ''
  saveError.value = ''
}

function generateArtPrompt() {
  const baseTitle = title.value.trim() || 'Untitled Pitch'
  const basePitch = pitch.value.trim() || promptNotes.value.trim()

  artPrompt.value = [
    `Create a cinematic cover image for "${baseTitle}".`,
    basePitch ? `Core premise: ${basePitch}` : '',
    ingredients.value.length
      ? `Visual ingredients: ${ingredients.value.join(', ')}.`
      : '',
    'Original composition, strong silhouette, expressive atmosphere, no text, no watermark.',
  ]
    .filter(Boolean)
    .join(' ')
}

async function savePitch() {
  if (!canSave.value) {
    saveError.value = 'Add a title and pitch before saving.'
    return
  }

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    const body: Record<string, unknown> = {
      title: title.value.trim(),
      pitch: pitch.value.trim(),
      artPrompt: artPrompt.value.trim() || null,
      userId: userStore.userId,
      isPublic: false,
      isMature: false,
    }

    const res = (await performFetch<Pitch>('/api/pitch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Pitch>

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save pitch.')
    }

    selectedPitchId.value = res.data.id
    saveMessage.value = `Saved pitch #${res.data.id}. Tiny universe seed acquired.`
  } catch (error) {
    handleError(error, 'saving pitch from pitch-builder')
    saveError.value =
      error instanceof Error ? error.message : 'Failed to save pitch.'
  } finally {
    isSaving.value = false
  }
}

function displaySummaryValue(value: BuilderChoiceSummary['value']) {
  if (value === null || value === undefined || value === '') {
    return 'Not selected yet'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return String(value)
}
</script>