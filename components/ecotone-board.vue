<template>
  <div
    class="ecotone-board @container flex min-h-0 w-full flex-1 flex-col bg-[#09141c] text-[#f3e6c8]"
    :style="{ '--eco-text-scale': displayScale }"
  >
    <header-page-bar>
      <div
        class="flex min-w-0 flex-1 items-center gap-2 @3xl:gap-3"
        data-testid="ecotone-hud"
      >
        <p
          class="hidden min-w-0 truncate text-xs font-bold uppercase tracking-[.18em] @2xl:block"
          :title="chapterLine"
        >
          {{ chapterLine }}
        </p>
        <p
          v-if="placeLine"
          class="hidden min-w-0 truncate text-xs font-bold uppercase tracking-[.18em] text-base-content/60 @5xl:block"
          :title="placeLine"
        >
          {{ placeLine }}
        </p>
        <div class="ml-auto flex shrink-0 items-center gap-1.5">
          <template v-if="game.run">
            <span
              class="hidden items-center gap-2 rounded-full border border-base-content/20 bg-base-200 px-3 py-0.5 text-sm font-semibold @4xl:inline-flex"
            >
              <img
                v-if="activePlayerPortrait && !headerPortraitFailed"
                :src="activePlayerPortrait"
                alt=""
                class="size-7 rounded-full object-cover"
                @error="headerPortraitFailed = true"
              />
              <span v-else aria-hidden="true">{{
                PLAYER_AVATARS.find(
                  (avatar) => avatar.id === game.run?.avatarId,
                )?.emoji ?? '🖼️'
              }}</span>
              {{ game.run.playerName || 'Wanderer' }}
            </span>
            <span
              class="eco-pill hidden @lg:inline-flex"
              :title="`Nerve ${game.run.nerve} of ${MAX_METER}`"
              >Nerve {{ game.run.nerve }}</span
            >
            <span
              class="eco-pill hidden @md:inline-flex"
              :title="`Clarity ${game.run.clarity}`"
              >Clarity {{ game.run.clarity }}</span
            >
          </template>
          <button
            type="button"
            class="inline-flex eco-pill hover:border-primary"
            :title="`Endings found: ${game.unlockedCount} of ${game.endingTotal}`"
            @click="tab = 'endings'"
          >
            <span class="@3xl:hidden"
              >{{ pad(game.unlockedCount) }}/{{ game.endingTotal }}</span
            >
            <span class="hidden @3xl:inline"
              >Endings {{ pad(game.unlockedCount) }}/{{
                game.endingTotal
              }}</span
            >
          </button>
          <button
            type="button"
            class="hidden eco-pill hover:border-primary @md:inline-flex"
            :title="`Cases opened: ${game.casesOpened} of ${game.caseTotal}`"
            @click="tab = 'cases'"
          >
            <span class="@3xl:hidden"
              >{{ game.casesOpened }}/{{ game.caseTotal }}</span
            >
            <span class="hidden @3xl:inline"
              >Cases {{ game.casesOpened }}/{{ game.caseTotal }}</span
            >
          </button>
          <button
            type="button"
            class="inline-flex eco-pill eco-pill-icon hover:border-primary"
            :aria-label="`Art style: ${currentStyle.label}`"
            :title="`Art style: ${currentStyle.label}`"
            @click="openStylePicker"
          >
            <Icon name="kind-icon:palette" class="size-4" />
          </button>
          <button
            v-if="game.run"
            type="button"
            class="inline-flex eco-pill eco-pill-icon hover:border-primary"
            aria-label="Start a new weekend"
            title="Start a new weekend"
            @click="restart"
          >
            <Icon name="kind-icon:refresh" class="size-4" />
          </button>
        </div>
      </div>
    </header-page-bar>

    <section class="@container relative min-h-0 flex-1 overflow-hidden">
      <div
        v-if="tab === 'road' && !game.run"
        class="ecotone-title relative h-full"
      >
        <EcotoneScene
          kind="meadow"
          art="title/key-art"
          label="A forest-edge festival meadow at night, a giant moss-covered puppet, string lights and a green signal in the fog"
          class="absolute inset-0"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-[#09141c] via-[#09141c]/60 to-[#09141c]/10 @4xl:bg-gradient-to-r @4xl:from-[#09141c] @4xl:via-[#09141c]/70 @4xl:to-transparent"
        />
        <div
          class="relative flex h-full min-h-0 flex-col gap-4 p-4 @xl:p-6 @4xl:w-[min(680px,58%)] @4xl:p-10"
        >
          <div class="shrink-0">
            <p
              class="text-xs font-bold uppercase tracking-[.3em] text-[#d9b877]"
            >
              Weird Humboldt · Work in progress
            </p>
            <h2
              class="mt-2 font-serif text-5xl font-black uppercase leading-[.92] drop-shadow @xl:text-7xl"
            >
              Ecotone
            </h2>
            <p
              class="mt-3 max-w-md border-t border-[#d9b877]/60 pt-3 font-serif text-base text-[#f3e6c8]/90 @xl:text-lg"
            >
              A festival, a race and the strange days after in Humboldt County.
              Four strangers worth following, or nobody at all. Futures for the
              county bleeding through the fog.
            </p>
          </div>
          <div class="flex min-h-0 flex-1 flex-col gap-2">
            <p
              class="shrink-0 text-xs font-bold uppercase tracking-[.25em] text-[#8fb8b0]"
            >
              Who are you this weekend?
            </p>
            <div class="kr-scroll -mx-1 space-y-3 px-1">
              <label class="block text-sm font-semibold">
                What should the county call you?
                <input
                  v-model="characterName"
                  type="text"
                  maxlength="32"
                  placeholder="Wanderer (or your own name)"
                  autocomplete="nickname"
                  class="mt-1 block w-full rounded-lg border border-[#c9a96e]/40 bg-[#0c1a24]/90 p-2.5 text-base text-[#f3e6c8] placeholder:text-[#f3e6c8]/50 focus:border-[#d9b877] focus:outline-none"
                />
              </label>
              <div>
                <p class="eco-label mb-2">Choose your look</p>
                <p class="mb-2 text-xs text-[#f3e6c8]/70">
                  Twelve faces, one weekend. Swipe sideways to explore the whole
                  cast.
                </p>
                <div
                  class="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-3"
                  aria-label="Choose a character portrait"
                >
                  <button
                    v-for="avatar in PLAYER_AVATARS"
                    :key="avatar.id"
                    type="button"
                    class="group w-28 shrink-0 snap-start rounded-xl border p-1.5 text-left transition-colors @2xl:w-32"
                    :class="
                      pickedAvatar === avatar.id
                        ? 'border-[#d9b877] bg-[#d9b877]/20 ring-2 ring-[#d9b877]/35'
                        : 'border-[#c9a96e]/25 bg-[#0c1a24]/80 hover:border-[#d9b877]/70'
                    "
                    :aria-label="avatar.label"
                    :title="avatar.label"
                    :aria-pressed="pickedAvatar === avatar.id"
                    @click="pickedAvatar = avatar.id"
                  >
                    <span
                      class="relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-gradient-to-b from-[#315d63] to-[#10212e]"
                    >
                      <img
                        v-if="!failedAvatarPortraits.includes(avatar.id)"
                        :src="`${playerAvatarSrc(avatar.portrait)}?retry=${portraitRetry}`"
                        :alt="avatar.label"
                        loading="lazy"
                        class="h-full w-full object-cover object-top"
                        @error="failedAvatarPortraits.push(avatar.id)"
                      />
                      <span
                        v-else
                        class="flex h-full w-full items-center justify-center bg-[#152c36] text-3xl"
                        aria-hidden="true"
                      >
                        {{ avatar.emoji }}
                      </span>
                      <span
                        v-if="pickedAvatar === avatar.id"
                        class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06121b]/95 to-transparent px-1 pb-1 pt-5 text-center text-xs font-bold text-[#f9e3a5]"
                      >
                        Selected
                      </span>
                    </span>
                    <span
                      class="mt-1.5 block truncate text-center text-[11px] font-semibold text-[#f3e6c8]"
                    >
                      {{ avatar.label }}
                    </span>
                  </button>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-[#d9b877]/65 bg-[#0c1a24]/85 px-3 py-2 text-sm font-bold"
                    :disabled="uploadingPortrait"
                    @click="openPortraitUpload"
                  >
                    {{
                      uploadingPortrait
                        ? 'Uploading portrait…'
                        : 'Upload your own portrait'
                    }}
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-[#8fb8b0]/50 bg-[#0c1a24]/85 px-3 py-2 text-xs font-bold"
                    @click="retryPortraits"
                  >
                    Refresh portraits
                  </button>
                </div>
                <button
                  v-if="customPortraitId && customPortraitUrl"
                  type="button"
                  class="mt-2 flex items-center gap-2 rounded-lg border p-2 text-left text-sm"
                  :class="
                    pickedAvatar === 'custom'
                      ? 'border-[#d9b877]'
                      : 'border-[#8fb8b0]/40'
                  "
                  :aria-pressed="pickedAvatar === 'custom'"
                  @click="pickedAvatar = 'custom'"
                >
                  <img
                    :src="customPortraitUrl"
                    alt=""
                    class="h-16 w-12 rounded object-cover"
                  />
                  My uploaded portrait
                </button>
                <p
                  v-if="portraitNotice"
                  role="status"
                  class="mt-2 text-xs text-[#f3e6c8]/85"
                >
                  {{ portraitNotice }}
                </p>
              </div>
              <div>
                <p class="eco-label mb-2">Your disposition</p>
                <div class="grid grid-cols-2 gap-1.5 @xl:grid-cols-3">
                  <button
                    v-for="personality in PLAYER_PERSONALITIES"
                    :key="personality.id"
                    type="button"
                    class="rounded-lg border px-2 py-2 text-left text-sm font-semibold"
                    :title="personality.detail"
                    :class="
                      pickedPersonality === personality.id
                        ? 'border-[#d9b877] bg-[#d9b877]/20'
                        : 'border-[#c9a96e]/25 bg-[#0c1a24]/80'
                    "
                    :aria-pressed="pickedPersonality === personality.id"
                    @click="pickedPersonality = personality.id"
                  >
                    {{ personality.label }}
                  </button>
                </div>
              </div>
              <p class="eco-label">What do you do around here?</p>
              <div class="grid gap-2 @xl:grid-cols-2">
                <button
                  v-for="background in ARCHETYPES"
                  :key="background.id"
                  type="button"
                  class="rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b877]"
                  :class="
                    picked === background.id
                      ? 'border-[#d9b877] bg-[#d9b877]/15'
                      : 'border-[#c9a96e]/25 bg-[#0c1a24]/80 hover:border-[#c9a96e]/60'
                  "
                  :aria-pressed="picked === background.id"
                  @click="picked = background.id"
                >
                  <span class="block text-sm font-black">{{
                    background.name
                  }}</span>
                  <span class="mt-0.5 block text-xs text-[#f3e6c8]/70">{{
                    background.vantage
                  }}</span>
                  <span class="mt-2 flex flex-wrap gap-1">
                    <span
                      v-for="skill in SKILLS"
                      :key="skill.id"
                      class="rounded-full bg-[#f3e6c8]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      :class="background.skills[skill.id] ? '' : 'opacity-40'"
                      >{{ skill.label }} {{ background.skills[skill.id] }}</span
                    >
                  </span>
                  <span class="mt-2 block text-xs text-[#f3e6c8]/75">{{
                    background.perk
                  }}</span>
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="eco-gold-button shrink-0"
            :disabled="!picked || !game.loaded"
            @click="start"
          >
            Begin the weekend
          </button>
        </div>
      </div>

      <div
        v-else-if="tab === 'road' && game.run"
        ref="playScroll"
        class="h-full overflow-y-auto overscroll-contain @4xl:overflow-hidden"
      >
        <div class="relative min-h-full @4xl:h-full">
          <div
            class="absolute inset-x-0 top-0 h-[32vh] min-h-[13rem] max-h-[22rem] overflow-hidden @4xl:inset-y-0 @4xl:left-[55%] @4xl:right-0 @4xl:h-full @4xl:max-h-none"
          >
            <EcotoneScene
              :kind="stage.scene"
              :art="portraitSrc ? undefined : stage.art"
              :label="stage.alt"
              class="absolute inset-0"
            />
            <img
              v-if="portraitSrc"
              :key="portraitSrc"
              :src="portraitSrc"
              :alt="stage.alt"
              class="eco-portrait absolute inset-0 h-full w-full object-cover object-[50%_15%]"
            />
            <div
              class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09141c]/30 via-transparent to-[#09141c]/10"
            />
            <div
              class="pointer-events-none absolute inset-x-0 bottom-0 hidden h-1/5 bg-gradient-to-t from-[#09141c]/45 to-transparent @4xl:block"
            />
            <div
              v-if="
                game.run.phase === 'end' &&
                game.ending &&
                game.endings.includes(game.ending.id)
              "
              class="absolute inset-0 flex items-center justify-center bg-[#09141c]/55 p-3 @4xl:p-6"
            >
              <div
                class="relative h-full max-h-[36rem] aspect-[2/3] overflow-hidden rounded-2xl border-2 border-[#d9b877] bg-[#10212e] shadow-[0_0_40px_rgba(0,0,0,.65)]"
              >
                <EcotoneScene
                  :kind="stage.scene"
                  :art="endingArtKey(game.ending.id)"
                  :label="signature?.title ?? stage.title"
                  class="absolute inset-0"
                />
                <div
                  class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071016] via-[#071016]/90 to-transparent px-4 pb-5 pt-16 text-center"
                >
                  <p
                    class="text-xs font-black uppercase tracking-[.22em] text-[#d9b877]"
                  >
                    Ending earned
                  </p>
                  <h3 class="mt-2 font-serif text-2xl font-black leading-tight">
                    {{ signature?.title ?? stage.title }}
                  </h3>
                  <p
                    class="mt-1 text-xs font-bold uppercase tracking-wide text-[#f3e6c8]/85"
                  >
                    {{ game.ending.id }}
                  </p>
                </div>
              </div>
            </div>
            <div
              v-if="stage.mysteryCard && game.run.phase !== 'end'"
              class="absolute right-4 top-4 w-20 rotate-3 drop-shadow-xl @xl:w-24 @4xl:right-10 @4xl:top-8 @4xl:w-36"
            >
              <EcotoneMysteryCard :mystery="stage.mysteryCard" compact />
            </div>
            <div
              v-else-if="stage.emblem && !portraitSrc"
              class="absolute right-4 top-4 flex items-center gap-2 @4xl:right-10 @4xl:top-8"
            >
              <EcotoneEmblem
                v-for="emblem in stage.emblem"
                :id="emblem.id"
                :key="emblem.id"
                :name="emblem.name"
                class="size-12 drop-shadow-lg @4xl:size-20"
              />
            </div>
          </div>

          <div
            class="relative grid min-h-full grid-cols-1 content-start gap-4 p-4 pt-[calc(clamp(13rem,32vh,22rem)+1.25rem)] @xl:p-6 @xl:pt-[calc(clamp(13rem,32vh,22rem)+1.5rem)] @4xl:h-full @4xl:grid-cols-[minmax(0,55%)_minmax(0,45%)] @4xl:grid-rows-[minmax(0,1fr)_auto] @4xl:gap-0 @4xl:p-0"
          >
            <div
              class="flex min-h-0 flex-col gap-3 bg-[#09141c] @4xl:col-start-1 @4xl:row-start-1 @4xl:overflow-y-auto @4xl:overscroll-contain @4xl:px-7 @4xl:pt-6"
            >
              <div class="flex flex-col justify-start gap-2 @4xl:shrink-0">
                <span class="eco-kicker self-start">{{ stage.kicker }}</span>
                <h2
                  class="font-serif text-3xl font-black uppercase leading-[.98] drop-shadow-[0_3px_12px_rgba(0,0,0,.6)] @xl:text-4xl @6xl:text-5xl"
                >
                  {{ stage.title }}
                </h2>
                <p
                  v-if="stage.subtitle"
                  class="font-serif text-lg text-[#f3e6c8]/85 @4xl:text-xl"
                  :class="stage.meet ? '@4xl:hidden' : ''"
                >
                  {{ stage.subtitle }}
                </p>
                <div v-if="stage.meet" class="mt-2 flex flex-col gap-2">
                  <span class="h-0.5 w-full max-w-md bg-[#d9b877]/75" />
                  <p
                    class="font-serif text-3xl font-black uppercase tracking-[.08em] @4xl:text-4xl"
                  >
                    {{ stage.meet.name }}
                  </p>
                  <p
                    class="text-xs font-bold uppercase tracking-[.22em] text-[#8fb8b0] @4xl:text-sm"
                  >
                    {{ stage.meet.role }}
                  </p>
                  <p
                    class="max-w-xl font-serif text-lg leading-snug @4xl:text-xl"
                  >
                    {{ stage.meet.line }}
                  </p>
                </div>
              </div>

              <div
                class="eco-panel flex min-h-0 flex-col gap-3 @4xl:flex-1 @4xl:overflow-hidden"
                aria-live="polite"
              >
                <template v-if="pending">
                  <p
                    v-if="stage.realEnding"
                    class="eco-label flex items-center gap-2 text-[#f6c55a]"
                  >
                    <Icon name="kind-icon:star" class="size-3.5" />
                    Real Ending · {{ stage.realEnding }}
                  </p>
                  <p class="eco-label">{{ pending.choice }}</p>
                  <div
                    v-if="pending.roll"
                    class="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                    :class="
                      pending.roll.success
                        ? 'border-[#8fb8b0]/60 bg-[#8fb8b0]/10'
                        : 'border-[#e08a5a]/60 bg-[#e08a5a]/10'
                    "
                  >
                    <div class="flex gap-2" aria-hidden="true">
                      <span
                        v-for="(die, index) in pending.roll.dice"
                        :key="index"
                        class="ecotone-die grid size-11 grid-cols-3 grid-rows-3 gap-0.5 rounded-lg bg-[#f4efe1] p-1.5"
                      >
                        <span
                          v-for="cell in 9"
                          :key="cell"
                          class="rounded-full"
                          :class="
                            PIPS[die]?.includes(cell) ? 'bg-[#1b1b1b]' : ''
                          "
                        />
                      </span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-lg font-black">
                        {{ pending.roll.dice[0] + pending.roll.dice[1] }}
                        <span
                          v-if="pending.roll.bonus"
                          class="text-[#f3e6c8]/70"
                          >{{ pending.roll.bonus > 0 ? '+' : '−'
                          }}{{ Math.abs(pending.roll.bonus) }}</span
                        >
                        = {{ pending.roll.total }}
                        <span class="text-[#f3e6c8]/70"
                          >vs {{ pending.roll.target }}</span
                        >
                      </p>
                      <p class="text-xs text-[#f3e6c8]/70">
                        {{ rollParts(pending.roll) }}
                      </p>
                    </div>
                    <span
                      class="rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider"
                      :class="
                        pending.roll.success
                          ? 'bg-[#8fb8b0] text-[#09141c]'
                          : 'bg-[#e08a5a] text-[#09141c]'
                      "
                    >
                      {{
                        pending.roll.natural === 'boxcars'
                          ? 'Boxcars!'
                          : pending.roll.natural === 'snake-eyes'
                            ? 'Snake eyes'
                            : pending.roll.success
                              ? 'Success'
                              : 'Complication'
                      }}
                    </span>
                  </div>
                  <div class="max-h-full min-h-0 flex-1 overflow-y-auto">
                    <p
                      class="eco-story-copy whitespace-pre-line font-serif leading-relaxed"
                    >
                      {{ revealedResult }}
                    </p>
                  </div>
                  <div
                    v-if="effectChips(pending.effects).length"
                    class="flex flex-wrap gap-1.5"
                  >
                    <span
                      v-for="chip in effectChips(pending.effects)"
                      :key="chip"
                      class="rounded-full border border-[#c9a96e]/40 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                      >{{ chip }}</span
                    >
                  </div>
                </template>

                <template v-else-if="game.run.phase === 'end' && game.ending">
                  <p class="eco-label flex items-center gap-2">
                    <span
                      class="size-3 shrink-0 rounded-full"
                      :class="
                        game.ending.fate === 'hope'
                          ? 'ecotone-fate-hope'
                          : 'ecotone-fate-dark'
                      "
                    />
                    {{ game.ending.fate === 'hope' ? 'Hopeful' : 'Dark' }}
                    future · {{ leadName(game.ending.lead) }} ·
                    {{ lensLabel(game.ending.lens) }}
                  </p>
                  <div
                    class="flex max-h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
                  >
                    <p
                      v-if="signature"
                      class="font-serif text-base italic text-[#f3e6c8]/80"
                    >
                      {{ signature.line }}
                    </p>
                    <p
                      v-for="(paragraph, index) in FUTURES[game.ending.lead][
                        game.ending.fate
                      ]"
                      :key="index"
                      class="eco-story-copy font-serif leading-relaxed"
                    >
                      {{ paragraph }}
                    </p>
                    <p
                      v-if="sharedFuture"
                      class="border-l-2 border-[#8fb8b0] pl-3 font-serif text-sm leading-relaxed"
                    >
                      {{ sharedFuture }}
                    </p>
                    <p
                      v-for="(callback, index) in hangoutCallbacks"
                      :key="`companion-callback-${index}`"
                      class="border-l-2 border-[#d6a962] pl-3 font-serif text-sm italic leading-relaxed"
                    >
                      {{ callback }}
                    </p>
                    <p
                      v-for="(callback, index) in questCallbacks"
                      :key="`quest-callback-${index}`"
                      class="border-l-2 border-[#d6a962] pl-3 font-serif text-sm italic leading-relaxed"
                    >
                      {{ callback }}
                    </p>
                    <p
                      v-if="substanceCoda"
                      class="border-l-2 border-[#d9b877] pl-3 font-serif text-sm italic leading-relaxed"
                    >
                      {{ substanceCoda }}
                    </p>
                    <p
                      v-if="LENS_CODAS[game.ending.lens]"
                      class="border-l-2 border-[#8fb8b0] pl-3 text-sm italic"
                    >
                      {{ LENS_CODAS[game.ending.lens] }}
                    </p>
                    <button
                      v-if="runCase && game.mystery"
                      type="button"
                      class="flex items-center gap-3 rounded-xl border border-[#d9b877]/40 bg-black/35 p-2.5 text-left hover:border-[#d9b877]"
                      @click="openCase(game.mystery.id)"
                    >
                      <EcotoneMysteryCard
                        :mystery="game.mystery"
                        compact
                        class="w-12 shrink-0"
                      />
                      <span class="min-w-0">
                        <span class="eco-label block">
                          Case {{ caseNumeral(game.mystery.number) }} ·
                          {{ caseVerdict(runCase) }}
                        </span>
                        <span class="block font-serif text-sm font-bold">{{
                          game.mystery.title
                        }}</span>
                        <span class="block text-xs text-[#f3e6c8]/65">
                          Gates {{ gateSummary(runCase) }} · open the Case Files
                        </span>
                      </span>
                    </button>
                    <section
                      class="rounded-xl border border-[#8fb8b0]/40 bg-black/35 p-3"
                    >
                      <h3 class="eco-label">Four philosophical rolls</h3>
                      <p class="mt-1 text-xs text-[#f3e6c8]/65">
                        Repeated perspectives tilt the odds. Decisions can agree
                        or push back. The 2d6 rolls settle a point of view, not
                        whether your future deserves hope.
                      </p>
                      <div class="mt-3 grid gap-3">
                        <div
                          v-for="value in philosophy"
                          :key="value.id"
                          class="rounded-lg border border-white/10 p-2"
                        >
                          <div
                            class="flex items-center justify-between gap-2 text-xs font-bold"
                          >
                            <span>{{ value.left }} ↔ {{ value.right }}</span>
                            <span class="text-[#d9b877]">{{
                              value.outcome
                            }}</span>
                          </div>
                          <div
                            class="relative mt-2 h-2 rounded-full bg-[#8fb8b0]/35"
                          >
                            <span
                              class="absolute inset-y-0 left-1/2 w-px bg-white/40"
                            />
                            <span
                              class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#09141c] bg-[#d9b877]"
                              :style="{ left: value.position + '%' }"
                            />
                          </div>
                          <p
                            class="mt-2 font-serif text-sm italic leading-relaxed text-[#f3e6c8]/85"
                          >
                            {{ value.reflection }}
                          </p>
                          <p class="mt-2 text-[11px] text-[#f3e6c8]/65">
                            Chemistry {{ value.chemistry >= 0 ? '+' : ''
                            }}{{ value.chemistry }} · decisions
                            {{ value.decisions >= 0 ? '+' : ''
                            }}{{ value.decisions }} · 2d6 ({{ value.dice[0] }} +
                            {{ value.dice[1] }}) + pull {{ value.pull }} =
                            {{ value.total }}
                          </p>
                        </div>
                      </div>
                    </section>
                    <div class="rounded-xl bg-black/30 p-3">
                      <p class="eco-label">
                        What decided it: {{ game.ending.score }} of
                        {{ game.ending.target }} needed
                      </p>
                      <p class="mt-1 text-sm text-[#f3e6c8]/85">
                        {{
                          game.ending.parts
                            .map(
                              (part) =>
                                `${part.label} ${part.value >= 0 ? '+' : '−'}${Math.abs(part.value)}`,
                            )
                            .join(' · ')
                        }}
                      </p>
                    </div>
                    <PlaybookRunReview
                      game="ecotone"
                      :run="game.run"
                      :ending="
                        game.ending.fate +
                        ':' +
                        game.ending.lead +
                        ':' +
                        game.ending.lens
                      "
                    />
                    <p class="text-xs text-[#f3e6c8]/60">
                      Ending earned and added to your gallery. These finales are
                      authored drafts. Only choices made in this run appear as
                      callbacks; images and final editorial approval remain
                      open.
                    </p>
                  </div>
                </template>

                <template v-else>
                  <p class="eco-label">{{ stage.panelKicker }}</p>
                  <div
                    class="flex max-h-full min-h-12 flex-1 flex-col gap-3 overflow-y-auto"
                  >
                    <figure
                      v-if="stage.message"
                      class="ecotone-message self-start rounded-2xl border p-3 text-sm"
                      :class="
                        stage.message.medium === 'text'
                          ? 'rounded-bl-sm border-[#8fb8b0]/50 bg-[#8fb8b0]/15'
                          : 'border-[#d9b877]/45 bg-black/40'
                      "
                    >
                      <figcaption
                        class="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-[#8fb8b0]"
                      >
                        <Icon
                          :name="messageIcon(stage.message)"
                          class="size-3.5"
                        />
                        {{ messageLabel(stage.message) }} ·
                        {{ stage.message.from }}
                      </figcaption>
                      <p
                        v-for="(line, index) in stage.message.lines"
                        :key="`msg-${index}`"
                        class="leading-snug"
                        :class="stage.message.medium === 'text' ? '' : 'italic'"
                      >
                        {{ line }}
                      </p>
                    </figure>
                    <p
                      v-for="(paragraph, index) in revealedBody"
                      :key="index"
                      class="eco-story-copy font-serif leading-relaxed"
                    >
                      {{ paragraph }}
                    </p>
                    <p
                      v-if="stage.lensLine"
                      class="border-l-2 border-[#8fb8b0] pl-3 text-sm italic"
                    >
                      {{ stage.lensLine }}
                    </p>
                    <p
                      v-for="(aside, index) in stage.asides"
                      :key="`aside-${index}`"
                      class="border-l-2 border-[#e08a5a] pl-3 text-sm"
                    >
                      {{ aside }}
                    </p>
                  </div>
                  <p
                    v-if="stage.panelFooter"
                    class="text-[11px] font-bold uppercase tracking-[.2em] text-[#8fb8b0]"
                  >
                    {{ stage.panelFooter }}
                  </p>
                </template>
              </div>
            </div>

            <div
              class="eco-choices flex min-h-0 flex-col gap-3 self-start rounded-xl bg-[#09141c] @4xl:col-start-1 @4xl:row-start-2 @4xl:max-h-[42vh] @4xl:overflow-y-auto @4xl:overscroll-contain @4xl:px-7 @4xl:pb-5 @4xl:pt-3"
            >
              <button
                v-if="game.canUndo"
                type="button"
                class="rounded-lg border border-[#8fb8b0]/60 bg-[#8fb8b0]/15 px-3 py-2 text-base font-bold text-[#f3e6c8] hover:border-[#d9b877]"
                @click="game.undo()"
              >
                ↶ Undo last decision
              </button>
              <template v-if="pending">
                <button
                  ref="continueButton"
                  type="button"
                  class="eco-gold-button"
                  @click="game.proceed()"
                >
                  Continue
                  <Icon name="kind-icon:chevron-right" class="size-4" />
                </button>
              </template>
              <template v-else-if="game.run.phase === 'end' && game.ending">
                <p class="eco-label px-1">What now?</p>
                <button type="button" class="eco-gold-button" @click="restart">
                  Start another weekend
                </button>
                <button
                  type="button"
                  class="eco-choice justify-center"
                  @click="tab = 'endings'"
                >
                  See your endings
                </button>
              </template>
              <template v-else>
                <details
                  v-if="canTakeMoment && momentOffer"
                  :key="game.run?.card ?? ''"
                  class="rounded-xl border border-[#8fb8b0]/40 bg-black/30 p-2 text-sm"
                >
                  <summary
                    class="cursor-pointer text-xs font-bold uppercase tracking-wider text-[#8fb8b0]"
                  >
                    An offer along the way · entirely optional
                  </summary>
                  <p class="my-2 text-xs text-[#f3e6c8]/75">
                    {{ momentOffer.description }}
                  </p>
                  <div class="grid gap-2 @xl:grid-cols-2">
                    <button
                      type="button"
                      class="rounded-lg border border-[#8fb8b0] px-3 py-2 text-xs font-bold"
                      @click="game.takeMoment([])"
                    >
                      No thanks
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-[#d9b877] px-3 py-2 text-xs font-bold"
                      @click="game.takeMoment([momentOffer.id])"
                    >
                      {{ momentOffer.label }}
                    </button>
                  </div>
                </details>
                <p class="eco-label px-1">{{ stage.question }}</p>
                <label
                  v-if="options.some((option) => option.perkEligible)"
                  class="flex items-center gap-2 rounded-lg border border-[#d9b877]/50 bg-black/35 px-3 py-2 text-xs text-[#f3e6c8]"
                >
                  <input
                    v-model="perkSelected"
                    type="checkbox"
                    class="checkbox checkbox-xs border-[#d9b877]"
                  />
                  Use my origin perk on an eligible choice (once this chapter)
                </label>
                <div
                  class="flex max-h-full min-h-0 flex-col gap-2 overflow-y-auto"
                >
                  <button
                    v-for="(option, index) in options"
                    :key="option.id"
                    type="button"
                    class="eco-choice group"
                    :class="index === 0 && !option.disabled ? 'is-lead' : ''"
                    :disabled="option.disabled"
                    :title="option.chipTitle"
                    @click="queueDecision(option)"
                  >
                    <span
                      v-if="option.thumb"
                      class="relative h-11 w-16 shrink-0 overflow-hidden rounded-md"
                    >
                      <EcotoneScene
                        :kind="option.thumb.scene"
                        :art="option.thumb.art"
                        :label="option.label"
                        class="absolute inset-0"
                      />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span
                        class="eco-choice-main block font-bold leading-snug"
                        >{{ option.label }}</span
                      >
                      <span
                        v-if="option.chip || option.hint"
                        class="mt-1 block text-sm leading-snug text-[#f3e6c8]/75 @4xl:text-base"
                        >{{
                          [
                            option.chip,
                            option.perkEligible ? 'Origin perk available' : '',
                            option.hint,
                          ]
                            .filter(Boolean)
                            .join(' · ')
                        }}</span
                      >
                      <span
                        v-if="option.preview"
                        class="mt-1 block text-sm leading-snug text-[#8fb8b0]"
                        >{{ option.preview }}</span
                      >
                      <span
                        v-if="option.possibilities"
                        class="mt-1 block text-xs leading-snug text-[#f3e6c8]/65"
                        >{{ option.possibilities }}</span
                      >
                    </span>
                    <Icon
                      name="kind-icon:chevron-right"
                      class="size-4 shrink-0 text-[#d9b877] transition group-hover:translate-x-0.5"
                    />
                  </button>
                </div>
              </template>
              <button
                v-if="hasHiddenText"
                type="button"
                class="rounded-lg border border-[#8fb8b0]/50 bg-[#09141c] px-3 py-2 text-base font-bold"
                @click="revealAll"
              >
                Show full text
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="tab === 'settings'" class="kr-scroll h-full p-4 @xl:p-6">
        <div class="mx-auto flex max-w-5xl flex-col gap-5">
          <div>
            <p class="eco-label">Your weekend, your rules</p>
            <h2 class="mt-1 font-serif text-4xl font-black">
              Settings &amp; Save Games
            </h2>
            <p class="mt-2 text-base text-[#f3e6c8]/80">
              Read comfortably, travel at your own pace, and keep a copy of your
              story. Preferences save automatically on this device and never
              change your dice.
            </p>
          </div>
          <section
            v-if="game.run"
            class="rounded-2xl border border-[#c9a96e]/40 bg-[#0c1a24] p-4"
          >
            <h3 class="font-serif text-2xl font-bold">
              Your character portrait
            </h3>
            <p class="mt-1 text-sm text-[#f3e6c8]/75">
              Change your look without restarting the story. Your uploaded image
              remains private.
            </p>
            <div
              class="mt-3 flex gap-2 overflow-x-auto pb-3"
              aria-label="Change player portrait"
            >
              <button
                v-for="avatar in PLAYER_AVATARS"
                :key="avatar.id"
                type="button"
                class="w-20 shrink-0 rounded-lg border p-1"
                :class="
                  game.run.avatarId === avatar.id
                    ? 'border-[#d9b877]'
                    : 'border-[#c9a96e]/25'
                "
                :aria-pressed="game.run.avatarId === avatar.id"
                :aria-label="avatar.label"
                @click="changePlayerLook(avatar.id)"
              >
                <img
                  v-if="!failedAvatarPortraits.includes(avatar.id)"
                  :src="`${playerAvatarSrc(avatar.portrait)}?retry=${portraitRetry}`"
                  :alt="avatar.label"
                  class="aspect-[2/3] w-full rounded object-cover"
                  @error="failedAvatarPortraits.push(avatar.id)"
                />
                <span
                  v-else
                  class="flex aspect-[2/3] items-center justify-center text-2xl"
                  >{{ avatar.emoji }}</span
                >
              </button>
              <button
                v-if="customPortraitId && customPortraitUrl"
                type="button"
                class="w-20 shrink-0 rounded-lg border p-1"
                :class="
                  game.run.avatarId === 'custom'
                    ? 'border-[#d9b877]'
                    : 'border-[#c9a96e]/25'
                "
                aria-label="My uploaded portrait"
                :aria-pressed="game.run.avatarId === 'custom'"
                @click="changePlayerLook('custom')"
              >
                <img
                  :src="customPortraitUrl"
                  alt=""
                  class="aspect-[2/3] w-full rounded object-cover"
                />
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-lg border border-[#d9b877]/70 px-3 py-2 text-sm font-bold"
                :disabled="uploadingPortrait"
                @click="openPortraitUpload"
              >
                {{ uploadingPortrait ? 'Uploading…' : 'Upload a new portrait' }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-[#8fb8b0]/60 px-3 py-2 text-sm font-bold"
                @click="retryPortraits"
              >
                Retry missing portraits
              </button>
            </div>
            <p v-if="portraitNotice" role="status" class="mt-2 text-sm">
              {{ portraitNotice }}
            </p>
          </section>
          <div class="grid gap-4 @3xl:grid-cols-2">
            <section
              class="rounded-2xl border border-[#c9a96e]/40 bg-[#0c1a24] p-4"
            >
              <h3 class="font-serif text-2xl font-bold">
                Reading &amp; Accessibility
              </h3>
              <label
                class="mt-4 block text-base font-semibold"
                for="ecotone-text-size"
              >
                Text size
              </label>
              <select
                id="ecotone-text-size"
                v-model.number="displayScale"
                class="mt-2 w-full rounded-lg border border-[#c9a96e]/50 bg-[#09141c] p-3 text-base"
              >
                <option :value="1">Standard</option>
                <option :value="1.2">Large (default)</option>
                <option :value="1.4">Extra large</option>
                <option :value="1.6">Maximum</option>
              </select>
              <label
                class="mt-5 block text-base font-semibold"
                for="ecotone-text-speed"
              >
                Text reveal speed
              </label>
              <select
                id="ecotone-text-speed"
                v-model="textSpeed"
                class="mt-2 w-full rounded-lg border border-[#c9a96e]/50 bg-[#09141c] p-3 text-base"
              >
                <option value="instant">Instant, no animation (default)</option>
                <option value="normal">Gradual</option>
                <option value="slow">Slow and cinematic</option>
              </select>
              <p class="mt-3 text-base leading-relaxed text-[#f3e6c8]/85">
                When text is revealing, use “Show full text” to skip the
                animation. Text effects stop automatically when reduced motion
                is preferred.
              </p>
              <div
                class="mt-4 rounded-xl border border-[#8fb8b0]/40 bg-black/25 p-3"
              >
                <p class="eco-label">Live reading preview</p>
                <p class="eco-story-copy mt-2 font-serif leading-relaxed">
                  The fog has opinions about your font size. You are free to
                  disagree.
                </p>
              </div>
            </section>
            <section
              class="rounded-2xl border border-[#c9a96e]/40 bg-[#0c1a24] p-4"
            >
              <h3 class="font-serif text-2xl font-bold">Save Games</h3>
              <p class="mt-1 text-base text-[#f3e6c8]/80">
                Your active journey autosaves on this browser after each action.
                Manual slots are independent checkpoints. Loading replaces the
                active run, not your unlocked endings.
              </p>
              <div class="mt-4 grid gap-3">
                <div
                  v-for="slot in [1, 2, 3]"
                  :key="slot"
                  class="rounded-xl border border-[#c9a96e]/30 bg-[#09141c] p-3"
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p class="text-lg font-bold">Slot {{ slot }}</p>
                      <p class="text-sm text-[#f3e6c8]/75">
                        {{
                          game.manualSaves.find((item) => item.slot === slot)
                            ?.savedAt
                            ? new Date(
                                game.manualSaves.find(
                                  (item) => item.slot === slot,
                                )!.savedAt,
                              ).toLocaleString()
                            : 'Empty slot'
                        }}
                      </p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-[#d9b877] px-3 py-2 text-sm font-bold"
                        :disabled="!game.run"
                        @click="saveGame(slot)"
                      >
                        Save here
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-[#8fb8b0]/70 px-3 py-2 text-sm font-bold"
                        :disabled="
                          !game.manualSaves.some((item) => item.slot === slot)
                        "
                        @click="loadGame(slot)"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-[#e08a5a]/60 px-3 py-2 text-sm font-bold"
                        :disabled="
                          !game.manualSaves.some((item) => item.slot === slot)
                        "
                        @click="removeSave(slot)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="eco-gold-button"
                  :disabled="!game.run"
                  @click="exportGame"
                >
                  Export save as JSON
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-[#8fb8b0]/70 px-4 py-3 text-base font-bold"
                  @click="saveImportInput?.click()"
                >
                  Import saved journey
                </button>
                <input
                  ref="saveImportInput"
                  type="file"
                  accept=".json,application/json"
                  class="sr-only"
                  aria-label="Select an Ecotone save JSON file"
                  @change="importGame"
                />
              </div>
              <p
                v-if="saveNotice"
                class="mt-3 text-base text-[#8fb8b0]"
                role="status"
              >
                {{ saveNotice }}
              </p>
              <button
                v-if="game.canUndo"
                type="button"
                class="mt-4 rounded-lg border border-[#d9b877]/60 px-4 py-2 text-base font-bold"
                @click="rewindDecision"
              >
                ↶ Rewind last decision
              </button>
            </section>
          </div>
        </div>
      </div>

      <div v-else-if="tab === 'guides'" class="kr-scroll h-full p-3 sm:p-5">
        <div class="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-4">
          <article
            v-for="companion in COMPANIONS"
            :key="companion.id"
            class="flex flex-col gap-2 rounded-3xl border p-3 sm:p-4"
            :class="
              game.lead?.id === companion.id
                ? 'border-[#d9b877] bg-[#d9b877]/10'
                : 'border-white/10 bg-black/25'
            "
          >
            <div class="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <EcotoneScene
                kind="grove"
                :art="companion.art"
                :label="`${companion.name}, ${companion.role}`"
                portrait
                class="absolute inset-0"
              />
            </div>
            <div class="flex items-center gap-3">
              <EcotoneEmblem
                :id="companion.id"
                :name="companion.name"
                class="size-14 shrink-0"
              />
              <div class="min-w-0">
                <h3 class="font-serif text-xl font-black">
                  {{ companion.name }}
                </h3>
                <p class="text-xs text-white/70">{{ companion.role }}</p>
                <p
                  class="text-[11px] font-bold uppercase tracking-wider text-[#d9b877]"
                >
                  {{ guideStatus(companion.id) }}
                </p>
              </div>
            </div>
            <p class="text-sm text-white/85">{{ companion.bio }}</p>
            <p class="font-serif text-sm italic text-white/75">
              {{ companion.line }}
            </p>
            <p class="mt-auto text-xs text-white/60">
              First met at {{ companion.meetAt }}. Helps with
              {{ skillLabel(LEAD_BONUS[companion.id]) }} (+1).
            </p>
          </article>
        </div>
        <div
          v-if="game.run && archetype"
          class="mt-4 rounded-3xl border border-white/10 bg-black/25 p-3 sm:p-4"
        >
          <h3 class="font-serif text-lg font-black">
            {{ game.run.playerName || 'Wanderer' }} · {{ archetype.name }}
          </h3>
          <p class="text-sm text-white/75">{{ archetype.vantage }}</p>
          <div class="mt-2 grid grid-cols-2 gap-2 @xl:grid-cols-5">
            <div
              v-for="skill in SKILLS"
              :key="skill.id"
              class="rounded-xl bg-black/30 p-2"
            >
              <p class="text-[11px] uppercase tracking-wider text-white/60">
                {{ skill.label }}
              </p>
              <p class="text-xl font-black">{{ game.run.skills[skill.id] }}</p>
            </div>
          </div>
          <p class="mt-2 text-xs text-white/60">
            Origin perk: {{ archetype.perk }}
            <span
              v-if="game.run.perkUsedChapters.includes(game.chapter)"
              class="font-bold text-[#d9b877]"
            >
              · Used this chapter</span
            >
          </p>
        </div>
      </div>

      <div
        v-else-if="tab === 'county'"
        class="grid h-full min-h-0 grid-rows-[minmax(0,46%)_minmax(0,1fr)] @4xl:grid-cols-[minmax(0,1fr)_420px] @4xl:grid-rows-1"
      >
        <div class="relative min-h-0 bg-[#0d2a30]">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
            class="size-full"
            role="img"
            aria-label="Map of the six chapter regions of Humboldt County"
          >
            <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="#0b2a33" />
            <path
              d="M36 0 L100 0 L100 100 L52 100 L48 88 L44 76 L38 66 L40 56 L36 48 L39 42 L35 34 L37 24 L34 12 Z"
              fill="#1f3a2a"
            />
            <path d="M38 44 Q 44 40 43 50 Q 40 54 37 49 Z" fill="#0b2a33" />
            <path
              d="M52 100 L48 88 L44 76 L38 66 L40 56 L36 48 L39 42 L35 34 L37 24 L34 12 L36 0"
              fill="none"
              stroke="#c9b48a"
              stroke-width="0.6"
            />
            <path
              d="M70 0 Q 64 30 74 50 T 66 100"
              fill="none"
              stroke="#3b6e8a"
              stroke-width="0.8"
              opacity="0.7"
            />
            <path
              d="M52 36 Q 62 30 76 32 T 98 26"
              fill="none"
              stroke="#9a8a6a"
              stroke-width="0.5"
              stroke-dasharray="1.5 1"
            />
            <g v-for="ch in CHAPTERS" :key="ch.number">
              <circle
                :cx="ch.x"
                :cy="ch.y"
                r="3.4"
                :fill="
                  chapterState(ch.number) === 'current'
                    ? '#7dffb2'
                    : chapterState(ch.number) === 'visited'
                      ? '#e0b56a'
                      : '#24414a'
                "
                stroke="#eef3ec"
                stroke-width="0.4"
                :class="
                  chapterState(ch.number) === 'current' ? 'ecotone-pin' : ''
                "
              />
              <text
                :x="ch.x"
                :y="ch.y + 1.2"
                text-anchor="middle"
                font-size="3.2"
                font-weight="800"
                fill="#0b1d1f"
              >
                {{ ch.number }}
              </text>
            </g>
          </svg>
        </div>
        <div class="kr-scroll flex flex-col gap-2 p-3 sm:p-4">
          <article
            v-for="ch in CHAPTERS"
            :key="ch.number"
            class="flex gap-3 rounded-2xl border p-2"
            :class="
              chapterState(ch.number) === 'current'
                ? 'border-[#d9b877] bg-[#d9b877]/10'
                : 'border-white/10 bg-black/25'
            "
          >
            <div class="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
              <EcotoneScene
                :kind="ch.scene"
                :art="ch.art"
                :label="ch.name"
                class="absolute inset-0"
              />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-black">{{ ch.number }}. {{ ch.name }}</h3>
              <p class="text-xs text-white/70">{{ ch.places.join(' · ') }}</p>
              <p class="text-xs italic text-white/55">
                {{ ch.mood }}: {{ ch.turn }}
              </p>
            </div>
          </article>
        </div>
      </div>

      <div v-else-if="tab === 'journal'" class="kr-scroll h-full p-3 sm:p-5">
        <p v-if="!game.run" class="text-sm text-white/70">
          Your journal fills in as the days happen. Begin a run on the Road.
        </p>
        <template v-else>
          <div
            class="grid gap-3 @4xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
          >
            <ol class="flex flex-col gap-2">
              <li
                v-for="entry in game.run.log"
                :key="entry.step"
                class="rounded-2xl border border-white/10 bg-black/25 p-3"
              >
                <p
                  class="text-[11px] font-bold uppercase tracking-wider text-[#d9b877]"
                >
                  Day {{ entry.day }} · {{ entry.source }} ·
                  {{ entry.title }}
                </p>
                <p class="text-sm font-black">{{ entry.choice }}</p>
                <p v-if="entry.roll" class="text-xs text-white/60">
                  Rolled {{ entry.roll.dice[0] }} + {{ entry.roll.dice[1] }}
                  {{ entry.roll.bonus >= 0 ? '+' : '−' }}
                  {{ Math.abs(entry.roll.bonus) }} = {{ entry.roll.total }} vs
                  {{ entry.roll.target }}:
                  {{ entry.roll.success ? 'success' : 'complication' }}
                </p>
                <p class="mt-1 text-sm text-white/85">{{ entry.text }}</p>
              </li>
            </ol>
            <div class="flex flex-col gap-3">
              <section
                class="rounded-2xl border border-white/10 bg-black/25 p-3"
              >
                <h3 class="text-sm font-black">Evidence</h3>
                <ul
                  v-if="game.run.evidence.length"
                  class="mt-1 list-disc pl-5 text-sm text-white/85"
                >
                  <li v-for="item in game.run.evidence" :key="item">
                    {{ item }}
                  </li>
                </ul>
                <p v-else class="text-xs text-white/60">
                  Nothing you could show a skeptic. Yet.
                </p>
              </section>
              <section
                class="rounded-2xl border border-white/10 bg-black/25 p-3"
              >
                <h3 class="text-sm font-black">Who you met, in order</h3>
                <p class="text-sm text-white/85">
                  {{
                    game.run.meetingOrder.map(companionName).join(' → ') ||
                    'No one yet'
                  }}
                </p>
                <h3 class="mt-2 text-sm font-black">Who you followed</h3>
                <ul class="text-sm text-white/85">
                  <li
                    v-for="(step, index) in game.run.followHistory"
                    :key="index"
                  >
                    Day {{ step.day }}:
                    {{
                      step.to
                        ? `followed ${companionName(step.to)}`
                        : 'went alone'
                    }}
                  </li>
                </ul>
              </section>
              <section
                class="rounded-2xl border border-white/10 bg-black/25 p-3"
              >
                <h3 class="text-sm font-black">Philosophical currents</h3>
                <p class="mb-2 text-xs text-white/60">
                  The needle reflects accumulated moments and actual decisions.
                  The dice are revealed only at the finale.
                </p>
                <div v-for="value in philosophy" :key="value.id" class="mb-3">
                  <div class="flex justify-between gap-2 text-xs">
                    <span>{{ value.left }}</span>
                    <span>{{ value.right }}</span>
                  </div>
                  <div class="relative mt-1 h-2 rounded-full bg-[#8fb8b0]/35">
                    <span
                      class="absolute inset-y-0 left-1/2 w-px bg-white/40"
                    />
                    <span
                      class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9b877]"
                      :style="{ left: value.position + '%' }"
                    />
                  </div>
                  <p class="mt-1 text-[11px] text-white/60">
                    Perspective {{ value.chemistry >= 0 ? '+' : ''
                    }}{{ value.chemistry }} · actions
                    {{ value.decisions >= 0 ? '+' : '' }}{{ value.decisions }}
                  </p>
                </div>
              </section>
              <section
                class="rounded-2xl border border-white/10 bg-black/25 p-3"
              >
                <h3 class="text-sm font-black">Opening lens</h3>
                <p class="text-sm text-white/85">
                  {{
                    game.run.openingState
                      ? lensLabel(game.run.openingState)
                      : 'Not chosen yet'
                  }}
                  · Clarity {{ game.run.clarity }} · Weird exposure
                  {{ game.run.weird }}/{{ MAX_METER }} ·
                  {{ game.run.substanceMoments.length }} remembered moments
                </p>
              </section>
            </div>
          </div>
        </template>
      </div>

      <div v-else-if="tab === 'cases'" class="kr-scroll h-full p-3 sm:p-5">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div class="max-w-2xl">
            <h2 class="font-serif text-2xl font-black">
              Case Files {{ game.casesOpened }}/{{ game.caseTotal }}
            </h2>
            <p class="text-sm text-white/70">
              Every weekend, one local mystery finds you: a text, a voicemail, a
              flyer on a pole. It interrupts the road three times. Pass two of
              its three gates and the true path opens; what you decide at the
              reveal chooses its Real Ending. Cases you have not opened come
              first.
            </p>
          </div>
          <div class="flex gap-3 text-xs text-white/70">
            <span class="flex items-center gap-1.5"
              ><span class="h-1.5 w-4 rounded-full bg-[#8fb8b0]" /> Passed</span
            >
            <span class="flex items-center gap-1.5"
              ><span class="h-1.5 w-4 rounded-full bg-[#e08a5a]" /> Failed</span
            >
            <span class="flex items-center gap-1.5"
              ><span class="h-1.5 w-4 rounded-full bg-white/20" /> Not
              reached</span
            >
          </div>
        </div>
        <div
          class="mt-4 grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_minmax(320px,26rem)]"
        >
          <div
            class="grid grid-cols-3 content-start gap-2.5 @md:grid-cols-4 @2xl:grid-cols-6 @4xl:grid-cols-4 @6xl:grid-cols-6"
          >
            <button
              v-for="item in MYSTERIES"
              :key="item.id"
              type="button"
              class="rounded-xl outline-offset-2 transition hover:-translate-y-0.5"
              :class="
                selectedCase?.id === item.id
                  ? 'outline outline-2 outline-[#d9b877]'
                  : ''
              "
              :aria-pressed="selectedCase?.id === item.id"
              @click="caseId = item.id"
            >
              <EcotoneMysteryCard
                :mystery="item"
                :locked="!game.caseFiles[item.id]"
                :record="game.caseFiles[item.id]"
              />
            </button>
          </div>
          <section
            v-if="selectedCase"
            class="self-start rounded-3xl border border-white/10 bg-black/30 p-4"
          >
            <p class="eco-label">
              Case {{ caseNumeral(selectedCase.number) }}
              <span
                v-if="game.mystery?.id === selectedCase.id && game.run"
                class="ml-1 rounded-full bg-[#d9b877] px-2 py-0.5 text-[10px] text-[#09141c]"
                >This run</span
              >
            </p>
            <template v-if="selectedRecord">
              <h3 class="mt-1 font-serif text-2xl font-black leading-tight">
                {{ selectedCase.title }}
              </h3>
              <p
                class="text-xs font-bold uppercase tracking-[.18em] text-[#8fb8b0]"
              >
                {{ selectedCase.region }}
              </p>
              <p class="mt-3 font-serif leading-relaxed">
                {{ selectedCase.hook }}
              </p>
              <ol class="mt-4 grid gap-2">
                <li
                  v-for="(gate, index) in selectedCase.gates"
                  :key="index"
                  class="flex items-center gap-3 rounded-xl border border-white/10 p-2.5"
                >
                  <span
                    class="grid size-8 shrink-0 place-items-center rounded-full font-serif text-sm font-black"
                    :class="gateClass(selectedRecord.gates[index] ?? null)"
                    >{{ caseNumeral(index + 1) }}</span
                  >
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-bold">{{
                      selectedRecord.gates[index]
                        ? gate.title
                        : `Gate ${caseNumeral(index + 1)}`
                    }}</span>
                    <span class="block text-xs text-white/60">{{
                      selectedRecord.gates[index] === 'pass'
                        ? 'Passed'
                        : selectedRecord.gates[index] === 'fail'
                          ? 'Failed: another run can pass it'
                          : 'Not reached yet'
                    }}</span>
                  </span>
                </li>
              </ol>
              <div
                class="mt-3 rounded-xl p-3 text-sm"
                :class="
                  selectedRecord.truePath
                    ? 'border border-[#f6c55a]/50 bg-[#f6c55a]/10'
                    : 'bg-black/30'
                "
              >
                <p class="eco-label">
                  True path ·
                  {{
                    selectedRecord.truePath
                      ? 'opened'
                      : `needs ${PASSES_FOR_TRUE_PATH} passed gates in one run`
                  }}
                </p>
                <p
                  v-if="selectedRecord.cold && !selectedRecord.truePath"
                  class="mt-1 text-xs text-white/60"
                >
                  The trail has gone cold before. It can warm up again.
                </p>
              </div>
              <p class="eco-label mt-4">
                Real Endings {{ selectedRecord.endings.length }}/{{
                  selectedCase.endings.length
                }}
              </p>
              <ul class="mt-2 grid gap-1.5">
                <li
                  v-for="ending in selectedCase.endings"
                  :key="ending.id"
                  class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  :class="
                    selectedRecord.endings.includes(ending.id)
                      ? 'border-[#d9b877]/50'
                      : 'border-dashed border-white/15 text-white/45'
                  "
                >
                  <Icon
                    :name="
                      selectedRecord.endings.includes(ending.id)
                        ? 'kind-icon:star'
                        : 'kind-icon:lock'
                    "
                    class="size-3.5 shrink-0"
                  />
                  <span class="flex-1 font-serif font-bold">{{
                    selectedRecord.endings.includes(ending.id)
                      ? ending.title
                      : 'Unfound ending'
                  }}</span>
                  <span class="text-[10px] uppercase tracking-wider">{{
                    TONE_LABEL[ending.tone]
                  }}</span>
                </li>
              </ul>
            </template>
            <template v-else>
              <h3 class="mt-1 font-serif text-2xl font-black">Unopened</h3>
              <p class="mt-2 text-sm text-white/70">
                Somewhere in the county a case is waiting. When its weekend
                comes, someone will text you about it. Unopened cases come up
                before ones you have seen.
              </p>
            </template>
          </section>
        </div>
      </div>

      <div v-else class="kr-scroll h-full p-3 sm:p-5">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 class="font-serif text-2xl font-black">
              Endings {{ game.unlockedCount }}/{{ game.endingTotal }}
            </h2>
            <p class="text-sm text-white/70">
              Who you finish with (or nobody) × your opening lens × the future
              your stats earned, plus the Wild Way for finishing the quiet route
              alone: {{ game.endingTotal / 2 }} hopeful,
              {{ game.endingTotal / 2 }}
              dark. Each unlocks when you earn it in play.
            </p>
          </div>
          <div class="flex gap-3 text-xs text-white/70">
            <span class="flex items-center gap-1.5"
              ><span class="ecotone-fate-hope size-3 rounded-full" />
              Hopeful</span
            >
            <span class="flex items-center gap-1.5"
              ><span class="ecotone-fate-dark size-3 rounded-full" /> Dark</span
            >
          </div>
        </div>
        <div class="mt-3 grid gap-3 @4xl:grid-cols-2">
          <section
            v-for="row in endingRows"
            :key="row.id"
            class="rounded-3xl border border-white/10 bg-black/25 p-3"
          >
            <div class="flex items-center gap-2">
              <EcotoneEmblem
                v-if="row.companion"
                :id="row.companion"
                :name="row.name"
                class="size-9"
              />
              <span
                v-else
                class="grid size-9 place-items-center rounded-full border border-white/20 bg-black/40"
              >
                <Icon
                  :name="
                    row.id === 'ecotopia' ? 'kind-icon:tree' : 'kind-icon:user'
                  "
                  class="size-5 text-white/70"
                />
              </span>
              <h3 class="font-serif text-lg font-black">
                {{ row.name }}
              </h3>
              <span class="ml-auto text-xs text-white/60"
                >{{ endingsFor(row.id) }}/14</span
              >
            </div>
            <div class="mt-2 grid grid-cols-7 gap-1.5">
              <div
                v-for="slot in slotsFor(row.id)"
                :key="slot.id"
                class="flex aspect-[2/3] flex-col items-center justify-center rounded-lg border bg-cover bg-center text-center"
                :class="
                  slot.unlocked
                    ? 'border-[#d9b877] bg-[#d9b877]/20'
                    : 'border-white/10 bg-white/5'
                "
                :style="slotBack"
                :title="`${slot.unlocked && slot.title ? `${slot.title}: ` : ''}${slot.lens} · ${slot.fate === 'hope' ? 'hopeful' : 'dark'} · ${slot.unlocked ? 'earned' : 'locked'}`"
              >
                <span
                  class="size-3 rounded-full"
                  :class="
                    slot.fate === 'hope'
                      ? 'ecotone-fate-hope'
                      : 'ecotone-fate-dark'
                  "
                />
                <span
                  class="mt-0.5 text-[9px] font-bold leading-tight text-white/50"
                  >{{ slot.short }}</span
                >
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>

    <nav
      class="flex shrink-0 flex-wrap justify-center gap-x-1 gap-y-1 border-t border-[#c9a96e]/20 bg-[#070f15] px-2 py-2"
      role="tablist"
      aria-label="Ecotone views"
    >
      <button
        v-for="item in tabs"
        :key="item.value"
        type="button"
        role="tab"
        class="rounded-full px-1.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b877] @md:px-2.5 @md:text-[11px] @md:tracking-[.2em] @xl:px-4 @xl:text-xs"
        :class="
          tab === item.value
            ? 'bg-[#d9b877]/15 text-[#d9b877]'
            : 'text-[#f3e6c8]/60 hover:text-[#f3e6c8]'
        "
        :aria-selected="tab === item.value"
        @click="tab = item.value"
      >
        {{ item.label }}
      </button>
    </nav>

    <input
      ref="portraitInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="sr-only"
      aria-label="Upload a private Ecotone character portrait"
      @change="uploadPortrait"
    />

    <dialog
      ref="stylePicker"
      class="modal"
      aria-labelledby="ecotone-style-heading"
    >
      <div
        class="modal-box max-w-2xl border border-[#c9a96e]/40 bg-[#0c1a24] text-[#f3e6c8]"
      >
        <p id="ecotone-style-heading" class="eco-label">
          Choose your art style
        </p>
        <p class="mt-1 text-sm text-[#f3e6c8]/70">
          Only changes how the county looks. Your weekend plays the same.
        </p>
        <div
          class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3"
          role="radiogroup"
          aria-label="Art style"
        >
          <button
            v-for="option in ECOTONE_ART_STYLES"
            :key="option.id"
            type="button"
            role="radio"
            :aria-checked="artStyle === option.id"
            class="overflow-hidden rounded-xl border-2 text-left transition"
            :class="
              artStyle === option.id
                ? 'border-[#d9b877]'
                : 'border-[#c9a96e]/25 hover:border-[#c9a96e]/60'
            "
            @click="artStyle = option.id"
          >
            <span class="relative block aspect-[16/10]">
              <EcotoneScene
                kind="meadow"
                :art="ECOTONE_STYLE_SAMPLE"
                :art-style="option.id"
                :label="`${option.label} example: the festival meadow`"
                class="absolute inset-0"
              />
              <span
                v-if="option.id === DEFAULT_ECOTONE_ART_STYLE"
                class="absolute left-2 top-2 rounded-full bg-[#09141c]/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                >Default</span
              >
              <span
                v-if="
                  option.lane &&
                  !styleHasRender(option.id, ECOTONE_STYLE_SAMPLE)
                "
                class="absolute bottom-2 right-2 rounded-full bg-[#09141c]/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#d9b877]"
                >Renders in progress</span
              >
            </span>
            <span class="block p-3">
              <span
                class="flex items-center gap-1.5 font-serif text-lg font-black uppercase tracking-wider"
              >
                <Icon
                  v-if="artStyle === option.id"
                  name="kind-icon:check"
                  class="size-4 text-[#d9b877]"
                />
                {{ option.label }}
              </span>
              <span class="block text-xs text-[#f3e6c8]/70">{{
                option.blurb
              }}</span>
              <span
                v-if="option.checkpoint"
                class="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[#c9a96e]/80"
                >{{ option.checkpoint }}</span
              >
            </span>
          </button>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button type="submit" class="eco-gold-button">Done</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
} from 'vue'
import { useEcotoneStore } from '~/stores/ecotoneStore'
import {
  readPrivateEcotonePortrait,
  uploadPrivateEcotonePortrait,
} from '~/utils/ecotone/privatePortrait'
import {
  ARCHETYPES,
  CHAPTERS,
  COMPANIONS,
  CROSSROADS,
  ENDING_LENSES,
  LENSES,
  SKILLS,
  type Check,
  type CompanionId,
  type Effects,
  type EndingLine,
  type LensId,
  type SceneKind,
  type SkillId,
} from '~/utils/ecotone/content'
import {
  LEAD_BONUS,
  MAX_METER,
  cardAsides,
  cardBody,
  chanceToSucceed,
  checkBonus,
  originPerkAvailable,
  currentStep,
  dayName,
  fillText,
  type Roll,
} from '~/utils/ecotone/engine'
import {
  EVENTS,
  EVENT_CHOICE,
  FORK_PROMPT,
  FUTURES,
  LENS_CODAS,
  SIGNATURES,
} from '~/utils/ecotone/story'
import { earnedQuestCallbacks } from '~/utils/ecotone/finaleExpansion'
import { ensembleFuture } from '~/utils/ecotone/ensembleFuture'
import { earnedCompanionHangoutCallbacks } from '~/utils/ecotone/companionHangouts'
import {
  DEFAULT_ECOTONE_ART_STYLE,
  ECOTONE_ART_STYLES,
  ECOTONE_ART_STYLE_INJECTION,
  ECOTONE_STYLE_SAMPLE,
  ecotoneArtFirst,
  ecotoneArtSrc,
  loadEcotoneArtStyle,
  saveEcotoneArtStyle,
  styleHasRender,
  type EcotoneArtStyle,
} from '~/utils/ecotone/artStyles'
import { cardArtKey, endingArtKey } from '~/utils/ecotone/artSlots'
import {
  contextualOpeningChoices,
  contextualOfferLine,
  sceneMomentOffer,
} from '~/utils/ecotone/sceneOffers'
import {
  PLAYER_AVATARS,
  PLAYER_PERSONALITIES,
  playerAvatarSrc,
} from '~/utils/ecotone/playerIdentity'
import {
  loadEcotoneDisplay,
  saveEcotoneDisplay,
} from '~/utils/ecotone/displaySettings'
import { philosophyNeedles } from '~/utils/ecotone/valueNeedles'
import { substanceEpilogue } from '~/utils/ecotone/substanceArc'
import {
  MYSTERIES,
  PASSES_FOR_TRUE_PATH,
  caseNumeral,
  caseRecord,
  mysteryEndingArtKey,
  type CaseRecord,
  type GateResult,
  type Mystery,
  type MysteryEndingTone,
  type MysteryMessage,
} from '~/utils/ecotone/mysteries'

type Tab =
  'road' | 'guides' | 'county' | 'journal' | 'endings' | 'cases' | 'settings'

const game = useEcotoneStore()
const tab = ref<Tab>('road')
const picked = ref<string>('reporter')
const characterName = ref('')
const pickedAvatar = ref<string>('glitter')
const failedAvatarPortraits = ref<string[]>([])
const portraitRetry = ref(0)
const headerPortraitFailed = ref(false)
const portraitInput = ref<HTMLInputElement | null>(null)
const uploadingPortrait = ref(false)
const portraitNotice = ref('')
const customPortraitId = ref<number | null>(null)
const customPortraitUrl = ref('')
const uploadedPreviewUrl = ref('')
const activePlayerPortrait = computed(() =>
  game.run?.avatarId === 'custom'
    ? customPortraitUrl.value
    : PLAYER_AVATARS.find((avatar) => avatar.id === game.run?.avatarId)
          ?.portrait
      ? `${playerAvatarSrc(PLAYER_AVATARS.find((avatar) => avatar.id === game.run?.avatarId)!.portrait)}?retry=${portraitRetry.value}`
      : '',
)
watch(activePlayerPortrait, () => {
  headerPortraitFailed.value = false
})
const pickedPersonality = ref<string>('curious')
const displayScale = ref(1.2)
const textSpeed = ref<'instant' | 'normal' | 'slow'>('instant')
const saveNotice = ref('')
const saveImportInput = ref<HTMLInputElement | null>(null)
const revealCount = ref(0)
let revealTimer: ReturnType<typeof setInterval> | null = null
const continueButton = ref<HTMLButtonElement | null>(null)
const momentOffer = computed(() =>
  game.run && game.card ? sceneMomentOffer(game.card, game.run) : null,
)
const perkSelected = ref(false)
const canTakeMoment = computed(() => {
  const run = game.run
  return Boolean(
    run?.phase === 'beat' &&
    !run.pending &&
    run.openingState &&
    run.card &&
    momentOffer.value &&
    !run.substanceMoments.some((moment) => moment.source === run.card),
  )
})
const substanceCoda = computed(() =>
  game.run ? substanceEpilogue(game.run.substanceMoments) : null,
)
const philosophy = computed(() => (game.run ? philosophyNeedles(game.run) : []))
watch(
  () => game.run?.card,
  () => {
    perkSelected.value = false
  },
)

const tabs: { value: Tab; label: string }[] = [
  { value: 'road', label: 'Journey' },
  { value: 'guides', label: 'Guides' },
  { value: 'county', label: 'Map' },
  { value: 'journal', label: 'Journal' },
  { value: 'endings', label: 'Endings' },
  { value: 'cases', label: 'Cases' },
  { value: 'settings', label: 'Settings' },
]

// Mysteries (conductor weird-humboldt t-062): the Case Files shelf and the
// digressions that open each gate.
const caseId = ref<string | null>(null)
const selectedCase = computed<Mystery | null>(
  () =>
    MYSTERIES.find((item) => item.id === caseId.value) ??
    (game.mystery && game.caseFiles[game.mystery.id] ? game.mystery : null) ??
    MYSTERIES.find((item) => game.caseFiles[item.id]) ??
    MYSTERIES[0] ??
    null,
)
const selectedRecord = computed<CaseRecord | null>(() =>
  selectedCase.value ? (game.caseFiles[selectedCase.value.id] ?? null) : null,
)
const runCase = computed(() => (game.run ? caseRecord(game.run) : null))
const TONE_LABEL: Record<MysteryEndingTone, string> = {
  true: 'True',
  bittersweet: 'Bittersweet',
  strange: 'Strange',
}

function rewindDecision() {
  game.undo()
  tab.value = 'road'
}

function openCase(id: string) {
  caseId.value = id
  tab.value = 'cases'
}

function gateClass(gate: GateResult) {
  return gate === 'pass'
    ? 'bg-[#8fb8b0] text-[#09141c]'
    : gate === 'fail'
      ? 'bg-[#e08a5a] text-[#09141c]'
      : 'border border-white/20 text-white/50'
}

function gateSummary(record: CaseRecord) {
  return record.gates
    .map((gate) => (gate === 'pass' ? '✓' : gate === 'fail' ? '✗' : '·'))
    .join(' ')
}

function caseVerdict(record: CaseRecord) {
  if (record.endings.length) return 'Case closed'
  if (record.cold) return 'Gone cold'
  if (record.gates.every((gate) => gate === null)) return 'Walked away'
  return 'Open'
}

function messageLabel(message: MysteryMessage) {
  return {
    text: 'Text',
    voicemail: 'Voicemail',
    note: 'Note',
    flyer: 'Flyer',
    radio: 'Radio',
    email: 'Email',
  }[message.medium]
}

function messageIcon(message: MysteryMessage) {
  return message.medium === 'text' || message.medium === 'email'
    ? 'kind-icon:message'
    : message.medium === 'voicemail' || message.medium === 'radio'
      ? 'kind-icon:phone'
      : 'kind-icon:document'
}

// Art style (conductor weird-humboldt t-039): view-only, shared with every
// scene through provide/inject, remembered per browser by the helpers.
const artStyle = ref<EcotoneArtStyle>(DEFAULT_ECOTONE_ART_STYLE)
provide(ECOTONE_ART_STYLE_INJECTION, artStyle)
watch(artStyle, saveEcotoneArtStyle)
const currentStyle = computed(
  () =>
    ECOTONE_ART_STYLES.find((s) => s.id === artStyle.value) ??
    ECOTONE_ART_STYLES[0],
)
const stylePicker = ref<HTMLDialogElement | null>(null)

function openStylePicker() {
  stylePicker.value?.showModal()
}

watch([displayScale, textSpeed], () =>
  saveEcotoneDisplay({ scale: displayScale.value, speed: textSpeed.value }),
)

function stopReveal() {
  if (revealTimer) clearInterval(revealTimer)
  revealTimer = null
}

function revealAll() {
  stopReveal()
  revealCount.value = storyText.value.length
}
function saveGame(slot: number) {
  saveNotice.value = game.saveSlot(slot)
    ? `Saved in slot ${slot}.`
    : 'Start a run before saving.'
}
function loadGame(slot: number) {
  if (
    game.run &&
    !window.confirm(`Replace your active journey with slot ${slot}?`)
  )
    return
  const loaded = game.loadSlot(slot)
  saveNotice.value = loaded
    ? `Loaded slot ${slot}.`
    : 'That save could not be loaded.'
  if (loaded) tab.value = 'road'
}
function removeSave(slot: number) {
  if (!window.confirm(`Delete manual save in slot ${slot}?`)) return
  game.deleteSlot(slot)
  saveNotice.value = `Deleted slot ${slot}.`
}
function exportGame() {
  const saved = game.exportSave()
  if (!saved) {
    saveNotice.value = 'Start a run before exporting.'
    return
  }
  const blob = new Blob([saved], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'ecotone-save.json'
  link.click()
  URL.revokeObjectURL(url)
  saveNotice.value = 'Exported a JSON copy of this journey.'
}
async function importGame(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    if (file.size > 1024 * 1024) throw new Error('Save exceeds 1 MB.')
    const data: unknown = JSON.parse(await file.text())
    if (
      game.run &&
      !window.confirm('Replace this journey with the imported save?')
    )
      return
    if (!game.importSave(data))
      throw new Error('Unsupported or invalid save format.')
    saveNotice.value = 'Imported journey successfully.'
    tab.value = 'road'
  } catch (error) {
    saveNotice.value =
      error instanceof Error ? error.message : 'Unable to import save.'
  } finally {
    input.value = ''
  }
}

const PIPS: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

onMounted(() => {
  const savedDisplay = loadEcotoneDisplay()
  displayScale.value = savedDisplay.scale
  textSpeed.value = savedDisplay.speed
  artStyle.value = loadEcotoneArtStyle()
  game.initialize()
})

const pending = computed(() => game.run?.pending?.entry ?? null)

// Each new beat starts at the top of the stage (the Continue focus may
// have scrolled it on a phone).
const playScroll = ref<HTMLElement | null>(null)
watch(
  () =>
    pending.value ? null : `${game.run?.phase}:${game.run?.log.length ?? 0}`,
  (key) => {
    if (key) playScroll.value?.scrollTo({ top: 0 })
  },
)

watch(pending, async (value) => {
  if (!value) return
  await nextTick()
  continueButton.value?.focus()
})

onUnmounted(stopReveal)

const eventInfo = computed(() => EVENTS.find((e) => e.id === game.run?.event))
function pad(n: number) {
  return String(n).padStart(2, '0')
}

const chapterLine = computed(() => {
  const run = game.run
  if (!run) return 'A weekend in Weird Humboldt'
  if (!eventInfo.value) return 'Day 00 / Choosing a weekend'
  return `Day ${pad(run.day)} / ${eventInfo.value.name}`
})
const placeLine = computed(() => {
  const run = game.run
  if (!run || !stage.value.place) return ''
  return `${stage.value.place} · ${dayName(run)}`
})
const signature = computed(() => {
  const ending = game.ending
  return ending
    ? (SIGNATURES[`${ending.lead}.${ending.lens}`]?.[ending.fate] ?? null)
    : null
})
const questCallbacks = computed(() => {
  const run = game.run
  return run ? earnedQuestCallbacks(run.flags, run.played) : []
})
const hangoutCallbacks = computed(() =>
  game.run ? earnedCompanionHangoutCallbacks(game.run.flags) : [],
)
const sharedFuture = computed(() =>
  game.run && game.ending ? ensembleFuture(game.run, game.ending.fate) : null,
)
const archetype = computed(() =>
  ARCHETYPES.find((a) => a.id === game.run?.archetype),
)

function retryPortraits() {
  failedAvatarPortraits.value = []
  headerPortraitFailed.value = false
  portraitRetry.value += 1
}
function openPortraitUpload() {
  portraitInput.value?.click()
}
function changePlayerLook(id: string) {
  game.setPlayerLook(id, customPortraitId.value)
  retryPortraits()
}
async function loadPrivatePortrait(id: number) {
  if (!import.meta.client || !Number.isInteger(id) || id <= 0) return
  try {
    const src = await readPrivateEcotonePortrait(id)
    if (customPortraitId.value === id) customPortraitUrl.value = src
  } catch {
    portraitNotice.value =
      'This private portrait could not be loaded. Select another look or upload it again.'
  }
}
watch(
  () => game.run?.portraitArtId,
  (id) => {
    if (!id) return
    customPortraitId.value = id
    void loadPrivatePortrait(id)
  },
  { immediate: true },
)
async function uploadPortrait(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  ) {
    portraitNotice.value = 'Choose a JPEG, PNG or WebP image under 8 MB.'
    return
  }
  uploadingPortrait.value = true
  portraitNotice.value = ''
  try {
    const id = await uploadPrivateEcotonePortrait(file)
    if (uploadedPreviewUrl.value) URL.revokeObjectURL(uploadedPreviewUrl.value)
    uploadedPreviewUrl.value = URL.createObjectURL(file)
    customPortraitUrl.value = uploadedPreviewUrl.value
    customPortraitId.value = id
    if (game.run) game.setPlayerLook('custom', id)
    else pickedAvatar.value = 'custom'
    portraitNotice.value =
      'Private portrait saved. You can switch looks at any time.'
    retryPortraits()
  } catch {
    portraitNotice.value =
      'Unable to upload. Sign in and try again; your current look is unchanged.'
  } finally {
    uploadingPortrait.value = false
  }
}
onUnmounted(() => {
  if (uploadedPreviewUrl.value) URL.revokeObjectURL(uploadedPreviewUrl.value)
})

function start() {
  if (!picked.value) return
  game.begin(picked.value, {
    playerName: characterName.value,
    avatarId: pickedAvatar.value,
    personalityId: pickedPersonality.value,
    portraitArtId: customPortraitId.value,
  })
  tab.value = 'road'
}

function restart() {
  game.abandon()
  tab.value = 'road'
}

function companionName(id: CompanionId) {
  return COMPANIONS.find((c) => c.id === id)?.name ?? id
}

function leadName(id: EndingLine) {
  if (id === 'ecotopia') return 'The Wild Way'
  return id === 'alone' ? 'Alone' : companionName(id)
}

function lensLabel(id: LensId) {
  return LENSES.find((l) => l.id === id)?.label ?? id
}

function skillLabel(id: SkillId) {
  return SKILLS.find((s) => s.id === id)?.label ?? id
}

function checkChip(check: Check) {
  if (!game.run) return { chip: '', title: '' }
  const bonus = checkBonus(game.run, check)
  const chance = Math.round(chanceToSucceed(check.target - bonus) * 100)
  return {
    chip: `${skillLabel(check.skill)} ${check.target} · ${chance}%`,
    title: `Roll 2d6 ${bonus >= 0 ? '+' : '−'} ${Math.abs(bonus)} and reach ${check.target}`,
  }
}

function rollParts(roll: Roll) {
  return (
    roll.parts
      .filter((part) => part.value !== 0)
      .map(
        (part) =>
          `${part.label} ${part.value > 0 ? '+' : '−'}${Math.abs(part.value)}`,
      )
      .join(' · ') || 'No modifiers'
  )
}

function effectChips(effects: Effects) {
  const chips: string[] = []
  if (effects.nerve)
    chips.push(`Nerve ${effects.nerve > 0 ? '+' : ''}${effects.nerve}`)
  if (effects.goodwill) chips.push(`Goodwill +${effects.goodwill}`)
  if (effects.weird) chips.push(`Weird +${effects.weird}`)
  if (effects.evidence) chips.push('Evidence logged')
  if (effects.flag) chips.push('Remembered')
  return chips
}

function guideStatus(id: CompanionId) {
  if (!game.run) return 'Somewhere in the county'
  if (game.lead?.id === id) return 'Your lead guide'
  if (game.party.some((companion) => companion.id === id))
    return 'Traveling with you'
  if (game.companionMet(id)) return 'Met · on their own path'
  return 'Not met yet'
}

function chapterState(n: number) {
  if (!game.run) return 'ahead'
  if (n === game.chapter && game.run.phase !== 'end') return 'current'
  if (n < game.chapter || (game.run.phase === 'end' && n <= game.chapter))
    return 'visited'
  return 'ahead'
}

type Stage = {
  scene: SceneKind
  /** Pictures to try, most specific first (artSlots.ts). */
  art?: string | string[]
  alt: string
  /** The kind pill above the title. */
  kicker: string
  title: string
  subtitle: string
  /** Where the beat happens, for the top bar. */
  place: string
  /** Name, role and line of a companion met here. */
  meet: null | { name: string; role: string; line: string }
  /** The dialogue panel's gold label, and an optional closing line. */
  panelKicker: string
  panelFooter: string
  /** The choices panel's heading. */
  question: string
  body: string[]
  lensLine: string
  asides: string[]
  portrait: boolean
  emblem: null | { id: CompanionId; name: string }[]
  /** A mystery scene shows its case card and, at a gate, the digression. */
  mysteryCard?: Mystery | null
  message?: MysteryMessage | null
  /** The Real Ending a finale choice just reached. */
  realEnding?: string | null
}

const stage = computed<Stage>(() => {
  const run = game.run
  const leadEmblem = game.party.length
    ? game.party.map((companion) => ({
        id: companion.id,
        name: companion.name,
      }))
    : null
  const fallback: Stage = {
    scene: EVENT_CHOICE.scene,
    art: EVENT_CHOICE.art,
    alt: 'Two flyers on a telephone pole on the Arcata Plaza',
    kicker: 'Opening',
    title: EVENT_CHOICE.title,
    subtitle: EVENT_CHOICE.place,
    place: EVENT_CHOICE.place.split(',')[0] ?? '',
    meet: null,
    panelKicker: 'The weekend begins',
    panelFooter: '',
    question: 'Choose your weekend',
    body: EVENT_CHOICE.body,
    lensLine: '',
    asides: [],
    portrait: false,
    emblem: null,
  }
  if (!run || run.phase === 'event') return fallback
  if (run.phase === 'crossroads' && game.newcomer) {
    const n = game.newcomer
    const emblem = [
      ...game.party.map((companion) => ({
        id: companion.id,
        name: companion.name,
      })),
      { id: n.id, name: n.name },
    ]
    return {
      ...fallback,
      scene: 'bay',
      art: n.art,
      alt: `${n.name}, ${n.role}`,
      portrait: true,
      kicker: 'Companion encounter',
      title: 'Someone worth following',
      subtitle: `${n.name} crosses your path`,
      place: eventInfo.value?.name ?? '',
      meet: { name: n.name, role: n.role, line: n.line },
      panelKicker: 'A crossroads, not a character select',
      panelFooter:
        'All three answers are valid; nobody owes you their company.',
      question: 'Who walks with you?',
      body: CROSSROADS[n.id],
      emblem,
    }
  }
  if (run.phase === 'fork') {
    const step = currentStep(run)
    return {
      ...fallback,
      scene: step?.kind === 'fork' ? step.scene : 'plaza',
      art: undefined,
      alt: 'A foggy crossroads with several paths',
      kicker: `Day ${pad(run.day)} · The road splits`,
      title: step?.kind === 'fork' ? step.title : 'Where to?',
      subtitle: `${dayName(run)}, ${eventInfo.value?.name ?? 'Humboldt'}`,
      place: eventInfo.value?.name ?? '',
      panelKicker: 'Where to next?',
      question: 'Where to?',
      body: [FORK_PROMPT],
      emblem: leadEmblem,
    }
  }
  if (run.phase === 'end') {
    return {
      ...fallback,
      scene: eventInfo.value?.scene ?? 'dunes',
      art: [
        ...(game.ending ? [endingArtKey(game.ending.id)] : []),
        game.ending?.lead === 'ecotopia'
          ? 'encounters/arcata-marsh'
          : (eventInfo.value?.art ?? 'chapters/the-impossible-festival'),
      ],
      alt: eventInfo.value?.name ?? 'The Humboldt of your future',
      kicker: 'The Humboldt of your future',
      title: signature.value?.title ?? 'What comes next',
      subtitle: game.ending
        ? `${leadName(game.ending.lead)} · ${lensLabel(game.ending.lens)}`
        : '',
      place: eventInfo.value?.name ?? '',
      body: [],
      emblem: leadEmblem,
    }
  }
  const card = game.card
  if (run.phase === 'beat' && card) {
    // Once a choice resolves, its outcome's own picture takes the stage.
    const outcome = pending.value?.art
    const outcomeShown = Boolean(
      outcome && ecotoneArtSrc(outcome, artStyle.value),
    )
    const portrait =
      card.choices.some((choice) => choice.meet !== undefined) && !outcomeShown
    const prospect = game.prospect
    const cardArt = [cardArtKey(card.id), ...(card.art ? [card.art] : [])]
    const meta = game.mysteryMeta
    const numeral = meta ? caseNumeral(meta.mystery.number) : ''
    const realEnding =
      meta && pending.value && game.realEnding ? game.realEnding.title : null
    return {
      scene: card.scene,
      art:
        portrait && prospect
          ? prospect.art
          : outcome
            ? [
                ...(realEnding && meta && game.realEnding
                  ? [mysteryEndingArtKey(meta.mystery.id, game.realEnding.id)]
                  : []),
                outcome,
                ...cardArt,
              ]
            : cardArt,
      alt:
        portrait && prospect
          ? `${prospect.name}, ${prospect.role}`
          : card.title,
      kicker: meta
        ? realEnding
          ? `Case ${numeral} · Real Ending`
          : meta.kind === 'gate'
            ? `Case ${numeral} · Gate ${caseNumeral(meta.gate ?? 1)} of III`
            : meta.kind === 'cold'
              ? `Case ${numeral} · The trail goes cold`
              : `Case ${numeral} · The true path`
        : portrait
          ? 'Companion encounter'
          : card.id.startsWith('CO-')
            ? 'Companion interlude'
            : card.kind === 'spine'
              ? `Story beat · ${card.id}`
              : `Encounter · ${card.id}`,
      title: realEnding ?? card.title,
      subtitle: realEnding && meta ? meta.mystery.title : card.place,
      place: card.place.split(',')[0] ?? card.place,
      meet:
        portrait && prospect
          ? { name: prospect.name, role: prospect.role, line: prospect.line }
          : null,
      panelKicker: `Day ${pad(run.day)} · ${dayName(run)}`,
      panelFooter: card.choices.some((choice) => choice.lens)
        ? 'Your first perspective stays with you. Every future remains possible.'
        : '',
      question: card.choices.some((choice) => choice.lens)
        ? 'What draws your attention here?'
        : 'How do you answer?',
      body: [
        ...cardBody(card, run),
        ...(contextualOfferLine(card, run)
          ? [contextualOfferLine(card, run)!]
          : []),
      ].map((paragraph) => fillText(paragraph, run)),
      lensLine: run.currentState
        ? (card.lensLines?.[run.currentState] ?? '')
        : '',
      asides: cardAsides(card, run),
      portrait,
      emblem:
        portrait && prospect
          ? [{ id: prospect.id, name: prospect.name }]
          : leadEmblem,
      mysteryCard: meta?.mystery ?? null,
      message: meta?.message ?? null,
      realEnding,
    }
  }
  return fallback
})

const storyText = computed(
  () => pending.value?.text ?? stage.value.body.join('\n\n'),
)
const revealedBody = computed(() => {
  if (textSpeed.value === 'instant') return stage.value.body
  let remaining = revealCount.value
  return stage.value.body
    .map((paragraph) => {
      const result = paragraph.slice(0, Math.max(0, remaining))
      remaining -= paragraph.length + 2
      return result
    })
    .filter(Boolean)
})
const revealedResult = computed(() =>
  textSpeed.value === 'instant'
    ? (pending.value?.text ?? '')
    : (pending.value?.text ?? '').slice(0, revealCount.value),
)
const hasHiddenText = computed(
  () =>
    textSpeed.value !== 'instant' && revealCount.value < storyText.value.length,
)
watch(
  [storyText, textSpeed, tab],
  () => {
    stopReveal()
    if (
      textSpeed.value === 'instant' ||
      tab.value !== 'road' ||
      (import.meta.client &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      revealCount.value = storyText.value.length
      return
    }
    revealCount.value = 0
    revealTimer = setInterval(
      () => {
        revealCount.value = Math.min(
          storyText.value.length,
          revealCount.value + (textSpeed.value === 'normal' ? 8 : 3),
        )
        if (revealCount.value >= storyText.value.length) stopReveal()
      },
      textSpeed.value === 'normal' ? 25 : 45,
    )
  },
  { immediate: true },
)

const portraitSrc = computed(() =>
  stage.value.portrait
    ? ecotoneArtFirst(stage.value.art, artStyle.value)
    : null,
)

type Option = {
  id: string
  label: string
  hint?: string
  chip?: string
  chipTitle?: string
  preview?: string
  possibilities?: string
  disabled?: boolean
  perkEligible?: boolean
  thumb?: { scene: SceneKind; art?: string | string[] }
  act: () => void
}

function queueDecision(option: Option) {
  if (option.disabled) return
  option.act()
}

const options = computed<Option[]>(() => {
  const run = game.run
  if (!run) return []
  if (run.phase === 'event') {
    return EVENTS.map((event) => ({
      id: event.id,
      label: event.name,
      hint: `${event.kind}. ${event.blurb}`,
      chip: `${event.days.length} days`,
      chipTitle: 'Choose this route',
      preview: event.arrival,
      possibilities: event.possibilities,
      thumb: { scene: event.scene, art: event.art },
      act: () => game.pickEvent(event.id),
    }))
  }
  if (run.phase === 'fork') {
    return game.offered.map((card) => ({
      id: card.id,
      label: card.title,
      hint: `${card.place}. ${card.body[0]?.split('. ')[0] ?? ''}.`,
      chip: `Ch ${card.chapter}`,
      chipTitle: CHAPTERS.find((c) => c.number === card.chapter)?.name,
      thumb: {
        scene: card.scene,
        art: [cardArtKey(card.id), ...(card.art ? [card.art] : [])],
      },
      act: () => game.pickFork(card.id),
    }))
  }
  if (run.phase === 'crossroads' && game.newcomer) {
    const n = game.newcomer
    return [
      {
        id: 'stay',
        label: game.lead ? `Stay with ${game.lead.name}` : 'Keep going alone',
        hint: `${n.name} goes their own way, and remembers you.`,
        act: () => game.crossroads(false),
      },
      {
        id: 'follow',
        label: `Follow ${n.name}`,
        hint: game.lead
          ? `${game.lead.name} carries on alone. ${n.name} helps with ${skillLabel(LEAD_BONUS[n.id])} checks.`
          : `${n.name} helps with ${skillLabel(LEAD_BONUS[n.id])} checks.`,
        act: () => game.crossroads('follow'),
      },
      ...(game.lead
        ? [
            {
              id: 'together',
              label: `Invite ${n.name} to travel with us`,
              hint: `Keep ${game.lead.name} and welcome ${n.name}. Both contribute their strengths, but no roll gets stacked bonuses.`,
              act: () => game.crossroads('together'),
            },
          ]
        : []),
    ]
  }
  const card = game.card
  if (run.phase === 'beat' && card) {
    return contextualOpeningChoices(card, run).map((choice) => {
      const lens = choice.lens
        ? LENSES.find((l) => l.id === choice.lens)
        : undefined
      if (choice.locked)
        return {
          id: choice.id,
          label: choice.label,
          hint: 'This road is still being written.',
          chip: choice.locked,
          disabled: true,
          act: () => undefined,
        }
      const establishesPerspective = Boolean(choice.lens && !run.openingState)
      const chip =
        choice.check && !establishesPerspective
          ? checkChip(choice.check)
          : {
              chip: establishesPerspective
                ? 'Opening choice · No roll'
                : 'No roll',
              title: establishesPerspective
                ? 'Choosing your perspective does not require a skill check'
                : 'A sure thing',
            }
      const prospect = choice.prospect
        ? COMPANIONS.find((c) => c.id === choice.prospect)
        : undefined
      const hint =
        choice.cost ??
        (lens?.question
          ? `The question it asks: ${lens.question}`
          : choice.meet === true && game.prospect
            ? `${game.prospect.name} helps with ${skillLabel(LEAD_BONUS[game.prospect.id])} checks.`
            : prospect
              ? `Someone over there is worth meeting.`
              : undefined)
      return {
        id: choice.id,
        label: fillText(choice.label, run),
        hint: choice.wild
          ? [hint, 'Animal-first'].filter(Boolean).join(' · ')
          : hint,
        chip: chip.chip,
        chipTitle: chip.title,
        perkEligible: originPerkAvailable(run, choice.id),
        act: () => {
          game.choose(choice.id, perkSelected.value)
          perkSelected.value = false
        },
      }
    })
  }
  return []
})

const endingRows = computed(() => [
  ...COMPANIONS.map((c) => ({
    id: c.id as EndingLine,
    name: c.name,
    companion: c.id as CompanionId | null,
  })),
  { id: 'alone' as EndingLine, name: 'Alone', companion: null },
  { id: 'ecotopia' as EndingLine, name: 'The Wild Way', companion: null },
])

function slotsFor(id: EndingLine) {
  return ENDING_LENSES.flatMap((lens) =>
    (['hope', 'dark'] as const).map((fate) => {
      const key = `${id}.${lens}.${fate}`
      const label = lensLabel(lens)
      return {
        id: key,
        fate,
        lens: label,
        title: SIGNATURES[`${id}.${lens}`]?.[fate]?.title ?? '',
        short: LENSES.find((l) => l.id === lens)?.short ?? label,
        unlocked: game.endings.includes(key),
      }
    }),
  ).sort((a, b) => (a.fate === b.fate ? 0 : a.fate === 'hope' ? -1 : 1))
}

const slotBack = computed(() => {
  const url = ecotoneArtSrc('ui/card-back', artStyle.value)
  return url
    ? {
        backgroundImage: `linear-gradient(rgb(11 29 31 / 0.55), rgb(11 29 31 / 0.55)), url(${url})`,
      }
    : undefined
})

function endingsFor(id: EndingLine) {
  return game.endings.filter((key) => key.startsWith(`${id}.`)).length
}
</script>

<style scoped>
.eco-story-copy {
  font-size: calc(1.125rem * var(--eco-text-scale, 1.2));
  line-height: 1.55;
}
.eco-choice-main {
  font-size: calc(1rem * var(--eco-text-scale, 1.2));
  line-height: 1.35;
}
@container (min-width: 64rem) {
  .eco-story-copy {
    font-size: calc(1.25rem * var(--eco-text-scale, 1.2));
  }
}
.eco-pill {
  height: 2rem;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  border: 1px solid
    color-mix(in oklab, var(--color-base-content) 20%, transparent);
  background: var(--color-base-200);
  color: var(--color-base-content);
  padding: 0 0.85rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: border-color 0.15s;
}
.eco-pill-icon {
  width: 2rem;
  justify-content: center;
  padding: 0;
}
.eco-kicker {
  border-radius: 9999px;
  border: 1px solid rgb(143 184 176 / 0.55);
  background: rgb(18 40 44 / 0.75);
  padding: 0.3rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}
.eco-label {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #d9b877;
}
.eco-panel {
  position: relative;
  border-radius: 1rem;
  border: 1px solid rgb(201 169 110 / 0.45);
  background: rgb(10 22 31 / 0.92);
  padding: 1.1rem 1.25rem 1.1rem 1.6rem;
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(6px);
}
.eco-panel::before {
  content: '';
  position: absolute;
  inset: 0.85rem auto 0.85rem 0;
  width: 4px;
  border-radius: 9999px;
  background: #d9b877;
}
.eco-choices {
  border-radius: 1rem;
  border: 1px solid rgb(201 169 110 / 0.45);
  background: rgb(10 22 31 / 0.92);
  padding: 1rem;
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(6px);
}
.eco-choice {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.65rem;
  border: 1px solid rgb(201 169 110 / 0.3);
  background: rgb(20 38 48 / 0.85);
  padding: 0.9rem 1rem;
  text-align: left;
  transition:
    border-color 0.15s,
    background-color 0.15s;
}
.eco-choice.is-lead,
.eco-choice:hover:not(:disabled),
.eco-choice:focus-visible {
  border-color: #d9b877;
  outline: none;
}
.eco-choice.is-lead::before,
.eco-choice:hover:not(:disabled)::before {
  content: '';
  position: absolute;
  inset: 0.45rem auto 0.45rem 0.25rem;
  width: 3px;
  border-radius: 9999px;
  background: #d9b877;
}
.eco-choice:disabled {
  opacity: 0.4;
}
.eco-gold-button {
  display: inline-flex;
  min-height: 2.9rem;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 0.6rem;
  background: #d9b877;
  padding: 0.6rem 1.4rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #0b1820;
  transition: filter 0.15s;
}
.eco-gold-button:hover:not(:disabled) {
  filter: brightness(1.08);
}
.eco-gold-button:disabled {
  opacity: 0.5;
}
.eco-portrait {
  mask-image: linear-gradient(to bottom, black 70%, transparent);
}
@container (min-width: 56rem) {
  .eco-portrait {
    mask-image:
      linear-gradient(to right, transparent, black 28%),
      linear-gradient(to bottom, black 72%, transparent);
    mask-composite: intersect;
  }
}
.ecotone-fate-hope {
  background: radial-gradient(circle at 35% 35%, #fff3c4, #e0a93a);
  box-shadow: 0 0 6px rgb(224 169 58 / 0.6);
}
.ecotone-fate-dark {
  background: radial-gradient(circle at 70% 30%, transparent 38%, #8fa6ff 40%);
  box-shadow: inset 0 0 0 1px rgb(143 166 255 / 0.7);
}
.ecotone-pin {
  animation: ecotone-ping 2.4s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}
@keyframes ecotone-ping {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.25);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ecotone-pin {
    animation: none;
  }
}
</style>
