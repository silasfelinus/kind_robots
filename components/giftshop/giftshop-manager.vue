<!-- /components/content/giftshop/giftshop-manager.vue -->
<template>
  <dashboard-shell
    :title="dashboardTitle"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Counting butterfly inventory... tiny clipboards take time."
    nav-grid-class="xl:grid-cols-7"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #actions>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          class="btn btn-sm rounded-2xl"
          :class="
            activeTab === 'cart'
              ? 'btn-secondary'
              : cartStore.hasItems
                ? 'btn-primary'
                : 'btn-ghost'
          "
          @click="setTab('cart')"
        >
          <Icon name="kind-icon:cart" class="h-4 w-4" />
          <span>{{ cartStore.totalItems }}</span>
        </button>

        <div v-if="cartStore.hasItems" class="badge badge-secondary gap-1 p-3">
          <Icon name="kind-icon:jellybean" class="h-3 w-3" />
          ${{ cartStore.formattedTotalPrice }}
        </div>

        <div class="badge badge-accent gap-1 p-3">
          <Icon name="kind-icon:butterfly" class="h-3 w-3" />
          Swarm-operated
        </div>
      </div>
    </template>

    <template #default="{ activeTab: currentTab }">
      <section class="flex min-h-0 flex-col gap-4">
        <div
          class="overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-br from-primary/15 via-base-200 to-secondary/10 shadow-sm"
        >
          <div class="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div class="min-w-0 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <Icon
                  :name="activeTabInfo.icon"
                  class="h-7 w-7 shrink-0 text-primary"
                />

                <h2 class="text-2xl font-black text-primary sm:text-3xl">
                  {{ activeTabInfo.title || activeTabInfo.label }}
                </h2>

                <div class="badge badge-primary badge-outline">
                  {{ activeTabInfo.label }}
                </div>
              </div>

              <p
                class="max-w-4xl text-sm leading-relaxed text-base-content/75 sm:text-base"
              >
                {{ activeTabInfo.summary }}
              </p>
            </div>

            <div
              class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100/80 p-2 shadow-sm sm:grid-cols-3 lg:w-96 xl:grid-cols-4"
            >
              <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                class="btn min-h-16 rounded-2xl px-2"
                :class="currentTab === tab.key ? 'btn-primary' : 'btn-ghost'"
                @click="setTab(tab.key)"
              >
                <span class="flex flex-col items-center gap-1 text-center">
                  <Icon :name="tab.icon" class="h-5 w-5" />

                  <span class="text-xs font-bold leading-tight">
                    {{ tab.label }}
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div
            class="border-t border-base-300/70 bg-base-100/70 px-4 py-3 text-sm text-base-content/70"
          >
            <span class="font-bold text-primary">Swarm memo:</span>
            {{ swarmMemo }}
          </div>
        </div>

        <section class="min-h-0 flex-1">
          <butterfly-sanctuary
            v-if="currentTab === 'sanctuary'"
            class="min-h-128 rounded-2xl border border-base-300 bg-base-100"
          />

          <about-page
            v-else-if="currentTab === 'about'"
            class="rounded-2xl border border-base-300 bg-base-100 p-4"
          />

          <div
            v-else-if="currentTab === 'butterfly-lab'"
            class="grid grid-cols-1 gap-4 2xl:grid-cols-2"
          >
            <butterfly-lab
              class="min-h-112 rounded-2xl border border-base-300 bg-base-100"
            />

            <butterfly-grid
              class="min-h-112 rounded-2xl border border-base-300 bg-base-100"
            />
          </div>

          <giftshop-interact v-else-if="currentTab === 'giftshop'" />

          <cart-interact
            v-else-if="currentTab === 'cart'"
            class="rounded-2xl"
          />

          <subscription-manager
            v-else-if="currentTab === 'subscriptions'"
            class="rounded-2xl border border-base-300 bg-base-100 p-4"
          />

          <sponsor-page
            v-else-if="currentTab === 'sponsor'"
            class="rounded-2xl border border-base-300 bg-base-100 p-4"
          />

          <div
            v-else
            class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
          >
            The butterflies misplaced tab
            <span class="font-bold">{{ currentTab }}</span
            >. This is why we do not let them near the router unsupervised.
          </div>
        </section>
      </section>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  dashboardConfigs,
  isDashboardTabKey,
  type DashboardTabConfig,
} from '@/stores/helpers/dashboardHelper'
import { useCartStore } from '@/stores/cartStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

type GiftshopTabKey = (typeof dashboardConfigs.giftshop.tabs)[number]['key']

const dashboardKey = 'giftshop' as const
const dashboardConfig = dashboardConfigs[dashboardKey]

const cartStore = useCartStore()
const navStore = useNavStore()
const userStore = useUserStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => [...dashboardConfig.tabs])
const dashboardTitle = computed(() => dashboardConfig.label)

const storedTab = computed(() => {
  const tab = navStore.getDashboardTab?.(dashboardKey)

  if (typeof tab === 'string' && isDashboardTabKey(dashboardKey, tab)) {
    return tab as GiftshopTabKey
  }

  return dashboardConfig.defaultTab as GiftshopTabKey
})

const activeTab = computed<GiftshopTabKey>(() => storedTab.value)

const activeTabInfo = computed<DashboardTabConfig>(() => {
  const activeMatch = dashboardConfig.tabs.find((tab) => {
    return tab.key === activeTab.value
  })

  if (activeMatch) return activeMatch

  const defaultMatch = dashboardConfig.tabs.find((tab) => {
    return tab.key === dashboardConfig.defaultTab
  })

  if (defaultMatch) return defaultMatch

  return {
    key: dashboardConfig.defaultTab,
    label: dashboardConfig.label,
    icon: 'kind-icon:gift',
    title: dashboardConfig.label,
    summary:
      'The butterflies misplaced the current tab, which is frankly on brand.',
  }
})

const managerSummary = computed(() => {
  const cartText = cartStore.hasItems
    ? `${cartStore.totalItems} item(s), $${cartStore.formattedTotalPrice}`
    : 'cart currently empty, butterflies visibly disappointed'

  return `The butterflies run the sanctuary, the lab, the shop, billing, sponsorship, cart review, and allegedly the website. Current cart: ${cartText}.`
})

const swarmMemo = computed(() => {
  const messages: Record<GiftshopTabKey, string> = {
    sanctuary:
      'Sanctuary first. Commerce second. Tiny winged governance always.',
    about:
      'The org chart is mostly humans, robots, and butterflies pretending not to understand payroll.',
    'butterfly-lab':
      'Lab access granted. Please do not feed experimental butterflies after midnight or before a CSS refactor.',
    giftshop:
      'Every artifact is inspected for whimsy, structural integrity, and whether AMI thinks it has main character energy.',
    cart: 'Cart review initiated. The butterflies are counting jellybeans with terrifying precision.',
    subscriptions:
      'Subscriptions keep the servers awake and the butterflies in premium-grade imaginary nectar.',
    sponsor:
      'Sponsor energy goes toward the mission. The butterflies accept gratitude, impact, and tasteful confetti.',
  }

  return messages[activeTab.value]
})

onMounted(async () => {
  await refreshManagerData()

  if (!isDashboardTabKey(dashboardKey, storedTab.value)) {
    setTab(dashboardConfig.defaultTab)
  }
})

function setTab(tab: string) {
  const nextTab = isDashboardTabKey(dashboardKey, tab)
    ? tab
    : dashboardConfig.defaultTab

  navStore.setDashboardTab?.(dashboardKey, nextTab)
}

async function refreshManagerData() {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      cartStore.initialize(),
      userStore.initialize?.(),
      navStore.initialize?.(),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'The butterflies dropped the dashboard state into the nectar vat.'
  } finally {
    isLoadingManager.value = false
  }
}
</script>
