<!-- /components/animation/animation-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="showHeader"
      class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-4 py-3"
    >
      <div class="flex items-center gap-3">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent"
        >
          <Icon name="kind-icon:sparkles" class="h-6 w-6" />
        </span>
        <div>
          <h2 class="text-lg font-black leading-tight text-base-content">
            Animation Manager
          </h2>
          <p class="text-xs text-base-content/60">
            {{ store.galleryItems.length }} live catalog effects
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink
          to="/play/screenfx"
          class="btn btn-outline btn-sm rounded-xl"
          title="Toggle effects live on-screen"
        >
          <Icon name="kind-icon:sparkles" class="h-4 w-4" />
          Screen FX
        </NuxtLink>
        <NuxtLink
          to="/conductor"
          class="btn btn-outline btn-sm rounded-xl"
          title="Animation development work lives in Conductor"
        >
          <Icon name="kind-icon:scroll" class="h-4 w-4" />
          Conductor
        </NuxtLink>
        <button
          v-if="activeCount > 0"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="store.clearEffects()"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear {{ activeCount }}
        </button>
      </div>
    </div>

    <div
      class="kr-panes gap-0"
      :class="[
        'grid-cols-1',
        store.selectedItem
          ? 'xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]'
          : '',
      ]"
    >
      <div
        class="kr-pane-scroll grid auto-rows-min grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="effect in store.galleryItems"
          :key="effect.id"
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 transition-shadow hover:shadow-lg"
          :class="store.selectedSlug === effect.id ? 'ring-2 ring-primary' : ''"
        >
          <button
            class="flex w-full items-start gap-3 text-left"
            type="button"
            @click="store.selectSlug(effect.id)"
          >
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
              :style="{ borderColor: effect.color, color: effect.color }"
            >
              <Icon :name="effect.icon" class="h-6 w-6" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate font-black text-base-content">
                {{ effect.label }}
              </span>
              <span class="block truncate text-xs text-base-content/55">
                {{ effect.id }}
              </span>
            </span>

            <span
              v-if="store.isEffectActive(effect.id)"
              class="badge badge-success badge-sm"
            >
              Active
            </span>
          </button>

          <p class="text-xs leading-relaxed text-base-content/60">
            {{ effect.tooltip }}
          </p>

          <div class="mt-auto flex flex-wrap items-center gap-2">
            <button
              class="btn btn-xs rounded-lg"
              :class="store.isEffectActive(effect.id) ? 'btn-secondary' : 'btn-outline'"
              type="button"
              :title="store.isEffectActive(effect.id) ? 'Turn this effect off' : 'Trigger this effect live on screen'"
              @click="store.previewEffect(effect.id)"
            >
              <Icon :name="store.isEffectActive(effect.id) ? 'kind-icon:x' : 'kind-icon:eye'" class="h-3 w-3" />
              {{ store.isEffectActive(effect.id) ? 'Stop' : 'Preview' }}
            </button>
            <span class="badge badge-ghost badge-sm">
              {{ surfaceLabel(effect.preferredSurface) }}
            </span>
            <span v-if="effect.generationSafe" class="badge badge-success badge-outline badge-sm">
              generation-safe
            </span>
          </div>
        </article>
      </div>

      <aside
        v-if="store.selectedItem"
        class="kr-pane-scroll flex flex-col gap-4 border-l border-base-300 bg-base-100 p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-wide text-primary">
              Catalog effect
            </p>
            <h3 class="mt-1 text-lg font-black text-base-content">
              {{ store.selectedItem.label }}
            </h3>
          </div>
          <button
            class="btn btn-ghost btn-xs"
            type="button"
            title="Close details"
            @click="store.selectSlug(null)"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <div
          class="flex h-24 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
          :style="{ color: store.selectedItem.color }"
        >
          <Icon :name="store.selectedItem.icon" class="h-12 w-12" />
        </div>

        <p class="text-sm leading-relaxed text-base-content/70">
          {{ store.selectedItem.tooltip }}
        </p>

        <dl class="grid gap-2 text-sm">
          <div class="kr-panel-flat flex items-center justify-between gap-3 p-3">
            <dt class="font-bold">Surface</dt>
            <dd>{{ surfaceLabel(store.selectedItem.preferredSurface) }}</dd>
          </div>
          <div class="kr-panel-flat flex items-center justify-between gap-3 p-3">
            <dt class="font-bold">Generation</dt>
            <dd>{{ store.selectedItem.generationSafe ? 'Safe' : 'Manual only' }}</dd>
          </div>
          <div class="kr-panel-flat flex items-center justify-between gap-3 p-3">
            <dt class="font-bold">Input</dt>
            <dd>{{ store.selectedItem.blocksInput ? 'Blocks input' : 'Pass-through' }}</dd>
          </div>
        </dl>

        <button
          class="btn btn-primary"
          type="button"
          @click="store.previewEffect(store.selectedItem.id)"
        >
          <Icon name="kind-icon:sparkles" class="h-4 w-4" />
          {{ store.isEffectActive(store.selectedItem.id) ? 'Stop effect' : 'Preview effect' }}
        </button>

        <p class="text-xs leading-relaxed text-base-content/50">
          Animation history now belongs in source control and Conductor. The retired
          Component museum is no longer used as a parallel build ledger.
        </p>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAnimationManagerStore } from '@/stores/animationManagerStore'
import type { FxRegion } from '@/stores/animationCatalog'

withDefaults(defineProps<{ showHeader?: boolean }>(), { showHeader: true })

const store = useAnimationManagerStore()
const activeCount = computed(
  () => store.galleryItems.filter((effect) => store.isEffectActive(effect.id)).length,
)

function surfaceLabel(surface: FxRegion | 'fullscreen' | undefined): string {
  if (!surface || surface === 'fullscreen') return 'Fullscreen'
  return surface.charAt(0).toUpperCase() + surface.slice(1)
}
</script>
