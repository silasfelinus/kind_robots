<template>
  <main class="kr-surface hybridizer-root" data-testid="hybridizer-lab">
    <div class="hybridizer-console" :class="{ 'is-working': lab.working }">
      <header class="hybridizer-header">
        <div>
          <p class="eyebrow">KIND ROBOTS / EXPERIMENT 014</p>
          <div class="lab-title">HYBRIDIZER</div>
          <p class="subtitle">Every creature has an impossible cousin.</p>
        </div>
        <div class="header-count">
          <strong>{{ lab.starterCount }}</strong>
          <span>STARTERS</span>
          <strong>{{ lab.discoveries.length }}</strong>
          <span>DISCOVERIES</span>
        </div>
      </header>

      <section class="hybridizer-stage" aria-label="Creature fusion laboratory">
        <button
          type="button"
          class="specimen-chamber left-chamber"
          data-testid="hybridizer-left"
          aria-label="Choose left ingredient"
          @click="openDrawer('left')"
        >
          <div class="chamber-label">
            <span>CHAMBER 01</span>
            <strong>{{ lab.left?.title || 'Choose specimen' }}</strong>
          </div>
          <div class="specimen-art">
            <img
              v-if="lab.imageFor(lab.left)"
              :src="lab.imageFor(lab.left) || undefined"
              :alt="lab.left?.title || ''"
              class="specimen-image"
            />
            <div v-else class="specimen-fallback">
              <span class="specimen-glow" aria-hidden="true"></span>
              <span class="specimen-glyph" aria-hidden="true">{{
                glyphFor(lab.left?.title, lab.left?.taxonomy)
              }}</span>
              <span v-if="lab.artPending(lab.left)" class="art-pending"
                >Portrait queued</span
              >
            </div>
          </div>
          <span class="chamber-bottom"
            >{{ lab.left?.taxonomy || 'EMPTY' }} <span>CHANGE ✦</span></span
          >
        </button>

        <div class="hybridizer-machine" aria-hidden="true">
          <span class="coil coil-one"></span>
          <span class="coil coil-two"></span>
          <span class="core">×</span>
          <span class="machine-caption">{{
            lab.working ? 'FUSING' : 'MIX'
          }}</span>
        </div>

        <button
          type="button"
          class="specimen-chamber right-chamber"
          data-testid="hybridizer-right"
          aria-label="Choose right ingredient"
          @click="openDrawer('right')"
        >
          <div class="chamber-label">
            <span>CHAMBER 02</span>
            <strong>{{ lab.right?.title || 'Choose specimen' }}</strong>
          </div>
          <div class="specimen-art">
            <img
              v-if="lab.imageFor(lab.right)"
              :src="lab.imageFor(lab.right) || undefined"
              :alt="lab.right?.title || ''"
              class="specimen-image"
            />
            <div v-else class="specimen-fallback">
              <span class="specimen-glow" aria-hidden="true"></span>
              <span class="specimen-glyph" aria-hidden="true">{{
                glyphFor(lab.right?.title, lab.right?.taxonomy)
              }}</span>
              <span v-if="lab.artPending(lab.right)" class="art-pending"
                >Portrait queued</span
              >
            </div>
          </div>
          <span class="chamber-bottom"
            >{{ lab.right?.taxonomy || 'EMPTY' }} <span>CHANGE ✦</span></span
          >
        </button>

        <article class="hybridizer-result" aria-live="polite">
          <p class="eyebrow">THE DISCOVERY CHAMBER</p>
          <template v-if="lab.result">
            <h2 data-testid="hybridizer-result-title">
              {{ lab.result.title }}
            </h2>
            <div
              class="fusion-study"
              aria-label="Hybrid creature artwork or source composition preview"
            >
              <img
                v-if="previewArt"
                class="fusion-generated"
                :src="previewArt || undefined"
                :alt="lab.result.title + ' illustration'"
              />
              <template v-else>
                <div class="fusion-part">
                  <img
                    v-if="lab.imageFor(lab.left)"
                    :src="lab.imageFor(lab.left) || undefined"
                    :alt="lab.left?.title || ''"
                  />
                  <span v-else aria-hidden="true">{{
                    glyphFor(lab.left?.title, lab.left?.taxonomy)
                  }}</span>
                </div>
                <div class="fusion-lightning" aria-hidden="true">✧</div>
                <div class="fusion-part">
                  <img
                    v-if="lab.imageFor(lab.right)"
                    :src="lab.imageFor(lab.right) || undefined"
                    :alt="lab.right?.title || ''"
                  />
                  <span v-else aria-hidden="true">{{
                    glyphFor(lab.right?.title, lab.right?.taxonomy)
                  }}</span>
                </div>
              </template>
            </div>
            <div class="result-foot">
              <p class="study-label">
                {{
                  lab.result.status === 'READY'
                    ? 'DELIVERED ARTWORK'
                    : lab.result.key.startsWith('fusion:')
                      ? 'SHARED DISCOVERY · ' + (lab.result.status || 'STUDY')
                      : 'LOCAL STUDY · SHARED ARCHIVE UNAVAILABLE'
                }}
              </p>
              <button
                v-if="lab.result.status === 'FAILED' && lab.result.canRetry"
                type="button"
                class="remix-button"
                @click="lab.enqueueArtwork(lab.result.key)"
              >
                Retry illustration
              </button>
              <button
                type="button"
                class="remix-button"
                data-testid="hybridizer-remix"
                @click="lab.remix('left')"
              >
                Use as next ingredient ↗
              </button>
            </div>
            <div
              v-if="lab.result.key.startsWith('fusion:')"
              class="hybrid-actions"
              aria-label="Discovery actions"
            >
              <button
                v-if="lab.canEditResult"
                type="button"
                :disabled="
                  lab.versionBusy ||
                  !['READY', 'FAILED', 'CANCELLED'].includes(
                    lab.result.status || '',
                  )
                "
                data-testid="hybridizer-resubmit"
                @click="lab.resubmit()"
              >
                ✦ Try new art
              </button>
              <button
                v-if="reactionImageId"
                type="button"
                data-testid="hybridizer-upvote"
                :disabled="upvoteBusy"
                @click="upvote()"
              >
                ♥ Upvote <span v-if="upvoteCount">({{ upvoteCount }})</span>
              </button>
              <button
                v-if="reactionImageId"
                type="button"
                data-testid="hybridizer-reactions"
                @click="reactionOpen = true"
              >
                ✎ Comment / rate
              </button>
              <button type="button" @click="shareOpen = !shareOpen">
                ↗ Share
              </button>
            </div>
            <div
              v-if="shareOpen"
              class="hybrid-share"
              aria-label="Share discovery"
            >
              <button type="button" @click="shareFusion('copy')">
                Copy link
              </button>
              <button type="button" @click="shareFusion('x')">X</button>
              <button type="button" @click="shareFusion('facebook')">
                Facebook
              </button>
              <button type="button" @click="shareFusion('reddit')">
                Reddit
              </button>
              <small>Signed-in visitors can view this discovery in Play.</small>
            </div>
            <div
              v-if="lab.versionsFor === lab.result.key && lab.versions.length"
              class="hybrid-versions"
              aria-label="Illustration versions"
            >
              <div class="version-title">
                <span>ARTWORK HISTORY · {{ lab.versions.length }}</span>
                <button
                  v-if="previewJobId"
                  type="button"
                  @click="previewJobId = null"
                >
                  View primary
                </button>
              </div>
              <div class="version-reel kr-scroll">
                <div
                  v-for="version in lab.versions"
                  :key="version.jobId"
                  class="version-item"
                  :class="{
                    active:
                      previewJobId === version.jobId ||
                      (!previewJobId && version.isPrimary),
                  }"
                >
                  <button
                    type="button"
                    class="version-preview"
                    :aria-label="
                      'Preview artwork version ' + (version.revision + 1)
                    "
                    @click="previewJobId = version.jobId"
                  >
                    <img
                      v-if="version.imagePath"
                      :src="version.imagePath"
                      :alt="'Version ' + (version.revision + 1)"
                    />
                    <span v-else>✧</span>
                    <small
                      >V{{ version.revision + 1 }} · {{ version.status }}</small
                    >
                  </button>
                  <span v-if="version.isPrimary" class="primary-flag"
                    >PRIMARY</span
                  >
                  <button
                    v-else-if="lab.canEditResult && version.imagePath"
                    class="promote-version"
                    type="button"
                    :disabled="lab.versionBusy"
                    @click="lab.makePrimary(version.jobId)"
                  >
                    Make primary
                  </button>
                </div>
              </div>
            </div>
            <div v-if="reactionOpen && reactionImageId" class="reaction-layer">
              <div class="reaction-layer-head">
                <strong>Vote &amp; comment on this illustration</strong>
                <button
                  type="button"
                  aria-label="Close reactions"
                  @click="reactionOpen = false"
                >
                  ✕
                </button>
              </div>
              <ReactionCard
                :key="reactionImageId"
                :target-id="reactionImageId"
                target-type="artImage"
                reaction-category="ART_IMAGE"
                :target-title="lab.result.title"
                compact
                @submitted="onReactionSubmitted"
              />
              <section class="hybrid-comments" aria-label="Artwork comments">
                <h3>
                  THE COMMUNITY'S FIELD NOTES · {{ reactionComments.length }}
                </h3>
                <p v-if="!reactionComments.length">
                  No field notes yet. Be the first to comment on this version.
                </p>
                <article v-for="comment in reactionComments" :key="comment.id">
                  <small
                    >Member #{{ comment.userId }} ·
                    {{ comment.reactionType }}</small
                  >
                  <p>{{ comment.comment }}</p>
                </article>
              </section>
            </div>
          </template>
          <template v-else>
            <h2>
              {{
                lab.working
                  ? 'Something impossible is forming…'
                  : 'Awaiting discovery'
              }}
            </h2>
            <div class="empty-study" aria-hidden="true">
              <span class="orb orb-a"></span>
              <span class="orb orb-b"></span>
              <span class="orb orb-c"></span>
              <span class="empty-star">✧</span>
            </div>
            <p class="result-hint">
              {{
                lab.working
                  ? 'The laboratory is recombining its specimens.'
                  : 'Select any two specimens, then energize the chamber.'
              }}
            </p>
          </template>
        </article>
      </section>

      <div
        v-if="lab.readyNotice"
        class="hybrid-ready-notice"
        role="status"
        aria-live="polite"
      >
        <strong>{{ lab.readyNotice.title }} is illustrated!</strong>
        <button
          type="button"
          aria-label="Dismiss artwork notice"
          @click="lab.dismissNotice()"
        >
          ✕
        </button>
      </div>
      <footer class="hybridizer-footer">
        <button
          type="button"
          class="fusion-button"
          :disabled="lab.working"
          data-testid="hybridizer-fuse"
          @click="lab.fuse()"
        >
          <span aria-hidden="true">✦</span>
          {{ lab.working ? 'FUSION IN PROGRESS' : 'ACTIVATE FUSION' }}
          <span aria-hidden="true">✦</span>
        </button>
        <p class="lab-status" role="status">{{ lab.status }}</p>
        <button
          type="button"
          class="atlas-button"
          data-testid="hybridizer-atlas"
          @click="openDrawer('atlas')"
        >
          DISCOVERY SHELF · {{ lab.discoveries.length }}
        </button>
      </footer>
      <div class="hybrid-badges" aria-label="Hybridizer achievements">
        <span
          v-for="badge in badges"
          :key="badge.code"
          :title="badge.tooltip"
          :class="{ earned: achievementStore.hasEarnedCode(badge.code) }"
        >
          {{ achievementStore.hasEarnedCode(badge.code) ? '✦' : '◇' }}
          {{ badge.label }}
        </span>
      </div>

      <aside
        v-if="drawer"
        class="ingredient-drawer"
        aria-label="Ingredient picker"
      >
        <div class="drawer-head">
          <div>
            <p class="eyebrow">
              {{ drawer === 'atlas' ? 'DISCOVERY ATLAS' : 'SPECIMEN DRAWER' }}
            </p>
            <h2>
              {{
                drawer === 'atlas'
                  ? 'Discovery shelf'
                  : 'Choose ' + drawer + ' ingredient'
              }}
            </h2>
          </div>
          <button
            type="button"
            class="drawer-close"
            aria-label="Close picker"
            @click="drawer = null"
          >
            ✕
          </button>
        </div>
        <template v-if="drawer !== 'atlas'">
          <label class="search-wrap">
            <span class="sr-only">Search ingredients</span>
            <input
              v-model="search"
              type="search"
              placeholder="Find an animal, species, fruit or curiosity…"
            />
          </label>
          <div class="type-filters" aria-label="Filter ingredients">
            <button
              v-for="option in filters"
              :key="option"
              type="button"
              :class="{ selected: filter === option }"
              :aria-pressed="filter === option"
              @click="filter = option"
            >
              {{ option }}
            </button>
          </div>
        </template>
        <div class="ingredient-grid kr-scroll">
          <button
            v-for="entry in visibleEntries"
            :key="entry.key"
            type="button"
            class="ingredient-option"
            :aria-label="'Select ' + entry.title"
            @click="pick(entry.key)"
          >
            <img
              v-if="lab.imageFor(entry)"
              :src="lab.imageFor(entry) || undefined"
              :alt="entry.title"
            />
            <span v-else class="option-glyph" aria-hidden="true">{{
              glyphFor(entry.title, entry.taxonomy)
            }}</span>
            <strong>{{ entry.title }}</strong>
            <em v-if="lab.artPending(entry)" class="art-pending">Art queued</em>
            <small>{{
              entry.taxonomy === 'OTHER' && entry.facetGroup === 'fruit'
                ? 'FRUIT'
                : entry.taxonomy
            }}</small>
          </button>
          <p v-if="!visibleEntries.length" class="empty-filter">
            {{
              drawer === 'atlas'
                ? 'Your local discovery shelf is empty. Try a fusion.'
                : 'No ingredients match your search.'
            }}
          </p>
        </div>
        <p class="drawer-foot">
          Shared matches are remembered across players. Missing artwork is
          queued through the ArtJob relay while you keep exploring.
        </p>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import ReactionCard from '@/components/wonderlab/reaction-card.vue'
import { achievementsForGame } from '@/utils/achievements/gameAchievements'
import { useAchievementStore } from '@/stores/achievementStore'
import {
  useReactionStore,
  getReactionTargetPayload,
} from '@/stores/reactionStore'
import { useUserStore } from '@/stores/userStore'
import { useHybridizerStore } from '@/stores/hybridizerStore'

const lab = useHybridizerStore()
const achievementStore = useAchievementStore()
const reactionStore = useReactionStore()
const userStore = useUserStore()
const route = useRoute()
const previewJobId = ref<number | null>(null)
const reactionOpen = ref(false)
const shareOpen = ref(false)
const previewVersion = computed(() =>
  lab.versionsFor === lab.result?.key
    ? lab.versions.find((version) => version.jobId === previewJobId.value)
    : undefined,
)
const previewArt = computed(() =>
  previewVersion.value
    ? previewVersion.value.imagePath
    : lab.imageFor(lab.result),
)
const reactionImageId = computed(() =>
  previewVersion.value
    ? previewVersion.value.artImageId
    : lab.result?.artImageId,
)
const badges = achievementsForGame('hybridizer')
const imageReactions = computed(() =>
  reactionImageId.value
    ? reactionStore.getReactionsByArtImageId(reactionImageId.value)
    : [],
)
const upvoteCount = computed(
  () =>
    new Set(
      imageReactions.value
        .filter(
          (reaction) =>
            reaction.reactionType === 'LOVED' ||
            reaction.reactionType === 'CLAPPED',
        )
        .map((reaction) => reaction.userId),
    ).size,
)
const reactionComments = computed(() =>
  imageReactions.value
    .filter((reaction) => reaction.comment?.trim())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 25),
)
watch(
  reactionImageId,
  (id) => {
    if (id) void reactionStore.fetchReactionsByArtImageId(id)
  },
  { immediate: true },
)
async function onReactionSubmitted() {
  reactionOpen.value = false
  if (reactionImageId.value)
    await reactionStore.fetchReactionsByArtImageId(reactionImageId.value, true)
}
const upvoteBusy = ref(false)
async function upvote() {
  if (!reactionImageId.value || upvoteBusy.value) return
  upvoteBusy.value = true
  try {
    const id = reactionImageId.value
    await reactionStore.fetchReactionsByArtImageId(id)
    const existing = userStore.userId
      ? reactionStore.getUserReactionForArtImage(id, userStore.userId)
      : undefined
    const saved = existing
      ? await reactionStore.updateReaction(existing.id, {
          reactionType: 'LOVED',
          rating: 5,
        })
      : await reactionStore.addReaction({
          ...getReactionTargetPayload('artImage', id),
          rating: 5,
          reactionType: 'LOVED',
          reactionCategory: 'ART_IMAGE',
        })
    if (saved) void reactionStore.fetchReactionsByArtImageId(id, true)
    lab.status = saved
      ? 'Your upvote is attached to this artwork version.'
      : reactionStore.lastError ||
        'Could not submit upvote. Sign in and try again.'
  } catch (error) {
    lab.status =
      error instanceof Error
        ? error.message
        : 'Could not submit upvote. Sign in and try again.'
  } finally {
    upvoteBusy.value = false
  }
}
watch(
  () => lab.result?.key,
  () => {
    previewJobId.value = null
    reactionOpen.value = false
    shareOpen.value = false
  },
)
async function shareFusion(platform: 'copy' | 'x' | 'facebook' | 'reddit') {
  const id = lab.result?.key.startsWith('fusion:')
    ? lab.result.key.slice(7)
    : null
  if (!id || !import.meta.client) return
  const url = new URL('/play/hybridizer', window.location.origin)
  url.searchParams.set('fusion', id)
  const link = url.toString()
  const title = lab.result?.title || 'Hybridizer discovery'
  if (platform === 'copy') {
    try {
      await navigator.clipboard.writeText(link)
      lab.status =
        'Discovery link copied. Signed-in visitors can view it in Play.'
    } catch {
      lab.status =
        'Clipboard unavailable. Use your browser address bar to copy the discovery URL.'
    }
  } else {
    const destination =
      platform === 'x'
        ? 'https://twitter.com/intent/tweet?' +
          new URLSearchParams({ text: title, url: link })
        : platform === 'facebook'
          ? 'https://www.facebook.com/sharer/sharer.php?' +
            new URLSearchParams({ u: link })
          : 'https://www.reddit.com/submit?' +
            new URLSearchParams({ url: link, title })
    window.open(destination, '_blank', 'noopener,noreferrer')
  }
}

const drawer = ref<'left' | 'right' | 'atlas' | null>(null)
const search = ref('')
const filter = ref('ALL')
const filters = [
  'ALL',
  'ANIMAL',
  'SPECIES',
  'FRUIT',
  'ARCHETYPE',
  'OTHER',
  'HYBRID',
]

const visibleEntries = computed(() => {
  if (drawer.value === 'atlas') return [...lab.discoveries].reverse()
  const word = search.value.toLowerCase().trim()
  return lab.inputs.filter((entry) => {
    const type =
      entry.taxonomy === 'OTHER' && entry.facetGroup === 'fruit'
        ? 'FRUIT'
        : entry.taxonomy
    return (
      (filter.value === 'ALL' || type === filter.value) &&
      (!word || entry.title.toLowerCase().includes(word))
    )
  })
})

function openDrawer(side: 'left' | 'right' | 'atlas') {
  drawer.value = side
  search.value = ''
  filter.value = side === 'atlas' ? 'HYBRID' : 'ALL'
}

function pick(key: string) {
  if (drawer.value === 'left' || drawer.value === 'right')
    lab.choose(drawer.value, key)
  else lab.choose('left', key)
  drawer.value = null
}

function glyphFor(title?: string, taxonomy?: string): string {
  const value = (title || '').toLowerCase()
  if (value.includes('banana')) return '🍌'
  if (value.includes('cat')) return '🐈'
  if (value.includes('vampire')) return '🦇'
  if (value.includes('zombie')) return '🧟'
  if (value.includes('dog')) return '🐕'
  if (value.includes('dragon')) return '🐉'
  if (taxonomy === 'ANIMAL') return '🦊'
  if (taxonomy === 'SPECIES') return '🧬'
  if (taxonomy === 'OTHER') return '🍓'
  if (taxonomy === 'ARCHETYPE') return '🎭'
  return '✧'
}

onMounted(() => {
  lab.hydrate()
  void lab.loadArtwork()
  void lab.loadSharedStudies().then(() => {
    const id = route.query.fusion
    if (typeof id === 'string') void lab.openSharedFusion(id)
  })
  lab.startArtworkWatch()
})
onUnmounted(() => lab.stopArtworkWatch())
</script>

<style scoped>
.hybridizer-root {
  min-height: 0;
  height: 100%;
  overflow: hidden;
  color: #fff1e8;
  background: radial-gradient(
    ellipse at 56% 36%,
    #553365 0%,
    #281a45 46%,
    #140f29 100%
  );
  container-type: inline-size;
}

.hybridizer-console {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: clamp(9px, 1.4vw, 18px);
  height: 100%;
  min-height: 0;
  padding: clamp(12px, 2vw, 25px);
  background-image: radial-gradient(#b8a9d32b 1px, transparent 1px);
  background-size: 27px 27px;
}

.hybridizer-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  min-height: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #957b9e50;
}

.eyebrow {
  font-size: clamp(0.56rem, 0.85vw, 0.75rem);
  font-weight: 900;
  letter-spacing: 0.21em;
  color: #d3b9db;
}

.hybridizer-header .lab-title {
  font-size: clamp(1.55rem, 3.8vw, 3.1rem);
  letter-spacing: 0.18em;
  font-weight: 950;
  line-height: 1.12;
  color: #fff2d8;
}

.subtitle {
  font-size: clamp(0.66rem, 1vw, 0.87rem);
  letter-spacing: 0.075em;
  color: #d4f0b3;
  font-weight: 700;
}

.header-count {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  column-gap: 15px;
  align-items: center;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  color: #d8c7de;
}

.header-count strong {
  font-size: 1.3rem;
  color: #def19d;
}

.hybridizer-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr) minmax(0, 1.7fr);
  gap: clamp(7px, 1vw, 14px);
  min-height: 0;
  height: 100%;
}

.specimen-chamber,
.hybridizer-result {
  min-height: 0;
  overflow: hidden;
  border: 2px solid #9a78a4;
  border-radius: 24px;
  background: linear-gradient(145deg, #38465bba, #2a2147c9 48%, #593774ad);
  box-shadow:
    0 9px 22px #12092599,
    inset 0 0 0 7px #28204478;
}

.specimen-chamber {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: clamp(8px, 1.2vw, 16px);
  transition:
    transform 0.18s,
    border-color 0.18s;
}

.specimen-chamber:hover,
.specimen-chamber:focus-visible {
  border-color: #e5f2a3;
  transform: translateY(-2px);
}

.chamber-label span {
  font-size: 0.66rem;
  letter-spacing: 0.2em;
  color: #ded1e5;
  font-weight: 900;
}

.chamber-label strong {
  display: block;
  font-size: clamp(0.9rem, 1.6vw, 1.75rem);
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.specimen-art {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.specimen-image {
  object-fit: contain;
  width: 100%;
  height: 100%;
  max-height: 100%;
  filter: drop-shadow(0 12px 15px #0b0826);
}

.specimen-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  position: relative;
}

.specimen-glow {
  position: absolute;
  width: 85%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #cfec94aa,
    #bd84dc22 56%,
    transparent 75%
  );
}

.specimen-glyph {
  position: relative;
  font-size: clamp(3.5rem, 9vw, 9rem);
  filter: drop-shadow(0 17px 16px #130c2c);
}

.chamber-bottom {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  font-size: 0.66rem;
  color: #e1c6e7;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.chamber-bottom span {
  color: #d6eda0;
}

.hybridizer-machine {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  min-width: 0;
  gap: 10px;
}

.core {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 9px solid #bd8b9b;
  border-radius: 50%;
  background: #23163d;
  color: #ebffb0;
  font-size: 2.5rem;
  font-weight: 700;
  z-index: 1;
  box-shadow: 0 0 37px #d7f3b544;
}

.coil {
  position: absolute;
  width: 66px;
  height: 66px;
  border: 2px dashed #d6f8a9;
  border-radius: 50%;
  opacity: 0.6;
}

.coil-two {
  width: 91px;
  height: 91px;
  border-color: #d991d8;
  opacity: 0.27;
}

.machine-caption {
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  color: #effbb4;
}

.is-working .coil-one {
  animation: coil-spin 0.5s linear infinite;
}

.is-working .coil-two {
  animation: coil-spin 0.8s linear infinite reverse;
}

.is-working .core {
  box-shadow:
    0 0 70px #ddf3aacc,
    0 0 120px #c27ff4aa;
}

.hybridizer-result {
  position: relative;
  padding: clamp(10px, 1.5vw, 20px);
  display: flex;
  flex-direction: column;
}

.hybridizer-result h2 {
  font-size: clamp(0.95rem, 2vw, 2rem);
  line-height: 1.1;
  font-weight: 900;
  margin: 0.4rem 0 0.6rem;
}

.fusion-study,
.empty-study {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.fusion-study:before,
.empty-study:before {
  content: '';
  position: absolute;
  inset: 8% 10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #d2ef9b48,
    #9254c22a 48%,
    transparent 75%
  );
  z-index: -1;
}

.fusion-part {
  width: 52%;
  height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(3rem, 7vw, 7.5rem);
  filter: drop-shadow(0 15px 12px #171026);
  overflow: hidden;
}

.fusion-part:first-child {
  transform: rotate(-9deg) translateX(12%);
}

.fusion-part:nth-child(3) {
  transform: rotate(9deg) translateX(-12%);
}

.fusion-part img {
  height: 100%;
  width: 100%;
  object-fit: contain;
}

.fusion-lightning {
  font-size: clamp(3rem, 7vw, 7rem);
  color: #dfffa2;
  position: absolute;
  text-shadow: 0 0 19px #aaf1d4;
}

.empty-star {
  font-size: clamp(5rem, 10vw, 10rem);
  color: #e2f3a3;
  text-shadow: 0 0 45px #ddf8af;
}

.orb {
  position: absolute;
  width: 40%;
  height: 55%;
  border: 1px dashed #b29bc28a;
  border-radius: 50%;
}

.orb-a {
  transform: rotate(28deg);
}

.orb-b {
  transform: rotate(-43deg);
}

.orb-c {
  transform: rotate(80deg);
}

.result-foot {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 10px;
}

.study-label,
.result-hint {
  font-size: clamp(0.58rem, 0.85vw, 0.78rem);
  font-weight: 800;
  color: #ecd6f5;
  line-height: 1.4;
  letter-spacing: 0.03em;
}

.remix-button {
  color: #e6f5aa;
  border: 1px solid #b8d79388;
  border-radius: 10px;
  padding: 8px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.hybridizer-footer {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.2fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 0;
}

.fusion-button {
  padding: 13px 9px;
  background: #d5f28b;
  color: #251734;
  border: 2px solid #f0ffc7;
  border-radius: 16px;
  font-weight: 950;
  font-size: clamp(0.76rem, 1.1vw, 1rem);
  letter-spacing: 0.13em;
  box-shadow: 0 5px 0 #71965b66;
}

.fusion-button:disabled {
  opacity: 0.7;
  cursor: progress;
}

.lab-status {
  color: #dbc5e7;
  font-size: 0.75rem;
  line-height: 1.3;
}

.atlas-button {
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 12px;
  border-radius: 12px;
  background: #4b3163;
  border: 1px solid #b78ebc;
}

.ingredient-drawer {
  position: absolute;
  inset: clamp(8px, 1vw, 16px);
  background: #221833f7;
  border: 2px solid #c69bbd;
  border-radius: 22px;
  padding: clamp(10px, 1.6vw, 22px);
  box-shadow:
    0 0 0 70px #130c2f88,
    0 16px 30px #060409aa;
  z-index: 12;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 10px;
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-head h2 {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 900;
}

.drawer-close {
  border: 1px solid #bd9cca;
  border-radius: 12px;
  padding: 8px 13px;
  font-size: 1.25rem;
}

.search-wrap input {
  width: 100%;
  background: #3d2d56;
  border: 1px solid #8d76a3;
  border-radius: 11px;
  padding: 11px;
  color: #fff;
}

.type-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.type-filters button {
  border: 1px solid #836f9d;
  border-radius: 18px;
  padding: 7px 11px;
  white-space: nowrap;
  font-size: 0.71rem;
  font-weight: 900;
}

.type-filters button.selected {
  background: #d4f089;
  color: #22162a;
  border-color: #e2ffc7;
}

.ingredient-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  align-content: start;
  gap: 9px;
}

.ingredient-option {
  display: flex;
  flex-direction: column;
  min-width: 0;
  align-items: center;
  text-align: center;
  gap: 5px;
  border: 1px solid #987db1;
  border-radius: 14px;
  padding: 8px;
  background: linear-gradient(155deg, #35425b, #39234e);
}

.ingredient-option:hover,
.ingredient-option:focus-visible {
  border-color: #e0ffae;
}

.ingredient-option img {
  height: 85px;
  width: 100%;
  object-fit: contain;
}

.art-pending {
  position: relative;
  font-size: 0.62rem;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e0ffae;
  opacity: 0.8;
}

.option-glyph {
  height: 85px;
  display: grid;
  place-items: center;
  font-size: 2.6rem;
}

.ingredient-option strong {
  font-size: 0.85rem;
  line-height: 1.12;
}

.ingredient-option small {
  font-size: 0.61rem;
  letter-spacing: 0.08em;
  color: #d8e3a6;
}

.empty-filter {
  grid-column: 1/-1;
  place-self: center;
  color: #dbcde4;
}

.drawer-foot {
  font-size: 0.7rem;
  color: #cfbcd9;
}

@keyframes coil-spin {
  to {
    transform: rotate(360deg);
  }
}

@container (max-width: 820px) {
  .hybridizer-stage {
    grid-template-columns: minmax(0, 1fr) 52px minmax(0, 1fr);
    grid-template-rows: minmax(0, 0.46fr) minmax(0, 0.54fr);
  }
  .left-chamber {
    grid-column: 1;
    grid-row: 1;
  }
  .hybridizer-machine {
    grid-column: 2;
    grid-row: 1;
  }
  .right-chamber {
    grid-column: 3;
    grid-row: 1;
  }
  .hybridizer-result {
    grid-column: 1/4;
    grid-row: 2;
  }
  .specimen-glyph {
    font-size: clamp(3rem, 15vw, 7rem);
  }
  .hybridizer-footer {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .fusion-button {
    grid-column: 1/3;
  }
  .lab-status {
    grid-column: 1;
  }
  .atlas-button {
    grid-column: 2;
  }
  .result-foot {
    align-items: center;
  }
}

@container (max-width: 440px) {
  .hybridizer-header .lab-title {
    font-size: 1.46rem;
    letter-spacing: 0.085em;
  }
  .subtitle {
    font-size: 0.59rem;
  }
  .header-count {
    column-gap: 6px;
    letter-spacing: 0;
    font-size: 0.54rem;
  }
  .header-count strong {
    font-size: 0.9rem;
  }
  .hybridizer-console {
    padding: 8px;
    gap: 7px;
  }
  .hybridizer-stage {
    grid-template-columns: minmax(0, 1fr) 37px minmax(0, 1fr);
  }
  .specimen-chamber,
  .hybridizer-result {
    border-radius: 13px;
  }
  .specimen-chamber {
    padding: 7px;
  }
  .chamber-label strong {
    font-size: 0.82rem;
  }
  .chamber-label span {
    font-size: 0.53rem;
  }
  .chamber-bottom {
    font-size: 0.53rem;
  }
  .core {
    width: 38px;
    height: 38px;
    border-width: 5px;
    font-size: 1.8rem;
  }
  .coil {
    width: 45px;
    height: 45px;
  }
  .coil-two {
    width: 53px;
    height: 53px;
  }
  .machine-caption {
    font-size: 0.52rem;
  }
  .hybridizer-result {
    padding: 10px;
  }
  .hybridizer-result h2 {
    font-size: 1.13rem;
  }
  .study-label,
  .result-hint {
    font-size: 0.6rem;
  }
  .remix-button {
    font-size: 0.62rem;
    padding: 6px;
    white-space: normal;
  }
  .lab-status {
    font-size: 0.61rem;
  }
  .atlas-button {
    font-size: 0.61rem;
    padding: 8px;
  }
  .fusion-button {
    padding: 9px;
    font-size: 0.75rem;
  }
  .ingredient-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-working .coil,
  .specimen-chamber {
    animation: none;
    transition: none;
  }
}

.fusion-generated {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 16px 24px #130c2c);
}
.hybrid-ready-notice {
  position: absolute;
  z-index: 7;
  right: 2rem;
  bottom: 5.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: min(28rem, 80%);
  padding: 0.7rem 1rem;
  border: 1px solid #d9f5a7;
  border-radius: 1rem;
  background: #241935;
  color: #efffbb;
  box-shadow: 0 8px 30px #0b0816b0;
}
.hybrid-ready-notice button {
  color: inherit;
  font-weight: 800;
}

/* Keep revisions subordinate to the painted reveal. History scrolls in one
   bounded horizontal reel instead of pushing the main art offscreen. */
.hybrid-actions,
.hybrid-share {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.hybrid-actions button,
.hybrid-share button,
.version-title button,
.promote-version {
  padding: 5px 8px;
  border: 1px solid #d4e6a48a;
  border-radius: 9px;
  color: #efffc8;
  font-size: 0.7rem;
  font-weight: 800;
}
.hybrid-actions button:disabled,
.promote-version:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hybrid-share small {
  width: 100%;
  font-size: 0.6rem;
  color: #eed4ff;
}
.hybrid-versions {
  min-width: 0;
}
.version-title {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-weight: 900;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
  color: #e9f5ad;
}
.version-reel {
  display: flex;
  gap: 7px;
  min-width: 0;
  overflow-x: auto;
  padding: 6px 2px;
}
.version-item {
  flex: 0 0 78px;
  border: 1px solid #a78da8;
  border-radius: 10px;
  overflow: hidden;
  text-align: center;
}
.version-item.active {
  border-color: #e1fba9;
  box-shadow: 0 0 0 1px #e1fba9;
}
.version-preview {
  width: 100%;
  display: block;
}
.version-preview img,
.version-preview > span {
  display: block;
  width: 100%;
  height: 54px;
  object-fit: contain;
  background: #21132e;
}
.version-preview > span {
  font-size: 2rem;
}
.version-preview small {
  font-size: 0.53rem;
  display: block;
}
.primary-flag {
  display: block;
  color: #def1a7;
  font-size: 0.55rem;
}
.promote-version {
  width: 100%;
  font-size: 0.55rem;
  padding: 4px 1px;
}
.reaction-layer {
  position: absolute;
  z-index: 20;
  inset: 6px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #d8e7a4;
  border-radius: 16px;
  background: #251733;
}
.reaction-layer-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.reaction-layer-head button {
  font-size: 1.1rem;
}
.hybrid-badges {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  color: #d2c1da;
}
.hybrid-badges span {
  flex: 0 0 auto;
  font-size: 0.63rem;
  font-weight: 800;
}
.hybrid-badges .earned {
  color: #e6fba4;
}
.hybrid-comments {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}
.hybrid-comments h3 {
  font-size: 0.75rem;
  color: #e9f5ad;
  font-weight: 900;
}
.hybrid-comments article {
  border: 1px solid #c7adcc55;
  border-radius: 10px;
  padding: 8px;
  background: #381d48;
}
.hybrid-comments article small {
  color: #e5cbe9;
  font-size: 0.64rem;
}
.hybrid-comments article p {
  overflow-wrap: anywhere;
  font-size: 0.8rem;
}
</style>
