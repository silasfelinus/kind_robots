<!-- /components/resources/resource-card.vue -->
<!--
  One Resource (checkpoint, LoRA, LyCORIS) as a card.

  Extracted from resource-gallery.vue when that grid moved onto kr-gallery. It
  needed an owner because a card inlined in an `#item` slot reaches its record
  back through the slot's GalleryItem, and every one of the ~20 references
  would have become `resourceById.get(Number(item.id))!`.

  WHAT MOVED AND WHAT DID NOT. previewSrc and isEditable came with it -- pure
  functions of the record, so they belong to the thing that draws it. The
  build/preview actions did NOT: they reach stores and APIs, so they are emits
  and the gallery decides what they mean. Same split the entity cards use, for
  the same reason -- a card that owns the consequence cannot be reused or
  exhibited.

  EDITING IS THE EXCEPTION, and only in placement. The card now owns the
  GESTURE (kr-card-flip: turn over, grow, centre) while the gallery still owns
  the FORM, handed in through the `edit` slot. Silas, 2026-08-08: "selecting
  edit just creates the edit window at the very top of the gallery, which is
  not ideal ... I believe it will take logic out of our galleries and towards
  the cards themselves." The animation and the dialog plumbing are now the
  card's; the save path is still the gallery's.

  The two busy flags are props rather than looked up, so this stays mountable
  in WonderLab from a plain fixture.

  NOT in verifyCardActionContract's ENTITY_CARDS: a Resource has no interact
  surface to `open`. Its primary actions are "add to build" and "start fresh",
  which are model-specific by nature. Adding it to that list would mean
  inventing an `open` with nowhere to go.
-->
<template>
  <kr-card-flip v-model="editOpen" :label="`Edit ${label}`">
    <article
      class="group flex h-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <!--
        IDENTITY OVERLAYS THE ART, per Silas 2026-08-08: "we should have the
        image, the type and model info at top and overlaid is cool." Type and
        base model are the two facts that never repeat below, which is what
        makes them safe to put here.
      -->
      <div class="relative aspect-square shrink-0 overflow-hidden bg-base-200">
        <img
          :src="previewSrc"
          :alt="label"
          class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />

        <div class="absolute left-2 top-2 flex flex-wrap gap-1">
          <span class="badge badge-primary badge-sm">
            {{ resource.resourceType }}
          </span>
          <span v-if="resource.generation" class="badge badge-neutral badge-sm">
            {{ resource.generation }}
          </span>
          <span v-if="resource.isMature" class="badge badge-error badge-sm">
            18+
          </span>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-2 p-3">
        <!--
          THE NAME GETS THE ROOM. Silas, 2026-08-08: "it was the actual title
          that was cut off, so most of the time I could only see a fraction of
          what the Lora was."

          Two things made a two-line clamp fail on this catalog. Imported names
          are long -- "[Exp] 每日渲染（风格）| Daily Render Style", "[LoRA]
          Jellyfish forest / 水月森 / くらげの森" -- and they open with a
          bracketed or underscored prefix ([LoRA], (color), _MOHAWK_) that is
          the same across dozens of rows. So the clamp spent the visible lines
          on the part that does not distinguish anything and elided the part
          that does, which is why a grid of them reads as near-identical.

          Three lines at `text-sm` holds roughly double the characters of two
          at `text-base` while still reading as the heading. `break-words` is
          for the unbroken runs ("_MOHAWK_Add_//COMICS"), which otherwise
          overflow instead of wrapping.

          Still CLAMPED, not free: kr-gallery's grid rows size to their tallest
          card, so one pathological name would add height to every card on the
          page. The clamp only hides overflow -- the full string stays in the
          DOM for screen readers, `title` gives it back on hover, and the flip
          side shows it in full.
        -->
        <h3
          class="line-clamp-3 break-words text-sm font-black leading-snug"
          :title="label"
        >
          {{ label }}
        </h3>

        <!--
          The trigger is the word you type to activate a LoRA, and it used to
          live in an `opacity-0 ... group-hover:opacity-100` panel over the
          artwork -- so on a touch screen it could not be read at all. Putting
          it on the card costs nothing a hover was giving anyone.

          ONE line, not two. It competes with the name for the same column, and
          the name is what Silas could not read; clamping the trigger tighter
          is how the title got its third line without the card growing.
        -->
        <p
          v-if="triggerText"
          class="line-clamp-1 rounded-lg bg-base-200/70 px-2 py-1 font-mono text-xs text-base-content/80"
          :title="triggerText"
        >
          {{ triggerText }}
        </p>

        <!--
          Only PROSE survives here. The import writes descriptions like
          "base: SD 1.5 | module: networks.lora | detected via civitai", which
          restates the two badges overlaying the artwork and then adds where it
          was scraped from -- three lines of card spent saying nothing the eye
          has not already read. Silas: "too much text, especially repetitive
          stuff". `isMachineDescription` drops those and keeps real ones.
        -->
        <p
          v-if="humanDescription"
          class="line-clamp-2 text-xs text-base-content/60"
        >
          {{ humanDescription }}
        </p>

        <!--
          `supportedServer` renders ONLY when it is not already overhead: it
          carries values like "SD15" beside a "SD 1.5" badge two inches up.
          Compared with separators and case stripped, so SD15/SD 1.5 and
          Flux.1 D/flux1-d collapse rather than sneaking through.
        -->
        <span
          v-if="showsServerBadge"
          class="badge badge-outline badge-xs w-fit"
        >
          {{ resource.supportedServer }}
        </span>

        <div class="mt-auto flex flex-col gap-1.5 pt-1">
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              class="btn btn-primary btn-xs rounded-xl"
              @click="emit('add-to-build', resource)"
            >
              Add to build
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-xs rounded-xl"
              @click="emit('start-fresh', resource)"
            >
              Start fresh
            </button>
          </div>

          <!--
            The preview pair and Edit are secondary, so they are icon buttons
            on one line rather than two more full-width rows. Five stacked
            call-to-actions made every card taller than its own artwork.
          -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="btn btn-ghost btn-xs flex-1 rounded-xl"
              :disabled="generatingPreview"
              title="Generate preview"
              @click="emit('generate-preview', resource)"
            >
              <span
                v-if="generatingPreview"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:sparkles" class="h-3.5 w-3.5" />
              Preview
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-xs flex-1 rounded-xl"
              :disabled="uploadingPreview"
              title="Upload preview"
              @click="emit('upload-preview', resource)"
            >
              <span
                v-if="uploadingPreview"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:upload" class="h-3.5 w-3.5" />
              Upload
            </button>

            <button
              v-if="isEditable"
              type="button"
              class="btn btn-ghost btn-xs rounded-xl"
              title="Edit this Resource"
              aria-label="Edit this Resource"
              @click="startEdit"
            >
              <Icon name="kind-icon:edit" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>

    <template #back="{ close, commit }">
      <!--
        The gallery fills this. The card knows the gesture, not the form: which
        editor a Resource needs (add-model vs add-lora) and what saving means
        are both store work, and this file stays fixture-mountable by not
        knowing either.
      -->
      <slot name="edit" :resource="resource" :close="close" :commit="commit" />
    </template>
  </kr-card-flip>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ResourceGalleryRecord } from '@/stores/resourceGalleryStore'

const EDITABLE_TYPES = ['CHECKPOINT', 'LORA', 'LYCORIS']

const props = withDefaults(
  defineProps<{
    resource: ResourceGalleryRecord
    generatingPreview?: boolean
    uploadingPreview?: boolean
  }>(),
  {
    generatingPreview: false,
    uploadingPreview: false,
  },
)

const emit = defineEmits<{
  edit: [resource: ResourceGalleryRecord]
  'add-to-build': [resource: ResourceGalleryRecord]
  'start-fresh': [resource: ResourceGalleryRecord]
  'generate-preview': [resource: ResourceGalleryRecord]
  'upload-preview': [resource: ResourceGalleryRecord]
}>()

const editOpen = ref(false)

/*
 * Still emits `edit`. The gallery no longer has to POSITION anything, but it
 * may still want to know (to mark a row dirty, to close a sibling), and
 * removing the emit would be a silent contract break for any other host.
 */
function startEdit(): void {
  editOpen.value = true
  emit('edit', props.resource)
}

const previewSrc = computed(
  () =>
    props.resource.ArtImage?.thumbnailPath ||
    props.resource.ArtImage?.imagePath ||
    props.resource.ArtImage?.path ||
    props.resource.previewImageUrl ||
    props.resource.imagePath ||
    '/images/kindart.webp',
)

const label = computed(() => props.resource.customLabel || props.resource.name)

const triggerText = computed(
  () =>
    props.resource.defaultTrigger ||
    props.resource.triggerWords ||
    props.resource.artPrompt ||
    '',
)

/**
 * True for import-written metadata masquerading as a description --
 * "base: SD 1.5 | module: networks.lora | detected via civitai".
 *
 * Structural rather than a list of known prefixes: what makes a string a
 * record of fields instead of a sentence is that its pipe-separated segments
 * are `label: value`.
 *
 * A MAJORITY, not all of them. Requiring every segment to be fielded looked
 * tidier and was wrong on the exact strings this exists for: the real ones end
 * "| detected via civitai", which has no colon, so an `every` test returned
 * false and let the whole boilerplate through. Caught by running it over the
 * strings in Silas's 2026-08-08 report rather than reasoning about it.
 *
 * The floor of two fielded segments is deliberate slack in the safe direction:
 * "trigger: ranni | best at 0.7" is half prose and stays visible. Hiding a
 * real description is a worse failure than keeping a dull one.
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

const humanDescription = computed(() => {
  const text = (props.resource.description || '').trim()
  if (!text || isMachineDescription(text)) return ''
  return text
})

/** Separators and case removed, so "SD 1.5" and "SD15" compare equal. */
function normalizeModelToken(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const showsServerBadge = computed(() => {
  const server = normalizeModelToken(props.resource.supportedServer)
  if (!server) return false
  return server !== normalizeModelToken(props.resource.generation)
})

const isEditable = computed(() =>
  EDITABLE_TYPES.includes(String(props.resource.resourceType)),
)
</script>
