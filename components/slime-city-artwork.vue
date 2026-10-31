<template>
  <figure class="slime-art" :class="{ 'slime-art-compact': compact }">
    <img
      v-if="record?.status === 'loaded' && record.src"
      :src="record.src"
      :alt="alt"
      loading="lazy"
      draggable="false"
    />
    <div v-else class="slime-art-fallback" aria-hidden="true">
      <span>{{ fallback || '◇' }}</span>
    </div>
    <figcaption v-if="!compact" class="slime-art-source">
      <template v-if="imageId">
        <span v-if="record?.status === 'loaded'">ART {{ imageId }} · LOADED</span>
        <span v-else-if="record?.status === 'failed'">ART {{ imageId }} · UNAVAILABLE</span>
        <span v-else>ART {{ imageId }} · {{ record?.status === 'loading' ? 'LOADING' : 'AWAITING AUTH' }}</span>
      </template>
      <span v-else>ART NOT YET ILLUSTRATED</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSlimeCityArtStore } from '~/stores/slimeCityArt'
import { useUserStore } from '~/stores/userStore'

const props = withDefaults(
  defineProps<{
    imageId?: number | null
    alt: string
    fallback?: string
    compact?: boolean
  }>(),
  { imageId: null, fallback: '', compact: false },
)

const art = useSlimeCityArtStore()
const user = useUserStore()
const record = computed(() => (props.imageId ? art.images[props.imageId] : null))

watch(
  [() => props.imageId, () => user.token],
  () => {
    void art.ensure(props.imageId ?? null)
  },
  { immediate: true },
)
</script>

<style scoped>
.slime-art {
  position: relative;
  display: block;
  margin: 0;
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: linear-gradient(145deg, #193a44, #2b193a 55%, #101c29);
}
.slime-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 37%;
}
.slime-art-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(115deg, #fff1 0 2px, transparent 2px 20px);
  color: #dbffa0;
  font-size: clamp(1.2rem, 3vw, 3.5rem);
  font-weight: 900;
}
.slime-art-source {
  position: absolute;
  inset: auto 0 0;
  padding: 0.25rem 0.35rem;
  background: #0b1327c9;
  color: #e1f4c5;
  font-size: 0.52rem;
  font-weight: 850;
  letter-spacing: 0.045em;
  text-align: left;
  white-space: nowrap;
}
.slime-art-compact .slime-art-fallback {
  font-size: 1.6rem;
}
</style>
