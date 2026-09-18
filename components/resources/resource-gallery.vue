<!-- /components/resources/resource-gallery.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import {
  useResourceGalleryStore,
  type ResourceGalleryRecord,
} from '@/stores/resourceGalleryStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import type { Resource } from '@/stores/resourceStore'
import ShareManager from '@/components/sharing/share-manager.vue'
import { querySelectionId } from '@/utils/routeSelection'

const RESOURCE_TYPE = {
  CHECKPOINT: 'CHECKPOINT',
  LORA: 'LORA',
  LYCORIS: 'LYCORIS',
} as const

const resourceGalleryStore = useResourceGalleryStore()
const artStore = useArtStore()
const userStore = useUserStore()

const query = ref('')
const resourceType = ref('ALL')
const generation = ref('ALL')

const route = useRoute()
const router = useRouter()

/*
 * `/resources?resourceId=2726` opens one resource.
 *
 * Every other manager already reads an id out of the query -- characters, bots,
 * dreams, rewards, scenarios -- and utils/routeSelection.ts exists because two
 * of them had each grown a private copy of the reader. This gallery had only a
 * `tab` parameter, which meant the ArtQueue's new "made for this object" link
 * could offer nothing better than an unfiltered list of 2,226 rows, for the
 * single commonest case in the queue: every LoRA probe is entityType
 * `resource`.
 *
 * Silas, 2026-08-28: "These displays should always lead to something, not just
 * static displays of images and text."
 */
const selectedResourceId = computed<number | null>(() =>
  querySelectionId(route.query.resourceId ?? route.query.resource),
)

/*
 * The selected row as the catalog knows it, before the maturity rule.
 *
 * A direct link to a mature resource with the account toggle off rendered "No
 * Resources match those filters" -- true, and useless: you followed an explicit
 * link and the page gave you no way to know why it was empty (Silas,
 * 2026-09-17, who found it by flipping the toggle himself).
 */
const selectedResourceRow = computed(() =>
  selectedResourceId.value === null
    ? null
    : (resourceGalleryStore.resources.find(
        (entry) => entry.id === selectedResourceId.value,
      ) ?? null),
)

const selectedHiddenByMaturity = computed(
  () => Boolean(selectedResourceRow.value?.isMature) && !canSeeMature.value,
)

function clearSelectedResource() {
  const next = { ...route.query }
  delete next.resourceId
  delete next.resource
  router.replace({ query: next })
}
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

/*
 * A VETTING view, not a second maturity control.
 *
 * `canSeeMature` decides what the catalog may show at all; this narrows an
 * already-permitted list down to just the flagged rows, which is what makes
 * reviewing them practical -- Silas needs to walk the ones the auto-tagger
 * flagged and confirm or clear each. It only renders when showMature is on, so
 * it can never contradict the account toggle the way the old Maturity <select>
 * did: with mature hidden there is nothing for it to narrow to.
 */
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const activePreviewResourceId = ref<number | null>(null)

/*
 * INFO FIRST. Selecting a Resource turns the card over to its stats rather
 * than doing anything to it -- the same frame Bots uses, which is the point of
 * kr-card-back existing rather than each gallery growing its own panel.
 *
 * The id is the open state so the two cannot disagree; only the false
 * direction is writable, because the flip closes itself on Escape and the
 * backdrop and needs somewhere to put that.
 */
const infoResourceId = ref<number | null>(null)

const infoResource = computed(
  () =>
    resourceGalleryStore.resources.find(
      (entry) => entry.id === infoResourceId.value,
    ) ?? null,
)

const infoOpen = computed({
  get: () => infoResourceId.value !== null,
  set: (value: boolean) => {
    if (!value) infoResourceId.value = null
  },
})

/*
 * HYDRATE ON OPEN. The list payload is trimmed to what a card draws, so a row
 * in the grid is missing the fields the editor needs (civitaiUrl, hash, the
 * timestamps). Fetching the full record by id when the card turns over is the
 * "detail fetch, not every row" half of that trade -- getResource replaces the
 * store entry in place, so the panel re-renders with the complete record and
 * the form has everything it edits.
 *
 * Deliberately NOT awaited before opening: the panel shows the fields it
 * already has immediately and fills in the rest, rather than making the flip
 * wait on a round trip.
 */
function openResourceInfo(id: number): void {
  infoResourceId.value = id
  void resourceGalleryStore.getResource(id)
}

const infoResourceArt = computed(() => {
  const entry = infoResource.value
  if (!entry) return ''

  return (
    entry.ArtImage?.thumbnailPath ||
    entry.ArtImage?.imagePath ||
    entry.previewImageUrl ||
    entry.imagePath ||
    ''
  )
})

const infoResourceTrigger = computed(() => {
  const entry = infoResource.value
  if (!entry) return ''
  return entry.defaultTrigger || entry.triggerWords || entry.artPrompt || ''
})

/*
 * The back shows a description only when there is one worth reading, on the
 * same rule the card front uses -- an import string restating the badges is no
 * more useful at full size than it was at card size.
 */
const infoResourceDescription = computed(() => {
  const entry = infoResource.value
  if (!entry) return ''
  const text = (entry.description || '').trim()
  return isMachineDescription(text) ? '' : text
})

const infoResourceBadges = computed(() => {
  const entry = infoResource.value
  if (!entry) return []

  return [entry.resourceType, entry.generation, entry.isMature ? '18+' : '']
    .filter((value): value is string => Boolean(value))
    .map(String)
})

/*
 * Owner or admin only (kind-robots/t-099), the same rule
 * resource-share-panel.vue already applies to sharing this same Resource.
 * The PATCH route enforces this server-side regardless (isOwner/isAdmin/
 * hasAdminGrant), but showing the Edit button to a viewer who can only ever
 * get a 403 back is its own bug -- this keeps the button honest about who it
 * actually works for.
 */
const canEditInfoResource = computed(() => {
  const entry = infoResource.value
  if (!entry) return false
  if (!EDITABLE_RESOURCE_TYPES.includes(String(entry.resourceType)))
    return false
  return entry.userId === userStore.userId || userStore.isAdmin
})

/*
 * DELETING A RESOURCE, AND OPTIONALLY WHAT IT MADE.
 *
 * Silas, 2026-09-17: "we should also be able to delete resources, with the
 * option to cascade them to the generated image(s)."
 *
 * Two clicks, not one, and the cascade is a deliberate second choice rather
 * than a default -- a public LoRA can have hundreds of renders behind it, and
 * the server only ever deletes the ones the caller owns. Delete rights follow
 * ownership rather than the edit gate: EDITABLE_RESOURCE_TYPES exists because
 * only checkpoints and LoRAs have a form, which has nothing to do with whether
 * a row is yours to remove.
 */
const canDeleteInfoResource = computed(() => {
  const entry = infoResource.value
  if (!entry) return false
  return entry.userId === userStore.userId || userStore.isAdmin
})

const confirmingDelete = ref(false)
const cascadeImagesOnDelete = ref(false)
const deletingResourceId = ref<number | null>(null)

function startDelete(): void {
  confirmingDelete.value = true
  cascadeImagesOnDelete.value = false
}

function cancelDelete(): void {
  confirmingDelete.value = false
  cascadeImagesOnDelete.value = false
}

async function confirmDelete(close: () => void): Promise<void> {
  const entry = infoResource.value
  if (!entry || deletingResourceId.value !== null) return

  deletingResourceId.value = entry.id

  try {
    const result = await resourceGalleryStore.deleteResource(entry.id, {
      cascadeImages: cascadeImagesOnDelete.value,
    })

    if (!result) return

    deleteSummary.value = cascadeImagesOnDelete.value
      ? `Deleted ${resourceLabel(entry)} and ${result.deletedImages} image(s)` +
        (result.keptImages
          ? `. ${result.keptImages} image(s) belonged to someone else and were left in place.`
          : '.')
      : `Deleted ${resourceLabel(entry)}. Its images were kept.`

    confirmingDelete.value = false
    cascadeImagesOnDelete.value = false
    infoResourceId.value = null
    close()
  } finally {
    deletingResourceId.value = null
  }
}

const deleteSummary = ref('')

const showAddChoice = ref(false)
const showForm = ref(false)
const formKind = ref<'CHECKPOINT' | 'LORA'>('CHECKPOINT')

function openAddChoice(): void {
  showAddChoice.value = true
}

function startAdd(kind: 'CHECKPOINT' | 'LORA'): void {
  formKind.value = kind
  showAddChoice.value = false
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  showAddChoice.value = false
}

/*
 * `done` is the closer for whichever surface is open: the Add panel passes
 * none and falls back to closeForm, while a flipped card passes its own
 * `close` so the card turns back over instead of the panel state changing
 * underneath a dialog that is not on screen.
 */
async function handleSaved(
  resource: Resource,
  done?: () => void,
): Promise<void> {
  await resourceGalleryStore.getResource(resource.id)
  if (done) {
    done()
    return
  }
  closeForm()
}

const EDITABLE_RESOURCE_TYPES = ['CHECKPOINT', 'LORA', 'LYCORIS']

/*
 * Mirrors resource-card's rule so the front and the back agree about which
 * descriptions are worth showing. Duplicated rather than imported for the same
 * reason `label` already is: the card must stay mountable from a fixture, and
 * importing from the gallery that renders it is the wrong direction.
 */
function isMachineDescription(text: string): boolean {
  const segments = text
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length < 2) return false

  const fielded = segments.filter((segment) =>
    /^[\w ]{2,24}:\s*\S/.test(segment),
  ).length

  return fielded >= 2 && fielded * 2 >= segments.length
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
    /*
     * A direct link outranks the filters. Arriving at `?resourceId=N` with a
     * type dropdown or a stale search still set would otherwise show an empty
     * gallery and look broken, so the id short-circuits everything below except
     * the maturity rule -- which is an account setting and not this link's to
     * override.
     */
    if (selectedResourceId.value !== null) {
      if (entry.id !== selectedResourceId.value) return false
      return canSeeMature.value || !entry.isMature
    }

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
    /*
     * NO CLIENT-SIDE MATURITY FILTER: /api/resources applies viewerShowsMature,
     * so a mature Resource the viewer may not see never arrives. Silas,
     * 2026-09-18: "the backend is the proper place to gate this behavior."
     */
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

/*
 * NO PAGING HERE. Silas, 2026-08-08: "There seems to be no pagination. Are we
 * trying to load thousands on one page? It freezes." It did -- but the fix
 * belongs to kr-gallery, not to this file. Eleven of the thirteen galleries had
 * the same defect; /resources only reached it first because it is the biggest
 * table. See the `pageSize` prop on kr-gallery.
 *
 * What stays whole-catalog on purpose: `filteredResources` runs over the entire
 * array, so search and both dropdowns still cover the whole catalog rather than
 * the visible page, and `resourceById` is a superset of whatever the shell
 * chooses to render. The type and base-model options are DERIVED from the
 * loaded set (see `resourceTypes` / `generations`), which is also why the FETCH
 * is still whole-catalog: paginating the query would empty those dropdowns, and
 * that needs the filters to move server-side first.
 */
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
    <!--
      What the last delete actually did. The cascade is partial by design --
      other people's images survive it -- so the count has to be visible
      somewhere, not buried in a response nobody reads.
    -->
    <div
      v-if="deleteSummary"
      class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-error/40 bg-error/5 px-3 py-2"
    >
      <p class="min-w-0 text-sm">{{ deleteSummary }}</p>
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-2xl"
        @click="deleteSummary = ''"
      >
        Dismiss
      </button>
    </div>

    <!-- Arriving from a link to one resource. Without a way back this is a
         dead end: the gallery shows one card and every filter looks broken. -->
    <div
      v-if="selectedResourceId !== null"
      :class="
        selectedHiddenByMaturity
          ? 'border-warning/50 bg-warning/10'
          : 'border-secondary/40 bg-secondary/5'
      "
      class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2"
    >
      <p v-if="selectedHiddenByMaturity" class="min-w-0 text-sm">
        <span class="font-semibold">{{
          selectedResourceRow?.name ?? 'This resource'
        }}</span>
        is marked mature, and mature content is hidden for your account. Turn on
        mature content to view it.
      </p>
      <p v-else class="min-w-0 truncate text-sm">
        Showing one resource
        <span class="font-mono text-xs opacity-70"
          >#{{ selectedResourceId }}</span
        >
        <span v-if="!selectedResourceRow" class="opacity-70">
          · not in this catalog</span
        >
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-2xl"
        @click="clearSelectedResource"
      >
        Show all resources
      </button>
    </div>

    <header class="kr-panel px-3 py-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="min-w-0">
          <h2 class="text-base font-bold">Resource Gallery</h2>
          <!--
            TITLE ONLY. The blurb under it was `max-w-3xl`, so it claimed the
            whole line and pushed Library/Discover/Add/Refresh onto a row of
            their own -- Silas, 2026-08-08, of the preview: "still appears to
            have multiple rows before the resource cards". It also truncated to
            "...manufacture a preview wh...", so the row bought an unfinished
            sentence. The page already carries a `?` help affordance, which is
            where orientation prose belongs.
          -->
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
            <icon name="kind-icon:plus" class="kr-icon-3-5" />
            Add
          </button>

          <button
            type="button"
            class="btn btn-outline btn-xs rounded-2xl"
            :disabled="resourceGalleryStore.isLoading"
            @click="resourceGalleryStore.loadResources()"
          >
            <span v-if="resourceGalleryStore.isLoading" class="kr-spinner-xs" />
            <icon v-else name="kind-icon:refresh" class="kr-icon-3-5" />
            Refresh
          </button>
        </div>
      </div>
    </header>

    <div v-if="showAddChoice" class="flex flex-col gap-3 kr-panel-flat p-4">
      <p class="kr-text-bold-sm">What are you adding?</p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="kr-btn-primary"
          @click="startAdd('CHECKPOINT')"
        >
          Checkpoint
        </button>
        <button type="button" class="kr-btn-primary" @click="startAdd('LORA')">
          LoRA / LyCORIS
        </button>
        <button type="button" class="kr-btn-ghost" @click="closeForm">
          Cancel
        </button>
      </div>
    </div>

    <!--
      THE BACK OF THE CARD, one instance for the gallery. A Resource has no
      interact tier -- verifyCardActionContract's note on this card says its
      primary actions "are model-specific by nature", and there is no surface
      to hand over to -- so the back carries info and Edit and stops there.
      `can-interact` stays false rather than inventing a destination.
    -->
    <kr-card-flip
      v-model="infoOpen"
      :label="infoResource ? resourceLabel(infoResource) : 'Resource'"
    >
      <template #back="{ close, commit }">
        <kr-card-back
          v-if="infoResource"
          :title="resourceLabel(infoResource)"
          :subtitle="infoResource.generation || ''"
          :description="infoResourceDescription"
          :art-src="infoResourceArt"
          :badges="infoResourceBadges"
          :can-edit="canEditInfoResource"
          :can-review="infoResource.allowReviews !== false"
          @back="commit"
        >
          <template #details>
            <dl class="grid grid-cols-2 gap-2 text-xs">
              <div v-if="infoResourceTrigger" class="col-span-2">
                <dt class="kr-text-eyebrow opacity-55">Trigger</dt>
                <dd class="break-words font-mono">{{ infoResourceTrigger }}</dd>
              </div>
              <div v-if="infoResource.supportedServer">
                <dt class="kr-text-eyebrow opacity-55">Server</dt>
                <dd>{{ infoResource.supportedServer }}</dd>
              </div>
              <div v-if="infoResource.localPath" class="col-span-2">
                <dt class="kr-text-eyebrow opacity-55">Path</dt>
                <dd class="break-all font-mono">
                  {{ infoResource.localPath }}
                </dd>
              </div>
            </dl>

            <!--
              A Resource showed exactly one picture -- the generated preview --
              while ArtImage.LoraResources had been recording every render it
              was used in all along. This reads that relation back, beside the
              Civitai preview the LoRA shipped with.
            -->
            <resource-art-gallery :resource-id="infoResource.id" />

            <div
              v-if="confirmingDelete"
              class="mt-4 rounded-xl border border-error/50 bg-error/10 p-3"
            >
              <p class="text-sm font-semibold">
                Delete {{ resourceLabel(infoResource) }}?
              </p>
              <p class="mt-1 text-xs opacity-75">This cannot be undone.</p>

              <label class="mt-3 flex items-start gap-2 text-xs">
                <input
                  v-model="cascadeImagesOnDelete"
                  type="checkbox"
                  class="checkbox checkbox-xs mt-0.5"
                />
                <span>
                  Also delete the images made with it. Images belonging to other
                  people are left alone.
                </span>
              </label>

              <div class="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs rounded-lg"
                  :disabled="deletingResourceId !== null"
                  @click="cancelDelete"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-error btn-xs rounded-lg"
                  :disabled="deletingResourceId !== null"
                  @click="confirmDelete(close)"
                >
                  <span
                    v-if="deletingResourceId !== null"
                    class="kr-spinner-xs"
                  />
                  {{
                    cascadeImagesOnDelete ? 'Delete both' : 'Delete resource'
                  }}
                </button>
              </div>
            </div>
          </template>

          <!--
            ONE build button, not two. "Add to build" appended this Resource to
            the current art form; "Start fresh" REPLACED the form with only
            this one and navigated away. Silas, 2026-08-09: "add to build and
            start fresh should be one button."

            The survivor is the additive one. Collapsing to the destructive
            variant would mean a single tap could silently discard a build
            someone was part-way through, and "add to an empty build" already
            IS starting fresh -- so nothing is actually lost by keeping the
            safe one.

            Generate preview renders art for a Resource that has none, so it
            only appears when there is none -- which is also the answer to "I
            assume preview is some sort of generate option, but I have no idea
            what": a button that shows up exactly when it applies explains
            itself. Upload is gone entirely, per "just kill upload".
          -->
          <template #actions>
            <button
              type="button"
              class="btn btn-outline btn-sm mr-auto rounded-xl"
              :disabled="activePreviewResourceId === infoResource.id"
              @click="generatePreview(infoResource)"
            >
              <span
                v-if="activePreviewResourceId === infoResource.id"
                class="kr-spinner-xs"
              />
              <Icon v-else name="kind-icon:sparkles" class="kr-icon-4" />
              {{ infoResourceArt ? 'Regenerate art' : 'Generate art' }}
            </button>

            <button
              type="button"
              class="kr-btn-primary"
              @click="addToGeneration(infoResource)"
            >
              <Icon name="kind-icon:plus" class="kr-icon-4" />
              Add to build
            </button>

            <!--
              Delete is last and never one click. The cascade checkbox only
              exists inside the confirmation, so "remove this LoRA" and "remove
              this LoRA and everything it rendered" can never be the same
              gesture.
            -->
            <button
              v-if="canDeleteInfoResource && !confirmingDelete"
              type="button"
              class="btn btn-ghost btn-sm rounded-xl text-error"
              @click="startDelete"
            >
              <Icon name="kind-icon:trash" class="kr-icon-4" />
              Delete
            </button>
          </template>

          <!--
            Resources were the one reaction target with no allowReviews column
            and no reviews affordance, so a LoRA could be reacted to by the API
            and never by a person. Both halves landed together.
          -->
          <template #reviews>
            <review-list
              class="mb-3"
              target-type="resource"
              :target-id="infoResource.id"
            />

            <reaction-card
              :target-id="infoResource.id"
              target-type="resource"
              reaction-category="RESOURCE"
              :target-title="resourceLabel(infoResource)"
              compact
            />
          </template>

          <template #edit="{ done }">
            <add-model
              v-if="infoResource.resourceType === RESOURCE_TYPE.CHECKPOINT"
              :model="infoResource"
              @saved="(saved: Resource) => handleSaved(saved, done)"
              @close="done"
            />
            <add-lora
              v-else
              :lora="infoResource"
              @saved="(saved: Resource) => handleSaved(saved, done)"
              @close="done"
            />

            <!--
              Sharing lives next to the other visibility controls now
              (kind-robots/t-099, kaizen from t-062) instead of only on the
              standalone /resources/[id]/share route -- that route can stay as
              a direct link, this is just no longer the only way to reach it.
            -->
            <ShareManager
              subject-type="RESOURCE"
              :subject-id="infoResource.id"
            />
          </template>
        </kr-card-back>

        <div v-else class="p-6 text-center text-sm opacity-60">
          <p>That Resource is no longer available.</p>
          <button
            type="button"
            class="btn btn-ghost btn-sm mt-3 rounded-xl"
            @click="close"
          >
            Close
          </button>
        </div>
      </template>
    </kr-card-flip>

    <!--
      ADD only. Editing an existing Resource flips its own card (see the `edit`
      slot on resource-card below); this pair is reached from the Add button,
      where there is no card to turn over yet, so it stays a panel.
    -->
    <add-model
      v-if="showForm && formKind === 'CHECKPOINT'"
      @saved="handleSaved"
      @close="closeForm"
    />
    <add-lora
      v-if="showForm && formKind === 'LORA'"
      @saved="handleSaved"
      @close="closeForm"
    />

    <div
      v-if="message"
      class="kr-note p-3 font-normal"
      :class="messageTone === 'error' ? 'kr-note-error' : 'kr-note-success'"
    >
      {{ message }}
    </div>

    <div v-if="resourceGalleryStore.error" class="kr-note kr-note-error">
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
            class="kr-input-rounded-2xl input-xs w-36 sm:w-52"
            placeholder="Name, trigger, base model..."
            aria-label="Search Resources"
          />

          <!--
            `w-auto` IS LOad-BEARING, not tidying. DaisyUI 5 gives `.select`
            `width: clamp(3rem, 20rem, 100%)` -- the PREFERRED value is 20rem,
            so a select with no width utility is 320px wide no matter how short
            its options are. Two of them claimed 640px of this row and pushed
            the rest of the filters onto lines of their own; Silas, 2026-08-08,
            reported /resources loading with "several rows" for exactly this.
            The search box beside them looked fine only because it already
            carried explicit `w-36 sm:w-52`.

            `.select` is `inline-flex` with `overflow:hidden` and
            `text-overflow:ellipsis` already, so sizing to content is safe: a
            long option name truncates rather than reflowing the row.
          -->
          <select
            v-model="resourceType"
            class="select select-bordered select-xs w-auto max-w-44 rounded-2xl"
            aria-label="Filter by resource type"
          >
            <option value="ALL">All types</option>
            <option v-for="type in resourceTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>

          <select
            v-model="generation"
            class="select select-bordered select-xs w-auto max-w-44 rounded-2xl"
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
        <!--
          The curtain goes around the WHOLE card -- name, trigger and blurb, not
          just the picture. Silas, 2026-09-18: "the maturity toggle should cover
          the entire object card, including title and prompt. I should see the
          option to uncover a mature object if it is owned by me."
        -->
        <kr-mature-cover
          v-if="resourceById.get(Number(item.id))"
          :is-mature="resourceById.get(Number(item.id))!.isMature"
          :owner-id="resourceById.get(Number(item.id))!.userId"
          :label="resourceLabel(resourceById.get(Number(item.id))!)"
        >
          <resource-card
            :resource="resourceById.get(Number(item.id))!"
            @open="openResourceInfo"
          />
        </kr-mature-cover>
      </template>

      <template #empty>
        <div
          class="flex min-h-72 items-center justify-center kr-panel-flat p-6 text-center text-base-content/60"
        >
          No Resources match those filters.
        </div>
      </template>
    </kr-gallery>
  </section>
</template>
