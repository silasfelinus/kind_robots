<!-- /components/pantheon/add-pantheon.vue -->
<template>
  <div
    class="rounded-2xl border p-6 m-4 mx-auto bg-base-200 max-w-5xl space-y-6"
  >
    <h1 class="text-4xl text-center font-bold">Create or Edit a Pantheon</h1>

    <div class="flex flex-wrap justify-between items-center gap-4">
      <pantheon-selector />

      <div v-if="store.selected" class="flex items-center">
        <button class="btn btn-icon" @click="deselect">
          <icon name="mdi:close-box" class="text-2xl" />
        </button>
        <span class="ml-2 text-sm">Create new pantheon</span>
      </div>

      <div class="flex-grow max-w-xs">
        <label class="block text-sm font-semibold mb-1">Owner</label>
        <p class="text-sm text-base-content/70">
          {{ userStore.user?.username || 'You' }}
        </p>
      </div>

      <div class="flex gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1">Visibility</label>
          <div class="flex space-x-2">
            <button
              type="button"
              class="btn btn-sm"
              :class="store.form.isPublic ? 'btn-primary' : 'btn-outline'"
              @click="store.form.isPublic = true"
            >
              Public
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="!store.form.isPublic ? 'btn-primary' : 'btn-outline'"
              @click="store.form.isPublic = false"
            >
              Private
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-4">
        <label class="form-control">
          <span class="label-text">Name</span>
          <input v-model="store.form.name" class="input input-bordered" />
        </label>

        <label class="form-control">
          <span class="label-text">Slug (optional)</span>
          <input v-model="store.form.slug" class="input input-bordered" />
        </label>

        <label class="form-control">
          <span class="label-text">Description</span>
          <textarea
            v-model="store.form.description"
            rows="3"
            class="textarea textarea-bordered"
          />
        </label>
      </div>

      <div class="space-y-4">
        <label class="form-control">
          <span class="label-text">Cover ArtImage ID (optional)</span>
          <input
            v-model.number="store.form.coverArtImageId"
            type="number"
            class="input input-bordered"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Chat ID (optional)</span>
          <input
            v-model.number="store.form.chatId"
            type="number"
            class="input input-bordered"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Tags (comma-separated)</span>
          <input
            v-model="tagsText"
            @blur="syncTags"
            class="input input-bordered"
          />
        </label>
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      <div>
        <h3 class="font-semibold mb-2">Names (ordered)</h3>
        <div class="flex gap-2 mb-2">
          <input
            v-model="nameInput"
            class="input input-bordered flex-1"
            placeholder="Add name"
          />
          <button class="btn btn-sm" @click="addName">Add</button>
        </div>
        <ul class="space-y-2">
          <li
            v-for="(n, i) in namesArr"
            :key="i"
            class="flex items-center gap-2"
          >
            <span class="badge">{{ i + 1 }}</span>
            <input
              v-model="namesArr[i]"
              class="input input-bordered input-sm flex-1"
            />
            <button class="btn btn-xs" @click="removeName(i)">x</button>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="font-semibold mb-2">Image IDs (ordered)</h3>
        <div class="flex gap-2 mb-2">
          <input
            v-model.number="imageInput"
            type="number"
            class="input input-bordered flex-1"
            placeholder="ArtImage id"
          />
          <button class="btn btn-sm" @click="addImageId">Add</button>
        </div>
        <ul class="space-y-2">
          <li
            v-for="(id, i) in imageIdsArr"
            :key="i"
            class="flex items-center gap-2"
          >
            <span class="badge">{{ i + 1 }}</span>
            <input
              v-model.number="imageIdsArr[i]"
              type="number"
              class="input input-bordered input-sm flex-1"
            />
            <button class="btn btn-xs" @click="removeImageId(i)">x</button>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="font-semibold mb-2">Galleries</h3>
        <div class="flex gap-2 mb-2">
          <input
            v-model.number="galleryInput"
            type="number"
            class="input input-bordered flex-1"
            placeholder="Gallery id"
          />
          <button class="btn btn-sm" @click="addGalleryId">Add</button>
        </div>
        <ul class="space-y-2">
          <li
            v-for="(id, i) in galleryIdsArr"
            :key="i"
            class="flex items-center gap-2"
          >
            <span class="badge">{{ i + 1 }}</span>
            <input
              v-model.number="galleryIdsArr[i]"
              type="number"
              class="input input-bordered input-sm flex-1"
            />
            <button class="btn btn-xs" @click="removeGalleryId(i)">x</button>
          </li>
        </ul>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="pt-4">
      <div v-if="store.loading" class="loading loading-ring loading-lg"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-green-500 mt-2">
        {{ successMessage }}
      </div>

      <button
        type="submit"
        class="btn btn-primary mt-4"
        :disabled="store.isSaving"
      >
        <span v-if="store.isSaving">Saving...</span>
        <span v-else>{{
          store.form.id ? 'Update Pantheon' : 'Create Pantheon'
        }}</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePantheonStore } from '~/stores/pantheonStore'
import { useUserStore } from '@/stores/userStore'

const store = usePantheonStore()
const userStore = useUserStore()

const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const nameInput = ref('')
const imageInput = ref<number | null>(null)
const galleryInput = ref<number | null>(null)

const tagsText = ref('')

watch(
  () => store.form.tags,
  () => {
    tagsText.value = Array.isArray(store.form.tags)
      ? store.form.tags.join(', ')
      : ''
  },
  { immediate: true },
)

function syncTags() {
  store.form.tags = tagsText.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const canEdit = computed(
  () => !store.form.id || store.form.userId === userStore.user?.id,
)

function deselect() {
  store.deselect()
}

const namesArr = computed<string[]>(() => {
  if (!store.form.names) store.form.names = []
  return store.form.names
})
const imageIdsArr = computed<number[]>(() => {
  if (!store.form.imageIds) store.form.imageIds = []
  return store.form.imageIds
})
const galleryIdsArr = computed<number[]>(() => {
  if (!store.form.galleryIds) store.form.galleryIds = []
  return store.form.galleryIds
})

function addName() {
  if (nameInput.value.trim()) {
    namesArr.value.push(nameInput.value.trim())
    nameInput.value = ''
  }
}
function removeName(i: number) {
  namesArr.value.splice(i, 1)
}

function addImageId() {
  if (typeof imageInput.value === 'number') {
    imageIdsArr.value.push(imageInput.value)
    imageInput.value = null
  }
}
function removeImageId(i: number) {
  imageIdsArr.value.splice(i, 1)
}

function addGalleryId() {
  if (typeof galleryInput.value === 'number') {
    galleryIdsArr.value.push(galleryInput.value)
    galleryInput.value = null
  }
}
function removeGalleryId(i: number) {
  galleryIdsArr.value.splice(i, 1)
}

async function handleSubmit() {
  errorMessage.value = null
  successMessage.value = null
  const result = await store.save()
  if (result.success) {
    successMessage.value = store.form.id
      ? 'Pantheon updated successfully!'
      : 'Pantheon created successfully!'
  } else {
    errorMessage.value = result.message || 'Failed to save pantheon.'
  }
}

onMounted(() => {
  if (!store.form.names) store.form.names = []
  if (!store.form.imageIds) store.form.imageIds = []
  if (!store.form.galleryIds) store.form.galleryIds = []
  store.initialize()
})
</script>
