<!-- /components/dreams/dream-list.vue -->
<template>
  <section
    class="flex min-h-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
  >
    <header
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            {{ title }}
          </p>

          <span class="badge badge-primary rounded-2xl">
            {{ entries.length }}
          </span>
        </div>

        <h3 class="mt-1 line-clamp-2 text-xl font-black text-base-content">
          {{ dreamStore.selectedDream?.title || 'No Dream selected' }}
        </h3>

        <p class="mt-1 max-w-2xl text-sm text-base-content/60">
          {{ subtitle }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <div class="join">
          <button
            class="btn btn-sm join-item rounded-l-2xl"
            :class="viewMode === 'compact' ? 'btn-primary' : 'btn-ghost'"
            type="button"
            title="Compact view"
            @click="viewMode = 'compact'"
          >
            <Icon name="kind-icon:list" class="h-4 w-4" />
          </button>

          <button
            class="btn btn-sm join-item rounded-r-2xl"
            :class="viewMode === 'roomy' ? 'btn-primary' : 'btn-ghost'"
            type="button"
            title="Roomy view"
            @click="viewMode = 'roomy'"
          >
            <Icon name="kind-icon:grid" class="h-4 w-4" />
          </button>
        </div>

        <button
          class="btn btn-sm btn-secondary rounded-2xl"
          type="button"
          :disabled="!dreamStore.selectedDreamId || isLoading"
          @click="refreshList"
        >
          <Icon
            name="kind-icon:refresh"
            class="h-4 w-4"
            :class="isLoading ? 'animate-spin' : ''"
          />
          {{ refreshLabel }}
        </button>
      </div>
    </header>

    <div
      v-if="dreamStore.selectedDream"
      class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"
    >
      <div
        v-for="stat in contextStats"
        :key="stat.label"
        class="rounded-2xl border border-base-300 bg-base-200 p-2"
      >
        <div class="flex items-center gap-1 text-base-content/50">
          <Icon :name="stat.icon" class="h-4 w-4" />
          <span class="font-bold uppercase tracking-wide">
            {{ stat.label }}
          </span>
        </div>

        <div class="mt-1 text-lg font-black text-secondary">
          {{ stat.value }}
        </div>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto pr-1" :class="listLayoutClass">
      <article
        v-for="entry in entries"
        :key="entry.key"
        class="group rounded-2xl border border-base-300 bg-base-200 p-3 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-base-100 hover:shadow"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <img
              v-if="entry.image"
              :src="entry.image"
              class="h-full w-full object-cover"
              :alt="entry.title"
            />

            <Icon
              v-else
              :name="entry.icon"
              class="h-7 w-7 text-primary transition group-hover:scale-110"
            />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <h4 class="line-clamp-2 font-black text-secondary">
                  {{ entry.title }}
                </h4>

                <p
                  v-if="entry.meta"
                  class="mt-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/40"
                >
                  {{ entry.meta }}
                </p>
              </div>

              <span v-if="entry.badge" class="badge badge-outline rounded-2xl">
                {{ entry.badge }}
              </span>
            </div>

            <p
              class="mt-2 text-sm leading-relaxed text-base-content/70"
              :class="viewMode === 'compact' ? 'line-clamp-3' : 'line-clamp-6'"
            >
              {{ entry.body }}
            </p>
          </div>
        </div>
      </article>

      <div
        v-if="!entries.length"
        class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-sm text-base-content/60"
      >
        <Icon :name="emptyIcon" class="h-14 w-14 text-primary/70" />

        <div>
          <h4 class="text-lg font-black text-base-content">
            {{ emptyTitle }}
          </h4>

          <p class="mt-1 max-w-md">
            {{ emptyMessage }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

type DreamListType = 'cast' | 'items' | 'art' | 'chats'
type ViewMode = 'compact' | 'roomy'

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
    autoLoad?: boolean
  }>(),
  {
    listType: 'chats',
    autoLoad: true,
  },
)

const dreamStore = useDreamStore()
const viewMode = ref<ViewMode>('compact')

const isLoading = computed(() => {
  if (props.listType === 'chats') return dreamStore.chatsLoading
  return dreamStore.loading
})

const title = computed(() => {
  if (props.listType === 'cast') return 'Cast in Location'
  if (props.listType === 'items') return 'Items in Location'
  if (props.listType === 'art') return 'Scene Assets'
  return 'Room History'
})

const subtitle = computed(() => {
  if (props.listType === 'cast') {
    return 'Characters linked to this Dream as residents, visitors, guides, rivals, or suspiciously charming disasters.'
  }

  if (props.listType === 'items') {
    return 'Rewards available inside this location as tools, relics, plot twists, or cursed teapots.'
  }

  if (props.listType === 'art') {
    return 'Visual assets attached to this Dream through its active image or ArtCollection.'
  }

  return 'The timeline of what has happened inside this Dream location.'
})

const refreshLabel = computed(() => {
  if (props.listType === 'chats') return 'Load'
  return 'Refresh'
})

const emptyIcon = computed(() => {
  if (props.listType === 'cast') return 'kind-icon:users'
  if (props.listType === 'items') return 'kind-icon:gift'
  if (props.listType === 'art') return 'kind-icon:image'
  return 'kind-icon:chat'
})

const emptyTitle = computed(() => {
  if (props.listType === 'cast') return 'No cast linked'
  if (props.listType === 'items') return 'No items linked'
  if (props.listType === 'art') return 'No scene art linked'
  return 'No room history yet'
})

const emptyMessage = computed(() => {
  if (props.listType === 'cast') {
    return 'The room is empty, which is either peaceful or the first warning sign. Link Characters when the cast picker is ready.'
  }

  if (props.listType === 'items') {
    return 'Add Rewards when the item picker lands. A haunted location without loot is just real estate.'
  }

  if (props.listType === 'art') {
    return 'The Dream is still wearing placeholder pajamas. Generate or attach art assets to give it a face.'
  }

  return 'Say something ominous but useful. The wallpaper is listening politely.'
})

const listLayoutClass = computed(() => {
  if (viewMode.value === 'compact') return 'space-y-3'
  return 'grid grid-cols-1 gap-3 2xl:grid-cols-2'
})

const contextStats = computed(() => [
  {
    label: 'Cast',
    value:
      dreamStore.selectedDream?._count?.Characters ??
      dreamStore.selectedDreamCast.length,
    icon: 'kind-icon:users',
  },
  {
    label: 'Items',
    value:
      dreamStore.selectedDream?._count?.Rewards ??
      dreamStore.selectedDreamItems.length,
    icon: 'kind-icon:gift',
  },
  {
    label: 'Art',
    value: dreamStore.selectedDreamCollectionArt.length,
    icon: 'kind-icon:image',
  },
  {
    label: 'Notes',
    value:
      dreamStore.selectedDream?._count?.Chats ??
      dreamStore.selectedDreamChats.length,
    icon: 'kind-icon:chat',
  },
])

const entries = computed<ListEntry[]>(() => {
  if (props.listType === 'cast') {
    return dreamStore.selectedDreamCast.map((character) => ({
      key: `character-${character.id}`,
      title: character.name || `Character #${character.id}`,
      body:
        character.personality ||
        character.backstory ||
        character.species ||
        'A linked Character waiting for narrative mischief.',
      icon: 'kind-icon:users',
      image: character.imagePath || undefined,
      meta: [character.species, character.class, character.honorific]
        .filter(Boolean)
        .join(' · '),
      badge: character.isMature ? 'Mature' : undefined,
    }))
  }

  if (props.listType === 'items') {
    return dreamStore.selectedDreamItems.map((reward) => ({
      key: `reward-${reward.id}`,
      title: reward.label || reward.text || `Reward #${reward.id}`,
      body:
        reward.power ||
        reward.collection ||
        'A linked Reward with suspicious potential.',
      icon: reward.icon || 'kind-icon:gift',
      image: reward.imagePath || undefined,
      meta: reward.collection || undefined,
      badge:
        typeof reward.rarity === 'number'
          ? `Rarity ${reward.rarity}`
          : undefined,
    }))
  }

  if (props.listType === 'art') {
    return dreamStore.selectedDreamCollectionArt.map((art) => ({
      key: `art-${art.id}`,
      title: `Art #${art.id}`,
      body:
        art.promptString ||
        art.imagePath ||
        'Scene asset linked to this Dream.',
      icon: 'kind-icon:image',
      image: art.imagePath || undefined,
      meta: art.designer || art.serverName || undefined,
      badge: art.isMature ? 'Mature' : undefined,
    }))
  }

  return dreamStore.selectedDreamChats.map((chat) => ({
    key: `chat-${chat.id}`,
    title: chat.title || chat.sender || chat.type,
    body: chat.content,
    icon: chat.type === 'BotResponse' ? 'kind-icon:sparkles' : 'kind-icon:chat',
    image: chat.ArtImage?.fileName || undefined,
    meta: formatChatMeta(chat.createdAt, chat.sender),
    badge: chat.type,
  }))
})

onMounted(async () => {
  if (props.autoLoad && props.listType === 'chats') {
    await loadChats()
  }
})

watch(
  () => dreamStore.selectedDreamId,
  async (dreamId) => {
    if (!dreamId || !props.autoLoad || props.listType !== 'chats') return
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

  await dreamStore.fetchDreamChats({
    dreamId: dreamStore.selectedDreamId,
  })
}

function formatChatMeta(
  createdAt: Date | string | null | undefined,
  sender?: string | null,
) {
  const parts: string[] = []

  if (sender) parts.push(sender)

  if (createdAt) {
    const date = new Date(createdAt)

    if (!Number.isNaN(date.getTime())) {
      parts.push(
        new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(date),
      )
    }
  }

  return parts.join(' · ')
}
</script>
