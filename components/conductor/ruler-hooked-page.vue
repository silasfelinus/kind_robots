<!-- /components/conductor/ruler-hooked-page.vue -->
<template>
  <project-front-page class="kr-surface" slug="ruler-hooked" :fallback="config">
    <template #interactive>
      <!--
        ruler-hooked/t-015: explicit "install this app" affordance. `$pwa` is
        the shared @vite-pwa/nuxt injection (client-only plugin, hence
        ClientOnly here) -- see nuxt.config.ts's pwa.client.installPrompt
        comment for why this needed a config flag flip before `$pwa` would
        ever populate showInstallPrompt/install rather than staying inert.
        This is the only route in the app currently wired to it; the flag
        itself is global so any other route could add the same banner later.
      -->
      <ClientOnly>
        <div
          v-if="pwa?.showInstallPrompt"
          class="alert mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 py-2 text-sm"
        >
          <span
            >Install Ruler Hooked to play offline, without browser chrome.</span
          >
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              @click="pwa?.install()"
            >
              Install
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="pwa?.cancelInstall()"
            >
              Not now
            </button>
          </div>
        </div>
      </ClientOnly>

      <RulerHookedGame />
    </template>
  </project-front-page>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const { $pwa: pwa } = useNuxtApp()

const config: ProjectFrontConfig = {
  slug: 'ruler-hooked',
  title: 'Ruler Hooked',
  icon: 'kind-icon:crown',
  tagline: 'Rule the shore. Answer to the tide.',
  description:
    'A fishing-meets-kingdom-management slideshow sim. Cast lines, land catches, and spend the haul running a seaside realm through a slideshow of tides and decisions — where every catch reshapes the crown you wear.',
  sections: [
    {
      key: 'fish',
      title: 'Cast & catch',
      body: "Work the tides for the day's haul; rare catches swing the whole kingdom.",
      icon: 'kind-icon:fish',
    },
    {
      key: 'rule',
      title: 'Rule the realm',
      body: 'Spend your catch on the seaside kingdom and live with the consequences.',
      icon: 'kind-icon:crown',
    },
  ],
  deliverables: {
    done: ['Core loop design', 'Slideshow-sim structure'],
    next: ['Playable slideshow UI', 'Catch + kingdom balancing'],
  },
}
</script>
