<template>
  <main class="kr-surface hybridizer-root" data-testid="hybridizer-lab">
    <div class="hybridizer-console" :class="{ 'is-working': lab.working }">
      <header-page-bar compact>
        <div
          class="hybridizer-bar"
          title="Kind Robots / Experiment 014 — every creature has an impossible cousin."
        >
          <span class="hybridizer-bar-chip">
            <strong>{{ lab.starterCount }}</strong> starters
          </span>
          <span class="hybridizer-bar-chip">
            <strong>{{ lab.discoveryTotal ?? lab.discoveries.length }}</strong>
            shared discoveries
          </span>
        </div>
      </header-page-bar>

      <section class="hybridizer-stage" aria-label="Creature fusion laboratory">
        <div class="specimen-slot left-chamber">
          <button
            type="button"
            class="specimen-chamber"
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
          <button
            v-if="lab.left && lab.imageFor(lab.left)"
            type="button"
            class="favorite-heart chamber-heart"
            :class="{ active: lab.isFavorite(lab.left.key) }"
            :aria-label="
              lab.isFavorite(lab.left.key)
                ? 'Remove left ingredient from favorites'
                : 'Favorite left ingredient'
            "
            :aria-pressed="lab.isFavorite(lab.left.key)"
            @click="lab.toggleFavorite(lab.left.key)"
          >
            {{ lab.isFavorite(lab.left.key) ? '♥' : '♡' }}
          </button>
        </div>

        <div class="hybridizer-machine" aria-hidden="true">
          <span class="coil coil-one"></span>
          <span class="coil coil-two"></span>
          <span class="core">×</span>
          <span class="machine-caption">{{
            lab.working ? 'FUSING' : 'MIX'
          }}</span>
        </div>

        <div class="specimen-slot right-chamber">
          <button
            type="button"
            class="specimen-chamber"
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
          <button
            v-if="lab.right && lab.imageFor(lab.right)"
            type="button"
            class="favorite-heart chamber-heart"
            :class="{ active: lab.isFavorite(lab.right.key) }"
            :aria-label="
              lab.isFavorite(lab.right.key)
                ? 'Remove right ingredient from favorites'
                : 'Favorite right ingredient'
            "
            :aria-pressed="lab.isFavorite(lab.right.key)"
            @click="lab.toggleFavorite(lab.right.key)"
          >
            {{ lab.isFavorite(lab.right.key) ? '♥' : '♡' }}
          </button>
        </div>

        <article class="hybridizer-result" aria-live="polite">
          <p class="eyebrow">THE DISCOVERY CHAMBER</p>
          <span
            v-if="lab.reusedArtwork && previewArt"
            class="known-art-mark"
            data-testid="hybridizer-known-art"
            title="This pairing already has saved artwork"
            >✦ ART IN ARCHIVE</span
          >
          <template v-if="lab.result">
            <h2 data-testid="hybridizer-result-title">
              {{ lab.result.title }}
            </h2>
            <div
              class="fusion-study"
              aria-label="Hybrid creature artwork or source composition preview"
            >
              <button
                v-if="previewArt"
                type="button"
                class="favorite-heart result-heart"
                :class="{ active: lab.isFavorite(lab.result.key) }"
                :aria-label="
                  lab.isFavorite(lab.result.key)
                    ? 'Remove discovery from favorites'
                    : 'Favorite discovery'
                "
                :aria-pressed="lab.isFavorite(lab.result.key)"
                @click="lab.toggleFavorite(lab.result.key)"
              >
                {{ lab.isFavorite(lab.result.key) ? '♥' : '♡' }}
              </button>
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
                @click="remixEditorOpen = !remixEditorOpen"
              >
                ✦ {{ remixEditorOpen ? 'Close remix' : 'Remix artwork' }}
              </button>
              <button
                v-if="lab.result.isPublic === true && reactionImageId"
                type="button"
                data-testid="hybridizer-upvote"
                :disabled="upvoteBusy"
                @click="upvote()"
              >
                ♥ Upvote <span v-if="upvoteCount">({{ upvoteCount }})</span>
              </button>
              <button
                v-if="lab.result.isPublic === true && reactionImageId"
                type="button"
                data-testid="hybridizer-reactions"
                @click="reactionOpen = true"
              >
                ✎ Comment / rate
              </button>
              <button
                v-if="lab.result.isPublic === true"
                type="button"
                @click="shareOpen = !shareOpen"
              >
                ↗ Share
              </button>
              <span v-else class="study-label"
                >Private study · sharing disabled</span
              >
            </div>
            <form
              v-if="remixEditorOpen && lab.canEditResult"
              class="remix-editor"
              aria-label="Create new artwork version"
              @submit.prevent="submitRemix"
            >
              <div class="reaction-layer-head">
                <strong>REMIX THE ILLUSTRATION</strong>
                <button
                  type="button"
                  aria-label="Close remix editor"
                  @click="remixEditorOpen = false"
                >
                  ✕
                </button>
              </div>
              <p>
                The same discovery, new artistic interpretation. Earlier
                versions stay saved.
              </p>
              <label class="remix-balance">
                <span
                  >Balance · {{ focusWeight }}%
                  {{ lab.left?.title || 'first' }} / {{ 100 - focusWeight }}%
                  {{ lab.right?.title || 'second' }}</span
                >
                <input
                  v-model.number="focusWeight"
                  type="range"
                  min="10"
                  max="90"
                  step="10"
                />
              </label>
              <label>
                <span>Additional art direction (optional)</span>
                <textarea
                  v-model="remixDirection"
                  rows="3"
                  maxlength="500"
                  placeholder="Try brighter colors, longer whiskers, a peel-shaped tail…"
                ></textarea>
              </label>
              <button
                type="submit"
                class="remix-submit"
                :disabled="lab.versionBusy || !lab.left"
              >
                {{ lab.versionBusy ? 'Submitting…' : '✦ Queue this version' }}
              </button>
            </form>
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
              <div class="version-reel">
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
          :disabled="lab.working || lab.randomizing"
          data-testid="hybridizer-fuse"
          @click="lab.fuse()"
        >
          <span aria-hidden="true">✦</span>
          {{ lab.working ? 'FUSION IN PROGRESS' : 'ACTIVATE FUSION' }}
          <span aria-hidden="true">✦</span>
        </button>
        <p class="lab-status" role="status">{{ lab.status }}</p>
        <div class="hybridizer-tools">
          <button
            type="button"
            class="tool-button"
            data-testid="hybridizer-random"
            :disabled="lab.randomizing || lab.working"
            @click="lab.randomize()"
            title="Random illustrated ingredients"
          >
            <span aria-hidden="true">🎲</span>
            {{ lab.randomizing ? 'Rolling…' : 'Surprise' }}
          </button>
          <button
            type="button"
            class="tool-button"
            data-testid="hybridizer-favorites"
            @click="openDrawer('favorites')"
            title="Your favorite illustrations"
          >
            <span aria-hidden="true">♥</span> Favorites
          </button>
          <button
            type="button"
            class="tool-button"
            data-testid="hybridizer-settings"
            @click="openDrawer('settings')"
            title="Hybridizer settings"
          >
            <span aria-hidden="true">⚙</span> Settings
          </button>
          <button
            type="button"
            class="atlas-button"
            data-testid="hybridizer-atlas"
            @click="openDrawer('atlas')"
          >
            Atlas · {{ lab.discoveryTotal ?? lab.discoveries.length }}
          </button>
        </div>
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
              {{
                drawer === 'atlas'
                  ? 'DISCOVERY ATLAS'
                  : drawer === 'favorites'
                    ? 'YOUR COLLECTION'
                    : drawer === 'settings'
                      ? 'LAB SETTINGS'
                      : 'SPECIMEN DRAWER'
              }}
            </p>
            <h2>
              {{
                drawer === 'atlas'
                  ? 'Discovery shelf'
                  : drawer === 'favorites'
                    ? 'Favorite creatures'
                    : drawer === 'settings'
                      ? 'Laboratory settings'
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
        <div v-if="drawer === 'atlas'" class="atlas-summary" role="status">
          <span
            ><strong>{{ lab.discoveryTotal ?? lab.discoveries.length }}</strong>
            saved discoveries</span
          >
          <span>{{ lab.readyTotal }} art-ready</span>
          <span>{{ lab.renderingTotal }} rendering</span>
        </div>
        <section
          v-if="drawer === 'settings'"
          class="hybridizer-settings"
          aria-label="Laboratory settings"
        >
          <label class="settings-choice">
            <input
              type="checkbox"
              :checked="lab.randomStartersOnly"
              @change="onBaseOnlyChanged"
            />
            <span
              ><strong>Only the original 200</strong
              ><small
                >🎲 Surprise selects two illustrated starters. Turn this off to
                include illustrated reusable hybrids as well.</small
              ></span
            >
          </label>
          <p class="settings-note">
            Only ingredients with delivered, accessible pictures can be randomly
            selected. Favorites and settings are saved in this browser for the
            current account.
          </p>
        </section>
        <template v-if="drawer === 'favorites'">
          <p class="atlas-loaded">
            {{ lab.favoriteEntries.length }} illustrated favorites. Tap an image
            to explore it.
          </p>
        </template>
        <template v-if="drawer === 'atlas'">
          <label class="search-wrap">
            <span class="sr-only">Search all discoveries</span>
            <input
              v-model="search"
              type="search"
              placeholder="Search loaded discoveries…"
            />
          </label>
          <div class="type-filters" aria-label="Filter discovery status">
            <button
              v-for="option in atlasFilters"
              :key="option.value"
              type="button"
              :class="{ selected: atlasStatus === option.value }"
              :aria-pressed="atlasStatus === option.value"
              @click="atlasStatus = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <p class="atlas-loaded">
            {{ lab.atlasEntries.length }} of
            {{ lab.atlasFilteredTotal }} matching discoveries loaded. Rendering
            requests are not completed art.
          </p>
        </template>
        <template v-else-if="drawer !== 'favorites' && drawer !== 'settings'">
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
        <div v-if="drawer !== 'settings'" class="ingredient-grid kr-scroll">
          <div
            v-for="entry in visibleEntries"
            :key="entry.key"
            class="ingredient-tile"
          >
            <button
              type="button"
              class="ingredient-option"
              :aria-label="
                drawer === 'atlas' || drawer === 'favorites'
                  ? 'View ' + entry.title + ' artwork'
                  : 'Select ' + entry.title
              "
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
              <em v-if="lab.artPending(entry)" class="art-pending"
                >Art queued</em
              >
              <small
                v-if="drawer === 'atlas' || drawer === 'favorites'"
                class="atlas-entry-status"
              >
                {{
                  entry.status === 'READY' && lab.imageFor(entry)
                    ? '✦ ART READY · VIEW / RATE'
                    : (entry.status || 'STUDY') + ' · VIEW'
                }}
              </small>
              <small v-else>{{
                entry.taxonomy === 'OTHER' && entry.facetGroup === 'fruit'
                  ? 'FRUIT'
                  : entry.taxonomy
              }}</small>
            </button>
            <button
              v-if="lab.imageFor(entry)"
              type="button"
              class="favorite-heart tile-heart"
              :class="{ active: lab.isFavorite(entry.key) }"
              :aria-label="
                lab.isFavorite(entry.key)
                  ? 'Remove ' + entry.title + ' from favorites'
                  : 'Favorite ' + entry.title
              "
              :aria-pressed="lab.isFavorite(entry.key)"
              @click.stop="lab.toggleFavorite(entry.key)"
            >
              {{ lab.isFavorite(entry.key) ? '♥' : '♡' }}
            </button>
          </div>
          <p v-if="!visibleEntries.length" class="empty-filter">
            {{
              drawer === 'favorites'
                ? 'No illustrated favorites yet. Tap ♡ on any artwork.'
                : drawer === 'atlas'
                  ? 'No discoveries match this filter.'
                  : 'No ingredients match your search.'
            }}
          </p>
          <button
            v-if="drawer === 'atlas' && lab.atlasCanLoadMore"
            type="button"
            class="atlas-load-more"
            :disabled="lab.atlasLoading"
            @click="lab.loadAtlas(false, atlasStatus, search)"
          >
            {{ lab.atlasLoading ? 'Loading atlas…' : 'Load more discoveries' }}
          </button>
        </div>
        <p v-if="drawer !== 'settings'" class="drawer-foot">
          {{
            drawer === 'favorites'
              ? 'Tap ♡ again to remove a favorite.'
              : 'Discoveries are shared. Missing art continues through the art relay while you explore.'
          }}
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
const remixEditorOpen = ref(false)
const remixDirection = ref('')
const focusWeight = ref(50)
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
  lab.result?.isPublic !== true
    ? null
    : previewVersion.value
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
    remixEditorOpen.value = false
    remixDirection.value = ''
    focusWeight.value = 50
  },
)
async function shareFusion(platform: 'copy' | 'x' | 'facebook' | 'reddit') {
  const id = lab.result?.key.startsWith('fusion:')
    ? lab.result.key.slice(7)
    : null
  if (!id || !import.meta.client) return
  if (lab.result?.isPublic !== true) {
    lab.status = 'This study is private. Sharing is disabled.'
    return
  }
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

const drawer = ref<
  'left' | 'right' | 'atlas' | 'favorites' | 'settings' | null
>(null)
const atlasStatus = ref<'ALL' | 'READY' | 'IN_PROGRESS' | 'OTHER'>('ALL')
const atlasFilters = [
  { value: 'ALL', label: 'All' },
  { value: 'READY', label: 'Illustrated' },
  { value: 'IN_PROGRESS', label: 'Rendering' },
  { value: 'OTHER', label: 'Unillustrated' },
] as const
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
  if (drawer.value === 'atlas') return lab.atlasEntries
  if (drawer.value === 'favorites') return lab.favoriteEntries
  const word = search.value.toLowerCase().trim()
  return lab.inputs.filter((entry) => {
    const type =
      entry.taxonomy === 'OTHER' && entry.facetGroup === 'fruit'
        ? 'FRUIT'
        : entry.taxonomy
    return (
      (filter.value === 'ALL' || filter.value === type) &&
      (!word || entry.title.toLowerCase().includes(word))
    )
  })
})

let atlasSearchTimer: ReturnType<typeof setTimeout> | null = null
watch([drawer, atlasStatus, search], () => {
  if (drawer.value !== 'atlas') return
  if (atlasSearchTimer) clearTimeout(atlasSearchTimer)
  atlasSearchTimer = setTimeout(() => {
    void lab.loadAtlas(true, atlasStatus.value, search.value)
  }, 250)
})

function onBaseOnlyChanged(event: Event) {
  lab.setRandomStartersOnly((event.target as HTMLInputElement).checked)
}

function openDrawer(
  side: 'left' | 'right' | 'atlas' | 'favorites' | 'settings',
) {
  drawer.value = side
  search.value = ''
  filter.value = 'ALL'
  atlasStatus.value = 'ALL'
  if (side === 'favorites') void lab.loadFavoriteRecords()
}

function pick(key: string) {
  if (drawer.value === 'left' || drawer.value === 'right') {
    lab.choose(drawer.value, key)
  } else if (key.startsWith('fusion:')) {
    lab.selectAtlasDiscovery(key)
  } else {
    lab.choose('left', key)
  }
  drawer.value = null
}

async function submitRemix() {
  if (!lab.left) return
  await lab.resubmit({
    focusKey: lab.left.key,
    focusWeight: focusWeight.value,
    direction: remixDirection.value,
  })
  if (lab.result?.status === 'QUEUED') remixEditorOpen.value = false
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
    else void lab.showKnownPair()
  })
  lab.startArtworkWatch()
})
onUnmounted(() => {
  if (atlasSearchTimer) clearTimeout(atlasSearchTimer)
  lab.stopArtworkWatch()
})
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
  grid-template-rows: minmax(0, 1fr) auto auto;
  gap: clamp(9px, 1.4vw, 18px);
  height: 100%;
  min-height: 0;
  padding: clamp(12px, 2vw, 25px);
  background-image: radial-gradient(#b8a9d32b 1px, transparent 1px);
  background-size: 27px 27px;
}

.eyebrow {
  font-size: clamp(0.56rem, 0.85vw, 0.75rem);
  font-weight: 900;
  letter-spacing: 0.21em;
  color: #d3b9db;
}

.hybridizer-bar {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
}

.hybridizer-bar-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  white-space: nowrap;
  padding: 3px 10px;
  border: 1px solid
    color-mix(in oklab, var(--color-base-content) 18%, transparent);
  border-radius: 999px;
}

.hybridizer-bar-chip strong {
  font-size: 0.9rem;
  color: var(--color-primary);
}

@container (max-width: 380px) {
  .hybridizer-bar-chip {
    padding: 2px 7px;
    letter-spacing: 0;
  }
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

.specimen-slot {
  position: relative;
  min-height: 0;
  min-width: 0;
}

.specimen-slot > .specimen-chamber {
  width: 100%;
  height: 100%;
}

.favorite-heart {
  position: absolute;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #e7d8ed;
  color: #fff;
  background: #20132bd9;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 8px #170d2799;
}

.favorite-heart.active {
  color: #ff789e;
  border-color: #ffb7cd;
}

.favorite-heart:focus-visible {
  outline: 3px solid #e6f6ae;
}

.chamber-heart,
.result-heart {
  top: 12px;
  right: 12px;
}

.ingredient-tile {
  position: relative;
  min-width: 0;
}

.tile-heart {
  top: 5px;
  right: 5px;
  width: 30px;
  height: 30px;
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

.known-art-mark {
  align-self: flex-start;
  color: #e0f6a6;
  border: 1px solid #d6eba57a;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.59rem;
  font-weight: 900;
  letter-spacing: 0.06em;
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
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

.hybridizer-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  grid-column: 2;
  grid-row: 1;
}

.tool-button {
  padding: 9px;
  min-height: 38px;
  border: 1px solid #ab8cbb;
  background: #3d2c54;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
}

.tool-button:disabled {
  opacity: 0.6;
}

.lab-status {
  grid-column: 1 / -1;
  grid-row: 2;
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
  width: 100%;
  height: 100%;
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

.hybridizer-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  min-height: 0;
  padding: 15px 4px;
}

.settings-choice {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  border: 1px solid #987db1;
  border-radius: 16px;
  background: #39294f;
}

.settings-choice input {
  width: 24px;
  height: 24px;
  accent-color: #cfea91;
  flex: 0 0 auto;
}

.settings-choice span {
  display: grid;
  gap: 8px;
}

.settings-choice strong {
  color: #e5f6a9;
  font-size: 1rem;
}

.settings-choice small,
.settings-note {
  color: #e0d1e7;
  line-height: 1.5;
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
    grid-template-columns: minmax(0, 1fr);
  }
  .fusion-button {
    grid-column: 1;
    grid-row: 1;
  }
  .hybridizer-tools {
    grid-column: 1;
    grid-row: 2;
    justify-content: center;
  }
  .lab-status {
    grid-column: 1;
    grid-row: 3;
  }
  .result-foot {
    align-items: center;
  }
}

@container (max-width: 440px) {
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
  .atlas-button,
  .tool-button {
    font-size: 0.61rem;
    padding: 8px;
  }
  .favorite-heart {
    width: 28px;
    height: 28px;
    font-size: 1.25rem;
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
.remix-editor {
  position: absolute;
  z-index: 19;
  inset: 6px;
  display: grid;
  align-content: start;
  gap: 12px;
  overflow-y: auto;
  padding: 14px;
  border: 1px solid #e4f6b5;
  border-radius: 16px;
  background: #251733;
  box-shadow: 0 9px 28px #110821bb;
}
.remix-editor label {
  display: grid;
  gap: 5px;
  color: #e6e7c5;
  font-size: 0.74rem;
  font-weight: 800;
}
.remix-editor p {
  font-size: 0.76rem;
  color: #ead3f4;
}
.remix-editor textarea {
  width: 100%;
  border: 1px solid #b5a0bd;
  border-radius: 8px;
  background: #180f27;
  color: white;
  padding: 8px;
}
.remix-balance input {
  width: 100%;
  accent-color: #dffa98;
}
.remix-submit {
  border-radius: 9px;
  padding: 10px;
  background: #dffa98;
  color: #251733;
  font-size: 0.75rem;
  font-weight: 900;
}
.remix-submit:disabled {
  opacity: 0.5;
}
.atlas-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  font-size: 0.76rem;
  font-weight: 800;
}
.atlas-summary span,
.atlas-loaded {
  color: #dff1b3;
}
.atlas-loaded {
  font-size: 0.68rem;
}
.atlas-entry-status {
  font-weight: 900;
}
.atlas-load-more {
  grid-column: 1 / -1;
  border: 1px solid #e1f5ac;
  border-radius: 10px;
  padding: 12px;
  font-weight: 900;
  color: #ebffb5;
}
.atlas-load-more:disabled {
  opacity: 0.55;
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
