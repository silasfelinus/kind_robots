import type { StudentId } from './rules'

// One physical description per person, reused word for word in every art
// prompt they appear in, so Krea paints the same face across a run's
// portraits, encounters and endings. `look` never changes; `student` is the
// everyday academy clothing (hero and villain forms bring their own gear).
// Literal, visible detail only: Krea paints the nouns it is given.

export type CastLook = { name: string; look: string; student: string }

export const CAST_LOOKS: Record<string, CastLook> = {
  'accident-fire': {
    name: 'Dez Okafor',
    look: 'a broad-shouldered young man with dark brown skin, short black curls and a faint orange glow under the skin of his forearms',
    student:
      'a worn navy academy coat over a white line-cook shirt and thick quilted oven mitts',
  },
  'accident-air': {
    name: 'Pip Marchetti',
    look: 'a small wiry young woman with light olive skin, a windblown dark brown pixie cut and a pale branching lightning scar down her left arm',
    student:
      'a faded red skydiving jumpsuit tied at the waist over a grey academy hoodie',
  },
  'accident-earth': {
    name: 'Tug Brannigan',
    look: 'a stocky barrel-chested young man with ruddy pale skin, a shaved head, a thick red beard and grey granite patches across his knuckles and cheekbones',
    student:
      'a mud-stained orange tunnel-crew vest over a navy academy sweatshirt',
  },
  'accident-water': {
    name: 'Marisol Reyes',
    look: 'a slim young woman with warm tan skin, long black hair that is always dripping wet and faint blue ripples of gill skin along her throat',
    student: 'a navy academy blazer over a damp turquoise swim top',
  },
  'accident-discipline': {
    name: 'Kenji Watanabe-Cole',
    look: 'a lean young man with light brown skin, a short black topknot and a small pale starburst scar on his left temple',
    student:
      'a navy kendo hakama and white practice jacket under an academy windbreaker',
  },
  'accident-genius': {
    name: 'Otto Fairweather',
    look: 'a tall gangly young woman with freckled pale skin, a frizzy copper-red bun stuck through with pencils and faint green stains on her fingertips',
    student:
      'an oversized lab coat with scorched cuffs over a mustard academy sweater',
  },
  'accident-birthright': {
    name: 'Gus Valcourt-Hale',
    look: 'a tall slim young man with pale skin, slicked-back blond hair and a narrow face',
    student:
      'a pressed navy academy blazer, with an old faded crimson-and-gold cape fused to his back at the shoulders and trailing to the floor',
  },
  'accident-social': {
    name: 'Fen Halloran',
    look: 'a lanky young adult with pale freckled skin, a shaggy dyed-green mullet and silver rings in both ears',
    student:
      'a patched denim jacket covered in safety pins over an academy t-shirt, with a battered acoustic guitar on a strap',
  },
  'mutant-fire': {
    name: 'Ruby Szabo',
    look: 'a petite young woman with fair skin, soot-smudged freckles and short ember-red hair with small gold flames flickering at the tips',
    student:
      'a charcoal fire-resistant academy jumpsuit and a red bandana around her neck',
  },
  'mutant-air': {
    name: 'Corvin Ashe',
    look: 'a tall thin young man with light brown skin, black curls, rows of dark grey feathers along both forearms and large folded dark grey wings rising from his shoulder blades',
    student:
      'an oversized black overcoat slit at the back for his wings and a knitted academy scarf',
  },
  'mutant-earth': {
    name: 'Hattie Nkemelu',
    look: 'a seven-and-a-half-foot-tall broad young woman with deep brown skin, close-cropped natural hair and smooth slate-grey mineral plates along her cheekbones, shoulders and forearms',
    student:
      'a custom-tailored oversized academy blazer and wide grey trousers',
  },
  'mutant-water': {
    name: 'Ilya Sorokin-Baptiste',
    look: 'a lean young man with pale olive skin, short wet sandy curls, gill slits behind both ears and webbed fingers',
    student: 'a dripping dark blue wetsuit under an unbuttoned academy blazer',
  },
  'mutant-discipline': {
    name: 'Asha Venkataraman',
    look: 'a poised young woman with medium brown skin, a long black braid and a second pair of slender arms below her first',
    student:
      'a fitted maroon dance top, loose black training trousers and small brass bells at her ankles',
  },
  'mutant-genius': {
    name: 'Theo Lindqvist',
    look: 'a twenty-year-old with pale skin, short dark hair and a subtle crystalline growth behind the temples',
    student: 'a loose teal cardigan over a grey academy shirt',
  },
  'mutant-birthright': {
    name: 'Seraphine Delacroix-Moon',
    look: 'a statuesque young woman with dark brown skin, a high crown of silver-white braids and large white feathered wings folded at her back',
    student:
      'a cream academy blazer with gold buttons over a white high-collared shirt',
  },
  'mutant-social': {
    name: 'Lucky Mbatha',
    look: 'a handsome young man with deep brown skin, a neat high-top fade, a wide easy smile and a small beige adhesive patch on the side of his neck',
    student: 'a bright yellow bomber jacket over an academy polo shirt',
  },
  'tech-fire': {
    name: 'Vee Castellanos',
    look: 'a muscular young woman with light brown skin, an undercut of black hair in a short ponytail and old burn scars across her knuckles',
    student:
      'a scorched leather welding apron over a black academy tank top, with a heavy homemade steel gauntlet with glowing orange vents on her right arm',
  },
  'tech-air': {
    name: 'Jun-ho Park',
    look: 'a slim young man with light skin, spiky black hair dyed blue at the tips and racing goggles pushed up on his forehead',
    student:
      'a sleek charcoal wingsuit with small fans at the wrists and ankles under an open academy hoodie',
  },
  'tech-earth': {
    name: 'Delphine Okonkwo',
    look: 'a sturdy young woman with dark brown skin, short locs tied back with a bandana and a small scar through one eyebrow',
    student:
      'grease-stained yellow coveralls, steel-toed boots and a battered white hard hat',
  },
  'tech-water': {
    name: 'Nalani Kahale',
    look: 'a strong young woman with brown skin and long wavy black hair pulled into a high ponytail',
    student:
      'a bulky rebuilt orange-and-white rescue diving suit open to the waist over an academy t-shirt',
  },
  'tech-discipline': {
    name: 'Marcus Fairbanks',
    look: 'an athletic young man with dark brown skin, a shaved head, a trimmed beard and two carbon-fiber running-blade prosthetics below the knee',
    student: 'a red academy track jacket and black running shorts',
  },
  'tech-genius': {
    name: 'Lionel Marsh',
    look: 'a lean adult human inventor with light brown skin, dark wavy hair, a sharp curious face, oversized brass safety goggles and a green coat covered in frog-footed mechanical sketches',
    student:
      'an emerald academy lab coat over a charcoal vest, heavy brass goggles and a spring-loaded green F.R.O.G. leap harness strapped to his boots',
  },
  'tech-birthright': {
    name: 'Bart Sterling',
    look: 'a tall square-jawed young man with pale skin, perfectly styled chestnut hair and a tight anxious smile',
    student: 'a tailored navy academy blazer over a silver armor undersuit',
  },
  'tech-social': {
    name: 'Dani Mercado',
    look: 'a slender young adult with tan skin, a sleek black bob with bleached front streaks and a septum ring',
    student:
      'chunky white livestream glasses with a tiny red recording light and an oversized pink windbreaker over an academy shirt',
  },
  'magic-fire': {
    name: 'Hollis Graymalkin',
    look: 'a plump young woman with pale skin, rosy cheeks and a long auburn braid streaked with grey',
    student:
      'a wax-spattered brown shop apron over a moss-green academy cardigan',
  },
  'magic-air': {
    name: 'Ambrose Fairlie',
    look: 'a slight young man with pale skin, wavy light-brown hair and large grey eyes',
    student: 'a white choir collar under a grey academy cardigan',
  },
  'magic-earth': {
    name: 'Mavis Mayhew',
    look: 'a powerful elderly woman with rich brown skin, deep smile lines, silver hair braided into two high buns and a formidable grin',
    student:
      'a voluminous patchwork shawl over a red cardigan, sturdy lace-up boots, a tool belt of luminous rune needles and yellow school-bus keys',
  },
  'magic-water': {
    name: 'Caspian Lowe',
    look: 'a lanky young man with tan skin, a pencil mustache, slicked-back black hair and silver rings on every finger',
    student:
      'a shabby maroon velvet magician waistcoat over a white academy shirt',
  },
  'magic-discipline': {
    name: 'Ada Ibekwe',
    look: 'a tall lean young woman with deep brown skin, a shaved head and a row of small iron rings along one ear',
    student:
      'a faded saffron mountain-order robe belted with rope under an academy jacket, and leather sandals',
  },
  'magic-genius': {
    name: 'Lucan Ferro',
    look: 'a thin young man with olive skin, black hair falling into his eyes, wire-rim glasses and ink-stained fingers',
    student: 'a rumpled tweed jacket over an academy sweater',
  },
  'magic-birthright': {
    name: 'Isadora Blackwood',
    look: 'a pale young woman with long straight black hair, a sharp face, dark plum lipstick and a silver crescent-moon pendant',
    student:
      'a long black academy coat over a deep plum dress and fingerless lace gloves',
  },
  'magic-social': {
    name: 'Remy Lafleur',
    look: 'a charming young man with medium brown skin, a thin mustache, a neat black pompadour and one gold tooth',
    student:
      'a glittering emerald sequined cabaret jacket over a white academy shirt',
  },
  'alien-fire': {
    name: 'Ixi Solenne',
    look: 'a slender young alien woman with luminous golden skin that glows brighter in sunlight, short white-gold hair and solid amber eyes',
    student: 'a faded academy hoodie over a plain grey refugee jumpsuit',
  },
  'alien-air': {
    name: 'Quillon Vey',
    look: 'a tall willowy alien with pale lilac translucent skin, a drifting cloud of white vapor in place of hair and long fine fingers, their feet floating a hand above the floor',
    student: 'flowing pale blue diplomatic sashes over an academy blazer',
  },
  'alien-earth': {
    name: 'Kesh Tarrow',
    look: 'a broad heavy alien man with a body of dark grey crystalline stone streaked with purple quartz veins and glowing violet eyes',
    student:
      'an extra-large academy sweatshirt stretched over his stone shoulders',
  },
  'alien-water': {
    name: 'Thessaly Nauren',
    look: 'a graceful young alien woman with glossy blue-green skin, small dark fins in place of ears, long trailing kelp-green hair and large black eyes',
    student: 'a shimmering silver wrap dress under an academy cardigan',
  },
  'alien-discipline': {
    name: 'Zuzu',
    look: 'a short stocky adult koala assassin with round fluffy grey ears, a charcoal button nose, alert amber eyes, compact paws and a weatherworn silhouette',
    student:
      'a rust-red weird-west desert duster over layered dark leather sword harnesses and a battered katana at his side',
  },
  'alien-genius': {
    name: 'Oorin Faal',
    look: 'a small slender alien man with smooth pale blue skin, an elongated hairless skull, four long fingers on each hand and large silver eyes',
    student: 'a white high-collared tunic under an academy lab coat',
  },
  'alien-birthright': {
    name: 'Ysolde Quarren',
    look: 'a tall young woman with pale silvery skin, long platinum hair, violet eyes and a shimmering band of tiny scales across her forehead',
    student:
      'a thrift-store denim jacket over an academy shirt and chipped black nail polish',
  },
  'alien-social': {
    name: 'Pellanor Six',
    look: 'a slim alien with smooth amber chitin skin, a narrow head patterned with hexagons, large compound eyes and two short antennae',
    student: 'a plain grey academy jumpsuit',
  },
  'psychic-fire': {
    name: 'Cassidy Molloy',
    look: 'a wiry young woman with pale freckled skin, a messy copper-red shag haircut and dark circles under her eyes',
    student: 'a red flannel shirt over an academy t-shirt',
  },
  'psychic-air': {
    name: 'Avery Kwan',
    look: 'a slim young adult with light skin, a short black asymmetric haircut and calm dark eyes',
    student:
      'pale blue nursing scrubs under an academy windbreaker and white sneakers',
  },
  'psychic-earth': {
    name: 'Rafa Medeiros',
    look: 'a stocky young man with warm brown skin, short wavy black hair and a neat beard',
    student:
      'thick brown leather work gloves and a canvas geology vest full of rock samples over an academy shirt',
  },
  'psychic-water': {
    name: 'Lior Ben-Ami',
    look: 'a tall young man with olive skin, curly dark hair, a short beard and gentle sea-grey eyes',
    student: 'a heavy cream cable-knit fisherman sweater and an academy scarf',
  },
  'psychic-discipline': {
    name: 'Mei Lin Zhao',
    look: 'a small compact young woman with light skin, a sleek black bob with blunt bangs and calm narrow eyes',
    student:
      'a grey academy cardigan over a black martial-arts top, with reading glasses on a chain',
  },
  'psychic-genius': {
    name: 'Ezra Calloway',
    look: 'a lanky pale young man with neat sandy-blond hair, a nervous smile and a faint violet glow at his temples',
    student: 'a pressed academy blazer and a loosened tie',
  },
  'psychic-birthright': {
    name: 'Celestine Arbogast',
    look: 'a slight young woman with pale skin, long pale-blonde hair and milky white irises that glow faintly',
    student:
      'a high-necked midnight-blue velvet dress under an academy blazer and a string of pearls',
  },
  'psychic-social': {
    name: 'Juniper Okeke',
    look: 'a curvy young woman with deep brown skin, big round glasses and natural hair in two puffs',
    student:
      'a mustard cardigan over an academy shirt with a pencil tucked behind one ear',
  },
  'animal-technical-training': {
    name: 'Zuzu',
    look: 'a chubby, very short koala ronin with grey fur, a big round head and a small round belly',
    student:
      'a dark terracotta poncho, an orange scarf and a wide-brimmed woven straw hat',
  },
  'stellar-navigation': {
    name: 'Tess Helio',
    look: 'a lean young woman with East Asian features, shoulder-length black hair and silver wire goggles on her forehead',
    student:
      'a navy jumpsuit under a worn midnight-blue flight jacket with patched pockets and a long tan woven scarf',
  },
}

/** The fixed week-one team and the city contacts, as the runtime-beat renders already paint them. */
export const TEAM_LOOKS: Record<StudentId, string> = {
  mina: 'a broad-shouldered young woman with dark brown skin and short curls in an ivory rescue coat',
  sol: 'a slim young man with olive skin, close-cropped black hair and an amber visor',
  imani:
    'a plus-size young woman with copper-brown skin, long black braids and a teal scarf',
  ash: 'a lanky pale young adult with wind-tousled ash-blond hair in a storm-gray weather-tech coat with copper sensor buttons',
  nix: 'a slender tan-skinned young adult with short silver hair in a white jacket with purple collar lining',
  kit: 'a broad-hipped pale-skinned young adult with auburn hair in a green medic vest with seed packets in the pockets',
  veda: 'a broad-shouldered fifty-year-old woman with dark brown skin and close-cropped silver hair in a worn maroon training uniform with padded gold bracers',
  mara: 'a sturdy young woman with light brown skin and side-shaved dark hair in a weathered orange safety coat with a blue work harness',
  drift:
    'a lab-grown adult with opalescent warm grey skin, a shaved head and translucent cyan veins on the forearms, in violet laboratory coveralls',
  tessel:
    'a tall willowy alien traveler with dusky blue skin and small luminous freckles in a cropped black jacket over a silvery layered cloak',
  jo: 'a young adult with warm ochre skin and short neon-magenta hair in a navy leather jacket covered in homemade radio patches',
  lark: 'a young adult with light brown skin and short messy dark hair in a teal medical flight suit with a rust-orange scarf',
}

export const DEAN_LOOK =
  'the academy dean, a tall grey-haired adult in a long black formal robe with a silver chain of office'

/** A roster person as Krea sees them: body, then clothing. Names are not visible, so they stay out. */
export const castLook = (signature: string) => {
  const person = CAST_LOOKS[signature]
  return person ? `${person.look}, wearing ${person.student}` : null
}
