<!-- /components/dreams/dream-workspace.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3">
    <header class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-lg font-black text-primary">{{ dreamTitle }}</h1>
          <p class="truncate text-sm text-base-content/60">{{ selectedSummary }}</p>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            @click="backToGallery"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            All Dreams
          </button>

          <button
            type="button"
            class="btn btn-outline btn-sm rounded-xl"
            :disabled="!dreamStore.selectedDreamId"
            @click="editDream"
          >
            <Icon name="kind-icon:edit" class="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      <nav class="mt-3 flex gap-2 overflow-x-auto">
        <button
          v-for="panel in panels"
          :key="panel.key"
          type="button"
          class="btn btn-sm shrink-0 rounded-2xl"
          :class="workspaceStore.dreamPanel === panel.key ? 'btn-primary text-white' : 'btn-ghost'"
          @click="workspaceStore.setDreamPanel(panel.key)"
        >
          <Icon :name="panel.icon" class="h-4 w-4" />
          {{ panel.label }}
        </button>
      </nav>
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3">
      <div v-if="workspaceStore.dreamPanel === 'asset-sheet'" class="grid gap-3">
        <dream-pitch-sheet
          v-if="dreamStore.selectedDream"
          :key="dreamStore.selectedDream.id"
          :dream="dreamStore.selectedDream"
          variant="detail"
          :auto-load="true"
          :allow-ensure="true"
          :allow-edit="true"
          :allow-actions="true"
          @edit="editDream"
        />

        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h2 class="font-black">Organic Assets</h2>
          <p class="mt-1 text-sm text-base-content/60">
            The selected Dream is the anchor. Use these panels to move through connected Dreams, Scenarios, Characters, Rewards, Art, and Chats.
          </p>
        </section>
      </div>

      <dream-gallery
        v-else-if="workspaceStore.dreamPanel === 'connected-dreams'"
        variant="dashboard"
        title="Connected Dreams"
        subtitle="Dreams linked by shared scenarios, cast, rewards, or collections."
        relation-mode="connected"
        :context-dream-id="dreamStore.selectedDreamId"
        :open-on-select="true"
        :auto-load="false"
        :show-sheet-toolbar="false"
      />

      <scenario-relationship-gallery
        v-else-if="workspaceStore.dreamPanel === 'scenarios'"
        title="Dream Scenarios"
        subtitle="Scenarios connected to this Dream."
        relation-mode="connected"
        :context-dream-id="dreamStore.selectedDreamId"
        :require-dream-context="true"
        :auto-load="false"
      />

      <div v-else-if="workspaceStore.dreamPanel === 'characters'" class="grid gap-3">
        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h2 class="font-black">Dream Cast</h2>
          <p class="mt-1 text-sm text-base-content/60">Characters connected to this Dream.</p>
        </section>
        <dream-list list-type="cast" view-mode="grid" :show-refresh="false" />
      </div>

      <div v-else-if="workspaceStore.dreamPanel === 'rewards'" class="grid gap-3">
        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h2 class="font-black">Dream Rewards</h2>
          <p class="mt-1 text-sm text-base-content/60">Rewards and narrative items connected to this Dream.</p>
        </section>
        <dream-list list-type="items" view-mode="grid" :show-refresh="false" />
      </div>

      <div v-else-if="workspaceStore.dreamPanel === 'art'" class="grid gap-3">
        <dream-art-chooser />
        <dream-list list-type="art" view-mode="grid" :show-refresh="false" />
      </div>

      <div v-else class="grid gap-3">
        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h2 class="font-black">Dream Chat</h2>
          <p class="mt-1 text-sm text-base-content/60">Conversation threads attached to this Dream.</p>
        </section>
        <dream-list list-type="chats" />
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useWorkspaceStore, type DreamWorkspacePanel } from '@/stores/workspaceStore'

const dreamStore = useDreamStore()
const navStore = useNavStore()
const scenarioStore = useScenarioStore()
const workspaceStore = useWorkspaceStore()

const panels: { key: DreamWorkspacePanel; label: string; icon: string }[] = [
  { key: 'asset-sheet', label: 'Sheet', icon: 'kind-icon:sheet' },
  { key: 'connected-dreams', label: 'Dreams', icon: 'kind-icon:dream' },
  { key: 'scenarios', label: 'Scenarios', icon: 'kind-icon:map' },
  { key: 'characters', label: 'Cast', icon: 'kind-icon:mask' },
  { key: 'rewards', label: 'Rewards', icon: 'kind-icon:gift' },
  { key: 'art', label: 'Art', icon: 'kind-icon:image' },
  { key: 'chat', label: 'Chat', icon: 'kind-icon:chat' },
]

const dreamTitle = computed(() => dreamStore.selectedDream?.title || 'No Dream Selected')
const selectedSummary = computed(() => dreamStore.selectedDreamSummary)

watch(
  () => dreamStore.selectedDream?.id,
  (id) => {
    if (id) {
      workspaceStore.openDream(id, workspaceStore.dreamPanel)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  workspaceStore.hydrate()
  await scenarioStore.initialize({ fetchRemote: true, includeSeeds: true })
})

async function editDream() {
  if (!dreamStore.selectedDreamId) return

  await dreamStore.startEditingDream(dreamStore.selectedDreamId)
  navStore.setDashboardTab?.('dream', 'dreammaker')
}

function backToGallery() {
  dreamStore.deselectDream?.()
  workspaceStore.clearDream()
}
</script>
