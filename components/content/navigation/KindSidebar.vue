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
        class="Icon-link-container"
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
            :name="link.icon"
            class="icon-base mr-1 cursor-pointer transition-shadow"
          ></Icon>
          <span v-show="isSidebarOpen" class="text-lg font-semibold">{{
            link.title
          }}</span>
        </NuxtLink>
      </div>
      <smart-links
        v-show="isSidebarOpen"
        class="text-center flex-grow justify text-xl"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useContentStore } from './../../../stores/contentStore'

const userStore = useUserStore()
const contentStore = useContentStore()
const showMature = computed(() => userStore.showMatureContent)
const isSidebarOpen = ref(true)

const links = [
  { title: 'Home', path: '/home', icon: 'line-md:home-md-twotone' },
  { title: 'Add Bot', path: '/addbot', icon: 'fluent:bot-add-20-regular' },
  { title: 'Chat with Bots', path: '/botcafe', icon: 'mdi:chat-processing' },
  {
    title: 'Bot Messages',
    path: '/botmessages',
    icon: 'fluent:chat-multiple-24-regular',
  },
  { title: 'Hot or Not?', path: '/hotornot', icon: 'emojione-monotone:fire' },
  { title: 'Art Gallery', path: '/artgallery', icon: 'mdi:palette' },
  {
    title: 'Memory Match',
    path: '/memory',
    icon: 'material-symbols:art-track-outline-rounded',
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'mingcute:settings-6-fill',
  },
  {
    title: 'Mature Content',
    path: '/mature',
    icon: 'fxemoji:lips',
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
/* Basic styles for icon containers and hover effects */
.Icon-link-container {
  width: 100%;
  padding: 0.5rem;
}

.Icon-link-container .hover:glow-animation:hover {
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

/* Adjusting sidebar and text styles */
.sidebar {
  transition:
    width 0.3s ease-in-out,
    padding 0.3s ease-in-out;
}

.nuxt-link {
  display: flex;
  align-items: center;
  width: 100%;
  color: inherit;
  text-decoration: none;
}

.nuxt-link:hover {
  text-decoration: none;
}

.sidebar {
  transition: width 0.3s ease-in-out;
}

/* Small devices */
@media (max-width: 768px) {
  .w-24 {
    width: 15vw;
  }
  .w-64 {
    width: 50vw;
  }
  .icon-base {
    width: 16px;
    height: 16px;
  }
}

/* Medium devices */
@media (min-width: 769px) {
  .w-24 {
    width: 5vw;
  }
  .w-64 {
    width: 20vw;
  }
  .icon-base {
    width: 20px;
    height: 20px;
  }
}

/* Large devices */
@media (min-width: 1025px) {
  .w-24 {
    width: 8vw;
  }
  .w-64 {
    width: 25vw;
  }
  .icon-base {
    width: 48px;
    height: 48px;
  }
}

/* Extra large devices */
@media (min-width: 1441px) {
  .w-24 {
    width: 5vw;
  }
  .w-64 {
    width: 20vw;
  }
  .icon-base {
    width: 56px;
    height: 56px;
  }
}
</style>
