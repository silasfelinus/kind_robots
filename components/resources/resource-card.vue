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

  EDITING IS NOT HERE AT ALL any more, and neither is the flip. Silas,
  2026-08-08: "selecting the card brings us to the full info display with the
  animation ... think the back of a baseball card with stats. Then the edit
  option is just an on-screen change to the modal." So the front's job is to
  be findable in a grid and to emit `open`; everything you can READ about a
  Resource, and the form, live on kr-card-back.

  The card briefly owned that flip itself. It moved to the gallery because
  bot-gallery -- the same pattern's first real test -- doubles as a PICKER
  inside bot-chat, where a click must pick and an info panel would be in the
  way. A card that opens its own panel has decided what being picked means,
  which is exactly what verifyCardActionContract forbids, and the picker would
  have no way to opt out. Resources has no picker embed today, but two
  galleries answering the same question two different ways is how the drift
  this stage exists to undo got started.

  The two busy flags are props rather than looked up, so this stays mountable
  in WonderLab from a plain fixture.

  NOT in verifyCardActionContract's ENTITY_CARDS: a Resource has no interact
  surface to `open`. Its primary actions are "add to build" and "start fresh",
  which are model-specific by nature. Adding it to that list would mean
  inventing an `open` with nowhere to go.
-->
<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <!--
      IDENTITY OVERLAYS THE ART, per Silas 2026-08-08: "we should have the
      image, the type and model info at top and overlaid is cool." Type and
      base model are the two facts that never repeat below, which is what
      makes them safe to put here.
    -->
    <!-- The art is the way IN. Selecting a Resource turns its card over to
         the full record; the gallery decides that, not this file. -->
    <button
      type="button"
      class="relative aspect-square w-full shrink-0 overflow-hidden bg-base-200 text-left"
      :aria-label="`Open ${label}`"
      @click="emit('open', resource.id)"
    >
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
    </button>

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
      -->
      <span v-if="showsServerBadge" class="badge badge-outline badge-xs w-fit">
        {{ resource.supportedServer }}
      </span>

      <!--
        NO ACTION BUTTONS. They were four -- Add to build, Start fresh,
        Preview, Upload -- stacked under every tile in a grid of 48. Silas,
        2026-08-09: "the buttons that are currently on the gallery card before
        clicking need to be moved to the bottom row of the selected back".

        The front's job is to be findable: art, name, trigger. Anything you DO
        to a Resource now lives on the back, one flip away, where there is room
        to label it properly and it is not repeated 48 times down the page.
      -->
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResourceGalleryRecord } from '@/stores/resourceGalleryStore'

const props = withDefaults(
  defineProps<{
    resource: ResourceGalleryRecord
  }>(),
  {},
)

const emit = defineEmits<{
  /*
   * `open` is all that is left. The build and preview actions moved to the
   * card BACK on 2026-08-09, so the front no longer emits them -- keeping
   * dead emits around would advertise a contract this file no longer honours.
   */
  open: [id: number]
}>()

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

/*
 * PREFIX, not equality. Comparing the two normalised tokens outright still let
 * "SDXL" through beside an "SDXL 1.0" badge -- Silas, 2026-08-08, from the
 * preview: "there is still a type listed twice : eg sdxl". The server field
 * carries the family and the generation field carries family-plus-version, so
 * the two are never going to be equal; one CONTAINING the other is what makes
 * it a repeat.
 *
 * Biased toward collapsing -- "SD" beside "SDXL 1.0" goes too. Slightly
 * aggressive, and deliberately the direction the brief asks for: a badge that
 * only re-states a coarser version of what a neighbour already said is exactly
 * the clutter being removed.
 */
const showsServerBadge = computed(() => {
  const server = normalizeModelToken(props.resource.supportedServer)
  if (!server) return false

  const generation = normalizeModelToken(props.resource.generation)
  if (!generation) return true

  return !server.startsWith(generation) && !generation.startsWith(server)
})
</script>
