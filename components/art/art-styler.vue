<!-- /components/art/art-styler.vue -->
<template>
  <section
    class="art-styler flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:magic" class="h-5 w-5 text-primary" />
        <h2 class="text-base font-black text-base-content">Style Transfer</h2>
        <span class="badge badge-primary badge-sm">Kontext</span>
      </div>
      <button
        type="button"
        class="btn btn-circle btn-ghost btn-sm"
        title="Close"
        @click="emit('close')"
      >
        <Icon name="mdi:close" class="h-4 w-4" />
      </button>
    </div>

    <!-- ── Source image preview ───────────────────────────────────────── -->
    <div class="flex gap-3 rounded-xl border border-base-300 bg-base-100 p-3">
      <div
        class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-base-300"
      >
        <img
          v-if="sourceImageSrc"
          :src="sourceImageSrc"
          :alt="artImage?.fileName || 'Source image'"
          class="h-full w-full object-cover"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-base-200"
        >
          <Icon name="kind-icon:image" class="h-8 w-8 text-base-content/30" />
        </div>

        <div
          v-if="resultImageSrc"
          class="absolute -right-3 top-1/2 z-10 -translate-y-1/2"
        >
          <Icon
            name="mdi:arrow-right"
            class="h-5 w-5 text-primary drop-shadow"
          />
        </div>
      </div>

      <Transition name="slide-fade">
        <div
          v-if="resultImageSrc"
          class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-primary"
        >
          <img
            :src="resultImageSrc"
            alt="Styled result"
            class="h-full w-full object-cover"
          />
          <div
            class="absolute inset-0 flex items-center justify-center bg-success/40 backdrop-blur-sm"
          >
            <Icon
              name="mdi:check-circle"
              class="h-7 w-7 text-success-content drop-shadow"
            />
          </div>
        </div>
      </Transition>

      <div class="flex min-w-0 flex-col justify-center gap-1">
        <p class="truncate text-sm font-bold text-base-content">
          {{
            artImage?.fileName ||
            (artImage ? `Image #${artImage.id}` : 'No image')
          }}
        </p>
        <p
          v-if="selectedStyle"
          class="flex items-center gap-1 text-xs font-semibold text-primary"
        >
          <Icon name="mdi:palette" class="h-3 w-3" />
          {{ selectedStyle.label }}
        </p>
        <p v-else class="text-xs text-base-content/40 italic">
          Pick a style below
        </p>
      </div>
    </div>

    <!-- ── Category filter pills ─────────────────────────────────────── -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="cat in allCategories"
        :key="cat"
        type="button"
        class="badge cursor-pointer select-none border transition-all duration-150"
        :class="
          activeCategory === cat
            ? 'badge-primary border-primary font-bold'
            : 'badge-ghost border-base-300 hover:border-primary/40 hover:text-primary'
        "
        @click="activeCategory = activeCategory === cat ? null : cat"
      >
        <span class="mr-1">{{ CATEGORY_ICONS[cat] }}</span>
        {{ cat }}
      </button>
    </div>

    <!-- ── Style grid ─────────────────────────────────────────────────── -->
    <div
      class="grid gap-2"
      style="
        grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));
      "
    >
      <button
        v-for="style in filteredStyles"
        :key="style.loraPath"
        type="button"
        class="group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all duration-150"
        :class="
          selectedStyle?.loraPath === style.loraPath
            ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
            : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-100/80 hover:shadow-sm'
        "
        :title="style.triggerPhrase"
        @click="selectStyle(style)"
      >
        <span class="text-xl leading-none">{{
          CATEGORY_ICONS[style.category]
        }}</span>
        <span
          class="text-xs font-bold leading-tight"
          :class="
            selectedStyle?.loraPath === style.loraPath
              ? 'text-primary'
              : 'text-base-content/80 group-hover:text-primary'
          "
        >
          {{ style.label }}
        </span>

        <Transition name="pop">
          <div
            v-if="selectedStyle?.loraPath === style.loraPath"
            class="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary"
          >
            <Icon name="mdi:check" class="h-3 w-3 text-primary-content" />
          </div>
        </Transition>

        <div
          v-if="style.resourceId"
          class="absolute left-1.5 top-1.5"
          title="Loaded from resource DB"
        >
          <span class="badge badge-xs badge-success px-1">DB</span>
        </div>
      </button>
    </div>

    <!-- ── Prompt customization ───────────────────────────────────────── -->
    <Transition name="slide-fade">
      <div
        v-if="selectedStyle"
        class="flex flex-col gap-3 rounded-xl border border-primary/30 bg-base-100 p-3"
      >
        <div class="flex items-center gap-1.5">
          <Icon name="kind-icon:edit" class="h-4 w-4 text-primary" />
          <span class="text-xs font-black text-base-content">Prompt</span>
          <span class="ml-auto text-xs text-base-content/40"
            >LoRA trigger auto-prepended</span
          >
        </div>

        <div
          class="rounded-lg border border-base-300 bg-base-200 px-3 py-2 font-mono text-xs text-base-content/60"
        >
          <span class="text-warning">{{
            buildLoraReference(selectedStyle)
          }}</span>
          <span class="text-primary"> {{ selectedStyle.triggerPhrase }}</span>
          <span v-if="extraPrompt.trim()">, {{ extraPrompt }}</span>
        </div>

        <textarea
          v-model="extraPrompt"
          class="textarea textarea-bordered textarea-sm min-h-16 resize-none text-sm"
          placeholder="Additional prompt details (optional)…"
          :disabled="isGenerating"
        />

        <div class="flex items-center gap-2">
          <label
            class="label cursor-pointer gap-2 rounded-lg border border-base-300 bg-base-200 px-2 py-1.5"
          >
            <input
              v-model="useNegative"
              type="checkbox"
              class="toggle toggle-primary toggle-xs"
            />
            <span class="label-text text-xs font-semibold"
              >Inherit negative prompt</span
            >
          </label>
          <label
            class="label cursor-pointer gap-2 rounded-lg border border-base-300 bg-base-200 px-2 py-1.5"
          >
            <input
              v-model="isPublic"
              type="checkbox"
              class="toggle toggle-success toggle-xs"
            />
            <span class="label-text text-xs font-semibold">Public</span>
          </label>
        </div>
      </div>
    </Transition>

    <!-- ── Generation progress ────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="isGenerating" class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-xs font-semibold text-primary">
          <span class="loading loading-spinner loading-xs" />
          Applying {{ selectedStyle?.label }} via Kontext…
        </div>
        <progress class="progress progress-primary w-full" />
      </div>
    </Transition>

    <!-- ── Status messages ────────────────────────────────────────────── -->
    <Transition name="fade">
      <p
        v-if="errorMessage"
        class="flex items-center gap-1.5 text-sm font-semibold text-error"
      >
        <Icon name="kind-icon:alert" class="h-4 w-4" />{{ errorMessage }}
      </p>
    </Transition>
    <Transition name="fade">
      <p
        v-if="successMessage"
        class="flex items-center gap-1.5 text-sm font-semibold text-success"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />{{ successMessage }}
      </p>
    </Transition>

    <!-- ── Action bar ─────────────────────────────────────────────────── -->
    <div class="flex gap-2">
      <button
        type="button"
        class="btn btn-primary flex-1 rounded-2xl font-black shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-primary/30 active:translate-y-0 disabled:translate-y-0 disabled:shadow-none"
        :disabled="!canGenerate"
        @click="runStyleTransfer"
      >
        <span v-if="isGenerating" class="loading loading-spinner loading-sm" />
        <Icon v-else name="kind-icon:magic" class="h-5 w-5" />
        {{
          isGenerating
            ? 'Generating…'
            : selectedStyle
              ? `Apply ${selectedStyle.label}`
              : 'Pick a style'
        }}
      </button>

      <button
        v-if="selectedStyle"
        type="button"
        class="btn btn-ghost rounded-2xl"
        :disabled="isGenerating"
        @click="clearSelection"
      >
        Clear
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'
import { useServerStore } from '@/stores/serverStore'
import type { ArtImage } from '~/prisma/generated/prisma/client'

// ── Props / emits ──────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    artImage: ArtImage | null
    serverId?: number | null
  }>(),
  { artImage: null, serverId: null },
)

const emit = defineEmits<{
  generated: [image: ArtImage]
  close: []
}>()

// ── Stores ─────────────────────────────────────────────────────────────────
const artStore = useArtStore()
const resourceStore = useResourceStore()
const userStore = useUserStore()
const serverStore = useServerStore()

// ── Types ──────────────────────────────────────────────────────────────────
type StyleCategory =
  | 'Painterly'
  | 'Illustration'
  | 'Cartoon'
  | 'Anime'
  | 'Trippy'
  | '3D/Craft'
  | 'Realism'
  | 'Ink'

interface StyleEntry {
  loraPath: string
  loraWeight: number
  triggerPhrase: string
  label: string
  category: StyleCategory
  resourceId?: number
}

// ── Category icons ─────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<StyleCategory, string> = {
  Painterly: '🎨',
  Illustration: '✏️',
  Cartoon: '🎬',
  Anime: '⛩️',
  Trippy: '🌈',
  '3D/Craft': '🏺',
  Realism: '📸',
  Ink: '🖋️',
}

// ── Built-in style catalogue ───────────────────────────────────────────────
const BUILTIN_STYLES: StyleEntry[] = [
  // Painterly
  {
    loraPath: 'FLUX/watercolor.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Convert this image into loose watercolor style',
    label: 'Watercolor',
    category: 'Painterly',
  },
  {
    loraPath: 'FLUX/oil_painting.safetensors',
    loraWeight: 1,
    triggerPhrase:
      'Convert this image into heavy oil paint brush strokes style',
    label: 'Oil Painting',
    category: 'Painterly',
  },
  {
    loraPath: 'FLUX/acrylic.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Convert this image into acrylic art style',
    label: 'Acrylic',
    category: 'Painterly',
  },
  {
    loraPath: 'FLUX/impressionist.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Convert this image into impressionist art style',
    label: 'Impressionist',
    category: 'Painterly',
  },
  {
    loraPath: 'FLUX/flux1-kt_oil_painting_lora_v2.safetensors',
    loraWeight: 1,
    triggerPhrase: 'oil style',
    label: 'Oil (v2)',
    category: 'Painterly',
  },
  {
    loraPath: 'FLUX/FLUX-daubrez-DB4RZ.safetensors',
    loraWeight: 1,
    triggerPhrase: 'DB4RZ style painting',
    label: 'DB4RZ Painterly',
    category: 'Painterly',
  },
  // Illustration
  {
    loraPath: 'FLUX/digital-illustration.safetensors',
    loraWeight: 1,
    triggerPhrase: 'digital illustration',
    label: 'Digital Illust.',
    category: 'Illustration',
  },
  {
    loraPath: 'FLUX/manuscript_illustration_kontext.safetensors',
    loraWeight: 1,
    triggerPhrase: 'make it a manuscript illustration',
    label: 'Manuscript',
    category: 'Illustration',
  },
  {
    loraPath: 'FLUX/itacomic_mima6_noc_d4a2e11',
    loraWeight: 1,
    triggerPhrase: 'itacomic1 illustration',
    label: 'ITA Comic',
    category: 'Illustration',
  },
  {
    loraPath: 'FLUX/realcomic_000000900.safetensors',
    loraWeight: 1,
    triggerPhrase: 'convert the image into an illustration style',
    label: 'Real Comic',
    category: 'Illustration',
  },
  {
    loraPath: 'FLUX/luc_cris_art_style.safetensors',
    loraWeight: 1,
    triggerPhrase: 'lucart style',
    label: 'Lucart',
    category: 'Illustration',
  },
  {
    loraPath: 'FLUX/collage.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Convert this image into collage art style',
    label: 'Collage',
    category: 'Illustration',
  },
  // Cartoon
  {
    loraPath: 'FLUX/disney_lora_comfy_converted.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Disney style',
    label: 'Disney',
    category: 'Cartoon',
  },
  {
    loraPath: 'FLUX/american_kontext.safetensors',
    loraWeight: 1,
    triggerPhrase: 'American Cartoon Style',
    label: 'American Cartoon',
    category: 'Cartoon',
  },
  {
    loraPath: 'FLUX/gorillaz-kontext-lora.safetensors',
    loraWeight: 1,
    triggerPhrase: 'make this image gorillaz style',
    label: 'Gorillaz',
    category: 'Cartoon',
  },
  {
    loraPath: 'FLUX/FlatAnimation.safetensors',
    loraWeight: 1,
    triggerPhrase: 'change into animation style',
    label: 'Flat Animation',
    category: 'Cartoon',
  },
  {
    loraPath: 'FLUX/D1gitalCart00n.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Turn this image to D1gitalCart00n style',
    label: 'Digital Cartoon',
    category: 'Cartoon',
  },
  // Anime
  {
    loraPath: 'FLUX/kontext-qtorealanime.safetensors',
    loraWeight: 1,
    triggerPhrase: 'converted to a real anime style',
    label: 'Real Anime',
    category: 'Anime',
  },
  // Ink
  {
    loraPath: 'FLUX/ink_style-4-500.safetensors',
    loraWeight: 1,
    triggerPhrase: 'ink style',
    label: 'Ink',
    category: 'Ink',
  },
  {
    loraPath: 'FLUX/fae_ink.safetensors',
    loraWeight: 1,
    triggerPhrase: 'fae_ink',
    label: 'Fae Ink',
    category: 'Ink',
  },
  // 3D/Craft
  {
    loraPath: 'FLUX/Claymation.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Claymation',
    label: 'Claymation',
    category: '3D/Craft',
  },
  {
    loraPath: 'FLUX/StopMotionClay.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Turn this image to StopMotionClay',
    label: 'Stop-Motion Clay',
    category: '3D/Craft',
  },
  {
    loraPath: 'FLUX/Papercraft_Magic_style.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Convert to Papercraft Magic style',
    label: 'Papercraft',
    category: '3D/Craft',
  },
  {
    loraPath: 'FLUX/CuteAnimalsStyle.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Cute Fluffy Animals Style',
    label: 'Cute Animals',
    category: '3D/Craft',
  },
  // Trippy
  {
    loraPath: 'FLUX/LSD_and_Mushrooms_from_Trippy_Lalaland_Ethanar.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Trippy Lalaland',
    label: 'Trippy Lalaland',
    category: 'Trippy',
  },
  {
    loraPath: 'FLUX/Glowing_Tiedye_FLUX.safetensors',
    loraWeight: 1,
    triggerPhrase: 'mad-glwngtdy',
    label: 'Tie-Dye Glow',
    category: 'Trippy',
  },
  {
    loraPath: 'FLUX/Brain_Melt.safetensors',
    loraWeight: 0.8,
    triggerPhrase: 'acid surrealism',
    label: 'Brain Melt',
    category: 'Trippy',
  },
  {
    loraPath: 'FLUX/Weird_Things_Flux_v1_renderartist.safetensors',
    loraWeight: 0.8,
    triggerPhrase: 'w3irdth1ngs illustration',
    label: 'Weird Things',
    category: 'Trippy',
  },
  // Realism
  {
    loraPath: 'FLUX/aidmaHyperrealism-FLUX-v0.3.safetensors',
    loraWeight: 1,
    triggerPhrase: 'hyperrealism',
    label: 'Hyperrealism',
    category: 'Realism',
  },
  {
    loraPath: 'FLUX/realistic_kontext.safetensors',
    loraWeight: 1,
    triggerPhrase: 'Convert to a realistic art style',
    label: 'Realistic',
    category: 'Realism',
  },
  {
    loraPath:
      'FLUX/Dtpr_Photorealistic_flux_kontext_lora_v1-PAseer.safetensors',
    loraWeight: 1,
    triggerPhrase: 'dtpr_photorealistic',
    label: 'Photorealistic',
    category: 'Realism',
  },
]

// ── Reactive state ─────────────────────────────────────────────────────────
const styles = ref<StyleEntry[]>([...BUILTIN_STYLES])
const selectedStyle = ref<StyleEntry | null>(null)
const activeCategory = ref<StyleCategory | null>(null)
const extraPrompt = ref('')
const useNegative = ref(true)
const isPublic = ref(true)
const isGenerating = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resultImage = ref<ArtImage | null>(null)

// ── Derived ────────────────────────────────────────────────────────────────
const allCategories = computed<StyleCategory[]>(
  () => [...new Set(styles.value.map((s) => s.category))] as StyleCategory[],
)

const filteredStyles = computed(() =>
  activeCategory.value
    ? styles.value.filter((s) => s.category === activeCategory.value)
    : styles.value,
)

const sourceImageSrc = computed<string>(() => {
  // Guard: artImage may be null/undefined while parent is still loading
  if (!props.artImage) return ''
  const img = props.artImage as ArtImage & {
    imageData?: string | null
    thumbnailData?: string | null
    imagePath?: string | null
    path?: string | null
  }
  if (img.thumbnailData)
    return `data:image/${img.fileType || 'png'};base64,${img.thumbnailData}`
  if (img.imageData)
    return `data:image/${img.fileType || 'png'};base64,${img.imageData}`
  return img.imagePath || img.path || ''
})

const resultImageSrc = computed<string>(() => {
  if (!resultImage.value) return ''
  const img = resultImage.value as ArtImage & {
    imageData?: string | null
    imagePath?: string | null
    path?: string | null
  }
  if (img.imageData)
    return `data:image/${img.fileType || 'png'};base64,${img.imageData}`
  return img.imagePath || img.path || ''
})

const activeServerId = computed<number | null>(
  () => props.serverId ?? serverStore.activeArtServer?.id ?? null,
)

const canGenerate = computed(
  () =>
    !isGenerating.value &&
    !!selectedStyle.value &&
    !!activeServerId.value &&
    !!props.artImage,
)

// ── Helpers ────────────────────────────────────────────────────────────────
function buildLoraReference(style: StyleEntry): string {
  return `<lora:${style.loraPath}:${style.loraWeight}>`
}

function selectStyle(style: StyleEntry) {
  selectedStyle.value =
    selectedStyle.value?.loraPath === style.loraPath ? null : { ...style }
  errorMessage.value = ''
  successMessage.value = ''
  resultImage.value = null
}

function clearSelection() {
  selectedStyle.value = null
  extraPrompt.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  resultImage.value = null
}

// ── DB resource hydration ─────────────────────────────────────────────────
async function hydrateFromResourceStore(): Promise<void> {
  try {
    if (!resourceStore.hasLoaded) {
      await resourceStore.getResources()
    }

    const dbLoras = resourceStore.resources.filter(
      (r) =>
        r.resourceType === 'LORA' &&
        (r.supportedServer === 'KONTEXT' ||
          r.supportedServer === 'FLUX' ||
          r.supportedServer === 'GENERIC'),
    )

    if (!dbLoras.length) return

    const builtinPaths = new Set(styles.value.map((s) => s.loraPath))

    const updated = styles.value.map((style) => {
      const stem =
        style.loraPath.split('/').pop()?.replace('.safetensors', '') || ''
      const match = dbLoras.find(
        (r) =>
          (stem && r.localPath?.includes(stem)) ||
          r.name?.toLowerCase().includes(style.label.toLowerCase()),
      )
      return match ? { ...style, resourceId: match.id } : style
    })

    const newFromDb = dbLoras
      .filter((r) => {
        if (!r.localPath) return false
        const fullPath = r.localPath.startsWith('FLUX/')
          ? r.localPath
          : `FLUX/${r.localPath}`
        return !builtinPaths.has(fullPath)
      })
      .map(
        (r): StyleEntry => ({
          loraPath: r.localPath!.startsWith('FLUX/')
            ? r.localPath!
            : `FLUX/${r.localPath}`,
          loraWeight: 1,
          triggerPhrase: r.artPrompt || r.customLabel || r.name,
          label: r.customLabel || r.name,
          category: 'Illustration',
          resourceId: r.id,
        }),
      )

    styles.value = [...updated, ...newFromDb]
  } catch (err) {
    // AbortError fires when a concurrent fetch races ahead — non-fatal
    if (err instanceof Error && err.name === 'AbortError') return
    console.warn('[art-styler] hydrateFromResourceStore:', err)
  }
}

// ── Core generation ────────────────────────────────────────────────────────
async function runStyleTransfer(): Promise<void> {
  if (!selectedStyle.value || !activeServerId.value || !props.artImage) return

  errorMessage.value = ''
  successMessage.value = ''
  isGenerating.value = true
  resultImage.value = null

  try {
    const style = selectedStyle.value
    const loraRef = buildLoraReference(style)

    const promptString = [
      loraRef,
      style.triggerPhrase,
      extraPrompt.value.trim(),
    ]
      .filter(Boolean)
      .join(', ')

    const sourceImage = props.artImage as ArtImage & {
      imageData?: string | null
      thumbnailData?: string | null
      negativePrompt?: string | null
    }

    const result = await artStore.generateArt({
      promptString,
      negativePrompt: useNegative.value ? sourceImage.negativePrompt || '' : '',
      userId: userStore.userId ?? undefined,
      serverId: activeServerId.value,
      engine: 'kontext',
      isPublic: isPublic.value,
      isMature: props.artImage.isMature ?? false,
      sourceImageId: props.artImage.id,
      sourceImageBase64:
        sourceImage.imageData ?? sourceImage.thumbnailData ?? null,
    })

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Generation failed.')
    }

    resultImage.value = result.data
    successMessage.value = `Style applied! Image #${result.data.id} created.`
    emit('generated', result.data)
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Generation failed.'
  } finally {
    isGenerating.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  hydrateFromResourceStore()
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.pop-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.4);
}
</style>
