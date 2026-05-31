<!-- /components/art/image-upload.vue -->
<template>
  <section
    class="flex w-full flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/png, image/jpeg, image/webp"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- ── Drop zone ──────────────────────────────────────────────────── -->
    <div
      class="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-200"
      :class="
        isDragging
          ? 'scale-[1.01] border-primary bg-primary/10 shadow-lg shadow-primary/20'
          : 'border-base-300 bg-base-100/60 hover:border-primary/60 hover:bg-base-100 hover:shadow-sm'
      "
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="fileInput?.click()"
    >
      <span
        class="flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300 bg-base-200 transition-transform"
        :class="
          isDragging
            ? 'scale-110 border-primary/40 bg-primary/10 text-primary'
            : 'text-base-content/40'
        "
      >
        <Icon :name="icon" class="h-7 w-7" />
      </span>
      <div class="text-center">
        <p class="text-sm font-semibold text-base-content/70">
          Drop images here or
          <span class="font-bold text-primary underline underline-offset-2"
            >browse</span
          >
        </p>
        <p class="mt-0.5 text-xs text-base-content/40">
          PNG · JPEG · WebP · multiple OK
        </p>
      </div>
    </div>

    <!-- ── File preview grid ──────────────────────────────────────────── -->
    <TransitionGroup
      v-if="queuedFiles.length"
      name="grid"
      tag="div"
      class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
    >
      <div
        v-for="(item, i) in queuedFiles"
        :key="item.id"
        class="group relative aspect-square overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <img
          :src="item.preview"
          :alt="item.file.name"
          class="h-full w-full object-cover transition-transform group-hover:scale-105"
        />

        <button
          v-if="!isUploading"
          type="button"
          class="btn btn-circle btn-error btn-xs absolute right-1 top-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
          :title="`Remove ${item.file.name}`"
          @click.stop="removeFile(i)"
        >
          <Icon name="mdi:close" class="h-3 w-3" />
        </button>

        <Transition name="fade">
          <div
            v-if="succeededNames.has(item.file.name)"
            class="absolute inset-0 flex items-center justify-center bg-success/60 backdrop-blur-sm"
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
            class="absolute inset-0 flex items-center justify-center bg-error/60 backdrop-blur-sm"
          >
            <Icon
              name="mdi:close-circle"
              class="h-7 w-7 text-error-content drop-shadow"
            />
          </div>
        </Transition>
      </div>
    </TransitionGroup>

    <!-- ── Metadata + options ─────────────────────────────────────────── -->
    <template v-if="queuedFiles.length">
      <div
        class="grid gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <!-- Collection selector -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-1.5">
            <icon name="kind-icon:folder" class="h-4 w-4 text-secondary" />
            <span class="text-xs font-bold text-base-content/70"
              >Add to collection</span
            >
          </div>

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

          <p class="text-xs text-base-content/50">
            Selected:
            <span class="font-semibold text-primary">{{
              selectedCollectionLabel
            }}</span>
          </p>
        </div>

        <div class="border-t border-base-300 pt-3">
          <!-- Metadata section header -->
          <div class="mb-3 flex items-center gap-2">
            <icon name="kind-icon:settings" class="h-4 w-4 text-primary" />
            <h3 class="text-sm font-black text-base-content">Image Metadata</h3>
            <span class="text-xs text-base-content/40"
              >Optional — added to every image in this batch</span
            >
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold"
                >Designer</span
              >
              <input
                v-model.trim="imageForm.designer"
                type="text"
                class="input input-bordered input-sm"
                :disabled="isUploading"
                placeholder="who made this beautiful little menace?"
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold">Genres</span>
              <input
                v-model.trim="imageForm.genres"
                type="text"
                class="input input-bordered input-sm"
                :disabled="isUploading"
                placeholder="gothic, surreal, sci-fi"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text mb-1 text-xs font-semibold">Prompt</span>
              <textarea
                v-model.trim="imageForm.promptString"
                class="textarea textarea-bordered min-h-24"
                :disabled="isUploading"
                placeholder="Prompt used to generate this image"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text mb-1 text-xs font-semibold"
                >Negative Prompt</span
              >
              <textarea
                v-model.trim="imageForm.negativePrompt"
                class="textarea textarea-bordered min-h-16"
                :disabled="isUploading"
                placeholder="Things excluded from generation"
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold"
                >Checkpoint</span
              >
              <input
                v-model.trim="imageForm.checkpoint"
                type="text"
                class="input input-bordered input-sm"
                :disabled="isUploading"
                placeholder="model checkpoint"
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold">Sampler</span>
              <input
                v-model.trim="imageForm.sampler"
                type="text"
                class="input input-bordered input-sm"
                :disabled="isUploading"
                placeholder="Euler a, DPM++ 2M, etc."
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold">Seed</span>
              <input
                v-model.number="imageForm.seed"
                type="number"
                class="input input-bordered input-sm"
                :disabled="isUploading"
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold">Steps</span>
              <input
                v-model.number="imageForm.steps"
                type="number"
                min="1"
                class="input input-bordered input-sm"
                :disabled="isUploading"
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold">CFG</span>
              <input
                v-model.number="imageForm.cfg"
                type="number"
                min="0"
                class="input input-bordered input-sm"
                :disabled="isUploading"
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold">Rarity</span>
              <input
                v-model.number="imageForm.rarity"
                type="number"
                min="0"
                class="input input-bordered input-sm"
                :disabled="isUploading"
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold"
                >Server name</span
              >
              <input
                v-model.trim="imageForm.serverName"
                type="text"
                class="input input-bordered input-sm"
                :disabled="isUploading"
                placeholder="A1111, Comfy, Flux…"
              />
            </label>

            <label class="form-control">
              <span class="label-text mb-1 text-xs font-semibold"
                >Server URL</span
              >
              <input
                v-model.trim="imageForm.serverUrl"
                type="text"
                class="input input-bordered input-sm"
                :disabled="isUploading"
                placeholder="optional source endpoint"
              />
            </label>
          </div>

          <!-- Flag toggles -->
          <div class="mt-3 flex flex-wrap gap-2">
            <label
              class="label cursor-pointer gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <input
                v-model="imageForm.cfgHalf"
                type="checkbox"
                class="toggle toggle-primary toggle-xs"
                :disabled="isUploading"
              />
              <span class="label-text text-xs font-semibold">CFG + 0.5</span>
            </label>
            <label
              class="label cursor-pointer gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <input
                v-model="imageForm.isPublic"
                type="checkbox"
                class="toggle toggle-success toggle-xs"
                :disabled="isUploading"
              />
              <span class="label-text text-xs font-semibold">Public</span>
            </label>
            <label
              class="label cursor-pointer gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <input
                v-model="imageForm.isMature"
                type="checkbox"
                class="toggle toggle-warning toggle-xs"
                :disabled="isUploading"
              />
              <span class="label-text text-xs font-semibold">Mature</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Model connect -->
      <div v-if="showModelConnect" class="flex flex-col gap-2">
        <div class="flex items-center gap-1.5">
          <icon name="kind-icon:link" class="h-4 w-4 text-accent" />
          <span class="text-xs font-bold text-base-content/70"
            >Link image owner to model</span
          >
        </div>

        <select
          v-model="connectedModelType"
          class="select select-bordered select-sm w-full"
          :disabled="isUploading"
          @change="clearModelSelection"
        >
          <option value="">None</option>
          <option v-for="m in connectableModels" :key="m" :value="m">
            {{ m }}
          </option>
        </select>

        <Transition name="fade">
          <div
            v-if="connectedModelType"
            class="rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <div
              v-if="connectedModelId"
              class="mb-2 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs"
            >
              <Icon name="mdi:link-variant" class="h-4 w-4 text-primary" />
              <span class="font-semibold text-primary"
                >{{ connectedModelType }} #{{ connectedModelId }}</span
              >
              <button
                type="button"
                class="btn btn-ghost btn-xs ml-auto h-6 min-h-0 px-2"
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

    <!-- ── Upload progress ────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="isUploading" class="flex flex-col gap-2">
        <div
          class="flex items-center justify-between text-xs font-semibold text-base-content/60"
        >
          <span class="flex items-center gap-1.5">
            <span class="loading loading-spinner loading-xs text-primary" />
            Uploading {{ uploadProgress }} / {{ uploadTotal }}
          </span>
          <span class="font-bold text-primary">{{ uploadPercent }}%</span>
        </div>
        <progress
          class="progress progress-primary w-full"
          :value="uploadProgress"
          :max="uploadTotal"
        />
      </div>
    </Transition>

    <!-- ── Action buttons ─────────────────────────────────────────────── -->
    <div class="flex gap-2">
      <button
        v-if="queuedFiles.length"
        type="button"
        class="btn btn-primary flex-1 rounded-2xl font-black shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-primary/30 active:translate-y-0"
        :disabled="isUploading"
        @click="handleBatchUpload"
      >
        <span v-if="isUploading" class="loading loading-spinner loading-sm" />
        <Icon v-else name="kind-icon:camera" class="h-5 w-5" />
        {{
          isUploading
            ? 'Uploading…'
            : `Upload ${queuedFiles.length} image${queuedFiles.length !== 1 ? 's' : ''}`
        }}
      </button>

      <button
        v-else
        type="button"
        class="btn btn-primary flex-1 rounded-2xl font-black"
        :disabled="isUploading"
        @click="fileInput?.click()"
      >
        <Icon :name="icon" class="h-5 w-5" />
        {{ buttonLabel }}
      </button>

      <button
        v-if="queuedFiles.length && !isUploading"
        type="button"
        class="btn btn-ghost rounded-2xl"
        @click="clearQueue"
      >
        Clear
      </button>
    </div>

    <!-- Status messages -->
    <Transition name="fade">
      <p
        v-if="message"
        class="flex items-center gap-1.5 text-sm font-semibold text-success"
      >
        <icon name="kind-icon:check" class="h-4 w-4" />{{ message }}
      </p>
    </Transition>
    <Transition name="fade">
      <p
        v-if="error"
        class="flex items-center gap-1.5 text-sm font-semibold text-error"
      >
        <icon name="kind-icon:alert" class="h-4 w-4" />{{ error }}
      </p>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useUploadStore } from '@/stores/uploadStore'
import type { ConnectableModel } from '@/stores/uploadStore'
import { useArtStore } from '@/stores/artStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'
import { useServerStore } from '@/stores/serverStore'

withDefaults(defineProps<{ showModelConnect?: boolean }>(), {
  showModelConnect: false,
})

type ImageUploadForm = {
  promptString: string
  negativePrompt: string
  checkpoint: string
  sampler: string
  seed: number | null
  steps: number | null
  cfg: number | null
  cfgHalf: boolean
  designer: string
  genres: string
  rarity: number | null
  isPublic: boolean
  isMature: boolean
  serverId: number | null
  serverName: string
  serverUrl: string
}
interface QueuedFile {
  id: string
  file: File
  preview: string
}
type UploadResult = { fileName?: string | null; id?: number }

const uploadStore = useUploadStore()
const artStore = useArtStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const pitchStore = usePitchStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const collectionStore = useCollectionStore()
const userStore = useUserStore()
const serverStore = useServerStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadTotal = ref(0)
const message = ref('')
const error = ref('')
const connectedModelType = ref<ConnectableModel | ''>('')
const queuedFiles = ref<QueuedFile[]>([])
const succeededNames = ref<Set<string>>(new Set())
const failedNames = ref<Set<string>>(new Set())

const imageForm = reactive<ImageUploadForm>({
  promptString: '',
  negativePrompt: '',
  checkpoint: '',
  sampler: '',
  seed: -1,
  steps: null,
  cfg: 3,
  cfgHalf: false,
  designer: '',
  genres: '',
  rarity: null,
  isPublic: false,
  isMature: false,
  serverId: null,
  serverName: '',
  serverUrl: '',
})

const connectableModels: ConnectableModel[] = [
  'Bot',
  'Character',
  'Dream',
  'Pitch',
  'Reward',
  'Scenario',
]

const icon = computed(
  () => uploadStore.activeTarget?.icon ?? 'kind-icon:camera',
)
const buttonLabel = computed(
  () => uploadStore.activeTarget?.buttonLabel ?? 'Upload images',
)
const uploadPercent = computed(() =>
  !uploadTotal.value
    ? 0
    : Math.round((uploadProgress.value / uploadTotal.value) * 100),
)
const selectedCollection = computed(() => collectionStore.currentCollection)
const selectedCollectionLabel = computed(
  () => selectedCollection.value?.label?.trim() || 'None selected',
)

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

const connectedModelPayload = computed(() => {
  if (!connectedModelType.value || !connectedModelId.value) return null
  return { model: connectedModelType.value, modelId: connectedModelId.value }
})

function getServerUrl(server: typeof serverStore.activeArtServer): string {
  if (!server) return ''
  return server.baseUrl || server.apiLink || ''
}

watchEffect(() => {
  const activeServer = serverStore.activeArtServer
  if (!activeServer) return
  imageForm.serverId = activeServer.id
  imageForm.serverName = activeServer.label || activeServer.title || ''
  imageForm.serverUrl = getServerUrl(activeServer)
})

function clearModelSelection() {
  botStore.deselectBot()
  characterStore.deselectCharacter()
  dreamStore.deselectDream()
  pitchStore.deselectPitch()
  rewardStore.deselectReward()
  scenarioStore.deselectScenario()
}

function makeQueuedFile(file: File): QueuedFile {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    preview: URL.createObjectURL(file),
  }
}

function addFiles(incoming: FileList | File[]) {
  const valid = Array.from(incoming).filter(
    (file) => !uploadStore.validateFile(file),
  )
  queuedFiles.value.push(...valid.map(makeQueuedFile))
  succeededNames.value = new Set()
  failedNames.value = new Set()
  message.value = ''
  error.value = ''
}

function clearUploadedImages() {
  queuedFiles.value.forEach((item) => URL.revokeObjectURL(item.preview))
  queuedFiles.value = []
  succeededNames.value = new Set()
  failedNames.value = new Set()
  connectedModelType.value = ''
  uploadProgress.value = 0
  uploadTotal.value = 0
  if (fileInput.value) fileInput.value.value = ''
  clearModelSelection()
}

function removeFile(index: number) {
  const removed = queuedFiles.value.splice(index, 1)[0]
  if (removed) URL.revokeObjectURL(removed.preview)
}

function clearQueue() {
  queuedFiles.value.forEach((item) => URL.revokeObjectURL(item.preview))
  queuedFiles.value = []
  succeededNames.value = new Set()
  failedNames.value = new Set()
  connectedModelType.value = ''
  uploadProgress.value = 0
  uploadTotal.value = 0
  message.value = ''
  error.value = ''
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

function appendText(
  formData: FormData,
  key: string,
  value: string | null | undefined,
) {
  const cleanValue = value?.trim()
  if (cleanValue) formData.append(key, cleanValue)
}
function appendNumber(
  formData: FormData,
  key: string,
  value: number | null | undefined,
) {
  if (typeof value === 'number' && Number.isFinite(value))
    formData.append(key, String(value))
}
function appendBoolean(formData: FormData, key: string, value: boolean) {
  formData.append(key, value ? 'true' : 'false')
}

function buildImageFormData(file: File): FormData {
  const formData = new FormData()
  const modelConnection = connectedModelPayload.value
  const collectionId = selectedCollection.value?.id ?? null
  formData.append('file', file)
  formData.append('fileName', file.name)
  formData.append('fileType', file.type.replace('image/', '') || 'png')
  appendNumber(formData, 'userId', userStore.userId || userStore.user?.id || 10)
  appendNumber(formData, 'artCollectionId', collectionId)
  appendNumber(formData, 'serverId', imageForm.serverId)
  appendNumber(formData, 'seed', imageForm.seed)
  appendNumber(formData, 'steps', imageForm.steps)
  appendNumber(formData, 'cfg', imageForm.cfg)
  appendNumber(formData, 'rarity', imageForm.rarity)
  appendText(formData, 'promptString', imageForm.promptString)
  appendText(formData, 'negativePrompt', imageForm.negativePrompt)
  appendText(formData, 'checkpoint', imageForm.checkpoint)
  appendText(formData, 'sampler', imageForm.sampler)
  appendText(formData, 'designer', imageForm.designer)
  appendText(formData, 'genres', imageForm.genres)
  appendText(formData, 'serverName', imageForm.serverName)
  appendText(formData, 'serverUrl', imageForm.serverUrl)
  appendBoolean(formData, 'cfgHalf', imageForm.cfgHalf)
  appendBoolean(formData, 'isPublic', imageForm.isPublic)
  appendBoolean(formData, 'isMature', imageForm.isMature)
  if (modelConnection) {
    formData.append('connectedModelType', modelConnection.model)
    formData.append('connectedModelId', String(modelConnection.modelId))
  }
  return formData
}

async function handleBatchUpload() {
  if (!queuedFiles.value.length || isUploading.value) return
  isUploading.value = true
  uploadProgress.value = 0
  uploadTotal.value = queuedFiles.value.length
  succeededNames.value = new Set()
  failedNames.value = new Set()
  message.value = ''
  error.value = ''
  const succeeded: UploadResult[] = []
  const failed: UploadResult[] = []
  for (const item of queuedFiles.value) {
    const result = await artStore.uploadImage(buildImageFormData(item.file))
    if (result.success && result.data) {
      succeeded.push({
        fileName: result.data.fileName || item.file.name,
        id: result.data.id,
      })
      succeededNames.value = new Set([...succeededNames.value, item.file.name])
    } else {
      failed.push({ fileName: item.file.name })
      failedNames.value = new Set([...failedNames.value, item.file.name])
    }
    uploadProgress.value += 1
  }
  if (failed.length)
    error.value = `${failed.length} image${failed.length === 1 ? '' : 's'} failed.`
  if (succeeded.length)
    message.value = `Uploaded ${succeeded.length} art image${succeeded.length === 1 ? '' : 's'}.`
  isUploading.value = false
  if (succeeded.length && !failed.length) clearUploadedImages()
}

onUnmounted(() => {
  queuedFiles.value.forEach((item) => URL.revokeObjectURL(item.preview))
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
