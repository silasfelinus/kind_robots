<template>
  <nav
    class="cs-dial @container relative min-w-56 flex-1 overflow-hidden"
    :aria-label="label"
    data-testid="cs-dial"
    @keydown.left.prevent="step(-1)"
    @keydown.right.prevent="step(1)"
  >
    <ul class="cs-dial-track flex" :style="{ '--sel': String(selectedIndex) }">
      <li
        v-for="(item, i) in items"
        :key="item.id"
        class="cs-dial-slot"
        :style="slotStyle(i)"
      >
        <button
          type="button"
          class="cs-dial-item"
          :class="i === selectedIndex ? 'cs-dial-active' : ''"
          :aria-pressed="item.action ? undefined : i === selectedIndex"
          :aria-label="item.label"
          :title="item.label"
          :data-testid="`cs-dial-${item.id}`"
          @click="emit('select', item.id)"
        >
          <span
            v-if="item.glyph"
            class="text-lg font-black leading-none"
            aria-hidden="true"
            >{{ item.glyph }}</span
          >
          <img
            v-else-if="item.image"
            :src="item.image"
            alt=""
            class="h-full w-full rounded-full object-cover object-top"
            @error="onImageError($event, item.fallback)"
          />
          <icon v-else :name="item.icon ?? 'kind-icon:info'" class="h-5 w-5" />
          <span v-if="item.badge" class="cs-dial-badge" aria-hidden="true">{{
            item.badge
          }}</span>
        </button>
      </li>
    </ul>
    <p
      class="cs-dial-label pointer-events-none text-center cs-micro font-bold uppercase tracking-widest"
      aria-hidden="true"
    >
      {{ items[selectedIndex]?.label }}
    </p>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DialItem } from '~/utils/crystalStreet/menu'

// The screens ride a dial across the top (Silas, 2026-10-24 PT: "icons on
// the top, rotating for which is selected"): the chosen screen turns to the
// centre and grows, its neighbours tilt away. Action items (the "?") fire
// without turning the dial.

const props = defineProps<{
  items: DialItem[]
  modelValue: string
  label: string
}>()
const emit = defineEmits<{ select: [string] }>()

const selectedIndex = computed(() =>
  Math.max(
    0,
    props.items.findIndex((i) => i.id === props.modelValue),
  ),
)

function slotStyle(i: number): Record<string, string> {
  const d = i - selectedIndex.value
  const far = Math.min(Math.abs(d), 3)
  return {
    '--d': String(d),
    '--far': String(far),
  }
}

function onImageError(event: Event, fallback?: string): void {
  const img = event.target as HTMLImageElement
  if (fallback && !img.src.endsWith(fallback)) img.src = fallback
  else img.style.display = 'none'
}

function step(dir: number): void {
  const screens = props.items.filter((i) => !i.action)
  const at = screens.findIndex((i) => i.id === props.modelValue)
  const next = screens[(at + dir + screens.length) % screens.length]
  if (next) emit('select', next.id)
}
</script>

<style>
.cs .cs-dial {
  --slot: 2.9rem;
  height: 3.6rem;
  perspective: 32rem;
  mask-image: linear-gradient(
    90deg,
    transparent,
    #000 10%,
    #000 90%,
    transparent
  );
}
.cs .cs-dial-track {
  position: absolute;
  top: 0.15rem;
  left: 0;
  transform-style: preserve-3d;
  transform: translateX(calc(50cqw - (var(--sel) + 0.5) * var(--slot)));
  transition: transform 450ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.cs .cs-dial-slot {
  display: grid;
  place-items: center;
  width: var(--slot);
  height: 2.6rem;
  transform: rotateY(calc(clamp(-3, var(--d), 3) * -16deg))
    scale(calc(1.18 - var(--far) * 0.14));
  opacity: calc(1 - var(--far) * 0.15);
  transition:
    transform 450ms cubic-bezier(0.2, 0.9, 0.3, 1.2),
    opacity 300ms;
}
.cs .cs-dial-item {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 999px;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 18%, transparent);
  background: color-mix(in oklch, var(--color-base-100) 80%, transparent);
}
.cs .cs-dial-active {
  border: 2px solid var(--color-primary);
  background: color-mix(
    in oklch,
    var(--color-primary) 25%,
    var(--color-base-100)
  );
  box-shadow: 0 0 14px
    color-mix(in oklch, var(--color-primary) 60%, transparent);
}
.cs .cs-dial-badge {
  position: absolute;
  right: -0.35rem;
  bottom: -0.2rem;
  min-width: 1rem;
  border-radius: 999px;
  background: var(--color-secondary);
  color: var(--color-secondary-content);
  padding: 0 0.2rem;
  font-size: 0.625rem;
  font-weight: 800;
  line-height: 1rem;
}
.cs .cs-dial-label {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
}
.cs.cs-motion-reduced .cs-dial-track,
.cs.cs-motion-reduced .cs-dial-slot {
  transition: none;
}
</style>
