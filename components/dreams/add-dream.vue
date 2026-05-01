<!-- /components/content/dream/add-dream.vue -->
<template>
  <section
    class="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-6"
  >
    <header
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0">
        <h1 class="text-3xl font-black text-primary sm:text-4xl">
          Start a Dream
        </h1>
        <p class="mt-1 text-sm text-base-content/70 sm:text-base">
          Begin with a vibe, prompt, image, collection, gallery, or scenario.
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-secondary rounded-2xl"
          @click="seedRandomDream"
        >
          <Icon name="kind-icon:dice" class="h-5 w-5" />
          Random Seed
        </button>

        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-2xl"
          @click="dreamStore.createNewDream()"
        >
          <Icon name="kind-icon:sparkles" class="h-5 w-5" />
          Clear
        </button>
      </div>
    </header>

    <div
      class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]"
    >
      <form
        class="flex min-w-0 flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
        @submit.prevent="handleSubmit"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label class="form-control">
            <span class="label-text font-bold">Title</span>
            <input
              v-model="dreamStore.dreamForm.title"
              class="input input-bordered rounded-2xl"
              placeholder="Moonlit Robot Tea Party"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Slug</span>
            <input
              v-model="dreamStore.dreamForm.slug"
              class="input input-bordered rounded-2xl"
              placeholder="moonlit-robot-tea-party"
            />
          </label>
        </div>

        <label class="form-control">
          <span class="label-text font-bold">Description</span>
          <textarea
            v-model="dreamStore.dreamForm.description"
            class="textarea textarea-bordered min-h-20 resize-none rounded-2xl"
            placeholder="Optional summary for this dream."
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Current Vibe</span>
          <textarea
            v-model="dreamStore.dreamForm.currentVibe"
            class="textarea textarea-bordered min-h-36 resize-none rounded-2xl"
            placeholder="The shared atmosphere, story state, or scene direction."
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Current Prompt</span>
          <textarea
            v-model="dreamStore.dreamForm.currentPrompt"
            class="textarea textarea-bordered min-h-32 resize-none rounded-2xl"
            placeholder="The model-facing prompt. Defaults to the current vibe."
          />
        </label>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label class="form-control">
            <span class="label-text font-bold">Pitch ID</span>
            <input
              v-model.number="dreamStore.dreamForm.pitchId"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl"
              placeholder="Optional"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Art ID</span>
            <input
              v-model.number="dreamStore.dreamForm.artId"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl"
              placeholder="Optional"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">ArtImage ID</span>
            <input
              v-model.number="dreamStore.dreamForm.artImageId"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl"
              placeholder="Optional"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Text Server ID</span>
            <input
              v-model.number="dreamStore.dreamForm.textServerId"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl"
              placeholder="Optional"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Art Server ID</span>
            <input
              v-model.number="dreamStore.dreamForm.artServerId"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl"
              placeholder="Optional"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Art Collection ID</span>
            <input
              v-model.number="dreamStore.dreamForm.artCollectionId"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl"
              placeholder="Optional"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Gallery ID</span>
            <input
              v-model.number="dreamStore.dreamForm.galleryId"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl"
              placeholder="Optional"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Scenario ID</span>
            <input
              v-model.number="dreamStore.dreamForm.scenarioId"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl"
              placeholder="Optional"
            />
          </label>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label
            class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <span class="label-text font-bold">Public</span>
            <input
              v-model="dreamStore.dreamForm.isPublic"
              type="checkbox"
              class="toggle toggle-success"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <span class="label-text font-bold">Mature</span>
            <input
              v-model="dreamStore.dreamForm.isMature"
              type="checkbox"
              class="toggle toggle-warning"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <span class="label-text font-bold">Create Collection</span>
            <input
              v-model="dreamStore.dreamForm.createCollection"
              type="checkbox"
              class="toggle toggle-primary"
            />
          </label>
        </div>

        <div
          v-if="dreamStore.error"
          class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
        >
          {{ dreamStore.error }}
        </div>

        <div
          v-if="message"
          class="rounded-2xl border p-3 text-sm"
          :class="
            messageType === 'success'
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-warning/40 bg-warning/10 text-warning'
          "
        >
          {{ message }}
        </div>

        <div
          class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
        >
          <button
            type="button"
            class="btn btn-ghost rounded-2xl"
            @click="dreamStore.deselectDream"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="btn btn-primary rounded-2xl text-white"
            :disabled="dreamStore.isSaving || !canSave"
          >
            <span v-if="dreamStore.isSaving">Saving...</span>
            <span v-else>{{
              dreamStore.dreamForm.id ? 'Update Dream' : 'Create Dream'
            }}</span>
          </button>
        </div>
      </form>

      <aside class="flex min-h-0 flex-col gap-4">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center gap-2">
            <Icon name="kind-icon:moon" class="h-7 w-7 text-primary" />
            <h2 class="text-lg font-black">Preview</h2>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h3 class="text-xl font-black">
              {{ dreamStore.dreamForm.title || 'Untitled Dream' }}
            </h3>
            <p
              class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/70"
            >
              {{
                dreamStore.dreamForm.currentVibe ||
                'No vibe yet. The dream is still wearing pajamas.'
              }}
            </p>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h2 class="text-lg font-black">Seed Bank</h2>
            <button
              type="button"
              class="btn btn-xs btn-secondary"
              @click="refreshSeed"
            >
              Reroll
            </button>
          </div>

          <p
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm leading-relaxed text-base-content/70"
          >
            {{ previewSeed }}
          </p>

          <button
            type="button"
            class="btn btn-sm btn-primary mt-3 w-full rounded-2xl text-white"
            @click="applySeed"
          >
            Use This Seed
          </button>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/content/dream/add-dream.vue
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const dreamStore = useDreamStore()

const message = ref('')
const messageType = ref<'success' | 'warning'>('success')
const previewSeed = ref('')

const canSave = computed(() =>
  Boolean(
    dreamStore.dreamForm.title?.trim() &&
    dreamStore.dreamForm.currentVibe?.trim(),
  ),
)

function refreshSeed() {
  previewSeed.value = dreamStore.randomDream()
}

function applySeed() {
  dreamStore.setDreamForm({
    currentVibe: previewSeed.value,
    currentPrompt: previewSeed.value,
  })
}

function seedRandomDream() {
  const seed = dreamStore.randomDream()
  dreamStore.createNewDream({
    title: '',
    currentVibe: seed,
    currentPrompt: seed,
    createCollection: true,
    isPublic: true,
    isMature: false,
  })
  previewSeed.value = seed
}

async function handleSubmit() {
  message.value = ''

  const result = await dreamStore.saveDream()

  if (result.success) {
    messageType.value = 'success'
    message.value = dreamStore.dreamForm.id
      ? 'Dream updated successfully.'
      : 'Dream created successfully.'
    return
  }

  messageType.value = 'warning'
  message.value = result.message || 'Failed to save dream.'
}

onMounted(async () => {
  await dreamStore.initialize()

  if (!dreamStore.dreamForm.currentVibe) {
    seedRandomDream()
  }

  refreshSeed()
})
</script>
