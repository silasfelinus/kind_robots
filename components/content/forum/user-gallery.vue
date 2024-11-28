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
            @click="toggleCollection(user.id)"
          >
            {{
              selectedUserId === user.id ? 'Hide Collection' : 'View Collection'
            }}
          </button>
          <button
            class="btn btn-secondary btn-sm relative"
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

      <!-- Inline Collection -->
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

const userStore = useUserStore()
const artStore = useArtStore()
const chatStore = useChatStore()

const users = computed(() => userStore.users || [])
const selectedUserId = ref<number | null>(null)
const userCollections = ref<Record<number, Art[]>>({})
const artImages = ref<Record<number, string>>({})

// Fetch user's art collection on toggle
async function toggleCollection(userId: number) {
  if (selectedUserId.value === userId) {
    selectedUserId.value = null // Hide collection
    return
  }

  selectedUserId.value = userId

  // Fetch user collection only if it hasn't been loaded yet
  if (!userCollections.value[userId]) {
    const collections = await artStore.getUserCollections(userId)
    const userArt = collections.flatMap((collection) => collection.art || [])
    userCollections.value = { ...userCollections.value, [userId]: userArt }

    // Fetch missing art images in bulk
    const artIds = userArt.map((art) => art.id)
    await fetchArtImages(artIds)
  }
}

// Batch fetch images for a list of art IDs
async function fetchArtImages(artIds: number[]) {
  const uncachedIds = artIds.filter((id) => !artImages.value[id])
  if (uncachedIds.length === 0) return

  try {
    const response = await artStore.fetchArtImagesByIds(uncachedIds) // Batch fetch
    response.forEach((artImage) => {
      artImages.value[artImage.id] =
        artImage.imageData || '/images/kindtitle.webp'
    })
  } catch (error) {
    console.error('Failed to fetch batch art images', error)
  }
}

// Handle image loading errors
function handleImageError(artId: number) {
  artImages.value[artId] = '/images/kindtitle.webp'
}

// Determine if art path should be displayed
function shouldShowPath(art: Art): boolean {
  return !art.artImageId && !!art.path
}

// Send message to user
function sendMessage(userId: number) {
  chatStore.addChat({
    type: 'ToUser',
    recipientId: userId,
    content: 'Hello!', // Example default content
    userId: userStore.user?.id || 0, // Sender user ID
    isPublic: false, // Private message
    originId: null, // Optional for threading
    previousEntryId: null, // Optional for threading
  })
}

// Check if there are unread messages from this user
function hasUnreadMessages(userId: number): boolean {
  return chatStore.unreadMessages.some(
    (message) => message.recipientId === userId,
  )
}
</script>
