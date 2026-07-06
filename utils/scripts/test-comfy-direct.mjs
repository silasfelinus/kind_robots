// /utils/scripts/test-comfy-direct.mjs
//
// Automated smoke test for ComfyUI art generation. Calls the two test
// endpoints in sequence: info (system_stats + queue) then a direct generate.
// No mana is charged and no checkpoint is needed (flux loads a GGUF unet).
//
// Env:
//   COMFY_TEST_AUTH_TOKEN   required — machine auth (user apiKey or admin token)
//   COMFY_TEST_SERVER_ID    optional — target a specific Comfy server by id;
//                           if unset, the server is resolved by capability
//   COMFY_TEST_API_BASE     optional — default https://kind-robots.vercel.app

const apiBase = (process.env.COMFY_TEST_API_BASE || 'https://kind-robots.vercel.app').replace(/\/+$/, '')
const authToken = process.env.COMFY_TEST_AUTH_TOKEN || ''
const serverIdRaw = process.env.COMFY_TEST_SERVER_ID

if (!authToken) {
  throw new Error('Missing COMFY_TEST_AUTH_TOKEN')
}

// Server id is optional: when unset, the API resolves a comfy server by
// capability. When set, it must be a positive integer (no invented defaults).
let serverId = null
if (serverIdRaw !== undefined && serverIdRaw !== '') {
  serverId = Number(serverIdRaw)
  if (!Number.isInteger(serverId) || serverId <= 0) {
    throw new Error(`COMFY_TEST_SERVER_ID must be a positive integer, got "${serverIdRaw}"`)
  }
}

const serverQuery = serverId ? `&serverId=${serverId}` : ''

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

const system = await request(`/api/comfy/test/info?target=system${serverQuery}`)
console.log('system ok', { serverId: system.serverId, serverName: system.serverName })

const queue = await request(`/api/comfy/test/info?target=queue${serverQuery}`)
console.log('queue ok', { serverId: queue.serverId, serverName: queue.serverName })

const generated = await request('/api/comfy/test/generate', {
  method: 'POST',
  body: JSON.stringify({
    ...(serverId ? { serverId } : {}),
    prompt: 'friendly robot painter in a bright futuristic studio, colorful polished concept art, crisp details, clean composition',
    width: 512,
    height: 512,
    steps: 8,
    cfg: 1,
    guidance: 4,
    timeoutMs: 180000,
  }),
})

const data = generated.data || {}
console.log('generate ok', {
  promptId: data.promptId,
  filename: data.filename,
  mimeType: data.mimeType,
  imageDataPrefix: data.imageData?.slice(0, 32),
})
