<template>
  <main class="kr-surface">
    <div v-if="!user.initialized" class="grid min-h-96 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div v-else-if="!user.isAdmin" class="kr-note kr-note-error mx-auto mt-12 max-w-xl p-8 text-center">
      This starport is a private development preview.
    </div>
    <div v-else class="kr-scroll mx-auto max-w-[1500px] space-y-6 px-3 py-5 sm:px-6">
      <section class="relative isolate overflow-hidden rounded-[2rem] border border-pink-200/40 bg-[#251345] text-white shadow-2xl" aria-label="Rainbow Space Princess introduction">
        <div class="pointer-events-none absolute inset-0 opacity-90" aria-hidden="true">
          <div class="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-pink-400/45 blur-3xl" />
          <div class="absolute bottom-0 right-0 h-72 w-3/4 rounded-full bg-cyan-400/35 blur-3xl" />
          <div class="absolute -bottom-32 left-1/4 h-60 w-96 rounded-full bg-violet-500/50 blur-3xl" />
          <div class="princess-stars absolute inset-0" />
          <svg viewBox="0 0 700 340" class="absolute bottom-0 right-0 h-full w-full max-w-[810px] opacity-90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M670 30c-75 3-123 50-121 116 3 68 60 101 125 92" stroke="#F9E1FF" stroke-width="3" opacity=".45"/>
            <path d="M600 18c-68 36-103 100-79 157 24 55 88 64 172 53" stroke="#9BEFFD" stroke-width="2" opacity=".6"/>
            <g transform="translate(435 180)"><path d="M-96 0 24-26 97 0 24 26Z" fill="#FFD2EC" stroke="#FFFFFF" stroke-width="4"/><path d="M-45 0 22-18 69 0 22 18Z" fill="#8BE5EE"/><path d="m-64-4-37-37 75 33M-64 4l-37 37L-26 8" fill="#D698F2"/><ellipse cx="36" cy="0" rx="14" ry="8" fill="#FFFFFF"/><path d="M-97 0-143-12-131 0-143 12Z" fill="#F8D07F"/></g>
            <g transform="translate(612 70)" stroke="#F4BBF1" stroke-width="4"><ellipse rx="51" ry="26" fill="#744BB9"/><path d="M-28 18 0 59 22 19M-12 24-17 65M15 25 32 68"/></g>
            <g fill="#FDF5C2"><circle cx="316" cy="124" r="4"/><circle cx="356" cy="136" r="3"/><circle cx="395" cy="150" r="2"/></g>
          </svg>
        </div>
        <div class="relative flex min-h-[340px] flex-col justify-center gap-4 px-6 py-12 sm:px-10">
          <p class="w-fit rounded-full border border-pink-200/35 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[.22em] text-pink-100">Private Arcade flight deck · development preview</p>
          <h2 class="max-w-[660px] font-black leading-[.95] tracking-tight text-4xl sm:text-6xl lg:text-7xl">RAINBOW<br/><span class="text-pink-200">BULLET HELL</span><br/>SPACE PRINCESS</h2>
          <p class="max-w-[520px] text-sm leading-relaxed text-pink-50/90 sm:text-base">Four princess pilots. One luminous ocean in peril. Ocean-born starships, impossible colors, and enough firepower to make a nebula blush.</p>
          <div class="flex flex-wrap gap-3">
            <a href="#princess-flight" class="btn border-0 bg-pink-200 text-[#37204e] hover:bg-white">Enter flight simulator ↓</a>
            <a href="#princess-mission" class="btn border-white/40 bg-white/10 text-white hover:bg-white/20">Explore the mission</a>
          </div>
          <p class="text-xs text-pink-100/75">Pilot training only. Campaign, boss encounters and online co-op are still being built.</p>
        </div>
      </section>

      <div id="princess-mission" class="grid gap-4 lg:grid-cols-3">
        <article v-for="card in missionCards" :key="card.title" class="rounded-2xl border border-primary/20 bg-base-200 p-5 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-widest text-secondary">{{ card.kicker }}</p>
          <h3 class="mt-2 text-xl font-black">{{ card.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed opacity-80">{{ card.detail }}</p>
        </article>
      </div>

      <div id="princess-flight" class="grid scroll-mt-8 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section class="min-w-0 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div><p class="text-xs uppercase tracking-widest text-secondary">01 / Pinkwake Estuary</p><h3 class="text-2xl font-bold">The flight simulator</h3></div>
            <span class="badge badge-outline">Playable engine slice</span>
          </div>
          <ArcadeCabinet slug="rainbow-bullet-hell-space-princess" />
        </section>
        <aside class="space-y-4" aria-label="Flight notes">
          <section class="kr-panel space-y-3 p-5">
            <h3 class="text-xl font-bold">Flight school</h3>
            <p class="text-sm leading-relaxed opacity-80">Choose one to four pilots on the cabinet attract screen. Move with arrows or your assigned controls; hold A to fire. Your ship marker is numbered, so it reads through the spectacle. B restores a damaged practice shield.</p>
            <p class="text-sm leading-relaxed opacity-80">The simulator has moving marine scouts and live hit detection. It is not the eight-stage game yet, and scores are intentionally private.</p>
          </section>
          <section class="kr-panel space-y-3 p-5">
            <h3 class="text-xl font-bold">The full expedition</h3>
            <ol class="space-y-2 text-sm">
              <li v-for="(stage, index) in stages" :key="stage" class="flex gap-2"><span class="font-mono text-secondary">{{ String(index + 1).padStart(2, '0') }}</span>{{ stage }}</li>
            </ol>
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
const missionCards = [
  { kicker: '01 / Fight with grace', title: 'Fair, ferocious patterns', detail: 'Telegraphed attacks, real escape lanes and true precision hitboxes. Challenging should never mean invisible danger.' },
  { kicker: '02 / A sky full of sea life', title: 'Techno-oceanic armada', detail: 'Jellyfish cruisers, seahorse scouts, shrimp railguns, shark destroyers and a machine-whale finale.' },
  { kicker: '03 / Fly with friends', title: 'A four-pilot promise', detail: 'Simultaneous 1–4 player combat is the goal. Local pilots work in this engine preview; online rooms come later.' },
]
const stages = ['Pinkwake Estuary', 'Moonjelly Fields', 'Chromatic Trench', 'Rosefin Express', 'Blossom Wreckyard', 'Crown Reef', 'Glass Current', 'Eclipse Palace']
onMounted(() => { void user.initialize() })
useHead({ title: 'Rainbow Bullet Hell Space Princess · Private Arcade' })
</script>

<style scoped>
.princess-stars {
  background-image: radial-gradient(circle, #fff6 1px, transparent 2px), radial-gradient(circle, #99efff99 1px, transparent 2px);
  background-size: 49px 63px, 87px 77px;
  background-position: 0 0, 28px 15px;
}
</style>
