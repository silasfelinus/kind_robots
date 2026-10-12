<template>
  <main class="kr-surface">
    <div v-if="!user.initialized" class="grid min-h-96 place-items-center"><span class="kr-spinner-lg-primary" /></div>
    <div v-else-if="!user.isAdmin" class="kr-note kr-note-error mx-auto mt-12 max-w-xl p-8 text-center">The Stardrain adventure is in its private workshop.</div>
    <div v-else class="kr-scroll mx-auto max-w-[1500px] space-y-6 px-3 py-5 sm:px-6">
      <section class="relative isolate overflow-hidden rounded-[2rem] border border-amber-200/40 bg-[#194f62] text-[#fff8e5] shadow-xl" aria-label="Save the Plumber introduction">
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div class="absolute -right-16 top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-amber-300/35 blur-3xl" />
          <div class="absolute bottom-0 left-0 h-56 w-96 rounded-full bg-emerald-300/25 blur-3xl" />
          <svg viewBox="0 0 800 370" class="absolute bottom-0 right-0 h-full w-full max-w-[800px]" xmlns="http://www.w3.org/2000/svg">
            <path d="M365 320v-106q0-44 44-44h84v-60q0-39 39-39h91" stroke="#7cc8c6" stroke-width="42" fill="none"/>
            <path d="M365 320v-106q0-44 44-44h84v-60q0-39 39-39h91" stroke="#dcf7e1" stroke-width="6" fill="none"/>
            <g fill="#f9bf79" stroke="#fdf0c0" stroke-width="5"><circle cx="624" cy="69" r="32"/><path d="M624 32v-21m0 116v-21M588 69h-20m112 0h-19"/></g>
            <g transform="translate(545 233)"><path d="m-31 36 17-64 29-6 22 76" fill="#ed8270" stroke="#ffd4a3" stroke-width="5"/><path d="M-13-25q-15-24 4-37 28-14 39 14l-7 31" fill="#523d53"/><circle cx="8" cy="-27" r="25" fill="#d8a47c"/><path d="M-15-38q9-36 30-27 29 4 25 39" fill="#4b3450"/><path d="M-15-2h45v49h-45Z" fill="#69bfc0"/><path d="M-25 46h22v21h-22Zm31 0h21v21H6Z" fill="#313e50"/><path d="m37 15 37-14 14 12-48 17" fill="#ffd59a"/></g>
            <g fill="#e8cb94"><rect x="260" y="328" width="150" height="26" rx="5"/><rect x="430" y="328" width="155" height="26" rx="5"/><rect x="600" y="328" width="165" height="26" rx="5"/></g>
            <path d="M300 318c30-42 58-33 90-60" stroke="#86e4df" stroke-width="8" stroke-linecap="round" stroke-dasharray="6 19" fill="none"/>
          </svg>
        </div>
        <div class="relative flex min-h-[340px] flex-col justify-center gap-4 px-6 py-12 sm:px-10">
          <p class="w-fit rounded-full border border-amber-100/30 bg-[#0e4255]/70 px-4 py-1 text-xs font-bold uppercase tracking-[.22em] text-amber-100">Private Arcade adventure workshop</p>
          <h2 class="max-w-xl font-black leading-[.94] tracking-tight text-5xl sm:text-7xl">SAVE<br/><span class="text-[#ffcf92]">THE</span><br/>PLUMBER!</h2>
          <p class="max-w-[440px] text-sm leading-relaxed text-amber-50/90 sm:text-base">The pipes are running upward. Your boyfriend has vanished. Eight strange worlds, one fearless heroine, and a very badly behaved waterworks corporation.</p>
          <div class="flex flex-wrap gap-3"><a href="#plumber-demo" class="btn border-0 bg-[#f9d8a3] text-[#244b53] hover:bg-white">Try the movement lab ↓</a><a href="#plumber-map" class="btn border-white/40 bg-white/10 text-white hover:bg-white/20">Explore eight worlds</a></div>
          <p class="text-xs text-amber-100/80">Currently an original platforming-engine preview. The full campaign and randomized heroine creator are in production.</p>
        </div>
      </section>

      <section id="plumber-map" class="scroll-mt-8 space-y-3">
        <div class="flex flex-wrap items-end justify-between gap-2"><div><p class="text-xs font-bold uppercase tracking-widest text-secondary">The rescue itinerary</p><h3 class="text-2xl font-black">Eight worlds. Thirty-two stages.</h3></div><span class="badge badge-outline">Authored campaign blueprint</span></div>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article v-for="(world, index) in worlds" :key="world.name" class="overflow-hidden rounded-2xl border border-base-content/10 bg-base-200 shadow-sm">
            <div class="relative h-28 p-4" :style="{ background: world.gradient }"><span class="text-5xl">{{ world.symbol }}</span><span class="absolute right-4 top-3 rounded-full bg-black/30 px-2 py-1 text-xs font-bold text-white">WORLD {{ index + 1 }}</span></div>
            <div class="space-y-2 p-4"><h4 class="font-bold">{{ world.name }}</h4><p class="text-sm leading-relaxed opacity-75">{{ world.ability }}</p><p class="text-xs font-semibold text-secondary">4 stages · 1 boss</p></div>
          </article>
        </div>
      </section>

      <div id="plumber-demo" class="grid scroll-mt-8 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section class="min-w-0 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2"><div><p class="text-xs uppercase tracking-widest text-secondary">Prototype 1-1 / Bluebell Pipeworks</p><h3 class="text-2xl font-bold">Run, leap, rescue.</h3></div><span class="badge badge-outline">Movement lab</span></div>
          <ArcadeCabinet slug="save-the-plumber" />
        </section>
        <aside class="space-y-4" aria-label="Platforming notes">
          <section class="kr-panel space-y-3 p-5">
            <h3 class="text-xl font-bold">How to play this slice</h3>
            <p class="text-sm leading-relaxed opacity-80">Press Start on the Arcade cabinet. Arrows move; Up or B jumps. A uses your practice tool on nearby pumpbugs. Jump on bugs, collect brass tokens, and reach the pink pennant on the far right.</p>
            <p class="text-sm leading-relaxed opacity-80">Coyote-time and buffered jump inputs are included. Reaching the banner restarts the training course. This is not a claimed completion of World 1.</p>
          </section>
          <section class="kr-panel space-y-3 p-5"><h3 class="text-xl font-bold">The game's promises</h3>
            <ul class="list-disc space-y-2 pl-5 text-sm leading-relaxed opacity-80"><li>A different young adult heroine every new adventure, consistent for that save.</li><li>Eight distinct boss encounters, throw/carry interactions and secret passages.</li><li>Designed levels and delightful enemy behavior, never endless procedural tiles.</li><li>A proper rescue, payoff, illustrated ending and credits.</li></ul>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '~/stores/userStore'

const user = useUserStore()
const worlds = [
  { name: 'Bluebell Pipeworks', symbol: '🔧', ability: 'Garden valves, rising pistons and the Pump Tower.', gradient: 'linear-gradient(125deg,#188e99,#9ce4c9)' },
  { name: 'Tideglass Marina', symbol: '🐚', ability: 'Water currents, glass boats and the drydock.', gradient: 'linear-gradient(125deg,#2469b4,#96d9ed)' },
  { name: 'Lantern Orchard', symbol: '🏮', ability: 'Springfruit, fireflies and a hanging conservatory.', gradient: 'linear-gradient(125deg,#9b3a69,#efa26c)' },
  { name: 'Clockwork Fair', symbol: '🎠', ability: 'Conveyor parades, coasters and clockwork surprises.', gradient: 'linear-gradient(125deg,#a85b52,#efc784)' },
  { name: 'Cloudrail Commons', symbol: '☁️', ability: 'Wind corridors, ropeways and airships.', gradient: 'linear-gradient(125deg,#547ac9,#b8dceb)' },
  { name: 'Crystal Underworks', symbol: '💎', ability: 'Reflections, echoes and geode passages.', gradient: 'linear-gradient(125deg,#744a9e,#beafff)' },
  { name: 'Night Market Rooftops', symbol: '🌙', ability: 'Lantern chases and secret midnight trade routes.', gradient: 'linear-gradient(125deg,#392c7f,#a56b9f)' },
  { name: 'Stardrain Citadel', symbol: '🏰', ability: 'One final sky-pump and a hard-earned reunion.', gradient: 'linear-gradient(125deg,#263859,#dca15e)' },
]
onMounted(() => { void user.initialize() })
useHead({ title: 'Save the Plumber · Private Arcade' })
</script>
