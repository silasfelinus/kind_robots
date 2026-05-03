<!-- /components/dreams/dream-list.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3">
    <header
      v-if="showHeader"
      class="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="min-w-0">
        <h2 class="truncate text-lg font-bold text-base-content">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="text-sm text-base-content/60">
          {{ subtitle }}
        </p>
      </div>

      <span class="badge badge-ghost shrink-0">
        {{ visibleChats.length }}
      </span>
    </header>

    <div
      v-if="dreamStore.chatsLoading"
      class="flex min-h-40 items-center justify-center rounded-2xl border border-base-300 bg-base-100"
    >
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div
      v-else-if="visibleChats.length === 0"
      class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-4 text-center text-base-content/55"
    >
      <Icon :name="emptyIcon" class="h-10 w-10 text-primary/70" />

      <p class="font-bold">
        {{ emptyTitle }}
      </p>

      <p class="max-w-sm text-sm">
        {{ emptyMessage }}
      </p>
    </div>

    <div v-else class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      <article
        v-for="chat in visibleChats"
        :key="chat.id"
        class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="truncate text-sm font-bold text-primary">
                {{ chat.sender || chat.User?.username || 'Dreamer' }}
              </span>

              <span v-if="chat.type" class="badge badge-outline badge-xs">
                {{ chat.type }}
              </span>

              <span
                v-if="hasImage(chat)"
                class="badge badge-secondary badge-xs"
              >
                Image
              </span>
            </div>

            <p
              v-if="chat.createdAt"
              class="mt-0.5 text-xs text-base-content/40"
            >
              {{ formatDate(chat.createdAt) }}
            </p>
          </div>

          <span class="shrink-0 text-[10px] text-base-content/40">
            #{{ chat.id }}
          </span>
        </div>

        <div
          v-if="showImages && imageSource(chat)"
          class="mb-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200"
        >
          <img
            :src="imageSource(chat)"
            alt="Dream image"
            class="h-48 w-full object-cover"
            loading="lazy"
          />
        </div>

        <p
          v-if="chat.content"
          :class="[
            'whitespace-pre-wrap text-sm leading-relaxed text-base-content/75',
            compact ? 'line-clamp-4' : '',
          ]"
        >
          {{ chat.content }}
        </p>

        <p
          v-if="chat.botResponse && chat.botResponse !== chat.content"
          class="mt-3 whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-sm leading-relaxed text-base-content/75"
        >
          {{ chat.botResponse }}
        </p>

        <div v-if="showMeta" class="mt-3 flex flex-wrap gap-2">
          <span
            v-if="chatCurrentPrompt(chat)"
            class="badge badge-ghost badge-sm"
          >
            Prompt
          </span>

          <span v-if="chatCurrentVibe(chat)" class="badge badge-ghost badge-sm">
            Vibe
          </span>

          <span v-if="chatServerName(chat)" class="badge badge-info badge-sm">
            {{ chatServerName(chat) }}
          </span>

          <span v-if="chatArtId(chat)" class="badge badge-primary badge-sm">
            Art {{ chatArtId(chat) }}
          </span>
        </div>

        <details
          v-if="showDebug"
          class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-2"
        >
          <summary
            class="cursor-pointer text-xs font-bold text-base-content/70"
          >
            Debug
          </summary>

          <pre
            class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70"
            >{{ JSON.stringify(chat, null, 2) }}</pre
          >
        </details>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { DreamChatWithRelations } from '@/stores/dreamStore'
import { useDreamStore } from '@/stores/dreamStore'

type DreamChatMeta = DreamChatWithRelations & {
  currentPrompt?: string | null
  currentVibe?: string | null
  artId?: number | null
  serverName?: string | null
}

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    showHeader?: boolean
    imageOnly?: boolean
    showImages?: boolean
    showMeta?: boolean
    showDebug?: boolean
    compact?: boolean
    limit?: number
    autoLoad?: boolean
    emptyTitle?: string
    emptyMessage?: string
    emptyIcon?: string
  }>(),
  {
    title: 'Dream History',
    subtitle: '',
    showHeader: false,
    imageOnly: false,
    showImages: true,
    showMeta: true,
    showDebug: false,
    compact: false,
    limit: 50,
    autoLoad: true,
    emptyTitle: 'No dream history yet.',
    emptyMessage:
      'Send a nudge, generate an image, or update the prompt to start the trail.',
    emptyIcon: 'kind-icon:moon',
  },
)

const dreamStore = useDreamStore()

const visibleChats = computed<DreamChatWithRelations[]>(() => {
  let chats = [...dreamStore.dreamChats]

  if (props.imageOnly) {
    chats = chats.filter((chat) => {
      return Boolean(
        hasImage(chat) ||
        chatArtId(chat) ||
        chatCurrentPrompt(chat) ||
        chat.content?.toLowerCase().includes('image'),
      )
    })
  }

  return chats.slice(-props.limit).reverse()
})

function asDreamChatMeta(chat: DreamChatWithRelations): DreamChatMeta {
  return chat as DreamChatMeta
}

function chatCurrentPrompt(chat: DreamChatWithRelations) {
  return asDreamChatMeta(chat).currentPrompt ?? null
}

function chatCurrentVibe(chat: DreamChatWithRelations) {
  return asDreamChatMeta(chat).currentVibe ?? null
}

function chatArtId(chat: DreamChatWithRelations) {
  return asDreamChatMeta(chat).artId ?? null
}

function chatServerName(chat: DreamChatWithRelations) {
  return asDreamChatMeta(chat).serverName ?? null
}

function hasImage(chat: DreamChatWithRelations) {
  return Boolean(chat.artImageId || chat.ArtImage)
}

function imageSource(chat: DreamChatWithRelations) {
  const image = chat.ArtImage

  if (!image) return ''

  if (image.imageData && image.fileType) {
    return `data:image/${image.fileType};base64,${image.imageData}`
  }

  if (image.fileName) {
    return image.fileName
  }

  return ''
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString()
}

onMounted(async () => {
  if (!props.autoLoad || !dreamStore.selectedDream?.id) return

  await dreamStore.fetchDreamChats(dreamStore.selectedDream.id)
})
</script>
