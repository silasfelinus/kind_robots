<!-- /components/conductor/ruler-hooked-page.vue -->
<template>
  <project-front-page
    class="kr-surface"
    slug="ruler-hooked"
    :fallback="config"
    :show-deliverables="false"
  >
    <template #interactive>
      <!--
        ruler-hooked/t-023: Silas, playing 2026-09-11 -- "I don't need the
        install/not now section, we should just be showing the experience."
        Installability now lives behind a single icon rather than a banner
        ahead of the game; clicking it goes straight to the native prompt
        instead of a dismiss/not-now round trip. `$pwa` is the shared
        @vite-pwa/nuxt injection (client-only plugin, hence ClientOnly here)
        -- see nuxt.config.ts's pwa.client.installPrompt comment for why this
        needed a config flag flip before `$pwa` would ever populate
        showInstallPrompt/install rather than staying inert.
      -->
      <ClientOnly>
        <div v-if="pwa?.showInstallPrompt" class="mb-3 flex justify-end">
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square rounded-2xl border border-base-300 bg-base-100/60 backdrop-blur"
            title="Install Ruler Hooked"
            @click="pwa?.install()"
          >
            <Icon name="kind-icon:download" class="kr-icon-4" />
          </button>
        </div>
      </ClientOnly>

      <RulerHookedGame />

      <!-- The "How to play" modal that held the Cast & catch / Rule the realm
           cards is gone: Silas, 2026-10-10, "move instructions to the
           tutorial section". The tab's tutorial (content/channels/projects/
           ruler-hooked.md) carries them, and the header's tutorial toggle
           opens it. -->
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
}
</script>
