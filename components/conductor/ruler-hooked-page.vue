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
      <div class="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm gap-1.5 rounded-2xl border border-base-300 bg-base-100/60 backdrop-blur"
          @click="showTutorial = true"
        >
          <Icon name="kind-icon:question" class="kr-icon-4" />
          How to play
        </button>
        <ClientOnly>
          <button
            v-if="pwa?.showInstallPrompt"
            type="button"
            class="btn btn-ghost btn-sm btn-square rounded-2xl border border-base-300 bg-base-100/60 backdrop-blur"
            title="Install Ruler Hooked"
            @click="pwa?.install()"
          >
            <Icon name="kind-icon:download" class="kr-icon-4" />
          </button>
        </ClientOnly>
      </div>

      <RulerHookedGame />

      <!-- ruler-hooked/t-023: the "Cast & catch" / "Rule the realm" cards
           used to render as marketing sections in the shared front-page
           shell, competing with the game for the first screen. They are
           instructions, not marketing, so they now live behind the "How to
           play" affordance above instead. -->
      <Teleport to="body">
        <dialog
          v-if="showTutorial"
          class="modal modal-open"
          aria-modal="true"
          @cancel.prevent="showTutorial = false"
        >
          <div
            class="modal-box flex max-w-md flex-col gap-4 rounded-3xl border border-base-300 bg-base-100"
          >
            <h3 class="kr-text-black-lg text-base-content">How to play</h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <article
                v-for="block in tutorialSections"
                :key="block.key"
                class="kr-panel flex flex-col gap-2 rounded-2xl p-4"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary"
                  >
                    <Icon :name="block.icon" class="kr-icon-5" />
                  </span>
                  <h4 class="kr-text-black-base text-base-content">
                    {{ block.title }}
                  </h4>
                </div>
                <p class="kr-text-dim-sm-70 leading-relaxed">
                  {{ block.body }}
                </p>
              </article>
            </div>
            <button
              type="button"
              class="kr-btn-primary self-end"
              @click="showTutorial = false"
            >
              Got it
            </button>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button type="button" @click="showTutorial = false">close</button>
          </form>
        </dialog>
      </Teleport>
    </template>
  </project-front-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const { $pwa: pwa } = useNuxtApp()

const showTutorial = ref(false)

const tutorialSections = [
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
]

const config: ProjectFrontConfig = {
  slug: 'ruler-hooked',
  title: 'Ruler Hooked',
  icon: 'kind-icon:crown',
  tagline: 'Rule the shore. Answer to the tide.',
  description:
    'A fishing-meets-kingdom-management slideshow sim. Cast lines, land catches, and spend the haul running a seaside realm through a slideshow of tides and decisions — where every catch reshapes the crown you wear.',
}
</script>
