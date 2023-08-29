<template>
  <div>
    <!-- Floating Toggles with Icons -->
    <div class="fixed top-4 left-4">
      <button class="bg-blue-500 p-2 rounded-full shadow" @click="showModal('home')">
        <icon name="mdi:home" class="text-white" />
      </button>
    </div>
    <div class="fixed top-4 right-4">
      <button class="bg-blue-500 p-2 rounded-full shadow" @click="showModal('nav')">
        <icon name="mdi:navigation" class="text-white" />
      </button>
    </div>
    <div class="fixed bottom-4 right-4">
      <button class="bg-blue-500 p-2 rounded-full shadow" @click="showModal('chat')">
        <icon name="mdi:chat" class="text-white" />
      </button>
    </div>
    <div class="fixed bottom-4 left-4">
      <button class="bg-blue-500 p-2 rounded-full shadow" @click="showModal('bot')">
        <icon name="mdi:robot" class="text-white" />
      </button>
    </div>

    <!-- Modals -->
    <div
      v-if="activeModal === 'home'"
      class="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center"
    >
      <div class="bg-white p-8 rounded shadow-lg w-1/2">
        <h1>Home Content</h1>
        <p>This is the content for the Home modal.</p>
        <button class="mt-4 bg-red-500 text-white p-2 rounded" @click="closeModal">Close</button>
      </div>
    </div>

    <div
      v-if="activeModal === 'nav'"
      class="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center"
    >
      <div class="bg-white p-8 rounded shadow-lg w-1/2">
        <h1>Navigation Content</h1>
        <p>This is the content for the Navigation modal.</p>
        <button class="mt-4 bg-red-500 text-white p-2 rounded" @click="closeModal">Close</button>
      </div>
    </div>
    <div
      v-if="activeModal === 'chat'"
      class="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center"
    >
      <div class="bg-white p-8 rounded shadow-lg w-1/2">
        <h1>Chat Content</h1>
        <p>This is the content for the Chat modal.</p>
        <button class="mt-4 bg-red-500 text-white p-2 rounded" @click="closeModal">Close</button>
      </div>
    </div>
    <div
      v-if="activeModal === 'bot'"
      class="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center"
    >
      <div class="bg-white p-8 rounded shadow-lg w-1/2">
        <h1>Bot Content</h1>
        <p>This is the content for the Bot modal.</p>
        <button class="mt-4 bg-red-500 text-white p-2 rounded" @click="closeModal">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeModal = ref<string | null>(null)

const showModal = (modal: string) => {
  activeModal.value = modal
}

const closeModal = () => {
  activeModal.value = null
}
</script>
