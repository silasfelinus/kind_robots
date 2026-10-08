<template>
  <main class="kr-surface">
    <div class="kr-scroll mx-auto max-w-[1500px] px-3 py-5 sm:px-6 lg:px-10">
      <div
        v-if="!userStore.initialized"
        class="grid min-h-52 place-items-center"
      >
        <span class="kr-spinner-lg-primary" />
      </div>
      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error mx-auto mt-12 max-w-lg p-8 text-center"
      >
        <h2 class="text-2xl font-black">The book is still being written</h2>
        <p class="mt-3">
          Zuzu’s illustrated gamebook is in its private workshop.
        </p>
      </div>
      <template v-else-if="store.loaded">
        <header class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              class="text-xs font-black uppercase tracking-[.3em] text-warning"
            >
              An illustrated gamebook · Early preview
            </p>
            <h2
              class="mt-1 font-serif text-2xl font-black tracking-wide sm:text-4xl"
            >
              ZUZU <span class="text-warning">/</span> KOALA ASSASSIN
            </h2>
            <p class="mt-1 text-sm opacity-70">The Bell That Never Rang</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              :aria-expanded="showSheet"
              aria-controls="zuzu-sheet"
              @click="showSheet = !showSheet"
            >
              <icon name="kind-icon:book-open" class="mr-1 size-4" /> Character
              sheet
            </button>
            <button type="button" class="btn btn-ghost btn-sm" @click="restart">
              New journey
            </button>
          </div>
        </header>

        <div
          class="grid items-start gap-6"
          :class="showSheet ? 'xl:grid-cols-[minmax(0,1fr)_20rem]' : ''"
        >
          <article class="min-w-0">
            <div
              class="relative isolate aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-warning/20 bg-stone-950 shadow-2xl sm:aspect-[16/9]"
            >
              <img
                :src="artSrc"
                class="absolute inset-0 size-full object-cover"
                :alt="'Illustrated concept view of ' + current.title"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/35"
              />
              <div
                class="absolute left-4 top-4 rounded-md border border-white/25 bg-black/65 px-3 py-2 text-[10px] font-bold uppercase tracking-[.25em] text-amber-100 sm:left-7 sm:top-6"
              >
                {{ current.chapter }}
              </div>
              <div
                class="absolute right-4 top-4 flex items-center gap-2 rounded-md bg-black/65 px-3 py-2 text-xs font-bold sm:right-7 sm:top-6"
                aria-label="Resources"
              >
                <span class="text-rose-300">♥ {{ store.run.health }}/12</span>
                <span class="opacity-40">·</span>
                <span class="text-sky-300">✦ {{ store.run.resolve }}/4</span>
              </div>
              <div class="absolute inset-x-4 bottom-5 sm:inset-x-8 sm:bottom-7">
                <p class="text-xs uppercase tracking-[.28em] text-amber-300">
                  Section
                  {{ String(store.run.visited.length).padStart(3, '0') }}
                </p>
                <h2
                  class="mt-1 max-w-3xl font-serif text-3xl font-black leading-tight text-white drop-shadow-xl sm:text-5xl"
                >
                  {{ current.title }}
                </h2>
              </div>
            </div>
            <div
              class="relative z-10 mx-2 -mt-1 rounded-b-[1.5rem] border border-warning/20 bg-base-200 px-5 pb-6 pt-7 shadow-xl sm:mx-5 sm:px-10 sm:pb-10"
            >
              <p
                class="max-w-3xl font-serif text-lg leading-[1.85] text-base-content sm:text-[1.35rem]"
              >
                {{ current.text }}
              </p>

              <section
                v-if="store.run.lastRoll"
                class="mt-6 border-y border-base-content/15 py-4"
                aria-live="polite"
                aria-label="Last dice result"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p
                      class="text-xs font-black uppercase tracking-[.22em] opacity-65"
                    >
                      {{ store.run.lastRoll.label }} CHECK
                    </p>
                    <p class="mt-1 text-sm">
                      <strong>{{ store.run.lastRoll.total }}</strong> vs
                      {{ store.run.lastRoll.target }} ·
                      <span
                        :class="
                          store.run.lastRoll.success
                            ? 'text-success'
                            : 'text-error'
                        "
                        >{{
                          store.run.lastRoll.success ? 'SUCCESS' : 'SETBACK'
                        }}</span
                      >
                    </p>
                  </div>
                  <div
                    :key="store.rollSerial"
                    class="flex items-center gap-2"
                    aria-hidden="true"
                  >
                    <span
                      v-for="(die, index) of store.run.lastRoll.dice"
                      :key="index"
                      class="zuzu-die grid size-12 place-items-center rounded-lg border-2 border-amber-900 bg-amber-100 font-serif text-2xl font-black text-stone-900 shadow-lg"
                      >{{ die }}</span
                    >
                    <span class="ml-2 text-sm opacity-70"
                      >+ {{ store.run.lastRoll.modifier }}</span
                    >
                  </div>
                </div>
              </section>

              <div
                v-if="current.battle && store.run.battle"
                class="mt-7 rounded-xl border border-error/30 bg-base-300 p-4 sm:p-6"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-xs uppercase tracking-[.2em] opacity-60">
                      CONFRONTATION · ROUND {{ store.run.battle.turn }}
                    </p>
                    <h3 class="font-serif text-xl font-bold">
                      {{ current.battle.name }}
                    </h3>
                  </div>
                  <span class="text-sm font-bold text-error"
                    >Foe HP {{ store.run.battle.hp }}/{{
                      current.battle.hp
                    }}</span
                  >
                </div>
                <progress
                  class="progress progress-error mt-3 w-full"
                  :value="store.run.battle.hp"
                  :max="current.battle.hp"
                  aria-label="Enemy health"
                />
                <p class="mt-3 text-sm opacity-80" aria-live="polite">
                  {{ store.run.battle.log }}
                </p>
                <p class="mt-3 text-sm font-semibold text-warning">
                  The foe circles and prepares to strike. Choose your approach.
                </p>
                <div class="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    v-for="move in moves"
                    :key="move.action"
                    type="button"
                    class="group rounded-xl border border-base-content/20 bg-base-100 p-3 text-left transition hover:border-warning hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning"
                    :disabled="
                      move.action === 'quiet-draw' && store.run.resolve < 2
                    "
                    @click="store.battle(move.action)"
                  >
                    <strong class="block text-base">{{ move.label }}</strong
                    ><span class="mt-1 block text-xs opacity-65">{{
                      move.help
                    }}</span>
                  </button>
                </div>
              </div>
              <template v-else-if="current.ending">
                <div
                  class="mt-7 rounded-xl border border-warning/30 bg-warning/10 p-5"
                >
                  <p
                    class="text-xs font-black uppercase tracking-[.2em] text-warning"
                  >
                    {{ current.ending }} ending discovered
                  </p>
                  <p class="mt-2 font-serif text-lg">
                    One story ends. Others are hidden in the dust.
                  </p>
                  <p class="mt-2 text-sm opacity-75">
                    Found {{ store.discovered.length }} of 6 preview endings.
                  </p>
                  <button
                    class="btn btn-warning mt-4"
                    type="button"
                    @click="restart"
                  >
                    Walk another road
                  </button>
                </div>
              </template>
              <section v-else class="mt-8" aria-label="Story choices">
                <h3
                  class="mb-4 text-xs font-black uppercase tracking-[.26em] opacity-65"
                >
                  What will Zuzu do?
                </h3>
                <div class="grid gap-3">
                  <button
                    v-for="(choice, index) in current.choices"
                    :key="choice.id"
                    type="button"
                    :disabled="!allowed(choice)"
                    class="group flex min-h-16 items-center gap-4 rounded-xl border border-base-content/20 bg-base-100 px-4 py-4 text-left transition hover:border-warning hover:bg-base-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning disabled:cursor-not-allowed disabled:opacity-45"
                    @click="store.choose(choice.id)"
                  >
                    <span
                      class="grid size-9 shrink-0 place-items-center rounded-lg border border-warning/50 font-serif font-bold text-warning"
                      >{{ index + 1 }}</span
                    >
                    <span class="flex-1"
                      ><span class="block font-semibold leading-snug">{{
                        choice.label
                      }}</span
                      ><span
                        v-if="!allowed(choice)"
                        class="mt-1 block text-xs opacity-75"
                        >{{
                          choice.requires
                            ? 'Requires: ' + choice.requires
                            : 'Not enough Resolve'
                        }}</span
                      ></span
                    >
                    <icon
                      name="kind-icon:arrow-right"
                      class="size-4 shrink-0 opacity-35 group-hover:opacity-100"
                    />
                  </button>
                </div>
              </section>
            </div>
            <p class="mx-5 mt-4 text-xs opacity-55">
              Preview art is original vector concept scenery. Conductor agents
              are producing scene-specific generated illustrations; no art
              delivery is claimed yet.
            </p>
          </article>

          <aside
            v-if="showSheet"
            id="zuzu-sheet"
            class="rounded-2xl border border-warning/25 bg-base-200 p-5 shadow-xl xl:sticky xl:top-5"
          >
            <div class="flex items-center justify-between">
              <h2 class="font-serif text-2xl font-bold">The Wanderer</h2>
              <button
                class="btn btn-ghost btn-xs"
                type="button"
                aria-label="Close character sheet"
                @click="showSheet = false"
              >
                ✕
              </button>
            </div>
            <p class="mt-2 text-sm opacity-70">
              Zuzu · Koala ronin · Road of Dust
            </p>
            <div class="mt-6 grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-base-300 p-3">
                <p class="text-xs opacity-60">Health</p>
                <p class="text-xl font-black text-rose-400">
                  {{ store.run.health }} / 12
                </p>
              </div>
              <div class="rounded-lg bg-base-300 p-3">
                <p class="text-xs opacity-60">Resolve</p>
                <p class="text-xl font-black text-sky-400">
                  {{ store.run.resolve }} / 4
                </p>
              </div>
            </div>
            <h3
              class="mt-6 text-xs font-bold uppercase tracking-[.22em] opacity-60"
            >
              Attributes
            </h3>
            <dl class="mt-3 space-y-2 text-sm">
              <div
                v-for="(value, attribute) of store.run.attributes"
                :key="attribute"
                class="flex justify-between border-b border-base-content/10 pb-2"
              >
                <dt class="capitalize">{{ attribute }}</dt>
                <dd class="font-bold">+{{ value }}</dd>
              </div>
            </dl>
            <h3
              class="mt-6 text-xs font-bold uppercase tracking-[.22em] opacity-60"
            >
              Equipment and pack
            </h3>
            <p class="mt-2 text-xs opacity-70">Kasa · Poncho · Katana (worn)</p>
            <ul class="mt-3 space-y-2 text-sm">
              <li
                v-for="(item, i) of store.run.items"
                :key="item + i"
                class="rounded-md border border-base-content/15 p-2 capitalize"
              >
                ◆ {{ item }}
              </li>
              <li
                v-for="slot in Math.max(0, 5 - store.run.items.length)"
                :key="'empty' + slot"
                class="rounded-md border border-dashed border-base-content/15 p-2 opacity-35"
              >
                Empty slot
              </li>
            </ul>
            <h3
              class="mt-6 text-xs font-bold uppercase tracking-[.22em] opacity-60"
            >
              Special arts
            </h3>
            <ul class="mt-2 space-y-2 text-sm">
              <li>
                <strong>Still Wind</strong> · +2 to a Sense/Shadow check
                (planned)
              </li>
              <li><strong>Quiet Draw</strong> · powerful strike, 2 Resolve</li>
              <li>
                <strong>Last Kindness</strong> · protect an ally (planned)
              </li>
            </ul>
            <h3
              class="mt-6 text-xs font-bold uppercase tracking-[.22em] opacity-60"
            >
              Journal
            </h3>
            <p class="mt-2 text-sm">
              {{
                store.run.flags.length
                  ? store.run.flags
                      .map((flag) => flag.replace(/-/g, ' '))
                      .join(' · ')
                  : 'The road has not yet left its marks.'
              }}
            </p>
            <p class="mt-4 text-xs opacity-60">
              Sections travelled: {{ store.run.visited.length }} · Endings
              discovered: {{ store.discovered.length }}
            </p>
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  scene,
  type Choice,
  type BattleAction,
} from '~/utils/zuzuGamebook/adventure'
import { useZuzuGamebookStore } from '~/stores/zuzuGamebookStore'
import { useUserStore } from '~/stores/userStore'

const store = useZuzuGamebookStore()
const userStore = useUserStore()
const showSheet = ref(false)
const current = computed(() => scene(store.run.sceneId))
const artSrc = computed(
  () => '/zuzu-gamebook/scenes/' + current.value.art + '.svg',
)
const moves: { action: BattleAction; label: string; help: string }[] = [
  {
    action: 'strike',
    label: '⚔ Strike',
    help: 'Steel check · 3 damage on a hit',
  },
  {
    action: 'guard',
    label: '◈ Guard',
    help: 'Sense check · prevent the counterblow',
  },
  {
    action: 'feint',
    label: '↝ Feint',
    help: 'Shadow check · expose defenses, 1 damage',
  },
  {
    action: 'quiet-draw',
    label: '✦ Quiet Draw',
    help: '2 Resolve · 6 damage on a hit',
  },
]
function allowed(choice: Choice) {
  return (
    (!choice.requires || store.run.items.includes(choice.requires)) &&
    (!choice.cost || store.run.resolve >= choice.cost)
  )
}
function restart() {
  if (
    window.confirm(
      'Start a new journey? The current route is replaced, but discovered endings stay in your ledger.',
    )
  )
    store.restart()
}
onMounted(() => store.load())
useHead({ title: 'Zuzu: Koala Assassin · The Bell That Never Rang' })
</script>

<style scoped>
.zuzu-die {
  animation: zuzu-roll 0.55s cubic-bezier(0.14, 0.74, 0.36, 1.25) both;
  transform-origin: 50% 50%;
}
.zuzu-die:nth-child(2) {
  animation-delay: 0.08s;
}
@keyframes zuzu-roll {
  0% {
    transform: translateY(-23px) rotate(-110deg) scale(0.65);
    opacity: 0.25;
  }
  65% {
    transform: translateY(5px) rotate(12deg) scale(1.12);
    opacity: 1;
  }
  100% {
    transform: translateY(0) rotate(0) scale(1);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .zuzu-die {
    animation: none;
  }
}
</style>
