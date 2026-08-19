<template>
  <div class="kr-unbound kr-container max-w-3xl p-6 space-y-8">
    <div
      v-if="!userStore.isAdmin"
      class="rounded-2xl border border-accent/30 bg-(--kr-surface) p-6 text-center space-y-3"
    >
      <p class="text-base-content/80">
        This is Silas's operational record for mission-share accrual and
        remittance. Admins only.
      </p>
    </div>

    <template v-else>
      <p class="text-sm text-base-content/60">
        How much mission share has accrued from the RevenueSplit ledger, how
        much of it has actually been remitted, and the outstanding balance still
        owed to the fundraiser.
      </p>

      <div
        class="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-base-content/75"
      >
        <Icon
          name="kind-icon:alert-triangle"
          class="mt-0.5 h-5 w-5 shrink-0 text-warning"
        />
        <p>
          The
          <strong>{{ formatUsdCents(externalDonationCents) }}</strong>
          already raised directly at
          <a
            :href="externalDonationUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="link link-hover font-bold"
            >{{ externalDonationUrl }}</a
          >
          (approximate, as of {{ externalDonationAsOf }}) is
          <strong>separate</strong>
          from everything below. Those dollars never touched this platform's
          books and are <strong>not included</strong> in the accrued, remitted,
          or outstanding figures on this page.
        </p>
      </div>

      <div
        v-if="store.loading && !store.hasLoaded"
        class="text-sm text-base-content/50"
      >
        Loading…
      </div>

      <div
        v-else-if="store.error"
        class="rounded-2xl border border-error/40 bg-error/5 p-4 text-sm text-error"
      >
        {{ store.error }}
      </div>

      <template v-else-if="data">
        <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article
            class="rounded-2xl border border-primary/20 bg-base-100 shadow-lg p-5 space-y-1"
          >
            <h2 class="text-xs uppercase tracking-wide text-base-content/50">
              Accrued
            </h2>
            <div class="text-3xl font-extrabold text-primary tabular-nums">
              {{ formatUsdCents(data.accrual.totalCents) }}
            </div>
            <p class="text-xs text-base-content/50">
              {{ data.accrual.count }}
              {{ data.accrual.count === 1 ? 'spend' : 'spends' }} on record
            </p>
          </article>

          <article
            class="rounded-2xl border border-success/20 bg-base-100 shadow-lg p-5 space-y-1"
          >
            <h2 class="text-xs uppercase tracking-wide text-base-content/50">
              Remitted
            </h2>
            <div class="text-3xl font-extrabold text-success tabular-nums">
              {{ formatUsdCents(data.remittedTotalCents) }}
            </div>
            <p class="text-xs text-base-content/50">
              {{ data.remittances.length }}
              {{ data.remittances.length === 1 ? 'entry' : 'entries' }} logged
            </p>
          </article>

          <article
            class="rounded-2xl border border-accent/20 bg-base-100 shadow-lg p-5 space-y-1"
          >
            <h2 class="text-xs uppercase tracking-wide text-base-content/50">
              Outstanding
            </h2>
            <div
              class="text-3xl font-extrabold tabular-nums"
              :class="
                data.outstandingCents > 0 ? 'text-accent' : 'text-base-content'
              "
            >
              {{ formatUsdCents(data.outstandingCents) }}
            </div>
            <p class="text-xs text-base-content/50">accrued minus remitted</p>
          </article>
        </section>

        <section
          class="rounded-2xl border p-4 text-sm"
          :class="reconciliationBannerClass"
        >
          <p class="font-bold">{{ reconciliationHeadline }}</p>
          <p class="mt-1 text-xs opacity-80">{{ reconciliationDetail }}</p>
        </section>

        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2
              class="text-sm font-black uppercase tracking-widest text-base-content/50"
            >
              Log a remittance
            </h2>
            <button
              class="btn btn-ghost btn-sm rounded-xl"
              :disabled="store.loading"
              @click="store.fetch()"
            >
              Refresh
            </button>
          </div>

          <form
            class="kr-panel-flat grid grid-cols-1 gap-3 p-4 sm:grid-cols-4"
            @submit.prevent="submit"
          >
            <label class="form-control sm:col-span-1">
              <span class="label-text text-xs">Amount (USD)</span>
              <input
                v-model="form.amountUsd"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="25.00"
                class="input input-bordered input-sm rounded-xl bg-base-200"
              />
            </label>
            <label class="form-control sm:col-span-2">
              <span class="label-text text-xs">Note</span>
              <input
                v-model="form.note"
                type="text"
                required
                placeholder="Against Malaria Foundation direct donation, receipt #..."
                class="input input-bordered input-sm rounded-xl bg-base-200"
              />
            </label>
            <label class="form-control sm:col-span-1">
              <span class="label-text text-xs">Reference (optional)</span>
              <input
                v-model="form.reference"
                type="text"
                placeholder="RCPT-123"
                class="input input-bordered input-sm rounded-xl bg-base-200"
              />
            </label>
            <div class="sm:col-span-4 flex items-center gap-3">
              <button
                type="submit"
                class="btn btn-primary btn-sm rounded-xl"
                :disabled="store.submitting"
              >
                {{ store.submitting ? 'Logging…' : 'Log remittance' }}
              </button>
              <p v-if="store.submitError" class="text-xs text-error">
                {{ store.submitError }}
              </p>
            </div>
          </form>
        </section>

        <section
          v-if="!data.remittances.length"
          class="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center"
        >
          <p class="text-sm text-base-content/55">No remittances logged yet.</p>
        </section>

        <section v-else class="space-y-3">
          <h2
            class="text-sm font-black uppercase tracking-widest text-base-content/50"
          >
            Remittance log
          </h2>
          <ul
            class="divide-y divide-base-content/10 overflow-x-auto rounded-xl border border-base-content/10"
          >
            <li
              v-for="entry in data.remittances"
              :key="entry.id"
              class="flex items-start justify-between gap-3 whitespace-nowrap bg-base-100 px-4 py-3"
            >
              <div class="min-w-0 space-y-0.5 whitespace-normal">
                <p class="text-sm font-medium">{{ entry.note }}</p>
                <p class="text-xs text-base-content/50">
                  {{ formatWhen(entry.createdAt) }}
                  · logged by
                  {{ entry.remittedByUsername ?? `user#${entry.remittedById}` }}
                  <span v-if="entry.reference">
                    · ref {{ entry.reference }}</span
                  >
                </p>
              </div>
              <span class="shrink-0 font-bold tabular-nums text-success">
                {{ formatUsdCents(entry.amountCents) }}
              </span>
            </li>
          </ul>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import {
  useMissionAccrualStore,
  EXTERNAL_DIRECT_DONATION_CENTS,
  EXTERNAL_DIRECT_DONATION_AS_OF,
  EXTERNAL_DIRECT_DONATION_URL,
} from '@/stores/missionAccrualStore'
import { useUserStore } from '@/stores/userStore'
import { formatUsdCents } from '@/utils/formatCurrency'

const store = useMissionAccrualStore()
const userStore = useUserStore()

const data = computed(() => store.data)
const externalDonationCents = EXTERNAL_DIRECT_DONATION_CENTS
const externalDonationAsOf = EXTERNAL_DIRECT_DONATION_AS_OF
const externalDonationUrl = EXTERNAL_DIRECT_DONATION_URL

// Reconciliation banner -- kind-economy/t-016. Mirrors
// server/utils/missionAccrual.ts's checkMissionRemittanceReconciliation:
// reconciled (outstanding == 0), under-remitted (promise broken, still
// owed), or over-remitted (likely a duplicate/double remittance).
const reconciliation = computed(() => data.value?.reconciliation ?? null)

const reconciliationBannerClass = computed(() => {
  switch (reconciliation.value?.status) {
    case 'under-remitted':
      return 'border-warning/40 bg-warning/10 text-base-content/85'
    case 'over-remitted':
      return 'border-error/40 bg-error/10 text-base-content/85'
    default:
      return 'border-success/30 bg-success/10 text-base-content/85'
  }
})

const reconciliationHeadline = computed(() => {
  const r = reconciliation.value
  if (!r || r.status === 'reconciled') {
    return '✅ Reconciled — outstanding is $0.00.'
  }
  if (r.status === 'under-remitted') {
    return `⚠️ Under-remitted by ${formatUsdCents(r.shortfallCents)}.`
  }
  return `⚠️ Over-remitted by ${formatUsdCents(r.overageCents)}.`
})

const reconciliationDetail = computed(() => {
  const r = reconciliation.value
  if (!r || r.status === 'reconciled') {
    return 'The last logged remittance covered exactly what had accrued at the time. Nothing owed right now.'
  }
  if (r.status === 'under-remitted') {
    return 'The mission share promised to the fundraiser has not fully gone out yet. Send the outstanding amount and log it to bring this back to zero.'
  }
  return 'More has been logged as remitted than has accrued. Check for a duplicate remittance entry (same donation logged twice) or a typo’d amount before assuming this is correct.'
})

const form = reactive({
  amountUsd: '',
  note: '',
  reference: '',
})

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function submit() {
  const usd = Number(form.amountUsd)
  if (!Number.isFinite(usd) || usd <= 0) return

  const ok = await store.logRemittance({
    amountCents: Math.round(usd * 100),
    note: form.note,
    reference: form.reference || undefined,
  })

  if (ok) {
    form.amountUsd = ''
    form.note = ''
    form.reference = ''
  }
}

onMounted(() => {
  if (userStore.isAdmin) store.fetch()
})
</script>
