<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
    <div
      v-for="user in users"
      :key="user.id"
      class="card rounded-xl shadow bg-base-200"
    >
      <div class="flex flex-col items-center p-4">
        <user-picture :id="user.id" class="rounded-full w-24 h-24 mb-2" />
        <h3 class="text-lg font-bold">{{ user.designerName || user.username }}</h3>
        <div class="flex gap-2 mt-4">
          <button
            class="btn btn-primary btn-sm"
            @click="viewCollection(user.id)"
          >
            View Collection
          </button>
          <button
            class="btn btn-secondary btn-sm"
            @click="sendMessage(user.id)"
          >
            Message
          </button>
        </div>
      </div>
      <!-- Inline Collection -->
      <user-collection
        v-if="selectedUserId === user.id"
        :user-id="user.id"
        class="mt-4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useChatStore } from '@/stores/chatStore'


const userStore = useUserStore()
const chatStore = useChatStore()

const users = computed(() => userStore.users)
const selectedUserId = ref<number | null>(null)

function viewCollection(userId: number) {
  selectedUserId.value = selectedUserId.value === userId ? null : userId
}

function sendMessage(userId: number) {
  chatStore.createChat({
    type: 'ToUser',
    recipientId: userId,
  })
}
</script>
