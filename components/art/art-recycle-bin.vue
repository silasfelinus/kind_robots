<!-- /components/art/art-recycle-bin.vue -->
<template>
  <div class="flex min-h-0 flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2 kr-panel-compact-row">
      <Icon name="kind-icon:trash" class="kr-icon-primary-4 shrink-0" />
      <h3 class="kr-text-black-sm min-w-0 truncate text-base-content">
        Recycle Bin
      </h3>
      <span class="kr-badge-primary-sm shrink-0">
        {{ binStore.itemCount }}
      </span>
      <div class="ml-auto flex flex-wrap items-center gap-1">
        <button
          class="kr-btn-xs btn-ghost rounded-lg"
          type="button"
          :disabled="binStore.isWorking || !binStore.itemCount"
          @click="restoreAll"
        >
          <Icon name="kind-icon:undo" class="kr-icon-3-5" />
          Restore all
        </button>
        <button
          class="kr-btn-xs btn-error rounded-lg"
          type="button"
          :disabled="binStore.isWorking || !binStore.itemCount"
          @click="emptyBin"
        >
          <span v-if="binStore.isWorking" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:trash" class="kr-icon-3-5" />
          Empty bin
        </button>
        <button
          class="btn btn-ghost btn-xs rounded-lg"
          type="button"
          @click="emit('close')"
        >
          <Icon name="kind-icon:arrow-left" class="kr-icon-3-5" />
          Collections
        </button>
      </div>
    </div>

    <div
      v-if="binStore.isLoading && !binStore.loaded"
      class="flex min-h-40 items-center justify-center"
    >
      <span class="kr-spinner-lg-primary" />
    </div>

    <div
      v-else-if="!binStore.itemCount"
      class="flex min-h-56 flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
    >
      <Icon name="kind-icon:trash" class="kr-icon-primary-12" />
      <p class="kr-text-black-lg mt-2 text-base-content">
        The Recycle Bin is empty.
      </p>
      <p class="text-sm">
        Deleted images and folders wait here until restored.
      </p>
    </div>

    <template v-else>
      <section v-if="binStore.collections.length" class="flex flex-col gap-2">
        <p class="kr-text-dim-xs font-bold uppercase tracking-wide">Folders</p>
        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-2"
        >
          <article
            v-for="collection in binStore.collections"
            :key="collection.id"
            class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm"
          >
            <div class="flex items-center gap-2">
              <Icon
                name="kind-icon:folder"
                class="kr-icon-primary-5 shrink-0"
              />
              <span class="min-w-0 flex-1 truncate font-bold">
                {{ collection.label || `Collection #${collection.id}` }}
              </span>
              <span class="kr-badge-ghost-sm shrink-0">
                {{ collection.artImageCount }} images
              </span>
            </div>
            <div class="flex gap-1">
              <button
                class="kr-btn-xs btn-ghost flex-1 rounded-lg"
                type="button"
                :disabled="binStore.isWorking"
                @click="restore({ collectionIds: [collection.id] })"
              >
                <Icon name="kind-icon:undo" class="kr-icon-3-5" />
                Restore
              </button>
              <button
                class="kr-btn-xs btn-error btn-outline flex-1 rounded-lg"
                type="button"
                :disabled="binStore.isWorking"
                @click="purgeCollection(collection)"
              >
                <Icon name="kind-icon:trash" class="kr-icon-3-5" />
                Delete forever
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="binStore.images.length" class="flex flex-col gap-2">
        <p class="kr-text-dim-xs font-bold uppercase tracking-wide">
          Images
          <span v-if="binStore.imageCount > binStore.images.length">
            · showing the {{ binStore.images.length }} most recent of
            {{ binStore.imageCount }}
          </span>
        </p>
        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-2"
        >
          <kr-mature-cover
            v-for="image in binStore.images"
            :key="image.id"
            :is-mature="image.isMature"
            :owner-id="image.userId"
            :reveal-mature="revealMature"
            :label="imageLabel(image)"
          >
            <div
              class="group relative aspect-square overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
            >
              <img
                :src="image.thumbnailUrl"
                :alt="imageLabel(image)"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover opacity-80"
              />
              <div
                class="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-base-300/95 to-transparent p-1.5 pt-6"
              >
                <button
                  class="kr-btn-xs btn-ghost flex-1 rounded-lg bg-base-100/90"
                  type="button"
                  :disabled="binStore.isWorking"
                  :aria-label="`Restore image #${image.id}`"
                  @click="restore({ imageIds: [image.id] })"
                >
                  <Icon name="kind-icon:undo" class="kr-icon-3-5" />
                  Restore
                </button>
                <button
                  class="kr-btn-xs btn-error rounded-lg"
                  type="button"
                  :disabled="binStore.isWorking"
                  :aria-label="`Delete image #${image.id} forever`"
                  :title="`Delete image #${image.id} forever`"
                  @click="purgeImage(image)"
                >
                  <Icon name="kind-icon:trash" class="kr-icon-3-5" />
                </button>
              </div>
            </div>
          </kr-mature-cover>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import {
  useRecycleBinStore,
  type RecycleBinCollection,
  type RecycleBinImage,
  type RecycleBinSelection,
} from '@/stores/recycleBinStore'

withDefaults(defineProps<{ revealMature?: boolean }>(), {
  revealMature: false,
})

const emit = defineEmits<{
  close: []
  changed: [message: string, success: boolean]
}>()

const binStore = useRecycleBinStore()

onMounted(() => {
  void binStore.fetchBin(true)
})

function imageLabel(image: RecycleBinImage): string {
  return image.promptString || image.fileName || `Image #${image.id}`
}

async function restore(selection: RecycleBinSelection) {
  const result = await binStore.restore(selection)
  emit('changed', result.message, result.success)
}

async function purge(selection: RecycleBinSelection, prompt: string) {
  if (!window.confirm(prompt)) return
  const result = await binStore.purge(selection)
  emit('changed', result.message, result.success)
}

function purgeImage(image: RecycleBinImage) {
  return purge(
    { imageIds: [image.id] },
    `Delete image #${image.id} forever? This cannot be undone.`,
  )
}

function purgeCollection(collection: RecycleBinCollection) {
  const name = collection.label || `Collection #${collection.id}`
  return purge(
    { collectionIds: [collection.id] },
    `Delete the folder "${name}" forever? Its images that are in no other folder move into the Recycle Bin, where they can still be restored.`,
  )
}

function restoreAll() {
  return restore({
    imageIds: binStore.images.map((image) => image.id),
    collectionIds: binStore.collections.map((collection) => collection.id),
  })
}

function emptyBin() {
  return purge(
    {
      imageIds: binStore.images.map((image) => image.id),
      collectionIds: binStore.collections.map((collection) => collection.id),
    },
    `Delete everything shown in the Recycle Bin forever? This cannot be undone.`,
  )
}
</script>
