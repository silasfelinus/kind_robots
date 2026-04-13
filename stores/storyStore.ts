// /stores/storyStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

type StorySection = 'create' | 'credits' | 'about'

type StoryCreator = { id: string; name: string } | null
type StoryScenario = { id: string; description: string } | null
type StoryReward = { id: string; name: string; power: number }
type StoryCharacter = { id: string; name: string; honorific?: string }
type StoryChat = { id: string; content: string; botResponse?: string }
type StoryReaction = { id: string; type: string }

interface StoryState {
  creator: StoryCreator
  scenario: StoryScenario
  rewards: StoryReward[]
  characters: StoryCharacter[]
  storyteller: string
  genre: string
  intro: string
  chats: StoryChat[]
  reactions: StoryReaction[]
  tags: string[]
}

function createEmptyStory(): StoryState {
  return {
    creator: null,
    scenario: null,
    rewards: [],
    characters: [],
    storyteller: '',
    genre: '',
    intro: '',
    chats: [],
    reactions: [],
    tags: [],
  }
}

export const useStoryStore = defineStore('storyStore', () => {
  const activeSection = ref<StorySection>('create')
  const story = ref<StoryState>(createEmptyStory())

  function setActiveSection(section: StorySection) {
    activeSection.value = section
  }

  function setCreator(creator: NonNullable<StoryCreator>) {
    story.value.creator = creator
  }

  function setScenario(scenario: NonNullable<StoryScenario>) {
    story.value.scenario = scenario
  }

  function setStoryteller(storyteller: string) {
    story.value.storyteller = storyteller
  }

  function setGenre(genre: string) {
    story.value.genre = genre
  }

  function setIntro(intro: string) {
    story.value.intro = intro
  }

  function addReward(reward: StoryReward) {
    story.value.rewards.push(reward)
  }

  function addCharacter(character: StoryCharacter) {
    story.value.characters.push(character)
  }

  function addChat(chat: StoryChat) {
    story.value.chats.push(chat)
  }

  function addReaction(reaction: StoryReaction) {
    story.value.reactions.push(reaction)
  }

  function addTag(tag: string) {
    if (!story.value.tags.includes(tag)) {
      story.value.tags.push(tag)
    }
  }

  function removeTag(tag: string) {
    story.value.tags = story.value.tags.filter(
      (existingTag) => existingTag !== tag,
    )
  }

  function clearStory() {
    story.value = createEmptyStory()
  }

  return {
    activeSection,
    story,
    setActiveSection,
    setCreator,
    setScenario,
    setStoryteller,
    setGenre,
    setIntro,
    addReward,
    addCharacter,
    addChat,
    addReaction,
    addTag,
    removeTag,
    clearStory,
  }
})
