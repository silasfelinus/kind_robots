import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')

  if (!source.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(path, source.replace(target, replacement), 'utf8')
}

replaceExact(
  'stores/checkpointStore.ts',
  `function isSuccessNoise(message: unknown): boolean {
  const cleaned = cleanName(message).toLowerCase()

  return (
    !cleaned ||
    cleaned === 'request completed successfully' ||
    cleaned === 'ok' ||
    cleaned === 'success'
  )
}

`,
  ``,
  'dead model-switch message helper',
)

replaceExact(
  'stores/checkpointStore.ts',
  `  async function setCurrentModelInApi(
    name: unknown,
  ): Promise<ApiResponse<unknown>> {
    const checkpointName = cleanName(name)

    if (!checkpointName) {
      const message = 'Cannot set model without a checkpoint name.'

      errorStore.setError(ErrorType.GENERAL_ERROR, message)

      return {
        success: false,
        message,
      }
    }

    modelUpdating.value = true

    try {
      const server = getActiveServer()
      const body = server?.id
        ? { checkpoint: checkpointName, serverId: server.id }
        : { checkpoint: checkpointName }

      const res = await performFetch('/api/art/sd/setModel', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.success) {
        currentApiModel.value = checkpointName
        selectCheckpointByName(checkpointName)

        setModelStatusReport(
          createModelStatusReport({
            server,
            selectedCheckpoint: checkpointName,
            activeModel: checkpointName,
            source: 'options',
            raw: res.data || res,
          }),
        )
      } else {
        const message = isSuccessNoise(res.message)
          ? 'Failed to set current model.'
          : cleanName(res.message)

        errorStore.setError(ErrorType.GENERAL_ERROR, message)
      }

      return res
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to set current model.')

      errorStore.setError(ErrorType.NETWORK_ERROR, message)

      return {
        success: false,
        message,
      }
    } finally {
      modelUpdating.value = false
    }
  }

`,
  ``,
  'dead setCurrentModelInApi action',
)

replaceExact(
  'stores/checkpointStore.ts',
  `    setCurrentModelInApi,
`,
  ``,
  'dead setCurrentModelInApi export',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; the bot seed command is admin-only and offers a no-write dry run.`,
  `Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; the unused unauthenticated SD model-switch route and its dead Pinia action were removed.`,
  'security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `| \`server/api/art/sd/setModel.post.ts:17\`               | unauth POST to live SD server (GPU model-switch/DoS)                                     |
`,
  ``,
  'retired SD model-switch exposure row',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `- **Envelope drift:** \`art/sd/setModel.post.ts\` returns \`{success,message,model}\` (no data); \`relations/*\` use \`setResponseStatus\` and omit \`statusCode\`.`,
  `- **Envelope drift:** \`relations/*\` use \`setResponseStatus\` and omit \`statusCode\`.`,
  'retired SD model-switch envelope note',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| Bot seed command | Public POST could trigger bulk seed-data updates with no authentication or safe inspection mode | Command requires an admin, accepts only an optional dry-run flag, and exposes a no-write validation path for operational tests |`,
  `| Bot seed command | Public POST could trigger bulk seed-data updates with no authentication or safe inspection mode | Command requires an admin, accepts only an optional dry-run flag, and exposes a no-write validation path for operational tests |
| SD model switch | Unauthenticated route hard-coded a live GPU server, disagreed with the store request shape, and had no repository caller | Removed the dead route, unused Pinia action, and setter-only helper instead of preserving an unsafe global server mutation |`,
  'SD model-switch audit row',
)
