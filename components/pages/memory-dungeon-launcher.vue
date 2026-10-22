<template>
  <div
    class="kr-stage relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#161d22] text-[#ffedd3]"
  >
    <img
      src="/images/background/memorydungeon.webp"
      alt=""
      class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-75"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-linear-to-r from-[#0e191a]/95 via-[#172a26]/80 to-[#111a22]/60"
    ></div>
    <div
      class="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center p-2 sm:p-5"
    >
      <div
        class="flex w-full max-w-6xl min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#b79c6d]/60 bg-[#101f20]/75 shadow-2xl backdrop-blur-md lg:flex-row"
      >
        <section
          class="relative flex shrink-0 flex-col justify-end overflow-hidden border-b border-[#b79c6d]/40 p-4 lg:w-[37%] lg:border-b-0 lg:border-r lg:p-7"
        >
          <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#647a52,transparent_55%)] opacity-50"
          ></div>
          <img
            src="/memory-dungeon/briar-camp.svg"
            alt=""
            class="absolute inset-0 h-full w-full object-cover opacity-65"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-[#10201e] via-[#10201e]/60 to-transparent"
          ></div>
          <div class="relative z-10 flex flex-col items-start">
            <span
              class="rounded-lg border border-[#d4b974]/60 bg-[#1b302b]/85 px-3 py-1 text-[11px] font-bold tracking-widest text-[#f9e5b2]"
              >A NEW MEMORY ADVENTURE</span
            >
            <h2
              class="mt-3 font-serif text-4xl font-black tracking-tight text-[#fff4d8] sm:text-5xl lg:text-6xl"
            >
              Memory<br />Dungeon
            </h2>
            <p class="mt-2 max-w-sm text-sm text-[#f0ddb8]">
              One lantern. A forest full of secrets. Every image has a story to
              remember.
            </p>
            <p class="mt-2 text-xs font-semibold text-[#e5c98b]">
              🌿 Briar Camp · 64 hidden squares · Rootbound Vault
            </p>
          </div>
        </section>
        <section
          class="kr-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-3 sm:gap-4 sm:p-5 lg:p-7"
        >
          <div class="shrink-0">
            <p
              class="text-xs font-bold uppercase tracking-[.18em] text-[#d9be8e]"
            >
              Choose your memory magic
            </p>
            <h2 class="font-serif text-xl font-bold sm:text-2xl">
              Whose pictures fill Briar Camp?
            </h2>
          </div>
          <memory-dungeon-deck-selector
            :selected="world.deck"
            :mature-available="world.matureAvailable"
            @change="world.selectDeck"
          />
          <div class="mt-auto grid shrink-0 gap-2 pt-2 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              class="rounded-xl border-2 border-[#efdcaa] bg-[#b9d88d] px-4 py-3 text-sm font-black text-[#202b23] shadow-lg transition hover:bg-[#d4ecaa] sm:text-lg"
              @click="emit('explore')"
            >
              🌿 Enter Briar Camp
            </button>
            <button
              type="button"
              class="rounded-xl border-2 border-[#bba073] bg-[#293735]/95 px-4 py-3 text-sm font-bold text-[#fff1d1] hover:bg-[#425347]"
              @click="emit('classic')"
            >
              🃏 Classic Match
            </button>
          </div>
          <p class="shrink-0 text-center text-[11px] text-[#d8c39b]">
            Your deck choice applies to Briar Camp. Classic Match retains its
            original gallery controls. Progress autosaves in this browser.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import MemoryDungeonDeckSelector from '~/components/memory-dungeon/deck-selector.vue'
const emit = defineEmits<{ explore: []; classic: [] }>()
const world = useMemoryWorldStore()
onMounted(() => world.hydrate())
</script>
