<!-- /components/art/entity-object-card.vue -->
<!--
  The object an ArtImage was made for, as a card rather than a navigation.

  Silas, 2026-09-17: "it would be nice as well if we got it as a popup object
  card, and then that card led us to the actual page". Following the link
  outright costs you the queue you were reading; a card answers "what is this
  LoRA?" in place and still offers the page.

  It withholds a mature image when the account hides mature content, and says
  so, rather than rendering it or silently showing nothing -- the same rule that
  made a direct link to a mature resource look like a broken page.
-->
<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="`${typeLabel}: ${link.label ?? ''}`"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <article
      class="kr-panel flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto p-4"
    >
      <header class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p
            class="kr-text-eyebrow text-xs tracking-widest text-base-content/50"
          >
            {{ typeLabel }}
          </p>
          <h3 class="kr-text-black-base break-words">
            {{ link.label ?? `#${link.entityId}` }}
          </h3>
          <p v-if="link.detail" class="kr-text-dim-sm">{{ link.detail }}</p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          aria-label="Close"
          @click="emit('close')"
        >
          <Icon name="kind-icon:x" class="kr-icon-4" />
        </button>
      </header>

      <div
        v-if="heroSrc"
        class="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-base-100"
      >
        <img
          :src="heroSrc"
          :alt="`${typeLabel} ${link.label ?? ''}`"
          class="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      <!--
        THE REST OF WHAT THIS OBJECT HAS. Silas, 2026-09-18: "I should see the
        new image and the original and any others as a scrollable gallery when
        selecting."

        A filmstrip rather than a grid: this is a card back inside a modal, and
        the point is to page through a handful of renders without leaving the
        queue. The full grid is the resource page, one button away.
      -->
      <div
        v-if="frames.length > 1"
        class="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1"
      >
        <button
          v-for="(frame, index) in frames"
          :key="frame.key"
          type="button"
          class="h-14 w-14 shrink-0 snap-start overflow-hidden rounded-xl border-2 bg-base-100 transition"
          :class="
            index === activeIndex
              ? 'border-primary'
              : 'border-transparent opacity-70 hover:opacity-100'
          "
          :aria-label="frame.label"
          :aria-current="index === activeIndex ? 'true' : undefined"
          @click="activeIndex = index"
        >
          <img
            :src="frame.src"
            :alt="frame.label"
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </button>
      </div>
      <p v-else-if="galleryLoading" class="kr-text-dim-sm">Loading gallery…</p>
      <p
        v-else-if="link.isMature && !canSeeMature"
        class="rounded-2xl border border-warning/40 bg-warning/5 p-3 text-xs text-base-content/70"
      >
        This {{ typeLabel.toLowerCase() }} is marked mature, and mature content
        is hidden for your account.
      </p>

      <p v-if="link.description" class="kr-text-dim-sm whitespace-pre-line">
        {{ truncated }}
      </p>

      <footer class="flex flex-wrap items-center justify-end gap-2">
        <span class="font-mono text-[10px] text-base-content/40">
          #{{ link.entityId }}
        </span>
        <NuxtLink
          v-if="link.href"
          :to="link.href"
          class="btn btn-primary btn-sm rounded-2xl"
          @click="emit('close')"
        >
          Open {{ typeLabel }} page
        </NuxtLink>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useResourceGalleryStore } from '@/stores/resourceGalleryStore'
import { entityArtTypeLabel } from '@/utils/entityArtLink'
import type { EntityArtLink } from '@/stores/entityArtLinkStore'

const props = defineProps<{ link: EntityArtLink }>()
const emit = defineEmits<{ close: [] }>()

const userStore = useUserStore()
const canSeeMature = computed(() => Boolean(userStore.showMature))

const typeLabel = computed(() => entityArtTypeLabel(props.link.entityType))

/*
 * A generated ArtImage wins over a stored path, and a remote preview is the
 * last resort -- the same order the resource gallery uses, so a LoRA looks the
 * same here as it does there.
 */
const imageSrc = computed<string | null>(() => {
  if (props.link.isMature && !canSeeMature.value) return null
  /*
   * Static paths only, in resource-card.vue's order.
   *
   * `/api/art/images/:id/file` authenticates by Bearer token and a browser
   * sends a session cookie, so an <img> pointing at it gets 403 on any mature
   * or private row -- which is why this card rendered an empty preview while
   * the resource page it links to showed the same image correctly.
   */
  return (
    props.link.artImagePath ||
    props.link.previewImageUrl ||
    props.link.imagePath ||
    null
  )
})

/*
 * EVERY PICTURE THIS OBJECT HAS, NOT JUST ITS FACE.
 *
 * Silas, 2026-09-18: "I should see the new image and the original and any
 * others as a scrollable gallery when selecting ... but I just see the
 * original."
 *
 * A Resource's art arrives by several routes -- the render generated for it,
 * every image its LoRA was used in, and the upstream set the Civitai model
 * shipped with (Fantasy_art_XL_V1 has ten) -- and this card drew exactly one of
 * them. /api/resources/:id/gallery already returns all of it, so the card only
 * had to ask.
 *
 * Only for `resource`: it is the one entity type with a gallery endpoint. Every
 * other type keeps the single image rather than being given a strip of one.
 *
 * The fetch belongs to resourceGalleryStore, which already owns it for the
 * resource page. AGENTS.md: "Components never call APIs or localStorage
 * directly."
 */
const galleryStore = useResourceGalleryStore()

const isResource = computed<boolean>(() => props.link.entityType === 'resource')

const galleryLoading = computed<boolean>(
  () => galleryStore.resourceArtLoading[props.link.entityId] === true,
)

type Frame = { key: string; src: string; label: string }

const frames = computed<Frame[]>(() => {
  const out: Frame[] = []
  const seen = new Set<string>()

  const push = (src: string | null | undefined, label: string, key: string) => {
    const value = String(src || '').trim()
    if (!value || seen.has(value)) return
    seen.add(value)
    out.push({ key, src: value, label })
  }

  // The card's own face first: it is what was just clicked, so it should not
  // jump somewhere else in the strip while the gallery loads.
  push(imageSrc.value, `${typeLabel.value} ${props.link.label ?? ''}`, 'face')

  if (!isResource.value || (props.link.isMature && !canSeeMature.value)) {
    return out
  }

  const gallery = galleryStore.resourceArt[props.link.entityId]
  if (!gallery) return out

  for (const image of gallery.images ?? []) {
    /*
     * Static paths only, as above: an <img> cannot carry a Bearer token, so a
     * row stored in the database rather than on disk has nothing renderable
     * here. It is on the resource page, which loads bytes through the store.
     */
    push(
      image.imagePath || image.thumbnailPath || image.cardPath,
      `Generated image ${image.id}`,
      `art-${image.id}`,
    )
  }

  for (const preview of gallery.upstreamPreviews ?? []) {
    push(preview.url, 'Upstream Civitai preview', `upstream-${preview.id}`)
  }

  return out
})

const activeIndex = ref(0)

const heroSrc = computed<string | null>(
  () => frames.value[activeIndex.value]?.src ?? imageSrc.value,
)

// A shorter strip must not leave the selection pointing past its end, and a
// different object starts at its own face.
watch(
  () => [props.link.entityType, props.link.entityId, frames.value.length],
  ([, , length]) => {
    if (activeIndex.value >= Number(length)) activeIndex.value = 0
  },
)

watch(
  () => `${props.link.entityType}:${props.link.entityId}`,
  () => {
    activeIndex.value = 0
    loadGallery()
  },
)

function loadGallery(): void {
  if (!isResource.value || !props.link.exists) return
  if (props.link.isMature && !canSeeMature.value) return
  void galleryStore.loadResourceArt(props.link.entityId)
}

onMounted(loadGallery)

const DESCRIPTION_LIMIT = 400

const truncated = computed<string>(() => {
  const text = String(props.link.description || '').trim()
  return text.length > DESCRIPTION_LIMIT
    ? `${text.slice(0, DESCRIPTION_LIMIT)}…`
    : text
})
</script>
