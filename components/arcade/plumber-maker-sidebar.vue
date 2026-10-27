<template>
  <aside class="maker-sidebar">
    <div class="maker-tabs" role="group" aria-label="Maker panels">
      <button
        v-for="tab in panels"
        :key="tab.id"
        type="button"
        :aria-pressed="maker.panel === tab.id"
        @click="maker.panel = tab.id"
      >
        {{ tab.icon }} <span>{{ tab.label }}</span>
      </button>
    </div>

    <div v-if="maker.panel === 'tools'" class="maker-tools kr-scroll">
      <div class="maker-groups" role="group" aria-label="Object categories">
        <button
          v-for="group in MAKER_GROUPS"
          :key="group.name"
          type="button"
          :aria-pressed="maker.selectedGroup === group.name"
          :title="group.name"
          @click="maker.selectedGroup = group.name"
        >
          <span>{{ group.icon }}</span
          ><small>{{ group.name }}</small>
        </button>
      </div>
      <div class="maker-tool-head">{{ maker.selectedGroup }} · PICK A TOOL</div>
      <div class="maker-tiles">
        <button
          v-for="tile in selectedTiles"
          :key="tile.key"
          type="button"
          class="maker-tile"
          :aria-pressed="maker.selectedTile === tile.key"
          :title="tile.label"
          @click="maker.selectedTile = tile.key"
        >
          <span class="maker-glyph">{{ tile.icon }}</span>
          <span class="maker-tile-name">{{ tile.label }}</span>
        </button>
      </div>
    </div>

    <div v-else-if="maker.panel === 'library'" class="maker-library kr-scroll">
      <p class="maker-tool-head">
        YOUR SAVED COURSES · {{ maker.drafts.length }}/24
      </p>
      <p v-if="!maker.drafts.length" class="maker-help">
        Your levels live on this device. Build a course and choose SAVE to begin
        your library.
      </p>
      <div v-for="draft in maker.drafts" :key="draft.id" class="maker-draft">
        <strong>{{ draft.level.title }}</strong>
        <small
          >WORLD {{ draft.level.theme }} ·
          {{ draft.level.rows[0]?.length }} TILES</small
        >
        <div class="maker-draft-actions">
          <button type="button" @click="loadDraft(draft.id)">✎ EDIT</button>
          <button type="button" @click="playDraft(draft.id)">▶ PLAY</button>
          <button
            type="button"
            aria-label="Delete local draft"
            @click="removeDraft(draft.id)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="maker.panel === 'reviews'" class="maker-reviews kr-scroll">
      <p class="maker-tool-head">PLAYER REVIEWS</p>
      <p class="maker-review-summary">
        ★ {{ maker.ratingCount ? maker.ratingAverage.toFixed(1) : 'UNRATED' }}
        <small
          >({{ maker.ratingCount }} player{{
            maker.ratingCount === 1 ? '' : 's'
          }})</small
        >
      </p>
      <button
        type="button"
        class="maker-review-refresh"
        :disabled="maker.reviewsBusy"
        @click="maker.fetchReviews()"
      >
        {{ maker.reviewsBusy ? 'LOADING…' : '↻ REFRESH' }}
      </button>
      <p v-if="!maker.reviews.length" class="maker-help">
        No reviews yet for this exact course version. Complete the level to
        leave the first one.
      </p>
      <article
        v-for="review in maker.reviews"
        :key="review.id"
        class="maker-review"
      >
        <div>
          <strong>{{ review.username }}</strong
          ><span
            >{{ '★'.repeat(review.rating)
            }}{{ '☆'.repeat(5 - review.rating) }}</span
          >
        </div>
        <p v-if="review.comment">{{ review.comment }}</p>
      </article>
    </div>

    <div v-else class="maker-settings kr-scroll">
      <label
        >COURSE NAME
        <input
          :value="maker.level.title"
          maxlength="64"
          @change="changeTitle($event)"
        />
      </label>
      <label
        >BUILDER
        <input
          :value="maker.level.author"
          maxlength="32"
          @change="changeAuthor($event)"
        />
      </label>
      <label
        >WORLD ART + BOSS
        <select :value="maker.level.theme" @change="changeTheme($event)">
          <option
            v-for="world in PLUMBER_WORLDS"
            :key="world.id"
            :value="world.id"
          >
            {{ world.id }} · {{ world.name }}
          </option>
        </select>
      </label>
      <label class="maker-check">
        <input
          type="checkbox"
          :checked="maker.level.dark"
          @change="changeDark($event)"
        />
        DARK / LANTERN MODE
      </label>
      <p class="maker-help">
        All 8 world styles use the same playable mechanics. A boss uses the
        selected world's moveset. Place one start, one finish, and matching pipe
        pairs.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSavePlumberMakerStore } from '~/stores/savePlumberMakerStore'
import { MAKER_GROUPS } from '~/utils/arcade/games/savePlumberMaker'
import { PLUMBER_WORLDS } from '~/utils/arcade/games/savePlumberWorlds'
const maker = useSavePlumberMakerStore()
const emit = defineEmits<{
  (event: 'load-draft', id: string): void
  (event: 'play-draft', id: string): void
}>()
const panels = [
  { id: 'tools' as const, icon: '▦', label: 'TOOLS' },
  { id: 'library' as const, icon: '▣', label: 'FILES' },
  { id: 'settings' as const, icon: '⚙', label: 'OPTIONS' },
  { id: 'reviews' as const, icon: '★', label: 'REVIEWS' },
]
const selectedTiles = computed(
  () =>
    MAKER_GROUPS.find((group) => group.name === maker.selectedGroup)?.tiles ??
    MAKER_GROUPS[0]!.tiles,
)
function loadDraft(id: string) {
  emit('load-draft', id)
}
function playDraft(id: string) {
  emit('play-draft', id)
}
function removeDraft(id: string) {
  if (window.confirm('Delete this local draft?')) maker.deleteDraft(id)
}
function changeTitle(e: Event) {
  maker.updateSettings({ title: (e.target as HTMLInputElement).value })
}
function changeAuthor(e: Event) {
  maker.updateSettings({ author: (e.target as HTMLInputElement).value })
}
function changeTheme(e: Event) {
  maker.updateSettings({ theme: Number((e.target as HTMLSelectElement).value) })
}
function changeDark(e: Event) {
  maker.updateSettings({ dark: (e.target as HTMLInputElement).checked })
}
</script>

<style scoped>
.maker-console {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
  color: #f8f4d8;
  background: #091c2a;
  border: 2px solid #759c91;
  border-radius: 1rem;
  overflow: hidden;
  font:
    700 0.78rem system-ui,
    sans-serif;
}
.maker-topbar,
.maker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  background: #142d3e;
}
.maker-title {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}
.maker-title strong {
  font-size: clamp(0.95rem, 1.65vw, 1.5rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.maker-title small,
.maker-kicker {
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  color: #a5cec7;
}
.maker-actions,
.maker-stage-controls,
.maker-draft-actions,
.maker-tabs,
.maker-touch {
  display: flex;
  gap: 0.25rem;
}
button {
  font: inherit;
  cursor: pointer;
}
button:disabled {
  opacity: 0.35;
  cursor: default;
}
button:focus-visible,
canvas:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid #fff1a8;
  outline-offset: 2px;
}
.maker-action,
.maker-stage-controls button,
.maker-draft-actions button,
.maker-share-field button,
.maker-play-result > button {
  background: #25495c;
  border: 1px solid #69949f;
  border-radius: 0.45rem;
  color: #fff7df;
  padding: 0.42rem 0.55rem;
  white-space: nowrap;
}
.maker-action--play {
  background: #e5ad59;
  color: #152a35;
  border-color: #ffeab1;
}
.maker-workspace {
  display: grid;
  grid-template-columns: clamp(10rem, 19%, 16rem) minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}
.maker-sidebar {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  background: #102538;
  border-right: 2px solid #416a77;
}
.maker-tabs button {
  min-width: 0;
  flex: 1;
  padding: 0.5rem 0.15rem;
  background: #1b3446;
  color: #b9d3d0;
  border-bottom: 2px solid transparent;
  font-size: 0.67rem;
}
.maker-tabs button[aria-pressed='true'] {
  background: #254c5b;
  color: #fff2be;
  border-bottom-color: #ffd78a;
}
.maker-tools,
.maker-library,
.maker-reviews,
.maker-settings {
  min-height: 0;
  overflow: auto;
  padding: 0.6rem;
}
.maker-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
}
.maker-groups button {
  display: grid;
  place-items: center;
  gap: 0.1rem;
  padding: 0.35rem 0.1rem;
  background: #1e3c4b;
  color: #e6f4e8;
  border-radius: 0.45rem;
  border: 1px solid #365d66;
}
.maker-groups button span {
  font-size: 1.4rem;
}
.maker-groups button small {
  font-size: 0.57rem;
}
.maker-groups button[aria-pressed='true'] {
  border-color: #ffd078;
  background: #466056;
}
.maker-tool-head {
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  color: #e9d4a0;
  margin: 0.65rem 0 0.4rem;
}
.maker-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem;
}
.maker-tile {
  display: grid;
  justify-items: center;
  gap: 0.1rem;
  min-height: 3.4rem;
  padding: 0.28rem 0.15rem;
  background: #203d4d;
  color: #e7f1e6;
  border: 1px solid #396071;
  border-radius: 0.45rem;
  min-width: 0;
}
.maker-tile[aria-pressed='true'] {
  background: #5c6041;
  border-color: #ffd684;
  box-shadow: inset 0 0 0 1px #ffdf91;
}
.maker-glyph {
  font-size: 1.5rem;
  line-height: 1.4;
}
.maker-tile-name {
  font-size: 0.6rem;
  line-height: 1.1;
  text-align: center;
}
.maker-library {
  display: grid;
  align-content: start;
  gap: 0.5rem;
}
.maker-draft {
  display: grid;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 0.55rem;
  background: #244253;
}
.maker-draft strong {
  overflow-wrap: anywhere;
}
.maker-draft small,
.maker-help {
  font-size: 0.67rem;
  color: #b7d8d4;
  line-height: 1.45;
}
.maker-draft-actions button {
  font-size: 0.65rem;
  flex: 1;
}
.maker-settings {
  display: grid;
  align-content: start;
  gap: 0.7rem;
}
.maker-settings label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.68rem;
  color: #dfd49d;
}
.maker-settings input,
.maker-settings select,
.maker-share-field input {
  min-width: 0;
  width: 100%;
  background: #eaf2e4;
  color: #162c38;
  border-radius: 0.35rem;
  border: 1px solid #9db9b2;
  padding: 0.35rem;
}
.maker-settings .maker-check {
  display: flex;
  align-items: center;
}
.maker-check input {
  width: auto;
}
.maker-stage {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  min-width: 0;
  min-height: 0;
  background: #0b1a25;
}
.maker-stage-top,
.maker-stage-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  padding: 0.3rem 0.55rem;
  background: #152a38;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
}
.maker-stage-controls {
  align-items: center;
}
.maker-stage-controls button {
  font-size: 0.64rem;
  padding: 0.25rem 0.4rem;
}
.maker-grid-scroll {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background-position: center;
  background-size: cover;
}
.maker-grid {
  display: block;
  max-width: none;
  touch-action: none;
  cursor: crosshair;
}
.maker-play-stage {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
  background: #111925;
  overflow: hidden;
}
.maker-play-stage canvas {
  display: block;
  width: min(100%, calc((100cqh - 2rem) * 480 / 270));
  max-height: 100%;
  aspect-ratio: 16/9;
  object-fit: contain;
  image-rendering: pixelated;
}
.maker-play-result {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.6rem;
  background: #0a1a27e8;
  text-align: center;
  padding: 1rem;
}
.maker-play-result strong {
  font-size: clamp(1.2rem, 3vw, 2.3rem);
  color: #ffe49c;
}
.maker-play-result p {
  margin: 0;
}
.maker-play-result small {
  color: #c5d8d4;
}
.maker-stars button {
  background: none;
  border: 0;
  color: #ffe08b;
  font-size: 2.5rem;
  padding: 0 0.1rem;
}
.maker-touch {
  justify-content: center;
  background: #193548;
  padding: 0.25rem;
  touch-action: none;
}
.maker-touch button {
  flex: 1;
  max-width: 6rem;
  border-radius: 0.35rem;
  background: #345c6b;
  border: 1px solid #80abb2;
  color: #fff0ba;
  padding: 0.4rem;
  font-size: 0.68rem;
  touch-action: none;
  user-select: none;
}
.maker-footer {
  min-height: 2.7rem;
}
.maker-state {
  max-width: 38%;
  font-size: 0.65rem;
  line-height: 1.3;
  color: #f9dca0;
}
.maker-share-field {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  flex: 1;
}
.maker-share-field label {
  white-space: nowrap;
  font-size: 0.59rem;
}
.maker-share-field input {
  flex: 1;
  font-size: 0.65rem;
  padding: 0.3rem;
}
.maker-share-field button {
  font-size: 0.64rem;
  padding: 0.3rem 0.5rem;
}
@media (max-width: 760px) {
  .maker-console {
    font-size: 0.69rem;
  }
  .maker-topbar {
    padding: 0.3rem;
    flex-wrap: wrap;
  }
  .maker-title {
    flex: 1;
  }
  .maker-actions {
    width: 100%;
    justify-content: space-around;
  }
  .maker-action {
    flex: 1;
    padding: 0.34rem 0.2rem;
  }
  .maker-actions .maker-action span {
    display: none;
  }
  .maker-workspace {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) minmax(7.5rem, 35%);
  }
  .maker-stage {
    grid-row: 1;
  }
  .maker-sidebar {
    grid-row: 2;
    border-right: 0;
    border-top: 2px solid #416a77;
  }
  .maker-groups {
.maker-reviews{display:grid;align-content:start;gap:.55rem}
.maker-review-summary{display:flex;align-items:baseline;gap:.4rem;font-size:1.4rem;color:#ffe199}
.maker-review-summary small{font-size:.65rem;color:#bcdbd6}
.maker-review-refresh{background:#25495c;border:1px solid #69949f;border-radius:.4rem;padding:.35rem;color:#fff7df}
.maker-review{padding:.5rem;background:#244253;border-radius:.5rem;overflow-wrap:anywhere}
.maker-review div{display:flex;justify-content:space-between;gap:.5rem}
.maker-review span{color:#ffe199}
.maker-review p{margin:.25rem 0 0;font-size:.73rem;line-height:1.4;font-weight:400;white-space:pre-wrap}
</style>
