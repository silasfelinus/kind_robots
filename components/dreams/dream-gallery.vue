<!-- /components/dreams/dream-gallery.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow md:flex-row md:items-center md:justify-between"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <Icon name="kind-icon:dream" class="h-7 w-7 text-primary" />
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            Vibe Gallery
          </p>
          <span class="badge badge-outline rounded-xl">
            {{ filteredDreams.length }} Dream{{
              filteredDreams.length === 1 ? '' : 's'
            }}
          </span>
        </div>

        <h2 class="mt-1 text-2xl font-black text-base-content">
          {{ title }}
        </h2>

        <p class="mt-1 max-w-4xl text-sm text-base-content/65">
          {{ subtitle }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          :disabled="dreamStore.loading"
          @click="refresh"
        >
          <span
            v-if="dreamStore.loading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>

        <button
          type="button"
          class="btn btn-primary btn-sm rounded-2xl text-white"
          @click="startNewDream"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          New Dream
        </button>
      </div>
    </header>

    <section
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]"
    >
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
      >
        <section
          v-if="showControls"
          class="shrink-0 border-b border-base-300 bg-base-200 p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="font-black text-primary">Dreams</h3>
              <p class="text-xs text-base-content/60">
                Themes, vibes, pitches, locations, and story gravity wells.
              </p>
            </div>

            <button
              type="button"
              class="btn btn-xs btn-outline rounded-xl"
              :disabled="dreamStore.loading"
              @click="refresh"
            >
              <span
                v-if="dreamStore.loading"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:refresh" class="h-3 w-3" />
            </button>
          </div>

          <label
            class="input input-bordered input-sm mt-3 flex items-center gap-2 rounded-2xl bg-base-100"
          >
            <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
            <input
              v-model="search"
              class="grow"
              type="search"
              placeholder="Search vibes, scenarios, cast..."
            />
          </label>

          <div class="mt-2 grid grid-cols-2 gap-2">
            <select
              v-model="dreamTypeFilter"
              class="select select-bordered select-sm rounded-2xl bg-base-100"
            >
              <option value="">All types</option>
              <option
                v-for="type in dreamStore.dreamTypes"
                :key="type"
                :value="type"
              >
                {{ dreamTypeLabel(type) }}
              </option>
            </select>

            <select
              v-model="displayMode"
              class="select select-bordered select-sm rounded-2xl bg-base-100"
            >
              <option value="cards">Cards</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>

          <div class="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-sm rounded-2xl"
              :class="showMine ? 'btn-secondary' : 'btn-outline'"
              @click="showMine = !showMine"
            >
              <Icon name="kind-icon:user" class="h-4 w-4" />
              Mine
            </button>

            <button
              type="button"
              class="btn btn-sm rounded-2xl"
              :class="showInactive ? 'btn-warning' : 'btn-outline'"
              @click="showInactive = !showInactive"
            >
              <Icon name="kind-icon:archive" class="h-4 w-4" />
              Archived
            </button>
          </div>
        </section>

        <section
          v-if="displayMode === 'dropdown'"
          class="shrink-0 border-b border-base-300 bg-base-100 p-3"
        >
          <select
            class="select select-bordered w-full rounded-2xl bg-base-200"
            :value="selectedDreamId"
            @change="selectFromDropdown"
          >
            <option value="">Choose a Dream...</option>
            <option
              v-for="dream in filteredDreams"
              :key="dream.id"
              :value="dream.id"
            >
              {{ dream.title || `Dream #${dream.id}` }} ·
              {{ dreamTypeLabel(dream.dreamType) }}
            </option>
          </select>
        </section>

        <section class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          <div
            v-if="filteredDreams.length && displayMode === 'cards'"
            class="grid gap-2"
          >
            <article
              v-for="dream in filteredDreams"
              :key="dream.id"
              class="group cursor-pointer overflow-hidden rounded-2xl border bg-base-200 transition hover:-translate-y-0.5 hover:shadow"
              :class="dreamCardClass(dream)"
              @click="selectDream(dream.id)"
            >
              <div class="flex gap-3 p-2">
                <div
                  v-if="showImages"
                  class="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-300"
                >
                  <img
                    v-if="previewImage(dream)"
                    :src="previewImage(dream)"
                    :alt="`${dream.title || 'Dream'} preview`"
                    class="h-full w-full object-cover transition group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
                  >
                    <Icon name="kind-icon:dream" class="h-9 w-9 opacity-70" />
                  </div>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div class="min-w-0">
                      <h4 class="line-clamp-1 font-black text-base-content">
                        {{ dream.title || 'Untitled Dream' }}
                      </h4>
                      <p
                        v-if="showMeta"
                        class="mt-0.5 text-xs text-base-content/50"
                      >
                        #{{ dream.id }} · {{ dreamTypeLabel(dream.dreamType) }}
                      </p>
                    </div>

                    <span
                      v-if="dream.isMature"
                      class="badge badge-warning badge-sm rounded-xl"
                    >
                      Mature
                    </span>
                  </div>

                  <p
                    v-if="showDescriptions"
                    class="mt-2 line-clamp-3 text-sm leading-relaxed text-base-content/70"
                  >
                    {{
                      dream.pitch ||
                      dream.description ||
                      dream.flavorText ||
                      'No Dream pitch yet.'
                    }}
                  </p>

                  <div class="mt-2 flex flex-wrap gap-1">
                    <span
                      v-if="scenarioCount(dream)"
                      class="badge badge-secondary badge-sm rounded-xl"
                    >
                      {{ scenarioCount(dream) }} Scenario{{
                        scenarioCount(dream) === 1 ? '' : 's'
                      }}
                    </span>
                    <span
                      v-if="characterCount(dream)"
                      class="badge badge-accent badge-sm rounded-xl"
                    >
                      {{ characterCount(dream) }} Cast
                    </span>
                    <span
                      v-if="artCount(dream)"
                      class="badge badge-info badge-sm rounded-xl"
                    >
                      {{ artCount(dream) }} Art
                    </span>
                  </div>
                </div>
              </div>

              <footer
                v-if="showCardActions"
                class="flex flex-wrap justify-end gap-2 border-t border-base-300 bg-base-100 p-2"
                @click.stop
              >
                <button
                  type="button"
                  class="btn btn-primary btn-xs rounded-xl text-white"
                  :disabled="dreamStore.loading"
                  @click="selectDream(dream.id)"
                >
                  <Icon name="kind-icon:target" class="h-3 w-3" />
                  Select
                </button>

                <button
                  type="button"
                  class="btn btn-outline btn-xs rounded-xl"
                  @click="editDream(dream)"
                >
                  <Icon name="kind-icon:edit" class="h-3 w-3" />
                  Edit
                </button>
              </footer>
            </article>
          </div>

          <div
            v-else-if="!filteredDreams.length"
            class="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-base-content/55"
          >
            <Icon name="kind-icon:ghost" class="h-14 w-14 text-primary/60" />
            <div>
              <p class="text-lg font-black">No Dreams found.</p>
              <p class="mt-1 text-sm">
                Make a vibe, loosen the filters, or ask the sorting goblin to
                apologize.
              </p>
            </div>
            <button
              type="button"
              class="btn btn-primary btn-sm rounded-2xl text-white"
              @click="startNewDream"
            >
              <Icon name="kind-icon:plus" class="h-4 w-4" />
              Make a Dream
            </button>
          </div>
        </section>
      </aside>

      <main
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
      >
        <section
          v-if="selectedDream"
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <header class="border-b border-base-300 bg-base-200 p-3">
            <div class="grid gap-3 lg:grid-cols-[12rem_minmax(0,1fr)_auto]">
              <figure
                v-if="showImages"
                class="relative aspect-4/5 overflow-hidden rounded-2xl border border-base-300 bg-base-300"
              >
                <img
                  v-if="selectedImage"
                  :src="selectedImage"
                  :alt="`${selectedDream.title || 'Dream'} image`"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
                >
                  <Icon name="kind-icon:dream" class="h-20 w-20 opacity-70" />
                </div>
              </figure>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge badge-primary rounded-xl">
                    {{ dreamTypeLabel(selectedDream.dreamType) }}
                  </span>
                  <span
                    class="badge rounded-xl"
                    :class="
                      selectedDream.isPublic ? 'badge-success' : 'badge-ghost'
                    "
                  >
                    {{ selectedDream.isPublic ? 'Public' : 'Private' }}
                  </span>
                  <span
                    class="badge rounded-xl"
                    :class="
                      selectedDream.isActive ? 'badge-info' : 'badge-warning'
                    "
                  >
                    {{ selectedDream.isActive ? 'Active' : 'Archived' }}
                  </span>
                </div>

                <h2
                  class="mt-2 text-3xl font-black leading-tight text-base-content"
                >
                  {{ selectedDream.title || 'Untitled Dream' }}
                </h2>

                <p
                  class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/70"
                >
                  {{ selectedLead }}
                </p>
              </div>

              <div
                v-if="showCardActions"
                class="flex flex-wrap items-start gap-2 lg:flex-col"
              >
                <button
                  type="button"
                  class="btn btn-outline btn-sm rounded-2xl"
                  @click="editDream(selectedDream)"
                >
                  <Icon name="kind-icon:edit" class="h-4 w-4" />
                  Edit
                </button>

                <button
                  type="button"
                  class="btn btn-ghost btn-sm rounded-2xl text-error"
                  :disabled="dreamStore.isDeleting"
                  @click="archiveDream(selectedDream)"
                >
                  <span
                    v-if="dreamStore.isDeleting"
                    class="loading loading-spinner loading-xs"
                  />
                  <Icon v-else name="kind-icon:archive" class="h-4 w-4" />
                  Archive
                </button>
              </div>
            </div>

            <div
              v-if="showStats"
              class="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4"
            >
              <div
                v-for="stat in selectedStats"
                :key="stat.label"
                class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center"
              >
                <p class="text-2xl font-black" :class="stat.className">
                  {{ stat.count }}
                </p>
                <p class="text-xs text-base-content/50">{{ stat.label }}</p>
              </div>
            </div>
          </header>

          <section class="grid gap-3 p-3">
            <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 class="text-lg font-black text-primary">Dream Shape</h3>
                  <p class="text-sm text-base-content/60">
                    The vibe, pitch, location, or thematic cloud everything else
                    orbits.
                  </p>
                </div>
                <span class="badge badge-outline rounded-xl">
                  {{
                    selectedDream.designer ||
                    selectedDream.User?.username ||
                    'Kind Designer'
                  }}
                </span>
              </div>

              <div class="mt-3 grid gap-3 lg:grid-cols-2">
                <article
                  v-if="selectedDream.pitch"
                  class="rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <p
                    class="text-xs font-black uppercase tracking-wide text-primary"
                  >
                    Pitch
                  </p>
                  <p
                    class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75"
                  >
                    {{ selectedDream.pitch }}
                  </p>
                </article>

                <article
                  v-if="selectedDream.description"
                  class="rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <p
                    class="text-xs font-black uppercase tracking-wide text-secondary"
                  >
                    Description
                  </p>
                  <p
                    class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75"
                  >
                    {{ selectedDream.description }}
                  </p>
                </article>

                <article
                  v-if="selectedDream.flavorText"
                  class="rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <p
                    class="text-xs font-black uppercase tracking-wide text-accent"
                  >
                    Flavor
                  </p>
                  <p
                    class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75"
                  >
                    {{ selectedDream.flavorText }}
                  </p>
                </article>

                <article
                  v-if="selectedDream.artPrompt"
                  class="rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <p
                    class="text-xs font-black uppercase tracking-wide text-info"
                  >
                    Art Direction
                  </p>
                  <p
                    class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75"
                  >
                    {{ selectedDream.artPrompt }}
                  </p>
                </article>
              </div>
            </section>

            <section
              v-if="relatedDreams.length"
              class="rounded-2xl border border-base-300 bg-base-200 p-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 class="text-lg font-black text-primary">
                    Related Dreams
                  </h3>
                  <p class="text-sm text-base-content/60">
                    Nearby vibes based on shared words, cast, scenarios,
                    rewards, and type.
                  </p>
                </div>
                <span class="badge badge-primary rounded-xl">
                  {{ relatedDreams.length }}
                </span>
              </div>

              <div class="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                <button
                  v-for="dream in relatedDreams"
                  :key="dream.id"
                  type="button"
                  class="group rounded-2xl border border-base-300 bg-base-100 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow"
                  @click="selectDream(dream.id)"
                >
                  <div class="flex gap-3">
                    <div
                      class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-base-300 text-primary"
                    >
                      <img
                        v-if="previewImage(dream)"
                        :src="previewImage(dream)"
                        :alt="`${dream.title || 'Related Dream'} preview`"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <Icon v-else name="kind-icon:dream" class="h-7 w-7" />
                    </div>

                    <div class="min-w-0">
                      <h4 class="line-clamp-1 font-black text-base-content">
                        {{ dream.title || `Dream #${dream.id}` }}
                      </h4>
                      <p class="mt-1 line-clamp-2 text-xs text-base-content/60">
                        {{
                          dream.pitch ||
                          dream.description ||
                          dream.flavorText ||
                          'No summary yet.'
                        }}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </section>

            <section
              v-if="showScenarios"
              class="rounded-2xl border border-base-300 bg-base-200 p-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 class="text-lg font-black text-secondary">
                    Scenarios & Locations
                  </h3>
                  <p class="text-sm text-base-content/60">
                    Playable branches attached to this Dream.
                  </p>
                </div>
                <span class="badge badge-secondary rounded-xl">
                  {{ scenarioRows.length }}
                </span>
              </div>

              <div
                v-if="scenarioRows.length"
                class="mt-3 grid gap-3 lg:grid-cols-2"
              >
                <article
                  v-for="scenario in scenarioRows"
                  :key="scenario.id"
                  class="rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <div class="flex gap-3">
                    <div
                      class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-300 text-secondary"
                    >
                      <img
                        v-if="readImage(asRecord(scenario))"
                        :src="readImage(asRecord(scenario))"
                        :alt="scenarioTitle(scenario)"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <Icon v-else name="kind-icon:map" class="h-8 w-8" />
                    </div>

                    <div class="min-w-0 flex-1">
                      <div
                        class="flex flex-wrap items-start justify-between gap-2"
                      >
                        <h4 class="line-clamp-1 font-black text-base-content">
                          {{ scenarioTitle(scenario) }}
                        </h4>
                        <span
                          v-if="scenario.genres"
                          class="badge badge-outline badge-sm rounded-xl"
                        >
                          {{ scenario.genres }}
                        </span>
                      </div>

                      <p
                        class="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-base-content/70"
                      >
                        {{ scenarioSummary(scenario) }}
                      </p>

                      <div
                        v-if="scenarioCharacters(scenario).length"
                        class="mt-2 flex flex-wrap gap-1"
                      >
                        <span
                          v-for="character in scenarioCharacters(
                            scenario,
                          ).slice(0, 6)"
                          :key="character.id"
                          class="badge badge-ghost badge-sm rounded-xl"
                        >
                          {{ characterName(character) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <div
                v-else
                class="mt-3 rounded-2xl border border-dashed border-base-300 bg-base-100 p-5 text-center text-sm text-base-content/50"
              >
                No scenarios connected yet.
              </div>
            </section>

            <section class="grid gap-3 xl:grid-cols-2">
              <section
                class="rounded-2xl border border-base-300 bg-base-200 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 class="text-lg font-black text-accent">Characters</h3>
                    <p class="text-sm text-base-content/60">
                      Cast connected directly or through attached scenarios.
                    </p>
                  </div>
                  <span class="badge badge-accent rounded-xl">
                    {{ characterRows.length }}
                  </span>
                </div>

                <div v-if="characterRows.length" class="mt-3 grid gap-2">
                  <article
                    v-for="character in characterRows"
                    :key="character.id"
                    class="flex gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div
                      class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-base-300 text-accent"
                    >
                      <img
                        v-if="readImage(asRecord(character))"
                        :src="readImage(asRecord(character))"
                        :alt="characterName(character)"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <Icon v-else name="kind-icon:user" class="h-7 w-7" />
                    </div>

                    <div class="min-w-0 flex-1">
                      <div
                        class="flex flex-wrap items-start justify-between gap-2"
                      >
                        <h4 class="line-clamp-1 font-black text-base-content">
                          {{ characterName(character) }}
                        </h4>
                        <span
                          v-if="character.species || character.class"
                          class="badge badge-outline badge-sm rounded-xl"
                        >
                          {{ character.species || character.class }}
                        </span>
                      </div>

                      <p class="mt-1 text-xs text-base-content/50">
                        {{
                          character.role ||
                          character.title ||
                          character.genre ||
                          'Dream cast'
                        }}
                      </p>

                      <p
                        class="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-base-content/70"
                      >
                        {{
                          character.backstory ||
                          character.description ||
                          character.personality ||
                          character.artPrompt ||
                          'No character notes yet.'
                        }}
                      </p>
                    </div>
                  </article>
                </div>

                <div
                  v-else
                  class="mt-3 rounded-2xl border border-dashed border-base-300 bg-base-100 p-5 text-center text-sm text-base-content/50"
                >
                  No cast connected yet.
                </div>
              </section>

              <section
                class="rounded-2xl border border-base-300 bg-base-200 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 class="text-lg font-black text-info">Art & Rewards</h3>
                    <p class="text-sm text-base-content/60">
                      Images and objects that give this Dream texture.
                    </p>
                  </div>
                  <span class="badge badge-info rounded-xl">
                    {{ artRows.length + rewardRows.length }}
                  </span>
                </div>

                <div
                  v-if="artRows.length || rewardRows.length"
                  class="mt-3 grid gap-2"
                >
                  <article
                    v-for="art in artRows.slice(0, 4)"
                    :key="art.key"
                    class="flex gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div
                      class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-base-300 text-info"
                    >
                      <img
                        v-if="art.image"
                        :src="art.image"
                        :alt="art.title"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <Icon v-else name="kind-icon:image" class="h-7 w-7" />
                    </div>

                    <div class="min-w-0 flex-1">
                      <h4 class="line-clamp-1 font-black text-base-content">
                        {{ art.title }}
                      </h4>
                      <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
                        {{ art.body }}
                      </p>
                    </div>
                  </article>

                  <article
                    v-for="reward in rewardRows.slice(0, 4)"
                    :key="reward.key"
                    class="flex gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div
                      class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-base-300 text-warning"
                    >
                      <img
                        v-if="reward.image"
                        :src="reward.image"
                        :alt="reward.title"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <Icon v-else name="kind-icon:gift" class="h-7 w-7" />
                    </div>

                    <div class="min-w-0 flex-1">
                      <div
                        class="flex flex-wrap items-start justify-between gap-2"
                      >
                        <h4 class="line-clamp-1 font-black text-base-content">
                          {{ reward.title }}
                        </h4>
                        <span
                          v-if="reward.badge"
                          class="badge badge-outline badge-sm rounded-xl"
                        >
                          {{ reward.badge }}
                        </span>
                      </div>

                      <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
                        {{ reward.body }}
                      </p>
                    </div>
                  </article>
                </div>

                <div
                  v-else
                  class="mt-3 rounded-2xl border border-dashed border-base-300 bg-base-100 p-5 text-center text-sm text-base-content/50"
                >
                  No art or rewards connected yet.
                </div>
              </section>
            </section>

            <section
              class="rounded-2xl border border-primary/30 bg-primary/5 p-4"
            >
              <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div class="min-w-0">
                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <h3 class="text-lg font-black text-primary">Narrator</h3>
                      <p class="text-sm text-base-content/65">
                        A focused Dream guide, not a public chatroom. Tiny but
                        mighty.
                      </p>
                    </div>

                    <span class="badge badge-primary rounded-xl">
                      {{ narratorName }}
                    </span>
                  </div>

                  <div
                    v-if="narratorStatusMessage"
                    class="mt-3 rounded-2xl border p-3 text-sm"
                    :class="
                      narratorStatusTone === 'error'
                        ? 'border-error/40 bg-error/10 text-error'
                        : 'border-success/40 bg-success/10 text-success'
                    "
                  >
                    {{ narratorStatusMessage }}
                  </div>

                  <div
                    v-if="narratorSession.length"
                    ref="narratorLogRef"
                    class="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div class="grid gap-3">
                      <article
                        v-for="chat in narratorSession"
                        :key="chat.id"
                        class="grid gap-2"
                      >
                        <div
                          class="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-content"
                        >
                          <p class="whitespace-pre-wrap">{{ chat.content }}</p>
                        </div>

                        <div class="flex max-w-[90%] gap-3">
                          <img
                            :src="narratorImage"
                            :alt="narratorName"
                            class="h-9 w-9 shrink-0 rounded-full border border-base-300 object-cover"
                            loading="lazy"
                          />
                          <div
                            class="rounded-2xl rounded-bl-sm bg-base-100 px-4 py-3 text-sm leading-relaxed shadow-sm"
                          >
                            <span
                              v-if="!chat.botResponse"
                              class="flex items-center gap-1 py-1 text-base-content/60"
                            >
                              <span class="narrator-dot" />
                              <span class="narrator-dot delay-150" />
                              <span class="narrator-dot delay-300" />
                            </span>
                            <p
                              v-else
                              class="whitespace-pre-wrap text-base-content/80"
                            >
                              {{ chat.botResponse }}
                            </p>
                          </div>
                        </div>
                      </article>
                    </div>
                  </div>

                  <div
                    class="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <textarea
                      v-model="narratorMessage"
                      class="textarea textarea-bordered min-h-24 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
                      :placeholder="narratorPlaceholder"
                      :disabled="!narratorBot || isNarratorResponding"
                      @keydown.ctrl.enter.prevent="sendNarratorMessage"
                      @keydown.meta.enter.prevent="sendNarratorMessage"
                    />
                    <button
                      type="button"
                      class="btn btn-primary min-h-24 rounded-2xl text-white"
                      :disabled="!canSendNarrator"
                      @click="sendNarratorMessage"
                    >
                      <span
                        v-if="isNarratorResponding"
                        class="loading loading-spinner loading-sm"
                      />
                      <span v-else>Ask</span>
                    </button>
                  </div>

                  <div class="mt-2 flex flex-wrap gap-2">
                    <button
                      v-for="prompt in narratorPrompts"
                      :key="prompt"
                      type="button"
                      class="btn btn-xs btn-outline rounded-xl"
                      :disabled="isNarratorResponding"
                      @click="narratorMessage = prompt"
                    >
                      {{ prompt }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-xs btn-ghost rounded-xl"
                      :disabled="isNarratorResponding"
                      @click="clearNarratorSession"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <aside
                  class="rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <div class="flex gap-3">
                    <img
                      :src="narratorImage"
                      :alt="narratorName"
                      class="h-16 w-16 shrink-0 rounded-2xl border border-base-300 object-cover"
                      loading="lazy"
                    />
                    <div class="min-w-0">
                      <h4 class="line-clamp-1 font-black text-base-content">
                        {{ narratorName }}
                      </h4>
                      <p class="mt-1 line-clamp-3 text-xs text-base-content/60">
                        {{ narratorSummary }}
                      </p>
                    </div>
                  </div>

                  <div
                    class="mt-3 rounded-2xl bg-base-200 p-3 text-xs text-base-content/60"
                  >
                    <p class="font-black uppercase tracking-wide text-primary">
                      Context
                    </p>
                    <p class="mt-2 whitespace-pre-wrap">
                      {{ narratorContextPreview }}
                    </p>
                  </div>

                  <p class="mt-3 text-xs text-base-content/45">
                    Text server: {{ activeServerName }}
                  </p>
                </aside>
              </div>
            </section>
          </section>
        </section>

        <section
          v-else
          class="flex min-h-0 flex-1 items-center justify-center p-6"
        >
          <div
            class="max-w-lg rounded-2xl border border-dashed border-base-300 bg-base-200 p-8 text-center"
          >
            <Icon
              name="kind-icon:dream"
              class="mx-auto h-16 w-16 text-primary/60"
            />
            <h2 class="mt-3 text-2xl font-black">Choose a Dream</h2>
            <p class="mt-2 text-base-content/60">
              Select a vibe from the gallery to see its related Dreams,
              scenarios, cast, art, rewards, and Narrator.
            </p>
            <button
              type="button"
              class="btn btn-primary mt-4 rounded-2xl text-white"
              @click="startNewDream"
            >
              <Icon name="kind-icon:plus" class="h-4 w-4" />
              Make a Dream
            </button>
          </div>
        </section>
      </main>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type {
  ArtImage,
  Bot,
  Character,
  Chat,
  Reward,
  Scenario,
  Server,
} from '~/prisma/generated/prisma/client'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type DreamScenarioWithCharacters = Scenario & {
  Characters?: Partial<Character>[]
}

type BotCafeMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type NarratorChat = Chat & {
  botResponse?: string | null
}

type DisplayEntry = {
  key: string
  title: string
  body: string
  icon: string
  image?: string
  badge?: string
}

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    showHeader?: boolean
    showControls?: boolean
    showImages?: boolean
    showCardActions?: boolean
    showStats?: boolean
    showMeta?: boolean
    showDescriptions?: boolean
    showScenarios?: boolean
    variant?: 'dashboard' | 'compact' | 'dropdown'
    openTab?: string
  }>(),
  {
    title: 'Dream Gallery',
    subtitle:
      'Browse Dreams as vibes, then inspect the worlds, cast, art, related Dreams, and Narrator attached to each one.',
    showHeader: true,
    showControls: true,
    showImages: true,
    showCardActions: true,
    showStats: true,
    showMeta: true,
    showDescriptions: true,
    showScenarios: true,
    variant: 'dashboard',
    openTab: 'dreams',
  },
)

const emit = defineEmits<{
  (event: 'selected', dream: DreamWithRelations): void
  (event: 'opened', dream: DreamWithRelations): void
  (event: 'editing', dream: DreamWithRelations): void
  (event: 'created'): void
}>()

const dreamStore = useDreamStore()
const navStore = useNavStore()
const botStore = useBotStore()
const chatStore = useChatStore()
const promptStore = usePromptStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const search = ref('')
const showMine = ref(false)
const showInactive = ref(false)
const dreamTypeFilter = ref('')
const displayMode = ref<'cards' | 'dropdown'>(
  props.variant === 'dropdown' ? 'dropdown' : 'cards',
)

const narratorMessage = ref('')
const narratorStatusMessage = ref('')
const narratorStatusTone = ref<'success' | 'error'>('success')
const narratorSessionIds = ref<number[]>([])
const narratorLogRef = ref<HTMLElement | null>(null)
const narratorTemperature = ref(0.8)
const narratorMaxTokens = ref(1600)

const selectedDream = computed(() => dreamStore.selectedDream)
const selectedDreamId = computed(() => dreamStore.selectedDream?.id ?? '')

const dreamSource = computed(() => {
  return showInactive.value ? dreamStore.dreams : dreamStore.visibleDreams
})

const filteredDreams = computed(() => {
  const term = search.value.trim().toLowerCase()

  return dreamSource.value.filter((dream: DreamWithRelations) => {
    if (showMine.value && dream.userId !== dreamStore.currentUserId)
      return false
    if (dreamTypeFilter.value && dream.dreamType !== dreamTypeFilter.value)
      return false
    if (!term) return true

    return dreamSearchText(dream).toLowerCase().includes(term)
  })
})

const selectedImage = computed(() => {
  const dream = selectedDream.value
  if (!dream) return ''

  return previewImage(dream)
})

const selectedLead = computed(() => {
  const dream = selectedDream.value
  if (!dream) return ''

  return (
    dream.pitch ||
    dream.description ||
    dream.flavorText ||
    dream.artPrompt ||
    'No Dream text yet. Extremely rude of the void.'
  )
})

const scenarioRows = computed<DreamScenarioWithCharacters[]>(() => {
  const dream = selectedDream.value
  if (!dream) return []

  const rows = [
    dream.Scenario,
    ...((dream.Scenarios ?? []) as DreamScenarioWithCharacters[]),
  ].filter(Boolean) as DreamScenarioWithCharacters[]

  return uniqueById(rows)
})

const characterRows = computed<Character[]>(() => {
  const dream = selectedDream.value
  if (!dream) return []

  const direct = dream.Characters ?? []
  const scenarioCast = scenarioRows.value.flatMap(
    (scenario) => scenario.Characters ?? [],
  )

  return uniqueById([...direct, ...scenarioCast] as Character[])
})

const rewardRows = computed<DisplayEntry[]>(() => {
  return (selectedDream.value?.Rewards ?? []).map((reward, index) => {
    const record = asRecord(reward)
    const id = readId(record, index + 1)

    return {
      key: `reward-${id}`,
      title: readString(record, ['name', 'title', 'label']) || `Reward #${id}`,
      body:
        readString(record, [
          'description',
          'flavorText',
          'power',
          'text',
          'artPrompt',
        ]) || 'No reward notes yet.',
      icon: readString(record, ['icon']) || 'kind-icon:gift',
      image: readImage(record),
      badge: readString(record, ['rarity', 'rewardType', 'type']),
    }
  })
})

const artRows = computed<DisplayEntry[]>(() => {
  const dreamId = selectedDream.value?.id
  const selectedArt = dreamStore.selectedDreamCollectionArt ?? []
  const loadedArt = dreamId ? (dreamStore.galleryArt[dreamId] ?? []) : []
  const art = uniqueById([...selectedArt, ...loadedArt] as ArtImage[])

  return art.map((item, index) => {
    const record = asRecord(item)
    const id = readId(record, index + 1)

    return {
      key: `art-${id}`,
      title: readString(record, ['title', 'name']) || `Art #${id}`,
      body:
        readString(record, [
          'promptString',
          'prompt',
          'description',
          'artPrompt',
          'imagePath',
        ]) || 'No art prompt saved.',
      icon: readString(record, ['icon']) || 'kind-icon:image',
      image: readImage(record),
      badge: readBool(record, 'isMature') ? 'Mature' : undefined,
    }
  })
})

const relatedDreams = computed(() => {
  const selected = selectedDream.value
  if (!selected) return []

  return dreamSource.value
    .filter((dream) => dream.id !== selected.id)
    .map((dream) => ({
      dream,
      score: relationScore(selected, dream),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9)
    .map((entry) => entry.dream)
})

const selectedStats = computed(() => {
  return [
    {
      label: 'Related',
      count: relatedDreams.value.length,
      className: 'text-primary',
    },
    {
      label: 'Scenarios',
      count: scenarioRows.value.length,
      className: 'text-secondary',
    },
    {
      label: 'Characters',
      count: characterRows.value.length,
      className: 'text-accent',
    },
    {
      label: 'Art / Rewards',
      count: artRows.value.length + rewardRows.value.length,
      className: 'text-info',
    },
  ]
})

const narratorBot = computed<Bot | null>(() => {
  const dream = selectedDream.value
  const bots = botStore.visibleBots ?? []
  const dreamRecord = asRecord(dream)

  const explicitId = Number(
    dreamRecord.narratorBotId ??
      dreamRecord.botId ??
      dreamRecord.BotId ??
      dreamRecord.narratorId,
  )

  if (Number.isInteger(explicitId) && explicitId > 0) {
    const explicit = bots.find((bot) => bot.id === explicitId)
    if (explicit) return explicit
  }

  const title = String(dream?.title || '').toLowerCase()
  const dreamNamedNarrator = bots.find((bot) => {
    const haystack = [
      bot.name,
      bot.subtitle,
      bot.description,
      bot.tagline,
      bot.BotType,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return title && haystack.includes(title) && haystack.includes('narrator')
  })

  if (dreamNamedNarrator) return dreamNamedNarrator

  return (
    bots.find((bot) =>
      [bot.name, bot.subtitle, bot.description, bot.BotType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes('narrator'),
    ) ??
    bots.find((bot) => !bot.underConstruction) ??
    null
  )
})

const narratorName = computed(() => narratorBot.value?.name || 'Narrator')
const narratorImage = computed(
  () => narratorBot.value?.avatarImage || '/images/bot.webp',
)

const narratorSummary = computed(() => {
  const bot = narratorBot.value

  return (
    bot?.description ||
    bot?.subtitle ||
    bot?.tagline ||
    'Dream-facing guide for turning vibe into story motion.'
  )
})

const runtimeTextServer = computed<Server | null>(() => {
  const botServerId = narratorBot.value?.serverId

  if (typeof botServerId === 'number') {
    return (
      serverStore.getServerById(botServerId) ??
      serverStore.activeTextServer ??
      null
    )
  }

  return serverStore.activeTextServer ?? null
})

const activeServerName = computed(() => {
  const server = runtimeTextServer.value

  return server?.label || server?.title || 'Platform text route'
})

const narratorSession = computed<NarratorChat[]>(() => {
  return chatStore.chats.filter((chat) =>
    narratorSessionIds.value.includes(chat.id),
  ) as NarratorChat[]
})

const isNarratorResponding = computed(() => {
  return narratorSession.value.some((chat) => !chat.botResponse)
})

const canSendNarrator = computed(() => {
  return Boolean(
    selectedDream.value &&
    narratorBot.value &&
    narratorMessage.value.trim() &&
    !isNarratorResponding.value,
  )
})

const narratorPlaceholder = computed(() => {
  if (!narratorBot.value) return 'No Narrator bot found yet.'
  if (!selectedDream.value) return 'Select a Dream first.'

  return `Ask ${narratorName.value} about ${selectedDream.value.title || 'this Dream'}...`
})

const narratorPrompts = computed(() => {
  const title = selectedDream.value?.title || 'this Dream'

  return [
    `What is the strongest playable hook in ${title}?`,
    `Give me three scenario seeds for ${title}.`,
    `Who belongs in this Dream's cast?`,
  ]
})

const narratorContextPreview = computed(() => {
  const dream = selectedDream.value
  if (!dream) return 'No Dream selected.'

  return [
    dream.title ? `Dream: ${dream.title}` : '',
    dream.dreamType ? `Type: ${dreamTypeLabel(dream.dreamType)}` : '',
    dream.pitch || dream.description || dream.flavorText || '',
  ]
    .filter(Boolean)
    .join('\n\n')
})

watch(
  () => selectedDream.value?.id,
  async (id) => {
    narratorSessionIds.value = []
    narratorMessage.value = ''
    narratorStatusMessage.value = ''

    if (id) {
      await dreamStore.fetchArtForDream(id)
    }
  },
)

watch(
  () => narratorSession.value.map((chat) => chat.botResponse).join(''),
  async () => {
    await nextTick()
    scrollNarratorToBottom()
  },
)

onMounted(async () => {
  await Promise.all([
    dreamStore.initialize({ fetchRemote: true }),
    botStore.initialize({
      fetchRemote: true,
      initializeServerStore: false,
      createBlankForm: false,
    }),
    chatStore.initialize(),
    ...(serverStore.hasLoaded
      ? []
      : [serverStore.initialize({ fetchRemote: true })]),
  ])

  if (!selectedDream.value && filteredDreams.value.length) {
    await selectDream(filteredDreams.value[0].id)
  }
})

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function refresh() {
  await dreamStore.fetchDreams({ showInactive: showInactive.value })

  if (dreamStore.selectedDreamId) {
    await dreamStore.fetchDreamById(dreamStore.selectedDreamId, true)
  }
}

function startNewDream() {
  dreamStore.startAddingDream()
  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('created')
}

async function selectDream(id: number) {
  if (!Number.isInteger(id) || id <= 0) return

  const dream = await dreamStore.selectDreamById(id)

  if (!dream) return

  await dreamStore.fetchArtForDream(id)
  emit('selected', dream)
  emit('opened', dream)
}

async function selectFromDropdown(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  if (!Number.isInteger(id) || id <= 0) return

  await selectDream(id)
}

async function editDream(dream: DreamWithRelations) {
  const editing = await dreamStore.startEditingDream(dream.id)
  if (!editing) return

  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('editing', editing)
}

async function archiveDream(dream: DreamWithRelations) {
  await dreamStore.deleteDream(dream.id)
}

function dreamCardClass(dream: DreamWithRelations) {
  if (selectedDream.value?.id === dream.id) {
    return 'border-primary bg-primary/10 ring-2 ring-primary/20'
  }

  if (dream.isActive === false) return 'border-base-300 opacity-70'
  return 'border-base-300'
}

function scenarioCount(dream: DreamWithRelations) {
  return (
    dream._count?.Scenarios ??
    dream.Scenarios?.length ??
    (dream.Scenario ? 1 : 0)
  )
}

function characterCount(dream: DreamWithRelations) {
  return dream._count?.Characters ?? dream.Characters?.length ?? 0
}

function artCount(dream: DreamWithRelations) {
  return dream._count?.ArtImages ?? collectionArt(dream).length ?? 0
}

function collectionArt(dream: DreamWithRelations) {
  return [
    ...(dream.ArtImages ?? []),
    ...(dream.ArtCollection?.ArtImages ?? []),
    ...(dream.ArtCollections ?? []).flatMap(
      (collection) => collection.ArtImages ?? [],
    ),
  ]
}

function previewImage(dream: DreamWithRelations) {
  const firstCollectionImage = collectionArt(dream).find((art) => {
    return art.imagePath || art.path || art.fileName
  })

  return (
    dream.imagePath ||
    dream.highlightImage ||
    dream.ArtImage?.imagePath ||
    dream.ArtImage?.path ||
    dream.ArtImage?.fileName ||
    firstCollectionImage?.imagePath ||
    firstCollectionImage?.path ||
    firstCollectionImage?.fileName ||
    ''
  )
}

function scenarioTitle(scenario: Partial<Scenario>) {
  return scenario.title || `Scenario #${scenario.id}`
}

function scenarioSummary(scenario: Partial<Scenario>) {
  return (
    scenario.description ||
    scenario.locations ||
    scenario.genres ||
    scenario.inspirations ||
    'No scenario summary yet.'
  )
}

function scenarioCharacters(scenario: DreamScenarioWithCharacters) {
  return scenario.Characters ?? []
}

function characterName(character: Partial<Character>) {
  return (
    character.name ||
    character.title ||
    character.honorific ||
    `Character #${character.id}`
  )
}

function dreamSearchText(dream: DreamWithRelations) {
  const scenarioText = (
    (dream.Scenarios ?? []) as DreamScenarioWithCharacters[]
  )
    .map((scenario) => {
      const characterText =
        scenario.Characters?.map((character) =>
          [
            character.name,
            character.honorific,
            character.title,
            character.role,
            character.class,
            character.species,
            character.genre,
          ]
            .filter(Boolean)
            .join(' '),
        ).join(' ') ?? ''

      return [
        scenario.title,
        scenario.description,
        scenario.locations,
        scenario.genres,
        scenario.inspirations,
        characterText,
      ]
        .filter(Boolean)
        .join(' ')
    })
    .join(' ')

  const characterText = (dream.Characters ?? [])
    .map((character) =>
      [
        character.name,
        character.honorific,
        character.title,
        character.role,
        character.class,
        character.species,
        character.genre,
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ')

  const rewardText = (dream.Rewards ?? [])
    .map((reward) =>
      [
        reward.name,
        reward.label,
        reward.description,
        reward.rarity,
        reward.rewardType,
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ')

  return [
    dream.title,
    dream.slug,
    dream.pitch,
    dream.description,
    dream.flavorText,
    dream.artPrompt,
    dream.examples,
    dream.designer,
    dream.dreamType,
    scenarioText,
    characterText,
    rewardText,
  ]
    .filter(Boolean)
    .join(' ')
}

function relationScore(source: DreamWithRelations, target: DreamWithRelations) {
  let score = 0

  if (source.dreamType && source.dreamType === target.dreamType) score += 2

  score += sharedCount(dreamScenarioIds(source), dreamScenarioIds(target)) * 5
  score += sharedCount(dreamCharacterIds(source), dreamCharacterIds(target)) * 4
  score += sharedCount(dreamRewardIds(source), dreamRewardIds(target)) * 3
  score += sharedCount(
    tokenSet(dreamSearchText(source)),
    tokenSet(dreamSearchText(target)),
  )

  return score
}

function dreamScenarioIds(dream: DreamWithRelations) {
  return new Set(
    [
      dream.Scenario?.id,
      ...(dream.Scenarios ?? []).map((scenario) => scenario.id),
    ].filter((id): id is number => Number.isInteger(id)),
  )
}

function dreamCharacterIds(dream: DreamWithRelations) {
  const scenarioCharactersList = (
    (dream.Scenarios ?? []) as DreamScenarioWithCharacters[]
  )
    .flatMap((scenario) => scenario.Characters ?? [])
    .map((character) => character.id)

  return new Set(
    [
      ...(dream.Characters ?? []).map((character) => character.id),
      ...scenarioCharactersList,
    ].filter((id): id is number => Number.isInteger(id)),
  )
}

function dreamRewardIds(dream: DreamWithRelations) {
  return new Set(
    (dream.Rewards ?? [])
      .map((reward: Reward) => reward.id)
      .filter((id): id is number => Number.isInteger(id)),
  )
}

function sharedCount<T>(first: Set<T>, second: Set<T>) {
  let count = 0

  first.forEach((value) => {
    if (second.has(value)) count += 1
  })

  return count
}

function tokenSet(text: string) {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'that',
    'this',
    'into',
    'where',
    'when',
    'what',
    'are',
    'you',
    'your',
    'dream',
    'vibe',
    'story',
    'stories',
  ])

  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  )
}

function uniqueById<T extends { id?: number | null }>(items: T[]) {
  const seen = new Set<number>()
  const unique: T[] = []

  items.forEach((item) => {
    const id = Number(item?.id)
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) return

    seen.add(id)
    unique.push(item)
  })

  return unique
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

function readId(record: Record<string, unknown>, fallback = 0) {
  const id = Number(record.id)
  return Number.isInteger(id) && id > 0 ? id : fallback
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value))
      return String(value)
  }

  return undefined
}

function readBool(record: Record<string, unknown>, key: string) {
  return typeof record[key] === 'boolean' ? record[key] : undefined
}

function readImage(record: Record<string, unknown>) {
  return readString(record, [
    'imagePath',
    'avatarImage',
    'fileName',
    'path',
    'thumbnailPath',
    'thumbnailData',
  ])
}

function buildNarratorSystemPrompt() {
  const bot = narratorBot.value
  const dream = selectedDream.value

  return [
    bot?.prompt ||
      'You are the Narrator, a focused guide for interactive Dream experiences.',
    bot?.personality ? `Personality: ${bot.personality}` : '',
    bot?.botIntro ? `Narrator intro: ${bot.botIntro}` : '',
    bot?.description ? `Narrator description: ${bot.description}` : '',
    dream
      ? [
          'Current Dream context:',
          narratorContextPreview.value,
          scenarioRows.value.length
            ? `Scenarios: ${scenarioRows.value.map((scenario) => scenarioTitle(scenario)).join(', ')}`
            : '',
          characterRows.value.length
            ? `Characters: ${characterRows.value.map((character) => characterName(character)).join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n')
      : '',
    'Stay inside the selected Dream. Be useful, concrete, and playable. Do not act like a public chatroom.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function buildNarratorMessages(): BotCafeMessage[] {
  const previousMessages = narratorSession.value.flatMap((chat) => {
    const messages: BotCafeMessage[] = [
      {
        role: 'user',
        content: chat.content,
      },
    ]

    if (chat.botResponse) {
      messages.push({
        role: 'assistant',
        content: chat.botResponse,
      })
    }

    return messages
  })

  return [
    {
      role: 'system',
      content: buildNarratorSystemPrompt(),
    },
    ...previousMessages,
  ]
}

function setNarratorStatus(
  message: string,
  tone: 'success' | 'error' = 'success',
) {
  narratorStatusMessage.value = message
  narratorStatusTone.value = tone
}

function clearNarratorSession() {
  narratorSessionIds.value = []
  narratorMessage.value = ''
  narratorStatusMessage.value = ''
}

function scrollNarratorToBottom() {
  const element = narratorLogRef.value
  if (!element) return

  element.scrollTop = element.scrollHeight
}

async function sendNarratorMessage() {
  const dream = selectedDream.value
  const bot = narratorBot.value
  const content = narratorMessage.value.trim()

  if (!dream || !bot || !content || isNarratorResponding.value) return

  promptStore.currentPrompt = content
  narratorStatusMessage.value = ''

  try {
    const payload: ChatRuntimeInput = {
      botId: bot.id,
      dreamId: dream.id,
      content,
      isPublic: false,
      userId: userStore.userId ?? userStore.user?.id ?? 10,
      type: 'ToBot',
      recipientId: bot.id,
      characterId: null,
      serverId: runtimeTextServer.value?.id ?? null,
      serverName: runtimeTextServer.value?.title ?? null,
    } as ChatRuntimeInput

    const newChat = await chatStore.addChat(payload)

    if (!newChat?.id) {
      throw new Error('Failed to create Narrator message.')
    }

    narratorSessionIds.value.push(newChat.id)
    narratorMessage.value = ''

    await nextTick()
    scrollNarratorToBottom()

    if (typeof chatStore.streamResponse === 'function') {
      await chatStore.streamResponse(newChat.id, {
        model: runtimeTextServer.value?.model || 'gpt-4o-mini',
        temperature: narratorTemperature.value,
        maxTokens: narratorMaxTokens.value,
        serverId: runtimeTextServer.value?.id ?? null,
        serverName: runtimeTextServer.value?.title ?? null,
        messages: buildNarratorMessages(),
      })
    }

    await nextTick()
    scrollNarratorToBottom()
  } catch (error) {
    setNarratorStatus(
      error instanceof Error
        ? error.message
        : 'Narrator request failed. Check bot and server config.',
      'error',
    )
  }
}
</script>

<style scoped>
.narrator-dot {
  display: inline-block;
  height: 0.375rem;
  width: 0.375rem;
  border-radius: 9999px;
  background: currentColor;
  animation: narrator-bounce 1s ease-in-out infinite;
}

.delay-150 {
  animation-delay: 150ms;
}

.delay-300 {
  animation-delay: 300ms;
}

@keyframes narrator-bounce {
  0%,
  80%,
  100% {
    opacity: 0.4;
    transform: scale(0.65);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
