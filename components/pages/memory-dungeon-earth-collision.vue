<template>
  <section
    class="kr-surface flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-[#17232c] text-[#f4ead7]"
    data-layout="console-fixed"
    data-testid="memory-earth-collision-console"
  >
    <header
      class="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#b8a47e]/40 bg-[#27313b] px-3 py-2"
    >
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-black uppercase tracking-[.2em] text-[#f1c99b]">
          Morrow · The City That Forgot Its Hours
        </p>
        <h2 class="truncate text-lg font-black sm:text-xl">
          The Earth Collision
        </h2>
      </div>
      <span class="rounded-lg border border-[#b8a47e]/40 px-2 py-1 text-xs">
        {{ collision.fragments }}/2 memories
      </span>
      <button type="button" class="btn btn-sm btn-outline" @click="emit('leave')">
        Briar camp
      </button>
    </header>

    <div
      v-if="!collision.unlocked"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-5 text-center"
      data-testid="memory-earth-collision-locked"
    >
      <h3 class="text-2xl font-black">The city has no safe entrance yet.</h3>
      <p class="max-w-lg text-sm leading-relaxed">
        Morrow needs Pip's completed forest crossing, both displaced memories,
        Vesper's genuine village charter and the earlier tide-gate verdict.
        A borrowed memory cannot open this door.
      </p>
      <button type="button" class="btn btn-warning" @click="emit('leave')">
        Return to the journey
      </button>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 grid-rows-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2 p-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:grid-rows-1"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#b8a47e]/40 bg-[#294047]"
        aria-label="Morrow's eight by eight Earth collision map"
      >
        <div class="flex shrink-0 justify-between gap-2 px-3 py-2 text-xs">
          <strong>Office / Lantern / Living Hours</strong>
          <span>
            {{ collision.progress.revealed.length }}/64 explored ·
            {{ Object.keys(collision.progress.choices).length }} decisions
          </span>
        </div>
        <div
          class="grid min-h-0 flex-1 grid-cols-8 grid-rows-8 gap-1 p-2"
          role="group"
          aria-label="Move one adjacent square to explore the city"
        >
          <button
            v-for="tile in collision.tiles"
            :key="tile.key"
            type="button"
            class="relative min-h-0 min-w-0 rounded-md border text-xs font-black transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ffe3a7] sm:text-base"
            :class="
              tile.current
                ? 'border-[#ffe3a7] bg-[#c69a62] text-[#17232c]'
                : tile.resolved
                  ? 'border-[#8dc6ae] bg-[#3d695c]'
                  : tile.revealed
                    ? 'border-[#b8a47e] bg-[#4c626a]'
                    : tile.reachable
                      ? 'border-[#edc18c] bg-[#765d47] hover:bg-[#937454]'
                      : 'border-[#34494b] bg-[#1d333b] text-[#81959a]'
            "
            :disabled="!tile.reachable || collision.completed"
            :aria-current="tile.current ? 'location' : undefined"
            :aria-label="
              tile.revealed
                ? tile.title + (tile.resolved ? ', resolved' : ', unresolved')
                : tile.reachable
                  ? 'Explore ' + tile.key
                  : 'Undiscovered ' + tile.key
            "
            @click="collision.travel(tile.key)"
          >
            {{
              tile.current
                ? '◆'
                : tile.resolved
                  ? '✓'
                  : tile.revealed
                    ? '◇'
                    : tile.reachable
                      ? '◈'
                      : '·'
            }}
          </button>
        </div>
        <div
          class="flex shrink-0 flex-wrap justify-between gap-2 border-t border-[#b8a47e]/30 px-3 py-2 text-xs"
        >
          <span>Supplies {{ collision.progress.supplies }}</span>
          <span>Trust {{ collision.progress.trust }}</span>
          <span>Evidence {{ collision.progress.evidence }}</span>
          <span>Danger {{ collision.progress.danger }}</span>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#b8a47e]/40 bg-[#2b3540]"
        aria-label="Current city encounter and consequences"
      >
        <div
          v-if="collision.current"
          class="relative flex min-h-[8rem] flex-[1_1_42%] flex-col justify-end overflow-hidden border-b border-[#b8a47e]/30 bg-[linear-gradient(130deg,#36545d,#6c584c,#263a47)] p-3"
        >
          <img
            v-if="collision.current.sceneArt.status === 'delivered'"
            :src="collision.current.sceneArt.path"
            :alt="collision.current.title"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div class="relative max-w-2xl rounded-lg bg-[#121e26]/85 p-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-[#e9c48c]">
              {{ collision.current.speaker }} · {{ collision.position }}
            </p>
            <h3 class="mt-1 text-lg font-black sm:text-2xl">
              {{ collision.current.title }}
            </h3>
            <p class="mt-2 text-xs leading-relaxed sm:text-sm">
              {{ collision.current.opening }}
            </p>
            <p
              v-if="collision.history"
              class="mt-2 text-xs leading-relaxed text-[#f2d4a5]"
              data-testid="memory-earth-collision-history"
            >
              Vesper's
              {{ collision.history.charter === 'consent' ? 'consent-bound' : 'open-door' }}
              charter and Pip's recorded witnesses follow Morrow into this
              city. The tide-gate decision remains part of its history.
            </p>
          </div>
          <span
            v-if="collision.current.sceneArt.status !== 'delivered'"
            class="absolute right-2 top-2 rounded bg-[#141d25]/85 px-2 py-1 text-[10px]"
          >
            Scene illustration pending
          </span>
        </div>
        <div class="kr-scroll min-h-0 flex-1 overflow-y-auto p-3">
          <p v-if="collision.notice" class="mb-2 text-xs text-[#f6d49a]" role="status">
            {{ collision.notice }}
          </p>
          <div
            v-if="collision.chosen"
            class="rounded-xl border border-[#87c6ae]/60 bg-[#34524c] p-3"
            data-testid="memory-earth-collision-outcome"
          >
            <p class="text-xs font-black uppercase tracking-wider">
              Morrow's recorded decision
            </p>
            <p class="mt-2 text-sm leading-relaxed">
              {{ collision.chosen.outcome }}
            </p>
          </div>
          <div v-else-if="!collision.completed" class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="choice in collision.current?.choices ?? []"
              :key="choice.id"
              type="button"
              class="overflow-hidden rounded-xl border border-[#a99174] bg-[#394d53] text-left hover:border-[#f3d29c] focus-visible:outline-2 focus-visible:outline-[#f3d29c]"
              :data-testid="'memory-earth-collision-choice-' + choice.id"
              @click="collision.choose(choice.id)"
            >
              <div
                class="relative flex h-16 items-end bg-[linear-gradient(125deg,#455d61,#745d4a,#2b4c51)] p-2"
              >
                <img
                  v-if="choice.art.status === 'delivered'"
                  :src="choice.art.path"
                  :alt="choice.label"
                  class="absolute inset-0 h-full w-full object-cover"
                />
                <span
                  v-else
                  class="relative rounded bg-[#17252b]/85 px-2 py-1 text-[10px]"
                >
                  Choice illustration pending
                </span>
              </div>
              <span class="block p-2 text-xs font-bold leading-relaxed sm:text-sm">
                {{ choice.label }}
              </span>
            </button>
          </div>
          <div
            v-if="collision.readyForCrossroad"
            class="mt-3 rounded-xl border border-[#e9c48c]/60 bg-[#514336] p-3"
            data-testid="memory-earth-collision-crossroad-pending"
          >
            <p class="text-sm leading-relaxed">
              Both displaced memories are safe. Morrow has enough testimony
              to face the city's final crossroads, but its verdict has not
              yet been written. Continue exploring without losing this route.
            </p>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMemoryEarthCollisionStore } from '~/stores/memoryEarthCollisionStore'

const emit = defineEmits<{ leave: [] }>()
const collision = useMemoryEarthCollisionStore()

onMounted(() => collision.hydrate())
</script>
