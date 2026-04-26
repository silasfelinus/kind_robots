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

        <!-- Add Server — panel drops directly below this wrapper -->
        <div class="relative">
          <button
            type="button"
            class="btn btn-primary btn-sm gap-1.5 rounded-xl"
            @click="toggleAdd"
          >
            <Icon
              :name="showAdd ? 'kind-icon:x' : 'kind-icon:plus'"
              class="h-3.5 w-3.5"
            />
            {{ showAdd ? 'Close' : 'Add Server' }}
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-2 scale-95"
          >
            <add-server
              v-if="showAdd"
              class="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(400px,95vw)] shadow-2xl"
              @close="showAdd = false"
              @saved="showAdd = false"
            />
          </Transition>
        </div>
      </div>
    </header>

    <!-- ══ BODY — two galleries side by side ══════════════════════════════ -->
    <main class="min-h-0 flex-1 overflow-hidden p-4 gallery-grid">
      <server-gallery
        mode="text"
        :search-query="searchQuery"
        @open-add="openAddForType"
      />
      <server-gallery
        mode="image"
        :search-query="searchQuery"
        @open-add="openAddForType"
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { ServerType } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()
const searchQuery = ref('')
const showAdd = ref(false)

function toggleAdd() {
  showAdd.value = !showAdd.value
}

function openAddForType(serverType: ServerType) {
  serverStore.createNewServer(serverType)
  showAdd.value = true
}

onMounted(() => serverStore.initialize())
</script>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
@media (max-width: 700px) {
  .gallery-grid {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}
</style>
