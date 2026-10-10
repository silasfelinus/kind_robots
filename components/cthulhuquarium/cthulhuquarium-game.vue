<!-- components/cthulhuquarium/cthulhuquarium-game.vue
     The real Cthulhuquarium play loop (conductor cthulhuquarium/t-011),
     replacing the t-010 localStorage prototype. Coins, hunger, and species
     ownership are the server's Aquarium/AquariumStock rows
     (server/api/aquarium/**) -- this component never invents an economy
     number, it only renders what the store last loaded and asks the store
     to feed/unlock/settle.

     Coin drops (cthulhuquarium/t-080, conductor LOOP.md): every fed fish
     drops a coin every tank.coinDropSeconds on its own timer, worth its
     stock row's coinValue. Coins sink to the gravel, rest, and fade after
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
     rather than defaulting to one color. -->
<template>
  <ClientOnly>
    <Teleport to="body" :disabled="!fullscreen">
      <div
        ref="gameRoot"
        class="cq-game kr-container flex max-w-7xl flex-col gap-3"
        :class="{ 'cq-fullscreen': fullscreen }"
      >
        <cthulhuquarium-dialogue />
        <p v-if="tankStore.error" class="alert alert-error text-sm">
          {{ tankStore.error }}
        </p>

        <!-- Rare random events (cthulhuquarium/t-016): brief, dry, unsettling
           -- never a jump scare, never explained. A settled tick's own
           coinsEarned already includes any bonus; this is purely the
           dismissible notice of what happened. -->
        <div
          v-if="tankStore.lastRareEvent"
          class="flex items-start gap-2 kr-panel-tint-compact text-sm"
        >
          <Icon
            name="kind-icon:sparkles"
            class="kr-icon-4 mt-0.5 shrink-0 opacity-60"
          />
          <div class="min-w-0 flex-1">
            <p class="italic opacity-80">{{ tankStore.lastRareEvent.tone }}</p>
            <p
              v-if="tankStore.lastRareEvent.bonusCoins > 0"
              class="kr-text-bold-xs mt-1 opacity-60"
            >
              +{{ tankStore.lastRareEvent.bonusCoins }} coins
            </p>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs min-h-11 min-w-11 shrink-0"
            aria-label="Dismiss"
            @click="tankStore.dismissRareEvent()"
          >
            <Icon name="kind-icon:close" class="kr-icon-4" />
          </button>
        </div>

        <!-- cthulhuquarium/t-053: the generic, art-agnostic milestone toast --
           t-028's bestiary-breakpoint gate (bestiary_5/10/15/20) fires
           server-side and already applies the slot-cap increase before this
           ever renders; this is only the dismissible notice saying so.
           Same non-blocking dismissible-notice shape as the rare-event
           block above, deliberately not a modal -- a full authored
           Charlotte interstitial (t-028's own note) is a later layer. -->
        <div
          v-if="tankStore.nextMilestoneToast"
          class="flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm"
        >
          <Icon
            name="kind-icon:trophy"
            class="mt-0.5 size-4 shrink-0 text-success"
          />
          <p class="min-w-0 flex-1 font-bold">
            {{ tankStore.nextMilestoneToast }}
          </p>
          <button
            type="button"
            class="btn btn-ghost btn-xs min-h-11 min-w-11 shrink-0"
            aria-label="Dismiss"
            @click="tankStore.dismissMilestoneToast()"
          >
            <Icon name="kind-icon:close" class="kr-icon-4" />
          </button>
        </div>

        <!-- Decor placement banner (cthulhuquarium/t-017): shown once a shop
           item is chosen, so tapping the tank has an obvious, reversible
           meaning instead of silently spending coins. -->
        <div
          v-if="tankStore.pendingDecorKind"
          class="flex items-center justify-between gap-2 rounded-xl border border-primary/60 bg-primary/10 px-3 py-2 text-xs"
        >
          <span class="font-bold">
            Tap the tank to place
            {{ decorTitle(tankStore.pendingDecorKind) }}
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-xs min-h-11 min-w-11"
            @click="tankStore.cancelDecorPlacement()"
          >
            Cancel
          </button>
        </div>

        <div class="cq-layout">
          <div
            class="cq-tank relative overflow-hidden rounded-2xl border border-base-300 bg-base-300 shadow-xl"
            :class="{ 'cq-focus': storyFocus === 'tank' }"
          >
            <canvas
              ref="canvasRef"
              class="block aspect-[16/9] w-full cursor-pointer touch-none"
              :width="STAGE_WIDTH * RENDER_SCALE"
              :height="STAGE_HEIGHT * RENDER_SCALE"
              aria-label="Aquarium tank. Every fed fish drops coins; tap them to collect them, tap near a fish to startle it, or drag a placed decoration to move it."
              @pointerdown="onCanvasPointerDown"
              @pointermove="onCanvasPointerMove"
              @pointerup="onCanvasPointerUp"
              @pointercancel="onCanvasPointerUp"
              @pointerleave="onCanvasPointerLeave"
            />

            <div
              class="pointer-events-none flex flex-wrap items-center justify-between gap-2 bg-base-200 p-2 sm:absolute sm:inset-x-0 sm:top-0 sm:items-start sm:bg-transparent sm:p-3"
            >
              <div
                class="flex items-center gap-3 rounded-full bg-base-100/80 px-3 py-1.5 text-sm font-bold shadow backdrop-blur-sm"
              >
                <span
                  class="flex items-center gap-1 rounded-full"
                  :class="{ 'cq-focus': storyFocus === 'coins' }"
                >
                  <Icon name="kind-icon:coin" class="size-4 text-warning" />
                  {{ tankStore.coins }}
                </span>
                <span class="flex items-center gap-1 opacity-70">
                  <Icon name="kind-icon:fish" class="kr-icon-4" />
                  {{ tankStore.stock.length }}
                </span>
                <span class="text-xs font-normal opacity-70">
                  {{ tankStore.occupantSize }}/{{ tankStore.sizeCap }} fish
                </span>
              </div>

              <div
                class="pointer-events-auto flex flex-wrap items-center gap-2 sm:justify-end"
              >
                <button
                  type="button"
                  class="btn btn-circle btn-sm min-h-11 min-w-11 border-base-300 bg-base-100/80 shadow backdrop-blur-sm"
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
                  class="btn btn-circle btn-sm min-h-11 min-w-11 border-base-300 bg-base-100/80 shadow backdrop-blur-sm"
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
                <button
                  type="button"
                  class="btn btn-sm min-h-11 gap-2 border-base-300 bg-base-100/80 shadow backdrop-blur-sm"
                  :class="{ 'cq-focus': storyFocus === 'clean' }"
                  :disabled="
                    tankStore.debrisLevel <= 0 &&
                    tankStore.pendingCleanClicks === 0
                  "
                  :aria-label="`Clean the tank, debris ${tankStore.debrisLevel}%`"
                  @click="onClean"
                >
                  <span
                    class="h-1.5 w-10 overflow-hidden rounded-full bg-base-300"
                    role="meter"
                    :aria-valuenow="tankStore.debrisLevel"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Tank debris"
                  >
                    <span
                      class="block h-full rounded-full bg-warning transition-all"
                      :class="{ 'bg-error': tankStore.debrisLevel >= 80 }"
                      :style="{ width: `${tankStore.debrisLevel}%` }"
                    />
                  </span>
                  Clean
                  <span
                    v-if="tankStore.pendingCleanClicks > 0"
                    class="kr-badge-neutral-xs"
                  >
                    ×{{ tankStore.pendingCleanClicks }}
                  </span>
                </button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm min-h-11 min-w-11 shadow"
                  :class="{ 'cq-focus': storyFocus === 'feed' }"
                  :disabled="!tankStore.hungriest || feeding"
                  @click="onFeed"
                >
                  {{
                    tankStore.hungryCount > 0
                      ? `Feed hungry (${tankStore.hungryCount})`
                      : 'Feed'
                  }}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm min-h-11 min-w-11 shadow"
                  @click="scrollToShop"
                >
                  Buy fish
                </button>
                <button
                  v-if="roomUpgrade && roomUpgrade.nextCost !== null"
                  type="button"
                  class="cq-price btn btn-sm min-h-11 min-w-11 border-base-300 bg-base-100/80 shadow backdrop-blur-sm"
                  :disabled="
                    tankStore.coins < roomUpgrade.nextCost ||
                    tankStore.upgradePending === 'room'
                  "
                  :title="`Room for 4 more fish (${roomUpgrade.nextCost} coins)`"
                  @click="tankStore.purchaseUpgrade('room')"
                >
                  +4 room ({{ roomUpgrade.nextCost }})
                </button>
              </div>
            </div>

            <cthulhuquarium-bark
              class="pointer-events-auto absolute inset-x-3 bottom-3"
            />

            <p
              v-if="tankStore.loading"
              class="absolute inset-x-0 bottom-3 text-center text-sm italic text-base-content/80"
            >
              Settling into your tank…
            </p>
            <p
              v-else-if="!tankStore.stock.length"
              class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-serif text-base italic text-base-content/80"
            >
              An empty tank, waiting. Buy a fish to begin.
            </p>
          </div>

          <div class="cq-side flex flex-col gap-3">
            <div
              ref="shopRef"
              class="flex scroll-mt-4 flex-col gap-2 rounded-2xl"
              :class="{ 'cq-focus p-2': storyFocus === 'shop' }"
            >
              <!-- The shop's own header (canon videos.yaml screen-shop): the aisle
             of lit tanks, moving; the still plate under reduced motion. -->
              <div class="flex items-end justify-between gap-2">
                <p class="kr-text-eyebrow text-xs tracking-wide opacity-60">
                  Buy a fish
                </p>
                <img
                  v-if="shopHeaderArt"
                  :src="shopHeaderArt"
                  alt="The shop's aisle of lit tanks"
                  class="aspect-[16/5] w-28 rounded-xl border border-base-300 object-cover shadow"
                  loading="lazy"
                />
              </div>
              <cthulhuquarium-bark context="shop" />
              <!-- t-030: the shop rotates -- this is a slice of what's never been
             owned, not the whole remaining bestiary. Anything sold or
             already discovered stays available any time via the
             Ichthyonomicon's re-order button below, regardless of today's
             slate. t-057: a live countdown to the next rotation replaces the
             old static hint once the catalog has loaded. -->
              <p class="text-xs italic opacity-50">
                {{
                  shopRefreshLabel ??
                  "Today's arrivals -- check back tomorrow for more."
                }}
              </p>
              <p v-if="tankStore.catalogLoading" class="kr-text-faded-xs">
                Reading the bestiary…
              </p>
              <p
                v-if="!fitsRoom()"
                class="rounded-xl border border-warning/50 bg-warning/10 px-3 py-1.5 text-xs font-bold"
              >
                The tank is full -- buy +4 room or release a fish to add more.
              </p>
              <div v-if="!tankStore.catalogLoading" class="flex flex-col gap-1">
                <div
                  v-for="entry in tankStore.catalog"
                  :key="entry.id"
                  class="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-200 p-1"
                >
                  <div
                    class="size-11 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-100"
                  >
                    <cthulhuquarium-sprite
                      :slug="entry.slug"
                      :label="entry.name"
                      :fallback="withCthulhuquariumArt(entry)"
                      :size="44"
                      class="size-full"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="kr-text-bold-sm truncate">{{ entry.name }}</p>
                    <p
                      class="truncate font-serif text-xs italic opacity-80"
                      :title="voiceFor(entry.slug, 'charlotte') || undefined"
                    >
                      {{
                        voiceFor(entry.slug, 'charlotte')
                          ? `“${voiceFor(entry.slug, 'charlotte')}”`
                          : 'Not yet observed.'
                      }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="cq-price btn btn-primary btn-sm min-h-11 min-w-20 shrink-0 gap-1"
                    :disabled="!canUnlock(entry)"
                    :title="
                      !fitsRoom()
                        ? 'Tank full'
                        : entry.cost > tankStore.coins
                          ? `${entry.cost - tankStore.coins} more coins needed`
                          : undefined
                    "
                    @click="tankStore.unlock(entry.id)"
                  >
                    <template v-if="entry.cost === 0">Free</template>
                    <template v-else>
                      <Icon name="kind-icon:coin" class="size-4 text-warning" />
                      {{ entry.cost }}
                    </template>
                  </button>
                </div>
                <p v-if="!tankStore.catalog.length" class="kr-text-faded-xs">
                  Nothing new today -- buy more of a fish you own from its card
                  below.
                </p>
              </div>
            </div>

            <cthulhuquarium-upgrades />
          </div>

          <div class="cq-roster flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <p class="kr-text-eyebrow text-xs tracking-wide opacity-60">
                The tank
              </p>
            </div>
            <!-- Column count follows the host panel's real width, not the
             viewport: this is a shared component and the layout contract's
             viewport-grid rule forbids sm:/md: grid-cols here. -->
            <div
              class="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-2"
            >
              <div
                v-for="group in rosterGroups"
                :key="group.monsterId"
                class="flex flex-col gap-1.5 kr-panel-compact"
              >
                <div class="flex items-center gap-2">
                  <cthulhuquarium-sprite
                    :slug="group.monster.slug"
                    :label="group.monster.name"
                    :fallback="group.art"
                    :size="56"
                    class="size-14 shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <p
                      class="kr-text-bold-sm truncate"
                      :title="group.monster.name"
                    >
                      {{ group.monster.name }}
                    </p>
                    <p class="text-xs opacity-70">
                      ×{{ group.entries.length }} · {{ group.coinValue }} per
                      coin
                    </p>
                  </div>
                </div>
                <div
                  class="h-1.5 w-full overflow-hidden rounded-full bg-base-300"
                  :title="`Hungriest at ${group.hungriest.hunger}%`"
                >
                  <div
                    class="h-full rounded-full bg-success transition-all"
                    :class="{
                      'bg-warning': group.hungriest.hunger < 50,
                      'bg-error': group.hungriest.hunger < 20,
                    }"
                    :style="{ width: `${group.hungriest.hunger}%` }"
                  />
                </div>
                <div class="flex gap-1">
                  <button
                    type="button"
                    class="btn btn-outline btn-xs min-h-11 flex-1"
                    :disabled="group.hungriest.hunger >= 100"
                    @click="tankStore.feed(group.hungriest.id)"
                  >
                    Feed
                  </button>
                  <button
                    type="button"
                    class="cq-price btn btn-outline btn-xs min-h-11 flex-1"
                    :disabled="tankStore.coins < group.buyCost || !fitsRoom()"
                    :title="
                      fitsRoom()
                        ? `Buy another (${group.buyCost} coins)`
                        : 'Tank full'
                    "
                    @click="tankStore.unlock(group.monsterId)"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-xs min-h-11 flex-1"
                    :title="
                      group.sellPrice > 0
                        ? `Release one for ${group.sellPrice} coins`
                        : 'Release one'
                    "
                    @click="tankStore.sell(group.hungriest.id)"
                  >
                    {{
                      group.sellPrice > 0 ? `−1 (+${group.sellPrice})` : '−1'
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- The Ichthyonomicon (cthulhuquarium/t-024, extended by t-031): the
           collection is the actual progression spine now ("ENDLESS BUT THE
           BESTIARY COMPLETES"), so it gets a view worth returning to rather
           than living only as a side effect of the unlock panel above.
           Collapsed by default and loaded on first open -- it's the
           completionist book, not part of the tank's own poll loop. Formal
           name on the cover; Charlotte and Wilbur would just call it "the
           book" (SYSTEMS.md). -->
        <div class="flex flex-col gap-2 kr-panel-divider">
          <button
            type="button"
            class="flex items-center justify-between gap-2 rounded-2xl text-left"
            :class="{ 'cq-focus': storyFocus === 'bestiary' }"
            @click="onToggleBestiary"
          >
            <!-- cthulhuquarium/t-065: the authored cover plate. The book had a
               formal name and a text label; now it has its cover. -->
            <!-- cthulhuquarium/t-067: see the fish-list wrapper comment above --
               same width-cascade fix, wrapper-owned size and border. -->
            <div
              v-if="artByName('ichthyonomicon')"
              class="kr-icon-10 shrink-0 overflow-hidden rounded-2xl border border-base-300"
            >
              <kr-art-plate
                :source="{
                  imagePath:
                    movingArt('ichthyonomicon') ?? artByName('ichthyonomicon'),
                }"
                variant="icon"
                shape="square"
                frame="none"
                fit="cover"
                placeholder-icon="kind-icon:book"
              />
            </div>
            <span class="kr-text-eyebrow text-xs tracking-wide opacity-60">
              The Ichthyonomicon
              <span v-if="tankStore.bestiaryTotalCount > 0" class="opacity-80">
                — {{ tankStore.bestiaryCollectedCount }}/{{
                  tankStore.bestiaryTotalCount
                }}
                observed
              </span>
            </span>
            <Icon
              :name="
                showBestiary ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
              "
              class="kr-icon-4 shrink-0 opacity-60"
            />
          </button>

          <template v-if="showBestiary">
            <cthulhuquarium-bark context="bestiary" />
            <p v-if="tankStore.bestiaryLoading" class="kr-text-faded-xs">
              Reading the book…
            </p>
            <cthulhuquarium-ichthyonomicon v-else />
          </template>
        </div>

        <!-- Set pieces (cthulhuquarium/t-026): the build layer. Fish provide
           colour and income; sets provide the variation and the surprise
           combos (SYSTEMS.md's own framing) -- so unlike the bestiary this
           panel is about a small, legible, COUNTED choice (setSlotsCap),
           not a big collected list. -->
        <div class="flex flex-col gap-2 kr-panel-divider">
          <button
            type="button"
            class="flex items-center justify-between gap-2 text-left"
            @click="onToggleSets"
          >
            <span class="kr-text-eyebrow text-xs tracking-wide opacity-60">
              Set pieces
              <span class="opacity-80">
                — {{ tankStore.equippedSets.length }}/{{
                  tankStore.setSlotsCap
                }}
                equipped
              </span>
            </span>
            <Icon
              :name="
                showSets ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
              "
              class="kr-icon-4 shrink-0 opacity-60"
            />
          </button>

          <template v-if="showSets">
            <cthulhuquarium-bark context="sets" />
            <p v-if="tankStore.setCatalogLoading" class="kr-text-faded-xs">
              Surveying the build layer…
            </p>
            <div
              v-else
              class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2"
            >
              <div
                v-for="entry in tankStore.setCatalog"
                :key="entry.kind"
                class="flex flex-col gap-1 kr-panel-compact"
                :class="{ 'border-primary/60': entry.equipped }"
              >
                <img
                  v-if="artForSetKind(entry.kind)"
                  :src="artForSetKind(entry.kind) ?? undefined"
                  :alt="entry.title"
                  loading="lazy"
                  class="aspect-square w-full rounded-xl bg-base-200 object-contain"
                />
                <div class="flex items-start justify-between gap-2">
                  <p class="kr-text-bold-sm">{{ entry.title }}</p>
                  <span
                    v-if="entry.equipped"
                    class="kr-badge-primary-xs shrink-0"
                  >
                    Equipped
                  </span>
                </div>
                <p class="text-xs italic opacity-70">{{ entry.description }}</p>
                <button
                  v-if="entry.equipped"
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 mt-1 self-start"
                  @click="
                    () => {
                      const id = equippedSetId(entry.kind)
                      if (id) tankStore.unequipSet(id)
                    }
                  "
                >
                  Unequip
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 mt-1 self-start"
                  :disabled="!canEquip(entry)"
                  @click="tankStore.equipSet(entry.kind)"
                >
                  Equip ({{ entry.cost }})
                </button>
              </div>
              <p v-if="!tankStore.setCatalog.length" class="kr-text-faded-xs">
                No set pieces to show right now.
              </p>
            </div>
          </template>
        </div>

        <!-- Decorate (cthulhuquarium/t-017): "they can decorate it" -- purely
           cosmetic, unlike set pieces (no slot cap, no economy effect, and
           buying the same item twice is fine). Choosing an item here sets
           pendingDecorKind; the next tap on the tank places and pays for it.
           An already-placed item can be dragged directly on the canvas. -->
        <div class="flex flex-col gap-2 kr-panel-divider">
          <button
            type="button"
            class="flex items-center justify-between gap-2 text-left"
            @click="onToggleDecor"
          >
            <span class="kr-text-eyebrow text-xs tracking-wide opacity-60">
              Decorate
              <span v-if="tankStore.placedDecor.length" class="opacity-80">
                — {{ tankStore.placedDecor.length }} placed
              </span>
            </span>
            <Icon
              :name="
                showDecor ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
              "
              class="kr-icon-4 shrink-0 opacity-60"
            />
          </button>

          <template v-if="showDecor">
            <cthulhuquarium-bark context="decor" />
            <p v-if="tankStore.decorCatalogLoading" class="kr-text-faded-xs">
              Sorting through the driftwood…
            </p>
            <div
              v-else
              class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2"
            >
              <div
                v-for="entry in tankStore.decorCatalog"
                :key="entry.kind"
                class="flex flex-col gap-1 kr-panel-compact"
                :class="{
                  'border-primary/60':
                    tankStore.pendingDecorKind === entry.kind,
                }"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="kr-text-bold-sm">
                    <span class="mr-1">{{ entry.icon }}</span
                    >{{ entry.title }}
                  </p>
                </div>
                <p class="text-xs italic opacity-70">{{ entry.description }}</p>
                <button
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 mt-1 self-start"
                  :disabled="tankStore.coins < entry.cost"
                  @click="tankStore.chooseDecorToPlace(entry.kind)"
                >
                  Place ({{ entry.cost }})
                </button>
              </div>
              <p v-if="!tankStore.decorCatalog.length" class="kr-text-faded-xs">
                Nothing to place right now.
              </p>
            </div>
            <p
              v-if="tankStore.placedDecor.length"
              class="text-[0.65rem] uppercase tracking-wide opacity-60"
            >
              Drag anything placed in the tank to move it.
            </p>
          </template>
        </div>

        <details class="group flex flex-col gap-2 kr-panel-divider">
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-2"
          >
            <span class="kr-text-eyebrow text-xs tracking-wide opacity-60">
              More for the tank — backgrounds, the last aquarium, sharing
            </span>
            <Icon
              name="kind-icon:chevron-down"
              class="kr-icon-4 shrink-0 opacity-60 transition group-open:rotate-180"
            />
          </summary>
          <div class="mt-2 flex flex-col gap-3">
            <div class="flex flex-col gap-2">
              <p class="kr-text-eyebrow text-xs tracking-wide opacity-60">
                Behind the glass
              </p>
              <cthulhuquarium-bark context="backgrounds" />
              <div class="flex snap-x gap-2 overflow-x-auto pb-1">
                <button
                  v-for="background in tankStore.backgrounds"
                  :key="background.key"
                  type="button"
                  class="relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl border-2 text-left transition"
                  :class="
                    background.key === tankStore.backgroundKey
                      ? 'border-primary'
                      : 'border-base-300'
                  "
                  :disabled="!background.unlocked || tankStore.backgroundSaving"
                  :aria-pressed="background.key === tankStore.backgroundKey"
                  @click="tankStore.chooseBackground(background.key)"
                >
                  <img
                    v-if="backgroundArt(background.key)"
                    :src="backgroundArt(background.key) ?? undefined"
                    :alt="background.name"
                    class="aspect-[16/9] w-full object-cover"
                    :class="{
                      'blur-sm grayscale opacity-40': !background.unlocked,
                    }"
                  />
                  <div v-else class="aspect-[16/9] w-full bg-base-300" />
                  <div class="p-1.5">
                    <p class="truncate text-xs font-bold">
                      {{ background.unlocked ? background.name : 'Not yet' }}
                    </p>
                    <p
                      v-if="!background.unlocked"
                      class="truncate text-[0.65rem] opacity-60"
                    >
                      {{ backgroundUnlockHint(background.unlock) }}
                    </p>
                  </div>
                </button>
              </div>
            </div>
            <!-- The last aquarium (cthulhuquarium/t-039): a single, standalone,
           one-time terminal purchase -- deliberately not folded into "Set
           pieces" above, since it never occupies a setSlotsCap slot and can
           never be unequipped. Charlotte sells it "cheerfully and without
           comment" per the task's own design note, so this stays a plain
           shop row; the moment itself is the reveal dialog below. The real
           set-last-aquarium plate (cthulhuquarium/t-054) replaces what would
           otherwise be a text-only row, matching the fish catalog's
           icon-plus-text layout above. -->
            <div
              v-if="tankStore.finaleConfig"
              class="flex items-start gap-2 kr-panel-divider"
            >
              <!-- cthulhuquarium/t-067: THE reported bug -- "The Last Aquarium" row
             rendering one word per line because this plate stretched to the
             row's full width. See the fish-list wrapper comment above for the
             root cause and fix (same width-cascade issue, same fix here). -->
              <div
                class="kr-icon-12 shrink-0 overflow-hidden rounded-2xl border border-base-300"
              >
                <kr-art-plate
                  :source="{ imagePath: setLastAquariumArt }"
                  variant="icon"
                  shape="square"
                  frame="none"
                  fit="cover"
                  placeholder-icon="kind-icon:box"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <p class="kr-text-bold-sm">
                    {{ tankStore.finaleConfig.title }}
                  </p>
                  <span
                    v-if="tankStore.finaleTriggered"
                    class="kr-badge-primary-xs shrink-0"
                  >
                    Yours
                  </span>
                </div>
                <p class="text-xs italic opacity-70">
                  {{ tankStore.finaleConfig.description }}
                </p>
                <button
                  v-if="!tankStore.finaleTriggered"
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 mt-1"
                  :disabled="tankStore.coins < tankStore.finaleConfig.cost"
                  @click="tankStore.purchaseFinale()"
                >
                  Buy ({{ tankStore.finaleConfig.cost }})
                </button>
              </div>
            </div>

            <!-- Visibility (cthulhuquarium/t-014): "Each user should be viewable"
           -- new tanks default public, and this is the one-click way to
           change that. Read-only for visitors either way: the toggle only
           ever writes the owner's own tank. -->
            <div
              class="flex flex-wrap items-center justify-between gap-2 kr-panel-divider"
            >
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
                class="link text-xs opacity-70"
              >
                View your public page
              </NuxtLink>
              <NuxtLink
                to="/play/aquarium/browse"
                class="link text-xs opacity-70"
              >
                Browse public tanks
              </NuxtLink>
              <NuxtLink
                to="/play/aquarium/leaderboard"
                class="link text-xs opacity-70"
              >
                Leaderboard
              </NuxtLink>
            </div>
          </div>
        </details>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  TANK_POLL_INTERVAL_MS,
  useCthulhuquariumTankStore,
  type CatalogEntry,
  type SetCatalogEntry,
  type TankDecor,
  type TankStock,
} from '~/stores/cthulhuquariumTankStore'
import { touchHitRadius } from '~/utils/aquariumTouch'
import { formatShopRefreshCountdown } from '~/utils/aquariumShopCountdown'
import { useUserStore } from '~/stores/userStore'
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
  artForSetKind,
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
const COIN_SINK_SPEED = 34
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
type FeedCreature = { x: number; y: number; phase: number; lean: number }

const tankStore = useCthulhuquariumTankStore()
const shopHeaderArt =
  (prefersReducedMotion() ? null : movingArt('screen-shop')) ??
  artByName('screen-shop')
// Held, like the dialogue itself, while anything else has the floor.
const storyFocus = computed(() =>
  tankStore.storyShowing ? (tankStore.activeBeat?.focus ?? null) : null,
)

// A beat that points at something brings it on screen: after adopting the
// first fish the page is still down at the shop, and Wilbur's "press Feed"
// ring would otherwise pulse on a button above the fold.
const gameRoot = ref<HTMLElement | null>(null)
watch(storyFocus, async (focus) => {
  if (!focus) return
  await nextTick()
  gameRoot.value?.querySelector('.cq-focus')?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'center',
  })
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
const showBestiary = ref(false)
const showSets = ref(false)
const showDecor = ref(false)

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
// startLoops()) so shopRefreshLabel below recomputes without a second
// timer -- a countdown display only shown in whole minutes doesn't need
// finer-grained ticking than the tank's existing poll loop already gives it.
const now = ref(Date.now())

// The unlock panel's live "refreshes in Xh Ym" readout, replacing the old
// static "check back tomorrow" hint. Null (falls back to that static hint
// in the template) until the catalog has loaded at least once, or for the
// brief window after a rotation flips server-side but before the next
// loadCatalog() call picks up the new dateKey.
const shopRefreshLabel = computed(() => {
  const dateKey = tankStore.catalogDateKey
  return dateKey ? formatShopRefreshCountdown(dateKey, now.value) : null
})

// A disabled button says why when the reason isn't on it already: the price
// is printed, so short coins speaks for itself, but a full tank looked like
// the same greyed-out price (playtest 2026-09-30: 19,720 coins and every
// Unlock/Buy dead with no word why).
// cthulhuquarium/t-083: the shop sits right under the tank; Buy fish jumps to
// it on a phone, where the tank fills the first screen.
const shopRef = ref<HTMLElement | null>(null)
function scrollToShop() {
  shopRef.value?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  })
}

// Fullscreen is the page's own overlay first (it works on phones without the
// Fullscreen API), with the browser's fullscreen layered on where offered so
// Esc and the system gesture leave both together.
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

const roomUpgrade = computed(
  () => tankStore.upgrades.find((entry) => entry.track === 'room') ?? null,
)

// cthulhuquarium/t-083: one tile per species instead of one card per fish --
// a 30-fish tank of six species is six tiles. Actions act on the group's
// hungriest fish.
const rosterGroups = computed(() => {
  const groups = new Map<number, TankStock[]>()
  for (const entry of tankStore.stock) {
    const list = groups.get(entry.monsterId)
    if (list) list.push(entry)
    else groups.set(entry.monsterId, [entry])
  }
  return [...groups.values()].map((entries) => {
    const hungriest = entries.reduce((worst, entry) =>
      entry.hunger < worst.hunger ? entry : worst,
    )
    return {
      monsterId: hungriest.monsterId,
      monster: hungriest.Monster,
      art: withCthulhuquariumArt({ ...hungriest.Monster }),
      entries,
      hungriest,
      coinValue: hungriest.coinValue,
      buyCost: hungriest.buyCost,
      sellPrice: hungriest.sellPrice,
    }
  })
})

// cthulhuquarium/t-081: every fish takes one slot, whatever its size.
function fitsRoom(): boolean {
  return tankStore.occupantSize + 1 <= tankStore.sizeCap
}

function canUnlock(entry: CatalogEntry): boolean {
  return tankStore.coins >= entry.cost && fitsRoom()
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

// A dropped coin: a struck disc that turns as it sinks, catching the light
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
  const resting = coin.y >= COIN_REST_Y
  const turn = resting ? 1 : Math.abs(Math.cos(coin.spin))
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

  const food = feed.value[0] ?? null
  for (const swimmer of swimmers.value) {
    stepSwimState(swimmer, {
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      delta,
      speedMultiplier: swimSpeedMultiplier.value,
      pointer: pointerOnStage,
      food,
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
    if (coin.y < COIN_REST_Y) {
      coin.y = Math.min(COIN_REST_Y, coin.y + COIN_SINK_SPEED * delta)
      coin.spin += delta * 4
      coin.x = Math.min(
        STAGE_WIDTH - 14,
        Math.max(14, coin.x + coin.drift * delta),
      )
    }
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
    y: Math.min(swimmer.y + 6, COIN_REST_Y),
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
  for (const swimmer of swimmers.value) {
    if (startle(swimmer, coords.x, coords.y)) scattered = true
  }
  if (scattered) {
    tankSound.knock()
    tankStore.sayBark('startle', 0.25)
  }

  const hitDecor = hitTestDecor(coords.x, coords.y)
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
  }
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
// food drops above up to three of them so the tank shows it happening.
const feeding = ref(false)
async function onFeed() {
  if (feeding.value) return
  feeding.value = true
  try {
    const fed = await tankStore.feedHungry()
    if (!fed.length) return
    tankSound.plop()
    tankStore.sayBark('fed', 0.5)
    for (const id of fed.slice(0, 3)) dropFoodOver(id)
  } finally {
    feeding.value = false
  }
}

function dropFoodOver(stockId: number) {
  const swimmer = swimmers.value.find((entry) => entry.stockId === stockId)
  feed.value.push({
    x: swimmer?.x ?? 60 + Math.random() * (STAGE_WIDTH - 120),
    y: 12,
    phase: Math.random() * Math.PI * 2,
    lean: (Math.random() - 0.5) * 1.6,
  })
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

function onToggleBestiary() {
  showBestiary.value = !showBestiary.value
  // Loaded once on first open, not eagerly on mount -- see the store's own
  // comment on why the codex isn't part of the tank's poll loop.
  if (showBestiary.value && !tankStore.bestiary.length) {
    void tankStore.loadBestiary()
  }
}

function onToggleSets() {
  showSets.value = !showSets.value
  if (showSets.value && !tankStore.setCatalog.length) {
    void tankStore.loadSets()
  }
}

function onToggleDecor() {
  showDecor.value = !showDecor.value
  if (showDecor.value && !tankStore.decorCatalog.length) {
    void tankStore.loadDecor()
  }
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

function canEquip(entry: SetCatalogEntry): boolean {
  return (
    !entry.equipped &&
    tankStore.coins >= entry.cost &&
    tankStore.equippedSets.length < tankStore.setSlotsCap
  )
}

function equippedSetId(kind: string): number | null {
  return tankStore.equippedSets.find((entry) => entry.kind === kind)?.id ?? null
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
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('pointerdown', resumeSoundOnGesture)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('keydown', onFullscreenKey)
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
  container-type: inline-size;
}
.cq-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'tank' 'side' 'roster';
  gap: 0.75rem;
  align-items: start;
}
.cq-tank {
  grid-area: tank;
}
.cq-side {
  grid-area: side;
}
.cq-roster {
  grid-area: roster;
}
@container (min-width: 52rem) {
  .cq-layout {
    grid-template-columns: minmax(0, 1.9fr) minmax(17rem, 1fr);
    grid-template-areas: 'tank side' 'roster side';
    grid-template-rows: auto 1fr;
  }
}
.cq-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 60;
  max-width: none;
  margin: 0;
  padding: 0.5rem 0.75rem 1rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--color-base-100);
}
.cq-price:disabled {
  opacity: 1;
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
  background: var(--color-base-200);
  border-color: var(--color-base-300);
}
.cq-focus {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
  animation: cq-focus-pulse 1.4s ease-in-out infinite;
}
@keyframes cq-focus-pulse {
  50% {
    outline-offset: 6px;
    outline-color: transparent;
  }
}
</style>
