<template>
  <header><bot-selector /></header>
  <div class="layout-selector">
    <div class="flex justify-end space-x-4">
      <!-- Layout selection buttons -->
      <div
        v-for="layout in layouts"
        :key="layout.name"
        class="rounded-full p-3 cursor-pointer hover:scale-110 transition-transform border-2 border-transparent hover:border-primary"
        @click="setSelectedLayout(layout.type)"
      >
        <Icon
          :name="layout.icon"
          :title="layout.title"
          :active="selectedLayout === layout.type"
          class="w-6 h-6"
        />
      </div>
    </div>

    <!-- Using BotObject component for each bot with the selected layout -->
    <div v-for="bot in bots" :key="bot.id">
      <BotObject :bot="bot" :layout="selectedLayout" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScreenStore, LayoutType } from '../../../stores/screenStore'
import { useBotStore } from '../../../stores/botStore'

const screenStore = useScreenStore()
const botStore = useBotStore()
const bots = computed(() => botStore.bots)

// Directly use the layout from the store
const selectedLayout = computed(() => screenStore.currentLayout as LayoutType)

const layouts = [
  { name: 'Badge', icon: 'zondicons:badge', type: LayoutType.BADGE, title: 'Badge Layout' },
  { name: 'Card', icon: 'entypo:v-card', type: LayoutType.CARD, title: 'Card Layout' },
  { name: 'Hero', icon: 'foundation:photo', type: LayoutType.HERO, title: 'Hero Layout' },
  { name: 'Full', icon: 'flat-color-icons:landscape', type: LayoutType.FULL, title: 'Full Layout' },
  {
    name: 'Carousel',
    icon: 'flat-color-icons:landscape',
    type: LayoutType.CAROUSEL,
    title: 'Carousel Layout'
  }
]
const setSelectedLayout = (layout: LayoutType) => {
  screenStore.setLayout(layout) // Update the layout in the store
}
</script>
