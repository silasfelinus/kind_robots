<!-- /components/coloring/coloring-book-version-strip.vue -->
<!-- Every color or B&W image a page has had, with one-click revert and upload
     (Silas, 2026-11-04 PT: "let me revert to previous versions for color or bw,
     or uploading a new version"). -->
<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <p class="kr-text-black-xs">
        {{ variant === 'bw' ? 'B&W' : 'Color' }} versions
        <span class="kr-text-dim-xs-55 font-normal">
          · {{ versions.length }}
        </span>
      </p>
      <label
        v-if="canUpload"
        class="kr-btn-ghost-xs-plain cursor-pointer gap-1"
        :class="{ 'pointer-events-none opacity-50': store.uploading }"
      >
        <span v-if="store.uploading" class="kr-spinner-xs" />
        <Icon v-else name="kind-icon:upload" class="kr-icon-4" />
        Upload {{ variant === 'bw' ? 'B&W' : 'color' }}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="hidden"
          @change="upload"
        />
      </label>
    </div>

    <div v-if="versions.length" class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="version in versions"
        :key="version.path"
        type="button"
        class="relative w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-base-200 transition"
        :class="
          version.path === picked
            ? 'border-primary'
            : version.current
              ? 'border-success'
              : 'border-transparent hover:border-base-300'
        "
        :title="`${version.label}${version.detail ? ` · ${version.detail}` : ''}\n${version.path}`"
        @click="picked = picked === version.path ? '' : version.path"
      >
        <img
          :src="version.url"
          :alt="`${version.label} ${variant} version`"
          class="aspect-[17/22] w-full object-cover"
          :class="variant === 'bw' ? 'grayscale' : ''"
          loading="lazy"
        />
        <span
          class="absolute inset-x-0 bottom-0 truncate bg-base-100/90 px-1 text-[9px] font-bold leading-4"
        >
          {{ version.current ? 'Current' : version.label }}
        </span>
      </button>
    </div>
    <p v-else class="kr-text-dim-xs-55">No earlier versions recorded.</p>

    <div
      v-if="pickedVersion"
      class="flex flex-wrap items-center gap-2 rounded-xl bg-base-200/60 p-2 text-xs"
    >
      <span class="min-w-0 flex-1 truncate">
        <span class="font-black">{{ pickedVersion.label }}</span>
        <span v-if="pickedVersion.detail"> · {{ pickedVersion.detail }}</span>
      </span>
      <a
        :href="pickedVersion.url"
        target="_blank"
        rel="noopener"
        class="kr-btn-ghost-xs-plain"
      >
        Full size
      </a>
      <button
        v-if="!pickedVersion.current"
        type="button"
        class="btn btn-success btn-sm rounded-xl"
        :disabled="store.requestingAction || blocked"
        :title="
          blocked ? 'Accept a color version before choosing a B&W one.' : ''
        "
        @click="adopt(pickedVersion.path)"
      >
        Use this version
      </button>
      <span v-else class="badge badge-success badge-sm">In use</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ColoringBookProductionState,
  ColoringBookProposal,
  ColoringBookVariant,
} from '~/types/coloringBookStudio'
import { coloringBookVersions } from '@/utils/coloringBookVersions'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'

const props = defineProps<{
  bookSlug: string
  proposal: ColoringBookProposal
  production: ColoringBookProductionState | null
  variant: ColoringBookVariant
  canUpload: boolean
}>()

const emit = defineEmits<{
  done: [message: string]
  failed: [message: string]
}>()

const store = useColoringBookStudioStore()
const picked = ref('')

const versions = computed(() =>
  coloringBookVersions(
    props.bookSlug,
    props.proposal,
    props.production,
    props.variant,
  ),
)
const pickedVersion = computed(
  () => versions.value.find((version) => version.path === picked.value) ?? null,
)
// Adoption traces B&W from the accepted color; Conductor refuses it otherwise.
const blocked = computed(
  () => props.variant === 'bw' && !props.proposal.accepted.color,
)

async function adopt(path: string): Promise<void> {
  store.selectProposal(props.proposal.id)
  const label = props.variant === 'bw' ? 'B&W' : 'color'
  if (
    await store.adoptVersion(
      props.variant,
      path,
      `Reverted ${label} to ${path} from Coloring Book curation`,
    )
  ) {
    picked.value = ''
    emit(
      'done',
      `${props.proposal.id} will switch to that ${label} version on Conductor's next studio run.` +
        (props.variant === 'color' && props.proposal.accepted.bw
          ? ' Its B&W page goes back to "needs B&W" so it can match.'
          : ''),
    )
  } else if (store.error) {
    emit('failed', store.error)
  }
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
  if (props.variant === 'bw' && blocked.value) {
    emit('failed', 'Accept a color version before uploading a B&W page.')
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
