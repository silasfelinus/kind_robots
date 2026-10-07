<template>
  <main class="kr-surface">
    <div class="kr-scroll kr-container max-w-6xl space-y-4 p-2 sm:p-4 lg:p-6">

      <div v-if="!ready" class="grid place-items-center p-12">
        <span class="kr-spinner-lg-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error p-8 text-center"
      >
        <p class="kr-text-black-xl">Administrator access required</p>
        <p class="kr-text-dim-sm mt-2">
          Zuzu Showdown is still in the workshop.
        </p>
      </div>

      <template v-else>
        <ZuzuShowdownStage />

        <section
          class="kr-panel flex flex-wrap gap-x-6 gap-y-3 rounded-2xl p-4"
        >
          <label class="flex items-center gap-2 text-sm">
            <span class="font-semibold">Opponent</span>
            <select
              class="kr-select-sm"
              :value="store.mode"
              aria-label="Opponent"
              @change="onMode"
            >
              <option value="dummy">Training dummy</option>
              <option value="versus">Player 2</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="store.easySpecials"
              @change="store.setEasySpecials(checked($event))"
            />
            Easy Specials
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="!store.muted"
              @change="store.setMuted(!checked($event))"
            />
            Sound
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="store.crt"
              @change="store.setCrt(checked($event))"
            />
            CRT lines
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="store.showBoxes"
              @change="store.setShowBoxes(checked($event))"
            />
            Hitboxes
          </label>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <div class="kr-panel rounded-2xl p-4 text-sm">
            <h2 class="mb-2 font-bold">Controls</h2>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt class="font-semibold">Player 1</dt>
              <dd>
                WASD (or arrows when solo) · U I punch · J K kick · Space dodge
                · O special · Enter pause
              </dd>
              <dt class="font-semibold">Player 2</dt>
              <dd>
                Arrows · numpad 4 5 punch · 1 2 kick · 0 dodge · 6 special
              </dd>
              <dt class="font-semibold">Gamepad</dt>
              <dd>X Y punch · A B kick · LB dodge · RB special</dd>
              <dt class="font-semibold">Throw</dt>
              <dd>LP + LK up close (press it back to tech)</dd>
              <dt class="font-semibold">Taunt</dt>
              <dd>Dodge + HK</dd>
            </dl>
          </div>
          <div class="kr-panel rounded-2xl p-4 text-sm">
            <h2 class="mb-2 font-bold">Stand-in moves</h2>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt class="font-semibold">↓↘→ + P</dt>
              <dd>Fireball</dd>
              <dt class="font-semibold">→↓↘ + P</dt>
              <dd>Rising uppercut (invincible start)</dd>
              <dt class="font-semibold">↓↙← + K</dt>
              <dd>Parry</dd>
              <dt class="font-semibold">360 + P</dt>
              <dd>Command grab</dd>
              <dt class="font-semibold">↓↘→ ↓↘→ + P</dt>
              <dd>Level 1 super (1 bar)</dd>
              <dt class="font-semibold">↓↙← ↓↙← + HP</dt>
              <dd>Showdown super (3 bars)</dd>
              <dt class="font-semibold">↓ + HK</dt>
              <dd>Launcher, then hold ↑ to chase into an air combo</dd>
            </dl>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useZuzuShowdownStore } from '~/stores/zuzuShowdownStore'

const userStore = useUserStore()
const store = useZuzuShowdownStore()
const ready = computed(() => userStore.initialized)

function checked(event: Event) {
  return (event.target as HTMLInputElement).checked
}

function onMode(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  store.setMode(value === 'versus' ? 'versus' : 'dummy')
}

useHead({ title: 'Zuzu Showdown' })
</script>
