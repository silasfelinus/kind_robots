<!-- /components/navigation/footer/butterfly-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        class="grid h-full w-full min-h-0 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
        >
          <icon name="kind-icon:butterfly" class="h-6 w-6" />
        </div>

        <div class="flex min-w-0 flex-col gap-1 overflow-hidden">
          <div class="truncate text-sm font-semibold">Butterfly Swarm</div>
          <div class="truncate text-xs text-base-content/70">
            {{ butterflySummary }}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            title="Add butterfly"
            @click="addButterfly"
          >
            ➕
          </button>

          <button
            type="button"
            class="btn btn-sm btn-secondary"
            title="Remove butterfly"
            :disabled="butterflyCount <= 0"
            @click="removeButterfly"
          >
            ➖
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="isOpen"
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,22rem)]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
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

        <div
          class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[auto_auto_1fr_auto]"
        >
          <button type="button" class="btn btn-primary" @click="addButterfly">
            ➕ Add
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            :disabled="butterflyCount <= 0"
            @click="removeButterfly"
          >
            ➖ Remove
          </button>

          <div
            class="flex min-w-0 flex-col justify-center rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <div class="mb-2 flex items-center justify-between gap-3 text-sm">
              <span class="font-medium">Target Count</span>
              <span class="font-semibold">{{ count }}</span>
            </div>

            <input
              v-model="count"
              type="range"
              min="0"
              max="100"
              class="range range-sm w-full"
            />
          </div>

          <button
            type="button"
            class="btn btn-outline"
            :disabled="butterflyCount <= 0"
            @click="clearButterflies"
          >
            Clear
          </button>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Current Count
            </div>
            <div class="mt-1 text-lg font-semibold">
              🦋 {{ butterflyCount }}
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Target Count
            </div>
            <div class="mt-1 text-lg font-semibold">{{ targetCount }}</div>
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
          class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div class="text-sm text-base-content/80">
            Flutter with purpose. Help Ami fight malaria.
          </div>

          <NuxtLink to="/sponsor" class="btn btn-accent btn-sm">
            <icon name="kind-icon:butterfly" class="h-4 w-4" />
            Sponsor Butterflies
          </NuxtLink>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Swarm Controls
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-3">
          <label
            class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <span class="text-sm font-medium">Show active butterflies</span>
            <input v-model="showSwarm" type="checkbox" class="toggle" />
          </label>

          <div
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
          >
            The butterfly layer stays mounted as a launchpad. This toggle only
            controls whether active butterflies are visible.
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-2 text-sm font-semibold">Quick actions</div>

            <div class="grid grid-cols-2 gap-2">
              <button class="btn btn-sm btn-outline" @click="setCount(10)">
                10
              </button>
              <button class="btn btn-sm btn-outline" @click="setCount(20)">
                20
              </button>
              <button class="btn btn-sm btn-outline" @click="setCount(40)">
                40
              </button>
              <button class="btn btn-sm btn-outline" @click="setCount(60)">
                60
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,24rem)]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
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

        <div class="mt-3 flex min-h-0 flex-1 flex-col gap-3">
          <div
            class="min-h-72 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <butterfly-demo class="h-full w-full overflow-hidden rounded-2xl" />
          </div>

          <div
            class="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <div
              class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-200 p-4"
            >
              <div class="mb-3 flex items-center justify-between gap-3">
                <div class="text-sm font-semibold">Population</div>
                <div class="text-sm text-base-content/70">
                  {{ butterflyCount }} / {{ targetCount }}
                </div>
              </div>

              <div class="mb-4 flex flex-wrap items-center gap-3">
                <button class="btn btn-primary" @click="addButterfly">
                  ➕ Add butterfly
                </button>

                <button
                  class="btn btn-secondary"
                  :disabled="butterflyCount <= 0"
                  @click="removeButterfly"
                >
                  ➖ Remove butterfly
                </button>

                <button
                  class="btn btn-outline"
                  :disabled="butterflyCount <= 0"
                  @click="clearButterflies"
                >
                  Clear swarm
                </button>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <span class="text-sm font-medium">Target Count</span>
                  <span class="text-lg font-semibold">{{ count }}</span>
                </div>

                <input
                  v-model="count"
                  type="range"
                  min="0"
                  max="100"
                  class="range range-md w-full"
                />

                <div class="mt-3 grid grid-cols-4 gap-2">
                  <button class="btn btn-sm btn-outline" @click="setCount(0)">
                    0
                  </button>
                  <button class="btn btn-sm btn-outline" @click="setCount(12)">
                    12
                  </button>
                  <button class="btn btn-sm btn-outline" @click="setCount(24)">
                    24
                  </button>
                  <button class="btn btn-sm btn-outline" @click="setCount(50)">
                    50
                  </button>
                </div>
              </div>

              <div
                class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div class="text-sm text-base-content/80">
                  Ami’s butterflies are fundraising chaos with a mission.
                </div>

                <NuxtLink to="/sponsor" class="btn btn-accent btn-sm">
                  <icon name="kind-icon:butterfly" class="h-4 w-4" />
                  Visit Sponsor Page
                </NuxtLink>
              </div>
            </div>

            <div class="flex min-h-0 flex-col gap-3">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
                <div
                  class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
                >
                  Display Options
                </div>

                <div class="grid grid-cols-1 gap-3">
                  <label
                    class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <span class="text-sm font-medium"
                      >Show active butterflies</span
                    >
                    <input v-model="showSwarm" type="checkbox" class="toggle" />
                  </label>

                  <label
                    class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <span class="text-sm font-medium"
                      >Show butterfly names</span
                    >
                    <input v-model="showNames" type="checkbox" class="toggle" />
                  </label>
                </div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
                <div
                  class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
                >
                  Summary
                </div>

                <div class="space-y-3">
                  <div
                    class="rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div class="text-xs uppercase text-base-content/60">
                      Current State
                    </div>
                    <div class="mt-1 text-sm font-semibold">
                      {{ butterflySummary }}
                    </div>
                  </div>

                  <div
                    class="rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div class="text-xs uppercase text-base-content/60">
                      Swarm Visibility
                    </div>
                    <div class="mt-1 text-sm font-semibold">
                      {{ showSwarm ? 'Visible' : 'Hidden' }}
                    </div>
                  </div>

                  <div
                    class="rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div class="text-xs uppercase text-base-content/60">
                      Name Labels
                    </div>
                    <div class="mt-1 text-sm font-semibold">
                      {{ showNames ? 'Shown' : 'Hidden' }}
                    </div>
                  </div>

                  <div
                    class="rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div class="text-xs uppercase text-base-content/60">
                      Selected Butterfly
                    </div>
                    <div class="mt-1 text-sm font-semibold">
                      {{ selectedButterflyLabel }}
                    </div>
                  </div>

                  <div
                    class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm text-base-content/80"
                  >
                    Priority mode gives the butterfly controls room to breathe
                    and lets your selected butterfly strut a little.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden min-h-0 xl:flex xl:flex-col">
        <div
          class="flex h-full min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
        >
          <div
            class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
          >
            Swarm Readout
          </div>

          <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto">
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
                Target Count
              </div>
              <div class="mt-1 text-2xl font-bold">
                {{ targetCount }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-xs uppercase text-base-content/60">
                Selected Butterfly
              </div>
              <div class="mt-1 text-sm font-semibold">
                {{ selectedButterflyLabel }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-xs uppercase text-base-content/60">Sponsor</div>
              <div class="mt-2">
                <NuxtLink to="/sponsor" class="btn btn-accent btn-sm w-full">
                  Support Ami
                </NuxtLink>
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
// /components/navigation/footer/butterfly-footer.vue
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
const targetCount = computed(() => butterflyStore.targetCount)

const count = computed({
  get: () => butterflyStore.targetCount,
  set: (val: number | string) => {
    const nextValue =
      typeof val === 'number' ? val : Number.parseInt(String(val), 10)

    butterflyStore.targetCount = Number.isFinite(nextValue)
      ? Math.max(0, Math.min(100, nextValue))
      : 0

    butterflyStore.syncButterflyCount()
  },
})

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

const selectedButterfly = computed(() => butterflyStore.getSelectedButterfly)

const selectedButterflyLabel = computed(() => {
  if (!selectedButterfly.value) {
    return 'No butterfly selected'
  }

  return selectedButterfly.value.message
    ? `${selectedButterfly.value.id}: ${selectedButterfly.value.message}`
    : selectedButterfly.value.id
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
  for (let i = 0; i < amount; i++) {
    await butterflyStore.addButterfly()
  }
}

function removeButterfly() {
  butterflyStore.removeRandomButterfly()
}

function clearButterflies() {
  butterflyStore.clearButterflies()
}

function setCount(value: number) {
  count.value = value
}
</script>
