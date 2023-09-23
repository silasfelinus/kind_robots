<template>
  <div class="relative bg-base-200 rounded-2xl m-1 p-0">
    <div
      class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
    >
      <div class="flex space-x-2">
        <icon
          name="grommet-icons:grid"
          class="text-2xl cursor-pointer"
          @click="setView('fourRow')"
        />
        <icon
          name="mdi:view-dashboard-outline"
          class="text-2xl cursor-pointer"
          @click="setView('threeRow')"
        />
        <icon name="ion:grid-outline" class="text-2xl cursor-pointer" @click="setView('twoRow')" />
        <icon name="bi:fullscreen" class="text-2xl cursor-pointer" @click="setView('single')" />
      </div>
    </div>
    <div class="flex flex-wrap">
      <nuxt-link v-for="item in userNavigation" :key="item.path" :to="item.path" :class="itemClass">
        <div
          class="bg-base-200 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:bg-accent transition"
        >
          <img :src="item.image" alt="" class="mb-2 rounded-2xl border" />
          <div class="text-lg font-bold mb-2">{{ item.title }}</div>
          <div class="text-sm mb-2">{{ item.description }}</div>
          <button class="bg-primary text-white py-1 px-4 rounded hover:bg-secondary transition">
            Go
          </button>
        </div>
      </nuxt-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import { userNavigation } from '@/training/userNavigation'

const view = ref('twoRow') // Set a default value

onMounted(() => {
  const savedView = window.localStorage.getItem('view')
  if (savedView) {
    view.value = savedView
  }
})

const setView = (newView: string) => {
  view.value = newView
  window.localStorage.setItem('view', newView)
}

const itemClass = ref('w-1/2 p-4')
watch(view, (newView) => {
  if (newView === 'twoRow') {
    itemClass.value = 'w-1/2 p-4'
  } else if (newView === 'fourRow') {
    itemClass.value = 'w-1/4 p-4'
  } else if (newView === 'single') {
    itemClass.value = 'w-full p-4'
  } else {
    itemClass.value = 'w-1/3 p-4'
  }
})
</script>

<style>
.icon {
  width: 24px;
  height: 24px;
}
</style>
