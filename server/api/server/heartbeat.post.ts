// /server/api/server/heartbeat.post.ts
//
// Relay-reported health/uptime heartbeat. The home relay agent can't be reached
// from the deployed backend (pull model), so it POSTs the up/down state of its
// local ComfyUI/A1111 engines here on each poll. We resolve the matching active
// Server row(s) by engine type (or an explicit serverId) and append a
// ServerHealthCheck history row so the ArtJob dashboard can chart uptime.
//
// Admin/server credentials only (same trust level as the queue claim/complete
// endpoints — the relay authenticates with the beta admin token or a server key).
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireMachineUser } from '../../utils/authGuard'
import { recordServerHealthCheck } from '../../utils/serverApi'
import type { ServerType } from '~/prisma/generated/prisma/client'

type HeartbeatBody = {
  serverId?: number | null
  engine?: string | null
  ok?: boolean | null
  latencyMs?: number | null
  note?: string | null
}

// Map a relay engine label to the Server.serverType it reports for.
function resolveServerType(engine: string): ServerType | null {
  const normalized = engine.trim().toUpperCase()

  if (normalized === 'COMFY' || normalized === 'COMFYUI') return 'COMFY'
  if (
    normalized === 'A1111' ||
    normalized === 'SD' ||
    normalized === 'SDWEBUI'
  ) {
    return 'A1111'
  }

  return null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to post server heartbeats.',
      })
    }

    const body = (await readBody(event)) as HeartbeatBody | null
    const ok = Boolean(body?.ok)
    const latencyMs =
      typeof body?.latencyMs === 'number' ? body.latencyMs : null
    const note =
      typeof body?.note === 'string' ? body.note.slice(0, 2000) : null

    // Resolve which Server rows this heartbeat covers: an explicit serverId, or
    // every active server of the reported engine type.
    let serverIds: number[] = []

    if (Number.isInteger(body?.serverId) && Number(body?.serverId) > 0) {
      serverIds = [Number(body?.serverId)]
    } else if (body?.engine) {
      const serverType = resolveServerType(String(body.engine))

      if (!serverType) {
        throw createError({
          statusCode: 400,
          message: `Unknown engine "${body.engine}". Use COMFY or A1111 (or pass serverId).`,
        })
      }

      const servers = await prisma.server.findMany({
        where: { serverType, isActive: true },
        select: { id: true },
      })
      serverIds = servers.map((s) => s.id)
    } else {
      throw createError({
        statusCode: 400,
        message: 'Provide "engine" (COMFY/A1111) or a "serverId".',
      })
    }

    if (!serverIds.length) {
      // No matching server row yet — nothing to record, but not an error: the
      // relay shouldn't crash just because a server hasn't been registered.
      return {
        success: true,
        message: 'No matching active server to record a heartbeat for.',
        data: { recorded: 0 },
        statusCode: 200,
      }
    }

    for (const serverId of serverIds) {
      await recordServerHealthCheck({
        serverId,
        ok,
        latencyMs,
        source: 'relay',
        note,
      })
    }

    return {
      success: true,
      message: `Heartbeat recorded for ${serverIds.length} server(s).`,
      data: { recorded: serverIds.length, serverIds, ok },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to record heartbeat.',
      statusCode,
    }
  }
})
