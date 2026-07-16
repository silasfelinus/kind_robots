<!-- /components/art/stylist-relay-status.vue -->
<!--
  Admin-only diagnostics for the Superkate home-relay poll loop. Incident
  (2026-07-10): a relay running an old build didn't declare
  `supportsInputImages: true` in its /api/art/queue/claim poll, so the
  server-side capability gate silently skipped image-bearing jobs (they sat
  PENDING forever) with no signal reachable from the browser — only
  pm2/server access showed it. This panel reads
  GET /api/art/queue/relay-status (backed by the in-memory
  server/utils/relayAgentRegistry.ts) so that class of stall is diagnosable
  from the UI: per relay agentId, last claim-attempt time, declared
  capabilities, and agent version.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="!userStore.isAdmin"
      class="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center text-warning"
    >
      Relay diagnostics are admin-only.
    </div>

    <div
      v-else
      class="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Relay Diagnostics</h2>
          <p class="text-xs text-base-content/60">
            Home-relay poll telemetry from /api/art/queue/claim — resets on
            server restart.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-2xl"
          :disabled="loading"
          @click="refresh"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          Refresh
        </button>
      </div>

      <div
        v-if="error"
        class="rounded-2xl border border-error/40 bg-error/10 p-2 text-xs text-error"
      >
        {{ error }}
      </div>

      <div
        v-if="!loading && !error && !agents.length"
        class="rounded-2xl border border-dashed border-base-300 p-8 text-center text-xs text-base-content/50"
      >
        No relay has polled since the server last restarted.
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        <article
          v-for="agent in agents"
          :key="agent.agentId"
          class="flex flex-col gap-2 rounded-2xl border p-3"
          :class="
            agent.supportsInputImages
              ? 'border-base-300 bg-base-100'
              : 'border-warning/50 bg-warning/10'
          "
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-mono text-sm font-semibold">
              {{ agent.agentId }}
            </span>
            <span
              class="badge badge-sm rounded-2xl"
              :class="staleness(agent.lastSeenAt).badgeClass"
            >
              {{ staleness(agent.lastSeenAt).label }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <span
              class="badge badge-xs rounded-2xl"
              :class="
                agent.supportsInputImages ? 'badge-success' : 'badge-error'
              "
              :title="
                agent.supportsInputImages
                  ? 'This relay claims image-bearing jobs.'
                  : 'This relay does NOT declare supportsInputImages — image-bearing jobs stay PENDING and are silently skipped for it.'
              "
            >
              {{
                agent.supportsInputImages
                  ? 'supports input images'
                  : 'no input-image support'
              }}
            </span>
            <span
              v-for="engine in agent.engines"
              :key="engine"
              class="badge badge-outline badge-xs rounded-2xl"
            >
              {{ engine }}
            </span>
            <span
              v-if="!agent.engines.length"
              class="badge badge-ghost badge-xs rounded-2xl"
            >
              no engines declared
            </span>
          </div>

          <div class="text-[11px] text-base-content/60">
            version {{ agent.agentVersion || 'unknown' }} · last claim attempt
            {{ formatAge(agent.lastSeenAt) }} ago
          </div>

          <p
            v-if="!agent.supportsInputImages"
            class="rounded-xl border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning"
          >
            Silent-stall risk: image-bearing ArtJobs (e.g. Hair Studio kontext
            jobs) will never be claimed by this relay. If this agent is your
            only relay, those jobs will sit PENDING forever — update the relay
            build so it declares <code>supportsInputImages: true</code>.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { RelayAgentStatus } from '@/server/utils/relayAgentRegistry'

const userStore = useUserStore()

const agents = ref<RelayAgentStatus[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Poll telemetry is short-lived (in-memory, resets on server restart), so a
// relay that hasn't been heard from in a while is worth calling out even
// though the server keeps no record of "how long is too long" per relay —
// that judgment belongs in the UI, not the registry.
const STALE_AFTER_SECONDS = 5 * 60

function staleness(lastSeenAt: string | Date): {
  label: string
  badgeClass: string
} {
  const ageSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 1000),
  )
  if (ageSeconds > STALE_AFTER_SECONDS) {
    return { label: 'not polling', badgeClass: 'badge-error' }
  }
  return { label: 'polling', badgeClass: 'badge-success' }
}

function formatAge(value: string | Date): string {
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  )
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

async function refresh(): Promise<void> {
  if (!userStore.isAdmin) return
  loading.value = true
  error.value = null
  try {
    const res = await performFetch<{ agents: RelayAgentStatus[] }>(
      '/api/art/queue/relay-status',
    )
    if (res.success && res.data) {
      agents.value = res.data.agents
    } else if (!res.success) {
      error.value = res.message || 'Failed to load relay status.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>
