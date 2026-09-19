<template>
  <main class="kr-surface bg-base-200/40">
    <div class="kr-scroll kr-container max-w-6xl space-y-4 px-3 py-4 sm:px-5 sm:py-6">
      <nav class="flex flex-wrap items-center gap-2">
        <NuxtLink to="/play/mandarin" class="kr-btn-ghost">
          <Icon name="kind-icon:arrow-left" class="kr-icon-4" />
          Mandarin Tutor
        </NuxtLink>
      </nav>

      <header class="kr-panel-section-plain shadow-lg">
        <p class="kr-text-eyebrow-bold">Sound-family index</p>
        <h1 class="mt-1 text-3xl font-black sm:text-4xl">One sound clue, many characters</h1>
        <p class="kr-text-faded-sm mt-2 max-w-3xl leading-relaxed">
          These families come only from phonetic relationships asserted by the pinned character source. Modern readings are shown side by side, including families whose sounds drifted apart over time.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <span class="kr-badge-primary-sm">{{ families.length }} families</span>
          <span class="kr-badge-ghost-sm">{{ memberCount }} catalog cards</span>
          <span class="kr-badge-warning-sm">{{ driftedCount }} drifted</span>
        </div>
      </header>

      <label class="kr-form-field kr-panel-flat p-3">
        <span class="text-xs font-semibold opacity-65">Find a component, character, pinyin, or meaning</span>
        <input v-model="query" class="kr-input-sm mt-1 w-full" placeholder="青, qing, 请, ask…" autocomplete="off" />
      </label>

      <div v-if="pending" class="grid min-h-56 place-items-center kr-panel-flat">
        <span class="loading loading-ring loading-lg text-primary" />
      </div>

      <div v-else-if="errorMessage" class="alert alert-error" role="alert">
        <span>{{ errorMessage }}</span>
      </div>

      <section v-else class="space-y-3" aria-label="Phonetic families">
        <article v-for="family in filteredFamilies" :key="family.phonetic" class="kr-panel-section-flat">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-5xl font-semibold leading-none">{{ family.phonetic }}</span>
              <div>
                <p class="kr-text-bold-lg">{{ family.members.length }} members</p>
                <p class="kr-text-faded-xs">{{ family.readings.join(' · ') }}</p>
              </div>
            </div>
            <span v-if="family.drifted" class="kr-badge-warning-sm">readings drifted</span>
            <span v-else class="kr-badge-success-sm">reading stayed close</span>
          </div>

          <p v-if="family.drifted" class="kr-text-faded-xs mt-2 leading-relaxed">
            The shared component records a historical sound relationship, not a promise that every modern member still sounds alike.
          </p>

          <div class="mt-3 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]">
            <NuxtLink
              v-for="member in family.members"
              :key="member.key"
              :to="`/play/mandarin/learn/${encodeURIComponent(member.key)}`"
              class="kr-panel-compact-xs transition hover:border-accent"
            >
              <div class="flex items-baseline justify-between gap-2">
                <span class="text-3xl font-semibold">{{ member.simplified }}</span>
                <span class="text-xs font-semibold opacity-65">{{ member.pinyin }}</span>
              </div>
              <span class="mt-1 block text-xs opacity-70">{{ member.meaning }}</span>
            </NuxtLink>
          </div>
        </article>

        <div v-if="!filteredFamilies.length" class="kr-panel-flat p-8 text-center">
          <p class="kr-text-bold-lg">No sound family matches that search.</p>
          <p class="kr-text-faded-xs mt-1">Try a component glyph, a member character, pinyin, or an English meaning.</p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { MandarinCatalogPayload } from '~/utils/mandarin'
import { buildMandarinSoundFamilies } from '~/utils/mandarinSoundFamilies'

const query = ref('')
const { data, pending, error } = await useFetch<{
  success: boolean
  message: string
  data: MandarinCatalogPayload | null
}>('/api/mandarin')

const families = computed(() => buildMandarinSoundFamilies(data.value?.data?.cards ?? []))
const memberCount = computed(() => new Set(families.value.flatMap((family) => family.members.map((member) => member.key))).size)
const driftedCount = computed(() => families.value.filter((family) => family.drifted).length)
const errorMessage = computed(() => error.value?.message || (data.value && !data.value.success ? data.value.message : ''))
const filteredFamilies = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  if (!needle) return families.value
  return families.value.filter((family) =>
    family.phonetic.toLocaleLowerCase().includes(needle) ||
    family.members.some((member) =>
      [member.simplified, member.pinyin, member.meaning].some((value) => value.toLocaleLowerCase().includes(needle)),
    ),
  )
})
</script>
