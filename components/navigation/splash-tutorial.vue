<!-- /components/navigation/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="flex h-full w-full flex-col gap-2 overflow-x-hidden overflow-y-auto md:gap-3 lg:gap-4"
  >
    <div class="w-full overflow-x-hidden">
      <title-card />
    </div>

    <div class="w-full overflow-x-hidden">
      <div class="flex justify-end px-1">
        <button
          class="btn btn-ghost btn-xs gap-1 text-base-content/60 hover:text-base-content"
          @click="showChat = !showChat"
        >
          <span>{{ showChat ? '🧠 Smart Panel' : '💬 Chat' }}</span>
        </button>
      </div>

      <ami-chat v-if="showChat" class="w-full" />
      <smart-panel v-else />
    </div>

    <div v-if="pageImage" class="w-full overflow-x-hidden">
      <div
        class="relative aspect-video w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/70 md:aspect-21/9 lg:aspect-3/1"
      >
        <NuxtImg
          :src="pageImage"
          alt="Room illustration"
          :sizes="imageSizes"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/splash-tutorial.vue
import { computed, ref } from 'vue'
import { NuxtImg } from '#components'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const showChat = ref(false)

const image = computed(() => pageStore.page?.image || '')

const pageImage = computed(() => {
  const img = image.value
  if (!img) return ''
  return img.startsWith('/') ? img : `/images/${img}`
})

const imageSizes = computed(
  () => '(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px',
)
</script>
