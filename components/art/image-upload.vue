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

        <button
          v-if="!isUploading"
          type="button"
          class="btn btn-circle btn-error btn-xs absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
          :title="`Remove ${item.file.name}`"
          @click.stop="removeFile(i)"
        >
          <Icon name="mdi:close" class="h-3 w-3" />
        </button>

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
      <div class="flex flex-col gap-2">
        <span class="text-xs font-medium text-base-content/60">
          Upload to collection
        </span>

        <LazyArtGallery
          variant="dropdown"
          title="Upload Collection"
          subtitle="Choose where these images should land."
          :show-header="false"
          :show-controls="false"
          :show-selected-panel="false"
          :allow-add="true"
          :allow-edit="true"
          :allow-delete="false"
          :allow-merge="false"
          :allow-refresh="false"
        />
      </div>

      <!-- Model linker -->
      <div v-if="showModelConnect" class="flex flex-col gap-2">
        <span class="text-xs font-medium text-base-content/60">
          Link collection to (optional)
        </span>

        <!-- Model type picker -->
        <select
          v-model="connectedModelType"
          class="select select-bordered select-sm w-full"
          :disabled="isUploading"
          @change="clearModelSelection"
        >
          <option value="">— none —</option>
          <option v-for="m in connectableModels" :key="m" :value="m">
            {{ m }}
          </option>
        </select>

        <!-- Per-model gallery dropdown -->
        <Transition name="fade">
          <div
            v-if="connectedModelType"
            class="rounded-xl border border-base-300 bg-base-100 p-2"
          >
            <!-- Selected summary badge -->
            <div
              v-if="connectedModelId"
              class="mb-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs"
            >
              <Icon name="mdi:link-variant" class="h-3.5 w-3.5 text-primary" />
              <span class="font-medium text-primary">
                {{ connectedModelType }} #{{ connectedModelId }}
              </span>
              <button
                type="button"
                class="btn btn-ghost btn-xs ml-auto h-5 min-h-0 px-1"
                @click="clearModelSelection"
              >
                <Icon name="mdi:close" class="h-3 w-3" />
              </button>
            </div>

            <LazyBotGallery
              v-if="connectedModelType === 'Bot'"
              variant="dropdown"
              :show-header="true"
              :show-controls="false"
              :allow-add="false"
              :allow-edit="false"
              :allow-delete="false"
              :allow-refresh="false"
            />

            <LazyCharacterGallery
              v-else-if="connectedModelType === 'Character'"
              variant="dropdown"
              :show-header="true"
              :show-controls="false"
              :allow-add="false"
              :allow-edit="false"
              :allow-delete="false"
              :allow-refresh="false"
            />

            <LazyDreamGallery
              v-else-if="connectedModelType === 'Dream'"
              variant="dropdown"
              :show-header="true"
              :show-controls="false"
              :allow-add="false"
              :allow-edit="false"
              :allow-delete="false"
              :allow-refresh="false"
            />

            <LazyPitchGallery
              v-else-if="connectedModelType === 'Pitch'"
              variant="dropdown"
              :show-header="true"
              :show-controls="false"
              :allow-add="false"
              :allow-edit="false"
              :allow-delete="false"
              :allow-refresh="false"
            />

            <LazyRewardGallery
              v-else-if="connectedModelType === 'Reward'"
              variant="dropdown"
              :show-header="true"
              :show-controls="false"
              :allow-add="false"
              :allow-edit="false"
              :allow-delete="false"
              :allow-refresh="false"
            />

            <LazyScenarioGallery
              v-else-if="connectedModelType === 'Scenario'"
              variant="dropdown"
              :show-header="true"
              :show-controls="false"
              :allow-add="false"
              :allow-edit="false"
              :allow-delete="false"
              :allow-refresh="false"
            />
          </div>
        </Transition>
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
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useCollectionStore } from '@/stores/collectionStore'

withDefaults(
  defineProps<{
    showModelConnect?: boolean
  }>(),
  { showModelConnect: false },
)

const uploadStore = useUploadStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const pitchStore = usePitchStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const collectionStore = useCollectionStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const connectedModelType = ref<ConnectableModel | ''>('')

const connectableModels: ConnectableModel[] = [
  'Bot',
  'Character',
  'Dream',
  'Pitch',
  'Reward',
  'Scenario',
]

const connectedModelId = computed<number | null>(() => {
  switch (connectedModelType.value) {
    case 'Bot':
      return botStore.currentBot?.id ?? null
    case 'Character':
      return characterStore.selectedCharacter?.id ?? null
    case 'Dream':
      return dreamStore.selectedDream?.id ?? null
    case 'Pitch':
      return pitchStore.selectedPitch?.id ?? null
    case 'Reward':
      return rewardStore.selectedReward?.id ?? null
    case 'Scenario':
      return scenarioStore.selectedScenario?.id ?? null
    default:
      return null
  }
})

function clearModelSelection() {
  botStore.deselectBot()
  characterStore.deselectCharacter()
  dreamStore.deselectDream()
  pitchStore.deselectPitch()
  rewardStore.deselectReward()
  scenarioStore.deselectScenario()
}

function removeFile(index: number) {
  const removed = queuedFiles.value.splice(index, 1)[0]
  if (removed) URL.revokeObjectURL(removed.preview)
}
// ── Queue management ──────────────────────────────────────────────────────────

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
  const valid = Array.from(incoming).filter((f) => !uploadStore.validateFile(f))
  queuedFiles.value.push(...valid.map(makeQueuedFile))
  succeededNames.value = new Set()
  failedNames.value = new Set()
}

function clearQueue() {
  queuedFiles.value.forEach((q) => URL.revokeObjectURL(q.preview))
  queuedFiles.value = []
  succeededNames.value = new Set()
  failedNames.value = new Set()
  connectedModelType.value = ''
  clearModelSelection()
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

  if (!files.length) return

  const selectedCollection = collectionStore.currentCollection

  const label =
    selectedCollection?.label?.trim() ||
    uploadStore.activeTarget?.collectionLabel ||
    'My Uploads'

  const modelType = connectedModelType.value || null
  const modelId =
    modelType && connectedModelId.value ? connectedModelId.value : null

  const result = await uploadStore.uploadBatchForActiveTarget(
    files,
    undefined,
    modelType && modelId ? modelType : null,
    modelId,
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
