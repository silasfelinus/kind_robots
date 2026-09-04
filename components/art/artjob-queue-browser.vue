<!-- /components/art/artjob-queue-browser.vue -->
<template>
  <section class="kr-surface gap-0">
    <div
      v-if="!userStore.isAdmin"
      class="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center text-warning"
    >
      The ArtJob dashboard is admin-only.
    </div>

    <div v-else class="flex h-full kr-scroll flex-col gap-3 p-3">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">ArtJob Pipeline</h2>
          <p class="text-xs text-base-content/60">
            Paginated queue, editable generation briefs, render health, and
            recovery tools.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model.number="selectedWindow"
            class="select select-bordered select-sm rounded-2xl"
            @change="onWindowChange"
          >
            <option :value="6">6h metrics</option>
            <option :value="24">24h metrics</option>
            <option :value="72">3d metrics</option>
            <option :value="168">7d metrics</option>
          </select>
          <button
            type="button"
            class="btn btn-secondary btn-sm rounded-2xl"
            title="Watch finished renders full screen, newest first"
            @click="slideshowOpen = true"
          >
            Slideshow
          </button>
          <button
            type="button"
            class="kr-btn-primary rounded-2xl"
            :disabled="isLoading"
            @click="refresh"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            Refresh
          </button>
        </div>
      </header>

      <div
        v-if="artJobStore.error"
        class="kr-note kr-note-error p-3 font-normal"
      >
        {{ artJobStore.error }}
      </div>

      <div
        v-if="stats?.oldestPending"
        class="kr-note kr-note-warning p-3 text-xs text-warning-content font-normal"
      >
        Oldest pending job #{{ stats.oldestPending.id }} has waited
        {{ formatAge(stats.oldestPending.ageSeconds) }}.
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="status in summaryStatuses"
          :key="status"
          class="kr-panel-flat p-3"
        >
          <div
            class="text-[11px] font-semibold uppercase tracking-wide text-base-content/50"
          >
            {{ status }}
          </div>
          <div class="mt-1 text-2xl font-black">{{ statusCount(status) }}</div>
        </div>
      </div>

      <div class="grid gap-3 xl:grid-cols-2">
        <div class="kr-panel-flat p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Private art servers</h3>
            <button
              type="button"
              class="btn btn-xs rounded-2xl"
              :class="
                artJobStore.queuePaused
                  ? 'btn-success'
                  : 'btn-warning btn-outline'
              "
              :disabled="artJobStore.togglingQueuePause"
              @click="artJobStore.setQueuePaused(!artJobStore.queuePaused)"
            >
              {{ artJobStore.queuePaused ? 'Resume queue' : 'Pause queue' }}
            </button>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="server in privateArtServers"
              :key="server.id"
              class="rounded-xl border border-base-200 p-2"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2">
                  <span
                    class="h-2.5 w-2.5 shrink-0 rounded-full"
                    :class="serverStatusDotClass(server.lastStatus)"
                    :title="server.lastStatus"
                  />
                  <span class="truncate text-sm font-semibold">
                    {{ server.label || server.title }}
                  </span>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-xl px-2"
                    :disabled="refreshingServerIds.includes(server.id)"
                    title="Re-check this server now"
                    @click="refreshServer(server.id)"
                  >
                    <span
                      v-if="refreshingServerIds.includes(server.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    <span v-else>Refresh</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-xl px-2 text-error"
                    :disabled="removingServerIds.includes(server.id)"
                    title="Remove this server"
                    @click="removeServer(server)"
                  >
                    <span
                      v-if="removingServerIds.includes(server.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    <span v-else>Remove</span>
                  </button>
                </div>
              </div>
              <div class="mt-1 text-[11px] text-base-content/60">
                {{ server.serverType }} · {{ server.lastStatus }}
              </div>
            </div>
            <p
              v-if="!privateArtServers.length"
              class="text-xs text-base-content/50"
            >
              No private art servers registered.
            </p>
          </div>
        </div>

        <div class="kr-panel-flat p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Uptime · {{ windowHours }}h</h3>
            <div
              class="flex items-center gap-3 text-[10px] text-base-content/50"
            >
              <span class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-sm bg-success" /> up
              </span>
              <span class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-sm bg-error" /> down
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <div
              v-for="server in uptime"
              :key="server.serverId"
              class="rounded-xl bg-base-200/50 p-2"
            >
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="truncate font-semibold">{{ server.title }}</span>
                <span :class="uptimeClass(server.uptimePct)">
                  {{
                    server.uptimePct === null
                      ? 'no data'
                      : `${server.uptimePct}%`
                  }}
                  <span
                    v-if="server.avgLatencyMs !== null"
                    class="text-base-content/50"
                  >
                    · {{ server.avgLatencyMs }}ms
                  </span>
                </span>
              </div>
              <div
                v-if="server.samples.length"
                class="mt-2 flex h-8 items-stretch gap-px overflow-hidden rounded"
              >
                <span
                  v-for="(sample, index) in server.samples"
                  :key="index"
                  class="min-w-0 flex-1 rounded-sm"
                  :class="sample.ok ? 'bg-success' : 'bg-error'"
                  :title="sampleTooltip(sample)"
                />
              </div>
              <p v-else class="mt-2 text-[11px] text-base-content/40">
                No samples in this window.
              </p>
            </div>
            <p v-if="!uptime.length" class="text-xs text-base-content/50">
              No uptime samples yet.
            </p>
          </div>
        </div>
      </div>

      <section class="kr-panel-flat p-3">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">