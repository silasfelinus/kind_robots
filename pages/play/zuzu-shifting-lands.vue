<template>
  <main class="kr-surface min-h-screen">
    <div v-if="!user.initialized" class="grid min-h-96 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div
      v-else-if="!user.isAdmin"
      class="kr-note kr-note-error mx-auto mt-16 max-w-xl p-8 text-center"
    >
      Shifting Lands is still in its private workshop.
    </div>
    <div
      v-else
      class="kr-scroll mx-auto max-w-[1540px] space-y-5 px-3 py-5 sm:px-6"
    >
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.3em] text-warning">
            The Wasteland · Private playable prototype
          </p>
          <h1 class="mt-1 font-serif text-3xl font-black sm:text-5xl">
            Zuzu: Shifting Lands
          </h1>
          <p class="mt-2 text-sm opacity-75">
            An illustrated journey where every card changes the road.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <NuxtLink class="btn btn-outline btn-sm" to="/admin/worlds/zuzu"
            >World Studio</NuxtLink
          >
          <button
            class="btn btn-outline btn-sm"
            type="button"
            @click="resetRun"
          >
            New journey
          </button>
        </div>
      </header>
      <section
        class="overflow-hidden rounded-3xl border border-base-content/15 bg-base-200 shadow-xl"
      >
        <div class="relative min-h-52 overflow-hidden bg-base-300 md:min-h-64">
          <img
            src="/zuzu-gamebook/scenes/dust-road.webp"
            alt="Winding wasteland road from the established Zuzu Gamebook artwork"
            class="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-base-300 via-base-300/80 to-transparent"
          />
          <div
            class="relative flex min-h-52 flex-col justify-end p-5 md:min-h-64 md:p-8"
          >
            <p class="text-xs font-bold tracking-widest text-warning">
              LAND 01 / 05
            </p>
            <h2 class="font-serif text-3xl font-black">The Homestead</h2>
            <p class="mt-2 max-w-md text-sm">
              Strange settlers, the smell of rain, and sanctuary with a price.
            </p>
          </div>
        </div>
        <div
          class="grid grid-cols-5 gap-1 border-t border-base-content/10 p-2 sm:gap-2 sm:p-4"
        >
          <div
            v-for="(land, index) in lands"
            :key="land"
            class="rounded-xl p-2 text-center text-[10px] sm:text-xs"
            :class="
              index === 0
                ? 'bg-primary/20 font-bold text-primary'
                : 'bg-base-300 text-base-content/50'
            "
          >
            <Icon
              :name="index === 0 ? 'kind-icon:map' : 'kind-icon:lock'"
              class="mx-auto mb-1 h-5 w-5"
            />
            {{ land }}
          </div>
        </div>
      </section>
      <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section class="min-w-0 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-serif text-xl font-black">The three roads</h2>
            <span class="badge badge-outline"
              >{{ game.state.discard.length }} / 3 visited</span
            >
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
              v-for="card in game.cards"
              :key="card.id"
              class="relative min-w-0 overflow-hidden rounded-2xl border border-base-content/10 bg-base-200 shadow-md"
            >
              <div class="aspect-[2/3]">
                <img
                  v-if="game.state.revealed.includes(card.id)"
                  :src="card.art"
                  :alt="card.title"
                  class="size-full object-cover"
                />
                <img
                  v-else
                  src="/images/adventure/card/card-back1.webp"
                  alt="Face-down location card"
                  class="size-full object-cover"
                />
              </div>
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 text-white"
              >
                <p class="text-sm font-black">
                  {{
                    game.state.revealed.includes(card.id)
                      ? card.title
                      : 'Undiscovered'
                  }}
                </p>
                <span
                  v-if="game.state.discard.includes(card.id)"
                  class="mt-1 inline-block rounded bg-success/80 px-2 py-0.5 text-xs"
                  >Visited</span
                >
                <span
                  v-else-if="game.state.active === card.id"
                  class="mt-1 inline-block rounded bg-warning/80 px-2 py-0.5 text-xs"
                  >Encounter</span
                >
              </div>
            </div>
            <div
              class="relative min-w-0 overflow-hidden rounded-2xl border bg-base-200"
              :class="
                game.bossReady ? 'border-warning' : 'border-base-content/10'
              "
            >
              <img
                :src="
                  game.bossReady || game.state.bossResolved
                    ? game.bossCard.art
                    : '/images/adventure/card/card-back2.webp'
                "
                :alt="
                  game.bossReady ? 'The Abbess awaits' : 'Boss card face down'
                "
                class="aspect-[2/3] w-full object-cover"
              />
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-3 font-bold text-white"
              >
                {{
                  game.bossReady || game.state.bossResolved
                    ? 'The Abbess'
                    : 'The final gate'
                }}
              </div>
            </div>
          </div>
          <div
            class="grid gap-4 rounded-2xl border border-base-content/10 bg-base-200 p-4 sm:grid-cols-[180px_minmax(0,1fr)]"
          >
            <div class="space-y-2">
              <p class="text-xs font-bold uppercase tracking-widest opacity-60">
                Encounter deck
              </p>
              <button
                type="button"
                class="group relative mx-auto block w-36"
                :disabled="
                  !!game.state.active ||
                  !game.state.deck.length ||
                  game.state.health <= 0
                "
                @click="draw"
              >
                <img
                  src="/images/adventure/card/card-back1.webp"
                  alt="Draw the next encounter card"
                  class="aspect-[2/3] w-full rounded-xl object-cover shadow-2xl transition group-hover:-translate-y-2 motion-reduce:transform-none"
                />
                <span class="absolute -right-2 -top-2 badge badge-primary">{{
                  game.state.deck.length
                }}</span>
              </button>
              <p class="text-center text-xs opacity-70">Tap the deck to draw</p>
            </div>
            <div class="flex min-w-0 flex-col justify-center gap-3">
              <div
                v-if="game.activeCard"
                class="grid gap-3 sm:grid-cols-[125px_1fr]"
              >
                <div class="aspect-[2/3] overflow-hidden rounded-xl">
                  <NavigationFlipCard :trigger-key="flipKey" :duration-ms="580">
                    <template #front
                      ><img
                        :src="game.activeCard.art"
                        :alt="game.activeCard.title"
                        class="size-full object-cover"
                    /></template>
                    <template #back
                      ><img
                        src="/images/adventure/card/card-back1.webp"
                        alt=""
                        class="size-full object-cover"
                    /></template>
                  </NavigationFlipCard>
                </div>
                <div class="space-y-2">
                  <p class="text-xs font-bold uppercase text-warning">
                    Drawn encounter
                  </p>
                  <h3 class="font-serif text-xl font-black">
                    {{ game.activeCard.title }}
                  </h3>
                  <p class="text-sm leading-relaxed">
                    {{ game.activeCard.narrative }}
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      class="btn btn-primary btn-sm"
                      type="button"
                      @click="game.resolve('help')"
                    >
                      Offer help / observe
                    </button>
                    <button
                      class="btn btn-outline btn-sm"
                      type="button"
                      @click="game.resolve('risk')"
                    >
                      Press onward recklessly
                    </button>
                  </div>
                </div>
              </div>
              <template v-else-if="game.bossReady">
                <p class="text-xs font-black uppercase text-warning">
                  Boss gate unlocked
                </p>
                <h3 class="font-serif text-2xl font-bold">The Abbess</h3>
                <p class="text-sm">{{ game.bossCard.narrative }}</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    class="btn btn-primary"
                    @click="game.boss('confront')"
                  >
                    Confront the Abbess</button
                  ><button class="btn btn-outline" @click="game.boss('escape')">
                    Escape wounded
                  </button>
                </div>
              </template>
              <template v-else-if="game.state.bossResolved"
                ><h3 class="font-serif text-2xl font-black">
                  The Homestead is behind you
                </h3>
                <p class="text-sm">
                  First-land vertical slice complete. The remaining lands and
                  full encounter checks are still in development.
                </p></template
              >
              <template v-else-if="game.state.health === 0"
                ><h3 class="text-2xl font-black">Zuzu has fallen</h3>
                <p>Begin a new journey to try another path.</p></template
              >
              <template v-else
                ><h3 class="font-serif text-xl font-bold">The deck awaits</h3>
                <p class="text-sm opacity-75">
                  Draw a face-down card to discover your next location and
                  choose how Zuzu responds.
                </p></template
              >
            </div>
          </div>
        </section>
        <aside class="space-y-4">
          <section
            class="overflow-hidden rounded-2xl border border-base-content/10 bg-base-200"
          >
            <img
              src="/zuzu-gamebook/scenes/zuzu-alone.webp"
              alt="Zuzu the grey koala ronin"
              class="aspect-[16/9] w-full object-cover object-center"
            />
            <div class="space-y-2 p-4">
              <h2 class="font-serif text-xl font-black">Zuzu · The Ronin</h2>
              <div class="flex justify-between text-sm">
                <span>Health</span><strong>{{ game.state.health }} / 8</strong>
              </div>
              <progress
                class="progress progress-error w-full"
                :value="game.state.health"
                max="8"
              />
              <div class="flex justify-between text-sm">
                <span>Provisions</span
                ><strong>{{ game.state.provisions }}</strong>
              </div>
              <div class="flex justify-between text-sm">
                <span>Discarded encounters</span
                ><strong>{{ game.state.discard.length }}</strong>
              </div>
            </div>
          </section>
          <section
            class="rounded-2xl border border-base-content/10 bg-base-200 p-4"
          >
            <h3 class="font-bold">Travel journal</h3>
            <ol class="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              <li
                v-for="(entry, index) in game.state.journal"
                :key="index"
                class="border-l-2 border-primary/40 pl-3"
              >
                {{ entry }}
              </li>
            </ol>
          </section>
          <p class="text-xs opacity-65">
            Prototype: three encounter cards, one boss, deterministic draw order
            and local save/resume. Combat, multi-land travel, class/species
            decks and real backend saves are upcoming slices.
          </p>
        </aside>
      </div>
    </div>
  </main>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useShiftingLandsStore } from '~/stores/shiftingLandsStore'
const user = useUserStore()
const game = useShiftingLandsStore()
const flipKey = ref(0)
const lands = ['Homestead', 'Crossing', 'Tablelands', 'Caves', 'Verge']
onMounted(async () => {
  await user.initialize()
  if (user.isAdmin) game.initialize()
})
async function draw() {
  if (!game.draw()) return
  await nextTick()
  flipKey.value++
}
function resetRun() {
  if (
    confirm(
      'Begin a fresh Homestead journey? Your current run will be replaced.',
    )
  )
    game.fresh()
}
</script>
