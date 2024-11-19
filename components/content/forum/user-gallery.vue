<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
    <div
      v-for="user in users"
      :key="user.id"
      class="card rounded-xl shadow bg-base-200 relative"
    >
      <div class="flex flex-col items-center p-4">
        <user-avatar :id="user.id" class="rounded-full w-24 h-24 mb-2" />
        <h3 class="text-lg font-bold">
          {{ user.designerName || user.username }}
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
              :src="getArtImage(art.id)"
              alt="Art"
              class="w-full h-24 object-cover rounded-md"
            />
            <p class="text-sm mt-1">{{ art.path || 'Untitled' }}</p>
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

const users = computed(() => userStore.users)
const selectedUserId = ref<number | null>(null)
const userCollections = ref<Record<number, Art[]>>({})

// Fetch user's art collection on toggle
async function toggleCollection(userId: number) {
  if (selectedUserId.value === userId) {
    selectedUserId.value = null // Hide collection
    return
  }

  selectedUserId.value = userId
  if (!userCollections.value[userId]) {
    const collections = await artStore.getUserCollections(userId)
    const userArt = collections.flatMap((collection) => collection.art)
    userCollections.value = { ...userCollections.value, [userId]: userArt }
  }
}

// Get art image URL
function getArtImage(artId: number): string {
  const artImage = artStore.getArtImageById(artId)
  return artImage?.imageData || '/images/default-art.png'
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
