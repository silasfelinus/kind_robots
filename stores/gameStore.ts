import { defineStore } from 'pinia'

interface Character {
  player: string
  name: string
  background: string
  description: string
  stats: string[] // Changed 'Stats' to 'stats' to maintain consistency in naming conventions
}

interface Decision {
  challenge: string
  options: string[]
}

interface Game {
  name: string
  genre: string
  setting: string
  scenario: string
  username: string
  reward?: string
  character: Character // Changed 'Character' to 'character' for naming consistency
  decisions?: Decision[] // Adding a list of decisions for the game scenario
}

export const useGameStore = defineStore('game', {
  state: () => ({
    isGameStarted: false, // Use 'isGameStarted' for the state
    showAbout: false,
    currentGame: null as Game | null,
  }),
  getters: {
    currentCharacter(): Character | null {
      return this.currentGame ? this.currentGame.character : null
    },
    currentDecisions(): Decision[] | null {
      return this.currentGame && this.currentGame.decisions ? this.currentGame.decisions : null
    },
  },
  actions: {
    initiateNewGame() {
      // Renamed the method for clarity.
      this.isGameStarted = true
      this.showAbout = false
    },
    toggleAbout() {
      this.showAbout = !this.showAbout
      this.isGameStarted = false
    },
    initializeGame(game: Game) {
      this.currentGame = game
    },
    updateCharacter(character: Character) {
      if (this.currentGame) {
        this.currentGame.character = character
      }
    },
    addDecision(decision: Decision) {
      if (this.currentGame) {
        // Ensure decisions array exists. If not, initialize it.
        this.currentGame.decisions = this.currentGame.decisions || []
        this.currentGame.decisions.push(decision)
      }
    },
    resetGame() {
      this.currentGame = null
      this.isGameStarted = false
      this.showAbout = false
    },
  },
})
