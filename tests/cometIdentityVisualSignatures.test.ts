import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { identityFor } from '../utils/cometAcademy/identityArcs'
import {
  IDENTITY_VISUAL_SIGNATURES,
  visualSignatureFor,
} from '../utils/cometAcademy/identityVisualSignatures'
import type { SignaturePowerId } from '../utils/cometAcademy/specialPowers'

describe('canonical visual signatures', () => {
  it('authors one physical model for both fire and genius in every origin', () => {
    const origins = ['accident', 'mutant', 'tech', 'magic', 'alien', 'psychic']
    for (const origin of origins) {
      for (const affinity of ['fire', 'genius']) {
        const signature = `${origin}-${affinity}` as SignaturePowerId
        const visual = visualSignatureFor(signature)
        assert.ok(visual)
        assert.ok(visual.silhouette.length > 15)
        assert.ok(visual.anatomy.length > 15)
        assert.ok(visual.portraitDirection.length > 15)
        const person = identityFor(signature)
        assert.equal(person.student.alias, person.hero.alias)
        assert.equal(person.hero.alias, person.villain.alias)
      }
    }
    assert.equal(Object.keys(IDENTITY_VISUAL_SIGNATURES).length, 12)
  })

  it('does not pretend the remaining identities have delivered visual contracts', () => {
    assert.equal(visualSignatureFor('accident-air'), null)
  })
})
