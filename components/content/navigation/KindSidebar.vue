<template>
  <div class="relative">
    <button class="absolute top-3 left-3 z-50" @click="toggleSidebar">
      <icon :name="isSidebarOpen ? 'lucide:sidebar' : 'lucide:sidebar-open'" class="icon-base text-gray-500"></icon>
    </button>
    <!-- Collapsible Sidebar -->
    <aside
      :class="`sidebar flex-col flex-shrink-0 transition-width duration-300 ease-in-out overflow-y-scroll m-1 p-1 border rounded-2xl bg-base-200 ${isSidebarOpen ? 'w-64' : 'w-24'}`"
      :aria-hidden="isSidebarOpen ? 'false' : 'true'"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div v-for="link in filteredLinks" :key="link.title" @click="toggleSidebar" class="icon-link-container">
        <NuxtLink
          :to="link.path"
          :class="[
            'flex',
            'items-center',
            'justify-center',
            'rounded-2xl',
            'text-center',
            'hover:scale-110',
            'hover:glow-animation',
            isCurrentPage(link.path) ? 'text-gray-400' : '',
          ]"
        >
          <icon :name="link.icon" class="icon-base cursor-pointer transition-shadow"></icon>
        </NuxtLink>
      </div>
      <smart-links class="text-center flex-grow justify text-xl" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore' // Update the path as necessary
import { useContentStore } from './../../../stores/contentStore'

const userStore = useUserStore();
const contentStore = useContentStore();
const showMature = computed(() => userStore.showMatureContent);
const isSidebarOpen = ref(true);

const links = [
  { title: 'Home', path: '/home', icon: 'heroicons-outline:home' },
  { title: 'Add Bot', path: '/addbot', icon: 'fluent:bot-add-20-regular' },
  { title: 'Chat with Bots', path: '/botcafe', icon: 'mdi:chat-processing' },
  { title: 'Bot Messages', path: '/botmessages', icon: 'fluent:chat-multiple-24-regular' },
  { title: 'Hot or Not?', path: '/hotornot', icon: 'emojione-monotone:fire' },
  { title: 'Art Gallery', path: '/artgallery', icon: 'mdi:palette' },
  { title: 'Dashboard', path: '/dashboard', icon: 'ant-design:dashboard-outline' },
  { title: 'Mature Content', path: '/mature', icon: 'fxemoji:lips', condition: 'showMature' }
];

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

const filteredLinks = computed(() => {
  return links.filter(link => !link.condition || (link.condition === 'showMature' && showMature.value));
});

const isCurrentPage = (path) => {
  return contentStore.currentPage?._path === path;
};
</script>

<style scoped>
.icon-link-container .hover:glow-animation:hover {
  animation: glow 1.5s infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.75);
  }
  50% {
    box-shadow:
      0 0 20px rgba(255, 115, 253, 0.75),
      0 0 30px rgba(255, 115, 253, 0.75);
  }
}
</style>