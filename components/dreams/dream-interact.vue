<!-- /components/dreams/dream-interact.vue -->
<template>
  <section
    class="relative h-full min-h-0 overflow-hidden rounded-2xl bg-neutral"
  >
    <Transition name="wp-fade">
      <div
        :key="wallpaperKey"
        class="absolute inset-0 z-0 bg-cover bg-center"
        :style="
          wallpaperUrl ? { backgroundImage: `url('${wallpaperUrl}')` } : {}
        "
      >
        <div
          v-if="!wallpaperUrl"
          class="dream-gradient-fallback h-full w-full"
        />
      </div>
    </Transition>

    <div
      class="absolute inset-0 z-1 transition-all duration-500"
      :class="
        activePanel
          ? 'bg-linear-to-r from-base-100/30 via-transparent to-base-100/80'
          : 'bg-linear-to-b from-base-100/25 via-transparent to-base-100/70'
      "
    />

    <div class="absolute left-3 top-3 z-20 max-w-[58%]">
      <div
        class="rounded-2xl border border-white/20 bg-base-100/75 px-3 py-2 backdrop-blur-md"
      >
        <p
          class="text-[10px] font-bold uppercase tracking-widest text-primary/80"
        >
          Active Dream
        </p>

        <h2 class="truncate text-sm font-black leading-tight text-base-content">
          {{ dreamTitle }}
        </h2>
      </div>
    </div>

    <div
      v-if="isOwnerOrAdmin && dreamStore.selectedDream"
      class="absolute right-3 top-3 z-20"
    >
      <button
        class="btn btn-xs rounded-2xl border backdrop-blur-md"
        :class="privacyBtnClass"
        :title="`Access: ${currentAccessMode} - click to cycle`"
        :disabled="dreamStore.isSaving"
        @click="cycleAccessMode"
      >
        <Icon :name="privacyIcon" class="h-3 w-3" />
        {{ currentAccessMode }}
      </button>
    </div>

    <div
      v-if="dreamStore.error"
      class="absolute left-3 right-3 top-16 z-30 rounded-2xl border border-error/40 bg-error/90 p-3 text-sm font-semibold text-error-content shadow-lg backdrop-blur-md sm:left-auto sm:max-w-md"
    >
      <div class="flex items-start gap-2">
        <Icon name="kind-icon:warning" class="mt-0.5 h-4 w-4 shrink-0" />

        <p class="min-w-0 flex-1">
          {{ dreamStore.error }}
        </p>

        <button
          class="btn btn-ghost btn-xs rounded-xl text-error-content"
          type="button"
          @click="dreamStore.setError('')"
        >
          <Icon name="kind-icon:x" class="h-3 w-3" />
        </button>
      </div>
    </div>

    <div
      v-if="!dreamStore.selectedDream"
      class="absolute inset-x-3 top-28 z-20 mx-auto max-w-xl rounded-2xl border border-white/20 bg-base-100/80 p-4 text-center shadow-lg backdrop-blur-md"
    >
      <Icon name="kind-icon:moon" class="mx-auto h-10 w-10 text-primary" />

      <p class="mt-2 text-lg font-black">No Dream selected</p>

      <p class="mt-1 text-sm text-base-content/60">
        Pick a Dream from the gallery, or create one from the Dream setup tab.
      </p>

      <button
        class="btn btn-primary btn-sm mt-3 rounded-2xl"
        type="button"
        @click="goToDreamSetup"
      >
        <Icon name="kind-icon:plus" class="h-4 w-4" />
        Create or edit Dream
      </button>
    </div>

    <div
      class="absolute bottom-15 left-0 right-0 z-20 flex justify-center px-2 py-1"
    >
      <div
        class="flex items-end gap-0.5 overflow-x-auto rounded-2xl border border-white/20 bg-base-100/75 p-1.5 backdrop-blur-md scrollbar-none"
      >
        <button
          v-for="panel in PANELS"
          :key="panel.key"
          class="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-all duration-150"
          :class="
            activePanel === panel.key
              ? 'scale-105 bg-primary text-primary-content shadow-md'
              : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'
          "
          :title="panel.label"
          type="button"
          @click="togglePanel(panel.key)"
        >
          <Icon :name="panel.icon" class="h-5 w-5" />
          <span class="leading-none">{{ panel.label }}</span>
        </button>
      </div>
    </div>

    <div
      class="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-base-100/85 px-3 py-2 backdrop-blur-md"
    >
      <div class="flex items-center gap-2">
        <button
          class="btn btn-xs shrink-0 rounded-xl"
          :class="
            reshapeDream ? 'btn-warning' : 'btn-ghost border border-base-300'
          "
          type="button"
          title="Toggle: reshape dream vibe with this message"
          :disabled="!dreamStore.selectedDream"
          @click="reshapeDream = !reshapeDream"
        >
          <Icon name="kind-icon:wand" class="h-3 w-3" />
        </button>

        <input
          v-model="message"
          type="text"
          class="input input-sm input-bordered flex-1 rounded-xl bg-base-100/80 text-sm"
          :placeholder="
            dreamStore.selectedDream
              ? 'Speak into the Dream...'
              : 'Select a dream first.'
          "
          :disabled="!dreamStore.selectedDream || dreamStore.isSaving"
          @keydown.enter.exact.prevent="submitMessage"
        />

        <button
          class="btn btn-sm btn-primary shrink-0 rounded-xl"
          type="button"
          :disabled="!canSubmit || dreamStore.isSaving"
          @click="submitMessage"
        >
          <span
            v-if="dreamStore.isSaving"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:send" class="h-4 w-4" />
        </button>

        <button
          class="btn btn-sm btn-ghost shrink-0 rounded-xl"
          type="button"
          :disabled="dreamStore.chatsLoading || !dreamStore.selectedDreamId"
          title="Refresh chat"
          @click="refreshChats"
        >
          <span
            v-if="dreamStore.chatsLoading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
        </button>
      </div>

      <p v-if="reshapeDream" class="mt-0.5 text-[10px] text-warning">
        ✦ This message will reshape the dream vibe
      </p>
    </div>

    <Transition name="fade">
      <div
        v-if="activePanel"
        class="absolute inset-0 z-30 cursor-pointer bg-base-100/10 backdrop-blur-[1px]"
        @click="activePanel = null"
      />
    </Transition>

    <Transition name="panel-slide">
      <div
        v-if="activePanel"
        class="absolute bottom-15 right-0 top-0 z-40 flex w-full flex-col overflow-hidden border-l border-base-300/60 bg-base-100/96 backdrop-blur-lg sm:w-120 xl:w-136"
      >
        <div
          class="flex shrink-0 items-center justify-between border-b border-base-300 bg-base-200/80 px-4 py-3"
        >
          <div class="flex items-center gap-2">
            <Icon
              :name="currentPanelConfig?.icon ?? 'kind-icon:circle'"
              class="h-5 w-5 text-primary"
            />

            <h3 class="font-black text-base-content">
              {{ currentPanelConfig?.label }}
            </h3>
          </div>

          <button
            class="btn btn-sm btn-circle btn-ghost"
            type="button"
            @click="activePanel = null"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="activePanel === 'dream'" class="space-y-4 p-4">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <p class="text-xs font-bold uppercase tracking-wide text-primary">
                Current Vibe
              </p>

              <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/80">
                {{
                  dreamStore.selectedDream?.currentVibe ||
                  dreamStore.dreamForm.currentVibe ||
                  'No vibe set yet.'
                }}
              </p>

              <button
                class="btn btn-sm btn-accent mt-3 rounded-2xl"
                type="button"
                :disabled="!dreamStore.selectedDream?.id || dreamStore.isSaving"
                @click="saveVibeAsPrompt"
              >
                <Icon name="kind-icon:arrow-right-circle" class="h-4 w-4" />
                Vibe → Image Prompt
              </button>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <p class="text-xs font-bold uppercase tracking-wide text-primary">
                Image Prompt
              </p>

              <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/80">
                {{
                  dreamStore.selectedDream?.currentPrompt ||
                  dreamStore.dreamForm.currentPrompt ||
                  'No prompt set yet.'
                }}
              </p>
            </div>

            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div
                v-for="stat in dreamStats"
                :key="stat.label"
                class="rounded-2xl border border-base-300 bg-base-200 p-2"
              >
                <div class="font-black text-secondary">
                  {{ stat.value }}
                </div>

                <div class="text-base-content/60">
                  {{ stat.label }}
                </div>
              </div>
            </div>

            <button
              class="btn btn-primary w-full rounded-2xl"
              type="button"
              :disabled="!dreamStore.selectedDream?.id"
              @click="startEditingSelectedDream"
            >
              <Icon name="kind-icon:edit" class="h-4 w-4" />
              Edit Dream Settings
            </button>
          </div>

          <div v-else-if="activePanel === 'characters'" class="space-y-4 p-4">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Cast ({{ dreamStore.selectedDreamCast.length }})
              </p>

              <div class="flex flex-wrap gap-2">
                <div
                  v-for="char in dreamStore.selectedDreamCast"
                  :key="char.id"
                  class="flex items-center gap-1.5 rounded-2xl border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-sm"
                >
                  <span class="font-bold">
                    {{ char.name || `Character ${char.id}` }}
                  </span>

                  <button
                    class="btn btn-xs btn-circle btn-ghost"
                    type="button"
                    :disabled="dreamStore.isSaving"
                    @click="removeCharacter(char.id)"
                  >
                    <Icon name="kind-icon:x" class="h-3 w-3" />
                  </button>
                </div>

                <p
                  v-if="!dreamStore.selectedDreamCast.length"
                  class="text-sm text-base-content/50"
                >
                  The stage is empty and frankly overqualified.
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Add from Gallery
              </p>

              <character-gallery
                variant="dropdown"
                :show-header="false"
                :show-controls="false"
                :show-card-actions="true"
                @select="addCharacter"
              />
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Create New Character
              </p>

              <add-character
                @saved="onCharacterCreated"
                @created="onCharacterCreated"
              />
            </div>
          </div>

          <div v-else-if="activePanel === 'items'" class="space-y-4 p-4">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Items ({{ dreamStore.selectedDreamItems.length }})
              </p>

              <div class="flex flex-wrap gap-2">
                <div
                  v-for="item in dreamStore.selectedDreamItems"
                  :key="item.id"
                  class="flex items-center gap-1.5 rounded-2xl border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm"
                >
                  <span class="font-bold">
                    {{ getRewardLabel(item) }}
                  </span>

                  <button
                    class="btn btn-xs btn-circle btn-ghost"
                    type="button"
                    :disabled="dreamStore.isSaving"
                    @click="removeReward(item.id)"
                  >
                    <Icon name="kind-icon:x" class="h-3 w-3" />
                  </button>
                </div>

                <p
                  v-if="!dreamStore.selectedDreamItems.length"
                  class="text-sm text-base-content/50"
                >
                  The loot goblin has yet to arrive.
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Add from Gallery
              </p>

              <reward-gallery
                variant="dropdown"
                :show-header="false"
                :show-controls="false"
                :show-card-actions="true"
                @select="addReward"
              />
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Create New Item
              </p>

              <add-reward @saved="onRewardCreated" @created="onRewardCreated" />
            </div>
          </div>

          <div v-else-if="activePanel === 'scenario'" class="space-y-4 p-4">
            <div
              v-if="dreamStore.selectedDream?.Scenario"
              class="rounded-2xl border border-secondary/30 bg-secondary/10 p-4"
            >
              <p
                class="text-xs font-bold uppercase tracking-wide text-secondary"
              >
                Active Scenario
              </p>

              <h3 class="mt-1 text-lg font-black text-base-content">
                {{
                  dreamStore.selectedDream.Scenario.title || 'Untitled Scenario'
                }}
              </h3>

              <p class="mt-2 text-sm text-base-content/70">
                {{
                  dreamStore.selectedDream.Scenario.description ||
                  'No description set.'
                }}
              </p>

              <button
                class="btn btn-xs btn-ghost mt-3 rounded-2xl text-error"
                type="button"
                :disabled="dreamStore.isSaving"
                @click="clearScenario"
              >
                <Icon name="kind-icon:unlink" class="h-3 w-3" />
                Remove
              </button>
            </div>

            <div
              v-else
              class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-sm text-base-content/50"
            >
              No scenario attached yet. Dream is the place, Scenario is what
              happens there.
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Select a Scenario
              </p>

              <scenario-gallery
                variant="dropdown"
                :show-header="false"
                :show-controls="false"
                :show-card-actions="true"
                @select="setScenario"
              />
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Create New Scenario
              </p>

              <add-scenario
                @saved="onScenarioCreated"
                @created="onScenarioCreated"
              />
            </div>
          </div>

          <div v-else-if="activePanel === 'art'" class="space-y-4 p-4">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Art Collection
              </p>

              <collection-gallery
                variant="dropdown"
                :show-header="false"
                :allow-add="true"
                :allow-edit="false"
                :allow-delete="false"
                :allow-merge="false"
                :allow-refresh="true"
                @select="setCollection"
              />

              <div
                class="mt-2 flex items-center gap-2 text-xs text-base-content/60"
              >
                <Icon name="kind-icon:image" class="h-3.5 w-3.5" />

                {{ wallpaperImages.length }} image{{
                  wallpaperImages.length === 1 ? '' : 's'
                }}
                in wallpaper pool

                <button
                  class="btn btn-xs btn-ghost ml-auto rounded-xl"
                  type="button"
                  :disabled="wallpaperImages.length < 2"
                  title="Jump to next wallpaper"
                  @click="cycleWallpaper"
                >
                  <Icon name="kind-icon:shuffle" class="h-3 w-3" />
                  Next
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Generate Art
              </p>

              <art-maker
                :dream-id="dreamStore.selectedDreamId"
                @created="onArtCreated"
                @saved="onArtCreated"
              />
            </div>
          </div>

          <div
            v-else-if="activePanel === 'chat'"
            class="flex h-full min-h-80 flex-col"
          >
            <div
              ref="chatScrollRef"
              class="flex-1 space-y-2 overflow-y-auto p-3"
            >
              <article
                v-for="chat in dreamStore.selectedDreamChats"
                :key="chat.id"
                class="rounded-2xl border p-3 text-sm"
                :class="
                  chat.type === 'BotResponse'
                    ? 'border-secondary/30 bg-secondary/10'
                    : 'border-base-300 bg-base-200'
                "
              >
                <div class="mb-1 flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-primary">
                    {{
                      chat.sender || chat.User?.username || 'Someone mysterious'
                    }}
                  </span>

                  <span class="badge badge-outline badge-xs shrink-0">
                    {{ chat.type }}
                  </span>
                </div>

                <p class="whitespace-pre-wrap text-base-content/80">
                  {{ chat.content }}
                </p>
              </article>

              <div
                v-if="!dreamStore.selectedDreamChats.length"
                class="flex flex-col items-center justify-center gap-3 py-12 text-center text-base-content/50"
              >
                <Icon name="kind-icon:moon" class="h-12 w-12 opacity-30" />

                <p class="text-sm">
                  No room history yet.<br />Say something ominous but useful.
                </p>
              </div>
            </div>

            <div class="shrink-0 border-t border-base-300 bg-base-200 p-3">
              <div class="flex gap-2">
                <textarea
                  v-model="message"
                  class="textarea textarea-bordered textarea-sm min-h-12 flex-1 resize-none rounded-2xl text-sm"
                  placeholder="The lanterns flicker as..."
                  rows="2"
                  :disabled="!dreamStore.selectedDream || dreamStore.isSaving"
                  @keydown.enter.exact.prevent="submitMessage"
                />

                <div class="flex flex-col gap-1">
                  <button
                    class="btn btn-sm btn-primary rounded-xl"
                    type="button"
                    :disabled="!canSubmit || dreamStore.isSaving"
                    @click="submitMessage"
                  >
                    <span
                      v-if="dreamStore.isSaving"
                      class="loading loading-spinner loading-xs"
                    />
                    <Icon v-else name="kind-icon:send" class="h-4 w-4" />
                  </button>

                  <button
                    class="btn btn-xs rounded-xl"
                    type="button"
                    :class="
                      reshapeDream ? 'btn-warning' : 'btn-ghost border-base-300'
                    "
                    title="Reshape vibe"
                    :disabled="!dreamStore.selectedDream"
                    @click="reshapeDream = !reshapeDream"
                  >
                    <Icon name="kind-icon:wand" class="h-3 w-3" />
                  </button>
                </div>
              </div>

              <p v-if="reshapeDream" class="mt-1 text-[10px] text-warning">
                ✦ Reshapes the dream vibe
              </p>
            </div>
          </div>

          <div v-else-if="activePanel === 'prompts'" class="p-4">
            <dream-prompts />
          </div>

          <div v-else-if="activePanel === 'fx'" class="p-4">
            <p
              class="mb-3 text-xs font-bold uppercase tracking-wide text-primary"
            >
              Visual Atmosphere
            </p>

            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="fx in SCREEN_FX_OPTIONS"
                :key="fx.key"
                class="btn rounded-2xl"
                type="button"
                :class="
                  screenFx.includes(fx.key)
                    ? 'btn-primary'
                    : 'btn-outline border-base-300'
                "
                @click="toggleScreenFx(fx.key)"
              >
                <Icon :name="fx.icon" class="h-5 w-5" />
                {{ fx.label }}
              </button>
            </div>
          </div>

          <div v-else-if="activePanel === 'wheel'" class="space-y-4 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Inspiration Wheel
            </p>

            <div class="space-y-2">
              <label
                v-for="(_, slotIdx) in wheelSlots"
                :key="slotIdx"
                class="form-control"
              >
                <span class="label-text text-xs font-bold">
                  Slot {{ slotIdx + 1 }}
                </span>

                <select
                  v-model="wheelSlots[slotIdx]"
                  class="select select-bordered select-sm rounded-2xl"
                >
                  <option
                    v-for="idea in INSPIRATION_IDEAS"
                    :key="`s${slotIdx}-${idea}`"
                    :value="idea"
                  >
                    {{ idea }}
                  </option>
                </select>
              </label>
            </div>

            <button
              class="btn btn-info w-full rounded-2xl"
              type="button"
              @click="spinInspirationWheel"
            >
              <Icon name="kind-icon:dice" class="h-5 w-5" />
              Spin the Wheel
            </button>

            <div class="rounded-2xl border border-info/30 bg-info/10 p-3">
              <p class="text-xs font-bold uppercase tracking-wide text-info">
                Combined Pitch
              </p>

              <p class="mt-2 text-sm font-bold text-base-content">
                {{ inspirationText }}
              </p>
            </div>

            <div class="flex gap-2">
              <button
                class="btn btn-sm flex-1 rounded-2xl"
                type="button"
                @click="applyInspiration('prepend')"
              >
                <Icon name="kind-icon:arrow-up" class="h-4 w-4" />
                Prepend
              </button>

              <button
                class="btn btn-sm btn-outline flex-1 rounded-2xl"
                type="button"
                @click="applyInspiration('append')"
              >
                <Icon name="kind-icon:plus" class="h-4 w-4" />
                Append
              </button>

              <button
                class="btn btn-sm btn-warning flex-1 rounded-2xl"
                type="button"
                @click="applyInspiration('replace')"
              >
                <Icon name="kind-icon:replace" class="h-4 w-4" />
                Replace
              </button>
            </div>
          </div>

          <div v-else-if="activePanel === 'settings'" class="space-y-4 p-4">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Wallpaper Cycle
              </p>

              <div class="flex items-center gap-3">
                <input
                  type="range"
                  class="range range-xs range-primary flex-1"
                  min="0"
                  max="300"
                  step="10"
                  :value="wallpaperIntervalSeconds"
                  @input="onWallpaperIntervalInput"
                />

                <span class="min-w-14 text-right text-sm font-bold">
                  {{
                    wallpaperIntervalSeconds === 0
                      ? 'Off'
                      : `${wallpaperIntervalSeconds}s`
                  }}
                </span>
              </div>

              <p class="mt-1 text-xs text-base-content/50">
                Set to 0 to disable. Requires at least 2 images in the art
                collection.
              </p>
            </div>

            <div class="rounded-2xl border border-accent/40 bg-base-200 p-4">
              <div class="mb-3 flex items-center justify-between">
                <div>
                  <p
                    class="text-xs font-bold uppercase tracking-wide text-accent"
                  >
                    art-code
                  </p>

                  <p class="text-xs text-base-content/60">
                    Push art prompt on a timer
                  </p>
                </div>

                <div class="flex gap-1.5">
                  <button
                    class="btn btn-xs rounded-xl"
                    type="button"
                    :disabled="!artCode.prompt.trim()"
                    @click="runArtCode"
                  >
                    Run Now
                  </button>

                  <button
                    class="btn btn-xs rounded-xl"
                    type="button"
                    :class="artCode.isRunning ? 'btn-error' : 'btn-outline'"
                    @click="toggleArtCodeTimer"
                  >
                    <Icon
                      :name="
                        artCode.isRunning ? 'kind-icon:stop' : 'kind-icon:play'
                      "
                      class="h-3 w-3"
                    />
                    {{ artCode.isRunning ? 'Stop' : 'Start' }}
                  </button>
                </div>
              </div>

              <textarea
                v-model="artCode.prompt"
                class="textarea textarea-bordered w-full rounded-2xl text-sm"
                rows="3"
                placeholder="Art prompt to push on a timer..."
              />

              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="shrink-0 text-base-content/60">Every</span>

                <input
                  v-model.number="artCode.intervalSeconds"
                  type="number"
                  class="input input-xs input-bordered w-16 rounded-xl"
                  min="5"
                />

                <span class="shrink-0 text-base-content/60">s ·</span>

                <select
                  v-model="artCode.promptMode"
                  class="select select-xs select-bordered rounded-xl"
                >
                  <option value="append">Append</option>
                  <option value="prepend">Prepend</option>
                  <option value="replace">Replace</option>
                </select>

                <span
                  v-if="artCode.isRunning"
                  class="ml-auto shrink-0 text-xs font-bold text-warning"
                >
                  ● Running
                </span>
              </div>
            </div>

            <div class="rounded-2xl border border-secondary/40 bg-base-200 p-4">
              <div class="mb-3 flex items-center justify-between">
                <div>
                  <p
                    class="text-xs font-bold uppercase tracking-wide text-secondary"
                  >
                    prompt-code
                  </p>

                  <p class="text-xs text-base-content/60">
                    Post a chat message on a timer
                  </p>
                </div>

                <div class="flex gap-1.5">
                  <button
                    class="btn btn-xs rounded-xl"
                    type="button"
                    :disabled="!promptCode.prompt.trim()"
                    @click="runPromptCode"
                  >
                    Run Now
                  </button>

                  <button
                    class="btn btn-xs rounded-xl"
                    type="button"
                    :class="promptCode.isRunning ? 'btn-error' : 'btn-outline'"
                    @click="togglePromptCodeTimer"
                  >
                    <Icon
                      :name="
                        promptCode.isRunning
                          ? 'kind-icon:stop'
                          : 'kind-icon:play'
                      "
                      class="h-3 w-3"
                    />
                    {{ promptCode.isRunning ? 'Stop' : 'Start' }}
                  </button>
                </div>
              </div>

              <textarea
                v-model="promptCode.prompt"
                class="textarea textarea-bordered w-full rounded-2xl text-sm"
                rows="3"
                placeholder="Text to post into the dream chat on a timer..."
              />

              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="shrink-0 text-base-content/60">Every</span>

                <input
                  v-model.number="promptCode.intervalSeconds"
                  type="number"
                  class="input input-xs input-bordered w-16 rounded-xl"
                  min="5"
                />

                <span class="shrink-0 text-base-content/60">s ·</span>

                <select
                  v-model="promptCode.promptMode"
                  class="select select-xs select-bordered rounded-xl"
                >
                  <option value="append">Append</option>
                  <option value="prepend">Prepend</option>
                  <option value="replace">Replace</option>
                </select>

                <span
                  v-if="promptCode.isRunning"
                  class="ml-auto shrink-0 text-xs font-bold text-warning"
                >
                  ● Running
                </span>
              </div>
            </div>

            <div
              v-if="isOwnerOrAdmin && dreamStore.selectedDream"
              class="rounded-2xl border border-base-300 bg-base-200 p-4"
            >
              <p
                class="mb-3 text-xs font-bold uppercase tracking-wide text-primary"
              >
                Privacy
              </p>

              <div class="flex gap-2">
                <button
                  v-for="mode in ACCESS_MODES"
                  :key="mode.key"
                  class="btn btn-sm flex-1 rounded-2xl"
                  type="button"
                  :class="
                    currentAccessMode === mode.key
                      ? 'btn-primary'
                      : 'btn-ghost border-base-300'
                  "
                  :disabled="dreamStore.isSaving"
                  @click="setAccessMode(mode.key)"
                >
                  <Icon :name="mode.icon" class="h-4 w-4" />
                  {{ mode.label }}
                </button>
              </div>

              <input
                v-if="currentAccessMode === 'CODE'"
                v-model="privacyCode"
                type="text"
                class="input input-bordered input-sm mt-2 w-full rounded-xl"
                placeholder="Enter access code..."
                @blur="savePrivacyCode"
              />

              <div class="mt-3 flex flex-wrap gap-2">
                <label
                  class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary"
                    :checked="dreamStore.selectedDream.isPublic"
                    :disabled="dreamStore.isSaving"
                    @change="
                      togglePublic(($event.target as HTMLInputElement).checked)
                    "
                  />

                  Public dream
                </label>

                <label
                  class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-warning"
                    :checked="dreamStore.selectedDream.isMature"
                    :disabled="dreamStore.isSaving"
                    @change="
                      toggleMature(($event.target as HTMLInputElement).checked)
                    "
                  />

                  Mature content
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div
      v-if="screenFx.includes('lanternGlow')"
      class="lantern-glow-fx pointer-events-none absolute inset-0 z-2"
    />

    <div
      v-if="screenFx.includes('fog')"
      class="fog-fx pointer-events-none absolute inset-0 z-2"
    />

    <div
      v-if="screenFx.includes('vignette')"
      class="vignette-fx pointer-events-none absolute inset-0 z-2"
    />
  </section>
</template>

<script setup lang="ts">
// /components/dreams/dream-interact.vue
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { useDreamStore, type DreamForm } from '@/stores/dreamStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'
import { useNavStore } from '@/stores/navStore'

type PanelKey =
  | 'dream'
  | 'characters'
  | 'items'
  | 'scenario'
  | 'art'
  | 'chat'
  | 'prompts'
  | 'fx'
  | 'wheel'
  | 'settings'

type InspirationMode = 'append' | 'prepend' | 'replace'
type AccessMode = 'OPEN' | 'CODE' | 'PRIVATE'

type IdPayload = {
  id?: number | null
}

type RewardLike = {
  id: number
  label?: string | null
  text?: string | null
  power?: string | null
  title?: string | null
  name?: string | null
}

interface CodePanelState {
  prompt: string
  intervalSeconds: number
  promptMode: InspirationMode
  isRunning: boolean
  timerId: ReturnType<typeof setInterval> | null
}

const dreamStore = useDreamStore()
const scenarioStore = useScenarioStore()
const userStore = useUserStore()
const navStore = useNavStore()

const dashboardKey = 'dream' as const

const chatScrollRef = ref<HTMLElement | null>(null)
const message = ref('')
const reshapeDream = ref(false)
const activePanel = ref<PanelKey | null>(null)
const screenFx = ref<string[]>([])

const wallpaperIndex = ref(0)
const wallpaperKey = ref(0)
const wallpaperIntervalSeconds = ref(30)
let wallpaperTimerId: ReturnType<typeof setInterval> | null = null

const currentAccessMode = ref<AccessMode>('OPEN')
const privacyCode = ref('')

const wheelSlots = ref<[string, string, string]>([
  'gothic fairy tale',
  'cozy cosmic tavern',
  'bureaucratic inferno',
])

const artCode = reactive<CodePanelState>({
  prompt: '',
  intervalSeconds: 30,
  promptMode: 'append',
  isRunning: false,
  timerId: null,
})

const promptCode = reactive<CodePanelState>({
  prompt: '',
  intervalSeconds: 45,
  promptMode: 'append',
  isRunning: false,
  timerId: null,
})

const PANELS: { key: PanelKey; label: string; icon: string }[] = [
  { key: 'dream', label: 'Dream', icon: 'kind-icon:moon' },
  { key: 'characters', label: 'Cast', icon: 'kind-icon:users' },
  { key: 'items', label: 'Items', icon: 'kind-icon:gift' },
  { key: 'scenario', label: 'Scene', icon: 'kind-icon:map' },
  { key: 'art', label: 'Art', icon: 'kind-icon:image' },
  { key: 'chat', label: 'Chat', icon: 'kind-icon:circle' },
  { key: 'prompts', label: 'Prompts', icon: 'kind-icon:book' },
  { key: 'fx', label: 'FX', icon: 'kind-icon:sparkles' },
  { key: 'wheel', label: 'Wheel', icon: 'kind-icon:dice' },
  { key: 'settings', label: 'Settings', icon: 'kind-icon:settings' },
]

const ACCESS_MODES: { key: AccessMode; label: string; icon: string }[] = [
  { key: 'OPEN', label: 'Open', icon: 'kind-icon:globe' },
  { key: 'CODE', label: 'Code', icon: 'kind-icon:key' },
  { key: 'PRIVATE', label: 'Private', icon: 'kind-icon:lock' },
]

const SCREEN_FX_OPTIONS = [
  { key: 'lanternGlow', label: 'Lantern Glow', icon: 'kind-icon:lamp' },
  { key: 'butterflies', label: 'Butterflies', icon: 'kind-icon:butterfly' },
  { key: 'glitch', label: 'Glitch', icon: 'kind-icon:zap' },
  { key: 'fog', label: 'Fog', icon: 'kind-icon:cloud' },
  { key: 'particles', label: 'Particles', icon: 'kind-icon:sparkle' },
  { key: 'vignette', label: 'Vignette', icon: 'kind-icon:circle-dashed' },
]

const INSPIRATION_IDEAS = [
  'gothic fairy tale',
  'corporate hellscape',
  'Japanese yokai folklore',
  'cozy cosmic tavern',
  'haunted greenhouse',
  'monster drag cabaret',
  'bureaucratic inferno',
  'space opera nonsense',
  'enchanted retreat',
  'weird detective noir',
  'rainbow sanctuary',
  'clockwork carnival',
  'underwater democracy',
  'sentient old-growth forest',
  'neon shaman market',
  'library at the end of time',
  'pocket dimension bureaucracy',
  'robot folk revival',
]

const dreamTitle = computed(() => {
  return dreamStore.selectedDream?.title || 'No Dream Selected'
})

const isOwnerOrAdmin = computed(() => {
  const userId = userStore.user?.id
  const role = (userStore.user as { Role?: string } | null)?.Role

  return role === 'ADMIN' || dreamStore.selectedDream?.userId === userId
})

const wallpaperImages = computed((): string[] => {
  const collectionPaths = dreamStore.selectedDreamCollectionArt
    .map((art) => art.imagePath || art.path || '')
    .filter(Boolean)

  if (collectionPaths.length) return collectionPaths

  const current = dreamStore.selectedDreamCurrentImage
  return current ? [current] : []
})

const wallpaperUrl = computed(() => {
  const images = wallpaperImages.value

  if (!images.length) return ''

  return images[wallpaperIndex.value % images.length] ?? ''
})

const currentPanelConfig = computed(() => {
  return PANELS.find((panel) => panel.key === activePanel.value) ?? null
})

const canSubmit = computed(() => {
  return Boolean(dreamStore.selectedDreamId && message.value.trim())
})

const inspirationText = computed(() => {
  return wheelSlots.value.filter(Boolean).join(' + ')
})

const dreamStats = computed(() => [
  { label: 'Cast', value: dreamStore.selectedDreamCast.length },
  { label: 'Items', value: dreamStore.selectedDreamItems.length },
  { label: 'Art', value: dreamStore.selectedDreamCollectionArt.length },
  { label: 'Chat', value: dreamStore.selectedDreamChats.length },
])

const privacyIcon = computed(() => {
  if (currentAccessMode.value === 'CODE') return 'kind-icon:key'
  if (currentAccessMode.value === 'PRIVATE') return 'kind-icon:lock'
  return 'kind-icon:globe'
})

const privacyBtnClass = computed(() => {
  if (currentAccessMode.value === 'CODE') {
    return 'border-warning/50 bg-warning/20 text-warning'
  }

  if (currentAccessMode.value === 'PRIVATE') {
    return 'border-error/50 bg-error/20 text-error'
  }

  return 'border-success/50 bg-success/20 text-success'
})

watch(
  () => dreamStore.selectedDreamId,
  async (id) => {
    if (!id) return

    await dreamStore.fetchDreamChats({ dreamId: id })
    syncAccessMode()
    wallpaperIndex.value = 0
    restartWallpaperTimer()
    await nextTick()
    scrollChatToBottom()
  },
)

watch(
  () => dreamStore.selectedDreamChats.length,
  () => scrollChatToBottom(),
)

watch(
  () => wallpaperIntervalSeconds.value,
  () => restartWallpaperTimer(),
)

watch(
  () => wallpaperImages.value.length,
  () => restartWallpaperTimer(),
)

function requireSelectedDream(action = 'use this Dream action') {
  if (dreamStore.selectedDreamId) return true

  dreamStore.reportError(
    new Error('No dream selected.'),
    action,
    'Select a Dream first.',
  )

  return false
}

function extractId(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null

  const id = Number((payload as IdPayload).id)

  return Number.isInteger(id) && id > 0 ? id : null
}

function getRewardLabel(item: RewardLike) {
  return (
    item.label ||
    item.text ||
    item.power ||
    item.title ||
    item.name ||
    `Item ${item.id}`
  )
}

function cycleWallpaper() {
  if (wallpaperImages.value.length < 2) return

  wallpaperIndex.value =
    (wallpaperIndex.value + 1) % wallpaperImages.value.length
  wallpaperKey.value += 1
}

function restartWallpaperTimer() {
  if (wallpaperTimerId) {
    clearInterval(wallpaperTimerId)
    wallpaperTimerId = null
  }

  if (wallpaperIntervalSeconds.value > 0 && wallpaperImages.value.length > 1) {
    wallpaperTimerId = setInterval(
      cycleWallpaper,
      wallpaperIntervalSeconds.value * 1000,
    )
  }
}

function onWallpaperIntervalInput(event: Event) {
  wallpaperIntervalSeconds.value = Number(
    (event.target as HTMLInputElement).value,
  )
}

function togglePanel(key: PanelKey) {
  activePanel.value = activePanel.value === key ? null : key

  if (activePanel.value === 'chat') {
    nextTick(() => scrollChatToBottom())
  }
}

function syncAccessMode() {
  const dream = dreamStore.selectedDream as
    | (typeof dreamStore.selectedDream & {
        accessMode?: AccessMode | null
        privacyCode?: string | null
      })
    | null

  currentAccessMode.value = dream?.accessMode ?? 'OPEN'
  privacyCode.value = dream?.privacyCode ?? ''
}

function cycleAccessMode() {
  const modes: AccessMode[] = ['OPEN', 'CODE', 'PRIVATE']
  const currentIndex = modes.indexOf(currentAccessMode.value)
  const nextMode = modes[(currentIndex + 1) % modes.length] ?? 'OPEN'

  setAccessMode(nextMode)
}

async function setAccessMode(mode: AccessMode) {
  if (!requireSelectedDream('updating Dream access mode')) return

  currentAccessMode.value = mode

  const result = await dreamStore.updateSelectedDream({
    accessMode: mode,
    privacyCode: mode === 'CODE' ? privacyCode.value || null : null,
    updateNote: `Access mode set to ${mode}.`,
  } as DreamForm & Record<string, unknown>)

  if (!result.success) return

  syncAccessMode()
}

async function savePrivacyCode() {
  if (currentAccessMode.value !== 'CODE') return
  if (!requireSelectedDream('saving Dream privacy code')) return

  await dreamStore.updateSelectedDream({
    privacyCode: privacyCode.value || null,
    updateNote: 'Privacy code updated.',
  } as DreamForm & Record<string, unknown>)
}

async function togglePublic(isPublic: boolean) {
  if (!requireSelectedDream('updating Dream visibility')) return

  await dreamStore.updateSelectedDream({
    isPublic,
    updateNote: `Dream ${isPublic ? 'published' : 'made private'}.`,
  })
}

async function toggleMature(isMature: boolean) {
  if (!requireSelectedDream('updating Dream maturity flag')) return

  await dreamStore.updateSelectedDream({
    isMature,
    updateNote: `Mature flag set to ${isMature}.`,
  })
}

async function addCharacter(payload: unknown) {
  const id = extractId(payload)

  if (!id) {
    dreamStore.reportError(
      new Error('No character id was provided.'),
      'adding character to Dream',
      'Could not add that character.',
    )
    return
  }

  if (!requireSelectedDream('adding character to Dream')) return

  const ids = [
    ...new Set([
      ...dreamStore.selectedDreamCast.map((character) => character.id),
      id,
    ]),
  ]

  await dreamStore.setDreamCast(ids)
}

async function removeCharacter(id: number) {
  if (!requireSelectedDream('removing character from Dream')) return

  await dreamStore.setDreamCast(
    dreamStore.selectedDreamCast
      .map((character) => character.id)
      .filter((characterId) => characterId !== id),
  )
}

async function onCharacterCreated(payload?: unknown) {
  await addCharacter(payload)
}

async function addReward(payload: unknown) {
  const id = extractId(payload)

  if (!id) {
    dreamStore.reportError(
      new Error('No reward id was provided.'),
      'adding reward to Dream',
      'Could not add that item.',
    )
    return
  }

  if (!requireSelectedDream('adding reward to Dream')) return

  const ids = [
    ...new Set([
      ...dreamStore.selectedDreamItems.map((reward) => reward.id),
      id,
    ]),
  ]

  await dreamStore.setDreamItems(ids)
}

async function removeReward(id: number) {
  if (!requireSelectedDream('removing reward from Dream')) return

  await dreamStore.setDreamItems(
    dreamStore.selectedDreamItems
      .map((reward) => reward.id)
      .filter((rewardId) => rewardId !== id),
  )
}

async function onRewardCreated(payload?: unknown) {
  await addReward(payload)
}

async function setScenario(payload?: unknown) {
  if (!requireSelectedDream('setting Dream scenario')) return

  const payloadId = extractId(payload)
  const storeId = extractId(
    (scenarioStore as unknown as { selectedScenario?: unknown })
      .selectedScenario,
  )
  const id = payloadId || storeId

  if (!id) {
    dreamStore.reportError(
      new Error('No scenario id was provided.'),
      'setting Dream scenario',
      'Could not select that scenario.',
    )
    return
  }

  await dreamStore.setDreamScenario(id)
}

async function clearScenario() {
  if (!requireSelectedDream('clearing Dream scenario')) return

  await dreamStore.setDreamScenario(null)
}

async function onScenarioCreated(payload?: unknown) {
  await setScenario(payload)
}

async function setCollection(payload: unknown) {
  const id = extractId(payload)

  if (!id) {
    dreamStore.reportError(
      new Error('No collection id was provided.'),
      'setting Dream art collection',
      'Could not select that collection.',
    )
    return
  }

  if (!requireSelectedDream('setting Dream art collection')) return

  const result = await dreamStore.updateSelectedDream({
    artCollectionId: id,
    updateNote: 'Art collection linked.',
  })

  if (!result.success) return

  wallpaperIndex.value = 0
  restartWallpaperTimer()
}

async function onArtCreated() {
  if (!dreamStore.selectedDream?.id) return

  await dreamStore.fetchDreamById(dreamStore.selectedDream.id, true)
  restartWallpaperTimer()
}

async function saveVibeAsPrompt() {
  if (!requireSelectedDream('copying Dream vibe to prompt')) return

  const vibe =
    dreamStore.selectedDream?.currentVibe || dreamStore.dreamForm.currentVibe

  if (!vibe) {
    dreamStore.reportError(
      new Error('No Dream vibe exists.'),
      'copying Dream vibe to prompt',
      'Add a Dream vibe first.',
    )
    return
  }

  await dreamStore.updateSelectedDream({
    currentPrompt: vibe,
    updateNote: 'Vibe copied to image prompt.',
  })
}

async function startEditingSelectedDream() {
  if (!requireSelectedDream('starting Dream edit')) return

  const dream = await dreamStore.startEditingDream(
    dreamStore.selectedDreamId ?? undefined,
  )

  if (!dream) return

  navStore.setDashboardTab(dashboardKey, 'add')
}

function goToDreamSetup() {
  dreamStore.startAddingDream()
  navStore.setDashboardTab(dashboardKey, 'add')
}

async function submitMessage() {
  const content = message.value.trim()

  if (!content) return
  if (!requireSelectedDream('posting Dream message')) return

  const result = await dreamStore.addDreamChat(dreamStore.selectedDreamId!, {
    type: 'Dream',
    content,
    updateDream: reshapeDream.value,
    currentVibe: reshapeDream.value ? content : undefined,
    isPublic: dreamStore.selectedDream?.isPublic ?? true,
    isMature: dreamStore.selectedDream?.isMature ?? false,
  })

  if (!result.success) return

  message.value = ''
  reshapeDream.value = false

  await nextTick()
  scrollChatToBottom()
}

async function refreshChats() {
  if (!requireSelectedDream('refreshing Dream chat')) return

  await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
  await nextTick()
  scrollChatToBottom()
}

function scrollChatToBottom() {
  if (!chatScrollRef.value) return

  chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
}

function spinInspirationWheel() {
  const shuffled = [...INSPIRATION_IDEAS].sort(() => Math.random() - 0.5)

  wheelSlots.value = [
    shuffled[0] ?? INSPIRATION_IDEAS[0]!,
    shuffled[1] ?? INSPIRATION_IDEAS[1]!,
    shuffled[2] ?? INSPIRATION_IDEAS[2]!,
  ]
}

function applyTextMode(base: string, added: string, mode: InspirationMode) {
  const current = base.trim()
  const incoming = added.trim()

  if (!incoming) return current
  if (mode === 'replace') return incoming
  if (mode === 'prepend') return current ? `${incoming}, ${current}` : incoming

  return current ? `${current}, ${incoming}` : incoming
}

async function applyInspiration(mode: InspirationMode) {
  const current =
    dreamStore.dreamForm.currentPrompt ||
    dreamStore.selectedDream?.currentPrompt ||
    ''
  const next = applyTextMode(current, inspirationText.value, mode)

  dreamStore.setDreamForm({ currentPrompt: next })

  if (dreamStore.selectedDream?.id) {
    await dreamStore.setCurrentPrompt(next)
  }
}

function toggleScreenFx(key: string) {
  screenFx.value = screenFx.value.includes(key)
    ? screenFx.value.filter((entry) => entry !== key)
    : [...screenFx.value, key]
}

async function runArtCode() {
  const prompt = artCode.prompt.trim()

  if (!prompt) return

  const current =
    dreamStore.dreamForm.currentPrompt ||
    dreamStore.selectedDream?.currentPrompt ||
    ''
  const next = applyTextMode(current, prompt, artCode.promptMode)

  dreamStore.setDreamForm({ currentPrompt: next })

  if (!dreamStore.selectedDream?.id) return

  await dreamStore.setCurrentPrompt(next)
  await dreamStore.addModelDreamMessage(`art-code prompt:\n${prompt}`, {
    updateDream: false,
    currentPrompt: next,
  })
}

async function runPromptCode() {
  const prompt = promptCode.prompt.trim()

  if (!prompt) return
  if (!requireSelectedDream('running prompt-code')) return

  await dreamStore.addModelDreamMessage(`prompt-code:\n${prompt}`, {
    updateDream: false,
    currentPrompt: prompt,
  })
}

function toggleArtCodeTimer() {
  if (artCode.isRunning) {
    stopArtCodeTimer()
    return
  }

  artCode.isRunning = true
  artCode.timerId = setInterval(
    runArtCode,
    Math.max(5, artCode.intervalSeconds) * 1000,
  )
}

function togglePromptCodeTimer() {
  if (promptCode.isRunning) {
    stopPromptCodeTimer()
    return
  }

  promptCode.isRunning = true
  promptCode.timerId = setInterval(
    runPromptCode,
    Math.max(5, promptCode.intervalSeconds) * 1000,
  )
}

function stopArtCodeTimer() {
  if (artCode.timerId) {
    clearInterval(artCode.timerId)
  }

  artCode.timerId = null
  artCode.isRunning = false
}

function stopPromptCodeTimer() {
  if (promptCode.timerId) {
    clearInterval(promptCode.timerId)
  }

  promptCode.timerId = null
  promptCode.isRunning = false
}

onMounted(async () => {
  await dreamStore.initialize()

  if (dreamStore.selectedDreamId) {
    await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
    await nextTick()
    scrollChatToBottom()
  }

  syncAccessMode()
  restartWallpaperTimer()
})

onBeforeUnmount(() => {
  stopArtCodeTimer()
  stopPromptCodeTimer()

  if (wallpaperTimerId) {
    clearInterval(wallpaperTimerId)
    wallpaperTimerId = null
  }
})
</script>

<style scoped>
.wp-fade-enter-active,
.wp-fade-leave-active {
  transition: opacity 0.9s ease;
}

.wp-fade-enter-from,
.wp-fade-leave-to {
  opacity: 0;
}

.dream-gradient-fallback {
  background: linear-gradient(
    135deg,
    #0d0d1a,
    #1a0a2e,
    #16213e,
    #0f3460,
    #533483,
    #e94560
  );
  background-size: 400% 400%;
  animation: dream-gradient-shift 14s ease infinite;
}

@keyframes dream-gradient-shift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.panel-slide-enter-active {
  transition:
    transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.2s ease;
}

.panel-slide-leave-active {
  transition:
    transform 0.2s ease-in,
    opacity 0.15s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scrollbar-none {
  scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.lantern-glow-fx {
  background:
    radial-gradient(
      ellipse at 25% 25%,
      rgba(255, 210, 80, 0.18) 0%,
      transparent 55%
    ),
    radial-gradient(
      ellipse at 75% 75%,
      rgba(255, 140, 40, 0.12) 0%,
      transparent 50%
    );
  mix-blend-mode: screen;
  animation: lantern-pulse 6s ease-in-out infinite alternate;
}

@keyframes lantern-pulse {
  from {
    opacity: 0.7;
  }

  to {
    opacity: 1;
  }
}

.fog-fx {
  background: linear-gradient(
    to top,
    rgba(200, 220, 255, 0.14) 0%,
    rgba(200, 220, 255, 0.04) 40%,
    transparent 70%
  );
  animation: fog-drift 22s ease-in-out infinite alternate;
}

@keyframes fog-drift {
  from {
    opacity: 0.5;
    transform: translateX(-3%);
  }

  to {
    opacity: 0.9;
    transform: translateX(3%);
  }
}

.vignette-fx {
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(0, 0, 0, 0.55) 100%
  );
}
</style>
