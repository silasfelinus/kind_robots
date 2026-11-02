<template>
  <main class="kr-surface" :data-art-style="artStyle">
    <div v-if="!store.loaded" class="kr-stage items-center justify-center">
      <span class="kr-spinner-lg-primary" />
    </div>

    <template v-else>
      <header-page-bar>
        <div
          class="relative flex min-w-0 flex-1 items-center gap-1.5 @lg:gap-2"
          data-testid="shifting-desks-hud"
        >
          <button
            type="button"
            class="btn btn-xs h-7 shrink-0 gap-1 border-2 border-base-content/70 bg-base-100 px-1 @lg:gap-1.5 @lg:px-1.5"
            :title="`Art style: ${currentArtStyle.label}. Change it anytime.`"
            aria-haspopup="dialog"
            @click="openArtPicker"
          >
            <img
              :src="artStyleImageSrc(ART_STYLE_SAMPLE, artStyle)"
              alt=""
              class="hidden size-6 rounded object-cover object-[50%_30%] @lg:block"
              @error="
                ($event.target as HTMLImageElement).style.visibility = 'hidden'
              "
            />
            <icon name="kind-icon:palette" class="size-4" />
            <span class="hidden @4xl:inline">{{ currentArtStyle.label }}</span>
            <span class="sr-only">art style, change</span>
          </button>
          <div
            class="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain py-0.5 [scrollbar-width:none] @lg:gap-2"
          >
            <button
              v-if="atDesk && run"
              type="button"
              class="dept-banner flex min-w-0 max-w-fit shrink items-center gap-2 rounded-lg border-2 border-stone-800 px-2 py-1 text-stone-900"
              :aria-describedby="hudTip === 'floor' ? 'hud-tip' : undefined"
              v-bind="tipHandlers('floor')"
            >
              <span
                class="truncate font-mono text-[11px] font-black uppercase tracking-wider @2xl:text-xs"
              >
                {{ floorFor(currentDept) }} ·
                {{ currentDept.department.title.split(':')[0] }}
              </span>
              <span
                class="hidden shrink-0 items-center gap-0.5 @xl:flex"
                aria-hidden="true"
              >
                <span
                  v-for="(step, i) in steps"
                  :key="i"
                  class="h-2 w-2 rounded-full border border-stone-800 @3xl:w-3"
                  :class="
                    i < run.position
                      ? 'bg-stone-800'
                      : i === run.position
                        ? 'bg-amber-50'
                        : 'bg-stone-800/20'
                  "
                />
              </span>
            </button>
            <div
              v-if="run"
              class="ml-auto flex shrink-0 items-center gap-1 @lg:gap-1.5"
              aria-label="Your file"
            >
              <button
                v-for="m in meterList"
                :key="m.key"
                type="button"
                class="flex items-center gap-0.5 rounded-md bg-base-200 px-1 py-1 text-xs font-bold hover:bg-base-300 @lg:gap-1 @lg:px-2"
                :class="m.danger ? 'text-error' : ''"
                :aria-label="`${m.label} ${m.value}`"
                :aria-describedby="hudTip === m.key ? 'hud-tip' : undefined"
                v-bind="tipHandlers(m.key)"
              >
                <icon :name="m.icon" class="size-3.5" />
                <span class="hidden @5xl:inline">{{ m.label }}</span>
                {{ m.value }}
              </button>
              <shifting-desks-envelope
                v-if="atDesk"
                compact
                :highlight="!opened"
              />
              <button
                type="button"
                class="btn btn-ghost btn-xs px-1 @3xl:px-2"
                :title="`Personnel file, ${run.log.length} entries`"
                @click="openJournal"
              >
                <icon name="kind-icon:book" class="size-4" />
                <span class="sr-only @4xl:not-sr-only">File</span>
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs px-1 @3xl:px-2"
                title="Leave for the front desk"
                @click="toFront"
              >
                <icon name="kind-icon:arrow-left" class="size-4" />
                <span class="sr-only @4xl:not-sr-only">Leave</span>
              </button>
            </div>
          </div>
          <p
            v-if="hudTip && hudTipText"
            id="hud-tip"
            role="tooltip"
            class="absolute right-0 top-full z-40 mt-2 max-w-sm rounded-xl border-2 border-base-content/70 bg-base-100 px-3 py-2 text-sm leading-snug text-base-content shadow-xl"
          >
            {{ hudTipText }}
          </p>
        </div>
      </header-page-bar>

      <section
        v-if="screen === 'front'"
        class="kr-stage mx-auto w-full max-w-[1400px] px-2 pb-2 sm:px-4"
      >
        <div
          class="front-hero relative min-h-0 flex-1 overflow-hidden rounded-2xl border-4 border-stone-900 bg-stone-950"
        >
          <div class="absolute inset-0">
            <shifting-desks-art
              frame="h-full w-full"
              position="object-[50%_35%]"
              :src="stationArt('departments', 'orientation')"
              alt="Orientation day at Consolidated Wellness & Defense"
              fallback-icon="kind-icon:folder"
              icon-size="4rem"
              :show-brief="false"
            />
          </div>
          <div class="front-vignette absolute inset-0" aria-hidden="true" />
          <button
            type="button"
            class="btn btn-sm absolute right-3 top-3 z-20 border-amber-100 bg-stone-950/85 text-amber-50 hover:bg-stone-900 sm:right-6 sm:top-6"
            :title="`Endings on file: ${endingsCount} of ${ENDINGS.length}`"
            @click="endingsGallery?.open()"
          >
            <icon name="kind-icon:trophy" class="size-4" />
            {{ endingsCount }}/{{ ENDINGS.length }}
            <span class="sr-only">endings found, open the gallery</span>
          </button>
          <div
            class="relative z-10 flex h-full flex-col justify-between gap-3 p-3 text-amber-50 sm:p-6"
          >
            <p
              class="front-title font-mono text-5xl font-black uppercase leading-[.9] sm:text-8xl"
            >
              Shifting<br />Desks
            </p>
            <div class="flex flex-col gap-3 sm:gap-4">
              <div class="flex flex-wrap gap-2 sm:gap-3">
                <button
                  v-if="run"
                  type="button"
                  class="btn btn-lg border-amber-300 bg-amber-300 text-stone-950 shadow-xl hover:bg-amber-200"
                  @click="screen = 'play'"
                >
                  <icon name="kind-icon:play" class="size-5" />
                  Return to your desk
                </button>
                <button
                  type="button"
                  class="btn btn-lg shadow-xl"
                  :class="
                    run
                      ? 'border-amber-100 bg-stone-950/85 text-amber-50 hover:bg-stone-900'
                      : 'border-amber-300 bg-amber-300 text-stone-950 hover:bg-amber-200'
                  "
                  @click="beginHire(false)"
                >
                  <icon
                    :name="run ? 'kind-icon:refresh' : 'kind-icon:play'"
                    class="size-5"
                  />
                  {{ run ? 'New game' : 'Begin' }}
                </button>
                <button
                  v-if="store.archiveUnlocked"
                  type="button"
                  class="btn btn-lg border-amber-100 bg-stone-950/85 text-amber-50 shadow-xl hover:bg-stone-900"
                  @click="openArchive('milestones')"
                >
                  <icon name="kind-icon:trophy" class="size-5" />
                  Personnel Archive ·
                  {{ store.rewardArchive.runs.length }} filed
                </button>
                <button
                  type="button"
                  class="btn btn-lg border-amber-100 bg-stone-950/85 text-amber-50 shadow-xl hover:bg-stone-900"
                  :title="`Today's Daily Memo (${todayLabel}): the same files for everyone, every day`"
                  @click="beginHire(true)"
                >
                  <icon name="kind-icon:calendar" class="size-5" />
                  Daily Memo
                  <span class="text-sm font-normal opacity-80">{{
                    todayLabel
                  }}</span>
                </button>
              </div>
              <shifting-desks-style-picker
                class="h-32 w-full rounded-2xl bg-stone-950/85 p-2 text-amber-50 sm:h-40 sm:p-3 lg:w-[38rem]"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        v-else-if="screen === 'hire'"
        class="kr-stage mx-auto w-full max-w-[1400px] gap-2 px-2 pb-2 sm:px-4"
      >
        <div
          class="flex shrink-0 items-center justify-between gap-3 rounded-xl bg-base-100/95 px-3 py-1"
        >
          <p class="font-mono text-sm font-black uppercase tracking-widest">
            Choose your job title
            <span
              v-if="dailyNext"
              class="ml-2 rounded-md bg-amber-300 px-1.5 py-0.5 text-stone-950"
              >Daily Memo · {{ todayLabel }}</span
            >
          </p>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="screen = 'front'"
          >
            <icon name="kind-icon:arrow-left" class="size-4" /> Back
          </button>
        </div>
        <div class="kr-panes hire-layout gap-3">
          <div
            class="grid min-h-0 grid-cols-3 content-start gap-2 lg:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] lg:gap-3"
            role="radiogroup"
            aria-label="Job titles"
          >
            <button
              v-for="job in JOB_TITLES"
              :key="job.id"
              type="button"
              role="radio"
              :aria-checked="job.id === pickedJob.id"
              class="desk-card flex min-w-0 flex-col gap-1 rounded-xl border-2 p-1.5 text-left text-stone-900 transition"
              :class="
                job.id === pickedJob.id
                  ? 'border-stone-900 ring-4 ring-warning'
                  : 'border-stone-800/60'
              "
              @click="pickedJobId = job.id"
            >
              <shifting-desks-art
                class="rounded-lg border-2 border-stone-800"
                frame="aspect-[4/3]"
                :src="stationArt('jobs', job.id)"
                :prompt="jobPrompt(job.id)"
                :alt="`Portrait: ${job.title}`"
                :show-brief="false"
                fallback-icon="kind-icon:user"
                icon-size="2rem"
              />
              <span
                class="line-clamp-2 font-mono text-[11px] font-black uppercase leading-tight sm:text-sm"
                >{{ job.title }}</span
              >
            </button>
          </div>

          <article
            class="desk-card kr-pane rounded-2xl border-2 border-stone-800 text-stone-900"
            aria-live="polite"
          >
            <div class="kr-pane-scroll flex flex-col gap-2 p-3 sm:p-4">
              <shifting-desks-art
                class="hire-portrait hidden shrink-0 rounded-xl border-2 border-stone-800 lg:block"
                frame="aspect-[16/9]"
                :src="stationArt('jobs', pickedJob.id)"
                :prompt="jobPrompt(pickedJob.id)"
                :alt="`Portrait: ${pickedJob.title}`"
                fallback-icon="kind-icon:user"
                icon-size="3rem"
              />
              <p class="font-mono text-lg font-black uppercase">
                {{ pickedJob.title }}
              </p>
              <p class="text-sm">{{ pickedJob.tagline }}</p>
              <span class="grid grid-cols-2 gap-x-4 gap-y-1">
                <span
                  v-for="skill in SKILLS"
                  :key="skill"
                  class="flex items-center justify-between gap-2 text-xs"
                >
                  <span class="capitalize">{{ skill }}</span>
                  <span
                    class="flex gap-0.5"
                    :aria-label="`${skill} ${pickedJob.skills[skill]}`"
                  >
                    <span
                      v-for="n in 3"
                      :key="n"
                      class="size-2.5 rounded-sm border border-stone-800"
                      :class="
                        n <= pickedJob.skills[skill] ? 'bg-stone-800' : ''
                      "
                    />
                  </span>
                </span>
              </span>
              <p class="rounded-xl bg-stone-900/10 p-2 text-xs">
                <strong>{{ pickedJob.perk }}:</strong>
                {{ pickedJob.perkText }}
              </p>
              <p class="text-xs opacity-70">
                Checks roll two dice plus a skill against 7, 9 or 11.
              </p>
              <button
                type="button"
                class="btn mt-auto shrink-0 border-stone-900 bg-stone-900 text-amber-50 hover:bg-stone-700"
                @click="hire(pickedJob.id)"
              >
                <icon name="kind-icon:briefcase" class="size-5" />
                Hire on as {{ pickedJob.title }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section
        v-else-if="run && store.transition"
        class="kr-stage mx-auto w-full max-w-[1400px] px-2 pb-2 sm:px-4"
      >
        <shifting-desks-elevator
          class="min-h-0 flex-1"
          :from-title="currentDept.department.title"
          :from-floor="floorFor(currentDept)"
          :to-title="upcoming?.department.title ?? ''"
          :to-floor="upcoming ? floorFor(upcoming) : ''"
          :to-tagline="upcomingTagline"
          :outcome-title="store.outcome?.title ?? ''"
          :outcome-summary="store.outcome?.summary ?? ''"
          :memo="elevatorMemo"
          :restructuring="upcomingNotice"
          :board="upcomingBoard"
          :arrival-src="
            upcoming ? stationArt('departments', upcoming.department.id) : ''
          "
          :arrival-prompt="upcoming?.department.arrival_prompt ?? ''"
          @descend="descend"
        />
      </section>

      <section
        v-else-if="run && store.finished"
        class="kr-stage mx-auto w-full max-w-[1400px] px-2 pb-2 sm:px-4"
      >
        <shifting-desks-personnel-file
          class="min-h-0 flex-1"
          @again="beginHire(false)"
          @front="toFront"
          @archive="openArchive('milestones')"
        />
        <div class="shrink-0">
          <PlaybookRunReview
            game="shifting-desks"
            :run="run"
            :ending="run.status"
          />
        </div>
      </section>

      <section
        v-else-if="run && view"
        class="kr-stage mx-auto w-full max-w-[1400px] gap-2 px-2 pb-2 sm:px-4"
      >
        <p
          v-if="currentNotice && !opened"
          class="shrink-0 truncate rounded-lg bg-base-100/95 px-2 py-0.5 text-xs font-semibold"
          :title="currentNotice.reason"
        >
          <span class="font-mono font-black uppercase">Restructured:</span>
          {{ currentNotice.headline }}. {{ currentNotice.reason }}
        </p>
        <shifting-desks-memo-ticker
          v-if="!opened"
          class="hidden shrink-0 sm:flex"
          :lines="tickerLines"
        />

        <div class="kr-panes desk-layout gap-2 lg:gap-4">
          <div
            class="desk-flip kr-pane"
            :class="{ 'is-tucked': deciding || !!run.pending }"
          >
            <div class="desk-flip-inner" :class="{ 'is-open': opened }">
              <button
                ref="cardBack"
                type="button"
                class="desk-face desk-back flex flex-col items-center justify-center gap-3 rounded-2xl border-4 p-4"
                :class="view.kind === 'boss' ? 'is-boss' : ''"
                :tabindex="opened ? -1 : 0"
                :aria-hidden="opened"
                @click="openFile"
              >
                <shifting-desks-art
                  class="!absolute inset-0 rounded-xl"
                  frame="h-full w-full"
                  :src="backArt"
                  :prompt="backPrompt"
                  :fallback-icon="
                    view.kind === 'boss'
                      ? 'kind-icon:shield'
                      : 'kind-icon:folder'
                  "
                  icon-size="4.5rem"
                  :show-brief="false"
                />
                <span class="desk-stamp relative">
                  {{
                    view.kind === 'boss' ? 'Department review' : locationTitle
                  }}
                </span>
                <span
                  class="relative rounded-full border-2 bg-inherit px-4 py-1 text-xs font-bold uppercase"
                >
                  Open the file
                </span>
              </button>
              <article
                class="desk-face desk-front desk-card flex flex-col overflow-hidden rounded-2xl border-4 border-stone-800 text-stone-900"
                :aria-hidden="!opened"
              >
                <div class="desk-plate relative min-h-0 flex-1">
                  <shifting-desks-art
                    class="!absolute inset-0"
                    frame="h-full w-full"
                    :src="faceArt"
                    :prompt="view.card.art_prompt"
                    :alt="`Illustration: ${view.card.title}`"
                    :fallback-icon="cardIcon"
                    icon-size="5rem"
                  />
                  <span
                    class="absolute left-2 top-2 rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-50"
                    >{{
                      view.kind === 'boss' ? 'Department review' : locationTitle
                    }}</span
                  >
                </div>
                <div class="flex shrink-0 flex-col gap-1 p-2 sm:p-3 md:hidden">
                  <p
                    ref="cardHeading"
                    tabindex="-1"
                    class="font-mono text-base font-black uppercase leading-tight sm:text-xl"
                  >
                    {{ view.card.title }}
                  </p>
                  <p
                    class="max-h-48 overflow-y-auto text-base leading-relaxed lg:text-lg"
                  >
                    {{ view.card.flavor_text }}
                  </p>
                  <button
                    v-if="opened && !run.pending"
                    type="button"
                    class="btn btn-warning btn-sm mt-1 self-start md:hidden"
                    :tabindex="opened ? 0 : -1"
                    @click="decide"
                  >
                    Decide
                    <icon name="kind-icon:arrow-right" class="size-4" />
                  </button>
                </div>
              </article>
            </div>
          </div>

          <div
            class="kr-pane"
            :class="{ 'is-tucked': !deciding && !run.pending }"
          >
            <div class="kr-pane-scroll flex flex-col gap-2">
              <div
                class="flex shrink-0 items-center gap-2 rounded-xl border-2 border-stone-800 bg-base-200 p-1.5 md:hidden"
              >
                <shifting-desks-art
                  class="shrink-0 rounded-lg"
                  frame="size-11"
                  :src="faceArt"
                  :show-brief="false"
                  :fallback-icon="cardIcon"
                  icon-size="1.25rem"
                />
                <p
                  ref="decideHeading"
                  tabindex="-1"
                  class="min-w-0 flex-1 truncate font-mono text-sm font-black uppercase"
                >
                  {{ view.card.title }}
                </p>
                <button
                  v-if="!run.pending"
                  type="button"
                  class="btn btn-ghost btn-xs shrink-0"
                  @click="deciding = false"
                >
                  <icon name="kind-icon:arrow-left" class="size-3.5" /> Card
                </button>
              </div>
              <div
                v-if="opened"
                class="desk-brief desk-card hidden shrink-0 flex-col gap-1 rounded-2xl border-4 border-stone-800 p-3 text-stone-900 md:flex"
                :class="denseRoutes ? '' : 'lg:p-4'"
              >
                <p
                  ref="briefHeading"
                  tabindex="-1"
                  class="font-mono text-lg font-black uppercase leading-tight"
                  :class="denseRoutes ? 'lg:text-xl' : 'lg:text-2xl'"
                >
                  {{ view.card.title }}
                </p>
                <p
                  :class="
                    denseRoutes
                      ? 'text-sm leading-snug lg:text-base'
                      : 'desk-brief-text text-base leading-relaxed lg:text-lg'
                  "
                >
                  {{ view.card.flavor_text }}
                </p>
              </div>
              <div
                v-if="caseFileExhibits.length"
                class="rounded-lg border border-amber-700/50 bg-amber-100/80 p-2 text-xs leading-snug text-stone-900"
                aria-label="Evidence from your personnel file"
              >
                <p class="font-mono font-bold uppercase">Case-file exhibits</p>
                <p v-for="exhibit in caseFileExhibits" :key="exhibit">
                  {{ exhibit }}
                </p>
              </div>
              <template v-if="run.pending">
                <article
                  class="relative flex flex-col gap-2 rounded-2xl border-2 p-3 sm:p-4"
                  :class="
                    run.pending.success
                      ? 'border-success bg-base-100 shadow-md'
                      : 'border-error bg-base-100 shadow-md'
                  "
                  aria-live="polite"
                >
                  <span
                    :key="`stamp-${store.rollSerial}`"
                    class="result-slam"
                    :class="slamApproved ? 'is-approved' : 'is-denied'"
                    aria-hidden="true"
                    >{{ slamApproved ? 'Approved' : 'Denied' }}</span
                  >
                  <p
                    class="font-mono text-xs font-black uppercase tracking-widest opacity-70"
                  >
                    You chose: {{ run.pending.choiceLabel }}
                  </p>
                  <div
                    v-if="run.pending.dice"
                    class="flex flex-wrap items-center gap-2"
                  >
                    <span
                      v-for="(d, i) in run.pending.dice"
                      :key="`${store.rollSerial}-${i}`"
                      class="desk-die flex size-10 items-center justify-center rounded-xl border-2 border-base-content bg-base-100 font-mono text-xl font-black"
                      >{{ d }}</span
                    >
                    <span class="text-sm">
                      + {{ run.pending.skill }} {{ run.pending.skillValue
                      }}<template v-if="run.pending.boost"> + Form 2</template>
                      =
                      <strong class="text-lg">{{ run.pending.total }}</strong>
                      vs {{ run.pending.target }}
                    </span>
                    <span
                      v-if="run.pending.rerolled"
                      class="text-xs line-through opacity-60"
                      >first roll {{ run.pending.rerolled.join(' + ') }}</span
                    >
                  </div>
                  <p class="text-sm leading-relaxed sm:text-base lg:text-lg">
                    {{ run.pending.text }}
                  </p>
                  <shifting-desks-effect-chips :effects="run.pending.effects" />
                  <p
                    v-if="run.pending.aids.length"
                    class="text-xs font-bold uppercase opacity-70"
                  >
                    Helped by {{ run.pending.aids.join(', ') }}
                  </p>
                  <div
                    v-if="newSuccessor"
                    class="successor-card flex items-center gap-3 rounded-xl border-2 border-stone-800 p-2 text-stone-900"
                  >
                    <icon name="kind-icon:users" size="1.5rem" />
                    <p class="text-sm">
                      <strong class="font-mono uppercase"
                        >A Successor has been thawed.</strong
                      >
                      {{ newSuccessor }}
                    </p>
                  </div>
                  <ul
                    v-if="run.pending.events.length"
                    class="flex flex-col gap-1 text-sm font-semibold"
                  >
                    <li
                      v-for="(e, i) in run.pending.events"
                      :key="i"
                      class="flex gap-2"
                    >
                      <icon
                        name="kind-icon:alert"
                        class="mt-0.5 size-4 shrink-0 text-warning"
                      />
                      {{ e }}
                    </li>
                  </ul>
                  <button
                    ref="nextButton"
                    type="button"
                    class="btn btn-warning self-start lg:btn-lg"
                    @click="next"
                  >
                    {{
                      run.status === 'playing' ? 'Next file' : 'See your record'
                    }}
                    <icon name="kind-icon:arrow-right" class="size-4" />
                  </button>
                </article>
              </template>

              <template v-else-if="opened">
                <shifting-desks-window
                  v-if="view.kind === 'window'"
                  :shift="view.shift"
                  :applicant="view.applicant"
                  :index="view.index"
                  @stamp="pick"
                />
                <template v-else>
                  <details
                    v-if="interim"
                    class="rounded-xl border-2 border-stone-800 bg-base-200"
                  >
                    <summary
                      class="cursor-pointer px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-widest"
                    >
                      <span class="sm:hidden">Interim results</span
                      ><span class="hidden sm:inline"
                        >PAL has prepared your interim results</span
                      >
                      · {{ interim.revealed.length }} shown
                    </summary>
                    <shifting-desks-test-results
                      :readings="interim.revealed"
                      :sealed="interim.sealed"
                    />
                  </details>
                  <div
                    class="flex shrink-0 flex-col"
                    :class="manyRoutes ? 'gap-1.5' : 'grow gap-2 lg:gap-3'"
                  >
                    <button
                      v-for="choice in openRoutes"
                      :key="choice.id"
                      type="button"
                      class="flex shrink-0 flex-col rounded-xl border-2 text-left transition"
                      :class="[
                        manyRoutes
                          ? 'choice-card-compact gap-1 px-3 py-1.5'
                          : fourRoutes
                            ? 'choice-card choice-four grow justify-center gap-1 px-3 py-2 lg:rounded-2xl lg:px-4'
                            : 'choice-card grow justify-center gap-1.5 px-4 py-3 lg:gap-2 lg:rounded-2xl lg:px-5',
                        lockFor(choice)
                          ? 'cursor-not-allowed border-base-300 bg-base-200 text-base-content/60'
                          : 'border-base-300 bg-base-100 hover:border-warning focus-visible:border-warning',
                      ]"
                      :aria-disabled="!!lockFor(choice)"
                      :title="lockFor(choice) ?? undefined"
                      @click="pick(choice)"
                    >
                      <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <icon
                          v-if="manyRoutes && lockFor(choice)"
                          name="kind-icon:lock"
                          class="size-3.5 text-error"
                        />
                        <span
                          class="font-bold"
                          :class="
                            manyRoutes
                              ? 'text-sm'
                              : fourRoutes
                                ? 'choice-label text-base lg:text-xl'
                                : 'choice-label text-base sm:text-lg lg:text-2xl'
                          "
                          >{{ choice.label }}</span
                        >
                        <span
                          v-if="manyRoutes && lockFor(choice)"
                          class="sr-only"
                          >{{ lockFor(choice) }}</span
                        >
                        <template v-if="!(manyRoutes && lockFor(choice))">
                          <span
                            v-if="choice.roll"
                            class="flex cursor-help items-center gap-1 rounded-md bg-base-300 font-bold"
                            :class="chipSize"
                            :title="rollExplain(choice)"
                            @click.stop.prevent="toggleRollTip(choice.id)"
                          >
                            <icon name="kind-icon:dice" class="size-3.5" />
                            {{ DIFFICULTY[choice.roll.target] ?? 'Roll' }}
                            <span class="roll-need font-black text-sky-700">{{
                              needFor(choice)
                            }}</span>
                            <span class="sr-only">{{
                              rollExplain(choice)
                            }}</span>
                          </span>
                          <span
                            v-else
                            class="rounded-md bg-base-300 font-bold"
                            :class="chipSize"
                            >Certain</span
                          >
                          <shifting-desks-effect-chips
                            v-if="hasCost(choice)"
                            :effects="choice.cost"
                            :prefix="manyRoutes ? '' : 'Cost'"
                            :large="!manyRoutes"
                          />
                        </template>
                      </span>
                      <span
                        v-if="!(manyRoutes && lockFor(choice))"
                        class="opacity-80"
                        :class="
                          manyRoutes
                            ? 'line-clamp-1 text-xs'
                            : fourRoutes
                              ? 'choice-intent text-sm leading-snug lg:text-base'
                              : 'text-sm leading-snug sm:text-base lg:text-lg'
                        "
                        :title="
                          manyRoutes
                            ? `${choice.intent} ${choice.risk_hint}`
                            : undefined
                        "
                        >{{ choice.intent }}
                        <span v-if="!manyRoutes" class="italic opacity-80">{{
                          choice.risk_hint
                        }}</span></span
                      >
                      <span
                        v-if="run && riskPayoffFor(run, choice)"
                        class="self-start rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success-content"
                        >If the check succeeds: +1 Form</span
                      >
                      <span
                        v-if="run && clueChainFor(run, choice)"
                        class="self-start rounded-md border border-info/40 bg-info/10 px-2 py-0.5 text-[11px] font-semibold"
                        :title="clueChainFor(run, choice)?.hint"
                        >Thread: {{ clueChainFor(run, choice)?.hint }}</span
                      >
                      <span
                        v-if="rollTip === choice.id && choice.roll"
                        class="rounded-md bg-sky-100 px-2 py-1 text-xs leading-snug text-sky-950"
                        aria-hidden="true"
                        >{{ rollExplain(choice) }}</span
                      >
                      <span
                        v-if="gradeBadge(choice)"
                        class="flex items-center gap-1 self-start rounded-md bg-stone-800 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-50"
                      >
                        <icon name="kind-icon:document" size="0.75rem" />
                        {{ gradeBadge(choice) }}
                      </span>
                      <span
                        v-if="aidBadges(choice).length"
                        class="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase"
                      >
                        <span
                          v-for="badge in aidBadges(choice)"
                          :key="badge"
                          class="rounded-md bg-warning/20 px-2 py-0.5"
                          >{{ badge }}</span
                        >
                      </span>
                      <span
                        v-if="lockFor(choice) && !manyRoutes"
                        class="text-xs font-bold text-error"
                      >
                        <icon name="kind-icon:lock" class="size-3" />
                        {{ lockFor(choice) }}
                      </span>
                    </button>
                  </div>
                  <div
                    v-if="
                      lockedRoutes.length ||
                      anyRoll ||
                      favorToggleShown ||
                      mutationToggleShown
                    "
                    class="flex shrink-0 flex-wrap items-center gap-1.5 text-xs"
                  >
                    <ul
                      v-if="lockedRoutes.length"
                      class="contents"
                      aria-label="Routes you have not earned"
                    >
                      <li
                        v-for="choice in lockedRoutes"
                        :key="choice.id"
                        class="locked-chip flex max-w-full items-center gap-1 rounded-lg border border-base-300 bg-base-200 px-2 py-1 text-xs text-base-content/70 max-md:max-w-[calc(50%-0.375rem)]"
                        :title="lockFor(choice) ?? undefined"
                      >
                        <icon
                          name="kind-icon:lock"
                          class="size-3 shrink-0 text-error"
                        />
                        <span class="truncate">{{ choice.label }}</span>
                        <span class="sr-only">{{ lockFor(choice) }}</span>
                      </li>
                    </ul>
                    <label
                      v-if="anyRoll"
                      class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-base-300 bg-base-200 px-2 py-1"
                      title="Attach a signed Form for +2 to the roll. Costs 1 Form, rolls only."
                    >
                      <input
                        v-model="spendForm"
                        type="checkbox"
                        class="checkbox checkbox-warning checkbox-xs"
                        :disabled="run.meters.forms < 1"
                      />
                      Attach a Form, +2 ({{ run.meters.forms }} left)
                    </label>
                    <label
                      v-if="favorToggleShown"
                      class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-base-300 bg-base-200 px-2 py-1"
                      :title="`${society.favor.text} Once per run.`"
                    >
                      <input
                        v-model="useFavor"
                        type="checkbox"
                        class="checkbox checkbox-error checkbox-xs"
                      />
                      Favor: {{ society.favor.title }}
                    </label>
                    <label
                      v-if="mutationToggleShown"
                      class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-base-300 bg-base-200 px-2 py-1"
                      :title="`${mutation.text}${witnessed ? ' Someone is watching: +2 Suspicion.' : ''}`"
                    >
                      <input
                        v-model="useMutation"
                        type="checkbox"
                        class="checkbox checkbox-success checkbox-xs"
                      />
                      {{ mutation.title
                      }}<template v-if="witnessed"> (+2 Suspicion)</template>
                    </label>
                  </div>
                </template>
              </template>

              <p
                v-else
                class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm text-base-content/80"
              >
                A file has been placed on your desk. Open it when you are ready.
                PAL is watching either way.
              </p>
            </div>
          </div>
        </div>
      </section>

      <shifting-desks-endings-gallery ref="endingsGallery" />
      <shifting-desks-personnel-archive ref="personnelArchive" />

      <dialog ref="artPicker" class="modal" aria-label="Choose your art style">
        <div class="modal-box flex max-w-3xl flex-col gap-3 p-3 sm:p-4">
          <shifting-desks-style-picker class="h-56 sm:h-80" />
          <button
            type="button"
            class="btn btn-warning self-end"
            @click="artPicker?.close()"
          >
            Done
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="submit">Close</button>
        </form>
      </dialog>

      <dialog
        ref="journal"
        class="modal"
        aria-label="Personnel file"
        @close="journalOpen = false"
      >
        <div class="modal-box flex max-h-[85dvh] max-w-2xl flex-col gap-3 p-4">
          <div class="flex shrink-0 items-center justify-between gap-3">
            <p class="font-mono text-sm font-black uppercase tracking-widest">
              Personnel file · {{ run?.log.length ?? 0 }} entries
            </p>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="closeJournal"
            >
              Close
            </button>
          </div>
          <div class="kr-pane-scroll">
            <shifting-desks-journal
              v-if="journalOpen && run"
              :entries="run.log"
            />
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="submit">Close</button>
        </form>
      </dialog>
    </template>
    <shifting-desks-print-dossier
      v-if="store.printReceipt"
      :receipt="store.printReceipt"
      :run="store.run"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'
import {
  DIFFICULTY,
  JOB_TITLES,
  METERS,
  DEPARTMENTS,
  DEPARTMENT_FLOORS,
  METER_LABELS,
  departmentPack,
  jobPrompt,
  stationArt,
  nextDepartment,
  SKILLS,
  employeeId,
  jobById,
  favorAppliesTo,
  favorAvailable,
  lockReason,
  mutationAppliesTo,
  diceNeeded,
  rollBoost,
  mutationById,
  societyById,
  locationById,
  gradeRequirement,
  gradeTitle,
  reviewExhibits,
  riskPayoffFor,
  clueChainFor,
  interimResults,
  departmentBoard,
  restructuringById,
  restructuringFor,
  restructuringHeadline,
  stepLabels,
  type Choice,
  type Pack,
  type Meter,
  ENDINGS,
} from '~/utils/shiftingDesks/rules'
import {
  memoLines,
  restructuringMemo,
  successorLine,
} from '~/utils/shiftingDesks/memos'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'
import { dailyDateOf, dailyKey, dailyLabel } from '~/utils/shiftingDesks/daily'
import {
  ART_STYLES,
  ART_STYLE_SAMPLE,
  DEFAULT_ART_STYLE,
  artStyleImageSrc,
  loadArtStylePreference,
  saveArtStylePreference,
  type ShiftingDesksArtStyle,
} from '~/utils/shiftingDesks/artStyles'

const store = useShiftingDesksStore()
const artStyle = ref<ShiftingDesksArtStyle>(DEFAULT_ART_STYLE)
provide('shifting-desks-art-style', artStyle)
// Visual choice lives outside gameplay state and survives a reload.
watch(artStyle, saveArtStylePreference)
const screen = ref<'front' | 'hire' | 'play'>('front')
const opened = ref(false)

// Silas, 2026-10-16: the bars above the desk took the space the art, the
// file and the choices need. One heads-up bar carries the floor, the meters
// and the envelope; each chip explains itself on tap, hover or focus.
const atDesk = computed(
  () =>
    screen.value === 'play' &&
    !!run.value &&
    !store.transition &&
    !store.finished &&
    !!view.value,
)
const hudTip = ref<string | null>(null)

function tipHandlers(key: string) {
  return {
    onMouseenter: () => (hudTip.value = key),
    onMouseleave: () => (hudTip.value = null),
    onFocus: () => (hudTip.value = key),
    onBlur: () => (hudTip.value = null),
    onClick: () => (hudTip.value = key),
    onKeydown: (event: KeyboardEvent) => {
      if (event.key === 'Escape') hudTip.value = null
    },
  }
}

const hudTipText = computed(() => {
  const key = hudTip.value
  if (!key || !run.value) return ''
  if (key === 'floor') {
    const dept = currentDept.value
    const total = steps.value.length
    const at = Math.min(run.value.position + 1, total)
    const notice = currentNotice.value
      ? ` Restructured: ${currentNotice.value.headline}. ${currentNotice.value.reason}`
      : ''
    const daily = dailyDateOf(run.value.seed)
    return (
      (daily ? `Daily Memo, ${dailyLabel(daily)}. ` : '') +
      `${floorFor(dept)} · ${dept.department.title.split(':')[0]}. ` +
      `File ${at} of ${total}. You are ${employee.value}, ${jobTitle.value}.` +
      notice
    )
  }
  const meter = meterList.value.find((m) => m.key === key)
  return meter ? `${meter.label} ${meter.value}: ${meter.help}` : ''
})
const spendForm = ref(false)
const useFavor = ref(false)
const useMutation = ref(false)
const cardHeading = ref<HTMLElement | null>(null)
// From md the card's title and description sit above the choices instead.
const briefHeading = ref<HTMLElement | null>(null)
const cardBack = ref<HTMLElement | null>(null)
const nextButton = ref<HTMLElement | null>(null)
const decideHeading = ref<HTMLElement | null>(null)
const deciding = ref(false)
const journal = ref<HTMLDialogElement | null>(null)
// Silas, 2026-10-14: "we should be able to change the art style in game."
const artPicker = ref<HTMLDialogElement | null>(null)
const currentArtStyle = computed(
  () => ART_STYLES.find((s) => s.id === artStyle.value) ?? ART_STYLES[0],
)

function openArtPicker(): void {
  artPicker.value?.showModal()
}
const journalOpen = ref(false)
const pickedJobId = ref(JOB_TITLES[0]!.id)
const pickedJob = computed(() => jobById(pickedJobId.value))

const run = computed(() => store.run)
const view = computed(() => store.card)
const caseFileExhibits = computed(() =>
  run.value && view.value?.kind === 'boss' ? reviewExhibits(run.value) : [],
)

const METER_INFO: Record<Meter, { icon: string; help: string }> = {
  composure: {
    icon: 'kind-icon:heart-pulse',
    help: 'At 0 you break down and a Successor takes your desk.',
  },
  clearance: { icon: 'kind-icon:key', help: 'Opens doors and options.' },
  suspicion: {
    icon: 'kind-icon:eye',
    help: 'At 10 PAL invites you to a short, friendly conversation.',
  },
  successors: {
    icon: 'kind-icon:users',
    help: 'Copies of you on file. At 0 your position is eliminated.',
  },
  forms: {
    icon: 'kind-icon:document',
    help: 'Signed permission. Spend one for +2 on a roll.',
  },
}

const meterList = computed(() =>
  run.value
    ? METERS.map((key) => ({
        key,
        label: METER_LABELS[key],
        ...METER_INFO[key],
        value: run.value!.meters[key],
        danger:
          (key === 'composure' && run.value!.meters.composure <= 2) ||
          (key === 'suspicion' && run.value!.meters.suspicion >= 7) ||
          (key === 'successors' && run.value!.meters.successors <= 1),
      }))
    : [],
)

const levelNotes = [
  {
    floor: 'Surface',
    name: 'Orientation',
    note: 'Badge photo, psych intake, Supply Closet B and your 90-Day Review.',
    id: 'orientation',
  },
  {
    floor: 'Level −1',
    name: 'Records & Forms',
    note: 'Pneumatic tubes, the Sub-Archive and Window 9.',
    id: 'records',
  },
  {
    floor: 'Level −2',
    name: 'Product Safety: Toy Division',
    note: 'The Concept Lab, the Focus Group Room, the Proving Grounds and a launch party for a bear with a peace-of-mind module.',
    id: 'toy-division',
  },
  {
    floor: 'Level −3',
    name: 'Wellness & Testing: the Vault',
    note: 'Nutrition Studies, the Cognitive Testing Chamber, the Mutation Suite, and an exam where the test is whether you will administer the test.',
    id: 'wellness',
  },
  {
    floor: 'Level −4',
    name: 'Sub-Level Zero: the Board',
    note: "The Boardroom Antechamber, the Founder's Office, Server Room Zero, and the Board itself, where every choice is an ending.",
    id: 'sub-level-zero',
  },
]

const levels = levelNotes.map((l) => ({
  ...l,
  open: DEPARTMENTS.some((d) => d.department.id === l.id),
}))

const currentDept = computed(() =>
  departmentPack(run.value?.department ?? 'orientation'),
)
const upcoming = computed(() =>
  nextDepartment(run.value?.department ?? 'orientation'),
)
const upcomingTagline = computed(
  () => levels.find((l) => l.id === upcoming.value?.department.id)?.note ?? '',
)

function floorFor(dept: Pack): string {
  return DEPARTMENT_FLOORS[dept.department.order] ?? ''
}

const tickerLines = computed(() => memoLines(run.value))
const elevatorMemo = computed(() =>
  run.value
    ? restructuringMemo(run.value, upcoming.value?.department.title ?? '')
    : [],
)
const newSuccessor = computed(() =>
  run.value?.pending?.events.some((e) => e.includes('reports for duty'))
    ? successorLine(run.value)
    : '',
)

const steps = computed(() =>
  run.value ? stepLabels(run.value).map((t) => t.split(' & ')[0]!) : [],
)

const upcomingMemo = computed(() =>
  run.value && upcoming.value
    ? restructuringFor(run.value, upcoming.value)
    : null,
)
const upcomingNotice = computed(() =>
  upcoming.value && upcomingMemo.value
    ? {
        headline: restructuringHeadline(upcoming.value, upcomingMemo.value),
        reason: upcomingMemo.value.reason,
      }
    : null,
)
const upcomingBoard = computed(() =>
  upcoming.value ? departmentBoard(upcoming.value, upcomingMemo.value) : [],
)
const currentNotice = computed(() => {
  if (!run.value) return null
  const memo = restructuringById(
    currentDept.value,
    run.value.restructurings[run.value.department],
  )
  return memo && memo.kind !== 'none'
    ? {
        headline: restructuringHeadline(currentDept.value, memo),
        reason: memo.reason,
      }
    : null
})

const locationTitle = computed(() => {
  if (!run.value || !view.value || view.value.kind === 'boss') return ''
  return (
    stepLabels(run.value)[run.value.position] ??
    locationById(view.value.card.location_id)?.title ??
    ''
  )
})

const TAG_ICONS: Record<string, string> = {
  conspiracy: 'kind-icon:eye',
  'psych-test': 'kind-icon:brain',
  paperwork: 'kind-icon:folder',
  deathtrap: 'kind-icon:alert-triangle',
  creature: 'kind-icon:bug',
  toy: 'kind-icon:heart',
  mutant: 'kind-icon:bolt',
  satire: 'kind-icon:document',
  callback: 'kind-icon:book',
  sacrifice: 'kind-icon:users',
}

const faceArt = computed(() => {
  if (!view.value || !run.value) return ''
  if (view.value.kind === 'window')
    return stationArt('window', view.value.applicant.id)
  return stationArt('cards', view.value.card.id, run.value.department)
})

// A window stamp is always certain, so the slam follows the stamp you chose.
const slamApproved = computed(() =>
  view.value?.kind === 'window'
    ? run.value?.pending?.choiceId === 'approve'
    : !!run.value?.pending?.success,
)

const currentLocation = computed(() =>
  view.value && view.value.kind !== 'boss'
    ? locationById(view.value.card.location_id)
    : undefined,
)

const backArt = computed(() =>
  view.value?.kind === 'boss'
    ? '/images/shifting-desks/backs/review.webp'
    : currentLocation.value
      ? stationArt('locations', currentLocation.value.location_id)
      : '/images/shifting-desks/backs/encounter.webp',
)

const backPrompt = computed(() =>
  view.value?.kind === 'boss'
    ? view.value.card.art_prompt
    : (currentLocation.value?.art_prompt ?? ''),
)

const cardIcon = computed(() => {
  if (!view.value) return 'kind-icon:folder'
  if (view.value.kind === 'boss') return 'kind-icon:shield'
  return TAG_ICONS[view.value.card.tags[0] ?? ''] ?? 'kind-icon:folder'
})

const employee = computed(() => employeeId(run.value?.generation ?? 0))
const jobTitle = computed(() => jobById(run.value?.jobId ?? '').title)

const society = computed(() => societyById(run.value?.societyId ?? ''))
const mutation = computed(() => mutationById(run.value?.mutationId ?? ''))
const witnessed = computed(
  () =>
    view.value?.kind === 'boss' ||
    (view.value?.kind === 'encounter' && view.value.card.witnessed),
)
const favorToggleShown = computed(
  () =>
    !!run.value &&
    store.envelopeOpened &&
    favorAvailable(run.value) &&
    society.value.favor.kind !== 'effects' &&
    !!view.value?.card.choices.some((c) => favorAppliesTo(run.value!, c)),
)
const mutationToggleShown = computed(
  () =>
    !!run.value &&
    store.envelopeOpened &&
    !!view.value?.card.choices.some((c) => mutationAppliesTo(run.value!, c)),
)

function favorFor(choice: Choice): boolean {
  return !!run.value && useFavor.value && favorAppliesTo(run.value, choice)
}

// The dice chip reads "Risky 8": the difficulty word, then what the two dice
// must show once skill and any switched-on bonus are counted. Hover or tap it
// for the sum (Silas, 2026-10-18).
const rollTip = ref<string | null>(null)

function toggleRollTip(id: string): void {
  rollTip.value = rollTip.value === id ? null : id
}

function boostFor(choice: Choice): number {
  if (!run.value) return 0
  return rollBoost(run.value, choice, {
    spendForm: spendForm.value,
    favor: favorFor(choice),
    mutate: mutationFor(choice),
  })
}

function needFor(choice: Choice): number | null {
  return run.value ? diceNeeded(run.value, choice, boostFor(choice)) : null
}

function rollExplain(choice: Choice): string {
  if (!run.value || !choice.roll) return ''
  const { skill, target, modifier } = choice.roll
  const name = skill.charAt(0).toUpperCase() + skill.slice(1)
  const parts = [`${name} ${signed(run.value.skills[skill])}`]
  if (modifier) parts.push(`card ${signed(modifier)}`)
  const boost = boostFor(choice)
  if (boost) parts.push(`bonuses ${signed(boost)}`)
  return (
    `${DIFFICULTY[target] ?? 'Roll'} ${target}: you roll two dice and add ` +
    `${parts.join(', ')}, so the dice need to show ${needFor(choice)} or ` +
    'more. Double six always succeeds; double one always fails.'
  )
}

function signed(n: number): string {
  return n < 0 ? `${n}` : `+${n}`
}

function mutationFor(choice: Choice): boolean {
  return (
    !!run.value && useMutation.value && mutationAppliesTo(run.value, choice)
  )
}

function lockFor(choice: Choice): string | null {
  if (!run.value) return null
  const ignore =
    favorFor(choice) && society.value.favor.kind === 'ignore-requirement'
  return lockReason(run.value, choice, ignore)
}

const interim = computed(() =>
  run.value && view.value?.kind === 'boss' ? interimResults(run.value) : null,
)

function gradeBadge(choice: Choice): string | null {
  const req = gradeRequirement(choice)
  if (!req || !run.value || lockFor(choice)) return null
  return `Test Results: ${gradeTitle(req[0])} ${req[1]} unlocked`
}

function aidBadges(choice: Choice): string[] {
  const out: string[] = []
  if (favorFor(choice)) out.push(society.value.favor.title)
  if (mutationFor(choice)) out.push(mutation.value.title)
  return out
}

const manyRoutes = computed(() => (view.value?.card.choices.length ?? 0) > 4)

const chipSize = computed(() =>
  manyRoutes.value
    ? 'px-1.5 py-0.5 text-[11px]'
    : 'px-2 py-0.5 text-xs sm:py-1 sm:text-sm',
)

// From four routes up, locked ones fold into lock chips under the open ones,
// so a payoff you have not earned still teases without taking a full card.
const chipLocks = computed(() => (view.value?.card.choices.length ?? 0) >= 4)
const openRoutes = computed(() =>
  (view.value?.card.choices ?? []).filter(
    (c) => !chipLocks.value || !lockFor(c),
  ),
)
// Four open routes read one size down so the fourth never falls below the
// fold (t-031 doubled decks, 2026-10-17); five or more use the compact list.
const fourRoutes = computed(
  () => !manyRoutes.value && openRoutes.value.length === 4,
)
const denseRoutes = computed(() => manyRoutes.value || chipLocks.value)
const lockedRoutes = computed(() =>
  chipLocks.value
    ? (view.value?.card.choices ?? []).filter((c) => lockFor(c))
    : [],
)

const anyRoll = computed(
  () => !!view.value?.card.choices.some((c) => c.roll && !lockFor(c)),
)

function hasCost(choice: Choice): boolean {
  return Object.keys(choice.cost).length > 0
}

// The front desk's collectible: every ending this browser has reached.
const endingsGallery = ref<{ open: () => void } | null>(null)
const personnelArchive = ref<{
  open: (section?: 'milestones' | 'endings' | 'achievements' | 'runs') => void
} | null>(null)
function openArchive(
  section: 'milestones' | 'endings' | 'achievements' | 'runs',
): void {
  personnelArchive.value?.open(section)
}
const endingsCount = computed(
  () => ENDINGS.filter((e) => store.endingsFound.includes(e.id)).length,
)

// Silas, 2026-10-16 (free rein): the Daily Memo, one seeded run per day.
const dailyNext = ref(false)
const todayLabel = dailyLabel(dailyKey())

function beginHire(daily: boolean): void {
  dailyNext.value = daily
  screen.value = 'hire'
}

function hire(jobId: string): void {
  store.start(jobId, { daily: dailyNext.value })
  opened.value = false
  spendForm.value = false
  screen.value = 'play'
}

async function decide(): Promise<void> {
  deciding.value = true
  await nextTick()
  decideHeading.value?.focus()
}

async function openFile(): Promise<void> {
  deciding.value = false
  opened.value = true
  await nextTick()
  const brief = briefHeading.value
  ;(brief?.offsetParent ? brief : cardHeading.value)?.focus()
}

async function pick(choice: Choice): Promise<void> {
  if (lockFor(choice)) return
  store.choose(choice.id, {
    spendForm: spendForm.value,
    useFavor: favorFor(choice),
    useMutation: mutationFor(choice),
  })
  useFavor.value = false
  useMutation.value = false
  rollTip.value = null
  spendForm.value = false
  await nextTick()
  nextButton.value?.focus()
}

function openJournal(): void {
  journalOpen.value = true
  journal.value?.showModal()
}

function closeJournal(): void {
  journal.value?.close()
}

// After the next file is dealt, keyboard and screen-reader users land on it
// instead of falling back to the top of the document.
function focusNewFile(): void {
  cardBack.value?.focus({ preventScroll: true })
}

async function descend(): Promise<void> {
  store.descend()
  opened.value = false
  await nextTick()
  focusNewFile()
}

async function next(): Promise<void> {
  store.advance()
  opened.value = false
  await nextTick()
  focusNewFile()
}

function toFront(): void {
  screen.value = 'front'
}

watch([() => run.value?.position, () => run.value?.department], () => {
  opened.value = false
  deciding.value = false
})

onMounted(() => {
  artStyle.value = loadArtStylePreference()
  store.load()
})

useSeoMeta(
  gameLinkPreviewMeta('shifting-desks', useRuntimeConfig().public.appBaseUrl) ??
    {},
)
useHead({ title: 'Shifting Desks' })
</script>

<style scoped>
.desk-card,
.desk-plate {
  background-color: #e9d8a6;
  background-image: radial-gradient(
    rgb(41 37 36 / 0.12) 1px,
    transparent 1.2px
  );
  background-size: 6px 6px;
}

.desk-plate {
  background-color: #d9c48c;
  border-bottom: 4px solid #292524;
}

.front-vignette {
  background: linear-gradient(
    to bottom,
    rgb(12 10 9 / 0.55) 0%,
    rgb(12 10 9 / 0) 30%,
    rgb(12 10 9 / 0) 55%,
    rgb(12 10 9 / 0.7) 100%
  );
}

.front-title {
  text-shadow:
    0 4px 0 rgb(12 10 9 / 0.85),
    0 0 32px rgb(12 10 9 / 0.9);
}

.desk-layout {
  grid-template-rows: minmax(0, 1fr);
}

/* Wide but short (a landscape tablet): the reading column gets more width
   and the type steps down one size, so the file and every choice fit beside
   the art (Silas, 2026-10-16). Unlayered, so it outranks the utilities. */
@media (min-width: 1024px) and (max-height: 820px) {
  .desk-layout {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr) !important;
  }

  .choice-card {
    padding-block: 0.5rem;
    gap: 0.25rem;
  }

  .choice-label {
    font-size: 1.25rem;
    line-height: 1.6rem;
  }

  .desk-brief-text {
    font-size: 1rem;
    line-height: 1.55rem;
  }

  .desk-brief {
    padding: 0.5rem 0.75rem;
  }

  .choice-card-compact {
    padding-block: 0.25rem;
    gap: 0.125rem;
  }

  .choice-four {
    padding-block: 0.3rem;
    gap: 0.125rem;
  }

  .choice-four .choice-label {
    font-size: 1.05rem;
    line-height: 1.35rem;
  }

  .choice-four .choice-intent {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .hire-portrait {
    aspect-ratio: auto;
    height: 9rem;
  }

  .desk-brief > p:first-child {
    font-size: 1rem;
    line-height: 1.35rem;
  }

  .locked-chip {
    padding-block: 0.125rem;
  }
}

@media (max-width: 767.98px) {
  .is-tucked {
    display: none;
  }
}

@media (min-width: 768px) {
  .desk-layout {
    grid-template-rows: minmax(6rem, 1fr) minmax(0, auto);
  }
}

.hire-layout {
  grid-template-rows: auto minmax(0, 1fr);
}

@media (min-width: 1024px) {
  .desk-layout {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    grid-template-rows: minmax(0, 1fr);
  }

  .hire-layout {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
}

.dept-banner {
  background: #c9a227;
}

.result-slam {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  transform: rotate(-10deg);
  border: 4px double currentColor;
  border-radius: 0.5rem;
  padding: 0.15rem 0.7rem;
  font-family: ui-monospace, monospace;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  animation: slam 0.4s cubic-bezier(0.2, 1.6, 0.4, 1) both 0.55s;
  pointer-events: none;
}

.result-slam.is-approved {
  color: #15803d;
}

.result-slam.is-denied {
  color: #b91c1c;
}

@keyframes slam {
  from {
    transform: rotate(-10deg) scale(2.4);
    opacity: 0;
  }
  to {
    transform: rotate(-10deg) scale(1);
    opacity: 1;
  }
}

.successor-card {
  background: #bef264;
  animation: successor-in 0.5s ease-out both 0.8s;
}

@keyframes successor-in {
  from {
    transform: translateY(0.75rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.desk-flip {
  padding-top: 1.1rem;
  perspective: 1400px;
}

.desk-flip-inner {
  position: relative;
  display: grid;
  height: 100%;
  min-height: 0;
  transform-style: preserve-3d;
  transition: transform 560ms cubic-bezier(0.4, 0.1, 0.2, 1);
}

.desk-flip-inner.is-open {
  transform: rotateY(180deg);
}

.desk-face {
  grid-area: 1 / 1;
  min-height: 0;
  backface-visibility: hidden;
}

.desk-stamp {
  max-width: 85%;
  transform: rotate(-6deg);
  border: 4px double currentColor;
  border-radius: 0.5rem;
  padding: 0.4rem 0.9rem;
  text-align: center;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.desk-back {
  position: relative;
  border-color: #292524;
  background: #c9a227;
  color: #292524;
  box-shadow: inset 0 0 0 10px rgb(41 37 36 / 0.08);
}

.desk-back::before {
  content: '';
  position: absolute;
  top: -1.1rem;
  left: 1.5rem;
  width: 40%;
  height: 1.1rem;
  border: 4px solid currentColor;
  border-bottom: 0;
  border-radius: 0.75rem 0.75rem 0 0;
  background: inherit;
}

.desk-back.is-boss {
  background: #7f1d1d;
  color: #fef3c7;
  border-color: #fef3c7;
}

.desk-front {
  transform: rotateY(180deg);
}

.desk-die {
  animation: desk-roll 0.5s cubic-bezier(0.14, 0.74, 0.36, 1.25) both;
}

@keyframes desk-roll {
  from {
    transform: rotate(-200deg) scale(0.4);
    opacity: 0;
  }
  to {
    transform: rotate(0) scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .result-slam,
  .successor-card,
  .desk-flip-inner,
  .desk-die {
    transition: none;
    animation: none;
  }
}
</style>
