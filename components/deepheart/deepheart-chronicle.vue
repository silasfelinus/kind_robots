<template>
  <section
    class="dh-chronicle"
    data-testid="dh-chronicle"
    :aria-label="saves ? 'Save slots' : 'Chronicle'"
  >
    <div class="kr-toolbar flex-wrap gap-2 px-1 pb-2">
      <div class="join" role="tablist">
        <button
          type="button"
          role="tab"
          class="btn btn-sm join-item"
          :class="!saves ? 'btn-primary' : 'btn-ghost'"
          :aria-selected="!saves"
          @click="dh.screen = 'chronicle'"
        >
          Chronicle
        </button>
        <button
          type="button"
          role="tab"
          class="btn btn-sm join-item"
          :class="saves ? 'btn-primary' : 'btn-ghost'"
          :aria-selected="saves"
          data-testid="dh-saves-tab"
          @click="dh.screen = 'saves'"
        >
          Saves
        </button>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm ml-auto rounded-2xl"
        @click="dh.screen = dh.run && !dh.run.ending ? 'delve' : 'title'"
      >
        {{ dh.run && !dh.run.ending ? 'Back to the delve' : 'Back' }}
      </button>
    </div>

    <div v-if="saves" class="dh-chronicle-body kr-scroll">
      <div class="dh-slots">
        <article
          v-for="(slot, i) in allSlots"
          :key="i"
          class="dh-slot-card"
          :data-testid="`dh-slot-${slot.id}`"
        >
          <p class="pf-display text-primary">
            {{ slot.id === 'auto' ? 'Autosave' : `Slot ${slot.id}` }}
          </p>
          <template v-if="slot.entry">
            <div class="flex gap-1">
              <DeepheartPortrait
                v-for="id in [
                  slot.entry.run.hero.presetId,
                  ...slot.entry.run.companions,
                ]"
                :id="id"
                :key="id"
                :name="
                  id === slot.entry.run.hero.presetId
                    ? slot.entry.run.hero.name
                    : undefined
                "
                :custom-role="slot.entry.run.hero.custom?.role"
                size="xs"
                class="w-9"
              />
            </div>
            <p class="text-sm">{{ slot.entry.label }}</p>
            <p class="text-xs opacity-70">
              {{ new Date(slot.entry.savedAt).toLocaleString() }}
            </p>
          </template>
          <p v-else class="text-sm opacity-60">Empty</p>
          <div class="flex flex-wrap gap-1">
            <button
              v-if="slot.id !== 'auto' && dh.run && !dh.run.ending"
              type="button"
              class="btn btn-primary btn-xs rounded-2xl"
              :data-testid="`dh-save-${slot.id}`"
              @click="dh.saveTo(slot.id as number)"
            >
              Save here
            </button>
            <button
              v-if="slot.entry && !slot.entry.run.ending"
              type="button"
              class="btn btn-secondary btn-xs rounded-2xl"
              :data-testid="`dh-load-${slot.id}`"
              @click="dh.loadFrom(slot.id)"
            >
              Load
            </button>
            <button
              v-if="slot.entry && slot.id !== 'auto'"
              type="button"
              class="btn btn-ghost btn-xs rounded-2xl"
              @click="dh.deleteSlot(slot.id)"
            >
              Delete
            </button>
          </div>
        </article>
      </div>
    </div>

    <div v-else class="dh-chronicle-body kr-scroll">
      <h2 class="pf-display text-lg text-primary">
        Delvers met
        <span class="text-sm opacity-70">{{ metCount(dh.chronicle) }}</span>
      </h2>
      <div class="dh-met">
        <DeepheartPortrait
          v-for="c in CHARACTERS"
          :id="c.id"
          :key="c.id"
          size="xs"
          :dim="!dh.chronicle.met.includes(c.id)"
          :caption="dh.chronicle.met.includes(c.id)"
          :name="dh.chronicle.met.includes(c.id) ? shortName(c) : '???'"
        />
      </div>

      <h2 class="pf-display text-lg text-primary">
        Endings
        <span class="text-sm opacity-70"
          >{{ dh.chronicle.endings.length }} of
          {{ ALL_ENDINGS.length }} found</span
        >
      </h2>
      <ul class="flex flex-wrap gap-1">
        <li
          v-for="e in ALL_ENDINGS"
          :key="e"
          class="badge"
          :class="
            dh.chronicle.endings.includes(e)
              ? 'badge-primary'
              : 'badge-ghost opacity-50'
          "
        >
          {{
            dh.chronicle.endings.includes(e) ? ENDING_TEXT[e].title : 'Locked'
          }}
        </li>
      </ul>

      <h2 class="pf-display text-lg text-primary">
        Support scenes
        <span class="text-sm opacity-70"
          >{{ dh.chronicle.supports.length }} of
          {{ SUPPORTS.length }} found</span
        >
      </h2>

      <h2 class="pf-display text-lg text-primary">
        Delves
        <span class="text-sm opacity-70"
          >{{ dh.chronicle.runs.length }} finished ·
          {{ dh.chronicle.puzzles }} puzzles solved</span
        >
      </h2>
      <ol class="dh-pages">
        <li v-for="page in dh.chronicle.runs" :key="page.id" class="dh-page">
          <div class="flex gap-1">
            <DeepheartPortrait
              v-for="id in [page.hero.presetId, ...page.companions]"
              :id="id"
              :key="id"
              :name="id === page.hero.presetId ? page.hero.name : undefined"
              :custom-role="page.hero.custom?.role"
              size="xs"
              class="w-9"
            />
          </div>
          <div class="min-w-0">
            <p class="font-bold">{{ ENDING_TEXT[page.ending].title }}</p>
            <p class="text-xs opacity-75">
              {{
                page.hero.name ||
                (page.hero.custom
                  ? 'Custom delver'
                  : character(page.hero.presetId).name)
              }}
              with
              {{
                page.companions.map((id) => shortName(character(id))).join(', ')
              }}
              · {{ LAYERS[page.layer]?.name }} · {{ page.fights }} fights ·
              {{ page.gold }} gold
            </p>
            <p
              v-if="page.partners.length && dh.romanceOn"
              class="text-xs text-secondary"
            >
              ♥
              {{
                page.partners
                  .map((id) => shortName(character(id)))
                  .join(' and ')
              }}
            </p>
            <p v-if="page.choices.length" class="text-xs opacity-60">
              {{ page.choices.length }} choices made
            </p>
          </div>
        </li>
        <li v-if="!dh.chronicle.runs.length" class="text-sm opacity-60">
          Finish a delve and its page appears here.
        </li>
      </ol>

      <div class="mt-4 flex items-center gap-2">
        <button
          v-if="!confirmReset"
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl text-error"
          @click="confirmReset = true"
        >
          Reset chronicle
        </button>
        <template v-else>
          <span class="text-xs">Erase every page, ending and delver met?</span>
          <button
            type="button"
            class="btn btn-error btn-xs rounded-2xl"
            @click="reset()"
          >
            Erase
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-2xl"
            @click="confirmReset = false"
          >
            Keep
          </button>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDeepheartStore } from '~/stores/deepheartStore'
import { ALL_ENDINGS } from '~/utils/deepheart/achievements'
import { metCount } from '~/utils/deepheart/chronicle'
import { ENDING_TEXT, LAYERS } from '~/utils/deepheart/dungeon'
import {
  CHARACTERS,
  SUPPORTS,
  character,
  shortName,
} from '~/utils/deepheart/roster'

const dh = useDeepheartStore()
const saves = computed(() => dh.screen === 'saves')
const confirmReset = ref(false)

const allSlots = computed(() => [
  { id: 'auto' as const, entry: dh.autosave },
  ...dh.slots.map((entry, i) => ({ id: i + 1, entry })),
])

function reset() {
  dh.resetChronicle()
  confirmReset.value = false
}
</script>

<style scoped>
.dh-chronicle {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}
.dh-chronicle-body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.6rem;
  overflow-y: auto;
  padding: 0.25rem;
}
.dh-met {
  display: grid;
  gap: 0.35rem;
  grid-template-columns: repeat(auto-fill, minmax(3.75rem, 1fr));
}
.dh-slots {
  display: grid;
  gap: 0.6rem;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
}
.dh-slot-card,
.dh-page {
  display: grid;
  gap: 0.35rem;
  border-radius: var(--radius-box);
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklch, var(--color-base-200) 85%, transparent);
  padding: 0.6rem;
}
.dh-pages {
  display: grid;
  gap: 0.4rem;
}
.dh-page {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}
</style>
