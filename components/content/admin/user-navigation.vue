<template>
  <div class="relative bg-base-200 rounded-2xl m-1 p-0">
    <div
      class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
    >
      <div class="flex space-x-2">
        <icon name="grommet-icons:grid" class="text-2xl cursor-pointer" @click="setView('list')" />
        <icon name="ion:grid-outline" class="text-2xl cursor-pointer" @click="setView('grid')" />

        <icon name="bi:fullscreen" class="text-2xl cursor-pointer" @click="setView('single')" />
      </div>
    </div>
    <div class="flex flex-wrap">
      <div v-for="item in userNavigation" :key="item.path" :class="itemClass">
        <div class="bg-base-200 rounded-2xl p-4 flex flex-col items-center">
          <img :src="item.image" alt="" class="mb-2" />
          <div class="text-lg font-bold mb-2">{{ item.title }}</div>
          <div class="text-sm mb-2">{{ item.description }}</div>
          <nuxt-link :to="item.path" class="bg-primary text-white py-1 px-4 rounded">
            Go
          </nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { userNavigation } from '@/training/userNavigation'

const view = ref('grid') // 'grid' for 4 items/page, 'list' for all items/page, 'single' for 1 item/page

const setView = (newView: string) => {
  view.value = newView
}

const itemClass = ref('w-1/2 p-4')
watch(view, (newView) => {
  if (newView === 'grid') {
    itemClass.value = 'w-1/2 p-4'
  } else if (newView === 'list') {
    itemClass.value = 'w-1/4 p-4'
  } else {
    itemClass.value = 'w-full p-4'
  }
})
</script>

<style>
.icon {
  width: 24px;
  height: 24px;
}
</style>
