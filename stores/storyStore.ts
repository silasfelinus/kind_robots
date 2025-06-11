// /stores/storyStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStoryStore = defineStore('storyStore', () => {
  const activeSection = ref<'create' | 'credits' | 'about'>('create')

  const story = ref({
    creator: null as { id: string; name: string } | null,
    scenario: null as { id: string; description: string } | null,
    rewards: [] as Array<{ id: string; name: string; power: number }>,
    characters: [] as Array<{ id: string; name: string; honorific?: string }>,
    storyteller: '',
    genre: '',
    intro: '',
    chats: [] as Array<{ id: string; content: string; botResponse?: string }>,
    reactions: [] as Array<{ id: string; type: string }>,
    tags: [] as Array<string>,
  })

  function setActiveSection(section: 'create' | 'credits' | 'about') {
    activeSection.value = section
  }

  function setCreator(creator: { id: string; name: string }) {
    story.value.creator = creator
  }

  function setScenario(scenario: { id: string; description: string }) {
    story.value.scenario = scenario
  }

  function addReward(reward: { id: string; name: string; power: number }) {
    story.value.rewards.push(reward)
  }

  function addCharacter(character: {
    id: string
    name: string
    honorific?: string
  }) {
    story.value.characters.push(character)
  }

  function addChat(chat: {
    id: string
    content: string
    botResponse?: string
  }) {
    story.value.chats.push(chat)
  }

  function addReaction(reaction: { id: string; type: string }) {
    story.value.reactions.push(reaction)
  }

  function addTag(tag: string) {
    if (!story.value.tags.includes(tag)) {
      story.value.tags.push(tag)
    }
  }

  function clearStory() {
    story.value = {
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

  return {
    activeSection,
    story,
    setActiveSection,
    setCreator,
    setScenario,
    addReward,
    addCharacter,
    addChat,
    addReaction,
    addTag,
    clearStory,
  }
})
