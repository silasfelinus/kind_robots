<template>
  <section
    class="flex min-h-0 min-w-0 flex-col gap-2"
    aria-labelledby="art-style-heading"
  >
    <p
      id="art-style-heading"
      class="font-mono text-sm font-black uppercase tracking-[.2em] sm:text-base"
    >
      Choose your art style
    </p>
    <div
      class="flex min-h-0 flex-1 gap-2"
      role="radiogroup"
      aria-label="Art style"
    >
      <button
        v-for="option in ART_STYLES"
        :key="option.id"
        type="button"
        role="radio"
        :aria-checked="style === option.id"
        class="style-swatch relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border-2 transition"
        :class="[
          `is-${option.id}`,
          style === option.id
            ? 'border-stone-900 ring-4 ring-warning'
            : 'border-stone-800/50 hover:border-stone-900',
        ]"
        :title="option.mood"
        @click="style = option.id"
      >
        <img
          v-if="!broken[option.id]"
          :src="artStyleImageSrc(ART_STYLE_SAMPLE, option.id)"
          :alt="`${option.label} example: Gus, the shop steward`"
          class="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
          loading="lazy"
          @error="broken[option.id] = true"
        />
        <span
          class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-stone-950/85 px-1 py-1 font-mono text-[11px] font-black uppercase leading-tight text-amber-50 sm:text-sm lg:text-base"
        >
          <icon
            v-if="style === option.id"
            name="kind-icon:check"
            class="size-4 shrink-0"
          />
          {{ option.label }}
        </span>
        <span
          v-if="option.id === DEFAULT_ART_STYLE"
          class="absolute left-1 top-1 rounded bg-stone-900 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-amber-50 sm:text-[10px]"
          >Default</span
        >
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, reactive, ref, type Ref } from 'vue'
import {
  ART_STYLES,
  ART_STYLE_SAMPLE,
  DEFAULT_ART_STYLE,
  artStyleImageSrc,
  type ShiftingDesksArtStyle,
} from '~/utils/shiftingDesks/artStyles'

const style = inject<Ref<ShiftingDesksArtStyle>>(
  'shifting-desks-art-style',
  ref(DEFAULT_ART_STYLE),
)
const broken = reactive<Record<string, boolean>>({})
</script>

<style scoped>
.style-swatch.is-western-cartoon {
  background: linear-gradient(135deg, #c2410c, #f59e0b 45%, #15803d);
}

.style-swatch.is-corporate-noir {
  background: linear-gradient(135deg, #0c0a09, #292524 55%, #4d7c0f);
}

.style-swatch.is-classic {
  background-color: #e9d8a6;
  background-image: radial-gradient(
    rgb(41 37 36 / 0.25) 1px,
    transparent 1.2px
  );
  background-size: 6px 6px;
}
</style>
