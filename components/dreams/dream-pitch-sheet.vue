<!-- /components/dreams/dream-pitch-sheet.vue -->
<template>
  <article
    class="group/sheet relative overflow-hidden rounded-2xl border bg-base-100 shadow-sm transition duration-300"
    :class="[variantClass, themeClass]"
  >
    <div class="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover/sheet:opacity-100">
      <div class="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div class="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-secondary/20 blur-3xl" />
    </div>

    <div class="relative z-10 flex flex-col gap-3 p-3" :class="compact ? 'gap-2 p-2' : 'sm:p-4'">
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="flex items-center gap-1 text-[0.65rem] font-black uppercase tracking-[0.28em] text-primary/80">
            <Icon name="kind-icon:robot" class="h-3.5 w-3.5" />
            Kind Robots
          </p>

          <h2
            class="mt-1 line-clamp-2 font-black leading-tight text-base-content"
            :class="compact ? 'text-base' : 'text-xl sm:text-2xl'"
          >
            {{ title }}
          </h2>

          <p
            v-if="subtitle"
            class="mt-1 line-clamp-1 text-xs font-semibold text-base-content/65"
            :class="compact ? 'hidden sm:block' : ''"
          >
            {{ subtitle }}
          </p>
        </div>

        <span class="badge badge-primary shrink-0 rounded-xl text-[0.65rem] font-black uppercase tracking-wide shadow">
          {{ displayTypeLabel }}
        </span>
      </header>

      <div
        v-if="showImage"
        class="relative overflow-hidden rounded-2xl border border-base-300 bg-base-300"
        :class="compact ? 'h-24' : 'h-44 sm:h-56'"
      >
        <img
          v-if="imageSrc"
          :src="imageSrc"
          :alt="`${title} PitchSheet image`"
          class="h-full w-full object-cover transition duration-500 group-hover/sheet:scale-[1.04]"
          loading="lazy"
        />

        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
        >
          <Icon :name="iconName" class="h-14 w-14 opacity-70" />
        </div>

        <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-base-300/55 via-transparent to-transparent" />
      </div>

      <p
        v-if="hook"
        class="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-bold leading-snug text-base-content"
      >
        {{ hook }}
      </p>

      <section v-if="visibleHighlights.length" class="grid gap-2" :class="compact ? 'grid-cols-1' : 'sm:grid-cols-3'">
        <div
          v-for="highlight in visibleHighlights"
          :key="highlight.label"
          class="rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-sm"
        >
          <div class="flex items-center gap-1.5 text-[0.68rem] font-black uppercase tracking-wide text-primary">
            <Icon :name="highlight.icon || 'kind-icon:sparkles'" class="h-3.5 w-3.5" />
            <span>{{ highlight.label }}</span>
          </div>

          <p class="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-base-content/75">
            {{ highlight.value }}
          </p>
        </div>
      </section>

      <p
        v-if="pitch && !compact"
        class="line-clamp-4 text-sm leading-relaxed text-base-content/75"
      >
        {{ pitch }}
      </p>

      <section v-if="showDetails && visibleDetails.length && !compact" class="grid gap-2">
        <details
          v-for="detail in visibleDetails"
          :key="detail.label"
          class="rounded-2xl border border-base-300 bg-base-100/80 p-3"
        >
          <summary class="cursor-pointer text-sm font-black text-base-content">
            {{ detail.label }}
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-base-content/70">
            {{ detail.body }}
          </p>
        </details>
      </section>

      <footer v-if="allowActions" class="flex flex-wrap gap-2 pt-1">
        <button
          v-if="!activeSheet && allowEnsure"
          class="btn btn-primary btn-sm rounded-xl text-white"
          type="button"
          :disabled="sheetStore.isSaving"
          @click.stop="ensureSheet"
        >
          <Icon name="kind-icon:file-plus" class="h-4 w-4" />
          Create Sheet
        </button>

        <button
          v-if="activeSheet && allowEdit"
          class="btn btn-outline btn-sm rounded-xl"
          type="button"
          @click.stop="emit('edit', activeSheet.id)"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { ArtImage, Dream, PitchSheet } from '~/prisma/generated/prisma/client'
import { useSheetStore, type SheetWithDream } from '@/stores/sheetStore'
import { dreamTypeLabel, getPitchSheetDisplayType } from '@/utils/sheets/pitchSheetDefaults'

type DreamForSheet = Partial<Dream> & {
  id: number
  ArtImage?: Partial<ArtImage> | null
  PitchSheet?: SheetWithDream | PitchSheet | null
}

type Highlight = {
  label: string
  value: string
  icon?: string | null
}

type Detail = {
  label: string
  body: string
}

const props = withDefaults(
  defineProps<{
    dream: DreamForSheet
    sheet?: SheetWithDream | PitchSheet | null
    variant?: 'card' | 'hover' | 'detail'
    autoLoad?: boolean
    ensureOnLoad?: boolean
    allowEnsure?: boolean
    allowEdit?: boolean
    allowActions?: boolean
    showImage?: boolean
    showDetails?: boolean
  }>(),
  {
    sheet: null,
    variant: 'card',
    autoLoad: true,
    ensureOnLoad: false,
    allowEnsure: false,
    allowEdit: false,
    allowActions: false,
    showImage: true,
    showDetails: false,
  },
)

const emit = defineEmits<{
  edit: [id: number]
  ensured: [sheet: SheetWithDream]
}>()

const sheetStore = useSheetStore()
const runtimeConfig = useRuntimeConfig()

const displayType = computed(() => getPitchSheetDisplayType(props.dream.dreamType))
const displayTypeLabel = computed(() => dreamTypeLabel(displayType.value))

const compact = computed(() => props.variant === 'hover')

const activeSheet = computed<SheetWithDream | PitchSheet | null>(() => {
  return (
    props.sheet ||
    props.dream.PitchSheet ||
    sheetStore.sheetsByDreamId.get(props.dream.id) ||
    null
  )
})

const title = computed(() => {
  return activeSheet.value?.title || props.dream.title || `Dream ${props.dream.id}`
})

const subtitle = computed(() => {
  return activeSheet.value?.subtitle || props.dream.flavorText || props.dream.description || ''
})

const hook = computed(() => {
  return activeSheet.value?.hook || props.dream.flavorText || props.dream.pitch || ''
})

const pitch = computed(() => {
  return activeSheet.value?.pitch || props.dream.pitch || props.dream.description || ''
})

const iconName = computed(() => {
  return activeSheet.value?.icon || props.dream.icon || typeIcon.value
})

const typeIcon = computed(() => {
  switch (displayType.value) {
    case 'ART':
      return 'kind-icon:palette'
    case 'PROMPTBOT':
      return 'kind-icon:wand'
    case 'NARRATOR':
      return 'kind-icon:book-open'
    case 'CHARACTER':
      return 'kind-icon:user-round'
    case 'REWARD':
      return 'kind-icon:gift'
    case 'SCENARIO':
      return 'kind-icon:git-branch'
    case 'LOCATION':
      return 'kind-icon:map-pin'
    case 'GENRE':
      return 'kind-icon:library'
    case 'PITCH':
    default:
      return 'kind-icon:file-sparkles'
  }
})

const visibleHighlights = computed<Highlight[]>(() => {
  const sheet = activeSheet.value

  const highlights = [
    {
      label: sheet?.highlight1Label,
      value: sheet?.highlight1Value,
      icon: sheet?.highlight1Icon,
    },
    {
      label: sheet?.highlight2Label,
      value: sheet?.highlight2Value,
      icon: sheet?.highlight2Icon,
    },
    {
      label: sheet?.highlight3Label,
      value: sheet?.highlight3Value,
      icon: sheet?.highlight3Icon,
    },
  ]
    .filter((item) => item.label && item.value)
    .map((item) => ({
      label: String(item.label),
      value: String(item.value),
      icon: item.icon,
    }))

  if (highlights.length) return highlights

  return fallbackHighlights.value
})

const fallbackHighlights = computed<Highlight[]>(() => {
  const type = displayType.value

  if (type === 'CHARACTER') {
    return [
      { label: 'Role', value: props.dream.description || 'A story-ready character.', icon: 'kind-icon:user-round' },
      { label: 'Wants', value: props.dream.pitch || 'A motive worth discovering.', icon: 'kind-icon:heart' },
      { label: 'Story Hook', value: props.dream.flavorText || 'Ready to enter a scene.', icon: 'kind-icon:sparkles' },
    ]
  }

  if (type === 'LOCATION') {
    return [
      { label: 'Known For', value: props.dream.flavorText || 'A place with a clear mood.', icon: 'kind-icon:map-pin' },
      { label: 'Use It For', value: props.dream.description || 'Scenes, encounters, and atmosphere.', icon: 'kind-icon:door-open' },
      { label: 'Story Hook', value: props.dream.pitch || 'Something is waiting here.', icon: 'kind-icon:sparkles' },
    ]
  }

  return [
    { label: 'Type', value: displayTypeLabel.value, icon: typeIcon.value },
    { label: 'Hook', value: props.dream.flavorText || props.dream.description || 'A Dream ready for a PitchSheet.', icon: 'kind-icon:sparkles' },
    { label: 'Use It For', value: props.dream.pitch || 'Stories, art, bots, and remixable ideas.', icon: 'kind-icon:layers' },
  ]
})

const visibleDetails = computed<Detail[]>(() => {
  const sheet = activeSheet.value

  return [
    { label: sheet?.detail1Label, body: sheet?.detail1Body },
    { label: sheet?.detail2Label, body: sheet?.detail2Body },
    { label: sheet?.detail3Label, body: sheet?.detail3Body },
  ]
    .filter((item) => item.label && item.body)
    .map((item) => ({ label: String(item.label), body: String(item.body) }))
})

const imageSrc = computed(() => {
  return (
    normalizeImagePath(activeSheet.value?.imagePath) ||
    imageToSrc(activeSheet.value?.ArtImage) ||
    imageToSrc(props.dream.ArtImage) ||
    normalizeImagePath(props.dream.imagePath) ||
    normalizeImagePath(props.dream.highlightImage) ||
    ''
  )
})

const appUrl = computed(() => {
  const configured =
    runtimeConfig.public?.appUrl ||
    runtimeConfig.public?.APP_URL ||
    runtimeConfig.public?.siteUrl ||
    runtimeConfig.public?.SITE_URL ||
    ''

  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim().replace(/\/+$/, '')
  }

  if (import.meta.client && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '')
  }

  return ''
})

const themeClass = computed(() => {
  switch (displayType.value) {
    case 'ART':
      return 'border-info/40 bg-linear-to-br from-info/10 via-base-100 to-accent/10'
    case 'NARRATOR':
      return 'border-primary/40 bg-linear-to-br from-primary/10 via-base-100 to-secondary/10'
    case 'CHARACTER':
      return 'border-accent/40 bg-linear-to-br from-accent/10 via-base-100 to-primary/10'
    case 'REWARD':
      return 'border-warning/40 bg-linear-to-br from-warning/10 via-base-100 to-secondary/10'
    case 'SCENARIO':
      return 'border-secondary/40 bg-linear-to-br from-secondary/10 via-base-100 to-info/10'
    case 'LOCATION':
      return 'border-success/40 bg-linear-to-br from-success/10 via-base-100 to-primary/10'
    case 'GENRE':
      return 'border-base-content/20 bg-linear-to-br from-base-200 via-base-100 to-base-300/60'
    case 'PROMPTBOT':
      return 'border-primary/40 bg-linear-to-br from-primary/10 via-base-100 to-accent/10'
    case 'PITCH':
    default:
      return 'border-base-300 bg-linear-to-br from-base-100 via-base-100 to-primary/10'
  }
})

const variantClass = computed(() => {
  if (props.variant === 'hover') {
    return 'shadow-2xl ring-1 ring-primary/20 backdrop-blur-xl'
  }

  if (props.variant === 'detail') {
    return 'shadow-xl'
  }

  return 'hover:-translate-y-1 hover:shadow-xl'
})

async function ensureSheet() {
  const result = await sheetStore.ensureSheetForDream(props.dream.id)
  if (result.success && result.data) emit('ensured', result.data)
}

function imageToSrc(image?: Partial<ArtImage> | null): string {
  if (!image) return ''

  const data = (image as { imageData?: string | null }).imageData
  const thumb = (image as { thumbnailData?: string | null }).thumbnailData
  const fileType = image.fileType || 'png'

  if (thumb && !isProbablyPath(thumb)) return `data:image/${fileType};base64,${thumb}`
  if (data && !isProbablyPath(data)) return `data:image/${fileType};base64,${data}`

  return normalizeImagePath(image.imagePath || image.path || image.fileName || '')
}

function isProbablyPath(value: string) {
  const trimmed = value.trim()
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('public/') ||
    /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(trimmed)
  )
}

function normalizeImagePath(value?: string | null) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'UNDEFINED' || trimmed === 'undefined') return ''
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed
  }

  const cleanPath = trimmed
    .replace(/^file:\/\//, '')
    .replace(/^\/mnt\/data\/+/, '')
    .replace(/^\/?(app\/)?public\/+/, '')

  let withImages = cleanPath
  if (cleanPath.startsWith('/images/')) withImages = cleanPath
  else if (cleanPath.startsWith('images/')) withImages = `/${cleanPath}`
  else if (cleanPath.startsWith('/')) withImages = `/images${cleanPath}`
  else withImages = `/images/${cleanPath}`

  return appUrl.value ? `${appUrl.value}${withImages}` : withImages
}

async function loadSheet() {
  if (!props.autoLoad || activeSheet.value) return
  await sheetStore.fetchSheetByDreamId(props.dream.id)
}

onMounted(async () => {
  if (props.ensureOnLoad) await ensureSheet()
  else await loadSheet()
})

watch(
  () => props.dream.id,
  async () => {
    if (props.ensureOnLoad) await ensureSheet()
    else await loadSheet()
  },
)
</script>
