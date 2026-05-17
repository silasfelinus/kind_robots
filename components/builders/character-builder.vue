<!-- /components/builders/character-builder.vue -->
<template>
  <builder-shell
    builder-key="character"
    title="Character Builder"
    :sections="sections"
    :summary-items="summaryItems"
    initial-section="section"
    summary-title="Character Summary"
    summary-subtitle="Review section, name, race/species, gender identity, stats, skills, background, art, and save status."
    @section-change="activeSection = $event"
  >
    <template
      #default="{ activeSection: currentSection, setSection, goNext, goBack }"
    >
      <section v-if="currentSection === 'section'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:mask" class="h-6 w-6 text-primary" />
            Character Section
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Decide where this character belongs and what kind of role they play.
            This gives the rest of the builder context before we start naming
            the little menace.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[22rem_1fr]">
            <aside
              class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
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
                <span class="label-text font-bold">Character Role</span>

                <select
                  v-model="characterRole"
                  class="select select-bordered rounded-2xl"
                >
                  <option value="playable hero">Playable Hero</option>
                  <option value="companion">Companion</option>
                  <option value="guide">Guide</option>
                  <option value="rival">Rival</option>
                  <option value="villain">Villain</option>
                  <option value="merchant">Merchant</option>
                  <option value="quest giver">Quest Giver</option>
                  <option value="wild card">Wild Card</option>
                  <option value="background legend">Background Legend</option>
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

              <button
                class="btn btn-secondary rounded-xl"
                type="button"
                @click="rollSection"
              >
                <Icon name="kind-icon:dice" class="h-4 w-4" />
                Roll Section Flavor
              </button>
            </aside>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <p
                class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
              >
                Character Direction
              </p>

              <h4 class="mt-2 text-2xl font-bold text-base-content">
                {{ sectionTitle }}
              </h4>

              <p class="mt-3 whitespace-pre-wrap text-sm text-base-content/70">
                {{ sectionPreview }}
              </p>

              <div
                class="mt-4 rounded-2xl border border-base-300 bg-base-200 p-3"
              >
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                >
                  Dream Link
                </p>

                <p class="mt-2 text-sm text-base-content/70">
                  {{ selectedDreamLabel || 'No dream selected yet.' }}
                </p>
              </div>
            </div>
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
        v-else-if="currentSection === 'name'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:signature" class="h-6 w-6 text-primary" />
            Name and Identity
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Give the character a name, honorific, class, and alignment. A good
            name should sound like it already has unpaid emotional invoices.
          </p>

          <div
            class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            <label class="form-control">
              <span class="label-text font-bold">Name</span>

              <input
                v-model="name"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="Name"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Honorific</span>

              <input
                v-model="honorific"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="adventurer"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Class</span>

              <input
                v-model="characterClass"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="Oracle, rogue, barista knight..."
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Alignment</span>

              <input
                v-model="alignment"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="Chaotic Helpful"
              />
            </label>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="rollName"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Name
            </button>

            <button class="btn rounded-xl" type="button" @click="rollIdentity">
              <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              Roll Identity
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="buildNameFromParts"
            >
              <Icon name="kind-icon:wand" class="h-4 w-4" />
              Build Name
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
        v-else-if="currentSection === 'race'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:species" class="h-6 w-6 text-primary" />
            Race / Species
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            The database field is <span class="font-bold">species</span>, so
            this builder labels it race/species but saves it to
            Character.species.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_18rem]">
            <label class="form-control">
              <span class="label-text font-bold">Race / Species</span>

              <input
                v-model="species"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="Human, yokai, clockwork moth, goblin-adjacent..."
              />
            </label>

            <div
              class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <button
                class="btn btn-secondary rounded-xl"
                type="button"
                @click="rollSpecies"
              >
                <Icon name="kind-icon:dice" class="h-4 w-4" />
                Roll Species
              </button>

              <button
                class="btn rounded-xl"
                type="button"
                @click="makeSpeciesWeird"
              >
                <Icon name="kind-icon:sparkles" class="h-4 w-4" />
                Make It Weird
              </button>
            </div>
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
        v-else-if="currentSection === 'gender'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:person" class="h-6 w-6 text-primary" />
            Gender and Presentation
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            There is no Character.gender field yet. This builder keeps gender
            identity as local builder context and folds it into
            personality/backstory when saving.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text font-bold">Gender Identity</span>

              <input
                v-model="genderIdentity"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="Woman, man, nonbinary, agender, fluid, unknown..."
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Presentation</span>

              <input
                v-model="presentation"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="Glamorous, practical, masked, ceremonial..."
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text font-bold">Personality</span>

              <textarea
                v-model="personality"
                class="textarea textarea-bordered min-h-32 rounded-2xl text-base"
                placeholder="How they talk, react, flirt with danger, avoid responsibility..."
              />
            </label>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="rollPersonality"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Personality
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="appendGenderToPersonality"
            >
              <Icon name="kind-icon:plus" class="h-4 w-4" />
              Add to Personality
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
        v-else-if="currentSection === 'stats'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:activity" class="h-6 w-6 text-primary" />
            Stats
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Set six flexible stats and four personality axis goals. This lets
            characters behave like story machines instead of stat spreadsheets
            with hats.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">Core Stats</h4>

              <div class="mt-3 grid grid-cols-1 gap-3">
                <div
                  v-for="stat in stats"
                  :key="stat.key"
                  class="grid grid-cols-1 gap-2 rounded-2xl border border-base-300 bg-base-200 p-3 sm:grid-cols-[1fr_8rem]"
                >
                  <input
                    v-model="stat.name"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    placeholder="Stat name"
                  />

                  <input
                    v-model.number="stat.value"
                    class="input input-bordered rounded-2xl"
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">Goal Axes</h4>

              <div class="mt-3 grid grid-cols-1 gap-3">
                <div
                  v-for="goal in goalStats"
                  :key="goal.key"
                  class="rounded-2xl border border-base-300 bg-base-200 p-3"
                >
                  <input
                    v-model="goal.name"
                    class="input input-bordered w-full rounded-2xl"
                    type="text"
                    placeholder="Axis name"
                  />

                  <input
                    v-model.number="goal.value"
                    class="range range-primary mt-3"
                    type="range"
                    min="-100"
                    max="100"
                  />

                  <div
                    class="mt-1 text-center text-sm font-bold text-base-content/70"
                  >
                    {{ goal.value }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="rollStats"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Stats
            </button>

            <button class="btn rounded-xl" type="button" @click="resetStats">
              <Icon name="kind-icon:refresh" class="h-4 w-4" />
              Reset Defaults
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
        v-else-if="currentSection === 'skills'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:sparkles" class="h-6 w-6 text-primary" />
            Skills and Inventory
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Give the character things they can do and things they probably
            should not be trusted with.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label class="form-control">
              <span class="label-text font-bold">Skills</span>

              <textarea
                v-model="skills"
                class="textarea textarea-bordered min-h-40 rounded-2xl text-base"
                placeholder="Sword dancing, emotional blackmail, ritual accounting..."
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Inventory</span>

              <textarea
                v-model="inventory"
                class="textarea textarea-bordered min-h-40 rounded-2xl text-base"
                placeholder="A haunted spoon, three apology letters, a pocket moon..."
              />
            </label>

            <label class="form-control lg:col-span-2">
              <span class="label-text font-bold">Quirks</span>

              <textarea
                v-model="quirks"
                class="textarea textarea-bordered min-h-32 rounded-2xl text-base"
                placeholder="Refuses to enter rooms normally. Apologizes to doors. Collects ceremonial receipts..."
              />
            </label>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="rollSkills"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Skills
            </button>

            <button class="btn rounded-xl" type="button" @click="rollInventory">
              <Icon name="kind-icon:backpack" class="h-4 w-4" />
              Roll Inventory
            </button>

            <button class="btn rounded-xl" type="button" @click="rollQuirks">
              <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              Roll Quirks
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
        v-else-if="currentSection === 'background'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:story" class="h-6 w-6 text-primary" />
            Background
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Define what this character wants, what happened to them, and why
            they keep making everything narratively complicated.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3">
            <label class="form-control">
              <span class="label-text font-bold">Drive</span>

              <input
                v-model="drive"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="What do they want?"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Backstory</span>

              <textarea
                v-model="backstory"
                class="textarea textarea-bordered min-h-52 rounded-2xl text-base"
                placeholder="Where they came from, what broke beautifully, what they refuse to admit..."
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Achievements</span>

              <input
                v-model="achievements"
                class="input input-bordered rounded-2xl"
                type="text"
                placeholder="Defeated the Tax Hydra, survived brunch with ghosts..."
              />
            </label>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="rollBackstory"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Backstory
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="buildBackstory"
            >
              <Icon name="kind-icon:wand" class="h-4 w-4" />
              Build from Character
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

      <section v-else-if="currentSection === 'art'" class="flex flex-col gap-4">
        <art-creator
          purpose="character"
          :model-id="selectedCharacterId"
          :model-title="name"
          :prompt="artPrompt"
          image-role="portrait"
          @update="updateCharacterArt"
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
            Character Summary
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Review the character before saving. Saved characters can connect to
            dreams, rewards, scenarios, chats, and butterflies. Obviously
            butterflies.
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
                    alt="Character art"
                    class="h-full w-full object-cover"
                  />

                  <Icon
                    v-else
                    name="kind-icon:mask"
                    class="h-10 w-10 text-primary"
                  />
                </div>

                <div class="min-w-0">
                  <p
                    class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                  >
                    Character
                  </p>

                  <h3 class="mt-1 text-2xl font-bold text-base-content">
                    {{ name || 'Unnamed Character' }}
                  </h3>

                  <p class="mt-1 text-sm text-base-content/70">
                    {{ honorific || 'adventurer' }} ·
                    {{ species || 'Unknown species' }} ·
                    {{ characterClass || 'Unclassed' }}
                  </p>
                </div>
              </div>

              <div>
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                >
                  Background
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/70"
                >
                  {{ backstory || 'No backstory yet.' }}
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                >
                  Skills
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/70"
                >
                  {{ skills || 'No skills yet.' }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
                <div
                  v-for="stat in stats"
                  :key="stat.key"
                  class="rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <p class="text-sm font-bold text-base-content">
                    {{ stat.name || 'Stat' }}
                  </p>

                  <p class="text-2xl font-black text-primary">
                    {{ stat.value }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside
            class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('section')"
            >
              <Icon name="kind-icon:mask" class="h-4 w-4" />
              Edit Section
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('name')"
            >
              <Icon name="kind-icon:signature" class="h-4 w-4" />
              Edit Name
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('race')"
            >
              <Icon name="kind-icon:species" class="h-4 w-4" />
              Edit Race
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('gender')"
            >
              <Icon name="kind-icon:person" class="h-4 w-4" />
              Edit Gender
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('stats')"
            >
              <Icon name="kind-icon:activity" class="h-4 w-4" />
              Edit Stats
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('skills')"
            >
              <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              Edit Skills
            </button>

            <button
              class="btn rounded-xl"
              type="button"
              @click="setSection('background')"
            >
              <Icon name="kind-icon:story" class="h-4 w-4" />
              Edit Background
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
              @click="saveCharacter"
            >
              <Icon name="kind-icon:save" class="h-4 w-4" />
              {{ isSaving ? 'Saving...' : 'Save Character' }}
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
        Unknown character builder section: {{ currentSection }}
      </div>
    </template>
  </builder-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Character, Dream } from '~/prisma/generated/prisma/client'
import type {
  BuilderChoiceSummary,
  BuilderSectionConfig,
} from '@/components/builders/builder-shell.vue'
import { useUserStore } from '@/stores/userStore'
import { useRandomStore } from '@/stores/randomStore'
import { handleError, performFetch } from '@/stores/utils'

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

type StatRow = {
  key: string
  name: string
  value: number
}

const CHARACTER_ENDPOINT = '/api/character'

const userStore = useUserStore()
const randomStore = useRandomStore()

const activeSection = ref<string>('section')
const selectedCharacterId = ref<number | null>(null)

const selectedDreamId = ref(0)
const dreamOptions = ref<SelectOption[]>([])

const characterRole = ref('playable hero')
const genre = ref('')
const name = ref('')
const honorific = ref('adventurer')
const characterClass = ref('')
const alignment = ref('')
const species = ref('')
const genderIdentity = ref('')
const presentation = ref('')
const personality = ref('')
const skills = ref('')
const inventory = ref('')
const quirks = ref('')
const drive = ref('')
const backstory = ref('')
const achievements = ref('')
const artPrompt = ref('')
const imagePath = ref<string | null>(null)

const experience = ref(0)
const level = ref(1)
const isPublic = ref(true)
const isMature = ref(false)
const isActive = ref(true)

const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const stats = reactive<StatRow[]>([
  { key: 'stat1', name: 'Luck', value: 59 },
  { key: 'stat2', name: 'Swol', value: 49 },
  { key: 'stat3', name: 'Wits', value: 72 },
  { key: 'stat4', name: 'Flexibility', value: 93 },
  { key: 'stat5', name: 'Rizz', value: 9 },
  { key: 'stat6', name: 'Empathy', value: 71 },
])

const goalStats = reactive<StatRow[]>([
  { key: 'goal1', name: 'Principled|Chaotic', value: 0 },
  { key: 'goal2', name: 'Introvert|Extrovert', value: 0 },
  { key: 'goal3', name: 'Passive|Aggressive', value: 0 },
  { key: 'goal4', name: 'Optimist|Pessimist', value: 0 },
])

const sections: BuilderSectionConfig[] = [
  {
    key: 'section',
    label: 'Section',
    icon: 'kind-icon:mask',
    title: 'Character Section',
    summary: 'Choose dream context, genre, and the role this character plays.',
  },
  {
    key: 'name',
    label: 'Name',
    icon: 'kind-icon:signature',
    title: 'Name and Identity',
    summary: 'Choose name, honorific, class, and alignment.',
  },
  {
    key: 'race',
    label: 'Race',
    icon: 'kind-icon:species',
    title: 'Race / Species',
    summary:
      'Choose the character race or species. This saves to Character.species.',
  },
  {
    key: 'gender',
    label: 'Gender',
    icon: 'kind-icon:person',
    title: 'Gender and Presentation',
    summary: 'Choose gender identity, presentation, and personality context.',
  },
  {
    key: 'stats',
    label: 'Stats',
    icon: 'kind-icon:activity',
    title: 'Stats',
    summary: 'Set six core stats and four goal-axis values.',
  },
  {
    key: 'skills',
    label: 'Skills',
    icon: 'kind-icon:sparkles',
    title: 'Skills',
    summary: 'Define skills, inventory, and quirks.',
  },
  {
    key: 'background',
    label: 'Background',
    icon: 'kind-icon:story',
    title: 'Background',
    summary: 'Define drive, backstory, and achievements.',
  },
  {
    key: 'art',
    label: 'Art',
    icon: 'kind-icon:palette',
    title: 'Character Art',
    summary: 'Create, upload, generate, or select character art.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Character Summary',
    summary: 'Review and save the character.',
  },
]

const selectedDreamLabel = computed(() => {
  return (
    dreamOptions.value.find((dream) => dream.id === selectedDreamId.value)
      ?.label ?? ''
  )
})

const sectionTitle = computed(() => {
  return selectedDreamLabel.value
    ? `${characterRole.value} in ${selectedDreamLabel.value}`
    : `${characterRole.value} character`
})

const sectionPreview = computed(() => {
  return [
    genre.value ? `Genre: ${genre.value}.` : '',
    selectedDreamLabel.value ? `Dream: ${selectedDreamLabel.value}.` : '',
    `Role: ${characterRole.value}.`,
  ]
    .filter(Boolean)
    .join(' ')
})

const canSave = computed(() => {
  return name.value.trim().length > 0
})

const summaryItems = computed<BuilderChoiceSummary[]>(() => [
  {
    key: 'section',
    label: 'Section',
    value: sectionPreview.value,
    icon: 'kind-icon:mask',
    description: 'Dream context and character role.',
    editSection: 'section',
  },
  {
    key: 'name',
    label: 'Name',
    value: name.value,
    icon: 'kind-icon:signature',
    description: `${honorific.value || 'adventurer'} · ${characterClass.value || 'unclassed'}`,
    editSection: 'name',
  },
  {
    key: 'species',
    label: 'Race / Species',
    value: species.value,
    icon: 'kind-icon:species',
    description: 'Saved to Character.species.',
    editSection: 'race',
  },
  {
    key: 'gender',
    label: 'Gender',
    value: genderIdentity.value,
    icon: 'kind-icon:person',
    description: presentation.value || 'Presentation not set.',
    editSection: 'gender',
  },
  {
    key: 'stats',
    label: 'Stats',
    value: stats.map((stat) => `${stat.name}: ${stat.value}`).join(', '),
    icon: 'kind-icon:activity',
    description: 'Six flexible character stats.',
    editSection: 'stats',
  },
  {
    key: 'skills',
    label: 'Skills',
    value: skills.value,
    icon: 'kind-icon:sparkles',
    description: quirks.value || 'No quirks yet.',
    editSection: 'skills',
  },
  {
    key: 'background',
    label: 'Background',
    value: backstory.value,
    icon: 'kind-icon:story',
    description: drive.value || 'No drive yet.',
    editSection: 'background',
  },
  {
    key: 'art',
    label: 'Art',
    value: artPrompt.value,
    image: imagePath.value,
    icon: 'kind-icon:palette',
    description: 'Character portrait or concept art.',
    editSection: 'art',
  },
  {
    key: 'save',
    label: 'Save Status',
    value: selectedCharacterId.value
      ? `Saved as #${selectedCharacterId.value}`
      : 'Not saved yet',
    icon: selectedCharacterId.value ? 'kind-icon:check' : 'kind-icon:save',
    description:
      'Saved characters can connect to dreams, rewards, and scenarios.',
    editSection: 'summary',
  },
])

function rollFrom(key: string, fallback = '') {
  return randomStore.getRandom(key, 1)[0] ?? fallback
}

function rollSection() {
  genre.value = rollFrom('genre', genre.value)
  characterRole.value =
    rollFrom('class', characterRole.value) || characterRole.value
}

function rollName() {
  name.value = rollFrom('name', name.value)
}

function rollIdentity() {
  honorific.value = rollFrom('honorific', honorific.value)
  characterClass.value = rollFrom('class', characterClass.value)
  alignment.value = `${rollFrom('adjective', 'Chaotic')} ${rollFrom('personality', 'Helpful')}`
}

function buildNameFromParts() {
  const rolledName = name.value || rollFrom('name', 'Ami')
  const rolledTitle = honorific.value || rollFrom('honorific', 'adventurer')
  name.value = `${rolledName} the ${capitalize(rolledTitle)}`
}

function rollSpecies() {
  species.value = rollFrom('species', species.value)
}

function makeSpeciesWeird() {
  const adjective = rollFrom('adjective', 'strange')
  const animal = rollFrom('animal', 'moth')
  species.value = `${capitalize(adjective)} ${capitalize(animal)}-kin`
}

function rollPersonality() {
  personality.value = rollFrom('personality', personality.value)
}

function appendGenderToPersonality() {
  const additions = [
    genderIdentity.value ? `Gender identity: ${genderIdentity.value}.` : '',
    presentation.value ? `Presentation: ${presentation.value}.` : '',
  ].filter(Boolean)

  if (!additions.length) return

  personality.value = [personality.value.trim(), ...additions]
    .filter(Boolean)
    .join('\n')
}

function rollStats() {
  for (const stat of stats) {
    stat.value = Math.floor(Math.random() * 101)
  }

  for (const goal of goalStats) {
    goal.value = Math.floor(Math.random() * 201) - 100
  }
}

function applyStatRow(
  rows: StatRow[],
  index: number,
  name: string,
  value: number,
) {
  const row = rows[index]

  if (!row) return

  row.name = name
  row.value = value
}

function resetStats() {
  const defaults: Array<Pick<StatRow, 'name' | 'value'>> = [
    { name: 'Luck', value: 59 },
    { name: 'Swol', value: 49 },
    { name: 'Wits', value: 72 },
    { name: 'Flexibility', value: 93 },
    { name: 'Rizz', value: 9 },
    { name: 'Empathy', value: 71 },
  ]

  defaults.forEach((item, index) => {
    applyStatRow(stats, index, item.name, item.value)
  })

  applyStatRow(goalStats, 0, 'Principled|Chaotic', 0)
  applyStatRow(goalStats, 1, 'Introvert|Extrovert', 0)
  applyStatRow(goalStats, 2, 'Passive|Aggressive', 0)
  applyStatRow(goalStats, 3, 'Optimist|Pessimist', 0)
}
function rollSkills() {
  const rolled = [rollFrom('skill'), rollFrom('skill'), rollFrom('skill')]
    .filter(Boolean)
    .join(', ')

  skills.value = mergeText(skills.value, rolled)
}

function rollInventory() {
  const rolled = [rollFrom('inventory'), rollFrom('item'), rollFrom('material')]
    .filter(Boolean)
    .join(', ')

  inventory.value = mergeText(inventory.value, rolled)
}

function rollQuirks() {
  const rolled = [rollFrom('quirk'), rollFrom('quirk')]
    .filter(Boolean)
    .join(', ')

  quirks.value = mergeText(quirks.value, rolled)
}

function rollBackstory() {
  backstory.value = rollFrom('backstory', backstory.value)
}

function buildBackstory() {
  const parts = [
    name.value
      ? `${name.value} is ${articleFor(species.value)} ${species.value || 'mysterious being'}.`
      : '',
    characterClass.value ? `They are known as a ${characterClass.value}.` : '',
    characterRole.value ? `Their role is ${characterRole.value}.` : '',
    drive.value ? `Drive: ${drive.value}.` : '',
    personality.value ? `Personality: ${personality.value}` : '',
    genderIdentity.value ? `Gender identity: ${genderIdentity.value}.` : '',
    presentation.value ? `Presentation: ${presentation.value}.` : '',
    selectedDreamLabel.value
      ? `They are connected to ${selectedDreamLabel.value}.`
      : '',
  ]

  backstory.value = parts.filter(Boolean).join(' ')
}

function updateCharacterArt(payload: ArtCreatorPayload) {
  artPrompt.value = payload.prompt
  imagePath.value = payload.imagePath
}

async function fetchDreams() {
  try {
    const res = (await performFetch<Dream[]>(
      '/api/dream',
    )) as PerformFetchResult<Dream[]>

    if (!res.success || !Array.isArray(res.data)) {
      dreamOptions.value = []
      return
    }

    dreamOptions.value = res.data
      .filter((item) => item && item.id)
      .map((item) => ({
        id: item.id,
        label: item.title || `Dream #${item.id}`,
      }))
  } catch (error) {
    handleError(error, 'fetching dreams for character-builder')
    dreamOptions.value = []
  }
}

async function saveCharacter() {
  if (!canSave.value) {
    saveError.value = 'Add a character name before saving.'
    return
  }

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    const body: Partial<Character> & Record<string, unknown> = {
      name: name.value.trim(),
      achievements: achievements.value.trim() || null,
      alignment: alignment.value.trim() || null,
      experience: experience.value,
      level: level.value,
      class: characterClass.value.trim() || null,
      species: species.value.trim() || null,
      backstory: backstoryWithGender.value,
      drive: drive.value.trim() || null,
      inventory: inventory.value.trim() || null,
      quirks: quirks.value.trim() || null,
      skills: skills.value.trim() || null,
      genre: genre.value.trim() || null,
      isPublic: isPublic.value,
      isMature: isMature.value,
      isActive: isActive.value,
      userId: userStore.userId || 10,
      artPrompt: artPrompt.value.trim() || null,
      honorific: honorific.value.trim() || 'adventurer',
      imagePath: imagePath.value || null,
      designer: getDesignerName(),
      personality: personalityWithGender.value,
      statName1: stats[0]?.name || 'Luck',
      statValue1: stats[0]?.value ?? 59,
      statName2: stats[1]?.name || 'Swol',
      statValue2: stats[1]?.value ?? 49,
      statName3: stats[2]?.name || 'Wits',
      statValue3: stats[2]?.value ?? 72,
      statName4: stats[3]?.name || 'Flexibility',
      statValue4: stats[3]?.value ?? 93,
      statName5: stats[4]?.name || 'Rizz',
      statValue5: stats[4]?.value ?? 9,
      statName6: stats[5]?.name || 'Empathy',
      statValue6: stats[5]?.value ?? 71,
      goalStat1Name: goalStats[0]?.name || 'Principled|Chaotic',
      goalStat1Value: goalStats[0]?.value ?? 0,
      goalStat2Name: goalStats[1]?.name || 'Introvert|Extrovert',
      goalStat2Value: goalStats[1]?.value ?? 0,
      goalStat3Name: goalStats[2]?.name || 'Passive|Aggressive',
      goalStat3Value: goalStats[2]?.value ?? 0,
      goalStat4Name: goalStats[3]?.name || 'Optimist|Pessimist',
      goalStat4Value: goalStats[3]?.value ?? 0,
    }

    if (selectedDreamId.value) {
      body.dreamId = selectedDreamId.value
      body.dreamIds = [selectedDreamId.value]
    }

    const res = (await performFetch<Character>(CHARACTER_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Character>

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save character.')
    }

    selectedCharacterId.value = res.data.id
    saveMessage.value = `Saved character #${res.data.id}. They are legally allowed to cause plot now.`
  } catch (error) {
    handleError(error, 'saving character from character-builder')
    saveError.value =
      error instanceof Error ? error.message : 'Failed to save character.'
  } finally {
    isSaving.value = false
  }
}

const personalityWithGender = computed(() => {
  const details = [
    personality.value.trim(),
    genderIdentity.value ? `Gender identity: ${genderIdentity.value}.` : '',
    presentation.value ? `Presentation: ${presentation.value}.` : '',
  ]

  return details.filter(Boolean).join('\n') || null
})

const backstoryWithGender = computed(() => {
  const details = [
    backstory.value.trim(),
    genderIdentity.value ? `Gender identity: ${genderIdentity.value}.` : '',
    presentation.value ? `Presentation: ${presentation.value}.` : '',
  ]

  return details.filter(Boolean).join('\n') || null
})

function getDesignerName() {
  const store = userStore as unknown as {
    designer?: string
    designerName?: string
    username?: string
  }

  return store.designer || store.designerName || store.username || null
}

function mergeText(current: string, addition: string) {
  if (!addition.trim()) return current
  if (!current.trim()) return addition

  return `${current.trim()}, ${addition}`
}

function articleFor(value: string) {
  const first = value.trim().charAt(0).toLowerCase()
  return ['a', 'e', 'i', 'o', 'u'].includes(first) ? 'an' : 'a'
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
  await fetchDreams()
})
</script>
