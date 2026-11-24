import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  comicIntroFor,
  comicIntroArt,
  COMIC_INTRO_PROMPT,
  COMIC_INTRO_ART_SLOTS,
  type ComicIntroRole,
} from '../cometAcademy/comicIntroductions'

import { reviewedIdentityArtwork } from '../cometAcademy/artSlots'

const roles: ComicIntroRole[] = ['hero', 'villain', 'henchman', 'lieutenant']
const keys = new Set<string>()
for (const person of IDENTITY_ARCS) {
  for (const role of roles) {
    const intro = comicIntroFor(person.signature, role)
    assert.equal(intro.role, role)
    assert.ok(intro.name.length > 3)
    assert.ok(intro.caption.length > 20)
    assert.ok(intro.tagline.length > 12)
    assert.ok(
      !keys.has(intro.key),
      'duplicate shared introduction key: ' + intro.key,
    )
    keys.add(intro.key)
    if (role === 'hero' || role === 'villain')
      assert.equal(
        intro.artKey ? reviewedIdentityArtwork(intro.artKey) : null,
        comicIntroArt(intro),
        'intro metadata must identify the real safe painting or no painting',
      )
    else
      assert.equal(
        intro.artKey,
        null,
        'never invent unavailable henchman/lieutenant image',
      )
  }
}
assert.equal(IDENTITY_ARCS.length, 48)
assert.equal(
  keys.size,
  192,
  'all 192 comic-panel character and role combinations exist',
)
assert.equal(COMIC_INTRO_ART_SLOTS.length, 5)
assert.match(COMIC_INTRO_PROMPT.base, /no words, no lettering/)
assert.match(COMIC_INTRO_PROMPT.requirement, /OUT of the image/)

// Source-byte visual review, 2026-11-24 PT. A changed blob needs a new
// review; an unchanged pathname alone is not visual provenance.
const reviewedAccidentArt = {
  'accident-air': [
    '662cfdd7f933a0eb181686b8f66cb46267fc7bb5',
    'd5d8044dca3e051e1143cb69f09ce1f1fb38efcc',
    'ad06ce551a732646877c938e85b49a489e0629b2',
    'fab239c41d678eec0a094c98c294ac1b65cb563c',
    '1ae940cb305953e7b9948676b49f87dc26b19d21',
    'd749988e3770eebba533783b7ea817f27ca155f2',
  ],
  'accident-water': [
    '98a754edb968f1064fa74a69651be051c97d5dd5',
    'fbb88d60d0625956052cc276ce7a0fcd4266b65e',
    '19a7f03bf943930c2ecce795252a8493e3420d1e',
    '7fa22d314a5665c7d0dc53d620ed16ac493af7b0',
    'cba6f46287b8bf5c82378bde7acecea9b2a37dc3',
    'c7a105907aca9f94e0a393f93da1d6713446c0cc',
  ],
  'accident-discipline': [
    'b4060956966e71d30d2df4c3a9098e6223a0c05d',
    '7a76cc26291a4c67fe2a07ffede56262b6ec3d85',
    '959fd4a52e235f1136dc9ac95138310cead298b8',
    'd39a70d1732cd10d27b3496ef18868a80af55b61',
    'd3425b8a86bccfa61d27322f4209d66a49ae4204',
    'a71c5549b6d0ac28e21b6fddfe99dcfb441e9b79',
  ],
  'accident-genius': [
    'de970cdc1252d9ce90dc93e299c8f5c2868b1093',
    'd7c365cddcaa707a522a29fab7cbdd88c25127d6',
    '8771584a0f7bcee2f5507f3b301231651b80fab6',
    '4c056f8be5b0d58fd3e5e37522071c8e61893eb6',
    '4585fe531ef7f325e4d08f79e745001f69ec9fb4',
    '353b2a96130bc35a03d788ed61bc440192471245',
  ],
} as const
const reviewedVariants = [
  'student',
  'outcomes/hero',
  'outcomes/villain',
  'outcomes/student',
  'outcomes/betrayal',
  'outcomes/partner',
] as const
for (const [signature, hashes] of Object.entries(reviewedAccidentArt)) {
  for (const [index, variant] of reviewedVariants.entries()) {
    const key = `identities/${signature}/${variant}`
    const bytes = readFileSync(
      new URL(`../../public/comet-city-academy/${key}.webp`, import.meta.url),
    )
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', key)
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', key)
    const sha = createHash('sha1')
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest('hex')
    assert.equal(sha, hashes[index], key + ' requires fresh visual review')
    assert.ok(reviewedIdentityArtwork(key), key)
  }
}
assert.equal(
  comicIntroFor('accident-fire', 'hero').artKey,
  'identities/accident-fire/outcomes/hero',
)
assert.equal(
  comicIntroFor('tech-genius', 'villain').artKey,
  'identities/tech-genius/student',
)

const component = readFileSync(
  new URL('../../components/comic-character-reveal.vue', import.meta.url),
  'utf8',
)
const academy = readFileSync(
  new URL(
    '../../components/play/cometAcademy/AcademyOpening.vue',
    import.meta.url,
  ),
  'utf8',
)
const tactics = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
assert.match(component, /data-testid="comic-character-intro"/)
assert.match(component, /aria-modal="true"/)
assert.match(component, /comic-lettering/)
assert.match(component, /artFit\?: 'cover' \| 'contain'/)
assert.match(component, /artFit: 'cover'/)
assert.match(component, /comic-art-contained/)
assert.match(tactics, /:art-fit="activeComicFit"/)
assert.match(component, /prefers-reduced-motion: reduce/)
assert.match(component, /data-testid="comic-intro-continue"/)
assert.match(academy, /data-testid="academy-comic-intro-preview"/)
assert.match(academy, /seenComicIntro/)
assert.match(academy, /<ComicCharacterReveal/)
const promGame = readFileSync(
  new URL('../../pages/play/comet-city-academy.vue', import.meta.url),
  'utf8',
)
assert.match(promGame, /seenVillainComics/)
assert.match(promGame, /showVillainComic/)
assert.match(promGame, /<ComicCharacterReveal/)
assert.match(tactics, /data-testid="tactics-comic-intro-preview"/)
assert.match(tactics, /seenComics/)
assert.match(tactics, /<ComicCharacterReveal/)
assert.match(tactics, /unit.lieutenantName/)
assert.match(tactics, /'henchman'/)
assert.match(tactics, /'villain'/)
console.log(
  '192 shared comic intros, accessible overlay, image fallback, both game entrypoints: OK',
)
