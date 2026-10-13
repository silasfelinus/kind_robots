<template>
  <main class="kr-surface">
    <div v-if="!store.loaded" class="kr-stage items-center justify-center">
      <span class="kr-spinner-lg-primary" />
    </div>

    <template v-else>
      <div
        class="kr-toolbar mx-auto w-full max-w-[1200px] justify-between gap-x-4 px-3 py-2 sm:px-6"
      >
        <p class="font-mono text-sm font-black uppercase tracking-[.25em]">
          Shifting <span class="text-warning">/</span> Desks
        </p>
        <div
          v-if="run"
          class="flex flex-wrap items-center gap-1.5"
          aria-label="Your file"
        >
          <span
            v-for="m in meterList"
            :key="m.key"
            class="flex items-center gap-1 rounded-md bg-base-200 px-2 py-1 text-xs font-bold"
            :class="m.danger ? 'text-error' : ''"
            :title="m.help"
          >
            <icon :name="m.icon" class="size-3.5" />
            <span class="hidden sm:inline">{{ m.label }}</span>
            {{ m.value }}
          </span>
          <button type="button" class="btn btn-ghost btn-xs" @click="toFront">
            Leave
          </button>
        </div>
      </div>

      <div ref="scroller" class="kr-scroll">
        <div
          class="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-3 pb-10 sm:px-6"
        >
          <section v-if="screen === 'front'" class="flex flex-col gap-6">
            <section
              class="desk-poster relative overflow-hidden rounded-2xl border-4 border-stone-800 p-6 sm:p-10"
            >
              <div class="relative z-10 flex flex-col gap-5 lg:max-w-[60%]">
                <p
                  class="text-xs font-black uppercase tracking-[.3em] text-stone-700"
                >
                  Consolidated Wellness &amp; Defense · Making Tomorrow Safer,
                  Today
                </p>
                <p
                  class="font-mono text-5xl font-black uppercase leading-none text-stone-900 sm:text-7xl"
                >
                  Shifting<br />Desks
                </p>
                <p class="max-w-xl text-lg font-semibold text-stone-800">
                  A darkly comic card adventure through a paranoid office
                  hellscape. Every choice costs something. Nobody gets a clean
                  win. HR has five more of you on file.
                </p>
                <blockquote
                  class="max-w-xl rounded-2xl border-2 border-stone-800 bg-stone-50/80 p-4 text-stone-900"
                >
                  <p class="font-mono text-sm">
                    “Welcome to your complimentary Wellness Weekend! I'm PAL,
                    your Personnel Administration Liaison. I'm so proud of you
                    already. Please keep your badge visible and your thoughts
                    compliant. The elevator only goes down.”
                  </p>
                </blockquote>
                <div class="flex flex-wrap gap-3">
                  <button
                    v-if="run"
                    type="button"
                    class="btn btn-lg border-stone-900 bg-stone-900 text-amber-50 hover:bg-stone-700"
                    @click="screen = 'play'"
                  >
                    <icon name="kind-icon:play" class="size-5" />
                    Return to your desk
                  </button>
                  <button
                    type="button"
                    class="btn btn-lg"
                    :class="
                      run
                        ? 'btn-outline border-stone-900 text-stone-900'
                        : 'border-stone-900 bg-stone-900 text-amber-50 hover:bg-stone-700'
                    "
                    @click="screen = 'hire'"
                  >
                    <icon name="kind-icon:briefcase" class="size-5" />
                    {{
                      run
                        ? 'Start a new Wellness Weekend'
                        : 'Begin your Wellness Weekend'
                    }}
                  </button>
                </div>
              </div>
              <div class="poster-figure" aria-hidden="true">
                <div class="poster-folder">
                  <icon
                    name="kind-icon:eye"
                    size="7rem"
                    class="text-stone-900"
                  />
                </div>
              </div>
            </section>

            <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article
                v-for="pillar in pillars"
                :key="pillar.title"
                class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 p-5"
              >
                <icon :name="pillar.icon" class="size-7 text-warning" />
                <p
                  class="font-mono text-sm font-black uppercase tracking-widest"
                >
                  {{ pillar.title }}
                </p>
                <p class="text-sm opacity-80">{{ pillar.body }}</p>
              </article>
            </section>

            <section
              class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-5"
            >
              <p class="font-mono text-sm font-black uppercase tracking-widest">
                The elevator only goes down
              </p>
              <ol class="flex flex-col gap-2">
                <li
                  v-for="level in levels"
                  :key="level.name"
                  class="flex items-center gap-3 rounded-xl border p-3"
                  :class="
                    level.open
                      ? 'border-warning bg-base-100'
                      : 'border-base-300 bg-base-100/40 opacity-70'
                  "
                >
                  <span
                    class="w-16 shrink-0 text-center font-mono text-xs font-black uppercase opacity-70"
                    >{{ level.floor }}</span
                  >
                  <icon
                    :name="level.open ? 'kind-icon:folder' : 'kind-icon:lock'"
                    class="size-5 shrink-0"
                  />
                  <span class="min-w-0 flex-1">
                    <span class="block font-bold">{{ level.name }}</span>
                    <span class="block text-xs opacity-70">{{
                      level.note
                    }}</span>
                  </span>
                  <span
                    class="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase"
                    :class="
                      level.open
                        ? 'bg-warning text-warning-content'
                        : 'bg-base-300'
                    "
                    >{{ level.open ? 'Open' : 'Sealed' }}</span
                  >
                </li>
              </ol>
              <p v-if="store.discovered.length" class="text-xs opacity-70">
                Review outcomes on your record: {{ discoveredTitles }}
              </p>
            </section>
          </section>

          <section v-else-if="screen === 'hire'" class="flex flex-col gap-4">
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p
                  class="font-mono text-sm font-black uppercase tracking-widest"
                >
                  Choose your job title
                </p>
                <p class="text-sm opacity-70">
                  Six points of skill, one perk, and no guarantees. Checks roll
                  two dice plus a skill against 7, 9 or 11.
                </p>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="screen = 'front'"
              >
                <icon name="kind-icon:arrow-left" class="size-4" /> Back
              </button>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="job in JOB_TITLES"
                :key="job.id"
                type="button"
                class="desk-card flex flex-col gap-3 rounded-2xl border-2 border-stone-800 p-5 text-left text-stone-900 transition hover:-translate-y-1 focus-visible:-translate-y-1"
                @click="hire(job.id)"
              >
                <shifting-desks-art
                  class="rounded-xl border-2 border-stone-800"
                  :src="stationArt('jobs', job.id)"
                  :prompt="jobPrompt(job.id)"
                  :alt="`Portrait: ${job.title}`"
                  fallback-icon="kind-icon:user"
                  icon-size="3rem"
                />
                <span class="flex items-center gap-2">
                  <icon name="kind-icon:user" class="size-6" />
                  <span class="font-mono text-lg font-black uppercase">{{
                    job.title
                  }}</span>
                </span>
                <span class="text-sm">{{ job.tagline }}</span>
                <span class="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span
                    v-for="skill in SKILLS"
                    :key="skill"
                    class="flex items-center justify-between gap-2 text-xs"
                  >
                    <span class="capitalize">{{ skill }}</span>
                    <span
                      class="flex gap-0.5"
                      :aria-label="`${skill} ${job.skills[skill]}`"
                    >
                      <span
                        v-for="n in 3"
                        :key="n"
                        class="size-2.5 rounded-sm border border-stone-800"
                        :class="n <= job.skills[skill] ? 'bg-stone-800' : ''"
                      />
                    </span>
                  </span>
                </span>
                <span class="rounded-xl bg-stone-900/10 p-2 text-xs">
                  <strong>{{ job.perk }}:</strong> {{ job.perkText }}
                </span>
              </button>
            </div>
          </section>

          <section v-else-if="run && store.transition">
            <shifting-desks-elevator
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
                upcoming
                  ? stationArt('departments', upcoming.department.id)
                  : ''
              "
              :arrival-prompt="upcoming?.department.arrival_prompt ?? ''"
              @descend="descend"
            />
          </section>

          <section
            v-else-if="run && store.finished"
            class="flex flex-col gap-5"
          >
            <shifting-desks-personnel-file
              @again="screen = 'hire'"
              @front="toFront"
            />
            <details class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <summary
                class="cursor-pointer font-mono text-xs font-black uppercase tracking-widest"
              >
                Full personnel log ({{ run.log.length }} entries)
              </summary>
              <shifting-desks-journal class="mt-3" :entries="run.log" />
            </details>
          </section>

          <section v-else-if="run && view" class="flex flex-col gap-4">
            <div
              class="dept-banner flex flex-wrap items-center justify-between gap-2 rounded-2xl border-4 border-stone-800 px-4 py-2 text-stone-900"
            >
              <p class="font-mono text-sm font-black uppercase tracking-[.2em]">
                {{ floorFor(currentDept) }} · {{ currentDept.department.title }}
              </p>
              <p
                v-if="currentNotice"
                class="w-full text-xs font-semibold sm:order-last"
                :title="currentNotice.reason"
              >
                <span class="font-mono font-black uppercase"
                  >Restructured:</span
                >
                {{ currentNotice.headline }}. {{ currentNotice.reason }}
              </p>
              <p class="font-mono text-[11px] font-bold uppercase opacity-70">
                Department {{ currentDept.department.order }} of
                {{ DEPARTMENTS.length }}
              </p>
            </div>
            <shifting-desks-memo-ticker :lines="tickerLines" />
            <div
              class="flex flex-wrap items-center gap-2 text-xs font-bold uppercase"
            >
              <span
                v-for="(step, i) in steps"
                :key="i"
                class="rounded-md px-2 py-1"
                :class="
                  i < run.position
                    ? 'bg-base-300 line-through opacity-60'
                    : i === run.position
                      ? 'bg-warning text-warning-content'
                      : 'bg-base-200 opacity-60'
                "
                >{{ step }}</span
              >
              <span class="ml-auto font-mono normal-case opacity-70"
                >{{ employee }} · {{ jobTitle }}</span
              >
            </div>

            <shifting-desks-envelope />

            <div
              class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"
            >
              <div class="desk-flip mx-auto w-full max-w-sm lg:max-w-none">
                <div class="desk-flip-inner" :class="{ 'is-open': opened }">
                  <button
                    type="button"
                    class="desk-face desk-back flex flex-col items-center justify-center gap-4 rounded-2xl border-4 p-6"
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
                        view.kind === 'boss'
                          ? 'Department review'
                          : locationTitle
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
                    <div class="desk-plate relative">
                      <shifting-desks-art
                        :src="faceArt"
                        :prompt="view.card.art_prompt"
                        :alt="`Illustration: ${view.card.title}`"
                        :fallback-icon="cardIcon"
                        icon-size="6rem"
                      />
                      <span
                        class="absolute left-3 top-3 rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-50"
                        >{{
                          view.kind === 'boss'
                            ? 'Department review'
                            : locationTitle
                        }}</span
                      >
                    </div>
                    <div class="flex flex-col gap-2 p-4">
                      <p
                        ref="cardHeading"
                        tabindex="-1"
                        class="font-mono text-xl font-black uppercase"
                      >
                        {{ view.card.title }}
                      </p>
                      <p class="text-sm leading-relaxed">
                        {{ view.card.flavor_text }}
                      </p>
                    </div>
                  </article>
                </div>
              </div>

              <div class="flex min-w-0 flex-col gap-3">
                <template v-if="run.pending">
                  <article
                    class="relative flex flex-col gap-3 rounded-2xl border-2 p-5"
                    :class="
                      run.pending.success
                        ? 'border-success/60 bg-success/5'
                        : 'border-error/60 bg-error/5'
                    "
                    aria-live="polite"
                  >
                    <span
                      :key="`stamp-${store.rollSerial}`"
                      class="result-slam"
                      :class="run.pending.success ? 'is-approved' : 'is-denied'"
                      aria-hidden="true"
                      >{{ run.pending.success ? 'Approved' : 'Denied' }}</span
                    >
                    <p
                      class="font-mono text-xs font-black uppercase tracking-widest opacity-70"
                    >
                      You chose: {{ run.pending.choiceLabel }}
                    </p>
                    <div
                      v-if="run.pending.dice"
                      class="flex flex-wrap items-center gap-3"
                    >
                      <span
                        v-for="(d, i) in run.pending.dice"
                        :key="`${store.rollSerial}-${i}`"
                        class="desk-die flex size-12 items-center justify-center rounded-xl border-2 border-base-content bg-base-100 font-mono text-2xl font-black"
                        >{{ d }}</span
                      >
                      <span class="text-sm">
                        + {{ run.pending.skill }} {{ run.pending.skillValue
                        }}<template v-if="run.pending.boost">
                          + Form 2</template
                        >
                        =
                        <strong class="text-lg">{{ run.pending.total }}</strong>
                        vs {{ run.pending.target }}
                      </span>
                      <span
                        v-if="run.pending.rerolled"
                        class="text-xs line-through opacity-60"
                        >first roll {{ run.pending.rerolled.join(' + ') }}</span
                      >
                      <span
                        class="rounded-md px-2 py-1 text-xs font-black uppercase"
                        :class="
                          run.pending.success
                            ? 'bg-success text-success-content'
                            : 'bg-error text-error-content'
                        "
                        >{{ run.pending.success ? 'Approved' : 'Denied' }}</span
                      >
                    </div>
                    <p class="text-base leading-relaxed">
                      {{ run.pending.text }}
                    </p>
                    <shifting-desks-effect-chips
                      :effects="run.pending.effects"
                    />
                    <p
                      v-if="run.pending.aids.length"
                      class="text-xs font-bold uppercase opacity-70"
                    >
                      Helped by {{ run.pending.aids.join(', ') }}
                    </p>
                    <div
                      v-if="newSuccessor"
                      class="successor-card flex items-center gap-3 rounded-xl border-2 border-stone-800 p-3 text-stone-900"
                    >
                      <icon name="kind-icon:users" size="2rem" />
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
                      class="btn btn-warning self-start"
                      @click="next"
                    >
                      {{
                        run.status === 'playing'
                          ? 'Next file'
                          : 'See your record'
                      }}
                      <icon name="kind-icon:arrow-right" class="size-4" />
                    </button>
                  </article>
                </template>

                <template v-else-if="opened">
                  <shifting-desks-test-results
                    v-if="interim"
                    :readings="interim.revealed"
                    :sealed="interim.sealed"
                  />
                  <p
                    class="font-mono text-xs font-black uppercase tracking-widest opacity-70"
                  >
                    Every option costs something
                  </p>
                  <button
                    v-for="choice in view.card.choices"
                    :key="choice.id"
                    type="button"
                    class="flex flex-col gap-1.5 rounded-2xl border-2 bg-base-100 p-4 text-left transition"
                    :class="
                      lockFor(choice)
                        ? 'cursor-not-allowed border-base-300 opacity-55'
                        : 'border-base-300 hover:border-warning focus-visible:border-warning'
                    "
                    :aria-disabled="!!lockFor(choice)"
                    @click="pick(choice)"
                  >
                    <span class="font-bold">{{ choice.label }}</span>
                    <span class="text-sm opacity-80">{{ choice.intent }}</span>
                    <span class="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        v-if="choice.roll"
                        class="flex items-center gap-1 rounded-md bg-base-300 px-2 py-0.5 font-bold"
                      >
                        <icon name="kind-icon:dice" class="size-3.5" />
                        <span class="capitalize">{{ choice.roll.skill }}</span>
                        {{ run.skills[choice.roll.skill] }} ·
                        {{ DIFFICULTY[choice.roll.target] ?? '' }}
                        {{ choice.roll.target }}
                      </span>
                      <span
                        v-else
                        class="rounded-md bg-base-300 px-2 py-0.5 font-bold"
                        >Certain</span
                      >
                      <shifting-desks-effect-chips
                        v-if="hasCost(choice)"
                        :effects="choice.cost"
                        prefix="Cost"
                      />
                    </span>
                    <span class="text-xs italic opacity-70">{{
                      choice.risk_hint
                    }}</span>
                    <span
                      v-if="gradeBadge(choice)"
                      class="flex items-center gap-1 self-start rounded-md bg-stone-800 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-50"
                    >
                      <icon name="kind-icon:document" size="0.8rem" />
                      {{ gradeBadge(choice) }}
                    </span>
                    <span
                      v-if="aidBadges(choice).length"
                      class="flex flex-wrap gap-1.5 text-[11px] font-bold uppercase"
                    >
                      <span
                        v-for="badge in aidBadges(choice)"
                        :key="badge"
                        class="rounded-md bg-warning/20 px-2 py-0.5"
                        >{{ badge }}</span
                      >
                    </span>
                    <span
                      v-if="lockFor(choice)"
                      class="text-xs font-bold text-error"
                    >
                      <icon name="kind-icon:lock" class="size-3" />
                      {{ lockFor(choice) }}
                    </span>
                  </button>
                  <label
                    class="flex cursor-pointer items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
                  >
                    <input
                      v-model="spendForm"
                      type="checkbox"
                      class="checkbox checkbox-warning checkbox-sm"
                      :disabled="run.meters.forms < 1"
                    />
                    <span>
                      Attach a signed Form for <strong>+2</strong> to the roll
                      (costs 1 Form, rolls only). You have
                      {{ run.meters.forms }}.
                    </span>
                  </label>
                  <label
                    v-if="favorToggleShown"
                    class="flex cursor-pointer items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
                  >
                    <input
                      v-model="useFavor"
                      type="checkbox"
                      class="checkbox checkbox-error checkbox-sm"
                    />
                    <span>
                      Call in a favor, <strong>{{ society.favor.title }}</strong
                      >: {{ society.favor.text }} Once per run.
                    </span>
                  </label>
                  <label
                    v-if="mutationToggleShown"
                    class="flex cursor-pointer items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
                  >
                    <input
                      v-model="useMutation"
                      type="checkbox"
                      class="checkbox checkbox-success checkbox-sm"
                    />
                    <span>
                      Use your mutation, <strong>{{ mutation.title }}</strong
                      >:
                      {{ mutation.text }}
                      <template v-if="witnessed">
                        Someone is watching: +2 Suspicion.</template
                      >
                    </span>
                  </label>
                </template>

                <p
                  v-else
                  class="rounded-2xl border border-base-300 bg-base-200 p-5 text-sm opacity-80"
                >
                  A file has been placed on your desk. Open it when you are
                  ready. PAL is watching either way.
                </p>
              </div>
            </div>

            <details class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <summary
                class="cursor-pointer font-mono text-xs font-black uppercase tracking-widest"
              >
                Personnel file ({{ run.log.length }} entries)
              </summary>
              <shifting-desks-journal class="mt-3" :entries="run.log" />
            </details>
          </section>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
  mutationById,
  societyById,
  locationById,
  outcomeById,
  gradeRequirement,
  gradeTitle,
  interimResults,
  departmentBoard,
  restructuringById,
  restructuringFor,
  restructuringHeadline,
  stepLabels,
  type Choice,
  type Pack,
  type Meter,
} from '~/utils/shiftingDesks/rules'
import {
  memoLines,
  restructuringMemo,
  successorLine,
} from '~/utils/shiftingDesks/memos'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'

const store = useShiftingDesksStore()
const screen = ref<'front' | 'hire' | 'play'>('front')
const opened = ref(false)
const spendForm = ref(false)
const useFavor = ref(false)
const useMutation = ref(false)
const cardHeading = ref<HTMLElement | null>(null)
const nextButton = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)

const run = computed(() => store.run)
const view = computed(() => store.card)

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

const pillars = [
  {
    icon: 'kind-icon:alert-triangle',
    title: 'No clean wins',
    body: 'Every option has a price: your Composure, your Clearance, your record, your Forms, or a coworker. Choose the cost you can live with.',
  },
  {
    icon: 'kind-icon:mask',
    title: 'Everyone is a traitor',
    body: 'Secret societies whisper in the margins of surveys. Dale from Compliance is your friend. Probably. Report your suspicions.',
  },
  {
    icon: 'kind-icon:brain',
    title: 'Every room is a test',
    body: 'Inkblots, trust falls and forty-question happiness surveys. PAL is grading you. PAL is always grading you.',
  },
]

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
    note: 'A plush bear with a peace-of-mind module.',
    id: 'toy-division',
  },
  {
    floor: 'Level −3',
    name: 'Wellness & Testing: the Vault',
    note: 'The test is whether you will administer the test.',
    id: 'wellness',
  },
  {
    floor: 'Level −4',
    name: 'Sub-Level Zero: the Board',
    note: 'The executives live at the very bottom.',
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

const discoveredTitles = computed(() =>
  store.discovered
    .map((id) => outcomeById(id)?.title)
    .filter(Boolean)
    .join(', '),
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
  if (view.value?.kind !== 'encounter' || !run.value) return ''
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

const faceArt = computed(() =>
  view.value && run.value
    ? stationArt('cards', view.value.card.id, run.value.department)
    : '',
)

const currentLocation = computed(() =>
  view.value?.kind === 'encounter'
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

function hasCost(choice: Choice): boolean {
  return Object.keys(choice.cost).length > 0
}

function hire(jobId: string): void {
  store.start(jobId)
  opened.value = false
  spendForm.value = false
  screen.value = 'play'
}

async function openFile(): Promise<void> {
  opened.value = true
  await nextTick()
  cardHeading.value?.focus()
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
  spendForm.value = false
  await nextTick()
  nextButton.value?.focus()
}

function toTop(): void {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  scroller.value?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}

async function descend(): Promise<void> {
  store.descend()
  opened.value = false
  await nextTick()
  toTop()
}

async function next(): Promise<void> {
  store.advance()
  opened.value = false
  await nextTick()
  toTop()
}

function toFront(): void {
  screen.value = 'front'
}

watch(
  () => run.value?.position,
  () => {
    opened.value = false
  },
)

onMounted(() => {
  store.load()
})

useHead({ title: 'Shifting Desks' })
</script>

<style scoped>
.desk-poster,
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

.poster-figure {
  position: absolute;
  right: -2rem;
  bottom: -2rem;
  display: none;
}

@media (min-width: 1024px) {
  .poster-figure {
    display: block;
  }
}

.poster-folder {
  display: flex;
  width: 22rem;
  height: 18rem;
  align-items: center;
  justify-content: center;
  border: 6px solid #292524;
  border-radius: 1.5rem;
  background: #c2410c;
  transform: rotate(-8deg);
  box-shadow: 14px 14px 0 #292524;
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
    opacity: 0.9;
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
  perspective: 1400px;
}

.desk-flip-inner {
  position: relative;
  display: grid;
  transform-style: preserve-3d;
  transition: transform 560ms cubic-bezier(0.4, 0.1, 0.2, 1);
}

.desk-flip-inner.is-open {
  transform: rotateY(180deg);
}

.desk-face {
  grid-area: 1 / 1;
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
  min-height: 24rem;
  margin-top: 1.25rem;
  border-color: #292524;
  background: #c9a227;
  color: #292524;
  box-shadow: inset 0 0 0 10px rgb(41 37 36 / 0.08);
}

.desk-back::before {
  content: '';
  position: absolute;
  top: -1.6rem;
  left: 1.5rem;
  width: 40%;
  height: 1.6rem;
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
  margin-top: 1.25rem;
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
