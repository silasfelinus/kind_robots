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
      <div v-if="entries.length" :class="listLayoutClass">
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

      <div
        v-else
        class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/50"
      >
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
import { useDreamStore } from '@/stores/dreamStore'

type DreamListType = 'cast' | 'items' | 'art' | 'chats'
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
  }>(),
  {
    listType: 'chats',
    viewMode: 'compact',
    autoLoad: true,
    showRefresh: true,
  },
)

const dreamStore = useDreamStore()

const isLoading = computed(() => {
  if (props.listType === 'chats') return dreamStore.chatsLoading
  return dreamStore.loading
})

const title = computed(() => {
  if (props.listType === 'cast') return 'Cast'
  if (props.listType === 'items') return 'Rewards & Items'
  if (props.listType === 'art') return 'Dream Art'
  return 'Dream Chat'
})

const subtitle = computed(() => {
  if (!dreamStore.selectedDream) return 'Select a Dream first.'
  if (props.listType === 'cast')
    return 'Characters currently attached to this Dream.'
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
  if (props.listType === 'items') return 'kind-icon:gift'
  if (props.listType === 'art') return 'kind-icon:image'
  return 'kind-icon:chat'
})

const emptyTitle = computed(() => {
  if (props.listType === 'cast') return 'No cast yet'
  if (props.listType === 'items') return 'No items yet'
  if (props.listType === 'art') return 'No art linked'
  return 'No chat yet'
})

const emptyMessage = computed(() => {
  if (props.listType === 'cast') return 'Attach characters from Dream Interact.'
  if (props.listType === 'items')
    return 'Attach rewards or story objects from Dream Interact.'
  if (props.listType === 'art')
    return 'Generate or upload art to give this Dream a face.'
  return 'Start a public or private Dream chat.'
})

const listLayoutClass = computed(() => {
  return props.viewMode === 'grid'
    ? 'grid grid-cols-1 gap-3 md:grid-cols-2'
    : 'grid gap-3'
})

const entries = computed<ListEntry[]>(() => {
  if (props.listType === 'cast') return castEntries.value
  if (props.listType === 'items') return itemEntries.value
  if (props.listType === 'art') return artEntries.value
  return chatEntries.value
})

const castEntries = computed<ListEntry[]>(() => {
  return dreamStore.selectedDreamCast.map((character) => {
    const record = asRecord(character)
    const id = readId(record)

    return {
      key: `character-${id}`,
      title: readString(record, ['name', 'title']) || `Character #${id}`,
      body:
        readString(record, [
          'backstory',
          'description',
          'personality',
          'flavorText',
          'artPrompt',
        ]) || 'No character notes yet.',
      icon: readString(record, ['icon']) || 'kind-icon:user',
      image: readImage(record),
      meta: readString(record, ['species', 'class', 'gender']),
      badge: readBool(record, 'isPublic') === false ? 'Private' : undefined,
    }
  })
})

const itemEntries = computed<ListEntry[]>(() => {
  return dreamStore.selectedDreamItems.map((reward) => {
    const record = asRecord(reward)
    const id = readId(record)

    return {
      key: `reward-${id}`,
      title: readString(record, ['name', 'title', 'label']) || `Reward #${id}`,
      body:
        readString(record, [
          'description',
          'flavorText',
          'power',
          'text',
          'artPrompt',
        ]) || 'No reward notes yet.',
      icon: readString(record, ['icon']) || 'kind-icon:gift',
      image: readImage(record),
      meta: readString(record, ['collection']),
      badge: readString(record, ['rarity', 'rewardType', 'type']),
    }
  })
})

const artEntries = computed<ListEntry[]>(() => {
  return dreamStore.selectedDreamCollectionArt.map((art, index) => {
    const record = asRecord(art)
    const id = readId(record, index + 1)

    return {
      key: `art-${id}`,
      title: readString(record, ['title', 'name']) || `Art #${id}`,
      body:
        readString(record, [
          'promptString',
          'prompt',
          'description',
          'artPrompt',
          'imagePath',
        ]) || 'No art prompt saved.',
      icon: readString(record, ['icon']) || 'kind-icon:image',
      image: readImage(record),
      meta: readString(record, ['designer', 'serverName', 'model']),
      badge: readBool(record, 'isMature') ? 'Mature' : undefined,
    }
  })
})

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

function readId(record: Record<string, unknown>, fallback = 0) {
  const id = Number(record.id)
  return Number.isInteger(id) && id > 0 ? id : fallback
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value))
      return String(value)
  }

  return undefined
}

function readBool(record: Record<string, unknown>, key: string) {
  return typeof record[key] === 'boolean' ? record[key] : undefined
}

function readImage(record: Record<string, unknown>) {
  return readString(record, [
    'imagePath',
    'avatarImage',
    'fileName',
    'path',
    'thumbnailPath',
    'thumbnailData',
  ])
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
