<!-- /components/content/user/friend-gallery.vue -->
<!--
  Replaces user-gallery.vue.
  Shows:
    - All users with isPublic = true (discoverable by anyone)
    - The current user's own profile (if logged in)
  The "friends" framing is aspirational; anyone with a public profile is
  visible here so the community can find each other.
-->
<template>
  <div class="flex flex-col gap-4 p-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold">Community &amp; Friends</h2>
      <span class="text-sm text-base-content/60">
        {{ visibleUsers.length }} public profile{{
          visibleUsers.length !== 1 ? 's' : ''
        }}
      </span>
    </div>

    <!-- Empty state -->
    <div
      v-if="visibleUsers.length === 0"
      class="flex flex-col items-center gap-2 py-12 text-base-content/50"
    >
      <Icon name="kind-icon:person" class="h-12 w-12" />
      <p>No public profiles yet.</p>
    </div>

    <!-- User grid -->
    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <div
        v-for="u in visibleUsers"
        :key="u.id"
        class="card relative rounded-xl bg-base-200 shadow"
        :class="{ 'ring-2 ring-primary': u.id === currentUserId }"
      >
        <!-- "You" badge -->
        <span
          v-if="u.id === currentUserId"
          class="badge badge-primary absolute left-2 top-2 text-[0.65rem]"
        >
          You
        </span>

        <div class="flex flex-col items-center p-4 pt-6">
          <user-avatar :user-id="u.id" class="mb-2 h-20 w-20 rounded-full" />
          <h3 class="text-center text-base font-bold">
            {{ u.designerName || u.username || 'Unknown User' }}
          </h3>
          <p class="text-xs text-base-content/50 uppercase tracking-widest">
            {{ formatRole(u.Role) }}
          </p>

          <div class="mt-3 flex gap-2">
            <button
              class="btn btn-primary btn-sm"
              type="button"
              @click="toggleCollection(u.id)"
            >
              {{ selectedUserId === u.id ? 'Hide' : 'Collection' }}
            </button>

            <button
              v-if="isLoggedIn && u.id !== currentUserId"
              class="btn btn-secondary btn-sm relative"
              type="button"
              @click="sendMessage(u.id)"
            >
              Message
              <span
                v-if="hasUnreadFrom(u.id)"
                class="absolute -right-1 -top-1 flex h-2.5 w-2.5 rounded-full bg-error"
              />
            </button>
          </div>
        </div>

        <!-- Art collection panel -->
        <div v-if="selectedUserId === u.id" class="px-4 pb-4">
          <h4 class="mb-2 text-sm font-semibold">Art Collection</h4>

          <div
            v-if="(userCollections[u.id] ?? []).length > 0"
            class="grid grid-cols-2 gap-2"
          >
            <div
              v-for="art in userCollections[u.id] ?? []"
              :key="art.id"
              class="rounded-md bg-base-100 p-1 shadow-sm"
            >
              <img
                :src="artImages[art.id] || '/images/kindtitle.webp'"
                alt="Art"
                class="h-20 w-full rounded-md object-cover"
                @error="handleImageError(art.id)"
              />
            </div>
          </div>

          <p v-else class="text-sm text-base-content/50">
            No art in collection yet.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useChatStore } from '@/stores/chatStore'
import { useCollectionStore } from '@/stores/collectionStore'

import type {
  ArtImage,
  ArtCollection,
  Chat,
} from '~/prisma/generated/prisma/client'

const userStore = useUserStore()
const artStore = useArtStore()
const chatStore = useChatStore()
const collectionStore = useCollectionStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const currentUserId = computed(() => userStore.user?.id ?? null)

// All users with public profiles, plus the current user regardless
const visibleUsers = computed(() => {
  const all = userStore.users ?? []
  const uid = currentUserId.value

  return all.filter((u) => u.isPublic || u.id === uid)
})

const selectedUserId = ref<number | null>(null)
const userCollections = ref<Record<number, ArtImage[]>>({})
const artImages = ref<Record<number, string>>({})

function formatRole(role: string | null | undefined): string {
  if (!role) return ''
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

async function toggleCollection(userId: number) {
  if (selectedUserId.value === userId) {
    selectedUserId.value = null
    return
  }

  selectedUserId.value = userId

  if (!userCollections.value[userId]) {
    const collections = (await collectionStore.getUserCollections(
      userId,
    )) as ArtCollection[]

    const userArt = collections.flatMap((col: ArtCollection) => {
      const maybeArt = (col as unknown as { artImage?: ArtImage[] }).artImage
      return Array.isArray(maybeArt) ? maybeArt : []
    })

    userCollections.value = { ...userCollections.value, [userId]: userArt }

    const artIds = userArt.map((art: ArtImage) => art.id)
    await fetchArtImages(artIds)
  }
}

async function fetchArtImages(artIds: number[]) {
  const current = (artStore.artImages ?? []) as ArtImage[]
  const uncached = artIds.filter((id) => !current.some((img) => img.id === id))
  if (uncached.length === 0) return
  try {
    await artStore.getArtImagesByIds(uncached)
  } catch (err) {
    console.error('Failed to fetch batch art images', err)
  }
}

function handleImageError(artId: number) {
  artImages.value[artId] = '/images/kindtitle.webp'
}

async function sendMessage(recipientId: number) {
  const me = userStore.user
  if (!me) return

  const originChat = (chatStore.chats ?? []).find(
    (chat: Chat) =>
      chat.userId === me.id &&
      chat.recipientId === recipientId &&
      !!chat.originId,
  )

  await chatStore.addChat({
    type: 'ToUser',
    recipientId,
    content: 'Hello!',
    userId: me.id,
    isPublic: false,
    originId: originChat?.originId ?? null,
    previousEntryId: originChat?.id ?? null,
    characterId: null,
  })
}

// Badge for messages coming *from* a user (i.e., they sent to current user and it's unread)
function hasUnreadFrom(senderId: number): boolean {
  return (chatStore.unreadMessages ?? []).some(
    (msg: Chat) =>
      msg.userId === senderId &&
      msg.recipientId === currentUserId.value &&
      !msg.isRead,
  )
}
</script>
