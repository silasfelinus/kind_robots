import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { evaluateRivalry } from '../../server/utils/aquariumRivalry'

describe('Cthulhuquarium rivalry', () => {
  it('applies predator/prey and school/anchor emergent rules', () => {
    const result = evaluateRivalry([
      { id: 1, slug: 'hunter', dietRole: 'predator', schoolRole: 'school' },
      { id: 2, slug: 'grazer', dietRole: 'prey', schoolRole: 'anchor' },
    ])
    assert.equal(result.active, true)
    assert.equal(result.pairs.length, 1)
    assert.equal(result.multiplierByFishId.get(1), 0.7)
    assert.deepEqual(result.pairs[0]?.reasons, ['predator-prey', 'school-anchor'])
  })

  it('honors authored rivals and same-species territorial pressure', () => {
    const authored = evaluateRivalry([
      { id: 1, slug: 'a', rivals: ['b'] },
      { id: 2, slug: 'b' },
    ])
    assert.equal(authored.multiplierByFishId.get(1), 0.6)

    const territorial = evaluateRivalry([
      { id: 3, slug: 'rustfish' },
      { id: 4, slug: 'rustfish' },
    ])
    assert.equal(territorial.multiplierByFishId.get(3), 0.85)
    assert.deepEqual(territorial.pairs[0]?.reasons, ['same-species'])
  })

  it('uses the strongest rule once per pair rather than multiplying penalties', () => {
    const result = evaluateRivalry([
      { id: 1, slug: 'a', dietRole: 'predator', rivals: ['b'] },
      { id: 2, slug: 'b', dietRole: 'prey' },
    ])
    assert.equal(result.multiplierByFishId.get(1), 0.6)
    assert.equal(result.pairs[0]?.multiplierEach, 0.6)
  })

  it('peace ward suppresses every rivalry source', () => {
    const result = evaluateRivalry(
      [
        { id: 1, slug: 'a', dietRole: 'predator', rivals: ['b'] },
        { id: 2, slug: 'b', dietRole: 'prey' },
      ],
      true,
    )
    assert.equal(result.active, false)
    assert.equal(result.pairs.length, 0)
    assert.equal(result.multiplierByFishId.get(1), 1)
  })

  it('keeps unrelated fish at full production', () => {
    const result = evaluateRivalry([
      { id: 1, slug: 'a', dietRole: 'neutral', schoolRole: 'solitary' },
      { id: 2, slug: 'b', dietRole: 'neutral', schoolRole: 'solitary' },
    ])
    assert.equal(result.active, false)
    assert.equal(result.multiplierByFishId.get(1), 1)
    assert.equal(result.multiplierByFishId.get(2), 1)
  })
})
