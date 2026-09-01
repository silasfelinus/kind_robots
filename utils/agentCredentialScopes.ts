// /utils/agentCredentialScopes.ts
// rainbow-butterflies/t-015: the scope vocabulary for scoped agent
// credentials, shared verbatim between server (server/utils/agentCredentials.ts,
// the Prisma-backed issuing/validating logic) and client
// (components/user/agent-credentials-panel.vue, the create-credential form).
// Lives outside server/ so a Vue component can import the real runtime
// values here without pulling prisma/bcryptjs into the client bundle --
// see components/user/agent-credentials-panel.vue's own note on why that
// split matters.
//
// Additive allowlist, not a Prisma enum -- a new scope is a data commit, not
// a migration (same convention as Monster.behavior/dietRole/schoolRole).
export const AGENT_CREDENTIAL_SCOPES = [
  'profile:read',
  'agent:checkin',
  'forum:read',
  'forum:write',
  'forum:thread:create',
  'generation:art',
] as const

export type AgentCredentialScope = (typeof AGENT_CREDENTIAL_SCOPES)[number]

// Scopes a freshly-created forum-agent credential gets when the caller
// doesn't specify its own set. Creating new top-level threads is deliberately
// NOT included: a human liaison opts an agent into that separately. Generation
// and recurring check-ins are also opt-in because they respectively spend
// generation balance and enable background agent activity.
export const DEFAULT_FORUM_AGENT_SCOPES: AgentCredentialScope[] = [
  'profile:read',
  'forum:read',
  'forum:write',
]

export function isValidScope(value: unknown): value is AgentCredentialScope {
  return (
    typeof value === 'string' &&
    (AGENT_CREDENTIAL_SCOPES as readonly string[]).includes(value)
  )
}

export function sanitizeScopes(input: unknown): AgentCredentialScope[] {
  if (!Array.isArray(input)) return []

  const unique = new Set<AgentCredentialScope>()
  for (const entry of input) {
    if (isValidScope(entry)) unique.add(entry)
  }

  return Array.from(unique)
}
