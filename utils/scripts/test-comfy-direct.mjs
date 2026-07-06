// /utils/scripts/test-comfy-direct.mjs

const apiBase = (process.env.COMFY_TEST_API_BASE || 'https://kind-robots.vercel.app').replace(/\/+$/, '')
const authToken = process.env.COMFY_TEST_AUTH_TOKEN || ''
const serverId = Number(process.env.COMFY_TEST_SERVER_ID || 25)
const checkpointId = Number(process.env.COMFY_TEST_CHECKPOINT_ID || 0)

if (!authToken) {
  throw new Error('Missing COMFY_TEST_AUTH_TOKEN')
}

if (!serverId || !checkpointId) {
  throw new Error('Missing COMFY_TEST_SERVER_ID or COMFY_TEST_CHECKPOINT_ID')
}

const headers = {
  Authorization: `Bearer ${authToken}`,
}

const jsonHeaders = {
  ...headers,
  'Content-Type': 'application/json',
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(options.body ? jsonHeaders : headers),
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => null)

  if (!response.ok || body?.success === false) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(body)}`)
  }

  return body
}

const system = await request(`/api/comfy/test/info?serverId=${serverId}&target=system`)
console.log('system ok', { serverId: system.serverId, serverName: system.serverName })

const queue = await request(`/api/comfy/test/info?serverId=${serverId}&checkpointId=${checkpointId}&target=queue`)
console.log('queue ok', { checkpointId: queue.checkpointId })

const generated = await request('/api/comfy/test/generate', {
  method: 'POST',
  body: JSON.stringify({
    serverId,
    checkpointId,
    prompt: 'friendly robot painter in a bright futuristic studio, colorful polished concept art, crisp details, clean composition',
    width: 512,
    height: 512,
    steps: 8,
    cfg: 1,
    guidance: 4,
    timeoutMs: 180000,
    variant: 'schnell',
  }),
})

console.log('generate ok', {
  promptId: generated.promptId,
  filename: generated.filename,
  mimeType: generated.mimeType,
  imageDataPrefix: generated.imageData?.slice(0, 32),
})
