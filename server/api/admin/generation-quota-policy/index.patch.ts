import { defineEventHandler, readBody, setHeader } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import {
  assertValidGenerationQuotaPolicy,
  getGenerationQuotaPolicy,
} from '@/server/utils/freeGenerationQuota'
import prisma from '@/server/utils/prisma'

type PolicyBody = {
  enabled?: unknown
  freeKrea2PerUser?: unknown
  dailyCapacity?: unknown
  internalReserve?: unknown
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  await requireAdminApiUser(event)
  const current = await getGenerationQuotaPolicy()
  const body = (await readBody<PolicyBody>(event)) ?? {}
  const next = assertValidGenerationQuotaPolicy({
    enabled: body.enabled ?? current.enabled,
    freeKrea2PerUser: body.freeKrea2PerUser ?? current.freeKrea2PerUser,
    dailyCapacity: body.dailyCapacity ?? current.dailyCapacity,
    internalReserve: body.internalReserve ?? current.internalReserve,
  })

  await prisma.$executeRaw(Prisma.sql`
    UPDATE GenerationQuotaPolicy
    SET
      enabled = ${next.enabled},
      freeKrea2PerUser = ${next.freeKrea2PerUser},
      dailyCapacity = ${next.dailyCapacity},
      internalReserve = ${next.internalReserve},
      updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = 1
  `)
  return { success: true, policy: await getGenerationQuotaPolicy() }
})
