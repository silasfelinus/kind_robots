<!-- /components/art/stylist-manager.vue -->
<!--
  Hair by Superkate suite (/stylist) — a web replica of the whole Superkate app
  (conductor superkate-hairstyle-ai t-015), not just the hair restyler:
  Calculator | Clients | History | Hair Studio. Data lives in superkateStore
  (localStorage-persisted mock; KR-model-backed sync is a follow-up).
-->
<template>
  <section class="stylist-suite flex h-full min-h-0 w-full flex-col gap-3">
    <nav
      class="flex flex-wrap items-center gap-1 rounded-2xl border border-base-300 bg-base-200 p-2"
    >
      <Icon name="kind-icon:magic" class="ml-1 h-5 w-5 text-primary" />
      <span class="mr-2 text-sm font-black text-base-content">
        {{ superkate.settings.salonName }}
      </span>
      <button
        v-for="view in visibleViews"
        :key="view.key"
        type="button"
        class="btn btn-sm rounded-xl"
        :class="superkate.activeView === view.key ? 'btn-primary' : 'btn-ghost'"
        @click="superkate.activeView = view.key"
      >
        <Icon :name="view.icon" class="h-4 w-4" />
        {{ view.label }}
      </button>
      <div class="flex-1" />
      <span
        v-if="superkate.isSyncing"
        class="mr-1 flex items-center gap-1 text-xs font-semibold text-base-content/50"
        title="Syncing the studio book"
      >
        <span class="loading loading-spinner loading-xs" />
        syncing
      </span>
      <span
        v-else-if="superkate.serverBacked"
        class="mr-1 text-xs font-semibold text-success"
        title="Studio book synced across devices"
      >
        synced
      </span>
      <span
        v-if="stylist.isBusy"
        class="mr-1 flex items-center gap-1 text-xs font-semibold text-primary"
      >
        <span class="loading loading-spinner loading-xs" />
        styling
      </span>
    </nav>

    <p v-if="superkate.syncError" class="rounded-xl bg-warning/10 p-2 text-xs text-warning">
      {{ superkate.syncError }} — working from this device's copy.
    </p>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <stylist-calculator v-if="superkate.activeView === 'calculator'" />
      <stylist-clients v-else-if="superkate.activeView === 'clients'" />
      <stylist-history v-else-if="superkate.activeView === 'history'" />
      <stylist-settings v-else-if="superkate.activeView === 'settings'" />
      <stylist-relay-status
        v-else-if="superkate.activeView === 'diagnostics'"
      />
      <stylist-restyle v-else />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStylistStore } from '@/stores/stylistStore'
import { useSuperkateStore } from '@/stores/superkateStore'
import { useUserStore } from '@/stores/userStore'

const stylist = useStylistStore()
const superkate = useSuperkateStore()
const userStore = useUserStore()

const views = [
  {
    key: 'studio',
    label: 'Hair Studio',
    icon: 'kind-icon:magic',
    adminOnly: false,
  },
  {
    key: 'calculator',
    label: 'Calculator',
    icon: 'kind-icon:sparkles',
    adminOnly: false,
  },
  {
    key: 'clients',
    label: 'Clients',
    icon: 'kind-icon:heart',
    adminOnly: false,
  },
  {
    key: 'history',
    label: 'History',
    icon: 'kind-icon:book',
    adminOnly: false,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'kind-icon:adjust',
    adminOnly: false,
  },
  {
    key: 'diagnostics',
    label: 'Diagnostics',
    icon: 'kind-icon:activity',
    adminOnly: true,
  },
] as const

// Hide the admin-only Diagnostics tab from non-admins entirely, rather than
// showing it and letting the panel's own admin gate render a dead end.
const visibleViews = computed(() =>
  views.filter((view) => !view.adminOnly || userStore.isAdmin),
)

onMounted(() => {
  superkate.hydrate()
})
</script>
