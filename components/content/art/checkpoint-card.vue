<!-- /components/content/art/collection-card.vue -->
<template>
  <div
    class="relative w-full flex flex-col bg-secondary bg-opacity-20 border border-base-content rounded-2xl overflow-hidden transition-all"
  >
    <!-- Label or Input -->
    <div class="px-2 pt-2">
      <div v-if="canEdit" class="flex items-center gap-2">
        <input
          v-model="collection.label"
          class="input input-sm input-bordered font-bold text-md w-full"
          :placeholder="`Collection #${collection.id}`"
        />
        <span class="badge badge-primary">You</span>
      </div>
      <h3
        v-else
        class="text-sm font-bold truncate"
        :title="collection.label"
      >
        {{ collection.label }}
      </h3>
    </div>

    <!-- Creator (if public) -->
    <div v-if="collection.isPublic && collection.user?.username" class="px-2 text-xs italic text-base-content opacity-70">
      by {{ collection.user.username }}
    </div>

    <!-- Image Preview -->
    <div
      class="relative w-full aspect-square flex items-center justify-center overflow-hidden cursor-pointer"
      @click="toggleCollection"
    >
      <template v-if="loadingImage">
        <div class="animate-pulse flex items-center justify-center w-full h-full">
          <Icon
            name="kind-icon:loading"
            class="w-8 h-8 text-info animate-spin"
          />
        </div>
      </template>
      <template v-else>
        <img
          :src="computedPreview"
          alt="Collection Preview"
          class="w-full h-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { getCollectionPreviewImage } from '@/stores/helpers/collectionHelper'

const props = defineProps<{
  collection: ArtCollection
  previewImage?: string
}>()

const userStore = useUserStore()
const collectionStore = useCollectionStore()

const loadingImage = ref(false)
const localImage = ref<string | null>(null)

const canEdit = computed(() => {
  return props.collection.userId === userStore.user?.id
})

const computedPreview = computed(() => {
  if (localImage.value) return localImage.value
  if (props.previewImage) return props.previewImage
  return '/images/backtree.webp'
})

const fetchPreview = async () => {
  loadingImage.value = true
  const preview = await getCollectionPreviewImage(props.collection.id)
  if (preview) localImage.value = preview
  loadingImage.value = false
}

const toggleCollection = () => {
  collectionStore.toggleCollection(props.collection)
}

onMounted(() => {
  if (!props.previewImage) fetchPreview()
})
</script>
