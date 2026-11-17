<template>
  <section class="flex h-full min-h-0 w-full flex-col">
    <header-page-bar>
      <span class="inline-flex items-center gap-2 text-sm font-black">
        <Icon name="kind-icon:sparkles" class="size-5" />
        K8 Wildlife
      </span>
      <span
        v-if="k8.snapshot"
        class="rounded-full border border-base-content/20 px-2 py-1 text-xs"
      >
        {{ k8.snapshot.status.isDryRun ? 'DRY RUN' : 'LIVE MONEY' }}
      </span>
    </header-page-bar>

    <div v-if="!allowed" class="grid min-h-0 flex-1 place-items-center p-4">
      <div class="kr-panel max-w-lg p-6 text-center">
        <h2 class="text-xl font-bold">Private wildlife portfolio</h2>
        <p class="mt-2 text-sm opacity-75">
          Sign in as K8 or an administrator to open this project.
        </p>
        <NuxtLink class="btn btn-primary mt-4" to="/login">Sign in</NuxtLink>
      </div>
    </div>

    <div
      v-else
      class="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-neutral text-neutral-content"
    >
      <div class="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Transition name="k8-scene">
          <picture :key="animal.file" class="absolute inset-0 block">
            <source
              media="(max-width: 600px) and (orientation: portrait)"
              :srcset="k8Artwork(k8.level, 'mobile/')"
              type="image/webp"
            />
            <source
              media="(max-width: 1100px)"
              :srcset="k8Artwork(k8.level, 'tablet/')"
              type="image/webp"
            />
            <img
              class="h-full w-full object-cover"
              :src="k8Artwork(k8.level)"
              alt=""
              draggable="false"
            />
          </picture>
        </Transition>
      </div>
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/30"
      />
      <div
        class="pointer-events-none absolute inset-0 opacity-70"
        :class="
          animal.side === 'right'
            ? 'bg-gradient-to-r from-black/75 via-black/10 to-transparent'
            : 'bg-gradient-to-l from-black/75 via-black/10 to-transparent'
        "
      />

      <div
        class="absolute inset-x-4 top-4 z-10 sm:inset-x-6 sm:top-6"
        :class="animal.side === 'left' ? 'text-right' : 'text-left'"
      >
        <div
          class="max-w-md"
          :class="animal.side === 'left' ? 'ml-auto' : ''"
        >
          <p class="text-xs font-black tracking-[0.2em] text-amber-200">
            K8 / YOUR FINANCIAL SPIRIT ANIMAL
          </p>
          <p class="mt-2 text-5xl font-black leading-none sm:text-7xl">
            {{ String(k8.level).padStart(2, '0')
            }}<span class="text-xl opacity-70">/10</span>
          </p>
          <h1 class="mt-1 text-2xl font-black uppercase sm:text-4xl">
            {{ animal.name }}
          </h1>
          <p class="mt-1 text-sm italic text-white/90 sm:text-lg">
            “{{ animal.quote }}”
          </p>
          <p class="mt-3 text-xs font-semibold text-amber-100 sm:text-sm">
            {{
              k8.level === 0
                ? 'Engine stop. Existing holdings and orders remain.'
                : `${k8.preview?.maxDeploymentPercent ?? k8.level * 10}% of the independently authorized fund cap for new buys.`
            }}
          </p>
        </div>
      </div>

      <div
        class="absolute inset-x-2 bottom-2 z-20 rounded-2xl border border-white/20 bg-black/75 p-3 shadow-2xl backdrop-blur-md sm:inset-x-5 sm:bottom-4 sm:p-4"
      >
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span v-if="k8.snapshot" class="font-semibold">
              {{ k8.snapshot.scope.exchange }} /
              {{ k8.snapshot.scope.pair }}
            </span>
            <span v-if="k8.snapshot">
              {{ k8.snapshot.status.isRunning ? 'RUNNING' : 'STOPPED' }}
              · Applied:
              {{
                k8.activeLevel === null
                  ? 'custom / unknown'
                  : K8_ANIMALS[k8.activeLevel]?.name
              }}
            </span>
            <span v-else>Preview only · gateway data unavailable</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="btn btn-ghost btn-xs text-white"
              type="button"
              :disabled="k8.loading"
              @click="k8.refresh(true)"
            >
              <Icon name="kind-icon:refresh-cw" class="size-3" />
              Refresh
            </button>
            <button
              class="btn btn-outline btn-xs border-white/40 text-white"
              type="button"
              :aria-expanded="settingsOpen"
              @click="settingsOpen = !settingsOpen"
            >
              Settings
            </button>
          </div>
        </div>

        <div class="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div class="rounded-lg bg-white/10 p-2">
            <div class="opacity-70">Estimated fund equity</div>
            <strong>{{ k8Money(k8.snapshot?.metrics.fundEquityQuote) }}</strong>
          </div>
          <div class="rounded-lg bg-white/10 p-2">
            <div class="opacity-70">Held {{ k8.snapshot?.metrics.asset || 'asset' }}</div>
            <strong>{{ heldAsset }}</strong>
          </div>
          <div class="hidden rounded-lg bg-white/10 p-2 sm:block">
            <div class="opacity-70">Realized P&amp;L</div>
            <strong>{{ k8Money(k8.snapshot?.metrics.realizedPnlQuote) }}</strong>
          </div>
          <div class="hidden rounded-lg bg-white/10 p-2 sm:block">
            <div class="opacity-70">Authorized fund ceiling</div>
            <strong>{{ k8Money(k8.snapshot?.config.maxUsdcDeployed) }}</strong>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs font-bold">
          <label for="k8-risk-slider">THE K8-O-METER</label>
          <span>
            {{ k8.level === k8.activeLevel ? 'CURRENT' : 'PREVIEW' }}
            · Level {{ k8.level }}
          </span>
        </div>
        <input
          id="k8-risk-slider"
          class="range range-warning my-2 w-full"
          type="range"
          min="0"
          max="10"
          step="1"
          :value="k8.level"
          :aria-valuetext="`Level ${k8.level}: ${animal.name}`"
          @input="selectFromRange"
        />
        <div class="grid grid-cols-11 gap-0.5">
          <button
            v-for="(item, index) in K8_ANIMALS"
            :key="item.file"
            class="rounded-md px-0 py-1 text-xs font-bold transition-colors"
            :class="
              index === k8.level
                ? 'bg-warning text-warning-content'
                : 'bg-white/10 text-white hover:bg-white/25'
            "
            type="button"
            :aria-label="`Level ${index}: ${item.name}`"
            :aria-pressed="index === k8.level"
            @click="selectLevel(index)"
          >
            {{ index }}
          </button>
        </div>
        <p v-if="k8.loading" class="mt-2 text-xs" role="status">
          Reading Critical Mass...
        </p>
        <p v-if="k8.error" class="mt-2 text-xs text-amber-200" role="alert">
          {{ k8.error }}
        </p>
        <p v-if="k8.notice" class="mt-2 text-xs text-amber-200" role="status">
          {{ k8.notice }}
        </p>
        <div class="mt-2 flex items-center justify-between gap-2">
          <span class="text-xs text-white/70">
            {{
              k8.readonly
                ? 'Read-only preview. No trading settings changed.'
                : 'Moving the slider never changes the engine.'
            }}
          </span>
          <button
            class="btn btn-warning btn-sm"
            type="button"
            :disabled="
              k8.readonly ||
              !k8.snapshot ||
              k8.level === k8.activeLevel ||
              k8.saving ||
              k8.loading
            "
            @click="confirmOpen = true"
          >
            Review change
          </button>
        </div>
      </div>

      <aside
        v-if="settingsOpen"
        class="kr-scroll absolute inset-x-2 top-2 bottom-64 z-30 overflow-y-auto rounded-2xl border border-white/25 bg-neutral/95 p-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:top-4 sm:bottom-64 sm:w-[min(440px,90%)]"
        aria-label="Animal risk settings"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-black">{{ animal.name }} settings</h2>
          <button
            class="btn btn-ghost btn-sm"
            type="button"
            aria-label="Close settings"
            @click="settingsOpen = false"
          >
            <Icon name="kind-icon:x" class="size-4" />
          </button>
        </div>
        <p class="mt-2 text-xs text-white/70">
          Profile changes save to Critical Mass. They do not alter trading
          until you separately apply this level.
        </p>
        <div v-if="!k8.snapshot" class="mt-3 text-sm text-warning">
          Connect the private K8 bridge to read or edit settings.
        </div>
        <div v-else-if="k8.level === 0" class="mt-3 text-sm">
          Level 0 stops the engine. It does not sell positions or cancel
          existing orders, and it has no editable profile.
        </div>
        <template v-else>
          <label class="mt-4 block text-sm">
            Maximum deployment (% of fund ceiling)
            <input
              class="input input-bordered mt-1 w-full bg-neutral text-white"
              type="number"
              :min="minimumShare"
              :max="maximumShare"
              step="1"
              :value="k8.profileDraft.maxDeploymentPercent ?? ''"
              :disabled="k8.readonly || k8.saving"
              @input="updateNumber('maxDeploymentPercent', $event)"
            />
          </label>
          <p class="mt-1 text-xs text-white/65">
            {{ k8Money(projectedCap) }} of
            {{ k8Money(k8.snapshot.config.maxUsdcDeployed) }}.
            Neighboring animals constrain this to {{ minimumShare }}–{{ maximumShare }}%.
          </p>
          <button
            class="btn btn-ghost btn-sm mt-3"
            type="button"
            :aria-expanded="deepSettings"
            @click="deepSettings = !deepSettings"
          >
            {{ deepSettings ? 'Hide advanced parameters' : 'Advanced parameters' }}
          </button>
          <div v-if="deepSettings" class="mt-2 grid grid-cols-1 gap-2">
            <label
              v-for="field in deepFields"
              :key="field.key"
              class="block text-xs"
            >
              {{ field.label }}
              <input
                class="input input-bordered input-sm mt-1 w-full bg-neutral text-white"
                type="number"
                step="any"
                :value="k8.profileDraft[field.key] ?? ''"
                :disabled="k8.readonly || k8.saving"
                @input="updateNumber(field.key, $event)"
              />
            </label>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2">
            <button
              class="btn btn-warning btn-sm"
              type="button"
              :disabled="k8.readonly || k8.saving"
              @click="k8.saveProfile()"
            >
              Save profile
            </button>
            <button
              class="btn btn-outline btn-sm"
              type="button"
              :disabled="k8.readonly || k8.saving"
              @click="k8.saveProfile(true)"
            >
              Reset defaults
            </button>
          </div>
          <p class="mt-3 text-xs text-white/65">
            Settings remain subject to Critical Mass validation and the
            operator's capital and drawdown limits.
          </p>
        </template>
        <div class="mt-4 border-t border-white/20 pt-3 text-xs text-white/70">
          <p>Drawdown guard: {{ k8.snapshot?.config.maxDrawdownPercent ?? 'Unknown' }}%</p>
          <p>Resting buy orders: {{ k8.snapshot?.pendingBuyOrders ?? 'Unknown' }}</p>
          <p>{{ k8.snapshot?.metrics.valuationNote }}</p>
        </div>
      </aside>

      <div
        v-if="confirmOpen"
        class="absolute inset-0 z-40 grid place-items-center bg-black/80 p-4"
      >
        <div
          class="max-w-lg rounded-2xl border border-warning/40 bg-neutral p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm trading risk change"
        >
          <h2 class="text-xl font-black">Apply {{ animal.name }}?</h2>
          <p class="mt-3 text-sm">
            {{
              k8.level === 0
                ? 'Stop this fund engine. This does not sell holdings or cancel existing orders.'
                : `Apply level ${k8.level} to ${k8.snapshot?.scope.exchange} / ${k8.snapshot?.scope.pair}.`
            }}
          </p>
          <p class="mt-2 text-sm text-warning">
            {{
              k8.snapshot?.status.isDryRun === false
                ? 'This is LIVE-MONEY mode.'
                : 'This fund reports dry-run mode.'
            }}
            Existing holdings and orders can remain exposed.
            Crypto can lose its full value.
          </p>
          <p class="mt-2 text-xs text-white/70">
            Risk settings are checked again against the latest server snapshot
            before any changes are applied.
          </p>
          <div class="mt-4 flex justify-end gap-2">
            <button
              class="btn btn-ghost"
              type="button"
              :disabled="k8.saving"
              @click="confirmOpen = false"
            >
              Cancel
            </button>
            <button
              class="btn btn-warning"
              type="button"
              :disabled="k8.saving || k8.readonly"
              @click="applyConfirmed"
            >
              {{ k8.saving ? 'Checking...' : 'Confirm level ' + k8.level }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { isSuperkateServicesViewer } from '@/stores/helpers/superkateNavigation'
import { useUserStore } from '@/stores/userStore'
import { useK8WildlifeStore } from '@/stores/k8WildlifeStore'
import {
  K8_ANIMALS,
  K8_PROFILE_FIELDS,
  k8Artwork,
  k8Money,
  k8RiskParams,
  type K8ProfileField,
} from '@/utils/k8Wildlife'

const userStore = useUserStore()
const k8 = useK8WildlifeStore()
const allowed = computed(() =>
  isSuperkateServicesViewer(userStore.user, userStore.isAdmin),
)
const animal = computed(() => K8_ANIMALS[k8.level] ?? K8_ANIMALS[2])
const settingsOpen = ref(false)
const deepSettings = ref(false)
const confirmOpen = ref(false)

const deepLabels: Record<K8ProfileField, string> = {
  kFactor: 'Volatility trigger (ATR multiplier)',
  minIntervalMs: 'Minimum time between entries (ms)',
  maxIntervalMs: 'Maximum entry interval (ms)',
  entryOffsetBps: 'Entry price offset (bps)',
  entryOffsetUpBps: 'Rising market offset (bps)',
  entryOffsetDownBps: 'Falling market offset (bps)',
  orderStaleMs: 'Stale order timeout (ms)',
  cautionScale: 'Caution position multiplier',
  trendScale: 'Trend position multiplier',
  maxCycleBuys: 'Maximum buys per cycle',
  mergeProximityScale: 'Merge proximity multiplier',
  maxDeploymentPercent: 'Maximum deployment',
}
const deepFields = K8_PROFILE_FIELDS.filter(
  (field) => field !== 'maxDeploymentPercent',
).map((key) => ({ key, label: deepLabels[key] }))

const heldAsset = computed(() => {
  const held = k8.snapshot?.metrics.heldAsset
  return typeof held === 'number' && Number.isFinite(held)
    ? `${held.toFixed(6)} ${k8.snapshot?.metrics.asset || ''}`
    : 'Unavailable'
})
const minimumShare = computed(() =>
  k8.level <= 1
    ? 1
    : (k8RiskParams(
        k8.level - 1,
        k8.snapshot?.presets,
        k8.snapshot?.levelOverrides,
      )?.maxDeploymentPercent ?? 1),
)
const maximumShare = computed(() =>
  k8.level >= 10
    ? 100
    : (k8RiskParams(
        k8.level + 1,
        k8.snapshot?.presets,
        k8.snapshot?.levelOverrides,
      )?.maxDeploymentPercent ?? 100),
)
const projectedCap = computed(() => {
  const total = k8.snapshot?.config.maxUsdcDeployed
  const share = k8.profileDraft.maxDeploymentPercent
  return typeof total === 'number' && typeof share === 'number'
    ? (total * share) / 100
    : null
})

function selectLevel(level: number) {
  k8.chooseLevel(level)
  confirmOpen.value = false
}
function selectFromRange(event: Event) {
  selectLevel(Number((event.target as HTMLInputElement).value))
}
function updateNumber(field: K8ProfileField, event: Event) {
  const raw = (event.target as HTMLInputElement).value
  k8.updateField(field, raw.trim() === '' ? NaN : Number(raw))
}
async function applyConfirmed() {
  await k8.applyLevel()
  confirmOpen.value = false
}

watch(
  allowed,
  (value) => {
    if (value) void k8.refresh()
    else k8.clear()
  },
  { immediate: true },
)
onBeforeUnmount(() => k8.clear())
</script>

<style scoped>
.k8-scene-enter-active,
.k8-scene-leave-active {
  transition: opacity 360ms ease, transform 360ms ease;
}
.k8-scene-enter-from {
  opacity: 0;
  transform: scale(1.025);
}
.k8-scene-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .k8-scene-enter-active,
  .k8-scene-leave-active {
    transition: none;
  }
}
</style>
