<template>
  <div class="desk-art relative overflow-hidden" :class="frame">
    <div
      v-if="!loaded"
      class="absolute inset-0 flex flex-col justify-end gap-1 p-3 text-stone-900"
    >
      <icon
        v-if="fallbackIcon"
        :name="fallbackIcon"
        :size="iconSize"
        class="m-auto text-stone-900/70"
      />
      <p
        v-if="prompt && showBrief"
        class="rounded-md bg-stone-50/75 px-2 py-1 text-[10px] italic leading-snug"
      >
        <span class="line-clamp-2">
          <span class="font-bold not-italic uppercase tracking-wider"
            >Art brief:</span
          >
          {{ prompt }}
        </span>
      </p>
    </div>
    <img
      v-if="displaySrc && !failed"
      :key="displaySrc"
      :src="displaySrc"
      :alt="alt"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
      :class="[loaded ? 'opacity-100' : 'opacity-0', position]"
      @load="loaded = true"
      @error="onImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, type Ref } from 'vue'
import { artStyleImageSrc } from '~/utils/shiftingDesks/artStyles'

const props = withDefaults(
  defineProps<{
    src: string
    prompt?: string
    alt?: string
    fallbackIcon?: string
    iconSize?: string
    frame?: string
    position?: string
    showBrief?: boolean
  }>(),
  {
    prompt: '',
    alt: '',
    fallbackIcon: '',
    iconSize: '4rem',
    frame: 'aspect-[4/3]',
    position: 'object-[50%_35%]',
    showBrief: true,
  },
)

const loaded = ref(false)
const failed = ref(false)
const style = inject<Ref<string>>('shifting-desks-art-style', ref('classic'))
const displaySrc = ref('')

// A concept skin never turns an otherwise illustrated card into a broken slot.
// Fall back to the original Classic file only when that alternate render is absent.
watch(
  [() => props.src, style],
  ([src, selected]) => {
    displaySrc.value = artStyleImageSrc(src, selected)
    loaded.value = false
    failed.value = false
  },
  { immediate: true },
)

function onImageError(): void {
  if (displaySrc.value && displaySrc.value !== props.src) {
    displaySrc.value = props.src
    loaded.value = false
  } else {
    failed.value = true
  }
}
</script>

<style scoped>
.desk-art {
  background-color: #d9c48c;
  background-image: radial-gradient(
    rgb(41 37 36 / 0.12) 1px,
    transparent 1.2px
  );
  background-size: 6px 6px;
}
</style>
