<template>
  <div
    ref="shell"
    class="journey-shell mx-auto flex min-h-0 w-full max-w-[1650px] flex-1 flex-col gap-2 px-2 pb-2 pt-1 sm:px-4"
    :class="{ 'journey-reduced-motion': reducedMotion }"
  >
    <header-page-bar>
      <div
        class="flex min-w-0 flex-1 items-center justify-between gap-1.5 @lg:gap-2"
        data-testid="shifting-lands-hud"
      >
        <p
          class="flex min-w-0 flex-1 items-baseline gap-1.5 font-serif text-sm font-black @3xl:text-base"
          :title="`Land ${game.state.landIndex + 1} of 5: ${game.currentLand.name}`"
        >
          <span class="shrink-0 whitespace-nowrap text-warning"
            >{{ game.state.landIndex + 1 }}/5</span
          >
          <span class="sr-only truncate @xl:not-sr-only">{{
            game.currentLand.name
          }}</span>
        </p>
        <nav
          class="flex min-w-0 shrink gap-1 overflow-x-auto overscroll-x-contain rounded-xl bg-base-200/80 p-0.5 [scrollbar-width:none]"
          role="tablist"
          aria-label="Journey views"
        >
          <button
            v-for="item in tabs"
            v-show="!(item.value === 'road' && wideBoard)"
            :key="item.value"
            type="button"
            role="tab"
            class="flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2 py-1 text-sm font-bold transition-colors @3xl:px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            :class="
              isTabActive(item.value)
                ? 'bg-primary text-primary-content shadow'
                : isSideDefault(item.value)
                  ? 'bg-primary text-primary-content'
                  : 'opacity-75 hover:bg-base-200'
            "
            :aria-selected="isTabActive(item.value)"
            @click="tab = item.value"
          >
            <Icon :name="item.icon" class="size-4" />
            <span class="sr-only @2xl:not-sr-only">{{ item.label }}</span>
            <span
              v-if="item.value === 'road' && zoomTarget && tab !== 'road'"
              class="size-2 rounded-full bg-warning"
              aria-label="Encounter waiting"
            />
          </button>
        </nav>
        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="inline-flex h-8 items-center gap-1 rounded-full border border-base-content/15 bg-base-200 px-2 text-xs font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            :aria-label="
              'Health ' +
              game.characterSheet.hp +
              ' of ' +
              game.characterSheet.maxHp +
              '. Open character sheet'
            "
            @click="tab = 'zuzu'"
          >
            <Icon name="kind-icon:heart" class="size-3.5 text-error" />
            {{ game.characterSheet.hp }}/{{ game.characterSheet.maxHp }}
          </button>
          <button
            type="button"
            class="inline-flex h-8 items-center gap-1 rounded-full border border-base-content/15 bg-base-200 px-2 text-xs font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            :aria-label="
              game.characterSheet.provisions +
              ' provisions. Open character sheet'
            "
            @click="tab = 'zuzu'"
          >
            <Icon name="kind-icon:bag" class="size-3.5 text-warning" />
            {{ game.characterSheet.provisions }}
          </button>
          <details ref="menu" class="dropdown dropdown-end">
            <summary
              class="btn btn-square btn-ghost btn-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Journey menu"
            >
              <Icon name="kind-icon:settings" class="size-5" />
            </summary>
            <div
              class="dropdown-content z-30 mt-2 w-64 space-y-2 rounded-2xl border border-base-content/15 bg-base-100 p-3 shadow-2xl"
            >
              <NuxtLink
                to="/admin/worlds/zuzu"
                class="btn btn-outline btn-sm w-full"
                >World Studio</NuxtLink
              >
              <button
                type="button"
                class="btn btn-outline btn-sm w-full"
                @click="emit('legacy')"
              >
                Homestead workshop
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm w-full"
                @click="askNewJourney"
              >
                New journey
              </button>
              <p
                class="pt-1 text-[10px] font-black uppercase tracking-widest opacity-60"
              >
                Presentation · never changes dice
              </p>
              <div
                class="grid grid-cols-2 gap-2"
                aria-label="Animation and dice sound settings"
              >
                <button
                  type="button"
                  class="btn btn-xs"
                  :class="reducedMotion ? 'btn-outline' : 'btn-primary'"
                  :aria-pressed="!reducedMotion"
                  @click="setReducedMotion(!reducedMotion)"
                >
                  {{ reducedMotion ? 'Motion off' : 'Motion on' }}
                </button>
                <button
                  type="button"
                  class="btn btn-xs"
                  :class="soundEnabled ? 'btn-primary' : 'btn-outline'"
                  :aria-pressed="soundEnabled"
                  @click="setSoundEnabled(!soundEnabled)"
                >
                  {{ soundEnabled ? 'Dice sound on' : 'Dice muted' }}
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header-page-bar>

    <div
      v-if="!game.loaded"
      class="grid min-h-0 flex-1 place-items-center"
      aria-live="polite"
    >
      <span class="kr-spinner-lg-primary" />
    </div>
    <template v-else>
      <div
        v-if="game.restoreWarning"
        role="status"
        class="kr-note kr-note-warning shrink-0 px-3 py-2 text-xs"
      >
        The previous journey could not be restored with the current rules. Start
        a new expedition; the older Homestead save is untouched.
      </div>
      <div
        v-if="confirmNew"
        class="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-warning/50 bg-base-100/95 px-3 py-2 text-sm"
        role="alert"
      >
        <p class="min-w-0 flex-1 font-bold">
          Replace this expedition?
          <span class="font-normal opacity-70"
            >The Homestead workshop save stays.</span
          >
        </p>
        <button type="button" class="btn btn-error btn-xs" @click="startOver">
          Start fresh
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          @click="confirmNew = false"
        >
          Keep journey
        </button>
      </div>

      <div class="kr-panes journey-layout gap-2">
        <section
          class="kr-pane relative isolate rounded-3xl border border-base-content/15 bg-base-300 shadow-2xl"
          :class="tab === 'road' ? '' : 'journey-hidden-narrow'"
          aria-label="The illustrated travel board"
        >
          <img
            :src="landAtmosphere"
            :alt="game.currentLand.name + ' landscape'"
            class="absolute inset-0 -z-10 size-full object-cover object-center opacity-75"
          />
          <div
            class="absolute inset-0 -z-10 bg-gradient-to-b from-base-300/40 via-base-300/55 to-base-300/90"
          />

          <div
            v-if="zoomed && consequence"
            class="kr-pane-scroll journey-reader"
            aria-label="Consequence of your choice"
          >
            <div class="encounter-grid">
              <div
                class="relative aspect-[16/10] overflow-hidden bg-base-300 encounter-art"
              >
                <div class="absolute inset-0">
                  <FlipCard
                    :trigger-key="consequenceKey"
                    :reveal-on-trigger="true"
                    :duration-ms="reducedMotion ? 0 : 650"
                    radius="0"
                  >
                    <template #front>
                      <ShiftingLandsSceneImage
                        :src="consequence.plate.src"
                        :alt="consequence.title + ': ' + consequence.choice"
                        :tint="
                          consequence.plate.painted
                            ? ''
                            : consequence.success
                              ? 'saturate-125'
                              : 'grayscale-[55%]'
                        "
                      />
                    </template>
                    <template #back>
                      <img
                        :src="
                          consequence.kind === 'trial'
                            ? '/shifting-lands/trial-back.svg'
                            : '/shifting-lands/encounter-back.svg'
                        "
                        alt=""
                        class="size-full object-cover"
                      />
                    </template>
                  </FlipCard>
                </div>
                <div
                  v-if="!consequence.plate.painted"
                  class="pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent"
                  :class="
                    consequence.success
                      ? 'from-warning/45 via-warning/10'
                      : 'from-error/55 via-black/25'
                  "
                />
                <span
                  class="absolute right-3 top-3 rounded-full px-3 py-1 font-serif text-sm font-black uppercase tracking-widest shadow-lg"
                  :class="
                    consequence.success
                      ? 'bg-success text-success-content'
                      : 'bg-error text-error-content'
                  "
                >
                  {{
                    !consequence.roll
                      ? 'Done'
                      : consequence.success
                        ? 'Success'
                        : 'Failure'
                  }}
                </span>
                <button
                  type="button"
                  class="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Zoom out to the road"
                  @click="roadPeek = true"
                >
                  <Icon name="kind-icon:map" class="size-4" /> Road
                </button>
              </div>
              <div
                class="encounter-text flex flex-col gap-2.5 bg-base-200/95 p-3 sm:p-4"
                aria-live="polite"
              >
                <p
                  class="text-[10px] font-black uppercase tracking-[.25em] text-warning"
                >
                  {{ consequence.title }} · You chose
                </p>
                <p class="-mt-2 font-bold leading-snug">
                  {{ consequence.choice }}
                </p>
                <p
                  v-if="!consequence.roll"
                  class="text-xs font-bold uppercase tracking-widest opacity-70"
                >
                  No roll: this choice was certain.
                </p>
                <div
                  v-else
                  :key="consequenceKey"
                  class="flex flex-wrap items-center gap-2"
                  :class="reducedMotion ? '' : 'journey-dice-reveal'"
                  :aria-label="
                    'Rolled ' +
                    consequence.roll.dice.join(' and ') +
                    ' plus ' +
                    consequence.roll.modifier +
                    ', total ' +
                    consequence.roll.total +
                    ' against ' +
                    consequence.roll.difficulty
                  "
                >
                  <span
                    v-for="(face, index) in consequence.roll.dice"
                    :key="index"
                    class="grid size-11 grid-cols-3 grid-rows-3 gap-0.5 rounded-lg border-2 border-base-content/30 bg-base-100 p-1.5 shadow"
                    aria-hidden="true"
                  >
                    <span
                      v-for="spot in 9"
                      :key="spot"
                      class="rounded-full"
                      :class="
                        pips(face).includes(spot - 1) ? 'bg-base-content' : ''
                      "
                    />
                  </span>
                  <span class="text-sm font-bold">
                    + {{ consequence.roll.modifier }}
                    <span class="capitalize opacity-70">{{
                      consequence.roll.skill
                    }}</span>
                    = {{ consequence.roll.total }}
                    <span class="opacity-70"
                      >vs {{ consequence.roll.difficulty }}</span
                    >
                  </span>
                </div>
                <h3
                  ref="outcomeHeading"
                  tabindex="-1"
                  class="font-serif text-base font-bold leading-snug outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-lg"
                >
                  {{ consequence.text }}
                </h3>
                <div class="flex flex-wrap gap-2 text-xs font-black">
                  <span
                    class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1"
                    :class="
                      consequence.hp < 0
                        ? 'border-error/50 text-error'
                        : consequence.hp > 0
                          ? 'border-success/50 text-success'
                          : 'border-base-content/20 opacity-70'
                    "
                  >
                    <Icon name="kind-icon:heart" class="size-3.5" />
                    Health {{ signed(consequence.hp) }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1"
                    :class="
                      consequence.provisions < 0
                        ? 'border-error/50 text-error'
                        : consequence.provisions > 0
                          ? 'border-success/50 text-success'
                          : 'border-base-content/20 opacity-70'
                    "
                  >
                    <Icon name="kind-icon:bag" class="size-3.5" />
                    Provisions {{ signed(consequence.provisions) }}
                  </span>
                </div>
                <button
                  type="button"
                  class="btn btn-primary self-start"
                  @click="continueJourney"
                >
                  {{ continueLabel }}
                </button>
              </div>
            </div>
          </div>

          <div
            v-else-if="zoomed && game.activeCard"
            class="kr-pane-scroll journey-reader"
            aria-label="Current encounter"
          >
            <div class="encounter-grid">
              <div
                class="relative aspect-[16/10] overflow-hidden bg-base-300 encounter-art"
              >
                <div class="absolute inset-0">
                  <FlipCard
                    :trigger-key="dealKey"
                    :reveal-on-trigger="true"
                    :duration-ms="reducedMotion ? 0 : 650"
                    radius="0"
                  >
                    <template #front>
                      <ShiftingLandsSceneImage
                        :src="game.activeArt"
                        :alt="
                          game.activeEncounter?.title || game.activeCard.label
                        "
                      />
                    </template>
                    <template #back>
                      <img
                        src="/shifting-lands/encounter-back.svg"
                        alt=""
                        class="size-full object-cover"
                      />
                    </template>
                  </FlipCard>
                </div>
                <button
                  type="button"
                  class="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Zoom out to the road"
                  @click="roadPeek = true"
                >
                  <Icon name="kind-icon:map" class="size-4" /> Road
                </button>
              </div>
              <div
                class="encounter-text flex flex-col gap-2.5 bg-base-200/95 p-3 sm:p-4"
              >
                <div>
                  <p
                    class="text-[10px] font-black uppercase tracking-[.25em] text-warning"
                  >
                    {{ game.currentLand.name }} · Encounter
                  </p>
                  <h3
                    ref="encounterHeading"
                    tabindex="-1"
                    class="mt-0.5 font-serif text-xl font-black leading-tight outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-2xl"
                  >
                    {{ game.activeEncounter?.title || game.activeCard.label }}
                  </h3>
                  <p class="mt-1.5 text-sm leading-relaxed">
                    {{ game.activeEncounter?.flavor || game.activeCard.teaser }}
                  </p>
                </div>
                <div
                  v-if="game.activeEncounter"
                  class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-2"
                >
                  <button
                    v-for="option in openChoices"
                    :key="option.id"
                    type="button"
                    class="group flex w-full flex-col gap-1 rounded-xl border border-base-content/20 bg-base-300 px-3 py-2 text-left transition-colors hover:border-warning focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary"
                    :title="option.risk"
                    @click="chooseEncounter(option.id)"
                  >
                    <span class="flex items-start justify-between gap-2">
                      <strong
                        class="text-sm leading-snug group-hover:text-warning sm:text-base"
                        >{{ option.label }}</strong
                      >
                      <span class="flex shrink-0 flex-wrap justify-end gap-1">
                        <span
                          v-for="price in priceOf(option)"
                          :key="price"
                          class="inline-flex items-center rounded-lg border border-error/40 px-1.5 py-0.5 text-[11px] font-bold text-error"
                          >{{ price }}</span
                        >
                        <ShiftingLandsCheckChip
                          v-if="option.roll"
                          :reading="
                            readCheck(
                              option.roll.skill,
                              option.roll.target,
                              option.roll.modifier,
                            )
                          "
                          :open="checkTip === option.id"
                          @toggle="toggleCheckTip(option.id)"
                        />
                        <span
                          v-else
                          class="inline-flex items-center gap-1 rounded-lg border border-success/40 px-1.5 py-0.5 text-[11px] font-bold"
                          :title="option.risk"
                          ><Icon name="kind-icon:check" class="size-3.5" />
                          Certain</span
                        >
                      </span>
                    </span>
                    <span class="text-sm leading-snug opacity-85">{{
                      option.intent
                    }}</span>
                    <span
                      v-if="checkTip === option.id && option.roll"
                      class="rounded-md bg-base-100 px-2 py-1 text-xs leading-snug"
                      >{{
                        readCheck(
                          option.roll.skill,
                          option.roll.target,
                          option.roll.modifier,
                        ).explain
                      }}
                      {{ option.risk }}</span
                    >
                  </button>
                  <button
                    v-for="option in lockedChoices"
                    :key="option.id"
                    type="button"
                    class="locked-route flex items-center gap-1.5 rounded-xl border border-dashed border-base-content/25 bg-base-200/70 px-3 py-1.5 text-left text-xs text-base-content/70"
                    :title="lockOf(option) ?? undefined"
                    :aria-expanded="checkTip === option.id"
                    @click="toggleCheckTip(option.id)"
                  >
                    <Icon name="kind-icon:lock" class="size-3.5 shrink-0" />
                    <span class="font-bold">{{ option.label }}</span>
                    <span v-if="checkTip === option.id" class="opacity-90">{{
                      lockOf(option)
                    }}</span>
                  </button>
                </div>
                <template v-else>
                  <p
                    class="rounded-xl border border-base-content/15 bg-base-300/65 px-3 py-2 text-xs"
                  >
                    Original expedition rules:
                    <strong class="capitalize">{{
                      game.activeCard.skill
                    }}</strong>
                    check, target
                    <strong>{{ game.activeCard.difficulty }}</strong
                    >, roll 2d6 + skill. Start a new journey to play authored
                    cards.
                  </p>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      class="btn btn-primary"
                      @click="resolveWithCue('test')"
                    >
                      <Icon name="kind-icon:dice" class="size-5" /> Roll
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline"
                      @click="resolveWithCue('withdraw')"
                    >
                      Withdraw
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div
            v-else-if="zoomed && game.bossReady"
            class="kr-pane-scroll journey-reader"
            aria-label="Major trial"
          >
            <div class="encounter-grid">
              <div
                class="relative aspect-[16/10] overflow-hidden bg-base-300 encounter-art"
              >
                <ShiftingLandsSceneImage
                  class="absolute inset-0"
                  :src="game.bossArt"
                  :alt="game.currentLand.boss.label"
                />
                <div
                  class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-white"
                >
                  <p
                    class="text-[10px] font-black uppercase tracking-widest opacity-80"
                  >
                    Major trial · {{ game.state.landIndex + 1 }} / 5
                  </p>
                  <h3
                    class="mt-1 font-serif text-2xl font-black leading-tight sm:text-3xl"
                  >
                    {{ game.currentLand.boss.label }}
                  </h3>
                </div>
                <button
                  type="button"
                  class="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Zoom out to the road"
                  @click="roadPeek = true"
                >
                  <Icon name="kind-icon:map" class="size-4" /> Road
                </button>
              </div>
              <div
                class="encounter-text flex flex-col gap-2.5 bg-base-200/95 p-3 sm:p-4"
              >
                <p class="text-sm leading-relaxed">
                  {{
                    game.currentTrial?.flavor || game.currentLand.boss.teaser
                  }}
                </p>
                <template v-if="game.currentTrial">
                  <div
                    v-if="
                      game.ledger.version === 7 || game.ledger.version === 8
                    "
                    class="flex flex-wrap items-center gap-2 rounded-xl border border-info/40 bg-base-300 p-2.5"
                  >
                    <div class="min-w-[12rem] flex-1">
                      <strong class="text-xs">Scout before the trial</strong>
                      <p class="text-xs opacity-75">
                        Spend 1 HP to unlock a carefully surveyed route. Check
                        its success odds against your other choices before
                        paying. Your earned deeds may also call witnesses.
                      </p>
                    </div>
                    <span
                      v-if="game.preparedTrial"
                      class="text-xs font-bold text-success"
                      >Route surveyed</span
                    >
                    <button
                      v-else
                      type="button"
                      class="btn btn-outline btn-sm"
                      :disabled="!game.canPrepareTrial"
                      @click="game.prepareTrial()"
                    >
                      Scout · 1 HP
                    </button>
                  </div>
                  <div
                    class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-2"
                    aria-label="Authored trial approaches"
                  >
                    <button
                      v-for="choice in game.currentTrial.choices"
                      :key="choice.id"
                      type="button"
                      class="group flex w-full flex-col gap-1 rounded-xl border border-base-content/20 bg-base-300 px-3 py-2 text-left transition-colors hover:border-warning focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
                      :disabled="!game.canTrial(choice.id)"
                      @click="attemptTrialWithCue(choice.id)"
                    >
                      <span class="flex items-start justify-between gap-2">
                        <strong class="text-sm leading-snug sm:text-base">{{
                          choice.label
                        }}</strong>
                        <ShiftingLandsCheckChip
                          :reading="readCheck(choice.skill, choice.target)"
                          :open="checkTip === choice.id"
                          @toggle="toggleCheckTip(choice.id)"
                        />
                      </span>
                      <span class="text-sm leading-snug opacity-85">{{
                        choice.intent
                      }}</span>
                      <span class="text-xs font-bold text-info">
                        {{ trialSuccessPercent(choice) }}% success on 2d6
                      </span>
                      <span
                        v-if="checkTip === choice.id"
                        class="rounded-md bg-base-100 px-2 py-1 text-xs leading-snug"
                        >{{
                          readCheck(choice.skill, choice.target).explain
                        }}</span
                      >
                      <span
                        v-if="
                          choice.cost ||
                          (choice.requiredAnyFlags.length &&
                            !game.canTrial(choice.id))
                        "
                        class="text-xs font-semibold opacity-70"
                      >
                        <template v-if="choice.cost"
                          >Costs {{ choice.cost }} provision</template
                        >
                        <template
                          v-if="
                            choice.requiredAnyFlags.length &&
                            !game.canTrial(choice.id)
                          "
                        >
                          Requires discovered evidence</template
                        >
                      </span>
                      <span
                        v-if="
                          choice.id === 'witness' && !game.canTrial(choice.id)
                        "
                        class="text-xs opacity-70"
                        >Requires two earned mercy or honesty marks</span
                      >
                      <span
                        v-if="
                          choice.id === 'scout' && !game.canTrial(choice.id)
                        "
                        class="text-xs opacity-70"
                        >Scout this gate first, spending 1 HP</span
                      >
                      <span
                        v-if="
                          choice.id === 'solidarity' &&
                          !game.canTrial(choice.id)
                        "
                        class="text-xs opacity-70"
                        >Requires 4 mercy and 2 honesty marks</span
                      >
                      <span
                        v-if="choice.id === 'coerce'"
                        class="text-xs font-semibold text-warning"
                        >Someone else bears this danger; the debt will be
                        remembered</span
                      >
                    </button>
                  </div>
                  <div
                    v-if="game.lastTrialOutcome?.landId === game.currentLand.id"
                    class="rounded-xl border border-warning/40 bg-base-300 p-3"
                    role="status"
                    aria-live="polite"
                  >
                    <p class="font-serif text-sm font-bold">
                      {{
                        game.lastTrialOutcome.roll.success
                          ? 'Trial passed'
                          : 'Trial repelled'
                      }}
                    </p>
                    <p class="mt-1 text-sm leading-relaxed">
                      {{ game.lastTrialOutcome.resultText }}
                    </p>
                    <p class="mt-1 text-xs opacity-75">
                      {{ game.lastTrialOutcome.roll.dice.join(' + ') }} +
                      {{ game.lastTrialOutcome.roll.modifier }} =
                      {{ game.lastTrialOutcome.roll.total }} vs
                      {{ game.lastTrialOutcome.roll.difficulty }}
                      · HP {{ game.lastTrialOutcome.hpChange }} · Provisions
                      {{ game.lastTrialOutcome.provisionChange }}
                    </p>
                  </div>
                </template>
                <div v-else class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="btn btn-primary h-auto min-h-12 py-2"
                    @click="confrontWithCue('challenge')"
                  >
                    Challenge · Steel +3 · {{ 9 + game.state.landIndex }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline h-auto min-h-12 py-2"
                    :disabled="game.state.provisions < 1"
                    @click="confrontWithCue('parley')"
                  >
                    Parley · Bearing +2 · 1 provision
                  </button>
                </div>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm self-start"
                  @click="game.confront('retreat')"
                >
                  Retire from the expedition
                </button>
              </div>
            </div>
          </div>

          <div
            v-else-if="zoomed && game.finished"
            class="kr-pane-scroll journey-reader"
            aria-label="Journey ending"
          >
            <div class="encounter-grid">
              <div
                class="relative aspect-[16/10] overflow-hidden bg-base-300 encounter-art"
              >
                <ShiftingLandsSceneImage
                  class="absolute inset-0"
                  src="/zuzu-gamebook/scenes/zuzu-alone.webp"
                  alt="A lone traveler at journey's end"
                />
                <button
                  type="button"
                  class="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Zoom out to the road"
                  @click="roadPeek = true"
                >
                  <Icon name="kind-icon:map" class="size-4" /> Road
                </button>
              </div>
              <div
                class="encounter-text flex flex-col gap-2.5 bg-base-200/95 p-3 sm:p-4"
              >
                <p
                  class="text-[10px] font-black uppercase tracking-[.25em] text-warning"
                >
                  The road remembers
                </p>
                <h3 class="font-serif text-2xl font-black sm:text-3xl">
                  {{ game.ending?.title ?? endTitle }}
                </h3>
                <p
                  v-if="game.ending"
                  class="text-xs font-bold uppercase tracking-wider opacity-70"
                >
                  {{ game.ending.path }}
                </p>
                <div v-if="game.ending" class="space-y-3">
                  <p
                    v-for="(paragraph, index) in game.ending.paragraphs"
                    :key="game.ending.kind + '-' + index"
                    class="text-sm leading-relaxed opacity-90"
                  >
                    {{ paragraph }}
                  </p>
                </div>
                <p v-else class="text-sm opacity-80">
                  {{ game.state.journal[game.state.journal.length - 1]?.text }}
                </p>
                <p class="text-sm">
                  {{ game.state.resolved.length }} encounters visited ·
                  {{ game.state.bosses.length }} trials cleared
                </p>
                <PlaybookRunReview
                  game="shifting-lands"
                  :run="game.ledger"
                  :ending="game.ending?.title ?? endTitle"
                />
                <button
                  type="button"
                  class="btn btn-primary self-start"
                  @click="confirmNew = true"
                >
                  Begin another journey
                </button>
              </div>
            </div>
          </div>

          <div v-else class="kr-pane-scroll">
            <div
              class="mx-auto flex min-h-full max-w-4xl flex-col justify-center gap-3 p-3 sm:p-5"
            >
              <button
                v-if="zoomTarget"
                type="button"
                class="flex items-center justify-between gap-2 rounded-xl border border-warning/60 bg-base-100/90 px-3 py-2 text-left text-sm font-bold shadow focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary"
                @click="roadPeek = false"
              >
                <span>{{ zoomTarget }}</span>
                <span class="inline-flex items-center gap-1 text-warning"
                  ><Icon name="kind-icon:expand" class="size-4" /> Zoom in</span
                >
              </button>

              <div class="flex items-end justify-between gap-3">
                <div class="min-w-0">
                  <h2
                    class="truncate font-serif text-2xl font-black leading-tight sm:text-4xl"
                  >
                    {{ game.currentLand.name }}
                  </h2>
                  <p class="text-xs font-medium opacity-80">
                    {{ game.resolved.length }} / 3 roads ·
                    {{ game.state.bosses.length }} / 5 trials
                    <template v-if="game.state.phase === 'boss'">
                      · The trial awaits</template
                    >
                  </p>
                </div>
                <ol
                  class="flex shrink-0 gap-1"
                  aria-label="Five-land expedition route"
                >
                  <li
                    v-for="(land, index) in game.world.lands"
                    :key="land.id"
                    class="grid size-7 place-items-center rounded-full border text-[10px] font-black"
                    :class="
                      index === game.state.landIndex
                        ? 'border-warning bg-warning text-warning-content'
                        : index < game.state.landIndex
                          ? 'border-success/60 bg-success/25'
                          : 'border-base-content/25 bg-base-100/60 opacity-70'
                    "
                    :aria-current="
                      index === game.state.landIndex ? 'step' : undefined
                    "
                    :aria-label="
                      index > game.state.landIndex
                        ? 'Land ' + (index + 1) + ', uncharted'
                        : land.name +
                          (index < game.state.landIndex
                            ? ', cleared'
                            : ', current land')
                    "
                    :title="
                      index > game.state.landIndex
                        ? 'Land ' + (index + 1)
                        : land.name
                    "
                  >
                    <Icon
                      v-if="index < game.state.landIndex"
                      name="kind-icon:check"
                      class="size-3.5"
                    />
                    <template v-else>{{ index + 1 }}</template>
                  </li>
                </ol>
              </div>

              <div class="road-grid grid grid-cols-4 gap-2 sm:gap-3">
                <button
                  v-for="(card, index) in game.locations"
                  :key="card.id"
                  type="button"
                  class="group relative block w-full min-w-0 overflow-hidden rounded-xl border text-left shadow-lg transition-transform motion-safe:hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary sm:rounded-2xl"
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
                      v-if="revealed(card.id)"
                      :src="game.roadArt(card.id)"
                      :alt="card.label"
                      class="size-full object-cover"
                    />
                    <img
                      v-else
                      src="/shifting-lands/encounter-back.svg"
                      alt=""
                      class="size-full object-cover"
                    />
                    <div
                      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-1.5 pb-1.5 pt-6 text-white sm:p-3"
                    >
                      <p
                        class="line-clamp-2 font-serif text-[11px] font-bold leading-tight sm:text-sm"
                      >
                        {{
                          revealed(card.id) ? card.label : 'Road ' + (index + 1)
                        }}
                      </p>
                      <span
                        v-if="visited(card.id)"
                        class="mt-1 inline-block rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wide sm:text-[10px] bg-success text-success-content"
                      >
                        Visited
                      </span>
                      <span
                        v-else-if="game.state.active === card.id"
                        class="mt-1 inline-block rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wide sm:text-[10px] bg-warning text-warning-content"
                      >
                        Active
                      </span>
                      <span
                        v-else-if="game.reachable.includes(card.id)"
                        class="mt-1 inline-block rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wide sm:text-[10px] bg-warning/85 text-warning-content"
                      >
                        Travel
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  class="relative block w-full min-w-0 overflow-hidden rounded-xl border border-base-content/15 bg-base-200 text-left shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary sm:rounded-2xl"
                  :class="game.bossReady ? 'ring-2 ring-warning/75' : ''"
                  :disabled="!game.bossReady"
                  :aria-label="
                    game.bossReady
                      ? 'Face ' + game.currentLand.boss.label
                      : 'Sealed trial'
                  "
                  @click="roadPeek = false"
                >
                  <div class="relative aspect-[2/3]">
                    <img
                      v-if="game.bossReady || bossCleared"
                      :src="game.bossArt"
                      :alt="game.currentLand.boss.label"
                      class="size-full object-cover"
                    />
                    <img
                      v-else
                      src="/shifting-lands/trial-back.svg"
                      alt="Sealed boss card"
                      class="size-full object-cover"
                    />
                    <div
                      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-1.5 pb-1.5 pt-6 text-white sm:p-3"
                    >
                      <p
                        class="line-clamp-2 font-serif text-[11px] font-bold leading-tight sm:text-sm"
                      >
                        {{
                          game.bossReady || bossCleared
                            ? game.currentLand.boss.label
                            : 'The final gate'
                        }}
                      </p>
                      <span
                        class="mt-1 inline-block rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wide sm:text-[10px]"
                        :class="
                          bossCleared
                            ? 'bg-success text-success-content'
                            : game.bossReady
                              ? 'bg-warning text-warning-content'
                              : 'bg-base-100/80 text-base-content'
                        "
                      >
                        {{
                          bossCleared
                            ? 'Cleared'
                            : game.bossReady
                              ? 'Unlocked'
                              : 'Sealed'
                        }}
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              <p
                v-if="game.currentShift"
                role="status"
                class="rounded-xl border border-warning/30 bg-base-100/85 px-3 py-2 text-xs"
              >
                <Icon
                  name="kind-icon:map"
                  class="mr-1 inline size-4 text-warning"
                />
                <strong>The land shifted:</strong>
                {{ game.currentShift.reason }}
              </p>

              <section
                v-if="game.kitchenNoviceOptions.length"
                class="rounded-2xl border border-warning/40 bg-base-100/95 p-3 shadow-lg"
                aria-label="Kitchen sister companion decision"
              >
                <p
                  class="text-[10px] font-black uppercase tracking-widest text-warning"
                >
                  Companion quest · The names we carry
                </p>
                <h3 class="mt-1 font-serif text-lg font-black">
                  The kitchen sister asks what comes next
                </h3>
                <p class="mt-1 text-sm leading-relaxed">
                  Her ledger belongs to the missing families. Your decision
                  changes whether she travels beside you, walks away, or trusts
                  you at the cave court.
                </p>
                <div class="mt-2 grid gap-2">
                  <button
                    v-for="option in game.kitchenNoviceOptions"
                    :key="option.id"
                    type="button"
                    class="rounded-xl border border-warning/30 bg-base-200/80 px-3 py-2 text-left text-sm font-bold transition-colors hover:bg-warning/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning"
                    @click="game.decideFollower(option.id)"
                  >
                    {{ option.label }}
                  </button>
                </div>
                <p class="mt-2 text-xs opacity-75">
                  Current bond: {{ game.kitchenNoviceStatus }}
                </p>
              </section>

              <section
                v-if="game.currentWorldEchoes.length"
                class="rounded-2xl border border-info/35 bg-base-100/90 p-2 shadow-sm sm:p-3"
                aria-label="Consequences returning from earlier lands"
              >
                <p
                  class="mb-1 text-[10px] font-black uppercase tracking-widest text-info"
                >
                  <Icon name="kind-icon:map" class="mr-1 inline size-4" />
                  The world remembers
                </p>
                <details
                  v-for="(echo, index) in game.currentWorldEchoes"
                  :key="echo.id"
                  :open="index === 0"
                  class="group border-t border-base-content/10 py-1 first:border-0"
                >
                  <summary
                    class="flex cursor-pointer items-center justify-between gap-2 text-sm font-bold"
                  >
                    <span class="min-w-0 truncate">{{ echo.title }}</span>
                    <Icon
                      name="kind-icon:chevron-down"
                      class="size-4 shrink-0 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p class="mt-1 text-sm leading-relaxed">
                    {{ echo.text }}
                  </p>
                  <p class="mt-1 text-[11px] opacity-65">
                    Earned through an earlier {{ echo.source }} decision. Also
                    recorded in the Journal.
                  </p>
                </details>
              </section>

              <section
                v-if="game.lastAuthoredOutcome && !game.state.active"
                class="rounded-2xl border border-warning/40 bg-base-100/90 p-3 shadow-lg sm:p-4"
                aria-label="Last encounter outcome"
                aria-live="polite"
              >
                <p
                  class="text-[10px] font-black uppercase tracking-widest text-warning"
                >
                  The road remembers ·
                  {{
                    !game.lastAuthoredOutcome.roll
                      ? 'Your choice'
                      : game.lastAuthoredOutcome.success
                        ? 'Success'
                        : 'Failure'
                  }}
                </p>
                <h3 class="mt-1 font-serif text-lg font-bold leading-tight">
                  {{ lastPlayedTitle }}
                </h3>
                <p class="mt-1 text-sm leading-relaxed">
                  {{ game.lastAuthoredOutcome.resultText }}
                </p>
                <p class="mt-1 text-xs opacity-70">
                  <template v-if="game.lastAuthoredOutcome.roll">
                    {{ game.lastAuthoredOutcome.roll.dice.join(' + ') }} +
                    {{ game.lastAuthoredOutcome.roll.modifier }} =
                    {{ game.lastAuthoredOutcome.roll.total }} vs
                    {{ game.lastAuthoredOutcome.roll.difficulty }} ·
                  </template>
                  HP {{ game.lastAuthoredOutcome.hpChange >= 0 ? '+' : ''
                  }}{{ game.lastAuthoredOutcome.hpChange }} · Provisions
                  {{ game.lastAuthoredOutcome.provisionChange >= 0 ? '+' : ''
                  }}{{ game.lastAuthoredOutcome.provisionChange }}
                </p>
              </section>

              <section
                v-if="game.lastTrialOutcome && !game.bossReady"
                class="rounded-2xl border border-warning/40 bg-base-100/90 p-3 shadow-lg sm:p-4"
                aria-label="Latest major trial result"
                aria-live="polite"
              >
                <p
                  class="text-[10px] font-black uppercase tracking-widest text-warning"
                >
                  Major trial ·
                  {{
                    game.lastTrialOutcome.roll.success ? 'Passed' : 'Repelled'
                  }}
                </p>
                <h3 class="mt-1 font-serif text-lg font-bold leading-tight">
                  {{ lastTrialBossName }}
                </h3>
                <p class="mt-1 text-sm leading-relaxed">
                  {{ game.lastTrialOutcome.resultText }}
                </p>
                <p class="mt-1 text-xs opacity-70">
                  {{ game.lastTrialOutcome.roll.dice.join(' + ') }} +
                  {{ game.lastTrialOutcome.roll.modifier }} =
                  {{ game.lastTrialOutcome.roll.total }} vs
                  {{ game.lastTrialOutcome.roll.difficulty }}
                </p>
              </section>

              <div
                class="flex items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 p-2 shadow sm:p-3"
                aria-label="Card decks and discards"
              >
                <button
                  type="button"
                  class="group flex shrink-0 flex-col items-center gap-0.5"
                  :disabled="!canDraw"
                  :aria-label="
                    'Draw a reachable card, ' +
                    game.remaining.length +
                    ' remain'
                  "
                  @click="drawCard"
                >
                  <span class="relative block h-14 w-10">
                    <img
                      src="/shifting-lands/encounter-back.svg"
                      alt=""
                      class="absolute inset-0 h-14 w-10 rotate-[-8deg] rounded object-cover shadow"
                    />
                    <img
                      src="/shifting-lands/encounter-back.svg"
                      alt=""
                      class="absolute inset-0 h-14 w-10 rotate-[5deg] rounded object-cover shadow motion-safe:group-hover:-translate-y-1"
                    />
                    <span
                      class="badge badge-warning badge-xs absolute -right-2 -top-1 z-10"
                      >{{ game.remaining.length }}</span
                    >
                  </span>
                  <span class="text-[10px] font-bold">Draw</span>
                </button>
                <button
                  type="button"
                  class="flex shrink-0 flex-col items-center gap-0.5"
                  :disabled="game.resolved.length === 0"
                  :aria-label="
                    'Inspect the discard pile, ' +
                    game.resolved.length +
                    ' cards'
                  "
                  @click="inspectLastDiscard"
                >
                  <span class="relative block h-14 w-10">
                    <img
                      src="/shifting-lands/encounter-back.svg"
                      alt=""
                      class="h-14 w-10 rotate-[-3deg] rounded object-cover opacity-85 shadow"
                    />
                    <span
                      class="badge badge-success badge-xs absolute -right-2 -top-1 z-10"
                      >{{ game.resolved.length }}</span
                    >
                  </span>
                  <span class="text-[10px] font-bold">Discard</span>
                </button>
                <button
                  type="button"
                  class="flex shrink-0 flex-col items-center gap-0.5"
                  :aria-label="
                    game.characterSheet.inventory.length +
                    ' earned rewards. Open character sheet'
                  "
                  @click="tab = 'zuzu'"
                >
                  <span class="relative block h-14 w-10">
                    <img
                      src="/shifting-lands/trial-back.svg"
                      alt=""
                      class="h-14 w-10 rounded object-cover shadow"
                      :class="
                        game.characterSheet.inventory.length ? '' : 'opacity-50'
                      "
                    />
                    <span
                      class="badge badge-primary badge-xs absolute -right-2 -top-1 z-10"
                      >{{ game.characterSheet.inventory.length }}</span
                    >
                  </span>
                  <span class="text-[10px] font-bold">Rewards</span>
                </button>
                <div class="min-w-0 flex-1 text-right">
                  <p
                    v-if="game.state.lastRoll"
                    :key="rollEffectKey"
                    class="text-xs font-bold"
                    :class="[
                      reducedMotion ? '' : 'journey-dice-reveal',
                      game.state.lastRoll.success
                        ? 'text-success'
                        : 'text-error',
                    ]"
                    aria-live="polite"
                  >
                    <Icon name="kind-icon:dice" class="inline size-4" />
                    {{ game.state.lastRoll.dice.join(' + ') }} +
                    {{ game.state.lastRoll.modifier }} =
                    {{ game.state.lastRoll.total }} /
                    {{ game.state.lastRoll.difficulty }}
                  </p>
                  <button
                    v-if="canDraw"
                    type="button"
                    class="btn btn-primary btn-sm mt-1"
                    @click="drawCard"
                  >
                    Draw a road
                  </button>
                  <p v-else-if="!zoomTarget" class="mt-1 text-xs opacity-70">
                    {{
                      game.finished
                        ? 'The journey has ended.'
                        : 'Tap a glowing road to travel.'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          class="kr-pane rounded-3xl border border-base-content/15 bg-base-200/95 shadow-xl"
          :class="tab === 'road' ? 'journey-hidden-narrow' : ''"
          :aria-label="sideTab === 'zuzu' ? 'Character sheet' : 'Journal'"
        >
          <div class="kr-pane-scroll p-2 sm:p-3">
            <ShiftingLandsCharacterRail
              v-if="sideTab === 'zuzu'"
              :sheet="game.characterSheet"
              :seed="game.state.seed"
              :phase="game.state.phase"
              @use-reward="useEarnedReward"
            />
            <div v-else class="space-y-4 p-1">
              <div v-if="visitedCards.length" aria-label="Discovered locations">
                <h3 class="font-serif text-lg font-black">
                  Discovered trail · {{ visitedCards.length }}
                </h3>
                <div
                  class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2"
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
                      :src="card.art"
                      :alt="card.label"
                      class="aspect-[4/3] w-full object-cover"
                    />
                    <span
                      class="block truncate px-2 pt-1 text-[11px] font-bold"
                      >{{ card.label }}</span
                    >
                    <span
                      class="block truncate px-2 pb-1 text-[10px] opacity-65"
                      >{{ card.land }}</span
                    >
                  </button>
                </div>
              </div>
              <section
                v-if="game.worldEchoes.length"
                aria-label="How earlier choices changed later lands"
              >
                <h3 class="font-serif text-lg font-black">
                  Ripples across the lands
                </h3>
                <p class="mt-1 text-xs opacity-70">
                  Only people and events your actual choices brought into the
                  story.
                </p>
                <ol class="mt-2 space-y-2">
                  <li
                    v-for="echo in game.worldEchoes"
                    :key="echo.id"
                    class="rounded-xl border border-info/25 bg-base-100/80 px-3 py-2"
                  >
                    <span
                      class="text-[10px] font-bold uppercase tracking-widest text-info"
                    >
                      {{
                        game.world.lands.find((land) => land.id === echo.landId)
                          ?.name
                      }}
                      ·
                      {{
                        echo.source === 'trial'
                          ? 'Past trial'
                          : 'Past encounter'
                      }}
                    </span>
                    <h4 class="mt-1 font-serif text-sm font-bold">
                      {{ echo.title }}
                    </h4>
                    <p class="mt-1 text-sm leading-relaxed">{{ echo.text }}</p>
                  </li>
                </ol>
              </section>
              <div>
                <h3 class="font-serif text-lg font-black">Journey journal</h3>
                <div
                  class="mt-2 flex flex-wrap gap-1"
                  role="group"
                  aria-label="Journal filters"
                >
                  <button
                    v-for="filter in journalFilters"
                    :key="filter.value"
                    type="button"
                    class="btn btn-xs"
                    :class="
                      journalFilter === filter.value
                        ? 'btn-primary'
                        : 'btn-ghost'
                    "
                    :aria-pressed="journalFilter === filter.value"
                    @click="journalFilter = filter.value"
                  >
                    {{ filter.label }}
                  </button>
                </div>
                <ol
                  class="mt-3 space-y-2 text-sm"
                  aria-label="Chronological journey events"
                >
                  <li
                    v-for="(item, index) in visibleJournal"
                    :key="item.turn + '-' + index + '-' + item.kind"
                    class="border-l-2 border-primary/50 pl-3"
                  >
                    <span
                      class="text-[10px] font-bold uppercase tracking-widest opacity-65"
                      >Turn {{ item.turn }} · {{ item.kind }}</span
                    >
                    <p>{{ item.text }}</p>
                  </li>
                </ol>
                <p
                  v-if="!visibleJournal.length"
                  class="mt-2 text-xs opacity-65"
                >
                  Nothing recorded in this category yet.
                </p>
              </div>
            </div>
          </div>
        </section>
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
                :src="game.playedArt(inspectedCard.id)"
                :alt="inspectedCard.label"
                class="size-full object-cover"
              />
            </div>
            <div class="space-y-3 p-4 sm:p-6">
              <div>
                <p
                  class="text-xs font-black uppercase tracking-widest text-warning"
                >
                  Recorded place
                </p>
                <h2 class="mt-1 font-serif text-2xl font-black">
                  {{ inspectedCard.label }}
                </h2>
                <p class="mt-2 text-sm opacity-80">
                  {{ inspectedCard.teaser }}
                </p>
              </div>
              <div
                v-if="inspectedOutcome"
                class="rounded-xl bg-base-300 p-3 text-sm"
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
              <button type="button" class="btn btn-primary" @click="close()">
                Return to board
              </button>
            </div>
          </article>
        </template>
      </kr-card-flip>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useShiftingLandsJourneyStore } from '~/stores/shiftingLandsJourneyStore'
import { trialForLand } from '~/utils/shiftingLands/authoredBosses'
import {
  readCheck,
  type BossApproach,
  type EncounterApproach,
} from '~/utils/shiftingLands/journey'
import type { V6Choice } from '~/utils/shiftingLands/deckV6'
import { trialSuccessPercent } from '~/utils/shiftingLands/trialOdds'
import ShiftingLandsCharacterRail from '~/components/shifting-lands-character-rail.vue'
import {
  readShiftingLandsPresentation,
  writeShiftingLandsPresentation,
} from '~/utils/shiftingLands/presentationPreferences'

const emit = defineEmits<{ legacy: [] }>()
const game = useShiftingLandsJourneyStore()
const landAtmosphere = computed(() => game.landArt)
const lastTrialBossName = computed(
  () =>
    game.world.lands.find((land) => land.id === game.lastTrialOutcome?.landId)
      ?.boss.label ?? 'A trial remembered',
)
const lastPlayedTitle = computed(
  () =>
    game.findCard(game.lastAuthoredOutcome?.encounterId ?? '')?.title ??
    'An encounter remembered',
)
const dealKey = ref(0)
const encounterHeading = ref<HTMLElement | null>(null)
const outcomeHeading = ref<HTMLElement | null>(null)
const inspectorOpen = ref(false)
const inspectId = ref<string | null>(null)
const confirmNew = ref(false)
const reducedMotion = ref(true)
const soundEnabled = ref(false)
const rollEffectKey = ref(0)
type JournalFilter = 'all' | 'encounter' | 'boss' | 'shift'
const journalFilter = ref<JournalFilter>('all')
type JourneyTab = 'road' | 'zuzu' | 'journal'
const tab = ref<JourneyTab>('road')
const tabs: Array<{ value: JourneyTab; label: string; icon: string }> = [
  { value: 'road', label: 'Road', icon: 'kind-icon:map' },
  { value: 'zuzu', label: 'Zuzu', icon: 'kind-icon:user' },
  { value: 'journal', label: 'Journal', icon: 'kind-icon:book' },
]
const sideTab = computed<JourneyTab>(() =>
  tab.value === 'road' ? 'zuzu' : tab.value,
)
const roadPeek = ref(false)
const checkTip = ref<string | null>(null)
type ShownChoice = NonNullable<typeof game.activeEncounter>['choices'][number]
const shownChoices = computed<ShownChoice[]>(
  () => game.activeEncounter?.choices ?? [],
)
const openChoices = computed(() =>
  shownChoices.value.filter((choice) => !lockOf(choice)),
)
const lockedChoices = computed(() =>
  shownChoices.value.filter((choice) => lockOf(choice)),
)
function lockOf(choice: ShownChoice): string | null {
  return 'requires' in choice ? game.lockFor(choice as V6Choice) : null
}
function priceOf(choice: ShownChoice): string[] {
  const cost = 'cost' in choice ? choice.cost : null
  const prices: string[] = []
  if (cost?.hp) prices.push(`${cost.hp} health`)
  if (cost?.provisions)
    prices.push(
      `${cost.provisions} provision${cost.provisions === -1 ? '' : 's'}`,
    )
  return prices
}
function toggleCheckTip(id: string): void {
  checkTip.value = checkTip.value === id ? null : id
}
type Reveal = { kind: 'encounter' | 'trial'; turn: number }
const reveal = ref<Reveal | null>(null)
const consequenceKey = ref(0)
const menu = ref<HTMLDetailsElement | null>(null)
const journalFilters: Array<{ value: JournalFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'encounter', label: 'Encounters' },
  { value: 'boss', label: 'Trials' },
  { value: 'shift', label: 'Shifts' },
]
const visibleJournal = computed(() =>
  [...game.state.journal]
    .filter(
      (item) =>
        journalFilter.value === 'all' || item.kind === journalFilter.value,
    )
    .reverse(),
)

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
  if (game.state.phase === 'fallen') return 'You have fallen.'
  if (game.state.phase === 'retired') return 'The road ends here.'
  return 'The journey goes on.'
})
const consequence = computed(() => {
  const showing = reveal.value
  if (!showing) return null
  if (showing.kind === 'encounter') {
    const result = game.lastAuthoredOutcome
    if (!result || result.turn !== showing.turn) return null
    const card = game.findCard(result.encounterId)
    return {
      kind: showing.kind,
      title: card?.title ?? 'An encounter remembered',
      choice:
        card?.choices.find((item) => item.id === result.choiceId)?.label ??
        'Your choice',
      success: result.success,
      roll: result.roll,
      text: result.resultText,
      hp: result.hpChange,
      provisions: result.provisionChange,
      plate: game.outcomePlate(result),
    }
  }
  const result = game.lastTrialOutcome
  if (!result || result.turn !== showing.turn) return null
  const trial = trialForLand(result.landId)
  return {
    kind: showing.kind,
    title: trial?.title ?? lastTrialBossName.value,
    choice:
      trial?.choices.find((item) => item.id === result.choiceId)?.label ??
      'Your approach',
    success: result.roll.success,
    roll: result.roll,
    text: result.resultText,
    hp: result.hpChange,
    provisions: result.provisionChange,
    plate: game.trialPlate(result),
  }
})
const continueLabel = computed(() => {
  if (game.finished) return 'See how the journey ends'
  if (game.bossReady)
    return consequence.value?.kind === 'trial'
      ? 'Return to the gate'
      : 'Face the trial'
  if (consequence.value?.kind === 'trial')
    return 'Enter ' + game.currentLand.name
  return 'Continue down the road'
})
const zoomTarget = computed(() => {
  if (consequence.value) return 'Consequence · ' + consequence.value.title
  if (game.activeCard)
    return (
      'Encounter waiting · ' +
      (game.activeEncounter?.title || game.activeCard.label)
    )
  if (game.bossReady) return 'Trial unlocked · ' + game.currentLand.boss.label
  if (game.finished)
    return 'Journey complete · ' + (game.ending?.title ?? endTitle.value)
  return ''
})
const zoomed = computed(() => !!zoomTarget.value && !roadPeek.value)
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
    art: string
  }> = []
  for (const land of game.world.lands)
    for (const card of land.locations)
      if (game.state.resolved.some((entry) => entry.locationId === card.id))
        cards.push({
          id: card.id,
          label: card.label,
          land: land.name,
          art: game.playedArt(card.id),
        })
  return cards
})

function visited(id: string) {
  return game.state.resolved.some((entry) => entry.locationId === id)
}
function revealed(id: string) {
  return visited(id) || game.state.active === id
}
function isTabActive(value: JourneyTab) {
  return tab.value === value
}
// The view tabs dock into the site's system bar, so they can no longer read
// the board's width from a container query. The board measures itself: from
// 64rem the road and the side panel share the screen, the Road tab hides, and
// the Zuzu tab stands lit as the side panel's default.
const shell = ref<HTMLElement | null>(null)
const wideBoard = ref(false)
let shellObserver: ResizeObserver | null = null
function isSideDefault(value: JourneyTab) {
  return wideBoard.value && value === 'zuzu' && tab.value === 'road'
}
function askNewJourney() {
  if (menu.value) menu.value.open = false
  confirmNew.value = true
}
async function zoomIntoEncounter() {
  roadPeek.value = false
  tab.value = 'road'
  await nextTick()
  if (game.state.active) {
    dealKey.value++
    encounterHeading.value?.focus()
  }
}
function openInspector(id: string) {
  if (!revealed(id)) return
  inspectId.value = id
  inspectorOpen.value = true
}
async function travel(id: string) {
  if (!game.travel(id)) return
  await zoomIntoEncounter()
}
function chooseCard(id: string) {
  if (game.state.active === id) roadPeek.value = false
  else if (revealed(id)) openInspector(id)
  else void travel(id)
}
async function drawCard() {
  if (!game.draw()) return
  await zoomIntoEncounter()
}
async function showConsequence(kind: Reveal['kind'], turn?: number) {
  if (turn === undefined) return
  reveal.value = { kind, turn }
  roadPeek.value = false
  tab.value = 'road'
  consequenceKey.value++
  await nextTick()
  outcomeHeading.value?.focus()
}
async function chooseEncounter(id: string) {
  if (!game.choose(id)) return
  cueDiceResult()
  await showConsequence('encounter', game.lastAuthoredOutcome?.turn)
}
function attemptTrialWithCue(id: string) {
  if (!game.attemptTrial(id)) return
  cueDiceResult()
  void showConsequence('trial', game.lastTrialOutcome?.turn)
}
function continueJourney() {
  reveal.value = null
  roadPeek.value = false
}
function signed(value: number) {
  return (value > 0 ? '+' : '') + value
}
const PIPS: Readonly<Record<number, number[]>> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}
function pips(face: number) {
  return PIPS[face] ?? []
}
function resolveWithCue(approach: EncounterApproach) {
  if (game.resolve(approach) && approach === 'test') cueDiceResult()
}
function confrontWithCue(approach: BossApproach) {
  if (game.confront(approach) && approach !== 'retreat') cueDiceResult()
}
function useEarnedReward(id: string) {
  game.useReward(id)
}
function persistPresentation() {
  writeShiftingLandsPresentation({
    reducedMotion: reducedMotion.value,
    soundEnabled: soundEnabled.value,
  })
}
function setReducedMotion(value: boolean) {
  reducedMotion.value = value
  persistPresentation()
}
function setSoundEnabled(value: boolean) {
  soundEnabled.value = value
  persistPresentation()
}
function cueDiceResult() {
  rollEffectKey.value++
  if (!soundEnabled.value || !import.meta.client) return
  // User-initiated, low-volume dice cue. No automatic background playback.
  try {
    const audio = new AudioContext()
    const oscillator = audio.createOscillator()
    const volume = audio.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(325, audio.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(
      210,
      audio.currentTime + 0.12,
    )
    volume.gain.setValueAtTime(0.025, audio.currentTime)
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.14)
    oscillator.connect(volume)
    volume.connect(audio.destination)
    oscillator.onended = () => void audio.close()
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.15)
  } catch {
    // Audio support is optional, not a gameplay dependency.
  }
}
function inspectLastDiscard() {
  const mostRecent = game.resolved[game.resolved.length - 1]
  if (mostRecent) openInspector(mostRecent.locationId)
}
function startOver() {
  game.fresh()
  confirmNew.value = false
  inspectorOpen.value = false
  roadPeek.value = false
  reveal.value = null
  tab.value = 'road'
  dealKey.value = 0
}
onMounted(() => {
  game.initialize()
  const settings = readShiftingLandsPresentation()
  reducedMotion.value = settings.reducedMotion
  soundEnabled.value = settings.soundEnabled
  if (shell.value && typeof ResizeObserver !== 'undefined') {
    shellObserver = new ResizeObserver(([entry]) => {
      wideBoard.value = (entry?.contentRect.width ?? 0) >= 1024
    })
    shellObserver.observe(shell.value)
  }
})
onBeforeUnmount(() => shellObserver?.disconnect())
</script>

<style scoped>
@keyframes shifting-dice-settle {
  from {
    transform: translateY(-9px) rotate(-3deg);
    opacity: 0.55;
  }
  to {
    transform: translateY(0) rotate(0);
    opacity: 1;
  }
}
.journey-dice-reveal {
  animation: shifting-dice-settle 260ms ease-out;
}
.journey-reduced-motion :deep(*) {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
@media (prefers-reduced-motion: reduce) {
  .journey-dice-reveal {
    animation: none;
  }
}
.journey-shell {
  container-type: inline-size;
}
.journey-layout {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}
/* One screen per reader (Silas, 2026-10-18): the whole painting stays in
   view and the text column scrolls inside itself only when a phone forces it,
   so the board never becomes a tall page. */
.journey-reader {
  container: reader / size;
  overflow: hidden;
}
.encounter-grid {
  display: grid;
  height: 100%;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(7rem, 1fr) fit-content(68%);
}
.encounter-art {
  aspect-ratio: auto;
  min-height: 0;
}
.encounter-text {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
@container reader (min-aspect-ratio: 19 / 10) and (min-width: 40rem) {
  .encounter-grid {
    grid-template-columns: minmax(0, 1.25fr) minmax(300px, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .encounter-text {
    justify-content: center;
  }
}
.journey-hidden-narrow {
  display: none;
}
/* Portrait screens: the four road cards sit two by two, so they read as
   cards instead of a thin strip in a tall, empty board (Silas, 2026-10-16). */
@media (orientation: portrait) {
  .road-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: min(100%, 26rem);
    margin-inline: auto;
  }
}
@container (min-width: 64rem) {
  .journey-layout {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
  .journey-hidden-narrow {
    display: flex;
  }
}
</style>
