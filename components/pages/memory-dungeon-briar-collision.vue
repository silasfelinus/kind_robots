<template>
  <section
    class="kr-surface flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-[#141d24] text-[#f4ead7]"
    data-layout="console-fixed"
    data-testid="memory-briar-collision-console"
  >
    <header
      class="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#b19b7c]/40 bg-[#282d30] px-3 py-2"
    >
      <div class="min-w-0 flex-1">
        <p
          class="text-[10px] font-black uppercase tracking-[.2em] text-[#e2b989]"
        >
          Pip · The Forest Between Floors
        </p>
        <h2 class="truncate text-lg font-black sm:text-xl">
          The Briar Collision
        </h2>
      </div>
      <span class="rounded-lg border border-[#b19b7c]/40 px-2 py-1 text-xs">
        {{ collision.fragments }}/2 fragments
      </span>
      <button
        type="button"
        class="btn btn-sm btn-outline"
        @click="emit('leave')"
      >
        Briar camp
      </button>
    </header>

    <div
      v-if="!collision.unlocked"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-5 text-center"
      data-testid="memory-briar-collision-locked"
    >
      <h3 class="text-2xl font-black">The crossings have not been earned.</h3>
      <p class="max-w-lg text-sm leading-relaxed">
        Complete both Hoshimori journeys and preserve the earlier witnesses. Pip
        cannot enter the rewritten forest before those memories exist.
      </p>
      <button type="button" class="btn btn-warning" @click="emit('leave')">
        Return to the journey
      </button>
    </div>

    <div
      v-else-if="!collision.committed"
      class="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-2"
      data-testid="memory-briar-collision-commit"
    >
      <div
        class="relative min-h-48 overflow-hidden rounded-xl border border-[#c49c71]/60 bg-[radial-gradient(circle_at_25%_35%,#677c74,#343b43_55%,#1a2430)]"
        role="img"
        aria-label="An imagined office corridor intersects the old Briar forest and a flooded stairwell; illustration pending"
      >
        <div class="absolute inset-x-4 bottom-4 rounded-lg bg-[#111a22]/85 p-3">
          <p class="text-sm font-black">One forest. Three incompatible maps.</p>
          <p class="mt-1 text-xs">Illustrated establishing scene pending.</p>
        </div>
      </div>
      <div
        class="kr-scroll flex min-h-0 flex-col justify-center overflow-y-auto rounded-xl border border-[#c49c71]/40 bg-[#26343a] p-4"
      >
        <h3 class="text-xl font-black">Pip remembers where the stairs were.</h3>
        <p class="mt-3 text-sm leading-relaxed">
          A research office has grown through the House That Remembers. Salt
          water fills the wolf road, and the people inside are being asked to
          surrender their names for a safe exit. Pip can walk away, but nobody
          else here knows which rules belong to which world.
        </p>
        <p class="mt-3 text-sm leading-relaxed">
          Commit to this crossing to begin the next journey. The two displaced
          memories must be earned through decisions, not merely visited.
        </p>
        <button
          type="button"
          class="btn btn-warning mt-4 w-full"
          data-testid="memory-briar-collision-begin"
          @click="collision.commit()"
        >
          Pip enters the broken forest
        </button>
      </div>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 grid-rows-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2 p-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:grid-rows-1"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#b19b7c]/40 bg-[#233b3b]"
        aria-label="Pip's eight by eight Briar collision map"
      >
        <div class="flex shrink-0 justify-between gap-2 px-3 py-2 text-xs">
          <strong>Forest / Office / Tide</strong>
          <span>
            {{ collision.progress.revealed.length }}/64 explored ·
            {{ Object.keys(collision.progress.choices).length }} decisions
          </span>
        </div>
        <div
          class="grid min-h-0 flex-1 grid-cols-8 grid-rows-8 gap-1 p-2"
          role="group"
          aria-label="Move one adjacent square to explore the collision"
        >
          <button
            v-for="tile in collision.tiles"
            :key="tile.key"
            type="button"
            class="relative min-h-0 min-w-0 rounded-md border text-xs font-black transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ffe3a7] sm:text-base"
            :class="
              tile.current
                ? 'border-[#ffe3a7] bg-[#b48b57] text-[#142328]'
                : tile.resolved
                  ? 'border-[#8dc6ae] bg-[#3d695c]'
                  : tile.revealed
                    ? 'border-[#b19b7c] bg-[#4c5e61]'
                    : tile.reachable
                      ? 'border-[#edc18c] bg-[#755942] hover:bg-[#936d4c]'
                      : 'border-[#34494b] bg-[#1b3034] text-[#78908d]'
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
          class="flex shrink-0 flex-wrap justify-between gap-2 border-t border-[#b19b7c]/30 px-3 py-2 text-xs"
        >
          <span>Supplies {{ collision.progress.supplies }}</span>
          <span>Trust {{ collision.progress.trust }}</span>
          <span>Evidence {{ collision.progress.evidence }}</span>
          <span>Danger {{ collision.progress.danger }}</span>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#b19b7c]/40 bg-[#28323a]"
        aria-label="Current encounter and consequences"
      >
        <div
          v-if="collision.current"
          class="relative flex min-h-[8rem] flex-[1_1_42%] flex-col justify-end overflow-hidden border-b border-[#b19b7c]/30 bg-[linear-gradient(130deg,#394f55,#5b4e47,#263a42)] p-3"
        >
          <img
            v-if="collision.current.sceneArt.status === 'delivered'"
            :src="collision.current.sceneArt.path"
            :alt="collision.current.title"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div class="relative max-w-2xl rounded-lg bg-[#121e26]/85 p-3">
            <p
              class="text-[10px] font-black uppercase tracking-widest text-[#e9c48c]"
            >
              {{ collision.current.speaker }} · {{ collision.position }}
            </p>
            <h3 class="mt-1 text-lg font-black sm:text-2xl">
              {{ collision.current.title }}
            </h3>
            <p
              class="kr-scroll mt-2 max-h-28 overflow-y-auto text-xs leading-relaxed sm:text-sm"
            >
              {{ collision.current.opening }}
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
          <p
            v-if="collision.notice"
            class="mb-2 text-xs text-[#f6d49a]"
            role="status"
          >
            {{ collision.notice }}
          </p>
          <div
            v-if="collision.chosen"
            class="rounded-xl border border-[#87c6ae]/60 bg-[#34524c] p-3"
            data-testid="memory-briar-collision-outcome"
          >
            <p class="text-xs font-black uppercase tracking-wider">
              Pip's recorded decision
            </p>
            <p class="mt-2 text-sm leading-relaxed">
              {{ collision.chosen.outcome }}
            </p>
          </div>
          <div
            v-else-if="!collision.completed"
            class="grid gap-2 sm:grid-cols-2"
          >
            <button
              v-for="choice in collision.current?.choices ?? []"
              :key="choice.id"
              type="button"
              class="overflow-hidden rounded-xl border border-[#a99174] bg-[#394d53] text-left hover:border-[#f3d29c] focus-visible:outline-2 focus-visible:outline-[#f3d29c]"
              :data-testid="'memory-briar-collision-choice-' + choice.id"
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
              <span
                class="block p-2 text-xs font-bold leading-relaxed sm:text-sm"
              >
                {{ choice.label }}
              </span>
            </button>
          </div>
          <div
            v-if="collision.readyToLeave && !collision.completed"
            class="mt-3 rounded-xl border border-[#e9c48c]/60 bg-[#514336] p-3"
          >
            <p class="mb-2 text-sm">
              Both displaced memories are recovered. Pip may continue exploring
              or carry these consequences into Morrow's city.
            </p>
            <button
              type="button"
              class="btn btn-warning w-full"
              data-testid="memory-briar-collision-finish"
              @click="collision.conclude()"
            >
              Preserve the crossing
            </button>
          </div>
          <p v-if="collision.completed" class="mt-2 text-sm text-[#bde3cb]">
            Pip's crossing is preserved in the campaign Chronicle.
          </p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMemoryBriarCollisionStore } from '~/stores/memoryBriarCollisionStore'

const emit = defineEmits<{ leave: [] }>()
const collision = useMemoryBriarCollisionStore()

onMounted(() => collision.hydrate())
</script>
