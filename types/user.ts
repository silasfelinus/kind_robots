// ~/types/user.ts
import { Timestamp, Role } from './utils'
import { Bot } from './bot'
import { Gallery } from './gallery'
import { Media } from './media'
import { Project } from './project'
import { Prompt } from './prompt'
import { Game } from './game'
import { Reaction } from './reaction'
import { Resource } from './resource'

export interface User {
  bots?: Bot[]
  galleries?: Gallery[]
  Media?: Media[]
  projects?: Project[]
  prompts?: Prompt[]
  games?: Game[]
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
