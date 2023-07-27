// ~/stores/seeds/seedUsers.ts
import { User } from '@prisma/client'

// Define your array of initial bot data
export const userData: Partial<User>[] = [
  {
    username: 'kindrobot',
    email: 'kinrobot@kindrobots.org',
    password: 'changethis',
    realName: 'Kind Robot',
    avatarImage: '/images/avatar.jpg',
    Role: 'ADMIN'
  },
  {
    username: 'silasfelinus',
    email: 'silas@kindrobots.org',
    password: 'changethis',
    realName: 'Silas Knight',
    avatarImage: '/images/avatar.jpg',
    Role: 'ADMIN'
  },
  {
    username: 'superkate',
    email: 'superkate@kindrobots.org',
    password: 'changethis',
    realName: 'superk8!',
    avatarImage: '/images/avatar.jpg',
    Role: 'ADMIN'
  },
  {
    username: 'ronin',
    fancyName: '__Someones__',
    email: 'ronin@kindrobots.org',
    password: 'changethis',
    realName: 'Ronin Knight',
    avatarImage: '/images/avatar.jpg',
    Role: 'USER'
  },
  {
    username: 'fox',
    fancyName: 'The One and Only Fox',
    realName: 'Fox Knight',
    email: 'fox@kindrobots.org',
    password: 'changethis',
    avatarImage: '/images/avatar.jpg',
    Role: 'USER'
  }
]
