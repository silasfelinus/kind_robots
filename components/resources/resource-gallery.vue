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
import { useUserStore } from '@/stores/userStore'
import type { Resource } from '@/stores/resourceStore'

const RESOURCE_TYPE = {
  CHECKPOINT: 'CHECKPOINT',
  LORA: 'LORA',
  LYCORIS: 'LYCORIS',
} as const

const resourceGalleryStore = useResourceGalleryStore()
const artStore = useArtStore()
const navStore = useNavStore()
const userStore = useUserStore()

const query = ref('')
const resourceType = ref('ALL')
const generation = ref('ALL')
/*
 * THE maturity rule, and the only one.
 *
 * Two bugs lived here. The filter defaulted to 'ALL' and consulted no account
 * state at all, so a signed-out guest was served mature LoRAs and checkpoints
 * on first paint -- Silas, 2026-08-07: "the default for guests seems to be
 * visible resources, no safe only!". And a Maturity <select> sat beside the
 * account-level maturity-toggle offering All / Safe only / Mature only, so the
 * page carried two controls for one concept that openly disagreed on screen.
 *
 * Both are gone. This computed IS the rule: mature allowed, or safe. It reads
 * userStore.showMature, which is already CHILD-restricted (a CHILD reads false
 * even with the flag set), so the restriction is inherited rather than
 * re-derived here.
 */
const canSeeMature = computed(() => Boolean(userStore.showMature))
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

    // ONE maturity control, and it is the account toggle. There used to be a
    // second: a Maturity <select> (All / Safe only / Mature only) sitting
    // beside the account-level maturity-toggle and disagreeing with it -- the
    // toggle read "Mature LoRAs and checkpoint models are included" while the
    // select read "Safe only". Silas, 2026-08-07: "we aren't really going to
    // need: only show mature: just base it on our real toggle, so we are
    // either showing all, or safe".
    //
    // So the whole select is gone and this is the entire rule: mature allowed,
    // or safe. Two controls for one concept can only ever agree by accident.
    if (!canSeeMature.value && entry.isMature) return false

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
    <!--
      ONE HEADER ROW. This <header> was a single band but FOUR stacked rows
      inside it: a text-2xl title beside a three-line paragraph, a
      `resource`-variant maturity toggle (a labelled block with its own
      explanatory sentence), and a four-up grid of labelled filters that becomes
      FOUR rows on a phone (`sm:grid-cols-2 xl:grid-cols-4` collapses to one
      column below sm).

      Title and actions stay here; every filter moves to kr-gallery's `#toolbar`
      slot. The blurb survives at md+ only -- it is orientation text, and it was
      costing three rows on exactly the screens with the fewest to spare.
    -->
    <header
      class="rounded-2xl border border-base-300 bg-base-100 px-3 py-2 shadow-sm"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="min-w-0">
          <h2 class="text-base font-bold">Resource Gallery</h2>
          <p
            class="hidden max-w-3xl truncate text-xs text-base-content/65 md:block"
          >
            Browse checkpoints, LoRAs, embeddings, and generation tools. Add one
            to the current build, start fresh, or manufacture a preview when the
            catalog arrived wearing a paper bag over its head.
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <!-- The Library/Discover switch lands HERE rather than in a strip of
               its own above the page. resource-manager fills it; a host that
               only wants the gallery passes nothing and the row is unchanged. -->
          <slot name="tabs" />

          <button
            type="button"
            class="btn btn-primary btn-xs rounded-2xl"
            @click="openAddChoice"
          >
            <icon name="kind-icon:plus" class="h-3.5 w-3.5" />
            Add
          </button>

          <button
            type="button"
            class="btn btn-outline btn-xs rounded-2xl"
            :disabled="resourceGalleryStore.isLoading"
            @click="resourceGalleryStore.loadResources()"
          >
            <span
              v-if="resourceGalleryStore.isLoading"
              class="loading loading-spinner loading-xs"
            />
            <icon v-else name="kind-icon:refresh" class="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
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
      <!-- The filters, on one line. `:modes="[]"` above still hides the
           Cards/Heroes/Icons picker (Silas: Resources have one canonical card),
           and the shell renders this bar for a toolbar alone -- so the controls
           get the line without the mode picker coming back with them.

           Labels become aria-labels rather than stacked `label-text` spans: a
           labelled form-control is two rows tall each, which is what made four
           filters into four rows on a phone. -->
      <template #toolbar>
        <div class="flex flex-wrap items-center gap-1.5">
          <input
            v-model="query"
            type="search"
            class="input input-bordered input-xs w-36 rounded-2xl sm:w-52"
            placeholder="Name, trigger, base model..."
            aria-label="Search Resources"
          />

          <select
            v-model="resourceType"
            class="select select-bordered select-xs rounded-2xl"
            aria-label="Filter by resource type"
          >
            <option value="ALL">All types</option>
            <option v-for="type in resourceTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>

          <select
            v-model="generation"
            class="select select-bordered select-xs rounded-2xl"
            aria-label="Filter by base model"
          >
            <option value="ALL">All base models</option>
            <option v-for="base in generations" :key="base" :value="base">
              {{ base }}
            </option>
          </select>

          <!-- `icon`, not `resource`: the resource variant is a labelled block
               with an explanatory sentence, which is a band of its own. -->
          <maturity-toggle
            variant="icon"
            label="Mature Resources"
            visible-text="Mature LoRAs and checkpoint models are included."
            hidden-text="Mature LoRAs and checkpoint models are hidden."
          />
        </div>
      </template>

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
