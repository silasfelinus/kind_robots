<!-- /components/servers/server-selector.vue -->
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
        class="modal-box flex max-h-[90vh] w-11/12 max-w-5xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-100"
      >
        <header class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-black text-primary">Server Selector</h2>
            <p class="text-sm text-base-content/60">
              Choose a configured access point, or leave generation to the
              mana-backed endpoint.
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

        <div class="grid gap-3 md:grid-cols-2">
          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <h3 class="mb-2 font-black text-primary">Art</h3>

            <select
              v-model.number="selectedArtServerId"
              class="select select-bordered w-full rounded-xl"
            >
              <option :value="null">Use system / mana route</option>
              <option
                v-for="server in artServers"
                :key="server.id"
                :value="server.id"
              >
                {{ server.label || server.title }} · {{ server.serverType }}
              </option>
            </select>

            <button
              class="btn btn-primary mt-3 w-full rounded-xl"
              type="button"
              @click="applyArtServer"
            >
              Save Art Server
            </button>
          </section>

          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <h3 class="mb-2 font-black text-secondary">Text</h3>

            <select
              v-model.number="selectedTextServerId"
              class="select select-bordered w-full rounded-xl"
            >
              <option :value="null">Use system / mana route</option>
              <option
                v-for="server in textServers"
                :key="server.id"
                :value="server.id"
              >
                {{ server.label || server.title }} · {{ server.serverType }}
              </option>
            </select>

            <button
              class="btn btn-secondary mt-3 w-full rounded-xl"
              type="button"
              @click="applyTextServer"
            >
              Save Text Server
            </button>
          </section>
        </div>

        <server-gallery
          mode="all"
          variant="dropdown"
          :show-header="false"
          :show-controls="true"
          :show-card-actions="true"
          :show-use-buttons="true"
        />
      </div>

      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeSelector">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'

const serverStore = useServerStore()
const selectorDialog = ref<HTMLDialogElement | null>(null)
const selectedArtServerId = ref<number | null>(null)
const selectedTextServerId = ref<number | null>(null)

const artServers = computed(() => {
  const servers = Array.isArray(serverStore.servers) ? serverStore.servers : []
  return servers.filter((server) => {
    return (
      server.isActive &&
      (server.serverType === 'A1111' || server.serverType === 'COMFY')
    )
  })
})

const textServers = computed(() => {
  const servers = Array.isArray(serverStore.servers) ? serverStore.servers : []
  return servers.filter((server) => {
    return (
      server.isActive &&
      ['OPENAI', 'ANTHROPIC', 'CUSTOM'].includes(server.serverType)
    )
  })
})

function openSelector() {
  selectedArtServerId.value = serverStore.activeArtServer?.id ?? null
  selectedTextServerId.value = serverStore.activeTextServer?.id ?? null
  selectorDialog.value?.showModal()
}

function closeSelector() {
  selectorDialog.value?.close()
}

function applyArtServer() {
  void serverStore.setActiveArtServer?.(selectedArtServerId.value)

  const server = selectedArtServerId.value
    ? serverStore.getServerById?.(selectedArtServerId.value)
    : null

  if (server) {
    serverStore.setCurrentServer?.(server.id)
  }

  closeSelector()
}

function applyTextServer() {
  void serverStore.setActiveTextServer?.(selectedTextServerId.value)

  const server = selectedTextServerId.value
    ? serverStore.getServerById?.(selectedTextServerId.value)
    : null

  if (server) {
    serverStore.setCurrentServer?.(server.id)
  }

  closeSelector()
}

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    await serverStore.initialize({
      fetchRemote: true,
    })
  }
})
</script>
