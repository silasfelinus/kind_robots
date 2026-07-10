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
    remix: {
      mode: 'prompt',
      template:
        'Convert this image into a medieval illuminated manuscript illustration: flat gold leaf accents, lapis blue and vermilion mineral pigments, ornate decorated border with knotwork, parchment texture',
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
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as an Italian Renaissance oil painting: balanced classical composition, soft sfumato shading, warm earth-tone glazes, subtle linear perspective depth',
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
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Baroque oil painting with dramatic chiaroscuro: a single strong light source, deep near-black shadows, rich warm tones, theatrical composition',
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
    remix: {
      mode: 'prompt',
      template:
        'Repaint this image as a Post-Impressionist painting in the manner of Van Gogh: swirling directional impasto brushstrokes, intense emotional color, bold outlines, thick visible paint texture',
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
    remix: {
      mode: 'prompt',
      template:
        'Convert this image into a De Stijl composition: bold black grid lines on white, rectangles of pure primary red yellow and blue, strict horizontal and vertical geometry, balanced asymmetry',
    },
  },
]

export const academyStylesBySlug: Record<string, AcademyStyle> =
  Object.fromEntries(academyStyles.map((style) => [style.slug, style]))

export const academyTimeline: AcademyStyle[] = [...academyStyles].sort(
  (a, b) => a.sortYear - b.sortYear,
)
