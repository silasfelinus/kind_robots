<template>
  <dialog ref="sheet" class="modal" aria-labelledby="personnel-archive-heading">
    <div
      class="modal-box flex max-h-[94dvh] w-[min(96vw,74rem)] max-w-none flex-col gap-3 bg-base-100 p-3 sm:p-5"
    >
      <header class="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p
            class="font-mono text-[10px] font-black uppercase tracking-[.3em] text-warning"
          >
            Consolidated Wellness &amp; Defense
          </p>
          <h2
            id="personnel-archive-heading"
            class="font-mono text-lg font-black uppercase sm:text-2xl"
          >
            Personnel Archive
          </h2>
          <p class="text-xs opacity-70">
            Every achievement is recorded. Especially the ones HR denies.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm shrink-0"
          @click="close"
        >
          Close
        </button>
      </header>

      <div
        v-if="!store.archiveUnlocked"
        class="rounded-lg border-2 border-dashed border-base-content/30 p-5 text-sm"
        role="status"
      >
        SEALED · Complete a run to open your permanent personnel file.
      </div>
      <template v-else>
        <div class="grid shrink-0 grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-base-200 p-2">
            <p class="font-mono text-xl font-black">
              {{ earnedCount }}/{{ MILESTONES.length }}
            </p>
            <p class="text-[10px] font-bold uppercase">Milestones</p>
          </div>
          <div class="rounded-lg bg-base-200 p-2">
            <p class="font-mono text-xl font-black">
              {{ foundCount }}/{{ ENDINGS.length }}
            </p>
            <p class="text-[10px] font-bold uppercase">Endings</p>
          </div>
          <div class="rounded-lg bg-base-200 p-2">
            <p class="font-mono text-xl font-black">
              {{ archive.runs.length }}
            </p>
            <p class="text-[10px] font-bold uppercase">Runs on file</p>
          </div>
        </div>
        <div
          class="flex shrink-0 gap-1 overflow-x-auto rounded-xl bg-base-200 p-1"
          role="tablist"
          aria-label="Archive collections"
        >
          <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            role="tab"
            :aria-selected="tab === section.id"
            class="min-w-fit flex-1 rounded-lg px-2 py-2 font-mono text-xs font-bold uppercase sm:text-sm"
            :class="
              tab === section.id
                ? 'bg-base-content text-base-100'
                : 'hover:bg-base-300'
            "
            @click="selectTab(section.id)"
          >
            {{ section.label }}
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1">
          <section
            v-if="tab === 'milestones'"
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2"
            :aria-label="'Milestone progress'"
          >
            <article
              v-for="milestone in MILESTONES"
              :key="milestone.id"
              class="relative flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center"
              :class="
                earned(milestone.id)
                  ? 'border-warning bg-warning/15'
                  : 'border-base-content/20 bg-base-200/65'
              "
            >
              <div
                class="relative grid size-16 place-items-center rounded-full border-4"
                :class="
                  earned(milestone.id)
                    ? 'border-warning bg-base-100 shadow-lg'
                    : 'border-dashed border-base-content/30 bg-base-300/60'
                "
              >
                <icon
                  :name="
                    earned(milestone.id) ? milestone.icon : 'kind-icon:lock'
                  "
                  class="size-7"
                />
              </div>
              <p class="font-mono text-xs font-black uppercase leading-tight">
                {{ milestone.title }}
              </p>
              <p class="text-[11px] leading-snug opacity-80">
                {{ milestone.detail }}
              </p>
              <p class="mt-auto font-mono text-[10px] font-bold uppercase">
                {{
                  earned(milestone.id)
                    ? 'Earned · ' + dateLabel(archive.milestones[milestone.id])
                    : progress(milestone) +
                      '/' +
                      milestone.target +
                      ' · In progress'
                }}
              </p>
              <div
                v-if="!earned(milestone.id)"
                class="h-1.5 w-full overflow-hidden rounded-full bg-base-content/20"
                :aria-label="`${progress(milestone)} of ${milestone.target}`"
              >
                <div
                  class="h-full bg-warning"
                  :style="{
                    width: `${Math.min(100, (progress(milestone) / milestone.target) * 100)}%`,
                  }"
                />
              </div>
              <span
                v-else
                class="absolute right-2 top-2 rotate-6 rounded border border-warning px-1 font-mono text-[9px] font-black uppercase text-warning"
                >Filed</span
              >
            </article>
          </section>

          <section
            v-else-if="tab === 'achievements'"
            class="flex flex-col gap-4"
            aria-label="Shifting Desks achievement cabinet"
          >
            <header
              class="rounded-xl border-2 border-warning/40 bg-base-200 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3
                    class="font-mono text-base font-black uppercase sm:text-xl"
                  >
                    Cabinet of Distinctions
                  </h3>
                  <p class="text-xs opacity-80">
                    {{ filedBadgeCount }}/{{ badgeMilestones.length }} personnel
                    stamps · {{ syncedAwardCount }}/{{ accountBadges.length }}
                    account medals
                  </p>
                </div>
                <icon name="kind-icon:trophy" class="size-10 text-warning" />
              </div>
              <p class="mt-2 text-xs">
                Your personnel stamps live in this browser. Kind Robots medals
                are separate account records. Neither is awarded by opening this
                cabinet.
              </p>
            </header>

            <div>
              <h4
                class="mb-2 font-mono text-xs font-black uppercase tracking-widest"
              >
                Personnel Stamp Collection
              </h4>
              <div
                class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3"
              >
                <article
                  v-for="milestone in badgeMilestones"
                  :key="milestone.id"
                  class="relative flex flex-col gap-2 overflow-hidden rounded-xl border-2 p-3"
                  :class="
                    filed(milestone.id)
                      ? milestone.id === 'employee-of-the-month'
                        ? 'border-warning bg-gradient-to-br from-warning/35 via-base-100 to-accent/20'
                        : 'border-warning/70 bg-base-100'
                      : 'border-dashed border-base-content/25 bg-base-200/60'
                  "
                >
                  <div
                    class="relative mx-auto grid aspect-[4/3] w-full max-w-48 place-items-center overflow-hidden rounded-lg border-4"
                    :class="
                      filed(milestone.id)
                        ? 'border-warning/70 bg-base-100'
                        : 'border-base-content/20 bg-base-300'
                    "
                  >
                    <shifting-desks-art
                      v-if="
                        filed(milestone.id) &&
                        milestone.id === 'employee-of-the-month'
                      "
                      frame="h-full w-full"
                      :src="stationArt('endings', 'employee-of-the-month')"
                      :prompt="employeeEnding?.epilogue.art_prompt ?? ''"
                      :show-brief="false"
                      :alt="employeeEnding?.title ?? 'Employee of the Month'"
                      fallback-icon="kind-icon:trophy"
                    />
                    <icon
                      v-else
                      :name="
                        filed(milestone.id) ? milestone.icon : 'kind-icon:lock'
                      "
                      class="size-12"
                      :class="
                        filed(milestone.id)
                          ? 'text-warning'
                          : 'text-base-content/30'
                      "
                    />
                    <span
                      v-if="!filed(milestone.id)"
                      class="absolute inset-0 grid place-items-center bg-base-content/15 font-mono text-[10px] font-black uppercase tracking-widest"
                      >Classified</span
                    >
                  </div>
                  <h5 class="font-mono text-xs font-black uppercase">
                    {{ milestone.title }}
                  </h5>
                  <p class="text-xs opacity-80">{{ milestone.detail }}</p>
                  <p class="mt-auto font-mono text-[10px] font-bold uppercase">
                    {{
                      filed(milestone.id)
                        ? 'Earned · ' +
                          dateLabel(archive.milestones[milestone.id])
                        : progress(milestone) +
                          '/' +
                          milestone.target +
                          ' · Unfiled'
                    }}
                  </p>
                  <div
                    v-if="!filed(milestone.id)"
                    class="h-2 w-full overflow-hidden rounded-full bg-base-content/20"
                    :aria-label="`${progress(milestone)} of ${milestone.target}`"
                  >
                    <div
                      class="h-full bg-warning"
                      :style="{
                        width: `${(100 * progress(milestone)) / milestone.target}%`,
                      }"
                    />
                  </div>
                  <span
                    v-else-if="milestone.id === 'employee-of-the-month'"
                    class="absolute right-1 top-1 rounded bg-warning px-2 py-1 font-mono text-[9px] font-black uppercase text-warning-content"
                    >Rare foil</span
                  >
                </article>
              </div>
            </div>

            <div>
              <h4
                class="mb-2 font-mono text-xs font-black uppercase tracking-widest"
              >
                Kind Robots Account Medals
              </h4>
              <div
                class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3"
              >
                <article
                  v-for="medal in accountBadges"
                  :key="medal.code"
                  class="flex flex-col gap-2 rounded-xl border-2 p-3"
                  :class="
                    medal.earned
                      ? 'border-warning bg-warning/10'
                      : 'border-base-content/20 bg-base-200/65'
                  "
                >
                  <div
                    class="relative mx-auto grid aspect-[4/3] w-full max-w-48 place-items-center overflow-hidden rounded-lg border-4"
                    :class="
                      medal.earned ? 'border-warning' : 'border-base-content/20'
                    "
                  >
                    <img
                      v-if="medal.earned && medal.imagePath"
                      :src="medal.imagePath"
                      :alt="medal.label"
                      class="h-full w-full object-cover"
                    />
                    <icon
                      v-else
                      :name="medal.earned ? medal.icon : 'kind-icon:lock'"
                      class="size-12"
                      :class="
                        medal.earned ? 'text-warning' : 'text-base-content/30'
                      "
                    />
                  </div>
                  <p
                    class="font-mono text-[10px] font-bold uppercase opacity-60"
                  >
                    Kind Robots · Tier {{ medal.tier }}
                  </p>
                  <h5 class="font-mono text-xs font-black uppercase">
                    {{ medal.label }}
                  </h5>
                  <p class="text-xs opacity-80">{{ medal.hint }}</p>
                  <p class="mt-auto font-mono text-[10px] font-bold uppercase">
                    {{ medal.status }}
                  </p>
                </article>
              </div>
              <p class="mt-2 text-[11px] opacity-70">
                Account medals come from the achievement registry and recorded
                user awards. Missing catalog data never counts as a locked or
                earned award.
              </p>
            </div>

            <div v-if="replayTargets.length" class="rounded-xl bg-base-200 p-3">
              <h4 class="font-mono text-xs font-black uppercase">
                Next Personnel Objectives
              </h4>
              <ul class="mt-2 space-y-2">
                <li
                  v-for="target in replayTargets"
                  :key="target.id"
                  class="text-xs"
                >
                  <strong>{{ target.title }}</strong>
                  · {{ progress(target) }}/{{ target.target }} ·
                  {{ target.detail }}
                </li>
              </ul>
              <button
                type="button"
                class="btn btn-warning btn-sm mt-3"
                @click="replay"
              >
                Start another review
              </button>
            </div>
          </section>

          <section
            v-else-if="tab === 'endings'"
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2"
            aria-label="Ending collection"
          >
            <article
              v-for="ending in ENDINGS"
              :key="ending.id"
              class="overflow-hidden rounded-xl border-2"
              :class="
                hasEnding(ending.id)
                  ? 'border-warning'
                  : 'border-base-content/20'
              "
            >
              <div class="relative overflow-hidden">
                <shifting-desks-art
                  frame="aspect-[3/4]"
                  :src="stationArt('endings', ending.id)"
                  :prompt="
                    hasEnding(ending.id) ? ending.epilogue.art_prompt : ''
                  "
                  :show-brief="false"
                  :alt="hasEnding(ending.id) ? ending.title : ''"
                  fallback-icon="kind-icon:folder"
                />
                <div
                  v-if="!hasEnding(ending.id)"
                  class="absolute inset-0 grid place-items-center bg-base-content/85"
                  aria-hidden="true"
                >
                  <icon name="kind-icon:lock" class="size-9 text-base-100" />
                </div>
              </div>
              <div class="p-2">
                <p class="font-mono text-xs font-black uppercase">
                  {{
                    hasEnding(ending.id) ? ending.title : 'Classified ending'
                  }}
                </p>
                <p class="text-xs opacity-70">
                  {{
                    hasEnding(ending.id)
                      ? ending.epilogue.title
                      : 'Play again to declassify this file.'
                  }}
                </p>
              </div>
            </article>
          </section>

          <section
            v-else
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] gap-2"
            aria-label="Completed run dossiers"
          >
            <p
              v-if="archive.runs.length === 0"
              class="rounded-xl bg-base-200 p-4 text-sm"
            >
              Earlier endings are recorded, but their full personnel files were
              not retained. New completions will appear here.
            </p>
            <article
              v-for="receipt in [...archive.runs].reverse()"
              :key="receipt.id"
              class="flex gap-3 rounded-xl border-2 border-base-content/20 bg-base-200 p-3"
            >
              <shifting-desks-art
                class="w-24 shrink-0 self-start overflow-hidden rounded-lg"
                frame="aspect-[2/3]"
                :src="stationArt('endings', receipt.endingId)"
                :alt="endingTitle(receipt.endingId)"
                fallback-icon="kind-icon:folder"
                :show-brief="false"
              />
              <div class="min-w-0 text-sm">
                <p class="font-mono text-xs font-black uppercase">
                  {{ endingTitle(receipt.endingId) }}
                </p>
                <p class="text-xs opacity-70">
                  {{ dateLabel(receipt.completedAt) }} · {{ receipt.jobTitle }}
                </p>
                <p class="mt-1 text-xs">
                  {{ receipt.floors }} departments · {{ receipt.files }} files ·
                  {{ receipt.employees }} employees
                </p>
                <p class="mt-1 text-xs">
                  Society: {{ receipt.society }} · Mutation:
                  {{ receipt.mutation }}
                </p>
                <p class="mt-1 text-xs font-bold">
                  Test results: {{ receipt.grades.empathy }} empathy /
                  {{ receipt.grades.ingenuity }} ingenuity /
                  {{ receipt.grades.obedience }} obedience /
                  {{ receipt.grades.spite }} spite
                </p>
              </div>
            </article>
          </section>
        </div>
      </template>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit">Close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAchievementStore } from '~/stores/achievementStore'
import { useUserStore } from '~/stores/userStore'
import { achievementsForGame } from '~/utils/achievements/gameAchievements'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'
import { ENDINGS, stationArt } from '~/utils/shiftingDesks/rules'
import { MILESTONES, type Milestone } from '~/utils/shiftingDesks/rewards'

type ArchiveTab = 'milestones' | 'endings' | 'achievements' | 'runs'
const sections: Array<{ id: ArchiveTab; label: string }> = [
  { id: 'milestones', label: 'Milestones' },
  { id: 'endings', label: 'Endings' },
  { id: 'achievements', label: 'Distinctions' },
  { id: 'runs', label: 'Runs' },
]
const store = useShiftingDesksStore()
const achievementStore = useAchievementStore()
const userStore = useUserStore()
const achievementDefinitions = achievementsForGame('shifting-desks')
const employeeEnding = ENDINGS.find(
  (entry) => entry.id === 'employee-of-the-month',
)
const archive = computed(() => store.rewardArchive)
const sheet = ref<HTMLDialogElement | null>(null)
const tab = ref<ArchiveTab>('milestones')
const earnedCount = computed(
  () => MILESTONES.filter((m) => earned(m.id)).length,
)
const foundCount = computed(
  () => ENDINGS.filter((ending) => hasEnding(ending.id)).length,
)
const badgeMilestones = MILESTONES.filter((milestone) => milestone.badge)
const filed = (id: string) => !!archive.value.milestones[id]
const filedBadgeCount = computed(
  () => badgeMilestones.filter((m) => filed(m.id)).length,
)
const accountBadges = computed(() =>
  achievementDefinitions.map((definition) => {
    const catalog = achievementStore.achievementByCode(definition.code)
    const award =
      catalog &&
      achievementStore.achievementRecords.find(
        (record) =>
          record.achievementId === catalog.id &&
          record.userId === userStore.userId,
      )
    const locallyQueued =
      !!catalog && !award && achievementStore.hasEarnedCode(definition.code)
    return {
      code: definition.code,
      tier: definition.tier,
      label: catalog?.label ?? definition.label,
      hint: definition.subtleHint,
      icon: catalog?.icon ?? definition.icon,
      imagePath: catalog?.imagePath ?? null,
      earned: !!award,
      status: award
        ? 'Earned · ' + dateLabel(String(award.createdAt))
        : locallyQueued
          ? 'Awaiting account sync'
          : catalog
            ? 'Not yet recorded'
            : 'Catalog unavailable',
    }
  }),
)
const syncedAwardCount = computed(
  () => accountBadges.value.filter((m) => m.earned).length,
)
const replayTargets = computed(() =>
  MILESTONES.filter((m) => !filed(m.id))
    .sort((a, b) => a.target - progress(a) - (b.target - progress(b)))
    .slice(0, 3),
)
const earned = filed
const hasEnding = (id: string) => store.endingsFound.includes(id)
const endingTitle = (id: string) =>
  ENDINGS.find((ending) => ending.id === id)?.title ?? 'Classified'
const progress = (milestone: Milestone) =>
  Math.min(milestone.target, milestone.value(archive.value, store.endingsFound))
const dateLabel = (value?: string) =>
  value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleDateString()
    : 'Date redacted'

function selectTab(section: ArchiveTab): void {
  tab.value = section
  if (section === 'achievements')
    void achievementStore.initialize({ fetchRemote: true })
}
function open(section: ArchiveTab = 'milestones'): void {
  selectTab(section)
  sheet.value?.showModal()
}
function replay(): void {
  close()
  store.quit()
}
function close(): void {
  sheet.value?.close()
}
defineExpose({ open })
</script>
