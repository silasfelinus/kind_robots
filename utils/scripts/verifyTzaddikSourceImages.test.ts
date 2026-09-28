import assert from 'node:assert/strict'
import { commonsFileNameFromUrl } from '../../server/utils/tzaddikSourceRefresh'
import { resolveTzaddikImageSrc } from '../tzaddikImage'

assert.equal(
  commonsFileNameFromUrl(
    'https://upload.wikimedia.org/wikipedia/commons/d/db/Boyan_Slat_%282018%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api',
  ),
  'Boyan_Slat_(2018).jpg',
)

assert.equal(
  commonsFileNameFromUrl(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Boyan_Slat_%282018%29.jpg/960px-Boyan_Slat_%282018%29.jpg',
  ),
  'Boyan_Slat_(2018).jpg',
)

assert.equal(
  commonsFileNameFromUrl('https://example.com/person.jpg'),
  null,
)

assert.equal(
  resolveTzaddikImageSrc({
    id: 42,
    imageFileUrl:
      'https://upload.wikimedia.org/wikipedia/commons/a/a1/Portrait.jpg',
    imageRevisionId: 'abc123',
  }),
  '/api/tzaddik/42/image?v=abc123',
)

assert.equal(
  resolveTzaddikImageSrc({
    id: 42,
    imageFileUrl:
      'https://upload.wikimedia.org/wikipedia/commons/a/a1/Portrait.jpg',
    imageUrlOverride: '/images/custom-tzaddik.webp',
  }),
  '/images/custom-tzaddik.webp',
)

assert.equal(resolveTzaddikImageSrc({ id: 42 }), '')

console.log(
  '✅ Tzaddik source-image contract: Commons filenames ignore query/thumb suffixes and sourced portraits render same-origin.',
)
