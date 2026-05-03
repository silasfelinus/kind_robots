<!-- /components/dreams/dream-prompts.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-3"
  >
    <header
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="min-w-0">
          <h2 class="text-2xl font-black text-primary">Dream Prompts</h2>

          <p class="text-sm text-base-content/70">
            Shape the active dream’s vibe, model prompt, and prompt history.
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm btn-secondary rounded-2xl"
            @click="seedPrompt"
          >
            <Icon name="kind-icon:dice" class="h-5 w-5" />
            Random Seed
          </button>

          <button
            type="button"
            class="btn btn-sm btn-primary rounded-2xl text-white"
            :disabled="dreamStore.isSaving || !canSave"
            @click="savePrompt"
          >
            <span
              v-if="dreamStore.isSaving"
              class="loading loading-spinner loading-xs"
            />
            Save
          </button>
        </div>
      </div>
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

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]"
    >
      <section
        class="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div
          v-if="dreamStore.selectedDream"
          class="rounded-2xl border border-primary/30 bg-primary/10 p-3"
        >
          <p class="text-xs font-bold uppercase text-base-content/50">
            Active Dream
          </p>

          <p class="mt-1 font-bold text-primary">
            {{
              dreamStore.selectedDream.title ||
              `Dream ${dreamStore.selectedDream.id}`
            }}
          </p>
        </div>

        <div
          v-else
          class="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
        >
          No dream selected. Saving will create or update the current dream
          form.
        </div>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Current Vibe</span>
            <span class="label-text-alt text-base-content/50"
              >shared state</span
            >
          </span>

          <textarea
            v-model="localVibe"
            class="textarea textarea-bordered min-h-44 resize-none rounded-2xl bg-base-200"
            placeholder="The evolving dream state, mood, scene, or direction."
          />
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Current Prompt</span>
            <span class="label-text-alt text-base-content/50"
              >model-facing</span
            >
          </span>

          <textarea
            v-model="localPrompt"
            class="textarea textarea-bordered min-h-44 resize-none rounded-2xl bg-base-200"
            placeholder="The model-facing prompt for text or image generation."
          />
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Prompt Store Field</span>
            <span class="label-text-alt text-base-content/50"
              >global prompt</span
            >
          </span>

          <textarea
            v-model="promptStore.promptField"
            class="textarea textarea-bordered min-h-32 resize-none rounded-2xl bg-base-200"
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
            Store → Dream
          </button>

          <button
            type="button"
            class="btn btn-sm btn-outline rounded-2xl"
            @click="copyDreamPromptToPromptStore"
          >
            Dream → Store
          </button>
        </div>

        <details class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <summary class="cursor-pointer font-bold text-base-content">
            Prompt Preview
          </summary>

          <pre
            class="mt-3 whitespace-pre-wrap rounded-2xl bg-base-100 p-3 text-sm text-base-content/75"
            >{{ promptPreview }}</pre
          >
        </details>
      </section>

      <aside class="flex min-h-0 flex-col gap-4 overflow-hidden">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="text-lg font-black text-primary">Seed Bank</h3>

            <button
              type="button"
              class="btn btn-xs btn-secondary rounded-xl"
              @click="refreshSeed"
            >
              Reroll
            </button>
          </div>

          <p
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm leading-relaxed text-base-content/70"
          >
            {{ seed }}
          </p>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-sm btn-primary rounded-2xl text-white"
              @click="applySeedToVibe"
            >
              Use as Vibe
            </button>

            <button
              type="button"
              class="btn btn-sm btn-secondary rounded-2xl"
              @click="applySeedToBoth"
            >
              Use Both
            </button>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="shrink-0 border-b border-base-300 p-4">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-black text-primary">
                  Recent Dream Chat
                </h3>
                <p class="text-xs text-base-content/60">
                  Recent nudges, model replies, and prompt shifts.
                </p>
              </div>

              <button
                type="button"
                class="btn btn-xs btn-ghost rounded-xl"
                :disabled="
                  !dreamStore.selectedDream?.id || dreamStore.chatsLoading
                "
                @click="refreshChats"
              >
                Refresh
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-3">
            <article
              v-for="chat in recentChats"
              :key="chat.id"
              class="mb-2 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="mb-1 flex items-center justify-between gap-2">
                <div class="truncate text-xs font-bold text-primary">
                  {{ chat.sender || 'Dream' }}
                </div>

                <div class="shrink-0 text-[10px] text-base-content/40">
                  #{{ chat.id }}
                </div>
              </div>

              <p class="line-clamp-4 text-sm text-base-content/70">
                {{ chat.content }}
              </p>
            </article>

            <p
              v-if="recentChats.length === 0"
              class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm text-base-content/50"
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
import { computed, onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { usePromptStore } from '@/stores/promptStore'

const dreamStore = useDreamStore()
const promptStore = usePromptStore()

const seed = ref('')
const localVibe = ref('')
const localPrompt = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const canSave = computed(() => Boolean(localVibe.value.trim()))

const recentChats = computed(() => dreamStore.dreamChats.slice(-8).reverse())

const promptPreview = computed(() => {
  return [
    `Dream: ${dreamStore.selectedDream?.title || dreamStore.dreamForm.title || 'Untitled Dream'}`,
    `Vibe: ${localVibe.value || 'No vibe set.'}`,
    `Prompt: ${localPrompt.value || localVibe.value || 'No prompt set.'}`,
    promptStore.promptField ? `PromptStore: ${promptStore.promptField}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
})

function syncLocalFromStore() {
  localVibe.value = dreamStore.dreamForm.currentVibe || ''
  localPrompt.value =
    dreamStore.dreamForm.currentPrompt || dreamStore.dreamForm.currentVibe || ''
}

function commitLocalToStore() {
  dreamStore.setDreamForm({
    currentVibe: localVibe.value,
    currentPrompt: localPrompt.value || localVibe.value || null,
  })
}

function refreshSeed() {
  seed.value = dreamStore.randomDream()
}

function applySeedToVibe() {
  localVibe.value = seed.value
  commitLocalToStore()
}

function applySeedToBoth() {
  localVibe.value = seed.value
  localPrompt.value = seed.value
  promptStore.promptField = seed.value
  commitLocalToStore()
}

function seedPrompt() {
  refreshSeed()
  applySeedToBoth()
}

function copyVibeToPrompt() {
  localPrompt.value = localVibe.value
  promptStore.promptField = localVibe.value
  commitLocalToStore()
}

function copyPromptStoreToDream() {
  localPrompt.value = promptStore.promptField
  commitLocalToStore()
}

function copyDreamPromptToPromptStore() {
  promptStore.promptField = localPrompt.value || localVibe.value || ''
}

async function refreshChats() {
  if (!dreamStore.selectedDream?.id) return

  await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
}

async function savePrompt() {
  statusMessage.value = ''
  commitLocalToStore()

  try {
    if (!dreamStore.selectedDream?.id) {
      const result = await dreamStore.saveDream()

      if (!result.success) {
        throw new Error(result.message || 'Failed to save dream prompt.')
      }

      statusTone.value = 'success'
      statusMessage.value = 'Dream prompt saved.'
      return
    }

    const result = await dreamStore.updateSelectedDream({
      currentVibe: localVibe.value,
      currentPrompt: localPrompt.value || null,
    })

    if (!result.success) {
      throw new Error(result.message || 'Failed to update dream prompt.')
    }

    await dreamStore.addModelDreamMessage('Dream prompt updated.', {
      currentVibe: localVibe.value,
      currentPrompt: localPrompt.value || null,
      updateDream: true,
    })

    statusTone.value = 'success'
    statusMessage.value = 'Dream prompt updated.'
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to save prompt.'
  }
}

watch(
  () => dreamStore.selectedDream?.id,
  async (id) => {
    syncLocalFromStore()

    if (id) {
      await dreamStore.fetchDreamChats(id)
    }
  },
)

watch(
  () => dreamStore.dreamForm.currentPrompt,
  (prompt) => {
    if (typeof prompt === 'string' && prompt !== promptStore.promptField) {
      promptStore.promptField = prompt
    }
  },
)

watch([localVibe, localPrompt], () => {
  commitLocalToStore()
})

onMounted(async () => {
  await dreamStore.initialize()
  syncLocalFromStore()

  if (dreamStore.selectedDream?.id) {
    await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
  }

  refreshSeed()
})
</script>
