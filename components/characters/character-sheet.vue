<!-- /components/builders/character-sheet.vue -->
<template>
  <section class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-300">
    <header class="flex shrink-0 flex-col gap-3 border-b border-base-300 bg-base-200 p-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Character Sheet
        </p>

        <h2 class="mt-1 flex items-center gap-2 text-2xl font-black text-base-content">
          <Icon name="kind-icon:mask" class="h-7 w-7 text-primary" />
          {{ sheet.name || 'Unnamed Character' }}
        </h2>

        <p class="mt-1 max-w-3xl text-sm text-base-content/70">
          {{ sheetSubtitle }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-if="hasPortrait"
          class="btn rounded-xl"
          type="button"
          @click="showPortrait = !showPortrait"
        >
          <Icon
            :name="showPortrait ? 'kind-icon:blueprint' : 'kind-icon:palette'"
            class="h-4 w-4"
          />
          {{ showPortrait ? 'Show Sheet' : 'Show Portrait' }}
        </button>

        <button
          v-if="isBuilderMode"
          class="btn rounded-xl"
          type="button"
          @click="reshuffleDeck"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Reshuffle
        </button>

        <button
          v-if="isBuilderMode"
          class="btn rounded-xl"
          type="button"
          @click="resetSheet"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          Clear
        </button>

        <button
          v-if="isBuilderMode && allowSave"
          class="btn btn-primary rounded-xl"
          type="button"
          :disabled="isSaving || !canSave"
          @click="saveCharacter"
        >
          <Icon name="kind-icon:save" class="h-4 w-4" />
          {{ isSaving ? 'Saving...' : saveButtonLabel }}
        </button>
      </div>
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Transition name="sheet-fade" mode="out-in">
        <section
          v-if="showPortrait && hasPortrait"
          key="portrait"
          class="relative min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200"
        >
          <img
            :src="sheet.imagePath || ''"
            :alt="`${sheet.name || 'Character'} portrait`"
            class="h-full min-h-[32rem] w-full object-cover"
          />

          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base-300 via-base-300/90 to-transparent p-4 pt-28">
            <article class="rounded-2xl border border-base-100/20 bg-base-100/85 p-4 shadow-xl backdrop-blur">
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                Portrait Mode
              </p>

              <h3 class="mt-1 text-3xl font-black text-base-content">
                {{ sheet.name || 'Unnamed Character' }}
              </h3>

              <p class="mt-1 text-sm text-base-content/70">
                {{ identityLine }}
              </p>

              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="badge in badges"
                  :key="badge"
                  class="badge badge-primary badge-outline rounded-xl"
                >
                  {{ badge }}
                </span>
              </div>

              <button
                class="btn btn-primary mt-4 rounded-xl"
                type="button"
                @click="showPortrait = false"
              >
                <Icon name="kind-icon:blueprint" class="h-4 w-4" />
                Return to Sheet
              </button>
            </article>
          </div>
        </section>

        <section
          v-else
          key="sheet"
          class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div class="grid grid-cols-1 gap-3 2xl:grid-cols-[16rem_minmax(0,1fr)]">
            <aside class="flex flex-col gap-3">
              <article class="rounded-2xl border border-base-300 bg-base-100 p-3">
                <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-300">
                  <img
                    v-if="sheet.imagePath"
                    :src="sheet.imagePath"
                    alt="Character portrait"
                    class="h-full w-full object-cover"
                  />

                  <div
                    v-else
                    class="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center"
                  >
                    <Icon name="kind-icon:mask" class="h-14 w-14 text-primary/70" />

                    <p class="text-sm font-bold text-base-content/70">
                      Portrait Pending
                    </p>

                    <p class="text-xs text-base-content/50">
                      Complete the sheet to unlock portrait creation.
                    </p>
                  </div>
                </div>

                <button
                  v-if="isBuilderMode && allowArt"
                  class="btn btn-sm btn-primary mt-3 w-full rounded-xl"
                  type="button"
                  :disabled="!canCreateArt"
                  @click="selectCardByKey('art')"
                >
                  <Icon name="kind-icon:palette" class="h-4 w-4" />
                  {{ hasPortrait ? 'Edit Portrait' : 'Create Portrait' }}
                </button>
              </article>

              <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <h3 class="flex items-center gap-2 font-black text-base-content">
                  <Icon name="kind-icon:check" class="h-5 w-5 text-primary" />
                  Completion
                </h3>

                <div class="mt-3 flex flex-col gap-2">
                  <button
                    v-for="item in completionItems"
                    :key="item.key"
                    class="flex items-center justify-between gap-2 rounded-xl bg-base-200 px-3 py-2 text-left transition hover:bg-primary/10"
                    type="button"
                    :disabled="!isBuilderMode"
                    @click="selectCardByKey(item.cardKey)"
                  >
                    <span class="text-sm text-base-content/70">
                      {{ item.label }}
                    </span>

                    <Icon
                      :name="item.done ? 'kind-icon:check' : 'kind-icon:circle'"
                      :class="item.done ? 'h-4 w-4 text-success' : 'h-4 w-4 text-base-content/30'"
                    />
                  </button>
                </div>
              </article>

              <article
                v-if="saveMessage || saveError"
                class="rounded-2xl border border-base-300 bg-base-100 p-4"
              >
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
              </article>
            </aside>

            <main class="flex min-w-0 flex-col gap-3">
              <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                      Identity
                    </p>

                    <h3 class="mt-1 text-xl font-black text-base-content">
                      {{ sheet.name || 'Awaiting Name' }}
                    </h3>

                    <p class="mt-1 text-sm text-base-content/70">
                      {{ identityLine }}
                    </p>
                  </div>

                  <button
                    v-if="isBuilderMode && hasIdentityContent"
                    class="btn btn-xs rounded-lg"
                    type="button"
                    @click="clearIdentity"
                  >
                    <Icon name="kind-icon:x" class="h-3 w-3" />
                    Clear
                  </button>
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <sheet-cell
                    label="Name"
                    icon="kind-icon:signature"
                    :value="sheet.name"
                    placeholder="Name card waiting"
                    @clear="clearCard('name')"
                  />

                  <sheet-cell
                    label="Honorific"
                    icon="kind-icon:crown"
                    :value="sheet.honorific"
                    placeholder="adventurer"
                    @clear="clearCard('name')"
                  />

                  <sheet-cell
                    label="Role"
                    icon="kind-icon:mask"
                    :value="sheet.role"
                    placeholder="Role card waiting"
                    @clear="clearCard('role')"
                  />

                  <sheet-cell
                    label="Species"
                    icon="kind-icon:species"
                    :value="sheet.species"
                    placeholder="Origin card waiting"
                    @clear="clearCard('origin')"
                  />

                  <sheet-cell
                    label="Class"
                    icon="kind-icon:sparkles"
                    :value="sheet.characterClass"
                    placeholder="Calling pending"
                    @clear="clearCard('origin')"
                  />

                  <sheet-cell
                    label="Alignment"
                    icon="kind-icon:compass"
                    :value="sheet.alignment"
                    placeholder="Morally loading"
                    @clear="clearCard('origin')"
                  />

                  <sheet-cell
                    label="Gender"
                    icon="kind-icon:person"
                    :value="sheet.genderIdentity"
                    placeholder="Identity card waiting"
                    @clear="clearCard('identity')"
                  />

                  <sheet-cell
                    label="Presentation"
                    icon="kind-icon:eye"
                    :value="sheet.presentation"
                    placeholder="Presentation pending"
                    wide
                    @clear="clearCard('identity')"
                  />
                </div>
              </section>

              <section class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div class="flex min-w-0 flex-col gap-3">
                  <sheet-panel
                    label="Personality"
                    icon="kind-icon:heart"
                    :value="sheet.personality"
                    placeholder="No personality yet. Suspiciously smooth."
                    @clear="clearCard('personality')"
                  />

                  <sheet-panel
                    label="Drive"
                    icon="kind-icon:target"
                    :value="sheet.drive"
                    placeholder="No drive yet. Currently powered by vibes."
                    @clear="clearCard('personality')"
                  />

                  <sheet-panel
                    label="Backstory"
                    icon="kind-icon:story"
                    :value="sheet.backstory"
                    placeholder="No backstory yet. The void is politely waiting."
                    @clear="clearCard('background')"
                  />

                  <sheet-panel
                    label="Achievements"
                    icon="kind-icon:award"
                    :value="sheet.achievements"
                    placeholder="No achievements yet."
                    @clear="clearCard('background')"
                  />

                  <sheet-panel
                    label="Quirks"
                    icon="kind-icon:bug"
                    :value="sheet.quirks"
                    placeholder="No quirks yet. That cannot last."
                    @clear="clearCard('background')"
                  />

                  <sheet-panel
                    label="Art Prompt"
                    icon="kind-icon:palette"
                    :value="sheet.artPrompt"
                    placeholder="Portrait prompt not built yet."
                    @clear="clearCard('art')"
                  />
                </div>

                <aside class="flex flex-col gap-3">
                  <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
                    <div class="flex items-center justify-between gap-3">
                      <h3 class="flex items-center gap-2 font-black text-base-content">
                        <Icon name="kind-icon:activity" class="h-5 w-5 text-primary" />
                        Stats
                      </h3>

                      <button
                        v-if="isBuilderMode && hasStats"
                        class="btn btn-xs rounded-lg"
                        type="button"
                        @click="clearCard('stats')"
                      >
                        <Icon name="kind-icon:x" class="h-3 w-3" />
                        Clear
                      </button>
                    </div>

                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <div
                        v-for="stat in sheet.stats"
                        :key="stat.key"
                        class="rounded-2xl border bg-base-200 p-3"
                        :class="stat.value ? 'border-primary/30' : 'border-dashed border-base-300 opacity-70'"
                      >
                        <p class="truncate text-sm font-bold text-base-content">
                          {{ stat.name || 'Stat' }}
                        </p>

                        <p class="mt-1 text-3xl font-black text-primary">
                          {{ stat.value || '—' }}
                        </p>
                      </div>
                    </div>
                  </article>

                  <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
                    <h3 class="flex items-center gap-2 font-black text-base-content">
                      <Icon name="kind-icon:gift" class="h-5 w-5 text-primary" />
                      Starting Rewards
                    </h3>

                    <div class="mt-3 flex flex-col gap-3">
                      <article
                        v-for="slot in rewardSlots"
                        :key="slot.key"
                        class="group rounded-2xl border bg-base-200 p-3"
                        :class="rewardForSlot(slot.key) ? 'border-base-300' : 'border-dashed border-base-300 opacity-70'"
                      >
                        <div class="flex gap-3">
                          <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300">
                            <img
                              v-if="rewardForSlot(slot.key)?.imagePath"
                              :src="rewardForSlot(slot.key)?.imagePath"
                              :alt="rewardForSlot(slot.key)?.label"
                              class="h-full w-full object-cover"
                            />

                            <Icon
                              v-else
                              :name="rewardForSlot(slot.key)?.icon || slot.icon"
                              class="h-7 w-7 text-primary"
                            />
                          </div>

                          <div class="min-w-0 flex-1">
                            <div class="flex items-start justify-between gap-2">
                              <div class="min-w-0">
                                <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/50">
                                  {{ slot.label }}
                                </p>

                                <p
                                  class="mt-1 font-black"
                                  :class="rewardForSlot(slot.key) ? 'text-base-content' : 'italic text-base-content/40'"
                                >
                                  {{ rewardForSlot(slot.key)?.label || 'Empty reward slot' }}
                                </p>
                              </div>

                              <button
                                v-if="isBuilderMode && rewardForSlot(slot.key)"
                                class="btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100"
                                type="button"
                                @click="clearReward(slot.key)"
                              >
                                <Icon name="kind-icon:x" class="h-3 w-3" />
                              </button>
                            </div>

                            <p
                              class="mt-2 line-clamp-3 text-sm"
                              :class="rewardForSlot(slot.key) ? 'text-base-content/70' : 'italic text-base-content/40'"
                            >
                              {{ rewardForSlot(slot.key)?.power || `${slot.rarityType} ${slot.rewardType}, rarity ${slot.rarity}.` }}
                            </p>
                          </div>
                        </div>
                      </article>
                    </div>
                  </article>
                </aside>
              </section>
            </main>
          </div>
        </section>
      </Transition>
    </div>

    <footer
      v-if="isBuilderMode"
      class="shrink-0 border-t border-base-300 bg-base-200 p-2"
    >
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="card in visibleDeck"
          :key="card.key"
          class="group relative flex min-w-60 max-w-72 shrink-0 items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:bg-primary/10"
          :class="cardButtonClass(card)"
          type="button"
          @click="selectCard(card)"
        >
          <div class="absolute right-3 top-2 text-lg text-primary/30">
            {{ card.flourish }}
          </div>

          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-base-300 group-hover:bg-primary/20">
            <Icon
              :name="card.icon"
              class="h-5 w-5 text-primary"
            />
          </div>

          <div class="min-w-0 pr-5">
            <p class="truncate text-sm font-black text-base-content">
              {{ card.title }}
            </p>

            <p class="line-clamp-2 text-xs text-base-content/60">
              {{ card.prompt }}
            </p>
          </div>
        </button>
      </div>
    </footer>

    <Transition name="modal-pop">
      <div
        v-if="activeCard"
        class="absolute inset-0 z-40 flex items-center justify-center bg-base-300/80 p-3 backdrop-blur"
      >
        <section class="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
          <header class="shrink-0 border-b border-base-300 bg-base-200 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  {{ activeCard.label }}
                </p>

                <h3 class="mt-1 text-2xl font-black text-base-content">
                  {{ activeStep.title }}
                </h3>
              </div>

              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-base-100 text-xl text-primary">
                {{ activeCard.flourish }}
              </div>
            </div>

            <p class="mt-2 text-sm text-base-content/70">
              {{ activeStep.body }}
            </p>

            <div
              v-if="activeCard.steps.length > 1"
              class="mt-3 flex gap-1"
            >
              <span
                v-for="step in activeCard.steps"
                :key="step.key"
                class="h-2 flex-1 rounded-full"
                :class="step.key === activeStep.key ? 'bg-primary' : 'bg-base-300'"
              />
            </div>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto p-4">
            <label
              v-if="activeStep.inputType === 'short'"
              class="form-control"
            >
              <span class="label-text font-bold">{{ activeStep.inputLabel }}</span>

              <input
                v-model="activeValue"
                class="input input-bordered rounded-2xl"
                type="text"
                :placeholder="activeStep.placeholder"
              />
            </label>

            <label
              v-else-if="activeStep.inputType === 'long'"
              class="form-control"
            >
              <span class="label-text font-bold">{{ activeStep.inputLabel }}</span>

              <textarea
                v-model="activeValue"
                class="textarea textarea-bordered min-h-44 rounded-2xl text-base"
                :placeholder="activeStep.placeholder"
              />
            </label>

            <div
              v-else-if="activeStep.inputType === 'stats'"
              class="flex flex-col gap-4"
            >
              <p class="text-sm text-base-content/70">
                Choose a number, then choose a stat. Each value from 1 to 6 can only be used once.
              </p>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="block in statBlocks"
                  :key="block"
                  class="btn rounded-xl"
                  :class="selectedStatBlock === block ? 'btn-primary' : 'btn-outline'"
                  type="button"
                  :disabled="usedDraftStatBlocks.includes(block) && selectedStatBlock !== block"
                  @click="selectedStatBlock = block"
                >
                  {{ block }}
                </button>
              </div>

              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="stat in draftStats"
                  :key="stat.key"
                  class="grid grid-cols-[1fr_4rem] items-center gap-2 rounded-2xl border border-base-300 bg-base-200 p-3 text-left transition hover:border-primary hover:bg-primary/10"
                  type="button"
                  @click="assignSelectedStat(stat.key)"
                >
                  <input
                    v-model="stat.name"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    @click.stop
                  />

                  <span class="flex h-11 items-center justify-center rounded-2xl bg-base-300 text-xl font-black text-primary">
                    {{ stat.value || '—' }}
                  </span>
                </button>
              </div>
            </div>

            <div
              v-else-if="activeStep.inputType === 'reward'"
              class="flex flex-col gap-3"
            >
              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  {{ activeRewardSlot?.label || 'Reward' }}
                </p>

                <p class="mt-1 text-sm text-base-content/70">
                  {{ rewardSlotDescription }}
                </p>
              </div>

              <label class="form-control">
                <span class="label-text font-bold">Reward Name</span>

                <input
                  v-model="stagedReward.label"
                  class="input input-bordered rounded-2xl"
                  type="text"
                  placeholder="Moonlit Counterspell, Apology Dagger..."
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Flavor Text</span>

                <textarea
                  v-model="stagedReward.text"
                  class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
                  placeholder="What this reward is, how it feels, and why the character keeps reaching for it."
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Power</span>

                <textarea
                  v-model="stagedReward.power"
                  class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
                  placeholder="What it does in a scene, challenge, or story moment."
                />
              </label>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label class="form-control">
                  <span class="label-text font-bold">Icon</span>

                  <input
                    v-model="stagedReward.icon"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    placeholder="kind-icon:bolt"
                  />
                </label>

                <label class="form-control">
                  <span class="label-text font-bold">Image Path</span>

                  <input
                    v-model="stagedReward.imagePath"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    placeholder="/images/reward.webp"
                  />
                </label>
              </div>

              <label class="form-control">
                <span class="label-text font-bold">Art Prompt</span>

                <textarea
                  v-model="stagedReward.artPrompt"
                  class="textarea textarea-bordered min-h-24 rounded-2xl text-base"
                  placeholder="Optional image prompt for later reward art."
                />
              </label>
            </div>

            <div
              v-else-if="activeStep.inputType === 'art'"
              class="flex flex-col gap-3"
            >
              <label class="form-control">
                <span class="label-text font-bold">Character Art Prompt</span>

                <textarea
                  v-model="sheet.artPrompt"
                  class="textarea textarea-bordered min-h-36 rounded-2xl text-base"
                  placeholder="Portrait prompt, costume, mood, expression, visual style..."
                />
              </label>

              <art-creator
                v-if="allowArt"
                purpose="character"
                :model-id="selectedCharacterId"
                :model-title="sheet.name"
                :prompt="sheet.artPrompt"
                image-role="portrait"
                @update="updateCharacterArt"
              />
            </div>
          </div>

          <footer class="flex shrink-0 flex-wrap gap-2 border-t border-base-300 bg-base-200 p-4">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="suggestForActiveStep"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Suggest
            </button>

            <button
              v-if="activeStepIndex > 0"
              class="btn rounded-xl"
              type="button"
              @click="goPreviousStep"
            >
              <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
              Back
            </button>

            <button
              v-if="!isLastStep"
              class="btn btn-primary rounded-xl"
              type="button"
              @click="goNextStep"
            >
              <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
              Next
            </button>

            <button
              v-else
              class="btn btn-primary rounded-xl"
              type="button"
              @click="finishActiveCard"
            >
              <Icon name="kind-icon:check" class="h-4 w-4" />
              Add to Sheet
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="cancelActiveCard"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
              Cancel
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import type { Character, Dream, Reward } from '~/prisma/generated/prisma/client'
import { useUserStore } from '@/stores/userStore'
import { useRandomStore } from '@/stores/randomStore'
import { handleError, performFetch } from '@/stores/utils'

export type CharacterSheetMode = 'builder' | 'display' | 'compact'

export type CharacterSheetStat = {
  key: string
  name: string
  value: number
}

export type CharacterSheetReward = {
  slotKey: RewardSlotKey
  label: string
  text: string
  power: string
  collection: string
  rewardType: RewardTypeValue
  rarityType: RewardRarityValue
  rarity: number
  icon: string
  imagePath: string
  artImageId: number | null
  artPrompt: string
  id?: number
}

export type CharacterSheetDraft = {
  id: number | null
  name: string
  honorific: string
  title: string
  role: string
  genre: string
  species: string
  characterClass: string
  alignment: string
  genderIdentity: string
  presentation: string
  personality: string
  drive: string
  backstory: string
  achievements: string
  skills: string
  inventory: string
  quirks: string
  artPrompt: string
  artImageId: number | null
  imagePath: string | null
  userId: number
  designer: string | null
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  stats: CharacterSheetStat[]
  goalStats: CharacterSheetStat[]
  rewards: CharacterSheetReward[]
}

type SelectOption = {
  id: number
  label: string
}

type PromptInputType = 'short' | 'long' | 'stats' | 'reward' | 'art'
type RewardTypeValue = 'SKILL' | 'ITEM'
type RewardRarityValue = 'COMMON' | 'RARE'
type RewardSlotKey = 'common-skill' | 'rare-skill' | 'common-item' | 'rare-item'

type RewardPromptSlot = {
  key: RewardSlotKey
  label: string
  rewardType: RewardTypeValue
  rarityType: RewardRarityValue
  rarity: number
  icon: string
}

type CharacterPromptStep = {
  key: string
  title: string
  body: string
  inputLabel: string
  placeholder: string
  inputType: PromptInputType
  field?: keyof CharacterSheetDraft
}

type CharacterPromptCard = {
  key: string
  label: string
  title: string
  icon: string
  flourish: string
  prompt: string
  required?: boolean
  rewardSlotKey?: RewardSlotKey
  restoresFields: Array<keyof CharacterSheetDraft | RewardSlotKey>
  steps: CharacterPromptStep[]
  unlockWhen?: () => boolean
}

type ArtCreatorPayload = {
  purpose: string
  modelId: number | null
  modelTitle: string
  prompt: string
  negativePrompt?: string
  imageRole: string
  imagePath?: string | null
  artImageId?: number | null
}

type PerformFetchResult<T> = {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
}

type CharacterWithRelations = Partial<Character> &
  Record<string, unknown> & {
    Rewards?: Array<Partial<Reward> & Record<string, unknown>>
  }

const props = withDefaults(
  defineProps<{
    mode?: CharacterSheetMode
    character?: CharacterWithRelations | null
    allowSave?: boolean
    allowArt?: boolean
    startPortrait?: boolean
  }>(),
  {
    mode: 'builder',
    character: null,
    allowSave: true,
    allowArt: true,
    startPortrait: false,
  },
)

const emit = defineEmits<{
  saved: [character: Character]
  updated: [sheet: CharacterSheetDraft]
}>()

const CHARACTER_ENDPOINT = '/api/character'
const REWARD_ENDPOINT = '/api/reward'

const userStore = useUserStore()
const randomStore = useRandomStore()

const selectedCharacterId = ref<number | null>(null)
const selectedDreamId = ref(0)
const dreamOptions = ref<SelectOption[]>([])
const showPortrait = ref(props.startPortrait)

const activeCard = ref<CharacterPromptCard | null>(null)
const activeStepIndex = ref(0)
const activeValue = ref('')
const selectedStatBlock = ref<number | null>(null)
const stagedValues = reactive<Record<string, string>>({})
const draftStats = reactive<CharacterSheetStat[]>([])
const completedCards = reactive<Record<string, boolean>>({})

const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const statBlocks = [1, 2, 3, 4, 5, 6]

const rewardSlots: RewardPromptSlot[] = [
  {
    key: 'common-skill',
    label: 'Common Skill',
    rewardType: 'SKILL',
    rarityType: 'COMMON',
    rarity: 1,
    icon: 'kind-icon:bolt',
  },
  {
    key: 'rare-skill',
    label: 'Rare Skill',
    rewardType: 'SKILL',
    rarityType: 'RARE',
    rarity: 3,
    icon: 'kind-icon:comet',
  },
  {
    key: 'common-item',
    label: 'Common Item',
    rewardType: 'ITEM',
    rarityType: 'COMMON',
    rarity: 1,
    icon: 'kind-icon:backpack',
  },
  {
    key: 'rare-item',
    label: 'Rare Item',
    rewardType: 'ITEM',
    rarityType: 'RARE',
    rarity: 3,
    icon: 'kind-icon:gem',
  },
]

const stagedReward = reactive<CharacterSheetReward>(createEmptyRewardDraft(rewardSlots[0]))

const sheet = reactive<CharacterSheetDraft>({
  id: null,
  name: '',
  honorific: 'adventurer',
  title: '',
  role: '',
  genre: '',
  species: '',
  characterClass: '',
  alignment: '',
  genderIdentity: '',
  presentation: '',
  personality: '',
  drive: '',
  backstory: '',
  achievements: '',
  skills: '',
  inventory: '',
  quirks: '',
  artPrompt: '',
  artImageId: null,
  imagePath: null,
  userId: 10,
  designer: null,
  isPublic: true,
  isMature: false,
  isActive: true,
  stats: defaultStats(),
  goalStats: defaultGoalStats(),
  rewards: [],
})

const isBuilderMode = computed(() => props.mode !== 'display')
const allowSave = computed(() => props.allowSave)
const allowArt = computed(() => props.allowArt)

const hasPortrait = computed(() => Boolean(sheet.imagePath || sheet.artImageId))

const identityLine = computed(() => {
  return [
    sheet.honorific || 'adventurer',
    sheet.species || 'unknown species',
    sheet.characterClass || 'unclassed',
    sheet.role || 'plot-adjacent citizen',
  ].join(' · ')
})

const badges = computed(() => {
  return [
    sheet.genre,
    sheet.genderIdentity,
    sheet.presentation,
    sheet.alignment,
  ].filter(Boolean)
})

const sheetSubtitle = computed(() => {
  if (props.mode === 'display') return identityLine.value
  if (canSave.value) return 'The sheet is complete. Create a portrait, save the character, or keep tinkering.'
  return 'Choose prompt cards to fill the sheet. Completed sections can be cleared to restore their cards.'
})

const saveButtonLabel = computed(() => {
  return selectedCharacterId.value ? 'Update Character' : 'Save Character'
})

const hasIdentityContent = computed(() => {
  return Boolean(
    sheet.name ||
      sheet.honorific !== 'adventurer' ||
      sheet.role ||
      sheet.species ||
      sheet.characterClass ||
      sheet.alignment ||
      sheet.genderIdentity ||
      sheet.presentation,
  )
})

const hasStats = computed(() => {
  return sheet.stats.some((stat) => stat.value > 0)
})

const promptCards = computed<CharacterPromptCard[]>(() => [
  {
    key: 'role',
    label: 'Story Role',
    title: 'Choose their role',
    icon: 'kind-icon:mask',
    flourish: '⚜',
    prompt: 'Decide what job they serve in the story, even if they immediately swerve out of it.',
    required: true,
    restoresFields: ['role', 'genre'],
    steps: [
      {
        key: 'role',
        title: 'Story Role',
        body: 'Are they a hero, rival, guide, menace, merchant, villain, or beautifully suspicious side character?',
        inputLabel: 'Character Role',
        placeholder: 'Companion, rival, guide, villain, quest giver...',
        inputType: 'short',
        field: 'role',
      },
      {
        key: 'genre',
        title: 'Genre Flavor',
        body: 'Give the character a genre or vibe. This helps the portrait and backstory stay on target.',
        inputLabel: 'Genre',
        placeholder: 'Gothic comedy, mythic sci-fi, cozy horror...',
        inputType: 'short',
        field: 'genre',
      },
    ],
  },
  {
    key: 'name',
    label: 'Name',
    title: 'Name the troublemaker',
    icon: 'kind-icon:signature',
    flourish: '✒',
    prompt: 'Give them a name with history, bad timing, and excellent lighting.',
    required: true,
    restoresFields: ['name', 'honorific', 'title'],
    steps: [
      {
        key: 'name',
        title: 'Name',
        body: 'Name the character like they already owe someone a dramatic apology.',
        inputLabel: 'Name',
        placeholder: 'Mira Voss, Buttonwick, Saint Crumble...',
        inputType: 'short',
        field: 'name',
      },
      {
        key: 'honorific',
        title: 'Honorific',
        body: 'Give them a title, address, or tiny social costume.',
        inputLabel: 'Honorific',
        placeholder: 'adventurer, captain, oracle, auntie...',
        inputType: 'short',
        field: 'honorific',
      },
      {
        key: 'title',
        title: 'Title',
        body: 'Optional: add a formal title, rumor-name, or dramatic billing.',
        inputLabel: 'Title',
        placeholder: 'The Lantern of Wrong Tuesdays...',
        inputType: 'short',
        field: 'title',
      },
    ],
  },
  {
    key: 'origin',
    label: 'Origin',
    title: 'Choose species and calling',
    icon: 'kind-icon:species',
    flourish: '❦',
    prompt: 'What are they, and what do they do when destiny starts knocking on the furniture?',
    required: true,
    restoresFields: ['species', 'characterClass', 'alignment'],
    steps: [
      {
        key: 'species',
        title: 'Species',
        body: 'Pick their people, species, origin, or technically complicated biology.',
        inputLabel: 'Species',
        placeholder: 'Human, goblin, ghost, moon-moth, clockwork saint...',
        inputType: 'short',
        field: 'species',
      },
      {
        key: 'characterClass',
        title: 'Class',
        body: 'Give them a class, job, archetype, or suspiciously specific life function.',
        inputLabel: 'Class',
        placeholder: 'Oracle, rogue, plague baker, haunted accountant...',
        inputType: 'short',
        field: 'characterClass',
      },
      {
        key: 'alignment',
        title: 'Alignment',
        body: 'Choose their moral weather. It does not need to be official. It should be useful.',
        inputLabel: 'Alignment',
        placeholder: 'Chaotic Helpful, Lawful Petty, Neutral Dramatic...',
        inputType: 'short',
        field: 'alignment',
      },
    ],
  },
  {
    key: 'identity',
    label: 'Identity',
    title: 'Choose gender and presentation',
    icon: 'kind-icon:person',
    flourish: '☾',
    prompt: 'How do they move through the world? Pick identity, presentation, and first impressions.',
    required: true,
    restoresFields: ['genderIdentity', 'presentation'],
    steps: [
      {
        key: 'genderIdentity',
        title: 'Gender Identity',
        body: 'Choose their gender identity. Keep it direct, respectful, and character-specific.',
        inputLabel: 'Gender Identity',
        placeholder: 'Woman, man, nonbinary, agender, unknown, fluid...',
        inputType: 'short',
        field: 'genderIdentity',
      },
      {
        key: 'presentation',
        title: 'Presentation',
        body: 'How do they present themselves visually and socially?',
        inputLabel: 'Presentation',
        placeholder: 'Glamorous, practical, masked, ceremonial, severe...',
        inputType: 'long',
        field: 'presentation',
      },
    ],
  },
  {
    key: 'personality',
    label: 'Personality',
    title: 'Give them a social operating system',
    icon: 'kind-icon:heart',
    flourish: '✦',
    prompt: 'How do they talk, panic, charm, lie, sulk, flirt with danger, and avoid lessons?',
    required: true,
    restoresFields: ['personality', 'drive'],
    steps: [
      {
        key: 'personality',
        title: 'Personality',
        body: 'Describe how they behave when the plot starts chewing on the furniture.',
        inputLabel: 'Personality',
        placeholder: 'Warm but evasive. Brave until paperwork appears...',
        inputType: 'long',
        field: 'personality',
      },
      {
        key: 'drive',
        title: 'Drive',
        body: 'What do they want badly enough to make a questionable decision?',
        inputLabel: 'Drive',
        placeholder: 'To recover a lost name, protect a sibling, overthrow brunch...',
        inputType: 'long',
        field: 'drive',
      },
    ],
  },
  {
    key: 'stats',
    label: 'Stats',
    title: 'Arrange their strengths',
    icon: 'kind-icon:activity',
    flourish: '♛',
    prompt: 'Place 1 through 6 onto their stats. One tiny number. One heroic number.',
    required: true,
    restoresFields: ['stats'],
    steps: [
      {
        key: 'stats',
        title: 'Stats',
        body: 'Allocate 1, 2, 3, 4, 5, and 6 across the six stat slots. Each number can only be used once.',
        inputLabel: 'Stats',
        placeholder: '',
        inputType: 'stats',
      },
    ],
  },
  {
    key: 'background',
    label: 'Backstory',
    title: 'Reveal the glorious problem',
    icon: 'kind-icon:story',
    flourish: '§',
    prompt: 'What happened to them, what do they want, and what emotional furniture are they tripping over?',
    required: true,
    restoresFields: ['backstory', 'achievements', 'quirks'],
    steps: [
      {
        key: 'backstory',
        title: 'Backstory',
        body: 'Write the backstory. Include desire, trouble, history, and one excellent emotional bruise.',
        inputLabel: 'Backstory',
        placeholder: 'They were raised by...',
        inputType: 'long',
        field: 'backstory',
      },
      {
        key: 'achievements',
        title: 'Achievements',
        body: 'Add accomplishments, rumors, failures they keep rebranding, or titles earned the hard way.',
        inputLabel: 'Achievements',
        placeholder: 'Defeated the Tax Hydra, survived brunch with ghosts...',
        inputType: 'long',
        field: 'achievements',
      },
      {
        key: 'quirks',
        title: 'Quirks',
        body: 'Give them memorable habits. These are the details players quote later.',
        inputLabel: 'Quirks',
        placeholder: 'Apologizes to doors. Collects doomed spoons...',
        inputType: 'long',
        field: 'quirks',
      },
    ],
  },
  {
    key: 'common-skill',
    label: 'Common Skill',
    title: 'Choose a reliable trick',
    icon: 'kind-icon:bolt',
    flourish: '✧',
    prompt: 'A practical skill they can use often. Useful, flavorful, not universe-breaking.',
    required: true,
    rewardSlotKey: 'common-skill',
    restoresFields: ['common-skill'],
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'common-skill',
        title: 'Common Skill',
        body: 'Create a Reward with type SKILL and rarity COMMON.',
        inputLabel: 'Common Skill',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'rare-skill',
    label: 'Rare Skill',
    title: 'Choose their signature move',
    icon: 'kind-icon:comet',
    flourish: '✶',
    prompt: 'One rare skill that feels special. The table should say, wait, you can do WHAT?',
    required: true,
    rewardSlotKey: 'rare-skill',
    restoresFields: ['rare-skill'],
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'rare-skill',
        title: 'Rare Skill',
        body: 'Create a Reward with type SKILL and rarity RARE.',
        inputLabel: 'Rare Skill',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'common-item',
    label: 'Common Item',
    title: 'Pack a useful item',
    icon: 'kind-icon:backpack',
    flourish: '◆',
    prompt: 'An everyday item with personality. Useful tools are better when mildly cursed.',
    required: true,
    rewardSlotKey: 'common-item',
    restoresFields: ['common-item'],
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'common-item',
        title: 'Common Item',
        body: 'Create a Reward with type ITEM and rarity COMMON.',
        inputLabel: 'Common Item',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'rare-item',
    label: 'Rare Item',
    title: 'Claim a strange treasure',
    icon: 'kind-icon:gem',
    flourish: '❖',
    prompt: 'A rare item with story gravity. Loot, leverage, or a terrible idea with excellent branding.',
    required: true,
    rewardSlotKey: 'rare-item',
    restoresFields: ['rare-item'],
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'rare-item',
        title: 'Rare Item',
        body: 'Create a Reward with type ITEM and rarity RARE.',
        inputLabel: 'Rare Item',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'art',
    label: 'Portrait',
    title: 'Create their portrait',
    icon: 'kind-icon:palette',
    flourish: '▣',
    prompt: 'Turn the sheet into a portrait prompt. Costume, expression, silhouette, mood, and drama.',
    restoresFields: ['artPrompt', 'imagePath', 'artImageId'],
    unlockWhen: () => canCreateArt.value,
    steps: [
      {
        key: 'art',
        title: 'Portrait Prompt',
        body: 'Build the visual prompt, then generate or select art for this character.',
        inputLabel: 'Art Prompt',
        placeholder: '',
        inputType: 'art',
      },
    ],
  },
])

const visibleDeck = computed(() => {
  return promptCards.value.filter((card) => {
    if (card.unlockWhen && !card.unlockWhen()) return false
    return !completedCards[card.key] || card.key === 'art'
  })
})

const activeStep = computed(() => {
  return activeCard.value?.steps[activeStepIndex.value] ?? emptyStep
})

const isLastStep = computed(() => {
  if (!activeCard.value) return true
  return activeStepIndex.value >= activeCard.value.steps.length - 1
})

const activeRewardSlot = computed(() => {
  if (!activeCard.value?.rewardSlotKey) return null
  return rewardSlots.find((slot) => slot.key === activeCard.value?.rewardSlotKey) ?? null
})

const rewardSlotDescription = computed(() => {
  if (!activeRewardSlot.value) return 'Create a reward.'
  return `${activeRewardSlot.value.rarityType} ${activeRewardSlot.value.rewardType}, rarity ${activeRewardSlot.value.rarity}.`
})

const usedDraftStatBlocks = computed(() => {
  return draftStats
    .map((stat) => stat.value)
    .filter((value) => statBlocks.includes(value))
})

const canChooseRewards = computed(() => {
  return ['role', 'name', 'origin', 'identity', 'personality', 'stats', 'background'].every((key) => completedCards[key])
})

const canCreateArt = computed(() => {
  return [
    'role',
    'name',
    'origin',
    'identity',
    'personality',
    'stats',
    'background',
    'common-skill',
    'rare-skill',
    'common-item',
    'rare-item',
  ].every((key) => completedCards[key])
})

const canSave = computed(() => {
  return Boolean(sheet.name.trim()) && canCreateArt.value
})

const completionItems = computed(() => [
  {
    key: 'role',
    cardKey: 'role',
    label: 'Role',
    done: Boolean(sheet.role.trim()),
  },
  {
    key: 'name',
    cardKey: 'name',
    label: 'Name',
    done: Boolean(sheet.name.trim()),
  },
  {
    key: 'origin',
    cardKey: 'origin',
    label: 'Origin',
    done: Boolean(sheet.species.trim() && sheet.characterClass.trim()),
  },
  {
    key: 'identity',
    cardKey: 'identity',
    label: 'Identity',
    done: Boolean(sheet.genderIdentity.trim() || sheet.presentation.trim()),
  },
  {
    key: 'personality',
    cardKey: 'personality',
    label: 'Personality',
    done: Boolean(sheet.personality.trim()),
  },
  {
    key: 'stats',
    cardKey: 'stats',
    label: 'Stats',
    done: sheet.stats.every((stat) => stat.value >= 1 && stat.value <= 6),
  },
  {
    key: 'background',
    cardKey: 'background',
    label: 'Backstory',
    done: Boolean(sheet.backstory.trim()),
  },
  {
    key: 'rewards',
    cardKey: 'common-skill',
    label: 'Rewards',
    done: rewardSlots.every((slot) => Boolean(rewardForSlot(slot.key))),
  },
  {
    key: 'portrait',
    cardKey: 'art',
    label: 'Portrait',
    done: Boolean(sheet.artPrompt.trim() || sheet.imagePath || sheet.artImageId),
  },
])

const emptyStep: CharacterPromptStep = {
  key: 'empty',
  title: '',
  body: '',
  inputLabel: '',
  placeholder: '',
  inputType: 'short',
}

const SheetCell = defineComponent({
  name: 'SheetCell',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    value: { type: String, default: '' },
    placeholder: { type: String, required: true },
    wide: { type: Boolean, default: false },
  },
  emits: ['clear'],
  setup(componentProps, { emit: componentEmit }) {
    return () =>
      h(
        'article',
        {
          class: [
            'group rounded-2xl border bg-base-200 p-3 transition',
            componentProps.value ? 'border-base-300' : 'border-dashed border-base-300 opacity-70',
            componentProps.wide ? 'md:col-span-2' : '',
          ],
        },
        [
          h('div', { class: 'flex items-start justify-between gap-2' }, [
            h('div', { class: 'min-w-0' }, [
              h('p', { class: 'flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-base-content/50' }, [
                h('Icon', { name: componentProps.icon, class: 'h-4 w-4 text-primary' }),
                componentProps.label,
              ]),
              h(
                'p',
                {
                  class: [
                    'mt-2 whitespace-pre-wrap text-sm',
                    componentProps.value ? 'font-semibold text-base-content' : 'italic text-base-content/40',
                  ],
                },
                componentProps.value || componentProps.placeholder,
              ),
            ]),
            componentProps.value
              ? h(
                  'button',
                  {
                    class: 'btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100',
                    type: 'button',
                    onClick: () => componentEmit('clear'),
                  },
                  [h('Icon', { name: 'kind-icon:x', class: 'h-3 w-3' })],
                )
              : null,
          ]),
        ],
      )
  },
})

const SheetPanel = defineComponent({
  name: 'SheetPanel',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    value: { type: String, default: '' },
    placeholder: { type: String, required: true },
  },
  emits: ['clear'],
  setup(componentProps, { emit: componentEmit }) {
    return () =>
      h(
        'article',
        {
          class: [
            'group rounded-2xl border bg-base-100 p-4 transition',
            componentProps.value ? 'border-base-300' : 'border-dashed border-base-300 opacity-70',
          ],
        },
        [
          h('div', { class: 'flex items-start justify-between gap-3' }, [
            h('h3', { class: 'flex items-center gap-2 font-black text-base-content' }, [
              h('Icon', { name: componentProps.icon, class: 'h-5 w-5 text-primary' }),
              componentProps.label,
            ]),
            componentProps.value
              ? h(
                  'button',
                  {
                    class: 'btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100',
                    type: 'button',
                    onClick: () => componentEmit('clear'),
                  },
                  [
                    h('Icon', { name: 'kind-icon:x', class: 'h-3 w-3' }),
                    'Clear',
                  ],
                )
              : null,
          ]),
          h(
            'p',
            {
              class: [
                'mt-3 whitespace-pre-wrap text-sm leading-relaxed',
                componentProps.value ? 'text-base-content/75' : 'italic text-base-content/40',
              ],
            },
            componentProps.value || componentProps.placeholder,
          ),
        ],
      )
  },
})

function selectCardByKey(key: string) {
  const card = promptCards.value.find((item) => item.key === key)
  if (card && (!card.unlockWhen || card.unlockWhen())) selectCard(card)
}

function selectCard(card: CharacterPromptCard) {
  activeCard.value = card
  activeStepIndex.value = 0
  selectedStatBlock.value = null
  resetStaging()
  prepareCardStage(card)
  loadActiveStepValue()
}

function prepareCardStage(card: CharacterPromptCard) {
  for (const step of card.steps) {
    if (step.field && typeof sheet[step.field] === 'string') {
      stagedValues[step.key] = String(sheet[step.field] || '')
    }
  }

  if (card.key === 'stats') {
    resetStatRows(draftStats, sheet.stats.map((stat) => ({ ...stat })))
  }

  if (card.rewardSlotKey) {
    const slot = rewardSlots.find((item) => item.key === card.rewardSlotKey)
    const existing = sheet.rewards.find((reward) => reward.slotKey === card.rewardSlotKey)

    if (existing) {
      Object.assign(stagedReward, existing)
    } else if (slot) {
      Object.assign(stagedReward, createEmptyRewardDraft(slot))
    }
  }

  if (card.key === 'art') {
    buildArtPrompt()
  }
}

function loadActiveStepValue() {
  activeValue.value = stagedValues[activeStep.value.key] || ''
}

function commitActiveStepValue() {
  if (activeStep.value.inputType !== 'short' && activeStep.value.inputType !== 'long') return
  stagedValues[activeStep.value.key] = activeValue.value.trim()
}

function goNextStep() {
  commitActiveStepValue()

  if (!activeCard.value) return
  if (activeStepIndex.value >= activeCard.value.steps.length - 1) return

  activeStepIndex.value += 1
  loadActiveStepValue()
}

function goPreviousStep() {
  commitActiveStepValue()

  if (activeStepIndex.value <= 0) return

  activeStepIndex.value -= 1
  loadActiveStepValue()
}

function finishActiveCard() {
  commitActiveStepValue()

  if (!activeCard.value) return

  if (activeCard.value.key === 'stats') {
    if (!isStatAllocationComplete()) {
      saveError.value = 'Assign each stat a unique value from 1 to 6 before adding it to the sheet.'
      return
    }

    resetStatRows(sheet.stats, draftStats.map((stat) => ({ ...stat })))
    completeCard('stats')
    closeCardAndChooseNext()
    return
  }

  if (activeCard.value.rewardSlotKey) {
    commitRewardCard(activeCard.value.rewardSlotKey)
    completeCard(activeCard.value.key)
    closeCardAndChooseNext()
    return
  }

  if (activeCard.value.key === 'art') {
    completeCard('art')
    closeCardAndChooseNext()
    return
  }

  for (const step of activeCard.value.steps) {
    if (!step.field) continue
    if (typeof sheet[step.field] !== 'string') continue
    ;(sheet[step.field] as string) = stagedValues[step.key] || ''
  }

  completeCard(activeCard.value.key)
  buildArtPrompt()
  closeCardAndChooseNext()
}

function cancelActiveCard() {
  activeCard.value = null
  activeStepIndex.value = 0
  activeValue.value = ''
  selectedStatBlock.value = null
  resetStaging()
}

function closeCardAndChooseNext() {
  const previousKey = activeCard.value?.key
  activeCard.value = null
  activeStepIndex.value = 0
  activeValue.value = ''
  selectedStatBlock.value = null
  resetStaging()

  const next = visibleDeck.value.find((card) => card.key !== previousKey) || null
  if (next) selectCard(next)

  emit('updated', sheet)
}

function completeCard(key: string) {
  completedCards[key] = true
  saveError.value = ''
}

function clearCard(key: string) {
  const card = promptCards.value.find((item) => item.key === key)
  if (!card) return

  for (const field of card.restoresFields) {
    if (isRewardSlotKey(field)) {
      clearReward(field)
      continue
    }

    clearField(field)
  }

  completedCards[key] = false

  if (activeCard.value?.key === key) {
    cancelActiveCard()
  }
}

function clearIdentity() {
  clearCard('role')
  clearCard('name')
  clearCard('origin')
  clearCard('identity')
}

function clearReward(slotKey: RewardSlotKey) {
  const index = sheet.rewards.findIndex((reward) => reward.slotKey === slotKey)
  if (index >= 0) sheet.rewards.splice(index, 1)
  completedCards[slotKey] = false
}

function clearField(field: keyof CharacterSheetDraft) {
  if (field === 'stats') {
    resetStatRows(sheet.stats, defaultEmptyStats())
    return
  }

  if (field === 'goalStats') {
    resetStatRows(sheet.goalStats, defaultGoalStats())
    return
  }

  if (field === 'rewards') {
    sheet.rewards.splice(0, sheet.rewards.length)
    return
  }

  if (field === 'imagePath') {
    sheet.imagePath = null
    return
  }

  if (field === 'artImageId') {
    sheet.artImageId = null
    return
  }

  if (field === 'id') {
    sheet.id = null
    return
  }

  if (field === 'userId') {
    sheet.userId = userStore.userId || 10
    return
  }

  if (field === 'isPublic') {
    sheet.isPublic = true
    return
  }

  if (field === 'isMature') {
    sheet.isMature = false
    return
  }

  if (field === 'isActive') {
    sheet.isActive = true
    return
  }

  if (typeof sheet[field] === 'string') {
    ;(sheet[field] as string) = field === 'honorific' ? 'adventurer' : ''
  }
}

function reshuffleDeck() {
  const available = [...visibleDeck.value]
  const next = available[Math.floor(Math.random() * available.length)] || null
  if (next) selectCard(next)
}

function suggestForActiveStep() {
  if (!activeCard.value) return

  const stepKey = activeStep.value.key
  const cardKey = activeCard.value.key

  if (stepKey === 'role') activeValue.value = rollFrom('role', 'companion')
  else if (stepKey === 'genre') activeValue.value = rollFrom('genre', 'gothic comedy')
  else if (stepKey === 'name') activeValue.value = rollFrom('name', 'Mira Voss')
  else if (stepKey === 'honorific') activeValue.value = rollFrom('honorific', 'adventurer')
  else if (stepKey === 'title') activeValue.value = rollFrom('title', 'The Lantern of Wrong Tuesdays')
  else if (stepKey === 'species') activeValue.value = rollFrom('species', 'Moon-Moth Human')
  else if (stepKey === 'characterClass') activeValue.value = rollFrom('class', 'Oracle')
  else if (stepKey === 'alignment') activeValue.value = `${rollFrom('adjective', 'Chaotic')} ${rollFrom('personality', 'Helpful')}`
  else if (stepKey === 'genderIdentity') activeValue.value = rollFrom('gender', 'unknown')
  else if (stepKey === 'presentation') activeValue.value = rollFrom('presentation', 'ceremonial and slightly dangerous')
  else if (stepKey === 'personality') activeValue.value = rollFrom('personality', 'Warm, theatrical, and allergic to simple answers.')
  else if (stepKey === 'drive') activeValue.value = rollFrom('drive', 'to recover something everyone else insists was never lost')
  else if (stepKey === 'backstory') activeValue.value = buildBackstoryText()
  else if (stepKey === 'achievements') activeValue.value = rollFrom('achievement', 'Survived a duel with a polite ghost.')
  else if (stepKey === 'quirks') activeValue.value = [rollFrom('quirk', 'apologizes to furniture'), rollFrom('quirk', 'counts exits before compliments')].join(', ')
  else if (activeStep.value.inputType === 'stats') rollStats()
  else if (activeStep.value.inputType === 'reward') rollReward(cardKey)
  else if (activeStep.value.inputType === 'art') buildArtPrompt()
}

function assignSelectedStat(statKey: string) {
  if (!selectedStatBlock.value) return

  const target = draftStats.find((stat) => stat.key === statKey)
  if (!target) return

  for (const stat of draftStats) {
    if (stat.key !== statKey && stat.value === selectedStatBlock.value) {
      stat.value = 0
    }
  }

  target.value = selectedStatBlock.value
  selectedStatBlock.value = null
}

function isStatAllocationComplete() {
  const values = draftStats.map((stat) => stat.value).sort((a, b) => a - b)
  return values.join(',') === statBlocks.join(',')
}

function rollStats() {
  const shuffled = [...statBlocks].sort(() => Math.random() - 0.5)

  draftStats.forEach((stat, index) => {
    stat.value = shuffled[index] ?? 0
  })
}

function commitRewardCard(slotKey: RewardSlotKey) {
  const slot = rewardSlots.find((item) => item.key === slotKey)
  if (!slot) return

  const reward: CharacterSheetReward = {
    slotKey,
    label: stagedReward.label.trim() || slot.label,
    text: stagedReward.text.trim() || `${slot.label} for ${sheet.name || 'this character'}.`,
    power: stagedReward.power.trim() || 'Provides a useful advantage when the story calls for it.',
    collection: 'starting-character-reward',
    rewardType: slot.rewardType,
    rarityType: slot.rarityType,
    rarity: slot.rarity,
    icon: stagedReward.icon.trim() || slot.icon,
    imagePath: stagedReward.imagePath.trim(),
    artImageId: stagedReward.artImageId,
    artPrompt: stagedReward.artPrompt.trim(),
    id: stagedReward.id,
  }

  const index = sheet.rewards.findIndex((item) => item.slotKey === slotKey)

  if (index >= 0) {
    sheet.rewards.splice(index, 1, reward)
  } else {
    sheet.rewards.push(reward)
  }
}

function rollReward(cardKey: string) {
  if (!isRewardSlotKey(cardKey)) return

  const slot = rewardSlots.find((item) => item.key === cardKey)
  if (!slot) return

  const fallbackLabel =
    slot.rewardType === 'SKILL'
      ? slot.rarityType === 'RARE'
        ? 'Moonlit Counterspell'
        : 'Pocket Sand Theology'
      : slot.rarityType === 'RARE'
        ? 'The Apology Dagger'
        : 'Emergency Biscuit Tin'

  stagedReward.label = rollFrom('reward', fallbackLabel)
  stagedReward.text =
    slot.rewardType === 'SKILL'
      ? `A ${slot.rarityType.toLowerCase()} skill that lets ${sheet.name || 'this character'} turn pressure into possibility.`
      : `A ${slot.rarityType.toLowerCase()} item with practical use and suspicious narrative gravity.`
  stagedReward.power =
    slot.rewardType === 'SKILL'
      ? 'Gain an advantage when this skill directly applies to a risky scene.'
      : 'Use this item to solve, complicate, or dramatically reframe a scene.'
  stagedReward.icon = slot.icon
  stagedReward.artPrompt = buildRewardArtPrompt(slot, stagedReward.label)
}

function buildBackstoryText() {
  return [
    stagedValues.name || sheet.name ? `${stagedValues.name || sheet.name} is ${articleFor(stagedValues.species || sheet.species)} ${stagedValues.species || sheet.species || 'mysterious being'}.` : '',
    stagedValues.characterClass || sheet.characterClass ? `They are known as a ${stagedValues.characterClass || sheet.characterClass}.` : '',
    stagedValues.role || sheet.role ? `Their role in the story is ${stagedValues.role || sheet.role}.` : '',
    stagedValues.drive || sheet.drive ? `They want ${stagedValues.drive || sheet.drive}.` : '',
    stagedValues.personality || sheet.personality ? `Personality: ${stagedValues.personality || sheet.personality}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildArtPrompt() {
  const rewardText = sheet.rewards
    .map((reward) => `${reward.rarityType.toLowerCase()} ${reward.rewardType.toLowerCase()}: ${reward.label}`)
    .join(', ')

  sheet.artPrompt = [
    `Character portrait of ${sheet.name || 'an unnamed character'}`,
    sheet.species,
    sheet.characterClass,
    sheet.presentation,
    sheet.personality,
    sheet.genre,
    rewardText ? `starting rewards: ${rewardText}` : '',
    sheet.backstory ? `story context: ${sheet.backstory}` : '',
    'expressive face, strong silhouette, detailed costume, vivid narrative design',
  ]
    .filter(Boolean)
    .join(', ')
}

function buildRewardArtPrompt(slot: RewardPromptSlot, label: string) {
  return [
    `${slot.rarityType.toLowerCase()} ${slot.rewardType.toLowerCase()} reward`,
    label,
    'iconic fantasy game asset',
    'clear silhouette',
    'ornate but readable',
    'transparent background friendly',
  ].join(', ')
}

function updateCharacterArt(payload: ArtCreatorPayload) {
  sheet.artPrompt = payload.prompt || sheet.artPrompt
  sheet.imagePath = payload.imagePath || sheet.imagePath
  sheet.artImageId = payload.artImageId || sheet.artImageId
  completedCards.art = Boolean(sheet.artPrompt.trim() || sheet.imagePath || sheet.artImageId)
  showPortrait.value = Boolean(sheet.imagePath || sheet.artImageId)
}

async function saveCharacter() {
  if (!canSave.value) {
    saveError.value = 'Finish identity, stats, background, and all four reward cards before saving.'
    return
  }

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    const savedRewards = await saveRewardDrafts()

    const body: Record<string, unknown> = {
      name: sheet.name.trim(),
      honorific: sheet.honorific.trim() || 'adventurer',
      title: sheet.title.trim() || null,
      role: sheet.role.trim() || null,
      genderIdentity: sheet.genderIdentity.trim() || null,
      presentation: sheet.presentation.trim() || null,
      achievements: sheet.achievements.trim() || null,
      alignment: sheet.alignment.trim() || null,
      experience: 0,
      level: 1,
      class: sheet.characterClass.trim() || null,
      species: sheet.species.trim() || null,
      backstory: sheet.backstory.trim() || null,
      drive: sheet.drive.trim() || null,
      inventory: rewardInventoryText(),
      quirks: sheet.quirks.trim() || null,
      skills: rewardSkillText(),
      genre: sheet.genre.trim() || null,
      personality: sheet.personality.trim() || null,
      artPrompt: sheet.artPrompt.trim() || null,
      artImageId: sheet.artImageId || null,
      imagePath: sheet.imagePath || null,
      userId: sheet.userId || userStore.userId || 10,
      designer: sheet.designer || getDesignerName(),
      isPublic: sheet.isPublic,
      isMature: sheet.isMature,
      isActive: sheet.isActive,
      rewardIds: savedRewards.map((reward) => reward.id).filter(Boolean),
      statName1: sheet.stats[0]?.name || 'Luck',
      statValue1: sheet.stats[0]?.value ?? 0,
      statName2: sheet.stats[1]?.name || 'Swol',
      statValue2: sheet.stats[1]?.value ?? 0,
      statName3: sheet.stats[2]?.name || 'Wits',
      statValue3: sheet.stats[2]?.value ?? 0,
      statName4: sheet.stats[3]?.name || 'Flexibility',
      statValue4: sheet.stats[3]?.value ?? 0,
      statName5: sheet.stats[4]?.name || 'Rizz',
      statValue5: sheet.stats[4]?.value ?? 0,
      statName6: sheet.stats[5]?.name || 'Empathy',
      statValue6: sheet.stats[5]?.value ?? 0,
      goalStat1Name: sheet.goalStats[0]?.name || 'Principled|Chaotic',
      goalStat1Value: sheet.goalStats[0]?.value ?? 0,
      goalStat2Name: sheet.goalStats[1]?.name || 'Introvert|Extrovert',
      goalStat2Value: sheet.goalStats[1]?.value ?? 0,
      goalStat3Name: sheet.goalStats[2]?.name || 'Passive|Aggressive',
      goalStat3Value: sheet.goalStats[2]?.value ?? 0,
      goalStat4Name: sheet.goalStats[3]?.name || 'Optimist|Pessimist',
      goalStat4Value: sheet.goalStats[3]?.value ?? 0,
    }

    if (selectedDreamId.value) {
      body.dreamIds = [selectedDreamId.value]
    }

    const method = sheet.id ? 'PATCH' : 'POST'
    const endpoint = sheet.id ? `${CHARACTER_ENDPOINT}/${sheet.id}` : CHARACTER_ENDPOINT

    const response = (await performFetch<Character>(endpoint, {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Character>

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to save character.')
    }

    sheet.id = response.data.id
    selectedCharacterId.value = response.data.id
    saveMessage.value = `Saved character #${response.data.id}. Plot goblin successfully released.`
    emit('saved', response.data)
  } catch (error) {
    handleError(error, 'saving character from character-sheet')
    saveError.value = error instanceof Error ? error.message : 'Failed to save character.'
  } finally {
    isSaving.value = false
  }
}

async function saveRewardDrafts() {
  const savedRewards: Reward[] = []

  for (const draft of sheet.rewards) {
    if (draft.id) {
      savedRewards.push(draft as unknown as Reward)
      continue
    }

    const body: Record<string, unknown> = {
      label: draft.label,
      text: draft.text,
      power: draft.power,
      collection: draft.collection || 'starting-character-reward',
      rarity: draft.rarity,
      rarityType: draft.rarityType,
      rewardType: draft.rewardType,
      icon: draft.icon || fallbackRewardIcon(draft),
      imagePath: draft.imagePath || null,
      artImageId: draft.artImageId || null,
      artPrompt: draft.artPrompt || null,
      userId: sheet.userId || userStore.userId || 10,
      isPublic: true,
      isMature: false,
      isActive: true,
    }

    const response = (await performFetch<Reward>(REWARD_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Reward>

    if (!response.success || !response.data) {
      throw new Error(response.message || `Failed to save reward: ${draft.label}`)
    }

    draft.id = response.data.id
    savedRewards.push(response.data)
  }

  return savedRewards
}

async function fetchDreams() {
  try {
    const response = (await performFetch<Dream[]>('/api/dream')) as PerformFetchResult<Dream[]>

    if (!response.success || !Array.isArray(response.data)) {
      dreamOptions.value = []
      return
    }

    dreamOptions.value = response.data
      .filter((dream) => dream && dream.id)
      .map((dream) => ({
        id: dream.id,
        label: dream.title || `Dream #${dream.id}`,
      }))
  } catch (error) {
    handleError(error, 'fetching dreams for character-sheet')
    dreamOptions.value = []
  }
}

function rewardSkillText() {
  return sheet.rewards
    .filter((reward) => reward.rewardType === 'SKILL')
    .map((reward) => `${reward.label}: ${reward.power}`)
    .join('\n')
}

function rewardInventoryText() {
  return sheet.rewards
    .filter((reward) => reward.rewardType === 'ITEM')
    .map((reward) => `${reward.label}: ${reward.text}`)
    .join('\n')
}

function rewardForSlot(slotKey: RewardSlotKey) {
  return sheet.rewards.find((reward) => reward.slotKey === slotKey) ?? null
}

function resetSheet() {
  Object.assign(sheet, {
    id: null,
    name: '',
    honorific: 'adventurer',
    title: '',
    role: '',
    genre: '',
    species: '',
    characterClass: '',
    alignment: '',
    genderIdentity: '',
    presentation: '',
    personality: '',
    drive: '',
    backstory: '',
    achievements: '',
    skills: '',
    inventory: '',
    quirks: '',
    artPrompt: '',
    artImageId: null,
    imagePath: null,
    userId: userStore.userId || 10,
    designer: getDesignerName(),
    isPublic: true,
    isMature: false,
    isActive: true,
  })

  resetStatRows(sheet.stats, defaultEmptyStats())
  resetStatRows(sheet.goalStats, defaultGoalStats())
  sheet.rewards.splice(0, sheet.rewards.length)

  for (const key of Object.keys(completedCards)) {
    delete completedCards[key]
  }

  saveMessage.value = ''
  saveError.value = ''
  showPortrait.value = false
}

function loadCharacter(character: CharacterWithRelations | null) {
  resetSheet()

  if (!character) return

  sheet.id = typeof character.id === 'number' ? character.id : null
  sheet.name = String(character.name || '')
  sheet.honorific = String(character.honorific || 'adventurer')
  sheet.title = String(character.title || '')
  sheet.role = String(character.role || '')
  sheet.genre = String(character.genre || '')
  sheet.species = String(character.species || '')
  sheet.characterClass = String(character.class || '')
  sheet.alignment = String(character.alignment || '')
  sheet.genderIdentity = String(character.genderIdentity || '')
  sheet.presentation = String(character.presentation || '')
  sheet.personality = String(character.personality || '')
  sheet.drive = String(character.drive || '')
  sheet.backstory = String(character.backstory || '')
  sheet.achievements = String(character.achievements || '')
  sheet.skills = String(character.skills || '')
  sheet.inventory = String(character.inventory || '')
  sheet.quirks = String(character.quirks || '')
  sheet.artPrompt = String(character.artPrompt || '')
  sheet.artImageId = typeof character.artImageId === 'number' ? character.artImageId : null
  sheet.imagePath = typeof character.imagePath === 'string' ? character.imagePath : null
  sheet.userId = typeof character.userId === 'number' ? character.userId : userStore.userId || 10
  sheet.designer = typeof character.designer === 'string' ? character.designer : getDesignerName()
  sheet.isPublic = typeof character.isPublic === 'boolean' ? character.isPublic : true
  sheet.isMature = typeof character.isMature === 'boolean' ? character.isMature : false
  sheet.isActive = typeof character.isActive === 'boolean' ? character.isActive : true

  resetStatRows(sheet.stats, [
    { key: 'stat1', name: String(character.statName1 || 'Luck'), value: Number(character.statValue1 || 0) },
    { key: 'stat2', name: String(character.statName2 || 'Swol'), value: Number(character.statValue2 || 0) },
    { key: 'stat3', name: String(character.statName3 || 'Wits'), value: Number(character.statValue3 || 0) },
    { key: 'stat4', name: String(character.statName4 || 'Flexibility'), value: Number(character.statValue4 || 0) },
    { key: 'stat5', name: String(character.statName5 || 'Rizz'), value: Number(character.statValue5 || 0) },
    { key: 'stat6', name: String(character.statName6 || 'Empathy'), value: Number(character.statValue6 || 0) },
  ])

  resetStatRows(sheet.goalStats, [
    { key: 'goal1', name: String(character.goalStat1Name || 'Principled|Chaotic'), value: Number(character.goalStat1Value || 0) },
    { key: 'goal2', name: String(character.goalStat2Name || 'Introvert|Extrovert'), value: Number(character.goalStat2Value || 0) },
    { key: 'goal3', name: String(character.goalStat3Name || 'Passive|Aggressive'), value: Number(character.goalStat3Value || 0) },
    { key: 'goal4', name: String(character.goalStat4Name || 'Optimist|Pessimist'), value: Number(character.goalStat4Value || 0) },
  ])

  if (Array.isArray(character.Rewards)) {
    sheet.rewards.splice(0, sheet.rewards.length, ...character.Rewards.map(mapRewardToSheetReward))
  }

  inferCompletedCards()
  selectedCharacterId.value = sheet.id
  showPortrait.value = props.startPortrait && hasPortrait.value
}

function inferCompletedCards() {
  completedCards.role = Boolean(sheet.role)
  completedCards.name = Boolean(sheet.name)
  completedCards.origin = Boolean(sheet.species && sheet.characterClass)
  completedCards.identity = Boolean(sheet.genderIdentity || sheet.presentation)
  completedCards.personality = Boolean(sheet.personality)
  completedCards.stats = sheet.stats.every((stat) => stat.value >= 1 && stat.value <= 6)
  completedCards.background = Boolean(sheet.backstory)

  for (const slot of rewardSlots) {
    completedCards[slot.key] = Boolean(rewardForSlot(slot.key))
  }

  completedCards.art = Boolean(sheet.artPrompt || sheet.imagePath || sheet.artImageId)
}

function mapRewardToSheetReward(reward: Partial<Reward> & Record<string, unknown>): CharacterSheetReward {
  const rewardType = reward.rewardType === 'SKILL' ? 'SKILL' : 'ITEM'
  const rarityType = reward.rarityType === 'RARE' ? 'RARE' : 'COMMON'
  const slotKey = inferRewardSlotKey(rewardType, rarityType)

  return {
    slotKey,
    id: typeof reward.id === 'number' ? reward.id : undefined,
    label: String(reward.label || 'Reward'),
    text: String(reward.text || ''),
    power: String(reward.power || ''),
    collection: String(reward.collection || 'starting-character-reward'),
    rewardType,
    rarityType,
    rarity: typeof reward.rarity === 'number' ? reward.rarity : rarityType === 'RARE' ? 3 : 1,
    icon: String(reward.icon || fallbackRewardIcon({ rewardType, rarityType })),
    imagePath: String(reward.imagePath || ''),
    artImageId: typeof reward.artImageId === 'number' ? reward.artImageId : null,
    artPrompt: String(reward.artPrompt || ''),
  }
}

function inferRewardSlotKey(rewardType: RewardTypeValue, rarityType: RewardRarityValue): RewardSlotKey {
  if (rewardType === 'SKILL' && rarityType === 'RARE') return 'rare-skill'
  if (rewardType === 'SKILL') return 'common-skill'
  if (rarityType === 'RARE') return 'rare-item'
  return 'common-item'
}

function resetStaging() {
  for (const key of Object.keys(stagedValues)) {
    delete stagedValues[key]
  }

  resetStatRows(draftStats, [])
  Object.assign(stagedReward, createEmptyRewardDraft(rewardSlots[0]))
}

function defaultStats(): CharacterSheetStat[] {
  return [
    { key: 'stat1', name: 'Luck', value: 0 },
    { key: 'stat2', name: 'Swol', value: 0 },
    { key: 'stat3', name: 'Wits', value: 0 },
    { key: 'stat4', name: 'Flexibility', value: 0 },
    { key: 'stat5', name: 'Rizz', value: 0 },
    { key: 'stat6', name: 'Empathy', value: 0 },
  ]
}

function defaultEmptyStats() {
  return defaultStats()
}

function defaultGoalStats(): CharacterSheetStat[] {
  return [
    { key: 'goal1', name: 'Principled|Chaotic', value: 0 },
    { key: 'goal2', name: 'Introvert|Extrovert', value: 0 },
    { key: 'goal3', name: 'Passive|Aggressive', value: 0 },
    { key: 'goal4', name: 'Optimist|Pessimist', value: 0 },
  ]
}

function resetStatRows(target: CharacterSheetStat[], defaults: CharacterSheetStat[]) {
  target.splice(0, target.length, ...defaults)
}

function createEmptyRewardDraft(slot: RewardPromptSlot): CharacterSheetReward {
  return {
    slotKey: slot.key,
    label: '',
    text: '',
    power: '',
    collection: 'starting-character-reward',
    rewardType: slot.rewardType,
    rarityType: slot.rarityType,
    rarity: slot.rarity,
    icon: slot.icon,
    imagePath: '',
    artImageId: null,
    artPrompt: '',
  }
}

function fallbackRewardIcon(reward: Pick<CharacterSheetReward, 'rewardType' | 'rarityType'> | { rewardType: RewardTypeValue; rarityType: RewardRarityValue }) {
  if (reward.rewardType === 'SKILL' && reward.rarityType === 'RARE') return 'kind-icon:comet'
  if (reward.rewardType === 'SKILL') return 'kind-icon:bolt'
  if (reward.rewardType === 'ITEM' && reward.rarityType === 'RARE') return 'kind-icon:gem'
  return 'kind-icon:backpack'
}

function isRewardSlotKey(value: unknown): value is RewardSlotKey {
  return typeof value === 'string' && rewardSlots.some((slot) => slot.key === value)
}

function rollFrom(key: string, fallback: string) {
  try {
    return randomStore.getRandom(key, 1)[0] || fallback
  } catch {
    return fallback
  }
}

function articleFor(value: string) {
  const first = value.trim().charAt(0).toLowerCase()
  return ['a', 'e', 'i', 'o', 'u'].includes(first) ? 'an' : 'a'
}

function getDesignerName() {
  const store = userStore as unknown as {
    designer?: string
    designerName?: string
    username?: string
  }

  return store.designer || store.designerName || store.username || null
}

function cardButtonClass(card: CharacterPromptCard) {
  if (activeCard.value?.key === card.key) return 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
  if (completedCards[card.key]) return 'border-success/40 bg-success/10'
  return 'border-base-300 bg-base-100'
}

watch(
  () => props.character,
  (character) => {
    loadCharacter(character)
  },
  { immediate: true },
)

watch(
  () => ({ ...sheet }),
  () => {
    emit('updated', sheet)
  },
  { deep: true },
)

onMounted(async () => {
  randomStore.initialize()
  await fetchDreams()

  if (!props.character && isBuilderMode.value) {
    reshuffleDeck()
  }
})
</script>

<style scoped>
.sheet-fade-enter-active,
.sheet-fade-leave-active,
.modal-pop-enter-active,
.modal-pop-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.99);
}

.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>