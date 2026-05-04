<template>
  <section class="w-full h-full">
    <div
      class="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-6"
    >
      <div
        class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <h1 class="text-2xl font-bold text-primary sm:text-3xl">
          🎨 Art-Maker
        </h1>
        <p class="text-sm text-base-content/70 sm:text-base">
          Pick a model, build a prompt, choose a gallery, upload a starting
          image, then make something weird.
        </p>
      </div>

      <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
        <div class="xl:col-span-3">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">🧠 Model</div>
            <checkpoint-gallery />
          </div>
        </div>

        <div class="xl:col-span-6">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">📝 Prompt</div>
            <art-randomizer />
          </div>
        </div>

        <div class="xl:col-span-3">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">
              🏛️ Gallery
            </div>
            <collection-gallery />
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]"
      >
        <div>
          <h2 class="text-lg font-semibold text-primary">
            📤 Upload Starting Image
          </h2>
          <p class="mt-1 text-sm text-base-content/70">
            Add an image directly to your art library and current upload
            collection.
          </p>
        </div>

        <image-upload />
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <art-display />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUploadStore } from '@/stores/uploadStore'

const uploadStore = useUploadStore()

function configureArtImageUpload() {
  uploadStore.setTarget({
    model: 'Art',
    modelId: null,
    galleryName: 'artUploads',
    collectionLabel: 'uploads',
    promptString: '[UploadedArtImage]',
    path: '[UploadedArtImage]',
    buttonLabel: 'Upload art image',
    icon: 'kind-icon:image',
    showPreview: true,
  })
}

onMounted(() => {
  configureArtImageUpload()
})
</script>
