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

    <!-- ── Source image selection ─────────────────────────────────────── -->
    <div
      class="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 p-3"
    >
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:image" class="h-4 w-4 text-primary" />
        <span class="text-xs font-black text-base-content">Source Image</span>
        <div class="flex-1" />
        <!-- Tab switcher -->
        <div
          class="flex overflow-hidden rounded-lg border border-base-300 text-xs"
        >
          <button
            type="button"
            class="px-2.5 py-1 font-bold transition"
            :class="
              sourceTab === 'upload'
                ? 'bg-primary text-primary-content'
                : 'bg-base-100 text-base-content/60 hover:bg-base-200'
            "
            @click="sourceTab = 'upload'"
          >
            Upload
          </button>
          <button
            type="button"
            class="px-2.5 py-1 font-bold transition"
            :class="
              sourceTab === 'gallery'
                ? 'bg-primary text-primary-content'
                : 'bg-base-100 text-base-content/60 hover:bg-base-200'
            "
            @click="sourceTab = 'gallery'"
          >
            Gallery
          </button>
        </div>
      </div>

      <!-- Selected source preview -->
      <Transition name="slide-fade">
        <div
          v-if="selectedSourceImage"
          class="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2"
        >
          <div
            class="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-base-300"
          >
            <img
              :src="sourceImageSrc"
              :alt="selectedSourceImage.fileName || 'Source'"
              class="h-full w-full object-cover"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-bold text-base-content">
              {{
                selectedSourceImage.fileName ||
                `Image #${selectedSourceImage.id}`
              }}
            </p>
            <p class="text-xs text-base-content/40">Ready to style</p>
          </div>
          <button
            type="button"
            class="btn btn-circle btn-ghost btn-xs shrink-0"
            title="Clear source"
            @click="clearSourceImage"
          >
            <Icon name="mdi:close" class="h-3 w-3" />
          </button>
        </div>
      </Transition>

      <!-- Upload tab -->
      <div v-if="sourceTab === 'upload'" class="flex flex-col gap-2">
        <input
          ref="fileInput"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          class="hidden"
          @change="handleFileSelect"
        />
        <div
          class="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all duration-200"
          :class="
            isDragging
              ? 'scale-[1.01] border-primary bg-primary/10 shadow-md shadow-primary/20'
              : 'border-base-300 bg-base-200/60 hover:border-primary/60 hover:bg-base-100 hover:shadow-sm'
          "
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
        >
          <span
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-200 transition-transform"
            :class="
              isDragging
                ? 'scale-110 border-primary/40 bg-primary/10 text-primary'
                : 'text-base-content/40'
            "
          >
            <Icon name="kind-icon:camera" class="h-5 w-5" />
          </span>
          <p class="text-xs font-semibold text-base-content/60">
            Drop image or
            <span class="font-bold text-primary underline underline-offset-2"
              >browse</span
            >
          </p>
          <p class="text-[0.65rem] text-base-content/40">PNG · JPEG · WebP</p>
        </div>
      </div>

      <!-- Gallery tab -->
      <div v-else class="flex flex-col gap-2">
        <!-- Search -->
        <label
          class="input input-bordered input-xs flex items-center gap-1.5 bg-base-200"
        >
          <Icon
            name="kind-icon:search"
            class="h-3.5 w-3.5 shrink-0 text-base-content/40"
          />
          <input
            v-model="gallerySearch"
            type="search"
            class="min-w-0 flex-1 bg-transparent"
            placeholder="Search images…"
          />
        </label>

        <!-- Image mini-grid -->
        <div
          v-if="galleryImages.length"
          class="grid max-h-52 grid-cols-4 gap-1.5 overflow-y-auto rounded-xl sm:grid-cols-5 md:grid-cols-6"
        >
          <button
            v-for="image in galleryImages"
            :key="image.id"
            type="button"
            class="group relative aspect-square overflow-hidden rounded-xl border-2 transition-all"
            :class="
              selectedSourceImage?.id === image.id
                ? 'border-primary shadow-md shadow-primary/20'
                : 'border-transparent hover:border-primary/50'
            "
            :title="image.fileName || `Image #${image.id}`"
            @click="selectGalleryImage(image)"
          >
            <img
              v-if="galleryThumbs[image.id]"
              :src="galleryThumbs[image.id]"
              :alt="image.fileName || String(image.id)"
              class="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-base-200"
            >
              <Icon
                name="kind-icon:image"
                class="h-4 w-4 text-base-content/20"
              />
            </div>
            <div
              v-if="selectedSourceImage?.id === image.id"
              class="absolute inset-0 flex items-center justify-center bg-primary/30"
            >
              <Icon
                name="mdi:check-circle"
                class="h-5 w-5 text-primary-content drop-shadow"
              />
            </div>
          </button>
        </div>

        <div
          v-else-if="isLoadingGallery"
          class="flex min-h-28 items-center justify-center rounded-xl bg-base-200"
        >
          <span class="loading loading-spinner loading-sm text-primary" />
        </div>

        <div
          v-else
          class="flex min-h-28 flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200/60 text-center"
        >
          <Icon name="kind-icon:image" class="h-8 w-8 text-base-content/20" />
          <p class="mt-1 text-xs text-base-content/40">No images found</p>
        </div>
      </div>
    </div>

    <!-- ── Source + result preview row ───────────────────────────────── -->
    <Transition name="slide-fade">
      <div
        v-if="selectedSourceImage || resultImage"
        class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-3"
      >
        <div
          class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-base-300"
        >
          <img
            v-if="sourceImageSrc"
            :src="sourceImageSrc"
            :alt="selectedSourceImage?.fileName || 'Source image'"
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
              selectedSourceImage?.fileName ||
              (selectedSourceImage
                ? `Image #${selectedSourceImage.id}`
                : 'No image')
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
    </Transition>

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
        class="group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border-2 p-0 text-center transition-all duration-150"
        :class="
          selectedStyle?.loraPath === style.loraPath
            ? 'border-primary shadow-md shadow-primary/20'
            : 'border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-sm'
        "
        :title="style.triggerPhrase"
        @click="selectStyle(style)"
      >
        <!-- Style preview image (if present) -->
        <div
          v-if="style.previewImageSrc"
          class="relative w-full overflow-hidden"
          style="aspect-ratio: 1 / 1"
        >
          <img
            :src="style.previewImageSrc"
            :alt="style.label"
            class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <!-- Subtle overlay gradient for label legibility -->
          <div
            class="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-base-300/80 to-transparent"
          />
          <!-- Label over image -->
          <div
            class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 px-1.5 pb-2 pt-1"
          >
            <span
              class="text-[0.65rem] font-black leading-tight text-white drop-shadow-md"
            >
              {{ style.label }}
            </span>
          </div>
          <!-- Category emoji top-left -->
          <span
            class="absolute left-1.5 top-1.5 text-base leading-none drop-shadow"
          >
            {{ CATEGORY_ICONS[style.category] }}
          </span>
        </div>

        <!-- Text-only card (no preview image) -->
        <div
          v-else
          class="flex w-full flex-col items-center gap-1.5 px-2 py-3"
          :class="
            selectedStyle?.loraPath === style.loraPath
              ? 'bg-primary/10'
              : 'bg-base-100'
          "
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
        </div>

        <!-- Selected checkmark -->
        <Transition name="pop">
          <div
            v-if="selectedStyle?.loraPath === style.loraPath"
            class="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary"
          >
            <Icon name="mdi:check" class="h-3 w-3 text-primary-content" />
          </div>
        </Transition>

        <!-- DB badge -->
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
            : !selectedSourceImage
              ? 'Select a source image'
              : !selectedStyle
                ? 'Pick a style'
                : `Apply ${selectedStyle.label}`
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
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'
import { useServerStore } from '@/stores/serverStore'
import type { ArtImage } from '~/prisma/generated/prisma/client'

// ── Props / emits ──────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    serverId?: number | null
  }>(),
  { serverId: null },
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
  /** Optional preview image shown on the style card. Set manually via admin or style manager. */
  previewImageSrc?: string
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
// previewImageSrc is intentionally absent from builtins — populate via admin or resourceStore hydration
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

// Source image state
const selectedSourceImage = ref<ArtImage | null>(null)
const sourceTab = ref<'upload' | 'gallery'>('upload')
const uploadedImageData = ref<string | null>(null) // base64 of locally-uploaded file
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// Gallery picker state
const gallerySearch = ref('')
const galleryThumbs = ref<Record<number, string>>({})
const isLoadingGallery = ref(false)

// ── Derived ────────────────────────────────────────────────────────────────
const allCategories = computed<StyleCategory[]>(
  () => [...new Set(styles.value.map((s) => s.category))] as StyleCategory[],
)

const filteredStyles = computed(() =>
  activeCategory.value
    ? styles.value.filter((s) => s.category === activeCategory.value)
    : styles.value,
)

/** Gallery images filtered by search, capped for the mini-grid */
const galleryImages = computed<ArtImage[]>(() => {
  const query = gallerySearch.value.trim().toLowerCase()
  return artStore.artImages
    .filter((img) => {
      if (!query) return true
      return [img.fileName, img.promptString, String(img.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    .slice(0, 48)
})

const sourceImageSrc = computed<string>(() => {
  // Locally uploaded file takes priority
  if (uploadedImageData.value) return uploadedImageData.value
  if (!selectedSourceImage.value) return ''
  const img = selectedSourceImage.value as ArtImage & {
    imageData?: string | null
    thumbnailData?: string | null
    imagePath?: string | null
    path?: string | null
  }
  if (img.thumbnailData)
    return `data:image/${img.fileType || 'png'};base64,${img.thumbnailData}`
  if (img.imageData)
    return `data:image/${img.fileType || 'png'};base64,${img.imageData}`
  return img.imagePath || img.path || galleryThumbs.value[img.id] || ''
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

type KontextCapableServer = {
  id: number
  userId?: number | null
  isActive?: boolean | null
  isOfficial?: boolean | null
  isMetered?: boolean | null
  category?: string | null
  serverType?: string | null
  generationEngine?: string | null
  supportsComfyWorkflow?: boolean | null
  supportsFlux?: boolean | null
  supportsKontext?: boolean | null
  supportsWorkflowUpload?: boolean | null
}

function isOfficialFallbackServer(server: KontextCapableServer): boolean {
  return Boolean(
    server.isOfficial ||
    server.category === 'official' ||
    server.userId === 9 ||
    server.isMetered,
  )
}

function isUserSupportedKontextServer(server: KontextCapableServer): boolean {
  if (!server.isActive) return false
  if (isOfficialFallbackServer(server)) return false

  const isComfy =
    server.serverType === 'COMFY' ||
    server.generationEngine === 'COMFY' ||
    Boolean(server.supportsComfyWorkflow)

  const supportsFluxWorkflow =
    Boolean(server.supportsFlux) ||
    Boolean(server.supportsKontext) ||
    Boolean(server.supportsWorkflowUpload)

  return isComfy && supportsFluxWorkflow
}

const kontextServerId = computed<number | null>(() => {
  const servers = Array.isArray(serverStore.servers)
    ? (serverStore.servers as KontextCapableServer[])
    : []

  if (props.serverId) {
    const explicitServer = serverStore.getServerById(props.serverId) as
      | KontextCapableServer
      | null
      | undefined

    if (explicitServer && isUserSupportedKontextServer(explicitServer)) {
      return explicitServer.id
    }
  }

  const activeServer = serverStore.activeArtServer as
    | KontextCapableServer
    | null
    | undefined

  if (activeServer && isUserSupportedKontextServer(activeServer)) {
    return activeServer.id
  }

  const userId = userStore.userId ?? userStore.user?.id ?? null

  const ownedServer =
    servers.find((server) => {
      return (
        userId &&
        server.userId === userId &&
        server.generationEngine === 'KONTEXT' &&
        isUserSupportedKontextServer(server)
      )
    }) ||
    servers.find((server) => {
      return (
        userId &&
        server.userId === userId &&
        server.generationEngine === 'COMFY' &&
        isUserSupportedKontextServer(server)
      )
    }) ||
    servers.find((server) => {
      return (
        userId &&
        server.userId === userId &&
        isUserSupportedKontextServer(server)
      )
    })

  if (ownedServer) return ownedServer.id

  const personalServer =
    servers.find((server) => {
      return (
        server.generationEngine === 'KONTEXT' &&
        isUserSupportedKontextServer(server)
      )
    }) ||
    servers.find((server) => {
      return (
        server.generationEngine === 'COMFY' &&
        isUserSupportedKontextServer(server)
      )
    }) ||
    servers.find(isUserSupportedKontextServer)

  return personalServer?.id ?? null
})

function isKontextCapableServer(server: KontextCapableServer): boolean {
  if (!server.isActive) return false

  return (
    server.generationEngine === 'KONTEXT' ||
    server.generationEngine === 'COMFY' ||
    server.serverType === 'COMFY' ||
    Boolean(server.supportsComfyWorkflow) ||
    Boolean(server.supportsFlux)
  )
}

const canGenerate = computed(
  () =>
    !isGenerating.value && !!selectedStyle.value && !!selectedSourceImage.value,
)

// ── Upload handlers ────────────────────────────────────────────────────────
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) processUploadedFile(input.files[0])
  if (fileInput.value) fileInput.value.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processUploadedFile(file)
}

function processUploadedFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    uploadedImageData.value = dataUrl

    // Build a synthetic ArtImage-like object so the rest of the logic is uniform
    const synthetic = {
      id: -1,
      fileName: file.name,
      fileType: file.type.replace('image/', ''),
      imageData: dataUrl.split(',')[1] ?? null,
      thumbnailData: null,
      imagePath: null,
    } as unknown as ArtImage

    selectedSourceImage.value = synthetic
    errorMessage.value = ''
    successMessage.value = ''
    resultImage.value = null
  }
  reader.readAsDataURL(file)
}

// ── Gallery handlers ───────────────────────────────────────────────────────
async function selectGalleryImage(image: ArtImage) {
  uploadedImageData.value = null
  resultImage.value = null
  errorMessage.value = ''
  successMessage.value = ''

  // Use cached thumb if available
  if (galleryThumbs.value[image.id]) {
    selectedSourceImage.value = image
    return
  }

  // Attempt to hydrate thumb
  try {
    const fetched = await artStore.getArtImageById(image.id, {
      includeImageData: false,
      includeThumbnailData: true,
    })
    if (fetched) {
      const hydrated = fetched as ArtImage & { thumbnailData?: string | null }
      if (hydrated.thumbnailData) {
        galleryThumbs.value = {
          ...galleryThumbs.value,
          [image.id]: `data:image/${hydrated.fileType || 'png'};base64,${hydrated.thumbnailData}`,
        }
      }
      selectedSourceImage.value = hydrated
    } else {
      selectedSourceImage.value = image
    }
  } catch {
    selectedSourceImage.value = image
  }
}

function clearSourceImage() {
  selectedSourceImage.value = null
  uploadedImageData.value = null
  resultImage.value = null
  errorMessage.value = ''
  successMessage.value = ''
}

// ── Gallery lazy-load thumbnails for the mini-grid ────────────────────────
async function hydrateGalleryThumbs() {
  const missing = galleryImages.value
    .filter((img) => !galleryThumbs.value[img.id])
    .slice(0, 24)
  if (!missing.length) return
  isLoadingGallery.value = true
  try {
    await Promise.all(
      missing.map(async (img) => {
        try {
          const fetched = await artStore.getArtImageById(img.id, {
            includeImageData: false,
            includeThumbnailData: true,
          })
          const hydrated = fetched as
            | (ArtImage & { thumbnailData?: string | null })
            | null
          if (hydrated?.thumbnailData) {
            galleryThumbs.value = {
              ...galleryThumbs.value,
              [img.id]: `data:image/${hydrated.fileType || 'png'};base64,${hydrated.thumbnailData}`,
            }
          } else if (hydrated?.imagePath) {
            galleryThumbs.value = {
              ...galleryThumbs.value,
              [img.id]: hydrated.imagePath,
            }
          }
        } catch {
          // non-fatal
        }
      }),
    )
  } finally {
    isLoadingGallery.value = false
  }
}

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
    if (!resourceStore.hasLoaded) await resourceStore.getResources()

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
      if (!match) return style
      return {
        ...style,
        resourceId: match.id,
        // Hydrate previewImageSrc from resource if available and not already set
        previewImageSrc: style.previewImageSrc || match.imagePath || undefined,
      }
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
          previewImageSrc: r.imagePath || undefined,
        }),
      )

    styles.value = [...updated, ...newFromDb]
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    console.warn('[art-styler] hydrateFromResourceStore:', err)
  }
}

// ── Core generation ──────────────
async function runStyleTransfer(): Promise<void> {
  if (!selectedStyle.value || !selectedSourceImage.value) return

  errorMessage.value = ''
  successMessage.value = ''
  isGenerating.value = true
  resultImage.value = null

  try {
    const style = selectedStyle.value
    const loraRef = buildLoraReference(style)

    const promptString = [
      `${loraRef} ${style.triggerPhrase}`.trim(),
      extraPrompt.value.trim(),
    ]
      .filter(Boolean)
      .join(', ')

    let sourceImage = selectedSourceImage.value as ArtImage & {
      imageData?: string | null
      thumbnailData?: string | null
      negativePrompt?: string | null
    }

    if (
      !uploadedImageData.value &&
      sourceImage.id > 0 &&
      !sourceImage.imageData
    ) {
      const fetched = await artStore.getArtImageById(sourceImage.id, {
        includeImageData: true,
        includeThumbnailData: true,
      })

      if (fetched) {
        sourceImage = fetched as ArtImage & {
          imageData?: string | null
          thumbnailData?: string | null
          negativePrompt?: string | null
        }
        selectedSourceImage.value = fetched
      }
    }

    const base64Payload = uploadedImageData.value
      ? (uploadedImageData.value.split(',')[1] ?? null)
      : (sourceImage.imageData ?? null)

    if (!base64Payload) {
      throw new Error('Could not load full image data for style transfer.')
    }

    const result = await artStore.generateArt({
      promptString,
      negativePrompt: useNegative.value ? sourceImage.negativePrompt || '' : '',
      userId: userStore.userId ?? undefined,
      serverId: kontextServerId.value,
      engine: 'kontext',
      transport: 'backend',
      isPublic: isPublic.value,
      isMature: sourceImage.isMature ?? false,
      sourceImageId: sourceImage.id > 0 ? sourceImage.id : undefined,
      sourceImageBase64: base64Payload,
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

// ── Watchers ───────────────────────────────────────────────────────────────
watch(sourceTab, async (tab) => {
  if (tab === 'gallery') {
    if (!artStore.artImages.length) {
      isLoadingGallery.value = true
      try {
        await artStore.fetchAllArtImages({
          force: false,
          includeImageData: false,
          includeThumbnailData: false,
          includePitches: false,
        })
      } finally {
        isLoadingGallery.value = false
      }
    }
    await hydrateGalleryThumbs()
  }
})

watch(gallerySearch, () => hydrateGalleryThumbs())

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
