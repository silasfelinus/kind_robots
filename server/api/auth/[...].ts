// file: ~/server/api/auth/[...].ts
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare as bcryptCompare } from 'bcrypt'
import { PrismaClient } from '@prisma/client'

import { NuxtAuthHandler } from '#auth'

const config = useRuntimeConfig()
const prisma = new PrismaClient()
export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({ session }) {
      return session
    }
  },
  providers: [
    // @ts-ignore Import is exported on .default during SSR, so we need to call it this way. May be fixed via Vite at some point
    GoogleProvider.default({
      clientId: config.GOOGLE_ID,
      clientSecret: config.GOOGLE_SECRET
    }),
    // @ts-ignore Import is exported on .default during SSR, so we need to call it this way. May be fixed via Vite at some point
    GithubProvider.default({
      clientId: config.GITHUB_ID,
      clientSecret: config.GITHUB_SECRET
    }),
    // @ts-ignore Import is exported on .default during SSR, so we need to call it this way. May be fixed via Vite at some point
    CredentialsProvider.default({
      name: 'Kind Robots',
      credentials: {
        username: { label: 'Kind Login', type: 'text', placeholder: '(hint: kindrobots)' },
        password: { label: 'Kind Password', type: 'password', placeholder: '(hint: kindpassword)' }
      },
      async authorize(credentials: any) {
        // Fetch the user from the Prisma client
        const user = await prisma.user.findUnique({ where: { username: credentials.username } })

        if (!user) {
          // No user found with the given username
          return null
        }

        // Use bcrypt to compare the supplied password to the hashed password stored in the database
        const isPasswordCorrect = await bcryptCompare(credentials.password, user.password)

        if (isPasswordCorrect) {
          const { password, ...userWithoutPassword } = user
          return userWithoutPassword
        } else {
          return null
        }
      }
    })
  ]
})
