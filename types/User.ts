// ~/types/user.ts
import { Timestamp, Role } from './utils'
import { Bot } from './Bot'
import { Gallery } from './Gallery'
import { Image } from './Image'
import { Project } from './Project'
import { Prompt } from './Prompt'
import { Quest } from './Quest'
import { Reaction } from './Reaction'
import { Resource } from './Resource'

export interface User {
  bots?: Bot[]
  galleries?: Gallery[]
  images?: Image[]
  projects?: Project[]
  prompts?: Prompt[]
  quests?: Quest[]
  reactions?: Reaction[]
  resources?: Resource[]
  friends?: User[]
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  role: Role
  username: string
  realName: string
  fancyName: string
  salt: string
  hashedPassword: string
  email: string
  bio: string
  birthday: string
  address1: string
  address2: string
  city: string
  state: string
  country: string
  timezone: string
  phone: string
  languages: string
  hideBio: boolean
  avatarImage: string
  isPrivate: boolean
  allowCookies: boolean
  defaultTheme: string
  themeOverride: boolean
  showNsfw: boolean
  likes: number
  visits: number
  hideComments: boolean
  instagramUrl: string
  twitterUrl: string
  facebookUrl: string
  discordUrl: string
  kindrobotsUrl: string
  hideSocialNetworks: boolean
  questPoints: number
}
