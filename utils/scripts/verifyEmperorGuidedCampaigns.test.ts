import assert from 'node:assert/strict'
import { POLICIES, playCampaign } from '../emperorOfDust/fortress/balance'

const policy = POLICIES.find((entry) => entry.id === 'greedy')!
const result = playCampaign(policy, 17)
assert.ok(result.ending, 'the campaign reaches a real ending')
