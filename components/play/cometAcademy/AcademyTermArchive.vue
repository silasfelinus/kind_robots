<template>
  <section class="space-y-3" data-testid="academy-term-archive">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="font-black tracking-wide text-amber-200">
        Completed terms
      </h3>
      <span class="text-xs font-bold text-slate-300">
        {{ pages.length }} {{ pages.length === 1 ? 'record' : 'records' }}
      </span>
    </div>
    <p v-if="!pages.length" class="text-sm text-slate-300">
      Your first finished term will leave a permanent page here. New games
      keep every graduation, rescue and disastrous prom.
    </p>
    <div
      v-else
      class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3"
    >
      <article
        v-for="page in pages"
        :key="page.id"
        class="min-w-0 overflow-hidden rounded-xl border border-amber-200/30 bg-slate-950/75 text-slate-100"
        data-testid="academy-completed-term-page"
      >
        <div class="relative aspect-[16/10] overflow-hidden bg-slate-900">
          <img
            v-if="artEnabled && promArt(endingArtKey(page.ending))"
            :src="promArt(endingArtKey(page.ending))!"
            :alt="page.ending"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="grid h-full place-items-center bg-gradient-to-br from-violet-900 via-slate-900 to-amber-950 px-4 text-center text-sm font-bold text-amber-100"
          >
            {{ page.ending }}
          </div>
          <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 text-[0.65rem] font-extrabold uppercase tracking-wider text-white"
          >
            {{ page.flowVersion === 3 ? 'Thirty-day term' : 'Training simulation' }}
            · day {{ page.day }}
          </div>
        </div>
        <div class="space-y-2 p-3">
          <h4 class="font-serif text-base font-bold leading-tight text-amber-100">
            {{ page.ending }}
          </h4>
          <p class="text-xs font-semibold text-slate-200">
            {{ page.signature ? identityFor(page.signature).realName : 'Academy student' }}
            · {{ page.form.toUpperCase() }}
          </p>
          <p class="text-xs text-slate-300">
            Final choice:
            {{ page.finalChoice === 'simulation' ? 'First-week exam' : page.finalChoice }}
            <template v-if="page.mastermind">
              · Against
              {{ villainName(page.mastermind) }}
            </template>
          </p>
          <p v-if="page.romance" class="text-xs text-rose-200">
            ♥ {{ studentName(page.romance) }}
          </p>
          <div class="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-slate-300">
            <span>{{ page.contacts }} contacts</span>
            <span>{{ page.patrols }} patrols</span>
            <span>{{ page.battles }} battles</span>
            <span>{{ page.secrets }} secrets</span>
            <span>{{ page.losses }} losses</span>
          </div>
          <p class="text-[0.65rem] text-slate-400">
            Filed {{ new Date(page.completedAt).toLocaleDateString() }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CAMPAIGN_VILLAINS } from '~/utils/cometAcademy/campaign'
import { identityFor } from '~/utils/cometAcademy/identityArcs'
import { endingArtKey } from '~/utils/cometAcademy/artSlots'
import { promArt } from '~/utils/cometAcademy/artManifest'
import { STUDENTS, type StudentId } from '~/utils/cometAcademy/rules'
import type { AcademyTermPage } from '~/utils/cometAcademy/termArchive'

withDefaults(
  defineProps<{
    pages: readonly AcademyTermPage[]
    artEnabled?: boolean
  }>(),
  { artEnabled: true },
)

const studentName = (id: StudentId) =>
  STUDENTS.find((student) => student.id === id)?.name ?? 'A friend'
const villainName = (id: string) =>
  CAMPAIGN_VILLAINS.find((villain) => villain.id === id)?.name ?? 'The mastermind'
</script>
