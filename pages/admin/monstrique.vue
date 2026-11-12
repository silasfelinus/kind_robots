<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden"
    data-layout="console-fixed"
    data-testid="monstrexx-admin"
  >
    <div
      v-if="!mayPlay"
      class="grid h-full min-h-0 flex-1 place-items-center bg-base-300 p-5 text-center"
    >
      <div class="max-w-md space-y-3">
        <Icon name="kind-icon:lock" class="mx-auto size-9 opacity-60" />
        <p class="text-xs font-semibold uppercase tracking-[0.3em] opacity-60">
          Private studio preview
        </p>
        <p class="text-2xl font-bold">Access restricted</p>
        <p class="opacity-75">
          This internal preview requires an administrator account with mature
          content enabled. Accounts with the child role cannot enter.
        </p>
        <p v-if="caseStore.checking" class="text-sm opacity-60" role="status">
          Checking account access…
        </p>
      </div>
    </div>
    <template v-else>
      <header-page-bar v-if="view !== 'game'" console-theme="forge">
        <div class="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold">
          <Icon name="kind-icon:star" class="size-4 text-primary" />
          <span class="truncate">MONSTRIQUE STUDIO</span>
          <div
            class="ml-auto flex shrink-0 gap-1"
            role="tablist"
            aria-label="Monstrique studio"
          >
            <button
              type="button"
              role="tab"
              class="btn btn-xs"
              :class="view === 'home' ? 'btn-primary' : 'btn-ghost'"
              :aria-selected="view === 'home'"
              data-testid="monstrique-studio-preview"
              @click="openView('home')"
            >
              Preview
            </button>
            <button
              type="button"
              role="tab"
              class="btn btn-xs"
              :class="view === 'bible' ? 'btn-primary' : 'btn-ghost'"
              :aria-selected="view === 'bible'"
              data-testid="monstrique-studio-bible"
              @click="openView('bible')"
            >
              Series bible
            </button>
          </div>
        </div>
      </header-page-bar>
      <MonstriqueSeriesBible v-if="view === 'bible'" />
      <MonstrexxFront
        v-else-if="view === 'home'"
        :panel="panel"
        @new="startNew"
        @continue="resume"
        @panel="panel = $event"
      />
      <PlaybookKitShell
        v-else
        :spec="ownedSpec"
        :meter-values="{ leads: Math.min(10, caseStore.state.evidence.length) }"
      >
        <MonstressConventionScene :entry="entry" @menu="returnHome" />
      </PlaybookKitShell>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMonstressConventionStore } from '~/stores/monstressConventionStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { useUserStore } from '~/stores/userStore'
import { monstrexxKitId } from '~/utils/monstressConvention/prologue'
import { MONSTRESS_CONVENTION } from '~/utils/playbookKit/games/monstressConvention'

type MenuPanel = 'settings' | 'scrapbook' | 'achievements' | null
const user = useUserStore()
const caseStore = useMonstressConventionStore()
const kit = usePlaybookKitStore()
const route = useRoute()
const view = ref<'home' | 'game' | 'bible'>(
  route.query.view === 'bible' ? 'bible' : 'home',
)
const panel = ref<MenuPanel>(null)
const entry = ref<'new' | 'continue'>('new')
const mayPlay = computed(
  () => caseStore.authorized && user.isAdmin && user.showMature,
)
const ownedSpec = computed(() => ({
  ...MONSTRESS_CONVENTION,
  id: monstrexxKitId(user.user?.id ?? 0),
}))

onMounted(() => {
  watch(
    () => [user.token, user.showMature, user.isAdmin],
    () => {
      if (!user.token || !user.showMature || !user.isAdmin) view.value = 'home'
      void caseStore.verifyAccess()
    },
    { immediate: true },
  )
})

function startNew(): void {
  if (!mayPlay.value) return
  caseStore.begin()
  kit.finishTrailer()
  entry.value = 'new'
  panel.value = null
  view.value = 'game'
}

function resume(): void {
  if (!mayPlay.value || !caseStore.hasSavedCase) return
  kit.finishTrailer()
  entry.value = 'continue'
  panel.value = null
  view.value = 'game'
}

function openView(next: 'home' | 'bible'): void {
  panel.value = null
  view.value = next
  void navigateTo(
    { query: next === 'bible' ? { view: 'bible' } : {} },
    { replace: true },
  )
}

function returnHome(): void {
  kit.closePane()
  panel.value = null
  view.value = 'home'
}
</script>
