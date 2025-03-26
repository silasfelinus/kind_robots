import { defineStore } from 'pinia'

export const useStoryStore = defineStore('storyStore', {
  state: () => ({
    activeSection: 'create' as 'create' | 'credits' | 'about', // Ensure it's a valid section
    story: {
      creator: null as { id: string; name: string } | null, // Avoids conflict with User model
      scenario: null as { id: string; description: string } | null,
      rewards: [] as Array<{ id: string; name: string; power: number }>,
      characters: [] as Array<{ id: string; name: string; honorific?: string }>,
      storyteller: '',
      genre: '',
      intro: '',
      chats: [] as Array<{ id: string; content: string; botResponse?: string }>,
      reactions: [] as Array<{ id: string; type: string }>,
      tags: [] as Array<string>,
    },
  }),

  actions: {
    setActiveSection(section: 'create' | 'credits' | 'about') {
      this.activeSection = section
    },

    setCreator(creator: { id: string; name: string }) {
      this.story.creator = creator
    },

    setScenario(scenario: { id: string; description: string }) {
      this.story.scenario = scenario
    },

    addReward(reward: { id: string; name: string; power: number }) {
      this.story.rewards.push(reward)
    },

    addCharacter(character: { id: string; name: string; honorific?: string }) {
      this.story.characters.push(character)
    },

    addChat(chat: { id: string; content: string; botResponse?: string }) {
      this.story.chats.push(chat)
    },

    addReaction(reaction: { id: string; type: string }) {
      this.story.reactions.push(reaction)
    },

    addTag(tag: string) {
      if (!this.story.tags.includes(tag)) this.story.tags.push(tag)
    },

    clearStory() {
      this.story = {
        creator: null, // Replacing user with creator
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
    },
  },
})
