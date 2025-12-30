<!-- /components/content/user/user-gallery.vue -->
<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
    <div
      v-for="user in users"
      :key="user.id"
      class="card rounded-xl shadow bg-base-200 relative"
    >
      <div class="flex flex-col items-center p-4">
        <user-avatar :user-id="user.id" class="rounded-full w-24 h-24 mb-2" />
        <h3 class="text-lg font-bold">
          {{ user.designerName || user.username || 'Unknown User' }}
        </h3>
        <div class="flex gap-2 mt-4">
          <button
            class="btn btn-primary btn-sm"
            type="button"
            @click="toggleCollection(user.id)"
          >
            {{
              selectedUserId === user.id ? 'Hide Collection' : 'View Collection'
            }}
          </button>
          <button
            class="btn btn-secondary btn-sm relative"
            type="button"
            @click="sendMessage(user.id)"
          >
            Message
            <span
              v-if="hasUnreadMessages(user.id)"
              class="badge badge-error absolute top-0 right-0"
            >
              !
            </span>
          </button>
        </div>
      </div>

      <div v-if="selectedUserId === user.id" class="p-4">
        <h4 class="text-lg font-semibold">Art Collection</h4>

        <div
          v-if="userCollections[user.id]?.length > 0"
          class="grid grid-cols-2 gap-2 mt-2"
        >
          <div
            v-for="art in userCollections[user.id]"
            :key="art.id"
            class="item rounded-md shadow-sm p-2 bg-base-200"
          >
            <img
              :src="artImages[art.id] || '/images/kindtitle.webp'"
              alt="Art"
              class="w-full h-24 object-cover rounded-md"
              @error="handleImageError(art.id)"
            />
            <p class="text-sm mt-1">
              {{ shouldShowPath(art) ? art.path : 'Untitled' }}
            </p>
          </div>
        </div>

        <p v-else class="text-gray-500 mt-2">No items in collection.</p>
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

import type { Art, ArtImage, ArtCollection, Chat } from '@prisma/client'

const userStore = useUserStore()
const artStore = useArtStore()
const chatStore = useChatStore()
const collectionStore = useCollectionStore()

const users = computed(() => userStore.users || [])
const selectedUserId = ref<number | null>(null)

const userCollections = ref<Record<number, Art[]>>({})
const artImages = ref<Record<number, string>>({})

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

    const userArt = collections.flatMap((collection: ArtCollection) => {
      const maybeArt = (collection as unknown as { art?: Art[] }).art
      return Array.isArray(maybeArt) ? maybeArt : []
    })

    userCollections.value = { ...userCollections.value, [userId]: userArt }

    const artIds = userArt.map((art: Art) => art.id)
    await fetchArtImages(artIds)
  }
}

async function fetchArtImages(artIds: number[]) {
  const currentImages = (artStore.artImages || []) as ArtImage[]

  const uncachedIds = artIds.filter((id: number) => {
    return !currentImages.some((img: ArtImage) => img.id === id)
  })

  if (uncachedIds.length === 0) return

  try {
    await artStore.getArtImagesByIds(uncachedIds)
  } catch (error) {
    console.error('Failed to fetch batch art images', error)
  }
}

function handleImageError(artId: number) {
  artImages.value[artId] = '/images/kindtitle.webp'
}

function shouldShowPath(art: Art): boolean {
  return !art.artImageId && !!art.path
}

async function sendMessage(userId: number) {
  try {
    const currentUser = userStore.user
    if (!currentUser) {
      console.error('No current user available for sending a message.')
      return
    }

    const originChat = (chatStore.chats || []).find((chat: Chat) => {
      return (
        chat.userId === currentUser.id &&
        chat.recipientId === userId &&
        !!chat.originId
      )
    })

    await chatStore.addChat({
      type: 'ToUser',
      recipientId: userId,
      content: 'Hello!',
      userId: currentUser.id,
      isPublic: false,
      originId: originChat ? originChat.originId : null,
      previousEntryId: originChat ? originChat.id : null,
      characterId: null,
    })
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

function hasUnreadMessages(userId: number): boolean {
  const unread = (chatStore.unreadMessages || []) as Chat[]
  return unread.some((message: Chat) => {
    return message.recipientId === userId && !message.isRead
  })
}
</script>
