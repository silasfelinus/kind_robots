<!-- /components/builders/scenario-builder.vue -->
<template>
  <builder-shell
    builder-key="scenario"
    title="Scenario Builder"
    :sections="sections"
    :summary-items="summaryItems"
    initial-section="dream"
    summary-title="Scenario Summary"
    summary-subtitle="Review dream context, scenario type, prompt, choices, links, art, and save status."
    @section-change="activeSection = $event"
  >
    <template
      #default="{ activeSection: currentSection, setSection, goNext, goBack }"
    >
      <section v-if="currentSection === 'dream'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:moon" class="h-6 w-6 text-primary" />
            Choose the Dream
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            A scenario is something that happens inside a dream. Pick the universe first so the scene has gravity, texture, and fewer random goblins wandering in from unrelated lore.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[22rem_1fr]">
            <aside class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
              <label class="form-control">
                <span class="label-text font-bold">Dream</span>

                <select
                  v-model.number="selectedDreamId"
                  class="select select-bordered rounded-2xl"
                  @change="applySelectedDream"
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

              <button
                class="btn btn-secondary rounded-xl"
                type="button"
                :disabled="!selectedDreamId"
                @click="applySelectedDream"
              >
                <Icon name="kind-icon:wand" class="h-4 w-4" />
                Use Dream Context
              </button>

              <button
                class="btn rounded-xl"
                type="button"
                @click="clearDreamSelection"
              >
                <Icon name="kind-icon:close" class="h-4 w-4" />
                Start Fresh
              </button>

              <p
                v-if="dreamMessage"
                class="rounded-2xl border border-info/30 bg-info/10 p-3 text-sm text-info"
              >
                {{ dreamMessage }}
              </p>
            </aside>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                Selected Dream
              </p>

              <h4 class="mt-2 text-2xl font-bold text-base-content">
                {{ selectedDreamTitle || 'No dream selected' }}
              </h4>

              <p class="mt-3 whitespace-pre-wrap text-sm text-base-content/70">
                {{ selectedDreamDescription || 'Pick a dream, or continue without one and make a standalone scenario.' }}
              </p>

              <div class="mt-4 rounded-2xl border border-base-300 bg-base-200 p-3">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Scenario Direction
                </p>

                <p class="mt-2 text-sm text-base-content/70">
                  {{ dreamDirectionPreview }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'type'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:map" class="h-6 w-6 text-primary" />
            What kind of scenario is this?
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Scenarios can be tough choices, narrative adventures, art prompts, text prompts, encounters, puzzles, or launchpads for more generation.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <button
              v-for="option in scenarioTypeOptions"
              :key="option.value"
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                scenarioType === option.value
                  ? 'border-primary bg-primary text-primary-content shadow-md'
                  : 'border-base-300 bg-base-100 text-base-content'
              "
              type="button"
              @click="selectScenarioType(option.value)"
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

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'setup'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:story" class="h-6 w-6 text-primary" />
            Scenario Setup
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Define the scene, stakes, and objective. The goal is not to over-write the adventure, just to give the LLM enough delicious trouble to work with.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3">
            <label class="form-control">
              <span class="label-text font-bold">Scenario Title</span>

              <input
                v-model="title"
                class="input input-bordered rounded-2xl text-base"
                type="text"
                placeholder="Example: The Door That Only Opens for Liars"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Intro</span>

              <textarea
                v-model="intro"
                class="textarea textarea-bordered min-h-36 rounded-2xl text-base"
                placeholder="Set the opening moment..."
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Objective</span>

              <textarea
                v-model="objective"
                class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
                placeholder="What is the player trying to do?"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Stakes</span>

              <textarea
                v-model="stakes"
                class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
                placeholder="What happens if they succeed, fail, hesitate, or do something wildly inappropriate?"
              />
            </label>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button class="btn btn-secondary rounded-xl" type="button" @click="buildSetupFromDream">
              <Icon name="kind-icon:wand" class="h-4 w-4" />
              Build from Dream
            </button>

            <button class="btn rounded-xl" type="button" @click="rollScenarioSetup">
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Setup
            </button>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'choices'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:choice" class="h-6 w-6 text-primary" />
            Choices and Custom Solutions
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Add multiple-choice options, but keep custom solutions enabled when the scenario wants player creativity. That is where the good chaos hides.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3">
            <div
              v-for="choice in choices"
              :key="choice.key"
              class="rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <div class="grid grid-cols-1 gap-3 lg:grid-cols-[12rem_1fr]">
                <label class="form-control">
                  <span class="label-text font-bold">Label</span>

                  <input
                    v-model="choice.label"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    placeholder="A"
                  />
                </label>

                <label class="form-control">
                  <span class="label-text font-bold">Choice Text</span>

                  <input
                    v-model="choice.text"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    placeholder="What can the player choose?"
                  />
                </label>
              </div>

              <label class="form-control mt-3">
                <span class="label-text font-bold">Outcome Hint</span>

                <textarea
                  v-model="choice.outcomeHint"
                  class="textarea textarea-bordered min-h-24 rounded-2xl text-base"
                  placeholder="Optional guidance for what this choice tends to cause..."
                />
              </label>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
            <label class="flex cursor-pointer items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
              <input
                v-model="allowCustomSolution"
                class="toggle toggle-primary"
                type="checkbox"
              />

              <span>
                <span class="block font-bold text-base-content">
                  Allow Custom Solution
                </span>

                <span class="block text-sm text-base-content/60">
                  Let the user type their own plan and let the LLM judge the delightful mess.
                </span>
              </span>
            </label>

            <div class="flex flex-wrap gap-2">
              <button class="btn btn-secondary rounded-xl" type="button" @click="buildChoices">
                <Icon name="kind-icon:wand" class="h-4 w-4" />
                Build Choices
              </button>

              <button class="btn rounded-xl" type="button" @click="clearChoices">
                <Icon name="kind-icon:trash" class="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'prompt'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:prompt" class="h-6 w-6 text-primary" />
            Output Prompt
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            The scenario can produce a text prompt, art prompt, adventure prompt, or choice-resolution prompt. This is the reusable instruction layer.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_20rem]">
            <div class="flex flex-col gap-3">
              <label class="form-control">
                <span class="label-text font-bold">Scenario Prompt</span>

                <textarea
                  v-model="scenarioPrompt"
                  class="textarea textarea-bordered min-h-52 rounded-2xl text-base"
                  placeholder="Prompt for resolving the scenario..."
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Art Prompt</span>

                <textarea
                  v-model="artPrompt"
                  class="textarea textarea-bordered min-h-36 rounded-2xl text-base"
                  placeholder="Prompt for generating art from this scenario..."
                />
              </label>
            </div>

            <aside class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">
                Prompt Helpers
              </h4>

              <button class="btn btn-secondary rounded-xl" type="button" @click="buildScenarioPrompt">
                <Icon name="kind-icon:wand" class="h-4 w-4" />
                Build Scenario Prompt
              </button>

              <button class="btn rounded-xl" type="button" @click="buildArtPrompt">
                <Icon name="kind-icon:palette" class="h-4 w-4" />
                Build Art Prompt
              </button>

              <button class="btn rounded-xl" type="button" @click="buildTextPrompt">
                <Icon name="kind-icon:chat" class="h-4 w-4" />
                Build Text Prompt
              </button>

              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Scenario Type
                </p>

                <p class="mt-2 text-sm text-base-content/70">
                  {{ scenarioTypeLabel }}
                </p>
              </div>
            </aside>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'connections'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:link" class="h-6 w-6 text-primary" />
            Cast, Rewards, and Links
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Attach characters and rewards so the scenario has actors, incentives, consequences, and tiny plot grenades.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text font-bold">Featured Character</span>

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
              <span class="label-text font-bold">Reward</span>

              <select
                v-model.number="selectedRewardId"
                class="select select-bordered rounded-2xl"
              >
                <option :value="0">No reward selected</option>

                <option
                  v-for="reward in rewardOptions"
                  :key="reward.id"
                  :value="reward.id"
                >
                  {{ reward.label }}
                </option>
              </select>
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text font-bold">Connection Notes</span>

              <textarea
                v-model="connectionNotes"
                class="textarea textarea-bordered min-h-32 rounded-2xl text-base"
                placeholder="Who is present, what can be won, what can be lost, and who gets blamed?"
              />
            </label>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'art'" class="flex flex-col gap-4">
        <art-creator
          purpose="scenario"
          :model-id="selectedScenarioId"
          :model-title="title"
          :prompt="artPrompt"
          image-role="scene"
          @update="updateScenarioArt"
        />

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Continue
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'settings'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:sliders" class="h-6 w-6 text-primary" />
            Scenario Settings
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Configure visibility, maturity, active state, and play behavior.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">
                Public
              </h4>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <button
                  class="btn rounded-xl"
                  :class="isPublic ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="isPublic = true"
                >
                  Yes
                </button>

                <button
                  class="btn rounded-xl"
                  :class="!isPublic ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="isPublic = false"
                >
                  No
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">
                Mature
              </h4>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <button
                  class="btn rounded-xl"
                  :class="isMature ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="isMature = true"
                >
                  Yes
                </button>

                <button
                  class="btn rounded-xl"
                  :class="!isMature ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="isMature = false"
                >
                  No
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">
                Active
              </h4>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <button
                  class="btn rounded-xl"
                  :class="isActive ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="isActive = true"
                >
                  Yes
                </button>

                <button
                  class="btn rounded-xl"
                  :class="!isActive ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="isActive = false"
                >
                  No
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">
                Custom Answers
              </h4>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <button
                  class="btn rounded-xl"
                  :class="allowCustomSolution ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="allowCustomSolution = true"
                >
                  Yes
                </button>

                <button
                  class="btn rounded-xl"
                  :class="!allowCustomSolution ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="allowCustomSolution = false"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button class="btn btn-primary rounded-xl" type="button" @click="goNext">
            Summary
          </button>
        </div>
      </section>

      <section v-else-if="currentSection === 'summary'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <h3 class="flex items-center gap-2 text-xl font-bold text-primary">
            <Icon name="kind-icon:blueprint" class="h-6 w-6" />
            Scenario Summary
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Review the scenario before saving. A good scenario is basically a suspicious little machine for producing consequences.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_22rem]">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <div class="flex flex-col gap-3">
              <div v-if="imagePath" class="overflow-hidden rounded-2xl border border-base-300 bg-base-300">
                <img
                  :src="imagePath"
                  alt="Scenario art"
                  class="max-h-[24rem] w-full object-contain"
                />
              </div>

              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Scenario
                </p>

                <h3 class="mt-1 text-2xl font-bold text-base-content">
                  {{ title || 'Untitled Scenario' }}
                </h3>

                <p class="mt-1 text-sm text-base-content/70">
                  {{ scenarioTypeLabel }} · {{ selectedDreamTitle || 'No dream selected' }}
                </p>
              </div>

              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Intro
                </p>

                <p class="mt-1 whitespace-pre-wrap text-sm text-base-content/70">
                  {{ intro || 'No intro yet.' }}
                </p>
              </div>

              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Objective
                </p>

                <p class="mt-1 whitespace-pre-wrap text-sm text-base-content/70">
                  {{ objective || 'No objective yet.' }}
                </p>
              </div>

              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  Choices
                </p>

                <div class="mt-2 grid grid-cols-1 gap-2">
                  <div
                    v-for="choice in filledChoices"
                    :key="choice.key"
                    class="rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <p class="font-bold text-base-content">
                      {{ choice.label }}. {{ choice.text }}
                    </p>

                    <p
                      v-if="choice.outcomeHint"
                      class="mt-1 text-sm text-base-content/60"
                    >
                      {{ choice.outcomeHint }}
                    </p>
                  </div>

                  <p
                    v-if="!filledChoices.length"
                    class="text-sm text-base-content/60"
                  >
                    No choices configured yet.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4">
            <button class="btn rounded-xl" type="button" @click="setSection('dream')">
              <Icon name="kind-icon:moon" class="h-4 w-4" />
              Edit Dream
            </button>

            <button class="btn rounded-xl" type="button" @click="setSection('type')">
              <Icon name="kind-icon:map" class="h-4 w-4" />
              Edit Type
            </button>

            <button class="btn rounded-xl" type="button" @click="setSection('setup')">
              <Icon name="kind-icon:story" class="h-4 w-4" />
              Edit Setup
            </button>

            <button class="btn rounded-xl" type="button" @click="setSection('choices')">
              <Icon name="kind-icon:choice" class="h-4 w-4" />
              Edit Choices
            </button>

            <button class="btn rounded-xl" type="button" @click="setSection('prompt')">
              <Icon name="kind-icon:prompt" class="h-4 w-4" />
              Edit Prompt
            </button>

            <button class="btn rounded-xl" type="button" @click="setSection('connections')">
              <Icon name="kind-icon:link" class="h-4 w-4" />
              Edit Links
            </button>

            <button class="btn rounded-xl" type="button" @click="setSection('art')">
              <Icon name="kind-icon:palette" class="h-4 w-4" />
              Edit Art
            </button>

            <button class="btn rounded-xl" type="button" @click="setSection('settings')">
              <Icon name="kind-icon:sliders" class="h-4 w-4" />
              Edit Settings
            </button>

            <button
              class="btn btn-primary rounded-xl"
              type="button"
              :disabled="isSaving || !canSave"
              @click="saveScenario"
            >
              <Icon name="kind-icon:save" class="h-4 w-4" />
              {{ isSaving ? 'Saving...' : 'Save Scenario' }}
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
              <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300">
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
        Unknown scenario builder section: {{ currentSection }}
      </div>
    </template>
  </builder-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type {
  BuilderChoiceSummary,
  BuilderSectionConfig,
} from '@/components/builders/builder-shell.vue'
import { useUserStore } from '@/stores/userStore'
import { useRandomStore } from '@/stores/randomStore'
import { handleError, performFetch } from '@/stores/utils'

type ScenarioType =
  | 'tough-choice'
  | 'narrative-adventure'
  | 'encounter'
  | 'puzzle'
  | 'art-prompt'
  | 'text-prompt'
  | 'branching-scene'
  | 'world-event'

type SelectOption = {
  id: number
  label: string
  description?: string | null
  currentVibe?: string | null
  currentPrompt?: string | null
  artPrompt?: string | null
}

type ScenarioChoice = {
  key: string
  label: string
  text: string
  outcomeHint: string
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

const SCENARIO_ENDPOINT = '/api/scenario'

const userStore = useUserStore()
const randomStore = useRandomStore()

const activeSection = ref<string>('dream')
const selectedScenarioId = ref<number | null>(null)

const selectedDreamId = ref(0)
const selectedCharacterId = ref(0)
const selectedRewardId = ref(0)

const dreamOptions = ref<SelectOption[]>([])
const characterOptions = ref<SelectOption[]>([])
const rewardOptions = ref<SelectOption[]>([])

const dreamMessage = ref('')
const scenarioType = ref<ScenarioType>('tough-choice')
const title = ref('')
const intro = ref('')
const objective = ref('')
const stakes = ref('')
const scenarioPrompt = ref('')
const artPrompt = ref('')
const imagePath = ref<string | null>(null)
const connectionNotes = ref('')

const allowCustomSolution = ref(true)
const isPublic = ref(true)
const isMature = ref(false)
const isActive = ref(true)

const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const choices = reactive<ScenarioChoice[]>([
  {
    key: 'choice-a',
    label: 'A',
    text: '',
    outcomeHint: '',
  },
  {
    key: 'choice-b',
    label: 'B',
    text: '',
    outcomeHint: '',
  },
  {
    key: 'choice-c',
    label: 'C',
    text: '',
    outcomeHint: '',
  },
  {
    key: 'choice-d',
    label: 'D',
    text: '',
    outcomeHint: '',
  },
])

const scenarioTypeOptions: {
  value: ScenarioType
  label: string
  icon: string
  description: string
}[] = [
  {
    value: 'tough-choice',
    label: 'Tough Choice',
    icon: 'kind-icon:choice',
    description: 'A dilemma with no perfect answer and several excellent ways to regret things.',
  },
  {
    value: 'narrative-adventure',
    label: 'Adventure',
    icon: 'kind-icon:map',
    description: 'A playable story beat where the user chooses a direction and the LLM narrates consequences.',
  },
  {
    value: 'encounter',
    label: 'Encounter',
    icon: 'kind-icon:mask',
    description: 'A meeting, fight, negotiation, obstacle, or weird social moment.',
  },
  {
    value: 'puzzle',
    label: 'Puzzle',
    icon: 'kind-icon:brain',
    description: 'A mystery, lock, ritual, pattern, or problem that rewards cleverness.',
  },
  {
    value: 'art-prompt',
    label: 'Art Prompt',
    icon: 'kind-icon:palette',
    description: 'A scenario designed to become an image prompt.',
  },
  {
    value: 'text-prompt',
    label: 'Text Prompt',
    icon: 'kind-icon:prompt',
    description: 'A scenario designed to generate prose, dialogue, lore, or chat.',
  },
  {
    value: 'branching-scene',
    label: 'Branching Scene',
    icon: 'kind-icon:story',
    description: 'A scene with explicit branches, outcomes, and follow-up hooks.',
  },
  {
    value: 'world-event',
    label: 'World Event',
    icon: 'kind-icon:world',
    description: 'Something that happens in the dream universe and changes the state of play.',
  },
]

const sections: BuilderSectionConfig[] = [
  {
    key: 'dream',
    label: 'Dream',
    icon: 'kind-icon:moon',
    title: 'Dream Context',
    summary: 'Choose the dream universe this scenario happens inside.',
  },
  {
    key: 'type',
    label: 'Type',
    icon: 'kind-icon:map',
    title: 'Scenario Type',
    summary: 'Choose whether this is a tough choice, adventure, prompt, puzzle, encounter, or world event.',
  },
  {
    key: 'setup',
    label: 'Setup',
    icon: 'kind-icon:story',
    title: 'Scenario Setup',
    summary: 'Define the title, intro, objective, and stakes.',
  },
  {
    key: 'choices',
    label: 'Choices',
    icon: 'kind-icon:choice',
    title: 'Choices',
    summary: 'Create player choices and optional custom-answer behavior.',
  },
  {
    key: 'prompt',
    label: 'Prompt',
    icon: 'kind-icon:prompt',
    title: 'Output Prompt',
    summary: 'Create text and art prompts generated from the scenario.',
  },
  {
    key: 'connections',
    label: 'Links',
    icon: 'kind-icon:link',
    title: 'Connections',
    summary: 'Attach featured characters and rewards.',
  },
  {
    key: 'art',
    label: 'Art',
    icon: 'kind-icon:palette',
    title: 'Scenario Art',
    summary: 'Create, upload, generate, or select scenario scene art.',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'kind-icon:sliders',
    title: 'Settings',
    summary: 'Configure visibility, maturity, activity, and custom answer behavior.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Scenario Summary',
    summary: 'Review and save the scenario.',
  },
]

const selectedDream = computed(() => {
  return dreamOptions.value.find((item) => item.id === selectedDreamId.value)
})

const selectedDreamTitle = computed(() => selectedDream.value?.label ?? '')

const selectedDreamDescription = computed(() => selectedDream.value?.description ?? '')

const selectedDreamVibe = computed(() => selectedDream.value?.currentVibe ?? '')

const selectedDreamPrompt = computed(() => selectedDream.value?.currentPrompt ?? '')

const selectedCharacterLabel = computed(() => {
  return characterOptions.value.find((item) => item.id === selectedCharacterId.value)?.label ?? ''
})

const selectedRewardLabel = computed(() => {
  return rewardOptions.value.find((item) => item.id === selectedRewardId.value)?.label ?? ''
})

const dreamDirectionPreview = computed(() => {
  return (
    selectedDreamPrompt.value ||
    selectedDreamDescription.value ||
    selectedDreamVibe.value ||
    'No dream context yet.'
  )
})

const scenarioTypeConfig = computed(() => {
  return scenarioTypeOptions.find((option) => option.value === scenarioType.value)
})

const scenarioTypeLabel = computed(() => scenarioTypeConfig.value?.label ?? 'Scenario')

const filledChoices = computed(() => {
  return choices.filter((choice) => choice.text.trim().length > 0)
})

const canSave = computed(() => {
  return title.value.trim().length > 0 && intro.value.trim().length > 0
})

const summaryItems = computed<BuilderChoiceSummary[]>(() => [
  {
    key: 'dream',
    label: 'Dream',
    value: selectedDreamTitle.value,
    icon: 'kind-icon:moon',
    description: selectedDreamVibe.value || 'Scenario dream context.',
    editSection: 'dream',
  },
  {
    key: 'type',
    label: 'Scenario Type',
    value: scenarioTypeLabel.value,
    icon: scenarioTypeConfig.value?.icon ?? 'kind-icon:map',
    description: scenarioTypeConfig.value?.description ?? 'Scenario type.',
    editSection: 'type',
  },
  {
    key: 'setup',
    label: 'Setup',
    value: title.value,
    icon: 'kind-icon:story',
    description: objective.value || intro.value,
    editSection: 'setup',
  },
  {
    key: 'choices',
    label: 'Choices',
    value: filledChoices.value.length
      ? filledChoices.value.map((choice) => `${choice.label}: ${choice.text}`).join(', ')
      : '',
    icon: 'kind-icon:choice',
    description: allowCustomSolution.value ? 'Custom solutions allowed.' : 'Only listed choices allowed.',
    editSection: 'choices',
  },
  {
    key: 'prompt',
    label: 'Scenario Prompt',
    value: scenarioPrompt.value,
    icon: 'kind-icon:prompt',
    description: artPrompt.value || 'No art prompt yet.',
    editSection: 'prompt',
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
    label: 'Scenario Art',
    value: artPrompt.value,
    image: imagePath.value,
    icon: 'kind-icon:palette',
    description: 'Scenario scene art.',
    editSection: 'art',
  },
  {
    key: 'save',
    label: 'Save Status',
    value: selectedScenarioId.value
      ? `Saved as #${selectedScenarioId.value}`
      : 'Not saved yet',
    icon: selectedScenarioId.value ? 'kind-icon:check' : 'kind-icon:save',
    description: 'Saved scenarios can be played, branched, illustrated, or reused as prompts.',
    editSection: 'summary',
  },
])

const connectionSummary = computed(() => {
  const parts = [
    selectedCharacterLabel.value ? `Character: ${selectedCharacterLabel.value}` : '',
    selectedRewardLabel.value ? `Reward: ${selectedRewardLabel.value}` : '',
  ].filter(Boolean)

  return parts.length ? parts.join(', ') : 'No links selected yet'
})

function selectScenarioType(type: ScenarioType) {
  scenarioType.value = type

  if (!title.value.trim()) {
    title.value = defaultTitleForType(type)
  }

  if (!intro.value.trim()) {
    buildSetupFromDream()
  }

  if (!scenarioPrompt.value.trim()) {
    buildScenarioPrompt()
  }
}

function defaultTitleForType(type: ScenarioType) {
  if (type === 'tough-choice') return 'The Impossible Choice'
  if (type === 'narrative-adventure') return 'The First Wrong Turn'
  if (type === 'encounter') return 'The Stranger at the Threshold'
  if (type === 'puzzle') return 'The Lock That Hates Answers'
  if (type === 'art-prompt') return 'The Scene Worth Painting'
  if (type === 'text-prompt') return 'The Story Seed'
  if (type === 'branching-scene') return 'The Fork in the Trouble'
  if (type === 'world-event') return 'The Day the World Changed'

  return 'Untitled Scenario'
}

function applySelectedDream() {
  const dream = selectedDream.value

  if (!dream) {
    dreamMessage.value = 'No dream selected.'
    return
  }

  if (!title.value.trim()) {
    title.value = `A Moment in ${dream.label}`
  }

  if (!intro.value.trim()) {
    intro.value = [
      `Inside ${dream.label}, something has gone beautifully wrong.`,
      dream.description ? `Dream context: ${dream.description}` : '',
      dream.currentVibe ? `Vibe: ${dream.currentVibe}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (!objective.value.trim()) {
    objective.value = 'Decide what to do before the situation changes again.'
  }

  if (!stakes.value.trim()) {
    stakes.value = 'Success creates a new opening. Failure creates a new complication. Hesitation creates an even funnier problem.'
  }

  if (!scenarioPrompt.value.trim()) {
    buildScenarioPrompt()
  }

  if (!artPrompt.value.trim()) {
    artPrompt.value =
      dream.artPrompt ||
      `Create original scenario scene art set inside "${dream.label}". Show a dramatic choice moment with strong atmosphere, readable stakes, and no text or watermark.`
  }

  dreamMessage.value = 'Dream context applied.'
}

function clearDreamSelection() {
  selectedDreamId.value = 0
  dreamMessage.value = 'Dream selection cleared. Starting fresh.'
}

function buildSetupFromDream() {
  const dreamName = selectedDreamTitle.value || 'this strange universe'
  const vibe = selectedDreamVibe.value || 'tense, vivid, and a little unstable'

  if (!title.value.trim()) {
    title.value = defaultTitleForType(scenarioType.value)
  }

  intro.value = [
    `In ${dreamName}, the characters arrive at a moment charged with ${vibe}.`,
    selectedDreamDescription.value ? `The world context: ${selectedDreamDescription.value}` : '',
    'Something is about to force a decision.',
  ]
    .filter(Boolean)
    .join(' ')

  objective.value = objective.value.trim() || 'Choose a path through the problem and accept the consequences.'
  stakes.value = stakes.value.trim() || 'The wrong move may cost trust, time, safety, access, or a reward.'
}

function rollScenarioSetup() {
  const adjective = rollFrom('adjective', 'strange')
  const noun = rollFrom('noun', 'door')
  const encounter = rollFrom('encounter', 'A suspicious stranger blocks the way.')

  title.value = `The ${capitalize(adjective)} ${capitalize(noun)}`
  intro.value = encounter
  objective.value = `Figure out what the ${noun} wants before the situation escalates.`
  stakes.value = 'A rushed choice may create a worse problem, but waiting too long lets someone else act first.'
}

function buildChoices() {
  if (!choices[0].text.trim()) {
    choices[0].text = 'Take the direct approach.'
    choices[0].outcomeHint = 'Fast, risky, and likely to reveal hidden resistance.'
  }

  if (!choices[1].text.trim()) {
    choices[1].text = 'Look for a clever workaround.'
    choices[1].outcomeHint = 'Slower, more flexible, and likely to reveal new information.'
  }

  if (!choices[2].text.trim()) {
    choices[2].text = 'Ask someone involved what they really want.'
    choices[2].outcomeHint = 'Social, revealing, and vulnerable to lies.'
  }

  if (!choices[3].text.trim()) {
    choices[3].text = 'Use an object, reward, or unusual skill.'
    choices[3].outcomeHint = 'Creative, dependent on character resources, and perfect for chaos.'
  }
}

function clearChoices() {
  for (const choice of choices) {
    choice.text = ''
    choice.outcomeHint = ''
  }
}

function buildScenarioPrompt() {
  scenarioPrompt.value = [
    `Run a ${scenarioTypeLabel.value.toLowerCase()} scenario.`,
    selectedDreamTitle.value ? `Dream: ${selectedDreamTitle.value}.` : '',
    selectedDreamPrompt.value ? `Dream prompt: ${selectedDreamPrompt.value}` : '',
    title.value ? `Scenario title: ${title.value}.` : '',
    intro.value ? `Intro: ${intro.value}` : '',
    objective.value ? `Objective: ${objective.value}` : '',
    stakes.value ? `Stakes: ${stakes.value}` : '',
    filledChoices.value.length
      ? `Choices: ${filledChoices.value
          .map((choice) => `${choice.label}) ${choice.text}`)
          .join(' ')}`
      : '',
    allowCustomSolution.value
      ? 'The user may also propose a custom solution. Judge it fairly, narrate consequences, and create a forward hook.'
      : 'The user must choose from the listed options. Narrate consequences and create a forward hook.',
    selectedCharacterLabel.value ? `Featured character: ${selectedCharacterLabel.value}.` : '',
    selectedRewardLabel.value ? `Possible reward or consequence: ${selectedRewardLabel.value}.` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function buildArtPrompt() {
  artPrompt.value = [
    `Create original scenario scene art for "${title.value || scenarioTypeLabel.value}".`,
    selectedDreamTitle.value ? `Set in the dream world "${selectedDreamTitle.value}".` : '',
    intro.value ? `Scene setup: ${intro.value}` : '',
    objective.value ? `Objective: ${objective.value}` : '',
    stakes.value ? `Stakes: ${stakes.value}` : '',
    selectedCharacterLabel.value ? `Feature or imply character: ${selectedCharacterLabel.value}.` : '',
    selectedRewardLabel.value ? `Include or foreshadow reward: ${selectedRewardLabel.value}.` : '',
    'Dramatic composition, readable choice moment, expressive atmosphere, no text, no watermark.',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildTextPrompt() {
  scenarioPrompt.value = [
    `Write a narrative scene for "${title.value || scenarioTypeLabel.value}".`,
    selectedDreamTitle.value ? `World: ${selectedDreamTitle.value}.` : '',
    intro.value ? `Opening: ${intro.value}` : '',
    objective.value ? `Objective: ${objective.value}` : '',
    'End with clear player options and a hook for what happens next.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function updateScenarioArt(payload: ArtCreatorPayload) {
  artPrompt.value = payload.prompt
  imagePath.value = payload.imagePath
}

async function fetchSelectOptions() {
  await Promise.all([fetchDreams(), fetchCharacters(), fetchRewards()])
}

async function fetchDreams() {
  try {
    const res = (await performFetch<unknown[]>('/api/dream')) as PerformFetchResult<unknown[]>

    if (!res.success || !Array.isArray(res.data)) {
      dreamOptions.value = []
      return
    }

    dreamOptions.value = res.data
      .map((item) => normalizeDreamOption(item))
      .filter((item): item is SelectOption => Boolean(item))
  } catch (error) {
    handleError(error, 'fetching dreams for scenario-builder')
    dreamOptions.value = []
  }
}

async function fetchCharacters() {
  try {
    const res = (await performFetch<unknown[]>('/api/character')) as PerformFetchResult<unknown[]>
    characterOptions.value = normalizeOptions(res)
  } catch (error) {
    handleError(error, 'fetching characters for scenario-builder')
    characterOptions.value = []
  }
}

async function fetchRewards() {
  try {
    const res = (await performFetch<unknown[]>('/api/reward')) as PerformFetchResult<unknown[]>
    rewardOptions.value = normalizeOptions(res)
  } catch (error) {
    handleError(error, 'fetching rewards for scenario-builder')
    rewardOptions.value = []
  }
}

function normalizeDreamOption(item: unknown): SelectOption | null {
  if (!item || typeof item !== 'object') return null

  const record = item as Record<string, unknown>
  const id = Number(record.id)

  if (!Number.isFinite(id)) return null

  return {
    id,
    label: stringValue(record.title) || stringValue(record.name) || `Dream #${id}`,
    description: stringValue(record.description) || null,
    currentVibe: stringValue(record.currentVibe) || null,
    currentPrompt: stringValue(record.currentPrompt) || null,
    artPrompt: stringValue(record.artPrompt) || null,
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

      return {
        id,
        label:
          stringValue(record.title) ||
          stringValue(record.name) ||
          stringValue(record.label) ||
          `Item #${id}`,
      }
    })
    .filter((item): item is SelectOption => Boolean(item))
}

async function saveScenario() {
  if (!canSave.value) {
    saveError.value = 'Add a title and intro before saving.'
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
      intro: intro.value.trim(),
      description: fullDescription.value,
      objective: objective.value.trim() || null,
      stakes: stakes.value.trim() || null,
      scenarioType: scenarioType.value,
      type: scenarioType.value,
      choices: JSON.stringify(filledChoices.value),
      choiceData: filledChoices.value,
      allowCustomSolution: allowCustomSolution.value,
      prompt: scenarioPrompt.value.trim() || null,
      currentPrompt: scenarioPrompt.value.trim() || null,
      artPrompt: artPrompt.value.trim() || null,
      imagePath: imagePath.value || null,
      userId: userStore.userId || 10,
      dreamId: selectedDreamId.value || null,
      characterId: selectedCharacterId.value || null,
      rewardId: selectedRewardId.value || null,
      dreamIds: selectedDreamId.value ? [selectedDreamId.value] : [],
      characterIds: selectedCharacterId.value ? [selectedCharacterId.value] : [],
      rewardIds: selectedRewardId.value ? [selectedRewardId.value] : [],
      isPublic: isPublic.value,
      isMature: isMature.value,
      isActive: isActive.value,
      metadata: {
        scenarioType: scenarioType.value,
        objective: objective.value,
        stakes: stakes.value,
        choices: filledChoices.value,
        allowCustomSolution: allowCustomSolution.value,
        connectionNotes: connectionNotes.value,
      },
    }

    const res = (await performFetch<Record<string, unknown>>(SCENARIO_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Record<string, unknown>>

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save scenario.')
    }

    const id = Number(res.data.id)
    selectedScenarioId.value = Number.isFinite(id) ? id : selectedScenarioId.value
    saveMessage.value = selectedScenarioId.value
      ? `Saved scenario #${selectedScenarioId.value}. The plot gremlin has been containerized.`
      : 'Scenario saved.'
  } catch (error) {
    handleError(error, 'saving scenario from scenario-builder')
    saveError.value =
      error instanceof Error ? error.message : 'Failed to save scenario.'
  } finally {
    isSaving.value = false
  }
}

const fullDescription = computed(() => {
  return [
    selectedDreamTitle.value ? `Dream: ${selectedDreamTitle.value}` : '',
    scenarioTypeLabel.value ? `Scenario type: ${scenarioTypeLabel.value}` : '',
    intro.value.trim() ? `Intro: ${intro.value.trim()}` : '',
    objective.value.trim() ? `Objective: ${objective.value.trim()}` : '',
    stakes.value.trim() ? `Stakes: ${stakes.value.trim()}` : '',
    filledChoices.value.length
      ? `Choices:\n${filledChoices.value
          .map((choice) => `${choice.label}. ${choice.text}`)
          .join('\n')}`
      : '',
    connectionNotes.value.trim()
      ? `Connection notes: ${connectionNotes.value.trim()}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
})

function rollFrom(key: string, fallback = '') {
  return randomStore.getRandom(key, 1)[0] ?? fallback
}

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