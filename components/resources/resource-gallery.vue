<!-- /components/resources/resource-gallery.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import {
  useResourceGalleryStore,
  type ResourceGalleryRecord,
} from '@/stores/resourceGalleryStore'
import { useArtStore } from '@/stores/artStore'
import { useNavStore } from '@/stores/navStore'
import type { Resource } from '@/stores/resourceStore'

const RESOURCE_TYPE = {
  CHECKPOINT: 'CHECKPOINT',
  LORA: 'LORA',
  LYCORIS: 'LYCORIS',
} as const

const resourceGalleryStore = useResourceGalleryStore()
const artStore = useArtStore()
const navStore = useNavStore()

const query = ref('')
const resourceType = ref('ALL')
const generation = ref('ALL')
const maturity = ref<'ALL' | 'SAFE' | 'MATURE'>('ALL')
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const activePreviewResourceId = ref<number | null>(null)
const activeUploadResourceId = ref<number | null>(null)

const showAddChoice = ref(false)
const showForm = ref(false)
const formKind = ref<'CHECKPOINT' | 'LORA'>('CHECKPOINT')
const editing = ref<Partial<Resource> | null>(null)

function openAddChoice(): void {
  showAddChoice.value = true
}

function startAdd(kind: 'CHECKPOINT' | 'LORA'): void {
  formKind.value = kind
  editing.value = null
  showAddChoice.value = false
  showForm.value = true
}

function openEdit(resource: ResourceGalleryRecord): void {
  formKind.value =
    resource.resourceType === RESOURCE_TYPE.CHECKPOINT ? 'CHECKPOINT' : 'LORA'
  editing.value = resource
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  showAddChoice.value = false
  editing.value = null
}

async function handleSaved(resource: Resource): Promise<void> {
  await resourceGalleryStore.getResource(resource.id)
  closeForm()
}

const resourceTypes = computed(() => {
  return [
    ...new Set(
      resourceGalleryStore.resources.map((entry) => entry.resourceType),
    ),
  ].sort()
})

const generations = computed(() => {
  return [
    ...new Set(
      resourceGalleryStore.resources
        .map((entry) => entry.generation?.trim())
        .filter((entry): entry is string => Boolean(entry)),
    ),
  ].sort((a, b) => a.localeCompare(b))
})

const filteredResources = computed(() => {
  const search = query.value.trim().toLowerCase()

  return resourceGalleryStore.resources.filter((entry) => {
    if (
      resourceType.value !== 'ALL' &&
      entry.resourceType !== resourceType.value
    ) {
      return false
    }

    if (generation.value !== 'ALL' && entry.generation !== generation.value) {
      return false
    }

    if (maturity.value === 'SAFE' && entry.isMature) return false
    if (maturity.value === 'MATURE' && !entry.isMature) return false

    if (!search) return true

    return [
      entry.customLabel,
      entry.name,
      entry.description,
      entry.generation,
      entry.supportedServer,
      entry.triggerWords,
      entry.defaultTrigger,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })
})

const galleryItems = computed<GalleryItem[]>(() =>
  filteredResources.value.map((resource) => ({
    id: resource.id,
    title: resourceLabel(resource),
    description: resource.description || undefined,
  })),
)

const resourceById = computed(
  () =>
    new Map(filteredResources.value.map((resource) => [resource.id, resource])),
)

function resourceLabel(resource: ResourceGalleryRecord): string {
  return resource.customLabel || resource.name
}

function resourceEngineName(resource: ResourceGalleryRecord): string {
  return resource.localPath || resource.name || resource.customLabel || ''
}

function triggerText(resource: ResourceGalleryRecord): string {
  return (
    resource.defaultTrigger || resource.triggerWords || resource.artPrompt || ''
  )
}

function appendPrompt(base: string, addition: string): string {
  const current = base.trim()
  const next = addition.trim()

  if (!next || current.toLowerCase().includes(next.toLowerCase()))
    return current
  return current ? `${current}, ${next}` : next
}

function addToGeneration(resource: ResourceGalleryRecord): void {
  const engineName = resourceEngineName(resource)

  if (resource.resourceType === RESOURCE_TYPE.CHECKPOINT) {
    artStore.setArtForm({
      checkpoint: engineName,
      checkpointResourceId: resource.id,
    })
  } else if (
    resource.resourceType === RESOURCE_TYPE.LORA ||
    resource.resourceType === RESOURCE_TYPE.LYCORIS
  ) {
    const currentIds = artStore.artForm.loraResourceIds ?? []
    const loraResourceIds = currentIds.includes(resource.id)
      ? currentIds
      : [...currentIds, resource.id]

    artStore.setArtForm({
      loraResourceIds,
      loraName: artStore.artForm.loraName || engineName,
      promptString: appendPrompt(
        artStore.artForm.promptString || '',
        triggerText(resource),
      ),
    })
  } else {
    artStore.setArtForm({
      promptString: appendPrompt(
        artStore.artForm.promptString || '',
        triggerText(resource) || resourceLabel(resource),
      ),
    })
  }

  messageTone.value = 'success'
  message.value = `${resourceLabel(resource)} added to the current generation.`
}

function startGeneration(resource: ResourceGalleryRecord): void {
  const isCheckpoint = resource.resourceType === RESOURCE_TYPE.CHECKPOINT
  const isLora =
    resource.resourceType === RESOURCE_TYPE.LORA ||
    resource.resourceType === RESOURCE_TYPE.LYCORIS

  artStore.setArtForm({
    promptString: triggerText(resource) || resourceLabel(resource),
    checkpoint: isCheckpoint ? resourceEngineName(resource) : '',
    checkpointResourceId: isCheckpoint ? resource.id : null,
    loraName: isLora ? resourceEngineName(resource) : null,
    loraResourceIds: isLora ? [resource.id] : [],
  })

  navStore.setDashboardTab(
    'art',
    'generate',
    `Start generation from Resource ${resource.id}`,
  )
}

async function generatePreview(resource: ResourceGalleryRecord): Promise<void> {
  activePreviewResourceId.value = resource.id
  message.value = ''

  try {
    const updated = await resourceGalleryStore.generatePreview(resource.id)
    messageTone.value = 'success'
    message.value = updated
      ? `Preview ready for ${resourceLabel(resource)}.`
      : `Preview queued for ${resourceLabel(resource)}.`
  } catch (cause) {
    messageTone.value = 'error'
    message.value =
      cause instanceof Error ? cause.message : 'Failed to generate preview.'
  } finally {
    activePreviewResourceId.value = null
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read preview image.'))
    reader.readAsDataURL(file)
  })
}

async function choosePreviewFile(
  resource: ResourceGalleryRecord,
): Promise<void> {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/png,image/jpeg,image/webp,image/avif'

  input.addEventListener(
    'change',
    async () => {
      const file = input.files?.[0]
      if (!file) return

      activeUploadResourceId.value = resource.id
      message.value = ''

      try {
        const imageData = await readFileAsDataUrl(file)
        await resourceGalleryStore.uploadPreview({
          resourceId: resource.id,
          imageData,
          fileName: file.name,
          fileType: file.type.split('/').at(-1),
        })
        messageTone.value = 'success'
        message.value = `Preview uploaded for ${resourceLabel(resource)}.`
      } catch (cause) {
        messageTone.value = 'error'
        message.value =
          cause instanceof Error ? cause.message : 'Failed to upload preview.'
      } finally {
        activeUploadResourceId.value = null
      }
    },
    { once: true },
  )

  input.click()
}

onMounted(async () => {
  await resourceGalleryStore.loadResources()
})
</script>

<template>
  <section class="flex min-h-full w-full flex-col gap-4">
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
    >
      <div
        class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between"
      >
        <div>
          <h2 class="text-2xl font-bold">Resource Gallery</h2>
          <p class="max-w-3xl text-sm text-base-content/65">
            Browse checkpoints, LoRAs, embeddings, and generation tools. Add one
            to the current build, start fresh, or manufacture a preview when the
            catalog arrived wearing a paper bag over its head.
          </p>
        </div>

        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-2xl"
            @click="openAddChoice"
          >
            <icon name="kind-icon:plus" class="h-4 w-4" />
            Add
          </button>

          <button
            type="button"
            class="btn btn-outline btn-sm rounded-2xl"
            :disabled="resourceGalleryStore.isLoading"
            @click="resourceGalleryStore.loadResources()"
          >
            <span
              v-if="resourceGalleryStore.isLoading"
              class="loading loading-spinner loading-xs"
            />
            <icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <maturity-toggle
        class="mt-4"
        variant="resource"
        label="Mature Resources"
        visible-text="Mature LoRAs and checkpoint models are included."
        hidden-text="Mature LoRAs and checkpoint models are hidden."
      />

      <div class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <label class="form-control">
          <span class="label-text text-xs">Search</span>
          <input
            v-model="query"
            type="search"
            class="input input-bordered rounded-2xl"
            placeholder="Name, trigger, base model..."
          />
        </label>

        <label class="form-control">
          <span class="label-text text-xs">Type</span>
          <select
            v-model="resourceType"
            class="select select-bordered rounded-2xl"
          >
            <option value="ALL">All types</option>
            <option v-for="type in resourceTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text text-xs">Base model</span>
          <select
            v-model="generation"
            class="select select-bordered rounded-2xl"
          >
            <option value="ALL">All base models</option>
            <option v-for="base in generations" :key="base" :value="base">
              {{ base }}
            </option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text text-xs">Maturity</span>
          <select v-model="maturity" class="select select-bordered rounded-2xl">
            <option value="ALL">Visible Resources</option>
            <option value="SAFE">Safe only</option>
            <option value="MATURE">Mature only</option>
          </select>
        </label>
      </div>
    </header>

    <div
      v-if="showAddChoice"
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <p class="text-sm font-bold">What are you adding?</p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          @click="startAdd('CHECKPOINT')"
        >
          Checkpoint
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          @click="startAdd('LORA')"
        >
          LoRA / LyCORIS
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          @click="closeForm"
        >
          Cancel
        </button>
      </div>
    </div>

    <add-model
      v-if="showForm && formKind === 'CHECKPOINT'"
      :model="editing"
      @saved="handleSaved"
      @close="closeForm"
    />
    <add-lora
      v-if="showForm && formKind === 'LORA'"
      :lora="editing"
      @saved="handleSaved"
      @close="closeForm"
    />

    <div
      v-if="message"
      class="rounded-2xl border p-3 text-sm"
      :class="
        messageTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ message }}
    </div>

    <div
      v-if="resourceGalleryStore.error"
      class="rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      {{ resourceGalleryStore.error }}
    </div>

    <!-- Resources currently have one canonical preview/card presentation, so the shared
         shell owns the grid, loading and empty states but intentionally exposes no
         Cards/Heroes/Icons control. A mode picker would promise variants this model
         does not implement. -->
    <kr-gallery
      :items="galleryItems"
      :modes="[]"
      :loading="
        resourceGalleryStore.isLoading && !resourceGalleryStore.resources.length
      "
      empty-label="Resources"
    >
      <template #item="{ item }">
        <resource-card
          v-if="resourceById.get(Number(item.id))"
          :resource="resourceById.get(Number(item.id))!"
          :generating-preview="activePreviewResourceId === Number(item.id)"
          :uploading-preview="activeUploadResourceId === Number(item.id)"
          @edit="openEdit"
          @add-to-build="addToGeneration"
          @start-fresh="startGeneration"
          @generate-preview="generatePreview"
          @upload-preview="choosePreviewFile"
        />
      </template>

      <template #empty>
        <div
          class="flex min-h-72 items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
        >
          No Resources match those filters.
        </div>
      </template>
    </kr-gallery>
  </section>
</template>
