<!-- /components/animation/animation-manager.vue -->
<template>
  <section class="kr-surface gap-4">
    <header
      v-if="showHeader"
      class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-4 py-3"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent"
        >
          <Icon name="kind-icon:sparkles" class="kr-icon-6" />
        </span>
        <div class="min-w-0">
          <h2 class="kr-text-black-lg leading-tight text-base-content">
            Animation Manager
          </h2>
          <p class="kr-text-dim-xs-60">
            {{ store.galleryItems.length }} live catalog effects
            <span v-if="store.layeredEffectCount > 0">
              · {{ store.layeredEffectCount }} layered on screen
            </span>
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink
          to="/conductor"
          class="kr-btn btn-outline"
          title="Animation development work lives in Conductor"
        >
          <Icon name="kind-icon:scroll" class="kr-icon-4" />
          Conductor
        </NuxtLink>
        <button
          v-if="store.layeredEffectCount > 0"
          class="kr-btn-ghost"
          type="button"
          @click="store.clearLayers()"
        >
          <Icon name="kind-icon:x" class="kr-icon-4" />
          Clear {{ store.layeredEffectCount }} layer{{ store.layeredEffectCount === 1 ? '' : 's' }}
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
      <animation-selector />

      <section class="flex min-w-0 flex-col gap-3 kr-panel-flat p-4">
        <header class="flex items-start justify-between gap-3">
          <div>
            <h3 class="kr-text-black-sm text-base-content">Coverage zones</h3>
            <p class="kr-text-dim-xs-55 mt-1">
              Choose where layered effects render. Isolated previews ignore these zones.
            </p>
          </div>
          <button
            class="btn btn-ghost btn-xs shrink-0"
            type="button"
            @click="store.resetSurfaces()"
          >
            Reset
          </button>
        </header>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-1">
          <article
            v-for="zone in zoneOptions"
            :key="zone.id"
            class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/60 p-3"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-base-300/70 text-base-content/70"
            >
              <Icon :name="zone.icon" class="kr-icon-4" />
            </span>
            <span class="min-w-16 text-sm font-black text-base-content">
              {{ zone.label }}
            </span>
            <div
              class="ml-auto flex min-w-0 flex-1 justify-end gap-1"
              role="group"
              :aria-label="`${zone.label} effect placement`"
            >
              <button
                v-for="placement in placementOptions"
                :key="placement.value"
                class="btn btn-xs min-w-0 flex-1 px-2 2xl:flex-none"
                :class="
                  store.getSurfacePlacement(zone.id) === placement.value
                    ? 'btn-primary'
                    : 'btn-ghost'
                "
                type="button"
                :aria-pressed="store.getSurfacePlacement(zone.id) === placement.value"
                :title="placement.title(zone.label)"
                @click="store.setSurfacePlacement(zone.id, placement.value)"
              >
                {{ placement.label }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div class="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
        <article
          v-for="effect in store.galleryItems"
          :key="effect.id"
          class="flex min-w-0 flex-col gap-3 kr-panel-muted-sm transition-shadow hover:shadow-lg"
          :class="store.selectedSlug === effect.id ? 'ring-2 ring-primary' : ''"
        >
          <button
            class="flex w-full items-start gap-3 text-left"
            type="button"
            @click="store.selectSlug(effect.id)"
          >
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-base-100/50"
              :style="{ borderColor: effect.color, color: effect.color }"
            >
              <Icon :name="effect.icon" class="kr-icon-6" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate font-black text-base-content">
                {{ effect.label }}
              </span>
              <span class="kr-text-dim-xs-55 block truncate">
                {{ effect.id }}
              </span>
            </span>

            <span
              v-if="store.isLayerActive(effect.id)"
              class="badge badge-primary badge-sm shrink-0"
            >
              Layered
            </span>
          </button>

          <p class="kr-text-dim-xs-60 min-h-10 leading-relaxed">
            {{ effect.tooltip }}
          </p>

          <div class="flex flex-wrap gap-1.5">
            <span class="kr-badge-ghost-sm">
              {{ surfaceLabel(effect.preferredSurface) }}
            </span>
            <span
              v-if="effect.generationSafe"
              class="kr-badge-outline-sm badge-success"
            >
              generation-safe
            </span>
            <span
              v-if="effect.blocksInput"
              class="kr-badge-outline-sm badge-warning"
            >
              captures input
            </span>
          </div>

          <div class="mt-auto grid grid-cols-2 gap-2">
            <button
              class="kr-btn-xs-lg"
              :class="store.isPreviewing(effect.id) ? 'btn-secondary' : 'btn-outline'"
              type="button"
              :title="store.isPreviewing(effect.id) ? 'Stop isolated preview' : 'Preview this effect on a clean backdrop'"
              @click="store.previewEffect(effect.id)"
            >
              <Icon
                :name="store.isPreviewing(effect.id) ? 'kind-icon:x' : 'kind-icon:eye'"
                class="kr-icon-3"
              />
              {{ store.isPreviewing(effect.id) ? 'Stop preview' : 'Preview' }}
            </button>

            <button
              class="kr-btn-xs-lg"
              :class="store.isLayerActive(effect.id) ? 'btn-primary' : 'btn-ghost'"
              type="button"
              :title="store.isLayerActive(effect.id) ? 'Remove this persistent screen layer' : 'Layer this effect over the selected coverage zones'"
              @click="store.toggleLayer(effect.id)"
            >
              <Icon name="kind-icon:layers" class="kr-icon-3" />
              {{ store.isLayerActive(effect.id) ? 'Unlayer' : 'Layer' }}
            </button>
          </div>
        </article>
      </div>

      <aside
        v-if="store.selectedItem"
        class="flex flex-col gap-4 kr-panel-flat p-4 xl:sticky xl:top-4 xl:self-start"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="kr-text-eyebrow text-xs tracking-wide text-primary">
              Catalog effect
            </p>
            <h3 class="kr-text-black-lg mt-1 text-base-content">
              {{ store.selectedItem.label }}
            </h3>
          </div>
          <button
            class="kr-btn-ghost-xs-plain"
            type="button"
            title="Close details"
            @click="store.selectSlug(null)"
          >
            <Icon name="kind-icon:x" class="kr-icon-4" />
          </button>
        </div>

        <div
          class="flex h-28 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
          :style="{ color: store.selectedItem.color }"
        >
          <Icon :name="store.selectedItem.icon" class="h-14 w-14" />
        </div>

        <p class="kr-text-dim-sm-70 leading-relaxed">
          {{ store.selectedItem.tooltip }}
        </p>

        <dl class="grid gap-2 text-sm">
          <div class="kr-panel-flat flex items-center justify-between gap-3 p-3">
            <dt class="font-bold">Preferred surface</dt>
            <dd>{{ surfaceLabel(store.selectedItem.preferredSurface) }}</dd>
          </div>
          <div class="kr-panel-flat flex items-center justify-between gap-3 p-3">
            <dt class="font-bold">Generation</dt>
            <dd>{{ store.selectedItem.generationSafe ? 'Safe' : 'Manual only' }}</dd>
          </div>
          <div class="kr-panel-flat flex items-center justify-between gap-3 p-3">
            <dt class="font-bold">Input</dt>
            <dd>{{ store.selectedItem.blocksInput ? 'Captures input' : 'Pass-through' }}</dd>
          </div>
        </dl>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <button
            class="kr-btn-primary-md-plain"
            type="button"
            @click="store.previewEffect(store.selectedItem.id)"
          >
            <Icon name="kind-icon:eye" class="kr-icon-4" />
            {{ store.isPreviewing(store.selectedItem.id) ? 'Stop preview' : 'Preview effect' }}
          </button>

          <button
            class="kr-btn btn-outline"
            type="button"
            @click="store.toggleLayer(store.selectedItem.id)"
          >
            <Icon name="kind-icon:layers" class="kr-icon-4" />
            {{ store.isLayerActive(store.selectedItem.id) ? 'Remove layer' : 'Add screen layer' }}
          </button>
        </div>

        <p class="kr-text-dim-xs leading-relaxed">
          Build history lives in source control and Conductor. This page is the single
          runtime control room for previewing, layering, positioning, and startup behavior.
        </p>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useAnimationManagerStore } from '@/stores/animationManagerStore'
import type { FxRegion } from '@/stores/animationCatalog'
import type { FxPlacementState } from '@/stores/animationStore'

withDefaults(defineProps<{ showHeader?: boolean }>(), { showHeader: true })

const store = useAnimationManagerStore()

const zoneOptions: { id: FxRegion; label: string; icon: string }[] = [
  { id: 'header', label: 'Header', icon: 'kind-icon:layout-top' },
  { id: 'sheet', label: 'Sheet', icon: 'kind-icon:layout-left' },
  { id: 'page', label: 'Page', icon: 'kind-icon:sparkle' },
  { id: 'hand', label: 'Hand', icon: 'kind-icon:layout-bottom' },
]

const placementOptions: {
  value: FxPlacementState
  label: string
  title: (zone: string) => string
}[] = [
  {
    value: 'off',
    label: 'off',
    title: (zone) => `No layered effects on the ${zone.toLowerCase()}`,
  },
  {
    value: 'behind',
    label: 'behind',
    title: (zone) => `Render layered effects behind ${zone.toLowerCase()} content`,
  },
  {
    value: 'front',
    label: 'front',
    title: (zone) => `Render layered effects in front of ${zone.toLowerCase()} content`,
  },
]

function surfaceLabel(surface: FxRegion | 'fullscreen' | undefined): string {
  if (!surface || surface === 'fullscreen') return 'Fullscreen'
  return surface.charAt(0).toUpperCase() + surface.slice(1)
}
</script>
