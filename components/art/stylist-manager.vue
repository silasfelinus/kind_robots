<!-- /components/art/stylist-manager.vue -->
<template>
  <section class="stylist-suite flex h-full min-h-0 w-full flex-col gap-3">
    <header-page-bar>
      <nav class="stylist-bar" aria-label="Salon services views">
        <span
          class="stylist-bar-title"
          :title="`${superkate.settings.salonName} Services`"
        >
          <Icon name="kind-icon:sparkles" class="kr-icon-primary-5" />
          <span class="kr-text-black-sm truncate text-base-content">
            {{ superkate.settings.salonName }}
          </span>
        </span>
        <div class="stylist-bar-views">
          <button
            v-for="view in visibleViews"
            :key="view.key"
            type="button"
            class="kr-btn"
            :class="
              superkate.activeView === view.key ? 'btn-primary' : 'btn-ghost'
            "
            @click="superkate.activeView = view.key"
          >
            <Icon :name="view.icon" class="kr-icon-4" />
            {{ view.label }}
          </button>
        </div>
        <span
          v-if="superkate.isSyncing"
          class="kr-text-dim-xs flex shrink-0 items-center gap-1 font-semibold"
          title="Syncing the service book"
        >
          <span class="kr-spinner-xs" />
          <span class="stylist-bar-sync-label">syncing</span>
        </span>
        <span
          v-else-if="superkate.serverBacked"
          class="shrink-0 text-xs font-semibold text-success"
          title="Service book synced across devices"
        >
          synced
        </span>
      </nav>
    </header-page-bar>

    <p
      v-if="superkate.syncError"
      class="rounded-xl bg-warning/10 p-2 text-xs text-warning"
    >
      {{ superkate.syncError }} — working from this device's copy.
    </p>

    <div class="kr-scroll">
      <stylist-calculator v-if="superkate.activeView === 'calculator'" />
      <stylist-clients v-else-if="superkate.activeView === 'clients'" />
      <stylist-history v-else-if="superkate.activeView === 'history'" />
      <stylist-settings v-else-if="superkate.activeView === 'settings'" />
      <stylist-relay-status
        v-else-if="superkate.activeView === 'diagnostics'"
      />
      <stylist-calculator v-else />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSuperkateStore } from '@/stores/superkateStore'
import { useUserStore } from '@/stores/userStore'

const superkate = useSuperkateStore()
const userStore = useUserStore()

const views = [
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

const visibleViews = computed(() =>
  views.filter((view) => !view.adminOnly || userStore.isAdmin),
)

onMounted(() => {
  superkate.hydrate()

  if (superkate.activeView === 'studio') {
    superkate.activeView = 'calculator'
  }
})
</script>

<style scoped>
.stylist-bar {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}
.stylist-bar-title {
  display: inline-flex;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 14rem;
  align-items: center;
  gap: 0.375rem;
}
.stylist-bar-views {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.stylist-bar-views::-webkit-scrollbar {
  display: none;
}
.stylist-bar-views > * {
  flex: none;
}
@container (max-width: 640px) {
  .stylist-bar-title {
    display: none;
  }
}
@container (max-width: 420px) {
  .stylist-bar-sync-label {
    display: none;
  }
}
</style>
