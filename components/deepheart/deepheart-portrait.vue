<template>
  <figure
    class="dh-portrait"
    :class="[`dh-portrait-${size}`, { 'is-down': down, 'is-dim': dim }]"
    :style="{
      '--dh-role':
        id === CUSTOM_HERO_ID ? 'var(--color-primary)' : roleColor(id),
    }"
    :data-testid="`dh-portrait-${id}`"
  >
    <img
      v-if="src && !failed"
      :src="src"
      :alt="person.name"
      class="dh-portrait-img"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
    <div v-else class="dh-portrait-drawn" aria-hidden="true">
      <span class="dh-portrait-glyph">{{ initials(person.name) }}</span>
      <span class="dh-portrait-role">{{ role.label }}</span>
    </div>
    <figcaption v-if="caption" class="dh-portrait-caption">
      <span class="dh-portrait-name">{{ displayName }}</span>
      <span class="dh-portrait-sub">{{ role.label }}</span>
    </figcaption>
    <span v-if="badge" class="dh-portrait-badge">{{ badge }}</span>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  RENDERED_ART,
  initials,
  portraitSrc,
  roleColor,
} from '~/utils/deepheart/art'
import { ROLES, character } from '~/utils/deepheart/roster'
import { CUSTOM_HERO_ID } from '~/utils/deepheart/types'
import type { RoleId } from '~/utils/deepheart/types'

const props = withDefaults(
  defineProps<{
    id: string
    customRole?: RoleId
    size?: 'xs' | 'sm' | 'md' | 'lg'
    caption?: boolean
    name?: string
    badge?: string
    down?: boolean
    dim?: boolean
  }>(),
  {
    customRole: 'warrior',
    size: 'md',
    caption: false,
    name: '',
    badge: '',
    down: false,
    dim: false,
  },
)

const failed = ref(false)
const person = computed(() =>
  props.id === CUSTOM_HERO_ID
    ? {
        ...character('idris'),
        id: CUSTOM_HERO_ID,
        name: props.name || 'Custom delver',
        role: props.customRole ?? 'warrior',
      }
    : character(props.id),
)
const role = computed(() => ROLES[person.value.role])
const src = computed(() =>
  props.id === CUSTOM_HERO_ID ? null : portraitSrc(props.id, RENDERED_ART),
)
watch(src, () => {
  failed.value = false
})

const displayName = computed(() => props.name || person.value.name)
</script>

<style scoped>
.dh-portrait {
  position: relative;
  display: grid;
  aspect-ratio: 3 / 4;
  overflow: clip;
  border-radius: var(--radius-box);
  border: 1px solid color-mix(in oklch, var(--dh-role) 55%, transparent);
  background:
    radial-gradient(
      120% 80% at 30% 15%,
      color-mix(in oklch, var(--dh-role) 45%, var(--color-base-300)) 0%,
      var(--color-base-200) 70%
    ),
    var(--color-base-200);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, black 30%, transparent);
}
.dh-portrait-img {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
}
.dh-portrait-drawn {
  grid-area: 1 / 1;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.15rem;
  padding: 0.25rem;
  text-align: center;
}
.dh-portrait-glyph {
  font-family: var(--pf-display, ui-serif, Georgia, serif);
  font-size: clamp(1rem, 30cqw, 3rem);
  line-height: 1;
  letter-spacing: 0.04em;
  color: color-mix(in oklch, var(--dh-role) 70%, var(--color-base-content));
  text-shadow: 0 2px 10px color-mix(in oklch, black 60%, transparent);
}
.dh-portrait-role {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.75;
}
.dh-portrait {
  container-type: inline-size;
}
.dh-portrait-caption {
  grid-area: 1 / 1;
  align-self: end;
  display: grid;
  gap: 0.05rem;
  padding: 1.4rem 0.45rem 0.35rem;
  background: linear-gradient(
    transparent,
    color-mix(in oklch, black 78%, transparent) 55%
  );
  line-height: 1.15;
}
.dh-portrait-name {
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--color-base-content);
}
.dh-portrait-sub {
  font-size: 0.62rem;
  opacity: 0.8;
}
.dh-portrait-badge {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  border-radius: 999px;
  padding: 0.05rem 0.4rem;
  font-size: 0.6rem;
  font-weight: 700;
  background: var(--color-secondary);
  color: var(--color-secondary-content);
}
.dh-portrait-xs .dh-portrait-role,
.dh-portrait-sm .dh-portrait-role {
  display: none;
}
.is-down {
  filter: grayscale(1) brightness(0.55);
}
.is-dim {
  opacity: 0.45;
}
</style>
