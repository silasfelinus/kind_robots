<template>
  <div
    class="kr-scroll journey-shell mx-auto max-w-[1650px] space-y-5 px-3 py-5 sm:px-6"
  >
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs font-black uppercase tracking-[.25em] text-warning">
          Private expedition · Interactive board preview
        </p>
        <h1 class="mt-1 font-serif text-3xl font-black sm:text-5xl">
          Zuzu: Shifting Lands
        </h1>
        <p class="mt-2 max-w-2xl text-sm opacity-75">
          Five changing lands. Fifteen encounters. One road that remembers.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/admin/worlds/zuzu" class="btn btn-outline btn-sm"
          >World Studio</NuxtLink
        >
        <button
          type="button"
          class="btn btn-outline btn-sm"
          @click="emit('legacy')"
        >
          Homestead workshop
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="confirmNew = !confirmNew"
        >
          New journey
        </button>
      </div>
    </header>

    <div
      v-if="!game.loaded"
      class="grid min-h-96 place-items-center"
      aria-live="polite"
    >
      <span class="kr-spinner-lg-primary" />
    </div>
    <template v-else>
      <div
        v-if="game.restoreWarning"
        role="status"
        class="kr-note kr-note-warning p-3 text-sm"
      >
        The previous journey could not be restored or saved with the current
        rules. Its source may have changed. You can start a new expedition; the
        older Homestead save is untouched.
      </div>
      <div
        v-if="confirmNew"
        class="rounded-2xl border border-warning/50 bg-base-200 p-4 text-sm"
        role="alert"
      >
        <p class="font-bold">Replace this five-land expedition?</p>
        <p class="mt-1 opacity-75">
          The current journey will be replaced. Your separate Homestead workshop
          save remains intact.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="btn btn-error btn-sm" @click="startOver">
            Start fresh
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="confirmNew = false"
          >
            Keep journey
          </button>
        </div>
      </div>

      <section
        class="relative isolate overflow-hidden rounded-3xl border border-base-content/15 bg-base-300 shadow-2xl"
      >
        <img
          :src="landAtmosphere"
          alt="Existing Zuzu Gamebook atmosphere plate, not a location-specific illustration"
          class="absolute inset-0 size-full object-cover object-center opacity-60"
        />
        <div
          class="absolute inset-0 bg-gradient-to-r from-base-300 via-base-300/70 to-base-300/15"
        />
        <div
          class="relative flex min-h-60 flex-col justify-end gap-5 p-5 sm:min-h-80 sm:p-8"
        >
          <div>
            <p
              class="text-xs font-black uppercase tracking-[.3em] text-warning"
            >
              Land {{ game.state.landIndex + 1 }} / 5 ·
              {{
                game.state.phase === 'boss'
                  ? 'The final trial awaits'
                  : 'An unwritten trail'
              }}
            </p>
            <h2
              class="mt-2 max-w-4xl font-serif text-3xl font-black sm:text-5xl"
            >
              {{ game.currentLand.name }}
            </h2>
            <p class="mt-2 text-sm font-medium opacity-85">
              {{ game.resolved.length }} / 3 encounters ·
              {{ game.state.bosses.length }} / 5 trials cleared
            </p>
          </div>
          <ol
            class="flex w-full gap-2 overflow-x-auto pb-1"
            aria-label="Five-land expedition route"
          >
            <li
              v-for="(land, index) in game.world.lands"
              :key="land.id"
              class="min-w-[132px] flex-1"
            >
              <div
                class="rounded-xl border px-3 py-2 backdrop-blur-sm"
                :class="
                  index === game.state.landIndex
                    ? 'border-warning bg-base-100/85 shadow-xl'
                    : index < game.state.landIndex
                      ? 'border-success/60 bg-base-100/75'
                      : 'border-base-content/20 bg-base-300/75'
                "
                :aria-current="
                  index === game.state.landIndex ? 'step' : undefined
                "
              >
                <span
                  class="text-[10px] font-bold uppercase tracking-widest opacity-70"
                >
                  {{
                    index < game.state.landIndex
                      ? 'Cleared'
                      : index === game.state.landIndex
                        ? 'Current land'
                        : 'Uncharted'
                  }}
                </span>
                <div class="mt-1 flex items-center gap-2">
                  <Icon
                    :name="
                      index < game.state.landIndex
                        ? 'kind-icon:check'
                        : index === game.state.landIndex
                          ? 'kind-icon:map'
                          : 'kind-icon:lock'
                    "
                    class="size-4 shrink-0"
                  />
                  <span class="text-xs font-bold">
                    {{
                      index > game.state.landIndex
                        ? 'Land ' + (index + 1)
                        : land.name
                    }}
                  </span>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <div class="journey-layout items-start gap-4">
        <div class="min-w-0 space-y-5">
          <section class="space-y-3" aria-label="The illustrated travel board">
            <div class="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 class="font-serif text-2xl font-black">The roads ahead</h2>
                <p class="text-xs opacity-70">
                  Reachable paths glow gold. Face-down cards remember what you
                  have not discovered.
                </p>
              </div>
              <span class="badge badge-outline"
                >{{ game.resolved.length }} / 3 visited</span
              >
            </div>
            <div
              class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,145px),1fr))] gap-3"
            >
              <div
                v-for="(card, index) in game.locations"
                :key="card.id"
                class="relative min-w-0"
              >
                <button
                  type="button"
                  class="group relative block w-full overflow-hidden rounded-2xl border text-left shadow-lg transition-transform motion-safe:hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary"
                  :class="
                    game.state.active === card.id
                      ? 'border-warning ring-2 ring-warning/60'
                      : game.reachable.includes(card.id) && !game.state.active
                        ? 'border-warning/70 ring-1 ring-warning/40'
                        : 'border-base-content/15'
                  "
                  :disabled="
                    !revealed(card.id) && !game.reachable.includes(card.id)
                  "
                  :aria-label="
                    revealed(card.id)
                      ? 'Inspect ' + card.label
                      : game.reachable.includes(card.id)
                        ? 'Travel to unexplored road ' + (index + 1)
                        : 'Unreachable road ' + (index + 1)
                  "
                  @click="chooseCard(card.id)"
                >
                  <div class="relative aspect-[2/3] bg-base-300">
                    <img
                      v-if="revealed(card.id) && card.art"
                      :src="card.art"
                      :alt="card.label"
                      class="size-full object-cover"
                    />
                    <div
                      v-else-if="revealed(card.id)"
                      class="relative size-full overflow-hidden bg-base-300"
                    >
                      <img
                        :src="landAtmosphere"
                        alt="Provisional atmosphere from existing Zuzu art"
                        class="size-full object-cover opacity-70"
                      />
                      <span
                        class="absolute left-2 top-2 rounded bg-base-300/90 px-2 py-1 text-[10px] font-bold"
                        >Scene art pending</span
                      >
                    </div>
                    <img
                      v-else
                      src="/images/shifting-lands/encounter-back.svg"
                      alt=""
                      class="size-full object-cover"
                    />
                    <div
                      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 text-white"
                    >
                      <span
                        class="text-[10px] uppercase tracking-widest opacity-75"
                        >Road {{ index + 1 }}</span
                      >
                      <p class="mt-1 font-serif text-sm font-bold sm:text-base">
                        {{ revealed(card.id) ? card.label : 'Uncharted' }}
                      </p>
                      <span
                        v-if="visited(card.id)"
                        class="mt-2 inline-block rounded bg-success px-2 py-0.5 text-[10px] font-bold text-success-content"
                      >
                        Visited · inspect
                      </span>
                      <span
                        v-else-if="game.state.active === card.id"
                        class="mt-2 inline-block rounded bg-warning px-2 py-0.5 text-[10px] font-bold text-warning-content"
                      >
                        Encounter active
                      </span>
                      <span
                        v-else-if="game.reachable.includes(card.id)"
                        class="mt-2 inline-block rounded bg-warning/85 px-2 py-0.5 text-[10px] font-bold text-warning-content"
                      >
                        Travel here
                      </span>
                    </div>
                  </div>
                </button>
              </div>
              <div
                class="relative overflow-hidden rounded-2xl border border-base-content/15 bg-base-200 shadow-lg"
                :class="game.bossReady ? 'ring-2 ring-warning/75' : ''"
              >
                <div class="relative aspect-[2/3]">
                  <img
                    v-if="
                      (game.bossReady || bossCleared) &&
                      game.currentLand.boss.art
                    "
                    :src="game.currentLand.boss.art"
                    :alt="game.currentLand.boss.label"
                    class="size-full object-cover"
                  />
                  <div
                    v-else-if="game.bossReady || bossCleared"
                    class="grid size-full place-items-center bg-gradient-to-br from-base-300 to-base-200"
                  >
                    <Icon name="kind-icon:swords" class="size-14 opacity-40" />
                  </div>
                  <img
                    v-else
                    src="/images/shifting-lands/trial-back.svg"
                    alt="Sealed boss card"
                    class="size-full object-cover"
                  />
                  <div
                    class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 text-white"
                  >
                    <span
                      class="text-[10px] font-bold uppercase tracking-widest"
                    >
                      {{
                        bossCleared
                          ? 'Trial cleared'
                          : game.bossReady
                            ? 'Trial unlocked'
                            : 'Sealed trial'
                      }}
                    </span>
                    <p class="mt-1 font-serif text-sm font-bold sm:text-base">
                      {{
                        game.bossReady || bossCleared
                          ? game.currentLand.boss.label
                          : 'The final gate'
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p
              v-if="game.currentShift"
              role="status"
              class="rounded-xl border border-warning/30 bg-base-200 px-4 py-3 text-sm"
            >
              <Icon
                name="kind-icon:map"
                class="mr-1 inline size-4 text-warning"
              />
              <strong>The land shifted:</strong> {{ game.currentShift.reason }}
              <span class="opacity-65">Earlier visits remain recorded.</span>
            </p>
          </section>

          <section
            class="overflow-hidden rounded-3xl border border-base-content/15 bg-base-200 shadow-xl"
            aria-label="Current encounter"
          >
            <div v-if="game.activeCard" class="encounter-grid gap-0">
              <div
                class="relative aspect-[4/3] overflow-hidden bg-base-300 lg:aspect-auto lg:min-h-[420px]"
              >
                <NavigationFlipCard
                  :trigger-key="dealKey"
                  :reveal-on-trigger="true"
                  :duration-ms="650"
                  radius="0"
                >
                  <template #front>
                    <img
                      v-if="game.activeEncounter?.art || game.activeCard.art"
                      :src="
                        game.activeEncounter?.art || game.activeCard.art || ''
                      "
                      :alt="
                        game.activeEncounter?.title || game.activeCard.label
                      "
                      class="size-full object-cover"
                    />
                    <div v-else class="relative size-full">
                      <img
                        :src="landAtmosphere"
                        alt="Provisional Zuzu atmosphere artwork"
                        class="size-full object-cover"
                      />
                      <span
                        class="absolute bottom-3 right-3 rounded bg-black/75 px-3 py-1 text-xs font-bold text-white"
                        >Location art pending</span
                      >
                    </div>
                  </template>
                  <template #back>
                    <img
                      src="/images/shifting-lands/encounter-back.svg"
                      alt=""
                      class="size-full object-cover"
                    />
                  </template>
                </NavigationFlipCard>
                <span
                  class="absolute bottom-3 left-3 rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white"
                  >Encounter drawn</span
                >
              </div>
              <div class="flex flex-col justify-center gap-4 p-5 sm:p-7">
                <div>
                  <p
                    class="text-xs font-black uppercase tracking-[.25em] text-warning"
                  >
                    The encounter
                  </p>
                  <h3
                    ref="encounterHeading"
                    tabindex="-1"
                    class="mt-2 font-serif text-2xl font-black outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-3xl"
                  >
                    {{ game.activeEncounter?.title || game.activeCard.label }}
                  </h3>
                  <p class="mt-3 text-sm leading-relaxed opacity-85">
                    {{ game.activeEncounter?.flavor || game.activeCard.teaser }}
                  </p>
                </div>
                <div v-if="game.activeEncounter" class="space-y-3">
                  <div
                    class="rounded-xl border border-warning/30 bg-base-300/65 p-4"
                  >
                    <p
                      class="text-xs font-black uppercase tracking-widest text-warning"
                    >
                      Your decision
                    </p>
                    <p class="mt-2 text-sm opacity-80">
                      Two roads are open. Each choice has its own stakes, skill
                      check and written result. Choose once; your dice and
                      consequences are saved.
                    </p>
                  </div>
                  <button
                    v-for="option in game.activeEncounter.choices"
                    :key="option.id"
                    type="button"
                    class="group block w-full rounded-xl border border-base-content/20 bg-base-300 p-4 text-left transition-colors hover:border-warning focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary"
                    @click="chooseEncounter(option.id)"
                  >
                    <span class="flex items-start justify-between gap-3">
                      <strong class="text-base group-hover:text-warning">{{
                        option.label
                      }}</strong>
                      <span
                        class="shrink-0 rounded-lg border border-warning/40 px-2 py-1 text-xs font-bold capitalize"
                        >{{ option.roll.skill }} ·
                        {{ option.roll.target }}</span
                      >
                    </span>
                    <span class="mt-2 block text-sm">{{ option.intent }}</span>
                    <span class="mt-2 block text-xs opacity-65">{{
                      option.risk
                    }}</span>
                    <span
                      class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-warning"
                      ><Icon name="kind-icon:dice" class="size-4" /> Roll 2d6 +
                      skill</span
                    >
                  </button>
                </div>
                <template v-else>
                  <div
                    class="rounded-xl border border-base-content/15 bg-base-300/65 p-4 text-sm"
                  >
                    <p
                      class="text-xs font-black uppercase tracking-widest opacity-65"
                    >
                      Later-land preview rules
                    </p>
                    <p class="mt-2">
                      <strong class="capitalize">{{
                        game.activeCard.skill
                      }}</strong>
                      check · target
                      <strong>{{ game.activeCard.difficulty }}</strong> · roll
                      2d6 + skill
                    </p>
                    <p class="mt-1 text-xs opacity-70">
                      The later-land authored content pass is still pending.
                      This route uses the existing deterministic check.
                    </p>
                  </div>
                  <div
                    class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-2"
                  >
                    <button
                      type="button"
                      class="btn btn-primary min-h-12"
                      @click="game.resolve('test')"
                    >
                      <Icon name="kind-icon:dice" class="size-5" /> Roll the
                      check
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline min-h-12"
                      @click="game.resolve('withdraw')"
                    >
                      Withdraw
                    </button>
                  </div>
                </template>
              </div>
            </div>
            <div v-else-if="game.bossReady" class="encounter-grid">
              <div
                class="relative min-h-72 overflow-hidden bg-base-300 lg:min-h-[420px]"
              >
                <img
                  v-if="game.currentLand.boss.art"
                  :src="game.currentLand.boss.art"
                  :alt="game.currentLand.boss.label"
                  class="absolute inset-0 size-full object-cover"
                />
                <div v-else class="absolute inset-0">
                  <img
                    :src="landAtmosphere"
                    alt="Provisional Zuzu landscape artwork"
                    class="size-full object-cover opacity-80"
                  />
                  <Icon
                    name="kind-icon:swords"
                    class="absolute left-4 top-4 size-12 text-white drop-shadow-lg"
                  />
                </div>
                <div
                  class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 text-white"
                >
                  <p class="text-xs font-black uppercase tracking-widest">
                    Major trial · {{ game.state.landIndex + 1 }} / 5
                  </p>
                  <h3 class="mt-2 font-serif text-3xl font-black">
                    {{ game.currentLand.boss.label }}
                  </h3>
                </div>
              </div>
              <div class="flex flex-col justify-center gap-4 p-5 sm:p-7">
                <p class="text-sm leading-relaxed">
                  {{ game.currentLand.boss.teaser }}
                </p>
                <p class="text-xs opacity-70">
                  All three locations are resolved. You may fight, seek terms,
                  or end this expedition.
                </p>
                <button
                  type="button"
                  class="btn btn-primary min-h-12"
                  @click="game.confront('challenge')"
                >
                  Challenge · Steel +3 · target {{ 9 + game.state.landIndex }}
                </button>
                <button
                  type="button"
                  class="btn btn-outline min-h-12"
                  :disabled="game.state.provisions < 1"
                  @click="game.confront('parley')"
                >
                  Parley · Bearing +2 · 1 provision
                </button>
                <button
                  type="button"
                  class="btn btn-ghost min-h-12"
                  @click="game.confront('retreat')"
                >
                  Retire from the expedition
                </button>
              </div>
            </div>
            <div
              v-else-if="game.finished"
              class="encounter-grid min-h-80 items-center gap-4 p-8"
            >
              <img
                src="/zuzu-gamebook/scenes/zuzu-alone.webp"
                alt="Zuzu the ronin at journey's end"
                class="max-h-80 w-full rounded-2xl object-cover"
              />
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-[.25em] text-warning"
                >
                  Journey complete
                </p>
                <h3 class="mt-2 font-serif text-3xl font-black">
                  {{ endTitle }}
                </h3>
                <p class="mt-3 text-sm opacity-80">
                  {{ game.state.journal[game.state.journal.length - 1]?.text }}
                </p>
                <p class="mt-4 text-sm">
                  {{ game.state.resolved.length }} encounters visited ·
                  {{ game.state.bosses.length }} trials cleared
                </p>
                <button
                  type="button"
                  class="btn btn-primary mt-4"
                  @click="confirmNew = true"
                >
                  Begin another journey
                </button>
              </div>
            </div>
            <div v-else class="encounter-grid min-h-80 gap-0">
              <img
                src="/zuzu-gamebook/scenes/dust-road.webp"
                alt="A dusty crossroads in Zuzu's frontier"
                class="h-72 w-full object-cover md:h-full"
              />
              <div class="flex flex-col justify-center gap-4 p-5 sm:p-7">
                <p
                  class="text-xs font-bold uppercase tracking-[.25em] text-warning"
                >
                  Choose your next road
                </p>
                <h3 class="font-serif text-2xl font-black">The deck awaits</h3>
                <p class="text-sm opacity-75">
                  Choose a glowing road card above, or draw the next reachable
                  encounter from the deck. Already-visited locations may be
                  revisited, but cannot be exploited for another reward.
                </p>
                <button
                  type="button"
                  class="btn btn-primary min-h-12"
                  :disabled="!canDraw"
                  @click="drawCard"
                >
                  Draw reachable card · {{ game.remaining.length }} remain
                </button>
              </div>
            </div>
          </section>

          <section
            v-if="game.lastAuthoredOutcome && !game.state.active"
            class="rounded-2xl border border-warning/40 bg-base-200 p-5 shadow-lg"
            aria-label="Last encounter outcome"
            aria-live="polite"
          >
            <p
              class="text-xs font-black uppercase tracking-widest text-warning"
            >
              The road remembers
            </p>
            <h3
              ref="outcomeHeading"
              tabindex="-1"
              class="mt-2 font-serif text-xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {{ lastPlayedTitle }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed">
              {{ game.lastAuthoredOutcome.resultText }}
            </p>
            <p class="mt-3 text-xs opacity-70">
              {{ game.lastAuthoredOutcome.roll.dice.join(' + ') }} +
              {{ game.lastAuthoredOutcome.roll.modifier }} =
              {{ game.lastAuthoredOutcome.roll.total }} vs
              {{ game.lastAuthoredOutcome.roll.difficulty }} ·
              {{
                game.lastAuthoredOutcome.roll.success ? 'Success' : 'Failure'
              }}
              · HP {{ game.lastAuthoredOutcome.hpChange >= 0 ? '+' : ''
              }}{{ game.lastAuthoredOutcome.hpChange }} · Provisions
              {{ game.lastAuthoredOutcome.provisionChange >= 0 ? '+' : ''
              }}{{ game.lastAuthoredOutcome.provisionChange }}
            </p>
          </section>

          <section
            class="rounded-3xl border border-base-content/15 bg-base-200 px-4 py-5 sm:px-6"
            aria-label="Card decks and discards"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 class="font-serif text-xl font-black">Your decks</h3>
                <p class="text-xs opacity-65">
                  Draw, resolve, discard. All state changes belong to the
                  journey rules.
                </p>
              </div>
              <div class="flex items-end gap-3 sm:gap-5">
                <button
                  type="button"
                  class="group flex flex-col items-center gap-1"
                  :disabled="!canDraw"
                  @click="drawCard"
                >
                  <span class="relative block h-24 w-16">
                    <img
                      src="/images/shifting-lands/encounter-back.svg"
                      alt=""
                      class="absolute left-0 top-0 h-24 w-16 rotate-[-8deg] rounded-md object-cover shadow-lg"
                    />
                    <img
                      src="/images/shifting-lands/encounter-back.svg"
                      alt=""
                      class="absolute left-1 top-0 h-24 w-16 rotate-[5deg] rounded-md object-cover shadow-lg motion-safe:group-hover:-translate-y-2"
                    />
                    <span
                      class="absolute -right-2 -top-2 badge badge-warning z-10"
                      >{{ game.remaining.length }}</span
                    >
                  </span>
                  <span class="text-xs font-bold">Draw</span>
                </button>
                <button
                  type="button"
                  class="group flex flex-col items-center gap-1"
                  :disabled="game.resolved.length === 0"
                  @click="inspectLastDiscard"
                >
                  <span class="relative block h-24 w-16">
                    <img
                      src="/images/shifting-lands/encounter-back.svg"
                      alt=""
                      class="absolute left-0 top-0 h-24 w-16 rotate-[-3deg] rounded-md object-cover opacity-85 shadow-lg"
                    />
                    <span
                      class="absolute -right-2 -top-2 badge badge-success z-10"
                      >{{ game.resolved.length }}</span
                    >
                  </span>
                  <span class="text-xs font-bold">Discard</span>
                </button>
                <div
                  class="flex flex-col items-center gap-1 opacity-60"
                  aria-label="Future reward deck, not active yet"
                >
                  <img
                    src="/images/adventure/card/card-back4.webp"
                    alt=""
                    class="h-24 w-16 rounded-md object-cover shadow-md"
                  />
                  <span class="text-xs">Rewards · later</span>
                </div>
              </div>
            </div>
          </section>
          <section
            v-if="visitedCards.length"
            class="rounded-2xl border border-base-content/15 bg-base-200 p-4 sm:p-5"
            aria-label="Discovered locations"
          >
            <details>
              <summary class="cursor-pointer font-serif text-lg font-black">
                Your discovered trail · {{ visitedCards.length }} places
              </summary>
              <div
                class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,125px),1fr))] gap-2"
              >
                <button
                  v-for="card in visitedCards"
                  :key="card.id"
                  type="button"
                  class="overflow-hidden rounded-xl border border-base-content/15 bg-base-300 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary"
                  :aria-label="'Inspect previous visit to ' + card.label"
                  @click="openInspector(card.id)"
                >
                  <img
                    v-if="card.art"
                    :src="card.art"
                    :alt="card.label"
                    class="aspect-[4/3] w-full object-cover"
                  />
                  <div v-else class="grid aspect-[4/3] place-items-center">
                    <Icon name="kind-icon:map" class="size-8 opacity-40" />
                  </div>
                  <span class="block truncate px-2 py-2 text-xs font-bold">{{
                    card.label
                  }}</span>
                  <span
                    class="block truncate px-2 pb-2 text-[10px] opacity-65"
                    >{{ card.land }}</span
                  >
                </button>
              </div>
            </details>
          </section>
        </div>

        <aside class="space-y-4">
          <section
            class="overflow-hidden rounded-2xl border border-base-content/15 bg-base-200"
          >
            <img
              src="/zuzu-gamebook/scenes/zuzu-alone.webp"
              alt="Zuzu, the grey koala ronin"
              class="aspect-[16/9] w-full object-cover"
            />
            <div class="space-y-3 p-4">
              <h3 class="font-serif text-xl font-black">Zuzu · The Ronin</h3>
              <div class="flex justify-between text-sm">
                <span>Health</span><strong>{{ game.state.hp }} / 8</strong>
              </div>
              <progress
                class="progress progress-error w-full"
                :value="game.state.hp"
                max="8"
                :aria-label="'Health ' + game.state.hp + ' out of eight'"
              />
              <div class="flex justify-between text-sm">
                <span>Provisions</span
                ><strong>{{ game.state.provisions }}</strong>
              </div>
              <div class="flex justify-between text-sm">
                <span>Encounters</span
                ><strong>{{ game.state.resolved.length }} / 15</strong>
              </div>
              <div class="flex justify-between text-sm">
                <span>Seed</span
                ><code class="text-xs">{{ game.state.seed }}</code>
              </div>
            </div>
          </section>
          <section
            v-if="game.state.lastRoll"
            class="rounded-2xl border border-warning/40 bg-base-200 p-4"
            aria-live="polite"
          >
            <p
              class="text-xs font-black uppercase tracking-[.2em] text-warning"
            >
              Last dice roll
            </p>
            <p class="mt-2 font-serif text-3xl font-black">
              {{ game.state.lastRoll.dice.join(' + ') }}
            </p>
            <p class="text-sm opacity-80">
              + {{ game.state.lastRoll.modifier }}
              {{ game.state.lastRoll.skill }} · total
              {{ game.state.lastRoll.total }} /
              {{ game.state.lastRoll.difficulty }}
            </p>
            <strong
              :class="
                game.state.lastRoll.success ? 'text-success' : 'text-error'
              "
            >
              {{
                game.state.lastRoll.success ? 'Check succeeded' : 'Check failed'
              }}
            </strong>
          </section>
          <section
            class="rounded-2xl border border-base-content/15 bg-base-200 p-4"
          >
            <h3 class="font-serif text-xl font-black">Journey journal</h3>
            <p class="text-xs opacity-65">
              Your past roads stay written, even when the landscape shifts.
            </p>
            <ol
              class="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1 text-sm"
              aria-label="Chronological journey events"
            >
              <li
                v-for="(item, index) in [...game.state.journal].reverse()"
                :key="game.state.journal.length - index"
                class="border-l-2 border-primary/50 pl-3"
              >
                <span
                  class="text-[10px] font-bold uppercase tracking-widest opacity-65"
                  >Turn {{ item.turn }} · {{ item.kind }}</span
                >
                <p class="mt-1">{{ item.text }}</p>
              </li>
            </ol>
          </section>
          <p class="text-xs opacity-65">
            Private rules preview. Land-specific art for later chapters,
            companions, richer encounter decks, and public release remain
            separate milestones. No generated lore can change the recorded
            rules.
          </p>
        </aside>
      </div>

      <kr-card-flip
        v-model="inspectorOpen"
        :label="inspectedCard?.label || 'Travel card details'"
      >
        <template #default
          ><span class="sr-only">Travel card inspection dialog</span></template
        >
        <template #back="{ close }">
          <article v-if="inspectedCard" class="bg-base-200">
            <div class="relative h-56 bg-base-300 sm:h-72">
              <img
                v-if="inspectedCard.art"
                :src="inspectedCard.art"
                :alt="inspectedCard.label"
                class="size-full object-cover"
              />
              <div v-else class="grid size-full place-items-center">
                <Icon name="kind-icon:map" class="size-16 opacity-35" />
              </div>
            </div>
            <div class="space-y-4 p-5 sm:p-7">
              <div>
                <p
                  class="text-xs font-black uppercase tracking-widest text-warning"
                >
                  Recorded place
                </p>
                <h2 class="mt-1 font-serif text-2xl font-black">
                  {{ inspectedCard.label }}
                </h2>
                <p class="mt-3 text-sm opacity-80">
                  {{ inspectedCard.teaser }}
                </p>
              </div>
              <div
                v-if="inspectedOutcome"
                class="rounded-xl bg-base-300 p-4 text-sm"
              >
                <p class="font-bold">
                  Visited on turn {{ inspectedOutcome.turn }}
                </p>
                <p
                  v-if="game.savedEncounter(inspectId || '')"
                  class="mt-1 leading-relaxed"
                >
                  {{ game.savedEncounter(inspectId || '')?.resultText }}
                </p>
                <p v-else class="mt-1">
                  Approach: {{ inspectedOutcome.approach }}
                </p>
                <p v-if="inspectedOutcome.roll">
                  Roll {{ inspectedOutcome.roll.dice.join(' + ') }} +
                  {{ inspectedOutcome.roll.modifier }} =
                  {{ inspectedOutcome.roll.total }} ·
                  {{ inspectedOutcome.roll.success ? 'Success' : 'Failure' }}
                </p>
                <p class="mt-1">
                  Health {{ inspectedOutcome.hpChange >= 0 ? '+' : ''
                  }}{{ inspectedOutcome.hpChange }} · Provisions
                  {{ inspectedOutcome.provisionChange >= 0 ? '+' : ''
                  }}{{ inspectedOutcome.provisionChange }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn btn-primary" @click="close()">
                  Return to board
                </button>
                <NuxtLink
                  to="/admin/worlds/zuzu"
                  class="btn btn-outline"
                  @click="close()"
                  >World Studio</NuxtLink
                >
              </div>
            </div>
          </article>
        </template>
      </kr-card-flip>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useShiftingLandsJourneyStore } from '~/stores/shiftingLandsJourneyStore'
import { AUTHORED_PACK } from '~/utils/shiftingLands/authoredJourney'

const emit = defineEmits<{ legacy: [] }>()
const game = useShiftingLandsJourneyStore()
const landScenery: Record<string, string> = {
  homestead: '/zuzu-gamebook/scenes/dust-road.webp',
  dustwater: '/zuzu-gamebook/scenes/waterhole.webp',
  tablelands: '/zuzu-gamebook/scenes/canyon.webp',
  cave: '/zuzu-gamebook/scenes/locked-door.webp',
  verge: '/zuzu-gamebook/scenes/bone-valley.webp',
}
const landAtmosphere = computed(
  () => landScenery[game.currentLand.id] ?? landScenery.homestead!,
)
const lastPlayedTitle = computed(
  () =>
    AUTHORED_PACK.encounters.find(
      (e) => e.id === game.lastAuthoredOutcome?.encounterId,
    )?.title ?? 'An encounter remembered',
)
const dealKey = ref(0)
const encounterHeading = ref<HTMLElement | null>(null)
const outcomeHeading = ref<HTMLElement | null>(null)
const inspectorOpen = ref(false)
const inspectId = ref<string | null>(null)
const confirmNew = ref(false)

const canDraw = computed(
  () =>
    game.state.phase === 'explore' &&
    !game.state.active &&
    game.reachable.some((id) => game.remaining.some((card) => card.id === id)),
)
const bossCleared = computed(() =>
  game.state.bosses.some((boss) => boss.landId === game.currentLand.id),
)
const endTitle = computed(() => {
  if (game.state.phase === 'complete') return 'The five lands are behind you.'
  if (game.state.phase === 'fallen') return 'Zuzu has fallen.'
  if (game.state.phase === 'retired') return 'The road ends here.'
  return 'The journey goes on.'
})
const inspectedCard = computed(() => {
  for (const land of game.world.lands)
    for (const card of land.locations)
      if (card.id === inspectId.value) return card
  return null
})
const inspectedOutcome = computed(
  () =>
    game.state.resolved.find((entry) => entry.locationId === inspectId.value) ??
    null,
)
const visitedCards = computed(() => {
  const cards: Array<{
    id: string
    label: string
    land: string
    art: string | null
  }> = []
  for (const land of game.world.lands)
    for (const card of land.locations)
      if (game.state.resolved.some((entry) => entry.locationId === card.id))
        cards.push({
          id: card.id,
          label: card.label,
          land: land.name,
          art: card.art,
        })
  return cards
})

function visited(id: string) {
  return game.state.resolved.some((entry) => entry.locationId === id)
}
function revealed(id: string) {
  return visited(id) || game.state.active === id
}
function openInspector(id: string) {
  if (!revealed(id)) return
  inspectId.value = id
  inspectorOpen.value = true
}
async function travel(id: string) {
  if (!game.travel(id)) return
  await nextTick()
  if (game.state.active) {
    dealKey.value++
    encounterHeading.value?.focus()
  }
}
function chooseCard(id: string) {
  if (revealed(id)) openInspector(id)
  else void travel(id)
}
async function drawCard() {
  if (!game.draw()) return
  await nextTick()
  if (game.state.active) {
    dealKey.value++
    encounterHeading.value?.focus()
  }
}
async function chooseEncounter(id: string) {
  if (!game.choose(id)) return
  await nextTick()
  outcomeHeading.value?.focus()
}
function inspectLastDiscard() {
  const mostRecent = game.resolved[game.resolved.length - 1]
  if (mostRecent) openInspector(mostRecent.locationId)
}
function startOver() {
  game.fresh()
  confirmNew.value = false
  inspectorOpen.value = false
  dealKey.value = 0
}
onMounted(() => game.initialize())
</script>

<style scoped>
.journey-shell {
  container-type: inline-size;
}
.journey-layout,
.encounter-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 47rem) {
  .encounter-grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(260px, 1fr);
  }
}
@container (min-width: 70rem) {
  .journey-layout {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}
</style>
