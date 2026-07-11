<!-- /components/dreams/dream-pitch-sheet.vue -->
<template>
  <article
    class="pitch-sheet group/sheet relative isolate overflow-hidden rounded-2xl shadow-xl transition duration-300"
    :class="[compact ? 'pitch-sheet--compact' : 'pitch-sheet--full']"
    :style="sheetStyle"
  >
    <div class="sheet-aurora" />
    <div class="sheet-paper" />
    <div class="sheet-border" />

    <div class="sheet-corner sheet-corner--tl">
      <div class="sheet-gem" />
    </div>
    <div class="sheet-corner sheet-corner--tr">
      <div class="sheet-gem" />
    </div>
    <div class="sheet-corner sheet-corner--bl">
      <div class="sheet-gem" />
    </div>
    <div class="sheet-corner sheet-corner--br">
      <div class="sheet-gem" />
    </div>

    <svg
      class="sheet-line-art sheet-line-art--top"
      viewBox="0 0 1200 80"
      aria-hidden="true"
    >
      <path
        d="M48 42 C180 14 260 68 386 38 C486 14 560 18 600 38 C640 18 714 14 814 38 C940 68 1020 14 1152 42"
      />
      <path d="M584 40 L600 24 L616 40 L600 56 Z" />
    </svg>

    <svg
      class="sheet-line-art sheet-line-art--bottom"
      viewBox="0 0 1200 80"
      aria-hidden="true"
    >
      <path
        d="M48 38 C180 66 260 12 386 42 C486 66 560 62 600 42 C640 62 714 66 814 42 C940 12 1020 66 1152 38"
      />
      <path d="M584 40 L600 24 L616 40 L600 56 Z" />
    </svg>

    <div
      class="relative z-10 grid h-full min-h-130 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(280px,0.86fr)_minmax(360px,1.14fr)] lg:grid-rows-[auto_1fr_auto] lg:gap-5"
    >
      <header class="flex items-start justify-between gap-4 lg:col-span-2">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class="sheet-brand-mark">
            <Icon name="kind-icon:robot" class="h-5 w-5" />
          </span>
          <span
            class="truncate text-sm font-black uppercase tracking-[0.18em] text-(--sheet-ink) sm:text-base"
          >
            Kind Robots
          </span>
        </div>

        <div class="sheet-type-tab">
          <Icon :name="typeIcon" class="h-5 w-5 opacity-85" />
          <span>{{ displayTypeLabel }}</span>
        </div>
      </header>

      <section class="sheet-copy-panel min-w-0 lg:row-span-2">
        <div class="sheet-title-frame">
          <h2
            class="line-clamp-2 text-2xl font-black leading-none text-(--sheet-ink) sm:text-4xl"
          >
            {{ title }}
          </h2>
          <p
            v-if="subtitle"
            class="mt-2 line-clamp-2 text-sm font-bold leading-snug text-(--sheet-muted) sm:text-base"
          >
            {{ subtitle }}
          </p>
        </div>

        <div v-if="hook" class="sheet-hook">
          <span class="sheet-mini-label">Hook</span>
          <p
            class="line-clamp-3 text-sm font-semibold leading-snug text-(--sheet-ink) sm:text-base"
          >
            {{ hook }}
          </p>
        </div>

        <div v-if="visibleHighlights.length" class="sheet-highlights">
          <span class="sheet-mini-label">At a Glance</span>

          <div class="mt-3 grid gap-3">
            <div
              v-for="highlight in visibleHighlights"
              :key="highlight.label"
              class="sheet-highlight"
            >
              <span class="sheet-highlight-icon">
                <Icon :name="highlight.icon || typeIcon" class="h-4 w-4" />
              </span>
              <p class="min-w-0 text-sm leading-snug text-(--sheet-muted)">
                <strong class="font-black text-(--sheet-ink)"
                  >{{ highlight.label }}:</strong
                >
                {{ highlight.value }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <figure v-if="showImage" class="sheet-image-panel">
        <img
          v-if="imageSrc"
          :src="imageSrc"
          :alt="`${title} PitchSheet image`"
          class="h-full w-full object-cover transition duration-500 group-hover/sheet:scale-[1.03]"
          loading="lazy"
        />
        <div v-else class="flex h-full w-full items-center justify-center">
          <Icon
            :name="iconName"
            class="h-24 w-24 text-(--sheet-accent) opacity-50"
          />
        </div>
        <div class="sheet-image-shine" />
      </figure>

      <section class="sheet-pitch-panel">
        <span class="sheet-mini-label">Pitch</span>
        <p
          class="mt-2 line-clamp-6 text-sm leading-relaxed text-(--sheet-muted) sm:text-base"
        >
          {{ pitch || fallbackPitch }}
        </p>
      </section>

      <section
        v-if="showDetails && visibleDetails.length && !compact"
        class="grid gap-3 lg:col-span-2 lg:grid-cols-3"
      >
        <div
          v-for="detail in visibleDetails"
          :key="detail.label"
          class="sheet-detail-panel"
        >
          <span class="sheet-mini-label">{{ detail.label }}</span>
          <p
            class="mt-2 line-clamp-4 text-sm leading-relaxed text-(--sheet-muted)"
          >
            {{ detail.body }}
          </p>
        </div>
      </section>

      <footer v-if="allowActions" class="flex flex-wrap gap-2 lg:col-span-2">
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
import type {
  ArtImage,
  Dream,
  PitchSheet,
} from '~/prisma/generated/prisma/client'
import { useSheetStore, type SheetWithDream } from '@/stores/sheetStore'
import {
  dreamTypeLabel,
  getPitchSheetDisplayType,
  pitchSheetDefaults,
} from '@/stores/helpers/sheetHelper'

type ArtImageRelation = {
  ArtImage?: Partial<ArtImage> | null
}

type SheetForDisplay = (SheetWithDream | PitchSheet) & ArtImageRelation

type DreamForSheet = Partial<Dream> &
  ArtImageRelation & {
    id: number
    PitchSheet?: SheetForDisplay | null
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

type SheetTheme = {
  accent: string
  accent2: string
  deep: string
  ink: string
  muted: string
  paper: string
  soft: string
}

const props = withDefaults(
  defineProps<{
    dream: DreamForSheet
    sheet?: SheetForDisplay | null
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
    showDetails: true,
  },
)

const emit = defineEmits<{
  edit: [id: number]
  ensured: [sheet: SheetWithDream]
}>()

const sheetStore = useSheetStore()
const runtimeConfig = useRuntimeConfig()

const displayType = computed(() =>
  getPitchSheetDisplayType(props.dream.dreamType),
)
const displayTypeLabel = computed(() => dreamTypeLabel(displayType.value))
const compact = computed(() => props.variant === 'hover')

const activeSheet = computed<SheetForDisplay | null>(() => {
  return (
    props.sheet ||
    props.dream.PitchSheet ||
    sheetStore.sheetsByDreamId.get(props.dream.id) ||
    null
  )
})

const title = computed(
  () =>
    activeSheet.value?.title || props.dream.title || `Dream ${props.dream.id}`,
)
const subtitle = computed(
  () =>
    activeSheet.value?.subtitle ||
    props.dream.flavorText ||
    props.dream.description ||
    '',
)
const hook = computed(
  () =>
    activeSheet.value?.hook ||
    props.dream.flavorText ||
    props.dream.pitch ||
    '',
)
const pitch = computed(
  () =>
    activeSheet.value?.pitch ||
    props.dream.pitch ||
    props.dream.description ||
    '',
)
const fallbackPitch = computed(
  () =>
    'A readable PitchSheet preview will appear here once this Dream has a polished pitch.',
)
const iconName = computed(
  () => activeSheet.value?.icon || props.dream.icon || typeIcon.value,
)

const typeIcon = computed(() => {
  switch (displayType.value) {
    case 'ART':
      return 'kind-icon:palette'
    case 'PROMPTBOT':
      return 'kind-icon:message-square-magic'
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
    case 'PITCH':
    default:
      return 'kind-icon:file-sparkles'
  }
})

const theme = computed<SheetTheme>(() => {
  switch (displayType.value) {
    case 'ART':
      return {
        accent: '#7c3aed',
        accent2: '#f97316',
        deep: '#2e1065',
        ink: '#2b164f',
        muted: '#5f4b78',
        paper: '#fff7e8',
        soft: '#f5e7ff',
      }
    case 'PROMPTBOT':
      return {
        accent: '#3f6212',
        accent2: '#b45309',
        deep: '#1a2e05',
        ink: '#243719',
        muted: '#596648',
        paper: '#fff9e8',
        soft: '#edf7dc',
      }
    case 'NARRATOR':
      return {
        accent: '#1d4ed8',
        accent2: '#f59e0b',
        deep: '#0f2557',
        ink: '#14264b',
        muted: '#52617d',
        paper: '#fff7e8',
        soft: '#e8f1ff',
      }
    case 'CHARACTER':
      return {
        accent: '#be185d',
        accent2: '#f59e0b',
        deep: '#4a102c',
        ink: '#4a1233',
        muted: '#77526a',
        paper: '#fff3e6',
        soft: '#ffe3ef',
      }
    case 'REWARD':
      return {
        accent: '#b91c1c',
        accent2: '#f59e0b',
        deep: '#4c0519',
        ink: '#531313',
        muted: '#7b5046',
        paper: '#fff5df',
        soft: '#ffe3d3',
      }
    case 'SCENARIO':
      return {
        accent: '#0f766e',
        accent2: '#67e8f9',
        deep: '#083344',
        ink: '#123c42',
        muted: '#4d6668',
        paper: '#fff8e9',
        soft: '#dff8f4',
      }
    case 'LOCATION':
      return {
        accent: '#1e3a8a',
        accent2: '#d97706',
        deep: '#0f172a',
        ink: '#182943',
        muted: '#52616f',
        paper: '#fff4df',
        soft: '#e3efff',
      }
    case 'PITCH':
    default:
      return {
        accent: '#7e22ce',
        accent2: '#f59e0b',
        deep: '#2e1065',
        ink: '#32165c',
        muted: '#625174',
        paper: '#fff5e7',
        soft: '#f5e6ff',
      }
  }
})

const sheetStyle = computed(() => ({
  '--sheet-accent': theme.value.accent,
  '--sheet-accent-2': theme.value.accent2,
  '--sheet-deep': theme.value.deep,
  '--sheet-ink': theme.value.ink,
  '--sheet-muted': theme.value.muted,
  '--sheet-paper': theme.value.paper,
  '--sheet-soft': theme.value.soft,
}))

const visibleHighlights = computed<Highlight[]>(() => {
  const sheet = activeSheet.value
  const defaults = pitchSheetDefaults[displayType.value].highlights

  const highlights = [
    {
      label: sheet?.highlight1Label || defaults[0],
      value: sheet?.highlight1Value,
      icon: sheet?.highlight1Icon,
    },
    {
      label: sheet?.highlight2Label || defaults[1],
      value: sheet?.highlight2Value,
      icon: sheet?.highlight2Icon,
    },
    {
      label: sheet?.highlight3Label || defaults[2],
      value: sheet?.highlight3Value,
      icon: sheet?.highlight3Icon,
    },
  ]

  return highlights.filter(
    (highlight) => highlight.label && highlight.value,
  ) as Highlight[]
})

const visibleDetails = computed<Detail[]>(() => {
  const sheet = activeSheet.value

  return [
    { label: sheet?.detail1Label, body: sheet?.detail1Body },
    { label: sheet?.detail2Label, body: sheet?.detail2Body },
    { label: sheet?.detail3Label, body: sheet?.detail3Body },
  ].filter((detail) => detail.label && detail.body) as Detail[]
})

const imageSrc = computed(() => {
  const sheet = activeSheet.value
  const raw =
    sheet?.imagePath ||
    sheet?.ArtImage?.imagePath ||
    props.dream.imagePath ||
    props.dream.highlightImage ||
    props.dream.ArtImage?.imagePath ||
    null

  if (!raw) return ''
  if (raw.startsWith('http') || raw.startsWith('/')) return raw

  const publicBase = runtimeConfig.public?.siteUrl || ''
  return `${publicBase}/${raw}`
})

async function ensureSheet() {
  const result = await sheetStore.ensureSheetForDream(props.dream.id)
  if (result.success && result.data) emit('ensured', result.data)
}

onMounted(async () => {
  if (props.ensureOnLoad) {
    await ensureSheet()
    return
  }

  if (props.autoLoad && !activeSheet.value) {
    await sheetStore.fetchSheetByDreamId(props.dream.id)
  }
})

watch(
  () => props.dream.id,
  async (dreamId) => {
    if (props.autoLoad && dreamId && !sheetStore.sheetsByDreamId.has(dreamId)) {
      await sheetStore.fetchSheetByDreamId(dreamId)
    }
  },
)
</script>

<style scoped>
.pitch-sheet {
  --sheet-radius: 1.5rem;
  min-height: 640px;
  border: 1px solid color-mix(in srgb, var(--sheet-accent) 42%, transparent);
  background:
    radial-gradient(
      circle at 96% 6%,
      color-mix(in srgb, var(--sheet-accent) 38%, transparent),
      transparent 22%
    ),
    radial-gradient(
      circle at 3% 98%,
      color-mix(in srgb, var(--sheet-accent-2) 24%, transparent),
      transparent 24%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--sheet-deep) 98%, black),
      color-mix(in srgb, var(--sheet-accent) 72%, black)
    );
}

.pitch-sheet--compact {
  min-height: 420px;
}

.sheet-paper {
  position: absolute;
  inset: 0.9rem;
  border-radius: calc(var(--sheet-radius) - 0.3rem);
  background:
    radial-gradient(
      circle at 18% 16%,
      color-mix(in srgb, var(--sheet-soft) 85%, transparent),
      transparent 34%
    ),
    radial-gradient(
      circle at 72% 84%,
      color-mix(in srgb, var(--sheet-soft) 76%, transparent),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      var(--sheet-paper),
      color-mix(in srgb, var(--sheet-paper) 86%, white)
    );
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--sheet-accent) 24%, transparent),
    inset 0 0 80px rgb(89 48 16 / 0.08),
    0 24px 80px rgb(0 0 0 / 0.22);
}

.sheet-paper::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0.42;
  background-image:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--sheet-accent) 4%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      color-mix(in srgb, var(--sheet-accent) 4%, transparent) 1px,
      transparent 1px
    );
  background-size: 34px 34px;
  mask-image: radial-gradient(circle at center, black, transparent 78%);
}

.sheet-aurora {
  position: absolute;
  inset: -20%;
  opacity: 0.38;
  background: conic-gradient(
    from 120deg at 70% 35%,
    transparent,
    color-mix(in srgb, var(--sheet-accent) 50%, transparent),
    transparent,
    color-mix(in srgb, var(--sheet-accent-2) 42%, transparent),
    transparent
  );
  filter: blur(30px);
  transition:
    transform 900ms ease,
    opacity 500ms ease;
}

.group\/sheet:hover .sheet-aurora {
  opacity: 0.58;
  transform: rotate(8deg) scale(1.04);
}

.sheet-border {
  pointer-events: none;
  position: absolute;
  inset: 0.5rem;
  border-radius: calc(var(--sheet-radius) + 0.15rem);
  border: 2px solid color-mix(in srgb, var(--sheet-accent-2) 56%, white 10%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--sheet-deep) 92%, transparent),
    inset 0 0 0 5px color-mix(in srgb, var(--sheet-accent) 22%, transparent),
    0 0 24px color-mix(in srgb, var(--sheet-accent) 26%, transparent);
}

.sheet-border::before,
.sheet-border::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--sheet-accent-2),
    transparent
  );
}

.sheet-border::before {
  top: 0.45rem;
}

.sheet-border::after {
  bottom: 0.45rem;
}

.sheet-corner {
  pointer-events: none;
  position: absolute;
  z-index: 4;
  width: 8rem;
  height: 8rem;
  color: var(--sheet-accent-2);
}

.sheet-corner::before,
.sheet-corner::after {
  content: '';
  position: absolute;
  border-color: currentColor;
  opacity: 0.9;
}

.sheet-corner::before {
  inset: 0.55rem;
  border-top: 3px solid;
  border-left: 3px solid;
  border-radius: 1.1rem 0 0 0;
}

.sheet-corner::after {
  inset: 1.3rem;
  border-top: 2px solid;
  border-left: 2px solid;
  border-radius: 999px 0 0 0;
}

.sheet-corner--tl {
  left: 0.18rem;
  top: 0.18rem;
}

.sheet-corner--tr {
  right: 0.18rem;
  top: 0.18rem;
  transform: scaleX(-1);
}

.sheet-corner--bl {
  left: 0.18rem;
  bottom: 0.18rem;
  transform: scaleY(-1);
}

.sheet-corner--br {
  right: 0.18rem;
  bottom: 0.18rem;
  transform: scale(-1);
}

.sheet-gem {
  position: absolute;
  left: 0.45rem;
  top: 0.45rem;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 32% 30%,
    white,
    color-mix(in srgb, var(--sheet-accent-2) 80%, white) 24%,
    var(--sheet-accent) 68%,
    var(--sheet-deep)
  );
  box-shadow: 0 0 16px color-mix(in srgb, var(--sheet-accent) 52%, transparent);
}

.sheet-line-art {
  pointer-events: none;
  position: absolute;
  left: 7%;
  z-index: 4;
  width: 86%;
  height: 4rem;
  fill: none;
  stroke: color-mix(in srgb, var(--sheet-accent-2) 78%, white);
  stroke-width: 1.6;
  opacity: 0.55;
}

.sheet-line-art--top {
  top: 0.6rem;
}

.sheet-line-art--bottom {
  bottom: 0.6rem;
}

.sheet-brand-mark {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.7rem;
  color: var(--sheet-paper);
  background: linear-gradient(135deg, var(--sheet-deep), var(--sheet-accent));
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--sheet-accent-2) 38%, transparent);
}

.sheet-type-tab {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: min(16rem, 46vw);
  justify-content: center;
  border-radius: 0 1rem 0 1rem;
  border: 1px solid color-mix(in srgb, var(--sheet-accent-2) 70%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--sheet-deep) 95%, black),
    color-mix(in srgb, var(--sheet-accent) 80%, black)
  );
  color: white;
  padding: 0.65rem 1rem;
  font-weight: 950;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.18),
    0 8px 30px color-mix(in srgb, var(--sheet-accent) 35%, transparent);
}

.sheet-copy-panel,
.sheet-pitch-panel,
.sheet-detail-panel {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--sheet-accent) 24%, transparent);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.44), rgb(255 255 255 / 0.18)),
    color-mix(in srgb, var(--sheet-paper) 78%, white);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.35);
}

.sheet-copy-panel {
  border-radius: 1.2rem;
  padding: 1rem;
}

.sheet-title-frame {
  position: relative;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--sheet-accent) 28%, transparent);
  padding: 1rem;
  background: rgb(255 255 255 / 0.16);
}

.sheet-title-frame::before,
.sheet-title-frame::after,
.sheet-pitch-panel::before,
.sheet-detail-panel::before {
  content: '';
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  border-color: color-mix(in srgb, var(--sheet-accent) 70%, transparent);
}

.sheet-title-frame::before,
.sheet-pitch-panel::before,
.sheet-detail-panel::before {
  top: -1px;
  left: -1px;
  border-top: 2px solid;
  border-left: 2px solid;
  border-radius: 1rem 0 0 0;
}

.sheet-title-frame::after {
  right: -1px;
  bottom: -1px;
  border-right: 2px solid;
  border-bottom: 2px solid;
  border-radius: 0 0 1rem 0;
}

.sheet-hook {
  margin-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--sheet-accent) 30%, transparent);
  border-bottom: 1px solid
    color-mix(in srgb, var(--sheet-accent) 22%, transparent);
  padding: 0.8rem 0;
}

.sheet-mini-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--sheet-accent);
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.sheet-mini-label::before {
  content: '✦';
  color: var(--sheet-accent-2);
}

.sheet-highlights {
  margin-top: 1rem;
}

.sheet-highlight {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 0.7rem;
}

.sheet-highlight-icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  color: white;
  background: radial-gradient(
    circle at 30% 30%,
    color-mix(in srgb, var(--sheet-accent-2) 88%, white),
    var(--sheet-accent)
  );
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--sheet-accent-2) 38%, transparent),
    0 8px 20px color-mix(in srgb, var(--sheet-accent) 25%, transparent);
}

.sheet-highlight p {
  border-bottom: 1px dotted
    color-mix(in srgb, var(--sheet-accent) 28%, transparent);
  padding-bottom: 0.55rem;
}

.sheet-image-panel {
  position: relative;
  min-height: 320px;
  overflow: hidden;
  border-radius: 1.4rem;
  border: 2px solid color-mix(in srgb, var(--sheet-accent) 54%, transparent);
  background: radial-gradient(
    circle at center,
    white,
    color-mix(in srgb, var(--sheet-soft) 90%, white)
  );
  box-shadow:
    inset 0 0 0 7px color-mix(in srgb, var(--sheet-paper) 90%, transparent),
    inset 0 0 0 8px color-mix(in srgb, var(--sheet-accent-2) 42%, transparent),
    0 20px 50px rgb(0 0 0 / 0.16);
}

.sheet-image-panel::before,
.sheet-image-panel::after {
  content: '';
  position: absolute;
  z-index: 2;
  width: 3.25rem;
  height: 3.25rem;
  pointer-events: none;
  border-color: color-mix(in srgb, var(--sheet-accent) 88%, white 5%);
}

.sheet-image-panel::before {
  left: 0.65rem;
  top: 0.65rem;
  border-left: 3px solid;
  border-top: 3px solid;
  border-radius: 1rem 0 0 0;
}

.sheet-image-panel::after {
  right: 0.65rem;
  bottom: 0.65rem;
  border-right: 3px solid;
  border-bottom: 3px solid;
  border-radius: 0 0 1rem 0;
}

.sheet-image-shine {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 0.18), transparent 38%),
    radial-gradient(
      circle at 50% 100%,
      color-mix(in srgb, var(--sheet-accent) 28%, transparent),
      transparent 50%
    );
  mix-blend-mode: screen;
}

.sheet-pitch-panel {
  border-radius: 1.2rem;
  padding: 1rem;
}

.sheet-detail-panel {
  min-height: 116px;
  border-radius: 1.2rem;
  padding: 1rem;
}

.pitch-sheet--compact {
  min-height: 420px;
}

.pitch-sheet--compact .relative.z-10 {
  min-height: 420px;
}

.pitch-sheet--compact .sheet-type-tab {
  min-width: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
}

.pitch-sheet--compact .sheet-image-panel {
  min-height: 180px;
}

.pitch-sheet--compact .sheet-pitch-panel,
.pitch-sheet--compact .sheet-hook {
  display: none;
}

@media (max-width: 1023px) {
  .pitch-sheet {
    min-height: auto;
  }

  .sheet-line-art {
    display: none;
  }

  .sheet-type-tab {
    min-width: 0;
    font-size: 0.75rem;
  }

  .sheet-image-panel {
    min-height: 260px;
  }
}
</style>
