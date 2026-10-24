<template>
  <section
    class="kr-panes grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] @3xl:grid-rows-1"
    aria-label="Theme music video"
  >
    <div class="cs-frame grid min-h-0 place-items-center bg-black p-2">
      <video
        class="aspect-video max-h-full w-full rounded-xl bg-black"
        src="/crystal-street/video/theme.mp4"
        poster="/crystal-street/video/theme-poster.webp"
        controls
        playsinline
        preload="none"
        data-testid="cs-theme-video"
      />
    </div>
    <aside class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-lg leading-tight">
          Terrors on Crystal Street (Theme)
        </h2>
      </div>
      <div class="kr-pane-scroll space-y-3 p-3 text-sm" aria-label="Lyrics">
        <div v-for="section in THEME_LYRICS" :key="section.id">
          <p class="cs-kicker">{{ section.kind }}</p>
          <p v-for="line in section.lines" :key="line" class="leading-snug">
            {{ line }}
          </p>
        </div>
        <p class="text-xs opacity-70">
          Horror punk, written and sung with Kind Robots' music studio, every
          frame painted in the game's own style.
        </p>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { THEME_LYRICS } from '~/utils/crystalStreet/theme'
</script>
