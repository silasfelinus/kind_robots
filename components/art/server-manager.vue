<!-- /components/server/server-manager.vue -->
<template>
  <section
    class="relative flex min-h-full w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-base-content"
  >
    <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
    <header
      class="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-5 py-4"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"
        >
          <Icon name="kind-icon:server" class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 class="text-xl font-black tracking-tight">Server Manager</h1>
          <p class="text-xs opacity-60">
            Choose your default engines for text and image processing.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Search -->
        <label
          class="input input-bordered input-sm flex items-center gap-2 rounded-xl pr-2"
        >
          <Icon name="kind-icon:search" class="h-3.5 w-3.5 opacity-50" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Filter servers…"
            class="w-32 bg-transparent text-xs outline-none placeholder:opacity-50"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="opacity-40 hover:opacity-80"
            @click="searchQuery = ''"
          >
            <Icon name="kind-icon:x" class="h-3 w-3" />
          </button>
        </label>

        <!-- Refresh -->
        <button
          type="button"
          class="btn btn-ghost btn-sm gap-1.5 rounded-xl"
          :disabled="serverStore.loading"
          @click="serverStore.fetchAllServers(true)"
        >
          <Icon
            v-if="!serverStore.loading"
            name="kind-icon:refresh"
            class="h-3.5 w-3.5"
          />
          <span v-else class="loading loading-spinner loading-xs" />
          Refresh
        </button>

        <!-- Add Server — panel teleports to <body> anchored to this button -->
        <button
          ref="addBtnRef"
          type="button"
          class="btn btn-primary btn-sm gap-1.5 rounded-xl"
          @click="togglePanel"
        >
          <Icon
            :name="showPanel ? 'kind-icon:x' : 'kind-icon:plus'"
            class="h-3.5 w-3.5"
          />
          {{ showPanel ? 'Close' : 'Add Server' }}
        </button>
      </div>
    </header>

    <!-- ══ BODY ════════════════════════════════════════════════════════════ -->
    <main class="gallery-grid min-h-0 flex-1 gap-4 overflow-hidden p-4">
      <server-gallery
        mode="text"
        :search-query="searchQuery"
        @open-add="openAdd"
        @open-edit="openEdit"
      />
      <server-gallery
        mode="image"
        :search-query="searchQuery"
        @open-add="openAdd"
        @open-edit="openEdit"
      />
    </main>

    <!-- Loading overlay -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="serverStore.loading || serverStore.isSaving"
        class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-base-100/80 backdrop-blur-sm"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
        <span class="text-sm font-bold opacity-70"
          >Negotiating with the server goblins…</span
        >
      </div>
    </Transition>
  </section>

  <!-- ══ ADD-SERVER PANEL — teleported to <body> so nothing clips it ══════ -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-95"
    >
      <div
        v-if="showPanel"
        class="fixed z-9999 w-[min(400px,calc(100vw-2rem))] shadow-2xl"
        :style="panelStyle"
      >
        <add-server @close="showPanel = false" @saved="showPanel = false" />
      </div>
    </Transition>

    <!-- Click-outside backdrop (invisible) -->
    <div
      v-if="showPanel"
      class="fixed inset-0 z-9998"
      @click="showPanel = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { ServerType } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()
const searchQuery = ref('')
const showPanel = ref(false)
const addBtnRef = ref<HTMLElement | null>(null)

// Position of the floating panel — recalculated each time it opens
const panelTop = ref(0)
const panelRight = ref(0)

const panelStyle = computed(() => ({
  top: `${panelTop.value}px`,
  right: `${panelRight.value}px`,
}))

function recalcPosition() {
  const btn = addBtnRef.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  panelTop.value = rect.bottom + 6
  // Anchor to right edge of button, ensuring it doesn't overflow left viewport edge
  const rightFromViewport = window.innerWidth - rect.right
  panelRight.value = Math.max(8, rightFromViewport)
}

async function togglePanel() {
  if (!showPanel.value) {
    serverStore.createNewServer('TEXT')
    await nextTick()
    recalcPosition()
  }
  showPanel.value = !showPanel.value
}

function openAdd(serverType: ServerType) {
  serverStore.createNewServer(serverType)
  nextTick(recalcPosition)
  showPanel.value = true
}

function openEdit() {
  nextTick(recalcPosition)
  showPanel.value = true
}

// Reposition on resize so panel doesn't drift if window changes
function onResize() {
  if (showPanel.value) recalcPosition()
}

onMounted(() => {
  serverStore.initialize()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (max-width: 700px) {
  .gallery-grid {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}
</style>
