<template>
  <section
    class="endings kr-scroll"
    aria-label="Endings gallery and campaign scrapbook"
    data-testid="slime-endings-gallery"
  >
    <header class="endings-head">
      <div>
        <span class="endings-overline">ENDINGS GALLERY</span>
        <h3>
          {{ teamName(crew) }} ·
          <span data-testid="slime-endings-count"
            >{{ gallery.found }}/{{ gallery.total }} FOUND</span
          >
        </h3>
      </div>
      <button
        type="button"
        class="endings-close"
        data-testid="slime-endings-close"
        @click="lab.endingsOpen = false"
      >
        BACK TO THE STORY
      </button>
    </header>

    <section
      class="endings-trophies"
      aria-label="Crew trophies"
      data-testid="slime-trophy-shelf"
    >
      <span class="endings-overline"
        >CREW TROPHIES · {{ shelf.unlocked }}/{{ shelf.total }} UNLOCKED</span
      >
      <ul>
        <li
          v-for="t in shelf.trophies"
          :key="t.team"
          class="endings-trophy"
          :class="{ locked: !t.unlocked }"
          :data-testid="'slime-trophy-' + t.team"
          :data-unlocked="t.unlocked ? 'true' : 'false'"
        >
          <span
            class="endings-trophy-back"
            :style="t.unlocked ? { background: t.frame.background } : {}"
            :aria-label="
              t.unlocked ? t.frame.name + ' card back' : 'Locked card back'
            "
            role="img"
            >{{ crewInsignia(t.team) }}</span
          >
          <div>
            <strong>{{ t.unlocked ? t.trophy : '? ? ?' }}</strong>
            <small v-if="t.unlocked"
              >TITLE: {{ t.title }} · CARD BACK: {{ t.frame.name }}</small
            >
            <small v-else
              >Finish {{ teamName(t.team) }}'s campaign to unlock.</small
            >
            <p v-if="t.unlocked">{{ t.line }}</p>
          </div>
        </li>
      </ul>
    </section>

    <nav class="endings-crews" aria-label="Choose a crew's endings">
      <button
        v-for="team in lab.teams"
        :key="team.id"
        type="button"
        :aria-pressed="crew === team.id"
        :data-testid="'slime-endings-crew-' + team.id"
        @click="picked = team.id"
      >
        {{ team.name }}
        <small>{{ countFor(team.id) }}</small>
      </button>
    </nav>

    <p v-if="!lab.storyLoaded" class="endings-note">
      Sign in to keep endings and scrapbook pages on your account.
    </p>

    <ul class="endings-grid" aria-label="Endings">
      <li
        v-for="entry in gallery.entries"
        :key="entry.id"
        class="endings-tile"
        :class="[entry.kind, { locked: !entry.found }]"
        :data-testid="'slime-ending-' + entry.id"
        :data-found="entry.found ? 'true' : 'false'"
      >
        <SlimeCityArtwork
          class="endings-art"
          :image-id="entry.found ? tileArt(entry) : null"
          :alt="entry.found ? entry.title + ' ending art' : 'Locked ending'"
          :fallback="entry.found ? crewInsignia(entry.ally ?? crew) : '?'"
          compact
        />
        <div class="endings-copy">
          <small>{{ KIND_LABELS[entry.kind] }}</small>
          <template v-if="entry.found">
            <strong>{{ entry.title }}</strong>
            <details>
              <summary>Read the ending</summary>
              <p>{{ entry.story }}</p>
            </details>
          </template>
          <template v-else>
            <strong>{{ lockedTitle(entry) }}</strong>
            <p class="endings-hint">{{ KIND_HINTS[entry.kind] }}</p>
          </template>
        </div>
      </li>
    </ul>

    <section class="endings-scrapbook" aria-label="Campaign scrapbook">
      <span class="endings-overline">SCRAPBOOK</span>
      <p v-if="!pages.length" class="endings-note">
        Win all five chapters with {{ teamName(crew) }} to paste in a page.
      </p>
      <article
        v-for="page in pages"
        :key="page.team + page.run"
        class="endings-page"
        :data-testid="'slime-scrapbook-' + page.team + '-' + page.run"
      >
        <h4>
          {{ story.title }} · RUN {{ page.run }}
          <small
            >{{ page.losses }} LOSS{{ page.losses === 1 ? '' : 'ES' }} ON THE
            WAY</small
          >
        </h4>
        <ol>
          <li v-for="(chapter, index) in story.chapters" :key="chapter.foe">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <strong>{{ chapter.title }}</strong>
            <em>beat {{ teamName(chapter.foe) }}</em>
            <b :class="page.decisions[index]">{{
              (page.decisions[index] ?? '').toUpperCase()
            }}</b>
          </li>
        </ol>
        <p v-if="page.favor">
          <small>FAVOR TAKEN</small> <strong>{{ page.favor }}</strong>
        </p>
        <p>
          <small>ENDINGS</small>
          <span v-for="id in page.endings" :key="id" class="endings-chip">{{
            endingById(id)?.title ?? id
          }}</span>
        </p>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
// Endings gallery and per-crew campaign scrapbook (slime-city/t-059).
import { computed, ref } from 'vue'
import { FACTION_CAMPAIGNS } from '~/utils/slimeCity/campaign'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import {
  endingArtSlug,
  endingById,
  endingGallery,
  type EndingEntry,
  type EndingKind,
} from '~/utils/slimeCity/endings'
import { crewTrophyShelf } from '~/utils/slimeCity/crewTrophies'
import { useSlimeCityStore } from '~/stores/slimeCity'
import type { TeamId } from '~/utils/slimeCity/prototypes'

const lab = useSlimeCityStore()
const picked = ref<TeamId | null>(null)
const crew = computed<TeamId>(() => picked.value ?? lab.activeTeam)
const story = computed(() => FACTION_CAMPAIGNS[crew.value])
const gallery = computed(() => endingGallery(crew.value, lab.endingsFound))
const shelf = computed(() => crewTrophyShelf(lab.endingsFound))
const pages = computed(() =>
  lab.scrapbook.filter((page) => page.team === crew.value).reverse(),
)

const KIND_LABELS: Record<EndingKind, string> = {
  plate: 'ENDING PLATE',
  journey: 'JOURNEY FINAL CHOICE',
  alliance: 'ALLIANCE ENDING',
}
const KIND_HINTS: Record<EndingKind, string> = {
  plate: 'Three or more Conviction victories earn Triumph; fewer, Compromise.',
  journey: 'Earned by how the last scene of the journey is decided.',
  alliance: 'Fight the final chapter in ALLIANCE with this crew at your side.',
}

function countFor(team: TeamId): string {
  const view = endingGallery(team, lab.endingsFound)
  return view.found + '/' + view.total
}
function teamName(id: TeamId): string {
  return lab.teams.find((team) => team.id === id)?.name ?? id
}
function crewInsignia(id: TeamId): string {
  return lab.teams.find((team) => team.id === id)?.insignia ?? ''
}
function lockedTitle(entry: EndingEntry): string {
  return entry.kind === 'alliance' && entry.ally
    ? 'With ' + teamName(entry.ally) + ' · ?'
    : entry.kind === 'plate'
      ? entry.title.toUpperCase()
      : '? ? ?'
}
function tileArt(entry: EndingEntry): number | null {
  if (entry.kind === 'alliance' && entry.ally)
    return slimeArtId('crews', entry.ally)
  if (entry.kind === 'plate')
    return (
      slimeArtId(
        'story',
        entry.team + '/ending-' + entry.title.toLowerCase(),
      ) ?? slimeArtId('crews', entry.team)
    )
  const slug = endingArtSlug(entry.id)
  return (
    (slug ? slimeArtId('story', slug) : null) ??
    slimeArtId('story', entry.team + '/opening') ??
    slimeArtId('crews', entry.team)
  )
}
</script>

<style scoped>
.endings {
  position: relative;
  min-height: 0;
  padding: 0 clamp(0.6rem, 2cqw, 1.6rem) clamp(0.6rem, 2cqw, 1.4rem);
  overflow-y: auto;
  background: #060a10e6;
}
.endings-head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.6rem;
  padding-top: 0.6rem;
}
.endings-head h3 {
  margin: 0.2rem 0 0;
  font-size: clamp(1.1rem, 3cqw, 1.8rem);
  font-weight: 1000;
  font-style: italic;
  text-transform: uppercase;
}
.endings-overline {
  display: block;
  color: var(--campaign-accent);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.2em;
}
.endings-close,
.endings-crews button {
  padding: 0.4rem 0.6rem;
  border: 1px solid #ffffff55;
  border-radius: 0.4rem;
  background: #0a142ecc;
  color: #d8e2f2;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.endings-crews {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin: 0.7rem 0;
}
.endings-crews button[aria-pressed='true'] {
  border-color: #ffffff;
  background: #f4f7ff;
  color: #0a142e;
}
.endings-crews small {
  margin-left: 0.3rem;
  opacity: 0.75;
}
.endings-note {
  margin: 0.4rem 0;
  color: #b8c4d6;
  font-size: 0.85rem;
}
.endings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.endings-tile {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 0.55rem;
  padding: 0.5rem;
  border: 1px solid #ffffff2a;
  border-left: 4px solid var(--campaign-accent);
  border-radius: 0.6rem;
  background: #0b1219e6;
}
.endings-tile.locked {
  border-left-color: #ffffff33;
}
.endings-tile.locked .endings-art {
  filter: brightness(0) opacity(0.55);
}
.endings-art {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 0.4rem;
  overflow: hidden;
}
.endings-copy small,
.endings-page small {
  display: block;
  color: var(--campaign-accent);
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.14em;
}
.endings-copy strong {
  display: block;
  font-size: 0.86rem;
  line-height: 1.2;
}
.endings-copy p,
.endings-hint {
  margin: 0.25rem 0 0;
  color: #c9d3e2;
  font-size: 0.78rem;
  line-height: 1.4;
}
.endings-copy summary {
  margin-top: 0.25rem;
  color: #d8e2f2;
  font-size: 0.7rem;
  cursor: pointer;
}
.endings-scrapbook {
  margin-top: 1rem;
}
.endings-page {
  margin-top: 0.5rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid #ffffff2a;
  border-radius: 0.6rem;
  background: #f4f0e2;
  color: #1b1b22;
  box-shadow: 0 10px 28px #0008;
}
.endings-page small {
  color: #6a4b12;
}
.endings-page h4 {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 1000;
  text-transform: uppercase;
}
.endings-page h4 small {
  display: inline;
  margin-left: 0.4rem;
}
.endings-page ol {
  display: grid;
  gap: 0.2rem;
  margin: 0 0 0.5rem;
  padding: 0;
  list-style: none;
  font-size: 0.82rem;
}
.endings-page li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: baseline;
}
.endings-page li b {
  margin-left: auto;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
}
.endings-page li b.conviction {
  color: #1f6b2a;
}
.endings-page li b.cunning {
  color: #7a2a8a;
}
.endings-page p {
  margin: 0.3rem 0 0;
  font-size: 0.82rem;
}
.endings-chip {
  display: inline-block;
  margin: 0.15rem 0.3rem 0 0;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: #1b1b22;
  color: #f4f0e2;
  font-size: 0.7rem;
  font-weight: 800;
}
.endings-trophies ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.5rem;
  margin: 0.4rem 0 0.8rem;
  padding: 0;
  list-style: none;
}
.endings-trophy {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  padding: 0.5rem;
  border: 1px solid #ffffff2e;
  border-radius: 0.5rem;
  background: #ffffff0d;
}
.endings-trophy.locked {
  opacity: 0.55;
}
.endings-trophy-back {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 3.6rem;
  border: 2px solid #ffffff59;
  border-radius: 0.35rem;
  background: #1a2230;
  color: #fff;
  font-size: 1.1rem;
}
.endings-trophy strong {
  display: block;
}
.endings-trophy small {
  display: block;
  opacity: 0.8;
}
.endings-trophy p {
  margin: 0.25rem 0 0;
  font-size: 0.85em;
}
</style>
