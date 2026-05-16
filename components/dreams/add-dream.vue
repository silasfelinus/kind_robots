<!-- /components/dreams/add-dream.vue -->
<template>
  <section class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12">
    <form
      class="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow xl:col-span-8"
      @submit.prevent="saveDream"
    >
      <div class="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div
          class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
        >
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-primary rounded-2xl">
                Dream Location
              </span>

              <span
                v-if="dreamStore.dreamForm.id"
                class="badge badge-secondary rounded-2xl"
              >
                Editing #{{ dreamStore.dreamForm.id }}
              </span>

              <span
                v-if="dreamStore.dreamForm.isActive === false"
                class="badge badge-warning rounded-2xl"
              >
                Archived
              </span>
            </div>

            <h2 class="text-2xl font-black text-base-content sm:text-3xl">
              {{ formTitle }}
            </h2>

            <p class="max-w-3xl text-sm leading-relaxed text-base-content/70">
              Build the place layer here. Scenario brings the plot, Character
              brings the cast, Reward brings the item, and Dream is the gorgeous
              little stage where the weirdness signs the lease.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-2xl"
              type="button"
              @click="startLanternDream"
            >
              <Icon name="kind-icon:lamp" class="h-5 w-5" />
              Lantern Seed
            </button>

            <button
              class="btn btn-accent rounded-2xl"
              type="button"
              @click="randomizeVibe"
            >
              <Icon name="kind-icon:sparkles" class="h-5 w-5" />
              Random Vibe
            </button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div
            v-for="stat in qualityStats"
            :key="stat.label"
            class="rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <div class="flex items-center gap-2">
              <Icon :name="stat.icon" class="h-5 w-5 text-primary" />
              <span
                class="text-xs font-bold uppercase tracking-wide text-base-content/60"
              >
                {{ stat.label }}
              </span>
            </div>

            <div class="mt-2 text-lg font-black" :class="stat.class">
              {{ stat.value }}
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="form-control">
          <span class="label-text font-bold">Location name</span>
          <input
            v-model="dreamStore.dreamForm.title"
            class="input input-bordered rounded-2xl"
            type="text"
            placeholder="The Lantern Greenhouse"
            @blur="suggestSlug"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Slug</span>
          <div class="join w-full">
            <input
              v-model="dreamStore.dreamForm.slug"
              class="input input-bordered join-item w-full rounded-l-2xl"
              type="text"
              placeholder="the-lantern-greenhouse"
            />
            <button
              class="btn join-item rounded-r-2xl"
              type="button"
              @click="suggestSlug"
            >
              <Icon name="kind-icon:wrench" class="h-5 w-5" />
            </button>
          </div>
        </label>
      </div>

      <label class="form-control">
        <span class="label-text font-bold">Description</span>
        <textarea
          v-model="dreamStore.dreamForm.description"
          class="textarea textarea-bordered min-h-32 rounded-2xl"
          placeholder="What is this place? What does the player see first? What does the room want?"
        />
        <span class="label-text-alt text-base-content/50">
          {{ descriptionLength }} characters
        </span>
      </label>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <label class="form-control">
          <span class="label-text font-bold">Current vibe</span>
          <textarea
            v-model="dreamStore.dreamForm.currentVibe"
            class="textarea textarea-bordered min-h-36 rounded-2xl"
            placeholder="How does the location feel right now?"
          />
          <span class="label-text-alt text-base-content/50">
            Mood, sensory details, danger level, tone, energy.
          </span>
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Art and story prompt</span>
          <textarea
            v-model="dreamStore.dreamForm.currentPrompt"
            class="textarea textarea-bordered min-h-36 rounded-2xl"
            placeholder="Prompt for image generation or narrative setup"
          />
          <span class="label-text-alt text-base-content/50">
            This can feed image generation, story setup, or the first room beat.
          </span>
        </label>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <div
          class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h3 class="text-lg font-black text-primary">Location State</h3>
            <p class="text-sm text-base-content/60">
              Visibility, safety, and collection behavior. The boring levers,
              sadly load-bearing.
            </p>
          </div>

          <button
            class="btn btn-ghost rounded-2xl"
            type="button"
            @click="showAdvanced = !showAdvanced"
          >
            <Icon
              :name="
                showAdvanced ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
              "
              class="h-5 w-5"
            />
            {{ showAdvanced ? 'Hide IDs' : 'Show IDs' }}
          </button>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label
            class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <input
              v-model="dreamStore.dreamForm.isPublic"
              class="toggle toggle-primary"
              type="checkbox"
            />
            <span>
              <span class="block font-bold">Public</span>
              <span class="block text-xs text-base-content/60">
                Visible in the atlas
              </span>
            </span>
          </label>

          <label
            class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <input
              v-model="dreamStore.dreamForm.isMature"
              class="toggle toggle-warning"
              type="checkbox"
            />
            <span>
              <span class="block font-bold">Mature</span>
              <span class="block text-xs text-base-content/60">
                Respect filters
              </span>
            </span>
          </label>

          <label
            class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <input
              v-model="dreamStore.dreamForm.isActive"
              class="toggle toggle-success"
              type="checkbox"
            />
            <span>
              <span class="block font-bold">Active</span>
              <span class="block text-xs text-base-content/60">
                Available to use
              </span>
            </span>
          </label>

          <label
            class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <input
              v-model="dreamStore.dreamForm.createCollection"
              class="toggle toggle-secondary"
              type="checkbox"
            />
            <span>
              <span class="block font-bold">Collection</span>
              <span class="block text-xs text-base-content/60">
                Create art set
              </span>
            </span>
          </label>
        </div>
      </div>

      <Transition name="fade">
        <div
          v-if="showAdvanced"
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <div class="mb-4">
            <h3 class="text-lg font-black text-primary">Advanced Links</h3>
            <p class="text-sm text-base-content/60">
              Temporary numeric links until the pickers take over. Useful,
              slightly goblin-coded.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label class="form-control">
              <span class="label-text font-bold">Scenario ID</span>
              <input
                v-model.number="dreamStore.dreamForm.scenarioId"
                class="input input-bordered rounded-2xl"
                type="number"
                min="1"
                placeholder="Optional"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Art ID</span>
              <input
                v-model.number="dreamStore.dreamForm.artId"
                class="input input-bordered rounded-2xl"
                type="number"
                min="1"
                placeholder="Optional"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">ArtImage ID</span>
              <input
                v-model.number="dreamStore.dreamForm.artImageId"
                class="input input-bordered rounded-2xl"
                type="number"
                min="1"
                placeholder="Optional"
              />
            </label>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <label class="form-control">
              <span class="label-text font-bold">ArtCollection ID</span>
              <input
                v-model.number="dreamStore.dreamForm.artCollectionId"
                class="input input-bordered rounded-2xl"
                type="number"
                min="1"
                placeholder="Optional"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Text server ID</span>
              <input
                v-model.number="dreamStore.dreamForm.textServerId"
                class="input input-bordered rounded-2xl"
                type="number"
                min="1"
                placeholder="Optional"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Art server ID</span>
              <input
                v-model.number="dreamStore.dreamForm.artServerId"
                class="input input-bordered rounded-2xl"
                type="number"
                min="1"
                placeholder="Optional"
              />
            </label>
          </div>
        </div>
      </Transition>

      <div
        v-if="dreamStore.error"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ dreamStore.error }}
      </div>

      <div
        class="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100/95 p-3 shadow backdrop-blur"
      >
        <div class="text-sm text-base-content/60">
          <span v-if="canSave">
            Ready to save. The dreamhouse has permits. Probably.
          </span>
          <span v-else> Add a name and vibe before saving. </span>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-primary rounded-2xl"
            type="submit"
            :disabled="dreamStore.isSaving || !canSave"
          >
            <Icon name="kind-icon:save" class="h-5 w-5" />
            {{ dreamStore.isSaving ? 'Saving...' : saveLabel }}
          </button>

          <button
            class="btn btn-ghost rounded-2xl"
            type="button"
            @click="clearForm"
          >
            <Icon name="kind-icon:x" class="h-5 w-5" />
            Clear
          </button>
        </div>
      </div>
    </form>

    <aside class="space-y-4 xl:col-span-4">
      <div
        class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow"
      >
        <div
          class="flex min-h-40 items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 p-5"
        >
          <div class="text-center">
            <Icon
              name="kind-icon:greenhouse"
              class="mx-auto h-16 w-16 text-primary"
            />
            <p
              class="mt-3 text-xs font-bold uppercase tracking-wide text-base-content/50"
            >
              Location Preview
            </p>
          </div>
        </div>

        <div class="p-4">
          <h3 class="text-xl font-black text-secondary">
            {{ dreamStore.dreamForm.title || 'Untitled Dream' }}
          </h3>

          <p
            class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-base-content/70"
          >
            {{ previewText }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              class="badge rounded-2xl"
              :class="
                dreamStore.dreamForm.isPublic ? 'badge-primary' : 'badge-ghost'
              "
            >
              {{ dreamStore.dreamForm.isPublic ? 'Public' : 'Private' }}
            </span>

            <span
              class="badge rounded-2xl"
              :class="
                dreamStore.dreamForm.isMature
                  ? 'badge-warning'
                  : 'badge-success'
              "
            >
              {{ dreamStore.dreamForm.isMature ? 'Mature' : 'Safe' }}
            </span>

            <span
              class="badge rounded-2xl"
              :class="
                dreamStore.dreamForm.isActive
                  ? 'badge-secondary'
                  : 'badge-warning'
              "
            >
              {{ dreamStore.dreamForm.isActive ? 'Active' : 'Archived' }}
            </span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow">
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          Linked Context
        </p>

        <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div
            v-for="context in linkedContext"
            :key="context.label"
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div
              class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-base-content/50"
            >
              <Icon :name="context.icon" class="h-4 w-4" />
              {{ context.label }}
            </div>

            <div class="mt-1 font-black text-base-content">
              {{ context.value }}
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow">
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          Prompt Preview
        </p>

        <p
          class="mt-3 whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-sm leading-relaxed text-base-content/70"
        >
          {{ dreamStore.dreamForm.currentPrompt || 'No art/story prompt yet.' }}
        </p>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
  }>(),
  {
    mode: 'edit',
  },
)

const emit = defineEmits<{
  saved: [id: number]
}>()

const dreamStore = useDreamStore()
const showAdvanced = ref(false)

const formTitle = computed(() => {
  if (dreamStore.dreamForm.id) return 'Edit Dream Location'
  if (props.mode === 'create') return 'Create Dream Location'
  return 'Location Setup'
})

const saveLabel = computed(() => {
  return dreamStore.dreamForm.id ? 'Update Dream' : 'Create Dream'
})

const canSave = computed(() => {
  return Boolean(
    dreamStore.dreamForm.title?.trim() &&
    dreamStore.dreamForm.currentVibe?.trim(),
  )
})

const descriptionLength = computed(() => {
  return dreamStore.dreamForm.description?.length ?? 0
})

const previewText = computed(() => {
  return (
    dreamStore.dreamForm.description ||
    dreamStore.dreamForm.currentVibe ||
    'No location text yet. The room is currently just drywall and intentions.'
  )
})

const qualityStats = computed(() => [
  {
    label: 'Identity',
    value: dreamStore.dreamForm.title?.trim() ? 'Named' : 'Missing',
    icon: 'kind-icon:tag',
    class: dreamStore.dreamForm.title?.trim() ? 'text-success' : 'text-warning',
  },
  {
    label: 'Vibe',
    value: dreamStore.dreamForm.currentVibe?.trim() ? 'Loaded' : 'Missing',
    icon: 'kind-icon:sparkles',
    class: dreamStore.dreamForm.currentVibe?.trim()
      ? 'text-success'
      : 'text-warning',
  },
  {
    label: 'Prompt',
    value: dreamStore.dreamForm.currentPrompt?.trim() ? 'Ready' : 'Optional',
    icon: 'kind-icon:image',
    class: dreamStore.dreamForm.currentPrompt?.trim()
      ? 'text-success'
      : 'text-base-content/60',
  },
  {
    label: 'Collection',
    value: dreamStore.dreamForm.createCollection
      ? 'New'
      : dreamStore.dreamForm.artCollectionId
        ? `#${dreamStore.dreamForm.artCollectionId}`
        : 'None',
    icon: 'kind-icon:gallery',
    class:
      dreamStore.dreamForm.createCollection ||
      dreamStore.dreamForm.artCollectionId
        ? 'text-success'
        : 'text-base-content/60',
  },
])

const linkedContext = computed(() => [
  {
    label: 'Scenario',
    value: dreamStore.dreamForm.scenarioId
      ? `#${dreamStore.dreamForm.scenarioId}`
      : 'none',
    icon: 'kind-icon:map',
  },
  {
    label: 'Art',
    value: dreamStore.dreamForm.artId
      ? `#${dreamStore.dreamForm.artId}`
      : 'none',
    icon: 'kind-icon:paintbrush',
  },
  {
    label: 'Image',
    value: dreamStore.dreamForm.artImageId
      ? `#${dreamStore.dreamForm.artImageId}`
      : 'none',
    icon: 'kind-icon:image',
  },
  {
    label: 'Collection',
    value: dreamStore.dreamForm.artCollectionId
      ? `#${dreamStore.dreamForm.artCollectionId}`
      : dreamStore.dreamForm.createCollection
        ? 'new'
        : 'none',
    icon: 'kind-icon:gallery',
  },
])

onMounted(async () => {
  await dreamStore.initialize()

  if (props.mode === 'create') {
    if (dreamStore.dreamForm.id) {
      dreamStore.startAddingDream()
    }

    if (!dreamStore.dreamForm.title && !dreamStore.dreamForm.currentVibe) {
      dreamStore.startAddingDream()
    }

    return
  }

  const selectedDream = dreamStore.selectedDream
  const selectedId = selectedDream?.id
  const formId = dreamStore.dreamForm.id

  if (selectedDream && selectedId && formId !== selectedId) {
    dreamStore.setDreamForm(dreamStore.toDreamForm(selectedDream))
    return
  }

  if (!dreamStore.dreamForm.title && !selectedDream) {
    dreamStore.startAddingDream()
  }
})
watch(
  () => dreamStore.dreamForm.title,
  (title) => {
    if (!title || dreamStore.dreamForm.slug) return

    dreamStore.setDreamForm({
      slug: createSlug(title),
    })
  },
)

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function suggestSlug() {
  const title = dreamStore.dreamForm.title

  if (!title) return

  dreamStore.setDreamForm({
    slug: createSlug(title),
  })
}

function startLanternDream() {
  dreamStore.startAddingDream({
    title: 'The Lantern Greenhouse',
    slug: 'the-lantern-greenhouse',
    description:
      'A warm glasshouse floating somewhere between a dream, a garden, and a tiny impossible marketplace. Brass robots tend glowing plants, paper lanterns drift through the rafters, and every doorway seems to lead to a different story.',
    currentVibe:
      'Cozy, luminous, gently surreal. The air smells like rain on warm stone, jasmine tea, and old machine oil. The place feels safe, but not ordinary. Something magical is definitely doing paperwork in the back room.',
    currentPrompt:
      'A cozy floating lantern greenhouse filled with glowing plants, brass helper robots, warm paper lanterns, whimsical market stalls, dreamy cinematic lighting, soft surreal fantasy atmosphere',
    createCollection: true,
    isPublic: true,
    isMature: false,
    isActive: true,
  })
}

function randomizeVibe() {
  const currentVibe = dreamStore.randomDream()

  dreamStore.setDreamForm({
    currentVibe,
    currentPrompt: dreamStore.dreamForm.currentPrompt || currentVibe,
  })
}

function clearForm() {
  dreamStore.deselectDream()
  dreamStore.startAddingDream()
}

async function saveDream() {
  const result = await dreamStore.saveDream()

  if (result.success && result.data?.id) {
    emit('saved', result.data.id)
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
