<template>
  <div class="relative">
    <button class="absolute -top-6 left-3 z-50" @click="toggleSidebar">
      <icon
        :name="isSidebarOpen ? 'lucide:sidebar' : 'lucide:sidebar-open'"
        class="h-6 w-6"
      ></icon>
    </button>
    <!-- Collapsible Sidebar -->
    <aside
      :class="`sidebar flex-shrink-0 transition-width duration-300 ease-in-out overflow-y-auto m-1 p-1 border rounded-2xl bg-secondary ${isSidebarOpen ? 'w-64' : 'w-24'}`"
      :aria-hidden="isSidebarOpen ? 'false' : 'true'"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div
        class="p-4 flex items-center justify-start"
        title="Home"
        @click="toggleSidebar"
      >
        <home-link class="text-xl" />
        <router-link
          v-show="isSidebarOpen"
          to="/home"
          class="ml-2 text-lg font-semibold"
          >Home</router-link
        >
      </div>
      <div
        class="p-4 flex items-center justify-start"
        title="Add Bot"
        @click="toggleSidebar"
      >
        <add-bot-link class="text-xl" />
        <router-link
          v-show="isSidebarOpen"
          to="/addbot"
          class="ml-2 text-lg font-semibold"
          >Add Bot</router-link
        >
      </div>
      <div
        class="p-4 flex items-center justify-start"
        title="Chat with Bots"
        @click="toggleSidebar"
      >
        <bot-chat-link class="text-xl" />
        <router-link
          v-show="isSidebarOpen"
          to="/botcafe"
          class="ml-2 text-lg font-semibold"
          >Chat with Bots</router-link
        >
      </div>
      <div
        class="p-4 flex items-center justify-start"
        title="Bot Messages"
        @click="toggleSidebar"
      >
        <bot-messages-link class="text-xl" />
        <router-link
          v-show="isSidebarOpen"
          to="/botmessages"
          class="ml-2 text-lg font-semibold"
          >Bot Messages</router-link
        >
      </div>
      <div
        class="p-4 flex items-center justify-start"
        title="Hot or Not?"
        @click="toggleSidebar"
      >
        <hot-link class="text-xl" />
        <router-link
          v-show="isSidebarOpen"
          to="/hotornot"
          class="ml-2 text-lg font-semibold"
          >Hot or Not?</router-link
        >
      </div>
      <div
        class="p-4 flex items-center justify-start"
        title="Art Gallery"
        @click="toggleSidebar"
      >
        <art-gallery-link class="text-xl" />
        <router-link
          v-show="isSidebarOpen"
          to="/artgallery"
          class="ml-2 text-lg font-semibold"
          >Art Gallery</router-link
        >
      </div>
      <div
        class="p-4 flex items-center justify-start"
        title="Dashboard"
        @click="toggleSidebar"
      >
        <dashboard-link class="text-xl" />
        <router-link
          v-show="isSidebarOpen"
          to="/dashboard"
          class="ml-2 text-lg font-semibold"
          >Dashboard</router-link
        >
      </div>
      <div
        v-if="showMature"
        class="p-4 flex items-center justify-start"
        title="Mature Content"
        @click="toggleSidebar"
      >
        <icon name="fxemoji:lips" class="text-xl w-6 h-6 md:w-16 md:h-16" />
        <router-link
          v-show="isSidebarOpen"
          to="/mature"
          class="ml-2 text-lg font-semibold"
          >Mature Content</router-link
        >
      </div>
    </aside>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import AddBotLink from './../navigation/AddBotLink.vue'
import BotChatLink from './../navigation/BotChatLink.vue'
import BotMessagesLink from './../navigation/BotMessagesLink.vue'
import ArtGalleryLink from './../navigation/ArtGalleryLink.vue'
import HotLink from './../navigation/HotLink.vue'
import DashboardLink from './../navigation/DashboardLink.vue'

const userStore = useUserStore()
const showMature = computed(() => userStore.showMatureContent)

const isSidebarOpen = ref(true)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>
<style>
.sidebar {
  position: relative;
  flex-shrink: 0;
  transition: width 0.3s ease-in-out;
  overflow-y: auto; /* Allows scrolling within the sidebar */
}

@media (max-width: 768px) {
  .sidebar {
    min-width: 150px;
    max-width: 200px;
  }
}

/* Further responsiveness for smaller devices */
@media (max-width: 480px) {
  .sidebar {
    min-width: 120px;
    width: 100%; /* Sidebar takes full width on very small devices */
  }
}
</style>
