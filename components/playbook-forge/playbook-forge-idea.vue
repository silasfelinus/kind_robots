<template>
  <form
    class="kr-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-5 px-1 pb-2"
    @submit.prevent="submit"
  >
    <div class="grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <label class="flex flex-col gap-2">
        <span class="pf-kicker text-secondary">Title</span>
        <input
          v-model="title"
          data-nav
          data-autofocus
          maxlength="80"
          placeholder="Moon Laundry"
          class="pf-field pf-display text-2xl @3xl:text-4xl"
          autocomplete="off"
        />
      </label>
      <label class="flex flex-col gap-2">
        <span class="pf-kicker text-secondary">The idea, in plain words</span>
        <textarea
          v-model="idea"
          data-nav
          rows="3"
          maxlength="1200"
          placeholder="A laundromat on the moon where every lost sock is a portal, and the night manager has one week to close them all."
          class="pf-field resize-none text-base"
        />
      </label>
    </div>

    <fieldset class="flex flex-col gap-3">
      <legend class="pf-kicker mb-3 text-secondary">
        Genre: a starting loadout from the playbook that pioneered it
      </legend>
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3"
      >
        <button
          v-for="entry in GENRES"
          :key="entry.id"
          type="button"
          data-nav
          role="radio"
          :aria-checked="genre === entry.id"
          class="pf-tile pf-focusable"
          :class="genre === entry.id ? 'pf-tile-on' : ''"
          @click="genre = entry.id"
          @mouseenter="($event.currentTarget as HTMLElement).focus()"
        >
          <img :src="entry.cover" alt="" class="pf-tile-art" />
          <span class="pf-tile-text">
            <span class="pf-display text-base">{{ entry.label }}</span>
            <span class="text-xs leading-snug opacity-85">{{
              entry.pitch
            }}</span>
            <span class="pf-kicker text-[0.6rem] opacity-60">{{
              entry.lineage
            }}</span>
          </span>
          <Icon
            v-if="genre === entry.id"
            name="kind-icon:check"
            class="absolute right-2 top-2 size-6 rounded-full bg-primary p-1 text-primary-content"
          />
        </button>
      </div>
    </fieldset>

    <div class="flex flex-wrap items-center gap-4">
      <button type="submit" data-nav class="pf-cta pf-focusable">
        <span class="pf-display text-lg">Forge the loadout</span>
        <Icon name="kind-icon:arrow-right" class="size-5" />
      </button>
      <span class="text-sm opacity-70">
        Everything stays adjustable. Nothing is created until you launch.
      </span>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { GENRES } from '~/utils/playbookForge/presets'

const forge = usePlaybookForgeStore()
const title = ref('')
const idea = ref('')
const genre = ref(GENRES[0]!.id)

function submit() {
  forge.forge(title.value, idea.value, genre.value)
}
</script>

<style>
.pf-field {
  width: 100%;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 18%, transparent);
  border-bottom: 2px solid
    color-mix(in oklch, var(--color-base-content) 35%, transparent);
  background: color-mix(in oklch, var(--color-base-200) 70%, transparent);
  padding: 0.7rem 0.9rem;
  outline: none;
  transition:
    border-color 160ms ease-out,
    box-shadow 160ms ease-out;
}
.pf-field:focus {
  border-bottom-color: var(--color-primary);
  box-shadow: var(--pf-glow);
}
.pf-tile-on {
  box-shadow:
    0 0 0 2px var(--color-primary),
    0 0 30px -6px var(--color-primary);
}
.pf-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.6rem;
  background: var(--color-primary);
  color: var(--color-primary-content);
  clip-path: polygon(0.8rem 0, 100% 0, calc(100% - 0.8rem) 100%, 0 100%);
}
.pf-cta:disabled {
  opacity: 0.5;
}
</style>
