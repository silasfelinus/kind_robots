<!-- /components/dreams/dream-list.vue -->
<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
  >
    <header
      class="flex shrink-0 items-start justify-between gap-2 border-b border-base-300 bg-base-200 p-3"
    >
      <div class="min-w-0">
        <h3 class="truncate text-lg font-black text-primary">{{ title }}</h3>
        <p class="text-xs text-base-content/60">{{ subtitle }}</p>
      </div>

      <button
        v-if="showRefresh"
        type="button"
        class="btn btn-xs btn-outline rounded-xl"
        :disabled="isLoading"
        @click="refreshList"
      >
        <span v-if="isLoading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="h-3 w-3" />
        {{ refreshLabel }}
      </button>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <!-- Characters → character-card -->
      <div v-if="listType === 'cast'" :class="hasCast ? cardGridClass : ''">
        <template v-if="hasCast">
          <character-card
            v-for="character in dreamStore.selectedDreamCast"
            :key="`character-${character.id}`"
            :character="character"
            compact
            :show-reaction="false"
            :show-description="false"
            :selected="character.id === selectedCharacterId"
            @edit="emit('edit-character', $event)"
            @delete="emit('delete-character', $event)"
          />
        </template>

        <div v-else :class="emptyClass">
          <Icon :name="emptyIcon" class="h-10 w-10 text-primary/60" />
          <div>
            <p class="font-black">{{ emptyTitle }}</p>
            <p class="mt-1">{{ emptyMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Scenarios → scenario-card -->
      <div
        v-else-if="listType === 'scenarios'"
        :class="hasScenarios ? cardGridClass : ''"
      >
        <template v-if="hasScenarios">
          <scenario-card
            v-for="scenario in scenarioList"
            :key="`scenario-${scenario.id}`"
            :scenario="scenario"
            compact
            :show-reaction="false"
            :show-description="false"
            :selected="scenario.id === selectedScenarioId"
            @edit="emit('edit-scenario', $event)"
            @delete="emit('delete-scenario', $event)"
          />
        </template>

        <div v-else :class="emptyClass">
          <Icon :name="emptyIcon" class="h-10 w-10 text-primary/60" />
          <div>
            <p class="font-black">{{ emptyTitle }}</p>
            <p class="mt-1">{{ emptyMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Rewards & items → reward-card -->
      <div
        v-else-if="listType === 'items'"
        :class="hasItems ? cardGridClass : ''"
      >
        <template v-if="hasItems">
          <reward-card
            v-for="reward in dreamStore.selectedDreamItems"
            :key="`reward-${reward.id}`"
            :reward="reward"
            compact
            :show-reaction="false"
            @edit="emit('edit-reward', $event)"
            @delete="emit('delete-reward', $event)"
          />
        </template>

        <div v-else :class="emptyClass">
          <Icon :name="emptyIcon" class="h-10 w-10 text-primary/60" />
          <div>
            <p class="font-black">{{ emptyTitle }}</p>
            <p class="mt-1">{{ emptyMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Art → image-card (robust image loading) -->
      <div v-else-if="listType === 'art'" :class="hasArt ? cardGridClass : ''">
        <template v-if="hasArt">
          <image-card
            v-for="art in artList"
            :key="`art-${art.id}`"
            :art-image="art"
            size="sm"
            :show-actions="false"
            :show-meta="false"
            :show-reaction="false"
            :show-select-button="selectable"
            :selected="art.id === selectedArtImageId"
            @select="onSelectArt"
          />
        </template>

        <div v-else :class="emptyClass">
          <Icon :name="emptyIcon" class="h-10 w-10 text-primary/60" />
          <div>
            <p class="font-black">{{ emptyTitle }}</p>
            <p class="mt-1">{{ emptyMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Chats → compact entry rows -->
      <div v-else-if="entries.length" :class="listLayoutClass">
        <article
          v-for="entry in entries"
          :key="entry.key"
          class="flex gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <img
            v-if="entry.image"
            :src="entry.image"
            :alt="entry.title"
            class="h-16 w-16 rounded-xl object-cover"
            loading="lazy"
          />
          <div
            v-else
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-base-300 text-primary"
          >
            <Icon :name="entry.icon" class="h-7 w-7" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <h4 class="line-clamp-1 font-black text-base-content">
                {{ entry.title }}
              </h4>
              <span v-if="entry.badge" class="badge badge-sm rounded-xl">
                {{ entry.badge }}
              </span>
            </div>
            <p v-if="entry.meta" class="mt-1 text-xs text-base-content/50">
              {{ entry.meta }}
            </p>
            <p
              class="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-base-content/70"
            >
              {{ entry.body }}
            </p>
          </div>
        </article>
      </div>

      <div v-else :class="emptyClass">
        <Icon :name="emptyIcon" class="h-10 w-10 text-primary/60" />
        <div>
          <p class="font-black">{{ emptyTitle }}</p>
          <p class="mt-1">{{ emptyMessage }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { Scenario } from '~/prisma/generated/prisma/client'
import type { ArtImage } from '@/stores/artStore'
import { useDreamStore } from '@/stores/dreamStore'

type DreamListType = 'cast' | 'scenarios' | 'items' | 'art' | 'chats'
type ViewMode = 'compact' | 'grid'

type ListEntry = {
  key: string
  title: string
  body: string
  icon: string
  image?: string
  meta?: string
  badge?: string
}

const props = withDefaults(
  defineProps<{
    listType?: DreamListType
    viewMode?: ViewMode
    autoLoad?: boolean
    showRefresh?: boolean
    selectable?: boolean
    selectedArtImageId?: number | null
    selectedCharacterId?: number | null
    selectedScenarioId?: number | null
  }>(),
  {
    listType: 'chats',
    viewMode: 'compact',
    autoLoad: true,
    showRefresh: true,
    selectable: false,
    selectedArtImageId: null,
    selectedCharacterId: null,
    selectedScenarioId: null,
  },
)

const emit = defineEmits<{
  (event: 'select-art', artImage: ArtImage): void
  (event: 'edit-character', id: number): void
  (event: 'delete-character', id: number): void
  (event: 'edit-scenario', id: number): void
  (event: 'delete-scenario', id: number): void
  (event: 'edit-reward', id: number): void
  (event: 'delete-reward', id: number): void
}>()

const dreamStore = useDreamStore()

const isLoading = computed(() => {
  if (props.listType === 'chats') return dreamStore.chatsLoading
  return dreamStore.loading
})

const title = computed(() => {
  if (props.listType === 'cast') return 'Characters'
  if (props.listType === 'scenarios') return 'Scenarios'
  if (props.listType === 'items') return 'Rewards & Items'
  if (props.listType === 'art') return 'Dream Art'
  return 'Dream Chat'
})

const subtitle = computed(() => {
  if (!dreamStore.selectedDream) return 'Select a Dream first.'
  if (props.listType === 'cast')
    return 'Characters currently attached to this Dream.'
  if (props.listType === 'scenarios')
    return 'Story scenarios and adventures in this Dream.'
  if (props.listType === 'items')
    return 'Rewards, props, and objects in this Dream.'
  if (props.listType === 'art')
    return 'Generated or attached art around this Dream concept.'
  return 'Messages inside this Dream workspace.'
})

const refreshLabel = computed(() =>
  props.listType === 'chats' ? 'Load' : 'Refresh',
)

const emptyIcon = computed(() => {
  if (props.listType === 'cast') return 'kind-icon:user'
  if (props.listType === 'scenarios') return 'kind-icon:map'
  if (props.listType === 'items') return 'kind-icon:gift'
  if (props.listType === 'art') return 'kind-icon:image'
  return 'kind-icon:chat'
})

const emptyTitle = computed(() => {
  if (props.listType === 'cast') return 'No cast yet'
  if (props.listType === 'scenarios') return 'No scenarios yet'
  if (props.listType === 'items') return 'No items yet'
  if (props.listType === 'art') return 'No art linked'
  return 'No chat yet'
})

const emptyMessage = computed(() => {
  if (props.listType === 'cast') return 'Attach characters from Dream Interact.'
  if (props.listType === 'scenarios')
    return 'Attach or generate scenarios for this Dream.'
  if (props.listType === 'items')
    return 'Attach rewards or story objects from Dream Interact.'
  if (props.listType === 'art')
    return 'Generate or upload art to give this Dream a face.'
  return 'Start a public or private Dream chat.'
})

const emptyClass =
  'flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/50'

const cardGridClass = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'

const listLayoutClass = computed(() => {
  return props.viewMode === 'grid'
    ? 'grid grid-cols-1 gap-3 md:grid-cols-2'
    : 'grid gap-3'
})

const hasCast = computed(() => dreamStore.selectedDreamCast.length > 0)
const hasItems = computed(() => dreamStore.selectedDreamItems.length > 0)

const scenarioList = computed<Scenario[]>(() => {
  const dream = dreamStore.selectedDream
  if (!dream) return []
  if (Array.isArray(dream.Scenarios)) return dream.Scenarios
  return dream.Scenario ? [dream.Scenario] : []
})

const hasScenarios = computed(() => scenarioList.value.length > 0)

const artList = computed<ArtImage[]>(() => {
  return (dreamStore.selectedDreamCollectionArt as ArtImage[]).filter(
    (art) => Boolean(art) && Number.isInteger((art as { id?: number }).id),
  )
})

const hasArt = computed(() => artList.value.length > 0)

const entries = computed<ListEntry[]>(() => chatEntries.value)

const chatEntries = computed<ListEntry[]>(() => {
  return dreamStore.selectedDreamChats.map((chat) => ({
    key: `chat-${chat.id}`,
    title:
      chat.title ||
      chat.sender ||
      chat.User?.username ||
      chat.type ||
      'Dream note',
    body: chat.content || chat.botResponse || '',
    icon: chat.type === 'BotResponse' ? 'kind-icon:sparkles' : 'kind-icon:chat',
    image: chat.ArtImage?.fileName || chat.ArtImage?.imagePath || undefined,
    meta: formatChatMeta(chat.createdAt, chat.sender),
    badge: chat.isPublic === false ? 'Private' : chat.type,
  }))
})

onMounted(async () => {
  if (props.autoLoad && props.listType === 'chats') await loadChats()
})

watch(
  () => dreamStore.selectedDreamId,
  async () => {
    if (!props.autoLoad || props.listType !== 'chats') return
    await loadChats()
  },
)

function onSelectArt(artImage: ArtImage) {
  emit('select-art', artImage)
}

async function refreshList() {
  if (props.listType === 'chats') {
    await loadChats()
    return
  }

  if (dreamStore.selectedDreamId) {
    await dreamStore.fetchDreamById(dreamStore.selectedDreamId, true)
  }
}

async function loadChats() {
  if (!dreamStore.selectedDreamId) return
  await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
}

function formatChatMeta(
  createdAt?: Date | string | null,
  sender?: string | null,
) {
  const parts: string[] = []
  if (sender) parts.push(sender)

  if (createdAt) {
    const date = new Date(createdAt)
    if (!Number.isNaN(date.getTime())) parts.push(date.toLocaleString())
  }

  return parts.join(' · ')
}
</script>
