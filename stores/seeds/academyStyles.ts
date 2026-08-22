//
// AI Art Academy style registry — the canonical front-end seed for the
// Academy curriculum (conductor project: ai-art-academy).
//
// ETHICAL BOUNDARY (do not relax): entries reference art MOVEMENTS and
// long-dead public-domain artists only. No living artists, no active
// brands or studios. Living-creator styles stay in the free-play Style
// Lab (art-styler builtin list) and are never presented as curriculum.
//
// remix.mode:
//   'prompt' — FLUX Kontext base-model knowledge, no LoRA required.
//   'lora'   — requires the named LoRA on the art server.
//   'hybrid' — LoRA plus a rich prompt template.
// Prompt-mode is the default: canonical historical styles are the best
// case for model knowledge. LoRA upgrades land via the conductor
// style-lora-registry evaluation (ai-art-academy t-003/t-004).

/**
 * A real, rights-checked likeness of a named curriculum artist for the
 * "Meet the masters" gallery (ai-art-academy/t-072). Never a generated
 * likeness — a self-portrait, a documented portrait/photograph by someone
 * else, or a portrait sculpture/medallion. `artist`/`artistDied` describe
 * whoever MADE this image (the public-domain check per
 * PUBLIC-DOMAIN-POLICY.md §1.3 applies to the image's creator, not
 * necessarily the person depicted) — `depicts` names the curriculum artist
 * shown, which the UI matches against AcademyArtist.name. Image files live
 * under public/images/academy/artists/, tracked the same
 * pending-until-media-sync way as AcademyExampleWork (see
 * config/academy-artist-portraits-pending.json).
 */
export interface AcademyArtistPortrait {
  workTitle: string
  /** The curriculum artist shown — must match the owning AcademyArtist.name. */
  depicts: string
  /** Self-portrait vs. a likeness made by someone else. */
  kind: 'self-portrait' | 'portrait' | 'photograph' | 'sculpture'
  /** Who made this image (self for a self-portrait). */
  artist: string
  /** Year the image's creator died — the §1.3 prong-1 public-domain check. */
  artistDied: number
  year: string
  collection: string
  accessionId: string
  sourceUrl: string
  license: 'CC0' | 'PD-Mark' | 'Open-Access-Terms'
  licenseTermsUrl: string
  /** Path under /images/academy/artists/{file}, served from public/. */
  imageSrc: string
}

export interface AcademyArtist {
  name: string
  years: string
  note: string
  /**
   * A real, verified portrait/photograph/sculpture of this named artist —
   * ai-art-academy/t-072. Coverage is intentionally partial: never a
   * generated likeness in this field, only a verified image or nothing.
   */
  portrait?: AcademyArtistPortrait
}

/**
 * A single real, public-domain example work shown in the Academy lesson
 * detail view's "Example works" strip. Provenance schema per conductor's
 * ai-art-academy PUBLIC-DOMAIN-POLICY.md §3 (this registry is the schema's
 * canonical home for curriculum example works). Image files + a matching
 * JSON copy of this data live under public/images/academy/examples/,
 * validated by utils/scripts/verifyAcademyExamplesManifest.ts.
 */
export interface AcademyExampleWork {
  workTitle: string
  artist: string
  /** Year the artist died — the §1.3 prong-1 public-domain check. */
  artistDied: number
  year: string
  collection: string
  accessionId: string
  sourceUrl: string
  license: 'CC0' | 'PD-Mark' | 'Open-Access-Terms'
  licenseTermsUrl: string
  /** Path under /images/academy/examples/{file}, served from public/. */
  imageSrc: string
}

export interface AcademyRemixConfig {
  mode: 'prompt' | 'lora' | 'hybrid'
  /** Kontext instruction; art-styler uses this as the trigger phrase. */
  template: string
  loraPath?: string
  loraWeight?: number
}

export interface AcademyStyle {
  slug: string
  name: string
  era: string
  /** Rough start year, used to order the timeline. */
  sortYear: number
  region: string
  keyIdeas: string
  recognitionCues: string[]
  artists: AcademyArtist[]
  remix: AcademyRemixConfig
  /** Optional preview image under /images/academy/styles/{slug}.webp */
  previewImageSrc?: string
  /**
   * Real public-domain example works for the "Example works" strip
   * (ai-art-academy/t-013). Not every style has a verified example yet —
   * verification is a per-work, ongoing process (see PUBLIC-DOMAIN-POLICY.md
   * and docs/curriculum-outline.md's "VERIFIED" markers).
   */
  exampleWorks?: AcademyExampleWork[]
  /**
   * Per-style "what tends to go wrong" note for the Try It beat, backfilled
   * from conductor's docs/teaching-notes.md §3 (ai-art-academy/t-025). Falls
   * back to a mode-level generic note in academy-style-detail.vue for any
   * style not yet backfilled (e.g. a newly-added movement).
   */
  failureMode?: string
}

export const academyStyles: AcademyStyle[] = [
  {
    slug: 'greek-vase-painting',
    name: 'Greek Vase Painting',
    era: 'c. 600–300 BCE',
    sortYear: -600,
    previewImageSrc: '/images/academy/styles/greek-vase-painting.webp',
    region: 'Ancient Greece',
    keyIdeas:
      'Storytelling wrapped around everyday objects: gods, athletes, and heroes rendered in bold silhouette on clay. Black-figure and later red-figure techniques turned pottery into a portable gallery, and the strict two-tone palette forced artists to say everything with contour and gesture.',
    recognitionCues: [
      'Terracotta orange and glossy black, almost nothing else',
      'Figures in confident profile with strong silhouettes',
      'Ornamental key-pattern (meander) borders',
      'Flat space — no shadows, no horizon, no perspective',
    ],
    artists: [
      {
        name: 'Exekias',
        years: 'active c. 545–530 BCE',
        note: 'Master of black-figure amphorae; his Ajax and Achilles playing dice is antiquity’s quiet masterpiece.',
      },
      {
        name: 'The Berlin Painter',
        years: 'active c. 500–460 BCE',
        note: 'Red-figure virtuoso known for single glowing figures floating on black.',
      },
    ],
    failureMode:
      'May add vessel curvature or border framing; loses fine facial detail',
    exampleWorks: [
      {
        workTitle: 'Terracotta Panathenaic prize amphora',
        artist: 'Attributed to the Euphiletos Painter',
        artistDied: -500,
        year: 'ca. 530 BCE',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '14.130.12',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/248902',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/terracotta-panathenaic-prize-amphora-14-130-12.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Convert this image into an ancient Greek vase painting: terracotta orange and black two-tone palette, figures in flat profile silhouette, glossy ceramic texture, meander key-pattern border',
    },
  },
  {
    slug: 'byzantine-mosaic',
    name: 'Byzantine Mosaic',
    era: 'c. 500–1200',
    sortYear: 500,
    previewImageSrc: '/images/academy/styles/byzantine-mosaic.webp',
    region: 'Eastern Mediterranean',
    keyIdeas:
      'Images built from thousands of glass and gold tesserae, designed to shimmer in candlelight. Byzantine artists cared about presence, not realism — flattened figures with huge eyes gaze straight at you from fields of gold that stand in for heaven itself.',
    recognitionCues: [
      'Gold background filling all empty space',
      'Visible tile grid — the image is made of tiny squares',
      'Frontal, elongated figures with large solemn eyes',
      'Jewel-tone blues, greens, and reds outlined in dark tiles',
    ],
    artists: [
      {
        name: 'The Ravenna mosaicists',
        years: '6th century',
        note: 'The anonymous workshops of San Vitale set the gold standard — literally — for the next six hundred years.',
      },
    ],
    failureMode:
      'Grout/tesserae texture can flatten faces; gold field can swallow the subject',
    exampleWorks: [
      {
        workTitle:
          'Fragment of a Floor Mosaic with a Personification of Ktisis',
        artist: 'Unknown Byzantine mosaicist',
        artistDied: 600,
        year: '500-550 CE, with modern restoration',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '1998.69; 1999.99',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/469960',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/fragment-of-a-floor-mosaic-with-a-person-1998-69-1999-99.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Convert this image into a Byzantine mosaic: composed of small visible glass tesserae tiles, shimmering gold background, flattened frontal figures, jewel-tone colors with dark tile outlines',
    },
  },
  {
    slug: 'illuminated-manuscript',
    name: 'Illuminated Manuscript',
    era: 'c. 700–1500',
    sortYear: 700,
    previewImageSrc: '/images/academy/styles/illuminated-manuscript.webp',
    region: 'Medieval Europe',
    keyIdeas:
      'Books as treasure: monks and workshop artists decorated hand-copied pages with gold leaf, impossible knotwork, and tiny worlds curling through the margins. Every inch of vellum was an invitation to ornament, from dragon-tailed initials to snails jousting with knights.',
    recognitionCues: [
      'Flat gold-leaf accents that catch the light',
      'Elaborate decorated initial letters and dense borders',
      'Bright mineral pigments — lapis blue, vermilion red',
      'Charming, slightly stiff figures with expressive hands',
    ],
    artists: [
      {
        name: 'The Limbourg Brothers',
        years: 'c. 1385–1416',
        note: 'Their Très Riches Heures calendar pages are the most famous manuscript paintings ever made.',
      },
    ],
    failureMode: 'Page/text context crowds small subjects',
    exampleWorks: [
      {
        workTitle: 'The Belles Heures of Jean de France, duc de Berry',
        artist: 'The Limbourg Brothers',
        artistDied: 1416,
        year: '1405-1408/1409',
        collection: 'The Metropolitan Museum of Art, The Cloisters',
        accessionId: '54.1.1a, b',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/470306',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/the-belles-heures-of-jean-de-france-duc--54-1-1a-b.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Convert this image into a medieval illuminated manuscript illustration: flat gold leaf accents, lapis blue and vermilion mineral pigments, ornate decorated border with knotwork, parchment texture',
    },
  },
  {
    slug: 'song-dynasty-landscape',
    name: 'Song Dynasty Landscape Painting',
    era: 'c. 950–1130',
    sortYear: 950,
    previewImageSrc: '/images/academy/styles/song-dynasty-landscape.webp',
    region: 'Northern Song China',
    keyIdeas:
      'The "monumental landscape" (daguan shan): a single towering mountain fills most of the composition, its scale felt physically rather than measured with linear perspective. Painters worked in ink, sometimes with light color washes, on silk hanging scrolls meant for slow contemplation. Space is organized through the "three distances" — looking up at a peak from its base, through overlapping ranges toward unseen depth, and across a near hill toward a far one — often combined within a single scroll. Human figures and temples appear only as tiny incidental details, dwarfed by nature’s overwhelming moral and cosmological order. Rock and foliage are built from repeated, textured brushstrokes ("cun" strokes) rather than outline-and-fill, giving a felt, sculptural density despite the monochrome palette.',
    recognitionCues: [
      'Monochrome or near-monochrome ink on silk, at most light desaturated color washes',
      'A single dominant, towering central peak organizing the whole composition',
      'Tiny human figures, temples, or travelers dwarfed by the landscape’s scale',
      'Layered atmospheric space — mist or void separating near, middle, and distant ground',
      'Dense, repeated textured brushstrokes ("cun" strokes) building rock and cliff surfaces',
      'No cast shadows and no single fixed light source; tall vertical hanging-scroll format',
    ],
    artists: [
      {
        name: 'Fan Kuan',
        years: 'c. 960 – c. 1030',
        note: 'Northern Song master whose Travelers Among Mountains and Streams is considered the movement’s definitive monumental-landscape statement.',
      },
      {
        name: 'Guo Xi',
        years: 'c. 1020–1090',
        note: 'Court painter and theorist whose treatise The Lofty Message of Forests and Streams codified the "three distances" principle that shaped how the school organized space.',
      },
      {
        name: 'Xu Daoning',
        years: 'c. 970–1052',
        note: 'Known for austere winter and river scenes; his handscroll format shows the same monumental idiom unrolling horizontally rather than in a single vertical view.',
      },
    ],
    failureMode:
      "Often keeps the source photo's naturalistic lighting and cast shadows instead of flat monochrome ink tonality, and leaves the subject at its original scale rather than dwarfed by a towering peak — lean on the remix template's explicit 'no cast shadows' and 'tiny travelers dwarfed by scale' to keep the mountain's cosmological hierarchy intact.",
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Northern Song Chinese ink landscape: monochrome ink wash on silk, a towering central mountain peak dominating the composition, tiny travelers dwarfed by scale, layered misty atmospheric distance between foreground and peak, textured brushwork on rock faces, no cast shadows, tall vertical hanging-scroll framing',
    },
  },
  {
    slug: 'gothic',
    name: 'Gothic Panel Painting',
    era: 'c. 1200–1450',
    sortYear: 1200,
    previewImageSrc: '/images/academy/styles/gothic.webp',
    region: 'Italy & Europe',
    keyIdeas:
      'Before the Renaissance learned to fake deep space, painters worked on wooden panels in glowing tempera against skies of solid gold leaf. Gothic painting is the hinge between the flat, eternal figures of Byzantine art and the breathing bodies of the Renaissance: artists like Giotto began letting saints stand with real weight, turn in space, and show tenderness or grief on their faces, while keeping the medieval love of gold, pattern, and pointed-arch framing.',
    recognitionCues: [
      'Burnished gold-leaf backgrounds instead of sky or landscape, often tooled with punched patterns',
      'Slender, gently swaying figures with small features and haloed heads',
      'Jewel-toned tempera — ultramarine, vermilion, rose — with fine, decorative linework',
      'Pointed-arch and gabled frames; multi-panel altarpiece (polyptych) formats',
      'Space that tilts toward the viewer — thrones and floors read as slightly "wrong," and that is the style, not a mistake',
    ],
    artists: [
      {
        name: 'Duccio di Buoninsegna',
        years: 'c. 1255–1319',
        note: 'The founder of the Sienese school, who softened Byzantine rigidity into a new tenderness of line and color.',
      },
      {
        name: 'Giotto di Bondone',
        years: '1267–1337',
        note: 'The great pivot of Western painting, who gave figures real weight, emotion, and believable space a full century before the Renaissance caught up.',
      },
      {
        name: 'Simone Martini',
        years: 'c. 1284–1344',
        note: 'Sienese master of elegant, courtly line and sumptuous gold, whose refinement defined "International Gothic."',
      },
      {
        name: 'Fra Angelico',
        years: 'c. 1395–1455',
        note: 'Dominican friar and painter who fused Gothic gold with early-Renaissance light and perspective; devout, luminous, and precise.',
      },
    ],
    failureMode:
      '"Gothic" pulls toward horror; may bolt haloes or altarpiece frames onto secular subjects',
    exampleWorks: [
      {
        workTitle: 'Madonna and Child',
        artist: 'Duccio di Buoninsegna',
        artistDied: 1318,
        year: 'ca. 1290-1300',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '2004.442',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/438754',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/madonna-and-child-2004-442.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a late-medieval Gothic panel painting: figures on a burnished gold-leaf ground, elongated bodies with gentle S-curves, jewel-toned tempera, pointed-arch framing, flattened space',
    },
  },
  {
    slug: 'renaissance',
    name: 'Renaissance',
    era: 'c. 1400–1600',
    sortYear: 1400,
    previewImageSrc: '/images/academy/styles/renaissance.webp',
    region: 'Italy & Northern Europe',
    keyIdeas:
      'The rediscovery of perspective, anatomy, and the individual. Renaissance painters built pictures like architects — vanishing points, balanced triangles, sfumato haze — and made human faces worth studying for their own sake.',
    recognitionCues: [
      'Convincing depth with linear perspective',
      'Balanced, often triangular compositions',
      'Soft sfumato shading on skin and fabric',
      'Classical architecture and drapery everywhere',
    ],
    artists: [
      {
        name: 'Leonardo da Vinci',
        years: '1452–1519',
        note: 'Painter-scientist whose sfumato and curiosity defined the era.',
      },
      {
        name: 'Sandro Botticelli',
        years: 'c. 1445–1510',
        note: 'Linear grace and mythological dreamscapes like the Birth of Venus.',
      },
      {
        name: 'Raphael',
        years: '1483–1520',
        note: 'The great harmonizer — clarity, sweetness, and perfect composition.',
        portrait: {
          workTitle: 'Raphael',
          depicts: 'Raphael',
          kind: 'portrait',
          artist: 'Wenceslaus Hollar',
          artistDied: 1677,
          year: '1651 (posthumous print)',
          collection: 'The Metropolitan Museum of Art',
          accessionId: '24.63.512',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/361524',
          license: 'CC0',
          licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
          imageSrc: '/images/academy/artists/raphael-portrait-24-63-512.jpg',
        },
      },
    ],
    failureMode:
      'Under-cooks into a generic "old master" look; keep sfumato and balance explicit',
    exampleWorks: [
      {
        workTitle: "Ginevra de' Benci",
        artist: 'Leonardo da Vinci',
        artistDied: 1519,
        year: 'c. 1474/1478',
        collection: 'National Gallery of Art, Washington',
        accessionId: '1937.1.1',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Leonardo_da_Vinci_-_Ginevra_de%27_Benci_-_Google_Art_Project.jpg',
        license: 'PD-Mark',
        licenseTermsUrl:
          'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
        imageSrc: '/images/academy/examples/ginevra-de-benci-1937-1-1.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as an Italian Renaissance oil painting: balanced classical composition, soft sfumato shading, warm earth-tone glazes, subtle linear perspective depth',
    },
  },
  {
    slug: 'persian-miniature',
    name: 'Persian Miniature Painting',
    era: 'c. 1400–1600',
    sortYear: 1400,
    previewImageSrc: '/images/academy/styles/persian-miniature.webp',
    region: 'Timurid Herat & Safavid Persia',
    keyIdeas:
      'Manuscript pages built to be held close and read slowly: court poetry and epic — the Bustan, the Shahnameh — illustrated with a logic opposite to Western perspective. Distant figures sit higher on the page rather than shrinking, light falls flat with no cast shadow, and buildings open in "cutaway" view so inside and outside read at once. Mineral pigment and gold leaf fill flat jewel-bright fields, and the picture surface doubles as ornament — tilework, foliage, and cloth patterns rendered with the same dense precision as the figures.',
    recognitionCues: [
      'No Western linear perspective — distant figures placed higher on the page rather than smaller',
      'Flat, even lighting with no cast shadows',
      'Brilliant, unmixed jewel colors — ultramarine, vermilion, gold leaf — in flat fields rather than blended',
      'Dense surface ornament: patterned textiles, tiled architecture, stylized foliage rendered as precisely as the figures',
      '"Cutaway" architecture showing a building\'s interior and exterior at once',
      'A framing border of fine floral or geometric pattern around the scene',
    ],
    artists: [
      {
        name: 'Kamal ud-Din Bihzad',
        years: 'c. 1450–1535',
        note: 'Leading painter of the Herat workshop under Timurid and later Safavid patronage; widely regarded as the tradition\'s most technically refined master, sometimes called "the Persian Leonardo."',
      },
      {
        name: 'Sultan Muhammad',
        years: 'active early–mid 16th century, d. before 1555',
        note: "Director of Shah Ismail's Tabriz workshop and first project director of the Shahnameh of Shah Tahmasp, known for dense, imaginative compositions.",
      },
    ],
    failureMode:
      "Easily reverts to Western linear perspective and cast shadows, since most training data assumes them by default — lean on the remix template's explicit 'no Western perspective or cast shadow' and push the dense floral or geometric border to keep the miniature's flat, ornamental logic intact.",
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Persian miniature: flat, high-vantage compositions with distant figures placed higher rather than smaller, brilliant unshaded jewel colors, intricate architectural or garden detail, patterned textiles, and a dense floral or geometric border, no Western perspective or cast shadow',
    },
  },
  {
    slug: 'northern-renaissance',
    name: 'Northern Renaissance',
    era: 'c. 1420–1570',
    sortYear: 1420,
    previewImageSrc: '/images/academy/styles/northern-renaissance.webp',
    region: 'The Low Countries & Germany',
    keyIdeas:
      'While Italy rediscovered antiquity, the artists of Flanders and the Netherlands staged a quieter revolution: oil paint. Building color up in transparent glazes, they achieved a jewel-like realism the south could not match — every hair, brass rivet, and distant church tower rendered with almost microscopic devotion. It hides symbols in ordinary objects (a single candle, a dog, a convex mirror), sets sacred scenes in real Flemish rooms, and looks out of the frame with startlingly modern, individual faces. Later, Bruegel turned that same sharp eye on peasant weddings and snowy villages, inventing the everyday landscape.',
    recognitionCues: [
      'Astonishing fine detail and hard, crisp edges — texture you can almost feel',
      'Luminous, glowing color from layered oil glazes; cool, even northern daylight',
      'Deep, meticulously painted landscapes or interiors behind the main figures',
      'Symbolic everyday objects loaded with hidden meaning',
      'Direct, particular, un-idealized faces — real people, not classical types',
    ],
    artists: [
      {
        name: 'Jan van Eyck',
        years: 'c. 1390–1441',
        note: 'The pioneer who pushed oil painting to jewel-like perfection; his surfaces still look impossibly real six centuries on.',
      },
      {
        name: 'Rogier van der Weyden',
        years: 'c. 1399–1464',
        note: 'Master of restrained, piercing emotion, whose grieving figures set the standard for devotional feeling in the North.',
      },
      {
        name: 'Hans Memling',
        years: 'c. 1430–1494',
        note: 'Bruges portraitist of serene, gentle faces, hugely popular with the international merchants of his city.',
      },
      {
        name: 'Pieter Bruegel the Elder',
        years: 'c. 1525–1569',
        note: 'The great painter of peasant life, seasons, and proverbs, who made the humble landscape a serious subject.',
      },
      {
        name: 'Hieronymus Bosch',
        years: 'c. 1450–1516',
        note: 'Inventor of teeming, surreal panoramas of temptation and torment; a singular imagination centuries ahead of its time.',
      },
    ],
    failureMode:
      'Under-cooks into "generic old oil"; differentiators are microscopic detail and a deep, sharp background',
    exampleWorks: [
      {
        workTitle: 'Tommaso di Folco Portinari and Maria Portinari',
        artist: 'Hans Memling',
        artistDied: 1494,
        year: 'ca. 1470',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '14.40.626-27',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/437056',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/tommaso-di-folco-portinari-and-maria-portinari-14-40-626-27.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as an Early Netherlandish oil painting: microscopic detail, luminous layered glazes, crisp naturalism, cool northern daylight, and a meticulously rendered landscape or interior behind the figures',
    },
  },
  {
    slug: 'baroque',
    name: 'Baroque',
    era: 'c. 1600–1750',
    sortYear: 1600,
    previewImageSrc: '/images/academy/styles/baroque.webp',
    region: 'Europe',
    keyIdeas:
      'Drama as doctrine. Baroque painters aimed the spotlight, cranked the contrast, and froze stories at their most theatrical instant — a technique called chiaroscuro, where figures blaze out of near-black shadow.',
    recognitionCues: [
      'Extreme light-dark contrast (chiaroscuro / tenebrism)',
      'Diagonal, swirling compositions full of motion',
      'Rich velvety darks with candlelit skin tones',
      'Caught-in-the-act storytelling moments',
    ],
    artists: [
      {
        name: 'Caravaggio',
        years: '1571–1610',
        note: 'Invented the spotlight three centuries before electricity.',
      },
      {
        name: 'Rembrandt van Rijn',
        years: '1606–1669',
        note: 'Turned chiaroscuro inward — light as psychology.',
        portrait: {
          workTitle: 'Self-Portrait',
          depicts: 'Rembrandt van Rijn',
          kind: 'self-portrait',
          artist: 'Rembrandt van Rijn',
          artistDied: 1669,
          year: '1660',
          collection: 'The Metropolitan Museum of Art',
          accessionId: '14.40.618',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/437397',
          license: 'CC0',
          licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
          imageSrc:
            '/images/academy/artists/rembrandt-van-rijn-self-portrait-14-40-618.jpg',
        },
      },
      {
        name: 'Artemisia Gentileschi',
        years: '1593–c. 1656',
        note: 'Fierce, virtuosic drama from the era’s greatest woman painter.',
      },
    ],
    failureMode:
      'The model may just darken the photo instead of restructuring the light',
    exampleWorks: [
      {
        workTitle: 'The Milkmaid',
        artist: 'Johannes Vermeer',
        artistDied: 1675,
        year: 'c. 1660',
        collection: 'Rijksmuseum, Amsterdam',
        accessionId: 'SK-A-2344',
        sourceUrl:
          'https://www.rijksmuseum.nl/en/collection/object/The-Milkmaid--42dd0e658c2979aec8e144d2357c55c0',
        license: 'Open-Access-Terms',
        licenseTermsUrl:
          'https://www.rijksmuseum.nl/en/rijksstudio/about-rijksstudio',
        imageSrc: '/images/academy/examples/the-milkmaid-sk-a-2344.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Baroque oil painting with dramatic chiaroscuro: a single strong light source, deep near-black shadows, rich warm tones, theatrical composition',
    },
  },
  {
    slug: 'rococo',
    name: 'Rococo',
    era: 'c. 1700–1780',
    sortYear: 1700,
    previewImageSrc: '/images/academy/styles/rococo.webp',
    region: 'France & Europe',
    keyIdeas:
      'After the thunder of the Baroque, the 18th century exhaled into something lighter and more playful. Rococo is the art of pleasure: garden parties, flirtation, silk and porcelain, painted in a pastel palette of rose, cream, and sky-blue with feathery, dissolving brushwork. Where Baroque used dark drama, Rococo uses soft diffused light and swirling ornamental curves. It can be pure frothy delight (Boucher, Fragonard) or something quieter and more tender — Chardin, working in the same era, turned the same soft light on a soap bubble or a kitchen still life and found real poetry there.',
    recognitionCues: [
      'Pastel palette — rose pink, powder blue, cream, mint — and gilded highlights',
      'Soft, diffused light with no harsh shadows; a hazy, tender atmosphere',
      'Feathery, loose, sparkling brushwork, especially in silk and foliage',
      'Playful curves and asymmetric ornament (shells, scrolls, garlands) everywhere',
      'Light-hearted subjects: courtship, music, gardens, mythological romps',
    ],
    artists: [
      {
        name: 'Antoine Watteau',
        years: '1684–1721',
        note: 'Inventor of the dreamy fête galante — elegant figures drifting through parkland — and a poet of wistful, fleeting pleasure.',
      },
      {
        name: 'François Boucher',
        years: '1703–1770',
        note: 'The decorative genius of the age, favorite painter of Madame de Pompadour, all rose-and-blue mythology and charm.',
      },
      {
        name: 'Jean-Honoré Fragonard',
        years: '1732–1806',
        note: 'The most dazzling brush of late Rococo, whose flickering strokes turn silk and leaves into pure sparkle.',
        portrait: {
          workTitle: 'Portrait of Jean Honoré Fragonard',
          depicts: 'Jean-Honoré Fragonard',
          kind: 'portrait',
          artist: 'Charles Louis François Le Carpentier',
          artistDied: 1822,
          year: '1808',
          collection: 'The Metropolitan Museum of Art',
          accessionId: '2015.493.1',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/690287',
          license: 'CC0',
          licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
          imageSrc:
            '/images/academy/artists/jean-honore-fragonard-portrait-2015-493-1.jpg',
        },
      },
      {
        name: 'Jean-Baptiste-Siméon Chardin',
        years: '1699–1779',
        note: 'The quiet counterweight: still lifes and domestic scenes of grave, luminous simplicity that later painters revered.',
      },
    ],
    failureMode:
      "Keeps the photo's saturated, contrasty color — push a high-key pastel palette instead",
    exampleWorks: [
      {
        workTitle: 'Soap Bubbles',
        artist: 'Jean Siméon Chardin',
        artistDied: 1779,
        year: 'ca. 1733-34',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '49.24',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/435888',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/soap-bubbles-49-24.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Rococo oil painting: pastel palette of rose, sky-blue, and cream, feathery loose brushwork, soft diffused light, playful ornamental curves, and a light, airy mood',
    },
  },
  {
    slug: 'neoclassicism',
    name: 'Neoclassicism',
    era: 'c. 1750–1830',
    sortYear: 1750,
    previewImageSrc: '/images/academy/styles/neoclassicism.webp',
    region: 'Europe',
    keyIdeas:
      'A deliberate correction after Rococo’s pastel frivolity: artists turned back to the "noble simplicity" of Greece and Rome, freshly fueled by the excavations at Pompeii and Herculaneum. Clear drawing over loose paint, moral seriousness over decoration, stoic self-sacrifice over romance — the art of the Enlightenment and the age of revolutions.',
    recognitionCues: [
      'Crisp, precise contours — line does the work, not visible brushwork',
      'Cool, restrained color and even, theater-lit illumination (no Baroque murk)',
      'Friezelike compositions: figures arranged shallowly, almost like a stage set',
      'Classical props — togas, columns, Roman furniture, marble — used with intent',
    ],
    artists: [
      {
        name: 'Jacques-Louis David',
        years: '1748–1825',
        note: 'The movement’s central figure and eventual court painter to Napoleon; his Roman history paintings doubled as political manifestos.',
      },
      {
        name: 'Jean-Auguste-Dominique Ingres',
        years: '1780–1867',
        note: 'David’s most brilliant pupil, who pushed line into near-abstraction.',
      },
      {
        name: 'Antonio Canova',
        years: '1757–1822',
        note: 'The age’s greatest sculptor, whose marble figures combine antique cool with tender softness.',
        portrait: {
          workTitle: 'Portrait of Antonio Canova',
          depicts: 'Antonio Canova',
          kind: 'sculpture',
          artist: 'Francesco Putinati',
          artistDied: 1848,
          year: 'ca. 1822',
          collection: 'The Metropolitan Museum of Art',
          accessionId: '67.219.2',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/204810',
          license: 'CC0',
          licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
          imageSrc:
            '/images/academy/artists/antonio-canova-portrait-67-219-2.jpg',
        },
      },
      {
        name: 'Angelica Kauffman',
        years: '1741–1807',
        note: 'Swiss-born history painter and a founding member of Britain’s Royal Academy.',
      },
    ],
    failureMode: 'Over-flattens texture into a "marble statue" look',
    exampleWorks: [
      {
        workTitle: 'The Death of Socrates',
        artist: 'Jacques Louis David',
        artistDied: 1825,
        year: '1787',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '31.45',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/436105',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/the-death-of-socrates-31-45.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Neoclassical oil painting: crisp linear contours, cool restrained color, smooth invisible brushwork, and a calm, stage-like classical composition',
    },
  },
  {
    slug: 'ukiyo-e',
    name: 'Ukiyo-e',
    era: 'c. 1650–1900',
    sortYear: 1650,
    previewImageSrc: '/images/academy/styles/ukiyo-e.webp',
    region: 'Edo-period Japan',
    keyIdeas:
      'Pictures of the floating world: woodblock prints of actors, landscapes, and great waves, made to be affordable and everywhere. Flat color planes, confident outlines, and daring crops later electrified European painters when the prints reached Paris.',
    recognitionCues: [
      'Flat areas of color with crisp woodblock outlines',
      'Bold asymmetric crops and high vantage points',
      'Visible paper tone and subtle printing gradients (bokashi)',
      'Nature motifs: waves, blossoms, rain, Mount Fuji',
    ],
    artists: [
      {
        name: 'Katsushika Hokusai',
        years: '1760–1849',
        note: 'The Great Wave is the most reproduced image in art history.',
      },
      {
        name: 'Utagawa Hiroshige',
        years: '1797–1858',
        note: 'Poet of rain, snow, and the road to Kyoto.',
      },
    ],
    failureMode:
      'Adds spurious calligraphy, stamps, or borders — append "no text, no stamps, no border" to the instruction',
    exampleWorks: [
      {
        workTitle: 'Under the Wave off Kanagawa (The Great Wave)',
        artist: 'Katsushika Hokusai',
        artistDied: 1849,
        year: 'ca. 1830-32',
        collection: 'The Metropolitan Museum of Art',
        accessionId: 'JP10',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/36491',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/under-the-wave-off-kanagawa-kanagawa-oki-jp10.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Convert this image into a Japanese ukiyo-e woodblock print: flat color planes, crisp dark outlines, visible paper texture, subtle bokashi color gradients, Edo-period print aesthetic',
    },
  },
  {
    slug: 'romanticism',
    name: 'Romanticism',
    era: 'c. 1780–1850',
    sortYear: 1780,
    previewImageSrc: '/images/academy/styles/romanticism.webp',
    region: 'Europe',
    keyIdeas:
      'Feeling over formula. Romantic painters chased awe — storm-wrecked ships, mountain mists, lone figures dwarfed by the sublime — insisting that emotion and imagination were as true as any measurement.',
    recognitionCues: [
      'Dramatic weather and vast landscapes',
      'Tiny human figures against overwhelming nature',
      'Turbulent brushwork and glowing atmospheric light',
      'Moody palettes — storm grays, sunset golds',
    ],
    artists: [
      {
        name: 'Caspar David Friedrich',
        years: '1774–1840',
        note: 'The wanderer above the sea of fog, and every album cover since.',
      },
      {
        name: 'J.M.W. Turner',
        years: '1775–1851',
        note: 'Dissolved ships and sunsets into pure luminous weather.',
      },
    ],
    failureMode:
      'Reads as a "dramatic sky filter"; push mood and scale, not just clouds',
    exampleWorks: [
      {
        workTitle: 'Two Men Contemplating the Moon',
        artist: 'Caspar David Friedrich',
        artistDied: 1840,
        year: 'ca. 1825-30',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '2000.51',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/438417',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/two-men-contemplating-the-moon-2000-51.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Romantic era landscape painting: sublime dramatic atmosphere, glowing turbulent sky, misty depth, small figures dwarfed by vast nature, expressive brushwork',
    },
  },
  {
    slug: 'realism',
    name: 'Realism',
    era: 'c. 1840–1880',
    sortYear: 1840,
    previewImageSrc: '/images/academy/styles/realism.webp',
    region: 'France',
    keyIdeas:
      'Paint what is actually there. Realists turned from gods and storms to gleaners, stone breakers, and ordinary rooms, arguing that honest observation of working life deserved the grandest canvases.',
    recognitionCues: [
      'Everyday subjects treated with monumental seriousness',
      'Earthy, restrained palettes and natural light',
      'Solid, unidealized figures with real weight',
      'No mythology, no melodrama — dignity in the ordinary',
    ],
    artists: [
      {
        name: 'Gustave Courbet',
        years: '1819–1877',
        note: '"Show me an angel and I will paint one" — the movement’s manifesto in a sentence.',
      },
      {
        name: 'Jean-François Millet',
        years: '1814–1875',
        note: 'Gave farm labor the gravity of scripture.',
        portrait: {
          workTitle: 'Jean-François Millet',
          depicts: 'Jean-François Millet',
          kind: 'photograph',
          artist: 'Nadar',
          artistDied: 1910,
          year: '1856–58',
          collection: 'The Metropolitan Museum of Art',
          accessionId: '2013.159.46',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/306329',
          license: 'CC0',
          licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
          imageSrc:
            '/images/academy/artists/jean-francois-millet-photograph-2013-159-46.jpg',
        },
      },
    ],
    failureMode:
      'A subtle style — can look like a lightly-graded photo; lean on the earthy palette',
    exampleWorks: [
      {
        workTitle: 'Woman with a Parrot',
        artist: 'Gustave Courbet',
        artistDied: 1877,
        year: '1866',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '29.100.57',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/436002',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/woman-with-a-parrot-29-100-57.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a 19th century French Realist oil painting: earthy restrained palette, natural light, solid unidealized forms, honest observational detail',
    },
  },
  {
    slug: 'impressionism',
    name: 'Impressionism',
    era: 'c. 1860–1890',
    sortYear: 1860,
    previewImageSrc: '/images/academy/styles/impressionism.webp',
    region: 'France',
    keyIdeas:
      'Painting the light instead of the thing. Impressionists worked outdoors, fast, in broken dabs of unmixed color, catching how a haystack or a river actually looks in one fleeting moment of sun.',
    recognitionCues: [
      'Short broken brushstrokes you can see individually',
      'Sunlit palettes — lavender shadows, no true black',
      'Everyday leisure scenes: gardens, rivers, cafés',
      'Edges dissolve; the image sharpens at a distance',
    ],
    artists: [
      {
        name: 'Claude Monet',
        years: '1840–1926',
        note: 'Painted the same haystacks and lilies until light itself was the subject.',
      },
      {
        name: 'Berthe Morisot',
        years: '1841–1895',
        note: 'Feather-light brushwork and intimate modern life.',
      },
      {
        name: 'Pierre-Auguste Renoir',
        years: '1841–1919',
        note: 'Dappled sunlight on dancing crowds.',
      },
    ],
    failureMode:
      'Can over-blur into mush; keep "broken brushstrokes" and a high-key palette in the instruction',
    exampleWorks: [
      {
        workTitle: 'Two Sisters (On the Terrace)',
        artist: 'Pierre-Auguste Renoir',
        artistDied: 1919,
        year: '1881',
        collection: 'The Art Institute of Chicago',
        accessionId: '1933.455',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Pierre-Auguste_Renoir_-_Two_Sisters_(On_the_Terrace)_-_1933.455_-_Art_Institute_of_Chicago.jpg',
        license: 'PD-Mark',
        licenseTermsUrl:
          'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
        imageSrc:
          '/images/academy/examples/two-sisters-on-the-terrace-1933-455.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a French Impressionist oil painting: visible broken brushstrokes, sunlit color with lavender shadows and no pure black, soft dissolved edges, plein-air freshness',
    },
  },
  {
    slug: 'post-impressionism',
    name: 'Post-Impressionism',
    era: 'c. 1885–1910',
    sortYear: 1885,
    previewImageSrc: '/images/academy/styles/post-impressionism.webp',
    region: 'France & beyond',
    keyIdeas:
      'Impressionism’s children went separate, radical ways: Van Gogh bent color and stroke to emotion, Seurat rebuilt light from scientific dots, Cézanne carved nature into planes that would later crack open into Cubism.',
    recognitionCues: [
      'Expressive, directional brushstrokes (swirls, dots, dashes)',
      'Color chosen for feeling, not accuracy',
      'Strong outlines and flattened, patterned space',
      'Thick visible paint texture (impasto)',
    ],
    artists: [
      {
        name: 'Vincent van Gogh',
        years: '1853–1890',
        note: 'Starry swirls and sunflowers — emotion made visible in paint.',
        portrait: {
          workTitle: 'Self-Portrait with a Straw Hat',
          depicts: 'Vincent van Gogh',
          kind: 'self-portrait',
          artist: 'Vincent van Gogh',
          artistDied: 1890,
          year: '1887',
          collection: 'The Metropolitan Museum of Art',
          accessionId: '67.187.70a',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/436532',
          license: 'CC0',
          licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
          imageSrc:
            '/images/academy/artists/vincent-van-gogh-self-portrait-67-187-70a.jpg',
        },
      },
      {
        name: 'Georges Seurat',
        years: '1859–1891',
        note: 'Pointillism: light assembled from thousands of pure-color dots.',
      },
      {
        name: 'Paul Cézanne',
        years: '1839–1906',
        note: 'The bridge from Impressionism to everything modern.',
      },
    ],
    failureMode:
      'The Van Gogh LoRA pulls toward one artist; the movement prompt keeps it broader',
    exampleWorks: [
      {
        workTitle: 'A Sunday on La Grande Jatte — 1884',
        artist: 'Georges Seurat',
        artistDied: 1891,
        year: '1884–86, border added 1888–89',
        collection: 'The Art Institute of Chicago',
        accessionId: '1926.224',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg',
        license: 'PD-Mark',
        licenseTermsUrl:
          'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
        imageSrc:
          '/images/academy/examples/a-sunday-on-la-grande-jatte-1884-1926-224.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Post-Impressionist painting in the manner of Van Gogh: swirling directional impasto brushstrokes, intense emotional color, bold outlines, thick visible paint texture',
    },
  },
  {
    slug: 'symbolism',
    name: 'Symbolism',
    era: 'c. 1880–1910',
    sortYear: 1880,
    previewImageSrc: '/images/academy/styles/symbolism.webp',
    region: 'France, Belgium & beyond',
    keyIdeas:
      'While the Impressionists painted sunlight on water, the Symbolists turned inward, toward dreams, myths, and the unseen. Reacting against both cold realism and mere prettiness, they wanted painting to suggest rather than describe — to give form to longing, mystery, death, and the sacred. Expect twilight color, allegorical figures, and scenes that feel like something remembered from a dream you cannot quite place.',
    recognitionCues: [
      'Dreamlike, mysterious mood — reverie rather than a report of the real world',
      'Mythological, allegorical, or spiritual subjects, often melancholy or uncanny',
      'Muted, twilight color and soft, glowing, sourceless light',
      'Flattened, decorative, or hazy space that resists ordinary depth',
      'A sense of hidden meaning — the picture is a riddle or a symbol, not a scene',
    ],
    artists: [
      {
        name: 'Gustave Moreau',
        years: '1826–1898',
        note: "Painter of jewel-encrusted myths and femmes fatales, whose shimmering, detailed fantasies made him the movement's grand elder.",
      },
      {
        name: 'Odilon Redon',
        years: '1840–1916',
        note: 'Poet of the strange and the floating — dream-eyes, spiders, and, later, radiant flowers in luminous pastel color.',
      },
      {
        name: 'Arnold Böcklin',
        years: '1827–1901',
        note: 'Swiss painter of haunting mythologies; his brooding Isle of the Dead became one of the most reproduced images of its era.',
      },
      {
        name: 'Pierre Puvis de Chavannes',
        years: '1824–1898',
        note: 'Master of pale, calm, dreamlike murals whose flattened simplicity quietly influenced nearly every modernist who followed.',
      },
    ],
    failureMode:
      'The loosest visual signature — transfers as mood and palette; guard against a modern digital-surreal look',
    exampleWorks: [
      {
        workTitle: 'Oedipus and the Sphinx',
        artist: 'Gustave Moreau',
        artistDied: 1898,
        year: '1864',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '21.134.1',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/437153',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/oedipus-and-the-sphinx-21-134-1.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Symbolist painting: dreamlike mysterious mood, muted twilight color, mythic and allegorical atmosphere, soft glowing light, and a sense of reverie rather than plain reality',
    },
  },
  {
    slug: 'pointillism',
    name: 'Neo-Impressionism / Pointillism',
    era: 'c. 1884–1910',
    sortYear: 1884,
    previewImageSrc: '/images/academy/styles/pointillism.webp',
    region: 'France & Belgium',
    keyIdeas:
      'Georges Seurat loved what Impressionism had discovered about light but wanted to put it on a scientific footing. Instead of loose dabs mixed on the palette, he built entire canvases from thousands of tiny, separate dots of pure color, placed so your eye — not the brush — does the blending. Up close it is a field of confetti; step back and it fuses into a glowing, oddly still, luminous whole. His followers, the Neo-Impressionists, spread this "divisionism" across France and Belgium.',
    recognitionCues: [
      'Whole image built from tiny, distinct dots or short dashes of pure color',
      "Colors kept separate and left to blend optically in the viewer's eye",
      'An even, all-over, almost woven surface texture',
      'Luminous, balanced light and a calm, frozen, monumental stillness',
      'Complementary color pairs (orange/blue, red/green) placed side by side to vibrate',
    ],
    artists: [
      {
        name: 'Georges Seurat',
        years: '1859–1891',
        note: 'Inventor of pointillism, who built vast, serene, scientifically composed scenes from pure dots; dead at just 31.',
      },
      {
        name: 'Paul Signac',
        years: '1863–1935',
        note: "Seurat's great champion, who carried divisionism forward into brighter, mosaic-like harbors and coastlines after Seurat's death.",
      },
      {
        name: 'Henri-Edmond Cross',
        years: '1856–1910',
        note: 'Painter of luminous Mediterranean color whose broad, tile-like touch helped point the way toward Fauvism.',
      },
      {
        name: 'Théo van Rysselberghe',
        years: '1862–1926',
        note: 'The leading Belgian Neo-Impressionist, who brought the dot-technique to elegant, sensitive portraiture.',
      },
    ],
    failureMode:
      'Dots render too coarse or sparse at low output sizes — evaluate at a higher resolution',
    exampleWorks: [
      {
        workTitle: 'Circus Sideshow (Parade de cirque)',
        artist: 'Georges Seurat',
        artistDied: 1891,
        year: '1887-88',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '61.101.17',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/437654',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/circus-sideshow-parade-de-cirque-61-101-17.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image using pointillist technique: thousands of tiny separate dots of pure unmixed color that blend in the eye, a luminous divisionist surface, even all-over stippling, and bright balanced light',
    },
  },
  {
    slug: 'art-nouveau',
    name: 'Art Nouveau',
    era: 'c. 1890–1910',
    sortYear: 1890,
    previewImageSrc: '/images/academy/styles/art-nouveau.webp',
    region: 'Europe',
    keyIdeas:
      'Nature as ornament, everywhere. Art Nouveau wrapped posters, jewelry, and whole buildings in whiplash curves, flowing hair, and flattened decorative frames — fine art and design refusing to stay in separate rooms.',
    recognitionCues: [
      'Sinuous whiplash curves and flowing organic lines',
      'Flat decorative color inside strong contours',
      'Ornamental frames, halos, and botanical borders',
      'Elegant figures with cascading hair',
    ],
    artists: [
      {
        name: 'Alphonse Mucha',
        years: '1860–1939',
        note: 'His poster goddesses defined the look of an era.',
      },
      {
        name: 'Gustav Klimt',
        years: '1862–1918',
        note: 'Gold-leaf patterns swallowing tender figures.',
      },
    ],
    failureMode:
      'A great transfer overall; watch for over-busy borders eating the subject',
    exampleWorks: [
      {
        workTitle: 'Gismonda (poster for Sarah Bernhardt)',
        artist: 'Alphonse Mucha',
        artistDied: 1939,
        year: '1894',
        collection: 'Wikimedia Commons (Hans Sachs collection)',
        accessionId: 'Mucha_1894_Gismonda',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Alfons_Mucha_-_1894_-_Gismonda.jpg',
        license: 'PD-Mark',
        licenseTermsUrl:
          'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
        imageSrc: '/images/academy/examples/gismonda-poster-mucha-1894.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Convert this image into an Art Nouveau poster illustration: sinuous whiplash curves, flat decorative color within elegant dark contours, ornamental botanical border, muted harmonious palette',
    },
  },
  {
    slug: 'ashcan-school',
    name: 'Ashcan School',
    era: 'c. 1900–1913',
    sortYear: 1900,
    previewImageSrc: '/images/academy/styles/ashcan-school.webp',
    region: 'New York',
    keyIdeas:
      'Robert Henri told his students to forget polite academy subjects and paint what was actually outside their studio windows — tenements, saloons, boxing clubs, crowded streets. His circle, nicknamed "the Ashcan School" by a critic who meant it as an insult, gave the modern industrial city the same serious, confident brushwork as a mythological scene: gritty, loud, and alive, like photojournalism painted in oil decades before photojournalism existed.',
    recognitionCues: [
      'Loose, confident, visibly gestural brushwork — energy and immediacy over polished finish',
      'A dark, murky, earthy palette (browns, blacks, muddy grays) punctuated by small bright accents',
      'Everyday urban subjects treated with the seriousness of history painting — streets, tenements, saloons, boxing matches',
      'Dramatic, low, often artificial lighting (gaslight, ring lights) rather than even daylight',
    ],
    artists: [
      {
        name: 'Robert Henri',
        years: '1865–1929',
        note: 'The movement’s teacher and organizer; urged students to paint life "with such vitality" that gallery walls would seem to disappear.',
      },
      {
        name: 'George Bellows',
        years: '1882–1925',
        note: 'Best known for ringside boxing scenes, rendered with blurred, aggressive brushwork that puts the viewer in the crowd.',
      },
      {
        name: 'John Sloan',
        years: '1871–1951',
        note: 'Chronicler of Greenwich Village street life, rooftops, and working-class New Yorkers going about ordinary days.',
      },
      {
        name: 'William Glackens',
        years: '1870–1938',
        note: 'Painted the city’s social scenes — cafes, restaurants, parks — in a looser, more colorful hand than his Ashcan peers.',
      },
    ],
    failureMode:
      'Under-cooks toward a lightly-graded photo if the prompt underweights brushwork/palette — lean on "gestural," "murky," "low-key lighting"',
    exampleWorks: [
      {
        workTitle: 'Love of Winter',
        artist: 'George Bellows',
        artistDied: 1925,
        year: '1914',
        collection: 'Art Institute of Chicago',
        accessionId: '1914.1018',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:George_Wesley_Bellows_-_Love_of_Winter_-_1914.1018_-_Art_Institute_of_Chicago.jpg',
        license: 'PD-Mark',
        licenseTermsUrl:
          'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
        imageSrc: '/images/academy/examples/love-of-winter-1914-1018.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image in the Ashcan School style: loose, gestural brushwork, a dark and earthy urban palette, unglamorized everyday city subject matter, and dramatic, low-key lighting like a newspaper illustrator working in oil',
    },
  },
  {
    slug: 'expressionism',
    name: 'Expressionism',
    era: 'c. 1905–1930',
    sortYear: 1905,
    previewImageSrc: '/images/academy/styles/expressionism.webp',
    region: 'Germany & Northern Europe',
    keyIdeas:
      'Truth through distortion. Expressionists jangled color and warped form until the canvas felt the way the world felt — anxious, electric, alive — trading optical accuracy for raw psychological voltage.',
    recognitionCues: [
      'Clashing, non-natural color (green faces, red skies)',
      'Jagged, angular distortion of figures and space',
      'Rough, urgent brushwork or woodcut-style marks',
      'Emotional intensity over polish',
    ],
    artists: [
      {
        name: 'Edvard Munch',
        years: '1863–1944',
        note: 'The Scream — anxiety’s official portrait.',
      },
      {
        name: 'Ernst Ludwig Kirchner',
        years: '1880–1938',
        note: 'Electric city streets in acid pinks and greens.',
      },
      {
        name: 'Franz Marc',
        years: '1880–1916',
        note: 'Blue horses and yellow cows — animals as pure feeling.',
      },
    ],
    failureMode:
      'The LoRA leans Kirchner-specific; A/B against the movement prompt for a broader result',
    exampleWorks: [
      {
        workTitle: 'The Yellow Cow',
        artist: 'Franz Marc',
        artistDied: 1916,
        year: '1911',
        collection: 'Solomon R. Guggenheim Museum',
        accessionId: '49.1210',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Franz_Marc-The_Yellow_Cow-1911.jpg',
        license: 'PD-Mark',
        licenseTermsUrl:
          'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
        imageSrc: '/images/academy/examples/the-yellow-cow-49-1210.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a German Expressionist painting: clashing non-natural colors, jagged angular distortion, rough urgent brushwork, intense psychological mood',
    },
  },
  {
    slug: 'cubism',
    name: 'Cubism',
    era: 'c. 1907–1920',
    sortYear: 1907,
    previewImageSrc: '/images/academy/styles/cubism.webp',
    region: 'Paris',
    keyIdeas:
      'Why paint one viewpoint when you can paint them all at once? Cubists shattered subjects into facets and reassembled them, showing a guitar’s front, side, and soul on a single flat surface.',
    recognitionCues: [
      'Fractured geometric facets and overlapping planes',
      'Multiple viewpoints of one subject simultaneously',
      'Muted early palettes: ochres, grays, browns',
      'Still-life props — guitars, bottles, newspapers',
    ],
    artists: [
      {
        name: 'Juan Gris',
        years: '1887–1927',
        note: 'The clearest, most elegant architect of the Cubist grid.',
      },
    ],
    failureMode:
      '"Preserve composition" fights faceting — often comes out as a shallow "crystallized photo"',
    exampleWorks: [
      {
        workTitle: 'Fantômas',
        artist: 'Juan Gris',
        artistDied: 1927,
        year: '1915',
        collection: 'National Gallery of Art, Washington',
        accessionId: '1976.59.1',
        sourceUrl: 'https://www.nga.gov/artworks/56101-fantomas',
        license: 'CC0',
        licenseTermsUrl:
          'https://www.nga.gov/artworks/free-images-and-open-access',
        imageSrc: '/images/academy/examples/fantomas-1976-59-1.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as an analytical Cubist painting: subject fractured into overlapping geometric facets, multiple viewpoints at once, muted ochre gray and brown palette, flattened shallow space',
    },
  },
  {
    slug: 'suprematism',
    name: 'Suprematism',
    era: '1913–1919',
    sortYear: 1913,
    previewImageSrc: '/images/academy/styles/suprematism.webp',
    region: 'Russia',
    keyIdeas:
      'Kazimir Malevich pushed abstraction as far as it would go: not reducing a subject to shapes, but throwing the subject away entirely. He called it Suprematism — "the supremacy of pure feeling" over the depiction of objects — and within a few years was floating clusters of squares, bars, and circles across bare white canvases, as if geometry itself had come unmoored from gravity.',
    recognitionCues: [
      'A small number of flat, hard-edged geometric shapes — squares, rectangles, circles, bars',
      'Shapes float freely, tilted off the horizontal/vertical axis, with no ground line, horizon, or perspective',
      'A plain white or near-white background used as infinite, weightless space',
      'Black, red, and white as the dominant palette; total absence of recognizable objects, figures, or texture',
    ],
    artists: [
      {
        name: 'Kazimir Malevich',
        years: '1879–1935',
        note: 'Founder and sole originator of Suprematism; unveiled the style at the 1915 "Last Futurist Exhibition 0,10" in Petrograd.',
      },
    ],
    failureMode:
      "The most radically non-representational style in the curriculum — a faithful remix discards the source photo's content entirely, even more so than De Stijl; treat it as translating a photo's mood into pure geometry, not preserving anything recognizable",
    remix: {
      mode: 'prompt',
      template:
        'Reduce this image to a Suprematist composition: a small number of flat geometric shapes — squares, circles, bars — in black, red, and a few pure colors, floating freely against a plain white ground, no outline or perspective, pure weightless geometry',
    },
  },
  {
    slug: 'de-stijl',
    name: 'De Stijl',
    era: 'c. 1917–1931',
    sortYear: 1917,
    previewImageSrc: '/images/academy/styles/de-stijl.webp',
    region: 'Netherlands',
    keyIdeas:
      'Art reduced to its purest ingredients: straight lines, right angles, and primary colors. De Stijl believed a universal visual harmony could rebuild a world shaken by war — one perfect grid at a time.',
    recognitionCues: [
      'Black grid lines on white',
      'Rectangles of pure red, yellow, and blue only',
      'Strict horizontals and verticals — no curves, no diagonals',
      'Asymmetric but perfectly balanced layouts',
    ],
    artists: [
      {
        name: 'Piet Mondrian',
        years: '1872–1944',
        note: 'Reduced trees to grids and grids to jazz.',
      },
      {
        name: 'Theo van Doesburg',
        years: '1883–1931',
        note: 'The movement’s tireless organizer and provocateur.',
      },
    ],
    failureMode:
      'A faithful remix discards the photo entirely — frame it playfully ("Mondrian-ify") rather than expecting recognizable content',
    exampleWorks: [
      {
        workTitle:
          'Lozenge Composition with Yellow, Black, Blue, Red, and Gray',
        artist: 'Piet Mondrian',
        artistDied: 1944,
        year: '1921',
        collection: 'The Art Institute of Chicago',
        accessionId: '1957.307',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Piet_Mondrian_-_Lozenge_Composition_with_Yellow,_Black,_Blue,_Red,_and_Gray_-_1957.307_-_Art_Institute_of_Chicago.jpg',
        license: 'PD-Mark',
        licenseTermsUrl:
          'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
        imageSrc:
          '/images/academy/examples/lozenge-composition-with-yellow-black-blue-red-and-gray-1957-307.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Convert this image into a De Stijl composition: bold black grid lines on white, rectangles of pure primary red yellow and blue, strict horizontal and vertical geometry, balanced asymmetry',
    },
  },
  {
    slug: 'bauhaus',
    name: 'Bauhaus',
    era: '1919–1933',
    sortYear: 1919,
    previewImageSrc: '/images/academy/styles/bauhaus.webp',
    region: 'Germany',
    keyIdeas:
      'Painting, craft, and design as one discipline: "form follows function," taught through hands-on workshops and a shared foundational visual vocabulary. Kandinsky and Klee both taught the school\'s first-year "form" class, codifying geometric shape and color into symbolic language — a direct continuation of De Stijl\'s flat grids, until the Nazi government forced the school to close in 1933 and its faculty scattered its style worldwide.',
    recognitionCues: [
      'Pure geometric forms — circles, triangles, squares — as a symbolic color-form vocabulary',
      'Bold primary and secondary color fields crossed by black grid lines or diagonals',
      'Whimsical, sign-like pictograms layered over precise geometric grids',
      'Camera-less "photograms" — ghostly silhouettes on light-sensitive paper',
    ],
    artists: [
      {
        name: 'Wassily Kandinsky',
        years: '1866–1944',
        note: 'Led the Bauhaus\'s foundational "form" class, teaching that geometric shapes and colors carry specific emotional meaning.',
      },
      {
        name: 'Paul Klee',
        years: '1879–1940',
        note: 'Filled private notebooks with pedagogical diagrams; his paintings mix childlike pictograms with dry, precise geometry.',
      },
      {
        name: 'László Moholy-Nagy',
        years: '1895–1946',
        note: 'Ran the metal workshop and pioneered the photogram, treating light itself as an art medium.',
      },
    ],
    failureMode:
      'Three distinct hands can average into a generic "geometric abstract" look; pick one artist (e.g. Kandinsky) to anchor it',
    exampleWorks: [
      {
        workTitle: 'Composition 8 (Komposition 8)',
        artist: 'Wassily Kandinsky',
        artistDied: 1944,
        year: 'July 1923',
        collection: 'Solomon R. Guggenheim Museum',
        accessionId: '37.262',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Kandinsky_-_Composition_8,_1923.jpg',
        license: 'PD-Mark',
        licenseTermsUrl:
          'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
        imageSrc: '/images/academy/examples/composition-8-37-262.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Bauhaus-school geometric abstraction: pure circles, triangles, and squares in bold primary colors on a flat plane, precise linework, no realistic shading',
    },
  },
  {
    slug: 'american-regionalism',
    name: 'American Regionalism',
    era: 'c. 1928–1935',
    sortYear: 1928,
    previewImageSrc: '/images/academy/styles/american-regionalism.webp',
    region: 'American Midwest',
    keyIdeas:
      'After a decade of American painters looking to Paris for their cues, a Midwestern countercurrent insisted the most American subject was standing right outside the studio window: county fairs, cornfields, Carpenter Gothic farmhouses, storm cellars. Regionalist painters rendered these everyday rural scenes with a smooth, almost sculptural precision — crisp outlines and simplified rounded forms — rather than the loose, gritty immediacy of the Ashcan School. The tone is famously ambiguous: sincere homage or gentle satire?',
    recognitionCues: [
      'Smooth, simplified, almost sculptural forms — rounded contours rather than loose brushwork',
      'Sharp-focus, evenly lit representational realism with very little visible brushstroke texture',
      'Rural and small-town Midwestern American subjects: farms, farmhouses, fields, community gatherings',
      'Dramatic, rolling skies and stylized cloud/crop patterns used as a compositional device',
      'A muted, earthy palette (ochre, olive, brick red, slate blue) with occasional saturated accent color',
    ],
    artists: [
      {
        name: 'Grant Wood',
        years: '1891–1942',
        note: 'Iowa painter whose meticulous, polished realism and ambiguous tone made American Gothic the most recognized American painting of the 20th century.',
      },
      {
        name: 'John Steuart Curry',
        years: '1897–1946',
        note: 'Kansas-born painter of dramatic rural weather and revivalist religious life, whose theatrical compositions brought Regionalism its most kinetic, storm-tossed energy.',
      },
    ],
    failureMode:
      'Under-cooks toward a lightly-processed photo if the prompt underweights the smoothed, sculptural simplification — lean on "crisp outlines," "simplified sculptural forms," "dramatic rolling sky"',
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image in the American Regionalist style: smooth, simplified sculptural forms with crisp outlines, sharp-focus representational realism, a rural Midwestern American setting, a dramatic rolling sky, and a muted earthy palette with a few bold accent colors',
    },
  },
  {
    slug: 'mughal-miniature',
    name: 'Mughal Miniature Painting',
    era: 'c. 1560–1650',
    sortYear: 1560,
    previewImageSrc: '/images/academy/styles/mughal-miniature.webp',
    region: 'Imperial atelier, Mughal India',
    keyIdeas:
      "Akbar's Imperial atelier fused the flat, jewel-toned Persian manuscript tradition with Indian color sense and an increasingly naturalistic, observational eye — figures gained volume and individualized faces, and landscapes gained atmospheric recession that Persian miniatures deliberately avoided. Akbar-era works are crowded narrative scenes illustrating dynastic chronicles, built from teams of specialist painters. Under Jahangir the emphasis shifted from crowded narrative toward exacting single-subject portraiture and scientific nature studies. Gold is used more sparingly and locally than in Persian work, reserved for thrones, halos, and ornament rather than whole sky fields; fine stippled brushwork gives faces and fabric a rounded, sculptural finish quite distinct from Persian flat color fields.",
    recognitionCues: [
      "Individualized, naturalistic faces with fine stippled modeling rather than Persian miniature's flatter, more stylized features",
      "Landscape recedes with atmospheric haze and diminishing scale (unlike Persian miniature's higher-not-smaller convention)",
      'Gold used locally and sparingly — thrones, halos, jewelry — not as a flat background field',
      'Crowded, staged narrative compositions (Akbar-era) or a single emphatically isolated portrait/animal/plant subject on a plain ground (Jahangir-era)',
      'Fine, dense brushwork rendering brocade and jewelry with near-scientific precision',
      'A wide decorative border of scrollwork or florals framing the central scene, separate in style from the painting itself',
    ],
    artists: [
      {
        name: 'Basawan',
        years: 'fl. 1560–1600',
        note: "Leading painter of Akbar's atelier, celebrated for naturalistic figures and psychological nuance within densely staged Akbarnama narrative scenes.",
      },
      {
        name: 'Bichitr',
        years: 'fl. 17th century, active into the 1640s',
        note: 'Court painter under Jahangir and Shah Jahan known for elaborate allegorical compositions and precise portraiture.',
      },
      {
        name: 'Ustad Mansur',
        years: 'fl. c. 1590 – d. 1624',
        note: 'Jahangir\'s court naturalist-painter, titled Nadir al-Asr ("Wonder of the Age"), renowned for scientifically exacting studies of birds, animals, and plants.',
      },
    ],
    failureMode:
      'Risks collapsing into a generic "Indo-Persian miniature" filter indistinguishable from Persian Miniature Painting — lean on stippled naturalistic faces, atmospheric haze, and sparing local gold to keep the two movements visually distinct',
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Mughal miniature: naturalistic, individualized faces with fine stippled modeling, atmospheric landscape recession, gold used sparingly for thrones/halos/ornament only, dense precise brushwork on brocade and jewelry, and a wide floral or scrollwork decorative border, distinct from flatter Persian miniature color fields',
    },
  },
  {
    slug: 'fayum-mummy-portraits',
    name: 'Fayum Mummy Portraits',
    era: 'c. A.D. 50–250',
    sortYear: 50,
    previewImageSrc: '/images/academy/styles/fayum-mummy-portraits.webp',
    region: 'Roman Egypt (Fayum oasis, Antinoopolis, Memphis)',
    keyIdeas:
      "In Roman-era Egypt, funerary practice fused Egyptian mummification with imported Greco-Roman portrait painting: a lifelike panel portrait of the deceased, painted in encaustic (pigmented hot wax, occasionally tempera) on a thin wood panel, was wrapped directly into the mummy's linen bandaging over the face. Named for the Fayum oasis where the largest number survive, these are among the only large surviving body of painted portraiture from the ancient Mediterranean world. The style is strikingly naturalistic for its era: modeled flesh tones, individualized features, and direct psychological presence, sitting at the meeting point of Egyptian funerary tradition and Roman portrait convention. Almost nothing is known of the individual painters — no signed Fayum portrait survives.",
    recognitionCues: [
      'Large, dark, almond-shaped eyes with heavy brows, gazing directly at (or just past) the viewer — the single most distinctive trait of the style',
      'Warm, honey-toned modeled skin built up in visible ridges of thick encaustic wax, not smooth glazed paint',
      'A plain, flat, dark or muted background with no setting, landscape, or architecture',
      'Simple Roman-style hairstyles and drapery, occasionally with modest gold-leaf jewelry, a wreath, or a diadem',
      'Three-quarter or fully frontal head-and-shoulders framing, cropped close, no hands or body beyond the chest',
      'No cast shadow or single light source modeling — illumination reads as even and frontal rather than dramatic',
    ],
    artists: [
      {
        name: 'Anonymous Fayum painters',
        years: 'c. A.D. 50–250',
        note: "No Fayum portrait carries a painter's signature or attribution, and no ancient text names an individual practitioner — the tradition is credited to its anonymous makers.",
      },
    ],
    failureMode:
      'The most photorealistic style in the curriculum, so the likeliest failure is a generic "vintage photo" filter that skips the actual signature; lean on the oversized almond eyes, visible encaustic ridge texture, flat dark background, and absence of cast shadow to keep it distinct from realism/renaissance portraiture',
    exampleWorks: [
      {
        workTitle: 'Portrait of a Youth with a Surgical Cut in one Eye',
        artist: 'Anonymous Fayum painters',
        artistDied: 230,
        year: 'A.D. 190–210',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '09.181.4',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/547768',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/portrait-of-a-youth-with-a-surgical-cut-09-181-4.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Fayum mummy portrait: a direct frontal or slightly turned gaze with large dark almond-shaped eyes and heavy dark brows, warm honey-toned skin built from thick encaustic wax brushstrokes with visible ridge texture, simple Roman-style hair and dress, a plain flat dark background, and a thin gold-leaf wreath or jewelry accent',
    },
  },
  {
    slug: 'vienna-secession',
    name: 'Vienna Secession',
    era: 'c. 1897–1918',
    sortYear: 1897,
    previewImageSrc: '/images/academy/styles/vienna-secession.webp',
    region: 'Vienna, Austria',
    keyIdeas:
      'Founded in 1897 when Gustav Klimt and a group of Viennese artists broke from the conservative Künstlerhaus academy under the motto "Der Zeit ihre Kunst, der Kunst ihre Freiheit" ("To every age its art, to art its freedom"), the Vienna Secession fused Art Nouveau\'s organic decorative line with a new, almost proto-abstract flatness: whole passages of a picture dissolve into pure ornamental pattern — gold-leaf spirals, eyes, rectangles, checkerboards — while the figures\' faces and hands remain rendered with sharp, almost photographic naturalism. The effect sits deliberately between two-dimensional pattern and three-dimensional portraiture in the same canvas, applied to symbolic and allegorical subjects (love, mortality, myth) rather than everyday scenes. Klimt\'s late "Golden Phase" (c. 1899-1910) is the movement\'s best-known and most visually distinctive output.',
    recognitionCues: [
      'Large flat fields of gold leaf or gold-toned metallic paint applied as ornamental pattern (spirals, concentric eyes, rectangles), not as illumination or light',
      'A jarring contrast between finely modeled, naturalistic faces/hands and the totally flat, non-representational ornament surrounding them',
      'Elongated, stylized figures with little or no anatomical volume below the head and hands',
      'Rich, saturated jewel-toned color "islands" (deep reds, greens, blues) set within or against the gold field',
      'Symbolic or mythic subject matter — lovers, femme fatale figures, allegorical women — rather than portraiture of daily life',
      'No cast shadow, no realistic perspective or setting; a strong decorative border or framing device',
    ],
    artists: [
      {
        name: 'Gustav Klimt',
        years: '1862–1918',
        note: 'Founding president of the Vienna Secession, best known for the gold-leaf "Golden Phase" works that define the movement in the popular imagination.',
      },
    ],
    failureMode:
      'Model may gild everything uniformly and lose the defining contrast between flat ornament and naturalistic face/hands; lean on fine naturalistic detail in the face and hands set against the abstract gold pattern to keep the face legible rather than dissolved into pattern',
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Vienna Secession painting in the style of Gustav Klimt: flat ornamental fields of gold leaf and gold-toned metallic pattern (spirals, eyes, rectangles) replacing background depth, an elongated figure rendered with fine naturalistic detail in face and hands set against the abstract gold pattern, rich jewel-toned color islands within the gold, no cast shadow or realistic perspective, a strong decorative border',
    },
  },
  {
    slug: 'joseon-genre-painting',
    name: 'Joseon Dynasty Korean Genre Painting',
    era: 'c. 1750–1820',
    sortYear: 1750,
    previewImageSrc: '/images/academy/styles/joseon-genre-painting.webp',
    region: 'Late Joseon Dynasty, Korea',
    keyIdeas:
      'For most of the Joseon Dynasty, Korean painting followed Chinese scholarly convention: monochrome ink landscapes and disciplined calligraphic brushwork, made by and for the yangban aristocracy. In the late 18th century a handful of court painters turned that same economical brush toward something almost nobody had painted seriously before: ordinary people doing ordinary things — wrestling matches, village schoolrooms, courting couples, market stalls. This genre-painting tradition (pungsokhwa, "pictures of customs") is candid and often funny, with a light touch that assumes the viewer already knows the joke. There is no dense border, no gold, and often barely any background at all — figures float on plain paper, caught mid-gesture, the whole scene carried by a few confident, economical lines.',
    recognitionCues: [
      'Thin, quick, calligraphic brush lines describing figures with very few strokes — closer to gesture drawing than to finished modeling',
      'Light, translucent color washes (pale ochre, dull red, indigo, soft gray) over ink outline, never opaque or richly layered paint',
      'Little or no background: figures are placed on bare paper with at most a single horizon line or a suggested patch of ground',
      'Candid, often humorous everyday subject matter — commoners at work, play, or courtship — rather than court portraiture, myth, or religious subjects',
      'Figures grouped in loose circular or diagonal clusters (a wrestling ring, a classroom of scattered students) rather than a formal frontal arrangement',
      'A small red seal (dojang) stamped in one corner',
      'No cast shadow, no linear perspective — space is implied by placement on the page, not by a horizon or vanishing point',
    ],
    artists: [
      {
        name: 'Kim Hong-do',
        years: '1745 – c. 1806',
        note: "Pen name Danwon. Court painter to King Jeongjo and the movement's central figure, best known for his Album of Genre Paintings (Danwon pungsokdo cheop, South Korea's National Treasure 527).",
      },
      {
        name: 'Sin Yun-bok',
        years: '1758 – after 1813',
        note: 'Pen name Hyewon. A generation younger than Kim Hong-do; specialized in scenes of courtship and leisure among ordinary townspeople, painted with the same light, economical brush.',
      },
    ],
    failureMode:
      'Likely fails toward a generic "sumi-e"/ink-wash filter that keeps the photo\'s real background instead of emptying the frame; lean on "almost no background detail beyond a single ground line" and "plain paper" to distinguish it from Song Dynasty landscape\'s ink-wash family',
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a late-Joseon Korean genre painting (pungsokhwa) in the style of Kim Hong-do: loose, economical brush-line figures with light, translucent color wash on plain paper, a candid or gently humorous everyday moment, almost no background detail beyond a single ground line, muted earthy palette of pale ochre, indigo, and dull red, a small red seal stamp in one corner, no cast shadow or linear perspective',
    },
  },
  {
    slug: 'the-nabis',
    name: 'The Nabis',
    era: 'c. 1888–1900',
    sortYear: 1888,
    previewImageSrc: '/images/academy/styles/the-nabis.webp',
    region: 'Paris, France',
    keyIdeas:
      'The Nabis ("prophets," from the Hebrew) formed around 1888-1889 among students connected to the Académie Julian, after Paul Sérusier returned from Pont-Aven with a small landscape painted under Paul Gauguin\'s direct guidance: instead of copying the scene\'s colors as observed, Sérusier organized it as patches of emotionally chosen, non-naturalistic color. That painting — nicknamed "The Talisman" by the group — became their founding icon. Maurice Denis crystallized the theory: before a painting depicts a person, a horse, or a story, "it is essentially a flat surface covered with colors assembled in a certain order." The group carried the flattened space and strong contours of Japanese ukiyo-e prints into decorative panels, posters, book illustration, and theater design, treating those "minor" decorative arts as equal in seriousness to easel painting.',
    recognitionCues: [
      'Flattened, shallow pictorial space rather than Renaissance-style depth',
      'Large, interlocking areas of unmodulated color rather than blended tonal shading',
      'Strong contour lines separating color areas, echoing Japanese woodblock prints',
      'Wallpaper, textiles, screens, and other domestic patterns treated as a major structural element of the composition, not background filler',
      'Cropped, off-center viewpoints suggesting a photograph or a print rather than a staged studio arrangement',
      'Quiet, intimate subject matter: interiors, gardens, theater scenes, and domestic moments rather than history painting or grand landscape',
      'Figures simplified toward silhouette or rhythmic pattern, sometimes nearly dissolving into the surrounding decoration',
    ],
    artists: [
      {
        name: 'Paul Sérusier',
        years: '1864–1927',
        note: "Painted The Talisman under Gauguin's direction at Pont-Aven in 1888; the small landscape's color-as-emotion logic became the group's founding argument.",
      },
      {
        name: 'Édouard Vuillard',
        years: '1868–1940',
        note: 'Specialist in compressed, pattern-dense interiors where figures nearly merge with wallpaper and upholstery.',
      },
      {
        name: 'Maurice Denis',
        years: '1870–1943',
        note: 'The movement\'s clearest theorist; his "flat surface covered with colors" argument is the cleanest entry point for students into why the Nabis painted the way they did.',
      },
    ],
    failureMode:
      'Instead of a coherent decorative motif like art-nouveau\'s whiplash line or vienna-secession\'s gold ornament, the model must invent wallpaper/textile pattern where the source photo has none; likely defaults to a generic "flat vector-art"/cartoon filter that flattens color without adding pattern — lean on the remix template\'s explicit "textiles, wallpaper, foliage, or architectural patterns organize the composition" to check pattern is actually present',
    remix: {
      mode: 'prompt',
      template:
        'Reinterpret this image as a late-1890s Nabis decorative painting: flatten the depth into interlocking color shapes, simplify figures into rhythmic silhouettes, use strong contour edges, and let textiles, wallpaper, foliage, or architectural patterns organize the composition; favor intimate mood and designed surface rhythm over photographic realism',
    },
  },
  {
    slug: 'hudson-river-school',
    name: 'Hudson River School',
    era: 'c. 1825–1875',
    sortYear: 1825,
    previewImageSrc: '/images/academy/styles/hudson-river-school.webp',
    region: 'United States',
    keyIdeas:
      'The Hudson River School adds a major nineteenth-century landscape tradition, visually distinct from this curriculum\'s Romanticism, Realism, and American Regionalism entries. Its signature is not merely "dramatic nature": it combines panoramic scale, precise botanical and geological detail, theatrical light, deep atmospheric distance, and tiny human figures that turn the landscape into a moral or spiritual stage. Thomas Cole founded the movement by combining observed American scenery with allegory and warnings about unchecked development; Frederic Edwin Church and Albert Bierstadt later scaled it up into enormous, scientifically detailed canvases displayed as public spectacles. Teach the movement\'s cultural framing honestly: these paintings often present American land as sublime, abundant, and apparently unoccupied, a visual language that overlaps with Manifest Destiny and can erase Indigenous presence and displacement.',
    recognitionCues: [
      'Panoramic wilderness compositions with a high horizon and enormous depth',
      'Luminous, often golden light breaking through clouds or mist',
      'Meticulously rendered trees, rocks, water, and distant terrain',
      'Tiny people, buildings, boats, or animals used mainly to establish scale',
      'A staged progression from shadowed foreground to glowing distance',
      'Calm reflective water or a dramatic weather break used as a compositional hinge',
      'Nature presented as sublime, spiritual, national, or morally instructive',
    ],
    artists: [
      {
        name: 'Thomas Cole',
        years: '1801–1848',
        note: 'Founder of the movement, combining observed American scenery with allegory, historical cycles, and warnings about unchecked development.',
        portrait: {
          workTitle: 'Thomas Cole',
          depicts: 'Thomas Cole',
          kind: 'sculpture',
          artist: 'Henry Kirke Brown',
          artistDied: 1886,
          year: 'by 1850',
          collection: 'The Metropolitan Museum of Art',
          accessionId: '95.8.1',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/10238',
          license: 'CC0',
          licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
          imageSrc: '/images/academy/artists/thomas-cole-bust-95-8-1.jpg',
        },
      },
      {
        name: 'Frederic Edwin Church',
        years: '1826–1900',
        note: "Cole's pupil, known for enormous, scientifically detailed landscapes assembled from travel studies and displayed as public spectacles.",
      },
      {
        name: 'Albert Bierstadt',
        years: '1830–1902',
        note: 'Painter of monumental western landscapes whose theatrical light and scale helped shape popular ideas of the American West.',
      },
    ],
    failureMode:
      'Likely fails toward a generic "dramatic sky filter" over the photo\'s existing composition rather than the movement\'s real structure; lean on the remix template\'s explicit "tiny figures for scale" and "shadowed foreground opening toward luminous golden light" to check those staged compositional roles are actually present, and discuss the Manifest Destiny/Indigenous-erasure framing honestly rather than teaching the beauty alone',
    exampleWorks: [
      {
        workTitle:
          'View from Mount Holyoke, Northampton, Massachusetts, after a Thunderstorm—The Oxbow',
        artist: 'Thomas Cole',
        artistDied: 1848,
        year: '1836',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '08.228',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/10497',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/the-oxbow-08-228.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Hudson River School landscape: panoramic wilderness, meticulous natural detail, deep atmospheric distance, tiny figures for scale, a shadowed foreground opening toward luminous golden light, reflective water, dramatic clouds, and a sublime theatrical sense of nature',
    },
  },
  {
    slug: 'precisionism',
    name: 'Precisionism',
    era: 'c. 1915–1935',
    sortYear: 1915,
    previewImageSrc: '/images/academy/styles/precisionism.webp',
    region: 'United States',
    keyIdeas:
      "Precisionism gives learners a clean bridge between Cubist simplification, American industrial modernity, photography, and later graphic design: a repeatable visual grammar of hard-edged geometry, compressed depth, and controlled light rather than one painter's brushwork. The label was applied retrospectively to artists who shared a highly controlled approach to factories, grain elevators, bridges, city architecture, machinery, and simplified rural buildings, absorbing lessons from Cubism, Futurism, photography, commercial illustration, and machine-age design without forming a single manifesto-driven group. Teach the movement's framing honestly: these paintings often remove people, smoke, and clutter from industrial scenes, producing images that are simultaneously celebratory, uncanny, and emotionally distant — a useful prompt for asking what labor and environmental cost disappears when a factory is rendered as pristine geometry.",
    recognitionCues: [
      'Crisp, sharply bounded shapes; simplified cylinders, rectangles, cones, and stepped planes',
      'Compressed or shallow spatial depth; clean architectural silhouettes',
      'Little or no visible brush texture; strong sunlight producing broad, exact shadows',
      'Factories, silos, smokestacks, bridges, skyscrapers, barns, or machinery',
      'Very few people, vehicles, signs, or incidental details',
      'A quiet, suspended atmosphere despite industrial subject matter; compositions that feel designed rather than casually observed',
    ],
    artists: [
      {
        name: 'Charles Demuth',
        years: '1883–1935',
        note: "Transformed industrial buildings, signs, and vernacular architecture into layered geometric compositions. The only Precisionist figure whose death (1935) clears the Academy's 1956 public-domain cutoff with a comfortable margin — Charles Sheeler, Ralston Crawford, and Georgia O'Keeffe are commonly discussed alongside him but all died after 1956 and are not named here as generation-style targets.",
      },
    ],
    failureMode:
      'Model may under-cook toward a lightly-processed photo, or over-cook into a glossy science-fiction city with futuristic materials and neon lighting the movement never had; lean on the remix template\'s explicit "crisp geometric masses," "controlled daylight and exact-edged shadows," and "remove visual clutter" to keep it early-20th-century industrial rather than either extreme',
    remix: {
      mode: 'prompt',
      template:
        'Recompose this image as an early twentieth-century American Precisionist scene: reduce structures and objects to crisp geometric masses, flatten incidental detail, use controlled daylight and exact-edged shadows, compress depth, remove visual clutter, and preserve the source composition',
    },
  },
  {
    slug: 'pre-raphaelite',
    name: 'Pre-Raphaelite Brotherhood',
    era: 'c. 1848–1900',
    sortYear: 1848,
    previewImageSrc: '/images/academy/styles/pre-raphaelite.webp',
    region: 'United Kingdom',
    keyIdeas:
      'Founded in 1848 by a group of London art students in deliberate reaction against the Royal Academy\'s Raphael-descended convention (soft "brown sauce" glazing, idealized generalized figures), the Pre-Raphaelite Brotherhood painted instead with thin glazes over a wet white ground to recover the jewel-bright color and obsessive, un-idealized natural detail they associated with art before Raphael. The lesson gives learners a useful contrast case against `renaissance` and `romanticism`: it shows a rejection movement built from a return-to-the-past idea, and a case where hyper-detailed naturalism serves symbolic and literary storytelling rather than documentary observation. Subjects draw heavily on medieval legend, Shakespeare, Dante, Keats, and Tennyson, and on Biblical scenes staged with contemporary models and props rather than generalized idealized bodies — a working method the movement itself considered scandalously "ugly" and true-to-life when first exhibited.',
    recognitionCues: [
      'Saturated, jewel-toned color (deep reds, greens, blues) rather than the muted brown glazes of prior academic painting',
      'Crisp, high-fidelity detail on hair, fabric, and foliage — every leaf and strand rendered rather than suggested',
      'Flowing, often flame-red or auburn hair on female figures; medieval or Renaissance-inspired dress',
      'Medieval, literary (Shakespeare, Dante, Keats, Tennyson), or Biblical subject matter staged with specific, individualized models rather than idealized generic figures',
      'Densely symbolic objects and flowers placed with deliberate meaning rather than as incidental still-life',
      'Flattened, shallow pictorial space inherited from Quattrocento models, avoiding Raphael-era illusionistic depth',
    ],
    artists: [
      {
        name: 'John Everett Millais',
        years: '1829–1896',
        note: "Co-founder; combined the Brotherhood's obsessive natural detail with theatrical, often tragic narrative staging.",
      },
      {
        name: 'William Holman Hunt',
        years: '1827–1910',
        note: 'Co-founder; the most doctrinally committed member, painting directly from nature (including expeditions to the Holy Land) in pursuit of literal truth-to-detail.',
        portrait: {
          workTitle: 'William Holman Hunt',
          depicts: 'William Holman Hunt',
          kind: 'photograph',
          artist: 'David Wilkie Wynfield',
          artistDied: 1887,
          year: '1863',
          collection: 'The Metropolitan Museum of Art',
          accessionId: '2013.464',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/307108',
          license: 'CC0',
          licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
          imageSrc:
            '/images/academy/artists/william-holman-hunt-photograph-2013-464.jpg',
        },
      },
      {
        name: 'Dante Gabriel Rossetti',
        years: '1828–1882',
        note: 'Co-founder, poet-painter; shifted the Brotherhood\'s early hyper-detailed naturalism toward moody, symbol-laden single-figure "stunner" portraits in his later work.',
      },
    ],
    failureMode:
      'Likely under-cooks toward a generic "old oil painting" filter with warm varnish tone rather than the movement\'s actual saturated jewel color and hyper-detailed hair/fabric/foliage; lean on the remix template\'s explicit "saturated jewel-toned color" to keep it vivid rather than sepia-toned, and discuss how symbolic objects (not incidental still-life) drive the composition',
    exampleWorks: [
      {
        workTitle: 'Portia',
        artist: 'Sir John Everett Millais',
        artistDied: 1896,
        year: '1886',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '06.1328',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/437092',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/portia-06-1328.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Recompose this image as a mid-nineteenth-century Pre-Raphaelite Brotherhood painting: saturated jewel-toned color, crisp high-fidelity detail on hair, fabric, and foliage, flowing hair on female figures, densely symbolic objects placed with deliberate meaning, flattened shallow pictorial space, and preserve the source composition',
    },
  },
  {
    slug: 'arts-and-crafts',
    name: 'Arts and Crafts Movement',
    era: 'c. 1860–1914',
    sortYear: 1860,
    previewImageSrc: '/images/academy/styles/arts-and-crafts.webp',
    region: 'Britain, later international',
    keyIdeas:
      'The Arts and Crafts movement gives learners a lesson about design ethics rather than a single painting look: it answered industrial mass production with visible handwork, honest materials, integrated interiors, and the belief that useful objects could also be beautiful. It connects the curriculum\'s `gothic`, `art-nouveau`, and `bauhaus` entries while explaining why those movements disagree about ornament and machines. The movement did not enforce one visual style, so the lesson teaches a family of recognition cues and a design philosophy rather than treating every Arts and Crafts object as identical to William Morris wallpaper. The lesson presents the movement\'s central contradiction honestly: reformers wanted dignified labor and beautiful everyday surroundings, but labor-intensive handmade objects were often too expensive for the workers whose lives the movement hoped to improve — a useful prompt for discussing what "handmade" costs versus what it promises.',
    recognitionCues: [
      'Repeating botanical or animal motifs organized into dense, readable rhythms',
      'Flat or shallow space, with outlines and simplified natural forms rather than illusionistic depth',
      'Visible evidence of process: block printing, embroidery, joinery, hammered metal, woven structure, or hand-set type',
      'Materials and construction treated as part of the design instead of hidden beneath surface decoration',
      'Domestic-scale objects and integrated rooms — wallpaper, textiles, books, furniture, stained glass, and metalwork designed as a coherent environment',
      'Medieval and vernacular references used as an alternative to anonymous industrial production',
    ],
    artists: [
      {
        name: 'William Morris',
        years: '1834–1896',
        note: "Movement's best-known designer and organizer; argued for reuniting design and making, producing wallpapers, textiles, furniture, stained glass, and books through Morris & Company.",
      },
      {
        name: 'May Morris',
        years: '1862–1938',
        note: "Designer, embroiderer, and leader of the Morris & Co. embroidery workshop, plus lecturer and historian of her father's work; named independently here, not merely as William Morris's daughter, to keep the lesson from collapsing a collaborative decorative-arts movement into one famous man.",
      },
      {
        name: 'Walter Crane',
        years: '1845–1915',
        note: "Named as historical context for the movement's illustration and guild-workshop branches, alongside C. R. Ashbee (1863–1942); no example works by either are exhibited.",
      },
    ],
    failureMode:
      'The model must invent a plausible botanical/animal repeat where the source photo has none while keeping visible "hand-process" texture; likely fails toward a generic flat decorative-pattern filter that skips block-print/embroidery/joinery texture — lean on the remix template\'s explicit "visible craft structure" and "natural materials," and discuss the movement\'s affordability contradiction (dignified-labor ideals vs. expensive handmade objects) honestly',
    exampleWorks: [
      {
        workTitle: 'Honeysuckle',
        artist: 'William Morris',
        artistDied: 1896,
        year: 'design registered 1876, printed 1876–77',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '30.95.46a–f',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/222341',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/honeysuckle-30-95-46a-f.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Redesign this image as an Arts and Crafts decorative composition: hand-drawn botanical forms, rhythmic repeating pattern, honest natural materials, flattened color, and visible craft structure rather than a glossy machine-perfect finish, and preserve the source composition',
    },
  },
  {
    slug: 'italian-futurism',
    name: 'Italian Futurism',
    era: 'c. 1909–1916',
    sortYear: 1909,
    previewImageSrc: '/images/academy/styles/italian-futurism.webp',
    region: 'Italy',
    keyIdeas:
      "Futurism gives learners a lesson distinct from every movement already in the curriculum: instead of restyling a static subject, it tries to depict motion, speed, and simultaneity — a subject shown as if several instants of its own movement were compressed into one image. Where Cubism fractures a static subject into multiple viewpoints at once, Futurism fractures a moving one into multiple instants — a related but distinct device worth teaching alongside Cubism rather than folded into it. The lesson addresses the movement's history honestly: several of its founders, Marinetti chief among them, later aligned with Italian Fascism, and the 1909 founding manifesto explicitly glorified speed, machinery, youth, and violence. Teaching the movement's formal innovations does not mean teaching that stance as neutral.",
    recognitionCues: [
      'Overlapping, semi-transparent repetitions of a single form suggesting successive instants of motion',
      'Sharp diagonal "force lines" radiating from or trailing a moving subject',
      'Fragmented, crystalline facets organized around implied motion and energy, rather than a single fixed viewpoint',
      'Subjects drawn from modern speed and industry — automobiles, trains, crowds, machinery, urban street scenes',
      'Dynamic, unstable compositions with no single resting point for the eye',
    ],
    artists: [
      {
        name: 'Umberto Boccioni',
        years: '1882–1916',
        note: "Futurism's leading painter and sculptor; the only 1910 Futurist-manifesto co-signer whose death (1916, from injuries sustained falling from a horse during military training) clears the Academy's 1956 public-domain cutoff. Giacomo Balla, Carlo Carrà, and Gino Severini are commonly discussed alongside him but all died after 1956 and are not named as generation-style targets.",
      },
    ],
    failureMode:
      'Likely collapses into either a static faceted image (losing the motion) or a generic photographic motion-blur filter (losing the constructed force-line/facet structure); lean on the remix template\'s explicit "overlapping, semi-transparent repetitions" and "sharp diagonal force lines" to check for constructed dynamism rather than a blur effect, and discuss the movement\'s later alignment with Fascism and the manifesto\'s glorification of violence honestly rather than teaching speed/machinery worship as neutral',
    remix: {
      mode: 'prompt',
      template:
        "Recompose this image to depict dynamism and motion in the Italian Futurist manner: overlapping, semi-transparent repetitions of the subject's form suggesting successive instants of movement, sharp diagonal force lines, and fragmented crystalline facets organized around implied energy rather than a fixed viewpoint, and preserve the source subject's identity and general pose",
    },
  },
  {
    slug: 'egyptian-painting',
    name: 'Ancient Egyptian Painting',
    era: 'c. 1390–950 BCE',
    sortYear: -1390,
    previewImageSrc: '/images/academy/styles/egyptian-painting.webp',
    region: 'Ancient Egypt',
    keyIdeas:
      'Ancient Egyptian painting fixed a set of pictorial conventions — composite ("twisted") perspective, hierarchical scale, flat horizontal registers, and integrated hieroglyphic text — that were followed with remarkable consistency for well over two thousand years, making it the starting point of nearly every general art-history survey. Nothing else in the curriculum teaches this grammar: Fayum Mummy Portraits is a much later, Greco-Roman-influenced, naturalistically modeled Roman-Egypt style and is in most ways this entry\'s stylistic opposite. The style is unusually procedural rather than personal: no single named artist invented it, and its devices can be described and checked for as a repeatable visual system, closer in spirit to Byzantine Mosaic than to a single-artist movement. This lesson draws its verified examples from funerary papyri in the "Book of the Dead" tradition, a portable medium sharing every recognition cue below with tomb wall painting.',
    recognitionCues: [
      'Composite ("twisted") perspective on the human figure: head, legs, and feet in profile, with eye and shoulders/torso frontal',
      'Hierarchical scale — the most important figure (a god, the pharaoh, the tomb owner) drawn noticeably larger than secondary figures',
      'Registers: the composition divided into stacked horizontal ground-line bands, each its own self-contained scene',
      'Flat, unmodeled color fill inside firm outlines, with no cast shadow and no atmospheric perspective',
      'Integrated hieroglyphic-style caption marks worked directly into the composition rather than added as a separate label',
      'Deities identifiable by attribute (animal heads, specific crowns, held symbols) within an otherwise human-scaled scene',
    ],
    artists: [
      {
        name: 'Anonymous Egyptian scribes and painters',
        years: 'c. 1390–950 BCE',
        note: "No papyrus or tomb painting in this tradition carries a signature in the modern sense, so this lesson credits the tradition to its anonymous scribes and painters — the same treatment already given to Byzantine Mosaic's anonymous Ravenna/Constantinople mosaicists and Fayum Mummy Portraits' anonymous encaustic painters.",
      },
    ],
    failureMode:
      'Likely collapses into a generic "hieroglyphics wallpaper" pattern that scatters symbol-like marks across the background without committing to the figure-level grammar, or drifts toward Fayum Mummy Portraits\' naturalistic modeling; lean on composite ("twisted") perspective on any human figure, stacked horizontal registers, hierarchical scale, and flat unmodeled color fill with firm outlines to keep the two Egypt-adjacent styles distinct',
    exampleWorks: [
      {
        workTitle: 'Book of the Dead for the Chantress of Amun, Nauny',
        artist: 'Anonymous Egyptian scribes and painters',
        artistDied: -1000,
        year: 'ca. 1050 BCE',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '30.3.31',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/548344',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/book-of-the-dead-for-the-chantress-of-amun-nauny-30-3-31.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Recompose this image in the manner of ancient Egyptian tomb and papyrus painting: redraw any human figures using composite perspective (profile head, legs, and feet; frontal eye and shoulders), organize the composition into stacked horizontal register bands with a ground line, use flat unmodeled color fill inside firm dark outlines with no cast shadow, scale the most significant figure noticeably larger than secondary figures, and add small integrated hieroglyphic-style caption marks near key figures',
    },
  },
  {
    slug: 'fauvism',
    name: 'Fauvism',
    era: 'c. 1904–1908',
    sortYear: 1904,
    previewImageSrc: '/images/academy/styles/fauvism.webp',
    region: 'France',
    keyIdeas:
      'Named in 1905 when a critic, startled by a room of canvases at the Salon d\'Automne, called their painters "les fauves" ("the wild beasts"), Fauvism pushed color entirely free of description: a face could be painted green, a tree trunk orange, a sky yellow-green, with no attempt to record local color at all. The lesson gives learners a clean contrast against `impressionism` and `post-impressionism` already in the curriculum: where those movements still built color from observed light, Fauvism used raw, unmixed, high-key pigment straight from the tube as an expressive end in itself, applied in loose, visibly brushy patches with heavy black or dark contour outlines holding the composition together. The movement was brief — most sources place its core years at 1904–1908, after which Matisse, Derain, and others each moved on to different concerns — but its central idea (that color can carry emotional force independent of naturalistic description) fed directly into Expressionism and much of the century that followed.',
    recognitionCues: [
      'Unmixed, high-key primary and secondary colors applied straight from the tube, with no attempt at naturalistic local color',
      'Loose, visibly brushy patches of paint rather than smooth blending',
      'Bold dark contour outlines (often black or deep blue) holding flat color areas together',
      'Warm and cool colors placed in direct, high-contrast juxtaposition rather than gradually blended',
      'Simplified, often flattened forms with minimal interior shading or modeling',
      'Everyday subjects — portraits, landscapes, harbor and window views — rendered with startling, non-naturalistic color rather than exotic or literary subject matter',
    ],
    artists: [
      {
        name: 'Henri Matisse',
        years: '1869–1954',
        note: "The movement's central figure; Fauvism's defining works (Woman with a Hat, The Green Line, Open Window, Collioure) all fall within the movement's brief pre-1930 core period, distinct from Matisse's later, larger post-1930 body of work.",
      },
      {
        name: 'André Derain',
        years: '1880–1954',
        note: "Painted alongside Matisse at Collioure in 1905, the summer usually credited with founding the style; his high-key harbor and London-bridge views are among the movement's most recognizable canvases.",
      },
      {
        name: 'Raoul Dufy',
        years: '1877–1953',
        note: "Joined the group after seeing Matisse's work at the 1905 Salon; later developed his own lighter, calligraphic variant, but his Fauvist-period harbor and beach scenes belong squarely to this lesson.",
      },
    ],
    failureMode:
      'Likely under-cooks toward a generic "colorful painting" filter that brightens the source palette without committing to unmixed, non-naturalistic color choices (a green face, an orange tree trunk); lean on the remix template\'s explicit instruction to break local color entirely rather than just increasing saturation, and keep the bold dark contour outlines that Fauvist paintings almost always use to hold flat color areas together',
    remix: {
      mode: 'prompt',
      template:
        'Recompose this image as an early Fauvist painting: unmixed, high-key non-naturalistic color applied in loose visible brushstrokes with no attempt at local color accuracy, bold dark contour outlines holding flat color areas together, warm and cool colors in direct high-contrast juxtaposition, and preserve the source composition and subject',
    },
  },
  {
    slug: 'tonalism',
    name: 'Tonalism',
    era: 'c. 1880–1915',
    sortYear: 1880,
    previewImageSrc: '/images/academy/styles/tonalism.webp',
    region: 'United States',
    keyIdeas:
      "Tonalism gives the curriculum a second American landscape movement alongside the Hudson River School, deliberately its counterpoint. Where Hudson River School painters used panoramic scale, fine botanical and geological detail, and theatrical light to make American land feel sublime and vast, Tonalist painters unified a scene under a single muted tone, blurred its edges toward near-silhouette, and set it at dawn, dusk, or in mist — making the same landscape tradition feel intimate, remembered, and quietly spiritual rather than spectacular. Many Tonalists, including George Inness, were influenced by Emanuel Swedenborg's mystical writings, treating a glowing dusk sky or a softened tree line as a visible trace of spiritual order beneath the physical landscape. The movement overlaps in time with American Impressionism but pushes in the opposite direction: away from broken, optically accurate color and toward thin, translucent glazes built up to a single dominant harmony.",
    recognitionCues: [
      'A muted, close-value palette dominated by a single unifying tone (soft gray, brown, blue, or green)',
      'Soft, blurred edges and diffused atmospheric light rather than crisp detail',
      'Twilight, dawn, dusk, or misty/overcast conditions as the default light',
      'Simplified, near-silhouette forms — trees, fences, and distant farmhouses reduced to dark shapes against a glowing sky',
      'Thin, translucent glazes of color built up in layers rather than opaque local color',
      'A quiet, contemplative, often melancholic mood; the landscape feels remembered rather than directly observed',
      'Minimal or no figures; when present, they are small and incidental, never the subject',
    ],
    artists: [
      {
        name: 'George Inness',
        years: '1825–1894',
        note: "The movement's central figure and this lesson's sole verified generation-style anchor; Dwight Tryon, Ralph Albert Blakelock, and J. Francis Murphy are also commonly cited Tonalists but have no rights-verified example work in this curriculum yet.",
      },
    ],
    failureMode:
      "Likely stays too crisp and multi-toned, reading as a slightly muted photo rather than a unified single-tone glaze; lean on the remix template's explicit 'single dominant harmony' and 'blurred edges toward near-silhouette' to push it past Hudson River School's sharp detail and toward Tonalism's soft, remembered quality.",
    exampleWorks: [
      {
        workTitle: 'Peace and Plenty',
        artist: 'George Inness',
        artistDied: 1894,
        year: '1865',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '94.27',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/11232',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/peace-and-plenty-94-27.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as an American Tonalist landscape: a muted, close-value palette unified by a single dominant tone (soft gray, brown, or blue-green), soft diffused atmospheric light at dawn or dusk, simplified near-silhouette forms with blurred edges, thin translucent glazes of color, and a quiet, contemplative, melancholic mood. Preserve the source composition and subject; avoid imitating any single named artwork.',
    },
  },
  {
    slug: 'barbizon-school',
    name: 'Barbizon School',
    era: 'c. 1830–1875',
    sortYear: 1830,
    previewImageSrc: '/images/academy/styles/barbizon-school.webp',
    region: 'France',
    keyIdeas:
      "The Barbizon School gives the curriculum its landscape hinge point: a group of painters who settled in and around the village of Barbizon on the edge of the Fontainebleau forest and insisted that the ordinary countryside, observed directly and without myth, allegory, or historical staging, was a worthy subject on its own terms. This directly rejected the academic hierarchy that ranked history and mythological painting above landscape. Barbizon painters worked outdoors from direct observation (though most still finished canvases in the studio), favored humble, unposed rural subjects — woodcutters, gleaners, cattle, a specific stretch of forest or farmland — over idealized or composite scenery, and painted in a muted, earthy, tonally unified palette. The school is the direct hinge between academic Neoclassical/Romantic landscape convention and Impressionism: Monet, Pissarro, and their circle studied and extended the Barbizon painters' plein-air practice, but pushed its muted tonal realism toward broken, optically accurate color. This curriculum's own Tonalism entry names Barbizon's muted palette and soft atmosphere as a direct influence on American Tonalism, and Realism shares Jean-François Millet, whose peasant subjects bridge both movements.",
    recognitionCues: [
      'A muted, earthy palette dominated by greens, browns, and greys rather than bright or idealized color',
      'Loose, visible, but controlled brushwork — looser than academic finish, tighter and more tonally unified than Impressionist broken color',
      'Soft, often overcast or late-day atmospheric light rather than dramatic theatrical illumination',
      'A specific, recognizable rural landscape (a named forest, village, or field) rather than an idealized or composite scene',
      'Humble, unposed rural labor and rural life — woodcutters, farmers, gleaners, livestock — treated with quiet dignity rather than sentimentality or spectacle',
      'An absence of mythological, historical, or religious staging; the landscape and its inhabitants are the entire subject',
    ],
    artists: [
      {
        name: 'Théodore Rousseau',
        years: '1812–1867',
        note: "The school's acknowledged leader; painted dense, specific studies of the Fontainebleau forest itself.",
      },
      {
        name: 'Jean-Baptiste-Camille Corot',
        years: '1796–1875',
        note: 'An early and frequent visitor to Fontainebleau whose soft, silvery-toned forest and river views bridge Barbizon and his own more independent later style.',
      },
      {
        name: 'Charles-François Daubigny',
        years: '1817–1878',
        note: "Extended Barbizon's plein-air practice along the rivers of northern France, working increasingly from a studio boat; among the most direct influences cited by the early Impressionists.",
      },
    ],
    failureMode:
      "Risks drifting toward Impressionism's broken, high-key color instead of Barbizon's more tonally unified, controlled brushwork, or toward an idealized academic finish instead of humble direct observation; lean on the remix template's explicit 'muted, earthy palette' and 'no academic or mythological staging' to keep the plain, dignified rural subject intact.",
    exampleWorks: [
      {
        workTitle: "A Woman Gathering Faggots at Ville-d'Avray",
        artist: 'Camille Corot',
        artistDied: 1875,
        year: 'ca. 1871–74',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '17.120.225',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/435990',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/a-woman-gathering-faggots-at-ville-davray-17-120-225.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Barbizon School landscape: a muted, earthy palette of greens, browns, and greys, loose but controlled brushwork, soft overcast or late-day atmospheric light, direct unidealized observation of a specific rural landscape, and a quiet, humble mood with no academic or mythological staging. Preserve the source composition and subject.',
    },
  },
  {
    slug: 'american-luminism',
    name: 'American Luminism',
    era: 'c. 1850–1875',
    sortYear: 1850,
    previewImageSrc: '/images/academy/styles/american-luminism.webp',
    region: 'United States',
    keyIdeas:
      "American Luminism gives the curriculum a third lens on the same 19th-century American landscape tradition already taught through the Hudson River School (§32) and Tonalism (§39), and is deliberately distinct from both. Where Hudson River School painters build panoramic, geologically detailed drama and Tonalism dissolves the scene into a single muted, blurred tone, Luminist painters do the opposite of both: they render an exceptionally calm, glassy stretch of water or sky in crisp, almost invisible brushwork, so smooth the paint surface itself seems to disappear, and study the precise, still gradation of natural light at a specific moment — dawn haze, a becalmed noon, or the last low sun before a storm — with near-scientific clarity rather than blur or theatrical intensity. Many Luminist canvases (Heade's marsh and thunderstorm scenes especially) hold a hushed, almost eerie stillness, often with a single sailboat or salt-marsh haystack as the only mark of human presence in an otherwise silent, mirror-flat expanse. The movement was not named or grouped by its own painters — 'Luminism' is a mid-20th-century art-historical label applied retroactively to a shared sensibility among painters working independently along the American coast and inland waterways.",
    recognitionCues: [
      'Smooth, meticulously blended brushwork with the paint surface itself nearly invisible — the opposite of Impressionist or Barbizon visible touch',
      'A perfectly calm, mirror-flat or glassy body of water or sky, often reflecting the sky’s exact gradation',
      'Precise, almost scientific rendering of a specific quality of light (dawn haze, still midday heat, or pre-storm low sun) rather than dramatic theatrical illumination',
      'A hushed, motionless, sometimes eerie stillness; time itself feels suspended',
      'Minimal, incidental human presence — a single small sailboat, a distant figure, or a salt-marsh haystack, never the focus',
      'Coastal, marsh, or inland-waterway subject matter far more often than mountain or forest interior scenes',
    ],
    artists: [
      {
        name: 'Fitz Henry Lane',
        years: '1804–1865',
        note: 'A Gloucester, Massachusetts marine painter and this lesson’s clearest generation-style anchor; his harbor and coastal scenes define the glassy-water, still-light Luminist signature.',
      },
      {
        name: 'Martin Johnson Heade',
        years: '1819–1904',
        note: 'Known for salt-marsh haystack scenes and pre-storm coastal light studies with an unusually hushed, still-air quality even at the edge of a storm.',
      },
      {
        name: 'John Frederick Kensett',
        years: '1816–1872',
        note: 'Painted calm inland lake and shoreline scenes (Lake George, Newport) with the same smooth, light-precise handling.',
      },
    ],
    failureMode:
      "Easily keeps visible brushwork or a dramatic sky like Hudson River School, or blurs into Tonalism's soft near-silhouette mood, instead of Luminism's own smooth, almost-invisible finish and mirror-still water; lean on the remix template's explicit 'extremely smooth, near-invisible brushwork' and 'hushed and motionless' phrasing to hold the distinction between all three American landscape lessons.",
    exampleWorks: [
      {
        workTitle: 'Stage Fort across Gloucester Harbor',
        artist: 'Fitz Henry Lane',
        artistDied: 1865,
        year: '1862',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '1978.203',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/11396',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/stage-fort-across-gloucester-harbor-1978-203.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image in the American Luminist style: extremely smooth, near-invisible brushwork, a perfectly calm glassy body of water or sky reflecting a precise gradation of still natural light (dawn haze, quiet midday, or pre-storm low sun), a hushed and motionless mood, and minimal incidental human presence. Preserve the source composition and subject.',
    },
  },
  {
    slug: 'heidelberg-school',
    name: 'Heidelberg School',
    era: 'c. 1885–1900',
    sortYear: 1885,
    previewImageSrc: '/images/academy/styles/heidelberg-school.webp',
    region: 'Australia',
    keyIdeas:
      'The Heidelberg School gives the curriculum its first entry from Australia and Oceania — a group of painters, based for a time in artists\' camps around Box Hill and Eaglemont near the Melbourne suburb of Heidelberg, who applied plein-air Impressionist-adjacent technique to a landscape and light no European movement had painted: the harsh, high-key glare of the Australian bush and outback. Where French Impressionism built its palette from the soft, temperate light of the Île-de-France, and the Barbizon School worked in muted greens and greys under overcast northern skies, Heidelberg School painters confronted a hotter, drier, brighter light and answered it with a distinctive "blue and gold" palette — saturated cobalt sky and sun-bleached ochre earth — applied in broad, confident strokes laid down directly from observation, often on small cigar-box-lid-sized panels (the famous 1889 "9 by 5 Impression Exhibition" takes its name from the standard panel size, 9 by 5 inches). The school also gave Australian painting its first sustained attempt at a national visual identity: sheep stations, drought-cracked paddocks, bushfires, and itinerant rural laborers, treated not as picturesque colonial scenery but as the ordinary, unglamorized subject of a new country defining itself in paint — a project with real ideological weight (a settler-nationalist vision of the land that had little room for Aboriginal presence or dispossession), named directly rather than left implicit, the same treatment this curriculum gives the Hudson River School\'s Manifest Destiny undertone.',
    recognitionCues: [
      'A bright, high-key "blue and gold" palette — saturated blue sky paired with sun-bleached ochre, olive, and gold earth tones — capturing harsh direct Australian sunlight rather than soft or overcast light',
      "Broad, confident, visible brushwork applied directly from life outdoors, looser than academic finish but built from continuous descriptive strokes rather than Impressionism's broken optical dabs or Pointillism's dots",
      'A hazy, heat-shimmer atmospheric quality suggesting dry heat rather than cool or misty air',
      'Australian bush, sheep-station, or rural-labor subject matter — shearing sheds, drought-stressed paddocks, bushfires, swagmen — treated with plain, unsentimental dignity rather than picturesque exoticism',
      'A matter-of-fact, unforced mood: dramatic in scale or subject sometimes, but rendered with directness rather than Romantic theatricality',
      'Occasionally a small, squarish panel format (a legacy of the movement\'s "9 by 5" plein-air sketches), though many major canvases are large-scale studio-finished works built from such sketches',
    ],
    artists: [
      {
        name: 'Tom Roberts',
        years: '1856–1931',
        note: "English-born, Melbourne-based painter and the school's organizing figure; his large narrative bush-labor scenes are this lesson's clearest generation-style anchor for figure-and-landscape composition.",
      },
      {
        name: 'Arthur Streeton',
        years: '1867–1943',
        note: 'Painted the movement\'s most characteristic high-key "blue and gold" summer landscapes, working alongside Roberts at the Eaglemont artists\' camp.',
      },
      {
        name: 'Frederick McCubbin',
        years: '1855–1917',
        note: 'Brought a narrative, often melancholic sensibility to bush-settler subjects, frequently in a looser, more textured brushwork than Roberts or Streeton.',
      },
    ],
    failureMode:
      "Can collapse into generic French Impressionist color and brushwork, losing the specific high-key blue-and-gold Australian light and dusty bush subject; lean on the remix template's explicit 'harsh direct Australian sunlight' and 'dusty ochre-and-olive bush' phrasing, and discuss the movement's settler-nationalist framing honestly rather than teaching the light alone — the same treatment this curriculum gives Hudson River School's Manifest Destiny undertone.",
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image in the Heidelberg School style: broad, confident plein-air brushwork applied directly from life, a bright high-key palette of blue and gold capturing harsh direct Australian sunlight, a dusty ochre-and-olive bush or rural-labor scene with a hazy heat-shimmer atmosphere, and an unsentimental, matter-of-fact mood. Preserve the source composition and subject.',
    },
  },
  {
    slug: 'spanish-golden-age',
    name: 'Spanish Golden Age Painting',
    era: 'c. 1620–1680',
    sortYear: 1620,
    previewImageSrc: '/images/academy/styles/spanish-golden-age.webp',
    region: 'Spain',
    keyIdeas:
      "Spanish Golden Age painting (Siglo de Oro) shares the Baroque's chiaroscuro and psychological intensity already taught in this curriculum, but pulls toward a different pole entirely. Where Italian Baroque leans into theatrical motion and Dutch Baroque turns that same light toward cozy domestic interiors, Spanish Golden Age painters used tenebrism to freeze a single suspended, almost sculptural moment: figures and objects modeled with an austere, unblinking clarity against a plain dark or neutral ground, with little movement, minimal ornament, and an intense devotional or psychological gravity. Favored subjects were saints in solitary contemplation, humble monastic scenes, royal portraits stripped of overt flattery, and devotional images painted with still-life precision. Painted mostly for Spanish churches, monasteries, and the royal court during Spain's political decline but cultural high point, the movement's sobriety and psychological directness later drew Édouard Manet and 19th-century Realists back to Madrid to study Velázquez directly.",
    recognitionCues: [
      "Deep, near-black or plain neutral backgrounds lit by a single strong source (tenebrism), quieter and more static than Italian Baroque's swirling theatrical drama",
      'Sculptural, almost frozen clarity of form — figures and still-life objects rendered with the same careful, unblinking attention regardless of subject',
      'A restrained, muted palette (umber, ochre, black, occasional deep red or white) rather than bright saturated color',
      'Solitary or minimally-peopled compositions — a single saint, monk, or sitter in quiet contemplation rather than crowded narrative scenes',
      'Devotional or psychologically direct subject matter: contemplative saints, humble monastic life, unflattering royal portraiture, or a young Madonna at ordinary domestic work',
      "Confident, visible brushwork that can look loose up close but resolves into photographic precision at a distance (Velázquez's signature trait)",
    ],
    artists: [
      {
        name: 'Diego Velázquez',
        years: '1599–1660',
        note: 'Court painter to Philip IV; this lesson\'s clearest generation-style anchor for the "loose up close, photographic from a distance" technique that later fascinated Manet and the Impressionists.',
      },
      {
        name: 'Francisco de Zurbarán',
        years: '1598–1664',
        note: 'Painter of solitary monks, saints, and still-lifes with an almost sculptural stillness against near-black grounds; sometimes called "the Spanish Caravaggio."',
      },
      {
        name: 'Bartolomé Esteban Murillo',
        years: '1617–1682',
        note: "Softened the mode's austerity in the second half of the century with tender, warmly lit devotional scenes and genre paintings of Seville's street children.",
      },
    ],
    failureMode:
      "Risks tipping into Italian Baroque's swirling theatrical motion or Dutch Baroque's cozy domestic warmth instead of Spanish Golden Age's frozen, austere gravity; lean on the remix template's explicit 'single strong light source against a near-black ground' and 'minimal ornament' to keep the stillness and restraint.",
    exampleWorks: [
      {
        workTitle: 'Juan de Pareja',
        artist: 'Diego Velázquez',
        artistDied: 1660,
        year: '1650',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '1971.86',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/437869',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc: '/images/academy/examples/juan-de-pareja-1971-86.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image in the Spanish Golden Age style: a single strong light source against a near-black or plain neutral ground (tenebrism), a restrained palette of umber, ochre, and black, sculptural clarity of form, and a quiet, solemn, devotional mood with minimal ornament. Preserve the source composition and subject.',
    },
  },
  {
    slug: 'mannerism',
    name: 'Mannerism',
    era: 'c. 1520–1580',
    sortYear: 1520,
    previewImageSrc: '/images/academy/styles/mannerism.webp',
    region: 'Italy',
    keyIdeas:
      "Mannerism grew directly out of the High Renaissance but deliberately pushed past its balance and naturalism into elegant artifice. Where Leonardo, Raphael, and Botticelli sought anatomical correctness and calm, stable compositions, Mannerist painters stretched the figure into impossibly long limbs and swan necks, twisted poses into serpentine, off-balance spirals, and cooled the palette into acidic, jewel-like color harmonies that read as sophisticated rather than natural. Faces became smooth, porcelain-cool, and faintly emotionally distant — beautiful but unreadable, a style built for court sophistication rather than devotional warmth. Working mostly for the Medici court in Florence and the papal court in Rome, Mannerist painters treated technical virtuosity as its own subject: an impossibly long neck or elongated fingers weren't mistakes, they were the point.",
    recognitionCues: [
      'Impossibly elongated limbs, necks, and fingers — figures stretched past anatomical correctness on purpose',
      "Twisting, off-balance poses (the figura serpentinata) rather than the Renaissance's stable, centered stances",
      'Smooth, cool, porcelain-like skin with a composed, faintly aloof expression — beautiful rather than warm or devotional',
      "A restrained, acidic jewel-toned palette (cool pinks, acid greens, deep blues) rather than the Renaissance's warm earth tones",
      "Shallow, ambiguous, or compressed pictorial space — a plain dark ground or a crowded stage rather than the Renaissance's deep, legible perspective",
      'Technical virtuosity treated as the subject itself: the distortion reads as sophistication, not error',
    ],
    artists: [
      {
        name: 'Agnolo Bronzino',
        years: '1503–1572',
        note: "Medici court portraitist; this lesson's clearest generation-style anchor for cool, smooth, emotionally composed court portraiture.",
      },
      {
        name: 'Parmigianino',
        years: '1503–1540',
        note: "Pushed the movement's elongation furthest (his Madonna with the Long Neck is its most-cited example); this entry draws instead on one of his figure drawings.",
      },
      {
        name: 'Perino del Vaga',
        years: '1501–1547',
        note: "A leading pupil of Raphael who carried Roman Mannerism's crowded, elegant figure groups into large-scale religious painting.",
      },
    ],
    failureMode:
      "Likely under-cooks toward a generic High Renaissance portrait instead of committing to Mannerism's deliberate elongation and artifice; lean on the remix template's explicit 'elongated figures in artificial, twisting poses' and 'cool porcelain-smooth skin' phrasing to push past Renaissance naturalism rather than settle for it.",
    exampleWorks: [
      {
        workTitle: 'Portrait of a Young Man',
        artist: 'Agnolo Bronzino',
        artistDied: 1572,
        year: '1530s',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '29.100.16',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/435802',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/portrait-of-a-young-man-29-100-16.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as an Italian Mannerist painting: elegant, elongated figures in artificial, twisting poses, cool porcelain-smooth skin, a restrained jewel-toned palette against a plain or ambiguous dark ground, and a composed, faintly aloof emotional temperature rather than Baroque drama. Preserve the source composition and subject.',
    },
  },
  {
    slug: 'ethiopian-icon-painting',
    name: 'Ethiopian Icon Painting',
    era: 'c. 1450–1700',
    sortYear: 1450,
    previewImageSrc: '/images/academy/styles/ethiopian-icon-painting.webp',
    region: 'Ethiopia',
    keyIdeas:
      'Ethiopian icon painting is a continuous devotional tradition of the Ethiopian Orthodox Tewahedo Church, painted in tempera on gesso-primed wood panels, most often as small, portable folding diptychs and triptychs meant to travel with a wealthy patron or hang in a church. The tradition draws on Byzantine and Coptic Egyptian pictorial conventions already familiar from Byzantine Mosaic — hieratic frontality, flat symbolic color, hierarchical scale — but develops its own unmistakable visual grammar: wide, direct, unblinking eyes that art historians describe as a deliberate "reversal gaze," meant to make the viewer feel watched by the sacred figure rather than the reverse, set within a warm, saturated palette built from red ochre, gold, and deep blue-green (blue conventionally marking the Virgin Mary, gold marking Christ). Panels fold shut to protect the painted interior in transit and open to reveal one or more scenes — most often the Virgin and Child flanked by archangels, saints on horseback (Saint George is the most frequently repeated figure), or narrative scenes from the life of Christ arranged in register-like compartments. Almost nothing is documented about individual painters before the 15th century; the one meaningful exception is Fre Seyon, active in the mid-15th century, the earliest Ethiopian icon painter identifiable by name and the presumed source of a recognizable workshop style that outlived him by generations.',
    recognitionCues: [
      "Large, wide-open, almond-shaped eyes gazing directly and frontally at the viewer on every major figure — the tradition's single most distinctive trait",
      'Flat, unmodeled fields of color bounded by firm black contour outlines — no cast shadow, no atmospheric blending',
      'A warm, saturated palette dominated by red ochre, gold, and deep blue-green, with blue conventionally marking the Virgin Mary and gold marking Christ',
      'Strict frontal symmetry and hierarchical scale: the most sacred figure (Christ or the Virgin) largest and centered, secondary saints and archangels smaller and arranged around them',
      'Compact, portable multi-panel folding formats (diptych or triptych) on wood, sized to close shut and travel',
      'Mounted saints, especially Saint George spearing a dragon, rendered with simplified, tapering horse legs and decorative harness patterning rather than anatomical naturalism',
    ],
    artists: [
      {
        name: 'Fre Seyon',
        years: 'active mid-15th century',
        note: 'The earliest Ethiopian icon painter identifiable by name and the presumed source of a recognizable workshop style; named for historical context only, since this lesson\'s example works are catalogued as "Follower of Fre Seyon" or anonymous rather than by his own verified hand.',
      },
    ],
    failureMode:
      'Can collapse into a generic Byzantine Mosaic look since both share hieratic frontality and flat symbolic color; lean on the remix template\'s explicit wide-open frontal "reversal gaze" eyes and the red-ochre/gold/blue-green palette to keep Ethiopian icon painting visually distinct from its Byzantine source tradition.',
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as an Ethiopian Solomonic-era icon: flat, unmodeled fields of warm red ochre, gold, and deep blue-green bounded by firm black contour outlines, large wide-open frontal eyes gazing directly at the viewer, hierarchical scale with the most sacred figure largest and centered, simplified linear drapery folds, and a plain or minimally patterned background. Preserve the source composition and subject.',
    },
  },
  {
    slug: 'rinpa-school',
    name: 'Rinpa School',
    era: 'early 1600s–mid-1800s',
    sortYear: 1600,
    previewImageSrc: '/images/academy/styles/rinpa-school.webp',
    region: 'Japan',
    keyIdeas:
      "Rinpa is a decorative painting and design tradition built around folding screens, hanging scrolls, fans, lacquer, ceramics, and textiles — not another Ukiyo-e lesson. Ukiyo-e is a print culture of actors, courtesans, travel, and reproducible woodblock color; Rinpa is brushed, one-of-a-kind, and organized around the collision of extreme flatness with close natural observation. Flowers, grasses, water, and seasonal motifs become bold arrangements of silhouette, rhythm, and empty space, set against broad grounds of gold or silver leaf, with pools of wet ink and color allowed to bloom into soft-edged forms beside crisp contour or metallic ground. The tradition is also notable for how it moved through time: rather than a single continuous workshop lineage, it passed by deliberate revival and admiration across three generations who never directly studied under one another — Ogata Kōrin looked back to earlier Kyoto decorative masters; a century later, Sakai Hōitsu rediscovered and codified Kōrin's vocabulary in Edo; and Hōitsu's own pupil Suzuki Kiitsu carried that revival into a sharper, more graphic nineteenth-century form.",
    recognitionCues: [
      'Large gold- or silver-leaf grounds that remove ordinary landscape depth and unify the composition as flat decorative surface',
      'Asymmetrical compositions with major motifs cropped by the screen edge or scroll format, rather than centered or fully contained',
      'Broad, simplified silhouettes paired with a few sharply observed botanical details — flatness and close natural observation held together at once',
      'Repeated flowers, leaves, waves, or grasses arranged as visual rhythm rather than naturalistic, evenly-lit space',
      'Pools of wet ink and color ("tarashikomi") allowed to bloom into soft-edged forms, often set directly beside crisp contour line or metallic ground',
      'Strong, deliberate use of empty space, with subjects floating against an unmodeled field instead of a described setting',
    ],
    artists: [
      {
        name: 'Ogata Kōrin',
        years: '1658–1716',
        note: "The movement's central namesake figure; this lesson's generation-style anchor for combining highly stylized natural elements with formal Chinese-style ink training.",
      },
      {
        name: 'Sakai Hōitsu',
        years: '1761–1828',
        note: "Led the later Edo Rinpa revival, rediscovering and codifying Kōrin's vocabulary in seasonal, literary compositions.",
      },
      {
        name: 'Suzuki Kiitsu',
        years: '1796–1858',
        note: "Hōitsu's leading pupil, whose sharper, more graphic botanical forms mark the tradition's latest phase taught here.",
      },
    ],
    failureMode:
      "Likely collapses into a generic Ukiyo-e print look or a flat gold-leaf decorative filter, skipping the tarashikomi pooled-ink technique that makes Rinpa distinct; lean on the remix template's explicit 'pooled ink-and-color edges' and 'asymmetrical cropped arrangement' phrasing to keep the brushed, one-of-a-kind quality Ukiyo-e's woodblock printmaking doesn't have.",
    exampleWorks: [
      {
        workTitle: 'Irises at Yatsuhashi (Eight Bridges)',
        artist: 'Ogata Kōrin',
        artistDied: 1716,
        year: 'after 1709',
        collection: 'The Metropolitan Museum of Art',
        accessionId: '53.7.1, .2',
        sourceUrl: 'https://www.metmuseum.org/art/collection/search/39664',
        license: 'CC0',
        licenseTermsUrl: 'https://www.metmuseum.org/policies/image-resources',
        imageSrc:
          '/images/academy/examples/irises-at-yatsuhashi-eight-bridges-53-7-1-2.jpg',
      },
    ],
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Rinpa-school folding-screen composition: a broad gold- or silver-leaf ground with no ordinary horizon, an asymmetrical cropped arrangement of seasonal flowers, grasses, or water, bold simplified silhouettes mixed with a few precise botanical details, pooled ink-and-color edges, rhythmic repetition, and generous empty space in place of realistic depth. Preserve the source composition and subject.',
    },
  },
  {
    slug: 'rajput-painting',
    name: 'Rajput Painting',
    era: 'c. 1600–1850',
    sortYear: 1600,
    previewImageSrc: '/images/academy/styles/rajput-painting.webp',
    region: 'India',
    keyIdeas:
      "Where this curriculum's Mughal Miniature lesson tracks an imperial atelier moving toward naturalistic modeling and atmospheric recession, Rajput painting is what the smaller Hindu courts of Rajasthan — Mewar, Bikaner, Kishangarh, Bundi, Kota — and related Central Indian courts such as Malwa were doing at largely the same time, and it stayed closer to flat, intensely saturated color and bold graphic outline throughout its history rather than converging on Mughal naturalism. Subject matter runs devotional and lyrical rather than dynastic-narrative: episodes from Krishna's life (especially his courtship of Radha), ragamala series that paint a musical mode as a scene and mood rather than notation, court portraiture, and hunting or courtly-life scenes. Grounds are built from flat fields of saturated red, yellow, and blue rather than Mughal-style atmospheric gradation; figures are drawn with a confident continuous outline and large, almond-shaped eyes. Ragamala pages carry the additional layer of translating sound and emotion into fixed pictorial convention — a specific color palette, landscape, and pose for each named musical mode.",
    recognitionCues: [
      'Flat fields of intensely saturated color (deep red, yellow ochre, ultramarine) rather than Mughal-style atmospheric shading or naturalistic gradation',
      'Confident, continuous outline defining figures and drapery, with large almond-shaped eyes rendered in profile or three-quarter view',
      'Devotional and lyrical subjects — Krishna and Radha, ragamala musical-mode scenes, court portraits — rather than Mughal dynastic chronicle narrative',
      'Architecture and landscape flattened into decorative pattern (tiled pavilions, stylized trees and water) rather than receding in depth',
      'Gold used more sparingly than Persian miniature, often limited to jewelry, thrones, or architectural trim against a flat color ground',
      "A plain or single-color background field is common, in contrast to Mughal miniature's dense, precisely rendered decorative borders",
    ],
    artists: [
      {
        name: 'Nihal Chand',
        years: 'fl. c. 1735–1757',
        note: 'The Kishangarh school\'s most celebrated later painter, credited with the "Bani Thani" portrait type; named for historical context only, since this lesson\'s Kishangarh example work predates his documented activity.',
      },
    ],
    failureMode:
      "Risks drifting toward Mughal Miniature's naturalistic modeling and atmospheric depth instead of Rajput's flat saturated color fields; lean on the remix template's explicit 'flat fields of intensely saturated red, yellow, and blue' and 'architecture and landscape flattened into decorative pattern' phrasing to keep the two Indian court traditions visually distinct.",
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Rajput court painting: flat fields of intensely saturated red, yellow, and blue, a confident continuous outline with large almond-shaped eyes, architecture and landscape flattened into decorative pattern rather than receding in depth, gold used sparingly for jewelry or trim only, and a plain or single-color background. Preserve the source composition and subject.',
    },
  },
]

export const academyStylesBySlug: Record<string, AcademyStyle> = Object.assign(
  Object.create(null),
  Object.fromEntries(academyStyles.map((style) => [style.slug, style])),
)

export const academyTimeline: AcademyStyle[] = [...academyStyles].sort(
  (a, b) => a.sortYear - b.sortYear,
)
