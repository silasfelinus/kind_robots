<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
      <header
        class="kr-toolbar flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-primary">
            AMI social pipeline administration
          </p>
          <p class="mt-1 text-2xl font-black">Social post review queue</p>
          <p class="mt-1 max-w-2xl text-sm text-base-content/60">
            Draft-only. AMI, our labelled-AI fundraiser character, proposes
            posts from the daily dream/digest cycle. Nothing here posts anywhere
            -- approving a draft only marks it reviewed. Every draft carries a
            disclosure label; that is never optional.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          :disabled="loading"
          @click="draftsStore.populate()"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          Scan daily dreams for new drafts
        </button>
      </header>

      <div v-if="!ready" class="grid min-h-52 place-items-center kr-panel">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="rounded-2xl border border-error/40 bg-error/10 p-8 text-center"
      >
        <p class="text-xl font-black">Administrator access required</p>
        <p class="mt-2 text-sm text-base-content/60">
          The social post review queue is restricted to administrators.
        </p>
      </div>

      <template v-else>
        <!-- Volume ceiling indicator -->
        <section class="kr-panel flex flex-wrap gap-4 p-4">
          <div
            v-for="row in draftsStore.ceilingStatus"
            :key="row.platform"
            class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-2"
          >
            <span class="badge badge-outline">{{ row.platform }}</span>
            <span class="text-sm font-black">
              {{ row.approvedToday }}/{{ row.ceiling }}
            </span>
            <span class="text-xs text-base-content/50">approved today</span>
            <span
              v-if="row.approvedToday >= row.ceiling"
              class="badge badge-warning badge-sm"
            >
              ceiling reached
            </span>
          </div>
          <p
            v-if="!draftsStore.ceilingStatus.length"
            class="text-sm text-base-content/50"
          >
            No ceiling data yet -- scan for drafts to load it.
          </p>
        </section>

        <!-- Filters -->
        <section class="flex flex-wrap items-center gap-3">
          <label class="form-control gap-1">
            <span class="text-xs font-bold text-base-content/60">Status</span>
            <select
              v-model="draftsStore.statusFilter"
              class="select select-bordered select-sm rounded-xl"
              @change="draftsStore.fetchDrafts()"
            >
              <option value="DRAFT">Pending review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="">All</option>
            </select>
          </label>
          <label class="form-control gap-1">
            <span class="text-xs font-bold text-base-content/60">Platform</span>
            <select
              v-model="draftsStore.platformFilter"
              class="select select-bordered select-sm rounded-xl"
              @change="draftsStore.fetchDrafts()"
            >
              <option value="">All</option>
              <option value="BLUESKY">Bluesky</option>
              <option value="INSTAGRAM">Instagram</option>
            </select>
          </label>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            :disabled="loading"
            @click="draftsStore.fetchDrafts()"
          >
            <span v-if="loading" class="loading loading-spinner loading-xs" />
            Refresh
          </button>
          <span class="text-xs text-base-content/50">
            {{ draftsStore.drafts.length }} draft(s) shown
          </span>
        </section>

        <p
          v-if="draftsStore.error"
          class="rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error"
        >
          {{ draftsStore.error }}
        </p>

        <!-- Draft cards -->
        <section class="grid gap-4 md:grid-cols-2">
          <article
            v-for="draft in draftsStore.drafts"
            :key="draft.id"
            class="kr-panel flex flex-col gap-3 p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="badge badge-outline">{{ draft.platform }}</span>
                <span
                  class="badge"
                  :class="{
                    'badge-warning': draft.status === 'DRAFT',
                    'badge-success': draft.status === 'APPROVED',
                    'badge-ghost': draft.status === 'REJECTED',
                  }"
                >
                  {{ draft.status }}
                </span>
              </div>
              <span class="text-xs text-base-content/40">#{{ draft.id }}</span>
            </div>

            <img
              v-if="draft.mediaUrl"
              :src="draft.mediaUrl"
              alt="Linked art for this draft"
              class="aspect-video w-full rounded-xl object-cover"
            />

            <p class="whitespace-pre-line text-sm">{{ draft.bodyText }}</p>

            <div
              class="rounded-xl border border-primary/30 bg-primary/5 p-2 text-xs font-bold text-primary"
            >
              Disclosure: {{ draft.disclosureLabel }}
            </div>

            <p class="text-xs text-base-content/50">
              Source: DREAM #{{ draft.sourceId }} &middot; queued
              {{ formatDate(draft.createdAt) }}
              <template v-if="draft.reviewedAt">
                &middot; reviewed {{ formatDate(draft.reviewedAt) }}
              </template>
            </p>

            <div v-if="draft.status === 'DRAFT'" class="flex gap-2">
              <button
                type="button"
                class="btn btn-success btn-sm flex-1 rounded-xl"
                @click="draftsStore.approve(draft.id)"
              >
                Approve
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm flex-1 rounded-xl"
                @click="draftsStore.reject(draft.id)"
              >
                Reject
              </button>
            </div>
          </article>

          <p
            v-if="!draftsStore.drafts.length"
            class="col-span-full rounded-xl border border-dashed border-base-300 p-6 text-center text-sm text-base-content/50"
          >
            No drafts match this filter. Try "Scan daily dreams for new drafts."
          </p>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useSocialDraftsStore } from '@/stores/socialDraftsStore'

const userStore = useUserStore()
const draftsStore = useSocialDraftsStore()
const ready = ref(false)
const loading = computed(() => draftsStore.loading)

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) await draftsStore.fetchDrafts()
  ready.value = true
})

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}
</script>
