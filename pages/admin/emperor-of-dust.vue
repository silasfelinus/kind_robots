<template>
  <main class="kr-surface">
    <div v-if="!user.initialized" class="grid min-h-96 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div
      v-else-if="!user.isAdmin"
      class="kr-note kr-note-error mx-auto max-w-xl p-8 text-center"
    >
      The Emperor's strategy chamber is private.
    </div>
    <div v-else class="kr-scroll mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-6">
      <header
        class="rounded-3xl border border-warning/30 bg-base-300 p-6 sm:p-10"
      >
        <p class="text-xs font-bold uppercase tracking-widest text-warning">
          Private Zuzu-world prequel workshop
        </p>
        <h2 class="font-serif text-4xl font-black sm:text-6xl">
          Emperor of Dust
        </h2>
        <p class="font-serif text-2xl italic text-warning">One Hundred Days</p>
        <p class="mt-3 max-w-2xl">
          Before Zuzu reached Hollow Bell, a small empire ruled the roads. One
          hundred mornings. Too many petitions. Never enough good hands.
        </p>
        <p class="mt-4 text-sm font-semibold text-warning">
          Illustrated concept preview only. No playable campaign yet.
        </p>
      </header>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-2xl border border-base-content/15 bg-base-200 p-4"
        >
          <p class="text-xs uppercase tracking-widest opacity-70">
            {{ stat.label }}
          </p>
          <strong class="font-serif text-2xl">{{ stat.value }}</strong>
        </div>
      </div>
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <section
          class="overflow-hidden rounded-3xl border border-base-content/20 bg-base-200"
        >
          <h2 class="p-5 font-serif text-2xl font-bold">The imperial survey</h2>
          <div
            class="relative mx-3 min-h-[430px] overflow-hidden rounded-2xl border-4 border-amber-900/40 bg-[radial-gradient(ellipse_at_65%_30%,#e3d1a0,transparent_60%),linear-gradient(140deg,#5c7168,#bba074_45%,#946b55_78%,#554b46)] sm:min-h-[550px]"
          >
            <div
              class="absolute -left-20 top-0 h-64 w-80 rotate-[-20deg] rounded-full bg-[#536e67]/50 blur-lg"
            />
            <div
              class="absolute right-0 top-0 h-48 w-44 rounded-full bg-[#556f65]/60 blur-lg"
            />
            <div
              class="absolute -bottom-14 left-8 h-64 w-64 rounded-full bg-[#a0694d]/70 blur-xl"
            />
            <div
              class="absolute left-[40%] top-[-15%] h-[125%] w-[8%] rotate-[-16deg] rounded-full bg-[#7e9c9e]/65 blur-md"
            />
            <div
              class="absolute inset-x-12 top-[55%] rotate-[-11deg] border-t-4 border-dashed border-[#624831]/70"
            />
            <p
              class="absolute left-4 top-4 font-serif text-xl font-bold text-[#352a24]"
            >
              The Emperor's Domain
            </p>
            <button
              v-for="region in regions"
              :key="region.name"
              type="button"
              :style="{ left: region.x, top: region.y }"
              :aria-pressed="selected.name === region.name"
              class="absolute z-10 max-w-[37%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-2 py-2 text-xs font-black shadow-md hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary sm:px-3 sm:text-sm"
              :class="
                selected.name === region.name
                  ? 'border-amber-300 bg-[#392e29] text-amber-100'
                  : 'border-[#81613c] bg-[#eed4a2] text-[#392d23]'
              "
              @click="selected = region"
            >
              {{ region.name }}
            </button>
            <p
              class="absolute bottom-2 right-2 rounded bg-[#3b2f28]/80 px-2 py-1 text-xs text-amber-100"
            >
              Concept · not to scale
            </p>
          </div>
          <p class="p-5 text-sm opacity-75">
            Select a district for its story. This painted relief is a layout
            sketch, not a functioning dispatch map.
          </p>
        </section>
        <aside class="space-y-4">
          <section class="kr-panel space-y-3 p-5">
            <p class="text-xs uppercase tracking-widest text-warning">
              Selected district
            </p>
            <h3 class="font-serif text-2xl font-bold">{{ selected.name }}</h3>
            <p class="text-sm leading-relaxed">{{ selected.description }}</p>
            <p class="text-sm font-bold text-warning">{{ selected.faction }}</p>
          </section>
          <section class="kr-panel space-y-3 p-5">
            <h3 class="font-serif text-xl font-bold">The emperor's docket</h3>
            <p class="text-sm leading-relaxed">
              Each of 100 authored days will offer simultaneous problems. Choose
              zero to three available followers for each incident. Supplies,
              timing, hard decisions, injuries and faction wars all have
              consequences.
            </p>
            <p class="text-sm">
              <strong>Prosperity</strong> funds recruits.
              <strong>Popularity</strong> records the realm's trust. The
              consumable <strong>Support Hoard</strong> helps uncertain
              missions. Poor outcomes can open secret routes back into the
              story.
            </p>
            <a
              href="https://github.com/silasfelinus/conductor/blob/main/projects/emperor-of-dust/GAME-BIBLE.md"
              class="link link-primary block text-sm"
              target="_blank"
              rel="noopener noreferrer"
              >Read the complete game bible ↗</a
            >
            <a
              href="https://github.com/silasfelinus/conductor/blob/main/projects/emperor-of-dust/DAY-PLAN.md"
              class="link link-primary block text-sm"
              target="_blank"
              rel="noopener noreferrer"
              >Read the 100-day narrative calendar ↗</a
            >
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/userStore'
const user = useUserStore()
const stats = [
  { label: 'Campaign', value: '100 days' },
  { label: 'Initial court', value: '5 followers' },
  { label: 'Dispatch', value: '0–3 helpers' },
  { label: 'Progress', value: 'Concept' },
]
const regions = [
  {
    name: 'Imperial Keep',
    x: '54%',
    y: '54%',
    faction: 'Imperial court',
    description:
      'A patched-together palace overlooks the only reliable market. Young Komodo has a great deal to say about what things cost.',
  },
  {
    name: 'Hollow Bell',
    x: '79%',
    y: '43%',
    faction: 'Hollow Bell Council',
    description:
      'A frontier village held together by a personable mayor who measures every promise against the next drought.',
  },
  {
    name: 'Storm Crow Heights',
    x: '22%',
    y: '29%',
    faction: 'Storm Crow Conclave',
    description:
      'Magic brings rain to thirsty farms. Payment for that magic is often hidden inside the bargain.',
  },
  {
    name: 'Jackalwire Canyon',
    x: '25%',
    y: '78%',
    faction: 'Jackalwire Pack',
    description:
      'Painted wagons and riotous punk hyena raiders. Their crews are as unruly with each other as they are with the crown.',
  },
  {
    name: 'Mirefen',
    x: '76%',
    y: '19%',
    faction: 'Mire Mothers',
    description:
      'The swamp witches plead for protection from real raiders. Their leaders have very different plans.',
  },
  {
    name: 'Saltroad',
    x: '64%',
    y: '83%',
    faction: 'Saltroad Caravans',
    description:
      'Medicine, food and news arrive by caravan. A merchant can save a village or profit from its desperation.',
  },
]
const selected = ref(regions[0]!)
onMounted(async () => {
  await user.initialize()
})
</script>
