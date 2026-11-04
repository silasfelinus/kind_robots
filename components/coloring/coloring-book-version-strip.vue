<!-- /components/coloring/coloring-book-version-strip.vue -->
<!-- Compact thumbnail row under a page image: every color or B&W version the
     page has had, plus upload. Picking a thumb previews it in the card's main
     image, where "Use this" lives (Silas, 2026-11-04 PT: revert/upload, and keep
     each page to one phone screen). -->
<template>
  <div class="flex items-center gap-1 overflow-x-auto px-1 py-1">
    <button
      v-for="version in versions"
      :key="version.path"
      type="button"
      class="relative h-11 w-9 shrink-0 overflow-hidden rounded-md border-2 bg-base-200"
      :class="
        version.path === picked
          ? 'border-primary'
          : version.current
            ? 'border-success'
            : 'border-transparent'
      "
      :title="`${version.current ? 'Current' : version.label}${version.detail ? ` · ${version.detail}` : ''}`"
      :aria-label="`Preview ${version.label} ${variant === 'bw' ? 'B&W' : 'color'} version`"
      @click="pick(version)"
    >
      <img
        :src="version.url"
        alt=""
        class="size-full object-cover"
        :class="variant === 'bw' ? 'grayscale' : ''"
        loading="lazy"
      />
    </button>
    <label
      v-if="canUpload"
      class="grid h-11 w-9 shrink-0 cursor-pointer place-items-center rounded-md border-2 border-dashed border-base-300 text-base-content/60"
      :class="{ 'pointer-events-none opacity-50': store.uploading }"
      :title="`Upload a ${variant === 'bw' ? 'B&W' : 'color'} version`"
    >
      <span v-if="store.uploading" class="kr-spinner-xs" />
      <Icon v-else name="kind-icon:upload" class="kr-icon-4" />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="hidden"
        @change="upload"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  ColoringBookProductionState,
  ColoringBookProposal,
  ColoringBookVariant,
} from '~/types/coloringBookStudio'
import {
  coloringBookVersions,
  type ColoringBookVersion,
} from '@/utils/coloringBookVersions'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'

const props = defineProps<{
  bookSlug: string
  proposal: ColoringBookProposal
  production: ColoringBookProductionState | null
  variant: ColoringBookVariant
  canUpload: boolean
  /** Path of the version previewed in the main image, if any. */
  picked: string | null
}>()

const emit = defineEmits<{
  pick: [version: ColoringBookVersion | null]
  done: [message: string]
  failed: [message: string]
}>()

const store = useColoringBookStudioStore()

const versions = computed(() =>
  coloringBookVersions(
    props.bookSlug,
    props.proposal,
    props.production,
    props.variant,
  ),
)

function pick(version: ColoringBookVersion): void {
  emit(
    'pick',
    version.path === props.picked || version.current ? null : version,
  )
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function upload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 12 * 1024 * 1024) {
    emit('failed', 'Images must be 12 MB or smaller.')
    return
  }
  store.selectProposal(props.proposal.id)
  const dataUrl = await readFile(file)
  if (await store.uploadVersion(props.variant, dataUrl, file.name)) {
    emit('done', store.message || 'Uploaded.')
  } else if (store.error) {
    emit('failed', store.error)
  }
}
</script>
