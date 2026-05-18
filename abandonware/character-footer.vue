<!-- /components/navigation/character-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="isCompact ? 'px-2 py-2' : 'p-2 md:p-3'"
  >
    <template v-if="isCompact">
      <div
        class="grid h-full min-h-0 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-stretch gap-2 overflow-hidden"
      >
        <section
          class="flex h-full min-w-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-2"
        >
          <Icon name="kind-icon:person" class="h-7 w-7 shrink-0 text-primary" />

          <div class="hidden min-w-0 sm:block">
            <div class="truncate text-sm font-bold">
              {{ selectedCharacterName }}
            </div>

            <div class="truncate text-xs text-base-content/50">
              {{ characterStore.characters.length }} loaded
            </div>
          </div>
        </section>

        <textarea
          ref="characterMeasureRef"
          v-model="quickMessage"
          class="textarea textarea-bordered h-full min-h-0 min-w-0 resize-none overflow-y-auto rounded-2xl bg-base-100 px-3 py-2 text-sm leading-snug"
          placeholder="Talk to the character..."
          :disabled="!characterStore.selectedCharacter"
          @input="queuePromptOffsetRefresh"
          @keydown.enter.exact.prevent="sendQuickMessage"
        />

        <button
          type="button"
          class="btn btn-sm btn-primary h-full shrink-0 rounded-2xl text-white"
          :disabled="!canSendQuickMessage"
          @click="sendQuickMessage"
        >
          Send
        </button>

        <button
          type="button"
          class="btn btn-sm btn-secondary h-full shrink-0 rounded-2xl"
          @click="openCharacters"
        >
          Open
        </button>
      </div>
    </template>

    <template v-else-if="isOpen">
      <div
        class="grid h-full min-h-0 w-full grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="mb-3 flex shrink-0 items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-base-content">Character</h2>

              <p class="text-xs text-base-content/50">
                Select the cast member.
              </p>
            </div>

            <button
              type="button"
              class="btn btn-xs btn-primary rounded-xl text-white"
              @click="openCharacters"
            >
              Open
            </button>
          </div>

          <character-gallery
            variant="dropdown"
            title="Character"
            subtitle="Choose a character."
            :show-images="false"
            :show-controls="false"
            :show-toolbar="false"
            :show-card-actions="false"
            :auto-load="false"
          />

          <button
            type="button"
            class="btn btn-sm btn-secondary mt-3 rounded-2xl"
            @click="startNewCharacter"
          >
            <Icon name="kind-icon:dice" class="h-4 w-4" />
            New Random Character
          </button>
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden"
        >
          <div
            class="grid shrink-0 grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <textarea
              ref="characterMeasureRef"
              v-model="quickMessage"
              class="textarea textarea-bordered min-h-24 resize-none rounded-2xl bg-base-200 text-sm leading-relaxed"
              placeholder="Ask the character something..."
              :disabled="!characterStore.selectedCharacter"
              @input="queuePromptOffsetRefresh"
              @keydown.enter.exact.prevent="sendQuickMessage"
            />

            <div class="grid grid-cols-3 gap-2 lg:w-40 lg:grid-cols-1">
              <button
                type="button"
                class="btn btn-sm btn-ghost rounded-2xl"
                @click="fillRandomMessage"
              >
                Random
              </button>

              <button
                type="button"
                class="btn btn-sm btn-ghost rounded-2xl"
                @click="clearMessage"
              >
                Clear
              </button>

              <button
                type="button"
                class="btn btn-sm btn-primary rounded-2xl text-white"
                :disabled="!canSendQuickMessage"
                @click="sendQuickMessage"
              >
                Send
              </button>
            </div>
          </div>

          <div
            class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <character-card
              v-if="characterStore.selectedCharacter"
              :character="characterStore.selectedCharacter"
              :selected="true"
              :show-actions="false"
              :show-mode-buttons="false"
              :compact="true"
            />

            <div
              v-else
              class="flex h-full min-h-40 items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/50"
            >
              Pick a character, then verbally poke them with a stick.
            </div>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full min-h-0 w-full grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)_minmax(18rem,26rem)] gap-3 overflow-hidden"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="mb-3 flex shrink-0 items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-base-content">Characters</h2>

              <p class="text-xs text-base-content/50">
                Pick the active cast member.
              </p>
            </div>

            <button
              type="button"
              class="btn btn-xs btn-secondary rounded-xl"
              @click="startNewCharacter"
            >
              New
            </button>
          </div>

          <character-gallery
            variant="row"
            title="Characters"
            subtitle="Choose a cast member."
            :show-images="true"
            :show-controls="false"
            :show-toolbar="false"
            :show-card-actions="true"
            :show-stats="false"
            :compact="true"
            :auto-load="false"
          />
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="border-b border-base-300 px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-lg font-bold">
                  {{ selectedCharacterName }}
                </div>

                <div class="line-clamp-2 text-sm text-base-content/60">
                  {{ selectedCharacterSummary }}
                </div>
              </div>

              <button
                type="button"
                class="btn btn-xs btn-primary shrink-0 rounded-xl text-white"
                @click="openCharacters"
              >
                Open Manager
              </button>
            </div>
          </div>

          <div class="min-h-0 overflow-y-auto bg-base-200 p-3">
            <character-card
              v-if="characterStore.selectedCharacter"
              :character="characterStore.selectedCharacter"
              :selected="true"
              :show-actions="false"
              :show-mode-buttons="false"
            />

            <p
              v-else
              class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/50"
            >
              No character selected. The stage is empty. Very avant-garde.
            </p>
          </div>

          <div class="border-t border-base-300 bg-base-100 p-2">
            <div class="flex gap-2">
              <textarea
                ref="characterMeasureRef"
                v-model="quickMessage"
                class="textarea textarea-bordered min-h-12 flex-1 resize-none rounded-2xl text-sm"
                placeholder="Talk to the character..."
                :disabled="!characterStore.selectedCharacter"
                @input="queuePromptOffsetRefresh"
                @keydown.enter.exact.prevent="sendQuickMessage"
              />

              <button
                type="button"
                class="btn btn-primary min-h-12 shrink-0 rounded-2xl text-white"
                :disabled="!canSendQuickMessage"
                @click="sendQuickMessage"
              >
                Send
              </button>
            </div>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <h2 class="text-sm font-bold text-base-content">Quick Prompt</h2>

          <textarea
            v-model="quickPrompt"
            class="textarea textarea-bordered min-h-0 flex-1 resize-none rounded-2xl bg-base-200 text-sm"
            placeholder="Build a reusable character prompt..."
          />

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-sm btn-ghost rounded-2xl"
              @click="buildPrompt"
            >
              Build
            </button>

            <button
              type="button"
              class="btn btn-sm btn-secondary rounded-2xl"
              :disabled="!quickPrompt.trim()"
              @click="copyPrompt"
            >
              Copy
            </button>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'

const router = useRouter()
const chatStore = useChatStore()
const characterStore = useCharacterStore()
const displayStore = useDisplayStore()
const navStore = useNavStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const quickMessage = ref('')
const quickPrompt = ref('')
const characterMeasureRef = ref<HTMLTextAreaElement | null>(null)

let characterResizeObserver: ResizeObserver | null = null

const selectedCharacterName = computed(() => {
  const character = characterStore.selectedCharacter

  if (!character) return 'Characters'

  return character.name
    ? `${character.name} ${
        character.honorific ? `the ${character.honorific}` : ''
      }`.trim()
    : 'Unnamed Character'
})

const selectedCharacterSummary = computed(() => {
  const character = characterStore.selectedCharacter

  if (!character) return 'Select, create, or clone a character.'

  return [
    character.species,
    character.class,
    character.genre,
    character.personality,
  ]
    .filter(Boolean)
    .join(' / ')
})

const canSendQuickMessage = computed(
  () => Boolean(characterStore.selectedCharacter) && Boolean(quickMessage.value.trim()),
)

function fillRandomMessage() {
  quickMessage.value =
    'What do you notice first, and what are you trying very hard not to say?'
  queuePromptOffsetRefresh()
}

function clearMessage() {
  quickMessage.value = ''
  queuePromptOffsetRefresh()
}

async function sendQuickMessage() {
  const character = characterStore.selectedCharacter
  const content = quickMessage.value.trim()

  if (!character || !content) return

  const chat = await chatStore.addChat({
    content,
    userId: character.userId || 10,
    type: 'Weirdlandia',
    characterId: character.id,
    recipientId: null,
  })

  if (chat) {
    chatStore.selectedChat = chat
    quickMessage.value = ''
  }

  queuePromptOffsetRefresh()
}

function startNewCharacter() {
  characterStore.startAddingCharacter()
  navStore.setDashboardTab('character', 'characters')
  void router.push('/characters')
}

async function openCharacters() {
  navStore.setDashboardTab('character', 'overview')
  await router.push('/characters')
}

function buildPrompt() {
  const character = characterStore.selectedCharacter

  if (!character) return

  quickPrompt.value = [
    `Character: ${selectedCharacterName.value}`,
    `Species: ${character.species || 'Unknown'}`,
    `Class: ${character.class || 'Unknown'}`,
    `Personality: ${character.personality || 'Unknown'}`,
    `Backstory: ${character.backstory || 'No backstory provided.'}`,
    `Quirks: ${character.quirks || 'No quirks listed.'}`,
    `Inventory: ${character.inventory || 'No inventory listed.'}`,
    `Skills: ${character.skills || 'No skills listed.'}`,
    '',
    'Respond in character. Keep the voice specific, vivid, and interactive.',
  ].join('\n')
}

async function copyPrompt() {
  if (!quickPrompt.value.trim()) return

  await navigator.clipboard.writeText(quickPrompt.value)
}

function refreshPromptOffset() {
  if (displayStore.footerComponent !== 'character') {
    displayStore.clearPromptOffset('character')
    return
  }

  if (footerState.value === 'hidden') {
    displayStore.clearPromptOffset('character')
    return
  }

  if (footerState.value === 'priority') {
    displayStore.clearPromptOffset('character')
    return
  }

  const el = characterMeasureRef.value

  if (!el) {
    displayStore.clearPromptOffset('character')
    return
  }

  displayStore.refreshPromptOffset(
    'character',
    el.scrollHeight,
    el.clientHeight,
    footerState.value === 'compact' ? 1.5 : 2.5,
  )
}

function queuePromptOffsetRefresh() {
  nextTick(() => {
    refreshPromptOffset()
  })
}

watch(
  () => [
    footerState.value,
    displayStore.footerComponent,
    characterStore.selectedCharacter?.id ?? 0,
    quickMessage.value,
  ],
  () => {
    queuePromptOffsetRefresh()
  },
)

onMounted(async () => {
  await Promise.all([
    characterStore.initialize({
      fetchRemote: true,
      createDefaultForm: true,
    }),
    navStore.initialize(),
  ])

  queuePromptOffsetRefresh()

  characterResizeObserver = new ResizeObserver(() => {
    refreshPromptOffset()
  })

  if (characterMeasureRef.value) {
    characterResizeObserver.observe(characterMeasureRef.value)
  }
})

onBeforeUnmount(() => {
  characterResizeObserver?.disconnect()
  characterResizeObserver = null
  displayStore.clearPromptOffset('character')
})
</script>