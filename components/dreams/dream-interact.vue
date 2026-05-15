<!-- /components/dreams/dream-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
  >
    <header class="rounded-2xl border border-base-300 bg-base-200 p-4">
      <div
        class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
      >
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Dream Interface
          </p>

          <h2 class="text-2xl font-black text-base-content">
            {{ dreamStore.selectedDream?.title || 'No Dream selected' }}
          </h2>

          <p
            class="mt-2 max-w-4xl whitespace-pre-wrap text-sm text-base-content/70"
          >
            {{ activeDreamText }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-secondary rounded-2xl"
            type="button"
            :disabled="!dreamStore.selectedDreamId || dreamStore.chatsLoading"
            @click="refreshChats"
          >
            <Icon name="kind-icon:refresh" class="h-5 w-5" />
            Refresh Chat
          </button>

          <button
            class="btn btn-primary rounded-2xl"
            type="button"
            :disabled="!dreamStore.selectedDream?.id"
            @click="startEditingSelectedDream"
          >
            <Icon name="kind-icon:edit" class="h-5 w-5" />
            Edit Dream
          </button>
        </div>
      </div>
    </header>

    <div
      class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10"
    >
      <button
        v-for="control in elementControls"
        :key="control.key"
        class="btn min-h-20 rounded-2xl border text-xs sm:text-sm"
        :class="
          control.active
            ? control.activeClass
            : 'btn-outline border-base-300 bg-base-100'
        "
        type="button"
        @click="toggleElement(control.key)"
      >
        <span class="flex flex-col items-center gap-1">
          <Icon :name="control.icon" class="h-6 w-6" />
          <span class="font-black">{{ control.label }}</span>
        </span>
      </button>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
      <main class="flex min-h-0 flex-col gap-4 xl:col-span-8">
        <section
          v-if="activeElements.dream"
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <div
            class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-primary">
                Current Dream
              </p>

              <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/80">
                {{
                  dreamStore.selectedDream?.currentVibe ||
                  dreamStore.dreamForm.currentVibe ||
                  'The Dream is quiet. Suspiciously quiet.'
                }}
              </p>
            </div>

            <button
              class="btn btn-accent rounded-2xl"
              type="button"
              :disabled="!dreamStore.selectedDream?.id || dreamStore.isSaving"
              @click="saveVibeAsPrompt"
            >
              <Icon name="kind-icon:sparkles" class="h-5 w-5" />
              Vibe to Prompt
            </button>
          </div>
        </section>

        <section
          v-if="
            dreamStore.selectedDreamCurrentImage && activeElements.artImages
          "
          class="overflow-hidden rounded-2xl border border-base-300 bg-base-200"
        >
          <img
            :src="dreamStore.selectedDreamCurrentImage"
            class="max-h-96 w-full object-cover"
            :alt="dreamStore.selectedDream?.title || 'Dream image'"
          />
        </section>

        <section
          v-if="activeElements.inspiration"
          class="rounded-2xl border border-info/40 bg-info/10 p-4"
        >
          <div
            class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-info">
                Inspiration Wheel
              </p>

              <h3 class="text-xl font-black">
                Combine ideas, then pipe them into the Dream prompt
              </h3>
            </div>

            <button
              class="btn btn-info rounded-2xl"
              type="button"
              @click="spinInspirationWheel"
            >
              <Icon name="kind-icon:dice" class="h-5 w-5" />
              Spin
            </button>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label class="form-control">
              <span class="label-text font-bold">Slot One</span>
              <select
                v-model="wheelSlots[0]"
                class="select select-bordered rounded-2xl"
              >
                <option
                  v-for="idea in inspirationIdeas"
                  :key="`slot-one-${idea}`"
                  :value="idea"
                >
                  {{ idea }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Slot Two</span>
              <select
                v-model="wheelSlots[1]"
                class="select select-bordered rounded-2xl"
              >
                <option
                  v-for="idea in inspirationIdeas"
                  :key="`slot-two-${idea}`"
                  :value="idea"
                >
                  {{ idea }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Slot Three</span>
              <select
                v-model="wheelSlots[2]"
                class="select select-bordered rounded-2xl"
              >
                <option
                  v-for="idea in inspirationIdeas"
                  :key="`slot-three-${idea}`"
                  :value="idea"
                >
                  {{ idea }}
                </option>
              </select>
            </label>
          </div>

          <div class="mt-4 rounded-2xl border border-info/30 bg-base-100 p-3">
            <p class="text-xs font-bold uppercase tracking-wide text-info">
              Combined Inspiration
            </p>

            <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/80">
              {{ inspirationText }}
            </p>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-outline rounded-2xl"
              type="button"
              @click="applyInspiration('prepend')"
            >
              <Icon name="kind-icon:arrow-up" class="h-5 w-5" />
              Prepend
            </button>

            <button
              class="btn btn-outline rounded-2xl"
              type="button"
              @click="applyInspiration('append')"
            >
              <Icon name="kind-icon:plus" class="h-5 w-5" />
              Add
            </button>

            <button
              class="btn btn-warning rounded-2xl"
              type="button"
              @click="applyInspiration('replace')"
            >
              <Icon name="kind-icon:replace" class="h-5 w-5" />
              Replace
            </button>
          </div>
        </section>

        <section class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <article
            v-if="activeElements.characters"
            class="rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-wide text-primary"
                >
                  Characters
                </p>
                <p class="text-sm text-base-content/60">
                  {{ dreamStore.selectedDreamCast.length }} attached
                </p>
              </div>

              <button class="btn btn-sm btn-primary rounded-2xl" type="button">
                <Icon name="kind-icon:user-plus" class="h-4 w-4" />
                Add
              </button>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="character in dreamStore.selectedDreamCast"
                :key="character.id"
                class="badge badge-primary badge-outline p-3"
              >
                {{ character.name || `Character ${character.id}` }}
              </span>

              <span
                v-if="!dreamStore.selectedDreamCast.length"
                class="text-sm text-base-content/60"
              >
                No cast yet. The stage is empty and frankly overqualified.
              </span>
            </div>
          </article>

          <article
            v-if="activeElements.rewards"
            class="rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-wide text-primary"
                >
                  Rewards
                </p>
                <p class="text-sm text-base-content/60">
                  {{ dreamStore.selectedDreamItems.length }} attached
                </p>
              </div>

              <button
                class="btn btn-sm btn-secondary rounded-2xl"
                type="button"
              >
                <Icon name="kind-icon:gift" class="h-4 w-4" />
                Add
              </button>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="reward in dreamStore.selectedDreamItems"
                :key="reward.id"
                class="badge badge-secondary badge-outline p-3"
              >
                {{
                  reward.label ||
                  reward.text ||
                  reward.power ||
                  `Reward ${reward.id}`
                }}
              </span>

              <span
                v-if="!dreamStore.selectedDreamItems.length"
                class="text-sm text-base-content/60"
              >
                No rewards yet. The loot goblin has unionized.
              </span>
            </div>
          </article>

          <article
            v-if="activeElements.pitches"
            class="rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-wide text-primary"
                >
                  Pitches
                </p>
                <p class="text-sm text-base-content/60">
                  Big-picture idea fuel
                </p>
              </div>

              <button class="btn btn-sm btn-accent rounded-2xl" type="button">
                <Icon name="kind-icon:lightbulb" class="h-4 w-4" />
                Add
              </button>
            </div>

            <p class="mt-3 text-sm text-base-content/70">
              Pitch picker hooks will land here. For now, this panel reserves
              the slot and keeps the interface shape honest.
            </p>
          </article>

          <article
            v-if="activeElements.scenarios"
            class="rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-wide text-primary"
                >
                  Scenario
                </p>
                <p class="text-sm text-base-content/60">
                  {{
                    dreamStore.selectedDream?.scenarioId
                      ? `Scenario ${dreamStore.selectedDream.scenarioId}`
                      : 'None selected'
                  }}
                </p>
              </div>

              <button class="btn btn-sm btn-info rounded-2xl" type="button">
                <Icon name="kind-icon:map" class="h-4 w-4" />
                Choose
              </button>
            </div>

            <p class="mt-3 text-sm text-base-content/70">
              Scenario selection belongs here, especially once the Dream starts
              acting like a branching weird little machine.
            </p>
          </article>

          <article
            v-if="activeElements.screenfx"
            class="rounded-2xl border border-base-300 bg-base-200 p-4 lg:col-span-2"
          >
            <div
              class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-wide text-primary"
                >
                  Screen FX
                </p>
                <p class="text-sm text-base-content/60">
                  Visual atmosphere toggles for the Dream scene
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="fx in screenFxOptions"
                  :key="fx.key"
                  class="btn btn-sm rounded-2xl"
                  :class="
                    screenFx.includes(fx.key) ? 'btn-primary' : 'btn-outline'
                  "
                  type="button"
                  @click="toggleScreenFx(fx.key)"
                >
                  <Icon :name="fx.icon" class="h-4 w-4" />
                  {{ fx.label }}
                </button>
              </div>
            </div>
          </article>
        </section>

        <section
          v-if="activeElements.artCode || activeElements.promptCode"
          class="relative min-h-96 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Code Workspace
          </p>

          <p class="mt-1 text-sm text-base-content/60">
            Movable automation panels. Tiny robot interns with clipboards.
          </p>

          <article
            v-if="activeElements.artCode"
            class="absolute z-10 w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-accent/40 bg-base-100 p-3 shadow-xl"
            :style="panelStyle('artCode')"
            @pointerdown.self="startDrag('artCode', $event)"
          >
            <div
              class="flex cursor-move items-center justify-between gap-3 rounded-2xl bg-accent/10 p-2"
              @pointerdown="startDrag('artCode', $event)"
            >
              <div class="flex items-center gap-2 font-black text-accent">
                <Icon name="kind-icon:image" class="h-5 w-5" />
                art-code
              </div>

              <button
                class="btn btn-xs btn-circle btn-ghost"
                type="button"
                @click.stop="activeElements.artCode = false"
              >
                <Icon name="kind-icon:close" class="h-4 w-4" />
              </button>
            </div>

            <label class="form-control mt-3">
              <span class="label-text font-bold">Art Prompt</span>
              <textarea
                v-model="artCode.prompt"
                class="textarea textarea-bordered min-h-28 rounded-2xl"
                placeholder="Generate a cinematic dream image..."
              />
            </label>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <label class="form-control">
                <span class="label-text font-bold">Timer seconds</span>
                <input
                  v-model.number="artCode.intervalSeconds"
                  class="input input-bordered rounded-2xl"
                  min="5"
                  type="number"
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Mode</span>
                <select
                  v-model="artCode.promptMode"
                  class="select select-bordered rounded-2xl"
                >
                  <option value="append">Add</option>
                  <option value="prepend">Prepend</option>
                  <option value="replace">Replace</option>
                </select>
              </label>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="btn btn-accent rounded-2xl"
                type="button"
                @click="runArtCode"
              >
                <Icon name="kind-icon:play" class="h-5 w-5" />
                Run
              </button>

              <button
                class="btn rounded-2xl"
                :class="artCode.isRunning ? 'btn-error' : 'btn-outline'"
                type="button"
                @click="toggleArtCodeTimer"
              >
                <Icon
                  :name="
                    artCode.isRunning ? 'kind-icon:stop' : 'kind-icon:timer'
                  "
                  class="h-5 w-5"
                />
                {{ artCode.isRunning ? 'Stop Timer' : 'Start Timer' }}
              </button>
            </div>
          </article>

          <article
            v-if="activeElements.promptCode"
            class="absolute z-20 w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-secondary/40 bg-base-100 p-3 shadow-xl"
            :style="panelStyle('promptCode')"
            @pointerdown.self="startDrag('promptCode', $event)"
          >
            <div
              class="flex cursor-move items-center justify-between gap-3 rounded-2xl bg-secondary/10 p-2"
              @pointerdown="startDrag('promptCode', $event)"
            >
              <div class="flex items-center gap-2 font-black text-secondary">
                <Icon name="kind-icon:prompt" class="h-5 w-5" />
                prompt-code
              </div>

              <button
                class="btn btn-xs btn-circle btn-ghost"
                type="button"
                @click.stop="activeElements.promptCode = false"
              >
                <Icon name="kind-icon:close" class="h-4 w-4" />
              </button>
            </div>

            <label class="form-control mt-3">
              <span class="label-text font-bold">Text Prompt</span>
              <textarea
                v-model="promptCode.prompt"
                class="textarea textarea-bordered min-h-28 rounded-2xl"
                placeholder="Write the next Dream beat..."
              />
            </label>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <label class="form-control">
                <span class="label-text font-bold">Timer seconds</span>
                <input
                  v-model.number="promptCode.intervalSeconds"
                  class="input input-bordered rounded-2xl"
                  min="5"
                  type="number"
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Mode</span>
                <select
                  v-model="promptCode.promptMode"
                  class="select select-bordered rounded-2xl"
                >
                  <option value="append">Add</option>
                  <option value="prepend">Prepend</option>
                  <option value="replace">Replace</option>
                </select>
              </label>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="btn btn-secondary rounded-2xl"
                type="button"
                @click="runPromptCode"
              >
                <Icon name="kind-icon:play" class="h-5 w-5" />
                Run
              </button>

              <button
                class="btn rounded-2xl"
                :class="promptCode.isRunning ? 'btn-error' : 'btn-outline'"
                type="button"
                @click="togglePromptCodeTimer"
              >
                <Icon
                  :name="
                    promptCode.isRunning ? 'kind-icon:stop' : 'kind-icon:timer'
                  "
                  class="h-5 w-5"
                />
                {{ promptCode.isRunning ? 'Stop Timer' : 'Start Timer' }}
              </button>
            </div>
          </article>
        </section>
      </main>

      <aside class="flex min-h-0 flex-col gap-4 xl:col-span-4">
        <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Context
          </p>

          <div class="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div class="rounded-2xl bg-base-100 p-2">
              <div class="font-black text-secondary">
                {{ dreamStore.selectedDreamCast.length }}
              </div>
              <div class="text-base-content/60">Cast</div>
            </div>

            <div class="rounded-2xl bg-base-100 p-2">
              <div class="font-black text-secondary">
                {{ dreamStore.selectedDreamItems.length }}
              </div>
              <div class="text-base-content/60">Rewards</div>
            </div>

            <div class="rounded-2xl bg-base-100 p-2">
              <div class="font-black text-secondary">
                {{ dreamStore.selectedDreamCollectionArt.length }}
              </div>
              <div class="text-base-content/60">Art</div>
            </div>

            <div class="rounded-2xl bg-base-100 p-2">
              <div class="font-black text-secondary">
                {{ dreamStore.selectedDreamChats.length }}
              </div>
              <div class="text-base-content/60">Chat</div>
            </div>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 p-3">
            <p class="text-xs font-bold uppercase tracking-wide text-primary">
              Chat Window
            </p>
            <p class="text-sm text-base-content/60">
              Talk to the Dream, attached models, and automation results.
            </p>
          </div>

          <div class="min-h-72 flex-1 space-y-3 overflow-y-auto p-3">
            <article
              v-for="chat in dreamStore.selectedDreamChats"
              :key="chat.id"
              class="rounded-2xl border p-3"
              :class="
                chat.type === 'BotResponse'
                  ? 'border-secondary/40 bg-secondary/10'
                  : 'border-base-300 bg-base-200'
              "
            >
              <div class="flex items-center justify-between gap-3">
                <div class="font-black text-primary">
                  {{
                    chat.sender || chat.User?.username || 'Someone mysterious'
                  }}
                </div>

                <div class="badge badge-outline">
                  {{ chat.type }}
                </div>
              </div>

              <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/80">
                {{ chat.content }}
              </p>
            </article>

            <div
              v-if="!dreamStore.selectedDreamChats.length"
              class="flex min-h-52 flex-col items-center justify-center gap-3 text-center text-base-content/60"
            >
              <Icon name="kind-icon:chat" class="h-12 w-12" />
              <p>No room history yet. Say something ominous but useful.</p>
            </div>
          </div>

          <form
            class="border-t border-base-300 bg-base-200 p-3"
            @submit.prevent="submitMessage"
          >
            <label class="form-control">
              <span class="label-text font-bold">Speak into the Dream</span>
              <textarea
                v-model="message"
                class="textarea textarea-bordered min-h-24 rounded-2xl"
                placeholder="The lanterns flicker as..."
              />
            </label>

            <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label
                class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <input
                  v-model="reshapeDream"
                  class="checkbox checkbox-primary"
                  type="checkbox"
                />
                <span class="text-sm font-bold">Reshape vibe</span>
              </label>

              <button
                class="btn btn-primary rounded-2xl"
                type="submit"
                :disabled="!canSubmit || dreamStore.isSaving"
              >
                <Icon name="kind-icon:send" class="h-5 w-5" />
                Send
              </button>
            </div>
          </form>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

type DreamElementKey =
  | 'dream'
  | 'characters'
  | 'rewards'
  | 'pitches'
  | 'artImages'
  | 'scenarios'
  | 'screenfx'
  | 'inspiration'
  | 'artCode'
  | 'promptCode'

type InspirationMode = 'append' | 'prepend' | 'replace'
type CodePanelKey = 'artCode' | 'promptCode'

interface CodePanelState {
  prompt: string
  intervalSeconds: number
  promptMode: InspirationMode
  isRunning: boolean
  timerId: number | null
}

interface PanelPosition {
  x: number
  y: number
}

interface DragState {
  key: CodePanelKey | null
  startX: number
  startY: number
  originX: number
  originY: number
}

const dreamStore = useDreamStore()

const message = ref('')
const reshapeDream = ref(false)
const screenFx = ref<string[]>([])

const activeElements = reactive<Record<DreamElementKey, boolean>>({
  dream: true,
  characters: true,
  rewards: true,
  pitches: false,
  artImages: true,
  scenarios: false,
  screenfx: false,
  inspiration: true,
  artCode: false,
  promptCode: false,
})

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

const panelPositions = reactive<Record<CodePanelKey, PanelPosition>>({
  artCode: {
    x: 16,
    y: 72,
  },
  promptCode: {
    x: 80,
    y: 152,
  },
})

const dragState = reactive<DragState>({
  key: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
})

const inspirationIdeas = [
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
]

const wheelSlots = ref<[string, string, string]>([
  'gothic fairy tale',
  'cozy cosmic tavern',
  'bureaucratic inferno',
])

const screenFxOptions = [
  {
    key: 'lanternGlow',
    label: 'Lantern Glow',
    icon: 'kind-icon:lamp',
  },
  {
    key: 'butterflies',
    label: 'Butterflies',
    icon: 'kind-icon:butterfly',
  },
  {
    key: 'glitch',
    label: 'Glitch',
    icon: 'kind-icon:glitch',
  },
  {
    key: 'fog',
    label: 'Fog',
    icon: 'kind-icon:cloud',
  },
]

async function startEditingSelectedDream() {
  if (!dreamStore.selectedDream?.id) return

  await dreamStore.startEditingDream(dreamStore.selectedDream.id)
}

const elementControls = computed(() => [
  {
    key: 'dream' as const,
    label: 'Dream',
    icon: 'kind-icon:dream',
    active: activeElements.dream,
    activeClass: 'btn-primary',
  },
  {
    key: 'characters' as const,
    label: 'Characters',
    icon: 'kind-icon:users',
    active: activeElements.characters,
    activeClass: 'btn-secondary',
  },
  {
    key: 'rewards' as const,
    label: 'Rewards',
    icon: 'kind-icon:gift',
    active: activeElements.rewards,
    activeClass: 'btn-accent',
  },
  {
    key: 'pitches' as const,
    label: 'Pitches',
    icon: 'kind-icon:lightbulb',
    active: activeElements.pitches,
    activeClass: 'btn-info',
  },
  {
    key: 'artImages' as const,
    label: 'Images',
    icon: 'kind-icon:image',
    active: activeElements.artImages,
    activeClass: 'btn-primary',
  },
  {
    key: 'scenarios' as const,
    label: 'Scenario',
    icon: 'kind-icon:map',
    active: activeElements.scenarios,
    activeClass: 'btn-secondary',
  },
  {
    key: 'screenfx' as const,
    label: 'Screen FX',
    icon: 'kind-icon:sparkles',
    active: activeElements.screenfx,
    activeClass: 'btn-accent',
  },
  {
    key: 'inspiration' as const,
    label: 'Wheel',
    icon: 'kind-icon:dice',
    active: activeElements.inspiration,
    activeClass: 'btn-info',
  },
  {
    key: 'artCode' as const,
    label: 'art-code',
    icon: 'kind-icon:code',
    active: activeElements.artCode,
    activeClass: 'btn-primary',
  },
  {
    key: 'promptCode' as const,
    label: 'prompt-code',
    icon: 'kind-icon:terminal',
    active: activeElements.promptCode,
    activeClass: 'btn-secondary',
  },
])

const activeDreamText = computed(() => {
  return (
    dreamStore.selectedDream?.currentVibe ||
    dreamStore.dreamForm.currentVibe ||
    'Select a Dream, attach strange little ingredients, then make art or text from the combination. Normal software, but wearing eyeliner.'
  )
})

const inspirationText = computed(() => {
  return wheelSlots.value.filter(Boolean).join(' + ')
})

const canSubmit = computed(() => {
  return Boolean(dreamStore.selectedDreamId && message.value.trim())
})

watch(
  () => dreamStore.selectedDreamId,
  async (dreamId) => {
    if (dreamId) await dreamStore.fetchDreamChats({ dreamId })
  },
)

onMounted(async () => {
  await dreamStore.initialize()

  if (dreamStore.selectedDreamId) {
    await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
  }

  window.addEventListener('pointermove', handleDrag)
  window.addEventListener('pointerup', stopDrag)
})

onBeforeUnmount(() => {
  stopArtCodeTimer()
  stopPromptCodeTimer()
  window.removeEventListener('pointermove', handleDrag)
  window.removeEventListener('pointerup', stopDrag)
})

function toggleElement(key: DreamElementKey) {
  activeElements[key] = !activeElements[key]
}

function toggleScreenFx(key: string) {
  if (screenFx.value.includes(key)) {
    screenFx.value = screenFx.value.filter((item) => item !== key)
    return
  }

  screenFx.value = [...screenFx.value, key]
}

function spinInspirationWheel() {
  const fallbackSlots: [string, string, string] = [
    'gothic fairy tale',
    'cozy cosmic tavern',
    'bureaucratic inferno',
  ]

  const shuffled = [...inspirationIdeas].sort(() => Math.random() - 0.5)

  wheelSlots.value = [
    shuffled[0] ?? fallbackSlots[0],
    shuffled[1] ?? fallbackSlots[1],
    shuffled[2] ?? fallbackSlots[2],
  ]
}

function applyTextMode(
  baseText: string,
  addedText: string,
  mode: InspirationMode,
) {
  const cleanBase = baseText.trim()
  const cleanAdded = addedText.trim()

  if (!cleanAdded) return cleanBase
  if (mode === 'replace') return cleanAdded
  if (mode === 'prepend')
    return cleanBase ? `${cleanAdded}, ${cleanBase}` : cleanAdded

  return cleanBase ? `${cleanBase}, ${cleanAdded}` : cleanAdded
}

async function applyInspiration(mode: InspirationMode) {
  const currentPrompt =
    dreamStore.dreamForm.currentPrompt ||
    dreamStore.selectedDream?.currentPrompt ||
    ''

  const nextPrompt = applyTextMode(currentPrompt, inspirationText.value, mode)

  dreamStore.setDreamForm({
    currentPrompt: nextPrompt,
  })

  if (dreamStore.selectedDream?.id) {
    await dreamStore.setCurrentPrompt(nextPrompt)
  }
}

function panelStyle(key: CodePanelKey) {
  const position = panelPositions[key]

  return {
    transform: `translate(${position.x}px, ${position.y}px)`,
  }
}

function startDrag(key: CodePanelKey, event: PointerEvent) {
  dragState.key = key
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.originX = panelPositions[key].x
  dragState.originY = panelPositions[key].y
}

function handleDrag(event: PointerEvent) {
  if (!dragState.key) return

  const nextX = dragState.originX + event.clientX - dragState.startX
  const nextY = dragState.originY + event.clientY - dragState.startY

  panelPositions[dragState.key] = {
    x: Math.max(0, nextX),
    y: Math.max(56, nextY),
  }
}

function stopDrag() {
  dragState.key = null
}

async function refreshChats() {
  await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
}

async function saveVibeAsPrompt() {
  const vibe =
    dreamStore.selectedDream?.currentVibe || dreamStore.dreamForm.currentVibe
  if (!vibe) return

  await dreamStore.updateSelectedDream({
    currentPrompt: vibe,
    updateNote: 'Copied the Dream vibe into the location prompt.',
  })
}

async function submitMessage() {
  const content = message.value.trim()
  if (!content || !dreamStore.selectedDreamId) return

  const result = await dreamStore.addDreamChat(dreamStore.selectedDreamId, {
    type: 'Dream',
    content,
    updateDream: reshapeDream.value,
    currentVibe: reshapeDream.value ? content : undefined,
    isPublic: dreamStore.selectedDream?.isPublic ?? true,
    isMature: dreamStore.selectedDream?.isMature ?? false,
  })

  if (result.success) {
    message.value = ''
    reshapeDream.value = false
  }
}

async function runArtCode() {
  const prompt = artCode.prompt.trim()
  if (!prompt) return

  const currentPrompt =
    dreamStore.dreamForm.currentPrompt ||
    dreamStore.selectedDream?.currentPrompt ||
    ''

  const nextPrompt = applyTextMode(currentPrompt, prompt, artCode.promptMode)

  dreamStore.setDreamForm({
    currentPrompt: nextPrompt,
  })

  if (dreamStore.selectedDream?.id) {
    await dreamStore.setCurrentPrompt(nextPrompt)

    await dreamStore.addModelDreamMessage(
      `art-code queued prompt:\n\n${prompt}`,
      {
        updateDream: false,
        currentPrompt: nextPrompt,
      },
    )
  }
}

async function runPromptCode() {
  const prompt = promptCode.prompt.trim()
  if (!prompt || !dreamStore.selectedDreamId) return

  await dreamStore.addModelDreamMessage(`prompt-code request:\n\n${prompt}`, {
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
  artCode.timerId = window.setInterval(
    () => {
      runArtCode()
    },
    Math.max(5, artCode.intervalSeconds) * 1000,
  )
}

function togglePromptCodeTimer() {
  if (promptCode.isRunning) {
    stopPromptCodeTimer()
    return
  }

  promptCode.isRunning = true
  promptCode.timerId = window.setInterval(
    () => {
      runPromptCode()
    },
    Math.max(5, promptCode.intervalSeconds) * 1000,
  )
}

function stopArtCodeTimer() {
  if (artCode.timerId) {
    window.clearInterval(artCode.timerId)
  }

  artCode.timerId = null
  artCode.isRunning = false
}

function stopPromptCodeTimer() {
  if (promptCode.timerId) {
    window.clearInterval(promptCode.timerId)
  }

  promptCode.timerId = null
  promptCode.isRunning = false
}
</script>
