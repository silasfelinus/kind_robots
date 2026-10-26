<template>
  <div class="kr-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-6 px-1 pb-2">
    <section v-if="forge.draftList.length" class="flex flex-col gap-3">
      <p class="pf-kicker text-secondary">Your drafts</p>
      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3"
      >
        <li v-for="draft in forge.draftList" :key="draft.slug" class="relative">
          <button
            type="button"
            data-nav
            class="pf-tile pf-focusable"
            @click="forge.openDraft(draft.slug)"
            @mouseenter="($event.currentTarget as HTMLElement).focus()"
          >
            <img :src="coverFor(draft.genre)" alt="" class="pf-tile-art" />
            <span class="pf-tile-text">
              <span class="pf-display text-lg">{{ draft.title }}</span>
              <span class="pf-kicker opacity-70">{{
                genreLabel(draft.genre)
              }}</span>
            </span>
          </button>
          <button
            type="button"
            class="pf-tile-remove"
            :title="`Delete the ${draft.title} draft`"
            @click="forge.deleteDraft(draft.slug)"
          >
            <Icon name="kind-icon:close" class="size-4" />
          </button>
        </li>
      </ul>
    </section>

    <section class="flex flex-col gap-3">
      <p class="pf-kicker text-secondary">Load a game</p>
      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3"
      >
        <li v-for="(game, i) in EXISTING_PLAYBOOKS" :key="game.slug">
          <button
            type="button"
            data-nav
            :data-autofocus="
              !forge.draftList.length && i === 0 ? '' : undefined
            "
            class="pf-tile pf-focusable"
            @click="forge.openLedger(game.slug)"
            @mouseenter="($event.currentTarget as HTMLElement).focus()"
          >
            <img :src="game.cover" alt="" class="pf-tile-art" />
            <span class="pf-tile-text">
              <span class="pf-display text-lg">{{ game.title }}</span>
              <span class="pf-kicker opacity-70">{{ game.route }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { EXISTING_PLAYBOOKS } from '~/utils/playbookForge/existing'
import { GENRES } from '~/utils/playbookForge/presets'

const forge = usePlaybookForgeStore()

const coverFor = (genre: string) =>
  (GENRES.find((g) => g.id === genre) ?? GENRES[0]!).cover
const genreLabel = (genre: string) =>
  (GENRES.find((g) => g.id === genre) ?? GENRES[0]!).label
</script>
