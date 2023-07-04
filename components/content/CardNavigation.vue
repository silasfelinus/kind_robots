<template>
  <div class="overflow-y-auto max-w-lg mx-auto p-4">
    <ul class="space-y-4">
      <li v-for="(item, index) in navigationTree" :key="index" class="space-y-4">
        <div :class="cardClass(item.state)">
          <NuxtLink
            :to="item.link"
            class="block text-center text-2xl font-semibold leading-tight text-black overflow-hidden overflow-ellipsis mb-4"
          >
            <template v-if="item.state === 'icon'">
              <icon :icon="item.icon"></icon>
            </template>
            {{ item.title }}
          </NuxtLink>

          <template v-if="item.state === 'image' || item.state === 'full'">
            <div class="col-span-1">
              <img
                :src="item.image || item.gallery || '/images/backtree.webp'"
                alt="Section Image"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="col-span-3 p-4 bg-secondary text-black rounded">
              <NuxtLink
                :to="item.link"
                class="block text-center text-2xl font-semibold leading-tight text-black overflow-hidden overflow-ellipsis mb-4"
              >
                {{ item.title }}
              </NuxtLink>
              <p class="text-black">{{ item.details }}</p>
            </div>
          </template>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
const navigationTree = ref([])

const fetchContentNavigation = async () => {
  // Fetch the navigation data here
  // This is a placeholder, replace it with your actual fetch logic
  const response = await fetch('/botcafe')
  const data = await response.json()
  navigationTree.value = data
}

fetchContentNavigation()

const cardClass = (state) => {
  let baseClass =
    'transform transition-all duration-200 hover:scale-105 bg-primary rounded-lg shadow-lg overflow-hidden grid grid-cols-4 gap-4'
  if (state === 'collapsed') {
    return `${baseClass} hidden`
  } else if (state === 'icon') {
    return `${baseClass} grid-cols-1`
  } else if (state === 'image') {
    return `${baseClass} grid-cols-2`
  } else {
    return baseClass
  }
}
</script>
