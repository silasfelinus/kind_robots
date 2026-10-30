import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  comicIntroFor,
  COMIC_INTRO_PROMPT,
  COMIC_INTRO_ART_SLOTS,
  type ComicIntroRole,
} from '../cometAcademy/comicIntroductions'

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
      assert.ok(
        intro.artKey?.length,
        'reuse approved canonical portrait art before new render',
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
assert.match(component, /prefers-reduced-motion: reduce/)
assert.match(component, /data-testid="comic-intro-continue"/)
assert.match(academy, /data-testid="academy-comic-intro-preview"/)
assert.match(academy, /seenComicIntro/)
assert.match(academy, /<ComicCharacterReveal/)
assert.match(tactics, /data-testid="tactics-comic-intro-preview"/)
assert.match(tactics, /seenComics/)
assert.match(tactics, /<ComicCharacterReveal/)
assert.match(tactics, /'henchman' : 'villain'/)
console.log(
  '192 shared comic intros, accessible overlay, image fallback, both game entrypoints: OK',
)
