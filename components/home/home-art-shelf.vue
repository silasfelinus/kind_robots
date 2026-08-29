<!-- /components/home/home-art-shelf.vue -->
<!--
  The art shelf, which is two shelves behind one toggle.

  Silas, 2026-08-29: "we are already fighting for space, but the artqueue should
  also be present. let me togle between the fresh from art queue and to see the
  current progress, and choose from active to failed, etc, keeping the layout,
  which otherwise is great."

  So this owns no layout of its own. It renders the SAME home-rail in the same
  two-row cell either way and only swaps what is in it -- finished ArtImages, or
  the live ArtJob queue -- plus two controls that ride in the header row the
  shelf already had. "Keeping the layout" is the constraint, and the way to keep
  it is to not build a second component that looks nearly the same.

  WHO SEES THE QUEUE. /api/art/queue is behind requireMachineUser: a signed-out
  visitor gets a 401, an ordinary user sees their own jobs, an admin sees all of
  them. So the toggle is rendered only for a signed-in user, and a failed fetch
  (revoked session, server down) hides it again and drops the shelf back to
  `fresh`. Nobody is offered a control that can only error for them.

  NOTHING IS FETCHED UNTIL THE TOGGLE IS PRESSED. The home page already makes
  one showcase request and one conductor request on load; the queue is a
  third that most visits will never need, so it is lazy.
-->
<template>
  <home-rail
    :label="mode === 'fresh' ? 'Fresh from the art queue' : queueLabel"
    :icon="mode === 'fresh' ? 'kind-icon:palette-color' : 'kind-icon:server'"
    :items="visibleItems"
    see-all-href="/art"
    shape="wide"
    plate-variant="card"
    placeholder-icon="kind-icon:palette-color"
    :rows="2"
    fit="contain"
    :interactive="mode === 'fresh'"
    @select="emit('select', $event)"
  >
    <template #controls>
      <!--
        Two icons and, in queue mode, one select. All of it inside the header
        row that already existed, so the toggle costs no page height -- which is
        the whole point given "we are already fighting for space".
      -->
      <span
        v-if="queueAvailable"
        class="flex shrink-0 overflow-hidden rounded border border-base-300"
      >
        <button
          v-for="option in MODES"
          :key="option.key"
          type="button"
          class="grid size-5 place-items-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          :class="
            mode === option.key
              ? 'bg-primary text-primary-content'
              : 'text-base-content/45 hover:text-primary'
          "
          :aria-pressed="mode === option.key"
          :title="option.label"
          :aria-label="option.label"
          @click="setMode(option.key)"
        >
          <Icon :name="option.icon" class="size-3" />
        </button>
      </span>

      <select
        v-if="mode === 'queue'"
        v-model="statusFilter"
        class="min-w-0 max-w-24 shrink rounded border border-base-300 bg-base-100 px-1 py-0 text-[0.6rem] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Filter the art queue by job status"
        @change="loadQueue()"
      >
        <option
          v-for="option in STATUS_OPTIONS"
          :key="option.key"
          :value="option.key"
        >
          {{ option.label }}
        </option>
      </select>

      <span
        v-if="mode === 'queue' && queuePending"
        class="loading loading-spinner loading-xs shrink-0 text-primary"
      />
    </template>
  </home-rail>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RailItem, ShowcaseCard } from '@/utils/homeShowcase'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<{ fresh: ShowcaseCard[] }>()
const emit = defineEmits<{ select: [item: RailItem] }>()

type Mode = 'fresh' | 'queue'

const MODES: { key: Mode; label: string; icon: string }[] = [
  { key: 'fresh', label: 'Finished art', icon: 'kind-icon:palette-color' },
  { key: 'queue', label: 'Queue progress', icon: 'kind-icon:server' },
]

/*
 * ACTIVE is the useful default and is not a single ArtJobStatus -- it is
 * PENDING plus RUNNING, "what the pipeline is chewing on right now". The
 * endpoint filters on one status at a time, so ACTIVE fans out into two
 * requests and merges them, rather than fetching every job and filtering in the
 * browser (which would silently drop old active jobs behind a page of DONE).
 */
const STATUS_OPTIONS: { key: string; label: string; fetch: string[] }[] = [
  { key: 'ACTIVE', label: 'Active', fetch: ['PENDING', 'RUNNING'] },
  { key: 'PENDING', label: 'Pending', fetch: ['PENDING'] },
  { key: 'RUNNING', label: 'Running', fetch: ['RUNNING'] },
  { key: 'FAILED', label: 'Failed', fetch: ['FAILED'] },
  { key: 'DONE', label: 'Done', fetch: ['DONE'] },
  { key: 'CANCELLED', label: 'Cancelled', fetch: ['CANCELLED'] },
]

const PAGE_SIZE = 12

type QueueJob = {
  id: number
  status: string
  createdAt: string
  artImageId: number | null
  projectSlug: string | null
  error: string | null
  payload?: { title?: string | null; promptString?: string | null } | null
}

const userStore = useUserStore()

const mode = ref<Mode>('fresh')
const statusFilter = ref('ACTIVE')
const queueJobs = ref<QueueJob[]>([])
const queuePending = ref(false)
/** Cleared by a failed fetch; see the note at the top of this file. */
const queueReachable = ref(true)

const queueAvailable = computed(
  () => userStore.isLoggedIn && queueReachable.value,
)

const queueLabel = computed(() => {
  const option = STATUS_OPTIONS.find(
    (entry) => entry.key === statusFilter.value,
  )
  return `Art queue — ${option?.label ?? statusFilter.value}`
})

/**
 * A job as a rail tile.
 *
 * A DONE job has a real ArtImage, so it gets the canonical file URL and looks
 * exactly like a tile on the finished shelf. Everything else has no picture
 * yet, so `art` is empty and home-rail falls through to the shared default-art
 * pool -- the tile still reads as a tile rather than a hole, and the status chip
 * is what carries the information.
 */
function jobToItem(job: QueueJob): RailItem {
  const label =
    job.payload?.title?.trim() ||
    job.payload?.promptString?.trim() ||
    job.projectSlug ||
    `Job #${job.id}`

  return {
    kind: 'art',
    id: job.artImageId ?? job.id,
    title: label,
    subtitle: job.error?.trim() || null,
    slug: null,
    badge: null,
    createdAt: job.createdAt,
    theme: null,
    art: {
      imagePath: job.artImageId
        ? `/api/art/images/${job.artImageId}/file`
        : null,
      cardPath: null,
      heroPath: null,
      iconPath: null,
      fileType: null,
    },
    // A queued job has no gallery record to open yet, so the tile points at the
    // pipeline control room instead of a /art?art=<id> that would resolve to
    // nothing.
    href: job.artImageId ? `/art?art=${job.artImageId}` : '/artjob',
    conductorSlug: null,
    status: job.status,
  }
}

const visibleItems = computed<RailItem[]>(() =>
  mode.value === 'fresh'
    ? props.fresh.map((card) => ({ ...card }))
    : queueJobs.value.map(jobToItem),
)

async function loadQueue(): Promise<void> {
  const option = STATUS_OPTIONS.find(
    (entry) => entry.key === statusFilter.value,
  )
  if (!option) return

  queuePending.value = true
  try {
    const responses = await Promise.all(
      option.fetch.map((status) =>
        performFetch<{ jobs: QueueJob[] }>(
          `/api/art/queue?status=${status}&pageSize=${PAGE_SIZE}`,
        ),
      ),
    )

    if (responses.some((response) => !response.success)) {
      throw new Error('queue unavailable')
    }

    queueJobs.value = responses
      .flatMap((response) => response.data?.jobs ?? [])
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )
      .slice(0, PAGE_SIZE)

    queueReachable.value = true
  } catch {
    /*
     * A 401 here is the ordinary signed-out case, not a fault worth a banner.
     * Fall back to the finished shelf and keep the toggle hidden, so the only
     * people who ever see the control are the ones it works for.
     */
    queueJobs.value = []
    queueReachable.value = false
    mode.value = 'fresh'
  } finally {
    queuePending.value = false
  }
}

function setMode(next: Mode): void {
  mode.value = next
  if (next === 'queue' && !queueJobs.value.length) void loadQueue()
}
</script>
