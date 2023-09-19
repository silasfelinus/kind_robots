// /stores/simulationStore.ts
import { defineStore } from 'pinia'
import { errorHandler } from '@/server/api/utils/error'
import { elements } from '@/training/simElements'

export const useSimulationStore = defineStore('simulationStore', {
  state: () => ({
    grid: [] as any[][], // The grid representing the play area
    spawnPoints: [] as { x: number; y: number; elementType: string }[], // The spawn points with their respective details
    elements, // The details of each element type
    gameStatus: 'stopped' as 'running' | 'paused' | 'stopped', // The current status of the game
    winner: null as null | string, // The winner of the game, if any
    savedStates: [] as any[] // To store the saved states
  }),
  actions: {
    initializeGame({ x = 100, y = 100 }) {
      this.simulationSpace = ref(Array(x * y).fill(null))
      this.elements.value.forEach((element) => {
        for (let i = 0; i < element.spawn; i++) {
          this.spawnElement(element)
        }
      })
    },
    stepSimulation() {
      // Step 1: Move each element randomly but with a tendency to move in a specific direction
      const newSimulationSpace = [...this.simulationSpace.value]
      this.simulationSpace.value.forEach((cell, index) => {
        if (cell) {
          const x = index % 100 // Adjust based on your grid size
          const y = Math.floor(index / 100) // Adjust based on your grid size
          // Define possible moves (up, down, left, right) and filter out moves that go outside the grid
          const moves = [
            { x: x - 1, y, dir: 'left' },
            { x: x + 1, y, dir: 'right' },
            { x, y: y - 1, dir: 'up' },
            { x, y: y + 1, dir: 'down' }
          ].filter((move) => move.x >= 0 && move.x < 100 && move.y >= 0 && move.y < 100)
          // Select a random move
          const move = moves[Math.floor(Math.random() * moves.length)]
          const newIndex = move.y * 100 + move.x // Calculate the new index based on the move
          newSimulationSpace[newIndex] = cell // Move the element to the new cell
          newSimulationSpace[index] = null // Set the current cell to null
        }
      })
      // Step 2: Handle interactions between elements when they occupy the same cell
      newSimulationSpace.forEach((cell, index) => {
        if (cell) {
          const overlappingElement = this.simulationSpace.value[index]
          if (overlappingElement && overlappingElement.title !== cell.title) {
            // Interaction logic: Determine the winner based on strengths and weaknesses
            if (cell.strengths.includes(overlappingElement.title)) {
              overlappingElement.health -= cell.power // Cell wins
            } else if (overlappingElement.strengths.includes(cell.title)) {
              cell.health -= overlappingElement.power // Overlapping element wins
            }
          }
        }
      })

      // Step 3: Update the health of elements based on interactions and remove elements with zero or less health
      newSimulationSpace.forEach((cell, index) => {
        if (cell && cell.health <= 0) {
          newSimulationSpace[index] = null // Remove element with zero or less health
        }
      })

      // Step 4: Check for end conditions and declare a winner if only one type of element remains
      const remainingElements = new Set(
        newSimulationSpace.map((cell) => cell && cell.title).filter(Boolean)
      )
      if (remainingElements.size === 1) {
        console.log(`Winner: ${Array.from(remainingElements)[0]}`) // Declare the winner
        this.pauseSimulation() // Stop the simulation
      }

      this.simulationSpace.value = newSimulationSpace // Update the simulation space with the new state
    },
    spawnElement(element) {
      const emptyCells = this.simulationSpace.value.reduce((acc, cell, index) => {
        if (!cell) acc.push(index)
        return acc
      }, [])
      const randomIndex = Math.floor(Math.random() * emptyCells.length)
      this.simulationSpace.value[emptyCells[randomIndex]] = { ...element }
    },
    generateSpawnPoints() {
      try {
        // Logic to generate spawn points at random available spots on the grid
        // ...
      } catch (error) {
        errorHandler(error)
      }
    },
    updateGrid(newGrid: any[][]) {
      // Update the grid state
      try {
        this.grid = newGrid
      } catch (error) {
        errorHandler(error)
      }
    },
    saveGameState(name: string) {
      try {
        const currentState = {
          grid: this.grid,
          spawnPoints: this.spawnPoints,
          elements: this.elements,
          gameStatus: this.gameStatus,
          winner: this.winner
        }
        localStorage.setItem(`simulationGameState-${name}`, JSON.stringify(currentState))
        this.savedStates.push({ name, state: currentState })
      } catch (error) {
        errorHandler(error)
      }
    },
    loadGameState(name: string) {
      // Load the saved game state from localStorage
      try {
        const savedState = JSON.parse(localStorage.getItem(`simulationGameState-${name}`) as string)
        if (savedState) {
          this.grid = savedState.grid
          this.spawnPoints = savedState.spawnPoints
          this.elements = savedState.elements
          this.gameStatus = savedState.gameStatus
          this.winner = savedState.winner
        }
      } catch (error) {
        errorHandler(error)
      }
    },
    listSavedStates() {
      // List all the saved states
      try {
        const savedStates = Object.keys(localStorage)
          .filter((key) => key.startsWith('simulationGameState-'))
          .map((key) => ({
            name: key.replace('simulationGameState-', ''),
            state: JSON.parse(localStorage.getItem(key) as string)
          }))
        this.savedStates = savedStates
      } catch (error) {
        errorHandler(error)
      }
    },
    playSimulation() {
      this.intervalId = setInterval(this.stepSimulation, 1000) // Adjust the interval as needed
    },
    pauseSimulation() {
      clearInterval(this.intervalId)
    },
    resetSimulation() {
      this.simulationSpace = ref(Array(10000).fill(null)) // Reset to initial state
    }
  }
})
