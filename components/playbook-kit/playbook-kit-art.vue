<template>
  <span class="pk-art block overflow-hidden bg-neutral">
    <span class="relative block size-full">
      <span
        class="absolute inset-0 bg-gradient-to-br"
        :class="TINT[tone ?? 'neutral']"
      />
      <span class="pk-art-glow absolute inset-0" />
      <Icon
        v-if="!showing"
        :name="icon ?? 'kind-icon:image'"
        class="absolute left-1/2 top-1/2 size-1/4 max-h-12 max-w-12 -translate-x-1/2 -translate-y-1/2 text-white/40 drop-shadow"
      />
      <span
        v-if="!showing && withBrief"
        class="absolute inset-x-0 bottom-0 line-clamp-3 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 text-[10px] leading-snug text-white/70"
      >
        {{ art.brief }}
      </span>
      <img
        v-if="art.src && !broken"
        :key="art.src"
        :src="art.src"
        :alt="art.alt ?? ''"
        loading="lazy"
        decoding="async"
        class="absolute inset-0 size-full object-cover transition-opacity duration-500"
        :class="[loaded ? 'opacity-100' : 'opacity-0', pan ? 'pk-pan' : '']"
        :style="{ objectPosition: art.focus }"
        @load="loaded = true"
        @error="broken = true"
      />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { KitArt, KitTone } from '~/utils/playbookKit/types'

const props = defineProps<{
  art: KitArt
  tone?: KitTone
  icon?: string
  withBrief?: boolean
  pan?: boolean
}>()

const broken = ref(false)
const loaded = ref(false)
const showing = computed(() => !!props.art.src && !broken.value && loaded.value)

watch(
  () => props.art.src,
  () => {
    broken.value = false
    loaded.value = false
  },
)

const TINT: Record<KitTone, string> = {
  primary: 'from-primary/60 via-primary/20 to-black/80',
  secondary: 'from-secondary/60 via-secondary/20 to-black/80',
  accent: 'from-accent/60 via-accent/20 to-black/80',
  info: 'from-info/55 via-info/20 to-black/80',
  success: 'from-success/55 via-success/20 to-black/80',
  warning: 'from-warning/55 via-warning/20 to-black/80',
  error: 'from-error/55 via-error/20 to-black/80',
  neutral: 'from-base-content/25 via-neutral to-black/80',
}
</script>

<style scoped>
.pk-art-glow {
  background:
    radial-gradient(
      circle at 30% 25%,
      rgb(255 255 255 / 0.14),
      transparent 45%
    ),
    radial-gradient(circle at 75% 80%, rgb(0 0 0 / 0.45), transparent 55%);
}
.pk-pan {
  animation: pk-pan 9s ease-out both;
}
@keyframes pk-pan {
  from {
    transform: scale(1.12) translate(-2%, 1%);
  }
  to {
    transform: scale(1) translate(0, 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pk-pan {
    animation: none;
  }
}
</style>
