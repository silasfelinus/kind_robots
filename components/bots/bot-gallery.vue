<!-- /components/content/bots/bot-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-base font-bold text-base-content">
            {{ title }}
          </h2>

          <p
            v-if="botStore.currentBot"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{ selectedBotTitle }}
            </span>
          </p>

          <p v-else class="truncate text-sm text-base-content/60">
            <span class="hidden md:inline">{{ subtitle }}</span>
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span
            v-if="!isLoading && !botStore.loading"
            class="badge badge-ghost"
          >
            {{ filteredBots.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingBot"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading || botStore.loading"
            @click="refreshBots(true)"
          >
            <span
              v-if="isLoading || botStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>

    <section
      v-if="showBotForm"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-primary">
            {{ formTitle }}
          </h3>

          <p class="text-sm text-base-content/60">
            {{ formSubtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="closeBotForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
        </button>
      </div>

      <add-bot
        :mode="formMode"
        @saved="handleBotSaved"
        @cancel="closeBotForm"
      />
    </section>

    <!--
      THE BACK OF THE CARD. One instance for the whole gallery, bound to
      whichever Bot was picked -- the flip is a property of the gallery's
      selection, not of forty-eight card components each carrying a dialog.
    -->
    <kr-card-flip v-model="infoOpen" :label="infoBot?.name || 'Bot'">
      <template #back="{ close, commit }">
        <kr-card-back
          v-if="infoBot"
          v-model:editing="infoEditing"
          :title="infoBot.name || 'Unnamed Bot'"
          :subtitle="infoBot.subtitle || ''"
          :description="infoBot.description || infoBot.personality || ''"
          :art-src="infoBot.avatarImage || ''"
          :badges="infoBotBadges"
          :can-edit="canEditInfoBot"
          :can-interact="true"
          interact-label="Chat"
          @back="commit"
          @interact="interactWithInfoBot"
        >
          <!-- The stats a BOT has and a Reward does not. kr-card-back never
               learns what any of this means. -->
          <template #details>
            <dl class="grid grid-cols-2 gap-2 text-xs">
              <div v-if="infoBot.personality" class="col-span-2">
                <dt class="font-black uppercase opacity-55">Personality</dt>
                <dd class="whitespace-pre-wrap">{{ infoBot.personality }}</dd>
              </div>
              <div v-if="infoBot.BotType">
                <dt class="font-black uppercase opacity-55">Type</dt>
                <dd>{{ infoBot.BotType }}</dd>
              </div>
              <div v-if="infoBot.name">
                <dt class="font-black uppercase opacity-55">Handle</dt>
                <dd class="break-words">{{ infoBot.name }}</dd>
              </div>
            </dl>
          </template>

          <template #edit="{ done }">
            <add-bot mode="edit" @saved="done" @cancel="done" />
          </template>
        </kr-card-back>

        <!-- A Bot that vanished from the store while its panel was open (a
             delete from another tab) would otherwise render an empty dialog
             with no way out but Escape. -->
        <div v-else class="p-6 text-center text-sm opacity-60">
          <p>That Bot is no longer available.</p>
          <button
            type="button"
            class="btn btn-ghost btn-sm mt-3 rounded-xl"
            @click="close"
          >
            Close
          </button>
        </div>
      </template>
    </kr-card-flip>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading || botStore.loading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="botStore.error"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ botStore.error }}
        </p>
      </div>

      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <div class="flex flex-col gap-3 kr-panel-flat p-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
              >
                <Icon name="kind-icon:robot" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Bot
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedBotTitle }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedBotSubtitle }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="canLaunchSelected"
                class="btn btn-info btn-sm rounded-xl"
                type="button"
                @click="launchSelectedBot"
              >
                <Icon name="kind-icon:play" class="h-4 w-4" />
                <span class="hidden sm:inline">Launch</span>
              </button>

              <button
                v-if="canCloneSelected"
                class="btn btn-accent btn-sm rounded-xl"
                type="button"
                @click="cloneSelectedBot"
              >
                <Icon name="kind-icon:copy" class="h-4 w-4" />
                <span class="hidden sm:inline">Clone</span>
              </button>

              <button
                v-if="canEditSelected"
                class="btn btn-secondary btn-sm rounded-xl"
                type="button"
                @click="startEditingSelectedBot"
              >
                <Icon name="kind-icon:pencil" class="h-4 w-4" />
                <span class="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
            :value="botStore.currentBot?.id ?? ''"
            aria-label="Select bot"
            @change="selectBotFromEvent"
          >
            <option value="">Choose a bot</option>

            <option v-for="bot in filteredBots" :key="bot.id" :value="bot.id">
              {{ getBotTitle(bot) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Bot</option>
          </select>

          <div
            v-if="botStore.currentBot"
            class="kr-panel-muted p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedBotDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="botStore.currentBot.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

              <span
                v-if="botStore.currentBot.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span
                v-if="botStore.currentBot.underConstruction"
                class="badge badge-warning badge-sm"
              >
                Building
              </span>

              <span v-else class="badge badge-success badge-sm"> Ready </span>

              <span
                v-if="botStore.currentBot.BotType"
                class="badge badge-secondary badge-sm"
              >
                {{ botStore.currentBot.BotType }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredBots.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 kr-panel-muted text-center text-base-content/60"
      >
        <Icon name="kind-icon:robot" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No bots found.</p>

          <p class="mt-1 text-sm">
            No public or owned bots match this gallery.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingBot"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Build Bot
        </button>
      </div>

      <!-- Row stays bespoke: a horizontal filmstrip is not one of kr-gallery's
           cards/heroes/icons grids. -->
      <div v-else-if="isRowMode" :class="layoutClass">
        <bot-card
          v-for="bot in filteredBots"
          :key="bot.id"
          :bot="bot"
          :selected="botStore.currentBot?.id === bot.id"
          :earned-karma="earnedKarmaByBotId[bot.id]"
          v-bind="botCardProps"
          @open="selectBot"
          @edit="startEditingBotById"
          @clone="cloneBotById"
          @delete="handleBotDeleted"
          @launch="launchBotById"
        />
      </div>

      <!-- t-060: the shared shell owns the grid and the Cards/Heroes/Icons bar;
           bot-card stays the card. The mode is bound both ways and fed through
           MODE_VARIANT into the card's `variant`, which is the pairing
           verifyGalleryConsistency.ts exists to enforce. -->
      <kr-gallery
        v-else
        :items="galleryItems"
        :mode="galleryMode"
        empty-label="bots"
        @update:mode="galleryMode = $event"
      >
        <template #toolbar>
          <!-- WRAP, do not stack. This was `grid grid-cols-1 ...
                 lg:grid-cols-[...]`, so below lg every control claimed a
                 full-width row of its own -- four filters became four rows on a
                 phone, which is most of why /rewards spent 54% of a 390px
                 viewport before its first card. flex-wrap puts as many on a
                 line as fit and only breaks when it must.

                 AND THE CHILDREN HAVE TO AGREE. Switching the container was
                 only half the fix: the controls kept the `w-full` the grid had
                 given them, and a `w-full` child fills its line and forces the
                 next one to wrap, which is stacking by another name. The search
                 box was the worst of it -- plain `w-full`, no responsive
                 escape at all, so it took a row of its own at EVERY width,
                 desktop included.

                 So the selects size to their content and the search box is
                 `flex-1` with a floor: it absorbs whatever slack is left on the
                 line instead of claiming the whole one, and `min-w-32` is what
                 makes it wrap rather than collapse to nothing when the line is
                 full. resource-gallery's toolbar already worked this way. -->
          <div
            v-if="showControls && !isDropdownMode"
            class="flex flex-wrap items-center gap-1.5"
          >
            <!--
              THE TYPE TOGGLE. Silas, 2026-08-09: "the toggle to show narrator
              bits or prompt bots or both can be a three way toggle/slider,
              with 'all' in the middle. Icons are better than words unless we
              have plenty of space."

              Built from the types actually PRESENT in the loaded set, not from
              a hard-coded pair -- `Bot.BotType` is a free String column, so a
              fixed NARRATOR/PROMPTBOT control would silently strand any other
              value (CHATBOT is the one in the seeds today). With the two types
              Silas is looking at, that yields exactly the three-way control he
              asked for; with more, All keeps the midpoint and the extra type
              gets its own segment rather than becoming unreachable.

              Absent below two types, for the same reason the Mature toggle is:
              a filter that cannot change what is on screen is chrome.
            -->
            <div
              v-if="botTypeSegments.length"
              class="join"
              role="group"
              aria-label="Filter bots by type"
            >
              <button
                v-for="segment in botTypeSegments"
                :key="segment.value"
                type="button"
                class="btn join-item btn-sm"
                :class="
                  botTypeFilter === segment.value
                    ? 'btn-primary'
                    : 'btn-ghost bg-base-100'
                "
                :title="segment.label"
                :aria-pressed="botTypeFilter === segment.value"
                @click="botTypeFilter = segment.value"
              >
                <Icon
                  v-if="segment.icon"
                  :name="segment.icon"
                  class="h-4 w-4"
                  aria-hidden="true"
                />
                <span :class="segment.icon ? 'sr-only' : 'text-xs font-bold'">
                  {{ segment.label }}
                </span>
              </button>
            </div>

            <!-- `px-4 py-2` with a bold label made this the tallest thing on
                 the row and forced its height onto every neighbour. Same
                 control, sized like the selects beside it. -->
            <!--
              ONLY WHEN THERE IS SOMETHING TO FILTER. Silas, 2026-08-09:
              "Maturity toggle doesn't need to be front and center on bots, we
              don't even have isMature bots currently. As usual though, we
              should not see that toggle if the user is guest or child roles."

              The role half was already right -- `userStore.isAdmin` excludes
              guests and children, and the store's showMature is itself
              CHILD-restricted underneath. What was wrong is that it held a
              prime slot in the toolbar for a filter with nothing to filter.
              `hasMatureBots` means it appears exactly when a mature Bot
              exists, so today it is simply absent and the row is shorter.
            -->
            <label
              v-if="userStore.isAdmin && hasMatureBots"
              class="flex cursor-pointer items-center gap-1.5 kr-panel-flat px-2 py-1"
            >
              <span class="text-xs font-bold">Mature</span>

              <input
                v-model="showMature"
                type="checkbox"
                class="toggle toggle-accent toggle-xs"
              />
            </label>

            <select
              v-model="constructionFilter"
              class="select select-bordered select-sm w-auto max-w-44 bg-base-100"
              aria-label="Filter bots by construction status"
            >
              <option value="all">All statuses</option>
              <option value="ready">Ready only</option>
              <option value="building">Under construction</option>
            </select>

            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search bots..."
              class="input input-bordered input-sm min-w-32 flex-1 bg-base-100"
              aria-label="Search bots"
            />

            <button
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              :disabled="!botStore.currentBot"
              @click="clearSelectedBot"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
              Clear
            </button>
          </div>
        </template>

        <template #item="{ item }">
          <bot-card
            v-if="botById.get(Number(item.id))"
            :bot="botById.get(Number(item.id))!"
            :selected="botStore.currentBot?.id === item.id"
            :earned-karma="earnedKarmaByBotId[Number(item.id)]"
            :variant="MODE_VARIANT[galleryMode]"
            v-bind="botCardProps"
            @open="selectBot"
            @edit="startEditingBotById"
            @clone="cloneBotById"
            @delete="handleBotDeleted"
            @launch="launchBotById"
          />
        </template>
      </kr-gallery>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Bot } from '~/prisma/generated/prisma/client'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { MODE_VARIANT, type GalleryMode } from '@/utils/galleryVocabulary'
import { botTypeOptions, normalizeBotType } from '@/utils/botTypeVocabulary'
import { useBotStore } from '@/stores/botStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'
type ConstructionFilter = 'all' | 'ready' | 'building'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    /**
     * The gallery's own title/subtitle band.
     *
     * TRUE BY DEFAULT, AND OFF ON THE ROUTE. kr-manager already renders this
     * panel's title and summary from dashboardHelper config -- it says so
     * itself, citing "the brief's one-header rule" -- so on /bots this band is a
     * second page heading for the same panel.
     *
     * It stays available rather than being deleted because the same gallery is
     * embedded as a PICKER inside bot-chat, where no manager sits above it and
     * this title is the only label. Duplication on the ROUTE is not duplication
     * everywhere, so bot-interact opts out explicitly and the default is left
     * alone for the pickers. reward-gallery and scenario-gallery carry the same
     * split for the same reason (character-chat, character-flip-card).
     */
    showHeader?: boolean
    showImages?: boolean
    showControls?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showPersonality?: boolean
    showLaunchButton?: boolean
    showDebug?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Bots',
    subtitle: 'Choose a bot to start a focused interaction.',
    showHeader: true,
    showImages: true,
    showControls: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showPersonality: false,
    showLaunchButton: true,
    showDebug: false,
    allowAdd: true,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
  },
)

const botStore = useBotStore()
const navStore = useNavStore()
const userStore = useUserStore()

const constructionFilter = ref<ConstructionFilter>('all')
const botTypeFilter = ref<string>('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showBotForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isDropdownMode = computed(() => props.variant === 'dropdown')
const isRowMode = computed(() => props.variant === 'row')

/** Which of Cards/Heroes/Icons the shared grid is showing. */
const galleryMode = ref<GalleryMode>('cards')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'bot-row' : 'bot-grid'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

/*
 * Whether the maturity filter has anything to act on. Derived rather than
 * assumed: there are no mature Bots today, but the control has to reappear on
 * its own the moment one exists rather than needing someone to remember.
 */
const hasMatureBots = computed(() =>
  botStore.bots.some((entry) => entry.isMature),
)

const showMature = computed({
  get: () => userStore.user?.showMature ?? userStore.showMature ?? false,
  set: async (value: boolean) => {
    if (!userStore.user) return

    await userStore.updateUser({ showMature: value })
  },
})

const selectedBot = computed(() => {
  return botStore.currentBot
})

const selectedBotTitle = computed(() => {
  return selectedBot.value ? getBotTitle(selectedBot.value) : 'No bot selected'
})

const selectedBotSubtitle = computed(() => {
  const bot = selectedBot.value

  if (!bot) return 'Choose a bot or add a new one.'

  return bot.subtitle || bot.tagline || bot.BotType || 'Bot selected.'
})

const selectedBotDescription = computed(() => {
  const bot = selectedBot.value

  if (!bot) return 'No bot selected.'

  return (
    bot.description ||
    bot.personality ||
    bot.prompt ||
    bot.botIntro ||
    bot.userIntro ||
    'No bot description yet.'
  )
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Bot' : 'Add Bot'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Tune this bot before it develops lore.'
    : 'Create a new bot persona, module, or charming nonsense engine.'
})

const canEditSelected = computed(() => {
  const bot = selectedBot.value

  if (!props.allowEdit || !bot?.id) return false
  if (userStore.isAdmin) return true

  return bot.userId === currentUserId.value
})

const canCloneSelected = computed(() => {
  return Boolean(props.allowClone && selectedBot.value?.id)
})

const canLaunchSelected = computed(() => {
  return Boolean(selectedBot.value?.id)
})

const galleryBots = computed<Bot[]>(() => {
  let bots = botStore.bots

  if (!userStore.isAdmin) {
    bots = bots.filter((bot) => {
      return bot.isPublic || bot.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    bots = bots.filter((bot) => !bot.isMature)
  }

  return bots
})

/*
 * The type toggle's segments: every type present in the visible set, with All
 * spliced into the MIDDLE rather than parked at one end -- `Math.floor(n / 2)`
 * puts it dead centre for the two-type case the gallery has today and keeps it
 * at the midpoint as types are added.
 *
 * Under two types there is nothing to choose between, so the control does not
 * render at all and `botTypeFilter` stays 'all'.
 *
 * Sourced from galleryBots, NOT filteredBots: an option list narrowed by the
 * filter it feeds collapses to a single segment the moment you pick one, and
 * there is then no segment left to click your way back out of.
 */
const botTypeSegments = computed(() => {
  const options = botTypeOptions(galleryBots.value)

  if (options.length < 2) return []

  const segments = options.map((option) => ({
    value: option.value,
    label: option.label,
    icon: option.icon,
  }))

  segments.splice(Math.floor(segments.length / 2), 0, {
    value: 'all',
    label: 'All',
    icon: '',
  })

  return segments
})

/*
 * A filter pinned to a type that is no longer on offer shows an empty grid with
 * no visible cause -- the segment it belongs to has vanished from the row. This
 * happens for real: toggling Mature off can remove the last Bot of a type. Fall
 * back to All whenever the current choice leaves the segment list.
 */
watch(botTypeSegments, (segments) => {
  if (botTypeFilter.value === 'all') return

  if (!segments.some((segment) => segment.value === botTypeFilter.value)) {
    botTypeFilter.value = 'all'
  }
})

/*
 * interface-vision t-060 — the grid variant renders through the shared
 * kr-gallery shell while bot-card stays the card, via kr-gallery's `item` slot.
 * Adopting the shell must not cost the reactions, karma and edit/clone/launch
 * actions that t-064 put on kr-entity-card-body.
 */
const galleryItems = computed<GalleryItem[]>(() =>
  filteredBots.value.map((bot) => ({
    id: bot.id,
    title: bot.name || `Bot ${bot.id}`,
    source: bot,
  })),
)

/** Slot props give back a GalleryItem, so map the id to the real record. */
const botById = computed(
  () => new Map(filteredBots.value.map((b) => [b.id, b])),
)

/**
 * The card's shared props in one place, so the bespoke row layout and the
 * kr-gallery slot cannot drift when one of them gains a tenth prop.
 */
/*
 * Icons is a browse view: a text-forward row whose art is a 3rem square.
 * Three floating action circles over that is the "cramped displays" Silas
 * photographed -- the buttons were larger than the artwork. Actions stay on
 * Cards and Heroes, where there is room for them.
 */
const botCardProps = computed(() => ({
  compact: isCompact.value,
  showImage: props.showImages,
  showActions: props.showCardActions && galleryMode.value !== 'icons',
  showDescription: props.showDescriptions,
  showMeta: props.showMeta,
  showPersonality: props.showPersonality,
  showLaunchButton: props.showLaunchButton,
  showDebug: props.showDebug,
  allowEdit: props.allowEdit,
  allowClone: props.allowClone,
  allowDelete: props.allowDelete,
}))

const filteredBots = computed<Bot[]>(() => {
  let bots = galleryBots.value

  if (constructionFilter.value === 'ready') {
    bots = bots.filter((bot) => !bot.underConstruction)
  }

  if (constructionFilter.value === 'building') {
    bots = bots.filter((bot) => bot.underConstruction)
  }

  if (botTypeFilter.value !== 'all') {
    bots = bots.filter(
      (bot) => normalizeBotType(bot.BotType) === botTypeFilter.value,
    )
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    bots = bots.filter((bot) => {
      const haystack = [
        bot.name,
        bot.subtitle,
        bot.description,
        bot.personality,
        bot.tagline,
        bot.BotType,
        bot.theme,
        bot.modules,
        bot.designer,
        bot.prompt,
        bot.botIntro,
        bot.userIntro,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return bots
})

// interface-vision/t-066: earned karma for the rendered set, batched through
// the shared composable (see composables/useEarnedKarma.ts). Scoped to
// filteredBots — the set the grid actually renders.
const { earnedKarma: earnedKarmaByBotId } = useEarnedKarma('bot', () =>
  filteredBots.value.map((bot) => bot.id),
)

onMounted(async () => {
  if (props.autoLoad) {
    await refreshBots()
  }
})

function getBotTitle(bot: Bot) {
  return bot.name || bot.subtitle || bot.tagline || `Bot ${bot.id}`
}

async function refreshBots(force = false) {
  isLoading.value = true

  try {
    await botStore.initialize({
      force,
      fetchRemote: true,
      initializeServerStore: false,
      createBlankForm: true,
    })
  } finally {
    isLoading.value = false
  }
}

/*
 * INFO FIRST, INTERACTION AFTER. Silas, 2026-08-08: "selecting the card brings
 * us to the full info display with the animation ... think the back of a
 * baseball card with stats ... info is first, and interactions come after."
 *
 * So picking a Bot in the grid no longer launches straight into the chat; it
 * turns the card over. Chat is now a button on the back, which is what makes
 * the interact tier a destination you choose rather than the only thing a
 * click can do.
 *
 * THE DROPDOWN BRANCH IS WHY THIS LIVES IN THE GALLERY and not in bot-card.
 * This gallery is also embedded as a PICKER inside bot-chat, where a click has
 * to pick and nothing else -- an info panel there would be in the way. The card
 * contract already puts the decision here: "A card is an entry point. It emits;
 * the gallery decides what that means." A card that opened its own info panel
 * would have decided, and the picker would have no way to opt out.
 */
async function selectBot(id: number) {
  if (isDropdownMode.value) {
    await botStore.selectBot(id)
    return
  }

  infoBotId.value = id
}

const infoBotId = ref<number | null>(null)
const infoEditing = ref(false)

const infoBot = computed(
  () => botStore.bots.find((entry) => entry.id === infoBotId.value) ?? null,
)

/*
 * The id IS the open state -- one source of truth rather than a boolean that
 * can disagree with it. Only the false direction is writable, because the flip
 * closes itself (Escape, the backdrop) and needs somewhere to put that.
 */
const infoOpen = computed({
  get: () => infoBotId.value !== null,
  set: (value: boolean) => {
    if (!value) {
      infoBotId.value = null
      infoEditing.value = false
    }
  },
})

const infoBotBadges = computed(() => {
  const bot = infoBot.value
  if (!bot) return []

  return [bot.BotType, bot.isPublic ? 'Public' : 'Private']
    .filter((entry): entry is string => Boolean(entry))
    .map(String)
})

const canEditInfoBot = computed(() => {
  const bot = infoBot.value
  if (!bot) return false
  return userStore.isAdmin || bot.userId === userStore.userId
})

/*
 * add-bot edits whatever botStore is holding, so entering edit mode has to
 * load the record FIRST -- opening the form against a stale editing target is
 * how you save changes onto the wrong Bot.
 */
watch(infoEditing, async (isEditing) => {
  /*
   * Leaving edit mode releases the routing flag `startEditingBot` set. Without
   * this, a user who opened the editor from an in-progress chat would be held
   * on the gallery afterwards -- the same bug bot-interact's isInteractMode
   * note describes, pointing the other way.
   */
  if (!isEditing) {
    botStore.editingBotId = null
    return
  }

  if (!infoBotId.value) return
  await botStore.startEditingBot(infoBotId.value)
})

/*
 * Interact LEAVES. The chat surface is a working space and a centred modal is
 * the wrong frame for it, so the panel closes and the interact tier takes over
 * the page exactly as it did when a card click went straight there. Closing
 * first means the flip plays out rather than being unmounted underneath the
 * navigation.
 */
async function interactWithInfoBot() {
  const id = infoBotId.value
  infoOpen.value = false
  if (id) await launchBotById(id)
}

function startAddingBot() {
  botStore.startAddingBot()

  if (!isDropdownMode.value) {
    navStore.setDashboardTab('bot', 'forge')
    return
  }

  formMode.value = 'add'
  showBotForm.value = true
}

async function launchBotById(id: number) {
  const selected = await botStore.selectBot(id)

  if (!selected) return

  botStore.setPendingLaunchMessage?.(
    `Ready to chat with ${selected.name || 'this bot'}.`,
  )
}

function selectBotFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingBot()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedBot()
    return
  }

  void selectBot(id)
}

async function startEditingSelectedBot() {
  const id = botStore.currentBot?.id

  if (!id) return

  await startEditingBotById(id)
}

async function startEditingBotById(id: number) {
  const bot = await botStore.startEditingBot(id)

  if (!bot) return

  formMode.value = 'edit'
  showBotForm.value = true
}

function cloneSelectedBot() {
  const id = botStore.currentBot?.id

  if (!id) return

  void cloneBotById(id)
}

async function cloneBotById(id: number) {
  const bot = await botStore.startCloningBot(id)

  if (!bot) return

  formMode.value = 'add'
  showBotForm.value = true
}

function launchSelectedBot() {
  const id = botStore.currentBot?.id

  if (!id) return

  void launchBotById(id)
}

function clearSelectedBot() {
  botStore.deselectBot()
  showBotForm.value = false
}

/*
 * Both of these release the routing flag for the same reason the infoEditing
 * watcher does: the in-gallery form is the other caller of startEditingBot,
 * and a flag left set after it closes would pin the router to the gallery.
 */
function closeBotForm() {
  showBotForm.value = false
  botStore.editingBotId = null
}

async function handleBotSaved() {
  showBotForm.value = false
  botStore.editingBotId = null
  await refreshBots(true)
}

function handleBotDeleted(id: number) {
  if (botStore.currentBot?.id === id) {
    botStore.deselectBot()
  }
}
</script>

<style scoped>
.bot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
  gap: 0.75rem;
}

.bot-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.bot-row > * {
  min-width: min(200px, 80vw);
  max-width: 280px;
}
</style>
