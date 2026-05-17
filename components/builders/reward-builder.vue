<!-- /components/builders/reward-builder.vue -->
<template>
  <builder-shell
    builder-key="reward"
    title="Reward Builder"
    :sections="sections"
    :summary-items="summaryItems"
    initial-section="type"
    summary-title="Reward Summary"
    summary-subtitle="Review reward type, identity, mechanics, links, art, and save status."
    @section-change="activeSection = $event"
  >
    <template
      #default="{ activeSection: currentSection, setSection, goNext, goBack }"
    >
      <section v-if="currentSection === 'type'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:gift" class="h-6 w-6 text-primary" />
            What kind of reward is this?
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            A reward can be treasure, but it can also be a skill, power, secret,
            curse, permission, ally, or story key. Loot is cute. Narrative
            leverage is cuter.
          </p>

          <div
            class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            <button
              v-for="option in rewardTypeOptions"
              :key="option.value"
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                rewardKind === option.value
                  ? 'border-primary bg-primary text-primary-content shadow-md'
                  : 'border-base-300 bg-base-100 text-base-content'
              "
              type="button"
              @click="selectRewardKind(option.value)"
            >
              <Icon :name="option.icon" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">
                {{ option.label }}
              </p>

              <p class="mt-1 text-sm opacity-70">
                {{ option.description }}
              </p>
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Continue
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'identity'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon :name="rewardKindIcon" class="h-6 w-6 text-primary" />
            Reward Identity
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Give the reward a name, category, and description. The best rewards
            imply a story problem they either solve or make dramatically worse.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text font-bold">Reward Title</span>

              <input
                v-model="title"
                class="input input-bordered rounded-2xl text-base"
                type="text"
                placeholder="Example: The Velvet Skeleton Key"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Reward Kind</span>

              <select
                v-model="rewardKind"
                class="select select-bordered rounded-2xl"
              >
                <option
                  v-for="option in rewardTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text font-bold">Description</span>

              <textarea
                v-model="description"
                class="textarea textarea-bordered min-h-40 rounded-2xl text-base"
                placeholder="Describe what this reward is, how it feels, and why a character would want it..."
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Rarity</span>

              <select
                v-model="rarity"
                class="select select-bordered rounded-2xl"
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="legendary">Legendary</option>
                <option value="mythic">Mythic</option>
                <option value="cursed">Cursed</option>
                <option value="unique">Unique</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Genre</span>

              <input
                v-model="genre"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="Fantasy, sci-fi, gothic comedy..."
              />
            </label>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="rollRewardIdentity"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Identity
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="buildRewardDescription"
            >
              <Icon name="kind-icon:wand" class="h-4 w-4" />
              Build Description
            </button>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Continue
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'effect'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:sparkles" class="h-6 w-6 text-primary" />
            Reward Effect
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Define what this reward actually does. For skill rewards, this
            becomes a character ability. For treasure, this becomes usable loot.
            For permissions, this can unlock scenario choices.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label class="form-control">
              <span class="label-text font-bold">Effect Summary</span>

              <textarea
                v-model="effect"
                class="textarea textarea-bordered min-h-40 rounded-2xl text-base"
                placeholder="What does this reward do?"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Limitations or Cost</span>

              <textarea
                v-model="cost"
                class="textarea textarea-bordered min-h-40 rounded-2xl text-base"
                placeholder="What does it cost, require, risk, or complicate?"
              />
            </label>
          </div>

          <div
            v-if="rewardKind === 'skill'"
            class="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4"
          >
            <h4 class="flex items-center gap-2 text-lg font-bold text-primary">
              <Icon name="kind-icon:activity" class="h-5 w-5" />
              Skill Reward Details
            </h4>

            <p class="mt-1 text-sm text-base-content/70">
              Skill rewards should feel like a new action a character can take,
              not just a shiny badge that says “I did plot.”
            </p>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label class="form-control">
                <span class="label-text font-bold">Skill Name</span>

                <input
                  v-model="skillName"
                  class="input input-bordered rounded-2xl"
                  type="text"
                  placeholder="Moonlit Bargaining"
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Linked Stat</span>

                <select
                  v-model="linkedStat"
                  class="select select-bordered rounded-2xl"
                >
                  <option value="Luck">Luck</option>
                  <option value="Swol">Swol</option>
                  <option value="Wits">Wits</option>
                  <option value="Flexibility">Flexibility</option>
                  <option value="Rizz">Rizz</option>
                  <option value="Empathy">Empathy</option>
                  <option value="Custom">Custom</option>
                </select>
              </label>

              <label class="form-control md:col-span-2">
                <span class="label-text font-bold">Skill Use</span>

                <textarea
                  v-model="skillUse"
                  class="textarea textarea-bordered min-h-32 rounded-2xl text-base"
                  placeholder="When can the character use this skill, and what kind of outcome does it create?"
                />
              </label>
            </div>
          </div>

          <div
            v-else-if="rewardKind === 'treasure'"
            class="mt-4 rounded-2xl border border-secondary/30 bg-secondary/10 p-4"
          >
            <h4
              class="flex items-center gap-2 text-lg font-bold text-secondary"
            >
              <Icon name="kind-icon:chest" class="h-5 w-5" />
              Treasure Details
            </h4>

            <p class="mt-1 text-sm text-base-content/70">
              Treasure should be desirable, portable, stealable, cursed, or
              emotionally inconvenient. Ideally several.
            </p>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label class="form-control">
                <span class="label-text font-bold">Material</span>

                <input
                  v-model="material"
                  class="input input-bordered rounded-2xl"
                  type="text"
                  placeholder="Moon brass, ghost silk, lacquered bone..."
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Treasure Form</span>

                <input
                  v-model="treasureForm"
                  class="input input-bordered rounded-2xl"
                  type="text"
                  placeholder="Ring, map, lantern, key, contract..."
                />
              </label>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="rollEffect"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Effect
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="buildEffectFromKind"
            >
              <Icon name="kind-icon:wand" class="h-4 w-4" />
              Build Effect
            </button>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Continue
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'connections'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:link" class="h-6 w-6 text-primary" />
            Reward Connections
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Attach this reward to a dream, character, or scenario. Skill rewards
            especially like being attached to characters. Treasure likes being
            lost dramatically.
          </p>

          <div
            class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            <label class="form-control">
              <span class="label-text font-bold">Dream</span>

              <select
                v-model.number="selectedDreamId"
                class="select select-bordered rounded-2xl"
              >
                <option :value="0">No dream selected</option>

                <option
                  v-for="dream in dreamOptions"
                  :key="dream.id"
                  :value="dream.id"
                >
                  {{ dream.label }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Character</span>

              <select
                v-model.number="selectedCharacterId"
                class="select select-bordered rounded-2xl"
              >
                <option :value="0">No character selected</option>

                <option
                  v-for="character in characterOptions"
                  :key="character.id"
                  :value="character.id"
                >
                  {{ character.label }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Scenario</span>

              <select
                v-model.number="selectedScenarioId"
                class="select select-bordered rounded-2xl"
              >
                <option :value="0">No scenario selected</option>

                <option
                  v-for="scenario in scenarioOptions"
                  :key="scenario.id"
                  :value="scenario.id"
                >
                  {{ scenario.label }}
                </option>
              </select>
            </label>
          </div>

          <div class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-4">
            <h4 class="font-bold text-base-content">Connection Notes</h4>

            <textarea
              v-model="connectionNotes"
              class="textarea textarea-bordered mt-3 min-h-32 w-full rounded-2xl text-base"
              placeholder="How does this reward appear, who can earn it, and what does it unlock?"
            />
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'art'" class="flex flex-col gap-4">
        <art-creator
          purpose="reward"
          :model-id="selectedRewardId"
          :model-title="title"
          :prompt="artPrompt"
          :image-role="rewardKind === 'skill' ? 'skill icon' : 'reward object'"
          @update="updateRewardArt"
        />

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Summary
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'summary'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-primary">
            <Icon name="kind-icon:blueprint" class="h-6 w-6" />
            Reward Summary
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Review the reward before saving. Remember, a reward is not just an
            item. It is permission for the story to get weirder.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_22rem]">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <div class="flex flex-col gap-3">
              <div class="flex items-start gap-3">
                <div
                  class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300"
                >
                  <img
                    v-if="imagePath"
                    :src="imagePath"
                    alt="Reward art"
                    class="h-full w-full object-cover"
                  />

                  <Icon
                    v-else
                    :name="rewardKindIcon"
                    class="h-10 w-10 text-primary"
                  />
                </div>

                <div class="min-w-0">
                  <p
                    class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                  >
                    {{ rewardKindLabel }}
                  </p>

                  <h3 class="mt-1 text-2xl font-bold text-base-content">
                    {{ title || 'Untitled Reward' }}
                  </h3>

                  <p class="mt-1 text-sm text-base-content/70">
                    {{ rarity }} · {{ genre || 'No genre set' }}
                  </p>
                </div>
              </div>

              <div>
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                >
                  Description
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/70"
                >
                  {{ description || 'No description yet.' }}
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                >
                  Effect
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/70"
                >
                  {{ effect || 'No effect yet.' }}
                </p>
              </div>

              <div v-if="rewardKind === 'skill'">
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                >
                  Skill Details
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/70"
                >
                  {{ skillSummary }}
                </p>
              </div>

              <div v-if="rewardKind === 'treasure'">
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                >
                  Treasure Details
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/70"
                >
                  {{ treasureSummary }}
                </p>
              </div>
            </div>
          </div>

          <aside
            class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('type')"
            >
              <Icon name="kind-icon:gift" class="h-4 w-4" />
              Edit Type
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('identity')"
            >
              <Icon name="kind-icon:signature" class="h-4 w-4" />
              Edit Identity
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('effect')"
            >
              <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              Edit Effect
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('connections')"
            >
              <Icon name="kind-icon:link" class="h-4 w-4" />
              Edit Connections
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('art')"
            >
              <Icon name="kind-icon:palette" class="h-4 w-4" />
              Edit Art
            </button>

            <button
              class="btn btn-primary rounded-xl"
              type="button"
              :disabled="isSaving || !canSave"
              @click="saveReward"
            >
              <Icon name="kind-icon:save" class="h-4 w-4" />
              {{ isSaving ? 'Saving...' : 'Save Reward' }}
            </button>

            <p
              v-if="saveMessage"
              class="rounded-2xl border border-success/30 bg-success/10 p-3 text-sm text-success"
            >
              {{ saveMessage }}
            </p>

            <p
              v-if="saveError"
              class="rounded-2xl border border-error/30 bg-error/10 p-3 text-sm text-error"
            >
              {{ saveError }}
            </p>
          </aside>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="item in summaryItems"
            :key="item.key"
            class="rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300"
              >
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.label"
                  class="h-full w-full object-cover"
                />

                <Icon
                  v-else
                  :name="item.icon || 'kind-icon:sparkles'"
                  class="h-7 w-7 text-primary"
                />
              </div>

              <div class="min-w-0">
                <p class="font-bold text-base-content">
                  {{ item.label }}
                </p>

                <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
                  {{ displaySummaryValue(item.value) }}
                </p>

                <p
                  v-if="item.description"
                  class="mt-1 line-clamp-2 text-xs text-base-content/50"
                >
                  {{ item.description }}
                </p>
              </div>
            </div>

            <button
              v-if="item.editSection"
              class="btn btn-sm mt-3 rounded-xl"
              type="button"
              @click="setSection(item.editSection)"
            >
              Reconfigure
            </button>
          </article>
        </div>
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown reward builder section: {{ currentSection }}
      </div>
    </template>
  </builder-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type {
  BuilderChoiceSummary,
  BuilderSectionConfig,
} from '@/components/builders/builder-shell.vue'
import { useUserStore } from '@/stores/userStore'
import { useRandomStore } from '@/stores/randomStore'
import { handleError, performFetch } from '@/stores/utils'

type RewardKind =
  | 'treasure'
  | 'skill'
  | 'power'
  | 'secret'
  | 'status'
  | 'key'
  | 'curse'
  | 'permission'
  | 'ally'

type SelectOption = {
  id: number
  label: string
}

type ArtCreatorPayload = {
  purpose: string
  modelId: number | null
  modelTitle: string
  prompt: string
  negativePrompt: string
  imageRole: string
  imagePath: string | null
}

type PerformFetchResult<T> = {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
}

const REWARD_ENDPOINT = '/api/reward'

const userStore = useUserStore()
const randomStore = useRandomStore()

const activeSection = ref<string>('type')
const selectedRewardId = ref<number | null>(null)

const rewardKind = ref<RewardKind>('treasure')
const title = ref('')
const description = ref('')
const rarity = ref('uncommon')
const genre = ref('')

const effect = ref('')
const cost = ref('')
const skillName = ref('')
const linkedStat = ref('Wits')
const skillUse = ref('')
const material = ref('')
const treasureForm = ref('')

const selectedDreamId = ref(0)
const selectedCharacterId = ref(0)
const selectedScenarioId = ref(0)
const dreamOptions = ref<SelectOption[]>([])
const characterOptions = ref<SelectOption[]>([])
const scenarioOptions = ref<SelectOption[]>([])
const connectionNotes = ref('')

const artPrompt = ref('')
const imagePath = ref<string | null>(null)

const isPublic = ref(true)
const isMature = ref(false)
const isActive = ref(true)

const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const rewardTypeOptions: {
  value: RewardKind
  label: string
  icon: string
  description: string
}[] = [
  {
    value: 'treasure',
    label: 'Treasure',
    icon: 'kind-icon:chest',
    description:
      'Physical loot, artifacts, relics, money, maps, charms, or suspiciously shiny objects.',
  },
  {
    value: 'skill',
    label: 'Skill',
    icon: 'kind-icon:activity',
    description:
      'A new character ability, technique, talent, move, spell, or social trick.',
  },
  {
    value: 'power',
    label: 'Power',
    icon: 'kind-icon:sparkles',
    description:
      'A supernatural, technological, or narrative ability that changes what is possible.',
  },
  {
    value: 'secret',
    label: 'Secret',
    icon: 'kind-icon:eye',
    description:
      'Knowledge, leverage, forbidden truth, blackmail, prophecy, or hidden history.',
  },
  {
    value: 'status',
    label: 'Status',
    icon: 'kind-icon:trophy',
    description:
      'A title, rank, reputation, blessing, debt, favor, or social position.',
  },
  {
    value: 'key',
    label: 'Key',
    icon: 'kind-icon:key',
    description:
      'A literal or symbolic key that opens places, paths, factions, endings, or trouble.',
  },
  {
    value: 'curse',
    label: 'Curse',
    icon: 'kind-icon:skull',
    description:
      'A mixed reward with a drawback, burden, haunting, mark, or narrative timer.',
  },
  {
    value: 'permission',
    label: 'Permission',
    icon: 'kind-icon:unlock',
    description:
      'Unlocks choices, scenes, dialogue, factions, scenario branches, or special actions.',
  },
  {
    value: 'ally',
    label: 'Ally',
    icon: 'kind-icon:person',
    description:
      'A helper, contact, tiny monster, familiar, patron, fan club, or problem with legs.',
  },
]

const sections: BuilderSectionConfig[] = [
  {
    key: 'type',
    label: 'Type',
    icon: 'kind-icon:gift',
    title: 'Reward Type',
    summary:
      'Choose whether this reward is treasure, skill, power, secret, status, key, curse, permission, or ally.',
  },
  {
    key: 'identity',
    label: 'Identity',
    icon: 'kind-icon:signature',
    title: 'Reward Identity',
    summary: 'Name and describe the reward.',
  },
  {
    key: 'effect',
    label: 'Effect',
    icon: 'kind-icon:sparkles',
    title: 'Reward Effect',
    summary: 'Define what the reward does, costs, unlocks, or complicates.',
  },
  {
    key: 'connections',
    label: 'Links',
    icon: 'kind-icon:link',
    title: 'Reward Connections',
    summary: 'Attach the reward to dreams, characters, and scenarios.',
  },
  {
    key: 'art',
    label: 'Art',
    icon: 'kind-icon:palette',
    title: 'Reward Art',
    summary: 'Create, upload, generate, or select reward art.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Reward Summary',
    summary: 'Review and save the reward.',
  },
]

const rewardKindConfig = computed(() => {
  return rewardTypeOptions.find((option) => option.value === rewardKind.value)
})

const rewardKindLabel = computed(
  () => rewardKindConfig.value?.label ?? 'Reward',
)
const rewardKindIcon = computed(
  () => rewardKindConfig.value?.icon ?? 'kind-icon:gift',
)

const selectedDreamLabel = computed(() => {
  return (
    dreamOptions.value.find((item) => item.id === selectedDreamId.value)
      ?.label ?? ''
  )
})

const selectedCharacterLabel = computed(() => {
  return (
    characterOptions.value.find((item) => item.id === selectedCharacterId.value)
      ?.label ?? ''
  )
})

const selectedScenarioLabel = computed(() => {
  return (
    scenarioOptions.value.find((item) => item.id === selectedScenarioId.value)
      ?.label ?? ''
  )
})

const connectionSummary = computed(() => {
  const parts = [
    selectedDreamLabel.value ? `Dream: ${selectedDreamLabel.value}` : '',
    selectedCharacterLabel.value
      ? `Character: ${selectedCharacterLabel.value}`
      : '',
    selectedScenarioLabel.value
      ? `Scenario: ${selectedScenarioLabel.value}`
      : '',
  ].filter(Boolean)

  return parts.length ? parts.join(', ') : 'No links selected yet'
})

const skillSummary = computed(() => {
  return [
    skillName.value ? `Skill: ${skillName.value}.` : '',
    linkedStat.value ? `Linked stat: ${linkedStat.value}.` : '',
    skillUse.value ? `Use: ${skillUse.value}` : '',
  ]
    .filter(Boolean)
    .join(' ')
})

const treasureSummary = computed(() => {
  return (
    [
      treasureForm.value ? `Form: ${treasureForm.value}.` : '',
      material.value ? `Material: ${material.value}.` : '',
    ]
      .filter(Boolean)
      .join(' ') || 'Treasure details not set yet.'
  )
})

const canSave = computed(() => title.value.trim().length > 0)

const summaryItems = computed<BuilderChoiceSummary[]>(() => [
  {
    key: 'type',
    label: 'Reward Type',
    value: rewardKindLabel.value,
    icon: rewardKindIcon.value,
    description: rewardKindConfig.value?.description ?? 'Reward type.',
    editSection: 'type',
  },
  {
    key: 'title',
    label: 'Title',
    value: title.value,
    icon: 'kind-icon:signature',
    description: `${rarity.value} · ${genre.value || 'No genre set'}`,
    editSection: 'identity',
  },
  {
    key: 'effect',
    label: 'Effect',
    value: effect.value,
    icon: 'kind-icon:sparkles',
    description: cost.value || 'No limitation or cost set.',
    editSection: 'effect',
  },
  {
    key: 'skill',
    label: 'Skill Details',
    value: rewardKind.value === 'skill' ? skillSummary.value : '',
    icon: 'kind-icon:activity',
    description:
      rewardKind.value === 'skill'
        ? 'Character ability reward.'
        : 'Only used for skill rewards.',
    editSection: 'effect',
  },
  {
    key: 'connections',
    label: 'Connections',
    value: connectionSummary.value,
    icon: 'kind-icon:link',
    description: connectionNotes.value || 'No connection notes yet.',
    editSection: 'connections',
  },
  {
    key: 'art',
    label: 'Reward Art',
    value: artPrompt.value,
    image: imagePath.value,
    icon: 'kind-icon:palette',
    description: 'Reward image, skill icon, or treasure art.',
    editSection: 'art',
  },
  {
    key: 'save',
    label: 'Save Status',
    value: selectedRewardId.value
      ? `Saved as #${selectedRewardId.value}`
      : 'Not saved yet',
    icon: selectedRewardId.value ? 'kind-icon:check' : 'kind-icon:save',
    description:
      'Saved rewards can connect to characters, dreams, and scenarios.',
    editSection: 'summary',
  },
])

function selectRewardKind(kind: RewardKind) {
  rewardKind.value = kind

  if (kind === 'skill' && !skillName.value.trim()) {
    skillName.value = title.value.trim() || 'Unnamed Skill'
  }

  if (kind === 'treasure' && !treasureForm.value.trim()) {
    treasureForm.value = 'Artifact'
  }

  if (!artPrompt.value.trim()) {
    buildArtPrompt()
  }
}

function rollFrom(key: string, fallback = '') {
  return randomStore.getRandom(key, 1)[0] ?? fallback
}

function rollRewardIdentity() {
  const adjective = rollFrom('adjective', 'strange')
  const noun =
    rewardKind.value === 'skill'
      ? rollFrom('skill', 'Technique')
      : rollFrom('item', 'Relic')

  title.value = `The ${capitalize(adjective)} ${capitalize(noun)}`
  genre.value = genre.value || rollFrom('genre', 'fantasy')

  if (rewardKind.value === 'treasure') {
    material.value = rollFrom('material', material.value)
    treasureForm.value = rollFrom('item', treasureForm.value)
  }

  if (rewardKind.value === 'skill') {
    skillName.value = title.value.replace(/^The\s+/i, '')
    linkedStat.value = rollLinkedStat()
  }
}

function buildRewardDescription() {
  const kind = rewardKindLabel.value.toLowerCase()
  const name = title.value.trim() || `Unnamed ${rewardKindLabel.value}`

  description.value = [
    `${name} is a ${rarity.value} ${kind} reward.`,
    rewardKind.value === 'skill'
      ? 'It represents a new ability a character can use during story play.'
      : '',
    rewardKind.value === 'treasure'
      ? 'It is a tangible treasure with story value, practical use, and probably at least one suspicious history.'
      : '',
    genre.value ? `Genre flavor: ${genre.value}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function rollEffect() {
  const skill = rollFrom('skill', 'improvise under pressure')
  const quirk = rollFrom('quirk', 'it works best at the worst possible time')

  effect.value = `Allows the holder to ${skill}.`
  cost.value = `Limitation: ${quirk}.`

  if (rewardKind.value === 'skill') {
    skillUse.value = effect.value
  }
}

function buildEffectFromKind() {
  const name = title.value.trim() || rewardKindLabel.value

  if (rewardKind.value === 'skill') {
    skillName.value = skillName.value.trim() || name
    effect.value = `The character gains the skill "${skillName.value}", allowing them to attempt special actions using ${linkedStat.value}.`
    skillUse.value =
      skillUse.value.trim() ||
      `Use ${skillName.value} when the character needs to change the scene through training, instinct, or style.`
    cost.value =
      cost.value.trim() ||
      'This skill works best when the character can justify it through roleplay.'
    return
  }

  if (rewardKind.value === 'treasure') {
    effect.value = `${name} can be carried, traded, used, stolen, sacrificed, or revealed at the perfect dramatic moment.`
    cost.value =
      cost.value.trim() ||
      'Its value makes it attractive to enemies, collectors, and terrible friends.'
    return
  }

  if (rewardKind.value === 'permission') {
    effect.value = `${name} unlocks a special scenario choice, hidden dialogue path, restricted location, or alternate solution.`
    cost.value =
      cost.value.trim() ||
      'The permission may be revoked, questioned, forged, or misunderstood.'
    return
  }

  if (rewardKind.value === 'curse') {
    effect.value = `${name} grants a useful benefit while adding a dangerous complication.`
    cost.value =
      cost.value.trim() ||
      'The curse escalates when ignored, overused, or treated like a normal prize.'
    return
  }

  effect.value = `${name} changes what the character can attempt, discover, unlock, or survive.`
  cost.value =
    cost.value.trim() ||
    'The reward should create new options without solving every problem for free.'
}

function buildArtPrompt() {
  const name = title.value.trim() || rewardKindLabel.value
  const visualRole =
    rewardKind.value === 'skill' ? 'skill icon' : 'reward object'

  artPrompt.value = [
    `Create original ${visualRole} art for "${name}".`,
    `Reward type: ${rewardKindLabel.value}.`,
    description.value ? `Description: ${description.value}` : '',
    rewardKind.value === 'treasure' && treasureSummary.value
      ? `Treasure details: ${treasureSummary.value}`
      : '',
    rewardKind.value === 'skill' && skillSummary.value
      ? `Skill details: ${skillSummary.value}`
      : '',
    'Strong silhouette, readable design, expressive magical or narrative function, no text, no watermark.',
  ]
    .filter(Boolean)
    .join(' ')
}

function updateRewardArt(payload: ArtCreatorPayload) {
  artPrompt.value = payload.prompt
  imagePath.value = payload.imagePath
}

async function fetchSelectOptions() {
  await Promise.all([fetchDreams(), fetchCharacters(), fetchScenarios()])
}

async function fetchDreams() {
  try {
    const res = (await performFetch<unknown[]>(
      '/api/dream',
    )) as PerformFetchResult<unknown[]>
    dreamOptions.value = normalizeOptions(res)
  } catch (error) {
    handleError(error, 'fetching dreams for reward-builder')
    dreamOptions.value = []
  }
}

async function fetchCharacters() {
  try {
    const res = (await performFetch<unknown[]>(
      '/api/character',
    )) as PerformFetchResult<unknown[]>
    characterOptions.value = normalizeOptions(res)
  } catch (error) {
    handleError(error, 'fetching characters for reward-builder')
    characterOptions.value = []
  }
}

async function fetchScenarios() {
  try {
    const res = (await performFetch<unknown[]>(
      '/api/scenario',
    )) as PerformFetchResult<unknown[]>
    scenarioOptions.value = normalizeOptions(res)
  } catch (error) {
    handleError(error, 'fetching scenarios for reward-builder')
    scenarioOptions.value = []
  }
}

function normalizeOptions(res: PerformFetchResult<unknown[]>): SelectOption[] {
  if (!res.success || !Array.isArray(res.data)) return []

  return res.data
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const record = item as Record<string, unknown>
      const id = Number(record.id)

      if (!Number.isFinite(id)) return null

      const label =
        stringValue(record.title) ||
        stringValue(record.name) ||
        stringValue(record.label) ||
        `Item #${id}`

      return {
        id,
        label,
      }
    })
    .filter((item): item is SelectOption => Boolean(item))
}

async function saveReward() {
  if (!canSave.value) {
    saveError.value = 'Add a reward title before saving.'
    return
  }

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    const body: Record<string, unknown> = {
      title: title.value.trim(),
      name: title.value.trim(),
      label: title.value.trim(),
      description: fullDescription.value,
      rewardType: rewardKind.value,
      type: rewardKind.value,
      rarity: rarity.value,
      genre: genre.value.trim() || null,
      effect: effect.value.trim() || null,
      cost: cost.value.trim() || null,
      skills: rewardKind.value === 'skill' ? skillSummary.value : null,
      power: rewardKind.value === 'power' ? effect.value.trim() : null,
      secret: rewardKind.value === 'secret' ? effect.value.trim() : null,
      inventory:
        rewardKind.value === 'treasure'
          ? treasureSummary.value
          : rewardKind.value === 'key'
            ? effect.value.trim()
            : null,
      artPrompt: artPrompt.value.trim() || null,
      imagePath: imagePath.value || null,
      userId: userStore.userId || 10,
      isPublic: isPublic.value,
      isMature: isMature.value,
      isActive: isActive.value,
      dreamId: selectedDreamId.value || null,
      characterId: selectedCharacterId.value || null,
      scenarioId: selectedScenarioId.value || null,
      dreamIds: selectedDreamId.value ? [selectedDreamId.value] : [],
      characterIds: selectedCharacterId.value
        ? [selectedCharacterId.value]
        : [],
      scenarioIds: selectedScenarioId.value ? [selectedScenarioId.value] : [],
      metadata: {
        rewardKind: rewardKind.value,
        rarity: rarity.value,
        skillName: skillName.value,
        linkedStat: linkedStat.value,
        skillUse: skillUse.value,
        material: material.value,
        treasureForm: treasureForm.value,
        connectionNotes: connectionNotes.value,
      },
    }

    const res = (await performFetch<Record<string, unknown>>(REWARD_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Record<string, unknown>>

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save reward.')
    }

    const id = Number(res.data.id)
    selectedRewardId.value = Number.isFinite(id) ? id : selectedRewardId.value
    saveMessage.value = selectedRewardId.value
      ? `Saved reward #${selectedRewardId.value}. Tiny prize goblin approved.`
      : 'Reward saved.'
  } catch (error) {
    handleError(error, 'saving reward from reward-builder')
    saveError.value =
      error instanceof Error ? error.message : 'Failed to save reward.'
  } finally {
    isSaving.value = false
  }
}

const fullDescription = computed(() => {
  return [
    description.value.trim(),
    effect.value.trim() ? `Effect: ${effect.value.trim()}` : '',
    cost.value.trim() ? `Cost or limitation: ${cost.value.trim()}` : '',
    rewardKind.value === 'skill' && skillSummary.value
      ? `Skill reward: ${skillSummary.value}`
      : '',
    rewardKind.value === 'treasure' && treasureSummary.value
      ? `Treasure: ${treasureSummary.value}`
      : '',
    connectionNotes.value.trim()
      ? `Connection notes: ${connectionNotes.value.trim()}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
})

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function capitalize(value: string) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function displaySummaryValue(value: BuilderChoiceSummary['value']) {
  if (value === null || value === undefined || value === '') {
    return 'Not selected yet'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return String(value)
}

onMounted(async () => {
  randomStore.initialize()
  await fetchSelectOptions()
})
</script>
