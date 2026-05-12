<!-- /components/art/image-upload.vue -->
<template>
  <section
    class="flex w-full flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/png, image/jpeg, image/webp"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Drop zone -->
    <div
      class="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors"
      :class="
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-base-300 hover:border-primary/50 hover:bg-base-100'
      "
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="fileInput?.click()"
    >
      <Icon :name="icon" class="h-8 w-8 opacity-40" />
      <p class="text-sm text-base-content/60">
        Drop images here or
        <span class="text-primary underline underline-offset-2">browse</span>
      </p>
      <p class="text-xs text-base-content/40">
        PNG · JPEG · WebP · multiple OK
      </p>
    </div>

    <!-- Preview grid -->
    <TransitionGroup
      v-if="queuedFiles.length > 0"
      name="grid"
      tag="div"
      class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
    >
      <div
        v-for="(item, i) in queuedFiles"
        :key="item.id"
        class="group relative aspect-square overflow-hidden rounded-lg border border-base-300 bg-base-100"
      >
        <img
          :src="item.preview"
          :alt="item.file.name"
          class="h-full w-full object-cover transition-transform group-hover:scale-105"
        />

        <!-- Remove button -->
        <button
          v-if="!isUploading"
          type="button"
          class="btn btn-circle btn-error btn-xs absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
          :title="`Remove ${item.file.name}`"
          @click.stop="removeFile(i)"
        >
          <Icon name="mdi:close" class="h-3 w-3" />
        </button>

        <!-- Success overlay -->
        <Transition name="fade">
          <div
            v-if="succeededNames.has(item.file.name)"
            class="absolute inset-0 flex items-center justify-center bg-success/50"
          >
            <Icon
              name="mdi:check-circle"
              class="h-7 w-7 text-success-content drop-shadow"
            />
          </div>
        </Transition>

        <!-- Failure overlay -->
        <Transition name="fade">
          <div
            v-if="failedNames.has(item.file.name)"
            class="absolute inset-0 flex items-center justify-center bg-error/50"
          >
            <Icon
              name="mdi:close-circle"
              class="h-7 w-7 text-error-content drop-shadow"
            />
          </div>
        </Transition>
      </div>
    </TransitionGroup>

    <!-- Collection name + model link (shown once files are queued) -->
    <template v-if="queuedFiles.length > 0">
      <!-- Collection name -->
      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-base-content/60"
          >Collection name</span
        >
        <input
          v-model="collectionName"
          type="text"
          placeholder="My Uploads"
          class="input input-bordered input-sm w-full"
          :disabled="isUploading"
        />
      </label>

      <!-- Model connection -->
      <div v-if="showModelConnect" class="flex flex-col gap-1">
        <span class="text-xs font-medium text-base-content/60">
          Link collection to (optional)
        </span>
        <div class="flex gap-2">
          <select
            v-model="connectedModelType"
            class="select select-bordered select-sm flex-1"
            :disabled="isUploading"
          >
            <option value="">— none —</option>
            <option v-for="m in connectableModels" :key="m" :value="m">
              {{ m }}
            </option>
          </select>
          <Transition name="slide">
            <input
              v-if="connectedModelType"
              v-model.number="connectedModelId"
              type="number"
              placeholder="ID"
              min="1"
              class="input input-bordered input-sm w-24"
              :disabled="isUploading"
            />
          </Transition>
        </div>
      </div>
    </template>

    <!-- Progress bar -->
    <Transition name="fade">
      <div v-if="isUploading" class="flex flex-col gap-1">
        <div class="flex justify-between text-xs text-base-content/60">
          <span>
            Uploading {{ uploadStore.uploadProgress }} /
            {{ uploadStore.uploadTotal }}
          </span>
          <span>{{ uploadStore.uploadPercent }}%</span>
        </div>
        <progress
          class="progress progress-primary w-full"
          :value="uploadStore.uploadProgress"
          :max="uploadStore.uploadTotal"
        />
      </div>
    </Transition>

    <!-- Action buttons -->
    <div class="flex gap-2">
      <!-- Upload batch -->
      <button
        v-if="queuedFiles.length > 0"
        type="button"
        class="btn btn-primary flex-1 rounded-2xl"
        :disabled="isUploading"
        @click="handleBatchUpload"
      >
        <span v-if="isUploading" class="loading loading-spinner loading-sm" />
        <Icon v-else name="kind-icon:camera" class="h-5 w-5" />
        <span>
          {{
            isUploading
              ? 'Uploading…'
              : `Upload ${queuedFiles.length} image${queuedFiles.length !== 1 ? 's' : ''}`
          }}
        </span>
      </button>

      <!-- Fallback: open file picker when queue is empty -->
      <button
        v-else
        type="button"
        class="btn btn-primary flex-1 rounded-2xl"
        :disabled="isUploading"
        @click="fileInput?.click()"
      >
        <Icon :name="icon" class="h-5 w-5" />
        <span>{{ buttonLabel }}</span>
      </button>

      <!-- Clear queue -->
      <button
        v-if="queuedFiles.length > 0 && !isUploading"
        type="button"
        class="btn btn-ghost rounded-2xl"
        @click="clearQueue"
      >
        Clear
      </button>
    </div>

    <!-- Status messages -->
    <Transition name="fade">
      <p v-if="uploadStore.message" class="text-sm text-success">
        {{ uploadStore.message }}
      </p>
    </Transition>

    <Transition name="fade">
      <p v-if="uploadStore.error" class="text-sm text-error">
        {{ uploadStore.error }}
      </p>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useUploadStore } from '@/stores/uploadStore'
import type { ConnectableModel } from '@/stores/uploadStore'

withDefaults(
  defineProps<{
    showModelConnect?: boolean
  }>(),
  { showModelConnect: false },
)

const uploadStore = useUploadStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const collectionName = ref('')
const connectedModelType = ref<ConnectableModel | ''>('')
const connectedModelId = ref<number | null>(null)

const connectableModels: ConnectableModel[] = [
  'Bot',
  'Character',
  'Dream',
  'Pitch',
  'Reward',
  'Scenario',
]

interface QueuedFile {
  id: string
  file: File
  preview: string
}

const queuedFiles = ref<QueuedFile[]>([])
const succeededNames = ref<Set<string>>(new Set())
const failedNames = ref<Set<string>>(new Set())

const isUploading = computed(() => uploadStore.isUploading)
const icon = computed(
  () => uploadStore.activeTarget?.icon ?? 'kind-icon:camera',
)
const buttonLabel = computed(
  () => uploadStore.activeTarget?.buttonLabel ?? 'Upload images',
)

function makeQueuedFile(file: File): QueuedFile {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    preview: URL.createObjectURL(file),
  }
}

function addFiles(incoming: FileList | File[]) {
  const candidates = Array.from(incoming).filter(
    (f) => !uploadStore.validateFile(f),
  )
  queuedFiles.value.push(...candidates.map(makeQueuedFile))
  succeededNames.value = new Set()
  failedNames.value = new Set()
}

function removeFile(index: number) {
  const [removed] = queuedFiles.value.splice(index, 1)
  URL.revokeObjectURL(removed.preview)
}

function clearQueue() {
  queuedFiles.value.forEach((q) => URL.revokeObjectURL(q.preview))
  queuedFiles.value = []
  succeededNames.value = new Set()
  failedNames.value = new Set()
  collectionName.value = ''
  connectedModelType.value = ''
  connectedModelId.value = null
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) addFiles(input.files)
  if (fileInput.value) fileInput.value.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files)
}

async function handleBatchUpload() {
  const files = queuedFiles.value.map((q) => q.file)
  const label =
    collectionName.value.trim() ||
    uploadStore.activeTarget?.collectionLabel ||
    'My Uploads'

  const result = await uploadStore.uploadBatchForActiveTarget(
    files,
    label,
    connectedModelType.value || null,
    connectedModelId.value || null,
  )

  succeededNames.value = new Set(result.succeeded.map((r) => r.fileName ?? ''))
  failedNames.value = new Set(result.failed.map((r) => r.fileName ?? ''))
}

onUnmounted(() => {
  queuedFiles.value.forEach((q) => URL.revokeObjectURL(q.preview))
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.grid-enter-active,
.grid-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.grid-enter-from,
.grid-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
