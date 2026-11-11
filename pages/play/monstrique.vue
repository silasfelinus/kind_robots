<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden"
    data-layout="console-fixed"
    data-testid="monstrique-two-editions"
  >
    <header-page-bar v-if="view === 'home'" console-theme="forge">
      <div class="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold">
        <Icon name="kind-icon:star" class="size-4 text-primary" />
        <span class="truncate">MONSTRIQUE</span>
        <span class="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold">
          {{
            game.audience === 'mature' ? 'Mature edition' : 'General edition'
          }}
        </span>
      </div>
    </header-page-bar>
    <MonstrexxFront
      v-if="view === 'home'"
      public-edition
      :panel="panel"
      @new="startNew"
      @continue="resume"
      @panel="panel = $event"
    />
    <PlaybookKitShell
      v-else
      :spec="ownedSpec"
      :meter-values="{ leads: Math.min(10, game.state.evidence.length) }"
    >
      <MonstressConventionScene
        public-edition
        :entry="entry"
        @menu="returnHome"
      />
    </PlaybookKitShell>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMonstriquePublicStore } from '~/stores/monstriquePublicStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { useUserStore } from '~/stores/userStore'
import { MONSTRIQUE_GENERAL_SPEC } from '~/utils/monstressConvention/edition'
import { MONSTRESS_CONVENTION } from '~/utils/playbookKit/games/monstressConvention'
import { gameLinkPreviewMeta } from '~/utils/gameLinkPreview'

useSeoMeta(
  gameLinkPreviewMeta('monstrique', useRuntimeConfig().public.appBaseUrl) ?? {},
)

type MenuPanel = 'settings' | 'scrapbook' | null
const user = useUserStore()
const game = useMonstriquePublicStore()
const kit = usePlaybookKitStore()
const view = ref<'home' | 'game'>('home')
const panel = ref<MenuPanel>(null)
const entry = ref<'new' | 'continue'>('new')
const ownedSpec = computed(() => ({
  ...(game.audience === 'mature'
    ? MONSTRESS_CONVENTION
    : MONSTRIQUE_GENERAL_SPEC),
  id: 'monstrique-' + game.audience + '-' + (user.user?.id ?? 'guest'),
}))

onMounted(() => {
  game.initialize()
  watch(
    () => [
      user.token,
      user.showMature,
      user.isMaturityRestricted,
      user.user?.id,
    ],
    () => {
      view.value = 'home'
      panel.value = null
      void game.verifyAudience()
    },
    { immediate: true },
  )
})

function startNew(): void {
  game.begin()
  kit.finishTrailer()
  entry.value = 'new'
  panel.value = null
  view.value = 'game'
}

function resume(): void {
  if (!game.hasSavedCase) return
  kit.finishTrailer()
  entry.value = 'continue'
  panel.value = null
  view.value = 'game'
}

function returnHome(): void {
  kit.closePane()
  panel.value = null
  view.value = 'home'
}
</script>
