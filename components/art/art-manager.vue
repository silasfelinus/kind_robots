<!-- /components/art/art-manager.vue -->
<template>
  <section class="h-full w-full">
    <div
      class="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3 sm:p-6"
    >
      <div
        class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <h1 class="text-2xl font-bold text-primary sm:text-3xl">
          🎨 Art Manager
        </h1>
        <p class="text-sm text-base-content/70 sm:text-base">
          Configure your art server, load a checkpoint, build a prompt, generate
          something weird.
        </p>
      </div>

      <art-servers class="shrink-0" />

      <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12">
        <div class="min-h-0 xl:col-span-3">
          <div
            class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 shrink-0 text-lg font-semibold text-primary">
              🧠 Model
            </div>
            <div class="min-h-0 flex-1 overflow-auto">
              <checkpoint-gallery />
            </div>
          </div>
        </div>

        <div class="min-h-0 xl:col-span-6">
          <div
            class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 shrink-0 text-lg font-semibold text-primary">
              📝 Prompt
            </div>
            <div class="min-h-0 flex-1 overflow-auto">
              <art-randomizer />
            </div>
          </div>
        </div>

        <div class="min-h-0 xl:col-span-3">
          <div
            class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 shrink-0 text-lg font-semibold text-primary">
              🏛️ Gallery
            </div>
            <div class="min-h-0 flex-1 overflow-auto">
              <collection-gallery />
            </div>
          </div>
        </div>
      </div>

      <div class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="mb-1 block text-sm font-semibold text-base-content/70">
              Prompt
            </label>
            <textarea
              v-model="promptStore.promptField"
              class="textarea textarea-bordered w-full resize-none rounded-xl"
              rows="2"
              placeholder="Enter your creative prompt…"
              :disabled="isGenerating"
            />
          </div>

          <div class="flex flex-col gap-2 sm:w-48">
            <label
              class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
            >
              <span class="label-text text-xs font-semibold">
                Use selected server
              </span>
              <input
                v-model="useSelectedServer"
                type="checkbox"
                class="toggle toggle-primary toggle-sm"
              />
            </label>

            <button
              type="button"
              class="btn w-full rounded-xl font-semibold text-white"
              :class="
                isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'
              "
              :disabled="isGenerating || !promptStore.promptField.trim()"
              @click="generateArt"
            >
              <span
                v-if="isGenerating"
                class="loading loading-spinner loading-sm"
              />
              {{ isGenerating ? 'Working…' : '🖌️ Create Art' }}
            </button>
          </div>
        </div>

        <Transition name="fade-expand">
          <div v-if="lastResult" class="mt-3">
            <div
              class="rounded-xl border px-3 py-2 text-sm"
              :class="
                lastResult.success
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-error/30 bg-error/10 text-error'
              "
            >
              {{ lastResult.message }}
            </div>
          </div>
        </Transition>
      </div>

      <div
        class="min-h-0 shrink rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <art-display />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useServerStore } from '@/stores/serverStore'
import { useCheckpointStore } from '@/stores/checkpointStore'

const artStore = useArtStore()
const promptStore = usePromptStore()
const errorStore = useErrorStore()
const serverStore = useServerStore()
const checkpointStore = useCheckpointStore()

const isGenerating = ref(false)
const useSelectedServer = ref(true)
const lastResult = ref<{ success: boolean; message: string } | null>(null)

async function generateArt() {
  isGenerating.value = true
  lastResult.value = null

  const activeServer = serverStore.activeArtServer

  const overrides =
    useSelectedServer.value && activeServer
      ? {
          serverId: activeServer.id,
          serverName: activeServer.title,
          checkpoint: checkpointStore.selectedCheckpoint?.name ?? undefined,
        }
      : {}

  const result = await artStore.generateArt({
    promptString: promptStore.promptField,
    ...overrides,
  } as Parameters<typeof artStore.generateArt>[0])

  lastResult.value = {
    success: result.success,
    message:
      result.message ??
      (result.success ? 'Art generated!' : 'Generation failed.'),
  }

  if (!result.success) {
    errorStore.addError(ErrorType.GENERAL_ERROR, result.message)
  }

  isGenerating.value = false
}

onMounted(async () => {
  if (!serverStore.isInitialized) {
    await serverStore.initialize()
  }

  checkpointStore.initialize()
})
</script>

<style scoped>
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.fade-expand-enter-to,
.fade-expand-leave-from {
  opacity: 1;
  max-height: 24rem;
}
</style>