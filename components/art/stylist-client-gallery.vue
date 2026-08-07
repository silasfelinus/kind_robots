<!-- /components/art/stylist-client-gallery.vue -->
<template>
  <section class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-3">
    <header class="mb-3 flex flex-wrap items-center gap-2">
      <Icon name="kind-icon:image" class="size-4 text-primary" />
      <h3 class="font-black">{{ client.name }}’s gallery</h3>
      <span class="badge badge-ghost badge-sm">{{ photos.length }}</span>
      <div class="flex-1" />
      <select v-model="folderFilter" class="select select-bordered select-xs">
        <option value="">All folders</option>
        <option v-for="folder in folders" :key="folder" :value="folder">
          {{ folder }}
        </option>
      </select>

      <!-- The upload form used to sit open BELOW this row on every client, so
           a gallery you came to look at opened with a form you did not ask for.
           Same treatment as Projects' Create: a toggle here, the form when
           asked. -->
      <button
        type="button"
        class="btn btn-xs gap-1 rounded-xl"
        :class="uploadOpen ? 'btn-primary' : 'btn-ghost'"
        :aria-expanded="uploadOpen"
        @click="uploadOpen = !uploadOpen"
      >
        <Icon name="kind-icon:upload" class="size-3.5" />
        <span class="hidden sm:inline">Upload</span>
      </button>
    </header>

    <div
      v-if="uploadOpen"
      class="mb-3 flex flex-wrap items-end gap-2 rounded-xl bg-base-100 p-3"
    >
      <label class="flex min-w-28 flex-col gap-1">
        <span class="text-xs font-bold">Folder</span>
        <input
          v-model="uploadFolder"
          class="input input-bordered input-xs"
          placeholder="general"
        />
      </label>
      <label class="flex min-w-28 flex-col gap-1">
        <span class="text-xs font-bold">Type</span>
        <select v-model="uploadKind" class="select select-bordered select-xs">
          <option value="before">Before</option>
          <option value="after">After</option>
          <option value="style">Style</option>
          <option value="inspiration">Inspiration</option>
          <option value="formula">Formula / notes</option>
        </select>
      </label>
      <label class="flex min-w-44 flex-1 flex-col gap-1">
        <span class="text-xs font-bold">Caption</span>
        <input
          v-model="uploadCaption"
          class="input input-bordered input-xs"
          placeholder="Color, formula, date, or notes"
        />
      </label>
      <label
        class="btn btn-primary btn-sm"
        :class="{ 'btn-disabled': uploading }"
      >
        <span v-if="uploading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:upload" class="size-4" />
        Add photos
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          class="hidden"
          :disabled="uploading"
          @change="uploadPhotos"
        />
      </label>
      <label
        class="btn btn-ghost btn-sm"
        :class="{ 'btn-disabled': uploading }"
      >
        <Icon name="kind-icon:camera" class="size-4" />
        Take photo
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          capture="environment"
          class="hidden"
          :disabled="uploading"
          @change="uploadPhotos"
        />
      </label>
    </div>

    <p v-if="error" class="mb-3 rounded-xl bg-error/10 p-2 text-xs text-error">
      {{ error }}
    </p>
    <!-- The shared shell owns the grid, the mode bar, and the loading and
         empty states. The photo card stays bespoke: these are stylist client
         photos with folder/kind badges and a primary flag, not entity art, so
         the #item slot replaces kr-gallery's default card outright. -->
    <kr-gallery
      :items="galleryItems"
      :mode="galleryMode"
      :loading="loading"
      empty-label="photos"
      @update:mode="galleryMode = $event"
    >
      <template #item="{ item }">
        <article
          v-if="photoById.get(Number(item.id))"
          class="overflow-hidden rounded-xl border border-base-300 bg-base-100"
        >
          <div class="relative aspect-square bg-base-300">
            <img
              v-if="photoUrls[Number(item.id)]"
              :src="photoUrls[Number(item.id)]"
              :alt="
                photoById.get(Number(item.id))!.caption ||
                `${client.name} ${photoById.get(Number(item.id))!.kind}`
              "
              class="h-full w-full object-cover"
            />
            <span
              v-if="photoById.get(Number(item.id))!.isPrimary"
              class="badge badge-primary badge-sm absolute left-2 top-2"
              >Primary</span
            >
          </div>
          <div class="flex flex-col gap-1 p-2">
            <div class="flex flex-wrap gap-1">
              <span class="badge badge-outline badge-xs">{{
                photoById.get(Number(item.id))!.folder
              }}</span>
              <span class="badge badge-ghost badge-xs">{{
                photoById.get(Number(item.id))!.kind
              }}</span>
            </div>
            <p class="min-h-8 text-xs text-base-content/65">
              {{ photoById.get(Number(item.id))!.caption || 'No caption' }}
            </p>
            <div class="flex flex-wrap gap-1">
              <button
                v-if="!photoById.get(Number(item.id))!.isPrimary"
                type="button"
                class="btn btn-primary btn-xs"
                @click="setPrimary(Number(item.id))"
              >
                Set primary
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs text-error"
                @click="removePhoto(Number(item.id))"
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      </template>

      <template #empty>
        <p class="py-6 text-center text-sm text-base-content/40">
          No photos in this folder yet.
        </p>
      </template>
    </kr-gallery>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import type { GalleryMode } from '@/utils/galleryVocabulary'
import type { SuperkateCustomer } from '@/stores/superkateStore'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<{ client: SuperkateCustomer }>()
const emit = defineEmits<{ changed: [] }>()

const galleryMode = ref<GalleryMode>('cards')

const galleryItems = computed<GalleryItem[]>(() =>
  filteredPhotos.value.map((photo) => ({
    id: photo.id,
    title: photo.caption || `${photo.folder} · ${photo.kind}`,
  })),
)

const photoById = computed(
  () => new Map(filteredPhotos.value.map((photo) => [photo.id, photo])),
)
const userStore = useUserStore()

type GalleryPhoto = {
  id: number
  caption: string
  folder: string
  kind: string
  isPrimary: boolean
  imageUrl: string
}

const photos = ref<GalleryPhoto[]>([])
const loading = ref(false)
const uploading = ref(false)
const error = ref('')
const uploadOpen = ref(false)
const uploadFolder = ref('general')
const uploadKind = ref('style')
const uploadCaption = ref('')
const folderFilter = ref('')
const photoUrls = reactive<Record<number, string>>({})

const folders = computed(() =>
  [...new Set(photos.value.map((photo) => photo.folder))].sort(),
)
const filteredPhotos = computed(() =>
  folderFilter.value
    ? photos.value.filter((photo) => photo.folder === folderFilter.value)
    : photos.value,
)

function revoke(id: number) {
  const url = photoUrls[id]
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  delete photoUrls[id]
}

async function loadBlob(photo: GalleryPhoto) {
  const token = userStore.token || userStore.user?.token || ''
  const response = await fetch(photo.imageUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) return
  revoke(photo.id)
  photoUrls[photo.id] = URL.createObjectURL(await response.blob())
}

async function loadGallery() {
  loading.value = true
  error.value = ''
  const response = await performFetch<{ photos: GalleryPhoto[] }>(
    `/api/stylist/client/${props.client.id}/gallery`,
    { method: 'GET' },
    1,
    20000,
  )
  if (!response.success || !response.data) {
    error.value = response.message || 'Could not load client gallery.'
    loading.value = false
    return
  }
  const next = response.data.photos || []
  const ids = new Set(next.map((photo) => photo.id))
  Object.keys(photoUrls).forEach((id) => {
    if (!ids.has(Number(id))) revoke(Number(id))
  })
  photos.value = next
  await Promise.all(next.map(loadBlob))
  loading.value = false
}

async function uploadPhotos(event: Event) {
  const input = event.target as HTMLInputElement
  const files = [...(input.files || [])]
  input.value = ''
  if (!files.length) return
  uploading.value = true
  error.value = ''
  for (const file of files) {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', uploadFolder.value || 'general')
    form.append('kind', uploadKind.value)
    form.append('caption', uploadCaption.value)
    const response = await performFetch(
      `/api/stylist/client/${props.client.id}/photo`,
      { method: 'POST', body: form },
      1,
      30000,
    )
    if (!response.success) {
      error.value = response.message || `Could not upload ${file.name}.`
      break
    }
  }
  uploading.value = false
  await loadGallery()
  emit('changed')
}

async function setPrimary(photoId: number) {
  const response = await performFetch(
    `/api/stylist/client/${props.client.id}/photo/${photoId}`,
    { method: 'PATCH', body: JSON.stringify({ isPrimary: true }) },
  )
  if (!response.success)
    error.value = response.message || 'Could not select primary photo.'
  await loadGallery()
  emit('changed')
}

async function removePhoto(photoId: number) {
  if (!window.confirm('Delete this client photo?')) return
  const response = await performFetch(
    `/api/stylist/client/${props.client.id}/photo/${photoId}`,
    { method: 'DELETE' },
  )
  if (!response.success)
    error.value = response.message || 'Could not delete photo.'
  await loadGallery()
  emit('changed')
}

onMounted(loadGallery)
onBeforeUnmount(() =>
  Object.keys(photoUrls).forEach((id) => revoke(Number(id))),
)
</script>
