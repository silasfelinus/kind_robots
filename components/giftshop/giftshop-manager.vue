<!-- /components/content/giftshop/giftshop-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager || managerError"
      class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-sm shadow"
    >
      <p
        class="min-w-0 flex-1 text-base-content/70"
        :class="managerError ? 'text-error' : ''"
      >
        {{ managerError || managerSummary }}
      </p>

      <button
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="managerError ? 'btn-error' : 'btn-ghost'"
        :disabled="isLoadingManager"
        @click="refreshManagerData"
      >
        <Icon
          name="kind-icon:refresh"
          class="h-4 w-4"
          :class="isLoadingManager ? 'animate-spin' : ''"
        />
        Refresh
      </button>
    </div>

    <section class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <section
        v-if="activeTab === 'community'"
        class="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <about-page />
          <sponsor-page />
        </div>
      </section>

      <section
        v-else-if="activeTab === 'giftshop'"
        class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      >
        <giftshop-interact class="h-full min-h-0 flex-1 overflow-hidden" />
      </section>

      <section
        v-else-if="activeTab === 'mana'"
        class="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div
          v-if="manaTopupNotice"
          class="rounded-xl border p-3 text-center text-sm font-medium"
          :class="
            manaTopupNotice === 'success'
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-warning/40 bg-warning/10 text-warning'
          "
        >
          {{
            manaTopupNotice === 'success'
              ? '⚡ Mana top-up complete — your balance updates below.'
              : 'Mana top-up cancelled. No charge was made.'
          }}
        </div>
        <div
          v-if="subscriptionNotice"
          class="rounded-xl border p-3 text-center text-sm font-medium"
          :class="
            subscriptionNotice === 'success'
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-warning/40 bg-warning/10 text-warning'
          "
        >
          {{
            subscriptionNotice === 'success'
              ? '🎫 Subscription active — thank you for supporting Kind Robots!'
              : 'Subscription checkout cancelled. No charge was made.'
          }}
        </div>
        <mana-wallet />
        <credit-purchase />
        <subscription-manager />
      </section>

      <section
        v-else-if="activeTab === 'forum'"
        class="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div
          class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto overscroll-contain p-6 text-center"
        >
          <Icon name="kind-icon:forum" class="h-12 w-12 text-primary" />

          <div class="max-w-xl space-y-2">
            <h2 class="text-2xl font-black text-base-content">
              Giftshop Forum
            </h2>

            <p class="text-sm leading-relaxed text-base-content/70">
              The butterflies are drafting community guidelines in glitter ink.
              This tab is wired to the dashboard canon and ready for the real
              forum component when it lands.
            </p>
          </div>
        </div>
      </section>

      <div
        v-else
        class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        The butterflies misplaced tab
        <span class="mx-1 font-bold">{{ activeTab }}</span>
        . This is why we do not let them near the router unsupervised.
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  dashboardConfigs,
  isDashboardTabKey,
} from '@/stores/helpers/dashboardHelper'
import { useCartStore } from '@/stores/cartStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

type GiftshopTabKey = (typeof dashboardConfigs.giftshop.tabs)[number]['key']

const defaultDashboardKey = 'giftshop' as const
const dashboardConfig = dashboardConfigs[defaultDashboardKey]

const cartStore = useCartStore()
const navStore = useNavStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)
const manaTopupNotice = ref<'success' | 'cancelled' | null>(null)
const subscriptionNotice = ref<'success' | 'cancelled' | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const storedTab = computed(() => {
  const tab = navStore.getDashboardTab?.(dashboardKey.value)

  if (typeof tab === 'string' && isDashboardTabKey(defaultDashboardKey, tab)) {
    return tab as GiftshopTabKey
  }

  return dashboardConfig.defaultTab as GiftshopTabKey
})

const activeTab = computed<GiftshopTabKey>(() => storedTab.value)

const managerSummary = computed(() => {
  const cartText = cartStore.hasItems
    ? `${cartStore.totalItems} item(s), $${cartStore.formattedTotalPrice}`
    : 'cart currently empty, butterflies visibly disappointed'

  return `The butterflies run the sanctuary, shop, forum, billing, sponsorship, cart review, wallet audits, about page, and allegedly the website. Current cart: ${cartText}.`
})

const swarmMemo = computed(() => {
  const messages: Record<GiftshopTabKey, string> = {
    community:
      'Sanctuary first. Commerce second. Tiny winged governance always.',
    giftshop:
      'Every artifact is inspected for whimsy, structural integrity, and whether AMI thinks it has main character energy.',
    forum:
      'Forum open. The butterflies are moderating discourse with tiny clipboards and unreasonable confidence.',
    mana: 'Wallet open. The butterflies audit every mana transaction with tiny green visors and zero chill.',
    mermaids:
      'Lagoon open. The butterflies are rowing Silas’s novel out to the tide, guarding the one paragraph of AI like it owes them money.',
  }

  return messages[activeTab.value]
})

onMounted(async () => {
  await refreshManagerData()

  const topupQuery = route.query.manaTopup
  if (topupQuery === 'success' || topupQuery === 'cancelled') {
    manaTopupNotice.value = topupQuery
    setTab('mana')
    const { manaTopup: _drop, ...restQuery } = route.query
    router.replace({ query: restQuery })
    return
  }

  const subscriptionQuery = route.query.subscription
  if (subscriptionQuery === 'success' || subscriptionQuery === 'cancelled') {
    subscriptionNotice.value = subscriptionQuery
    setTab('mana')
    if (subscriptionQuery === 'success') {
      await userStore.validateAndFetchUserData()
    }
    const { subscription: _drop, ...restQuery } = route.query
    router.replace({ query: restQuery })
    return
  }

  if (!isDashboardTabKey(defaultDashboardKey, storedTab.value)) {
    setTab(dashboardConfig.defaultTab)
  }
})

function setTab(tab: string): void {
  const nextTab = isDashboardTabKey(defaultDashboardKey, tab)
    ? tab
    : dashboardConfig.defaultTab

  navStore.setDashboardTab?.(dashboardKey.value, nextTab)
}

async function refreshManagerData(): Promise<void> {
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
