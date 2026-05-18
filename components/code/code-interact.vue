<!-- /components/code/code-interact.vue -->
<template>
  <section class="flex w-full flex-col gap-3">
    <code-cards
      :cards="hand"
      @play="playCard"
      @reshuffle="reshuffleHand"
    />

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
import { useDisplayStore } from '@/stores/displayStore'
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

type CodeModel =
  | 'pitch'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'art'

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

const handSize = 6

const pitchStore = usePitchStore()
const dreamStore = useDreamStore()
const characterStore = useCharacterStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const displayStore = useDisplayStore()
const navStore = useNavStore()

const hand = ref<CodeCard[]>([])
const message = ref('')

const makeId = () => {
  return `code-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const pitchTargets = computed<CodeTarget[]>(() => {
  const pitches = pitchStore.pitches ?? pitchStore.pitchs ?? []

  return pitches
    .filter((pitch: any) => pitch?.id)
    .map((pitch: any) => ({
      id: pitch.id,
      title: pitch.title || pitch.name || `Pitch ${pitch.id}`,
      model: 'pitch',
    }))
})

const dreamTargets = computed<CodeTarget[]>(() => {
  const dreams = dreamStore.dreams ?? []

  return dreams
    .filter((dream: any) => dream?.id)
    .map((dream: any) => ({
      id: dream.id,
      title: dream.title || dream.name || `Dream ${dream.id}`,
      model: 'dream',
    }))
})

const characterTargets = computed<CodeTarget[]>(() => {
  const characters = characterStore.characters ?? []

  return characters
    .filter((character: any) => character?.id)
    .map((character: any) => ({
      id: character.id,
      title: character.name || character.title || `Character ${character.id}`,
      model: 'character',
    }))
})

const rewardTargets = computed<CodeTarget[]>(() => {
  const rewards = rewardStore.rewards ?? []

  return rewards
    .filter((reward: any) => reward?.id)
    .map((reward: any) => ({
      id: reward.id,
      title: reward.title || reward.name || `Reward ${reward.id}`,
      model: 'reward',
    }))
})

const scenarioTargets = computed<CodeTarget[]>(() => {
  const scenarios = scenarioStore.scenarios ?? []

  return scenarios
    .filter((scenario: any) => scenario?.id)
    .map((scenario: any) => ({
      id: scenario.id,
      title: scenario.title || scenario.name || `Scenario ${scenario.id}`,
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
    description: 'Add a place, realm, set piece, dungeon, salon, void mall, or suspicious moon.',
    icon: 'kind-icon:map',
    kind: 'add-dream',
    model: 'dream',
  },
  {
    id: makeId(),
    title: 'Add Character',
    subtitle: 'Create someone dramatic',
    description: 'Add a hero, villain, chaos goblin, mentor, rival, or lore-adjacent menace.',
    icon: 'kind-icon:character',
    kind: 'add-character',
    model: 'character',
  },
  {
    id: makeId(),
    title: 'Add Reward',
    subtitle: 'Skill or treasure',
    description: 'Create loot, magic, a special move, a cursed object, or a deeply suspicious sandwich.',
    icon: 'kind-icon:treasure',
    kind: 'add-reward',
    model: 'reward',
  },
  {
    id: makeId(),
    title: 'Add Scenario',
    subtitle: 'Create a story prompt',
    description: 'Add a choice, challenge, art prompt, text prompt, or interactive situation.',
    icon: 'kind-icon:story',
    kind: 'add-scenario',
    model: 'scenario',
  },
])

const targetCards = computed<CodeCard[]>(() => {
  return targets.value.flatMap((target) => [
    {
      id: makeId(),
      title: `Create Art`,
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
      title: `Edit`,
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
      title: `Interact`,
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
      description: 'Create a skill, power, trick, move, or special interaction for this world.',
      icon: 'kind-icon:magic',
      kind: 'add-skill',
      model: 'reward',
    })

    cards.push({
      id: makeId(),
      title: 'Add Treasure',
      subtitle: 'Loot with consequences',
      description: 'Create an item, relic, artifact, key, device, prize, or cursed keepsake.',
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

const shuffleCards = (cards: CodeCard[]) => {
  return [...cards].sort(() => Math.random() - 0.5)
}

const drawCards = (count = handSize) => {
  return shuffleCards(deck.value).slice(0, count)
}

const reshuffleHand = () => {
  hand.value = drawCards()
  message.value = 'The deck has been reshuffled. Chaos has received fresh paperwork.'
}

const replaceCard = (playedCard: CodeCard) => {
  const usedIds = new Set(hand.value.map((card) => card.id))
  const availableCards = shuffleCards(deck.value).filter((card) => {
    return !usedIds.has(card.id) && card.kind !== playedCard.kind
  })

  const replacement = availableCards[0] ?? drawCards(1)[0]

  hand.value = hand.value.map((card) => {
    if (card.id === playedCard.id) {
      return replacement
    }

    return card
  })
}

const openModelTab = (model: CodeModel, tab: string) => {
  const dashboardKey = model === 'dream' ? 'dream' : model

  if (typeof navStore.setActiveDashboardTab === 'function') {
    navStore.setActiveDashboardTab(dashboardKey, tab)
    return
  }

  if (typeof navStore.setDashboardTab === 'function') {
    navStore.setDashboardTab(dashboardKey, tab)
    return
  }

  if (typeof displayStore.setDisplayMode === 'function') {
    displayStore.setDisplayMode(model)
  }
}

const selectTarget = async (card: CodeCard) => {
  if (!card.model || !card.targetId) {
    return
  }

  if (card.model === 'pitch' && typeof pitchStore.selectPitch === 'function') {
    await pitchStore.selectPitch(card.targetId)
  }

  if (card.model === 'dream' && typeof dreamStore.selectDream === 'function') {
    await dreamStore.selectDream(card.targetId)
  }

  if (card.model === 'character' && typeof characterStore.selectCharacter === 'function') {
    await characterStore.selectCharacter(card.targetId)
  }

  if (card.model === 'reward' && typeof rewardStore.selectReward === 'function') {
    await rewardStore.selectReward(card.targetId)
  }

  if (card.model === 'scenario' && typeof scenarioStore.selectScenario === 'function') {
    await scenarioStore.selectScenario(card.targetId)
  }
}

const openAdd = (model: CodeModel) => {
  openModelTab(model, 'add')
}

const openEdit = async (card: CodeCard) => {
  await selectTarget(card)

  if (card.model) {
    openModelTab(card.model, 'add')
  }
}

const openInteract = async (card: CodeCard) => {
  await selectTarget(card)

  if (card.model) {
    openModelTab(card.model, 'interact')
  }
}

const openArt = async (card: CodeCard) => {
  await selectTarget(card)
  openModelTab('art', 'add')
}

const playCard = async (card: CodeCard) => {
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