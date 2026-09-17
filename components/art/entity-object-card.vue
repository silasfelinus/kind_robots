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
          <p class="kr-text-eyebrow text-xs tracking-widest text-base-content/50">
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
        v-if="imageSrc"
        class="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-base-100"
      >
        <img
          :src="imageSrc"
          :alt="`${typeLabel} ${link.label ?? ''}`"
          class="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      <p
        v-else-if="link.isMature && !canSeeMature"
        class="rounded-2xl border border-warning/40 bg-warning/5 p-3 text-xs text-base-content/70"
      >
        This {{ typeLabel.toLowerCase() }} is marked mature, and mature content is
        hidden for your account.
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
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
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

const DESCRIPTION_LIMIT = 400

const truncated = computed<string>(() => {
  const text = String(props.link.description || '').trim()
  return text.length > DESCRIPTION_LIMIT
    ? `${text.slice(0, DESCRIPTION_LIMIT)}…`
    : text
})
</script>
