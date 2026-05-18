<!-- /components/code/code-interact.vue -->
<template>
  <section class="flex w-full flex-col gap-3">
    <code-cards :cards="hand" @play="playCard" @reshuffle="reshuffleHand" />

    <div
      v-if="message"
      class="rounded-2xl border border-info bg-info/10 p-3 text-sm text-info-content"
    >
      {{ message }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useNavStore } from '@/stores/navStore'

type CodeCardKind =
  | 'add-pitch'
  | 'add-dream'
  | 'add-character'
  | 'add-reward'
  | 'add-scenario'
  | 'create-art'
  | 'edit-target'
  | 'interact-target'
  | 'add-skill'
  | 'add-treasure'
  | 'expand-concept'

type CodeModel = 'pitch' | 'dream' | 'character' | 'reward' | 'scenario' | 'art'

type DashboardKey =
  | 'art'
  | 'bot'
  | 'brainstorm'
  | 'builder'
  | 'user'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'footer'
  | 'theme'
  | 'giftshop'
  | 'server'
  | 'wonder'

interface CodeCard {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  kind: CodeCardKind
  model?: CodeModel
  targetId?: number
  targetTitle?: string
}

interface CodeTarget {
  id: number
  title: string
  model: CodeModel
}

interface SelectableStore {
  selectPitch?: (id: number) => Promise<unknown> | unknown
  selectDream?: (id: number) => Promise<unknown> | unknown
  selectCharacter?: (id: number) => Promise<unknown> | unknown
  selectReward?: (id: number) => Promise<unknown> | unknown
  selectScenario?: (id: number) => Promise<unknown> | unknown
}

const handSize = 6

const pitchStore = usePitchStore()
const dreamStore = useDreamStore()
const characterStore = useCharacterStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const navStore = useNavStore()

const hand = ref<CodeCard[]>([])
const message = ref('')

const makeId = () => {
  return `code-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const pitchTargets = computed<CodeTarget[]>(() => {
  return pitchStore.pitches
    .filter((pitch) => pitch?.id)
    .map((pitch) => ({
      id: pitch.id,
      title: pitch.title || pitch.pitch || `Pitch ${pitch.id}`,
      model: 'pitch',
    }))
})

const dreamTargets = computed<CodeTarget[]>(() => {
  return dreamStore.dreams
    .filter((dream) => dream?.id)
    .map((dream) => ({
      id: dream.id,
      title: dream.title || `Dream ${dream.id}`,
      model: 'dream',
    }))
})

const characterTargets = computed<CodeTarget[]>(() => {
  return characterStore.characters
    .filter((character) => character?.id)
    .map((character) => ({
      id: character.id,
      title: character.name || `Character ${character.id}`,
      model: 'character',
    }))
})

const rewardTargets = computed<CodeTarget[]>(() => {
  return rewardStore.rewards
    .filter((reward) => reward?.id)
    .map((reward) => ({
      id: reward.id,
      title: reward.label || `Reward ${reward.id}`,
      model: 'reward',
    }))
})

const scenarioTargets = computed<CodeTarget[]>(() => {
  return scenarioStore.scenarios
    .filter((scenario) => scenario?.id)
    .map((scenario) => ({
      id: scenario.id,
      title: scenario.title || `Scenario ${scenario.id}`,
      model: 'scenario',
    }))
})

const targets = computed<CodeTarget[]>(() => [
  ...pitchTargets.value,
  ...dreamTargets.value,
  ...characterTargets.value,
  ...rewardTargets.value,
  ...scenarioTargets.value,
])

const baseCards = computed<CodeCard[]>(() => [
  {
    id: makeId(),
    title: 'Add Pitch',
    subtitle: 'Start a new world seed',
    description: 'Create the big strange idea everything else grows from.',
    icon: 'kind-icon:sparkles',
    kind: 'add-pitch',
    model: 'pitch',
  },
  {
    id: makeId(),
    title: 'Add Location',
    subtitle: 'Create a Dream',
    description:
      'Add a place, realm, set piece, dungeon, salon, void mall, or suspicious moon.',
    icon: 'kind-icon:map',
    kind: 'add-dream',
    model: 'dream',
  },
  {
    id: makeId(),
    title: 'Add Character',
    subtitle: 'Create someone dramatic',
    description:
      'Add a hero, villain, chaos goblin, mentor, rival, or lore-adjacent menace.',
    icon: 'kind-icon:character',
    kind: 'add-character',
    model: 'character',
  },
  {
    id: makeId(),
    title: 'Add Reward',
    subtitle: 'Skill or treasure',
    description:
      'Create loot, magic, a special move, a cursed object, or a deeply suspicious sandwich.',
    icon: 'kind-icon:treasure',
    kind: 'add-reward',
    model: 'reward',
  },
  {
    id: makeId(),
    title: 'Add Scenario',
    subtitle: 'Create a story prompt',
    description:
      'Add a choice, challenge, art prompt, text prompt, or interactive situation.',
    icon: 'kind-icon:story',
    kind: 'add-scenario',
    model: 'scenario',
  },
])

const targetCards = computed<CodeCard[]>(() => {
  return targets.value.flatMap((target) => [
    {
      id: makeId(),
      title: 'Create Art',
      subtitle: target.title,
      description: `Generate art for ${target.title}.`,
      icon: 'kind-icon:paintbrush',
      kind: 'create-art',
      model: target.model,
      targetId: target.id,
      targetTitle: target.title,
    },
    {
      id: makeId(),
      title: 'Edit',
      subtitle: target.title,
      description: `Open ${target.title} for revision and polish.`,
      icon: 'kind-icon:edit',
      kind: 'edit-target',
      model: target.model,
      targetId: target.id,
      targetTitle: target.title,
    },
    {
      id: makeId(),
      title: 'Interact',
      subtitle: target.title,
      description: `Use ${target.title} as an interactive prompt-tool.`,
      icon: 'kind-icon:chat',
      kind: 'interact-target',
      model: target.model,
      targetId: target.id,
      targetTitle: target.title,
    },
  ])
})

const rewardFlavorCards = computed<CodeCard[]>(() => {
  const cards: CodeCard[] = []

  if (dreamTargets.value.length || scenarioTargets.value.length) {
    cards.push({
      id: makeId(),
      title: 'Add Skill',
      subtitle: 'World ability',
      description:
        'Create a skill, power, trick, move, or special interaction for this world.',
      icon: 'kind-icon:magic',
      kind: 'add-skill',
      model: 'reward',
    })

    cards.push({
      id: makeId(),
      title: 'Add Treasure',
      subtitle: 'Loot with consequences',
      description:
        'Create an item, relic, artifact, key, device, prize, or cursed keepsake.',
      icon: 'kind-icon:gem',
      kind: 'add-treasure',
      model: 'reward',
    })
  }

  return cards
})

const deck = computed<CodeCard[]>(() => [
  ...baseCards.value,
  ...targetCards.value,
  ...rewardFlavorCards.value,
])

function isCodeCard(card: CodeCard | undefined): card is CodeCard {
  return Boolean(card)
}

function modelToDashboardKey(model: CodeModel): DashboardKey {
  if (model === 'pitch') return 'brainstorm'
  if (model === 'art') return 'art'
  return model
}

function shuffleCards(cards: CodeCard[]) {
  return [...cards].sort(() => Math.random() - 0.5)
}

function drawCards(count = handSize) {
  return shuffleCards(deck.value).slice(0, count)
}

function reshuffleHand() {
  hand.value = drawCards()
  message.value =
    'The deck has been reshuffled. Chaos has received fresh paperwork.'
}

function replaceCard(playedCard: CodeCard) {
  const usedIds = new Set(hand.value.map((card) => card.id))
  const availableCards = shuffleCards(deck.value).filter((card) => {
    return !usedIds.has(card.id) && card.kind !== playedCard.kind
  })

  const replacement = availableCards[0] ?? drawCards(1)[0]

  if (!replacement) {
    hand.value = hand.value.filter((card) => card.id !== playedCard.id)
    return
  }

  hand.value = hand.value
    .map((card) => {
      if (card.id === playedCard.id) {
        return replacement
      }

      return card
    })
    .filter(isCodeCard)
}

function openModelTab(model: CodeModel, tab: string) {
  const dashboardKey = modelToDashboardKey(model)

  navStore.setDashboardTab(dashboardKey, tab)
}

async function selectTarget(card: CodeCard) {
  if (!card.model || !card.targetId) {
    return
  }

  const pitchActions = pitchStore as SelectableStore
  const dreamActions = dreamStore as SelectableStore
  const characterActions = characterStore as SelectableStore
  const rewardActions = rewardStore as SelectableStore
  const scenarioActions = scenarioStore as SelectableStore

  if (card.model === 'pitch' && pitchActions.selectPitch) {
    await pitchActions.selectPitch(card.targetId)
  }

  if (card.model === 'dream' && dreamActions.selectDream) {
    await dreamActions.selectDream(card.targetId)
  }

  if (card.model === 'character' && characterActions.selectCharacter) {
    await characterActions.selectCharacter(card.targetId)
  }

  if (card.model === 'reward' && rewardActions.selectReward) {
    await rewardActions.selectReward(card.targetId)
  }

  if (card.model === 'scenario' && scenarioActions.selectScenario) {
    await scenarioActions.selectScenario(card.targetId)
  }
}

function openAdd(model: CodeModel) {
  openModelTab(model, 'add')
}

async function openEdit(card: CodeCard) {
  await selectTarget(card)

  if (card.model) {
    openModelTab(card.model, 'add')
  }
}

async function openInteract(card: CodeCard) {
  await selectTarget(card)

  if (card.model) {
    openModelTab(card.model, 'interact')
  }
}

async function openArt(card: CodeCard) {
  await selectTarget(card)
  openModelTab('art', 'add')
}

async function playCard(card: CodeCard) {
  message.value = ''

  if (card.kind === 'add-pitch') {
    openAdd('pitch')
  }

  if (card.kind === 'add-dream') {
    openAdd('dream')
  }

  if (card.kind === 'add-character') {
    openAdd('character')
  }

  if (card.kind === 'add-reward') {
    openAdd('reward')
  }

  if (card.kind === 'add-scenario') {
    openAdd('scenario')
  }

  if (card.kind === 'create-art') {
    await openArt(card)
  }

  if (card.kind === 'edit-target') {
    await openEdit(card)
  }

  if (card.kind === 'interact-target') {
    await openInteract(card)
  }

  if (card.kind === 'add-skill') {
    openAdd('reward')
    message.value = 'Skill reward mode selected. Teach the world a new trick.'
  }

  if (card.kind === 'add-treasure') {
    openAdd('reward')
    message.value = 'Treasure reward mode selected. Probably cursed. Excellent.'
  }

  if (card.kind === 'expand-concept') {
    openModelTab('scenario', 'add')
  }

  replaceCard(card)
}

onMounted(() => {
  hand.value = drawCards()
})
</script>
