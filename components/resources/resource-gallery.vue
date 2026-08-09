<!-- /components/resources/resource-gallery.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import {
  useResourceGalleryStore,
  type ResourceGalleryRecord,
} from '@/stores/resourceGalleryStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import type { Resource } from '@/stores/resourceStore'

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
const matureOnly = ref(false)
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

const canEditInfoResource = computed(() => {
  const entry = infoResource.value
  if (!entry) return false
  return EDITABLE_RESOURCE_TYPES.includes(String(entry.resourceType))
})

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

    // Only reachable while canSeeMature is true -- the control that sets it is
    // not rendered otherwise.
    if (matureOnly.value && !entry.isMature) return false

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

    <div v-if="showAddChoice" class="flex flex-col gap-3 kr-panel-flat p-4">
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
          @back="commit"
        >
          <template #details>
            <dl class="grid grid-cols-2 gap-2 text-xs">
              <div v-if="infoResourceTrigger" class="col-span-2">
                <dt class="font-black uppercase opacity-55">Trigger</dt>
                <dd class="break-words font-mono">{{ infoResourceTrigger }}</dd>
              </div>
              <div v-if="infoResource.supportedServer">
                <dt class="font-black uppercase opacity-55">Server</dt>
                <dd>{{ infoResource.supportedServer }}</dd>
              </div>
              <div v-if="infoResource.localPath" class="col-span-2">
                <dt class="font-black uppercase opacity-55">Path</dt>
                <dd class="break-all font-mono">
                  {{ infoResource.localPath }}
                </dd>
              </div>
            </dl>
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
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
              {{ infoResourceArt ? 'Regenerate art' : 'Generate art' }}
            </button>

            <button
              type="button"
              class="btn btn-primary btn-sm rounded-xl"
              @click="addToGeneration(infoResource)"
            >
              <Icon name="kind-icon:plus" class="h-4 w-4" />
              Add to build
            </button>
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

          <button
            v-if="canSeeMature"
            type="button"
            class="btn btn-xs gap-1 rounded-2xl"
            :class="matureOnly ? 'btn-warning' : 'btn-ghost'"
            :aria-pressed="matureOnly"
            title="Show only Resources flagged mature"
            @click="matureOnly = !matureOnly"
          >
            <Icon name="kind-icon:eye" class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">Mature only</span>
          </button>

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
          @open="openResourceInfo"
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
