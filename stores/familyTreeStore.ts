/* eslint-disable @typescript-eslint/indent */
import { defineStore } from 'pinia'

export interface Person {
  id: string
  name: string
  lifespan: string
  location: string
  parents: string[]
  occupation: string
  children: string[]
  birthYear?: number
  deathYear?: number
}

export const useFamilyTreeStore = defineStore('familyTreeStore', {
  state: () => ({
    materData: {} as Record<string, Person>,
    paterData: {} as Record<string, Person>,
    favorites: {} as Record<string, boolean>
  }),
  actions: {
    initFavorites() {
      this.favorites = JSON.parse(localStorage.getItem('favorites') || '{}')
    },
    toggleFavorite(id: string) {
      this.favorites[id] = !this.favorites[id]
      localStorage.setItem('favorites', JSON.stringify(this.favorites))
    },
    async fetchData(branch: 'mater' | 'pater') {
      try {
        console.log(`Fetching ${branch} data...`)
        const response = await fetch(`/${branch}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch ${branch} data. HTTP Status: ${response.status}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response')
        }

        const responseData: { message: string; slot: string; data: Record<string, any> } =
          await response.json()
        console.log(`${branch} data fetched successfully.`)

        const data = responseData.data

        if (branch === 'mater') {
          this.materData = data
        } else {
          this.paterData = data
        }
      } catch (error: any) {
        console.error(`Error fetching ${branch} data:`, error)
      }
    },
    addData(data: Record<string, Person>, branch: 'mater' | 'pater') {
      if (branch === 'mater') {
        this.materData = data
      } else {
        this.paterData = data
      }
    },
    parseLifespan(lifespan: string) {
      if (lifespan.toLowerCase() === 'living') {
        return {
          birthYear: undefined,
          deathYear: undefined
        }
      }

      const [birth, death] = lifespan.split('-')
      return {
        birthYear: birth ? parseInt(birth, 10) : undefined,
        deathYear: death ? parseInt(death, 10) : undefined
      }
    },
    getPeopleByCriteria(criteria: Partial<Person>, branch: 'mater' | 'pater' | 'both') {
      const data =
        branch === 'both'
          ? { ...this.materData, ...this.paterData }
          : branch === 'mater'
          ? this.materData
          : this.paterData

      return Object.values(data).filter((person) => {
        return Object.entries(criteria).every(([key, value]) => {
          const personKey = key as keyof Person

          if (personKey === 'birthYear' || personKey === 'deathYear') {
            return (
              typeof person[personKey] === 'number' &&
              typeof value === 'number' &&
              person[personKey]! >= value
            )
          }

          if (typeof person[personKey] === 'string') {
            return person[personKey]!.includes(value as string)
          } else if (Array.isArray(person[personKey])) {
            return (person[personKey] as string[]).includes(value as string)
          }

          return false
        })
      })
    },

    async uploadJson(file: File) {
      try {
        const reader = new FileReader()
        reader.onload = () => {
          const data = JSON.parse(reader.result as string)
          this.addData(data, 'mater')
        }
        reader.readAsText(file)
      } catch (error: any) {
        console.error('Error reading file', error)
      }
    }
  },
  getters: {
    materDataFirst10(state) {
      return Object.values(state.materData)
        .slice(0, 10)
        .reduce(
          (acc, person, index) => {
            acc[index] = person
            return acc
          },
          {} as Record<string, Person>
        )
    },
    paterDataFirst10(state) {
      return Object.values(state.paterData)
        .slice(0, 10)
        .reduce(
          (acc, person, index) => {
            acc[index] = person
            return acc
          },
          {} as Record<string, Person>
        )
    },

    familyData(state) {
      return { ...state.materData, ...state.paterData }
    },
    isFavorite(state) {
      return (id: string) => !!state.favorites[id]
    },
    findPersonById(state) {
      return (id: string, branch: 'mater' | 'pater' | 'both' = 'both'): Person | undefined => {
        const data =
          branch === 'both'
            ? { ...state.materData, ...state.paterData }
            : branch === 'mater'
            ? state.materData
            : state.paterData
        return data[id]
      }
    }
  }
})
