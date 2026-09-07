<!-- components/cthulhuquarium/cthulhuquarium-game.vue
     The real Cthulhuquarium play loop (conductor cthulhuquarium/t-011),
     replacing the t-010 localStorage prototype. Coins, hunger, and species
     ownership are the server's Aquarium/AquariumStock rows
     (server/api/aquarium/**) -- this component never invents an economy
     number, it only renders what the store last loaded and asks the store
     to feed/unlock/settle.

     Design notes for the reviewer (t-011's task note calls for "collectibles
     drift up and pay coins on click", but economy.yaml has no click-for-
     coins income path -- production is entirely tick-settled server-side,
     see server/utils/aquariumEconomy.ts's settleTick). Rather than invent a
     client-authoritative click economy, a settled tick's coinsEarned spawns
     drifting motes as a VISUAL reveal of coins the server already credited;
     clicking one just dismisses it. No extra request, no new balance path.

     Fish are still hand-drawn shapes, not art -- t-015 (full art pass) is
     the task that changes that. What's real now is the swim behavior itself:
     each occupant's Monster.behavior (the fish bible's own vocabulary --
     drift/dart/lurk/school/anchor/surface/hover/tumble/cling) selects a
     movement profile instead of a hardcoded three-value switch, and hue
     comes from Monster.hue when a balance pass has set it, falling back to
     a slug-derived hue so an unassigned species still reads consistently
     rather than defaulting to one color. -->
<template>
  <ClientOnly>
    <div class="kr-container flex max-w-3xl flex-col gap-3">
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
          class="mt-0.5 size-4 shrink-0 opacity-60"
        />
        <div class="min-w-0 flex-1">
          <p class="italic opacity-80">{{ tankStore.lastRareEvent.tone }}</p>
          <p
            v-if="tankStore.lastRareEvent.bonusCoins > 0"
            class="mt-1 text-xs font-bold opacity-60"
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
          <Icon name="kind-icon:close" class="size-4" />
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
          <Icon name="kind-icon:close" class="size-4" />
        </button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-3 text-sm font-bold">
          <span class="flex items-center gap-1">
            <Icon name="kind-icon:coin" class="size-4 text-warning" />
            {{ tankStore.coins }}
          </span>
          <span class="flex items-center gap-1 opacity-70">
            <Icon name="kind-icon:fish" class="size-4" />
            {{ tankStore.stock.length }}
          </span>
          <span class="flex items-center gap-1 text-xs opacity-60">
            {{ tankStore.occupantSize }}/{{ tankStore.sizeCap }} capacity
          </span>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-sm min-h-11 min-w-11"
          :disabled="!tankStore.hungriest"
          @click="onFeed"
        >
          Feed hungriest
        </button>
      </div>

      <!-- Debris and cleaning (cthulhuquarium/t-027): the active-play
           channel. Debris only ever throttles the production RATE, never
           holdings, so clicking Clean can never lose anything -- it just
           speeds the tank back up. Manual clicking is one of three
           deliberately co-viable routes (the debris set and The Sexton are
           the other two, both still unbuilt); this is only the first. -->
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:sparkles" class="size-4 shrink-0 opacity-60" />
        <div
          class="h-1.5 flex-1 overflow-hidden rounded-full bg-base-300"
          role="meter"
          :aria-valuenow="tankStore.debrisLevel"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Tank debris"
        >
          <div
            class="h-full rounded-full bg-warning/70 transition-all"
            :class="{ 'bg-error/70': tankStore.debrisLevel >= 80 }"
            :style="{ width: `${tankStore.debrisLevel}%` }"
          />
        </div>
        <button
          type="button"
          class="btn btn-outline btn-xs min-h-11 min-w-11"
          :disabled="
            tankStore.debrisLevel <= 0 && tankStore.pendingCleanClicks === 0
          "
          @click="tankStore.requestClean()"
        >
          Clean
          <span
            v-if="tankStore.pendingCleanClicks > 0"
            class="kr-badge-neutral-xs ml-1"
          >
            ×{{ tankStore.pendingCleanClicks }}
          </span>
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

      <canvas
        ref="canvasRef"
        class="aspect-[16/9] w-full cursor-pointer rounded-2xl border border-base-300 bg-base-300 touch-none"
        :width="STAGE_WIDTH"
        :height="STAGE_HEIGHT"
        aria-label="Aquarium tank. Tap drifting coins to collect them, or drag a placed decoration to move it."
        @pointerdown="onCanvasPointerDown"
        @pointermove="onCanvasPointerMove"
        @pointerup="onCanvasPointerUp"
        @pointercancel="onCanvasPointerUp"
      />

      <p v-if="tankStore.loading" class="text-xs opacity-60">
        Settling into your tank…
      </p>
      <p v-else class="text-xs opacity-60">
        Feed the hungriest occupant to keep it paying out. Coins accrue on their
        own while you're away and settle the moment you return -- nothing here
        is saved in this browser, it's all your tank.
      </p>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="text-xs font-black uppercase tracking-wide opacity-60">
            The tank
          </p>
        </div>
        <!-- Column count follows the host panel's real width, not the
             viewport: this is a shared component and the layout contract's
             viewport-grid rule forbids sm:/md: grid-cols here. -->
        <div class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2">
          <div
            v-for="entry in tankStore.stock"
            :key="entry.id"
            class="kr-panel-compact"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-bold">{{ entry.Monster.name }}</p>
                <p class="mt-0.5 text-xs italic opacity-70">
                  {{ entry.Monster.species || entry.Monster.behavior || '—' }}
                </p>
                <!-- t-059: this individual's own rolled stats (t-029/t-055),
                     reusing the Ichthyonomicon's formatBestStats/
                     BEST_STAT_LABELS idiom (t-031) rather than a second
                     stat-formatting scheme. Hidden until rolled -- any
                     individual placed before t-029 shipped has none. -->
                <p
                  v-if="tankStockStatsLine(entry)"
                  class="mt-1 text-[0.65rem] uppercase tracking-wide opacity-60"
                >
                  {{ tankStockStatsLine(entry) }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 min-w-11"
                  :disabled="entry.hunger >= 100"
                  @click="tankStore.feed(entry.id)"
                >
                  Feed
                </button>
                <!-- Sell (t-030): priced off THIS individual's own rolled
                     stats, never a flat species price -- usually a loss, but
                     a well-bred fish can sell for more than it cost. Always
                     re-orderable afterward from the Ichthyonomicon below, so
                     no confirmation dialog, same one-click shape as
                     unequip/remove elsewhere in this component. t-062: the
                     button label itself shows the payout (server-computed,
                     entry.sellPrice) so the player sees what pressing it
                     pays before clicking, same "Breed for N" idiom as the
                     breed confirm dialog below. -->
                <button
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 min-w-11"
                  @click="tankStore.sell(entry.id)"
                >
                  Sell for {{ entry.sellPrice }}
                </button>
                <!-- Breed (t-055): a two-step pick, same "choose, then click
                     to commit" idiom as the decor placement flow -- clicking
                     Breed on one card arms it as parent A, then only other
                     cards of the SAME species offer "Breed with this" as
                     parent B. Neither click mutates the tank; that only
                     happens once the confirm dialog below is accepted. -->
                <button
                  v-if="pendingBreedParentId === entry.id"
                  type="button"
                  class="btn btn-primary btn-xs min-h-11 min-w-11"
                  @click="onBreedClick(entry)"
                >
                  Cancel breed
                </button>
                <button
                  v-else-if="
                    pendingBreedParent &&
                    pendingBreedParent.monsterId === entry.monsterId
                  "
                  type="button"
                  class="btn btn-primary btn-xs min-h-11 min-w-11"
                  @click="onBreedClick(entry)"
                >
                  Breed with this
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 min-w-11"
                  :disabled="pendingBreedParentId !== null"
                  :title="
                    pendingBreedParentId !== null
                      ? 'Pick another individual of the same species, or cancel first.'
                      : undefined
                  "
                  @click="onBreedClick(entry)"
                >
                  Breed
                </button>
              </div>
            </div>
            <div
              class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-base-300"
            >
              <div
                class="h-full rounded-full bg-success transition-all"
                :class="{
                  'bg-warning': entry.hunger < 50,
                  'bg-error': entry.hunger < 20,
                }"
                :style="{ width: `${entry.hunger}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xs font-black uppercase tracking-wide opacity-60">
          Unlock a new occupant
        </p>
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
        <p v-if="tankStore.catalogLoading" class="text-xs opacity-60">
          Reading the bestiary…
        </p>
        <div
          v-else
          class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2"
        >
          <div
            v-for="entry in tankStore.catalog"
            :key="entry.id"
            class="flex items-start gap-2 kr-panel-compact"
          >
            <kr-art-plate
              :source="entry"
              variant="icon"
              shape="plate"
              frame="thin"
              fit="cover"
              class="size-12 shrink-0"
              placeholder-icon="kind-icon:fish"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold">{{ entry.name }}</p>
              <!-- Deliberately never the field note here -- the server
                   doesn't even send it for unowned species
                   (cthulhuquarium/t-012). It reveals in the dialog below,
                   once, on unlock. -->
              <p class="mt-0.5 line-clamp-2 text-xs italic opacity-70">
                Not yet observed.
              </p>
              <button
                type="button"
                class="btn btn-outline btn-xs min-h-11 mt-1"
                :disabled="!canUnlock(entry)"
                @click="tankStore.unlock(entry.id)"
              >
                Unlock ({{ entry.cost }})
              </button>
            </div>
          </div>
          <p v-if="!tankStore.catalog.length" class="text-xs opacity-60">
            Nothing left to discover right now.
          </p>
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
      <div class="flex flex-col gap-2 border-t border-base-300 pt-3">
        <button
          type="button"
          class="flex items-center justify-between gap-2 text-left"
          @click="onToggleBestiary"
        >
          <span class="text-xs font-black uppercase tracking-wide opacity-60">
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
            class="size-4 shrink-0 opacity-60"
          />
        </button>

        <template v-if="showBestiary">
          <p v-if="tankStore.bestiaryLoading" class="text-xs opacity-60">
            Reading the book…
          </p>
          <div
            v-else
            class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2"
          >
            <div
              v-for="entry in tankStore.bestiary"
              :key="entry.id"
              class="flex items-start gap-2 kr-panel-compact"
              :class="{ 'opacity-60': !entry.collected }"
            >
              <kr-art-plate
                :source="entry.collected ? entry : null"
                variant="icon"
                shape="plate"
                frame="thin"
                fit="cover"
                class="size-12 shrink-0"
                :placeholder-icon="
                  entry.collected ? 'kind-icon:fish' : 'kind-icon:lock'
                "
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">{{ entry.name }}</p>
                <p class="mt-0.5 line-clamp-2 text-xs italic opacity-70">
                  {{
                    entry.collected
                      ? entry.fieldNote || 'Nothing is written down yet.'
                      : 'Not yet observed.'
                  }}
                </p>
                <!-- Best-individual-seen record (t-031). Stays hidden until
                     cthulhuquarium/t-029 (genetics) rolls a first individual
                     -- there is nothing honest to show before then. -->
                <p
                  v-if="entry.bestStats"
                  class="mt-1 text-[0.65rem] uppercase tracking-wide opacity-60"
                >
                  Best seen: {{ formatBestStats(entry.bestStats) }}
                </p>
                <!-- Re-order (t-031, sell path shipped in t-030): the book
                     remembers a species whether or not it's currently in
                     the tank, so a sold species is re-orderable from here
                     regardless of today's rotating shop stock. -->
                <button
                  v-if="entry.collected && !entry.currentlyOwned"
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 mt-1"
                  @click="tankStore.unlock(entry.id)"
                >
                  Re-order
                </button>
              </div>
            </div>
            <p v-if="!tankStore.bestiary.length" class="text-xs opacity-60">
              Nothing in the book yet.
            </p>
          </div>
        </template>
      </div>

      <!-- Set pieces (cthulhuquarium/t-026): the build layer. Fish provide
           colour and income; sets provide the variation and the surprise
           combos (SYSTEMS.md's own framing) -- so unlike the bestiary this
           panel is about a small, legible, COUNTED choice (setSlotsCap),
           not a big collected list. -->
      <div class="flex flex-col gap-2 border-t border-base-300 pt-3">
        <button
          type="button"
          class="flex items-center justify-between gap-2 text-left"
          @click="onToggleSets"
        >
          <span class="text-xs font-black uppercase tracking-wide opacity-60">
            Set pieces
            <span class="opacity-80">
              — {{ tankStore.equippedSets.length }}/{{ tankStore.setSlotsCap }}
              equipped
            </span>
          </span>
          <Icon
            :name="showSets ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
            class="size-4 shrink-0 opacity-60"
          />
        </button>

        <template v-if="showSets">
          <p v-if="tankStore.setCatalogLoading" class="text-xs opacity-60">
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
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-bold">{{ entry.title }}</p>
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
            <p v-if="!tankStore.setCatalog.length" class="text-xs opacity-60">
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
      <div class="flex flex-col gap-2 border-t border-base-300 pt-3">
        <button
          type="button"
          class="flex items-center justify-between gap-2 text-left"
          @click="onToggleDecor"
        >
          <span class="text-xs font-black uppercase tracking-wide opacity-60">
            Decorate
            <span v-if="tankStore.placedDecor.length" class="opacity-80">
              — {{ tankStore.placedDecor.length }} placed
            </span>
          </span>
          <Icon
            :name="
              showDecor ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
            "
            class="size-4 shrink-0 opacity-60"
          />
        </button>

        <template v-if="showDecor">
          <p v-if="tankStore.decorCatalogLoading" class="text-xs opacity-60">
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
                'border-primary/60': tankStore.pendingDecorKind === entry.kind,
              }"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-bold">
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
            <p v-if="!tankStore.decorCatalog.length" class="text-xs opacity-60">
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

      <!-- Eggs (cthulhuquarium/t-041): "a hidden egg purchase... it should
           hatch something that fits in the aquarium." Two independent
           dials -- rarity (the LINE the egg seeds, read off the shell) and
           size (the tank-capacity weight reserved the instant it's bought,
           same pool as every occupant) -- so a small MYTHIC egg and a large
           COMMON egg are both real, separately-priced offers. Buying is the
           decision (the cost is seen up front); hatching is free and
           always shown, never silent. -->
      <div class="flex flex-col gap-2 border-t border-base-300 pt-3">
        <button
          type="button"
          class="flex items-center justify-between gap-2 text-left"
          @click="onToggleEggs"
        >
          <span class="text-xs font-black uppercase tracking-wide opacity-60">
            Eggs
            <span v-if="tankStore.eggs.length > 0" class="opacity-80">
              — {{ tankStore.eggs.length }} waiting to hatch
            </span>
          </span>
          <Icon
            :name="showEggs ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
            class="size-4 shrink-0 opacity-60"
          />
        </button>

        <template v-if="showEggs">
          <!-- Your own unhatched eggs, if any -- shown above the shop so
               "something to do right now" never hides behind the full
               catalog grid. -->
          <div
            v-if="tankStore.eggs.length"
            class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2"
          >
            <div
              v-for="egg in tankStore.eggs"
              :key="egg.id"
              class="flex items-start gap-2 rounded-xl border border-primary/60 bg-base-100 p-3"
            >
              <span class="text-3xl leading-none" aria-hidden="true">{{
                EGG_ICON
              }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">
                  {{ egg.rarity.charAt(0)
                  }}{{ egg.rarity.slice(1).toLowerCase() }}
                  Egg
                  <span class="font-normal opacity-60"
                    >(size {{ egg.size }})</span
                  >
                </p>
                <button
                  type="button"
                  class="btn btn-primary btn-outline btn-xs min-h-11 mt-1"
                  @click="tankStore.hatchEgg(egg.id)"
                >
                  Hatch
                </button>
              </div>
            </div>
          </div>

          <p class="text-xs italic opacity-50">
            Every rarity comes in every size -- the shell tells you the line,
            not the size; the price tells you the size, not the line.
          </p>
          <p v-if="tankStore.eggCatalogLoading" class="text-xs opacity-60">
            Reading the shelf…
          </p>
          <div
            v-else
            class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2"
          >
            <div
              v-for="entry in tankStore.eggCatalog"
              :key="`${entry.rarity}-${entry.size}`"
              class="flex items-start gap-2 kr-panel-compact"
            >
              <span class="text-3xl leading-none" aria-hidden="true">{{
                entry.icon
              }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">
                  {{ entry.title }}
                  <span class="font-normal opacity-60"
                    >(size {{ entry.size }})</span
                  >
                </p>
                <p class="mt-0.5 line-clamp-2 text-xs italic opacity-70">
                  {{ entry.description }}
                </p>
                <button
                  type="button"
                  class="btn btn-outline btn-xs min-h-11 mt-1"
                  :disabled="!canBuyEgg(entry)"
                  @click="tankStore.purchaseEgg(entry.rarity, entry.size)"
                >
                  Buy ({{ entry.cost }})
                </button>
              </div>
            </div>
          </div>
        </template>
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
        class="flex items-start gap-2 border-t border-base-300 pt-3"
      >
        <kr-art-plate
          :source="{ imagePath: setLastAquariumArt }"
          variant="icon"
          shape="plate"
          frame="thin"
          fit="cover"
          class="size-12 shrink-0"
          placeholder-icon="kind-icon:box"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-bold">{{ tankStore.finaleConfig.title }}</p>
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
        class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-3"
      >
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="toggle toggle-success toggle-sm"
            :checked="tankStore.tank?.isPublic ?? false"
            :disabled="visibilitySaving"
            @change="onToggleVisibility"
          />
          <span class="text-xs font-bold">
            {{ tankStore.tank?.isPublic ? 'Public tank' : 'Private tank' }}
          </span>
        </label>
        <NuxtLink
          v-if="tankStore.tank?.isPublic && username"
          :to="`/play/aquarium/browse/${username}/${tankStore.tank.slug}`"
          class="link text-xs opacity-70"
        >
          View your public page
        </NuxtLink>
        <NuxtLink to="/play/aquarium/browse" class="link text-xs opacity-70">
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
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            New occupant
          </p>
          <kr-art-plate
            :source="tankStore.revealedUnlock.Monster"
            variant="card"
            shape="plate"
            frame="thin"
            fit="cover"
            class="h-32 w-24"
            placeholder-icon="kind-icon:fish"
          />
          <h3 class="text-lg font-black">
            {{ tankStore.revealedUnlock.Monster.name }}
          </h3>
          <p
            v-if="tankStore.revealedUnlock.Monster.species"
            class="text-xs italic opacity-60"
          >
            {{ tankStore.revealedUnlock.Monster.species }}
          </p>
          <p class="text-sm opacity-80">
            {{
              tankStore.revealedUnlock.Monster.fieldNote ||
              'Nothing is written about this one yet.'
            }}
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

    <!-- The hatch reveal (cthulhuquarium/t-041): the egg is consumed here --
         this dialog IS the "must be shown, never silent" requirement the
         task note makes non-negotiable, same reasoning as the unlock reveal
         above but for a purchase that resolved to something unknown at
         the time of buying, not something chosen. -->
    <Teleport to="body">
      <dialog
        v-if="tankStore.revealedHatch"
        class="modal modal-open"
        aria-modal="true"
        @cancel.prevent="tankStore.dismissHatchReveal()"
      >
        <div
          class="modal-box flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-base-300 bg-base-100 text-center shadow-2xl"
        >
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            It hatched
          </p>
          <kr-art-plate
            :source="tankStore.revealedHatch.Monster"
            variant="card"
            shape="plate"
            frame="thin"
            fit="cover"
            class="h-32 w-24"
            placeholder-icon="kind-icon:fish"
          />
          <h3 class="text-lg font-black">
            {{ tankStore.revealedHatch.Monster.name }}
          </h3>
          <p
            v-if="tankStore.revealedHatch.Monster.species"
            class="text-xs italic opacity-60"
          >
            {{ tankStore.revealedHatch.Monster.species }}
          </p>
          <p class="text-sm opacity-80">
            {{
              tankStore.revealedHatch.Monster.fieldNote ||
              'Nothing is written about this one yet.'
            }}
          </p>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-1"
            @click="tankStore.dismissHatchReveal()"
          >
            Add it to the tank
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="tankStore.dismissHatchReveal()">
            close
          </button>
        </form>
      </dialog>
    </Teleport>

    <!-- The breed confirmation (cthulhuquarium/t-055): the second half of
         the choose-then-click-to-commit flow above. Shows the coin cost
         before anything is spent -- the one thing the task asked for by
         name -- and disables Confirm rather than guessing when the pair
         can't actually be afforded or would overflow the tank; the server
         re-checks both regardless, this is just so the button doesn't lie. -->
    <Teleport to="body">
      <dialog
        v-if="breedConfirmPair"
        class="modal modal-open"
        aria-modal="true"
        @cancel.prevent="breedConfirmPair = null"
      >
        <div
          class="modal-box flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-base-300 bg-base-100 text-center shadow-2xl"
        >
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            Breed these two?
          </p>
          <kr-art-plate
            :source="breedConfirmPair.a.Monster"
            variant="card"
            shape="plate"
            frame="thin"
            fit="cover"
            class="h-32 w-24"
            placeholder-icon="kind-icon:fish"
          />
          <h3 class="text-lg font-black">
            {{ breedConfirmPair.a.Monster.name }}
          </h3>
          <p class="text-sm opacity-80">
            Costs {{ breedConfirmPair.a.Monster.breedCost }} coins. Neither
            parent is consumed -- you'll get a new individual with converged
            stats, and just maybe, a secret evolution.
          </p>
          <p v-if="!canConfirmBreed" class="text-xs text-error">
            Not enough coins, or not enough tank room, for this pairing right
            now.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="kr-btn-outline-plain"
              @click="breedConfirmPair = null"
            >
              Cancel
            </button>
            <button
              type="button"
              class="kr-btn-primary-plain"
              :disabled="!canConfirmBreed"
              @click="onConfirmBreed"
            >
              Breed for {{ breedConfirmPair.a.Monster.breedCost }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="breedConfirmPair = null">close</button>
        </form>
      </dialog>
    </Teleport>

    <!-- The breed reveal (cthulhuquarium/t-055): same "must be shown, never
         silent" beat as the hatch reveal above, but doubling as the payoff
         moment for a secret BREEDING evolution (SYSTEMS.md's "the payoff,
         not a guaranteed outcome") -- `evolved` swaps the framing so that
         rare beat actually reads as special rather than an ordinary
         offspring reveal with different art. -->
    <Teleport to="body">
      <dialog
        v-if="tankStore.revealedBreed"
        class="modal modal-open"
        aria-modal="true"
        @cancel.prevent="tankStore.dismissBreedReveal()"
      >
        <div
          class="modal-box flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-base-300 bg-base-100 text-center shadow-2xl"
        >
          <Icon
            v-if="tankStore.revealedBreed.evolved"
            name="kind-icon:sparkles"
            class="size-8 text-warning"
          />
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            {{
              tankStore.revealedBreed.evolved
                ? 'A secret evolution!'
                : 'It bred'
            }}
          </p>
          <kr-art-plate
            :source="tankStore.revealedBreed.stock.Monster"
            variant="card"
            shape="plate"
            frame="thin"
            fit="cover"
            class="h-32 w-24"
            placeholder-icon="kind-icon:fish"
          />
          <h3 class="text-lg font-black">
            {{ tankStore.revealedBreed.stock.Monster.name }}
          </h3>
          <p
            v-if="tankStore.revealedBreed.stock.Monster.species"
            class="text-xs italic opacity-60"
          >
            {{ tankStore.revealedBreed.stock.Monster.species }}
          </p>
          <p class="text-sm opacity-80">
            {{
              tankStore.revealedBreed.stock.Monster.fieldNote ||
              'Nothing is written about this one yet.'
            }}
          </p>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-1"
            @click="tankStore.dismissBreedReveal()"
          >
            Add it to the tank
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="tankStore.dismissBreedReveal()">
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
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            The bestiary is complete
          </p>
          <h3 class="text-lg font-black">Every species, observed.</h3>
          <p class="text-sm opacity-80">
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
            :source="{ imagePath: screenFinaleArt }"
            shape="wide"
            frame="thin"
            fit="cover"
            class="w-full"
            placeholder-icon="kind-icon:eye"
          />
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            The last aquarium
          </p>
          <h3 class="text-lg font-black">
            Everything is exactly as you left it.
          </h3>
          <p class="text-sm opacity-80">
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
          <Icon name="kind-icon:coin" class="size-8 text-warning" />
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            While you were away
          </p>
          <h3 class="text-lg font-black">
            {{ tankStore.offlineEarnings }} coins
          </h3>
          <p class="text-sm opacity-80">
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  TANK_POLL_INTERVAL_MS,
  useCthulhuquariumTankStore,
  type BestiaryStatBlock,
  type CatalogEntry,
  type EggCatalogEntry,
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
// off -- the same "unrowed" gap the egg comment in aquariumEconomy.ts
// documents. `distribute_images.py`'s media-share pipeline is unusable here:
// it's a manual step on Silas's home network, not something CI or an agent
// session can write to. Bundling as ordinary Vite assets sidesteps that
// entirely -- committed to git (unlike the ignored public/images/**), built
// into a normal fingerprinted _nuxt/ URL, no infra dependency at all.
import screenFinaleArt from '~/assets/images/cthulhuquarium/cthulhuquarium-screen-finale.webp'
import setLastAquariumArt from '~/assets/images/cthulhuquarium/cthulhuquarium-set-last-aquarium.webp'

/* Fixed logical resolution; CSS scales it to the host width so the canvas
   survives phone widths without its own breakpoint logic. */
const STAGE_WIDTH = 640
const STAGE_HEIGHT = 360

const MOTE_RADIUS = 9
const FOOD_FALL_SPEED = 70
/* Caps how many motes one settled tick can spawn at once -- a long-idle
   catch-up shouldn't paper the tank in coins, just show a satisfying handful. */
const MAX_MOTE_BATCH = 6

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
// visual and nothing else: it drifts, and when it passes near an
// already-spawned mote it dismisses that mote the same way a tap does (the
// coins that mote represents were already credited by the tick that spawned
// it) -- it must never award coins or spawn a mote of its own.
const ROAMING_COLLECTOR_SET_KIND = 'roaming_collector'
const COLLECTOR_SPEED = 30
const COLLECTOR_RADIUS = 16

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

type Swimmer = {
  stockId: number
  monsterId: number
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  profile: BehaviorProfile
}

type Mote = { x: number; y: number; drift: number }
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
const userStore = useUserStore()
const username = computed(() => userStore.username)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const visibilitySaving = ref(false)

// Display-only mirror of server/utils/aquariumEconomy.ts's TICK_SECONDS,
// for the welcome-back panel's duration line only -- never used to compute
// coins or anything the server doesn't already own. Same "must be kept in
// sync by hand" discipline that file's own header comment documents for
// its relationship to economy.yaml.
const DISPLAY_TICK_SECONDS = 60

// cthulhuquarium/t-041: the "your eggs" inventory tile has no catalog entry
// to read an icon off of (TankEgg carries no `icon` field, unlike
// EggCatalogEntry) -- mirrors aquariumEconomy.ts's EGG_ICON by hand, same
// "must be kept in sync" discipline as DISPLAY_TICK_SECONDS above.
const EGG_ICON = '🥚'

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
const motes = ref<Mote[]>([])
const feed = ref<FeedCreature[]>([])
const collector = ref<Collector | null>(null)
const showBestiary = ref(false)
const showSets = ref(false)
const showDecor = ref(false)
const showEggs = ref(false)

// Breeding (cthulhuquarium/t-055): pendingBreedParentId is the "choose"
// half of the choose-then-click-to-commit flow -- set by clicking Breed on
// one tank card, cleared by clicking it again or by confirming/cancelling
// the pairing below. breedConfirmPair is the "click to commit" half: set
// once a second, same-species card is chosen, cleared once the confirm
// dialog closes either way.
const pendingBreedParentId = ref<number | null>(null)
const breedConfirmPair = ref<{ a: TankStock; b: TankStock } | null>(null)

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

function canUnlock(entry: CatalogEntry): boolean {
  return (
    tankStore.coins >= entry.cost &&
    tankStore.occupantSize + (entry.size ?? 1) <= tankStore.sizeCap
  )
}

// cthulhuquarium/t-055: the currently-armed first parent, if any -- looked
// up live off tankStore.stock (rather than cached at click time) so a sell
// or feed elsewhere in the tank while a pairing is pending can't leave this
// pointing at stale data.
const pendingBreedParent = computed<TankStock | null>(
  () =>
    tankStore.stock.find((entry) => entry.id === pendingBreedParentId.value) ??
    null,
)

function onBreedClick(entry: TankStock): void {
  if (pendingBreedParentId.value === entry.id) {
    pendingBreedParentId.value = null
    return
  }
  const pending = pendingBreedParent.value
  if (pending && pending.monsterId === entry.monsterId) {
    breedConfirmPair.value = { a: pending, b: entry }
    pendingBreedParentId.value = null
    return
  }
  pendingBreedParentId.value = entry.id
}

// Same capacity/coin math the confirm button's disabled state and the
// server's own breedFishForUser check independently -- this is only so the
// button doesn't invite a click the server would reject anyway; the server
// re-checks both for real regardless (aquarium.ts never trusts the client).
const canConfirmBreed = computed(() => {
  const pair = breedConfirmPair.value
  if (!pair) return false
  return (
    tankStore.coins >= pair.a.Monster.breedCost &&
    tankStore.occupantSize + (pair.a.Monster.size ?? 1) <= tankStore.sizeCap
  )
})

async function onConfirmBreed(): Promise<void> {
  const pair = breedConfirmPair.value
  if (!pair) return
  breedConfirmPair.value = null
  await tankStore.breed(pair.a.id, pair.b.id)
}

// t-031: compact "best seen" line for the Ichthyonomicon. Only ever called
// with a non-null block (the template guards on `entry.bestStats`), so a
// still-null individual stat here means "never recorded," not "zero."
const BEST_STAT_LABELS: Record<keyof BestiaryStatBlock, string> = {
  charm: 'CHA',
  empathy: 'EMP',
  grace: 'GRA',
  luck: 'LUC',
  might: 'MGT',
  wits: 'WIT',
}

function formatBestStats(stats: BestiaryStatBlock): string {
  return (Object.keys(BEST_STAT_LABELS) as Array<keyof BestiaryStatBlock>)
    .filter((key) => stats[key] != null)
    .map((key) => `${BEST_STAT_LABELS[key]} ${stats[key]}`)
    .join(' · ')
}

// t-059: THIS individual's own rolled stats live on TankStock as
// stat<Name> (t-029/t-055), not as a BestiaryStatBlock -- reshape once here
// so the display can reuse formatBestStats/BEST_STAT_LABELS unchanged
// instead of a second formatting scheme.
function tankStockStatsLine(entry: TankStock): string | null {
  const stats: BestiaryStatBlock = {
    charm: entry.statCharm,
    empathy: entry.statEmpathy,
    grace: entry.statGrace,
    luck: entry.statLuck,
    might: entry.statMight,
    wits: entry.statWits,
  }
  if (Object.values(stats).every((value) => value == null)) return null
  return formatBestStats(stats)
}

function spawnSwimmer(stock: TankStock): Swimmer {
  const profile = behaviorProfile(stock.Monster.behavior)
  return {
    stockId: stock.id,
    monsterId: stock.monsterId,
    x: Math.random() * STAGE_WIDTH,
    y:
      STAGE_HEIGHT *
      (profile.vBand[0] +
        Math.random() * (profile.vBand[1] - profile.vBand[0])),
    vx: Math.random() < 0.5 ? -profile.speed : profile.speed,
    vy: 0,
    phase: Math.random() * Math.PI * 2,
    profile,
  }
}

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

function drawFish(
  context: CanvasRenderingContext2D,
  swimmer: Swimmer,
  hunger: number,
  monster: TankStock['Monster'],
) {
  const hue = monster.hue ?? hashHue(monster.slug)
  const facing = swimmer.vx >= 0 ? 1 : -1
  const size = 10 + (monster.size ?? 1) * 4
  // Hungry occupants desaturate and dim rather than vanishing, so a
  // neglected tank reads as neglected at a glance.
  const life = 0.3 + (hunger / 100) * 0.7

  context.save()
  context.translate(swimmer.x, swimmer.y)
  context.scale(facing, 1)
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

// cthulhuquarium/t-017: decor icons drawn as simple glyphs (same "hand-drawn
// shapes, not art" precedent t-015 documents for fish before its own art
// pass). Kept local rather than read from tankStore.decorCatalog so decor
// renders correctly even before the Decorate panel has ever been opened
// (the catalog loads lazily, same as sets/bestiary) -- must stay in sync
// with server/utils/aquariumEconomy.ts's DECOR_CATALOG icons by hand, same
// convention as everywhere else the client mirrors a server-owned constant.
const DECOR_ICONS: Record<string, string> = {
  pebble_bed: '🪨',
  driftwood: '🪵',
  coral_spire: '🪸',
  sunken_chest: '🧰',
  glow_kelp: '🌿',
  ceramic_ruin: '🏺',
}

function decorIcon(kind: string): string {
  return DECOR_ICONS[kind] ?? '❖'
}

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
// motes get for their own hit test.
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
  waterGradient.addColorStop(0, '#0d2b2a')
  waterGradient.addColorStop(1, '#04100f')
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
  context.fillStyle = getWaterGradient(context)
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

  // Debris tints the water -- ambient only, no interaction wired here.
  const debris = tankStore.tank?.debrisLevel ?? 0
  if (debris > 0) {
    context.fillStyle = `rgba(120, 110, 70, ${Math.min(0.22, debris / 400)})`
    context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
  }

  context.fillStyle = 'rgba(150, 255, 210, 0.06)'
  context.beginPath()
  context.moveTo(STAGE_WIDTH * 0.35, 0)
  context.lineTo(STAGE_WIDTH * 0.62, 0)
  context.lineTo(STAGE_WIDTH * 0.78, STAGE_HEIGHT)
  context.lineTo(STAGE_WIDTH * 0.2, STAGE_HEIGHT)
  context.closePath()
  context.fill()

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

  for (const swimmer of swimmers.value) {
    const entry = stockFor(swimmer)
    if (!entry) continue
    drawFish(context, swimmer, entry.hunger, entry.Monster)
  }

  for (const mote of motes.value) {
    context.fillStyle = 'rgba(255, 236, 160, 0.85)'
    context.beginPath()
    context.arc(mote.x, mote.y, MOTE_RADIUS, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = 'rgba(255, 236, 160, 0.35)'
    context.lineWidth = 2
    context.beginPath()
    context.arc(mote.x, mote.y, MOTE_RADIUS + 4, 0, Math.PI * 2)
    context.stroke()
  }

  if (collector.value) drawCollector(context, collector.value)

  if (tankStore.finaleTriggered) drawFinaleReframe(context)
}

function step(delta: number) {
  syncSwimmers()

  for (const swimmer of swimmers.value) {
    const target = feed.value[0]
    if (target && !swimmer.profile.stationary) {
      // Fish path toward food rather than ignoring it.
      const dx = target.x - swimmer.x
      const dy = target.y - swimmer.y
      const distance = Math.hypot(dx, dy) || 1
      swimmer.x += (dx / distance) * 55 * swimSpeedMultiplier.value * delta
      swimmer.y += (dy / distance) * 55 * swimSpeedMultiplier.value * delta
      swimmer.vx = dx >= 0 ? Math.abs(swimmer.vx) : -Math.abs(swimmer.vx)
    } else {
      const [minY, maxY] = swimmer.profile.vBand
      const bandTop = STAGE_HEIGHT * minY
      const bandBottom = STAGE_HEIGHT * maxY
      swimmer.phase += delta
      swimmer.x += swimmer.vx * swimSpeedMultiplier.value * delta
      swimmer.y += Math.sin(swimmer.phase) * swimmer.profile.wobble * delta
      if (swimmer.profile.wallCling) {
        // Clings near whichever wall it's closest to rather than crossing
        // the whole tank.
        const nearLeft = swimmer.x < STAGE_WIDTH / 2
        swimmer.x += ((nearLeft ? 30 : STAGE_WIDTH - 30) - swimmer.x) * 0.02
      }
      if (swimmer.x < 20 || swimmer.x > STAGE_WIDTH - 20) swimmer.vx *= -1
      swimmer.y = Math.min(Math.max(swimmer.y, bandTop), bandBottom)
    }
  }

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

  motes.value = motes.value.filter((mote) => {
    mote.y -= 26 * delta
    mote.x += mote.drift * delta
    return mote.y > 10
  })

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

  // Dismisses the nearest passing mote exactly like a tap would -- no coins
  // change hands here, settleTick already credited them when the mote spawned.
  const index = motes.value.findIndex(
    (mote) => Math.hypot(mote.x - bot.x, mote.y - bot.y) <= COLLECTOR_RADIUS,
  )
  if (index !== -1) {
    motes.value.splice(index, 1)
    bot.collectFlash = 1
  }
}

function loop(timestamp: number) {
  const context = canvasRef.value?.getContext('2d')
  if (!context) return
  // Clamp the delta so a backgrounded tab returning does not simulate one
  // giant step -- coins/hunger are settled server-side, not by this loop.
  const delta = Math.min((timestamp - lastFrameAt) / 1000 || 0, 0.1)
  lastFrameAt = timestamp
  step(delta)
  render(context)
  frame = window.requestAnimationFrame(loop)
}

function spawnMotes(coinsEarned: number) {
  const count = Math.min(
    MAX_MOTE_BATCH,
    Math.max(1, Math.round(coinsEarned / 5)),
  )
  for (let index = 0; index < count; index += 1) {
    motes.value.push({
      x: 30 + Math.random() * (STAGE_WIDTH - 60),
      y: STAGE_HEIGHT - 20 - Math.random() * 30,
      drift: (Math.random() - 0.5) * 14,
    })
  }
}

// cthulhuquarium/t-017: the canvas now handles three distinct gestures
// through pointer events (unifying mouse+touch, unlike the old click-only
// handler) --
//   1. a shop item is pending placement: any tap purchases and places it
//      here, then clears the pending choice (see the placement banner).
//   2. the tap lands on an already-placed decor icon: start a drag, tracked
//      through pointermove and committed on pointerup via moveDecor.
//   3. neither of the above: fall back to the original behavior, dismissing
//      a tapped coin mote.
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
  const hitRadius = touchHitRadius(
    MOTE_RADIUS + 8,
    STAGE_WIDTH,
    bounds?.width ?? STAGE_WIDTH,
  )
  const index = motes.value.findIndex(
    (mote) => Math.hypot(mote.x - coords.x, mote.y - coords.y) <= hitRadius,
  )
  // Tapping a mote just dismisses it -- the coins it represents were
  // already credited by the tick settlement that spawned it.
  if (index !== -1) motes.value.splice(index, 1)
}

function onCanvasPointerMove(event: PointerEvent) {
  if (draggingDecorId.value === null) return
  const coords = stageCoordsFromEvent(event)
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

async function onFeed() {
  const target = tankStore.hungriest
  if (!target) return
  const ok = await tankStore.feed(target.id)
  if (!ok) return
  const swimmer = swimmers.value.find((entry) => entry.stockId === target.id)
  feed.value.push({
    x: swimmer?.x ?? 60 + Math.random() * (STAGE_WIDTH - 120),
    y: 12,
    phase: Math.random() * Math.PI * 2,
    lean: (Math.random() - 0.5) * 1.6,
  })
}

async function pollTick() {
  const earned = await tankStore.settleTick()
  if (earned > 0) spawnMotes(earned)
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

function onToggleEggs() {
  showEggs.value = !showEggs.value
  if (showEggs.value && !tankStore.eggCatalog.length) {
    void tankStore.loadEggCatalog()
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

// cthulhuquarium/t-041: mirrors the server's capacity math
// (currentReservedSize) so a disabled Buy button agrees with what the
// server will actually accept -- an unhatched egg's own size already
// counts against tankStore.occupantSize (see that computed's own comment).
function canBuyEgg(entry: EggCatalogEntry): boolean {
  return (
    tankStore.coins >= entry.cost &&
    tankStore.occupantSize + entry.size <= tankStore.sizeCap
  )
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
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopLoops()
  // A click right before navigating away should still land instead of
  // being dropped along with the debounce timer.
  tankStore.flushCleanNow()
})
</script>
