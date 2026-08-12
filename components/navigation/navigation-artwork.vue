<!-- /components/navigation/navigation-artwork.vue -->
<template>
  <span ref="root" class="block h-full w-full">
    <img
      v-if="resolvedSrc"
      :src="resolvedSrc"
      :alt="alt"
      loading="lazy"
      class="h-full w-full object-cover"
    />
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'

const props = defineProps<{
  src?: string
  alt?: string
}>()

const root = ref<HTMLElement>()
const artStore = useArtStore()
const resolvedSrc = ref<string>()

async function request(url: string): Promise<void> {
  await artStore.preloadArtwork(url)
  resolvedSrc.value = url
}

let observer: IntersectionObserver | undefined

onMounted(() => {
  if (!props.src || !import.meta.client || !root.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        request(props.src as string)
        observer?.disconnect()
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>
