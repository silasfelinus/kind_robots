<template>
  <div class="relative">
    <button class="flex items-start" @click="toggleSidebar">
      <Icon
        :name="isSidebarOpen ? 'lucide:sidebar' : 'lucide:sidebar-open'"
        class="Icon-base text-gray-500"
      ></Icon>
    </button>
    <!-- Collapsible Sidebar -->
    <aside
      :class="`sidebar flex-col flex-shrink-0 transition-width duration-300 ease-in-out overflow-y-scroll m-1 p-1 border rounded-2xl bg-base-200 ${isSidebarOpen ? 'w-64' : 'w-24'}`"
      :aria-hidden="isSidebarOpen ? 'false' : 'true'"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div
        v-for="link in filteredLinks"
        :key="link.title"
        class="Icon-link-container mt-5"
        @click="toggleSidebar"
      >
        <NuxtLink
          :to="link.path"
          :class="[
            'flex',
            'items-center',
            'justify-start',
            'rounded-2xl',
            'text-center',
            'hover:scale-110',
            'hover:glow-animation',
            isCurrentPage(link.path) ? 'text-gray-400' : 'text-gray-900',
            'w-full',
          ]"
        >
          <Icon
            :name="link.Icon"
            class="Icon-lg mr-2 cursor-pointer transition-shadow"
          ></Icon>
          <span v-show="isSidebarOpen" class="text-lg font-semibold">{{
            link.title
          }}</span>
        </NuxtLink>
      </div>
      <smart-links class="text-center flex-grow justify text-xl" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from './../../../stores/userStore' // Update the path as necessary
import { useContentStore } from './../../../stores/contentStore'

const userStore = useUserStore()
const contentStore = useContentStore()
const showMature = computed(() => userStore.showMatureContent)
const isSidebarOpen = ref(true)

const links = [
  { title: 'Home', path: '/home', Icon: 'heroIcons-outline:home' },
  { title: 'Add Bot', path: '/addbot', Icon: 'fluent:bot-add-20-regular' },
  { title: 'Chat with Bots', path: '/botcafe', Icon: 'mdi:chat-processing' },
  {
    title: 'Bot Messages',
    path: '/botmessages',
    Icon: 'fluent:chat-multiple-24-regular',
  },
  { title: 'Hot or Not?', path: '/hotornot', Icon: 'emojione-monotone:fire' },
  { title: 'Art Gallery', path: '/artgallery', Icon: 'mdi:palette' },
  {
    title: 'Dashboard',
    path: '/dashboard',
    Icon: 'ant-design:dashboard-outline',
  },
  {
    title: 'Mature Content',
    path: '/mature',
    Icon: 'fxemoji:lips',
    condition: 'showMature',
  },
]

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

const filteredLinks = computed(() => {
  return links.filter(
    (link) =>
      !link.condition || (link.condition === 'showMature' && showMature.value),
  )
})

const isCurrentPage = (path: string) => {
  return contentStore.currentPage?._path === path
}
</script>

<style>
.Icon-link-container {
  /* Ensuring that each link container uses full width for alignment and spacing */
  width: 100%;
  padding: 0.5rem;
}

.Icon-link-container .hover:glow-animation:hover {
  /* Glow effect when hovering over the Icons */
  animation: glow 1.5s infinite;
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.75);
  }
  50% {
    box-shadow:
      0 0 20px rgba(255, 115, 253, 0.75),
      0 0 30px rgba(255, 115, 253, 0.75);
  }
}

/* Text styling and layout adjustments for when the sidebar is open */
.nuxt-link {
  display: flex;
  align-items: center;
  width: 100%;
  color: inherit; /* Ensure text color is inherited for consistency */
  text-decoration: none; /* Remove underline from links */
}

.nuxt-link:hover {
  text-decoration: none; /* Ensure no underline appears on hover */
}
</style>
