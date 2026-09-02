<!-- /components/home/home-object-sheet.vue -->
<!--
  The interstitial.

  Silas, 2026-08-29: "Whenever I click on one of the new objects, I want it to
  expand to tell me about it, pertinent details, basically what should happen
  after clicking gallery items, with clicking outside the container returning to
  the homepage. This is the interstitial, not quite edit, not quite interact
  select, that leads us to those options, plus review."

  So it is deliberately a READER, not an editor. It shows what the thing is,
  shows the reviews left on it, and then hands you to the manager that already
  knows how to edit, interact with and select it. The home page is where you
  find out something exists; committing to it is one more click, and that click
  lands somewhere that can actually do the job.

  NOT daily-digest-object-dialog.vue, which looks similar and is not reusable
  here: it is bound to DailyDreamArchiveObject and useDailyDreamArchiveStore,
  carries Modify and Artwork tabs that write, and is admin-shaped. This reads one
  public record through /api/showcase/detail and has no write path at all.

  CLICK-OUTSIDE CLOSES, per the ask. Three ways out, because a modal with one is
  a trap: the backdrop, the Escape key (native <dialog> `cancel`), and the X.

  THE RECORD'S OWN THEME, on the wrapper above the surface that reads the
  tokens -- the same rule the rails and character-card.vue follow. Opening a
  character in their own colours is most of what makes this feel like arriving
  somewhere rather than expanding a row.
-->
<template>
  <Teleport to="body">
    <dialog
      class="modal modal-open"
      aria-modal="true"
      @cancel.prevent="emit('close')"
      @click.self="emit('close')"
    >
      <div
        :data-theme="detail?.theme || undefined"
        class="modal-box flex max-h-[88dvh] w-[min(94vw,58rem)] max-w-none flex-col overflow-hidden rounded-3xl border-2 border-primary/60 bg-base-100 p-0 shadow-2xl"
      >
        <header
          class="flex shrink-0 items-start gap-3 border-b border-base-300 p-3 sm:p-4"
        >
          <div class="min-w-0 flex-1">
            <p
              class="text-[0.6rem] font-black uppercase tracking-[0.18em] text-primary"
            >
              {{ kindLabel }}
            </p>
            <h2 class="truncate text-lg font-black sm:text-xl">
              {{ detail?.title || card.title }}
            </h2>
            <p
              v-if="detail?.subtitle"
              class="mt-0.5 line-clamp-1 text-sm text-base-content/60"
            >
              {{ detail.subtitle }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm shrink-0 rounded-xl"
            aria-label="Close"
            @click="emit('close')"
          >
            <Icon name="kind-icon:x" class="size-4" />
          </button>
        </header>

        <!--
          The one scroll region in here, and a bounded one: the layout
          contract's one-scroll rule counts page-level owners, and a modal's
          own body is not the page's.
        -->
        <div class="kr-scroll p-3 sm:p-4">
          <div v-if="pending" class="flex min-h-40 items-center justify-center">
            <span class="loading loading-spinner loading-md text-primary" />
            <span class="sr-only">Loading details…</span>
          </div>

          <div v-else-if="errorMessage" class="kr-note kr-note-warning">
            {{ errorMessage }}
          </div>

          <!--
            Container-width columns, not a viewport breakpoint. The layout
            contract's viewport-grid rule caught the `lg:` version, and it was
            right to: this box is `w-[min(94vw,58rem)]`, so on a wide screen the
            grid is 58rem while `lg:` is asking about a 1280px viewport. auto-fit
            splits when THIS element has room for two 20rem tracks, which is the
            question actually being asked.
          -->
          <div
            v-else
            class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]"
          >
            <div class="overflow-hidden rounded-2xl border border-base-300">
              <kr-art-plate
                :source="detail?.art ?? card.art"
                variant="hero"
                :shape="
                  card.kind === 'art' || card.kind === 'animation'
                    ? 'wide'
                    : 'card'
                "
                frame="none"
                :alt="detail?.title || card.title"
                :fallback="fallback"
                fit="contain"
                eager
              />
            </div>

            <div class="flex min-w-0 flex-col gap-3">
              <p
                v-if="detail?.body"
                class="kr-prose whitespace-pre-line text-sm leading-relaxed"
              >
                {{ detail.body }}
              </p>
              <p v-else class="text-sm italic text-base-content/45">
                No description has been written for this one yet.
              </p>

              <dl
                v-if="detail?.facts.length"
                class="grid gap-x-3 gap-y-1.5 grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]"
              >
                <div
                  v-for="fact in detail.facts"
                  :key="fact.label"
                  class="min-w-0 rounded-lg border border-base-300 bg-base-200/50 px-2 py-1"
                >
                  <dt
                    class="text-[0.55rem] font-black uppercase tracking-[0.14em] text-base-content/45"
                  >
                    {{ fact.label }}
                  </dt>
                  <dd class="line-clamp-3 text-xs font-bold leading-snug">
                    {{ fact.value }}
                  </dd>
                </div>
              </dl>

              <!--
                "plus review", and it is the reviews themselves rather than a
                link to them. There is no /reviews route -- review-list.vue is a
                component every gallery embeds, generic over Reaction target
                type, and every showcase kind maps onto one of those types. So
                the reviews can simply be here, which is better than the link I
                first reached for and which would have 404'd.
              -->
              <review-list
                v-if="reviewTarget"
                :target-type="reviewTarget"
                :target-id="card.id"
                empty-label="No reviews yet — be the first."
              />
            </div>
          </div>
        </div>

        <!--
          ONE DOOR, because there is only one real one. Silas asked for the
          interstitial to lead to "those options, plus review": edit, interact
          and select all live on the record's own manager page, which
          `detail.href` opens with this record already selected. Splitting that
          into three buttons would have meant inventing /chat and /reviews
          routes that do not exist -- the first version of this footer did
          exactly that, and both links would have 404'd from the front page.
          Reviews moved inline above instead.
        -->
        <!--
          REDO THE ART FROM HERE. Silas, 2026-09-02: "when clicking on an
          object, I would love a way to expedite asking for a new art prompt.
          For example, we get a lot of text focused gens, so I want to be able
          to easily submit them for a better redo."

          The redo already existed -- entity-art-manager.vue has done exactly
          this for a while -- but only on each record's own manager page, which
          is two navigations away from noticing the problem. Noticing happens
          here, so the button is here.

          EXPEDITE MEANS PREFILLED, not just present. The complaint is specific:
          the renders come back as pictures OF CARDS, with garbled lettering
          baked in (the "Hacker" facet is a card with four lines of nonsense
          text on it). So the default prompt is composed from the record's own
          title and description with an explicit no-lettering clause on the end,
          which is the edit you would have made by hand every time. It stays
          editable -- it is a starting point, not a fixed template.
        -->
        <section
          v-if="showRedo && redoOpen"
          class="border-t border-base-300 bg-base-200/40 p-3"
        >
          <label
            :for="`redo-prompt-${card.kind}-${card.id}`"
            class="text-[0.65rem] font-black uppercase tracking-[0.14em] text-primary"
          >
            New art prompt
          </label>
          <textarea
            :id="`redo-prompt-${card.kind}-${card.id}`"
            v-model="redoPrompt"
            rows="4"
            class="mt-1 w-full rounded-lg border border-base-300 bg-base-100 p-2 text-xs leading-snug focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            :disabled="redoBusy"
          />

          <div class="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-primary btn-xs gap-1.5 rounded-lg"
              :disabled="redoBusy || !redoPrompt.trim()"
              @click="submitRedo"
            >
              <span
                v-if="redoBusy"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:refresh" class="size-3.5" />
              Queue new art
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg border border-base-300"
              :disabled="redoBusy"
              title="Rebuild the suggested prompt from this record"
              @click="redoPrompt = suggestedPrompt"
            >
              Reset prompt
            </button>

            <p
              v-if="redoMessage"
              class="text-[0.65rem] font-bold"
              :class="redoFailed ? 'text-error' : 'text-success'"
            >
              {{ redoMessage }}
            </p>
          </div>
        </section>

        <footer class="kr-toolbar justify-between border-t border-base-300 p-3">
          <p class="text-[0.65rem] text-base-content/45">
            {{ createdLabel }}
          </p>

          <div class="flex items-center gap-2">
            <button
              v-if="showRedo"
              type="button"
              class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300"
              :aria-expanded="redoOpen"
              @click="toggleRedo"
            >
              <Icon name="kind-icon:palette-color" class="size-4" />
              Redo art
            </button>

            <NuxtLink
              :to="detail?.href || showcaseHref(card)"
              class="btn btn-primary btn-sm gap-1.5 rounded-xl"
            >
              Open {{ kindLabel.toLowerCase() }}
              <Icon name="kind-icon:chevron-right" class="size-4" />
            </NuxtLink>
          </div>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ShowcaseDetail } from '@/server/api/showcase/detail.get'
import { performFetch } from '@/stores/utils'
import {
  showcaseHref,
  type RailItem,
  type ShowcaseKind,
} from '@/utils/homeShowcase'
import type { ReactionTargetType } from '@/stores/reactionStore'
import { useUserStore } from '@/stores/userStore'
import { defaultArtFor } from '@/utils/defaultArtPool'

const props = defineProps<{ card: RailItem }>()
const emit = defineEmits<{ close: [] }>()

const detail = ref<ShowcaseDetail | null>(null)
const pending = ref(true)
const errorMessage = ref('')

const KIND_LABELS: Record<string, string> = {
  art: 'Render',
  animation: 'Animation',
  dream: 'Dream',
  character: 'Character',
  bot: 'Bot',
  reward: 'Reward',
  scenario: 'Scenario',
  facet: 'Facet',
  project: 'Project',
}

const kindLabel = computed(
  () => KIND_LABELS[props.card.kind] ?? props.card.kind,
)

const fallback = computed(() =>
  defaultArtFor(`${props.card.kind}-${props.card.id}`),
)

/*
 * The Reaction target type for this kind, or null when the kind has none.
 *
 * Every showcase kind but `animation` maps straight onto a KARMA_REF_TARGET
 * (utils/karmaRefTypes.ts); an animation is an ArtImage row like any render, so
 * it maps there too. Reviews are stored against these names, so this is the
 * whole join -- there is no separate reviews table to look up.
 */
const REVIEW_TARGETS: Partial<Record<ShowcaseKind, ReactionTargetType>> = {
  art: 'artImage',
  animation: 'artImage',
  dream: 'dream',
  character: 'character',
  bot: 'bot',
  reward: 'reward',
  scenario: 'scenario',
  facet: 'facet',
  project: 'project',
}

const reviewTarget = computed<ReactionTargetType | null>(
  () => REVIEW_TARGETS[props.card.kind] ?? null,
)

/*
 * WHICH KINDS CAN BE REDONE. Straight off EntityArtType in
 * server/utils/entityArt.ts -- the enqueue endpoint's `entityArt` block only
 * knows how to attach a finished render back onto these tables.
 *
 * `art` and `animation` are deliberately absent: an ArtImage IS the render, so
 * there is no entity field to attach a replacement to. Regenerating one means
 * making a new image, which is a different action on a different page.
 */
const REDO_ENTITY_TYPES: Partial<Record<ShowcaseKind, string>> = {
  dream: 'dream',
  character: 'character',
  bot: 'bot',
  reward: 'reward',
  scenario: 'scenario',
  facet: 'facet',
  project: 'project',
}

const userStore = useUserStore()

const redoOpen = ref(false)
const redoPrompt = ref('')
const redoBusy = ref(false)
const redoMessage = ref('')
const redoFailed = ref(false)

/*
 * Signed in AND a redoable kind. Not an admin check: /api/art/enqueue is behind
 * authAndGate, which does the real authorisation and charges the mana, so
 * duplicating a rule here would only get out of step with it. Signed-out
 * visitors never see a button that would just 401.
 */
const showRedo = computed(
  () => userStore.isLoggedIn && Boolean(REDO_ENTITY_TYPES[props.card.kind]),
)

/**
 * A first draft of the prompt, built from what the record actually says.
 *
 * The trailing clause is the whole point. Silas: "we get a lot of text focused
 * gens" -- several facet cards came back as pictures of trading cards with
 * garbled lettering printed on them, so every manual redo would start by saying
 * so. Saying it by default is what makes this an expedite rather than an empty
 * box.
 *
 * SAID ONCE, AND POSITIVELY. The first version of this piled up five negations
 * ("No text, no lettering, no captions, no watermark, no logo") and the repo's
 * own prompt contract rejects that with a 422: this engine's negative prompt is
 * inert, so every one of those words lands in POSITIVE conditioning and asks
 * for the thing it names. Shipped like that, the button would have failed on
 * every click. "Unmarked surfaces" states the wanted result instead, which is
 * what the contract asks for and what actually works.
 */
const suggestedPrompt = computed(() => {
  const parts = [
    detail.value?.title || props.card.title,
    detail.value?.subtitle || props.card.subtitle || '',
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)

  return (
    `${parts.join('. ')}. A single illustrated subject, full-frame, ` +
    'unmarked surfaces, edge-to-edge scene with no printed matter in view.'
  )
})

function toggleRedo(): void {
  redoOpen.value = !redoOpen.value
  redoMessage.value = ''
  if (redoOpen.value && !redoPrompt.value.trim()) {
    redoPrompt.value = suggestedPrompt.value
  }
}

async function submitRedo(): Promise<void> {
  const entityType = REDO_ENTITY_TYPES[props.card.kind]
  if (!entityType || !redoPrompt.value.trim()) return

  redoBusy.value = true
  redoMessage.value = ''
  redoFailed.value = false
  try {
    const response = await performFetch<{ jobId: number; status: string }>(
      '/api/art/enqueue',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptString: redoPrompt.value.trim(),
          entityArt: {
            entityType,
            entityId: props.card.id,
            // The card image, which is what every gallery and rail reads.
            field: 'imagePath',
            // Keep the old render rather than overwriting it: a redo that is
            // worse than what it replaced should be recoverable.
            preserveOriginal: true,
            mode: 'recreate',
          },
        }),
      },
    )
    if (!response.success || !response.data?.jobId) {
      throw new Error(response.message || 'Art could not be queued.')
    }
    redoMessage.value = `Queued as ArtJob ${response.data.jobId}. It attaches when the render finishes.`
  } catch (error) {
    redoFailed.value = true
    redoMessage.value =
      error instanceof Error ? error.message : 'Art could not be queued.'
  } finally {
    redoBusy.value = false
  }
}

const createdLabel = computed(() => {
  const created = new Date(detail.value?.createdAt || props.card.createdAt)
  if (Number.isNaN(created.getTime())) return ''
  return `Made ${created.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`
})

async function load(): Promise<void> {
  pending.value = true
  errorMessage.value = ''
  try {
    /*
     * performFetch, not $fetch: it is what every other store here uses, it
     * unwraps the endpoint's {success, message, data} envelope, and Nuxt's
     * typed $fetch overload resolution failed outright on this call with
     * TS2589 ("type instantiation is excessively deep").
     */
    const response = await performFetch<ShowcaseDetail>(
      `/api/showcase/detail?kind=${encodeURIComponent(props.card.kind)}&id=${props.card.id}`,
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || 'detail unavailable')
    }
    detail.value = response.data
  } catch {
    detail.value = null
    // The tile is still on screen behind this and already said what it knew,
    // so this is a soft failure: say the extra detail is unavailable rather
    // than implying the object itself is gone.
    errorMessage.value = 'Could not load the details for this one right now.'
  } finally {
    pending.value = false
  }
}

onMounted(load)

// The sheet stays mounted while the selection changes (clicking a second tile
// underneath is not possible, but a route-driven selection could), so refetch
// rather than assuming one card per mount.
watch(() => [props.card.kind, props.card.id], load)
</script>
