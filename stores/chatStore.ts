import { defineStore } from 'pinia'
import { ChatRoom, Message } from '@prisma/client'
import { errorHandler } from '@/server/api/utils/error'

interface ChatRoomData {
  name: string
  host: string
  description?: string
  image?: string
  theme?: string
  isNsfw?: boolean
  inactive?: boolean
}

export const useChatStore = defineStore('chatStore', {
  state: () => ({
    chatRooms: [] as ChatRoom[],
    currentChatRoom: null as ChatRoom | null,
    messages: [] as Message[]
  }),
  actions: {
    async createChatRoom(chatRoomData: ChatRoomData) {
      try {
        const response = await fetch('/api/chatrooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(chatRoomData)
        })
        const data = await response.json()
        if (data.success) {
          this.chatRooms.push(data.data)
        } else {
          console.error('Failed to create chat room:', data.message)
        }
      } catch (error: any) {
        console.error('API error:', errorHandler(error))
      }
    },
    async fetchChatRooms() {
      try {
        const response = await fetch('/api/chatrooms')
        const data = await response.json()
        if (data.success) {
          this.chatRooms = data.data.filter((room: ChatRoom) => room.isActive)
        } else {
          console.error('Failed to fetch chat rooms:', data.message)
        }
      } catch (error: any) {
        console.error('API error:', errorHandler(error))
      }
    },
    async fetchChatRoomDetails(id: string) {
      try {
        const response = await fetch(`/api/chatrooms/${id}`)
        const data = await response.json()
        if (data.success) {
          this.currentChatRoom = data.data
          this.messages = data.data.messages || []
        } else {
          console.error('Failed to fetch chat room details:', data.message)
        }
      } catch (error: any) {
        console.error('API error:', errorHandler(error))
      }
    },
    async postMessage(id: string, message: string) {
      try {
        const response = await fetch(`/api/chatrooms/${id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        })
        const data = await response.json()
        if (data.success) {
          this.messages.push(data.data)
        } else {
          console.error('Failed to post message:', data.message)
        }
      } catch (error: any) {
        console.error('API error:', errorHandler(error))
      }
    },
    setCurrentChatRoom(chatRoom: ChatRoom) {
      this.currentChatRoom = chatRoom
    }
  }
})
