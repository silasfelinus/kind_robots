<template>
  <div
    class="kr-surface relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl bg-[#141f24] text-[#f8edce]"
    data-layout="console-fixed"
  >
    <header
      class="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#a98b5b]/40 bg-[#302b25] px-2 py-2 sm:gap-3 sm:px-4"
    >
      <span class="hidden shrink-0 text-xl md:inline" aria-hidden="true"
        >🌿</span
      >
      <div class="min-w-0 w-full md:w-auto md:flex-1">
        <h2 class="truncate text-sm font-black tracking-tight sm:text-lg">
          Memory Dungeon
          <span class="font-normal text-[#d1c19c]">{{
            world.activeReality === 'e02'
              ? '/ The Other Marches'
              : '/ Briar Camp'
          }}</span>
        </h2>
        <p class="hidden text-xs text-[#d1c19c] lg:block">
          {{
            world.activeReality === 'e02'
              ? 'The same place tells a different story.'
              : 'Remember matching pictures to reveal the world.'
          }}
        </p>
      </div>
      <span
        class="shrink-0 rounded-lg bg-[#1c201d] px-2 py-1 text-xs font-bold tabular-nums sm:px-3"
      >
        <span class="sm:hidden">Tries</span>
        <span class="hidden sm:inline">Attempts</span>
        {{
          world.activeReality === 'e02'
            ? world.dark.attempts
            : world.state.attempts
        }}
      </span>
      <button
        v-if="world.canEnterDarkBriar && world.activeReality === 'e01'"
        type="button"
        class="shrink-0 rounded-lg border border-[#d7a5ee] bg-[#483759] px-2 py-1.5 text-xs font-bold text-[#fff1da] hover:bg-[#62496d]"
        @click="world.enterDarkBriar()"
      >
        The reflection
      </button>
      <button
        v-if="world.campaign.completed.includes('e02')"
        type="button"
        class="btn btn-sm border-[#d7ba85] bg-[#4a5968] text-[#fff0d7]"
        data-testid="memory-enter-morrow-earth"
        @click="emit('earth')"
      >
        Morrow's Earth
      </button>
      <button
        v-if="world.campaign.completed.includes('e06')"
        type="button"
        class="btn btn-sm btn-warning"
        data-testid="memory-enter-hoshimori"
        @click="emit('hoshimori')"
      >
        Lantern Village
      </button>
      <button
        v-if="world.campaign.completed.includes('e07')"
        type="button"
        class="btn btn-sm btn-error"
        data-testid="memory-enter-hoshimori-night"
        @click="emit('hoshimori-night')"
      >
        The Shut Doors
      </button>
      <span
        v-if="world.activeReality === 'e01'"
        class="shrink-0 text-xs"
        :aria-label="`${world.state.hearts} hearts`"
      >
        ❤️ {{ world.state.hearts }}
      </span>
      <button
        ref="chronicleTrigger"
        type="button"
        class="shrink-0 rounded-lg border border-[#c7ac7a] bg-[#4d3e32] px-2 py-1.5 text-xs font-bold text-[#f8eaca] hover:bg-[#635044] focus-visible:outline-2 focus-visible:outline-[#ffe7ad]"
        :aria-label="`Open Earth Chronicle, ${world.earthPhotos.length} recovered photographs`"
        data-testid="memory-earth-chronicle-open"
        aria-haspopup="dialog"
        :aria-expanded="chronicleOpen"
        @click="chronicleOpen = true"
      >
        <span aria-hidden="true">◫</span>
        <span class="hidden sm:inline">Chronicle</span>
        <span class="font-mono">{{ world.earthPhotos.length }}</span>
      </button>
      <button
        v-if="world.activeReality === 'e01'"
        ref="questsTrigger"
        type="button"
        class="shrink-0 rounded-lg border border-[#a9b98c] bg-[#3a4733] px-2 py-1.5 text-xs font-bold text-[#f3f0d6] hover:bg-[#4d5c42] focus-visible:outline-2 focus-visible:outline-[#ecf7c8]"
        :aria-label="`Open Threads, ${questsTied} of ${world.briarQuests.length} side quests tied off`"
        data-testid="memory-quest-log-open"
        aria-haspopup="dialog"
        :aria-expanded="questsOpen"
        @click="questsOpen = true"
      >
        <span aria-hidden="true">❦</span>
        <span class="hidden sm:inline">Threads</span>
        <span class="font-mono">{{ questsTied }}</span>
      </button>
      <button
        ref="settingsTrigger"
        type="button"
        class="rounded-lg border border-[#9f875e] p-2 text-xs hover:bg-[#514b3d]"
        aria-label="Choose gallery and game settings"
        aria-haspopup="dialog"
        :aria-expanded="settingsOpen"
        @click="settingsOpen = !settingsOpen"
      >
        ⚙️
      </button>
      <button
        type="button"
        class="rounded-lg border border-[#9f875e] px-2 py-2 text-xs hover:bg-[#514b3d]"
        @click="emit('leave')"
      >
        Menu
      </button>
    </header>

    <memory-dungeon-earth-chronicle
      v-if="chronicleOpen"
      @close="chronicleOpen = false"
    />
    <memory-dungeon-quest-log v-if="questsOpen" @close="questsOpen = false" />

    <div
      v-if="settingsOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1617]/85 p-3 backdrop-blur-sm"
      @click.self="settingsOpen = false"
      @keydown.esc.prevent.stop="settingsOpen = false"
      @keydown="trapMemoryDialogTab($event, settingsDialog)"
    >
      <div
        ref="settingsDialog"
        role="dialog"
        aria-modal="true"
        aria-label="Memory Dungeon settings and checkpoints"
        tabindex="-1"
        data-testid="memory-settings-dialog"
        class="kr-scroll max-h-[min(88dvh,42rem)] w-[min(94vw,46rem)] overflow-y-auto overscroll-contain rounded-xl border-2 border-[#9f875e] bg-[#302b25] p-3 shadow-2xl sm:p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-bold"
            >Artwork for the current map and dungeon rooms</span
          >
          <button
            type="button"
            class="rounded border border-[#9f875e] px-2 py-1 text-xs"
            @click="settingsOpen = false"
          >
            Close
          </button>
        </div>
        <memory-dungeon-deck-selector
          :selected="world.deck"
          :mature-available="world.matureAvailable"
          :unlocked-realms="world.unlockedRealms"
          :realm-art-ready="world.realmArtReady"
          @change="world.selectDeck"
        />
        <fieldset class="mt-3 border-t border-[#9f875e]/50 pt-3">
          <legend class="px-2 text-sm font-bold">Playing card backs</legend>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="back in MEMORY_CARD_BACKS"
              :key="back.id"
              type="button"
              class="flex min-w-0 items-center gap-2 rounded-lg border-2 bg-[#182d32] p-2 text-left transition focus-visible:outline-2 focus-visible:outline-[#f6db9a]"
              :class="
                world.cardBack === back.id
                  ? 'border-[#ffe29a]'
                  : 'border-[#7b806b]'
              "
              :aria-pressed="world.cardBack === back.id"
              @click="world.selectCardBack(back.id)"
            >
              <span
                class="relative flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e3c78c] bg-[#354b48] text-xl text-[#f6db9a]"
                aria-hidden="true"
              >
                ✥
                <img
                  :src="back.path"
                  alt=""
                  class="absolute inset-0 h-full w-full object-cover"
                  @error="hideMissingMemoryCardBack"
                />
              </span>
              <span class="min-w-0 text-xs">
                <strong class="block text-sm">{{ back.name }}</strong>
                {{ back.description }}
              </span>
            </button>
          </div>
          <p class="mt-2 text-xs text-[#e4d0a8]">
            Card-back choices are saved separately from your expedition.
            Illustrated crests appear automatically when their Comfy artwork is
            delivered.
          </p>
        </fieldset>
        <fieldset class="mt-3 border-t border-[#9f875e]/50 pt-3">
          <legend class="px-2 text-sm font-bold">Expedition checkpoints</legend>
          <p class="mb-2 text-xs text-[#e4d0a8]">
            Three manual saves. Autosave and your collected Chronicle remain
            separate. Loading replaces the current expedition.
          </p>
          <div class="grid gap-2 sm:grid-cols-3">
            <div
              v-for="(checkpoint, index) in world.saveSlots"
              :key="index"
              class="min-w-0 rounded-lg border border-[#7b806b] bg-[#182d32] p-2"
            >
              <strong class="block text-xs">Slot {{ index + 1 }}</strong>
              <span class="block text-xs text-[#e4d0a8]">
                {{ checkpoint ? checkpointLabel(checkpoint.savedAt) : 'Empty' }}
              </span>
              <template v-if="checkpoint">
                <span class="mt-1 block text-xs font-semibold text-[#f6dfab]">
                  {{ memoryCheckpointPreview(checkpoint).location }}
                </span>
                <span class="block text-xs text-[#e4d0a8]">
                  {{ memoryCheckpointPreview(checkpoint).progress }}
                </span>
              </template>
              <div class="mt-2 flex gap-1">
                <button
                  type="button"
                  class="rounded border border-[#9f875e] px-2 py-1 text-xs hover:bg-[#514b3d]"
                  :aria-label="`Save checkpoint ${index + 1}${checkpoint ? ', overwrite existing save' : ''}`"
                  @click="saveSlot(index)"
                >
                  {{ checkpoint ? 'Overwrite' : 'Save' }}
                </button>
                <button
                  type="button"
                  class="rounded border border-[#9f875e] px-2 py-1 text-xs hover:bg-[#514b3d] disabled:opacity-40"
                  :disabled="!checkpoint"
                  :aria-label="`Load checkpoint ${index + 1}${checkpoint ? ', ' + memoryCheckpointPreview(checkpoint).location : ', empty'}`"
                  @click="loadSlot(index)"
                >
                  Load
                </button>
              </div>
            </div>
          </div>
          <p
            v-if="world.saveSlotMessage"
            role="status"
            class="mt-2 text-xs text-[#ffe09b]"
          >
            {{ world.saveSlotMessage }}
          </p>
        </fieldset>
        <p class="mt-2 text-xs text-[#e7d29e]">
          Selecting art refreshes unmatched cards immediately. Revealed terrain,
          completed pairs and attempts stay intact.
        </p>
        <p
          v-if="world.loading && world.mapMatching"
          role="status"
          class="mt-2 text-xs font-bold text-[#ffe09b]"
        >
          Loading images from the selected collection…
        </p>
        <p
          v-if="world.mapDeckError"
          role="alert"
          class="mt-2 rounded-lg border border-[#eead8c] bg-[#5c2826] p-2 text-sm font-semibold text-[#fff0d9]"
        >
          {{ world.mapDeckError }}
        </p>
        <button
          v-if="
            world.mapMatching && (world.deckNeedsRefresh || world.mapDeckError)
          "
          type="button"
          class="md-btn mt-2"
          :disabled="world.loading"
          @click="world.refreshMapDeck()"
        >
          Retry applying selected art
        </button>
        <button
          type="button"
          class="mt-1 rounded border border-[#9f875e] px-2 py-1 text-xs hover:bg-[#514b3d]"
          @click="restart"
        >
          Begin a new overworld run
        </button>
      </div>
    </div>

    <memory-dungeon-dark-briar-stage
      v-if="world.activeReality === 'e02' && !world.darkDuelActive"
      class="min-h-0 flex-1"
    />
    <div v-else-if="world.minefieldActive" class="min-h-0 flex-1">
      <memory-dungeon-minefield-stage />
    </div>
    <div
      v-else-if="world.state.room === 'map'"
      class="md-map-stage relative min-h-0 flex-1 overflow-hidden p-2"
      data-testid="memory-world-console-stage"
    >
      <div class="md-map-layout">
        <div class="md-map-viewport">
          <div
            class="md-overworld-map relative aspect-square overflow-hidden rounded-lg border-2 border-[#aa9266] bg-[#253c35] shadow-2xl"
            aria-label="Briar Camp eight by eight memory overworld"
          >
            <img
              v-if="!mapArtFailed"
              src="/images/memory-dungeon/backdrops/briar-overworld.webp"
              alt=""
              class="absolute inset-0 h-full w-full object-cover"
              @error="mapArtFailed = true"
            />
            <div
              v-else
              class="absolute inset-0 bg-cover bg-center"
              style="background-image: url('/memory-dungeon/briar-camp.svg')"
              role="img"
              aria-label="Briar Camp: a woodland map with stone paths, a bridge, ferns and a river. Individual locations are discovered through the overlay."
            ></div>
            <div class="absolute inset-0 grid grid-cols-8 grid-rows-8">
              <div
                v-for="tile in tiles"
                :key="tile.key"
                class="relative min-h-0 min-w-0"
              >
                <button
                  v-if="
                    world.mapMatching &&
                    world.mapCardAt(tile.key) &&
                    !world.state.revealed.includes(tile.key)
                  "
                  type="button"
                  class="md-card-container relative h-full w-full border border-[#bba16e]/75 focus-visible:outline-2 focus-visible:outline-[#fff0a9]"
                  :disabled="
                    world.turnLocked ||
                    world.loading ||
                    world.deckNeedsRefresh ||
                    !!world.mapDeckError ||
                    world.mapCardAt(tile.key)?.flipped
                  "
                  :aria-label="
                    world.mapCardAt(tile.key)?.flipped
                      ? 'Revealed memory picture; find its matching twin'
                      : 'Flip map memory card'
                  "
                  @click="world.pickMapCard(tile.key)"
                >
                  <span
                    class="md-card-inner"
                    :class="{ flipped: world.mapCardAt(tile.key)?.flipped }"
                  >
                    <span
                      class="md-card-back flex items-center justify-center bg-[#263951] text-[clamp(14px,2vw,28px)] text-[#e4cf9c]"
                      aria-hidden="true"
                    >
                      ✥
                      <img
                        :key="world.cardBack"
                        :src="memoryCardBackPath(world.cardBack)"
                        class="absolute inset-0 h-full w-full object-cover"
                        alt=""
                        draggable="false"
                        @error="hideMissingMemoryCardBack"
                      />
                    </span>
                    <img
                      class="md-card-front h-full w-full bg-[#162733]"
                      :src="world.mapCardAt(tile.key)?.image"
                      alt="Picture to match"
                      draggable="false"
                    />
                  </span>
                </button>
                <button
                  v-else-if="world.state.revealed.includes(tile.key)"
                  type="button"
                  class="group relative h-full w-full outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-[#fff0a9]"
                  :class="{
                    'bg-cyan-200/45 ring-[3px] ring-inset ring-cyan-50/95 shadow-[inset_0_0_16px_#e0fbff]':
                      progressFor(tile.key) === 'unvisited',
                    'bg-amber-300/50 ring-[3px] ring-inset ring-amber-100/95 shadow-[inset_0_0_18px_#fef08a]':
                      progressFor(tile.key) === 'unfinished',
                    'bg-emerald-950/15 ring-2 ring-inset ring-emerald-100/85':
                      progressFor(tile.key) === 'complete',
                    'outline outline-2 outline-[#fff0a9]':
                      world.state.player === tile.key,
                  }"
                  :data-progress="progressFor(tile.key)"
                  :aria-label="`Travel to square ${tile.x}, ${tile.y}${sites[tile.key]?.name ? ', ' + sites[tile.key]?.name : ''}; ${progressLabel(tile.key)}`"
                  @click="world.walk(tile.key)"
                >
                  <memory-dungeon-action-beacon
                    v-if="tileNeedsAttention(tile.key)"
                  />
                  <span
                    v-if="sites[tile.key]"
                    class="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#162522]/75 px-0.5 text-[clamp(11px,1.7vw,24px)] leading-tight shadow-lg"
                    :title="sites[tile.key]?.name"
                  >
                    {{ siteSymbol(sites[tile.key]?.kind) }}
                  </span>
                  <span
                    class="absolute right-0 top-0 z-20 rounded-bl bg-[#142521]/85 px-0.5 text-[clamp(10px,1.3vw,14px)] font-black leading-tight shadow"
                    :class="
                      progressFor(tile.key) === 'complete'
                        ? 'text-emerald-200'
                        : progressFor(tile.key) === 'unfinished'
                          ? 'text-amber-200'
                          : 'text-sky-200'
                    "
                    aria-hidden="true"
                    >{{
                      progressFor(tile.key) === 'complete'
                        ? '✓'
                        : progressFor(tile.key) === 'unfinished'
                          ? '!'
                          : '○'
                    }}</span
                  >
                  <span
                    v-if="world.state.player === tile.key"
                    class="absolute bottom-0.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#f3d177] px-1 text-[clamp(10px,1.5vw,18px)] leading-tight text-[#1b2c22] shadow"
                    aria-hidden="true"
                    >🧭</span
                  >
                </button>
                <div
                  v-else-if="crossMapKeys.includes(tile.key)"
                  class="relative h-full w-full border border-[#a98b5b]/50 bg-[#28283f]/95"
                >
                  <button
                    v-if="world.state.waveIndex === 3 && !world.mapMatching"
                    type="button"
                    class="h-full w-full overflow-hidden rounded border border-amber-200/80 shadow-inner focus-visible:outline-2 focus-visible:outline-white"
                    :aria-label="`Examine cross-world sigil: ${crossMapPuzzles[tile.key]?.title ?? 'Mystery'}`"
                    @click="world.examineCrossMapSigil(tile.key)"
                  >
                    <img
                      :src="crossMapImage(tile.key)"
                      alt="A unique cross-world memory sigil"
                      class="h-full w-full object-cover"
                    />
                    <span
                      class="absolute bottom-0 right-0 rounded bg-[#201a2f] px-0.5 text-[11px]"
                      aria-hidden="true"
                      >🔒</span
                    >
                  </button>
                  <span
                    v-else
                    class="flex h-full items-center justify-center text-sm text-[#c5b28a]/50"
                    aria-label="A mysterious unrevealed seal awaits"
                    >✧</span
                  >
                </div>
                <div
                  v-else
                  class="h-full w-full border border-[#55677b]/60 bg-[#0b1521]/[0.99] shadow-[inset_0_0_16px_#071017]"
                  aria-hidden="true"
                >
                  <span
                    class="flex h-full items-center justify-center text-[clamp(8px,1.4vw,18px)] text-[#b29c76]/20"
                    >✦</span
                  >
                </div>
              </div>
            </div>
            <div
              class="pointer-events-none absolute bottom-1 left-2 rounded-md bg-[#1d2a24]/90 px-2 py-1 text-[10px] font-bold text-[#f5e7c7]"
            >
              {{ completedCount }} cleared ·
              {{ world.state.revealed.length }}/60 revealed
            </div>
          </div>
        </div>

        <aside
          class="md-encounter-pane flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[#b69961] bg-[#f1dfba]/95 p-3 text-[#322819] shadow-xl backdrop-blur-sm sm:p-4"
          aria-label="Map location and encounter information"
        >
          <div
            class="mb-2 flex shrink-0 flex-wrap items-center gap-2 text-xs font-bold text-[#735128]"
          >
            <span>Round {{ world.state.waveIndex + 1 }}/4</span>
            <span v-if="world.mapMatching"
              >Pairs {{ world.mapPairsMatched }}/{{ world.waveSize / 2 }}</span
            >
            <span v-else>Explore the map</span>
            <span v-if="!world.mapMatching" class="ml-auto whitespace-nowrap">
              <span class="text-sky-800">○ Unvisited</span>
              <span class="text-amber-800">! Unfinished</span>
              <span class="text-emerald-800">✓ Clear</span>
            </span>
          </div>
          <button
            v-if="world.mapMatching && !world.state.mapCards.length"
            type="button"
            class="md-btn mb-2 w-full"
            :disabled="world.loading"
            @click="world.prepareWave()"
          >
            {{
              world.loading
                ? 'Preparing picture cards…'
                : 'Retry loading picture cards'
            }}
          </button>
          <button
            v-if="!world.mapMatching && world.state.waveIndex < 3"
            type="button"
            class="md-btn mb-2 w-full"
            :disabled="world.loading"
            @click="world.nextWave()"
          >
            Begin next memory round · {{ nextWaveCount }} cards
          </button>
          <div
            class="md-scene-overview"
            data-testid="memory-world-encounter-display"
          >
            <div
              class="md-scene-art"
              aria-label="Illustrated image detail for the current memory or map location"
            >
              <img
                v-if="world.mapMatching && world.activeMapCard"
                :src="world.activeMapCard.image"
                class="h-full w-full bg-[#19322f] object-contain"
                alt="Enlarged picture from the selected memory card"
                draggable="false"
              />
              <img
                v-else-if="world.inspectedSigil"
                class="h-full w-full bg-[#162733] object-contain"
                :src="crossMapImage(world.inspectedSigil)"
                alt="Enlarged illustration of the inspected regional seal"
                draggable="false"
              />
              <img
                v-else-if="
                  !world.mapMatching &&
                  currentIllustrationPath &&
                  !sceneArtFailed
                "
                :key="currentIllustrationPath"
                :src="currentIllustrationPath"
                class="h-full w-full object-cover"
                :alt="`Illustration of ${world.activeScene?.title ?? world.selectedSite?.name ?? 'Briar Marches'}`"
                draggable="false"
                @error="sceneArtFailed = true"
              />
              <div
                v-else-if="!world.mapMatching"
                class="h-full w-full bg-cover"
                :style="currentSceneStyle"
                role="img"
                :aria-label="`Illustration unavailable for ${world.selectedSite?.name ?? 'the selected map square'}; showing the Briar map detail`"
              ></div>
              <div v-else class="md-scene-mystery" aria-hidden="true">✥</div>
              <span class="md-scene-art-label">
                {{
                  world.mapMatching
                    ? 'Memory image'
                    : world.inspectedSigil
                      ? 'Paired regional sigil'
                      : 'Map detail'
                }}
              </span>
            </div>
            <div
              class="md-scene-copy kr-scroll"
              data-testid="memory-world-choice-column"
            >
              <p
                class="text-xs font-black uppercase tracking-widest text-[#795a32]"
              >
                {{
                  world.mapMatching
                    ? `Reveal ${world.state.waveIndex + 1} of 4`
                    : 'Current location'
                }}
              </p>
              <h3
                class="font-serif text-xl font-black leading-tight sm:text-2xl"
              >
                {{
                  world.mapMatching
                    ? 'The Whispering Fog'
                    : (world.activeScene?.title ??
                      world.selectedSite?.name ??
                      'The Crooked Trail')
                }}
              </h3>
              <p
                class="md-scene-status text-sm leading-snug sm:text-base"
                role="status"
              >
                {{
                  world.mapMatching
                    ? world.state.status
                    : world.currentSceneText || world.state.status
                }}
              </p>
              <p
                v-if="
                  !world.mapMatching &&
                  world.currentSceneText &&
                  world.currentSceneText !== world.state.status
                "
                class="text-xs font-semibold text-[#805023]"
                role="status"
              >
                {{ world.state.status }}
              </p>
              <p
                v-if="world.mapMatching && world.activeMapCard"
                class="text-xs font-semibold text-[#775b3c]"
              >
                Find the matching picture to reveal two squares.
              </p>
              <div
                v-if="
                  !world.mapMatching &&
                  (world.selectedSite || world.activeScene)
                "
                class="md-encounter-actions mt-2 flex min-h-0 shrink-0 flex-wrap items-start gap-2"
              >
                <template
                  v-if="
                    world.activeScene &&
                    !world.state.sceneChoices[world.activeSiteKey]
                  "
                >
                  <button
                    v-for="choice in world.activeScene.choices"
                    :key="choice.id"
                    type="button"
                    class="md-btn md-story-choice"
                    :disabled="!canChooseBriarScene(choice, world.state)"
                    @click="world.chooseScene(choice.id)"
                  >
                    {{ choice.label }}
                  </button>
                </template>
                <span
                  v-else-if="world.activeScene"
                  class="text-xs font-bold text-emerald-900"
                  >✓ Story decision remembered</span
                >
                <button
                  v-if="world.selectedSite?.kind === 'merchant'"
                  type="button"
                  class="md-btn"
                  :disabled="world.state.wildflowers < 1"
                  @click="world.buyLantern()"
                >
                  Buy Lantern (1 🌼)
                </button>
                <button
                  v-if="
                    world.selectedSite?.kind === 'chest' &&
                    !world.state.chestClaims.includes(world.state.player)
                  "
                  type="button"
                  class="md-btn"
                  @click="world.claimChest()"
                >
                  Open chest
                </button>
                <span
                  v-if="
                    world.selectedSite?.kind === 'chest' &&
                    world.state.chestClaims.includes(world.state.player)
                  "
                  class="text-xs font-bold"
                  >✓ Chest claimed</span
                >
                <button
                  v-if="world.selectedSite?.kind === 'dungeon'"
                  type="button"
                  class="md-btn"
                  :disabled="world.loading"
                  @click="world.startEncounter('dungeon')"
                >
                  {{
                    world.loading ? 'Loading gallery…' : 'Enter Rootbound Vault'
                  }}
                </button>
                <button
                  v-if="
                    world.selectedSite?.kind === 'enemy' &&
                    !world.state.completedEncounters.includes(
                      world.state.player,
                    )
                  "
                  type="button"
                  class="md-btn"
                  :disabled="world.loading"
                  @click="
                    world.startEncounter(
                      world.state.player === '5,5' ? 'sprite' : 'patrol',
                    )
                  "
                >
                  {{ world.loading ? 'Loading…' : 'Accept memory duel' }}
                </button>
                <button
                  v-if="
                    world.selectedSite?.kind === 'gate' &&
                    world.hasChime &&
                    !world.state.gateOpened
                  "
                  type="button"
                  class="md-btn"
                  @click="world.openGate()"
                >
                  Ring Bramble Chime
                </button>
                <button
                  v-if="
                    world.selectedSite?.kind === 'gate' &&
                    world.state.gateOpened
                  "
                  type="button"
                  class="md-btn border-[#a26fb0] bg-[#64476f]"
                  @click="world.enterDarkBriar()"
                >
                  Enter the changed forest
                </button>
                <template
                  v-if="
                    world.selectedSite?.kind === 'puzzle' &&
                    !world.state.puzzleSolved
                  "
                >
                  <button
                    type="button"
                    class="md-btn"
                    @click="world.enterRune('leaf')"
                  >
                    🍃 Leaf
                  </button>
                  <button
                    type="button"
                    class="md-btn"
                    @click="world.enterRune('sun')"
                  >
                    ☀️ Sun
                  </button>
                  <span class="w-full text-xs"
                    >{{ world.runeInput.length }}/3 runes</span
                  >
                </template>
                <template
                  v-if="
                    world.selectedSite?.kind === 'puzzle' &&
                    world.state.puzzleSolved
                  "
                >
                  <span class="w-full text-xs font-bold"
                    >✓ Stones solved · Hidden archive unlocked</span
                  >
                  <button
                    type="button"
                    class="md-btn"
                    @click="world.openMinefield(8)"
                  >
                    Enter the 8×8 Minefield Archive
                  </button>
                  <button
                    v-if="world.state.waveIndex >= 2"
                    type="button"
                    class="md-btn"
                    @click="world.openMinefield(10)"
                  >
                    Enter the 10×10 Deep Archive
                  </button>
                </template>
              </div>
              <button
                v-if="world.earthPhotos.length"
                type="button"
                class="mt-2 rounded-lg border border-[#a68958]/80 bg-[#f8e8cb] px-3 py-2 text-xs font-bold text-[#4c3928] hover:bg-[#e6d0ad]"
                @click="chronicleOpen = true"
              >
                Open the Earth Chronicle ·
                {{ world.earthPhotos.length }} fragments
              </button>
            </div>
          </div>
          <p
            v-if="world.mapDeckError"
            role="alert"
            class="md-scene-alert mt-2 rounded-lg border border-[#bd6651] bg-[#fbe5da] p-2 text-sm font-bold text-[#682821]"
          >
            {{ world.mapDeckError }}
          </p>
          <button
            v-if="world.mapMatching && world.deckNeedsRefresh && !world.loading"
            type="button"
            class="md-btn mt-2"
            @click="world.refreshMapDeck()"
          >
            Retry loading selected gallery
          </button>

          <div
            class="md-encounter-inventory mt-auto flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#bda47b] pt-2 text-sm font-semibold"
          >
            <span>🌼 {{ world.state.wildflowers }}</span>
            <span>🏮 {{ world.state.lanterns }}</span>
            <span
              >🔔 {{ world.hasChime ? 'Chime found' : 'Chime missing' }}</span
            >
          </div>
        </aside>
      </div>
    </div>

    <memory-dungeon-house-stage
      v-else-if="world.state.room === 'house'"
      class="min-h-0 flex-1"
    />
    <div
      v-else
      class="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#536b4e,#1b242b_75%)] p-3"
    >
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-lg font-black">{{ roomTitle }}</h3>
          <p class="text-xs text-[#dccca9]">{{ world.state.status }}</p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!world.state.combat"
            type="button"
            class="rounded-lg border border-[#c4aa72] bg-[#342e2a] px-3 py-2 text-xs font-bold"
            :disabled="world.turnLocked"
            @click="world.peekPair()"
          >
            🏮 Peek ({{ world.state.lanterns }})
          </button>
          <button
            type="button"
            class="rounded-lg border border-[#c4aa72] bg-[#342e2a] px-3 py-2 text-xs font-bold"
            @click="world.leaveRoom()"
          >
            Retreat to map
          </button>
        </div>
      </div>
      <template v-if="world.state.combat">
        <memory-dungeon-combat-board class="mt-2" />
        <button
          v-if="world.roomComplete"
          type="button"
          :disabled="world.turnLocked || world.loading"
          class="mx-auto mt-2 shrink-0 rounded-lg bg-[#f2d68f] px-4 py-2 font-black text-[#2b271b]"
          @click="world.finishRoom()"
        >
          Claim victory ✓
        </button>
      </template>
      <div
        v-else
        class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3"
      >
        <div
          class="grid aspect-square max-h-full w-full max-w-[min(100%,65vh)] grid-cols-4 gap-2 sm:gap-3"
        >
          <button
            v-for="card in world.state.cards"
            :key="card.id"
            type="button"
            class="md-card-container relative aspect-square min-h-0 min-w-0 overflow-hidden rounded-xl border-2 border-[#c1a56f] shadow-xl hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white"
            :class="card.matched ? 'border-[#b6dc88] opacity-65' : ''"
            :disabled="
              card.flipped ||
              card.matched ||
              world.turnLocked ||
              world.roomComplete
            "
            :aria-label="
              card.flipped || card.matched
                ? 'Revealed gallery image'
                : 'Reveal memory image'
            "
            @click="world.pickCard(card.id)"
          >
            <span
              class="md-card-inner"
              :class="{ flipped: card.flipped || card.matched }"
            >
              <span
                class="md-card-back bg-[#29384b] text-3xl text-[#dec28a]"
                aria-hidden="true"
              >
                ✦
                <img
                  :key="world.cardBack"
                  :src="memoryCardBackPath(world.cardBack)"
                  class="absolute inset-0 h-full w-full object-cover"
                  alt=""
                  draggable="false"
                  @error="hideMissingMemoryCardBack"
                />
              </span>
              <img
                class="md-card-front"
                :src="card.image"
                alt="Selected gallery art"
                draggable="false"
              />
            </span>
          </button>
        </div>
        <div
          class="flex shrink-0 items-center gap-4 rounded-lg bg-[#172120]/85 px-4 py-2 text-sm"
        >
          <span
            >Pairs {{ world.matchedPairs }}/{{
              world.state.cards.length / 2
            }}</span
          >
          <span>Mistakes {{ world.state.roomMisses }}/3</span>
          <button
            v-if="world.roomComplete"
            type="button"
            :disabled="world.turnLocked || world.loading"
            class="rounded-lg bg-[#f2d68f] px-3 py-2 font-black text-[#2b271b]"
            @click="world.finishRoom()"
          >
            {{
              world.state.roomId === 'vault-1'
                ? 'Continue deeper →'
                : 'Claim victory ✓'
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { trapMemoryDialogTab } from '~/utils/memoryDungeon/dialogFocus'
import { memoryCheckpointPreview } from '~/utils/memoryDungeon/saveSlots'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import {
  BRIAR_SITES,
  BRIAR_TILES,
  type BriarSiteKind,
  briarConnected,
  briarTileProgress,
} from '~/utils/memoryDungeonWorld'
import { canChooseBriarScene } from '~/utils/memoryDungeon/scenes'
import { briarIllustrationPath } from '~/utils/memoryDungeon/artManifest'
import {
  BRIAR_CROSS_MAP_KEYS,
  BRIAR_CROSS_MAP_PUZZLES,
  BRIAR_WAVE_SIZES,
} from '~/utils/memoryDungeonWaves'
import { DESIGNED_DUNGEON_ART } from '~/utils/memoryDungeonDeck'
import {
  MEMORY_CARD_BACKS,
  memoryCardBackPath,
  hideMissingMemoryCardBack,
} from '~/utils/memoryDungeonCardArt'
import MemoryDungeonDeckSelector from '~/components/memory-dungeon/deck-selector.vue'
import MemoryDungeonCombatBoard from '~/components/memory-dungeon/combat-board.vue'
import MemoryDungeonHouseStage from '~/components/memory-dungeon/house-stage.vue'
import MemoryDungeonMinefieldStage from '~/components/memory-dungeon/minefield-stage.vue'
import MemoryDungeonEarthChronicle from '~/components/memory-dungeon/earth-chronicle.vue'
import MemoryDungeonQuestLog from '~/components/memory-dungeon/quest-log.vue'
import MemoryDungeonDarkBriarStage from '~/components/memory-dungeon/dark-briar-stage.vue'
import MemoryDungeonActionBeacon from '~/components/memory-dungeon/action-beacon.vue'

const emit = defineEmits<{
  leave: []
  earth: []
  hoshimori: []
  'hoshimori-night': []
}>()
const world = useMemoryWorldStore()
const chronicleOpen = ref(false)
const questsOpen = ref(false)
const chronicleTrigger = ref<HTMLButtonElement | null>(null)
const questsTrigger = ref<HTMLButtonElement | null>(null)
watch(chronicleOpen, async (open, wasOpen) => {
  if (!open && wasOpen) {
    await nextTick()
    chronicleTrigger.value?.focus()
  }
})
watch(questsOpen, async (open, wasOpen) => {
  if (!open && wasOpen) {
    await nextTick()
    questsTrigger.value?.focus()
  }
})
const questsTied = computed(
  () =>
    world.briarQuests.filter((thread) => thread.state === 'complete').length,
)
const tiles = BRIAR_TILES
const crossMapKeys: readonly string[] = BRIAR_CROSS_MAP_KEYS
const crossMapPuzzles: Record<string, { hint: string; title: string }> =
  BRIAR_CROSS_MAP_PUZZLES
const nextWaveCount = computed(
  () => BRIAR_WAVE_SIZES[world.state.waveIndex + 1] ?? 0,
)
function crossMapImage(key: string): string {
  const index = BRIAR_CROSS_MAP_KEYS.indexOf(
    key as (typeof BRIAR_CROSS_MAP_KEYS)[number],
  )
  return DESIGNED_DUNGEON_ART[30 + index]?.imagePath ?? ''
}
const currentIllustrationPath = computed(() =>
  briarIllustrationPath(
    world.state.player,
    world.state.sceneChoices[world.state.player],
  ),
)
const sceneArtFailed = ref(false)
const mapArtFailed = ref(false)
watch(currentIllustrationPath, () => {
  sceneArtFailed.value = false
})
const currentSceneStyle = computed(() => {
  const [x = 1, y = 1] = world.state.player.split(',').map(Number)
  return {
    backgroundImage: mapArtFailed.value
      ? "url('/memory-dungeon/briar-camp.svg')"
      : "url('/images/memory-dungeon/backdrops/briar-overworld.webp')",
    backgroundSize: '800% 800%',
    backgroundPosition: `${((x - 1) / 7) * 100}% ${((y - 1) / 7) * 100}%`,
  }
})
const sites = BRIAR_SITES
const completedCount = computed(
  () => tiles.filter((tile) => progressFor(tile.key) === 'complete').length,
)
function progressFor(key: string) {
  return briarTileProgress(world.state, key)
}
function tileNeedsAttention(key: string): boolean {
  const progress = progressFor(key)
  return (
    !world.mapMatching &&
    (progress === 'unvisited' || progress === 'unfinished') &&
    briarConnected(world.state.player, key, world.state.revealed)
  )
}
function progressLabel(key: string): string {
  const progress = progressFor(key)
  return progress === 'unvisited'
    ? 'revealed but not visited'
    : progress === 'unfinished'
      ? 'visited, unresolved interaction'
      : progress === 'complete'
        ? 'fully explored'
        : 'hidden'
}
const settingsOpen = ref(false)
const settingsTrigger = ref<HTMLButtonElement | null>(null)
const settingsDialog = ref<HTMLElement | null>(null)
watch(settingsOpen, async (open, wasOpen) => {
  await nextTick()
  if (open) settingsDialog.value?.focus()
  else if (wasOpen) settingsTrigger.value?.focus()
})
const roomTitle = computed(() => {
  const enemy = world.state.combat?.state.enemy.name
  if (world.state.roomId === 'vault-1') return 'Rootbound Vault · Echo Chamber'
  if (world.state.roomId === 'vault-2') return 'Rootbound Vault · The Warden'
  if (world.darkDuelActive && enemy) return `The Other Marches · ${enemy}`
  if (world.state.house?.combatOrigin && enemy) return `The House · ${enemy}`
  return 'Forest Memory Duel'
})

function checkpointLabel(savedAt: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(savedAt))
}

function saveSlot(index: number): void {
  const checkpoint = world.saveSlots[index]
  if (
    checkpoint &&
    !window.confirm(
      `Replace checkpoint ${index + 1} (${memoryCheckpointPreview(checkpoint).location})? Its previous expedition cannot be recovered.`,
    )
  )
    return
  world.saveCheckpoint(index, Boolean(checkpoint))
}

function loadSlot(index: number): void {
  const checkpoint = world.saveSlots[index]
  if (
    !checkpoint ||
    !window.confirm(
      `Load checkpoint ${index + 1} (${memoryCheckpointPreview(checkpoint).location})? This replaces your current autosaved expedition.`,
    )
  )
    return
  if (world.loadCheckpoint(index)) settingsOpen.value = false
}

function restart(): void {
  if (
    window.confirm(
      'Start a new Briar Camp run? This resets your exploration and match-attempt counter.',
    )
  ) {
    world.reset()
    settingsOpen.value = false
  }
}

function siteSymbol(kind: BriarSiteKind | undefined): string {
  const icons: Record<BriarSiteKind, string> = {
    camp: '⛺',
    merchant: '🏡',
    dungeon: '🏰',
    chest: '🎁',
    puzzle: '✨',
    sealed: '🔒',
    enemy: '⚔️',
    gate: '🌿',
    rune: '🪨',
    story: '◇',
  }
  return kind ? icons[kind] : ''
}

onMounted(() => {
  world.hydrate()
  void world.syncActiveMapDeck()
})
</script>

<style scoped>
/* A named game-stage container, not the browser viewport, determines whether
   map + encounter can share a full-height landscape console screen. */
.md-map-stage {
  container: md-world / size;
}
.md-map-layout {
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 0.6rem;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 0.57fr) minmax(0, 0.43fr);
  overflow: hidden;
}
.md-map-viewport {
  display: grid;
  min-height: 0;
  min-width: 0;
  place-items: center;
  overflow: hidden;
  container: md-map / size;
}
.md-overworld-map {
  width: min(100cqw, 100cqh);
  max-width: 100%;
  max-height: 100%;
}
.md-encounter-pane {
  min-height: 0;
}
.md-scene-overview {
  display: grid;
  grid-template-columns: minmax(0, 0.43fr) minmax(0, 0.57fr);
  gap: clamp(0.5rem, 1vw, 1rem);
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
.md-scene-art {
  position: relative;
  min-height: 0;
  min-width: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  border: 2px solid #b69665;
  border-radius: 0.65rem;
  background: #314c43;
}
.md-scene-mystery {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  font-size: clamp(3rem, 8cqw, 8rem);
  color: #e4ce9e;
  background: radial-gradient(circle at 40% 30%, #465f6a, #25334a 75%);
}
.md-scene-art-label {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0.15rem 0.4rem;
  background: #142524da;
  color: #fff1c9;
  font-size: 0.65rem;
  font-weight: 800;
}
.md-scene-copy {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  justify-content: flex-start;
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.25rem;
}
.md-scene-status {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
}
.md-scene-alert {
  flex: 0 0 auto;
}
@container md-world (min-width: 760px) {
  .md-map-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .md-scene-overview {
    grid-template-columns: minmax(0, 0.52fr) minmax(0, 0.48fr);
  }
}
@container md-world (max-height: 500px) {
  .md-encounter-actions {
    margin-top: 0.35rem;
  }
}
.md-btn {
  border: 1px solid #927043;
  border-radius: 0.5rem;
  background: #4a5b36;
  min-height: 2.5rem;
  padding: 0.65rem 0.9rem;
  color: #fff4da;
  font-size: 1rem;
  font-weight: 700;
}
.md-story-choice {
  flex: 1 1 12rem;
  min-height: 3.25rem;
  font-size: clamp(1rem, 1.85cqw, 1.5rem);
  line-height: 1.2;
  text-align: left;
}
.md-btn:hover:not(:disabled) {
  background: #617746;
}
.md-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
