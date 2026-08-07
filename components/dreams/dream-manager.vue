<!-- /components/content/dreams/dream-manager.vue -->
<template>
  <kr-manager
    dashboard-key="dream"
    :loading="isLoadingManager"
    :error="managerError"
    :loading-label="managerSummary"
    :aliases="{ add: 'dreammaker', maker: 'dreammaker' }"
    @refresh="refreshManagerData"
  >
    <!--
      The daily-dream-generator used to live in a `#persistent` slot here, so
      "Today's Facet Dream" rendered above EVERY Dreams tab and cost a band on
      every visit. Silas, 2026-08-07: "if that's supposed to be part of the
      daily dream index, it shouldn't be here. killing that entire section would
      bring back the space we want, and it's not an option I need or want."

      It belongs to the daily-dream index, not to the Dream browser, so it is
      gone from here rather than shrunk. Nothing else on this page linked to it.
    -->
    <template #dreams>
      <dream-interact
        class="h-full min-h-0 flex-1 overflow-hidden"
        @selected="onDreamSelected"
        @editing="onDreamEditing"
        @created="onDreamCreated"
      />
    </template>

    <template #dreammaker>
      <dream-maker
        class="h-full min-h-0 flex-1 overflow-hidden"
        @saved="onDreamSaved"
        @created="onDreamSaved"
      />
    </template>

    <template #brainstorm>
      <dream-brainstorm class="h-full min-h-0 flex-1 overflow-hidden" />
    </template>
  </kr-manager>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useUploadStore } from '@/stores/uploadStore'

type DreamTab = 'dreams' | 'dreammaker' | 'brainstorm'

const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()
const uploadStore = useUploadStore()
const collectionStore = useCollectionStore()
const artStore = useArtStore()

const dashboardKey = 'dream'

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const managerSummary = computed(() => {
  const selected = dreamStore.selectedDream?.title || 'no Dream selected'

  return `${dreamStore.activeDreams.length}/${dreamStore.creativeDreams.length} active Dreams • ${scenarioStore.scenarios.length} Scenarios • ${selected}`
})

/*
 * The legacy 'interact' / 'gallery' / 'overview' / 'prompts' keys used to be
 * normalised here. kr-manager's fallback resolves any unknown tab to the
 * default ('dreams'), which is where all four already pointed; only 'add' and
 * 'maker' needed to survive as 'dreammaker', and those are declared as
 * `aliases` on the shell above.
 */

function setTab(tab: DreamTab) {
  navStore.setDashboardTab?.(dashboardKey, tab)
}

function onDreamSelected() {
  setupUploadTarget()
}

function onDreamEditing() {
  setupUploadTarget()
  setTab('dreammaker')
}

function onDreamCreated() {
  setTab('dreammaker')
}

async function onDreamSaved(id?: number | number[] | DreamWithRelations) {
  await loadManagerData(true)

  const selectedId = resolveSavedDreamId(id)

  if (selectedId) {
    await dreamStore.selectDreamById(selectedId)
    setupUploadTarget()
    setTab('dreams')
    return
  }

  setTab('dreams')
}

function resolveSavedDreamId(value?: number | number[] | DreamWithRelations) {
  if (typeof value === 'number') return value

  if (Array.isArray(value)) {
    const [firstId] = value
    return typeof firstId === 'number' ? firstId : null
  }

  return typeof value?.id === 'number' ? value.id : null
}

function setupUploadTarget() {
  const dream = dreamStore.selectedDream
  if (!dream) return

  const collectionLabel =
    dream.ArtCollection?.label || dream.title || `Dream ${dream.id}`

  uploadStore.setTarget({
    model: 'Dream',
    modelId: dream.id,
    collectionLabel,
    buttonLabel: 'Upload to Dream',
    icon: 'kind-icon:camera',
    applyCollection: async ({
      collectionLabel: label,
    }: {
      collectionLabel: string
    }) => {
      await collectionStore.fetchCollections?.()

      const collection = collectionStore.collections.find(
        (item: { id?: number; label?: string | null }) => item.label === label,
      )

      if (collection?.id) {
        await dreamStore.updateSelectedDream({ artCollectionId: collection.id })
      }
    },
  })
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      dreamStore.initialize({ force, fetchRemote: true }),
      promptStore.initialize?.(),
      scenarioStore.initialize({
        force,
        fetchRemote: true,
        includeSeeds: true,
      }),
      artStore.initialize?.({
        force,
        hydrateImages: false,
        initializeServerStore: false,
      }),
      collectionStore.fetchCollections(force, {
        includeImages: true,
        imageLimit: 80,
      }),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
    ])

    setupUploadTarget()
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load Dream workspace.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

watch(
  () => dreamStore.selectedDream?.id,
  () => setupUploadTarget(),
)

onMounted(async () => {
  await loadManagerData()
})

onUnmounted(() => {
  uploadStore.clearTarget()
})
</script>
