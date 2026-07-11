<!-- /components/dreams/dream-maker.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <header class="shrink-0 border-b border-base-300 bg-base-100 p-4">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <Icon name="kind-icon:dream" class="h-7 w-7 text-primary" />
            <h1 class="text-2xl font-black text-primary">Dreammaker</h1>
            <span
              v-if="dreamStore.dreamForm.id"
              class="badge badge-outline rounded-xl"
            >
              Editing #{{ dreamStore.dreamForm.id }}
            </span>
            <span v-else class="badge badge-success rounded-xl">New Dream</span>
          </div>
          <p class="mt-1 max-w-3xl text-sm text-base-content/65">
            Create or edit the Dream seed: pitch, description, flavor, art
            prompt, and visibility.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            @click="randomizeSeed"
          >
            <Icon name="kind-icon:dice" class="h-4 w-4" />
            Random Seed
          </button>
          <button
            type="button"
            class="btn btn-outline btn-sm rounded-2xl"
            @click="clearForm"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            Clear
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-2xl text-white"
            :disabled="dreamStore.isSaving || !canSave"
            @click="saveDream"
          >
            <span
              v-if="dreamStore.isSaving"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:save" class="h-4 w-4" />
            {{ saveLabel }}
          </button>
        </div>
      </div>

      <div
        v-if="dreamStore.error || statusMessage"
        class="mt-3 rounded-2xl border p-3 text-sm"
        :class="
          dreamStore.error || statusTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ dreamStore.error || statusMessage }}
      </div>
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
      <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="grid gap-3">
          <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
              <label class="form-control">
                <span class="label py-1">
                  <span
                    class="label-text text-xs font-bold uppercase tracking-wide"
                    >Title</span
                  >
                </span>
                <input
                  v-model="dreamStore.dreamForm.title"
                  class="input input-bordered rounded-2xl bg-base-200 text-lg font-bold"
                  type="text"
                  placeholder="The Drowned Archive"
                />
              </label>

              <label class="form-control">
                <span class="label py-1">
                  <span
                    class="label-text text-xs font-bold uppercase tracking-wide"
                    >Type</span
                  >
                </span>
                <select
                  v-model="dreamStore.dreamForm.dreamType"
                  class="select select-bordered rounded-2xl bg-base-200"
                >
                  <option
                    v-for="type in dreamStore.dreamTypes"
                    :key="type"
                    :value="type"
                  >
                    {{ dreamTypeLabel(type) }}
                  </option>
                </select>
              </label>
            </div>

            <div class="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <label class="form-control">
                <span class="label py-1">
                  <span
                    class="label-text text-xs font-bold uppercase tracking-wide"
                    >Slug</span
                  >
                </span>
                <input
                  v-model="dreamStore.dreamForm.slug"
                  class="input input-bordered rounded-2xl bg-base-200"
                  type="text"
                  placeholder="the-drowned-archive"
                />
              </label>

              <button
                type="button"
                class="btn btn-outline mt-auto rounded-2xl"
                @click="suggestSlug"
              >
                <Icon name="kind-icon:wand" class="h-4 w-4" />
                Suggest Slug
              </button>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase tracking-wide"
                  >Dream Pitch</span
                >
              </span>
              <textarea
                v-model="dreamStore.dreamForm.pitch"
                class="textarea textarea-bordered min-h-28 rounded-2xl bg-base-200 text-base leading-relaxed"
                placeholder="A city where every door opens into a memory someone tried to forget."
              />
            </label>

            <label class="form-control mt-3">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase tracking-wide"
                  >Description</span
                >
              </span>
              <textarea
                v-model="dreamStore.dreamForm.description"
                class="textarea textarea-bordered min-h-36 rounded-2xl bg-base-200 leading-relaxed"
                placeholder="What is this place when nothing is happening? What is stable, strange, useful, dangerous, cozy, or haunted?"
              />
            </label>

            <label class="form-control mt-3">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase tracking-wide"
                  >Flavor Text</span
                >
              </span>
              <textarea
                v-model="dreamStore.dreamForm.flavorText"
                class="textarea textarea-bordered min-h-24 rounded-2xl bg-base-200 leading-relaxed"
                placeholder="A short atmospheric note, current mood, or intro text."
              />
            </label>
          </div>

          <FacetPicker
            v-model="facetIds"
            owner-type="dream"
            :owner-id="dreamStore.dreamForm.id ?? null"
            label="Dream Facets"
          />

          <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-black">Art Prompt</h2>
                <p class="text-sm text-base-content/60">
                  Used by Interact when generating art around this Dream.
                </p>
              </div>
              <button
                type="button"
                class="btn btn-secondary btn-sm rounded-2xl"
                @click="copyPitchToArtPrompt"
              >
                <Icon name="kind-icon:copy" class="h-4 w-4" />
                Use Pitch
              </button>
            </div>

            <textarea
              v-model="dreamStore.dreamForm.artPrompt"
              class="textarea textarea-bordered mt-3 min-h-32 w-full rounded-2xl bg-base-200 leading-relaxed"
              placeholder="Cinematic establishing shot of the Dream, clear composition, emotional lighting..."
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <div class="grid gap-3 md:grid-cols-3">
              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text font-bold">Icon</span></span
                >
                <input
                  v-model="dreamStore.dreamForm.icon"
                  class="input input-bordered rounded-2xl bg-base-200"
                  type="text"
                  placeholder="kind-icon:dream"
                />
              </label>

              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text font-bold">Art Image ID</span></span
                >
                <input
                  v-model.number="dreamStore.dreamForm.artImageId"
                  class="input input-bordered rounded-2xl bg-base-200"
                  type="number"
                  min="1"
                  placeholder="Optional"
                />
              </label>

              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text font-bold"
                    >Art Collection ID</span
                  ></span
                >
                <input
                  v-model.number="dreamStore.dreamForm.artCollectionId"
                  class="input input-bordered rounded-2xl bg-base-200"
                  type="number"
                  min="1"
                  placeholder="Optional"
                />
              </label>
            </div>

            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text font-bold">Designer</span></span
                >
                <input
                  v-model="dreamStore.dreamForm.designer"
                  class="input input-bordered rounded-2xl bg-base-200"
                  type="text"
                  placeholder="Kind Designer"
                />
              </label>
            </div>
          </div>
        </section>

        <aside class="grid h-fit gap-3 xl:sticky xl:top-3">
          <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 class="text-lg font-black">Visibility</h2>
            <div class="mt-3 grid gap-2">
              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <span class="label-text font-bold">Public</span>
                <input
                  v-model="dreamStore.dreamForm.isPublic"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <span class="label-text font-bold">Mature</span>
                <input
                  v-model="dreamStore.dreamForm.isMature"
                  type="checkbox"
                  class="toggle toggle-warning"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <span class="label-text font-bold">Active</span>
                <input
                  v-model="dreamStore.dreamForm.isActive"
                  type="checkbox"
                  class="toggle toggle-success"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <span class="label-text font-bold">Create art collection</span>
                <input
                  v-model="dreamStore.dreamForm.createCollection"
                  type="checkbox"
                  class="toggle toggle-secondary"
                />
              </label>
            </div>
          </section>

          <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 class="text-lg font-black">Preview</h2>
            <div
              class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex items-start gap-3">
                <Icon
                  :name="dreamStore.dreamForm.icon || 'kind-icon:dream'"
                  class="mt-1 h-6 w-6 text-primary"
                />
                <div class="min-w-0">
                  <p class="truncate text-xl font-black text-primary">
                    {{ dreamStore.dreamForm.title || 'Untitled Dream' }}
                  </p>
                  <p class="mt-1 text-xs text-base-content/50">
                    {{ dreamTypeLabel(dreamStore.dreamForm.dreamType) }} ·
                    {{ dreamStore.dreamForm.isPublic ? 'Public' : 'Private' }}
                  </p>
                </div>
              </div>
              <p class="mt-3 whitespace-pre-wrap text-sm text-base-content/70">
                {{
                  dreamStore.dreamForm.pitch ||
                  dreamStore.dreamForm.description ||
                  'No pitch yet.'
                }}
              </p>
            </div>
          </section>

          <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 class="text-lg font-black">Checks</h2>
            <div class="mt-3 grid gap-2 text-sm">
              <div
                v-for="check in checks"
                :key="check.label"
                class="flex items-center justify-between rounded-xl bg-base-200 px-3 py-2"
              >
                <span>{{ check.label }}</span>
                <span :class="check.class">{{ check.value }}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { useNavStore } from '@/stores/navStore'

const emit = defineEmits<{
  (event: 'saved', id: number): void
  (event: 'created', id: number): void
}>()

const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const navStore = useNavStore()
const facetIds = ref<number[]>([])

const canSave = computed(() => {
  return Boolean(
    dreamStore.dreamForm.title?.trim() &&
    (dreamStore.dreamForm.pitch?.trim() ||
      dreamStore.dreamForm.description?.trim()),
  )
})

const saveLabel = computed(() => {
  return dreamStore.dreamForm.id ? 'Update Dream' : 'Create Dream'
})

const statusMessage = computed(() => {
  if (!canSave.value)
    return 'Dreams need a title and either a pitch or description.'
  return ''
})

const statusTone = computed<'success' | 'error'>(() =>
  canSave.value ? 'success' : 'error',
)

const checks = computed(() => [
  {
    label: 'Title',
    value: dreamStore.dreamForm.title?.trim() ? 'Ready' : 'Missing',
    class: dreamStore.dreamForm.title?.trim()
      ? 'text-success font-bold'
      : 'text-warning font-bold',
  },
  {
    label: 'Pitch',
    value: dreamStore.dreamForm.pitch?.trim() ? 'Ready' : 'Missing',
    class: dreamStore.dreamForm.pitch?.trim()
      ? 'text-success font-bold'
      : 'text-warning font-bold',
  },
  {
    label: 'Art prompt',
    value: dreamStore.dreamForm.artPrompt?.trim() ? 'Ready' : 'Optional',
    class: dreamStore.dreamForm.artPrompt?.trim()
      ? 'text-success font-bold'
      : 'text-base-content/50',
  },
  {
    label: 'Collection',
    value: dreamStore.dreamForm.artCollectionId
      ? `#${dreamStore.dreamForm.artCollectionId}`
      : dreamStore.dreamForm.createCollection
        ? 'Create'
        : 'None',
    class: 'text-info font-bold',
  },
])

onMounted(async () => {
  await dreamStore.initialize()

  if (!dreamStore.dreamForm.title && !dreamStore.selectedDream) {
    dreamStore.startAddingDream()
  }
})

watch(
  () => dreamStore.selectedDream?.id,
  () => {
    const selectedDream = dreamStore.selectedDream
    const formId = dreamStore.dreamForm.id

    if (!selectedDream?.id) return
    if (formId === selectedDream.id) return

    dreamStore.setDreamForm(dreamStore.toDreamForm(selectedDream))
  },
)

watch(
  () => dreamStore.dreamForm.title,
  (title) => {
    if (!title || dreamStore.dreamForm.slug) return
    dreamStore.setDreamForm({ slug: createSlug(title) })
  },
)

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function suggestSlug() {
  const title =
    dreamStore.dreamForm.title || dreamStore.dreamForm.pitch || 'dream'
  dreamStore.setDreamForm({ slug: createSlug(title) })
}

function randomizeSeed() {
  const seed = dreamStore.randomDream()
  dreamStore.setDreamForm({
    pitch: seed,
    description: dreamStore.dreamForm.description || seed,
    flavorText: dreamStore.dreamForm.flavorText || seed,
    artPrompt: dreamStore.dreamForm.artPrompt || seed,
  })
}

function copyPitchToArtPrompt() {
  const prompt = [
    dreamStore.dreamForm.pitch,
    dreamStore.dreamForm.description,
    dreamStore.dreamForm.flavorText,
  ]
    .filter(Boolean)
    .join('\n\n')

  dreamStore.setDreamForm({ artPrompt: prompt })
}

function clearForm() {
  facetIds.value = []
  dreamStore.startAddingDream()
}

async function saveDream() {
  const wasCreating = !dreamStore.dreamForm.id
  const result = await dreamStore.saveDream()

  if (!result.success || !result.data?.id) return

  await facetStore.setDreamFacets(result.data.id, facetIds.value)
  emit('saved', result.data.id)
  if (wasCreating) emit('created', result.data.id)

  await dreamStore.selectDreamById(result.data.id)
  navStore.setDashboardTab?.('dream', 'interact')
}
</script>
