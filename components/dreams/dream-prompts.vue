<!-- /components/dreams/dream-prompts.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden p-3"
  >
    <header class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="min-w-0">
          <h2 class="text-2xl font-black text-primary">Dream Prompts</h2>
          <p class="text-sm text-base-content/70">
            Manage the prompt and vibe that drive the active dream.
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm btn-secondary rounded-2xl"
            @click="seedPrompt"
          >
            Random Seed
          </button>

          <button
            type="button"
            class="btn btn-sm btn-primary rounded-2xl text-white"
            :disabled="dreamStore.isSaving || !canSave"
            @click="savePrompt"
          >
            Save
          </button>
        </div>
      </div>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]"
    >
      <section
        class="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <label class="form-control">
          <span class="label-text font-bold">Current Vibe</span>
          <textarea
            v-model="dreamStore.dreamForm.currentVibe"
            class="textarea textarea-bordered min-h-44 resize-none rounded-2xl"
            placeholder="The evolving dream state."
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Current Prompt</span>
          <textarea
            v-model="dreamStore.dreamForm.currentPrompt"
            class="textarea textarea-bordered min-h-44 resize-none rounded-2xl"
            placeholder="The model-facing prompt."
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Prompt Field Sync</span>
          <textarea
            v-model="promptStore.promptField"
            class="textarea textarea-bordered min-h-32 resize-none rounded-2xl"
            placeholder="Shared promptStore field."
          />
        </label>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            class="btn btn-sm btn-outline rounded-2xl"
            @click="copyVibeToPrompt"
          >
            Vibe → Prompt
          </button>

          <button
            type="button"
            class="btn btn-sm btn-outline rounded-2xl"
            @click="copyPromptStoreToDream"
          >
            PromptStore → Dream
          </button>

          <button
            type="button"
            class="btn btn-sm btn-outline rounded-2xl"
            @click="copyDreamPromptToPromptStore"
          >
            Dream → PromptStore
          </button>
        </div>
      </section>

      <aside class="flex min-h-0 flex-col gap-4 overflow-hidden">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h3 class="text-lg font-black text-primary">Seed</h3>

          <p
            class="mt-2 rounded-2xl border border-base-300 bg-base-200 p-3 text-sm leading-relaxed text-base-content/70"
          >
            {{ seed }}
          </p>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-sm btn-ghost rounded-2xl"
              @click="refreshSeed"
            >
              Reroll
            </button>

            <button
              type="button"
              class="btn btn-sm btn-secondary rounded-2xl"
              @click="applySeed"
            >
              Use
            </button>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="shrink-0 border-b border-base-300 p-4">
            <h3 class="text-lg font-black text-primary">Recent Dream Chat</h3>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-3">
            <article
              v-for="chat in recentChats"
              :key="chat.id"
              class="mb-2 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="mb-1 text-xs font-bold text-primary">
                {{ chat.sender || 'Dream' }}
              </div>
              <p class="line-clamp-4 text-sm text-base-content/70">
                {{ chat.content }}
              </p>
            </article>

            <p
              v-if="recentChats.length === 0"
              class="text-sm text-base-content/50"
            >
              No prompt history yet.
            </p>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/dreams/dream-prompts.vue
import { computed, onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { usePromptStore } from '@/stores/promptStore'

const dreamStore = useDreamStore()
const promptStore = usePromptStore()

const seed = ref('')

const canSave = computed(() =>
  Boolean(dreamStore.dreamForm.currentVibe?.trim()),
)

const recentChats = computed(() => dreamStore.dreamChats.slice(-8).reverse())

function refreshSeed() {
  seed.value = dreamStore.randomDream()
}

function applySeed() {
  dreamStore.setDreamForm({
    currentVibe: seed.value,
    currentPrompt: seed.value,
  })
  promptStore.promptField = seed.value
}

function seedPrompt() {
  refreshSeed()
  applySeed()
}

function copyVibeToPrompt() {
  const vibe = dreamStore.dreamForm.currentVibe || ''
  dreamStore.setDreamForm({
    currentPrompt: vibe,
  })
  promptStore.promptField = vibe
}

function copyPromptStoreToDream() {
  dreamStore.setDreamForm({
    currentPrompt: promptStore.promptField,
  })
}

function copyDreamPromptToPromptStore() {
  promptStore.promptField = dreamStore.dreamForm.currentPrompt || ''
}

async function savePrompt() {
  if (!dreamStore.selectedDream?.id) {
    await dreamStore.saveDream()
    return
  }

  await dreamStore.updateSelectedDream({
    currentVibe: dreamStore.dreamForm.currentVibe || '',
    currentPrompt: dreamStore.dreamForm.currentPrompt || null,
  })

  await dreamStore.addModelDreamMessage('Dream prompt updated.', {
    currentVibe: dreamStore.dreamForm.currentVibe || '',
    currentPrompt: dreamStore.dreamForm.currentPrompt || null,
    updateDream: true,
  })
}

watch(
  () => dreamStore.dreamForm.currentPrompt,
  (prompt) => {
    if (typeof prompt === 'string') {
      promptStore.promptField = prompt
    }
  },
)

onMounted(async () => {
  await dreamStore.initialize()

  if (dreamStore.selectedDream?.id) {
    await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
  }

  refreshSeed()
})
</script>
