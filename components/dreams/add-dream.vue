<!-- /components/dreams/add-dream.vue -->
<template>
  <section class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12">
    <form
      class="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow xl:col-span-8"
      @submit.prevent="saveDream"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Dream Location
          </p>
          <h2 class="text-2xl font-black text-base-content">
            {{ formTitle }}
          </h2>
          <p class="max-w-2xl text-sm text-base-content/70">
            A Dream is now the place layer. Scenario is plot, Character is cast, Reward is item. This is the haunted stage with better lighting.
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

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="form-control">
          <span class="label-text font-bold">Location name</span>
          <input
            v-model="dreamStore.dreamForm.title"
            class="input input-bordered rounded-2xl"
            type="text"
            placeholder="The Lantern Greenhouse"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Slug</span>
          <input
            v-model="dreamStore.dreamForm.slug"
            class="input input-bordered rounded-2xl"
            type="text"
            placeholder="the-lantern-greenhouse"
          />
        </label>
      </div>

      <label class="form-control">
        <span class="label-text font-bold">Description</span>
        <textarea
          v-model="dreamStore.dreamForm.description"
          class="textarea textarea-bordered min-h-28 rounded-2xl"
          placeholder="What is this place? What does the player see first?"
        />
      </label>

      <label class="form-control">
        <span class="label-text font-bold">Current vibe</span>
        <textarea
          v-model="dreamStore.dreamForm.currentVibe"
          class="textarea textarea-bordered min-h-28 rounded-2xl"
          placeholder="How does the location feel right now?"
        />
      </label>

      <label class="form-control">
        <span class="label-text font-bold">Art and story prompt</span>
        <textarea
          v-model="dreamStore.dreamForm.currentPrompt"
          class="textarea textarea-bordered min-h-28 rounded-2xl"
          placeholder="Prompt for image generation or narrative setup"
        />
      </label>

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

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
          <input
            v-model="dreamStore.dreamForm.isPublic"
            class="toggle toggle-primary"
            type="checkbox"
          />
          <span class="font-bold">Public</span>
        </label>

        <label class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
          <input
            v-model="dreamStore.dreamForm.isMature"
            class="toggle toggle-warning"
            type="checkbox"
          />
          <span class="font-bold">Mature</span>
        </label>

        <label class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
          <input
            v-model="dreamStore.dreamForm.isActive"
            class="toggle toggle-success"
            type="checkbox"
          />
          <span class="font-bold">Active</span>
        </label>

        <label class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
          <input
            v-model="dreamStore.dreamForm.createCollection"
            class="toggle toggle-secondary"
            type="checkbox"
          />
          <span class="font-bold">Collection</span>
        </label>
      </div>

      <div
        v-if="dreamStore.error"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ dreamStore.error }}
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-primary rounded-2xl"
          type="submit"
          :disabled="dreamStore.isSaving || !canSave"
        >
          <Icon name="kind-icon:save" class="h-5 w-5" />
          {{ dreamStore.isSaving ? 'Saving...' : 'Save Dream' }}
        </button>

        <button
          class="btn btn-ghost rounded-2xl"
          type="button"
          @click="dreamStore.deselectDream"
        >
          <Icon name="kind-icon:x" class="h-5 w-5" />
          Clear
        </button>
      </div>
    </form>

    <aside class="space-y-4 xl:col-span-4">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow">
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          Preview
        </p>
        <h3 class="mt-1 text-xl font-black text-secondary">
          {{ dreamStore.dreamForm.title || 'Untitled Dream' }}
        </h3>
        <p class="mt-3 whitespace-pre-wrap text-sm text-base-content/70">
          {{ dreamStore.dreamForm.description || dreamStore.dreamForm.currentVibe || 'No location text yet.' }}
        </p>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow">
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          Linked Context
        </p>
        <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div class="rounded-2xl bg-base-200 p-3">
            Scenario #{{ dreamStore.dreamForm.scenarioId || 'none' }}
          </div>
          <div class="rounded-2xl bg-base-200 p-3">
            Art #{{ dreamStore.dreamForm.artId || 'none' }}
          </div>
          <div class="rounded-2xl bg-base-200 p-3">
            Image #{{ dreamStore.dreamForm.artImageId || 'none' }}
          </div>
          <div class="rounded-2xl bg-base-200 p-3">
            Collection #{{ dreamStore.dreamForm.artCollectionId || 'new' }}
          </div>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
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

const formTitle = computed(() => {
  if (dreamStore.dreamForm.id) return 'Edit Dream Location'
  if (props.mode === 'create') return 'Create Dream Location'
  return 'Location Setup'
})

const canSave = computed(() => {
  return Boolean(
    dreamStore.dreamForm.title?.trim() &&
      dreamStore.dreamForm.currentVibe?.trim(),
  )
})

onMounted(async () => {
  await dreamStore.initialize()

  if (!dreamStore.dreamForm.title && !dreamStore.selectedDream) {
    startLanternDream()
  }
})

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

async function saveDream() {
  const result = await dreamStore.saveDream()

  if (result.success && result.data?.id) {
    emit('saved', result.data.id)
  }
}
</script>
