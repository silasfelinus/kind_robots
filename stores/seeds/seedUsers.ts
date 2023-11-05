// ~/stores/seeds/seedUsers.ts
import { type User } from '@prisma/client';

// Define your array of initial bot data
export const userData: Partial<User>[] = [
  {
    username: 'kindrobot',
    email: 'kinrobot@kindrobots.org',
    name: 'Kind Robot',
    Role: 'ADMIN',
  },
  {
    username: 'silasfelinus',
    email: 'silas@kindrobots.org',
    name: 'Silas Knight',
    Role: 'ADMIN',
  },
  {
    username: 'superkate',
    email: 'superkate@kindrobots.org',
    name: 'superk8!',
    Role: 'ADMIN',
  },
  {
    username: 'ronin',
    email: 'ronin@kindrobots.org',
    name: 'Ronin Knight',
    Role: 'USER',
  },
  {
    username: 'fox',
    name: 'Fox Knight',
    email: 'fox@kindrobots.org',
    Role: 'USER',
  },
];
