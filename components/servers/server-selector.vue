<!-- /components/server/server-selector.vue -->
<template>
  <div class="relative">
    <button
      class="btn btn-sm btn-ghost rounded-xl border border-base-300 bg-base-100"
      type="button"
      title="Server defaults"
      @click="openSelector"
    >
      <Icon name="kind-icon:server" class="h-4 w-4" />
    </button>

    <dialog ref="selectorDialog" class="modal">
      <div
        class="modal-box flex max-h-[90vh] w-11/12 max-w-4xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <header class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Icon name="kind-icon:server" class="h-5 w-5 text-primary" />

              <h2 class="text-lg font-black text-base-content">
                Default Servers
              </h2>
            </div>

            <p class="mt-1 text-sm text-base-content/60">
              Choose defaults, or use your configured art and text servers.
              Blueprints stay tucked away until you click Add Server. Civilized.
            </p>
          </div>

          <button
            class="btn btn-sm btn-ghost rounded-xl"
            type="button"
            @click="closeSelector"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </header>

        <section
          v-if="serverStore.lastError"
          class="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning"
        >
          {{ serverStore.lastError }}
        </section>

        <section
          v-if="isLoading"
          class="flex items-center gap-2 rounded-2xl border border-info/30 bg-info/10 p-3 text-sm font-semibold text-info"
        >
          <span class="loading loading-spinner loading-xs" />
          Loading servers.
        </section>

        <section class="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <server-gallery
            v-model:use-default="useDefaultArt"
            v-model:selected-family="selectedArtFamily"
            mode="art"
            variant="dropdown"
            visibility="owned"
            title="Art Server"
            subtitle="Use a configured image server, or stay on the Kind Robots default."
            :show-header="true"
            :show-controls="false"
            :show-family-select="true"
            :show-use-default-toggle="true"
            :show-advanced-toggle="false"
            :show-card-actions="false"
            :show-descriptions="false"
            :show-meta="false"
            :show-capabilities="false"
            :show-use-buttons="false"
            :show-debug="false"
            :show-workflow="false"
            :show-defaults="false"
            :show-status="false"
            :allow-add="true"
            :allow-edit="true"
            :allow-delete="false"
            :allow-test="false"
            :auto-load="false"
          />

          <server-gallery
            v-model:use-default="useDefaultText"
            v-model:selected-family="selectedTextFamily"
            mode="text"
            variant="dropdown"
            visibility="owned"
            title="Text Server"
            subtitle="Use a configured text server, or stay on the Kind Robots default."
            :show-header="true"
            :show-controls="false"
            :show-family-select="true"
            :show-use-default-toggle="true"
            :show-advanced-toggle="false"
            :show-card-actions="false"
            :show-descriptions="false"
            :show-meta="false"
            :show-capabilities="false"
            :show-use-buttons="false"
            :show-debug="false"
            :show-workflow="false"
            :show-defaults="false"
            :show-status="false"
            :allow-add="true"
            :allow-edit="true"
            :allow-delete="false"
            :allow-test="false"
            :auto-load="false"
          />
        </section>

        <section
          v-if="!useDefaultArt"
          class="rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div class="mb-2 flex items-center gap-2">
            <Icon name="kind-icon:checkpoint" class="h-5 w-5 text-primary" />

            <h3 class="font-black text-base-content">Art Checkpoint</h3>
          </div>

          <checkpoint-gallery
            variant="dropdown"
            title="Art Checkpoint"
            subtitle="Checkpoint for the selected art server."
            :show-header="false"
            :show-sampler="true"
            :show-status="false"
            :allow-add="true"
            :allow-refresh="true"
            :auto-load="true"
          />
        </section>

        <footer
          class="flex flex-col gap-2 border-t border-base-300 pt-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <NuxtLink
            to="/server-manager"
            class="btn btn-sm btn-outline rounded-xl"
            @click="closeSelector"
          >
            <Icon name="kind-icon:settings" class="h-4 w-4" />
            Server Manager
          </NuxtLink>

          <div class="flex flex-wrap gap-2 sm:justify-end">
            <button
              class="btn btn-sm btn-ghost rounded-xl"
              type="button"
              :disabled="isLoading"
              @click="refreshServers(true)"
            >
              <span
                v-if="isLoading"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
              Refresh
            </button>

            <button
              class="btn btn-sm btn-primary rounded-xl text-white"
              type="button"
              @click="closeSelector"
            >
              Done
            </button>
          </div>
        </footer>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeSelector">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'

const serverStore = useServerStore()

const selectorDialog = ref<HTMLDialogElement | null>(null)
const isLoading = ref(false)

type ArtFamily =
  | 'sd'
  | 'comfy-sdxl'
  | 'comfy-flux'
  | 'kontext'
  | 'kombine'
  | 'openai-art'
  | 'invoke'

type TextFamily = 'anthropic' | 'openai' | 'ollama'

type FamilyValue = ArtFamily | TextFamily | 'all'

const useDefaultArt = ref(true)
const useDefaultText = ref(true)
const selectedArtFamily = ref<FamilyValue>('sd')
const selectedTextFamily = ref<FamilyValue>('anthropic')

function openSelector() {
  serverStore.setCurrentServerMode('art')
  selectorDialog.value?.showModal()
}

function closeSelector() {
  selectorDialog.value?.close()
  serverStore.setCurrentServerMode('art')
}

async function refreshServers(force = false) {
  isLoading.value = true

  try {
    await serverStore.initialize({
      force,
      fetchRemote: true,
    })

    serverStore.setCurrentServerMode('art')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    await refreshServers()
  }
})
</script>
