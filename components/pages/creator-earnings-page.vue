<template>
  <div class="kr-unbound kr-container max-w-3xl p-6 space-y-8">
    <div
      v-if="userStore.isGuest"
      class="rounded-2xl border border-accent/30 bg-(--kr-surface) p-6 text-center space-y-3"
    >
      <p class="text-base-content/80">
        Sign in to see what you've earned from things you've made. ✨
      </p>
      <NuxtLink to="/login" class="btn btn-accent rounded-xl">
        Sign in
      </NuxtLink>
    </div>

    <template v-else>
      <p class="text-sm text-base-content/60">
        What you've earned when someone spent tokens on something you made — a
        Bot, Character, Facet, Scenario, Pitch, Art, Pack, Reward, or Dream.
      </p>

      <div
        class="flex items-start gap-3 rounded-2xl border border-info/30 bg-info/10 p-4 text-sm text-base-content/75"
      >
        <Icon name="kind-icon:info" class="mt-0.5 h-5 w-5 shrink-0 text-info" />
        <p>
          This page is read-only. There's no payout button here because
          <strong
            >the payout threshold and schedule have not been set yet</strong
          >
          — creator payouts are still a design-in-progress
          (kind-economy&nbsp;t-014) and are gated behind Silas's own review
          before they go live (t-015). Nothing below is a balance you can
          withdraw today; it's an honest running total of what you've accrued so
          far.
        </p>
      </div>

      <div
        v-if="earningsStore.loading && !earningsStore.hasLoaded"
        class="text-sm text-base-content/50"
      >
        Loading…
      </div>

      <div
        v-else-if="earningsStore.error"
        class="rounded-2xl border border-error/40 bg-error/5 p-4 text-sm text-error"
      >
        {{ earningsStore.error }}
      </div>

      <template v-else-if="summary">
        <section
          class="rounded-2xl border border-primary/20 bg-base-100 shadow-lg p-6 space-y-3"
        >
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-sm text-base-content/60">Total earned</h2>
              <div class="text-5xl font-extrabold text-primary tabular-nums">
                {{ formatUsdCents(summary.totalCents) }}
              </div>
              <p class="mt-1 text-xs text-base-content/50">
                {{ summary.interactionCount }}
                {{
                  summary.interactionCount === 1
                    ? 'interaction'
                    : 'interactions'
                }}
              </p>
            </div>
            <button
              class="btn btn-ghost btn-sm rounded-xl"
              :disabled="earningsStore.loading"
              @click="earningsStore.fetch()"
            >
              Refresh
            </button>
          </div>

          <p
            v-if="summary.selfAttributedTotalCents > 0"
            class="rounded-xl bg-base-200/70 px-3 py-2 text-xs text-base-content/60"
          >
            Plus
            <strong>{{
              formatUsdCents(summary.selfAttributedTotalCents)
            }}</strong>
            from
            {{ summary.selfAttributedCount }}
            self-generated
            {{
              summary.selfAttributedCount === 1 ? 'interaction' : 'interactions'
            }}
            (you spending on your own creations) —
            <strong>not included in the total above</strong>. Whether
            self-generated earnings count toward a payout is still an open
            policy question (kind-economy&nbsp;t-021); every one of those
            interactions is still listed below, just labeled.
          </p>
        </section>

        <section
          v-if="isEmpty"
          class="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center"
        >
          <Icon name="kind-icon:coin" class="h-10 w-10 text-base-content/30" />
          <p class="text-base font-bold text-base-content">
            Nothing accrued yet.
          </p>
          <p class="max-w-sm text-sm text-base-content/55">
            Nobody has spent tokens on anything you've made yet. Once they do,
            your share shows up here — nothing to fix, nothing hidden.
          </p>
        </section>

        <template v-else>
          <section class="space-y-3">
            <h2
              class="text-sm font-black uppercase tracking-widest text-base-content/50"
            >
              By what you made
            </h2>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <article
                v-for="group in summary.byObject"
                :key="group.key"
                class="kr-panel-flat space-y-2 p-4"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-black text-base-content">
                      {{ group.title }}
                    </p>
                    <p class="text-xs text-base-content/50">
                      {{ sourceTypeLabel(group.sourceType) }}
                    </p>
                  </div>
                  <span class="badge badge-outline shrink-0">
                    {{ group.count }}
                    {{ group.count === 1 ? 'interaction' : 'interactions' }}
                  </span>
                </div>

                <p class="text-xl font-black text-primary tabular-nums">
                  {{ formatUsdCents(group.totalCents) }}
                </p>
                <p
                  v-if="group.selfAttributedCents > 0"
                  class="text-xs text-base-content/50"
                >
                  +
                  {{ formatUsdCents(group.selfAttributedCents) }} self-generated
                  (not counted above)
                </p>

                <details class="text-xs">
                  <summary
                    class="cursor-pointer font-bold text-base-content/60"
                  >
                    Show interactions
                  </summary>
                  <ul class="mt-2 divide-y divide-base-content/10">
                    <li
                      v-for="interaction in group.rows"
                      :key="interaction.id"
                      class="flex items-center justify-between gap-2 py-1.5"
                    >
                      <span class="flex min-w-0 items-center gap-1.5">
                        <span class="text-base-content/55">
                          {{ formatWhen(interaction.createdAt) }}
                        </span>
                        <span
                          v-if="interaction.isSelfAttribution"
                          class="badge badge-ghost badge-xs"
                        >
                          Self-generated
                        </span>
                      </span>
                      <span
                        class="font-bold tabular-nums"
                        :class="
                          interaction.isSelfAttribution
                            ? 'text-base-content/50'
                            : 'text-success'
                        "
                      >
                        {{ formatUsdCents(interaction.creatorShareCents) }}
                      </span>
                    </li>
                  </ul>
                </details>
              </article>
            </div>
          </section>

          <section class="space-y-3">
            <h2
              class="text-sm font-black uppercase tracking-widest text-base-content/50"
            >
              By period
            </h2>
            <ul
              class="divide-y divide-base-content/10 overflow-x-auto rounded-xl border border-base-content/10"
            >
              <li
                v-for="bucket in summary.byPeriod"
                :key="bucket.key"
                class="flex items-center justify-between gap-3 whitespace-nowrap bg-base-100 px-4 py-3"
              >
                <span class="text-sm">
                  {{ periodLabel(bucket) }}
                </span>
                <span class="flex items-center gap-3">
                  <span
                    v-if="bucket.selfAttributedCents > 0"
                    class="text-xs text-base-content/45"
                  >
                    +
                    {{ formatUsdCents(bucket.selfAttributedCents) }}
                    self-generated
                  </span>
                  <span class="font-bold tabular-nums text-success">
                    {{ formatUsdCents(bucket.totalCents) }}
                  </span>
                </span>
              </li>
            </ul>
          </section>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCreatorEarningsStore } from '@/stores/creatorEarningsStore'
import { useUserStore } from '@/stores/userStore'
import { formatUsdCents } from '@/utils/formatCurrency'
import type { CreatorEarningsPeriodBucket } from '@/stores/creatorEarningsStore'

const earningsStore = useCreatorEarningsStore()
const userStore = useUserStore()

const summary = computed(() => earningsStore.summary)

const isEmpty = computed(
  () =>
    !!summary.value &&
    summary.value.totalCents === 0 &&
    summary.value.selfAttributedTotalCents === 0 &&
    summary.value.byObject.length === 0,
)

const SOURCE_TYPE_LABELS: Record<string, string> = {
  BOT: 'Bot',
  CHARACTER: 'Character',
  FACET: 'Facet',
  SCENARIO: 'Scenario',
  PITCH: 'Pitch',
  ART: 'Art',
  PACK: 'Pack',
  REWARD: 'Reward',
  DREAM: 'Dream',
}

function sourceTypeLabel(sourceType: string | null): string {
  if (!sourceType) return 'Unknown source'
  return SOURCE_TYPE_LABELS[sourceType] ?? sourceType
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function periodLabel(bucket: CreatorEarningsPeriodBucket): string {
  if (bucket.granularity === 'day') {
    return new Date(`${bucket.key}T00:00:00Z`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }
  return new Date(`${bucket.key}-01T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

onMounted(() => {
  earningsStore.fetch()
})
</script>
