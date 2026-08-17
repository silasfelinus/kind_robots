// /server/utils/networkSafety.ts
//
// text-generation/t-005 -- outbound-URL safety checks for every route that
// dials a stored `Server.baseUrl` (or a cloud-provider endpoint derived from
// one). A `Server` row can be created by ANY authenticated user (POST
// /api/server only requires `requireAuthUser`, not an admin/owner check --
// see server/api/server/index.post.ts's `serverCreateFields`/
// `buildServerCreateData` -- `baseUrl` itself is not privilege-gated), so a
// stored `baseUrl` is attacker-reachable input, not merely admin input. This
// module is defense-in-depth on top of the existing visibility/ownership
// gate `resolveServer` already enforces (see serverResolver.ts) -- it closes
// the network-layer gap BRIEF.md documents: "any stored Server row with a
// baseUrl is dialed as-is; there is no explicit block on cloud-metadata,
// link-local, or otherwise unsafe destinations."
//
// Deliberately narrower than "block every RFC1918-private address": this
// app's own self-hosted-server story explicitly includes home-LAN
// (`192.168.x.x`/`10.x.x.x`) and Tailscale (`100.64.0.0/10` CGNAT range,
// `ServerAccessMode.TAILSCALE` in the Prisma schema) targets as first-class,
// intended destinations -- blocking those ranges outright would break the
// exact feature this project exists to harden. Only metadata/link-local/
// unspecified targets (plus loopback, gated by `allowLoopback` below) are
// blocked; see BRIEF.md's "Private-server SSRF boundary (t-005)" section
// for the exact scope this implements.
//
// Loopback (127.0.0.0/8, ::1, literal "localhost") is a narrower case: it's
// blocked by default (a malicious ordinary user pointing a `Server.baseUrl`
// at 127.0.0.1 to reach this process's own internal-only services is a
// classic SSRF pivot), but `nuxt.config.ts`'s own `ollamaBaseUrl` default is
// `http://localhost:11434` -- an operator-set env var, not user input, and
// the documented zero-config self-hosted-Ollama experience. Every check
// below takes an `allowLoopback` flag (default `false`) so call sites can
// distinguish "validating a DB-stored, user-settable baseUrl" (leave it
// false) from "validating an operator-configured fallback endpoint" (pass
// `true`) without weakening the DB-input path.
import dns from 'node:dns'
import net from 'node:net'

export type UrlValidationResult =
  { ok: true; url: URL } | { ok: false; reason: string }

export type HostValidationResult =
  { ok: true; addresses: string[] } | { ok: false; reason: string }

export type SafetyCheckOptions = {
  /** Allow loopback (127.0.0.0/8, ::1, "localhost") through. Never allows
   * cloud-metadata/link-local/unspecified addresses regardless of this
   * flag -- those have no legitimate use as any kind of configured
   * destination. */
  allowLoopback?: boolean
}

export const ALLOWED_URL_SCHEMES = new Set(['http:', 'https:'])

export const DEFAULT_OUTBOUND_CONNECT_TIMEOUT_MS = 15_000
export const DEFAULT_IDLE_TIMEOUT_MS = 30_000
export const DEFAULT_MAX_RESPONSE_BYTES = 25 * 1024 * 1024 // 25MB
export const DEFAULT_MAX_REDIRECTS = 3

/** Hostname literals with no legitimate use as a configured server target,
 * regardless of what they resolve to (or even if they don't resolve at
 * all -- some of these are conventionally routed by a local resolver/hosts
 * file rather than real DNS, e.g. cloud metadata hostnames). */
const BLOCKED_METADATA_HOSTNAME_LITERALS = new Set([
  'metadata',
  'metadata.google.internal',
])

const LOOPBACK_HOSTNAME_LITERALS = new Set(['localhost'])

export function isBlockedHostnameLiteral(
  hostname: string,
  options: SafetyCheckOptions = {},
): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')

  if (BLOCKED_METADATA_HOSTNAME_LITERALS.has(host)) return true

  if (options.allowLoopback) return false

  if (LOOPBACK_HOSTNAME_LITERALS.has(host)) return true
  if (host.endsWith('.localhost')) return true

  return false
}

/** Single-address, non-link-local metadata endpoints that don't fall inside
 * the 169.254.0.0/16 or fe80::/10 blocks below but are still pure
 * cloud-metadata targets: Alibaba Cloud (100.100.100.200) and AWS's IPv6
 * metadata address (fd00:ec2::254). Never affected by `allowLoopback`. */
const BLOCKED_METADATA_SINGLE_IPS = new Set([
  '100.100.100.200',
  'fd00:ec2::254',
])

export function isPrivateOrReservedIpv4(
  ip: string,
  options: SafetyCheckOptions = {},
): boolean {
  const parts = ip.split('.').map((part) => Number(part))

  if (
    parts.length !== 4 ||
    parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)
  ) {
    return false
  }

  const [a, b] = parts

  if (a === 0) return true // "this network" / unspecified, 0.0.0.0/8
  if (a === 169 && b === 254) return true // link-local incl. cloud metadata, 169.254.0.0/16
  if (a === 127) return !options.allowLoopback // loopback, 127.0.0.0/8

  return false
}

type Ipv6Groups = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

/** Expands a (possibly `::`-compressed, possibly IPv4-mapped) IPv6 address
 * literal into its 8 canonical 16-bit groups. Returns null if `ip` isn't a
 * parseable IPv6 literal. */
function expandIpv6Groups(ip: string): Ipv6Groups | null {
  const address = ip.split('%')[0] ?? ip // strip zone id, e.g. fe80::1%eth0
  if (!address.includes(':')) return null

  let head = address
  let v4Octets: [number, number, number, number] | null = null

  const lastColon = address.lastIndexOf(':')
  const tail = address.slice(lastColon + 1)

  if (tail.includes('.')) {
    const octets = tail.split('.').map((o) => Number(o))
    if (
      octets.length !== 4 ||
      octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)
    ) {
      return null
    }
    v4Octets = octets as [number, number, number, number]
    head = address.slice(0, lastColon + 1)
  }

  const halves = head.split('::')
  if (halves.length > 2) return null

  const left = halves[0] ? halves[0].split(':').filter(Boolean) : []
  const right =
    halves.length === 2 && halves[1] ? halves[1].split(':').filter(Boolean) : []

  let groupStrings: string[]

  if (halves.length === 2) {
    const v4GroupCount = v4Octets ? 2 : 0
    const missing = 8 - left.length - right.length - v4GroupCount
    if (missing < 0) return null
    groupStrings = [...left, ...Array(missing).fill('0'), ...right]
  } else {
    // Full (non-"::"-compressed) form. `head` already excludes the trailing
    // dotted-quad (sliced off above) and its trailing colon is dropped by
    // `filter(Boolean)`, so this is every remaining hex group as-is.
    groupStrings = head.split(':').filter(Boolean)
  }

  const groups = groupStrings.map((g) => parseInt(g, 16))

  if (v4Octets) {
    groups.push((v4Octets[0] << 8) | v4Octets[1])
    groups.push((v4Octets[2] << 8) | v4Octets[3])
  }

  if (
    groups.length !== 8 ||
    groups.some((g) => !Number.isInteger(g) || g < 0 || g > 0xffff)
  ) {
    return null
  }

  return groups as unknown as Ipv6Groups
}

export function isPrivateOrReservedIpv6(
  ip: string,
  options: SafetyCheckOptions = {},
): boolean {
  const groups = expandIpv6Groups(ip)
  if (!groups) return false

  const allZero = groups.every((g) => g === 0)
  if (allZero) return true // :: unspecified

  const isLoopback = groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1
  if (isLoopback) return !options.allowLoopback // ::1

  const [g0] = groups

  if ((g0 & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
  if ((g0 & 0xff00) === 0xff00) return true // ff00::/8 multicast

  // ::ffff:0:0/96 IPv4-mapped -- validate the embedded IPv4 address instead.
  const isV4Mapped =
    groups[0] === 0 &&
    groups[1] === 0 &&
    groups[2] === 0 &&
    groups[3] === 0 &&
    groups[4] === 0 &&
    groups[5] === 0xffff

  if (isV4Mapped) {
    const embedded = [
      (groups[6] >> 8) & 0xff,
      groups[6] & 0xff,
      (groups[7] >> 8) & 0xff,
      groups[7] & 0xff,
    ].join('.')

    return isPrivateOrReservedIpv4(embedded, options)
  }

  return false
}

export function isBlockedIpLiteral(
  ip: string,
  options: SafetyCheckOptions = {},
): boolean {
  if (BLOCKED_METADATA_SINGLE_IPS.has(ip.toLowerCase())) return true

  const family = net.isIP(ip)

  if (family === 4) return isPrivateOrReservedIpv4(ip, options)
  if (family === 6) return isPrivateOrReservedIpv6(ip, options)

  return false
}

/** Pure, synchronous validation: scheme allowlist, blocked hostname
 * literals, and (if the hostname is itself an IP literal) the blocked-range
 * check. Does not touch the network -- a hostname that needs DNS resolution
 * to know if it's safe passes this stage and must go through
 * `resolveAndValidateHost` before being dialed. */
export function validateUrlSyntax(
  rawUrl: string,
  options: SafetyCheckOptions = {},
): UrlValidationResult {
  let url: URL

  try {
    url = new URL(rawUrl)
  } catch {
    return { ok: false, reason: `"${rawUrl}" is not a valid URL.` }
  }

  if (!ALLOWED_URL_SCHEMES.has(url.protocol)) {
    return {
      ok: false,
      reason: `URL scheme "${url.protocol}" is not allowed (only http/https).`,
    }
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets

  if (!hostname) {
    return { ok: false, reason: 'URL has no hostname.' }
  }

  if (isBlockedHostnameLiteral(hostname, options)) {
    return {
      ok: false,
      reason: `Hostname "${hostname}" is not an allowed destination.`,
    }
  }

  if (net.isIP(hostname) && isBlockedIpLiteral(hostname, options)) {
    return {
      ok: false,
      reason: `"${hostname}" resolves to a blocked (metadata/link-local) address.`,
    }
  }

  return { ok: true, url }
}

/** Resolves a non-literal-IP hostname and validates every returned address.
 * Closes the "hostname under attacker DNS control resolves to a metadata IP"
 * gap that `validateUrlSyntax` alone can't catch. Real DNS I/O -- not called
 * from the DB-free contract test. */
export async function resolveAndValidateHost(
  hostname: string,
  options: SafetyCheckOptions = {},
): Promise<HostValidationResult> {
  if (net.isIP(hostname)) {
    return isBlockedIpLiteral(hostname, options)
      ? {
          ok: false,
          reason: `"${hostname}" resolves to a blocked (metadata/link-local) address.`,
        }
      : { ok: true, addresses: [hostname] }
  }

  let records: dns.LookupAddress[]

  try {
    records = await dns.promises.lookup(hostname, { all: true, verbatim: true })
  } catch (error) {
    return {
      ok: false,
      reason: `Could not resolve hostname "${hostname}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    }
  }

  if (records.length === 0) {
    return {
      ok: false,
      reason: `Hostname "${hostname}" did not resolve to any address.`,
    }
  }

  const blocked = records.find((record) =>
    isBlockedIpLiteral(record.address, options),
  )

  if (blocked) {
    return {
      ok: false,
      reason: `Hostname "${hostname}" resolves to a blocked address (${blocked.address}).`,
    }
  }

  return { ok: true, addresses: records.map((r) => r.address) }
}

/** Full validation of an outbound URL: syntax/scheme/hostname-literal
 * checks, then (for a non-IP-literal hostname) DNS resolution against the
 * same blocked ranges. This is the single function every fetch call site in
 * the text-generation path should validate through before dialing. */
export async function validateOutboundUrl(
  rawUrl: string,
  options: SafetyCheckOptions = {},
): Promise<UrlValidationResult> {
  const syntaxResult = validateUrlSyntax(rawUrl, options)
  if (!syntaxResult.ok) return syntaxResult

  const hostname = syntaxResult.url.hostname.replace(/^\[|\]$/g, '')

  if (net.isIP(hostname)) {
    return syntaxResult // already fully validated by validateUrlSyntax
  }

  const hostResult = await resolveAndValidateHost(hostname, options)

  if (!hostResult.ok) {
    return { ok: false, reason: hostResult.reason }
  }

  return syntaxResult
}

/** Resolves a `Location` header against the URL that produced it. Returns
 * null if the header is missing or unparseable (caller treats that as a
 * hard failure, not "no redirect"). */
export function resolveRedirectLocation(
  from: URL,
  location: string | null,
): URL | null {
  if (!location) return null

  try {
    return new URL(location, from)
  } catch {
    return null
  }
}
