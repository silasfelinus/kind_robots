<!-- /components/dreams/dream-relationship-gallery.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3">
    <header class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-black text-base-content">{{ title }}</h2>
          <p class="truncate text-sm text-base-content/60">{{ subtitleLine }}</p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <span class="badge badge-ghost">{{ filteredDreams.length }}</span>
          <span v-if="resolvedDreamId" class="badge badge-primary badge-sm rounded-xl">
            Dream #{{ resolvedDreamId }}
          </span>

          <select
            v-model="localRelationMode"
            class="select select-bordered select-sm rounded-2xl bg-base-200"
            aria-label="Dream relationship mode"
          >
            <option value="connected">Connected</option>
            <option value="available">Available</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <label class="input input-bordered input-sm mt-3 flex items-center gap-2 rounded-2xl bg-base-200">
        <Icon name="kind-icon:search" class="h-4 w-4 opacity-50" />
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search Dreams"
          placeholder="Search Dreams..."
          class="grow bg-transparent"
        />
      </label>
    </header>

    <section class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="isLoading || dreamStore.loading" class="flex h-full min-h-48 items-center justify-center">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="filteredDreams.length === 0"
        class="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200/50 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:dream" class="h-10 w-10 opacity-50" />
        <div>
          <p class="font-bold">{{ emptyTitle }}</p>
          <p class="mt-1 text-sm opacity-70">{{ emptySubtitle }}</p>
        </div>
      </div>

      <div v-else class="dream-grid">
        <dream-card
          v-for="dream in filteredDreams"
          :key="dream.id"
          :dream="dream"
          :selected="dreamStore.selectedDream?.id === dream.id"
          :is-selected="dreamStore.selectedDream?.id === dream.id"
          :compact="compact"
          :show-image="showImages"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-stats="showStats"
          :allow-edit="allowEdit"
          :allow-delete="allowDelete"
          image-fit="cover"
          @choose="selectDreamAndOpen"
          @edit="startEditingDreamById"
          @delete="handleDreamDeleted"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtCollection, ArtImage, Character, Reward, Scenario } from '~/prisma/generated/prisma/client'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

type RelationMode = 'all' | 'connected' | 'available'

type DreamScenarioWithCharacters = Scenario & {
  Characters?: Partial<Character>[]
}

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    relationMode?: RelationMode
    contextDreamId?: number | null
    showImages?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showStats?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    title: 'Connected Dreams',
    subtitle: 'Dreams related to the active Dream.',
    relationMode: 'connected',
    contextDreamId: null,
    showImages: true,
    showCardActions: true,
    showDescriptions: false,
    showMeta: true,
    showStats: true,
    allowEdit: true,
    allowDelete: false,
    compact: false,
    autoLoad: true,
  },
)

const emit = defineEmits<{
  selected: [dream: DreamWithRelations]
  opened: [dream: DreamWithRelations]
  editing: [dream: DreamWithRelations]
}>()

const dreamStore = useDreamStore()
const navStore = useNavStore()
const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()

const searchQuery = ref('')
const isLoading = ref(false)
const localRelationMode = ref<RelationMode>(props.relationMode)

const currentUserId = computed(() => userStore.userId ?? userStore.user?.id ?? null)
const showMature = computed(() => userStore.user?.showMature ?? userStore.showMature ?? false)

const resolvedDreamId = computed(() => {
  const explicitId = Number(props.contextDreamId)
  if (Number.isInteger(explicitId) && explicitId > 0) return explicitId

  const selectedId = Number(dreamStore.selectedDream?.id)
  if (Number.isInteger(selectedId) && selectedId > 0) return selectedId

  const workspaceId = Number(workspaceStore.dreamId)
  if (Number.isInteger(workspaceId) && workspaceId > 0) return workspaceId

  return null
})

const anchorDream = computed(() => {
  const id = resolvedDreamId.value
  if (!id) return null

  return dreamStore.dreams.find((dream) => dream.id === id) ?? dreamStore.selectedDream ?? null
})

const subtitleLine = computed(() => {
  if (localRelationMode.value === 'connected' && resolvedDreamId.value) {
    return `Dreams connected to Dream #${resolvedDreamId.value}.`
  }

  if (localRelationMode.value === 'available' && resolvedDreamId.value) {
    return `Dreams not currently connected to Dream #${resolvedDreamId.value}.`
  }

  return props.subtitle
})

const visibleDreams = computed<DreamWithRelations[]>(() => {
  let dreams = dreamStore.dreams ?? []

  dreams = dreams.filter((dream) => dream.isActive !== false)

  if (!userStore.isAdmin) {
    dreams = dreams.filter((dream) => {
      return dream.isPublic || (currentUserId.value !== null && dream.userId === currentUserId.value)
    })
  }

  if (!showMature.value) {
    dreams = dreams.filter((dream) => !dream.isMature)
  }

  return dreams
})

const relationDreams = computed<DreamWithRelations[]>(() => {
  if (localRelationMode.value === 'all') {
    return visibleDreams.value.filter((dream) => dream.id !== resolvedDreamId.value)
  }

  const anchor = anchorDream.value
  if (!anchor) return []

  return visibleDreams.value.filter((dream) => {
    if (dream.id === anchor.id) return false

    const connected = dreamsAreConnected(anchor, dream)

    return localRelationMode.value === 'connected' ? connected : !connected
  })
})

const filteredDreams = computed<DreamWithRelations[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return relationDreams.value

  return relationDreams.value.filter((dream) => dreamSearchText(dream).toLowerCase().includes(query))
})

const emptyTitle = computed(() => {
  if (searchQuery.value) return 'No connected Dreams match your search.'
  if (localRelationMode.value === 'connected') return 'No connected Dreams yet.'
  if (localRelationMode.value === 'available') return 'No available Dreams found.'
  return 'No Dreams found.'
})

const emptySubtitle = computed(() => {
  if (searchQuery.value) return 'Try fewer or stranger words.'
  if (localRelationMode.value === 'connected') return 'Shared scenarios, cast, rewards, or collections will appear here.'
  if (localRelationMode.value === 'available') return 'Everything visible already looks connected or filtered out.'
  return 'The Dream shelf is suspiciously empty.'
})

watch(
  () => props.relationMode,
  (mode) => {
    localRelationMode.value = mode
  },
)

onMounted(async () => {
  workspaceStore.hydrate()

  if (props.autoLoad) {
    await refreshDreams()
  }
})

async function refreshDreams(force = false) {
  isLoading.value = true

  try {
    await dreamStore.initialize({ force, fetchRemote: true })
  } finally {
    isLoading.value = false
  }
}

async function selectDreamAndOpen(dream: DreamWithRelations | number) {
  const id = typeof dream === 'number' ? dream : dream.id

  if (!Number.isInteger(id) || id <= 0) return

  const selected = await dreamStore.selectDreamById(id)
  if (!selected) return

  workspaceStore.openDream(id, 'asset-sheet')
  await dreamStore.fetchArtForDream(id)

  emit('selected', selected)
  emit('opened', selected)
}

async function startEditingDreamById(id: number) {
  const dream = await dreamStore.startEditingDream(id)
  if (!dream) return

  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('editing', dream)
}

async function handleDreamDeleted(id: number) {
  const result = await dreamStore.deleteDream(id)

  if (result.success && dreamStore.selectedDream?.id === id) {
    dreamStore.deselectDream?.()
    workspaceStore.clearDream()
  }

  await refreshDreams(true)
}

function dreamsAreConnected(a: DreamWithRelations, b: DreamWithRelations) {
  return (
    overlaps(scenarioIds(a), scenarioIds(b)) ||
    overlaps(characterIds(a), characterIds(b)) ||
    overlaps(rewardIds(a), rewardIds(b)) ||
    overlaps(collectionIds(a), collectionIds(b))
  )
}

function scenarioIds(dream: DreamWithRelations) {
  return uniqueIds([
    dream.scenarioId,
    dream.Scenario?.id,
    ...((dream.Scenarios ?? []) as DreamScenarioWithCharacters[]).map((scenario) => scenario.id),
  ])
}

function characterIds(dream: DreamWithRelations) {
  return uniqueIds((dream.Characters ?? []).map((character) => character.id))
}

function rewardIds(dream: DreamWithRelations) {
  return uniqueIds((dream.Rewards ?? []).map((reward: Reward) => reward.id))
}

function collectionIds(dream: DreamWithRelations) {
  return uniqueIds([
    dream.artCollectionId,
    dream.ArtCollection?.id,
    ...((dream.ArtCollections ?? []) as ArtCollection[]).map((collection) => collection.id),
  ])
}

function uniqueIds(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  )
}

function overlaps(a: number[], b: number[]) {
  if (!a.length || !b.length) return false

  const set = new Set(a)
  return b.some((id) => set.has(id))
}

function dreamSearchText(dream: DreamWithRelations) {
  const scenarioText = (dream.Scenarios ?? [])
    .map((scenario) => [scenario.title, scenario.description, scenario.locations, scenario.genres].filter(Boolean).join(' '))
    .join(' ')

  const characterText = (dream.Characters ?? [])
    .map((character) => [character.name, character.honorific, character.title, character.role, character.class, character.species, character.genre].filter(Boolean).join(' '))
    .join(' ')

  const rewardText = (dream.Rewards ?? [])
    .map((reward: Reward) => [reward.name, reward.description, reward.rarity, reward.rewardType].filter(Boolean).join(' '))
    .join(' ')

  return [
    dream.title,
    dream.slug,
    dream.pitch,
    dream.description,
    dream.flavorText,
    dream.artPrompt,
    dream.examples,
    dream.designer,
    dream.dreamType,
    scenarioText,
    characterText,
    rewardText,
    previewImage(dream),
  ]
    .filter(Boolean)
    .join(' ')
}

function previewImage(dream: DreamWithRelations) {
  const collectionImage = [
    ...(dream.ArtImages ?? []),
    ...(dream.ArtCollection?.ArtImages ?? []),
    ...(dream.ArtCollections ?? []).flatMap((collection) => collection.ArtImages ?? []),
  ].find((art: Partial<ArtImage>) => art.imagePath || art.path || art.fileName)

  return (
    dream.imagePath ||
    dream.highlightImage ||
    dream.ArtImage?.imagePath ||
    dream.ArtImage?.path ||
    dream.ArtImage?.fileName ||
    collectionImage?.imagePath ||
    collectionImage?.path ||
    collectionImage?.fileName ||
    ''
  )
}
</script>

<style scoped>
.dream-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
  align-items: stretch;
}

.dream-grid > * {
  min-height: 20rem;
}
</style>
