<template>
  <section class="ma-archive" aria-label="Monstrique music archive" data-testid="monstrique-album-archive">
    <div class="ma-intro">
      <span class="ma-kicker">THE LOST DISCOGRAPHY · 1964–2024</span>
      <strong>Seven eras. Seven missing women.</strong>
      <p>Browse the public sleeves. Match Odette's paperwork to discover what the anniversary editions erased.</p>
    </div>
    <div class="ma-sleeves" role="group" aria-label="Select a Monstrique album">
      <button
        v-for="album in MONSTRIQUE_ALBUMS"
        :key="album.id"
        type="button"
        class="ma-sleeve"
        :class="['ma-' + album.id, { 'ma-selected': selectedId === album.id }]"
        :aria-pressed="selectedId === album.id"
        :aria-label="album.year + ' ' + album.title"
        @click="selectedId = album.id"
      >
        <img v-if="album.artUrl" :src="album.artUrl" :alt="album.year + ' ' + album.title + ' cover'" loading="lazy" />
        <span v-else class="ma-illustration" aria-hidden="true">
          <span class="ma-moon" />
          <span class="ma-figure ma-figure-one" />
          <span class="ma-figure ma-figure-two" />
          <span class="ma-figure ma-figure-three" />
        </span>
        <span class="ma-sleeve-copy">
          <span class="ma-logo">MONSTRIQUE</span>
          <span class="ma-album-title">{{ album.title }}</span>
          <span class="ma-year">{{ album.year }}</span>
        </span>
      </button>
    </div>
    <article class="ma-dossier" aria-live="polite">
      <div class="ma-dossier-top">
        <div>
          <span class="ma-kicker">{{ selected.year }} · {{ selected.movement }}</span>
          <h3>{{ selected.title }}</h3>
        </div>
        <button type="button" class="ma-author-toggle" :aria-pressed="showAuthorNotes" @click="showAuthorNotes = !showAuthorNotes">
          {{ showAuthorNotes ? 'Hide creator notes' : 'Creator notes' }}
        </button>
      </div>
      <p>{{ selected.sound }}</p>
      <div class="ma-cast">
        <span v-for="performer in selected.performers" :key="performer">{{ performer }}</span>
      </div>
      <div class="ma-press">
        <span class="ma-kicker">OFFICIAL PRESS RELEASE</span>
        <p>{{ selected.officialStory }}</p>
      </div>
      <div v-if="hasProof || showAuthorNotes" class="ma-hidden-history">
        <span class="ma-kicker">{{ hasProof ? 'FOUND IN ODETTE’S ARCHIVE' : 'CREATOR VIEW · NOT YET DISCOVERED' }}</span>
        <p><strong>{{ selected.removed }}</strong> replaced by {{ selected.replacement }}. {{ selected.actualHistory }}</p>
        <p>{{ selected.reinvention }}</p>
        <p class="ma-clue">{{ selected.collectible }}</p>
      </div>
      <div v-else class="ma-sealed">
        <Icon name="kind-icon:lock" class="size-4" />
        The original pressing and revised contract have not been compared yet.
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMonstressConventionStore } from '~/stores/monstressConventionStore'
import { MONSTRIQUE_ALBUMS } from '~/utils/monstrique/albumHistory'

const story = useMonstressConventionStore()
const selectedId = ref(MONSTRIQUE_ALBUMS[0]!.id)
const showAuthorNotes = ref(false)
const selected = computed(
  () => MONSTRIQUE_ALBUMS.find((album) => album.id === selectedId.value) ?? MONSTRIQUE_ALBUMS[0]!,
)
const hasProof = computed(() => story.state.flags.includes(selected.value.clueFlag))
</script>

<style scoped>
.ma-archive { display: grid; gap: 1rem; padding: .75rem; color: #fbe7ed; }
.ma-intro { display: grid; gap: .3rem; }
.ma-intro > strong { font: 800 clamp(1.1rem, 3vw, 1.5rem)/1.1 Georgia, serif; }
.ma-intro p, .ma-dossier p { margin: 0; font-size: .8rem; line-height: 1.5; }
.ma-kicker { color: #ffa9cf; font-size: .65rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.ma-sleeves { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,125px),1fr)); gap: .7rem; }
.ma-sleeve { aspect-ratio: 1; position: relative; isolation: isolate; overflow: hidden; border: 2px solid #74405f; border-radius: .5rem; background: #242036; text-align: left; box-shadow: 0 9px 18px #0e071a75; transition: transform .15s ease, border-color .15s ease; }
.ma-sleeve:hover, .ma-sleeve:focus-visible { transform: translateY(-3px); border-color: #ffd2e0; outline-offset: 3px; }
.ma-sleeve.ma-selected { border-color: #f7b5d1; box-shadow: 0 0 0 2px #dc3b9580,0 12px 24px #0e071a95; }
.ma-illustration { position: absolute; inset: 0; background: radial-gradient(circle at 62% 23%,#ffb89c99,transparent 31%),linear-gradient(140deg,#5d2546,#25253f 62%,#090c26); }
.ma-moon { position: absolute; top: 12%; right: 15%; width: 32%; aspect-ratio: 1; border-radius: 50%; background: #ffdfc0aa; box-shadow: 0 0 25px #ff90c580; }
.ma-figure { position: absolute; bottom: 0; width: 29%; height: 56%; border-radius: 45% 45% 0 0; background: linear-gradient(#f99cb6 0 22%,#290e37 23% 100%); box-shadow: 0 0 0 2px #ea7fb743; }
.ma-figure-one { left: 14%; transform: rotate(-13deg); }
.ma-figure-two { left: 39%; height: 67%; background: linear-gradient(#f3b3ba 0 22%,#671e43 23%); }
.ma-figure-three { right: 10%; transform: rotate(12deg); background: linear-gradient(#94d49a 0 22%,#182d42 23%); }
.ma-velvet-crypt .ma-illustration { filter: sepia(.55); }
.ma-night-creatures .ma-illustration { filter: hue-rotate(70deg) saturate(1.9); }
.ma-silver-bite .ma-illustration { filter: grayscale(.8) contrast(1.2); }
.ma-back-from-the-grave .ma-illustration { filter: hue-rotate(-25deg) contrast(1.2); }
.ma-blood-moon .ma-illustration { filter: hue-rotate(155deg) saturate(1.5); }
.ma-six-decades .ma-illustration { filter: brightness(1.18) sepia(.4); }
.ma-sleeve-copy { position: absolute; inset: auto 0 0; display: grid; gap: .17rem; padding: .45rem; background: linear-gradient(transparent,#110a26e8 17%); text-shadow: 0 1px 4px #12091f; }
.ma-logo { font: 900 .65rem Georgia,serif; letter-spacing: .045em; }
.ma-album-title { font: 700 .82rem/1.05 Georgia,serif; }
.ma-year { font-size: .66rem; font-weight: 800; letter-spacing: .12em; }
.ma-dossier { display: grid; gap: .65rem; padding: .85rem; border: 1px solid #9d5b85; border-radius: .7rem; background: linear-gradient(160deg,#312039,#19182c); }
.ma-dossier-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .6rem; flex-wrap: wrap; }
.ma-dossier h3 { font: 800 1.35rem Georgia,serif; margin: .1rem 0; }
.ma-author-toggle { padding: .4rem .6rem; border: 1px solid #a8678d; border-radius: .5rem; font-size: .7rem; }
.ma-author-toggle:focus-visible { outline: 2px solid #ffe2ed; outline-offset: 3px; }
.ma-cast { display: flex; gap: .35rem; flex-wrap: wrap; }
.ma-cast span { padding: .25rem .4rem; border-radius: .3rem; background: #884b7355; border: 1px solid #bb689560; font-size: .66rem; }
.ma-press,.ma-hidden-history { padding: .65rem; border-left: 2px solid #dd7daa; background: #9f527321; display: grid; gap: .35rem; }
.ma-hidden-history { border-color: #e6bb77; background: #c5a35f14; }
.ma-clue { font-style: italic; }
.ma-sealed { display: flex; align-items: center; gap: .5rem; font-size: .72rem; color: #dac3d9; padding: .5rem; }
@media (prefers-reduced-motion: reduce) { .ma-sleeve { transition: none; } }
</style>
