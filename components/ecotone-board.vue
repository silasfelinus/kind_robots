<template>
  <div
    class="ecotone-board mx-auto flex min-h-0 w-full max-w-[1650px] flex-1 flex-col gap-2 px-2 pb-2 pt-1 sm:px-4"
  >
    <header
      class="kr-toolbar flex-nowrap justify-between gap-2 rounded-2xl border border-base-content/10 bg-base-100/95 px-2 py-1 shadow-md backdrop-blur sm:px-3"
    >
      <p
        class="flex min-w-0 flex-1 items-baseline gap-1.5 font-serif text-sm font-black max-sm:hidden sm:text-base"
      >
        <span class="shrink-0 text-success">Ecotone</span>
        <span
          v-if="game.run"
          class="truncate text-base-content/70 max-md:sr-only"
          >· {{ dayLabel }}</span
        >
        <span v-else class="truncate text-base-content/60 max-md:sr-only"
          >· Work in progress</span
        >
      </p>
      <nav
        class="flex shrink-0 gap-1 rounded-xl bg-base-200/80 p-1"
        role="tablist"
        aria-label="Ecotone views"
      >
        <button
          v-for="item in tabs"
          :key="item.value"
          type="button"
          role="tab"
          class="flex items-center justify-center gap-1 rounded-xl px-1.5 py-1 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:px-3"
          :class="
            tab === item.value
              ? 'bg-primary text-primary-content shadow'
              : 'opacity-75 hover:bg-base-200'
          "
          :aria-selected="tab === item.value"
          :aria-label="item.label"
          @click="tab = item.value"
        >
          <Icon :name="item.icon" class="size-4" />
          <span class="max-lg:sr-only">{{ item.label }}</span>
          <span
            v-if="item.value === 'endings'"
            class="text-xs font-black opacity-80"
            >{{ game.unlockedCount }}/{{ game.endingTotal }}</span
          >
        </button>
      </nav>
      <div class="flex shrink-0 items-center gap-1.5">
        <template v-if="game.run">
          <span
            class="inline-flex h-8 items-center gap-1 rounded-full border border-base-content/15 bg-base-200 px-2 text-xs font-black"
            :title="`Nerve ${game.run.nerve} of ${MAX_METER}`"
            :aria-label="`Nerve ${game.run.nerve} of ${MAX_METER}`"
          >
            <Icon name="kind-icon:heart" class="size-3.5 text-error" />
            {{ game.run.nerve }}
          </span>
          <span
            class="inline-flex h-8 items-center gap-1 rounded-full border border-base-content/15 bg-base-200 px-2 text-xs font-black max-sm:hidden"
            :title="`Clarity ${game.run.clarity}`"
            :aria-label="`Clarity ${game.run.clarity}`"
          >
            <Icon name="kind-icon:eye" class="size-3.5 text-info" />
            {{ game.run.clarity }}
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            aria-label="Start a new weekend"
            title="Start a new weekend"
            @click="restart"
          >
            <Icon name="kind-icon:refresh" class="size-4" />
          </button>
        </template>
      </div>
    </header>

    <section
      class="@container relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-base-content/10 bg-[#0b1d1f] text-[#eef3ec] shadow-xl"
    >
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
          class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 lg:bg-gradient-to-r lg:from-black/90 lg:via-black/60 lg:to-transparent"
        />
        <div
          class="relative flex h-full min-h-0 flex-col gap-3 p-4 sm:p-6 lg:w-[min(640px,56%)] lg:p-8"
        >
          <div class="shrink-0">
            <p class="text-xs font-bold uppercase tracking-[.3em] text-success">
              Weird Humboldt · Work in progress
            </p>
            <h2
              class="mt-1 font-serif text-4xl font-black leading-none drop-shadow sm:text-6xl"
            >
              Ecotone
            </h2>
            <p class="mt-2 max-w-md text-sm text-white/85 sm:text-base">
              A festival, a race and the strange days after in Humboldt County.
              Four strangers worth following, or nobody at all. Futures for the
              county bleeding through the fog.
            </p>
          </div>
          <div class="flex min-h-0 flex-1 flex-col gap-2">
            <p
              class="shrink-0 text-xs font-bold uppercase tracking-widest text-white/70"
            >
              Who are you this weekend?
            </p>
            <div class="kr-scroll -mx-1 px-1">
              <div class="grid gap-2 @xl:grid-cols-2">
                <button
                  v-for="background in ARCHETYPES"
                  :key="background.id"
                  type="button"
                  class="rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-success"
                  :class="
                    picked === background.id
                      ? 'border-success bg-success/20'
                      : 'border-white/15 bg-black/35 hover:border-white/40'
                  "
                  :aria-pressed="picked === background.id"
                  @click="picked = background.id"
                >
                  <span class="block text-sm font-black">{{
                    background.name
                  }}</span>
                  <span class="mt-0.5 block text-xs text-white/70">{{
                    background.vantage
                  }}</span>
                  <span class="mt-2 flex flex-wrap gap-1">
                    <span
                      v-for="skill in SKILLS"
                      :key="skill.id"
                      class="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold"
                      :class="background.skills[skill.id] ? '' : 'opacity-40'"
                      >{{ skill.label }} {{ background.skills[skill.id] }}</span
                    >
                  </span>
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-success shrink-0 sm:btn-lg"
            :disabled="!picked || !game.loaded"
            @click="start"
          >
            <Icon name="kind-icon:pine" class="size-5" />
            Begin
          </button>
        </div>
      </div>

      <div
        v-else-if="tab === 'road' && game.run"
        class="grid h-full min-h-0 grid-rows-[minmax(120px,32%)_minmax(0,1fr)] sm:grid-rows-[minmax(150px,40%)_minmax(0,1fr)] @4xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,1fr)] @4xl:grid-rows-1"
      >
        <div class="relative min-h-0 overflow-hidden">
          <EcotoneScene
            :kind="stage.scene"
            :art="stage.art"
            :label="stage.alt"
            :portrait="stage.portrait"
            class="absolute inset-0"
          />
          <div
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-5"
          >
            <p
              class="text-[11px] font-bold uppercase tracking-[.25em] text-success"
            >
              {{ stage.eyebrow }}
            </p>
            <h2
              class="font-serif text-2xl font-black leading-tight sm:text-4xl"
            >
              {{ stage.title }}
            </h2>
          </div>
          <div
            v-if="stage.emblem"
            class="absolute right-3 top-3 flex items-center gap-2"
          >
            <EcotoneEmblem
              v-for="emblem in stage.emblem"
              :id="emblem.id"
              :key="emblem.id"
              :name="emblem.name"
              class="size-12 drop-shadow-lg sm:size-16"
            />
          </div>
        </div>

        <div
          class="flex min-h-0 flex-col gap-2 border-t border-white/10 bg-[#0f2426]/95 p-3 sm:p-4 @4xl:border-l @4xl:border-t-0"
        >
          <div
            v-if="pending"
            class="kr-scroll flex flex-col gap-3"
            aria-live="polite"
          >
            <p
              class="text-xs font-bold uppercase tracking-widest text-white/60"
            >
              {{ pending.choice }}
            </p>
            <div
              v-if="pending.roll"
              class="flex flex-wrap items-center gap-3 rounded-2xl border p-3"
              :class="
                pending.roll.success
                  ? 'border-success/60 bg-success/10'
                  : 'border-warning/60 bg-warning/10'
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
                    :class="PIPS[die]?.includes(cell) ? 'bg-[#1b1b1b]' : ''"
                  />
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-lg font-black">
                  {{ pending.roll.dice[0] + pending.roll.dice[1] }}
                  <span v-if="pending.roll.bonus" class="text-white/70"
                    >{{ pending.roll.bonus > 0 ? '+' : '−'
                    }}{{ Math.abs(pending.roll.bonus) }}</span
                  >
                  = {{ pending.roll.total }}
                  <span class="text-white/70"
                    >vs {{ pending.roll.target }}</span
                  >
                </p>
                <p class="text-xs text-white/70">
                  {{ rollParts(pending.roll) }}
                </p>
              </div>
              <span
                class="badge font-black"
                :class="
                  pending.roll.success ? 'badge-success' : 'badge-warning'
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
            <p class="font-serif text-base leading-relaxed sm:text-lg">
              {{ pending.text }}
            </p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="chip in effectChips(pending.effects)"
                :key="chip"
                class="badge badge-outline border-white/25 text-white/85"
                >{{ chip }}</span
              >
            </div>
            <button
              ref="continueButton"
              type="button"
              class="btn btn-success mt-auto"
              @click="game.proceed()"
            >
              Continue
              <Icon name="kind-icon:arrow-right" class="size-4" />
            </button>
          </div>

          <div
            v-else-if="game.run.phase === 'end' && game.ending"
            class="kr-scroll flex flex-col gap-3"
          >
            <div class="flex items-center gap-2">
              <span
                class="size-4 shrink-0 rounded-full"
                :class="
                  game.ending.fate === 'hope'
                    ? 'ecotone-fate-hope'
                    : 'ecotone-fate-dark'
                "
              />
              <p
                class="text-xs font-bold uppercase tracking-widest text-white/70"
              >
                {{ game.ending.fate === 'hope' ? 'Hopeful' : 'Dark' }} future ·
                {{ leadName(game.ending.lead) }} ·
                {{ lensLabel(game.ending.lens) }}
              </p>
            </div>
            <p v-if="signature" class="text-sm italic text-white/80">
              {{ signature.line }}
            </p>
            <p
              v-for="(paragraph, index) in FUTURES[game.ending.lead][
                game.ending.fate
              ]"
              :key="index"
              class="font-serif text-base leading-relaxed sm:text-lg"
            >
              {{ paragraph }}
            </p>
            <p
              v-if="LENS_CODAS[game.ending.lens]"
              class="rounded-xl border-l-4 border-success bg-success/10 px-3 py-2 text-sm italic"
            >
              {{ LENS_CODAS[game.ending.lens] }}
            </p>
            <div class="rounded-2xl bg-black/30 p-3">
              <p
                class="text-xs font-bold uppercase tracking-widest text-white/60"
              >
                What decided it: {{ game.ending.score }} of
                {{ game.ending.target }} needed
              </p>
              <p class="mt-1 text-sm text-white/85">
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
            <p class="text-xs text-white/60">
              Ending earned and added to your gallery. These finales are first
              drafts; the full one-, ten- and thirty-year epilogues are still
              being written.
            </p>
            <div class="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-success flex-1"
                @click="restart"
              >
                Start another weekend
              </button>
              <button
                type="button"
                class="btn btn-outline flex-1 border-white/30 text-white"
                @click="tab = 'endings'"
              >
                See your endings
              </button>
            </div>
          </div>

          <div v-else class="flex min-h-0 flex-1 flex-col gap-2">
            <div class="kr-scroll flex min-h-16 flex-col gap-3">
              <p
                v-for="(paragraph, index) in stage.body"
                :key="index"
                class="font-serif text-[15px] leading-relaxed sm:text-base"
              >
                {{ paragraph }}
              </p>
              <p
                v-if="stage.lensLine"
                class="rounded-xl border-l-4 border-success bg-success/10 px-3 py-2 text-sm italic"
              >
                {{ stage.lensLine }}
              </p>
              <p
                v-for="(aside, index) in stage.asides"
                :key="`aside-${index}`"
                class="rounded-xl border-l-4 border-warning bg-warning/10 px-3 py-2 text-sm"
              >
                {{ aside }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col gap-1.5 sm:gap-2">
              <button
                v-for="option in options"
                :key="option.id"
                type="button"
                class="ecotone-choice group rounded-2xl border border-white/15 bg-black/30 px-3 py-2 text-left sm:py-2.5 transition hover:border-success hover:bg-success/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-success disabled:opacity-40"
                :disabled="option.disabled"
                @click="option.act()"
              >
                <span class="flex items-start justify-between gap-2">
                  <span class="flex min-w-0 items-center gap-2">
                    <span
                      v-if="option.thumb"
                      class="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg max-sm:hidden"
                    >
                      <EcotoneScene
                        :kind="option.thumb.scene"
                        :art="option.thumb.art"
                        :label="option.label"
                        class="absolute inset-0"
                      />
                    </span>
                    <span class="text-sm font-black sm:text-base">{{
                      option.label
                    }}</span>
                  </span>
                  <span
                    v-if="option.chip"
                    class="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-black"
                    :title="option.chipTitle"
                    >{{ option.chip }}</span
                  >
                </span>
                <span
                  v-if="option.hint"
                  class="mt-0.5 block text-xs text-white/65 max-sm:hidden"
                  >{{ option.hint }}</span
                >
              </button>
            </div>
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
                ? 'border-success bg-success/10'
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
                  class="text-[11px] font-bold uppercase tracking-wider text-success"
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
            You: {{ archetype.name }}
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
            Perk (arrives with the full engine): {{ archetype.perk }}
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
                ? 'border-success bg-success/10'
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
                  class="text-[11px] font-bold uppercase tracking-wider text-success"
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
                <h3 class="text-sm font-black">Opening lens</h3>
                <p class="text-sm text-white/85">
                  {{
                    game.run.openingState
                      ? lensLabel(game.run.openingState)
                      : 'Not chosen yet'
                  }}
                  · Clarity {{ game.run.clarity }} · Weird exposure
                  {{ game.run.weird }}/{{ MAX_METER }}
                </p>
              </section>
            </div>
          </div>
        </template>
      </div>

      <div v-else class="kr-scroll h-full p-3 sm:p-5">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 class="font-serif text-2xl font-black">
              Endings {{ game.unlockedCount }}/{{ game.endingTotal }}
            </h2>
            <p class="text-sm text-white/70">
              Who you finish with (or nobody) × your opening lens × the future
              your stats earned: 35 hopeful, 35 dark. Each unlocks when you earn
              it in play.
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
                v-if="row.id !== 'alone'"
                :id="row.id"
                :name="row.name"
                class="size-9"
              />
              <span
                v-else
                class="grid size-9 place-items-center rounded-full border border-white/20 bg-black/40"
              >
                <Icon name="kind-icon:user" class="size-5 text-white/70" />
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
                    ? 'border-success bg-success/20'
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
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useEcotoneStore } from '~/stores/ecotoneStore'
import {
  ARCHETYPES,
  CHAPTERS,
  COMPANIONS,
  CROSSROADS,
  ENDING_LENSES,
  LENSES,
  SKILLS,
  artUrl,
  type Check,
  type CompanionId,
  type Effects,
  type LeadId,
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

type Tab = 'road' | 'guides' | 'county' | 'journal' | 'endings'

const game = useEcotoneStore()
const tab = ref<Tab>('road')
const picked = ref<string>('reporter')
const continueButton = ref<HTMLButtonElement | null>(null)

const tabs: { value: Tab; label: string; icon: string }[] = [
  { value: 'road', label: 'Road', icon: 'kind-icon:map-pin' },
  { value: 'guides', label: 'Guides', icon: 'kind-icon:users' },
  { value: 'county', label: 'County', icon: 'kind-icon:map' },
  { value: 'journal', label: 'Journal', icon: 'kind-icon:book-open' },
  { value: 'endings', label: 'Endings', icon: 'kind-icon:trophy' },
]

const PIPS: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

onMounted(() => game.initialize())

const pending = computed(() => game.run?.pending?.entry ?? null)

watch(pending, async (value) => {
  if (!value) return
  await nextTick()
  continueButton.value?.focus()
})

const eventInfo = computed(() => EVENTS.find((e) => e.id === game.run?.event))
const dayLabel = computed(() => {
  const run = game.run
  if (!run || !eventInfo.value) return 'Choosing a road'
  return `Day ${run.day}, ${dayName(run)} · ${eventInfo.value.name}`
})
const signature = computed(() => {
  const ending = game.ending
  return ending
    ? (SIGNATURES[`${ending.lead}.${ending.lens}`]?.[ending.fate] ?? null)
    : null
})
const archetype = computed(() =>
  ARCHETYPES.find((a) => a.id === game.run?.archetype),
)

function start() {
  if (!picked.value) return
  game.begin(picked.value)
  tab.value = 'road'
}

function restart() {
  game.abandon()
  tab.value = 'road'
}

function companionName(id: CompanionId) {
  return COMPANIONS.find((c) => c.id === id)?.name ?? id
}

function leadName(id: LeadId) {
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
  if (game.lead?.id === id) return 'Your guide'
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
  art?: string
  alt: string
  eyebrow: string
  title: string
  body: string[]
  lensLine: string
  asides: string[]
  portrait: boolean
  emblem: null | { id: CompanionId; name: string }[]
}

const stage = computed<Stage>(() => {
  const run = game.run
  const leadEmblem = game.lead
    ? [{ id: game.lead.id, name: game.lead.name }]
    : null
  const fallback: Stage = {
    scene: EVENT_CHOICE.scene,
    art: EVENT_CHOICE.art,
    alt: 'Two flyers on a telephone pole on the Arcata Plaza',
    eyebrow: EVENT_CHOICE.place,
    title: EVENT_CHOICE.title,
    body: EVENT_CHOICE.body,
    lensLine: '',
    asides: [],
    portrait: false,
    emblem: null,
  }
  if (!run || run.phase === 'event') return fallback
  if (run.phase === 'crossroads' && game.newcomer) {
    const n = game.newcomer
    const emblem = [{ id: n.id, name: n.name }]
    if (game.lead) emblem.unshift({ id: game.lead.id, name: game.lead.name })
    return {
      ...fallback,
      scene: 'bay',
      art: n.art,
      alt: `${n.name}, ${n.role}`,
      portrait: true,
      eyebrow: `Crossroads · ${dayName(run)}`,
      title: `${n.name} crosses your path`,
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
      eyebrow: `Day ${run.day}, ${dayName(run)} · Where to?`,
      title: step?.kind === 'fork' ? step.title : 'Where to?',
      body: [FORK_PROMPT],
      emblem: leadEmblem,
    }
  }
  if (run.phase === 'end') {
    return {
      ...fallback,
      scene: 'dunes',
      art: 'chapters/the-impossible-festival',
      alt: 'Kinetic sculptures racing across the dunes under two skies',
      eyebrow: 'The Humboldt of your future',
      title: signature.value?.title ?? 'What comes next',
      body: [],
      emblem: leadEmblem,
    }
  }
  const card = game.card
  if (run.phase === 'beat' && card) {
    const portrait = card.choices.some((choice) => choice.meet !== undefined)
    const prospect = game.prospect
    return {
      scene: card.scene,
      art: portrait && prospect ? prospect.art : card.art,
      alt:
        portrait && prospect
          ? `${prospect.name}, ${prospect.role}`
          : card.title,
      eyebrow:
        card.kind === 'spine'
          ? `Day ${run.day}, ${dayName(run)} · ${card.place}`
          : `${card.id} · ${card.place}`,
      title: card.title,
      body: cardBody(card, run).map((paragraph) => fillText(paragraph, run)),
      lensLine: run.openingState
        ? (card.lensLines?.[run.openingState] ?? '')
        : '',
      asides: cardAsides(card, run),
      portrait,
      emblem:
        portrait && prospect
          ? [{ id: prospect.id, name: prospect.name }]
          : leadEmblem,
    }
  }
  return fallback
})

type Option = {
  id: string
  label: string
  hint?: string
  chip?: string
  chipTitle?: string
  disabled?: boolean
  thumb?: { scene: SceneKind; art?: string }
  act: () => void
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
      chipTitle: `Meet ${event.companions.map(companionName).join(' or ')}`,
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
      thumb: { scene: card.scene, art: card.art },
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
        act: () => game.crossroads(true),
      },
    ]
  }
  const card = game.card
  if (run.phase === 'beat' && card) {
    return card.choices.map((choice) => {
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
      const chip = choice.check
        ? checkChip(choice.check)
        : { chip: 'No roll', title: 'A sure thing' }
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
        hint,
        chip: chip.chip,
        chipTitle: chip.title,
        act: () => game.choose(choice.id),
      }
    })
  }
  return []
})

const endingRows = computed(() => [
  ...COMPANIONS.map((c) => ({ id: c.id as LeadId, name: c.name })),
  { id: 'alone' as LeadId, name: 'Alone' },
])

function slotsFor(id: LeadId) {
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
  const url = artUrl('ui/card-back')
  return url
    ? {
        backgroundImage: `linear-gradient(rgb(11 29 31 / 0.55), rgb(11 29 31 / 0.55)), url(${url})`,
      }
    : undefined
})

function endingsFor(id: LeadId) {
  return game.endings.filter((key) => key.startsWith(`${id}.`)).length
}
</script>

<style scoped>
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
