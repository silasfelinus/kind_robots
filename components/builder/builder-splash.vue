<!-- /components/builder/builder-splash.vue -->
<template>
  <section class="grid min-h-full gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:p-6">
    <div class="flex min-w-0 flex-col justify-center gap-4">
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name="kind-icon:sparkles" class="h-7 w-7" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-black uppercase tracking-widest text-primary/70">{{ store.activeConfig.label }}</p>
          <h1 class="text-3xl font-black leading-tight text-base-content md:text-5xl">{{ store.splash.title }}</h1>
        </div>
      </div>

      <p v-if="store.splash.subtitle" class="text-xl font-bold text-secondary">{{ store.splash.subtitle }}</p>
      <p class="max-w-3xl text-lg leading-relaxed text-base-content/70">{{ store.splash.description }}</p>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-primary rounded-2xl" @click="startBuilder">
          <Icon name="kind-icon:play" class="h-4 w-4" />
          {{ store.splash.ctaLabel || 'Start building' }}
        </button>
        <button type="button" class="btn btn-ghost rounded-2xl border border-base-300" @click="store.randomCard()">
          <Icon name="kind-icon:dice" class="h-4 w-4" />
          {{ store.splash.secondaryLabel || 'Surprise me' }}
        </button>
      </div>
    </div>

    <div class="relative min-h-72 overflow-hidden rounded-2xl border border-base-300 bg-base-200">
      <img
        v-if="store.splash.imagePath"
        :src="store.splash.imagePath"
        :alt="store.splash.title"
        class="h-full min-h-72 w-full object-cover"
      />
      <div v-else class="flex h-full min-h-72 items-center justify-center">
        <Icon name="kind-icon:cards" class="h-20 w-20 text-base-content/20" />
      </div>
      <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-100/95 to-transparent p-4">
        <p class="text-sm font-black text-base-content">{{ store.splash.tagline }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

function startBuilder(): void {
  const first = store.visibleCards[0]
  if (first) store.selectCard(first.key)
}
</script>
