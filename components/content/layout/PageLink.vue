<template>
  <NuxtLink
    :to="page._path"
    class="text-center rounded-2xl flex flex-col items-center group hover:bg-accent transition-colors relative"
    :class="{ 'items-start flex-row': isExtended && isHighlight }"
  >
    <div
      v-if="isHighlight && page.image"
      :class="[
        'relative rounded-2xl overflow-hidden m-2',
        { 'w-24 h-24': !isExtended, 'w-40 h-40 shadow-lg': isExtended },
      ]"
    >
      <img
        :src="`/images/${page.image}`"
        alt="Page Image"
        class="w-full h-full object-cover"
      />
    </div>
    <div class="flex flex-col items-center relative">
      <div
        class="flex items-center space-x-2 border border-solid rounded-2xl p-2 bg-secondary group-hover:bg-accent transition-colors"
      >
        <div v-if="page.Icon" class="text-3xl group-hover:text-4xl">
          <Icon :name="page.Icon" />
        </div>
        <div class="text-lg">
          {{ page.title }}
        </div>
      </div>
      <div
        v-if="page._path === currentPath"
        class="mt-1 text-xl rounded-2xl border bg-accent p-1"
      >
        <Icon name="kind-icon:download" class="text-lg" />
        You are here
      </div>
    </div>
    <div
      v-if="isExtended"
      class="absolute left-1/2 transform -translate-x-1/2 bg-base-300 p-2 rounded-lg hidden group-hover:block z-10"
      :class="{
        'top-0 -translate-y-full': !isHighlight,
        'top-1/4 -translate-y-1/2': isHighlight,
      }"
    >
      <div v-if="!isHighlight && page.image" class="mb-2">
        <img
          :src="`/images/${page.image}`"
          alt="Page Image"
          class="w-24 h-24 object-cover rounded-lg"
        />
      </div>
      {{ page.description }}
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const { page, currentPath, isHighlight, isExtended } = defineProps<{
  page: {
    _path: string
    title: string
    Icon?: string
    image?: string
    underConstruction?: boolean
    description?: string
  }
  currentPath: string
  isHighlight?: boolean
  isExtended?: boolean
}>()
</script>
