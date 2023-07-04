<template>
  <div
    class="fixed right-0 top-0 h-full w-64 lg:w-80 transform transition-transform duration-300 overflow-auto bg-gradient-to-r text-white shadow-lg"
    :class="collapsed ? 'translate-x-full bg-primary' : 'translate-x-0 bg-secondary'"
    role="navigation"
    tabindex="0"
    @keyup.esc="toggle"
  >
    <button :aria-expanded="!collapsed" class="btn btn-primary w-full" @click="toggle">
      {{ collapsed ? 'Expand' : 'Collapse' }}
    </button>

    <nav class="space-y-2 p-4">
      <div v-for="(link, index) in navDirectory" :key="index" class="space-y-2">
        <img v-if="!collapsed" :src="link.image" :alt="link.title" class="w-full" />
        <i v-if="collapsed" :class="`text-lg ${link.icon}`"></i>

        <div class="flex items-center space-x-2">
          <i v-if="!collapsed" :class="`text-lg ${link.icon}`"></i>
          <h2 class="text-lg font-bold">{{ link.title }}</h2>
        </div>

        <p v-if="!collapsed">{{ link.description }}</p>

        <div v-for="(sublink, subindex) in link.sublinks" :key="`sub-${subindex}`" class="pl-4">
          <nuxt-link :to="sublink.path" class="block hover:text-blue-300 focus:text-blue-300">
            {{ sublink.title }}
          </nuxt-link>
          <p v-if="!collapsed">{{ sublink.description }}</p>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
const collapsed = ref(false)

const navDirectory = ref([
  {
    title: 'Kind Welcome',
    description: 'Welcome to Kind Robots',
    image: '/images/amibot/amibot1.png',
    icon: 'fa-icon-1',
    path: '/welcome',
    sublinks: [
      {
        title: 'Sub Page 1',
        description: 'This is sub page 1.',
        path: '/kindrobots'
      },
      {
        title: 'Sub Page 2',
        description: 'This is sub page 2.',
        path: '/kindhumans'
      },
      {
        title: 'Sub Page 3',
        description: 'This is sub page 3.',
        path: '/kindworld'
      }
    ]
  },
  {
    title: 'Kin',
    description: 'This is the second main page.',
    image: '/images/amibot/amibot1.png',
    icon: 'fa-icon-2',
    path: '/main-page-2',
    sublinks: [
      {
        title: 'Sub Page 1',
        description: 'This is sub page 1.',
        path: '/main-page-2/sub-page-1'
      },
      {
        title: 'Sub Page 2',
        description: 'This is sub page 2.',
        path: '/main-page-2/sub-page-2'
      },
      {
        title: 'Sub Page 3',
        description: 'This is sub page 3.',
        path: '/main-page-2/sub-page-3'
      }
    ]
  }
])

const toggle = () => {
  collapsed.value = !collapsed.value
}
</script>

<style scoped>
/* Custom transition for the width property */
.transition-width {
  transition: width 0.3s ease-in-out;
}
</style>
