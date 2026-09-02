// /server/utils/githubFileContents.ts
//
// Safe reads of a single file through the GitHub REST API.
//
// The Contents API only inlines a file body up to 1 MB. From 1 MB to 100 MB it
// still answers 200 with the real `sha` and `size`, but `content` is an empty
// string and `encoding` is "none". Code that decodes `content` unconditionally
// therefore sees a perfectly valid-looking empty file, and any read-modify-write
// built on it rewrites the whole path from nothing while carrying a `sha` GitHub
// accepts.
//
// That is not hypothetical. On 2026-09-02 conductor's projects/art-prompts.yaml
// crossed 1 MB (1,424,189 bytes). The next missing-image request read it as "",
// found no duplicate to skip, and committed a two-entry file over it
// (conductor 0e671cd, -11,014 lines): 577 Mandarin request rows and three
// in-flight missing-image requests gone in one silent write.
//
// So: fall back to the Git Blobs API, which carries base64 up to 100 MB, and
// refuse to hand back an empty body for a file GitHub says is not empty. A read
// that cannot be trusted must fail loudly rather than become an empty string
// upstream of a write.
//
// Dependency-free on purpose (global fetch, plain Error, no Nuxt auto-imports)
// so utils/scripts/verifyGithubFileContents.ts can exercise it under bare tsx.
import { Buffer } from 'node:buffer'

const GITHUB_API = 'https://api.github.com'

export type GithubContentsPayload = {
  content?: string | null
  encoding?: string | null
  sha?: string | null
  size?: number | null
}

export type GithubFileRead = {
  sha: string
  content: string
  size: number
}

export type GithubFetch = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

export function githubJsonHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export function decodeBase64Content(content: string): string {
  return Buffer.from(content.replace(/\s/g, ''), 'base64').toString('utf-8')
}

/**
 * True when the payload is one of the oversized responses whose body GitHub
 * withholds — either an explicit non-base64 encoding, or an empty content
 * string for a file the same response reports as non-empty.
 */
export function payloadNeedsBlobFallback(
  payload: GithubContentsPayload,
): boolean {
  const encoding = String(payload.encoding || '').toLowerCase()
  if (encoding && encoding !== 'base64') return true
  const size = Number(payload.size || 0)
  return !String(payload.content || '').trim() && size > 0
}

/**
 * Read one file and return its decoded body, its blob sha, and the size GitHub
 * reported. Returns null when the path does not exist on the ref.
 *
 * Throws when GitHub reports a non-empty file whose body could not be recovered
 * from either endpoint — never returns "" for a file that is not empty.
 */
export async function readGithubFile(
  repo: string,
  path: string,
  token: string,
  ref: string,
  fetchImpl: GithubFetch = fetch as unknown as GithubFetch,
): Promise<GithubFileRead | null> {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const contentsUrl = `${GITHUB_API}/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`
  const res = await fetchImpl(contentsUrl, { headers: githubJsonHeaders(token) })

  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} while fetching ${repo}/${path}`)
  }

  const payload = (await res.json()) as GithubContentsPayload
  const sha = String(payload.sha || '')
  const size = Number(payload.size || 0)

  if (!sha) {
    throw new Error(`GitHub returned no blob sha for ${repo}/${path}`)
  }

  let content = payloadNeedsBlobFallback(payload)
    ? await readGithubBlob(repo, sha, token, fetchImpl)
    : decodeBase64Content(String(payload.content || ''))

  if (!content && size > 0) {
    throw new Error(
      `GitHub returned an empty body for ${repo}/${path} (${size} bytes, blob ${sha}). ` +
        'Refusing to treat an unreadable file as empty.',
    )
  }

  return { sha, content, size }
}

/**
 * Existence probe that never downloads a body.
 *
 * readGithubFile has to recover an oversized body from the Blobs API, which is
 * the right cost when the caller is about to rewrite the file and the wrong one
 * when it only wants to know whether a path is there.
 */
export async function githubPathExists(
  repo: string,
  path: string,
  token: string,
  ref: string,
  fetchImpl: GithubFetch = fetch as unknown as GithubFetch,
): Promise<boolean> {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const url = `${GITHUB_API}/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`
  const res = await fetchImpl(url, { headers: githubJsonHeaders(token) })

  if (res.status === 404) return false
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} while checking ${repo}/${path}`)
  }
  return true
}

async function readGithubBlob(
  repo: string,
  sha: string,
  token: string,
  fetchImpl: GithubFetch,
): Promise<string> {
  const url = `${GITHUB_API}/repos/${repo}/git/blobs/${encodeURIComponent(sha)}`
  const res = await fetchImpl(url, { headers: githubJsonHeaders(token) })

  if (!res.ok) {
    throw new Error(`GitHub ${res.status} while fetching blob ${repo}@${sha}`)
  }

  const payload = (await res.json()) as GithubContentsPayload
  const encoding = String(payload.encoding || '').toLowerCase()

  if (encoding && encoding !== 'base64') {
    throw new Error(
      `GitHub blob ${repo}@${sha} came back as "${encoding}" rather than base64.`,
    )
  }

  return decodeBase64Content(String(payload.content || ''))
}
