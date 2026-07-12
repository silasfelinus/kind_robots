<!-- /components/conductor/project-gallery-strip.vue -->
<!--
  Compact, project-scoped gallery: resolves an ArtCollection by label and renders
  its images with the shared <image-card>. Renders nothing when the collection is
  empty or missing, so a project without art doesn't leave a hole.
-->
<template>
  <section
    v-if="images.length"
    class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
  >
    <div class="mb-3 flex items-center gap-2">
      <Icon name="kind-icon:image" class="size-5 text-primary" />
      <h3
        class="text-sm font-black uppercase tracking-wide text-base-content/70"
      >
        {{ title }}
      </h3>
      <span class="badge badge-ghost badge-sm ml-auto rounded-lg">{{
        images.length
      }}</span>
    </div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <image-card
        v-for="image in images"
        :key="image.id"
        :art-image="image"
        compact
        :show-actions="false"
        :show-prompt="false"
        :show-meta="false"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { useCollectionStore } from '@/stores/collectionStore'

const props = withDefaults(
  defineProps<{
    collectionLabel: string
    title?: string
    limit?: number
  }>(),
  { title: 'Gallery', limit: 12 },
)

const collectionStore = useCollectionStore()
const loaded = ref(false)

onMounted(async () => {
  try {
    await collectionStore.fetchCollections(false, { includeImages: true })
  } catch {
    /* strip stays hidden if art can't load */
  } finally {
    loaded.value = true
  }
})

const images = computed<ArtImage[]>(() => {
  if (!loaded.value) return []
  const target = props.collectionLabel.toLowerCase()
  const collection = collectionStore.collections.find(
    (c) => (c.label || '').toLowerCase() === target,
  )
  if (!collection) return []
  return collectionStore
    .getCollectionArtImages(collection)
    .slice(0, props.limit)
})
</script>
