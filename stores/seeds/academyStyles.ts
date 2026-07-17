// /stores/seeds/academyStyles.ts
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

export interface AcademyArtist {
  name: string
  years: string
  note: string
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
    slug: 'gothic',
    name: 'Gothic Panel Painting',
    era: 'c. 1200–1450',
    sortYear: 1200,
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
    slug: 'northern-renaissance',
    name: 'Northern Renaissance',
    era: 'c. 1420–1570',
    sortYear: 1420,
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
    slug: 'expressionism',
    name: 'Expressionism',
    era: 'c. 1905–1930',
    sortYear: 1905,
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
    slug: 'de-stijl',
    name: 'De Stijl',
    era: 'c. 1917–1931',
    sortYear: 1917,
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
]

export const academyStylesBySlug: Record<string, AcademyStyle> =
  Object.fromEntries(academyStyles.map((style) => [style.slug, style]))

export const academyTimeline: AcademyStyle[] = [...academyStyles].sort(
  (a, b) => a.sortYear - b.sortYear,
)
