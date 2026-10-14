<template>
  <section
    class="flex min-h-0 min-w-0 flex-col gap-2"
    aria-labelledby="art-style-heading"
  >
    <div class="flex flex-col">
      <p
        id="art-style-heading"
        class="font-mono text-sm font-black uppercase tracking-[.2em] sm:text-base"
      >
        Choose your art style
      </p>
      <span class="hidden text-xs opacity-80 sm:block">
        Every card in the game is painted in your style. Switch anytime from the
        toolbar.
      </span>
    </div>
    <div
      class="flex min-h-0 flex-1 gap-2 lg:flex-col"
      role="radiogroup"
      aria-label="Art style"
      aria-describedby="art-style-heading"
    >
      <button
        v-for="option in ART_STYLES"
        :key="option.id"
        type="button"
        role="radio"
        :aria-checked="style === option.id"
        class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border-2 bg-stone-50 text-left text-stone-900 transition lg:flex-row"
        :class="
          style === option.id
            ? 'border-stone-900 ring-4 ring-warning'
            : 'border-stone-800/50 hover:border-stone-900'
        "
        :title="option.mood"
        @click="style = option.id"
      >
        <span
          class="style-swatch relative block aspect-[4/3] w-full shrink-0 lg:aspect-auto lg:h-full lg:w-[52%]"
          :class="`is-${option.id}`"
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
            v-if="option.id === DEFAULT_ART_STYLE"
            class="absolute left-1 top-1 rounded bg-stone-900 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-amber-50 sm:text-[10px]"
            >Default</span
          >
        </span>
        <span
          class="flex min-w-0 flex-col gap-0.5 px-2 py-1 lg:justify-center lg:gap-1 lg:px-4"
        >
          <span
            class="flex items-center gap-1 font-mono text-[11px] font-black uppercase leading-tight sm:text-sm lg:text-lg"
          >
            <icon
              v-if="style === option.id"
              name="kind-icon:check"
              class="size-4 shrink-0"
            />
            {{ option.label }}
          </span>
          <span class="hidden text-xs leading-snug md:block lg:text-sm">{{
            option.blurb
          }}</span>
        </span>
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
