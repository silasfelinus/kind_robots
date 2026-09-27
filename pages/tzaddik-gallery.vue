<template>
  <div class="kr-surface">
    <div class="kr-scroll kr-container max-w-4xl p-4 sm:p-6">
      <div class="kr-panel space-y-5 p-5 sm:p-6">
        <header class="flex items-start gap-3 border-b border-base-300 pb-5">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          >
            <Icon name="kind-icon:stars" class="kr-icon-6" />
          </div>
          <div class="min-w-0 flex-1 space-y-2">
            <p class="kr-text-black-2xl tracking-tight">Tzaddik Gallery</p>
            <p class="text-sm leading-relaxed text-base-content/75">
              A playful, sourced gallery of everyday and extraordinary people
              who quietly keep the world running, plus a historical archive of
              past honorees.
            </p>
          </div>
        </header>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap gap-2" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              role="tab"
              :aria-selected="activeTab === tab.key"
              class="kr-btn-2xl"
              :class="
                activeTab === tab.key
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300'
              "
              @click="activeTab = tab.key"
            >
              <Icon :name="tab.icon" class="kr-icon-4" />
              {{ tab.label }}
            </button>
          </div>

          <button
            v-if="userStore.isLoggedIn"
            type="button"
            class="btn btn-primary btn-sm gap-1.5 rounded-xl"
            @click="showSubmitForm = true"
          >
            <Icon name="kind-icon:plus" class="kr-icon-3-5" />
            Submit a candidate
          </button>
        </div>

        <div
          class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/60 p-4"
        >
          <p class="text-sm leading-relaxed text-base-content/80">
            {{ activeTabBody }}
          </p>
        </div>

        <div
          v-if="activeTab === 'living' || activeTab === 'memorial'"
          class="flex flex-wrap items-center gap-1.5"
        >
          <button
            v-for="tag in TZADDIK_TAG_ORDER"
            :key="tag"
            type="button"
            class="kr-badge-xs cursor-pointer"
            :class="
              selectedTags.has(tag)
                ? 'badge-primary'
                : 'badge-ghost border border-base-300'
            "
            :aria-pressed="selectedTags.has(tag)"
            @click="toggleTag(tag)"
          >
            {{ tzaddikTagLabel(tag) }}
          </button>
          <button
            v-if="selectedTags.size"
            type="button"
            class="kr-badge-xs badge-ghost border border-base-300 text-base-content/60"
            @click="selectedTags.clear()"
          >
            Clear filters
          </button>
        </div>

        <kr-gallery
          v-if="activeTab === 'living'"
          :items="filteredLivingItems"
          :loading="tzaddikStore.isLoadingLiving"
          :error="tzaddikStore.livingError"
          empty-label="living Tzaddik matching the selected tags"
          :modes="[]"
          @open="openDetail"
        />

        <kr-gallery
          v-else-if="activeTab === 'memorial'"
          :items="filteredMemorialItems"
          :loading="tzaddikStore.isLoadingMemorial"
          :error="tzaddikStore.memorialError"
          empty-label="memorial honorees matching the selected tags"
          :modes="[]"
          @open="openDetail"
        />

        <section v-else class="grid gap-3 sm:grid-cols-3">
          <article
            v-for="block in sections"
            :key="block.key"
            class="kr-panel-flat flex flex-col gap-2 rounded-2xl p-4"
          >
            <div class="flex items-center gap-2">
              <span
                class="flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary"
              >
                <Icon :name="block.icon" class="kr-icon-4" />
              </span>
              <h3 class="kr-text-black-sm">{{ block.title }}</h3>
            </div>
            <p class="kr-text-dim-sm-70 leading-relaxed">{{ block.body }}</p>
          </article>
        </section>
      </div>

      <tzaddik-detail-sheet
        v-if="openCandidateId !== null"
        :candidate-id="openCandidateId"
        @close="openCandidateId = null"
      />

      <tzaddik-submit-form
        v-if="showSubmitForm"
        @close="showSubmitForm = false"
        @submitted="onSubmitted"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { useTzaddikStore } from '@/stores/tzaddikStore'
import type { TzaddikCandidateWithTags } from '@/stores/tzaddikStore'
import { useUserStore } from '@/stores/userStore'
import type { TzaddikEditorialTag } from '~/prisma/generated/prisma/client'
import { TZADDIK_TAG_ORDER, tzaddikTagLabel } from '@/utils/tzaddikTags'

type TabKey = 'living' | 'memorial' | 'info'

const tabs: { key: TabKey; label: string; icon: string; body: string }[] = [
  {
    key: 'living',
    label: 'Living',
    icon: 'kind-icon:stars',
    body: 'The current 36 living "just people" keeping the world running. The first sourced seed set is accepted and being built into the gallery now — check back soon for the full browsable roster.',
  },
  {
    key: 'memorial',
    label: 'Memorial',
    icon: 'kind-icon:heart',
    body: 'A historical archive of past honorees who no longer meet the "living" bar. The first accepted memorial seed set is being built into the gallery now.',
  },
  {
    key: 'info',
    label: 'About the 36',
    icon: 'kind-icon:mask',
    body: 'Tzaddik Gallery borrows the folklore concept of 36 righteous or "just" people who quietly sustain the world — playfully, not religiously. Being Jewish or Hasidic is not a requirement, expectation, or ranking factor. Every entry is sourced from Wikipedia, with a visible controversy/objections section so the gallery stays honest rather than becoming hagiography. Anyone can submit a candidate and react to nominations.',
  },
]

const activeTab = ref<TabKey>('living')
const activeTabBody = computed(
  () => tabs.find((t) => t.key === activeTab.value)?.body ?? '',
)

const sections = [
  {
    key: 'sourced',
    title: 'Sourced, not assumed',
    body: 'Wikipedia is the default source for facts and images. Admin overrides are allowed but must be explicit and keep the original provenance.',
    icon: 'kind-icon:database',
  },
  {
    key: 'international',
    title: 'Beyond the usual names',
    body: 'Research deliberately looks past US/Anglosphere celebrity bias, across regions, languages, disciplines, and forms of public service.',
    icon: 'kind-icon:globe',
  },
  {
    key: 'community',
    title: 'Community-suggested',
    body: 'Signed-in users can submit candidates and react to nominations. Community reaction is signal, not an automatic canonical ranking.',
    icon: 'kind-icon:people',
  },
]

const tzaddikStore = useTzaddikStore()
const userStore = useUserStore()
const showSubmitForm = ref(false)

function toGalleryItem(candidate: TzaddikCandidateWithTags): GalleryItem {
  const image =
    candidate.imageUrlOverride || candidate.imageFileUrl || undefined
  const meta = [candidate.region, candidate.countryCode]
    .filter(Boolean)
    .join(', ')

  return {
    id: candidate.id,
    title: candidate.displayNameOverride || candidate.displayName,
    description: candidate.rationaleOverride || candidate.rationale,
    card: image,
    icon: image,
    meta: meta || undefined,
    badges: candidate.Tags.map((entry) => ({
      label: tzaddikTagLabel(entry.tag),
    })),
    placeholderIcon: 'kind-icon:stars',
    placeholderLabel: candidate.displayName,
  }
}

const selectedTags = reactive(new Set<TzaddikEditorialTag>())

function toggleTag(tag: TzaddikEditorialTag): void {
  if (selectedTags.has(tag)) {
    selectedTags.delete(tag)
  } else {
    selectedTags.add(tag)
  }
}

function matchesSelectedTags(candidate: TzaddikCandidateWithTags): boolean {
  if (!selectedTags.size) return true
  const candidateTags = new Set(candidate.Tags.map((entry) => entry.tag))
  return [...selectedTags].every((tag) => candidateTags.has(tag))
}

const filteredLivingItems = computed(() =>
  tzaddikStore.living.filter(matchesSelectedTags).map(toGalleryItem),
)
const filteredMemorialItems = computed(() =>
  tzaddikStore.memorial.filter(matchesSelectedTags).map(toGalleryItem),
)

const openCandidateId = ref<number | null>(null)

function openDetail(item: GalleryItem): void {
  openCandidateId.value = Number(item.id)
}

async function onSubmitted(candidate: TzaddikCandidateWithTags): Promise<void> {
  showSubmitForm.value = false
  await tzaddikStore.fetchOne(candidate.id, true)
  openCandidateId.value = candidate.id
}

onMounted(() => {
  tzaddikStore.fetchLiving()
  tzaddikStore.fetchMemorial()
})
</script>
