<template>
  <main class="kr-surface min-h-full">
    <div class="kr-scroll mx-auto max-w-7xl space-y-5 px-3 py-5 pb-24 sm:px-6">
      <header-page-bar>
        <div
          class="tile-bar flex min-w-0 flex-1 items-center justify-end gap-1.5"
          title="Work in progress · first playable slice. Slide the eight painted panes into place; finish the picture to reveal a postcard for your keepsake wall. Commissioned gallery art is still on the production list."
        >
          <button
            type="button"
            class="btn btn-primary btn-sm"
            @click="gallery.openDaily()"
          >
            Daily <span class="tile-bar-long">puzzle · UTC</span>
          </button>
          <button
            type="button"
            class="btn btn-outline btn-sm"
            aria-label="New practice board"
            @click="gallery.newPractice()"
          >
            <span class="tile-bar-long">New practice board</span>
            <span class="tile-bar-short">Practice</span>
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="gallery.restart()"
          >
            Restart <span class="tile-bar-long">board</span>
          </button>
        </div>
      </header-page-bar>

      <div
        class="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]"
      >
        <section
          class="rounded-3xl border border-base-content/15 bg-base-200 p-3 shadow-lg sm:p-6"
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-widest text-primary">
                {{
                  gallery.puzzle.mode === 'daily'
                    ? 'Shared daily board'
                    : 'Practice board'
                }}
              </p>
              <p class="text-sm text-base-content/60">
                {{ gallery.puzzle.day }} · Select a tile beside the empty space
              </p>
            </div>
            <div class="rounded-xl bg-base-300 px-4 py-2 text-center">
              <p class="text-xs text-base-content/60">Moves</p>
              <p class="text-2xl font-black tabular-nums">
                {{ gallery.puzzle.moves }}
              </p>
            </div>
          </div>

          <div
            class="mx-auto grid aspect-square w-full max-w-[520px] grid-cols-3 grid-rows-3 gap-1.5 rounded-3xl bg-base-300 p-2 shadow-inner sm:gap-2 sm:p-3"
            role="group"
            aria-label="Three by three sliding tile board"
          >
            <button
              v-for="(tile, index) in gallery.puzzle.tiles"
              :key="tile"
              type="button"
              class="group relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 font-black transition duration-150 focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary sm:rounded-2xl"
              :class="
                tile === 0
                  ? 'pointer-events-none border-dashed border-base-content/15 bg-base-100/30'
                  : gallery.canMove(index)
                    ? 'cursor-pointer shadow-lg hover:-translate-y-0.5 hover:brightness-110 active:scale-95'
                    : 'cursor-default opacity-90'
              "
              :style="tile ? tileArtwork(tile) : undefined"
              :disabled="tile === 0 || !gallery.canMove(index)"
              :aria-label="
                tile === 0
                  ? 'Empty square'
                  : `Tile ${tile}${gallery.canMove(index) ? ', movable' : ''}`
              "
              @click="gallery.move(index)"
            >
              <span
                v-if="tile"
                class="relative grid h-12 w-12 place-items-center rounded-full bg-black/25 text-3xl text-white drop-shadow-lg sm:h-16 sm:w-16 sm:text-4xl"
              >
                {{ tile }}
              </span>
            </button>
          </div>
          <p class="mt-4 text-center text-sm text-base-content/60">
            Every shuffle is made from legal moves, so the board is solvable.
            Your moves save on this device.
          </p>
        </section>

        <div class="space-y-5">
          <section
            class="overflow-hidden rounded-3xl border border-base-content/15 bg-base-200 shadow-lg"
          >
            <div
              class="relative flex min-h-72 flex-col justify-end overflow-hidden bg-gradient-to-br from-indigo-950 via-fuchsia-900 to-amber-700 p-6 text-white sm:min-h-96"
            >
              <template v-if="gallery.puzzle.solved">
                <div class="absolute right-7 top-6 text-7xl opacity-80">🌈</div>
                <div class="absolute left-8 top-12 text-[7rem] opacity-70">
                  🤖
                </div>
              </template>
              <div
                class="absolute bottom-24 right-16 h-24 w-24 rounded-full bg-amber-300/40 blur-2xl"
              />
              <div
                v-if="gallery.puzzle.solved"
                class="relative rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-sm"
              >
                <p
                  class="text-xs font-bold uppercase tracking-widest text-amber-200"
                >
                  Postcard unlocked
                </p>
                <h2 class="mt-2 text-2xl font-bold">
                  The Little Robot Who Gathered Starlight
                </h2>
                <p class="mt-2 text-sm text-white/85">
                  A tiny robot collects eight scattered colors from the sky. The
                  last piece turns the whole night into a rainbow.
                </p>
              </div>
              <div
                v-else
                class="relative rounded-2xl border border-white/20 bg-black/40 p-5 text-center backdrop-blur-md"
              >
                <p
                  class="text-xs font-bold uppercase tracking-widest text-amber-200"
                >
                  A mystery postcard awaits
                </p>
                <p class="mt-2 text-lg font-semibold">
                  Put the numbered tiles in order to reveal the illustration.
                </p>
              </div>
            </div>
            <div class="p-5">
              <p
                v-if="gallery.puzzle.solved"
                class="text-base font-semibold text-success"
                role="status"
              >
                Picture complete in {{ gallery.puzzle.moves }} moves! Added to
                the keepsake wall.
              </p>
              <p v-else class="text-sm text-base-content/70">
                The reveal is a temporary illustrated postcard. Finished
                generated gallery images and their captions will replace it
                before public release.
              </p>
            </div>
          </section>

          <section
            class="rounded-3xl border border-base-content/15 bg-base-200 p-5 shadow-lg"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold">Keepsake wall</h2>
              <span class="kr-badge-outline">
                {{ gallery.solvedCount }} complete
              </span>
            </div>
            <p class="mt-2 text-sm text-base-content/65">
              Solved postcards are remembered in this browser, not posted
              publicly.
            </p>
            <p
              v-if="!gallery.keepsakes.length"
              class="mt-5 rounded-xl border border-dashed border-base-content/20 p-6 text-center text-sm text-base-content/60"
            >
              Your first completed picture belongs here.
            </p>
            <ul v-else class="mt-4 grid gap-2 sm:grid-cols-2">
              <li
                v-for="item in gallery.keepsakes"
                :key="item.key"
                class="rounded-xl border border-base-content/15 bg-base-300/70 p-3"
              >
                <div class="text-lg">🌌 🤖</div>
                <p class="mt-1 text-sm font-semibold">
                  {{
                    item.mode === 'daily'
                      ? 'Daily postcard'
                      : 'Practice postcard'
                  }}
                </p>
                <p class="text-xs text-base-content/65">
                  {{ item.day }} · {{ item.moves }} moves
                </p>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSlidingTileGalleryStore } from '~/stores/slidingTileGalleryStore'

const gallery = useSlidingTileGalleryStore()

const tileColors = [
  ['#f9a8d4', '#a78bfa'],
  ['#60a5fa', '#22d3ee'],
  ['#fde68a', '#fb923c'],
  ['#86efac', '#38bdf8'],
] as const

function tileArtwork(tile: number) {
  const colors = tileColors[(tile - 1) % tileColors.length]!
  return {
    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
  }
}

onMounted(() => gallery.initialize())
</script>

<style scoped>
.tile-bar-short {
  display: none;
}

@container (max-width: 520px) {
  .tile-bar-long {
    display: none;
  }
  .tile-bar-short {
    display: inline;
  }
}
</style>
