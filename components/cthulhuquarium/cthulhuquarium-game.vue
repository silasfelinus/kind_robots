<!-- components/cthulhuquarium/cthulhuquarium-game.vue
     The real Cthulhuquarium play loop (conductor cthulhuquarium/t-011),
     replacing the t-010 localStorage prototype. Coins, hunger, and species
     ownership are the server's Aquarium/AquariumStock rows
     (server/api/aquarium/**) -- this component never invents an economy
     number, it only renders what the store last loaded and asks the store
     to feed/unlock/settle.

     Coin drops (cthulhuquarium/t-080, conductor LOOP.md): every fed fish
     drops a coin every tank.coinDropSeconds on its own timer, worth its
     stock row's coinValue. Coins float near their swimmers and fade after
     tank.coinVisibleSeconds. Clicking one queues its value with the store's
     requestCollect(); the server credits at most what the tank's drop rate
     accrued (server/utils/aquariumCollect.ts coinAllowance), so the canvas
     never decides what the player is paid.

     Fish render as real art where a species has a delivered plate
     (cthulhuquarium/t-070, following t-065's bestiary/catalog delivery --
     see drawFish/getFishImage below), falling back to the original
     hand-drawn primitives for the ~32/151 species with no plate yet or
     while an image is still loading. What's real regardless of which draw
     path fires is the swim behavior: each occupant's Monster.behavior (the
     fish bible's own vocabulary -- drift/dart/lurk/school/anchor/surface/
     hover/tumble/cling) selects a movement profile instead of a hardcoded
     three-value switch, and hue (used by the primitive fallback only) comes
     from Monster.hue when a balance pass has set it, falling back to a
     slug-derived hue so an unassigned species still reads consistently
     rather than defaulting to one color.

     The console shell (cthulhuquarium/t-098): a gilt-and-iron bezel with the
     tank as its one stage, HUD capsules top-right, care meters on the water,
     and a five-tab command deck (Tank, Feed, Creatures, Relics, Market) with
     L/R shoulder hints and a button-prompt row driven by keyboard, gamepad or
     touch. Rooms open inside the bezel; Feed is the tank with feeding live. -->
<template>
  <ClientOnly>
    <Teleport to="body" :disabled="!fullscreen">
      <div
        ref="gameRoot"
        class="cq-game flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden"
        :class="{ 'cq-fullscreen': fullscreen, 'cq-feeding': feedMode }"
        :data-theme="fullscreen ? 'cthulhuquarium' : undefined"
        :data-input="inputDevice"
      >
        <cthulhuquarium-dialogue />
        <cthulhuquarium-guide />
        <page-help label="How to tend the tank" @open="tankStore.openGuide()" />
        <div
          v-if="tankStore.error"
          class="pointer-events-none fixed inset-x-0 top-24 z-[70] flex justify-center px-4"
          role="alert"
        >
          <div
            class="alert alert-error pointer-events-auto max-w-lg text-sm shadow-xl"
          >
            <span>{{ tankStore.error }}</span>
            <button
              type="button"
              class="btn btn-ghost btn-xs min-h-11 min-w-11"
              aria-label="Dismiss"
              @click="tankStore.dismissError()"
            >
              <Icon name="kind-icon:close" class="kr-icon-4" />
            </button>
          </div>
        </div>

        <div class="cq-layout">
          <span
            v-for="corner in BEZEL_CORNERS"
            :key="corner"
            class="cq-corner"
            :class="`cq-corner-${corner}`"
            aria-hidden="true"
          >
            <cthulhuquarium-ui-art name="corner-ornament" />
          </span>

          <div class="cq-topbar">
            <div class="cq-cartouche">
              <svg
                class="cq-cartouche-frame"
                viewBox="0 0 320 56"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M18 4h284c4 0 6 3 8 6l6 18-6 18c-2 3-4 6-8 6H18c-4 0-6-3-8-6L4 28l6-18c2-3 4-6 8-6z"
                  fill="rgb(9 18 20 / 0.92)"
                  stroke="#6f5428"
                  stroke-width="4"
                />
                <path
                  d="M18 4h284c4 0 6 3 8 6l6 18-6 18c-2 3-4 6-8 6H18c-4 0-6-3-8-6L4 28l6-18c2-3 4-6 8-6z"
                  fill="none"
                  stroke="#c49a52"
                  stroke-width="1.6"
                />
                <path
                  d="M22 10h276M22 46h276"
                  stroke="#ecd08e"
                  stroke-width="0.8"
                  opacity="0.45"
                />
              </svg>
              <svg
                class="cq-cartouche-curl"
                viewBox="0 0 40 40"
                aria-hidden="true"
              >
                <path
                  d="M6 34C4 18 14 6 28 8c8 1 9 11 3 13-5 2-8-3-5-6"
                  fill="none"
                  stroke="#5fa892"
                  stroke-width="3"
                  stroke-linecap="round"
                />
              </svg>
              <span class="cq-wordmark">Cthulhuquarium</span>
            </div>
            <div class="cq-capsules">
              <span
                class="cq-capsule cq-capsule-coins"
                :class="{ 'cq-focus': storyFocus === 'coins' }"
                :aria-label="`${tankStore.coins} coins`"
              >
                <cthulhuquarium-ui-art name="coin" class="cq-capsule-icon" />
                <span class="tabular-nums">{{ coinLabel }}</span>
              </span>
              <span
                class="cq-capsule"
                :title="`${tankStore.occupantSize} of ${tankStore.sizeCap} places taken`"
                :aria-label="`${tankStore.occupantSize} of ${tankStore.sizeCap} places taken`"
              >
                <cthulhuquarium-ui-art
                  name="capacity"
                  class="cq-capsule-icon"
                />
                <span class="tabular-nums"
                  >{{ tankStore.occupantSize }} / {{ tankStore.sizeCap }}</span
                >
              </span>
              <span
                v-if="tankDay"
                class="cq-capsule cq-capsule-day"
                :aria-label="`Day ${tankDay} of this tank, ${clockLabel}`"
              >
                <cthulhuquarium-ui-art
                  name="day-moon"
                  class="cq-capsule-icon"
                />
                <span>Day {{ tankDay }}</span>
                <span class="cq-capsule-time tabular-nums">{{
                  clockLabel
                }}</span>
              </span>
              <button
                type="button"
                class="cq-hud-button"
                :aria-pressed="activePanel === 'scenery'"
                aria-label="World and story"
                title="World and story"
                @click="selectPanel('scenery')"
              >
                <Icon name="kind-icon:image" class="size-4" />
              </button>
              <button
                type="button"
                class="cq-hud-button"
                :aria-pressed="tankStore.soundOn"
                :aria-label="
                  tankStore.soundOn ? 'Mute the tank' : 'Listen to the tank'
                "
                @click="onToggleSound"
              >
                <Icon
                  :name="
                    tankStore.soundOn
                      ? 'kind-icon:volume-high'
                      : 'kind-icon:volume'
                  "
                  class="size-4"
                />
              </button>
              <button
                type="button"
                class="cq-hud-button"
                :aria-pressed="fullscreen"
                :aria-label="
                  fullscreen ? 'Leave fullscreen' : 'Play fullscreen'
                "
                :title="fullscreen ? 'Leave fullscreen' : 'Play fullscreen'"
                @click="toggleFullscreen"
              >
                <Icon
                  :name="
                    fullscreen ? 'kind-icon:minimize' : 'kind-icon:fullscreen'
                  "
                  class="size-4"
                />
              </button>
            </div>
          </div>

          <div class="cq-tank" :class="{ 'cq-focus': storyFocus === 'tank' }">
            <img
              v-if="tankBackdrop"
              :src="tankBackdrop"
              alt=""
              aria-hidden="true"
              class="cq-tank-backdrop pointer-events-none"
            />
            <div class="cq-glass-well">
              <div class="cq-glass">
                <canvas
                  ref="canvasRef"
                  class="relative z-[1] block cursor-pointer touch-none"
                  :width="STAGE_WIDTH * RENDER_SCALE"
                  :height="STAGE_HEIGHT * RENDER_SCALE"
                  :aria-label="
                    feedMode
                      ? 'Aquarium tank, feeding. Tap a creature to feed it, or tap a coin to collect it.'
                      : 'Aquarium tank. Every fed fish drops coins; tap them to collect them, tap near a fish to startle it, or drag a placed decoration to move it.'
                  "
                  @pointerdown="onCanvasPointerDown"
                  @pointermove="onCanvasPointerMove"
                  @pointerup="onCanvasPointerUp"
                  @pointercancel="onCanvasPointerUp"
                  @pointerleave="onCanvasPointerLeave"
                />
                <span class="cq-glass-sheen" aria-hidden="true" />
              </div>
              <div class="cq-meters" role="group" aria-label="Tank care">
                <button
                  v-if="tankStore.stock.length"
                  type="button"
                  class="cq-meter"
                  :class="{
                    'cq-meter-low': averageFed < 50,
                    'cq-meter-lit': feedMode,
                  }"
                  :aria-label="`Fed ${averageFed}%. Open feeding.`"
                  @click="selectTab('feed')"
                >
                  <cthulhuquarium-ui-art
                    name="meter-hunger"
                    class="cq-meter-icon"
                  />
                  <span class="cq-meter-label">Fed</span>
                  <span class="cq-meter-value tabular-nums"
                    >{{ averageFed }}%</span
                  >
                  <span class="cq-meter-bar" aria-hidden="true">
                    <span :style="{ width: `${averageFed}%` }" />
                  </span>
                </button>
                <button
                  type="button"
                  class="cq-meter cq-action-clean"
                  :class="{
                    'cq-focus': storyFocus === 'clean',
                    'cq-meter-low': tankStore.debrisLevel >= 50,
                  }"
                  :disabled="
                    tankStore.debrisLevel <= 0 &&
                    tankStore.pendingCleanClicks === 0
                  "
                  :aria-label="`Clean the tank, debris ${tankStore.debrisLevel}%`"
                  @click="onClean"
                >
                  <cthulhuquarium-ui-art
                    name="meter-clean"
                    class="cq-meter-icon"
                  />
                  <span class="cq-meter-label">Clean</span>
                  <span class="cq-meter-value tabular-nums">{{
                    tankStore.pendingCleanClicks > 0
                      ? `×${tankStore.pendingCleanClicks}`
                      : `${cleanliness}%`
                  }}</span>
                  <span
                    class="cq-meter-bar"
                    role="meter"
                    :aria-valuenow="tankStore.debrisLevel"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Tank debris"
                  >
                    <span :style="{ width: `${cleanliness}%` }" />
                  </span>
                </button>
              </div>
              <div v-if="feedMode" class="cq-feed-banner" role="status">
                <cthulhuquarium-ui-art
                  name="tab-feed"
                  class="cq-feed-banner-icon"
                />
                <span>{{ feedHint }}</span>
              </div>
            </div>

            <div class="cq-notices">
              <div
                v-if="tankStore.lastRareEvent"
                class="cq-notice"
                role="status"
              >
                <Icon
                  name="kind-icon:sparkles"
                  class="kr-icon-4 mt-0.5 shrink-0 opacity-60"
                />
                <div class="min-w-0 flex-1">
                  <p class="italic opacity-90">
                    {{ tankStore.lastRareEvent.tone }}
                  </p>
                  <p
                    v-if="tankStore.lastRareEvent.bonusCoins > 0"
                    class="kr-text-bold-xs mt-1 opacity-70"
                  >
                    +{{ tankStore.lastRareEvent.bonusCoins }} coins
                  </p>
                </div>
                <button
                  type="button"
                  class="cq-notice-close"
                  aria-label="Dismiss"
                  @click="tankStore.dismissRareEvent()"
                >
                  <Icon name="kind-icon:close" class="kr-icon-4" />
                </button>
              </div>
              <div
                v-if="tankStore.nextMilestoneToast"
                class="cq-notice cq-notice-milestone"
                role="status"
              >
                <Icon name="kind-icon:trophy" class="mt-0.5 size-4 shrink-0" />
                <p class="min-w-0 flex-1 font-bold">
                  {{ tankStore.nextMilestoneToast }}
                </p>
                <button
                  type="button"
                  class="cq-notice-close"
                  aria-label="Dismiss"
                  @click="tankStore.dismissMilestoneToast()"
                >
                  <Icon name="kind-icon:close" class="kr-icon-4" />
                </button>
              </div>
              <div
                v-if="tankStore.pendingDecorKind"
                class="cq-notice cq-notice-place"
                role="status"
              >
                <span class="min-w-0 flex-1 font-bold">
                  Tap the tank to place
                  {{ decorTitle(tankStore.pendingDecorKind) }}
                </span>
                <button
                  type="button"
                  class="cq-plate-button cq-plate-button-quiet"
                  @click="tankStore.cancelDecorPlacement()"
                >
                  Cancel
                </button>
              </div>
            </div>

            <cthulhuquarium-bark
              class="cq-tank-bark pointer-events-auto"
              :class="{ 'cq-tank-bark-top': feedMode }"
            />

            <p v-if="tankStore.loading" class="cq-tank-caption">
              Settling into your tank…
            </p>
            <p
              v-else-if="!tankStore.stock.length"
              class="cq-tank-caption pointer-events-none"
            >
              An empty tank, waiting. The Market has today's specimens.
            </p>
          </div>

          <div
            ref="roomLayer"
            class="cq-room-layer"
            :class="{ 'cq-room-open': activePanel }"
          >
            <button
              v-if="activePanel"
              type="button"
              class="cq-room-shade"
              tabindex="-1"
              :aria-label="`Close ${activePanelName} and return to aquarium`"
              @click="closePanel"
            />
            <img
              v-if="activePanelArt"
              :src="activePanelArt"
              alt=""
              aria-hidden="true"
              class="cq-room-backdrop pointer-events-none absolute object-cover"
              :class="{ 'cq-room-backdrop-scene': activePanel === 'shop' }"
            />
            <div v-if="activePanel" class="cq-room-heading">
              <span class="cq-room-title">{{ activePanelName }}</span>
              <button
                type="button"
                class="cq-room-close"
                :aria-label="`Close ${activePanelName}`"
                @click="closePanel"
              >
                <Icon name="kind-icon:close" class="kr-icon-4" />
              </button>
            </div>

            <div
              v-show="activePanel === 'shop'"
              class="cq-side cq-market"
              :class="{ 'cq-focus': storyFocus === 'shop' }"
            >
              <cthulhuquarium-market ref="marketRoom" />
            </div>

            <div
              v-show="activePanel === 'roster' || activePanel === 'bestiary'"
              class="cq-roster"
              :class="{ 'cq-focus': storyFocus === 'bestiary' }"
            >
              <cthulhuquarium-creatures
                ref="creaturesRoom"
                v-model:book="bookOpen"
              />
            </div>

            <div
              v-show="activePanel === 'sets' || activePanel === 'decor'"
              class="cq-support-panel"
            >
              <cthulhuquarium-relics
                v-model:view="relicsView"
                @placing="closePanel"
              />
            </div>

            <div
              v-show="activePanel === 'scenery'"
              class="cq-support-panel cq-scenery"
            >
              <h3 class="cq-rail-title">World &amp; story</h3>
              <button
                type="button"
                data-nav
                class="cq-plate-button cq-scenery-replay"
                @click="
                  () => {
                    closePanel()
                    tankStore.replayIntro()
                  }
                "
              >
                <Icon name="kind-icon:play" class="kr-icon-4" />
                Meet Charlotte and Wilbur · Replay the opening
              </button>
              <section class="cq-scenery-section">
                <h4 class="cq-section-title">Behind the glass</h4>
                <cthulhuquarium-bark context="backgrounds" />
                <div class="cq-backdrop-strip kr-scroll">
                  <button
                    v-for="background in tankStore.backgrounds"
                    :key="background.key"
                    type="button"
                    data-nav
                    class="cq-backdrop-card"
                    :class="{
                      'cq-backdrop-card-on':
                        background.key === tankStore.backgroundKey,
                    }"
                    :disabled="
                      !background.unlocked || tankStore.backgroundSaving
                    "
                    :aria-pressed="background.key === tankStore.backgroundKey"
                    :title="
                      background.unlocked ? background.fieldNote : undefined
                    "
                    @click="tankStore.chooseBackground(background.key)"
                  >
                    <img
                      v-if="backgroundArt(background.key)"
                      :src="backgroundArt(background.key) ?? undefined"
                      :alt="background.name"
                      loading="lazy"
                      :class="{ 'cq-backdrop-locked': !background.unlocked }"
                    />
                    <span v-else class="cq-backdrop-blank" />
                    <span class="cq-backdrop-name">{{
                      background.unlocked ? background.name : 'Not yet'
                    }}</span>
                    <span class="cq-backdrop-note">{{
                      background.unlocked
                        ? background.fieldNote
                        : backgroundUnlockHint(background.unlock)
                    }}</span>
                  </button>
                </div>
              </section>
              <section v-if="tankStore.finaleConfig" class="cq-relic">
                <span class="cq-relic-art">
                  <img :src="setLastAquariumArt" alt="" />
                </span>
                <div class="cq-relic-body">
                  <h4 class="cq-plaque-title">
                    {{ tankStore.finaleConfig.title }}
                    <span
                      v-if="tankStore.finaleTriggered"
                      class="cq-rarity-seal"
                      data-rarity="mythic"
                      >Yours</span
                    >
                  </h4>
                  <p class="cq-plaque-text">
                    {{ tankStore.finaleConfig.description }}
                  </p>
                  <button
                    v-if="!tankStore.finaleTriggered"
                    type="button"
                    data-nav
                    class="cq-price"
                    :disabled="tankStore.coins < tankStore.finaleConfig.cost"
                    @click="tankStore.purchaseFinale()"
                  >
                    <cthulhuquarium-ui-art name="coin" class="cq-price-coin" />
                    <span class="tabular-nums">{{
                      tankStore.finaleConfig.cost
                    }}</span>
                  </button>
                </div>
              </section>
              <section class="cq-scenery-section cq-scenery-links">
                <label class="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    class="kr-toggle-success-sm"
                    :checked="tankStore.tank?.isPublic ?? false"
                    :disabled="visibilitySaving"
                    @change="onToggleVisibility"
                  />
                  <span class="kr-text-bold-xs">
                    {{
                      tankStore.tank?.isPublic ? 'Public tank' : 'Private tank'
                    }}
                  </span>
                </label>
                <NuxtLink
                  v-if="tankStore.tank?.isPublic && username"
                  :to="`/play/aquarium/browse/${username}/${tankStore.tank.slug}`"
                  class="link text-xs opacity-80"
                >
                  View your public page
                </NuxtLink>
                <NuxtLink
                  to="/play/aquarium/browse"
                  class="link text-xs opacity-80"
                >
                  Browse public tanks
                </NuxtLink>
                <NuxtLink
                  to="/play/aquarium/leaderboard"
                  class="link text-xs opacity-80"
                >
                  Leaderboard
                </NuxtLink>
              </section>
              <details
                v-if="userStore.isAdmin"
                class="cq-scenery-section"
                @toggle="
                  curationOpen = ($event.target as HTMLDetailsElement).open
                "
              >
                <summary
                  class="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-xs font-bold marker:hidden"
                >
                  <span class="flex items-center gap-2">
                    <Icon name="kind-icon:lock" class="kr-icon-4" />
                    Monster curation
                  </span>
                  <span class="kr-badge-outline">Admin</span>
                </summary>
                <div class="pt-2">
                  <CurationCthulhuquariumCuration v-if="curationOpen" />
                </div>
              </details>
            </div>
          </div>

          <div class="cq-controller">
            <nav class="cq-command-deck" aria-label="Aquarium rooms">
              <button
                type="button"
                class="cq-shoulder"
                aria-label="Previous room"
                aria-keyshortcuts="Q"
                @click="cycleTab(-1)"
              >
                <Icon name="kind-icon:chevron-left" class="size-3.5" />
                <span>{{ shoulderLabels[0] }}</span>
              </button>
              <button
                v-for="tab in CONSOLE_TABS"
                :key="tab.id"
                type="button"
                class="cq-deck-button"
                :data-tab="tab.id"
                :class="{
                  'cq-deck-on': activeTab === tab.id,
                  'cq-focus': tabFocus === tab.id,
                }"
                :aria-pressed="activeTab === tab.id"
                @click="selectTab(tab.id)"
              >
                <cthulhuquarium-ui-art :name="tab.art" class="cq-deck-icon" />
                <span class="cq-deck-label">{{ tab.title }}</span>
                <span
                  v-if="tab.id === 'feed' && tankStore.hungryCount > 0"
                  class="cq-deck-badge tabular-nums"
                  :aria-label="`${tankStore.hungryCount} hungry`"
                  >{{ tankStore.hungryCount }}</span
                >
              </button>
              <button
                type="button"
                class="cq-shoulder"
                aria-label="Next room"
                aria-keyshortcuts="E"
                @click="cycleTab(1)"
              >
                <span>{{ shoulderLabels[1] }}</span>
                <Icon name="kind-icon:chevron-right" class="size-3.5" />
              </button>
            </nav>
            <div class="cq-prompts" role="toolbar" aria-label="Controls">
              <template
                v-for="prompt in prompts"
                :key="`${prompt.pad}-${prompt.label}`"
              >
                <button
                  v-if="prompt.run"
                  type="button"
                  class="cq-prompt"
                  :class="{ 'cq-focus': prompt.focus }"
                  :disabled="prompt.disabled"
                  :aria-keyshortcuts="KEY_SHORTCUTS[prompt.pad]"
                  @click="prompt.run()"
                >
                  <span class="cq-prompt-glyph" :data-pad="prompt.pad">{{
                    glyphFor(prompt.pad)
                  }}</span>
                  <span class="cq-prompt-label">{{ prompt.label }}</span>
                </button>
                <span v-else class="cq-prompt cq-prompt-hint">
                  <span class="cq-prompt-glyph" :data-pad="prompt.pad">{{
                    glyphFor(prompt.pad)
                  }}</span>
                  <span class="cq-prompt-label">{{ prompt.label }}</span>
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- The unlock reveal beat (cthulhuquarium/t-012): the field note is
         real information the player earned by paying for it, not shop
         copy -- so it gets a moment of its own instead of quietly sitting
         in a shrinking catalog card. -->
    <Teleport to="body">
      <dialog
        v-if="tankStore.revealedUnlock"
        class="modal modal-open"
        data-theme="cthulhuquarium"
        aria-modal="true"
        @cancel.prevent="tankStore.dismissReveal()"
      >
        <div
          class="modal-box flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-base-300 bg-base-100 text-center shadow-2xl"
        >
          <p class="kr-text-eyebrow text-xs tracking-wide text-primary">
            New occupant
          </p>
          <kr-art-plate
            :source="withCthulhuquariumArt(tankStore.revealedUnlock.Monster)"
            variant="card"
            shape="plate"
            frame="thin"
            fit="cover"
            class="h-32 w-24"
            placeholder-icon="kind-icon:fish"
          />
          <h3 class="kr-text-black-lg">
            {{ tankStore.revealedUnlock.Monster.name }}
          </h3>
          <p
            v-if="tankStore.revealedUnlock.Monster.species"
            class="text-xs italic opacity-60"
          >
            {{ tankStore.revealedUnlock.Monster.species }}
          </p>
          <p class="kr-text-faded-sm-80">
            {{
              tankStore.revealedUnlock.Monster.fieldNote ||
              'Nothing is written about this one yet.'
            }}
          </p>
          <p
            v-if="voiceFor(tankStore.revealedUnlock.Monster.slug, 'wilbur')"
            class="rounded-xl bg-base-200 p-2 font-serif text-sm leading-snug"
          >
            “{{ voiceFor(tankStore.revealedUnlock.Monster.slug, 'wilbur') }}”
            <span class="text-xs opacity-60">— Wilbur, carrying it out</span>
          </p>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-1"
            @click="tankStore.dismissReveal()"
          >
            Add it to the tank
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="tankStore.dismissReveal()">
            close
          </button>
        </form>
      </dialog>
    </Teleport>

    <!-- The bestiary completion beat (cthulhuquarium/t-024): "the closest
         thing this game has to an ending... but it must not end the session
         or lock anything, because the tank keeps running." Dismissing this
         does nothing but close the dialog -- the tank, coins, and stock are
         all untouched. -->
    <Teleport to="body">
      <dialog
        v-if="tankStore.bestiaryJustCompleted"
        class="modal modal-open"
        data-theme="cthulhuquarium"
        aria-modal="true"
        @cancel.prevent="tankStore.dismissBestiaryCompletion()"
      >
        <div
          class="modal-box flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-base-300 bg-base-100 text-center shadow-2xl"
        >
          <Icon name="kind-icon:trophy" class="size-10 text-warning" />
          <p class="kr-text-eyebrow text-xs tracking-wide text-primary">
            The bestiary is complete
          </p>
          <h3 class="kr-text-black-lg">Every species, observed.</h3>
          <p class="kr-text-faded-sm-80">
            Nothing here resets and nothing leaves the collection -- the tank
            keeps running exactly as it was. This is just the beat that says so.
          </p>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-1"
            @click="tankStore.dismissBestiaryCompletion()"
          >
            Back to the tank
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="tankStore.dismissBestiaryCompletion()">
            close
          </button>
        </form>
      </dialog>
    </Teleport>

    <!-- The finale (cthulhuquarium/t-039): "you are also in an aquarium."
         The real screen-finale plate (cthulhuquarium/t-054) -- the same
         albumen interior stock as screen-shop/screen-bestiary, viewed across
         a glass tabletop toward the shop's own lit tanks -- replaces the
         icon-only placeholder t-028/t-053's toast established as the interim
         convention. Never re-triggers: finaleJustTriggered only ever flips
         true once, the same one-time-reveal shape as bestiaryJustCompleted
         above. -->
    <Teleport to="body">
      <dialog
        v-if="tankStore.finaleJustTriggered"
        class="modal modal-open"
        data-theme="cthulhuquarium"
        aria-modal="true"
        @cancel.prevent="tankStore.dismissFinaleReveal()"
      >
        <div
          class="modal-box flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-base-300 bg-base-100 text-center shadow-2xl"
        >
          <kr-art-plate
            :source="{
              imagePath: movingArt('screen-finale') ?? screenFinaleArt,
            }"
            shape="wide"
            frame="thin"
            fit="cover"
            class="w-full"
            placeholder-icon="kind-icon:eye"
          />
          <p class="kr-text-eyebrow text-xs tracking-wide text-primary">
            The last aquarium
          </p>
          <h3 class="kr-text-black-lg">
            Everything is exactly as you left it.
          </h3>
          <p class="kr-text-faded-sm-80">
            Nothing in your tank has changed. But through the glass across the
            shop's window, something enormous drifts past, pauses for a moment
            the way you pause at a tank you've already seen today, and moves on.
          </p>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-1"
            @click="tankStore.dismissFinaleReveal()"
          >
            Back to the tank
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="tankStore.dismissFinaleReveal()">
            close
          </button>
        </form>
      </dialog>
    </Teleport>

    <!-- The welcome-back beat (cthulhuquarium/t-013): settled on load()
         from lastTickAt, before this component even finishes mounting.
         Deliberately not congratulatory -- something worked while nobody
         was watching, and the tank is not going to explain itself. -->
    <Teleport to="body">
      <dialog
        v-if="tankStore.offlineEarnings > 0"
        class="modal modal-open"
        data-theme="cthulhuquarium"
        aria-modal="true"
        @cancel.prevent="tankStore.clearOfflineEarnings()"
      >
        <div
          class="modal-box flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-base-300 bg-base-100 text-center shadow-2xl"
        >
          <Icon name="kind-icon:coin" class="kr-icon-8 text-warning" />
          <p class="kr-text-eyebrow text-xs tracking-wide text-primary">
            While you were away
          </p>
          <h3 class="kr-text-black-lg">
            {{ tankStore.offlineEarnings }} coins
          </h3>
          <p class="kr-text-faded-sm-80">
            Something kept working{{ offlineDurationLabel }}. Nobody says by
            whom.
          </p>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-1"
            @click="tankStore.clearOfflineEarnings()"
          >
            Take it
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="tankStore.clearOfflineEarnings()">
            close
          </button>
        </form>
      </dialog>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import {
  TANK_POLL_INTERVAL_MS,
  useCthulhuquariumTankStore,
  type TankDecor,
  type TankStock,
} from '~/stores/cthulhuquariumTankStore'
import { touchHitRadius } from '~/utils/aquariumTouch'
import { useUserStore } from '~/stores/userStore'
import {
  isTextEntry,
  moveFocus,
  newPadMemory,
  readPad,
  type ConsoleCommand,
  type InputDevice,
} from '~/utils/consoleInput'
import {
  averageFed as averageFedOf,
  CONSOLE_TABS,
  cycleConsoleTab,
  KEY_FOR_PAD,
  PANEL_TITLES,
  tabForPanel,
  tabForStoryFocus,
  tankDayNumber,
  type AquariumPanel,
  type ConsoleTab,
  type PadButton,
} from '~/utils/cthulhuquariumConsole'
import CurationCthulhuquariumCuration from '@/components/curation/cthulhuquarium-curation.vue'
// cthulhuquarium/t-054: the finale's two plates, authored in conductor's
// projects/cthulhuquarium/art/ (screen-finale.webp 76eb4140, set-last-
// aquarium.webp ee3354e0) but with no Monster/Reward row to hang an ArtImage
// off. `distribute_images.py`'s media-share pipeline is unusable here:
// it's a manual step on Silas's home network, not something CI or an agent
// session can write to. Bundling as ordinary Vite assets sidesteps that
// entirely -- committed to git (unlike the ignored public/images/**), built
// into a normal fingerprinted _nuxt/ URL, no infra dependency at all.
import screenFinaleArt from '~/assets/images/cthulhuquarium/cthulhuquarium-screen-finale.webp'
import setLastAquariumArt from '~/assets/images/cthulhuquarium/cthulhuquarium-set-last-aquarium.webp'
// cthulhuquarium/t-065: the other 136 authored plates, delivered by the same
// route these two already proved. artByName covers the named scene plates; withCthulhuquariumArt fills a Monster's empty
// icon/card slots from its slug without overwriting anything the DB supplies.
import {
  artByName,
  artForSpecies,
  backgroundArt,
  movingArt,
  withCthulhuquariumArt,
} from '~/utils/cthulhuquariumArt'
import {
  drawAnimatedSprite,
  motionForSpecies,
  prefersReducedMotion,
  spriteForSpecies,
} from '~/utils/cthulhuquariumSprites'
import {
  facingOf,
  hunt,
  isMassSprite,
  packmatePositions,
  pitchOf,
  spawnSwimState,
  startle,
  stepSwimState,
  type SwimState,
} from '~/utils/cthulhuquariumMotion'
import { CTHULHUQUARIUM_VOICES } from '~/utils/cthulhuquariumCanon.generated'
import { TankSound } from '~/utils/cthulhuquariumSound'
import {
  createAmbience,
  drawAmbienceBack,
  drawAmbienceFront,
  drawDebris,
  stepAmbience,
} from '~/utils/cthulhuquariumAmbience'
import { decorIcon, LEGACY_PARLOUR_CROP } from '~/utils/cthulhuquariumStage'
import {
  makeFeedParticles,
  nearestFood,
  MAX_VISIBLE_FOOD,
  type FeedParticle,
} from '~/utils/cthulhuquariumFood'

/* Fixed logical resolution; CSS scales it to the host width so the canvas
   survives phone widths without its own breakpoint logic. */
const STAGE_WIDTH = 640
const STAGE_HEIGHT = 360
// The canvas backing store is RENDER_SCALE x the stage, and the context is
// scaled to match: the game logic stays in 640x360 stage units while sprites
// and art draw sharp on a 2x display.
const RENDER_SCALE = 2

// cthulhuquarium/t-080 coins: sink speed (stage px/s), where they come to
// rest, how long the fade-out takes, and the most drawn at once (oldest go
// first) so a 40-fish tank stays smooth on a phone.
const COIN_DRIFT_SPEED = 9
const COIN_REST_Y = STAGE_HEIGHT - 18
const COIN_FADE_SECONDS = 1.5
const COIN_MAX_ON_SCREEN = 90
const COIN_POP_SECONDS = 0.9
const FOOD_FALL_SPEED = 70

type BehaviorProfile = {
  speed: number
  vBand: readonly [number, number]
  wobble: number
  wallCling: boolean
  stationary: boolean
  lure: boolean
}

// The fish bible's own movement vocabulary (schema.prisma's Monster.behavior
// doc comment). Unknown/missing behavior falls back to DRIFT_PROFILE rather
// than failing to render -- a data gap should never mean an invisible fish.
const DRIFT_PROFILE: BehaviorProfile = {
  speed: 34,
  vBand: [0.15, 0.85],
  wobble: 9,
  wallCling: false,
  stationary: false,
  lure: false,
}

const BEHAVIOR_PROFILES: Record<string, BehaviorProfile> = {
  drift: DRIFT_PROFILE,
  dart: {
    speed: 62,
    vBand: [0.15, 0.85],
    wobble: 9,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  lurk: {
    speed: 14,
    vBand: [0.15, 0.85],
    wobble: 3,
    wallCling: false,
    stationary: false,
    lure: true,
  },
  school: {
    speed: 40,
    vBand: [0.25, 0.7],
    wobble: 7,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  anchor: {
    speed: 4,
    vBand: [0.7, 0.92],
    wobble: 1.5,
    wallCling: false,
    stationary: true,
    lure: false,
  },
  surface: {
    speed: 26,
    vBand: [0.05, 0.22],
    wobble: 6,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  hover: {
    speed: 10,
    vBand: [0.3, 0.6],
    wobble: 2,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  tumble: {
    speed: 20,
    vBand: [0.15, 0.85],
    wobble: 14,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  cling: {
    speed: 5,
    vBand: [0.15, 0.85],
    wobble: 1,
    wallCling: true,
    stationary: false,
    lure: false,
  },
}

function behaviorProfile(behavior: string | null): BehaviorProfile {
  return BEHAVIOR_PROFILES[(behavior || '').toLowerCase()] ?? DRIFT_PROFILE
}

// swim_speed (cthulhuquarium/t-026, economy.yaml set_pieces.swim_speed):
// "cosmetic_only, value: null" -- there is no economy number to read here,
// only a visual pacing choice this component owns. 1.4x is a deliberately
// noticeable-but-not-frantic bump over each behavior's own base speed.
const SWIM_SPEED_SET_KIND = 'swim_speed'
const SWIM_SPEED_MULTIPLIER = 1.4

// roaming_collector (cthulhuquarium/t-026 economy, cthulhuquarium/t-049
// visual): the set piece's income bonus is entirely server-side already
// (server/utils/aquariumEconomy.ts's settleTick), same as idle_hoarder --
// t-026 made the two economically identical but only idle_hoarder is a pure
// stat, and Silas's own note on roaming_collector asked for it to "visibly
// move around the tank... it is a thing to watch." This sprite is that
// visual and nothing else: it drifts. Dropped coins are real click income
// (t-080), so it leaves them alone -- its bonus is already paid by
// settleTick, and sweeping a coin would take it from the player.
const ROAMING_COLLECTOR_SET_KIND = 'roaming_collector'
const COLLECTOR_SPEED = 30

// Deterministic fallback hue for a species Monster.hue hasn't been assigned
// yet -- same slug always reads the same color instead of shifting on
// every reload/re-render.
function hashHue(slug: string): number {
  let hash = 0
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0
  }
  return hash % 360
}

type Swimmer = SwimState & {
  stockId: number
  monsterId: number
  facing: number
  profile: BehaviorProfile
}

/* A dropped coin (t-080). `age` counts up from the drop; the coin is removed
   at tank.coinVisibleSeconds. `radius` and `hue` are fixed at drop time from
   its value, so a rarer fish's coin is visibly bigger and differently struck. */
type Coin = {
  x: number
  y: number
  drift: number
  value: number
  radius: number
  hue: number
  age: number
  spin: number
}
/* The "+N" that floats up from a collected coin. */
type CoinPop = { x: number; y: number; text: string; age: number }
/* The roaming_collector automaton (t-049). `collectFlash` counts down from 1
   after it dismisses a mote, driving a brief pulse in drawCollector -- purely
   decorative, never read anywhere else. */
type Collector = {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  collectFlash: number
}
/* The food is ALIVE (Silas, 2026-08-24) -- it wriggles on the way down and
   stops when eaten. `phase` drives the wriggle, `lean` gives each one its
   own bias so a handful never moves in unison. */
type FeedCreature = FeedParticle

const tankStore = useCthulhuquariumTankStore()
const shopHeaderArt =
  (prefersReducedMotion() ? null : movingArt('screen-shop')) ??
  artByName('screen-shop')
// The illustrated surroundings cover letterbox space on tall mobile displays.
const tankBackdrop = computed(
  () => backgroundArt(tankStore.backgroundKey) ?? backgroundArt('parlour'),
)
// Held, like the dialogue itself, while anything else has the floor.
const storyFocus = computed(() =>
  tankStore.storyShowing ? (tankStore.activeBeat?.focus ?? null) : null,
)

// A beat that points at something brings it on screen: after adopting the
// first fish the page is still down at the shop, and Wilbur's "press Feed"
// ring would otherwise pulse on a button above the fold.
const gameRoot = ref<HTMLElement | null>(null)
watch(storyFocus, (focus) => {
  if (!focus) return
  if (focus === 'shop') openPanel('shop')
  if (focus === 'bestiary') openPanel('bestiary')
  if (focus === 'sets') openPanel('sets')
  if (focus === 'decor') openPanel('decor')
  if (focus === 'feed') selectTab('feed')
  if (focus === 'tank' || focus === 'coins' || focus === 'clean')
    selectTab('tank')
})

watch(
  () => tankStore.lastRareEvent,
  (event) => {
    if (event) tankStore.sayBark('rare_event')
  },
)

watch(
  () => tankStore.offlineEarnings,
  (earned, before) => {
    if (earned > 0 && !before) tankStore.sayBark('welcome_back')
  },
)

function voiceFor(
  slug: string | null | undefined,
  who: 'charlotte' | 'wilbur',
): string {
  return slug ? (CTHULHUQUARIUM_VOICES[slug]?.[who] ?? '') : ''
}

const LANDMARK_HINTS: Record<string, string> = {
  first_full_tank: 'Fill every slot',
  first_spotless_tank: 'Keep it spotless',
  first_rivalry_resolved: 'Settle a rivalry',
}
function backgroundUnlockHint(unlock: string): string {
  const bestiary = /^bestiary_(\d+)$/.exec(unlock)
  const count = bestiary?.[1]
  if (count) return `Know ${count} species`
  return LANDMARK_HINTS[unlock] ?? 'Charlotte is saving it'
}
const userStore = useUserStore()
const username = computed(() => userStore.username)
const canvasRef = ref<HTMLCanvasElement | null>(null)

/* The tank's background: the parlour until Charlotte hands over another
   (canon backgrounds/backgrounds.yaml, chosen via tankStore.chooseBackground).
   Plain Image rather than a ref because render() reads it every frame; a
   decode failure leaves it incomplete and render() skips it. */
let backgroundImage: HTMLImageElement | null = null
let backgroundCrop: typeof LEGACY_PARLOUR_CROP | null = null
function loadBackground(key: string) {
  if (!import.meta.client) return
  const url = backgroundArt(key) ?? backgroundArt('parlour')
  backgroundCrop =
    url && url === artByName('bg-parlour') ? LEGACY_PARLOUR_CROP : null
  backgroundImage = url ? Object.assign(new Image(), { src: url }) : null
}
loadBackground(tankStore.backgroundKey)
watch(
  () => tankStore.backgroundKey,
  (key) => loadBackground(key),
)
const visibilitySaving = ref(false)
const curationOpen = ref(false)

// Display-only mirror of server/utils/aquariumEconomy.ts's TICK_SECONDS,
// for the welcome-back panel's duration line only -- never used to compute
// coins or anything the server doesn't already own. Same "must be kept in
// sync by hand" discipline that file's own header comment documents for
// its relationship to economy.yaml.
const DISPLAY_TICK_SECONDS = 60

const offlineDurationLabel = computed(() => {
  const seconds = tankStore.offlineTicksProcessed * DISPLAY_TICK_SECONDS
  if (seconds < 60) return ''
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60)
    return ` -- gone about ${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  return ` -- gone about ${hours} hour${hours === 1 ? '' : 's'}`
})

const swimmers = ref<Swimmer[]>([])
// Coins, their "+N" pops and each fish's coin timer are plain (non-reactive)
// state: only the canvas reads them, every frame, so Vue proxies would be
// pure overhead in a 40-fish tank.
let coins: Coin[] = []
let coinPops: CoinPop[] = []
// Seconds until each fish's next coin, keyed by stock id.
const coinTimers = new Map<number, number>()
const feed = ref<FeedCreature[]>([])
const collector = ref<Collector | null>(null)
// cthulhuquarium/t-098: the console. Six rooms sit behind five deck tabs
// (utils/cthulhuquariumConsole.ts tabForPanel); Feed is the tank itself with
// feeding live, not a room.
const BEZEL_CORNERS = ['tl', 'tr', 'bl', 'br'] as const
const activePanel = ref<AquariumPanel | null>(null)
const feedMode = ref(false)
const activeTab = computed(() => tabForPanel(activePanel.value, feedMode.value))
const tabFocus = computed(() => tabForStoryFocus(storyFocus.value))
function selectPanel(panel: AquariumPanel) {
  if (activePanel.value === panel) {
    closePanel()
    return
  }
  openPanel(panel)
}
function openPanel(panel: AquariumPanel) {
  feedMode.value = false
  activePanel.value = panel
  if (
    (panel === 'roster' || panel === 'bestiary') &&
    !tankStore.bestiary.length &&
    !tankStore.bestiaryLoading
  )
    void tankStore.loadBestiary()
  if (panel === 'sets' || panel === 'decor') {
    if (!tankStore.setCatalog.length && !tankStore.setCatalogLoading)
      void tankStore.loadSets()
    if (!tankStore.decorCatalog.length && !tankStore.decorCatalogLoading)
      void tankStore.loadDecor()
  }
}
function closePanel() {
  activePanel.value = null
}
function selectTab(tab: ConsoleTab) {
  if (tab === 'tank' || tab === 'feed') {
    closePanel()
    feedMode.value = tab === 'feed'
    return
  }
  if (activeTab.value === tab) return
  if (tab === 'creatures') openPanel('roster')
  if (tab === 'relics') openPanel(lastRelicsView.value)
  if (tab === 'market') openPanel('shop')
}
function cycleTab(step: number) {
  selectTab(cycleConsoleTab(activeTab.value, step))
}
function goBack() {
  closePanel()
  feedMode.value = false
}
const bookOpen = computed({
  get: () => activePanel.value === 'bestiary',
  set: (open: boolean) => openPanel(open ? 'bestiary' : 'roster'),
})
const lastRelicsView = ref<'sets' | 'decor'>('sets')
const relicsView = computed({
  get: () => (activePanel.value === 'decor' ? 'decor' : 'sets'),
  set: (view: 'sets' | 'decor') => {
    lastRelicsView.value = view
    openPanel(view)
  },
})
const activePanelArt = computed(() => {
  switch (activePanel.value) {
    case 'shop':
      return shopHeaderArt
    case 'roster':
      return backgroundArt('kelp-stair') ?? backgroundArt('parlour')
    case 'bestiary':
      return (
        (prefersReducedMotion() ? null : movingArt('ichthyonomicon')) ??
        artByName('ichthyonomicon')
      )
    case 'sets':
      return backgroundArt('counting-house')
    case 'decor':
      return backgroundArt('flooded-conservatory')
    case 'scenery':
      return backgroundArt(tankStore.backgroundKey)
    default:
      return null
  }
})
const activePanelName = computed(() =>
  activePanel.value ? PANEL_TITLES[activePanel.value] : '',
)
const coinLabel = computed(() =>
  new Intl.NumberFormat('en-US').format(tankStore.coins),
)
const averageFed = computed(
  () => averageFedOf(tankStore.stock.map((entry) => entry.hunger)) ?? 0,
)
const cleanliness = computed(() =>
  Math.max(0, Math.min(100, 100 - tankStore.debrisLevel)),
)
const feedHint = computed(() => {
  if (!tankStore.stock.length)
    return "Nothing to feed yet. The Market has today's specimens."
  if (tankStore.hungryCount > 0)
    return `Tap a creature to feed it · ${tankStore.hungryCount} hungry`
  return 'Everyone has eaten. Tap a creature to top it up.'
})

// Read live rather than baked into each Swimmer at spawn time, so
// equipping/unequipping Swift Current takes effect immediately instead of
// only for fish spawned afterward.
const swimSpeedMultiplier = computed(() =>
  tankStore.equippedSets.some((entry) => entry.kind === SWIM_SPEED_SET_KIND)
    ? SWIM_SPEED_MULTIPLIER
    : 1,
)

const roamingCollectorEquipped = computed(() =>
  tankStore.equippedSets.some(
    (entry) => entry.kind === ROAMING_COLLECTOR_SET_KIND,
  ),
)

let frame = 0
let lastFrameAt = 0
let pollTimer: ReturnType<typeof setInterval> | null = null

// cthulhuquarium/t-057: bumped alongside pollTick's own 20s cadence (see
// startLoops()) so the day/time capsule recomputes without a second timer.
const now = ref(Date.now())
const tankDay = computed(() =>
  tankDayNumber(tankStore.tank?.createdAt, now.value),
)
const clockLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now.value),
)

// Input: keyboard, gamepad and touch share one set of console commands
// (utils/consoleInput.ts). The prompt row names the button for whichever the
// player last touched, and every prompt is also a tappable button.
const inputDevice = ref<InputDevice>('keyboard')
const roomLayer = ref<HTMLElement | null>(null)
type CreaturesRoomHandle = {
  canFeed: boolean
  feedFeatured: () => void
}
type MarketRoomHandle = {
  view: 'specimens' | 'upgrades'
  toggleView: () => void
}
const creaturesRoom = useTemplateRef<CreaturesRoomHandle>('creaturesRoom')
const marketRoom = useTemplateRef<MarketRoomHandle>('marketRoom')

type ConsolePrompt = {
  pad: PadButton
  label: string
  run?: () => void
  disabled?: boolean
  focus?: boolean
}

const KEY_SHORTCUTS: Record<PadButton, string> = {
  A: 'Space',
  B: 'Escape',
  X: 'X',
  Y: 'Y',
}

function glyphFor(pad: PadButton): string {
  return inputDevice.value === 'keyboard' ? KEY_FOR_PAD[pad] : pad
}

const shoulderLabels = computed(() =>
  inputDevice.value === 'gamepad'
    ? ['LB', 'RB']
    : inputDevice.value === 'keyboard'
      ? ['Q', 'E']
      : ['L', 'R'],
)

const prompts = computed<ConsolePrompt[]>(() => {
  const back: ConsolePrompt = { pad: 'B', label: 'Back', run: goBack }
  const select: ConsolePrompt = { pad: 'A', label: 'Select' }
  const hungry = tankStore.hungryCount
  if (activePanel.value === 'scenery') return [select, back]
  switch (activeTab.value) {
    case 'feed':
      return [
        {
          pad: 'A',
          label: 'Feed hungriest',
          run: feedHungriest,
          disabled: !tankStore.hungriest || feeding.value,
          focus: storyFocus.value === 'feed',
        },
        {
          pad: 'X',
          label: hungry > 0 ? `Feed all hungry (${hungry})` : 'Feed all hungry',
          run: onFeed,
          disabled: hungry === 0 || feeding.value,
        },
        back,
      ]
    case 'creatures':
      return [
        select,
        {
          pad: 'X',
          label: 'Feed',
          run: () => creaturesRoom.value?.feedFeatured(),
          disabled: bookOpen.value || !creaturesRoom.value?.canFeed,
        },
        {
          pad: 'Y',
          label: bookOpen.value ? 'Creature list' : 'The book',
          run: () => (bookOpen.value = !bookOpen.value),
        },
        back,
      ]
    case 'relics':
      return [
        select,
        {
          pad: 'X',
          label: relicsView.value === 'sets' ? 'Ornaments' : 'Set pieces',
          run: () =>
            (relicsView.value = relicsView.value === 'sets' ? 'decor' : 'sets'),
        },
        back,
      ]
    case 'market':
      return [
        { pad: 'A', label: 'Buy' },
        {
          pad: 'X',
          label:
            marketRoom.value?.view === 'upgrades' ? 'Specimens' : 'Upgrades',
          run: () => marketRoom.value?.toggleView(),
        },
        back,
      ]
    default:
      return [
        {
          pad: 'A',
          label: 'Clean',
          run: onClean,
          disabled:
            tankStore.debrisLevel <= 0 && tankStore.pendingCleanClicks === 0,
          focus: storyFocus.value === 'clean',
        },
        {
          pad: 'X',
          label: hungry > 0 ? `Feed hungry (${hungry})` : 'Feed',
          run: onFeed,
          disabled: !tankStore.hungriest || feeding.value,
          focus: storyFocus.value === 'feed',
        },
        {
          pad: 'Y',
          label: 'World & story',
          run: () => openPanel('scenery'),
        },
      ]
  }
})

function runPrompt(pad: PadButton): boolean {
  const prompt = prompts.value.find((entry) => entry.pad === pad)
  if (!prompt?.run || prompt.disabled) return false
  prompt.run()
  return true
}

// Anything modal (the cinematic dialogue, the tutorial, a reveal, the book's
// spread) owns the keys while it is open.
function consoleBlocked(): boolean {
  return !!document.querySelector(
    'dialog[open], .modal-open, [aria-modal="true"]',
  )
}

function focusedControl(): HTMLElement | null {
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || active === document.body) return null
  return active.closest<HTMLElement>(
    'button, a[href], input, select, textarea, summary, [tabindex]',
  )
}

function runCommand(command: ConsoleCommand): boolean {
  switch (command) {
    case 'prevTab':
      cycleTab(-1)
      return true
    case 'nextTab':
      cycleTab(1)
      return true
    case 'back':
      if (!activePanel.value && !feedMode.value) return false
      goBack()
      return true
    case 'details':
      return runPrompt('Y')
    case 'confirm': {
      const control = focusedControl()
      if (control && gameRoot.value?.contains(control)) {
        control.click()
        return true
      }
      return runPrompt('A')
    }
    case 'up':
    case 'down':
    case 'left':
    case 'right':
      return activePanel.value && roomLayer.value
        ? moveFocus(roomLayer.value, command)
        : false
    default:
      return false
  }
}

const KEY_TO_COMMAND: Record<string, ConsoleCommand> = {
  KeyQ: 'prevTab',
  BracketLeft: 'prevTab',
  PageUp: 'prevTab',
  KeyE: 'nextTab',
  BracketRight: 'nextTab',
  PageDown: 'nextTab',
  Escape: 'back',
  Backspace: 'back',
  KeyY: 'details',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

function onConsoleKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
  if (!gameRoot.value?.isConnected) return
  if (isTextEntry(document.activeElement) || consoleBlocked()) return
  let handled = false
  if (event.code === 'Space') {
    if (focusedControl()) return
    handled = runPrompt('A')
  } else if (event.code === 'KeyX') {
    handled = runPrompt('X')
  } else {
    const command = KEY_TO_COMMAND[event.code]
    if (!command) return
    handled = runCommand(command)
  }
  if (!handled) return
  inputDevice.value = 'keyboard'
  event.preventDefault()
}

function onConsolePointer(event: PointerEvent) {
  inputDevice.value = event.pointerType === 'touch' ? 'touch' : 'keyboard'
}

const padMemory = newPadMemory()
let padFrame = 0
let padXHeld = false
function pollPads(timestamp: number) {
  padFrame = 0
  const pads = navigator.getGamepads?.() ?? []
  let connected = false
  for (const pad of pads) {
    if (!pad) continue
    connected = true
    const commands = readPad(pad, padMemory, timestamp)
    const xDown = !!pad.buttons[2]?.pressed
    const xPressed = xDown && !padXHeld
    padXHeld = xDown
    if (commands.length || xPressed) {
      inputDevice.value = 'gamepad'
      if (!consoleBlocked()) {
        for (const command of commands) runCommand(command)
        if (xPressed) runPrompt('X')
      }
    }
    break
  }
  if (connected) padFrame = window.requestAnimationFrame(pollPads)
}
function onGamepadConnected() {
  inputDevice.value = 'gamepad'
  if (!padFrame) padFrame = window.requestAnimationFrame(pollPads)
}

// Fullscreen is the page's own overlay first (it works on phones without the
// Fullscreen API), with the browser's fullscreen layered on where offered so
// Esc and the system gesture leave both together.
const ERROR_TOAST_MS = 7000
let errorToastTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => tankStore.error,
  (message) => {
    clearTimeout(errorToastTimer)
    if (message)
      errorToastTimer = setTimeout(
        () => tankStore.dismissError(),
        ERROR_TOAST_MS,
      )
  },
)

const fullscreen = ref(false)
async function toggleFullscreen() {
  const next = !fullscreen.value
  fullscreen.value = next
  if (next) {
    await document.documentElement.requestFullscreen?.().catch(() => {})
  } else if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {})
  }
}
function onFullscreenChange() {
  if (!document.fullscreenElement) fullscreen.value = false
}
function onFullscreenKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && fullscreen.value && !document.fullscreenElement)
    fullscreen.value = false
}

function spawnSwimmer(stock: TankStock): Swimmer {
  const state = spawnSwimState(
    stock.Monster.behavior,
    STAGE_WIDTH,
    STAGE_HEIGHT,
    Math.random,
    { solo: isMassSprite(stock.Monster.slug) },
  )
  return {
    ...state,
    stockId: stock.id,
    monsterId: stock.monsterId,
    facing: state.vx >= 0 ? 1 : -1,
    profile: behaviorProfile(stock.Monster.behavior),
  }
}

const ambience = createAmbience(STAGE_WIDTH, STAGE_HEIGHT)
let huntClock = 20

// A dropped coin: a struck disc that turns as it floats, catching the light
// in a travelling glint so it reads as something worth tapping. Common coins
// are gold; rarer fish strike stranger metals.
function coinHue(value: number): number {
  if (value >= 300) return 105
  if (value >= 125) return 350
  if (value >= 50) return 275
  if (value >= 20) return 175
  return 45
}

function coinRadius(value: number): number {
  return 6 + Math.min(6, Math.log2(Math.max(1, value / 3)) * 1.1)
}

function drawCoin(
  context: CanvasRenderingContext2D,
  coin: Coin,
  visibleSeconds: number,
) {
  const remaining = visibleSeconds - coin.age
  const alpha =
    remaining < COIN_FADE_SECONDS
      ? Math.max(0, remaining / COIN_FADE_SECONDS)
      : 1
  if (alpha <= 0) return
  const r = coin.radius
  const turn = Math.abs(Math.cos(coin.spin))
  context.save()
  context.globalAlpha = alpha
  context.translate(coin.x, coin.y)
  context.scale(0.35 + turn * 0.65, 1)
  const face = context.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r)
  face.addColorStop(0, `hsla(${coin.hue}, 90%, 86%, 1)`)
  face.addColorStop(0.6, `hsla(${coin.hue}, 75%, 58%, 1)`)
  face.addColorStop(1, `hsla(${coin.hue}, 70%, 34%, 1)`)
  context.fillStyle = face
  context.beginPath()
  context.arc(0, 0, r, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = `hsla(${coin.hue}, 60%, 22%, 0.9)`
  context.lineWidth = 1.2
  context.stroke()
  context.strokeStyle = `hsla(${coin.hue}, 80%, 88%, 0.7)`
  context.lineWidth = 0.8
  context.beginPath()
  context.arc(0, 0, r * 0.62, 0, Math.PI * 2)
  context.stroke()
  const glint = ((performance.now() / 1000) * 0.9 + coin.spin * 0.13) % 1
  if (glint < 0.2) {
    context.fillStyle = `rgba(255, 255, 255, ${0.95 - glint * 4})`
    context.beginPath()
    context.arc(-r * 0.35, -r * 0.4, r * 0.3, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function drawCoinPop(context: CanvasRenderingContext2D, pop: CoinPop) {
  const t = pop.age / COIN_POP_SECONDS
  context.save()
  context.globalAlpha = Math.max(0, 1 - t)
  context.font = 'bold 15px Georgia, serif'
  context.textAlign = 'center'
  context.lineWidth = 3
  context.strokeStyle = 'rgba(30, 20, 10, 0.85)'
  context.fillStyle = 'rgb(255, 226, 120)'
  const y = pop.y - t * 26
  context.strokeText(pop.text, pop.x, y)
  context.fillText(pop.text, pop.x, y)
  context.restore()
}

// Now and then a predator lunges at something smaller and it bolts. Purely
// visual (utils/cthulhuquariumMotion.ts hunt): nothing is ever eaten.
function stageHunt() {
  const cast = swimmers.value
    .map((swimmer) => ({ swimmer, monster: stockFor(swimmer)?.Monster }))
    .filter((entry) => entry.monster)
  const predators = cast.filter(
    (entry) => entry.monster?.dietRole === 'predator',
  )
  const predator = predators[Math.floor(Math.random() * predators.length)]
  if (!predator?.monster) return
  const predatorSize = predator.monster.size ?? 1
  const prey = cast.filter(
    (entry) =>
      entry.swimmer !== predator.swimmer &&
      (entry.monster?.size ?? 1) < predatorSize,
  )
  const target = prey[Math.floor(Math.random() * prey.length)]
  if (target) hunt(predator.swimmer, target.swimmer)
}
const tankSound = new TankSound()

function onToggleSound() {
  const on = !tankStore.soundOn
  tankStore.setSound(on)
  if (on) tankSound.start()
  else tankSound.stop()
}

// Browsers only allow audio after a gesture: the first tap on the page
// starts the room tone for a player who left it switched on last visit.
function resumeSoundOnGesture() {
  if (tankStore.soundOn && !tankSound.running) tankSound.start()
}
let pointerOnStage: { x: number; y: number } | null = null

/** Keep one drawn swimmer per stocked occupant. */
function syncSwimmers() {
  const want = tankStore.stock.map((entry) => entry.id)
  const have = swimmers.value.map((entry) => entry.stockId)
  for (const entry of tankStore.stock) {
    if (!have.includes(entry.id)) swimmers.value.push(spawnSwimmer(entry))
  }
  swimmers.value = swimmers.value.filter((swimmer) =>
    want.includes(swimmer.stockId),
  )
}

function stockFor(swimmer: Swimmer): TankStock | undefined {
  return tankStore.stock.find((entry) => entry.id === swimmer.stockId)
}

// cthulhuquarium/t-070: real fish art in the swim view. t-065 delivered 119
// of 151 species' plates, but only into the bestiary/catalog/reveal panels
// (see withCthulhuquariumArt) -- the swim canvas kept drawing the hand-drawn
// primitives below regardless, which the audit (t-068's
// FULL-GAME-GAP-AUDIT.md) flagged as the most visible remaining gap. This
// preloads and caches one HTMLImageElement per species slug the first time
// it's needed and draws it in place of the primitives once loaded; a species
// with no plate (32/151, mostly *-common starters) or an image still in
// flight falls back to the original primitive draw, so nothing ever renders
// blank.
const fishImageCache = new Map<string, HTMLImageElement | null>()
const spriteImageCache = new Map<string, HTMLImageElement | null>()

// The cut-out sprite (utils/cthulhuquariumSprites.ts) is what swims; the card
// plate below is only the fallback for a species whose sprite has not been
// rendered yet. Same reserve-then-load caching as getFishImage.
function getSpriteImage(slug: string): HTMLImageElement | null {
  if (spriteImageCache.has(slug)) return spriteImageCache.get(slug) ?? null
  const url = spriteForSpecies(slug)
  spriteImageCache.set(slug, null)
  if (!url) return null
  const image = new Image()
  image.onload = () => spriteImageCache.set(slug, image)
  image.src = url
  return null
}

function getFishImage(slug: string): HTMLImageElement | null {
  if (fishImageCache.has(slug)) return fishImageCache.get(slug) ?? null
  const url = artForSpecies(slug)
  if (!url) {
    fishImageCache.set(slug, null)
    return null
  }
  // Reserve the slot immediately so a swimmer drawn on the next few frames
  // (before onload fires) doesn't kick off a duplicate Image() for the same
  // slug -- the primitive fallback below covers those frames instead.
  fishImageCache.set(slug, null)
  const image = new Image()
  image.onload = () => fishImageCache.set(slug, image)
  image.onerror = () => fishImageCache.set(slug, null)
  image.src = url
  return null
}

function drawSpriteAt(
  context: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  slug: string,
  x: number,
  y: number,
  facing: number,
  pitch: number,
  d: number,
  offset: number,
) {
  context.save()
  context.translate(x, y)
  context.scale(facing, 1)
  context.rotate(pitch)
  drawAnimatedSprite(
    context,
    sprite,
    motionForSpecies(slug),
    performance.now(),
    d,
    d,
    offset,
  )
  context.restore()
}

// cthulhuquarium/t-081: a tank now holds up to 40 fish, so sprites shrink as
// it fills -- full size up to the 12 starting slots, about 60% at 40 -- and a
// crowded tank stays readable instead of a wall of overlapping fish.
const crowdScale = computed(() => {
  const count = swimmers.value.length
  return count <= 12 ? 1 : Math.max(0.6, 1 - (count - 12) * 0.014)
})

function drawFish(
  context: CanvasRenderingContext2D,
  swimmer: Swimmer,
  hunger: number,
  monster: TankStock['Monster'],
  scale = 1,
) {
  const hue = monster.hue ?? hashHue(monster.slug)
  const facing = swimmer.facing
  const size = (10 + (monster.size ?? 1) * 4) * scale * crowdScale.value
  // Hungry occupants desaturate and dim rather than vanishing, so a
  // neglected tank reads as neglected at a glance.
  const life = 0.3 + (hunger / 100) * 0.7
  const sprite = getSpriteImage(monster.slug)
  const image = sprite ? null : getFishImage(monster.slug)

  if (sprite) {
    context.globalAlpha = life
    context.filter = hunger < 100 ? `saturate(${40 + hunger * 0.6}%)` : 'none'
    const d = size * 3
    const pitch = pitchOf(swimmer)
    for (const mate of packmatePositions(swimmer, facing)) {
      drawSpriteAt(
        context,
        sprite,
        monster.slug,
        mate.x,
        mate.y,
        facing,
        pitch,
        d * mate.scale,
        mate.offset,
      )
    }
    drawSpriteAt(
      context,
      sprite,
      monster.slug,
      swimmer.x,
      swimmer.y,
      facing,
      pitch,
      d,
      (swimmer.stockId % 17) / 17,
    )
    context.filter = 'none'
    context.globalAlpha = 1
    return
  }

  context.save()
  context.translate(swimmer.x, swimmer.y)
  context.scale(facing, 1)

  if (image) {
    // Art plates are square, subject-centered portraits -- draw one square,
    // scaled to roughly the same footprint the primitive silhouette used
    // (nose-to-tail span below is about 2.7x `size`). Hunger still dims the
    // occupant via alpha, same signal the primitive draw gives.
    context.globalAlpha = life
    context.filter = hunger < 100 ? `saturate(${40 + hunger * 0.6}%)` : 'none'
    const d = size * 2.6
    context.drawImage(image, -d / 2, -d / 2, d, d)
    context.filter = 'none'
    context.globalAlpha = 1
    context.restore()
    return
  }

  context.fillStyle = `hsla(${hue}, ${28 + hunger * 0.35}%, ${20 + hunger * 0.14}%, ${life})`

  context.beginPath()
  context.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2)
  context.fill()

  context.beginPath()
  context.moveTo(-size, 0)
  context.lineTo(-size - size * 0.7, -size * 0.5)
  context.lineTo(-size - size * 0.7, size * 0.5)
  context.closePath()
  context.fill()

  context.fillStyle = `rgba(240, 250, 245, ${life})`
  context.beginPath()
  context.arc(
    size * 0.45,
    -size * 0.12,
    Math.max(1.6, size * 0.13),
    0,
    Math.PI * 2,
  )
  context.fill()

  if (swimmer.profile.lure) {
    // The angler's lure -- the one light in the tank that is bait.
    context.fillStyle = `rgba(190, 255, 140, ${life})`
    context.beginPath()
    context.arc(size * 1.1, -size * 0.75, 2.6, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

// The water gradient never changes shape (it only spans the fixed stage
// dimensions), so it's built once per context instead of allocated fresh on
// every animation frame -- a full tank redraws this 60x/sec, and a mid-range
// phone shouldn't pay for a gradient rebuild it doesn't need.
let waterGradient: CanvasGradient | null = null
let waterGradientContext: CanvasRenderingContext2D | null = null

// cthulhuquarium/t-049: a simple glyph, same "hand-drawn shapes, not art"
// convention decor icons already use above -- distinct from the painted
// fish shapes and from a plain mote circle, so it reads as its own thing on
// the tank floor rather than another fish or another coin.
function drawCollector(context: CanvasRenderingContext2D, bot: Collector) {
  context.save()
  context.translate(bot.x, bot.y)
  context.globalAlpha = 0.65 + Math.sin(bot.phase * 3) * 0.1
  context.font = '22px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('🤖', 0, 0)
  if (bot.collectFlash > 0) {
    context.globalAlpha = bot.collectFlash * 0.6
    context.strokeStyle = 'rgba(255, 236, 160, 0.9)'
    context.lineWidth = 2
    context.beginPath()
    context.arc(0, 0, 14 + (1 - bot.collectFlash) * 10, 0, Math.PI * 2)
    context.stroke()
  }
  context.restore()
}

function decorTitle(kind: string): string {
  return (
    tankStore.decorCatalog.find((entry) => entry.kind === kind)?.title ?? kind
  )
}

// Radius (canvas-space, at STAGE_WIDTH scale) used to hit-test an existing
// placed decor icon for dragging -- roughly matches the glyph's own drawn
// size (28px font) plus a little slack, same touchHitRadius scaling as
// coins get for their own hit test.
const DECOR_HIT_RADIUS = 20

// Which decor item is mid-drag, if any, and where the pointer currently is
// in stage-space pixels -- render() draws this one at the live pointer
// position instead of its last-saved x/y so the drag reads as the object
// actually moving, not lagging behind until release.
const draggingDecorId = ref<number | null>(null)
const dragPreview = ref<{ x: number; y: number } | null>(null)

function decorStagePos(decor: TankDecor): { x: number; y: number } {
  return { x: (decor.x / 100) * STAGE_WIDTH, y: (decor.y / 100) * STAGE_HEIGHT }
}

function stageCoordsFromEvent(
  event: PointerEvent,
): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const bounds = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * STAGE_WIDTH,
    y: ((event.clientY - bounds.top) / bounds.height) * STAGE_HEIGHT,
  }
}

function hitTestDecor(x: number, y: number): TankDecor | null {
  const bounds = canvasRef.value?.getBoundingClientRect()
  const hitRadius = bounds
    ? touchHitRadius(DECOR_HIT_RADIUS, STAGE_WIDTH, bounds.width)
    : DECOR_HIT_RADIUS
  // Last-placed-on-top: later entries win a tie so the most recently
  // placed item at a spot is the one that starts dragging.
  let found: TankDecor | null = null
  for (const decor of tankStore.placedDecor) {
    const pos = decorStagePos(decor)
    if (Math.hypot(pos.x - x, pos.y - y) <= hitRadius) found = decor
  }
  return found
}

function getWaterGradient(context: CanvasRenderingContext2D): CanvasGradient {
  if (waterGradient && waterGradientContext === context) return waterGradient
  waterGradient = context.createLinearGradient(0, 0, 0, STAGE_HEIGHT)
  // cthulhuquarium/t-065: alpha rather than opaque hex, so the parlour plate
  // drawn underneath reads as a room behind the glass. Kept deep enough that
  // the water still dominates and the procedural occupants stay legible
  // against it -- the room is atmosphere, not the subject.
  // Lightened 2026-09-30 ("real backgrounds"): at 0.82-0.93 the background
  // was a teal wash. Cut-out sprites carry their own contrast, so the room
  // can finally be seen through the water.
  waterGradient.addColorStop(0, 'rgba(13, 43, 42, 0.22)')
  waterGradient.addColorStop(1, 'rgba(4, 16, 15, 0.5)')
  waterGradientContext = context
  return waterGradient
}

// cthulhuquarium/t-039: the finale's "cosmetic reframe" of the tank the
// player already built. Deliberately code-only -- reframe_scope is
// existing_tank_contents, meaning re-render what's already here rather than
// author new content, and this canvas has never drawn a raster image at all
// (every occupant/decor is a procedural shape), so a real asset was never
// the right tool for this specific effect anyway. Drawn LAST, over
// everything else, so "same fish, same set pieces, same room" never has to
// change -- only a vignette (a photograph of the same room, not a new one)
// plus a faint cooler wash (re-lit). Permanent once the purchase lands: this
// function doesn't gate on anything but tankStore.finaleTriggered.
function drawFinaleReframe(context: CanvasRenderingContext2D) {
  const vignette = context.createRadialGradient(
    STAGE_WIDTH / 2,
    STAGE_HEIGHT / 2,
    STAGE_HEIGHT * 0.25,
    STAGE_WIDTH / 2,
    STAGE_HEIGHT / 2,
    STAGE_HEIGHT * 0.78,
  )
  vignette.addColorStop(0, 'rgba(6, 14, 20, 0)')
  vignette.addColorStop(1, 'rgba(4, 10, 14, 0.55)')
  context.fillStyle = vignette
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

  context.fillStyle = 'rgba(70, 110, 140, 0.08)'
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
}

function render(context: CanvasRenderingContext2D) {
  // cthulhuquarium/t-065: the authored parlour plate sits behind the glass, so
  // the tank reads as a room rather than a coloured rectangle. Drawn first and
  // then covered by the water gradient, which is semi-transparent, so the room
  // shows through without competing with the fish. The plate is 1344x768
  // against a 640x360 stage -- both exactly 16:9, so it fills without cropping.
  // Purely decorative: if the image has not decoded yet (or is missing) the
  // gradient below is opaque enough on its own and nothing else changes.
  if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
    if (backgroundCrop) {
      const w = backgroundImage.naturalWidth
      const h = backgroundImage.naturalHeight
      context.drawImage(
        backgroundImage,
        backgroundCrop.x * w,
        backgroundCrop.y * h,
        backgroundCrop.w * w,
        backgroundCrop.h * h,
        0,
        0,
        STAGE_WIDTH,
        STAGE_HEIGHT,
      )
    } else {
      context.drawImage(backgroundImage, 0, 0, STAGE_WIDTH, STAGE_HEIGHT)
    }
  }

  context.fillStyle = getWaterGradient(context)
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

  // Debris shows in the water itself: murk, settled silt, algae on the
  // glass and drifting motes (utils/cthulhuquariumAmbience.ts drawDebris).
  drawDebris(
    context,
    ambience,
    STAGE_WIDTH,
    STAGE_HEIGHT,
    tankStore.tank?.debrisLevel ?? 0,
  )

  drawAmbienceBack(context, ambience, STAGE_WIDTH, STAGE_HEIGHT)

  // Decor (cthulhuquarium/t-017): drawn behind the fish/food layer, in
  // front of the background -- purely cosmetic, no physics, so this is the
  // only place per-frame work happens for it.
  context.font = '28px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  for (const decor of tankStore.placedDecor) {
    const dragging = decor.id === draggingDecorId.value
    const pos =
      dragging && dragPreview.value ? dragPreview.value : decorStagePos(decor)
    context.globalAlpha = dragging ? 0.7 : 1
    context.fillText(decorIcon(decor.kind), pos.x, pos.y)
  }
  context.globalAlpha = 1

  for (const creature of feed.value) {
    context.strokeStyle = 'rgba(226, 196, 148, 0.92)'
    context.lineWidth = 2.4
    context.lineCap = 'round'
    context.beginPath()
    for (let segment = 0; segment <= 3; segment += 1) {
      const bend = Math.sin(creature.phase + segment * 0.9) * 2.6
      const x = creature.x + bend + creature.lean * segment
      const y = creature.y + segment * 2.4
      if (segment === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
  }

  const clingers: Swimmer[] = []
  for (const swimmer of swimmers.value) {
    if (swimmer.mode === 'cling') {
      clingers.push(swimmer)
      continue
    }
    const entry = stockFor(swimmer)
    if (!entry) continue
    drawFish(context, swimmer, entry.hunger, entry.Monster)
  }

  for (const coin of coins) {
    drawCoin(context, coin, tankStore.coinVisibleSeconds)
  }
  for (const pop of coinPops) drawCoinPop(context, pop)

  if (collector.value) drawCollector(context, collector.value)

  drawAmbienceFront(context, ambience, STAGE_WIDTH, STAGE_HEIGHT)

  // Clingers are on the inside of the glass, in front of everything else
  // (fish/SCHEMA.md "cling"): drawn last and a little larger, as the nearest
  // thing to the player's face.
  for (const swimmer of clingers) {
    const entry = stockFor(swimmer)
    if (entry) drawFish(context, swimmer, entry.hunger, entry.Monster, 1.35)
  }

  if (tankStore.finaleTriggered) drawFinaleReframe(context)
}

function step(delta: number) {
  syncSwimmers()

  for (const swimmer of swimmers.value) {
    stepSwimState(swimmer, {
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      delta,
      speedMultiplier: swimSpeedMultiplier.value,
      pointer: pointerOnStage,
      food: nearestFood(swimmer, feed.value),
    })
    swimmer.facing = facingOf(swimmer, swimmer.facing)
  }
  huntClock -= delta
  if (huntClock <= 0) {
    huntClock = 18 + Math.random() * 22
    stageHunt()
  }
  const popped = stepAmbience(ambience, STAGE_WIDTH, STAGE_HEIGHT, delta)
  if (popped > 0 && Math.random() < 0.35) tankSound.plink()

  feed.value = feed.value.filter((creature) => {
    creature.y += FOOD_FALL_SPEED * delta
    creature.phase += delta * 9
    creature.x += Math.sin(creature.phase * 0.7) * 6 * delta
    const eaten = swimmers.value.some(
      (swimmer) =>
        Math.hypot(swimmer.x - creature.x, swimmer.y - creature.y) < 14,
    )
    return !eaten && creature.y < STAGE_HEIGHT - 8
  })

  stepCoins(delta)

  stepCollector(delta)
}

function stepCollector(delta: number) {
  if (!roamingCollectorEquipped.value) {
    collector.value = null
    return
  }
  if (!collector.value) {
    collector.value = {
      x: Math.random() * STAGE_WIDTH,
      y: STAGE_HEIGHT * (0.55 + Math.random() * 0.3),
      vx: (Math.random() < 0.5 ? -1 : 1) * COLLECTOR_SPEED,
      vy: (Math.random() < 0.5 ? -1 : 1) * (COLLECTOR_SPEED * 0.4),
      phase: Math.random() * Math.PI * 2,
      collectFlash: 0,
    }
  }
  const bot = collector.value
  bot.phase += delta
  bot.x += bot.vx * delta
  bot.y += bot.vy * delta
  if (bot.x < 24 || bot.x > STAGE_WIDTH - 24) bot.vx *= -1
  if (bot.y < STAGE_HEIGHT * 0.4 || bot.y > STAGE_HEIGHT - 24) bot.vy *= -1
  bot.collectFlash = Math.max(0, bot.collectFlash - delta * 2)
}

function loop(timestamp: number) {
  const context = canvasRef.value?.getContext('2d')
  if (!context) return
  context.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0)
  // Clamp the delta so a backgrounded tab returning does not simulate one
  // giant step -- coins/hunger are settled server-side, not by this loop.
  const delta = Math.min((timestamp - lastFrameAt) / 1000 || 0, 0.1)
  lastFrameAt = timestamp
  step(delta)
  render(context)
  frame = window.requestAnimationFrame(loop)
}

// Every fed fish runs its own coin timer (t-080). A new fish starts at a
// random point in its cycle so a freshly stocked tank doesn't rain coins in
// lockstep; a starving fish (hunger 0) holds its timer and drops nothing.
function stepCoins(delta: number) {
  const interval = tankStore.coinDropSeconds
  const visible = tankStore.coinVisibleSeconds
  const present = new Set<number>()
  if (interval > 0) {
    for (const swimmer of swimmers.value) {
      present.add(swimmer.stockId)
      const entry = stockFor(swimmer)
      if (!entry || entry.hunger <= 0 || !(entry.coinValue > 0)) continue
      let timer = coinTimers.get(swimmer.stockId)
      if (timer === undefined) timer = 0.4 + Math.random() * interval
      timer -= delta
      if (timer <= 0) {
        spawnCoin(swimmer, entry.coinValue)
        timer += interval
      }
      coinTimers.set(swimmer.stockId, timer)
    }
  }
  for (const id of coinTimers.keys()) {
    if (!present.has(id)) coinTimers.delete(id)
  }

  for (const coin of coins) {
    coin.age += delta
    // Treasure hangs in the water column instead of collecting in a
    // hard-to-tap row along the bottom edge. Keep motion subtle so coins
    // remain easy targets on touchscreens.
    coin.y = Math.max(
      20,
      Math.min(
        COIN_REST_Y - 20,
        coin.y +
          Math.sin(coin.age * 1.8 + coin.spin) * COIN_DRIFT_SPEED * delta,
      ),
    )
    coin.spin += delta * 2
    coin.x = Math.min(
      STAGE_WIDTH - 14,
      Math.max(14, coin.x + coin.drift * delta),
    )
  }
  if (visible > 0) {
    coins = coins.filter((coin) => coin.age < visible)
  }

  for (const pop of coinPops) pop.age += delta
  coinPops = coinPops.filter((pop) => pop.age < COIN_POP_SECONDS)
}

function spawnCoin(swimmer: Swimmer, value: number) {
  coins.push({
    x: swimmer.x,
    y: Math.max(24, Math.min(swimmer.y + 6, COIN_REST_Y - 24)),
    drift: (Math.random() - 0.5) * 12,
    value,
    radius: coinRadius(value),
    hue: coinHue(value),
    age: 0,
    spin: Math.random() * Math.PI * 2,
  })
  if (coins.length > COIN_MAX_ON_SCREEN) {
    coins.splice(0, coins.length - COIN_MAX_ON_SCREEN)
  }
}

// cthulhuquarium/t-017: the canvas now handles three distinct gestures
// through pointer events (unifying mouse+touch, unlike the old click-only
// handler) --
//   1. a shop item is pending placement: any tap purchases and places it
//      here, then clears the pending choice (see the placement banner).
//   2. the tap lands on an already-placed decor icon: start a drag, tracked
//      through pointermove and committed on pointerup via moveDecor.
//   3. neither of the above: collect a tapped coin (t-080).
function onCanvasPointerDown(event: PointerEvent) {
  const coords = stageCoordsFromEvent(event)
  if (!coords) return

  if (tankStore.pendingDecorKind) {
    const kind = tankStore.pendingDecorKind
    const x = Math.min(100, Math.max(0, (coords.x / STAGE_WIDTH) * 100))
    const y = Math.min(100, Math.max(0, (coords.y / STAGE_HEIGHT) * 100))
    void tankStore.purchaseDecor(kind, x, y)
    return
  }

  let scattered = false
  for (const swimmer of feedMode.value ? [] : swimmers.value) {
    if (startle(swimmer, coords.x, coords.y)) scattered = true
  }
  if (scattered) {
    tankSound.knock()
    tankStore.sayBark('startle', 0.25)
  }

  const hitDecor = feedMode.value ? null : hitTestDecor(coords.x, coords.y)
  if (hitDecor) {
    draggingDecorId.value = hitDecor.id
    dragPreview.value = coords
    canvasRef.value?.setPointerCapture(event.pointerId)
    return
  }

  // The canvas is scaled by CSS to fit the host panel, so its display width
  // can be well under STAGE_WIDTH on a phone -- a fixed canvas-space hit
  // radius would then cover only a few real screen pixels. Grow the hit
  // radius (never the drawn dot) so the actual tap target stays thumb-sized
  // regardless of viewport width.
  const bounds = canvasRef.value?.getBoundingClientRect()
  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY
  for (const [index, coin] of coins.entries()) {
    const hitRadius = touchHitRadius(
      coin.radius + 8,
      STAGE_WIDTH,
      bounds?.width ?? STAGE_WIDTH,
    )
    const distance = Math.hypot(coin.x - coords.x, coin.y - coords.y)
    if (distance <= hitRadius && distance < bestDistance) {
      bestIndex = index
      bestDistance = distance
    }
  }
  if (bestIndex !== -1) {
    const [coin] = coins.splice(bestIndex, 1)
    if (coin) {
      tankStore.requestCollect(coin.value)
      coinPops.push({
        x: coin.x,
        y: coin.y - coin.radius,
        text: `+${coin.value}`,
        age: 0,
      })
      tankSound.chime()
    }
    return
  }
  if (feedMode.value) feedNearest(coords)
}

// Feed mode (cthulhuquarium/t-098): a tap that lands on no coin feeds the
// creature nearest to it. The server decides what was eaten, as with Feed.
function feedNearest(coords: { x: number; y: number }) {
  let nearest: Swimmer | null = null
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const swimmer of swimmers.value) {
    const distance = Math.hypot(swimmer.x - coords.x, swimmer.y - coords.y)
    if (distance < nearestDistance) {
      nearest = swimmer
      nearestDistance = distance
    }
  }
  if (nearest) void feedOne(nearest.stockId)
}

function onCanvasPointerLeave() {
  pointerOnStage = null
}

function onCanvasPointerMove(event: PointerEvent) {
  const coords = stageCoordsFromEvent(event)
  pointerOnStage = coords
  if (draggingDecorId.value === null) return
  if (!coords) return
  dragPreview.value = {
    x: Math.min(Math.max(coords.x, 0), STAGE_WIDTH),
    y: Math.min(Math.max(coords.y, 0), STAGE_HEIGHT),
  }
}

async function onCanvasPointerUp(event: PointerEvent) {
  if (draggingDecorId.value === null) return
  const id = draggingDecorId.value
  const preview = dragPreview.value
  draggingDecorId.value = null
  dragPreview.value = null
  if (canvasRef.value?.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId)
  }
  if (!preview) return
  const x = (preview.x / STAGE_WIDTH) * 100
  const y = (preview.y / STAGE_HEIGHT) * 100
  await tankStore.moveDecor(id, x, y)
}

// cthulhuquarium/t-083: one tap feeds every hungry fish (tankStore.feedHungry);
// food now scatters near fed fish, with a bounded particle budget.
const feeding = ref(false)
async function onFeed() {
  if (feeding.value) return
  feeding.value = true
  try {
    const fed = await tankStore.feedHungry()
    if (!fed.length) return
    tankSound.plop()
    tankStore.sayBark('fed', 0.5)
    // Each successfully fed stock contributes to an animated scatter.
    // The server decides who ate; this never changes hunger or rewards.
    const drops = makeFeedParticles(
      fed,
      swimmers.value,
      STAGE_WIDTH,
      STAGE_HEIGHT,
    )
    feed.value = [...feed.value, ...drops].slice(-MAX_VISIBLE_FOOD)
  } finally {
    feeding.value = false
  }
}

async function feedOne(stockId: number) {
  if (feeding.value) return
  feeding.value = true
  try {
    if (!(await tankStore.feed(stockId))) return
    tankSound.plop()
    tankStore.sayBark('fed', 0.5)
    const drops = makeFeedParticles(
      [stockId, stockId, stockId],
      swimmers.value,
      STAGE_WIDTH,
      STAGE_HEIGHT,
    )
    feed.value = [...feed.value, ...drops].slice(-MAX_VISIBLE_FOOD)
  } finally {
    feeding.value = false
  }
}

function feedHungriest() {
  const target = tankStore.hungriest
  if (target) void feedOne(target.id)
}

function onClean() {
  tankStore.requestClean()
  tankStore.sayBark('cleaned', 0.3)
}

async function pollTick() {
  await tankStore.settleTick()
  const hungriest = tankStore.hungriest
  if (hungriest && hungriest.hunger < 30) tankStore.sayBark('hungry', 0.3)
  else tankStore.sayBark('idle', 0.08)
  // cthulhuquarium/t-057: keeps shopRefreshLabel's countdown live without a
  // second timer -- see `now`'s own comment.
  now.value = Date.now()
}

async function onToggleVisibility(event: Event): Promise<void> {
  const next = (event.target as HTMLInputElement).checked
  visibilitySaving.value = true
  try {
    await tankStore.setVisibility(next)
  } finally {
    visibilitySaving.value = false
  }
}

// cthulhuquarium/t-048: both loops pause on a hidden tab and resume cleanly
// on foreground. Browsers already throttle background-tab timers/rAF on
// their own, so this isn't a functional fix -- it's the difference between
// "the browser happens to slow this down" and "this app declares it has
// nothing to do while hidden," which matters more once/if this ever runs
// inside a native wrapper (t-021's mobile-packaging audit). `loop`'s own
// delta clamp already means a stale `lastFrameAt` after a long hidden gap
// can't simulate a giant step, but resetting it on resume (same pattern as
// the initial kick-off below) keeps the very first frame back honest too.
function startLoops() {
  // cthulhuquarium/t-057: refresh immediately on resume rather than leaving
  // shopRefreshLabel showing however stale `now` was when the tab hid --
  // matches lastFrameAt's own "keep the first beat back honest" reasoning.
  now.value = Date.now()
  if (pollTimer === null) {
    pollTimer = setInterval(pollTick, TANK_POLL_INTERVAL_MS)
  }
  if (frame === 0) {
    frame = window.requestAnimationFrame((timestamp) => {
      lastFrameAt = timestamp
      frame = window.requestAnimationFrame(loop)
    })
  }
}

function stopLoops() {
  if (frame) {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopLoops()
  } else {
    startLoops()
  }
}

onMounted(async () => {
  await tankStore.load()
  await tankStore.loadCatalog()
  // cthulhuquarium/t-039: loaded eagerly, not lazily behind a panel toggle
  // like sets/decor/bestiary -- the shop row's disabled/owned state and the
  // canvas reframe below both need finaleTriggered as soon as the tank does.
  void tankStore.loadFinaleStatus()
  syncSwimmers()
  if (!document.hidden) startLoops()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  document.addEventListener('pointerdown', resumeSoundOnGesture)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('keydown', onFullscreenKey)
  document.addEventListener('keydown', onConsoleKey)
  document.addEventListener('pointerdown', onConsolePointer)
  window.addEventListener('gamepadconnected', onGamepadConnected)
  if (window.matchMedia?.('(pointer: coarse)').matches)
    inputDevice.value = 'touch'
  if ([...(navigator.getGamepads?.() ?? [])].some(Boolean)) onGamepadConnected()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('pointerdown', resumeSoundOnGesture)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('keydown', onFullscreenKey)
  document.removeEventListener('keydown', onConsoleKey)
  document.removeEventListener('pointerdown', onConsolePointer)
  window.removeEventListener('gamepadconnected', onGamepadConnected)
  if (padFrame) window.cancelAnimationFrame(padFrame)
  clearTimeout(errorToastTimer)
  if (fullscreen.value && document.fullscreenElement)
    void document.exitFullscreen().catch(() => {})
  stopLoops()
  // A click right before navigating away should still land instead of
  // being dropped along with the debounce timer.
  tankStore.flushCleanNow()
  tankStore.flushCollectNow()
  tankSound.dispose()
})
</script>

<style scoped>
.cq-game {
  container: cq-game / inline-size;
}
/* The route's kr-stage already owns viewport height. Do not establish a
   second viewport-height calculation inside the game's nested surface. */
.cq-game:not(.cq-fullscreen) {
  flex: 1 1 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

/* The console: a blackened-iron bezel with gilt beading, the tank as its one
   stage, the command deck along the bottom (cthulhuquarium/t-098). */
.cq-layout {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'top' 'tank' 'deck';
  gap: 0.45rem;
  padding: 0.5rem clamp(0.45rem, 1.4cqi, 1.1rem) 0.4rem;
  border: 3px solid var(--cq-brass-lo);
  border-radius: 1.1rem;
  background:
    radial-gradient(
      ellipse at 50% -20%,
      rgb(240 178 90 / 0.1),
      transparent 55%
    ),
    radial-gradient(
      ellipse at 50% 120%,
      rgb(95 168 146 / 0.1),
      transparent 50%
    ),
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.012) 0 2px,
      transparent 2px 7px
    ),
    linear-gradient(180deg, #1a1f20 0%, #101415 55%, #0a0d0e 100%);
  box-shadow:
    inset 0 0 0 1px var(--cq-brass),
    inset 0 0 0 5px #0a0d0e,
    inset 0 0 0 6px rgb(196 154 82 / 0.32),
    inset 0 2px 24px rgb(0 0 0 / 0.8);
}
.cq-corner {
  position: absolute;
  z-index: 33;
  width: clamp(2.4rem, 5.5cqi, 4.6rem);
  height: clamp(2.4rem, 5.5cqi, 4.6rem);
  pointer-events: none;
}
.cq-corner > * {
  height: 100%;
  width: 100%;
}
.cq-corner-tl {
  top: -3px;
  left: -3px;
}
.cq-corner-tr {
  top: -3px;
  right: -3px;
  transform: scaleX(-1);
}
.cq-corner-bl {
  bottom: -3px;
  left: -3px;
  transform: scaleY(-1);
}
.cq-corner-br {
  right: -3px;
  bottom: -3px;
  transform: scale(-1, -1);
}

/* Top band: the title cartouche and the HUD capsules. */
.cq-topbar {
  grid-area: top;
  position: relative;
  z-index: 34;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.4rem 0 clamp(1rem, 3cqi, 2.4rem);
}
.cq-cartouche {
  position: relative;
  display: inline-flex;
  height: 2.6rem;
  flex-shrink: 0;
  align-items: center;
  padding: 0 1.7rem 0 2rem;
}
.cq-cartouche-frame {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
}
.cq-cartouche-curl {
  position: absolute;
  top: -0.55rem;
  left: -0.85rem;
  height: 2.1rem;
  width: 2.1rem;
}
.cq-wordmark {
  position: relative;
  background: linear-gradient(180deg, #f8ecc9 0%, #e2c27c 55%, #a97f3a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-family: var(--cq-serif);
  font-size: clamp(1.05rem, 1.7cqi, 1.5rem);
  font-variant: small-caps;
  font-weight: 700;
  letter-spacing: 0.07em;
  filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.9));
  white-space: nowrap;
}
.cq-capsules {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
}
.cq-capsule,
.cq-hud-button {
  display: inline-flex;
  height: 2.3rem;
  flex-shrink: 0;
  align-items: center;
  border: 1px solid var(--cq-brass);
  border-radius: 999px;
  background: linear-gradient(180deg, #1c2325 0%, #0c1113 100%);
  box-shadow:
    inset 0 0 0 2px #0a0d0e,
    inset 0 0 0 3px rgb(196 154 82 / 0.28),
    0 3px 8px rgb(0 0 0 / 0.5);
  color: var(--cq-bone);
}
.cq-capsule {
  gap: 0.45rem;
  padding: 0 0.95rem 0 0.3rem;
  font-family: var(--cq-sans);
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
}
.cq-capsule-icon {
  height: 1.7rem;
  width: 1.7rem;
}
.cq-capsule-coins {
  color: #f3d58e;
  font-size: 1.05rem;
}
.cq-capsule-time {
  margin-left: 0.1rem;
  padding-left: 0.55rem;
  border-left: 1px solid rgb(196 154 82 / 0.45);
  font-weight: 600;
  opacity: 0.85;
}
.cq-hud-button {
  width: 2.3rem;
  justify-content: center;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}
.cq-hud-button:hover,
.cq-hud-button[aria-pressed='true'] {
  border-color: var(--cq-seaglass);
  color: var(--cq-seaglass);
}

/* The tank: the glass hugs the 16:9 canvas inside whatever room the bezel
   leaves, with the chosen backdrop dimmed behind it. */
.cq-tank {
  grid-area: tank;
  position: relative;
  min-height: 0;
  overflow: hidden;
  border-radius: 1.3rem;
  background: #061013;
  box-shadow:
    0 0 0 2px #0a0d0e,
    0 0 0 3px var(--cq-brass-lo),
    0 0 0 4px rgb(196 154 82 / 0.45),
    inset 0 0 32px rgb(0 0 0 / 0.85);
}
.cq-tank-backdrop {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  filter: blur(16px) brightness(0.32) saturate(0.8);
  transform: scale(1.12);
}
.cq-glass-well {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  container-type: size;
}
.cq-glass {
  position: relative;
  width: min(100cqw, calc(100cqh * 16 / 9));
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 1.2rem;
  box-shadow:
    0 0 0 1px rgb(143 230 212 / 0.35),
    0 0 26px rgb(143 230 212 / 0.12);
}
.cq-glass canvas {
  height: 100%;
  width: 100%;
}
.cq-glass-sheen {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: inherit;
  background:
    linear-gradient(
      112deg,
      rgb(255 255 255 / 0.09) 0%,
      transparent 26%,
      transparent 74%,
      rgb(255 255 255 / 0.04) 100%
    ),
    radial-gradient(ellipse at center, transparent 60%, rgb(0 0 0 / 0.5) 100%);
  box-shadow:
    inset 0 0 0 2px rgb(143 230 212 / 0.22),
    inset 0 0 44px rgb(0 18 22 / 0.6);
}
.cq-feeding .cq-glass {
  box-shadow:
    0 0 0 1px rgb(240 178 90 / 0.55),
    0 0 30px rgb(240 178 90 / 0.18);
}
.cq-feeding .cq-glass canvas {
  cursor: copy;
}

/* Care meters, stacked top-left on the water. The well is the size container,
   so the glass's own box is min(100cqw, 100cqh * 16/9) wide, centred. */
.cq-meters {
  position: absolute;
  z-index: 5;
  top: calc((100cqh - min(100cqh, 100cqw * 9 / 16)) / 2 + 2.5cqmin);
  left: calc((100cqw - min(100cqw, 100cqh * 16 / 9)) / 2 + 1.6cqmin);
  display: flex;
  width: clamp(9.5rem, calc(min(100cqw, 100cqh * 16 / 9) * 0.21), 15rem);
  flex-direction: column;
  gap: 0.4rem;
}
.cq-meter {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 0.5rem;
  row-gap: 0.2rem;
  padding: 0.3rem 0.75rem 0.4rem 0.3rem;
  border: 1px solid rgb(196 154 82 / 0.55);
  border-radius: 999px;
  background: var(--cq-smoke);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 4px 12px rgb(0 0 0 / 0.35);
  backdrop-filter: blur(6px);
  color: var(--cq-bone);
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.cq-meter:hover:not(:disabled) {
  border-color: var(--cq-brass);
}
.cq-meter:disabled {
  cursor: default;
}
.cq-meter-icon {
  grid-row: 1 / span 2;
  height: 2.1rem;
  width: 2.1rem;
  padding: 0.2rem;
  border: 1px solid var(--cq-brass);
  border-radius: 999px;
  background: radial-gradient(circle at 40% 35%, #263434, #0b1214);
}
.cq-meter-label {
  font-family: var(--cq-serif);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1;
}
.cq-meter-value {
  justify-self: end;
  font-family: var(--cq-sans);
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1;
}
.cq-meter-bar {
  grid-column: 2 / span 2;
  display: block;
  height: 0.36rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.55);
  box-shadow: inset 0 0 0 1px rgb(196 154 82 / 0.22);
}
.cq-meter-bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #3f8f7c, var(--cq-seaglass));
  transition: width 0.4s ease;
}
.cq-meter-low .cq-meter-bar > span {
  background: linear-gradient(90deg, var(--cq-oxblood), var(--cq-amber));
}
.cq-meter-lit {
  border-color: var(--cq-amber);
  box-shadow:
    0 0 0 1px rgb(240 178 90 / 0.7),
    0 0 18px rgb(240 178 90 / 0.3);
}

.cq-feed-banner {
  position: absolute;
  z-index: 5;
  bottom: calc((100cqh - min(100cqh, 100cqw * 9 / 16)) / 2 + 3cqmin);
  left: 50%;
  display: flex;
  max-width: 92%;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 1.3rem 0.3rem 0.4rem;
  border: 1px solid var(--cq-brass);
  border-radius: 999px;
  background: var(--cq-smoke);
  box-shadow:
    inset 0 0 0 3px rgb(8 14 16 / 0.6),
    inset 0 0 0 4px rgb(196 154 82 / 0.25),
    0 6px 16px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(6px);
  color: var(--cq-bone);
  font-family: var(--cq-serif);
  font-size: clamp(0.82rem, 1.3cqi, 1.05rem);
  transform: translateX(-50%);
  white-space: nowrap;
}
.cq-feed-banner-icon {
  height: 2.3rem;
  width: 2.3rem;
}

.cq-notices {
  position: absolute;
  z-index: 8;
  top: 0.6rem;
  left: 50%;
  display: flex;
  width: min(32rem, calc(100% - 1.2rem));
  flex-direction: column;
  gap: 0.4rem;
  pointer-events: none;
  transform: translateX(-50%);
}
.cq-notice {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.4rem 0.35rem 0.85rem;
  border: 1px solid rgb(196 154 82 / 0.6);
  border-radius: 0.9rem;
  background: var(--cq-smoke);
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(8px);
  color: var(--cq-bone);
  font-size: 0.85rem;
  pointer-events: auto;
}
.cq-notice-milestone {
  border-color: var(--cq-amber);
}
.cq-notice-place {
  border-color: var(--cq-seaglass);
}
.cq-notice-close {
  display: grid;
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
}
.cq-notice-close:hover {
  color: var(--cq-seaglass);
}

.cq-tank-bark {
  position: absolute;
  z-index: 6;
  right: 1rem;
  bottom: 0.9rem;
  max-width: min(28rem, calc(100% - 2rem));
}
.cq-tank-bark-top {
  top: 0.9rem;
  bottom: auto;
}
.cq-tank-caption {
  position: absolute;
  z-index: 4;
  right: 0;
  bottom: 22%;
  left: 0;
  color: rgb(233 223 200 / 0.85);
  font-family: var(--cq-serif);
  font-size: 1rem;
  font-style: italic;
  text-align: center;
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.9);
}

/* Rooms open inside the bezel, over the tank, never over the deck. */
.cq-room-layer {
  grid-area: tank;
  position: relative;
  z-index: 20;
  min-height: 0;
  overflow: hidden;
  border-radius: 1.3rem;
  pointer-events: none;
}
.cq-room-open {
  pointer-events: auto;
}
.cq-room-shade {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: rgb(4 10 12 / 0.78);
  cursor: default;
}
.cq-room-backdrop {
  z-index: 2;
  inset: 0;
  height: 100%;
  width: 100%;
  filter: brightness(0.34) saturate(0.8);
}
.cq-room-backdrop-scene {
  filter: brightness(0.62) saturate(0.95);
}
.cq-room-heading {
  position: absolute;
  z-index: 9;
  top: 0.45rem;
  right: 0.45rem;
}
.cq-room-title {
  position: absolute;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.cq-room-close {
  display: grid;
  height: 2.75rem;
  width: 2.75rem;
  place-items: center;
  border: 1px solid var(--cq-brass);
  border-radius: 999px;
  background: rgb(8 14 16 / 0.9);
  box-shadow: 0 4px 10px rgb(0 0 0 / 0.5);
  color: var(--cq-bone);
}
.cq-room-close:hover {
  border-color: var(--cq-seaglass);
  color: var(--cq-seaglass);
}
.cq-side,
.cq-roster,
.cq-support-panel {
  position: absolute;
  z-index: 4;
  inset: 0;
  display: flex;
  width: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  padding: 0.6rem clamp(0.5rem, 1.6cqi, 1.2rem) 0.6rem;
  container: cq-room / size;
}
.cq-scenery {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-top: 0.8rem;
  padding-right: 3.6rem;
}
.cq-scenery-replay {
  align-self: flex-start;
}

/* The command deck: five lacquered plaques with their icons standing proud,
   shoulder hints at each end, and the button prompts beneath. */
.cq-controller {
  grid-area: deck;
  position: relative;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.cq-command-deck {
  display: grid;
  grid-template-columns: auto repeat(5, minmax(0, 1fr)) auto;
  align-items: end;
  gap: clamp(0.3rem, 1.1cqi, 0.9rem);
  padding: clamp(0.9rem, 2cqi, 1.5rem) clamp(0rem, 5cqi, 6rem) 0;
}
.cq-deck-button {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
  padding: 0 0.3rem 0.4rem;
  border: 2px solid var(--cq-brass-lo);
  border-radius: 0.8rem;
  background: linear-gradient(180deg, #2b2622 0%, #15110e 100%);
  box-shadow:
    inset 0 0 0 1px rgb(236 208 142 / 0.32),
    inset 0 -8px 14px rgb(0 0 0 / 0.55),
    0 6px 14px rgb(0 0 0 / 0.55);
  color: var(--cq-bone);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
}
.cq-deck-icon {
  height: clamp(2.6rem, 5.4cqi, 4.4rem);
  width: clamp(2.6rem, 5.4cqi, 4.4rem);
  margin-top: calc(clamp(2.6rem, 5.4cqi, 4.4rem) * -0.42);
  filter: drop-shadow(0 4px 5px rgb(0 0 0 / 0.65));
  transition: transform 0.2s ease;
}
.cq-deck-label {
  overflow: hidden;
  max-width: 100%;
  font-family: var(--cq-serif);
  font-size: clamp(0.78rem, 1.45cqi, 1.2rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.15;
  text-overflow: ellipsis;
  text-shadow: 0 1px 0 #000;
  white-space: nowrap;
}
.cq-deck-button:hover {
  border-color: var(--cq-brass);
  transform: translateY(-1px);
}
.cq-deck-button:hover .cq-deck-icon {
  transform: translateY(-2px);
}
.cq-deck-on {
  border-color: var(--cq-seaglass);
  background: linear-gradient(180deg, #163a3a 0%, #0b1c1e 100%);
  box-shadow:
    inset 0 0 0 1px rgb(182 239 226 / 0.55),
    0 0 0 1px rgb(143 230 212 / 0.5),
    0 0 22px rgb(143 230 212 / 0.32),
    0 6px 14px rgb(0 0 0 / 0.55);
}
.cq-deck-on .cq-deck-label {
  color: #e4fbf6;
}
.cq-deck-badge {
  position: absolute;
  top: 0.3rem;
  right: 0.35rem;
  display: grid;
  height: 1.3rem;
  min-width: 1.3rem;
  place-items: center;
  padding: 0 0.3rem;
  border: 1px solid var(--cq-amber);
  border-radius: 999px;
  background: var(--cq-oxblood);
  color: #f8e9c9;
  font-family: var(--cq-sans);
  font-size: 0.7rem;
  font-weight: 800;
}
.cq-shoulder {
  display: inline-flex;
  height: 2.3rem;
  align-items: center;
  align-self: center;
  gap: 0.1rem;
  padding: 0 0.5rem;
  border: 1px solid var(--cq-brass);
  border-radius: 0.55rem;
  background: linear-gradient(180deg, #2b3133 0%, #111618 100%);
  box-shadow: inset 0 1px 0 rgb(236 208 142 / 0.2);
  color: var(--cq-bone);
  font-family: var(--cq-sans);
  font-size: 0.85rem;
  font-weight: 800;
}
.cq-shoulder:hover {
  border-color: var(--cq-seaglass);
}
.cq-prompts {
  display: flex;
  min-height: 2rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.2rem 1.1rem;
  padding: 0 clamp(0.4rem, 4cqi, 3rem);
}
.cq-prompt {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  color: var(--cq-bone);
  font-family: var(--cq-serif);
  font-size: 0.92rem;
  white-space: nowrap;
}
.cq-prompt:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.cq-prompt-hint {
  opacity: 0.7;
}
.cq-prompt-glyph {
  display: inline-grid;
  height: 1.6rem;
  min-width: 1.6rem;
  place-items: center;
  padding: 0 0.35rem;
  border: 1.5px solid rgb(233 223 200 / 0.75);
  border-radius: 999px;
  background: rgb(8 14 16 / 0.85);
  font-family: var(--cq-sans);
  font-size: 0.72rem;
  font-weight: 800;
}
.cq-game[data-input='keyboard'] .cq-prompt-glyph {
  border-radius: 0.35rem;
  box-shadow: inset 0 -2px 0 rgb(233 223 200 / 0.3);
}
.cq-prompt:hover:not(:disabled) .cq-prompt-glyph {
  border-color: var(--cq-seaglass);
  color: var(--cq-seaglass);
}

@container cq-game (max-width: 760px) {
  .cq-capsule-time,
  .cq-cartouche-curl {
    display: none;
  }
}
@container cq-game (max-width: 640px) {
  .cq-layout {
    gap: 0.35rem;
    padding: 0.4rem 0.4rem 0.3rem;
    border-radius: 0.8rem;
  }
  .cq-topbar {
    padding: 0 0.15rem;
  }
  .cq-cartouche {
    display: none;
  }
  .cq-capsules {
    flex: 1 1 auto;
    justify-content: space-between;
    gap: 0.25rem;
  }
  .cq-capsule {
    height: 2.1rem;
    gap: 0.25rem;
    padding: 0 0.6rem 0 0.2rem;
    font-size: 0.8rem;
  }
  .cq-capsule-coins {
    font-size: 0.88rem;
  }
  .cq-capsule-icon {
    height: 1.4rem;
    width: 1.4rem;
  }
  .cq-hud-button {
    height: 2.1rem;
    width: 2.1rem;
  }
  .cq-hud-button:first-of-type {
    display: none;
  }
  .cq-tank {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.5rem 0;
    border-radius: 0.9rem;
  }
  .cq-tank-backdrop {
    filter: blur(3px) brightness(0.45) saturate(0.85);
    transform: scale(1.04);
  }
  .cq-glass-well {
    position: relative;
    inset: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
    container-type: normal;
    padding: 0 0.35rem;
  }
  .cq-glass {
    width: 100%;
    border-radius: 0.8rem;
    box-shadow:
      0 0 0 2px #0a0d0e,
      0 0 0 3px var(--cq-brass-lo),
      0 0 0 4px rgb(196 154 82 / 0.5),
      0 14px 30px rgb(0 0 0 / 0.6);
  }
  .cq-meters {
    position: relative;
    top: auto;
    left: auto;
    width: auto;
    flex-direction: row;
    order: -1;
  }
  .cq-meter {
    flex: 1 1 0;
    min-width: 0;
    column-gap: 0.3rem;
    padding: 0.2rem 0.55rem 0.25rem 0.2rem;
  }
  .cq-meter-icon {
    height: 1.9rem;
    width: 1.9rem;
  }
  .cq-meter-label {
    font-size: 0.82rem;
  }
  .cq-meter-value {
    font-size: 0.78rem;
  }
  .cq-feed-banner {
    position: relative;
    bottom: auto;
    left: auto;
    align-self: center;
    padding: 0.2rem 0.9rem 0.2rem 0.25rem;
    font-size: 0.78rem;
    transform: none;
    white-space: normal;
  }
  .cq-feed-banner-icon {
    height: 1.6rem;
    width: 1.6rem;
  }
  .cq-tank-bark,
  .cq-tank-bark-top {
    position: relative;
    inset: auto;
    max-width: none;
    margin: 0 0.4rem;
  }
  .cq-room-layer {
    border-radius: 0.9rem;
  }
  .cq-command-deck {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.25rem;
    padding: 0.85rem 0 0;
  }
  .cq-shoulder {
    display: none;
  }
  .cq-deck-button {
    padding: 0 0.1rem 0.3rem;
    border-radius: 0.6rem;
  }
  .cq-deck-icon {
    height: 2.4rem;
    width: 2.4rem;
    margin-top: -1rem;
  }
  .cq-deck-label {
    font-size: 0.68rem;
  }
  .cq-prompts {
    justify-content: center;
    gap: 0 0.6rem;
    padding: 0;
  }
  .cq-prompt {
    min-height: 2.75rem;
    font-size: 0.78rem;
  }
  .cq-prompt-glyph {
    height: 1.35rem;
    min-width: 1.35rem;
    font-size: 0.65rem;
  }
}

.cq-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 60;
  max-width: none;
  margin: 0;
  overflow: hidden;
  background: #070b0c;
}
.cq-focus {
  outline: 3px solid var(--cq-seaglass);
  outline-offset: 3px;
  animation: cq-focus-pulse 1.4s ease-in-out infinite;
}
@keyframes cq-focus-pulse {
  50% {
    outline-offset: 6px;
    outline-color: transparent;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cq-focus {
    animation: none;
  }
  .cq-deck-button,
  .cq-deck-icon,
  .cq-meter-bar > span {
    transition: none;
  }
}
</style>

<style src="../../assets/css/cthulhuquarium-console.css"></style>
