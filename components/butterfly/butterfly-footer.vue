<!-- /components/navigation/footer/butterfly-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0 items-center">
      <div
        class="flex h-full w-full min-h-0 items-center gap-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100 px-2 py-2 sm:px-3"
      >
        <button
          type="button"
          class="btn btn-sm btn-secondary shrink-0"
          title="Remove butterfly"
          :disabled="butterflyCount <= 0"
          @click="removeButterfly"
        >
          <icon name="kind-icon:minus" class="h-4 w-4" />
        </button>

        <button
          type="button"
          class="btn btn-sm btn-primary shrink-0"
          title="Add butterfly"
          @click="addButterfly"
        >
          <icon name="kind-icon:plus" class="h-4 w-4" />
        </button>

        <div
          class="hidden min-w-0 shrink overflow-hidden text-sm font-semibold md:block"
        >
          <span class="truncate">Butterfly Swarm</span>
        </div>

        <div
          class="flex shrink-0 items-center rounded-2xl border border-base-300 bg-base-200 px-2 py-1 text-sm font-semibold"
        >
          🦋 {{ butterflyCount }}
        </div>

        <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            class="btn btn-xs btn-outline sm:btn-sm"
            title="Add 5 butterflies"
            @click="addBurst(5)"
          >
            +5
          </button>

          <button
            type="button"
            class="btn btn-xs btn-outline sm:btn-sm"
            title="Add 10 butterflies"
            @click="addBurst(10)"
          >
            +10
          </button>

          <button
            type="button"
            class="btn btn-xs btn-outline sm:btn-sm"
            title="Add 20 butterflies"
            @click="addBurst(20)"
          >
            +20
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="isOpen"
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,22rem)]"
    >
      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold">
              🦋 Butterfly Footer
            </h2>
            <div class="text-xs text-base-content/70">
              Tweak the swarm without leaving the footer.
            </div>
          </div>

          <div class="badge badge-outline">{{ butterflyCount }} active</div>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-[auto_auto_auto]">
              <button
                type="button"
                class="btn btn-primary"
                @click="addButterfly"
              >
                <icon name="kind-icon:plus" class="h-4 w-4" />
                Add
              </button>

              <button
                type="button"
                class="btn btn-secondary"
                :disabled="butterflyCount <= 0"
                @click="removeButterfly"
              >
                <icon name="kind-icon:minus" class="h-4 w-4" />
                Remove
              </button>

              <button
                type="button"
                class="btn btn-outline"
                :disabled="butterflyCount <= 0"
                @click="clearButterflies"
              >
                Clear
              </button>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button class="btn btn-sm btn-outline" @click="addBurst(5)">
                +5
              </button>
              <button class="btn btn-sm btn-outline" @click="addBurst(10)">
                +10
              </button>
              <button class="btn btn-sm btn-outline" @click="addBurst(20)">
                +20
              </button>
            </div>

            <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <div
                  class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
                >
                  Active Count
                </div>
                <div class="mt-1 text-lg font-semibold">
                  🦋 {{ butterflyCount }}
                </div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <div
                  class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
                >
                  Quick Status
                </div>
                <div class="mt-1 text-sm font-semibold">
                  {{ butterflySummary }}
                </div>
              </div>
            </div>

            <div
              class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="text-sm text-base-content/80">
                Flutter with purpose. Help Ami fight malaria.
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <NuxtLink to="/sponsor" class="btn btn-accent btn-sm">
                  <icon name="kind-icon:butterfly" class="h-4 w-4" />
                  Sponsor Butterflies
                </NuxtLink>

                <butterfly-trigger />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Swarm Controls
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <label
              class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <span class="text-sm font-medium">Show active butterflies</span>
              <input v-model="showSwarm" type="checkbox" class="toggle" />
            </label>

            <label
              class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <span class="text-sm font-medium">Show butterfly names</span>
              <input v-model="showNames" type="checkbox" class="toggle" />
            </label>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
            >
              The butterfly layer stays mounted as a launchpad. This toggle only
              controls whether active butterflies are visible.
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
              >
                Surprise
              </div>

              <butterfly-trigger />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,24rem)]"
    >
      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold">
              🦋 Butterfly Footer
            </h2>
            <div class="text-xs text-base-content/70">
              Full-size swarm controls for proper butterfly mischief.
            </div>
          </div>

          <div class="badge badge-primary badge-outline">priority mode</div>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <div
              class="min-h-72 shrink-0 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <butterfly-demo
                class="h-full w-full overflow-hidden rounded-2xl"
              />
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div class="text-sm font-semibold">Population</div>
                <div class="text-sm text-base-content/70">
                  {{ butterflyCount }} active
                </div>
              </div>

              <div class="mb-4 flex flex-wrap items-center gap-3">
                <button class="btn btn-primary" @click="addButterfly">
                  <icon name="kind-icon:plus" class="h-4 w-4" />
                  Add butterfly
                </button>

                <button
                  class="btn btn-secondary"
                  :disabled="butterflyCount <= 0"
                  @click="removeButterfly"
                >
                  <icon name="kind-icon:minus" class="h-4 w-4" />
                  Remove butterfly
                </button>

                <button
                  class="btn btn-outline"
                  :disabled="butterflyCount <= 0"
                  @click="clearButterflies"
                >
                  Clear swarm
                </button>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <button class="btn btn-sm btn-outline" @click="addBurst(5)">
                  +5
                </button>
                <button class="btn btn-sm btn-outline" @click="addBurst(10)">
                  +10
                </button>
                <button class="btn btn-sm btn-outline" @click="addBurst(20)">
                  +20
                </button>
              </div>
            </div>

            <div
              class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
            >
              <div class="text-sm text-base-content/80">
                Ami’s butterflies are fundraising chaos with a mission.
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <NuxtLink to="/sponsor" class="btn btn-accent btn-sm">
                  <icon name="kind-icon:butterfly" class="h-4 w-4" />
                  Visit Sponsor Page
                </NuxtLink>

                <butterfly-trigger />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Swarm Readout
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <label
              class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <span class="text-sm font-medium">Show active butterflies</span>
              <input v-model="showSwarm" type="checkbox" class="toggle" />
            </label>

            <label
              class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <span class="text-sm font-medium">Show butterfly names</span>
              <input v-model="showNames" type="checkbox" class="toggle" />
            </label>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-xs uppercase text-base-content/60">
                Active Butterflies
              </div>
              <div class="mt-1 text-2xl font-bold">
                {{ butterflyCount }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-xs uppercase text-base-content/60">
                Swarm Visibility
              </div>
              <div class="mt-1 text-sm font-semibold">
                {{ showSwarm ? 'Visible' : 'Hidden' }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-xs uppercase text-base-content/60">
                Name Labels
              </div>
              <div class="mt-1 text-sm font-semibold">
                {{ showNames ? 'Shown' : 'Hidden' }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-xs uppercase text-base-content/60">Sponsor</div>
              <div class="mt-2 flex flex-col gap-2">
                <NuxtLink to="/amibot" class="btn btn-accent btn-sm w-full">
                  Support Ami
                </NuxtLink>

                <butterfly-trigger />
              </div>
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
            >
              Keep the swarm small for subtle flutter, or crank it up when you
              want maximum butterfly nonsense.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useSmartbarStore } from '@/stores/smartbarStore'

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()
const smartbarStore = useSmartbarStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const butterflyCount = computed(() => butterflyStore.getButterflyCount)

const showSwarm = computed({
  get: () => smartbarStore.showSwarm,
  set: (value: boolean) => {
    smartbarStore.showSwarm = value
  },
})

const showNames = computed({
  get: () => butterflyStore.showNames,
  set: () => {
    butterflyStore.toggleShowNames()
  },
})

const butterflySummary = computed(() => {
  if (!showSwarm.value) {
    return 'Butterflies hidden'
  }

  if (butterflyCount.value === 0) {
    return 'No butterflies active'
  }

  if (butterflyCount.value === 1) {
    return 'One brave butterfly active'
  }

  return `${butterflyCount.value} butterflies fluttering`
})

async function addButterfly() {
  await butterflyStore.addButterfly()
}

async function addBurst(amount: number) {
  await butterflyStore.addButterflies(amount)
}

function removeButterfly() {
  butterflyStore.removeRandomButterfly()
}

function clearButterflies() {
  butterflyStore.clearButterflies()
}
</script>
