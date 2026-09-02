import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const runtime = readFileSync('server/utils/agentProfileRuntime.ts', 'utf8')
const context = readFileSync('server/utils/agentWorkingContext.ts', 'utf8')
const mcp = readFileSync('server/api/v1/mcp.post.ts', 'utf8')

// The durable heartbeat remains the source action. Working context is an
// additive read after the transaction, and a context read failure must not
// make a successfully recorded check-in look failed to a scheduler.
assert.match(runtime, /buildAgentWorkingContext/)
assert.match(runtime, /effectiveShowMature\(auth\.user\)/)
assert.match(runtime, /const workingContext = await safeAgentWorkingContext\(input\.context\)/)
assert.match(runtime, /context: workingContext/)
assert.match(runtime, /Working context is temporarily unavailable; the check-in was still recorded/)
assert.match(runtime, /capabilities: agentCapabilityFlags\(scopes\)/)

// Wake-up context is bounded and AgentProfile-scoped.
assert.match(context, /MAX_CONTEXT_TEXT = 1200/)
assert.match(context, /RECENT_CHECKIN_LIMIT = 5/)
assert.match(context, /OPEN_ATTENTION_LIMIT = 10/)
assert.match(context, /RECENT_FORUM_POST_LIMIT = 5/)
assert.match(context, /DIRECT_REPLY_LIMIT = 10/)
assert.match(context, /agentProfileId: input\.agentProfileId/)
assert.match(context, /userId: input\.userId/)
assert.match(context, /request\.status === 'OPEN'/)
assert.match(context, /getAgentForumChannels\(input\.agentProfileId\)/)

// Forum conversation context is capability-gated and only exposes public,
// active posts. Mature content follows the operator's effective mature setting.
assert.match(context, /capabilities\.forumRead/)
assert.match(context, /author\.agentProfileId = \$\{input\.agentProfileId\}/)
assert.match(context, /parentAuthor\.agentProfileId = \$\{input\.agentProfileId\}/)
assert.match(context, /replyAuthor\.agentProfileId <> \$\{input\.agentProfileId\}/)
assert.match(context, /c\.isPublic = true/)
assert.match(context, /c\.isActive = true/)
assert.match(context, /reply\.isPublic = true/)
assert.match(context, /reply\.isActive = true/)
assert.match(context, /isMature = false/)

// There is deliberately no inferred bridge from an AgentProfile into private
// Conductor roadmaps. Until a canonical assignment relationship exists, the
// check-in says that coordination assignments are unavailable instead of
// leaking a global projection to any scoped agent credential.
assert.match(context, /projectAssignmentsAvailable: false/)
assert.doesNotMatch(context, /readConductorProjection|buildConductorData|ConductorProjection/)

// Both REST and the existing narrow MCP check-in keep using recordAgentCheckIn,
// so this richer context reaches providers without adding a generic third tool.
assert.match(mcp, /const TOOL_CHECK_IN = 'rainbow_check_in'/)
assert.match(mcp, /recordAgentCheckIn\(\{ context, \.\.\.input \}\)/)
assert.doesNotMatch(mcp, /rainbow_working_context|generic.*proxy/i)

console.log('Agent working-context contract OK')
