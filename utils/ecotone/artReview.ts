// Ecotone art ledgers for the temporary checkpoint review page
// (/admin/art-review, conductor weird-humboldt t-043): every round's lanes,
// subjects and ArtJob ids, snapshotted from conductor
// projects/weird-humboldt/art/*.yaml. Regenerate when a ledger changes; the
// page reads each job's live status, image and timings from the server.

export type ArtReviewLane = {
  key: string
  label: string
  engine: string
  checkpoint: string
  steps?: number | null
  cfg?: number | null
  sampler?: string | null
}

export type ArtReviewSubject = {
  key: string
  title: string
  asset: string
  size: string
  seed?: number | null
  prompt: string
  /** ArtJob id by lane key. */
  jobs: Record<string, number>
}

export type ArtReviewRound = {
  id: string
  title: string
  blurb: string
  lanes: ArtReviewLane[]
  subjects: ArtReviewSubject[]
  notes: Partial<Record<'people' | 'places' | 'recommendation', string>>
}

export const ART_REVIEW_ROUNDS: ArtReviewRound[] = [
  {
    id: 'standard',
    title: 'Art standard (4 styles)',
    blurb:
      'Every card, choice outcome and ending, once in each of the four styles Silas picked: Z-Image Turbo, Krea 2, Arthemy and Nova Comic.',
    lanes: [
      {
        key: 'zimage',
        label: 'Z-Image Turbo (Painted, default style)',
        engine: 'zimage',
        checkpoint: 'zimage',
        steps: null,
        cfg: null,
        sampler: null,
      },
      {
        key: 'krea2',
        label: 'Krea 2 (Film Still)',
        engine: 'krea2',
        checkpoint: 'krea2',
        steps: null,
        cfg: null,
        sampler: null,
      },
      {
        key: 'arthemy',
        label: 'Arthemy Western Art v3.0 (Western Art)',
        engine: 'comfy',
        checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'novacomic',
        label: 'Nova Comic XL v2.0 (Comic)',
        engine: 'comfy',
        checkpoint: 'Illustrious/novaComicXL_v20.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
    ],
    subjects: [
      {
        key: 'std-cards-gr-1',
        title:
          'GR-1 The Green Ribbon Fair, card: the moss puppet and two pulls',
        asset: 'cards/gr-1',
        size: '1344x768',
        seed: 71000,
        prompt:
          'A wide view of a summer fair in a meadow at the edge of a redwood forest. A huge wooden puppet draped in moss sways to the music, clumps of moss falling from its arms. Growers in sun hats lean over a table of potted cannabis plants with blank prize rosettes. On the lawn, acrobats stack into a human tower; past a hand-painted wooden sign at the tree line, drummers play in the shade. A figure in a weathered rain jacket watches from behind.',
        jobs: {
          zimage: 41209,
          krea2: 41210,
          arthemy: 41211,
          novacomic: 41212,
        },
      },
      {
        key: 'std-outcomes-gr-1-acro-success',
        title:
          'GR-1 The Green Ribbon Fair, acro: the upside-down juggler winks',
        asset: 'outcomes/gr-1/acro-success',
        size: '1344x768',
        seed: 71001,
        prompt:
          'Medium shot on a sunny fair lawn. A huge bearded man stands braced with his arms locked overhead, and on his palms balances a Hmong American woman in her late twenties, upside down, with short asymmetric black hair and paint-splattered mechanic coveralls with bright fabric patches. With her feet she juggles three wooden clubs in mid-air, and she grins toward the camera mid-wink. A blurred, gasping crowd and tall redwoods fill the background.',
        jobs: {
          zimage: 41213,
          krea2: 41214,
          arthemy: 41215,
          novacomic: 41216,
        },
      },
      {
        key: 'std-outcomes-gr-1-drums-success',
        title:
          'GR-1 The Green Ribbon Fair, drums: the dancer whose reflection has branches',
        asset: 'outcomes/gr-1/drums-success',
        size: '1344x768',
        seed: 71002,
        prompt:
          'Wide shot of a clearing ringed by tall redwoods, shafts of light through the canopy and green ribbons tied to the branches. At the edge of a drum circle a curvy young woman in her twenties dances barefoot on moss, with messy auburn hair holding a green ribbon and tiny ferns, freckles, a layered thrift-store sweater and a swirling long patchwork skirt. In the foreground a rain puddle reflects her, but the reflection has slender branches growing from its head.',
        jobs: {
          zimage: 41217,
          krea2: 41218,
          arthemy: 41219,
          novacomic: 41220,
        },
      },
      {
        key: 'std-cards-gr-2',
        title: 'GR-2 Something to Share, card: the sharing blanket',
        asset: 'cards/gr-2',
        size: '1344x768',
        seed: 71003,
        prompt:
          "Medium wide shot of a patchwork picnic blanket on a fair meadow in late afternoon. Tired acrobats and drummers sprawl around it, passing a canteen and a basket of sandwiches with easy generosity. A huge bearded man holds up a wax-paper parcel, and beside the basket sits a small tin with a tidy paper tag tied on. Hand drums rest on the grass. The view is from the player's place on the blanket, one hand reaching for the canteen.",
        jobs: {
          zimage: 41221,
          krea2: 41222,
          arthemy: 41223,
          novacomic: 41224,
        },
      },
      {
        key: 'std-outcomes-gr-2-sober-success',
        title:
          'GR-2 Something to Share, sober, success: branches sway against the wind',
        asset: 'outcomes/gr-2/sober-success',
        size: '1344x768',
        seed: 71004,
        prompt:
          "Low close shot over a rain puddle in a redwood clearing on a windy afternoon. The ferns and green ribbons around the puddle whip hard to the left in the wind, but the branches reflected in the water sway to the right, against it. The player's hands hold a small notebook and pencil around the borders, mid-note. The drum circle is a soft blur in the background.",
        jobs: {
          zimage: 41225,
          krea2: 41226,
          arthemy: 41227,
          novacomic: 41228,
        },
      },
      {
        key: 'std-outcomes-gr-2-sober-failure',
        title:
          'GR-2 Something to Share, sober, failure: the map with one extra trail',
        asset: 'outcomes/gr-2/sober-failure',
        size: '1344x768',
        seed: 71005,
        prompt:
          "Close point-of-view shot of the player's hands unfolding an ordinary paper trail map at a fair information table, a friendly volunteer's arm withdrawing around the borders. The map is all contour lines and green forest shading. One thin dotted trail across it glimmers faintly gold, as if it does not belong there. Behind, out of focus, are tents, bunting and redwoods. Every surface bare and unmarked.",
        jobs: {
          zimage: 41229,
          krea2: 41230,
          arthemy: 41231,
          novacomic: 41232,
        },
      },
      {
        key: 'std-outcomes-gr-2-stoned-success',
        title:
          "GR-2 Something to Share, stoned, success: the forest's own polyrhythm",
        asset: 'outcomes/gr-2/stoned-success',
        size: '1344x768',
        seed: 71006,
        prompt:
          'Wide shot from behind a figure in a weathered rain jacket sitting cross-legged in tall grass at the forest edge, facing the trees. The drum circle plays off to the left. Through a soft green haze, faint rings of light pulse outward from the redwood trunks in a slow rhythm of their own, answering the drums. Dusk light, fireflies and a peaceful, listening stillness.',
        jobs: {
          zimage: 41233,
          krea2: 41234,
          arthemy: 41235,
          novacomic: 41236,
        },
      },
      {
        key: 'std-outcomes-gr-2-stoned-failure',
        title:
          'GR-2 Something to Share, stoned, failure: lost in the bass line',
        asset: 'outcomes/gr-2/stoned-failure',
        size: '1344x768',
        seed: 71007,
        prompt:
          "Wide night shot of a crowd in front of the fair's main stage, huge speaker stacks thumping under colored stage lights. In the middle of the dancing crowd a figure in a weathered rain jacket, seen from behind, tilts their head, lost. Across the crowd one other person stands perfectly still among the dancers, also cocking their head toward something nobody else hears. A soft green haze blurs the lights.",
        jobs: {
          zimage: 41237,
          krea2: 41238,
          arthemy: 41239,
          novacomic: 41240,
        },
      },
      {
        key: 'std-outcomes-gr-2-tripping-success',
        title: 'GR-2 Something to Share, tripping, success: the painted moon',
        asset: 'outcomes/gr-2/tripping-success',
        size: '1344x768',
        seed: 71008,
        prompt:
          'Wide low-angle night shot of the fair at the edge of a redwood forest. Above the trees hangs a huge moon that is clearly painted, brushstrokes visible, wet paint dripping down the sky in glossy streaks. Beneath it a narrow glowing trail opens between the trunks. A figure in a weathered rain jacket, seen from behind, stares up while the crowd around keeps dancing and never looks. Kaleidoscopic colour bleeds at the edges.',
        jobs: {
          zimage: 41241,
          krea2: 41242,
          arthemy: 41243,
          novacomic: 41244,
        },
      },
      {
        key: 'std-outcomes-gr-2-tripping-failure',
        title:
          'GR-2 Something to Share, tripping, failure: the false lead to the porta-potties',
        asset: 'outcomes/gr-2/tripping-failure',
        size: '1344x768',
        seed: 71009,
        prompt:
          'Wide daylight shot at the far edge of the fairground. A figure in a weathered rain jacket, seen from behind, arrives with arms spread in triumph at the end of a long winding path that leads only to a row of blue portable toilets. Swirls of kaleidoscopic rainbow colour still ripple off the plastic roofs and the grass, and a sparkling trail behind the figure traces the long, confident detour.',
        jobs: {
          zimage: 41245,
          krea2: 41246,
          arthemy: 41247,
          novacomic: 41248,
        },
      },
      {
        key: 'std-cards-gr-3',
        title:
          'GR-3 Someone Worth Following, card: two invitations at the forest edge',
        asset: 'cards/gr-3',
        size: '1344x768',
        seed: 71010,
        prompt:
          'Wide shot at dusk where the fair meets the redwoods. On the left a Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, sits on a crate taping a juggling club and holds up a small brass gear. On the right a curvy young woman with messy auburn hair, a green ribbon and tiny ferns in it, freckles, a layered sweater and a patchwork skirt, sits on a fallen log offering half a sandwich. Both look our way.',
        jobs: {
          zimage: 41249,
          krea2: 41250,
          arthemy: 41251,
          novacomic: 41252,
        },
      },
      {
        key: 'std-outcomes-gr-3-together-success',
        title:
          'GR-3 Someone Worth Following, together: the weekend has a guide',
        asset: 'outcomes/gr-3/together-success',
        size: '1344x768',
        seed: 71011,
        prompt:
          "Wide shot from behind two figures setting off together down a redwood trail in early morning, shoulder to shoulder, one of them in a weathered rain jacket. Green ribbons on the branches mark the way ahead. Low sun pours through the fog between the trunks, turning both walkers into warm backlit silhouettes, one pointing eagerly up the path. The fair's tents are small and far behind.",
        jobs: {
          zimage: 41253,
          krea2: 41254,
          arthemy: 41255,
          novacomic: 41256,
        },
      },
      {
        key: 'std-outcomes-gr-3-alone-success',
        title: 'GR-3 Someone Worth Following, alone: your own pace',
        asset: 'outcomes/gr-3/alone-success',
        size: '1344x768',
        seed: 71012,
        prompt:
          'Wide shot of a fork in a redwood trail in morning fog. In the foreground a figure in a weathered rain jacket, seen from behind, takes the right-hand path at an unhurried pace. Far down the left-hand path a small backlit silhouette lifts one hand in a friendly wave over the shoulder and walks on alone, following a line of green ribbons into the mist.',
        jobs: {
          zimage: 41257,
          krea2: 41258,
          arthemy: 41259,
          novacomic: 41260,
        },
      },
      {
        key: 'std-cards-gr-4',
        title:
          'GR-4 The Path Behind the Stage, card: the slug in the racing helmet',
        asset: 'cards/gr-4',
        size: '1344x768',
        seed: 71013,
        prompt:
          'Low close shot on the redwood forest floor on a misty morning. A bright yellow banana slug wearing a tiny racing helmet crosses a mossy root, in front of a fallen log and a fern curled like a question mark. Behind it, a path marked with green ribbons tied at eye height runs between towering trunks, and the same log, fern and root seem to repeat further down the path, like a looping scene.',
        jobs: {
          zimage: 41261,
          krea2: 41262,
          arthemy: 41263,
          novacomic: 41264,
        },
      },
      {
        key: 'std-outcomes-gr-4-slug-success',
        title:
          'GR-4 The Path Behind the Stage, slug, success: the glade from next year',
        asset: 'outcomes/gr-4/slug-success',
        size: '1344x768',
        seed: 71014,
        prompt:
          'Wide shot of two massive redwood trunks that fuse overhead into a single tree, forming a natural archway. A banana slug in a tiny racing helmet glides through it, and a figure in a weathered rain jacket, seen from behind, ducks low to follow. Beyond the arch lies a sunlit glade glowing gold, with faint festival lights hanging in the air as if from another year.',
        jobs: {
          zimage: 41265,
          krea2: 41266,
          arthemy: 41267,
          novacomic: 41268,
        },
      },
      {
        key: 'std-outcomes-gr-4-slug-failure',
        title:
          'GR-4 The Path Behind the Stage, slug, failure: back at the log at noon',
        asset: 'outcomes/gr-4/slug-failure',
        size: '1344x768',
        seed: 71015,
        prompt:
          'Medium shot under a harsh noon sun piercing the redwood canopy. A figure in a weathered rain jacket, seen from behind, kneels on the path with shoulders slumped beside a banana slug in a tiny racing helmet that has barely moved. Right next to them lie the same fallen log and the same question-mark fern from the start of the loop. Comic, sun-baked defeat.',
        jobs: {
          zimage: 41269,
          krea2: 41270,
          arthemy: 41271,
          novacomic: 41272,
        },
      },
      {
        key: 'std-outcomes-gr-4-seam-success',
        title:
          'GR-4 The Path Behind the Stage, seam, success: the lot thirty years older',
        asset: 'outcomes/gr-4/seam-success',
        size: '1344x768',
        seed: 71016,
        prompt:
          "Point-of-view shot in a redwood forest, the player's hand holding a pencil and a notebook full of tally marks. Ahead, a thin vertical seam splits the air like a tear in a painting, and through it shows a deserted fairground parking lot decades older: cracked asphalt, weeds, faded paint lines and rusted light poles under a grey sky. The redwoods around the seam stay green and alive.",
        jobs: {
          zimage: 41273,
          krea2: 41274,
          arthemy: 41275,
          novacomic: 41276,
        },
      },
      {
        key: 'std-outcomes-gr-4-seam-failure',
        title:
          'GR-4 The Path Behind the Stage, seam, failure: a perfect map of another forest',
        asset: 'outcomes/gr-4/seam-failure',
        size: '1344x768',
        seed: 71017,
        prompt:
          'Over-the-shoulder shot of a figure in a weathered rain jacket holding up a meticulous hand-drawn map against the forest. The map shows, in fine ink, a pine forest around a round lake with a cabin on its shore, while all around them stand only towering redwoods, with no lake anywhere. Bewildered stillness in misty grey light.',
        jobs: {
          zimage: 41277,
          krea2: 41278,
          arthemy: 41279,
          novacomic: 41280,
        },
      },
      {
        key: 'std-outcomes-gr-4-wait-success',
        title:
          'GR-4 The Path Behind the Stage, wait: the hikers looping since Thursday',
        asset: 'outcomes/gr-4/wait-success',
        size: '1344x768',
        seed: 71018,
        prompt:
          'Medium wide shot on a fallen redwood log in a quiet forest. A figure in a weathered rain jacket, seen from behind, sits on the log as a cheerful family of hikers joins them: an older couple and their grown daughter, rumpled and dusty from days on the trail, beaming and holding out a bag of trail mix. Soft afternoon light, ferns everywhere, green ribbons slack on the trees.',
        jobs: {
          zimage: 41281,
          krea2: 41282,
          arthemy: 41283,
          novacomic: 41284,
        },
      },
      {
        key: 'std-cards-gr-5',
        title: 'GR-5 The Closing Bonfire, card: the wicker redwood burns',
        asset: 'cards/gr-5',
        size: '1344x768',
        seed: 71019,
        prompt:
          "Wide night shot of a meadow where a huge wicker redwood burns in a towering bonfire, the crowd silhouetted around it. To one side a giant moss-covered wooden puppet bends into a theatrical bow. Two folding tables with clipboards stand at the crowd's edge. Above the flames the smoke drifts into the faint shape of a coastline and forested hills, like a face seen in a cloud. A figure in a weathered rain jacket watches from behind.",
        jobs: {
          zimage: 41285,
          krea2: 41286,
          arthemy: 41287,
          novacomic: 41288,
        },
      },
      {
        key: 'std-outcomes-gr-5-petition-success',
        title:
          'GR-5 The Closing Bonfire, petition, success: three hundred signatures',
        asset: 'outcomes/gr-5/petition-success',
        size: '1344x768',
        seed: 71020,
        prompt:
          'Medium wide shot at midnight beside a dying bonfire. A folding table is crowded with locals in sweaters and sun hats, clipboards stacked thick with signed pages, a tray of baked goods and a jar of donations. A figure in a weathered rain jacket, seen from behind, hands a clipboard to an eager newcomer. Above, the smoke settles into the clear shape of a forest with a trail winding through it.',
        jobs: {
          zimage: 41289,
          krea2: 41290,
          arthemy: 41291,
          novacomic: 41292,
        },
      },
      {
        key: 'std-outcomes-gr-5-petition-failure',
        title:
          'GR-5 The Closing Bonfire, petition, failure: forty signatures and a lecture',
        asset: 'outcomes/gr-5/petition-failure',
        size: '1344x768',
        seed: 71021,
        prompt:
          "Point-of-view shot of the player's hands holding a clipboard with only a short column of scribbled signatures. Across the table a stern middle-aged man in a fleece vest counts points off on his fingers mid-lecture, earnest rather than unkind. Behind him the bonfire smoke swirls into a tangle that keeps half-forming a forest and then dissolving. Firelight and a thinning crowd.",
        jobs: {
          zimage: 41293,
          krea2: 41294,
          arthemy: 41295,
          novacomic: 41296,
        },
      },
      {
        key: 'std-outcomes-gr-5-buyer-success',
        title:
          'GR-5 The Closing Bonfire, buyer, success: three locals will vouch',
        asset: 'outcomes/gr-5/buyer-success',
        size: '1344x768',
        seed: 71022,
        prompt:
          'Medium shot by firelight at a camp table. A figure in a weathered rain jacket, seen from behind, writes in a small notebook while three locals stand behind the table ready to vouch: a grower in a wide sun hat, a drummer with silver rings on every finger, and an elderly woman in a knit shawl, arms folded, resolute. The bonfire and a dark tree line glow behind them.',
        jobs: {
          zimage: 41297,
          krea2: 41298,
          arthemy: 41299,
          novacomic: 41300,
        },
      },
      {
        key: 'std-outcomes-gr-5-buyer-failure',
        title:
          'GR-5 The Closing Bonfire, buyer, failure: gone by morning with your notes',
        asset: 'outcomes/gr-5/buyer-failure',
        size: '1344x768',
        seed: 71023,
        prompt:
          'Wide shot of the meadow at grey dawn after the fair. Where a sleek white canopy tent stood last night there is only a rectangle of flattened grass, an empty folding chair and a smoking fire pit. A figure in a weathered rain jacket, seen from behind, stands at the edge of the rectangle, empty-handed, as a few loose blank pages blow away across the wet grass.',
        jobs: {
          zimage: 41301,
          krea2: 41302,
          arthemy: 41303,
          novacomic: 41304,
        },
      },
      {
        key: 'std-outcomes-gr-5-offering-success',
        title: 'GR-5 The Closing Bonfire, offering: the notebook to the fire',
        asset: 'outcomes/gr-5/offering-success',
        size: '1344x768',
        seed: 71024,
        prompt:
          "Low-angle shot at the closing bonfire at night. The player's hand, in a rain jacket sleeve, tosses a worn notebook into the flames, its pages fluttering open. Above the fire the smoke rises into dozens of laughing human figures, arm in arm, glowing orange from below. Sparks swirl up into the stars.",
        jobs: {
          zimage: 41305,
          krea2: 41306,
          arthemy: 41307,
          novacomic: 41308,
        },
      },
      {
        key: 'std-cards-qw-1',
        title: 'QW-1 A Day to Yourself, card: turning away from the crowd',
        asset: 'cards/qw-1',
        size: '1344x768',
        seed: 71025,
        prompt:
          'Wide shot at dawn on the foggy edge of a small college town. Far behind, a plaza is filling with people in costumes and giant pedal-powered sculptures. In the foreground a figure in a weathered rain jacket, seen from behind, turns away down a quiet gravel path toward misty ponds, reeds and a line of distant redwoods. Pale light, birds overhead, the peace of choosing nothing.',
        jobs: {
          zimage: 41309,
          krea2: 41310,
          arthemy: 41311,
          novacomic: 41312,
        },
      },
      {
        key: 'std-outcomes-qw-1-marsh-success',
        title: 'QW-1 A Day to Yourself, marsh: the woman talking to a heron',
        asset: 'outcomes/qw-1/marsh-success',
        size: '1344x768',
        seed: 71026,
        prompt:
          'Wide shot of misty marsh ponds in the morning. In the foreground a flock of white egrets lifts off the water, wings wide. On a far wooden boardwalk a curvy young woman with messy auburn hair, a green ribbon and tiny ferns in it, a layered thrift-store sweater and a long patchwork skirt leans toward a great blue heron on the rail, and the heron holds its beak open as if replying.',
        jobs: {
          zimage: 41313,
          krea2: 41314,
          arthemy: 41315,
          novacomic: 41316,
        },
      },
      {
        key: 'std-outcomes-qw-1-zoo-success',
        title: 'QW-1 A Day to Yourself, zoo: juggling nothing at all',
        asset: 'outcomes/qw-1/zoo-success',
        size: '1344x768',
        seed: 71027,
        prompt:
          'Medium wide shot at the entrance of a small zoo set among redwoods, a suspended canopy walkway strung between the trunks above. On a patch of filled-in grass where burrows once were, a Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, stands perfectly still, hands raised in a juggling pattern around empty air. Quiet, overcast and wistful.',
        jobs: {
          zimage: 41317,
          krea2: 41318,
          arthemy: 41319,
          novacomic: 41320,
        },
      },
      {
        key: 'std-outcomes-qw-1-trail-success',
        title: 'QW-1 A Day to Yourself, trail: the doe sees you off',
        asset: 'outcomes/qw-1/trail-success',
        size: '1344x768',
        seed: 71028,
        prompt:
          'Wide shot from just behind a doe standing on a narrow deer trail in a mossy forest, watching. Ten paces ahead, a figure in a weathered rain jacket, also seen from behind, walks on into the trees, the roof of the last house barely visible far back through the fog. Ferns brush the path in soft grey morning light, and the doe seems to be seeing the walker off.',
        jobs: {
          zimage: 41321,
          krea2: 41322,
          arthemy: 41323,
          novacomic: 41324,
        },
      },
      {
        key: 'std-cards-qw-2',
        title:
          'QW-2 The Bench by the Water, card: a thermos for whoever needs it',
        asset: 'cards/qw-2',
        size: '1344x768',
        seed: 71029,
        prompt:
          'Wide shot of a weathered wooden bench on a grassy rise above a winding slough, the whole bay spread out beyond under soft morning cloud. On the bench sit a steel thermos with a folded paper note tucked under it and a tidy little tin with its own folded note. No one is around. Reeds, mudflats, a few distant birds and calm silver water.',
        jobs: {
          zimage: 41325,
          krea2: 41326,
          arthemy: 41327,
          novacomic: 41328,
        },
      },
      {
        key: 'std-outcomes-qw-2-sober-success',
        title:
          'QW-2 The Bench by the Water, sober, success: the heron matches its photo',
        asset: 'outcomes/qw-2/sober-success',
        size: '1344x768',
        seed: 71030,
        prompt:
          'Over-the-shoulder shot of a figure in a weathered rain jacket lowering a pair of binoculars at a marsh overlook. In the foreground stands a weathered interpretive panel with a faded photograph of a great blue heron on one leg atop a post. Beyond it, out on the mudflat, the real heron stands on the same post in exactly the same pose. Crisp, clear morning light.',
        jobs: {
          zimage: 41329,
          krea2: 41330,
          arthemy: 41331,
          novacomic: 41332,
        },
      },
      {
        key: 'std-outcomes-qw-2-sober-failure',
        title: 'QW-2 The Bench by the Water, sober, failure: counting ducks',
        asset: 'outcomes/qw-2/sober-failure',
        size: '1344x768',
        seed: 71031,
        prompt:
          "Wide shot of the bench above the slough in late morning. A figure in a weathered rain jacket, seen from behind, sits back with a cup of coffee, binoculars resting on one knee. Spread across the water below are dozens of ducks of every kind, drifting, diving and crossing each other's paths in a hopeless tangle. Sunshine breaks through the clouds; total contentment.",
        jobs: {
          zimage: 41333,
          krea2: 41334,
          arthemy: 41335,
          novacomic: 41336,
        },
      },
      {
        key: 'std-outcomes-qw-2-stoned-success',
        title:
          'QW-2 The Bench by the Water, stoned, success: something turns over under the tide',
        asset: 'outcomes/qw-2/stoned-success',
        size: '1344x768',
        seed: 71032,
        prompt:
          'Wide shot of the slough as the tide floods in, water sliding over the mudflats in long glassy ripples. A soft green haze hangs over everything. Beneath the surface, barely visible, an enormous dark rounded shape slowly turns over, gentle and patient rather than threatening. A figure in a weathered rain jacket sits on the bench above, seen from behind, breathing with the tide.',
        jobs: {
          zimage: 41337,
          krea2: 41338,
          arthemy: 41339,
          novacomic: 41340,
        },
      },
      {
        key: 'std-outcomes-qw-2-stoned-failure',
        title:
          'QW-2 The Bench by the Water, stoned, failure: an hour lost to one cloud',
        asset: 'outcomes/qw-2/stoned-failure',
        size: '1344x768',
        seed: 71033,
        prompt:
          'Low-angle shot looking up past the boots and knees of a figure in a weathered rain jacket who lies in the grass beside the bench. The whole sky is taken up by a single plump white cumulus cloud, lit gold at its edges, the only cloud for miles and somehow looking pleased with itself. A soft green haze softens everything, and the shadows have stretched long.',
        jobs: {
          zimage: 41341,
          krea2: 41342,
          arthemy: 41343,
          novacomic: 41344,
        },
      },
      {
        key: 'std-outcomes-qw-2-tripping-success',
        title:
          'QW-2 The Bench by the Water, tripping, success: every heron says stay',
        asset: 'outcomes/qw-2/tripping-success',
        size: '1344x768',
        seed: 71034,
        prompt:
          'Wide shot of the marsh at sunset under a molten orange and violet sky. Dozens of herons stand along the reeds and posts, every one turned toward a figure in a weathered rain jacket seen from behind on the bench, their beaks open in unison as if speaking the same word. Kaleidoscopic colour bleeds around the borders, and the still water mirrors it all.',
        jobs: {
          zimage: 41345,
          krea2: 41346,
          arthemy: 41347,
          novacomic: 41348,
        },
      },
      {
        key: 'std-outcomes-qw-2-tripping-failure',
        title:
          'QW-2 The Bench by the Water, tripping, failure: giggling at the reeds',
        asset: 'outcomes/qw-2/tripping-failure',
        size: '1344x768',
        seed: 71035,
        prompt:
          'Medium shot in tall marsh reeds that curl inward over a figure in a weathered rain jacket, seen from behind, bending close like friends leaning in to share a secret. The figure is doubled over laughing, shoulders shaking. Rainbow colours swirl through the stalks and drip off the seed heads, and the reeds look patient rather than offended.',
        jobs: {
          zimage: 41349,
          krea2: 41350,
          arthemy: 41351,
          novacomic: 41352,
        },
      },
      {
        key: 'std-cards-qw-3',
        title:
          'QW-3 Someone Worth Following, card: two quiet strangers on the boardwalk',
        asset: 'cards/qw-3',
        size: '1344x768',
        seed: 71036,
        prompt:
          'Wide shot of a marsh boardwalk on a misty morning, egrets in the ponds. Near the rail a curvy young woman with messy auburn hair, a green ribbon and tiny ferns in it, a layered sweater and a patchwork skirt gestures at the birds. Further along, a Hmong American woman with short asymmetric black hair, in patched paint-splattered coveralls, sits on a bench beside a faint, ghostly painted otter racing along a fence that is not there. Both glance back toward the viewer.',
        jobs: {
          zimage: 41353,
          krea2: 41354,
          arthemy: 41355,
          novacomic: 41356,
        },
      },
      {
        key: 'std-outcomes-qw-3-together-success',
        title:
          'QW-3 Someone Worth Following, together: walking north with a guide',
        asset: 'outcomes/qw-3/together-success',
        size: '1344x768',
        seed: 71037,
        prompt:
          'Wide shot from behind two walkers setting out north along a raised gravel dike through the marsh, shoulder to shoulder, one in a weathered rain jacket. Low morning sun slants through the fog so both read as warm backlit silhouettes, one with a pack over a shoulder, pointing up the coast. The ponds on either side shine, and a heron flies ahead of them as if leading the way.',
        jobs: {
          zimage: 41357,
          krea2: 41358,
          arthemy: 41359,
          novacomic: 41360,
        },
      },
      {
        key: 'std-outcomes-qw-3-alone-success',
        title: 'QW-3 Someone Worth Following, alone: keeping your quiet',
        asset: 'outcomes/qw-3/alone-success',
        size: '1344x768',
        seed: 71038,
        prompt:
          'Wide shot from behind a figure in a weathered rain jacket sitting alone on a boardwalk bench, binoculars in their lap and a thermos beside them. Far across the ponds, a tiny backlit silhouette walks away along the dike, raising one hand in a friendly wave. Quiet grey water, reeds, a few ducks and soft overcast light. Solitude that feels chosen.',
        jobs: {
          zimage: 41361,
          krea2: 41362,
          arthemy: 41363,
          novacomic: 41364,
        },
      },
      {
        key: 'std-cards-qw-4',
        title: 'QW-4 The Elk Meadow, card: the herd turns to face the coast',
        asset: 'cards/qw-4',
        size: '1344x768',
        seed: 71039,
        prompt:
          "Wide shot of a long green prairie edged by redwoods, mist drifting low. A herd of Roosevelt elk has stopped grazing, and every animal has lifted its head and turned the same way, toward the distant coast, a big antlered bull at the front. Small wooden signs stand along the field's edge. In the foreground a figure in a weathered rain jacket, seen from behind, keeps a respectful distance.",
        jobs: {
          zimage: 41365,
          krea2: 41366,
          arthemy: 41367,
          novacomic: 41368,
        },
      },
      {
        key: 'std-outcomes-qw-4-wait-success',
        title: 'QW-4 The Elk Meadow, wait: the fox comes up the road',
        asset: 'outcomes/qw-4/wait-success',
        size: '1344x768',
        seed: 71040,
        prompt:
          "Wide shot at sunset over the elk prairie. A single red fox trots up the empty road at the field's edge with something small held in its mouth, and the elk herd has lowered its heads to graze again, relaxed. A figure in a weathered rain jacket sits in the grass far back, seen from behind, watching. Long golden light and gentle mist.",
        jobs: {
          zimage: 41369,
          krea2: 41370,
          arthemy: 41371,
          novacomic: 41372,
        },
      },
      {
        key: 'std-outcomes-qw-4-ranger-success',
        title:
          'QW-4 The Elk Meadow, ranger, success: the notebook of westward days',
        asset: 'outcomes/qw-4/ranger-success',
        size: '1344x768',
        seed: 71041,
        prompt:
          "Medium shot at a picnic table by the prairie. A park ranger, a weathered woman in her fifties in a tan uniform and flat-brimmed hat, holds open a worn field notebook filled with columns of tiny tally marks and small pencil sketches of elk heads all turned the same way. The player's hands copy the last page into their own notebook. Elk graze in the misty distance.",
        jobs: {
          zimage: 41373,
          krea2: 41374,
          arthemy: 41375,
          novacomic: 41376,
        },
      },
      {
        key: 'std-outcomes-qw-4-ranger-failure',
        title:
          'QW-4 The Elk Meadow, ranger, failure: a pamphlet and the distance rules',
        asset: 'outcomes/qw-4/ranger-failure',
        size: '1344x768',
        seed: 71042,
        prompt:
          "Medium shot at a busy visitor center counter, a line of tourists in shorts and sun hats behind. A friendly, harried park ranger in a tan uniform hands a folded pamphlet across the counter into the player's outstretched hand while pointing with her other hand at a wall diagram of an elk and a long measuring arrow. Polite smile, too many questions, bright fluorescent light.",
        jobs: {
          zimage: 41377,
          krea2: 41378,
          arthemy: 41379,
          novacomic: 41380,
        },
      },
      {
        key: 'std-outcomes-qw-4-road-success',
        title: 'QW-4 The Elk Meadow, road, success: tracks that stop mid-lane',
        asset: 'outcomes/qw-4/road-success',
        size: '1344x768',
        seed: 71043,
        prompt:
          'Low-angle shot down an empty two-lane coast road in thick fog, redwoods dim on both sides. A trail of fresh elk hoofprints in mud crosses from the grassy shoulder onto the asphalt and stops abruptly in the middle of the lane, as if the animal stepped out of the world. No elk anywhere. A figure in a weathered rain jacket stands well back, seen from behind.',
        jobs: {
          zimage: 41381,
          krea2: 41382,
          arthemy: 41383,
          novacomic: 41384,
        },
      },
      {
        key: 'std-outcomes-qw-4-road-failure',
        title: 'QW-4 The Elk Meadow, road, failure: an excellent sandwich',
        asset: 'outcomes/qw-4/road-failure',
        size: '1344x768',
        seed: 71044,
        prompt:
          'Medium wide shot of a small weathered roadside sandwich shack with a walk-up window and a picnic table, the coast road behind it in sunshine. A figure in a weathered rain jacket, seen from behind, sits at the table holding up an enormous overstuffed sandwich, admiring it. Wildflowers, a dusty pickup parked nearby, warm comic satisfaction.',
        jobs: {
          zimage: 41385,
          krea2: 41386,
          arthemy: 41387,
          novacomic: 41388,
        },
      },
      {
        key: 'std-cards-qw-5',
        title:
          'QW-5 The Long Quiet, card: the unfinished cabin above the river',
        asset: 'cards/qw-5',
        size: '1344x768',
        seed: 71045,
        prompt:
          'Wide shot from the porch of an empty weathered cabin in the hills above a river. A figure in a weathered rain jacket, seen from behind, sits on the steps beside a faded old for-sale sign. Below lie a gravel bar on a clear river, an osprey nest atop a dead snag, and a hillside replanted in neat rows of young redwoods. Morning light, utter quiet. Every surface bare and unmarked.',
        jobs: {
          zimage: 41389,
          krea2: 41390,
          arthemy: 41391,
          novacomic: 41392,
        },
      },
      {
        key: 'std-outcomes-qw-5-restore-success',
        title: 'QW-5 The Long Quiet, restore, success: the first salmon',
        asset: 'outcomes/qw-5/restore-success',
        size: '1344x768',
        seed: 71046,
        prompt:
          'Wide shot of a small creek at dusk, now running clear over the gravel bar, piles of dragged-out brush and branches lining the bank. A figure in a weathered rain jacket and muddy boots, seen from behind, stands knee-deep, watching a single silver salmon nose upstream through the clear water, its back catching the last golden light.',
        jobs: {
          zimage: 41393,
          krea2: 41394,
          arthemy: 41395,
          novacomic: 41396,
        },
      },
      {
        key: 'std-outcomes-qw-5-restore-failure',
        title: 'QW-5 The Long Quiet, restore, failure: the brush wins today',
        asset: 'outcomes/qw-5/restore-failure',
        size: '1344x768',
        seed: 71047,
        prompt:
          'Medium afternoon shot of a creek still choked by a tangled logjam of brush. A figure in a weathered rain jacket, seen from behind, sits exhausted on a heap of hauled branches, muddy gloves in their lap. Through a narrow gap they have cleared, a thin ribbon of water now runs bright and noisy. Dappled light, mud everywhere, stubborn hope.',
        jobs: {
          zimage: 41397,
          krea2: 41398,
          arthemy: 41399,
          novacomic: 41400,
        },
      },
      {
        key: 'std-outcomes-qw-5-call-success',
        title:
          'QW-5 The Long Quiet, call, success: the woman who planted the redwoods',
        asset: 'outcomes/qw-5/call-success',
        size: '1344x768',
        seed: 71048,
        prompt:
          'Wide shot from the cabin porch at sunset. A figure in a weathered rain jacket, seen from behind, sits with a phone to their ear, settled in for a long talk, shadows stretched long. Over the hillside of young redwood rows hovers a translucent golden memory image: a woman in work clothes forty years earlier, kneeling to plant a seedling with a trowel in hand.',
        jobs: {
          zimage: 41401,
          krea2: 41402,
          arthemy: 41403,
          novacomic: 41404,
        },
      },
      {
        key: 'std-outcomes-qw-5-call-failure',
        title: 'QW-5 The Long Quiet, call, failure: ringing in another decade',
        asset: 'outcomes/qw-5/call-failure',
        size: '1344x768',
        seed: 71049,
        prompt:
          "Medium shot through the cabin's dusty front window. Inside the empty room an old wall-mounted rotary telephone glows faintly and trembles as it rings, its coiled cord swinging, the wallpaper and curtains faded to a decades-old palette. Reflected faintly in the glass, a figure in a weathered rain jacket stands on the porch with a phone to their ear, waiting.",
        jobs: {
          zimage: 41405,
          krea2: 41406,
          arthemy: 41407,
          novacomic: 41408,
        },
      },
      {
        key: 'std-outcomes-qw-5-porch-success',
        title: 'QW-5 The Long Quiet, porch: sitting until dark',
        asset: 'outcomes/qw-5/porch-success',
        size: '1344x768',
        seed: 71050,
        prompt:
          'Wide twilight shot from behind a figure in a weathered rain jacket sitting on the cabin porch, silhouetted against a deep blue sky. An osprey glides home to its nest on the dead snag. The river below catches the last light, the young redwood rows are dark shapes on the hillside, and the first stars are coming out. Nothing has been decided, and it is perfect.',
        jobs: {
          zimage: 41409,
          krea2: 41410,
          arthemy: 41411,
          novacomic: 41412,
        },
      },
      {
        key: 'std-cards-kn-1',
        title: 'KN-1 The Night Before on the Plaza',
        asset: 'cards/kn-1',
        size: '1344x768',
        seed: 71051,
        prompt:
          "Wide shot at night of a small-town plaza with palm trees, a bronze statue and old brick storefronts under string lights. Parked around the square are giant pedal-powered art sculptures: a twenty-foot shrimp dyed vivid rainbow hair-dye colors, a long green dragon breathing theatrical fog, a great white shark in a pinstripe suit and necktie, and a raft of sea otter sculptures holding paws. Welding sparks fly along a row of pickups behind them, and across the square a tattoo artist paints a racer's arm at a folding table.",
        jobs: {
          zimage: 41413,
          krea2: 41414,
          arthemy: 41415,
          novacomic: 41416,
        },
      },
      {
        key: 'std-outcomes-kn-1-pit-success',
        title: "KN-1 Pit row: a mechanic welds for a team he isn't on",
        asset: 'outcomes/kn-1/pit-success',
        size: '1344x768',
        seed: 71052,
        prompt:
          "Medium shot at night on a pit row behind parked art sculptures. A rugged man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap, dark welding goggles and an oil-stained canvas work jacket, kneels welding a broken axle under a sculpture that isn't his, sparks spraying. Beside him, an old pickup with a faded green ribbon on its antenna has a vintage CB radio handset on a coiled cord, its red light glowing mid-broadcast.",
        jobs: {
          zimage: 41417,
          krea2: 41418,
          arthemy: 41419,
          novacomic: 41420,
        },
      },
      {
        key: 'std-outcomes-kn-1-flash-success',
        title: 'KN-1 Tattoo table: a six-winged bird on your arm',
        asset: 'outcomes/kn-1/flash-success',
        size: '1344x768',
        seed: 71053,
        prompt:
          'Close point-of-view shot looking down at your own forearm resting on a folding table covered in tattoo flash sheets under string lights. A Native Californian woman in her thirties, long black hair tied back, fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron with a pencil behind her ear, paints a small six-winged bird on your skin with a fine brush. She wears a dry, knowing half smile and does not look up.',
        jobs: {
          zimage: 41421,
          krea2: 41422,
          arthemy: 41423,
          novacomic: 41424,
        },
      },
      {
        key: 'std-cards-kn-2',
        title: 'KN-2 The Pre-Race Party',
        asset: 'cards/kn-2',
        size: '1344x768',
        seed: 71054,
        prompt:
          'Wide shot inside an old timber warehouse at night, packed with costumed racers dancing under strings of bulbs. A brass band with a gleaming tuba plays on a pallet stage, and mid-floor a crew whose hair is dyed every rainbow color struts in a costume contest. A keg and cups sit on a workbench. By the open loading door a tattoo artist sips sparkling water at a small flash table, and beyond her, in the dark lot, a pickup waits with its tailgate down and a cooler open.',
        jobs: {
          zimage: 41425,
          krea2: 41426,
          arthemy: 41427,
          novacomic: 41428,
        },
      },
      {
        key: 'std-outcomes-kn-2-sober-success',
        title: "KN-2 Sober, success: the band's shadows run a beat behind",
        asset: 'outcomes/kn-2/sober-success',
        size: '1344x768',
        seed: 71055,
        prompt:
          "Medium shot from behind a figure in a weathered rain jacket at the edge of a warehouse dance floor, holding a glass of sparkling water and a small open notebook. On the brick wall beyond, a brass band plays under a work light, but their long shadows are caught in a different pose: the trombone's shadow still pulled back while the real slide is thrust out. Dancers blur past; only the watcher is still.",
        jobs: {
          zimage: 41429,
          krea2: 41430,
          arthemy: 41431,
          novacomic: 41432,
        },
      },
      {
        key: 'std-outcomes-kn-2-sober-failure',
        title: "KN-2 Sober, failure: a tourist's blurry photo",
        asset: 'outcomes/kn-2/sober-failure',
        size: '1344x768',
        seed: 71056,
        prompt:
          'Medium shot in a quieter corner of a warehouse party. A friendly, puzzled middle-aged tourist in a windbreaker and a sun visor holds his phone out to a figure in a weathered rain jacket seen from behind. On the screen is a blurry photo of a strange, spindly, light-covered sculpture that stands nowhere in the room. Behind them the party roars on under string lights, an hour of patient explanation lost to it.',
        jobs: {
          zimage: 41433,
          krea2: 41434,
          arthemy: 41435,
          novacomic: 41436,
        },
      },
      {
        key: 'std-outcomes-kn-2-tipsy-success',
        title: "KN-2 Tipsy, success: the tuba's note lands early",
        asset: 'outcomes/kn-2/tipsy-success',
        size: '1344x768',
        seed: 71057,
        prompt:
          "Low-angle medium shot in the middle of a brass band's second line snaking across a warehouse floor. A figure in a weathered rain jacket, seen from behind, dances among the horn players with a beer raised. A tuba player is only just puffing his cheeks to blow, yet a ripple of golden sound is already bursting out of the bell ahead of him, frozen in the air. Everyone else dances on, eyes closed, oblivious.",
        jobs: {
          zimage: 41437,
          krea2: 41438,
          arthemy: 41439,
          novacomic: 41440,
        },
      },
      {
        key: 'std-outcomes-kn-2-tipsy-failure',
        title: 'KN-2 Tipsy, failure: adopted by the otter crew',
        asset: 'outcomes/kn-2/tipsy-failure',
        size: '1344x768',
        seed: 71058,
        prompt:
          'Medium shot of a laughing party crew of adults in brown sea otter hoods and matching team t-shirts, clearly people in costume, pulling an otter hood onto a figure in a weathered rain jacket seen from behind and pressing a tambourine into their hand. They link arms and sway under string lights in the warehouse, a raft of pedal-powered sea otter sculptures holding paws parked behind them.',
        jobs: {
          zimage: 41441,
          krea2: 41442,
          arthemy: 41443,
          novacomic: 41444,
        },
      },
      {
        key: 'std-cards-kn-3',
        title: 'KN-3 Someone Worth Following',
        asset: 'cards/kn-3',
        size: '1344x768',
        seed: 71059,
        prompt:
          "Wide over-the-shoulder shot at night outside the warehouse party, past a figure in a weathered rain jacket. On the left, a rugged man in a worn trucker cap and an oil-stained canvas jacket is elbow-deep in a rumbling generator beside an old pickup, a CB radio glowing on its dash. On the right, under the doorway light, a tattoo artist with long black hair tied back and tattooed forearms turns a racer's arm toward the lamp. Both glance up, as if waiting for you.",
        jobs: {
          zimage: 41445,
          krea2: 41446,
          arthemy: 41447,
          novacomic: 41448,
        },
      },
      {
        key: 'std-outcomes-kn-3-together-success',
        title: 'KN-3 Together: two shadows, one stride',
        asset: 'outcomes/kn-3/together-success',
        size: '1344x768',
        seed: 71060,
        prompt:
          'Wide shot from behind at dawn: two figures walk side by side down an empty wet street, away from a warehouse whose party lights still glow. One wears a weathered rain jacket; the other walks close at their shoulder, already pointing the way. Their two long shadows stretch ahead on the shining asphalt, matched stride for stride, toward a foggy little town where a race will begin at noon.',
        jobs: {
          zimage: 41449,
          krea2: 41450,
          arthemy: 41451,
          novacomic: 41452,
        },
      },
      {
        key: 'std-outcomes-kn-3-alone-success',
        title: 'KN-3 Alone: your own pace',
        asset: 'outcomes/kn-3/alone-success',
        size: '1344x768',
        seed: 71061,
        prompt:
          'Wide shot at night of a street fork under a single sodium lamp outside the warehouse party. A figure in a weathered rain jacket, seen from behind, walks off alone down the left-hand road into the fog, hands in pockets, unhurried. Far down the right-hand road a second small silhouette heads the other way with a purposeful stride. The two paths split around a puddle that reflects the lamp.',
        jobs: {
          zimage: 41453,
          krea2: 41454,
          arthemy: 41455,
          novacomic: 41456,
        },
      },
      {
        key: 'std-cards-kn-4',
        title: 'KN-4 Conscripted',
        asset: 'cards/kn-4',
        size: '1344x768',
        seed: 71062,
        prompt:
          'Point-of-view shot on a sunny town plaza with palm trees and a bronze statue, costumed crowds behind. A sturdy woman in her fifties with a grey braid and a team t-shirt sits on a cooler with a bag of frozen peas on her ankle, jabbing a crutch straight at you, bossy and fond. Beside her stands a twelve-foot bright yellow banana slug sculpture on bicycle wheels with two antennae and a paddle wheel, and a crew member holds out a helmet with antennae.',
        jobs: {
          zimage: 41457,
          krea2: 41458,
          arthemy: 41459,
          novacomic: 41460,
        },
      },
      {
        key: 'std-outcomes-kn-4-pilot-success',
        title: 'KN-4 Pilot, success: the slug surges off the plaza',
        asset: 'outcomes/kn-4/pilot-success',
        size: '1344x768',
        seed: 71063,
        prompt:
          'Wide action shot as a twelve-foot bright yellow banana slug sculpture on bicycle wheels surges off a town plaza at noon, antennae bouncing. The pilot, seen from behind in a weathered rain jacket and a helmet with antennae, pedals hard, flanked by crew in matching antenna helmets. Costumed crowds packed along the curb pump their fists and chant, confetti flying, palm trees and brick storefronts blurring past.',
        jobs: {
          zimage: 41461,
          krea2: 41462,
          arthemy: 41463,
          novacomic: 41464,
        },
      },
      {
        key: 'std-outcomes-kn-4-pilot-failure',
        title: 'KN-4 Pilot, failure: rear-ending the shark',
        asset: 'outcomes/kn-4/pilot-failure',
        size: '1344x768',
        seed: 71064,
        prompt:
          "Medium wide shot at a start line on a sunny plaza: the yellow banana slug sculpture has bumped nose-first into the tail of a great white shark sculpture in a pinstripe suit and necktie. The shark's crew, in green visors, cheerfully stuff fistfuls of play money into the hands of the slug's pilot, seen from behind in a rain jacket and antenna helmet. Judges in silly hats hold up blank scorecards as the crowd cheers.",
        jobs: {
          zimage: 41465,
          krea2: 41466,
          arthemy: 41467,
          novacomic: 41468,
        },
      },
      {
        key: 'std-outcomes-kn-4-navigator-success',
        title: 'KN-4 Navigator, success: a gear nobody installed',
        asset: 'outcomes/kn-4/navigator-success',
        size: '1344x768',
        seed: 71065,
        prompt:
          'Close-up inside the open gearbox of a pedal-powered sculpture, bike chain and sprockets slick with grease. Gloved hands hold a worn, slipping gear just before it strips. Deeper in, wedged among the ordinary parts, sits a second gear of old brass that nobody installed, engraved with fine spirals and turning on its own, a faint golden glint on its teeth as if it were ticking like a clock.',
        jobs: {
          zimage: 41469,
          krea2: 41470,
          arthemy: 41471,
          novacomic: 41472,
        },
      },
      {
        key: 'std-outcomes-kn-4-navigator-failure',
        title: 'KN-4 Navigator, failure: the map was upside down',
        asset: 'outcomes/kn-4/navigator-failure',
        size: '1344x768',
        seed: 71066,
        prompt:
          'Wide shot from behind the yellow banana slug sculpture as it rolls the wrong way down a quiet side street of old wooden houses, while the real race streams past the far end of the block. The navigator, in a weathered rain jacket and antenna helmet, holds a course map upside down, and the crew in antenna helmets turn back toward the camera, laughing and pointing the other way.',
        jobs: {
          zimage: 41473,
          krea2: 41474,
          arthemy: 41475,
          novacomic: 41476,
        },
      },
      {
        key: 'std-outcomes-kn-4-dot-aboard-success',
        title: 'KN-4 Dot aboard, success: directions from the cargo hold',
        asset: 'outcomes/kn-4/dot-aboard-success',
        size: '1344x768',
        seed: 71067,
        prompt:
          'Medium shot through an open hatch in the side of the yellow banana slug sculpture as it rolls down a cheering street. Inside its belly, a sturdy woman in her fifties with a grey braid and a team t-shirt, a bag of frozen peas on her ankle, points her crutch ahead and bellows directions. The pedaling crew in antenna helmets, and a rider in a weathered rain jacket seen from behind, laugh together like old friends.',
        jobs: {
          zimage: 41477,
          krea2: 41478,
          arthemy: 41479,
          novacomic: 41480,
        },
      },
      {
        key: 'std-outcomes-kn-4-dot-aboard-failure',
        title: 'KN-4 Dot aboard, failure: shouting at the wrong slug',
        asset: 'outcomes/kn-4/dot-aboard-failure',
        size: '1344x768',
        seed: 71068,
        prompt:
          "Wide shot of a crowded race street. A sturdy woman in her fifties with a grey braid and a team t-shirt, frozen peas taped to her ankle and a crutch strapped to her chase bike, pedals one-legged alongside a lumpy purple slug sculpture that is not her team's, bellowing directions at its baffled crew. Far ahead in the background, the bright yellow banana slug sculpture rolls on without her.",
        jobs: {
          zimage: 41481,
          krea2: 41482,
          arthemy: 41483,
          novacomic: 41484,
        },
      },
      {
        key: 'std-cards-kn-5',
        title: 'KN-5 The Bay Crossing',
        asset: 'cards/kn-5',
        size: '1344x768',
        seed: 71069,
        prompt:
          'Wide shot on a gray bay from just behind a paddle-wheeling twelve-foot yellow banana slug sculpture, its crew in antenna helmets pedaling. Fog is rolling down over the water. To one side floats a raft of sea otter sculptures holding paws, crewed by people in otter hoods; to the other, a long green dragon sculpture breathes fog. Real harbor seals poke up their heads to stare. Ahead in the gray a lone bell buoy leans and rings, and the waterfront fades behind.',
        jobs: {
          zimage: 41485,
          krea2: 41486,
          arthemy: 41487,
          novacomic: 41488,
        },
      },
      {
        key: 'std-outcomes-kn-5-pedal-success',
        title: 'KN-5 Pedal hard, success: out of the fog in third',
        asset: 'outcomes/kn-5/pedal-success',
        size: '1344x768',
        seed: 71070,
        prompt:
          "Wide shot as the yellow banana slug sculpture bursts out of a wall of fog into hazy sunlight, paddle wheel churning white water, crew in antenna helmets pedaling flat out. Just ahead glides a twenty-foot shrimp sculpture dyed vivid rainbow colors, its crew's hair dyed to match. A waterfront dock packed with spectators roars, and behind the slug the fog bank closes like a gray door.",
        jobs: {
          zimage: 41489,
          krea2: 41490,
          arthemy: 41491,
          novacomic: 41492,
        },
      },
      {
        key: 'std-outcomes-kn-5-pedal-failure',
        title: 'KN-5 Pedal hard, failure: the slug sinks with dignity',
        asset: 'outcomes/kn-5/pedal-failure',
        size: '1344x768',
        seed: 71071,
        prompt:
          'Joyful wide shot near a crowded waterfront: the bright yellow banana slug sculpture sinks slowly nose first, its tail and paddle wheel tipped grandly toward the sky. Its crew bob around it in life jackets and antenna helmets, laughing and waving, one figure in a rain jacket seen from behind. On the dock the whole crowd cheers as if they won, while a raft of sea otter sculptures crewed by people in otter hoods paddles back, arms outstretched to tow them in.',
        jobs: {
          zimage: 41493,
          krea2: 41494,
          arthemy: 41495,
          novacomic: 41496,
        },
      },
      {
        key: 'std-outcomes-kn-5-current-success',
        title: 'KN-5 Ride the current, success: hauling the otters ashore',
        asset: 'outcomes/kn-5/current-success',
        size: '1344x768',
        seed: 71072,
        prompt:
          'Medium wide shot at a boat ramp on a sunlit waterfront. The yellow banana slug sculpture, already ashore and dripping, is parked to one side, while its crew in antenna helmets and a figure in a weathered rain jacket, seen from behind, wade in to haul a raft of sea otter sculptures holding paws up the ramp, one otter at a time, beside its grateful crew in otter hoods. Behind them the other racers are still far out on the bay.',
        jobs: {
          zimage: 41497,
          krea2: 41498,
          arthemy: 41499,
          novacomic: 41500,
        },
      },
      {
        key: 'std-outcomes-kn-5-current-failure',
        title: 'KN-5 Ride the current, failure: stuck on the mudflat',
        asset: 'outcomes/kn-5/current-failure',
        size: '1344x768',
        seed: 71073,
        prompt:
          'Wide shot on a shining bay mudflat: the yellow banana slug sculpture has settled into the mud, brimming with water like a bathtub. Its crew in antenna helmets, mud to the knees and splattered head to toe, shove at it and laugh, one in a rain jacket seen from behind. On the distant shore a crowd films with raised phones, and in the foreground a harbor seal lies on the mud, watching without blinking.',
        jobs: {
          zimage: 41501,
          krea2: 41502,
          arthemy: 41503,
          novacomic: 41504,
        },
      },
      {
        key: 'std-outcomes-kn-5-buoy-success',
        title: 'KN-5 Steer for the buoy, success: a bell on no chart',
        asset: 'outcomes/kn-5/buoy-success',
        size: '1344x768',
        seed: 71074,
        prompt:
          'Wide shot in thick gray fog on open water: the yellow nose and antennae of the banana slug sculpture glide up to an old rust-red bell buoy that no chart has ever shown. Its bell swings, and pale golden rings of sound pulse outward through the fog in a strange counted rhythm. A figure in a rain jacket and antenna helmet, seen from behind, leans forward over the bow, listening hard.',
        jobs: {
          zimage: 41505,
          krea2: 41506,
          arthemy: 41507,
          novacomic: 41508,
        },
      },
      {
        key: 'std-outcomes-kn-5-buoy-failure',
        title:
          'KN-5 Steer for the buoy, failure: antennae ashore like a trophy',
        asset: 'outcomes/kn-5/buoy-failure',
        size: '1344x768',
        seed: 71075,
        prompt:
          "Joyful wide shot at a foggy boat ramp: a figure in a weathered rain jacket, seen from behind and soaked to the chest, wades ashore holding the slug sculpture's two yellow antennae overhead like a trophy, while the dripping crew in antenna helmets splash behind, laughing. On the dock beside a great white shark sculpture in a pinstripe suit and necktie, its crew in green visors hold out a towel and a long blank paper invoice.",
        jobs: {
          zimage: 41509,
          krea2: 41510,
          arthemy: 41511,
          novacomic: 41512,
        },
      },
      {
        key: 'std-cards-kn-6',
        title: 'KN-6 The Ferndale Finish',
        asset: 'cards/kn-6',
        size: '1344x768',
        seed: 71076,
        prompt:
          'High wide shot of a river valley: a long, elegant concrete arch bridge spans a green river, where a raft of sea otter sculptures holding paws sits stuck in the shallows, its crew in otter hoods waving. Beyond, the road runs into a little town of Victorian gingerbread houses and a main street packed with cheering people under a blank finish banner. On a quiet hill above town, among old headstones, a tiny figure in a black frock coat waves a racing flag.',
        jobs: {
          zimage: 41513,
          krea2: 41514,
          arthemy: 41515,
          novacomic: 41516,
        },
      },
      {
        key: 'std-outcomes-kn-6-finish-success',
        title: 'KN-6 Sprint, success: a gear medal and a crew hug',
        asset: 'outcomes/kn-6/finish-success',
        size: '1344x768',
        seed: 71077,
        prompt:
          'Medium shot under a blank cloth finish banner on a Victorian main street with gingerbread trim, confetti in the air and a roaring crowd behind the barricades. A figure in a weathered rain jacket and antenna helmet, seen from behind, is swept into a group hug by the whole crew, while a race official hangs a medal made from a bicycle gear around their neck. The yellow banana slug sculpture stands parked just past the line.',
        jobs: {
          zimage: 41517,
          krea2: 41518,
          arthemy: 41519,
          novacomic: 41520,
        },
      },
      {
        key: 'std-outcomes-kn-6-finish-failure',
        title: 'KN-6 Sprint, failure: carried across on their shoulders',
        asset: 'outcomes/kn-6/finish-failure',
        size: '1344x768',
        seed: 71078,
        prompt:
          'Wide shot ten feet from a finish line on a Victorian main street: the crew in antenna helmets carry the twelve-foot yellow banana slug sculpture across on their shoulders like a parade float, its snapped bike chain dangling. One carrier in a weathered rain jacket is seen from behind. Under the blank finish banner, judges in straw boaters nod solemnly and give a thumbs up, and the crowd goes wild.',
        jobs: {
          zimage: 41521,
          krea2: 41522,
          arthemy: 41523,
          novacomic: 41524,
        },
      },
      {
        key: 'std-outcomes-kn-6-otters-success',
        title: 'KN-6 Help the otters: applause, otter style',
        asset: 'outcomes/kn-6/otters-success',
        size: '1344x768',
        seed: 71079,
        prompt:
          'Medium wide shot in the reedy shallows of a green river beneath a long concrete arch bridge. A figure in a weathered rain jacket, seen from behind and wet to the waist, holds a muddy bicycle wheel up out of the reeds. Around a raft of sea otter sculptures holding paws, its crew of people in otter hoods float on their backs in the shallow water, clapping on their chests like otters, delighted.',
        jobs: {
          zimage: 41525,
          krea2: 41526,
          arthemy: 41527,
          novacomic: 41528,
        },
      },
      {
        key: 'std-outcomes-kn-6-cemetery-success',
        title: "KN-6 Cemetery, success: the first race's ghostly winner",
        asset: 'outcomes/kn-6/cemetery-success',
        size: '1344x768',
        seed: 71080,
        prompt:
          "Medium shot in a quiet hillside cemetery of weathered Victorian headstones above a small gingerbread town. A friendly old dairyman in a black frock coat, with white mutton-chop whiskers and a faintly translucent sepia glow, holds out a faded racing flag to a figure in a weathered rain jacket seen from behind. Far below, the race's finish on main street is a bright speck of color.",
        jobs: {
          zimage: 41529,
          krea2: 41530,
          arthemy: 41531,
          novacomic: 41532,
        },
      },
      {
        key: 'std-outcomes-kn-6-cemetery-failure',
        title: 'KN-6 Cemetery, failure: only the flag',
        asset: 'outcomes/kn-6/cemetery-failure',
        size: '1344x768',
        seed: 71081,
        prompt:
          'Wide shot from among old headstones on an empty hillside: in the foreground a racing flag is tied to a weathered Victorian headstone with a green ribbon, fluttering, and a hand in a rain jacket sleeve reaches for it. No one else is there. Far below in the gingerbread town, a tiny yellow banana slug sculpture crosses the finish line on main street in a burst of confetti.',
        jobs: {
          zimage: 41533,
          krea2: 41534,
          arthemy: 41535,
          novacomic: 41536,
        },
      },
      {
        key: 'std-cards-kn-7',
        title: "KN-7 Dead Man's Drop",
        asset: 'cards/kn-7',
        size: '1344x768',
        seed: 71082,
        prompt:
          'Wide shot of an enormous steep sand dune slope under a bright coastal sky, its sides lined with costumed spectators sitting like bleachers. A long green dragon sculpture plunges over the lip roaring theatrical fog; a raft of sea otter sculptures slides down on its back; a great white shark sculpture in a pinstripe suit and necktie is buried nose-first to its dorsal fin. At the top edge the yellow banana slug sculpture teeters, its crew in antenna helmets pushing.',
        jobs: {
          zimage: 41537,
          krea2: 41538,
          arthemy: 41539,
          novacomic: 41540,
        },
      },
      {
        key: 'std-outcomes-kn-7-ride-success',
        title: 'KN-7 Straight down, success: one long yellow scream',
        asset: 'outcomes/kn-7/ride-success',
        size: '1344x768',
        seed: 71083,
        prompt:
          "Dynamic low-angle shot from the bottom of a steep sand dune as the twelve-foot yellow banana slug sculpture rockets straight down toward the camera, upright, sand spraying from its bicycle wheels like a boat's wake, antennae streaming back. The crew in antenna helmets scream with joy. The spectators seated along the slope leap to their feet, fists in the air.",
        jobs: {
          zimage: 41541,
          krea2: 41542,
          arthemy: 41543,
          novacomic: 41544,
        },
      },
      {
        key: 'std-outcomes-kn-7-ride-failure',
        title: 'KN-7 Straight down, failure: a sand-crusted yellow burrito',
        asset: 'outcomes/kn-7/ride-failure',
        size: '1344x768',
        seed: 71084,
        prompt:
          'Wide shot at the bottom of a steep dune: the yellow banana slug sculpture lies on its side, rolled and crusted in sand like a giant sugared pastry, wheels spinning in the air. From a hatch pokes an arm in a sandy rain jacket sleeve giving a thumbs up, while sand-covered crew in antenna helmets tumble out laughing. Along the slope the whole crowd rises in a standing ovation.',
        jobs: {
          zimage: 41545,
          krea2: 41546,
          arthemy: 41547,
          novacomic: 41548,
        },
      },
      {
        key: 'std-outcomes-kn-7-rope-success',
        title: "KN-7 Ropes, success: a plaque from a year that hasn't happened",
        asset: 'outcomes/kn-7/rope-success',
        size: '1344x768',
        seed: 71085,
        prompt:
          'Medium wide shot on a steep dune face: the crew in antenna helmets brace on a rope belayed around a weathered fence post, slowly lowering the yellow banana slug sculpture down the slope like a piano. In the foreground, a figure in a weathered rain jacket, seen from behind, kneels and brushes sand from a half-buried brass plaque, its face blank, gleaming and oddly new.',
        jobs: {
          zimage: 41549,
          krea2: 41550,
          arthemy: 41551,
          novacomic: 41552,
        },
      },
      {
        key: 'std-outcomes-kn-7-rope-failure',
        title: 'KN-7 Ropes, failure: the fence post comes too',
        asset: 'outcomes/kn-7/rope-failure',
        size: '1344x768',
        seed: 71086,
        prompt:
          'Wide action shot down a steep dune: the rope is still taut, but the fence post it was tied to has ripped clean out of the sand and is tumbling after the sliding yellow banana slug sculpture. Two crew in antenna helmets slide alongside in a cloud of sand, laughing their heads off. Spectators seated along the slope clap their hands to their mouths, then cheer.',
        jobs: {
          zimage: 41553,
          krea2: 41554,
          arthemy: 41555,
          novacomic: 41556,
        },
      },
      {
        key: 'std-outcomes-kn-7-shark-success',
        title: 'KN-7 Dig out the shark: paid in play money',
        asset: 'outcomes/kn-7/shark-success',
        size: '1344x768',
        seed: 71087,
        prompt:
          "Medium shot on a dune slope: a great white shark sculpture in a pinstripe suit and necktie is buried in sand to its dorsal fin. A figure in a weathered rain jacket and antenna helmet, seen from behind, digs at it with bare hands and a borrowed frisbee, while the shark's crew in green visors dig alongside, beaming and pressing handfuls of colorful play money on their helper.",
        jobs: {
          zimage: 41557,
          krea2: 41558,
          arthemy: 41559,
          novacomic: 41560,
        },
      },
      {
        key: 'std-cards-kn-8',
        title: "KN-8 Melvin's Mile",
        asset: 'cards/kn-8',
        size: '1344x768',
        seed: 71088,
        prompt:
          "Wide shot looking up a long, steep road grade over green pasture on a coastal bluff. Racers strain upward: a long green dragon sculpture pushed by its own crew, and a twenty-foot shrimp sculpture dyed vivid rainbow colors, its rainbow-haired crew sweating. At the crest the green-and-gold valley opens out, and on the shoulder where the road drops away stands a hand-painted wooden sign. The yellow slug's antennae poke into the foreground.",
        jobs: {
          zimage: 41561,
          krea2: 41562,
          arthemy: 41563,
          novacomic: 41564,
        },
      },
      {
        key: 'std-outcomes-kn-8-climb-success',
        title: 'KN-8 Climb, success: cresting ahead of the dragon',
        asset: 'outcomes/kn-8/climb-success',
        size: '1344x768',
        seed: 71089,
        prompt:
          'Wide shot at the crest of a steep pasture bluff, the green-and-gold river valley spread below: the yellow banana slug sculpture tops the hill just ahead of a long green dragon sculpture, whose crew raise their hands in salute as the dragon exhales a big puff of theatrical fog. The pilot, seen from behind in a weathered rain jacket and antenna helmet, stands on the pedals.',
        jobs: {
          zimage: 41565,
          krea2: 41566,
          arthemy: 41567,
          novacomic: 41568,
        },
      },
      {
        key: 'std-outcomes-kn-8-climb-failure',
        title: 'KN-8 Climb, failure: everybody pushes, singing',
        asset: 'outcomes/kn-8/climb-failure',
        size: '1344x768',
        seed: 71090,
        prompt:
          'Medium wide shot halfway up a long steep road over green pasture: the crew in antenna helmets have climbed out and are pushing the yellow banana slug sculpture uphill, shoulders down, mouths wide open in song. The pilot in a weathered rain jacket, seen from behind, slumps over the handlebars with legs dangling, while the others push and grin at each other in a full group effort.',
        jobs: {
          zimage: 41569,
          krea2: 41570,
          arthemy: 41571,
          novacomic: 41572,
        },
      },
      {
        key: 'std-outcomes-kn-8-brakes-success',
        title: 'KN-8 Brakes, success: a mile marker for a road not yet built',
        asset: 'outcomes/kn-8/brakes-success',
        size: '1344x768',
        seed: 71091,
        prompt:
          "Medium shot at the bottom of a steep country descent: the yellow banana slug sculpture rolls to a careful stop, thin wisps of smoke curling from its hot brakes. In the weedy ditch beside the road stands a strange, pristine concrete mile marker post with a blank face, as if waiting for a highway that isn't built yet. The pilot, in a rain jacket and antenna helmet and seen from behind, stares at it.",
        jobs: {
          zimage: 41573,
          krea2: 41574,
          arthemy: 41575,
          novacomic: 41576,
        },
      },
      {
        key: 'std-outcomes-kn-8-brakes-failure',
        title: 'KN-8 Brakes, failure: into the cow parsnip, whooping',
        asset: 'outcomes/kn-8/brakes-failure',
        size: '1344x768',
        seed: 71092,
        prompt:
          'Wide action shot at the foot of a steep road: the yellow banana slug sculpture has shot off the bend and plowed into a roadside ditch overflowing with tall white umbels of cow parsnip, petals and leaves bursting upward. The pilot in a weathered rain jacket and antenna helmet, seen from behind, flings both arms up whooping, while crew members sprint down the hill after it.',
        jobs: {
          zimage: 41577,
          krea2: 41578,
          arthemy: 41579,
          novacomic: 41580,
        },
      },
      {
        key: 'std-outcomes-kn-8-shrimp-success',
        title: 'KN-8 Push the shrimp: a streak of electric blue',
        asset: 'outcomes/kn-8/shrimp-success',
        size: '1344x768',
        seed: 71093,
        prompt:
          'Medium shot at the top of a pasture bluff, a twenty-foot shrimp sculpture dyed vivid rainbow colors parked behind. Its crew of hairstylists, their own hair dyed to match, crowd around a figure in a weathered rain jacket seen from behind; one paints a bright electric blue streak into their hair with a tint brush while the others hold up a hand mirror and cheer. The green valley glows below.',
        jobs: {
          zimage: 41581,
          krea2: 41582,
          arthemy: 41583,
          novacomic: 41584,
        },
      },
      {
        key: 'std-cards-wh-006',
        title: 'WH-006 The Last Houdini Exit: a gloved hand under the stage',
        asset: 'cards/wh-006',
        size: '1344x768',
        seed: 71094,
        prompt:
          'Wide shot of an empty old single-screen movie theater after midnight, rows of worn red velvet seats, popcorn scattered on the aisle carpet. On the bare stage a small wooden trapdoor is lifted one inch, warm golden light leaking from the gap, and a white-gloved hand pushes up a folded blank note. A figure in a weathered rain jacket stands in the aisle seen from behind. Faint dusty spotlight beam, uncanny and funny.',
        jobs: {
          zimage: 41585,
          krea2: 41586,
          arthemy: 41587,
          novacomic: 41588,
        },
      },
      {
        key: 'std-outcomes-wh-006-ask-name-success',
        title: 'WH-006 Houdini Exit, ask name, success: a 1931 first date',
        asset: 'outcomes/wh-006/ask-name-success',
        size: '1344x768',
        seed: 71095,
        prompt:
          'Medium shot on an empty theater stage. A figure in a weathered rain jacket, seen from behind, sits cross-legged beside a trapdoor that is propped open a few inches, warm amber light spilling up. Above them, in the dusty spotlight beam, a soft sepia vision floats like an old film reel: a young couple in 1930s clothes laughing in the front row of this same theater. Tender, trusting mood.',
        jobs: {
          zimage: 41589,
          krea2: 41590,
          arthemy: 41591,
          novacomic: 41592,
        },
      },
      {
        key: 'std-outcomes-wh-006-ask-name-failure',
        title: 'WH-006 Houdini Exit, ask name, failure: the trapdoor slams',
        asset: 'outcomes/wh-006/ask-name-failure',
        size: '1344x768',
        seed: 71096,
        prompt:
          'Low angle, close to the stage floorboards. A wooden trapdoor slams shut with a burst of dust, the gloved hand just vanishing beneath it. Point-of-view hands reach toward it a beat too late, one hand cupped to an ear against the boards. Thin lines of gold light glow through the cracks between the planks. The empty seats loom dark in the background.',
        jobs: {
          zimage: 41593,
          krea2: 41594,
          arthemy: 41595,
          novacomic: 41596,
        },
      },
      {
        key: 'std-outcomes-wh-006-inspect-rope-success',
        title:
          'WH-006 Houdini Exit, inspect rope, success: the extra pulley hums',
        asset: 'outcomes/wh-006/inspect-rope-success',
        size: '1344x768',
        seed: 71097,
        prompt:
          'Medium shot backstage at an old theater fly rail: rows of hemp ropes, sandbags and iron counterweights in dim work light. Point-of-view hands touch one extra brass pulley that should not be there. It glows faintly and gives off visible rings of soft blue static that ripple through the air and out a small open window toward the night street. Curious, quietly electric.',
        jobs: {
          zimage: 41597,
          krea2: 41598,
          arthemy: 41599,
          novacomic: 41600,
        },
      },
      {
        key: 'std-outcomes-wh-006-inspect-rope-failure',
        title: 'WH-006 Houdini Exit, inspect rope, failure: the curtain falls',
        asset: 'outcomes/wh-006/inspect-rope-failure',
        size: '1344x768',
        seed: 71098,
        prompt:
          'Wide shot from the back of an empty theater. The heavy red velvet stage curtain has collapsed in a great heap on the stage, with a person-shaped lump struggling underneath it and one rain-jacket sleeve poking out. The seats are empty, yet faint translucent hands clap in the dark rows. Slapstick, slightly uncanny.',
        jobs: {
          zimage: 41601,
          krea2: 41602,
          arthemy: 41603,
          novacomic: 41604,
        },
      },
      {
        key: 'std-outcomes-wh-006-offer-ride-success',
        title: 'WH-006 Houdini Exit, offer ride: the warm passenger seat',
        asset: 'outcomes/wh-006/offer-ride-success',
        size: '1344x768',
        seed: 71099,
        prompt:
          "Point of view from the driver's seat of a small old borrowed hatchback parked at night outside a vintage theater, its blank marquee glowing with rows of bulbs. Hands rest on the steering wheel. The passenger seat is empty, its seatbelt buckled across nobody, the cushion softly dented and glowing with a faint warm shimmer. A pair of white gloves lies neatly folded on the dashboard. Gentle, kind, a little sad.",
        jobs: {
          zimage: 41605,
          krea2: 41606,
          arthemy: 41607,
          novacomic: 41608,
        },
      },
      {
        key: 'std-cards-wh-021',
        title: 'WH-021 Bigfoot Family Picnic: posing at Moonstone Beach',
        asset: 'cards/wh-021',
        size: '1344x768',
        seed: 71100,
        prompt:
          'Wide shot of a sandy cove with a big dark sea stack and a small river mouth. Three huge, gentle, shaggy brown sasquatches in floppy sun hats crowd onto a checkered picnic blanket, the smallest holding up a phone with a cracked screen for a family photo while the tallest gestures. A cooler overflows with sparkling water and a platter of deviled eggs. Behind them the waves are curling backward out to sea.',
        jobs: {
          zimage: 41609,
          krea2: 41610,
          arthemy: 41611,
          novacomic: 41612,
        },
      },
      {
        key: 'std-outcomes-wh-021-photographer-success',
        title:
          'WH-021 Bigfoot Picnic, photographer, success: a fourth on screen',
        asset: 'outcomes/wh-021/photographer-success',
        size: '1344x768',
        seed: 71101,
        prompt:
          'Over-the-shoulder point of view: hands hold a phone with a cracked screen. On the screen the sasquatch family poses beautifully in their sun hats, with a fourth shaggy figure grinning around the borders. On the real beach beyond the phone there are only three sasquatches and an empty patch of sand where the fourth should be. Bright, funny, uncanny.',
        jobs: {
          zimage: 41613,
          krea2: 41614,
          arthemy: 41615,
          novacomic: 41616,
        },
      },
      {
        key: 'std-outcomes-wh-021-photographer-failure',
        title:
          'WH-021 Bigfoot Picnic, photographer, failure: a relative tags along',
        asset: 'outcomes/wh-021/photographer-failure',
        size: '1344x768',
        seed: 71102,
        prompt:
          'Wide shot along the beach. In the background the sasquatch family argues around the picnic blanket, arms waving, sun hats askew. In the foreground a figure in a weathered rain jacket walks away, seen from behind, while one huge shaggy brown sasquatch tiptoes a few steps behind them, trying very hard to look casual and holding its sun hat over its chest.',
        jobs: {
          zimage: 41617,
          krea2: 41618,
          arthemy: 41619,
          novacomic: 41620,
        },
      },
      {
        key: 'std-outcomes-wh-021-backwards-tide-success',
        title:
          'WH-021 Bigfoot Picnic, backwards tide, success: the note on the seabed',
        asset: 'outcomes/wh-021/backwards-tide-success',
        size: '1344x768',
        seed: 71103,
        prompt:
          'Wide shot far out on newly bared seabed, wet sand and tide pools stretching toward a distant wall of sea that hangs still on the horizon. A figure in a weathered rain jacket, seen from behind, crouches to lift a folded paper from a rock. Its open half shows a pencil sketch of a radio tower on a ridge. Silver light, eerie stillness.',
        jobs: {
          zimage: 41621,
          krea2: 41622,
          arthemy: 41623,
          novacomic: 41624,
        },
      },
      {
        key: 'std-outcomes-wh-021-backwards-tide-failure',
        title:
          'WH-021 Bigfoot Picnic, backwards tide, failure: wet and two hours older',
        asset: 'outcomes/wh-021/backwards-tide-failure',
        size: '1344x768',
        seed: 71104,
        prompt:
          'Wide shot of the beach at a much later hour, low golden sun and long shadows. A figure in a soaked rain jacket trudges back up the sand from the water, seen from behind, dripping and shoulders slumped. Up the beach the sasquatch family is packing up the picnic blanket, one of them pointing at a wristwatch. Comic, weary.',
        jobs: {
          zimage: 41625,
          krea2: 41626,
          arthemy: 41627,
          novacomic: 41628,
        },
      },
      {
        key: 'std-outcomes-wh-021-eggs-success',
        title: 'WH-021 Bigfoot Picnic, eggs: a recipe and an invitation',
        asset: 'outcomes/wh-021/eggs-success',
        size: '1344x768',
        seed: 71105,
        prompt:
          'Medium shot over the shoulder of a figure in a weathered rain jacket. A huge shaggy brown sasquatch in a sun hat leans down kindly to hand over a blank recipe card and a paper plate with a deviled egg, its other hand raised in a gentle warning gesture toward the sea. The rest of the family waves from the picnic blanket. Warm, friendly light.',
        jobs: {
          zimage: 41629,
          krea2: 41630,
          arthemy: 41631,
          novacomic: 41632,
        },
      },
      {
        key: 'std-cards-wh-061',
        title: 'WH-061 Perilous Plunge into Monday: the squid surfaces',
        asset: 'cards/wh-061',
        size: '1344x768',
        seed: 71106,
        prompt:
          'Wide shot of a waterfront pier on a grey bay. Costumed jumpers queue along the dock while a small marching band plays. In the water below, a volunteer in a magnificent homemade squid costume surfaces holding up a dripping newspaper. Nearby a steaming hot tub hisses clouds of vapor. A figure in a rain jacket watches from the railing, seen from behind.',
        jobs: {
          zimage: 41633,
          krea2: 41634,
          arthemy: 41635,
          novacomic: 41636,
        },
      },
      {
        key: 'std-outcomes-wh-061-pull-squid-success',
        title:
          'WH-061 Perilous Plunge, pull squid, success: the paper dissolves',
        asset: 'outcomes/wh-061/pull-squid-success',
        size: '1344x768',
        seed: 71107,
        prompt:
          "Medium shot at the dock edge. A figure in a rain jacket, seen from behind, hauls the squid-costumed volunteer up out of the water by the arm, foam tentacles streaming. In the rescuer's other hand the wet newspaper is dissolving into grey pulp and floating flakes. The volunteer's eyes are wide and knowing. Band in soft focus behind.",
        jobs: {
          zimage: 41637,
          krea2: 41638,
          arthemy: 41639,
          novacomic: 41640,
        },
      },
      {
        key: 'std-outcomes-wh-061-pull-squid-failure',
        title:
          'WH-061 Perilous Plunge, pull squid, failure: Monday floats away',
        asset: 'outcomes/wh-061/pull-squid-failure',
        size: '1344x768',
        seed: 71108,
        prompt:
          'Wide shot of a boat ramp. The squid-costumed volunteer sits wrapped in a silver emergency blanket, shivering and dazed, tentacles limp. Out on the grey water the newspaper drifts away alone, its pages spread, toward a strip of pale weekday dawn light on the horizon. A rain-jacketed figure crouches beside the volunteer, seen from behind.',
        jobs: {
          zimage: 41641,
          krea2: 41642,
          arthemy: 41643,
          novacomic: 41644,
        },
      },
      {
        key: 'std-outcomes-wh-061-newspaper-success',
        title:
          'WH-061 Perilous Plunge, newspaper, success: one true prediction',
        asset: 'outcomes/wh-061/newspaper-success',
        size: '1344x768',
        seed: 71109,
        prompt:
          'Close point of view: hands hold a dripping newspaper page against the dock railing while a phone photographs it. The ink is running in long dark rivulets, the columns blurred beyond reading, but one small printed drawing of a ballot box is still crisp. Grey bay and costumed crowd soft in the background. Urgent, focused.',
        jobs: {
          zimage: 41645,
          krea2: 41646,
          arthemy: 41647,
          novacomic: 41648,
        },
      },
      {
        key: 'std-outcomes-wh-061-newspaper-failure',
        title:
          'WH-061 Perilous Plunge, newspaper, failure: someone prints the fake',
        asset: 'outcomes/wh-061/newspaper-failure',
        size: '1344x768',
        seed: 71110,
        prompt:
          'Medium shot on the dock. In the foreground a rain-jacketed figure, seen from behind, holds up a crisp, obviously dry newspaper. A few yards away a grinning prankster in a bucket hat cranks a small portable printer on a folding table, a fresh stack of identical copies fluttering in the wind toward the crowd. Mischievous, comic.',
        jobs: {
          zimage: 41649,
          krea2: 41650,
          arthemy: 41651,
          novacomic: 41652,
        },
      },
      {
        key: 'std-outcomes-wh-061-second-judging-success',
        title:
          'WH-061 Perilous Plunge, second judging, success: the waiver, stamped twice',
        asset: 'outcomes/wh-061/second-judging-success',
        size: '1344x768',
        seed: 71111,
        prompt:
          "Medium shot at a folding judges' table draped in bunting on the pier. A solemn organizer in a sash brings a huge rubber stamp down onto an ornate certificate covered in seals and ribbons, one stamp mark already beside it. Point-of-view hands wait to receive it. The squid volunteer applauds behind. Absurdly official.",
        jobs: {
          zimage: 41653,
          krea2: 41654,
          arthemy: 41655,
          novacomic: 41656,
        },
      },
      {
        key: 'std-outcomes-wh-061-second-judging-failure',
        title:
          'WH-061 Perilous Plunge, second judging, failure: a volunteer nemesis',
        asset: 'outcomes/wh-061/second-judging-failure',
        size: '1344x768',
        seed: 71112,
        prompt:
          'Medium shot on the pier. A volunteer in a bright orange safety vest, clutching a clipboard, glares nose to nose over it with narrowed eyes. Facing them, seen from behind, is a rain-jacketed figure with an enormous ruffled participation rosette pinned proudly to the jacket. Marching band and costumes behind. Petty rivalry played for laughs.',
        jobs: {
          zimage: 41657,
          krea2: 41658,
          arthemy: 41659,
          novacomic: 41660,
        },
      },
      {
        key: 'std-cards-wh-122',
        title: 'WH-122 The Marsh That Eats Its Words: the heron testifies',
        asset: 'cards/wh-122',
        size: '1344x768',
        seed: 71113,
        prompt:
          'Wide shot at dusk from a wooden boardwalk over still marsh ponds and tall reeds, hundreds of birds settling on the water. A birder in a rain shell lowers her binoculars, looking puzzled. Faint shimmering ribbons of radio static drift down from distant festival lights on the hill and dissolve into the reeds. A great blue heron stands in the shallows, stiff and solemn.',
        jobs: {
          zimage: 41661,
          krea2: 41662,
          arthemy: 41663,
          novacomic: 41664,
        },
      },
      {
        key: 'std-outcomes-wh-122-count-birds-success',
        title: 'WH-122 Marsh, count birds, success: yesterday, bird for bird',
        asset: 'outcomes/wh-122/count-birds-success',
        size: '1344x768',
        seed: 71114,
        prompt:
          "High wide shot over a marsh pond at dusk. Ducks, coots and one heron float in place while a faint translucent double of the same scene, yesterday's, lines up perfectly over them, bird for bird. In the foreground point-of-view hands hold a metal tally counter beside the birder's open field notebook. Precise, uncanny.",
        jobs: {
          zimage: 41665,
          krea2: 41666,
          arthemy: 41667,
          novacomic: 41668,
        },
      },
      {
        key: 'std-outcomes-wh-122-count-birds-failure',
        title: 'WH-122 Marsh, count birds, failure: lost at the mallards',
        asset: 'outcomes/wh-122/count-birds-failure',
        size: '1344x768',
        seed: 71115,
        prompt:
          'Medium shot on the boardwalk. Dozens of mallards swirl and paddle chaotically below. A rain-jacketed figure, seen from behind, presses a hand to their head in defeat, while the birder in her rain shell gently takes the tally counter from their other hand with a patient smile. Soft dusk light, gentle comedy.',
        jobs: {
          zimage: 41669,
          krea2: 41670,
          arthemy: 41671,
          novacomic: 41672,
        },
      },
      {
        key: 'std-outcomes-wh-122-record-static-success',
        title:
          'WH-122 Marsh, record static, success: a vote count in the noise',
        asset: 'outcomes/wh-122/record-static-success',
        size: '1344x768',
        seed: 71116,
        prompt:
          'Medium shot at the boardwalk rail at night. A figure in a rain jacket, seen from behind, aims a clear parabolic microphone dish at the reeds. Beside them the birder listens through big headphones, eyes widening. Faint glowing static gathers in front of the dish into rhythmic, orderly pulses, like a voice reading something out. Blue night, intent.',
        jobs: {
          zimage: 41673,
          krea2: 41674,
          arthemy: 41675,
          novacomic: 41676,
        },
      },
      {
        key: 'std-outcomes-wh-122-record-static-failure',
        title: "WH-122 Marsh, record static, failure: the heron's look",
        asset: 'outcomes/wh-122/record-static-failure',
        size: '1344x768',
        seed: 71117,
        prompt:
          'Medium shot with a great blue heron large in the foreground, head turned to stare straight at the viewer with withering disapproval. Behind it, the parabolic microphone splashes into the pond, while a rain-jacketed figure, seen from behind, flails on the boardwalk and the birder winces. Dusk light, comic timing.',
        jobs: {
          zimage: 41677,
          krea2: 41678,
          arthemy: 41679,
          novacomic: 41680,
        },
      },
      {
        key: 'std-outcomes-wh-122-let-it-work-success',
        title: 'WH-122 Marsh, let it work: the static goes quiet',
        asset: 'outcomes/wh-122/let-it-work-success',
        size: '1344x768',
        seed: 71118,
        prompt:
          'Wide, still shot at night. A lone figure in a rain jacket sits on the edge of the boardwalk, seen from behind, legs dangling over a mirror-calm pond. The last thin wisps of glowing static unravel into the reeds and vanish. A low moon and the reeds reflect perfectly in the water. The heron sleeps on one leg. Deep, peaceful quiet.',
        jobs: {
          zimage: 41681,
          krea2: 41682,
          arthemy: 41683,
          novacomic: 41684,
        },
      },
      {
        key: 'std-cards-wh-123',
        title: 'WH-123 Bad Reception: the empty pickup on Fickle Hill',
        asset: 'cards/wh-123',
        size: '1344x768',
        seed: 71119,
        prompt:
          'Wide shot of a narrow mountain road climbing through tall second-growth redwoods in thick fog at night. An old pickup idles on the shoulder, dome light on, driver door open, a CB radio handset dangling on its coiled cord. Nobody is inside. Ahead, the wet road surface glows faintly from within. A figure in a rain jacket approaches, seen from behind.',
        jobs: {
          zimage: 41685,
          krea2: 41686,
          arthemy: 41687,
          novacomic: 41688,
        },
      },
      {
        key: 'std-outcomes-wh-123-answer-success',
        title: "WH-123 Bad Reception, answer, success: tomorrow's news",
        asset: 'outcomes/wh-123/answer-success',
        size: '1344x768',
        seed: 71120,
        prompt:
          'Point-of-view shot from the open truck door: one hand holds the CB handset to speak, the dashboard radio glowing warm amber. Through the windshield the fog has parted in a narrow seam, revealing a sliver of pink sunrise over a ridge that should still be hours away. Calm, grateful, gently magical.',
        jobs: {
          zimage: 41689,
          krea2: 41690,
          arthemy: 41691,
          novacomic: 41692,
        },
      },
      {
        key: 'std-outcomes-wh-123-answer-failure',
        title:
          'WH-123 Bad Reception, answer, failure: the county hears a sneeze',
        asset: 'outcomes/wh-123/answer-failure',
        size: '1344x768',
        seed: 71121,
        prompt:
          "Wide shot from above the hillside at night. A tiny figure in a rain jacket stands at the open pickup, seen from behind, doubled over mid-sneeze with the handset keyed. Huge visible rings of sound ripple out from the truck over the foggy valley, and far below every window in the small town's lights flickers at once. Comic, cosmic.",
        jobs: {
          zimage: 41693,
          krea2: 41694,
          arthemy: 41695,
          novacomic: 41696,
        },
      },
      {
        key: 'std-outcomes-wh-123-find-driver-success',
        title: 'WH-123 Bad Reception, find driver, success: a warm thermos',
        asset: 'outcomes/wh-123/find-driver-success',
        size: '1344x768',
        seed: 71122,
        prompt:
          'Point-of-view flashlight beam in a foggy redwood forest at night. A trail of fresh muddy boot prints leads from the road shoulder between the trunks and stops at a broad cut stump. On the stump stands a dented metal thermos with steam curling from its open cap. No one is anywhere. Quiet suspense.',
        jobs: {
          zimage: 41697,
          krea2: 41698,
          arthemy: 41699,
          novacomic: 41700,
        },
      },
      {
        key: 'std-outcomes-wh-123-find-driver-failure',
        title:
          'WH-123 Bad Reception, find driver, failure: the fog closes in, politely',
        asset: 'outcomes/wh-123/find-driver-failure',
        size: '1344x768',
        seed: 71123,
        prompt:
          "Wide shot in the redwoods at night. A figure in a rain jacket, seen from behind, stands beside a stump with a thermos on it, flashlight beam aimed at bare, unmarked ground. Behind them a soft wall of fog curls in like a stage curtain being drawn, swallowing the road and the truck's dome light. Eerie but courteous.",
        jobs: {
          zimage: 41701,
          krea2: 41702,
          arthemy: 41703,
          novacomic: 41704,
        },
      },
      {
        key: 'std-outcomes-wh-123-drive-down-success',
        title: 'WH-123 Bad Reception, walk down, success: the last switchback',
        asset: 'outcomes/wh-123/drive-down-success',
        size: '1344x768',
        seed: 71124,
        prompt:
          'Wide shot at first light on a switchback road below the fog line. A figure in a rain jacket walks down the final bend, seen from behind. Above, the dark pickup and its faint glowing road vanish into the fog bank. Below, a small college town and a silver bay spread out in early morning light. Relief, lingering weirdness.',
        jobs: {
          zimage: 41705,
          krea2: 41706,
          arthemy: 41707,
          novacomic: 41708,
        },
      },
      {
        key: 'std-outcomes-wh-123-drive-down-failure',
        title: 'WH-123 Bad Reception, walk down, failure: the whole broadcast',
        asset: 'outcomes/wh-123/drive-down-failure',
        size: '1344x768',
        seed: 71125,
        prompt:
          'Medium shot of the old pickup cocooned in dense fog on all sides, the world reduced to a few yards. A figure in a rain jacket sits on the lowered tailgate, seen from behind, knees hugged, resigned, while the dashboard CB glows through the rear window. Pale fog presses close like a patient audience. Long night, gentle captivity.',
        jobs: {
          zimage: 41709,
          krea2: 41710,
          arthemy: 41711,
          novacomic: 41712,
        },
      },
      {
        key: 'std-cards-wh-121',
        title: 'WH-121 The Latitude Argument: 1849 through a seam in the fog',
        asset: 'cards/wh-121',
        size: '1344x768',
        seed: 71126,
        prompt:
          "Wide shot at a river mouth where a bright vertical seam splits the grey fog. Through it, slightly sepia-toned, a ragged party of 1849 explorers stands soaked and starving at the water's edge. A bearded man holding a brass sextant points straight at a rain-jacketed figure in the foreground, seen from behind. His companions throw up their hands.",
        jobs: {
          zimage: 41713,
          krea2: 41714,
          arthemy: 41715,
          novacomic: 41716,
        },
      },
      {
        key: 'std-outcomes-wh-121-reading-success',
        title:
          'WH-121 Latitude Argument, reading, success: right for another Humboldt',
        asset: 'outcomes/wh-121/reading-success',
        size: '1344x768',
        seed: 71127,
        prompt:
          "Medium shot at the water's edge. The bearded explorer squints through his brass sextant while a rain-jacketed figure, seen from behind, holds a steady arm out toward the horizon. The horizon line glows, and two coastlines overlap there faintly, this one and a slightly different one. Clear cold light through the fog seam. Triumphant, strange.",
        jobs: {
          zimage: 41717,
          krea2: 41718,
          arthemy: 41719,
          novacomic: 41720,
        },
      },
      {
        key: 'std-outcomes-wh-121-reading-failure',
        title:
          'WH-121 Latitude Argument, reading, failure: blamed, with footnotes',
        asset: 'outcomes/wh-121/reading-failure',
        size: '1344x768',
        seed: 71128,
        prompt:
          'Medium shot in thick grey fog that has swallowed the horizon entirely. The bearded explorer lowers his sextant and lectures furiously, one finger raised, a leather notebook open in his other hand with pages of tiny scribbles. A rain-jacketed figure, seen from behind, shrugs helplessly. His crew sits in the sand rolling their eyes.',
        jobs: {
          zimage: 41721,
          krea2: 41722,
          arthemy: 41723,
          novacomic: 41724,
        },
      },
      {
        key: 'std-outcomes-wh-121-cross-success',
        title:
          'WH-121 Latitude Argument, cross, success: dry, then the shouting',
        asset: 'outcomes/wh-121/cross-success',
        size: '1344x768',
        seed: 71129,
        prompt:
          'Wide shot on the far bank of a river mouth. The ragged explorers step dry onto the sand from a driftwood log bridge, a rain-jacketed figure leading them, seen from behind. Back across the water, the bearded man with the sextant has stayed behind and is already shouting after them, arms waving in the fog. Comic relief.',
        jobs: {
          zimage: 41725,
          krea2: 41726,
          arthemy: 41727,
          novacomic: 41728,
        },
      },
      {
        key: 'std-outcomes-wh-121-cross-failure',
        title: 'WH-121 Latitude Argument, cross, failure: wet and cross',
        asset: 'outcomes/wh-121/cross-failure',
        size: '1344x768',
        seed: 71130,
        prompt:
          'Medium shot in the river current. A rain-jacketed figure, seen from behind, stands waist-deep beside three soaked, scowling 1849 explorers, everyone dripping and glowering at each other. A battered felt hat floats away on the current toward the sea. Grey fog and cold water, grumpy comedy.',
        jobs: {
          zimage: 41729,
          krea2: 41730,
          arthemy: 41731,
          novacomic: 41732,
        },
      },
      {
        key: 'std-outcomes-wh-121-peace-success',
        title:
          'WH-121 Latitude Argument, peace, success: thirty seconds of calm',
        asset: 'outcomes/wh-121/peace-success',
        size: '1344x768',
        seed: 71131,
        prompt:
          'Wide shot on a long driftwood log at the river mouth. The ragged explorers sit in a row in a brief, sunlit calm, a rain-jacketed figure in the middle with palms raised, seen from behind. Sun breaks through the fog seam onto the water. At the end of the log the bearded man is already lifting one finger, mouth opening.',
        jobs: {
          zimage: 41733,
          krea2: 41734,
          arthemy: 41735,
          novacomic: 41736,
        },
      },
      {
        key: 'std-outcomes-wh-121-peace-failure',
        title: 'WH-121 Latitude Argument, peace, failure: left out of history',
        asset: 'outcomes/wh-121/peace-failure',
        size: '1344x768',
        seed: 71132,
        prompt:
          "Medium shot of a circle of shouting 1849 explorers at the river's edge, all pointing at each other, rendered like a sepia history painting. In the middle stands a rain-jacketed figure, seen from behind, also pointing, but fading to faint translucence as if being erased from the picture. Fog seam narrowing. Wry, comic.",
        jobs: {
          zimage: 41737,
          krea2: 41738,
          arthemy: 41739,
          novacomic: 41740,
        },
      },
      {
        key: 'std-cards-wh-124',
        title: "WH-124 The Friends Who Aren't Here: a lantern-lit tribute",
        asset: 'cards/wh-124',
        size: '1344x768',
        seed: 71133,
        prompt:
          'Wide shot of a lantern-lit clearing among tall redwoods at night, a small delighted crowd on blankets. Physical-theatre performers play remembered zoo animals: an actor in brown overalls and a simple chimp half-mask paces and blows a raspberry, another in a sleek brown otter hood races a laughing kid along an invisible fence, and people in tan hoods pop up behind hay bales. Clearly people in costume, warm and joyful.',
        jobs: {
          zimage: 41741,
          krea2: 41742,
          arthemy: 41743,
          novacomic: 41744,
        },
      },
      {
        key: 'std-outcomes-wh-124-sit-with-bill-success',
        title:
          "WH-124 Friends Who Aren't Here, sit with Bill: a painting of a future",
        asset: 'outcomes/wh-124/sit-with-bill-success',
        size: '1344x768',
        seed: 71134,
        prompt:
          'Medium shot on a hay bale under lanterns. The actor in brown overalls has pushed his chimp half-mask up onto his forehead and, smiling gently, hands a bright finger painting to a rain-jacketed figure seen from behind. The painting shows a green, sunny coastal town with redwoods and a bay, in thick joyful smears. Quiet, moving.',
        jobs: {
          zimage: 41745,
          krea2: 41746,
          arthemy: 41747,
          novacomic: 41748,
        },
      },
      {
        key: 'std-outcomes-wh-124-run-with-snerfy-success',
        title:
          "WH-124 Friends Who Aren't Here, Snerfy, success: the girl and the otter pen",
        asset: 'outcomes/wh-124/run-with-snerfy-success',
        size: '1344x768',
        seed: 71135,
        prompt:
          'Medium shot on a hay bale at the edge of the lantern-lit clearing. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, talks softly, smiling with wet eyes. Above her drifts a soft watercolor memory: a little girl pressed to the rail of an old otter pen, a river otter looking back. The breathless otter-hood performer rests nearby.',
        jobs: {
          zimage: 41749,
          krea2: 41750,
          arthemy: 41751,
          novacomic: 41752,
        },
      },
      {
        key: 'std-outcomes-wh-124-run-with-snerfy-failure',
        title:
          "WH-124 Friends Who Aren't Here, Snerfy, failure: an outraged prairie dog",
        asset: 'outcomes/wh-124/run-with-snerfy-failure',
        size: '1344x768',
        seed: 71136,
        prompt:
          'Low wide shot across the grass of the lantern-lit clearing. A rain-jacketed figure lies sprawled face-down, tripped mid-run, seen from behind. Beside them a performer in a tan prairie-dog hood pops up from behind a hay bale, fists on hips, mouth open in tiny outrage. The otter-hood runner looks back laughing. The crowd giggles.',
        jobs: {
          zimage: 41753,
          krea2: 41754,
          arthemy: 41755,
          novacomic: 41756,
        },
      },
      {
        key: 'std-outcomes-wh-124-hecklers-success',
        title:
          "WH-124 Friends Who Aren't Here, hecklers, success: a natural prairie dog",
        asset: 'outcomes/wh-124/hecklers-success',
        size: '1344x768',
        seed: 71137,
        prompt:
          'Wide shot near a chain-link fence at the edge of the clearing. Two teenagers who had been rattling it are now in the show: one, in a hastily borrowed tan hood, pops up from behind a hay bale with perfect comic timing while the crowd bursts into applause. A rain-jacketed figure stands aside, seen from behind, arms folded, pleased.',
        jobs: {
          zimage: 41757,
          krea2: 41758,
          arthemy: 41759,
          novacomic: 41760,
        },
      },
      {
        key: 'std-outcomes-wh-124-hecklers-failure',
        title:
          "WH-124 Friends Who Aren't Here, hecklers, failure: excellent aim",
        asset: 'outcomes/wh-124/hecklers-failure',
        size: '1344x768',
        seed: 71138,
        prompt:
          'Dynamic medium shot at the fence. The actor in brown overalls and chimp half-mask winds up and lobs a big foam prop banana in a perfect arc, while two startled teenagers duck behind the chain-link. The crowd on blankets cheers. A rain-jacketed figure in the foreground, seen from behind, has one hand still raised, upstaged.',
        jobs: {
          zimage: 41761,
          krea2: 41762,
          arthemy: 41763,
          novacomic: 41764,
        },
      },
      {
        key: 'std-cards-wh-125',
        title: 'WH-125 Anchor Stores: three lit gates in a closed mall',
        asset: 'cards/wh-125',
        size: '1344x768',
        seed: 71139,
        prompt:
          'Wide shot down the dim concourse of a closed 1980s shopping mall at night, skylights dark, a dry tiled fountain. Three shuttered store gates glow from inside: one onto a rainy forest town with solar roofs and a farmers market, one onto a gleaming warehouse of bowed heads, one onto a foggy food court with a single pretzel turning under a heat lamp. A security guard glides past on a scooter.',
        jobs: {
          zimage: 41765,
          krea2: 41766,
          arthemy: 41767,
          novacomic: 41768,
        },
      },
      {
        key: 'std-outcomes-wh-125-first-gate-success',
        title:
          'WH-125 Anchor Stores, first gate, success: a minute in the forest town',
        asset: 'outcomes/wh-125/first-gate-success',
        size: '1344x768',
        seed: 71140,
        prompt:
          'Wide shot inside a rainy forest town of the near future, timber buildings with solar roofs, a lively farmers market under canopies, redwoods behind. A rain-jacketed figure, seen from behind, stands in the street as a smiling kid in rain boots hands them a blank paper flyer. Warm light through gentle rain, hopeful.',
        jobs: {
          zimage: 41769,
          krea2: 41770,
          arthemy: 41771,
          novacomic: 41772,
        },
      },
      {
        key: 'std-outcomes-wh-125-first-gate-failure',
        title:
          'WH-125 Anchor Stores, first gate, failure: a nose print on the future',
        asset: 'outcomes/wh-125/first-gate-failure',
        size: '1344x768',
        seed: 71141,
        prompt:
          'Close medium shot from behind and slightly to one side: a rain-jacketed figure presses against the glass of a lit store gate, hood up, face hidden. Beyond the glass the rainy forest town glows warm and unreachable. On the glass, a small foggy breath mark and a nose smudge. Dark mall concourse around. Longing, wry.',
        jobs: {
          zimage: 41773,
          krea2: 41774,
          arthemy: 41775,
          novacomic: 41776,
        },
      },
      {
        key: 'std-outcomes-wh-125-ask-guard-success',
        title: 'WH-125 Anchor Stores, ask guard, success: twelve-hour shifts',
        asset: 'outcomes/wh-125/ask-guard-success',
        size: '1344x768',
        seed: 71142,
        prompt:
          'Medium shot. A tired middle-aged security guard in a navy uniform leans on her stand-up scooter and sighs, gesturing with her thumb at the lit gate beside her. Through it, a vast bright warehouse stretches away: endless shelves, robot carts, and workers with heads bowed over long shifts. A rain-jacketed figure listens, seen from behind.',
        jobs: {
          zimage: 41777,
          krea2: 41778,
          arthemy: 41779,
          novacomic: 41780,
        },
      },
      {
        key: 'std-outcomes-wh-125-ask-guard-failure',
        title:
          'WH-125 Anchor Stores, ask guard, failure: politely escorted out',
        asset: 'outcomes/wh-125/ask-guard-failure',
        size: '1344x768',
        seed: 71143,
        prompt:
          'Wide shot toward the glass exit doors of the dark mall, an empty parking lot in sodium light beyond. The security guard rolls alongside on her scooter, one arm extended in an enormously polite after-you gesture, while a rain-jacketed figure, seen from behind, walks toward the doors. The glowing gates recede behind them.',
        jobs: {
          zimage: 41781,
          krea2: 41782,
          arthemy: 41783,
          novacomic: 41784,
        },
      },
      {
        key: 'std-outcomes-wh-125-fourth-anchor-success',
        title: 'WH-125 Anchor Stores, fourth anchor, success: waiting on you',
        asset: 'outcomes/wh-125/fourth-anchor-success',
        size: '1344x768',
        seed: 71144,
        prompt:
          'Wide shot at the far end of a long, dark mall wing. A fourth anchor store gate stands open onto pure dark, an empty space with a single thin seam of dawn-colored light on the floor, as if something could still be built there. A rain-jacketed figure stands small before it, seen from behind, silhouetted. Hushed, full of possibility.',
        jobs: {
          zimage: 41785,
          krea2: 41786,
          arthemy: 41787,
          novacomic: 41788,
        },
      },
      {
        key: 'std-outcomes-wh-125-fourth-anchor-failure',
        title:
          'WH-125 Anchor Stores, fourth anchor, failure: a vacancy placard',
        asset: 'outcomes/wh-125/fourth-anchor-failure',
        size: '1344x768',
        seed: 71145,
        prompt:
          'Medium shot of a plain shuttered storefront under one buzzing fluorescent tube. A blank white placard hangs crooked on the gate. A rain-jacketed figure, seen from behind, has already turned away, hands shoved in pockets, shoulders hunched, walking off down the empty concourse. Flat, slightly bleak humor.',
        jobs: {
          zimage: 41789,
          krea2: 41790,
          arthemy: 41791,
          novacomic: 41792,
        },
      },
      {
        key: 'std-cards-wh-126',
        title: 'WH-126 Behind the Mall: the second monster',
        asset: 'cards/wh-126',
        size: '1344x768',
        seed: 71146,
        prompt:
          'Wide shot at dusk behind a mall, by a slough: long concrete walls covered in colorful abstract graffiti murals, tall reeds, water the color of dusk. A student film crew with lights and a camera shoots a student in a rubber monster suit with a big jaw. A weathered older man in a knit cap points out the light. Half hidden in the reeds, a second, unscripted reed-draped creature hits its mark perfectly.',
        jobs: {
          zimage: 41793,
          krea2: 41794,
          arthemy: 41795,
          novacomic: 41796,
        },
      },
      {
        key: 'std-outcomes-wh-126-ask-ray-success',
        title:
          'WH-126 Behind the Mall, ask Ray, success: shy, wants to be seen',
        asset: 'outcomes/wh-126/ask-ray-success',
        size: '1344x768',
        seed: 71147,
        prompt:
          'Medium shot on a low concrete ledge by the slough. A weathered older man in a knit cap and layered canvas jacket sits beside a rain-jacketed figure, seen from behind, and nods knowingly toward the reeds. There, two soft amber eyes peek out shyly between the stalks. Graffiti color glows on the wall behind. Gentle, understanding.',
        jobs: {
          zimage: 41797,
          krea2: 41798,
          arthemy: 41799,
          novacomic: 41800,
        },
      },
      {
        key: 'std-outcomes-wh-126-ask-ray-failure',
        title: 'WH-126 Behind the Mall, ask Ray, failure: not tonight',
        asset: 'outcomes/wh-126/ask-ray-failure',
        size: '1344x768',
        seed: 71148,
        prompt:
          'Wide shot along the graffiti wall. The weathered older man in the knit cap walks away along the concrete with quiet dignity, one hand lifted over his shoulder in a firm not-tonight wave. A rain-jacketed figure stands where he left them, seen from behind. The film lights glow behind the reeds. Respectful, a little awkward.',
        jobs: {
          zimage: 41801,
          krea2: 41802,
          arthemy: 41803,
          novacomic: 41804,
        },
      },
      {
        key: 'std-outcomes-wh-126-footage-success',
        title: 'WH-126 Behind the Mall, footage, success: it mouths one word',
        asset: 'outcomes/wh-126/footage-success',
        size: '1344x768',
        seed: 71149,
        prompt:
          "Over-the-shoulder shot of hands holding a camera's small field monitor in the dark. On the screen the reed-draped creature leans into close-up, glowing amber eyes, mouth caught mid-word and looking straight down the lens. Around the monitor, the crew leans in, faces lit blue by the screen, frozen.",
        jobs: {
          zimage: 41805,
          krea2: 41806,
          arthemy: 41807,
          novacomic: 41808,
        },
      },
      {
        key: 'std-outcomes-wh-126-footage-failure',
        title:
          'WH-126 Behind the Mall, footage, failure: a beautifully lit thumb',
        asset: 'outcomes/wh-126/footage-failure',
        size: '1344x768',
        seed: 71150,
        prompt:
          "Close shot of a camera's field monitor held in point-of-view hands. The whole screen is filled by a giant glowing pink thumb, gorgeously backlit with a rim of golden light, the reeds a blur behind it. In the background the student crew doubles over laughing. Comic deflation.",
        jobs: {
          zimage: 41809,
          krea2: 41810,
          arthemy: 41811,
          novacomic: 41812,
        },
      },
      {
        key: 'std-outcomes-wh-126-costar-success',
        title: 'WH-126 Behind the Mall, costar, success: one perfect take',
        asset: 'outcomes/wh-126/costar-success',
        size: '1344x768',
        seed: 71151,
        prompt:
          'Wide cinematic shot in the shallows of the slough under film lights at blue dusk. A rain-jacketed figure, seen from behind, faces the tall reed-draped creature, which bows its head in a gentle nod before wading back into the reeds. In the background a young director clutches the monitor, tears streaming, the crew silent.',
        jobs: {
          zimage: 41813,
          krea2: 41814,
          arthemy: 41815,
          novacomic: 41816,
        },
      },
      {
        key: 'std-outcomes-wh-126-costar-failure',
        title: 'WH-126 Behind the Mall, costar, failure: upstaged',
        asset: 'outcomes/wh-126/costar-failure',
        size: '1344x768',
        seed: 71152,
        prompt:
          'Wide shot under film lights by the graffiti wall. The reed-draped creature strikes a towering dramatic pose in the brightest spotlight, every camera and light turned to it. Off to the side in shadow, a small rain-jacketed figure, seen from behind, is mid-scream with arms thrown up, completely ignored. Comic.',
        jobs: {
          zimage: 41817,
          krea2: 41818,
          arthemy: 41819,
          novacomic: 41820,
        },
      },
      {
        key: 'std-endings-mara-sober-hope',
        title: 'Mara ending, sober, hope: Lines That Last, the spring touch-up',
        asset: 'endings/mara-sober-hope',
        size: '1344x768',
        seed: 71153,
        prompt:
          "Close medium shot from the player's point of view on a clear spring morning. A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear, bends over the player's outstretched forearm, touching up a fine-line tattoo of a six-winged bird. Behind her, three apprentices work at bright stations, and a tall window opens onto a small-town plaza with blossoming trees. Crisp, clear light.",
        jobs: {
          zimage: 41821,
          krea2: 41822,
          arthemy: 41823,
          novacomic: 41824,
        },
      },
      {
        key: 'std-endings-mara-sober-dark',
        title:
          'Mara ending, sober, dark: Fine-Print Ink, loading out of the old shop',
        asset: 'endings/mara-sober-dark',
        size: '1344x768',
        seed: 71154,
        prompt:
          'Wide shot of a quiet small-town plaza on a cold, clear winter morning. A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear, loads a folded tattoo chair and a stack of framed flash art into an old hatchback outside an emptied storefront, its windows papered over with blank sheets. A bronze statue stands behind her. Her half smile is gone. Crisp light, long shadows.',
        jobs: {
          zimage: 41825,
          krea2: 41826,
          arthemy: 41827,
          novacomic: 41828,
        },
      },
      {
        key: 'std-endings-mara-tipsy-hope',
        title: 'Mara ending, tipsy, hope: Open Studio, open-studio night',
        asset: 'endings/mara-tipsy-hope',
        size: '1344x768',
        seed: 71155,
        prompt:
          "Medium-wide shot of a tattoo studio's open-studio night on a warm summer evening, its doors open to the sidewalk. String lights loop over a laughing crowd holding drinks, and framed bird flash fills the walls, a small blank paper tag pinned under each piece. At the centre, a Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear raises a glass, half smiling. Warm glow, festive blur.",
        jobs: {
          zimage: 41829,
          krea2: 41830,
          arthemy: 41831,
          novacomic: 41832,
        },
      },
      {
        key: 'std-endings-mara-tipsy-dark',
        title:
          "Mara ending, tipsy, dark: Stolen Flash, her bird on someone else's stall",
        asset: 'endings/mara-tipsy-dark',
        size: '1344x768',
        seed: 71156,
        prompt:
          'Wide shot of a crowded night market under strings of warm bulbs. At a slick pop-up stall, vendors sell tote bags and mugs printed with a six-winged bird design while happy shoppers hold them up. Off to one side, a Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear stands alone with an untouched drink, watching her own bird go by. Warm glow, festive blur.',
        jobs: {
          zimage: 41833,
          krea2: 41834,
          arthemy: 41835,
          novacomic: 41836,
        },
      },
      {
        key: 'std-endings-mara-stoned-hope',
        title:
          'Mara ending, stoned, hope: Room to Grow, the cooperative studio hall',
        asset: 'endings/mara-stoned-hope',
        size: '1344x768',
        seed: 71157,
        prompt:
          'Wide shot down the long hall of an old waterfront warehouse converted into a cooperative of small artist studios, every door open, ferns and potted plants everywhere. In the foreground, a Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear leans in her doorway with a mug of tea, chatting with a neighbouring painter. Late autumn afternoon, a soft green haze softening every edge.',
        jobs: {
          zimage: 41837,
          krea2: 41838,
          arthemy: 41839,
          novacomic: 41840,
        },
      },
      {
        key: 'std-endings-mara-stoned-dark',
        title:
          'Mara ending, stoned, dark: Souvenir Humboldt, the souvenir window',
        asset: 'endings/mara-stoned-dark',
        size: '1344x768',
        seed: 71158,
        prompt:
          'Medium shot on a wet sidewalk on a foggy afternoon. Behind the rain-streaked window of a glossy souvenir shop, shelves of mugs, t-shirts and snow globes all carry the same six-winged bird design. A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear, stands before the glass in profile, hands in her apron pockets, her faint reflection over the display. Soft green haze, muted and dreamlike.',
        jobs: {
          zimage: 41841,
          krea2: 41842,
          arthemy: 41843,
          novacomic: 41844,
        },
      },
      {
        key: 'std-endings-mara-tripping_balls-hope',
        title:
          'Mara ending, tripping, hope: Original Line, the copies fly home',
        asset: 'endings/mara-tripping_balls-hope',
        size: '1344x768',
        seed: 71159,
        prompt:
          'Medium shot of a cluttered drawing table on a rainy winter night. A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear, sits before an open sketchbook as dozens of copies of a six-winged bird lift off scattered papers and mugs as glowing line drawings, swirl across the room and settle back into the single original on her page. Kaleidoscopic colour bleeds at the edges.',
        jobs: {
          zimage: 41845,
          krea2: 41846,
          arthemy: 41847,
          novacomic: 41848,
        },
      },
      {
        key: 'std-endings-mara-tripping_balls-dark',
        title:
          "Mara ending, tripping, dark: Erased Signature, the machine's wall of birds",
        asset: 'endings/mara-tripping_balls-dark',
        size: '1344x768',
        seed: 71160,
        prompt:
          'Wide shot of a sleek, dim hotel lobby dominated by a wall of huge glowing screens generating endless variations of a six-winged bird, each slightly wrong, wings multiplying and smearing. Small in the foreground, a Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear stands with a pencil in her hand and a crumpled sketch at her feet. Kaleidoscopic colour bleeds at the edges, uncanny and lonely.',
        jobs: {
          zimage: 41849,
          krea2: 41850,
          arthemy: 41851,
          novacomic: 41852,
        },
      },
      {
        key: 'std-endings-mara-cocaine-hope',
        title: 'Mara ending, cocaine, hope: the waiting list at the convention',
        asset: 'endings/mara-cocaine-hope',
        size: '1344x768',
        seed: 71161,
        prompt:
          'Wide shot of a packed tattoo convention hall at night under hard neon tubes. At a busy booth hung with framed six-winged bird flash, a Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear sketches a new design with total focus while a long line of excited clients snakes past the barrier. Harsh high-contrast cyan and magenta neon, razor-sharp edges, crisp black shadows.',
        jobs: {
          zimage: 41853,
          krea2: 41854,
          arthemy: 41855,
          novacomic: 41856,
        },
      },
      {
        key: 'std-endings-mara-cocaine-dark',
        title: 'Mara ending, cocaine, dark: the billboard over the highway',
        asset: 'endings/mara-cocaine-dark',
        size: '1344x768',
        seed: 71162,
        prompt:
          "Low angle wide shot of a roadside gas station on a highway at night. Above it towers a giant backlit billboard showing a gleaming rental car beside a huge six-winged bird design. Under the station's neon canopy, a Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear stands by her old hatchback, staring up at it. Harsh high-contrast neon, cold cyan and hot pink, sharp edges.",
        jobs: {
          zimage: 41857,
          krea2: 41858,
          arthemy: 41859,
          novacomic: 41860,
        },
      },
      {
        key: 'std-endings-mara-meth-hope',
        title: 'Mara ending, meth, hope: three a.m. on the plaza',
        asset: 'endings/mara-meth-hope',
        size: '1344x768',
        seed: 71163,
        prompt:
          "Wide shot of a small-town plaza at three in the morning, fog drifting under sodium-orange streetlights. A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear, stands alone on the empty sidewalk outside her dark studio, keys in hand, looking up at a fresh mural of a six-winged bird on the building's side wall. Tired but steady. Jittery grain, nothing glamorous, quiet pride.",
        jobs: {
          zimage: 41861,
          krea2: 41862,
          arthemy: 41863,
          novacomic: 41864,
        },
      },
      {
        key: 'std-endings-mara-meth-dark',
        title: 'Mara ending, meth, dark: the kitchen table at night',
        asset: 'endings/mara-meth-dark',
        size: '1344x768',
        seed: 71164,
        prompt:
          'Medium shot of a cramped kitchen at night, the blinds striped with sodium-orange light from the streetlamp outside. A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear, sits alone at the table under a work lamp, a blank sketchbook open before her and a pencil idle in her fingers, shop supplies stacked in boxes along the counter. Jittery grain, sleepless and lonely.',
        jobs: {
          zimage: 41865,
          krea2: 41866,
          arthemy: 41867,
          novacomic: 41868,
        },
      },
      {
        key: 'std-endings-mara-mdma-hope',
        title: 'Mara ending, MDMA, hope: the anniversary on the lawn',
        asset: 'endings/mara-mdma-hope',
        size: '1344x768',
        seed: 71165,
        prompt:
          'Wide shot of a small-town plaza lawn at golden hour in early summer. A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear, is wrapped in a laughing group hug by three young apprentices while clients crowd around, arms around each other, proudly showing six-winged bird tattoos on their forearms. Everyone glows. Warm soft light, gentle bloom, affectionate.',
        jobs: {
          zimage: 41869,
          krea2: 41870,
          arthemy: 41871,
          novacomic: 41872,
        },
      },
      {
        key: 'std-endings-mara-mdma-dark',
        title: 'Mara ending, MDMA, dark: the backyard potluck',
        asset: 'endings/mara-mdma-dark',
        size: '1344x768',
        seed: 71166,
        prompt:
          "Medium-wide shot of a small rented house's backyard at dusk in late autumn, with mismatched lanterns, folding chairs and a potluck table. Old friends and former clients pull a Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms, in a black t-shirt and a canvas shop apron, a pencil behind her ear into a long warm hug, sleeves rolled to show bird tattoos she drew years ago. Her own sketchbook lies closed on a chair. Glowing and touchy, but bittersweet.",
        jobs: {
          zimage: 41873,
          krea2: 41874,
          arthemy: 41875,
          novacomic: 41876,
        },
      },
      {
        key: 'std-endings-kit-sober-hope',
        title:
          'Kit ending, sober, hope: Workshop Charter, juggling class in the workshop yard',
        asset: 'endings/kit-sober-hope',
        size: '1344x768',
        seed: 71167,
        prompt:
          'Wide shot of a busy cooperative workshop yard on a clear spring morning. A large brass gear hangs above the open roll-up door of a converted warehouse, framed photographs of past sculptures lining the wall inside. In the yard, a Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches laughs as she teaches a row of young adult students to juggle wooden clubs, welding sparks flashing behind them. Crisp, clear light.',
        jobs: {
          zimage: 41877,
          krea2: 41878,
          arthemy: 41879,
          novacomic: 41880,
        },
      },
      {
        key: 'std-endings-kit-sober-dark',
        title:
          'Kit ending, sober, dark: Museum Without Makers, alone in the gallery',
        asset: 'endings/kit-sober-dark',
        size: '1344x768',
        seed: 71168,
        prompt:
          'Wide shot of a cool white museum gallery on a clear winter afternoon. Wild kinetic sculptures, a giant yellow banana slug on bicycle wheels among them, sit motionless behind velvet ropes beside small blank plaques. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, a travel backpack on one shoulder, stands alone before a sculpture she built, hands in her pockets, the only visitor. Crisp light, quiet.',
        jobs: {
          zimage: 41881,
          krea2: 41882,
          arthemy: 41883,
          novacomic: 41884,
        },
      },
      {
        key: 'std-endings-kit-tipsy-hope',
        title:
          'Kit ending, tipsy, hope: Carnival of Makers, the street carnival after the race',
        asset: 'endings/kit-tipsy-hope',
        size: '1344x768',
        seed: 71169,
        prompt:
          'Wide shot of a Victorian main street with gingerbread trim on a warm late-spring night after the race, parked kinetic sculptures lit up like a carnival. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, juggles glowing wooden clubs on a hay-bale stage while a costumed crowd cheers, drinks raised. Strings of warm bulbs zigzag between the old storefronts. Warm glow, festive bokeh and blur.',
        jobs: {
          zimage: 41885,
          krea2: 41886,
          arthemy: 41887,
          novacomic: 41888,
        },
      },
      {
        key: 'std-endings-kit-tipsy-dark',
        title:
          'Kit ending, tipsy, dark: Sponsored Spectacle, the sponsored parade',
        asset: 'endings/kit-tipsy-dark',
        size: '1344x768',
        seed: 71170,
        prompt:
          'Wide shot of a night parade on a small-town street hung with string lights. Identical glossy floats in matching corporate colours, blank banners and stacks of shipping crates roll past a crowd holding drinks. At the curb, a Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches stands quietly with a paper cup, a juggling club tucked under her arm, watching. Warm glow, festive blur, hollow cheer.',
        jobs: {
          zimage: 41889,
          krea2: 41890,
          arthemy: 41891,
          novacomic: 41892,
        },
      },
      {
        key: 'std-endings-kit-stoned-hope',
        title:
          'Kit ending, stoned, hope: Handmade City, hanging a mobile over the co-op courtyard',
        asset: 'endings/kit-stoned-hope',
        size: '1344x768',
        seed: 71171,
        prompt:
          'Wide shot of a cooperative courtyard of small, colourful hand-built homes and shared workshop sheds, with vegetable gardens and bicycles everywhere, on a mild autumn afternoon. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, stands on a ladder hanging a slowly turning wind-powered mobile of gears and bicycle wheels between two rooftops as neighbours wave. Soft green haze, dreamy and unhurried.',
        jobs: {
          zimage: 41893,
          krea2: 41894,
          arthemy: 41895,
          novacomic: 41896,
        },
      },
      {
        key: 'std-endings-kit-stoned-dark',
        title: 'Kit ending, stoned, dark: Creative Exodus, the boutique window',
        asset: 'endings/kit-stoned-dark',
        size: '1344x768',
        seed: 71172,
        prompt:
          'Medium shot on a rainy evening street outside an upscale boutique, where sleek polished miniatures of wild kinetic sculptures sit on marble plinths as luxury decor. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, walks past with a duffel bag on her shoulder and a bundle of juggling clubs, glancing back at the glass. Soft green haze, wet reflections, muted, dreamy melancholy.',
        jobs: {
          zimage: 41897,
          krea2: 41898,
          arthemy: 41899,
          novacomic: 41900,
        },
      },
      {
        key: 'std-endings-kit-tripping_balls-hope',
        title:
          'Kit ending, tripping, hope: Machine of Belonging, the impossible machine at dawn',
        asset: 'endings/kit-tripping_balls-hope',
        size: '1344x768',
        seed: 71173,
        prompt:
          'Wide shot of a foggy coastal pasture at dawn where an impossible kinetic machine towers over the grass, all interlocking gears, ladders, bicycle wheels and paddle wheels, each spinning wheel framing a glowing window onto a different moment of one long weekend. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, pedals at its controls, laughing. Kaleidoscopic colour bleeds at the edges.',
        jobs: {
          zimage: 41901,
          krea2: 41902,
          arthemy: 41903,
          novacomic: 41904,
        },
      },
      {
        key: 'std-endings-kit-tripping_balls-dark',
        title:
          'Kit ending, tripping, dark: Perfect Replica, the counterfeit plaza',
        asset: 'endings/kit-tripping_balls-dark',
        size: '1344x768',
        seed: 71174,
        prompt:
          'Wide shot of a glossy, too-perfect replica of a small-town college plaza, like a theme park: a bronze statue, a flawless lawn, and rows of identical copies of the same bright kinetic sculpture repeating forever. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, stands at the edge, the only rough, real thing in view. Kaleidoscopic colour bleeds and smears at the edges, uncanny and lonely.',
        jobs: {
          zimage: 41905,
          krea2: 41906,
          arthemy: 41907,
          novacomic: 41908,
        },
      },
      {
        key: 'std-endings-kit-cocaine-hope',
        title: 'Kit ending, cocaine, hope: the falling-safely class',
        asset: 'endings/kit-cocaine-hope',
        size: '1344x768',
        seed: 71175,
        prompt:
          'Medium-wide shot inside a big workshop at night, lit by hard cyan and magenta neon tubes. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, drops backward off a tall ladder into a perfect roll on thick crash mats, showing how to fall safely, while young adult students in helmets clap. A brass gear hangs over the doorway. Harsh high contrast, razor-sharp edges, crisp black shadows.',
        jobs: {
          zimage: 41909,
          krea2: 41910,
          arthemy: 41911,
          novacomic: 41912,
        },
      },
      {
        key: 'std-endings-kit-cocaine-dark',
        title: 'Kit ending, cocaine, dark: busking in a far city',
        asset: 'endings/kit-cocaine-dark',
        size: '1344x768',
        seed: 71176,
        prompt:
          'Wide shot of a rainy riverside city street at night beneath tall steel bridges, a Pacific Northwest downtown far from home. In the harsh glare of neon storefront light, a Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches juggles wooden clubs for a thin crowd of passersby with umbrellas, an open case at her feet. Harsh high-contrast cyan and red neon, sharp edges, hard reflections on wet pavement.',
        jobs: {
          zimage: 41913,
          krea2: 41914,
          arthemy: 41915,
          novacomic: 41916,
        },
      },
      {
        key: 'std-endings-kit-meth-hope',
        title: 'Kit ending, meth, hope: the 4 a.m. test run',
        asset: 'endings/kit-meth-hope',
        size: '1344x768',
        seed: 71177,
        prompt:
          'Wide shot of an empty small-town street at four in the morning under sodium-orange streetlights, the night before the race. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches and a figure in a weathered rain jacket, seen from behind, pedal a half-finished kinetic sculpture with mismatched wheels down the centre line, exhausted and grinning. Jittery grain, sleepless orange night, nothing glamorous.',
        jobs: {
          zimage: 41917,
          krea2: 41918,
          arthemy: 41919,
          novacomic: 41920,
        },
      },
      {
        key: 'std-endings-kit-meth-dark',
        title: 'Kit ending, meth, dark: drawing the gear on a postcard',
        asset: 'endings/kit-meth-dark',
        size: '1344x768',
        seed: 71178,
        prompt:
          'Medium shot of a cramped rented room at three in the morning, rain on the window and sodium-orange streetlight slanting across an unmade bed. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, sits awake at a tiny desk, drawing a small gear in the corner of a blank postcard, a row of finished postcards beside her juggling clubs. Jittery grain, sleepless, quiet and homesick.',
        jobs: {
          zimage: 41921,
          krea2: 41922,
          arthemy: 41923,
          novacomic: 41924,
        },
      },
      {
        key: 'std-endings-kit-mdma-hope',
        title: 'Kit ending, MDMA, hope: splashdown at the boat ramp',
        asset: 'endings/kit-mdma-hope',
        size: '1344x768',
        seed: 71179,
        prompt:
          'Wide shot of a sunny boat ramp on a wide bay as a kinetic sculpture splashes ashore, water streaming off its paddle wheel. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, throws her arms around her dripping crew and a figure in a weathered rain jacket seen from behind, and the crowd on the ramp joins in, everyone hugging. Warm glowing light, sparkling water, soft bloom.',
        jobs: {
          zimage: 41925,
          krea2: 41926,
          arthemy: 41927,
          novacomic: 41928,
        },
      },
      {
        key: 'std-endings-kit-mdma-dark',
        title: 'Kit ending, MDMA, dark: goodbye at the bus stop',
        asset: 'endings/kit-mdma-dark',
        size: '1344x768',
        seed: 71180,
        prompt:
          'Medium-wide shot of a small-town bus stop at dawn in early spring, mist on the street. A Hmong American woman in her late twenties with short asymmetric black hair, in paint-splattered mechanic coveralls with bright fabric patches, a duffel bag with juggling clubs strapped to it at her feet, is wrapped in a long group hug by old crew members and a figure in a weathered rain jacket seen from behind, as a bus waits with its door open. Warm glow, soft and touchy, bittersweet.',
        jobs: {
          zimage: 41929,
          krea2: 41930,
          arthemy: 41931,
          novacomic: 41932,
        },
      },
      {
        key: 'std-endings-juniper-sober-hope',
        title: 'Juniper, sober, hope: Patient Canopy',
        asset: 'endings/juniper-sober-hope',
        size: '1344x768',
        seed: 71181,
        prompt:
          'A clear spring morning in an old-growth redwood grove beside a restored creek. A curvy young woman with messy auburn hair, freckles, a green ribbon and tiny ferns in her hair, in a layered thrift-store sweater and a long patchwork skirt, kneels barefoot on moss at a still pool where salmon hold in the clear water. Her reflection in the pool has leafy branches growing from its hair. Behind her a trail crew in hard hats builds a wooden footbridge. Crisp, sharp light.',
        jobs: {
          zimage: 41933,
          krea2: 41934,
          arthemy: 41935,
          novacomic: 41936,
        },
      },
      {
        key: 'std-endings-juniper-sober-dark',
        title: 'Juniper, sober, dark: Silent Preserve',
        asset: 'endings/juniper-sober-dark',
        size: '1344x768',
        seed: 71182,
        prompt:
          'A cloudless, fogless late-summer noon. A tall chain-link fence with a keypad gate cuts across a redwood trail. Beside it stands a tidy glass gift shop pavilion and an empty parking lot, and beyond the fence a boarded-up cabin sits at the forest edge. A faded green ribbon flutters on the fence wire. A lone figure in a weathered rain jacket, seen from behind, rests one hand on the fence. Crisp, clear, sharp light.',
        jobs: {
          zimage: 41937,
          krea2: 41938,
          arthemy: 41939,
          novacomic: 41940,
        },
      },
      {
        key: 'std-endings-juniper-tipsy-hope',
        title: 'Juniper, tipsy, hope: Common Ground Jubilee',
        asset: 'endings/juniper-tipsy-hope',
        size: '1344x768',
        seed: 71183,
        prompt:
          'A summer night festival in a redwood clearing, string lights looped between giant trunks and long shared tables full of locals, loggers, families and festival folk. In the middle a curvy young woman with messy auburn hair, freckles, a green ribbon and tiny ferns in her hair, in a layered thrift-store sweater and a long patchwork skirt, dances barefoot and raises a cup in a toast. Green ribbons hang from the branches. Warm string-light glow, soft festive blur.',
        jobs: {
          zimage: 41941,
          krea2: 41942,
          arthemy: 41943,
          novacomic: 41944,
        },
      },
      {
        key: 'std-endings-juniper-tipsy-dark',
        title: 'Juniper, tipsy, dark: Festival Fence',
        asset: 'endings/juniper-tipsy-dark',
        size: '1344x768',
        seed: 71184,
        prompt:
          'A rainy autumn night. Inside a fenced redwood grove, a luxury event venue glows: crystal chandeliers hang from branches over a private gala of guests in evening wear, waiters with silver trays, a velvet rope at the gate. Outside the fence in the dark and rain, a few locals in hoodies and a figure in a weathered rain jacket, seen from behind, watch through the wire. Warm string-light glow in festive blur, cold rain in front.',
        jobs: {
          zimage: 41945,
          krea2: 41946,
          arthemy: 41947,
          novacomic: 41948,
        },
      },
      {
        key: 'std-endings-juniper-stoned-hope',
        title: 'Juniper, stoned, hope: Living Patchwork',
        asset: 'endings/juniper-stoned-hope',
        size: '1344x768',
        seed: 71185,
        prompt:
          'An autumn afternoon on a forest edge laid out like a quilt: a small family sawmill, rows of seedling trays in a tree nursery, a fenced vegetable plot and a mushroom-foraging path, all stitched together by second-growth redwoods. A curvy young woman with messy auburn hair, freckles, a green ribbon and tiny ferns in her hair, in a layered thrift-store sweater and a long patchwork skirt, sits on a stump handing a seedling to a mill worker. Soft green haze over everything.',
        jobs: {
          zimage: 41949,
          krea2: 41950,
          arthemy: 41951,
          novacomic: 41952,
        },
      },
      {
        key: 'std-endings-juniper-stoned-dark',
        title: 'Juniper, stoned, dark: Evergreen Dream',
        asset: 'endings/juniper-stoned-dark',
        size: '1344x768',
        seed: 71186,
        prompt:
          'An overcast spring afternoon in a manicured preserve. A pretty ornamental fountain and fresh landscaping face the visitor path, but just behind them a culvert pours murky brown runoff into a creek, silting over dead ferns and a stranded fish skeleton. A figure in a weathered rain jacket, seen from behind, crouches at the bank holding up a jar of cloudy water. Soft green haze makes it all look like a dream.',
        jobs: {
          zimage: 41953,
          krea2: 41954,
          arthemy: 41955,
          novacomic: 41956,
        },
      },
      {
        key: 'std-endings-juniper-tripping_balls-hope',
        title: 'Juniper, tripping, hope: Doors in the Roots',
        asset: 'endings/juniper-tripping_balls-hope',
        size: '1344x768',
        seed: 71187,
        prompt:
          'A misty winter dawn after rain. At the base of a colossal redwood, the roots part into an arched doorway that opens onto a glowing, different forest. A curvy young woman with messy auburn hair, freckles, a green ribbon and tiny ferns in her hair, in a layered thrift-store sweater and a long patchwork skirt, holds the root door open like a host while an old man with a cane and a mother with a child walk through on a ribbon-marked path. Kaleidoscopic colour bleeds at the edges.',
        jobs: {
          zimage: 41957,
          krea2: 41958,
          arthemy: 41959,
          novacomic: 41960,
        },
      },
      {
        key: 'std-endings-juniper-tripping_balls-dark',
        title: 'Juniper, tripping, dark: Mirror Grove',
        asset: 'endings/juniper-tripping_balls-dark',
        size: '1344x768',
        seed: 71188,
        prompt:
          "A winter dusk in a grove of redwoods whose trunks are tall mirrors, each reflecting a different forest. A locked steel turnstile stands at the grove's mouth. In the reflections, small stranded figures press their palms against the glass from the other side. A lone figure in a weathered rain jacket, seen from behind, stands in the center as their reflection repeats into the distance, and a green ribbon trails into one mirror. Kaleidoscopic colour bleeds at the edges.",
        jobs: {
          zimage: 41961,
          krea2: 41962,
          arthemy: 41963,
          novacomic: 41964,
        },
      },
      {
        key: 'std-endings-juniper-cocaine-hope',
        title: 'Juniper, cocaine, hope: The Night Count',
        asset: 'endings/juniper-cocaine-hope',
        size: '1344x768',
        seed: 71189,
        prompt:
          'A cold November night on a forest creek during the salmon run. Under hard white work floodlights at a wooden counting weir, big salmon thrash upstream in the shallows. A curvy young woman with messy auburn hair, freckles, a green ribbon and tiny ferns in her hair, in a layered thrift-store sweater and a long patchwork skirt tucked into waders, stands in the water with a clicker counter, grinning, beside two paid crew in headlamps. Harsh high-contrast neon tones, sharp edges, black shadows.',
        jobs: {
          zimage: 41965,
          krea2: 41966,
          arthemy: 41967,
          novacomic: 41968,
        },
      },
      {
        key: 'std-endings-juniper-cocaine-dark',
        title: 'Juniper, cocaine, dark: Security Lights',
        asset: 'endings/juniper-cocaine-dark',
        size: '1344x768',
        seed: 71190,
        prompt:
          'Night at a fenced forest preserve. Motion-sensor floodlights blaze on tall poles fitted with cameras, throwing the shadow of the fence wire in hard stripes across an empty trail. The locked gift shop glows cold blue, shelves of plush toys staring out at nothing. A small silhouette of a figure in a rain jacket stands at the gate, caught in the light. Harsh high-contrast neon, sharp edges, black shadows.',
        jobs: {
          zimage: 41969,
          krea2: 41970,
          arthemy: 41971,
          novacomic: 41972,
        },
      },
      {
        key: 'std-endings-juniper-meth-hope',
        title: 'Juniper, meth, hope: Ribbons Before Dawn',
        asset: 'endings/juniper-meth-hope',
        size: '1344x768',
        seed: 71191,
        prompt:
          'Four in the morning at the end of a logging road that has become a trailhead, where the last sodium streetlight of a small mill town meets the dark redwoods. A curvy young woman with messy auburn hair, freckles, a green ribbon and tiny ferns in her hair, in a layered thrift-store sweater and a long patchwork skirt, looks tired and wired as she ties fresh green ribbons onto a trail post. A thin blue line of dawn breaks above the trees. Grainy, jittery sodium-orange light.',
        jobs: {
          zimage: 41973,
          krea2: 41974,
          arthemy: 41975,
          novacomic: 41976,
        },
      },
      {
        key: 'std-endings-juniper-meth-dark',
        title: 'Juniper, meth, dark: The Edge Town at 3 A.M.',
        asset: 'endings/juniper-meth-dark',
        size: '1344x768',
        seed: 71192,
        prompt:
          'A winter night at three in the morning in what is left of a forest-edge hamlet: empty trailers with dark windows, a closed general store, a single sodium streetlight with moths swarming it. Beyond, the fenced forest is a black wall. A figure in a weathered rain jacket, seen from behind, sits sleepless on the tailgate of a pickup, hunched, listening to the wind. Gritty, grainy, jittery sodium-orange light, nothing glamorous.',
        jobs: {
          zimage: 41977,
          krea2: 41978,
          arthemy: 41979,
          novacomic: 41980,
        },
      },
      {
        key: 'std-endings-juniper-mdma-hope',
        title: 'Juniper, mdma, hope: The Forest Says Thank You',
        asset: 'endings/juniper-mdma-hope',
        size: '1344x768',
        seed: 71193,
        prompt:
          'Opening day of the protected woods on a golden early-summer evening. A whole crowd of loggers, hikers, grandparents and kids link arms in one enormous hug around the base of a giant redwood, cheeks against the bark. A curvy young woman with messy auburn hair, freckles, a green ribbon and tiny ferns in her hair, in a layered thrift-store sweater and a long patchwork skirt, leads the circle, eyes closed, beaming. Glowing, warm, soft bloom light.',
        jobs: {
          zimage: 41981,
          krea2: 41982,
          arthemy: 41983,
          novacomic: 41984,
        },
      },
      {
        key: 'std-endings-juniper-mdma-dark',
        title: 'Juniper, mdma, dark: The Goodbye Hugs',
        asset: 'endings/juniper-mdma-dark',
        size: '1344x768',
        seed: 71194,
        prompt:
          'Golden hour in autumn at the forest edge, beside packed cars and a rental moving truck. Neighbors who are being moved out hold each other in long, tearful hugs: an old couple, two friends, a family with a dog. Behind them a new fence runs along the redwoods. A figure in a weathered rain jacket, seen from behind, is wrapped in one of the hugs. Glowing warm light, soft bloom, bittersweet.',
        jobs: {
          zimage: 41985,
          krea2: 41986,
          arthemy: 41987,
          novacomic: 41988,
        },
      },
      {
        key: 'std-endings-cedar-sober-hope',
        title:
          'Cedar ending, sober, hope: Watershed Network, installing a creek sensor',
        asset: 'endings/cedar-sober-hope',
        size: '1344x768',
        seed: 71195,
        prompt:
          'Wide shot of a clear redwood creek on a bright spring morning. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, stands knee-deep in the water, bolting a small sensor post to a boulder while a crew in waders watches from the bank. A fiber line climbs the green ridge on wooden poles, his old pickup parked below. Crisp light.',
        jobs: {
          zimage: 41989,
          krea2: 41990,
          arthemy: 41991,
          novacomic: 41992,
        },
      },
      {
        key: 'std-endings-cedar-sober-dark',
        title:
          'Cedar ending, sober, dark: Private Backbone, outside the fenced tower',
        asset: 'endings/cedar-sober-dark',
        size: '1344x768',
        seed: 71196,
        prompt:
          'Wide shot of a bare, logged ridge on a cold, clear winter morning. A tall cell tower stands inside a chain-link fence with a blank sign. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, leans on the hood of his old pickup outside the fence, the vintage CB radio handset silent in his hand, looking up. Crisp, sharp light, long shadows, lonely.',
        jobs: {
          zimage: 41993,
          krea2: 41994,
          arthemy: 41995,
          novacomic: 41996,
        },
      },
      {
        key: 'std-endings-cedar-tipsy-hope',
        title:
          'Cedar ending, tipsy, hope: Toast to Tomorrow, the toast in the grange hall',
        asset: 'endings/cedar-tipsy-hope',
        size: '1344x768',
        seed: 71197,
        prompt:
          'Medium-wide shot of a crowded wooden grange hall on an autumn harvest night, warm bulbs strung across the rafters. Loggers, growers and young technicians share long tables. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, stands on a chair mid-toast, bottle raised, and the hall toasts back. Warm glow, festive blur.',
        jobs: {
          zimage: 41997,
          krea2: 41998,
          arthemy: 41999,
          novacomic: 42000,
        },
      },
      {
        key: 'std-endings-cedar-tipsy-dark',
        title:
          "Cedar ending, tipsy, dark: Salesman’s Promise, the developer's launch party",
        asset: 'endings/cedar-tipsy-dark',
        size: '1344x768',
        seed: 71198,
        prompt:
          'Wide shot of a flashy launch party in a big white tent on a summer night, string lights overhead. On a glossy stage, a slick presenter gestures at a glowing screen of a gleaming tower as the crowd cheers with champagne flutes. At the back, a rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket stands with arms folded, not cheering. Warm glow, festive blur.',
        jobs: {
          zimage: 42001,
          krea2: 42002,
          arthemy: 42003,
          novacomic: 42004,
        },
      },
      {
        key: 'std-endings-cedar-stoned-hope',
        title:
          'Cedar ending, stoned, hope: Redwood Cloud, tailgate at the forest co-op',
        asset: 'endings/cedar-stoned-hope',
        size: '1344x768',
        seed: 71199,
        prompt:
          "Wide shot of a misty redwood clearing on a damp early-autumn afternoon. A small timber building with a living roof and solar panels hums beside a creek with a tiny water wheel, server racks glowing softly through its glass door. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, sits on his pickup's tailgate sharing a thermos with a forest crew. Soft green haze, dreamy.",
        jobs: {
          zimage: 42005,
          krea2: 42006,
          arthemy: 42007,
          novacomic: 42008,
        },
      },
      {
        key: 'std-endings-cedar-stoned-dark',
        title:
          'Cedar ending, stoned, dark: Server Clearing, the dry creek by the server farm',
        asset: 'endings/cedar-stoned-dark',
        size: '1344x768',
        seed: 71200,
        prompt:
          'Wide shot of a vast windowless server warehouse filling a raw clearing cut from the forest, cooling towers pouring steam into the fog. In the foreground a creek bed has run dry to bleached stones and stumps. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, crouches on the dry rocks, one hand resting on the empty channel. Soft green haze, muted, heavy and quiet.',
        jobs: {
          zimage: 42009,
          krea2: 42010,
          arthemy: 42011,
          novacomic: 42012,
        },
      },
      {
        key: 'std-endings-cedar-tripping_balls-hope',
        title:
          'Cedar ending, tripping, hope: Signal from Home, the signal over the valley',
        asset: 'endings/cedar-tripping_balls-hope',
        size: '1344x768',
        seed: 71201,
        prompt:
          'Wide shot from a dark ridge top on a clear summer night. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, kneels by his old pickup, the CB handset to his ear, while rings of radio waves ripple across the sky in rainbow colours. Below, the valley glows with lit ridgeline fiber and a bright bus on the road. Kaleidoscopic colour bleeds at the edges.',
        jobs: {
          zimage: 42013,
          krea2: 42014,
          arthemy: 42015,
          novacomic: 42016,
        },
      },
      {
        key: 'std-endings-cedar-tripping_balls-dark',
        title:
          'Cedar ending, tripping, dark: Perfect Prediction Trap, every cable to one tower',
        asset: 'endings/cedar-tripping_balls-dark',
        size: '1344x768',
        seed: 71202,
        prompt:
          'Wide shot of a redwood grove at night where glowing tags on every trunk spill light that braids into cables, all converging on a single black monolithic tower on the far ridge. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, stands among the trunks, small and still, the CB handset dangling on its cord. Kaleidoscopic colour bleeds at the edges, cold and uncanny.',
        jobs: {
          zimage: 42017,
          krea2: 42018,
          arthemy: 42019,
          novacomic: 42020,
        },
      },
      {
        key: 'std-endings-cedar-cocaine-hope',
        title: 'Cedar ending, cocaine, hope: night shift at the bus depot',
        asset: 'endings/cedar-cocaine-hope',
        size: '1344x768',
        seed: 71203,
        prompt:
          "Low angle wide shot inside a bus depot at night under hard white and cyan floodlights. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, slides out from beneath a sleek electric bus on a mechanic's creeper, grinning, wrench in hand, the vintage CB radio handset clipped to his jacket. A row of gleaming buses waits for morning. Harsh high-contrast neon, razor-sharp edges.",
        jobs: {
          zimage: 42021,
          krea2: 42022,
          arthemy: 42023,
          novacomic: 42024,
        },
      },
      {
        key: 'std-endings-cedar-cocaine-dark',
        title: "Cedar ending, cocaine, dark: the boxes he can't open",
        asset: 'endings/cedar-cocaine-dark',
        size: '1344x768',
        seed: 71204,
        prompt:
          'Medium shot of a cramped home garage at night under a buzzing fluorescent tube and the blue glow of a sealed router. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, sits at a cluttered workbench facing sealed black boxes with no screws, a screwdriver idle in his hand. Harsh high-contrast light, sharp edges, cold cyan glare.',
        jobs: {
          zimage: 42025,
          krea2: 42026,
          arthemy: 42027,
          novacomic: 42028,
        },
      },
      {
        key: 'std-endings-cedar-meth-hope',
        title: 'Cedar ending, meth, hope: storm repair on the ridge road',
        asset: 'endings/cedar-meth-hope',
        size: '1344x768',
        seed: 71205,
        prompt:
          'Wide shot of a ridge road at three in the morning in a winter storm. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, works from a ladder against a utility pole, splicing a broken fiber line by headlamp, while his old pickup below throws sodium-orange light through the rain. Jittery grain, sleepless orange night, nothing glamorous, just keeping the county online until dawn.',
        jobs: {
          zimage: 42029,
          krea2: 42030,
          arthemy: 42031,
          novacomic: 42032,
        },
      },
      {
        key: 'std-endings-cedar-meth-dark',
        title: 'Cedar ending, meth, dark: static at the closed mill',
        asset: 'endings/cedar-meth-dark',
        size: '1344x768',
        seed: 71206,
        prompt:
          'Wide shot of a shuttered sawmill at three in the morning, its gate chained and log yard empty under a single sodium-orange lamp. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, sits alone in the open door of his old pickup, the vintage CB radio handset in his hand, listening to static that never answers. Fog over the empty yard. Jittery grain, sleepless, worn down.',
        jobs: {
          zimage: 42033,
          krea2: 42034,
          arthemy: 42035,
          novacomic: 42036,
        },
      },
      {
        key: 'std-endings-cedar-mdma-hope',
        title: 'Cedar ending, MDMA, hope: Sunday dinner at the farmhouse',
        asset: 'endings/cedar-mdma-hope',
        size: '1344x768',
        seed: 71207,
        prompt:
          'Medium-wide shot of a farmhouse kitchen at Sunday dinner in early summer, golden evening light. A rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket, laughs inside a tangle of hugs, while at the table an older Latino man with a grey moustache and an older woman with a long silver braid bicker fondly, holding hands. A CB radio glows on the counter. Warm glow.',
        jobs: {
          zimage: 42037,
          krea2: 42038,
          arthemy: 42039,
          novacomic: 42040,
        },
      },
      {
        key: 'std-endings-cedar-mdma-dark',
        title: 'Cedar ending, MDMA, dark: soup for anyone hungry',
        asset: 'endings/cedar-mdma-dark',
        size: '1344x768',
        seed: 71208,
        prompt:
          'Wide shot of a farmhouse yard on a drizzly winter evening, folding tables under a canvas tarp and lanterns glowing. An older Latino man with a grey moustache and an older woman with a long silver braid ladle soup for hungry neighbours, and a rugged rural man in his thirties of mixed Latino heritage, with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap and an oil-stained canvas work jacket hugs a tired stranger close as others embrace. Warm glow against the cold, bittersweet.',
        jobs: {
          zimage: 42041,
          krea2: 42042,
          arthemy: 42043,
          novacomic: 42044,
        },
      },
      {
        key: 'std-endings-alone-sober-hope',
        title: 'Alone, sober, hope: The Witness',
        asset: 'endings/alone-sober-hope',
        size: '1344x768',
        seed: 71209,
        prompt:
          'A packed county meeting hall on a bright spring morning, tall windows full of daylight. At the front a figure in a weathered rain jacket, seen from behind, points at a projected hand-drawn map of fog banks, doors and bird sightings. Rows of neighbors lean forward, some holding photocopied pages of the same sketches. Crisp, clear light, every detail sharp.',
        jobs: {
          zimage: 42045,
          krea2: 42046,
          arthemy: 42047,
          novacomic: 42048,
        },
      },
      {
        key: 'std-endings-alone-sober-dark',
        title: 'Alone, sober, dark: The Unread Report',
        asset: 'endings/alone-sober-dark',
        size: '1344x768',
        seed: 71210,
        prompt:
          'A small, dusty desk by a window on a clear winter morning. A tall stack of worn field notebooks, rubber bands around them, pages bristling with sketches of fog, doors and birds, sits untouched beside a cold mug. A hand in a rain-jacket sleeve rests on top of the stack. Out the window, survey stakes and a parked excavator mark an ordinary new development on a fogless hill. Crisp, clear, sharp light.',
        jobs: {
          zimage: 42049,
          krea2: 42050,
          arthemy: 42051,
          novacomic: 42052,
        },
      },
      {
        key: 'std-endings-alone-tipsy-hope',
        title: "Alone, tipsy, hope: Everybody's Cousin",
        asset: 'endings/alone-tipsy-hope',
        size: '1344x768',
        seed: 71211,
        prompt:
          "A late-summer evening in a big backyard after a neighbor's porch has been rebuilt by a dozen small crews. Fresh lumber, tools set down, string lights strung across, and everyone raising bottles and cups at a long potluck table. A figure in a weathered rain jacket, seen from behind at the head of the table, is being toasted from every side. Warm string-light glow, soft festive blur.",
        jobs: {
          zimage: 42053,
          krea2: 42054,
          arthemy: 42055,
          novacomic: 42056,
        },
      },
      {
        key: 'std-endings-alone-tipsy-dark',
        title: 'Alone, tipsy, dark: Last Call',
        asset: 'endings/alone-tipsy-dark',
        size: '1344x768',
        seed: 71212,
        prompt:
          'Closing time in a small-town bar on a wet night. Chairs are up on the tables, the string lights are still on, and a bartender wipes the counter. A figure in a weathered rain jacket, seen from behind, sits alone at the bar with a last drink. Through the front window, the laughing party crowd walks away down the rain-shiny street together. Warm string-light glow, soft blur, melancholy.',
        jobs: {
          zimage: 42057,
          krea2: 42058,
          arthemy: 42059,
          novacomic: 42060,
        },
      },
      {
        key: 'std-endings-alone-stoned-hope',
        title: 'Alone, stoned, hope: The Long Listen',
        asset: 'endings/alone-stoned-hope',
        size: '1344x768',
        seed: 71213,
        prompt:
          'An autumn afternoon in a quiet redwood grove. A figure in a weathered rain jacket, seen from behind, sits cross-legged with both hands on a hollow fallen log, tapping out a slow rhythm. Around them a small circle of listeners of every age, a teenager, a retiree, a mill worker, has their palms on the log too, eyes closed. Shafts of light fall through a soft green haze.',
        jobs: {
          zimage: 42061,
          krea2: 42062,
          arthemy: 42063,
          novacomic: 42064,
        },
      },
      {
        key: 'std-endings-alone-stoned-dark',
        title: 'Alone, stoned, dark: Background Noise',
        asset: 'endings/alone-stoned-dark',
        size: '1344x768',
        seed: 71214,
        prompt:
          'An overcast afternoon at a gravel turnout beside a busy four-lane highway. Trucks and cars smear past in long streaks. A figure in a weathered rain jacket, seen from behind and small in the wide view, stands at the guardrail with a notebook under one arm and a hand cupped to an ear, straining toward the redwood hills beyond, which are muted behind the traffic. Soft green haze, dull and dreamy.',
        jobs: {
          zimage: 42065,
          krea2: 42066,
          arthemy: 42067,
          novacomic: 42068,
        },
      },
      {
        key: 'std-endings-alone-tripping_balls-hope',
        title: 'Alone, tripping, hope: Your Own Door',
        asset: 'endings/alone-tripping_balls-hope',
        size: '1344x768',
        seed: 71215,
        prompt:
          'Dawn on a spring coastal headland above the sea. A doorway of light stands open in a bank of fog on the cliff path, and the small silhouette of a figure in a rain jacket steps back out of it, holding up a hand-drawn map. Down the path a little crowd of neighbors waits with thermoses, waving. Kaleidoscopic colour bleeds at the edges of the fog.',
        jobs: {
          zimage: 42069,
          krea2: 42070,
          arthemy: 42071,
          novacomic: 42072,
        },
      },
      {
        key: 'std-endings-alone-tripping_balls-dark',
        title: 'Alone, tripping, dark: Lost in the Fog',
        asset: 'endings/alone-tripping_balls-dark',
        size: '1344x768',
        seed: 71216,
        prompt:
          'Night in a field of coastal sand dunes swallowed by fog. Dozens of freestanding doorways stand open across the dunes, each glowing a different colour. In the middle, the small silhouette of a figure in a rain jacket turns in place, unsure which one leads home. Kaleidoscopic colour bleeds and smears around the borders.',
        jobs: {
          zimage: 42073,
          krea2: 42074,
          arthemy: 42075,
          novacomic: 42076,
        },
      },
      {
        key: 'std-endings-alone-cocaine-hope',
        title: 'Alone, cocaine, hope: The Night Call',
        asset: 'endings/alone-cocaine-hope',
        size: '1344x768',
        seed: 71217,
        prompt:
          'A stormy winter night at a harbor jetty. A wall of fog rolls in off the bay with a strange, glitching square edge, as if the weather were badly copied. The tiny silhouette of a figure in a rain jacket walks out along the rocks with a flashlight beam cutting the fog, an old pickup idling behind with its headlights on. Harsh high-contrast neon light, sharp edges, black shadows.',
        jobs: {
          zimage: 42077,
          krea2: 42078,
          arthemy: 42079,
          novacomic: 42080,
        },
      },
      {
        key: 'std-endings-alone-cocaine-dark',
        title: 'Alone, cocaine, dark: The Wall of Pages',
        asset: 'endings/alone-cocaine-dark',
        size: '1344x768',
        seed: 71218,
        prompt:
          'A cramped apartment at night. One wall is covered in notebook pages of sketches, fog banks, doors, birds, joined by red string. A figure in a weathered rain jacket, seen from behind, stands before it, one arm raised to pin up another page. Rain streaks the window, and unreadable neon glow from the street floods in. Harsh high-contrast neon, sharp edges, black shadows.',
        jobs: {
          zimage: 42081,
          krea2: 42082,
          arthemy: 42083,
          novacomic: 42084,
        },
      },
      {
        key: 'std-endings-alone-meth-hope',
        title: 'Alone, meth, hope: The All-Night Watch',
        asset: 'endings/alone-meth-hope',
        size: '1344x768',
        seed: 71219,
        prompt:
          'An all-night roadside diner at four in the morning. A figure in a weathered rain jacket, seen from behind in a booth, keeps watch over a sketchbook full of fog drawings and a cold cup of coffee. Through the big window, fog under the sodium lamps of the empty parking lot has folded itself into the shape of a doorway. Tired, wired, sleepless, gritty sodium-orange light, nothing glamorous.',
        jobs: {
          zimage: 42085,
          krea2: 42086,
          arthemy: 42087,
          novacomic: 42088,
        },
      },
      {
        key: 'std-endings-alone-meth-dark',
        title: 'Alone, meth, dark: The Old Mill Fence',
        asset: 'endings/alone-meth-dark',
        size: '1344x768',
        seed: 71220,
        prompt:
          'A sleepless night on an industrial bay waterfront. A tall fence runs past a derelict pulp mill, its stacks lost in fog under buzzing sodium lamps. The tiny figure of someone in a weathered rain jacket, seen from behind, walks along the fence with a notebook pressed to their chest. Puddles, litter, gulls asleep on pilings. Gritty, grainy, jittery sodium-orange light, nothing glamorous.',
        jobs: {
          zimage: 42089,
          krea2: 42090,
          arthemy: 42091,
          novacomic: 42092,
        },
      },
      {
        key: 'std-endings-alone-mdma-hope',
        title: 'Alone, mdma, hope: Bonfire Welcome',
        asset: 'endings/alone-mdma-hope',
        size: '1344x768',
        seed: 71221,
        prompt:
          'A summer dusk on a wide driftwood beach with a big bonfire. A figure in a weathered rain jacket, seen from behind, is caught in a group hug by a dozen grateful neighbors, surfers, a fisherman, an old woman in a knit cap, all laughing with their arms around each other. Sparks rise into a pink sky over the surf. Glowing, warm, soft bloom light.',
        jobs: {
          zimage: 42093,
          krea2: 42094,
          arthemy: 42095,
          novacomic: 42096,
        },
      },
      {
        key: 'std-endings-alone-mdma-dark',
        title: 'Alone, mdma, dark: Hugging Yourself',
        asset: 'endings/alone-mdma-dark',
        size: '1344x768',
        seed: 71222,
        prompt:
          'A late-afternoon music festival in a sunny meadow ringed by forest. Everywhere, friends and couples are hugging, swaying, leaning into each other in pairs and piles. In the middle of it all, a figure in a weathered rain jacket, seen from behind and small in the crowd, hugs a notebook to their own chest, with no one to hold. Glowing, warm, soft bloom light, bittersweet.',
        jobs: {
          zimage: 42097,
          krea2: 42098,
          arthemy: 42099,
          novacomic: 42100,
        },
      },
      {
        key: 'std-endings-ecotopia-sober-hope',
        title: 'Ecotopia, sober, hope: The Census of Everything',
        asset: 'endings/ecotopia-sober-hope',
        size: '1344x768',
        seed: 71223,
        prompt:
          "A clear spring morning over a vast restored tidal marsh, twice the size it ever was, braided with channels and full of birds: great blue herons, white egrets, a cloud of sandpipers wheeling low. Far out on a wooden boardwalk, a tiny figure in a rain jacket, seen from behind, holds up a tally counter. A small town sits at the marsh's distant edge. Crisp, clear light, sharp detail.",
        jobs: {
          zimage: 42101,
          krea2: 42102,
          arthemy: 42103,
          novacomic: 42104,
        },
      },
      {
        key: 'std-endings-ecotopia-sober-dark',
        title: 'Ecotopia, sober, dark: Field Notes for No One',
        asset: 'endings/ecotopia-sober-dark',
        size: '1344x768',
        seed: 71224,
        prompt:
          'Inside a small wooden cabin on a clear spring morning. A shelf sags under rows of identical worn bird notebooks. On the windowsill sit a good pair of binoculars and a mug, and outside the window a bird feeder is busy with jays and finches, with a wooded river glinting beyond. The room is quiet and deserted. Crisp, clear, sharp light.',
        jobs: {
          zimage: 42105,
          krea2: 42106,
          arthemy: 42107,
          novacomic: 42108,
        },
      },
      {
        key: 'std-endings-ecotopia-tipsy-hope',
        title: 'Ecotopia, tipsy, hope: The Long Toast',
        asset: 'endings/ecotopia-tipsy-hope',
        size: '1344x768',
        seed: 71225,
        prompt:
          'An autumn dusk on a wide river running through a small town. Big salmon leap the riffles below an old wooden footbridge strung with warm lights, where a row of tiny townspeople raise glasses toward the fish. A heron stands in the shallows watching. The salmon fill the foreground. Warm string-light glow, soft festive blur.',
        jobs: {
          zimage: 42109,
          krea2: 42110,
          arthemy: 42111,
          novacomic: 42112,
        },
      },
      {
        key: 'std-endings-ecotopia-tipsy-dark',
        title: 'Ecotopia, tipsy, dark: The Bar Stool Naturalist',
        asset: 'endings/ecotopia-tipsy-dark',
        size: '1344x768',
        seed: 71226,
        prompt:
          'Night in a tiny rural tavern of knotty pine. A figure in a weathered rain jacket, seen from behind on a bar stool, spreads both arms wide like elk antlers, mid-story, to the same three old regulars, who look patient and fond. Through the window behind the bar, real elk graze in the dark pasture. Warm string-light glow, soft festive blur.',
        jobs: {
          zimage: 42113,
          krea2: 42114,
          arthemy: 42115,
          novacomic: 42116,
        },
      },
      {
        key: 'std-endings-ecotopia-stoned-hope',
        title: 'Ecotopia, stoned, hope: The Slow Green Country',
        asset: 'endings/ecotopia-stoned-hope',
        size: '1344x768',
        seed: 71227,
        prompt:
          'A summer morning on the site of an old lumber mill beside the bay. Where the mill stood there is now a grassy meadow broken by mossy concrete foundations and a lone brick smokestack wrapped in vines. A herd of Roosevelt elk grazes slowly across it, a bull with great antlers lifting his head. Fog lies on the water. Only the animals are here, the land wild and unpeopled. Soft green haze, slow and dreamy.',
        jobs: {
          zimage: 42117,
          krea2: 42118,
          arthemy: 42119,
          novacomic: 42120,
        },
      },
      {
        key: 'std-endings-ecotopia-stoned-dark',
        title: 'Ecotopia, stoned, dark: Smoke Over the Water',
        asset: 'endings/ecotopia-stoned-dark',
        size: '1344x768',
        seed: 71228,
        prompt:
          'An autumn dawn at a cabin on a river bend. Woodstove smoke drifts from the chimney low over the still water. On the porch, a figure in a weathered rain jacket, seen from behind in an old chair, holds binoculars on a great blue heron standing in the misty shallows. Neither of them moves. Soft green haze, slow and dreamy.',
        jobs: {
          zimage: 42121,
          krea2: 42122,
          arthemy: 42123,
          novacomic: 42124,
        },
      },
      {
        key: 'std-endings-ecotopia-tripping_balls-hope',
        title: "Ecotopia, tripping, hope: The Animals' Parliament",
        asset: 'endings/ecotopia-tripping_balls-hope',
        size: '1344x768',
        seed: 71229,
        prompt:
          'Spring twilight on a great wetland. Dozens of great blue herons stand in a wide semicircle on the mudflat like a parliament, and around them gather real animals: elk at the reeds, river otters on a log, ravens on a snag, a black bear at the edge of the trees. One heron in the middle stands tall. A tiny human silhouette waits at the far shore. Kaleidoscopic colour bleeds at the edges.',
        jobs: {
          zimage: 42125,
          krea2: 42126,
          arthemy: 42127,
          novacomic: 42128,
        },
      },
      {
        key: 'std-endings-ecotopia-tripping_balls-dark',
        title: 'Ecotopia, tripping, dark: The Door Left Open',
        asset: 'endings/ecotopia-tripping_balls-dark',
        size: '1344x768',
        seed: 71230,
        prompt:
          'A winter evening inside a cabin. The front door stands wide open, and through it, instead of snow, glows a brilliant green future: a vast marsh full of herons and elk under a bright sky. A figure in a weathered rain jacket, seen from behind, sits by the woodstove in an armchair facing the door with a blanket on their knees, not getting up. Kaleidoscopic colour bleeds at the edges.',
        jobs: {
          zimage: 42129,
          krea2: 42130,
          arthemy: 42131,
          novacomic: 42132,
        },
      },
      {
        key: 'std-endings-ecotopia-cocaine-hope',
        title: 'Ecotopia, cocaine, hope: Salmon Through Downtown',
        asset: 'endings/ecotopia-cocaine-hope',
        size: '1344x768',
        seed: 71231,
        prompt:
          'Night in a small town that has daylighted its buried creek. A wild, rocky stream now runs straight down the middle of the old main street between storefronts, and a dense salmon run thrashes upstream under a low bridge. A raccoon watches from a boulder. Cold blue and pink light reflects off the wet scales. Only the animals are here, the land wild and unpeopled. Harsh high-contrast neon, sharp edges, black shadows.',
        jobs: {
          zimage: 42133,
          krea2: 42134,
          arthemy: 42135,
          novacomic: 42136,
        },
      },
      {
        key: 'std-endings-ecotopia-cocaine-dark',
        title: 'Ecotopia, cocaine, dark: The Feeder Floodlight',
        asset: 'endings/ecotopia-cocaine-dark',
        size: '1344x768',
        seed: 71232,
        prompt:
          'Night outside a lonely cabin in the woods. A cold LED floodlight blasts the bird feeder, where a raccoon hangs from the pole and a great horned owl watches from a fence post. Inside, the silhouette of a figure stands at the window with binoculars raised. Harsh high-contrast neon, sharp edges, black shadows.',
        jobs: {
          zimage: 42137,
          krea2: 42138,
          arthemy: 42139,
          novacomic: 42140,
        },
      },
      {
        key: 'std-endings-ecotopia-meth-hope',
        title: 'Ecotopia, meth, hope: The Overpass Crossing',
        asset: 'endings/ecotopia-meth-hope',
        size: '1344x768',
        seed: 71233,
        prompt:
          'A winter night at an old highway overpass that has been turned into a wildlife bridge, planted with grass and young alders. A line of elk crosses it in single file under the last few sodium streetlights, breath steaming, the empty road below. Only the animals are here, the land wild and unpeopled. Grainy, jittery sodium-orange light, sleepless and restless, but the animals are crossing safely.',
        jobs: {
          zimage: 42141,
          krea2: 42142,
          arthemy: 42143,
          novacomic: 42144,
        },
      },
      {
        key: 'std-endings-ecotopia-meth-dark',
        title: 'Ecotopia, meth, dark: The 3 A.M. Road',
        asset: 'endings/ecotopia-meth-dark',
        size: '1344x768',
        seed: 71234,
        prompt:
          'Three in the morning on a lonely river road in winter. One sodium streetlamp stands by a cabin, and a small herd of elk walks down the middle of the empty road through its orange pool of light. On the dark porch, the tiny figure of someone in a weathered rain jacket, seen from behind, sits awake with binoculars. Grainy, jittery sodium-orange light, sleepless, nothing glamorous.',
        jobs: {
          zimage: 42145,
          krea2: 42146,
          arthemy: 42147,
          novacomic: 42148,
        },
      },
      {
        key: 'std-endings-ecotopia-mdma-hope',
        title: 'Ecotopia, mdma, hope: Everyone Holding On',
        asset: 'endings/ecotopia-mdma-hope',
        size: '1344x768',
        seed: 71235,
        prompt:
          'A golden summer sunset on the bay. In the kelp, a raft of sea otters floats on their backs holding paws so they will not drift apart, and on an old dock a pile of harbor seals lies cuddled together. A heron stands on a piling, only animals. Glowing, warm, soft bloom light, tender and close. An unpeopled setting, the subject alone, the space around it bare and deserted.',
        jobs: {
          zimage: 42149,
          krea2: 42150,
          arthemy: 42151,
          novacomic: 42152,
        },
      },
      {
        key: 'std-endings-ecotopia-mdma-dark',
        title: 'Ecotopia, mdma, dark: Some Mornings the Elk Come Down',
        asset: 'endings/ecotopia-mdma-dark',
        size: '1344x768',
        seed: 71236,
        prompt:
          'A late-summer morning in a meadow below a little cabin. An elk cow nuzzles her calf, and two ravens preen each other on the split-rail fence. Small at the fence, a figure in a weathered rain jacket, seen from behind, raises a hand to wave at the elk, binoculars around their neck. Glowing, warm, soft bloom light, kind and quiet and a little sad.',
        jobs: {
          zimage: 42153,
          krea2: 42154,
          arthemy: 42155,
          novacomic: 42156,
        },
      },
    ],
    notes: {},
  },
  {
    id: 'bakeoff',
    title: 'Checkpoint bake-off',
    blurb:
      'Eight checkpoints on the same eight subjects and seeds: the four companions and four Humboldt settings.',
    lanes: [
      {
        key: 'arthemy',
        label: 'Arthemy Western Art v3.0 (current house, baseline)',
        engine: 'comfy',
        checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'illustrij',
        label: 'Illustrij v2.1',
        engine: 'comfy',
        checkpoint: 'Illustrious/illustrij_v21.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'novacomic',
        label: 'Nova Comic XL v2.0',
        engine: 'comfy',
        checkpoint: 'Illustrious/novaComicXL_v20.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'realism',
        label: 'Realism Illustrious v5.5',
        engine: 'comfy',
        checkpoint: 'Illustrious/realismIllustriousBy_v55FP16.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'nihilmania',
        label: 'SDXL Unstable Diffusers nihilmania',
        engine: 'comfy',
        checkpoint: 'SDXL/sdxlUnstableDiffusers_nihilmania.safetensors',
        steps: null,
        cfg: null,
        sampler: null,
      },
      {
        key: 'krea2',
        label: 'Krea 2',
        engine: 'krea2',
        checkpoint: 'krea2',
        steps: null,
        cfg: null,
        sampler: null,
      },
      {
        key: 'zimage',
        label: 'Z-Image Turbo',
        engine: 'zimage',
        checkpoint: 'zimage',
        steps: null,
        cfg: null,
        sampler: null,
      },
      {
        key: 'flux2',
        label: 'Flux 2 Klein',
        engine: 'flux2',
        checkpoint: 'flux2',
        steps: null,
        cfg: null,
        sampler: null,
      },
    ],
    subjects: [
      {
        key: 'ck-mara',
        title: 'Mara, tattoo artist (sober guide)',
        asset: '',
        size: '832x1216',
        seed: 64101,
        prompt:
          'A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms sits at a festival tattoo table under string lights. She wears a black t-shirt and a canvas shop apron, a pencil tucked behind her ear, a sketchbook of bird designs open in front of her, and gives a dry, knowing half smile. Redwood forest behind her at dusk.',
        jobs: {
          arthemy: 40884,
          illustrij: 40885,
          novacomic: 40886,
          realism: 40887,
          nihilmania: 40888,
          krea2: 40889,
          zimage: 40890,
          flux2: 40891,
        },
      },
      {
        key: 'ck-kit',
        title: 'Kit, kinetic sculptor and juggler (tipsy guide)',
        asset: '',
        size: '832x1216',
        seed: 64102,
        prompt:
          'A Hmong American woman in her late twenties with short asymmetric black hair, wearing paint-splattered mechanic coveralls covered in bright fabric patches, laughs as she juggles three wooden juggling clubs beside a pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights glowing around her.',
        jobs: {
          arthemy: 40892,
          illustrij: 40893,
          novacomic: 40894,
          realism: 40895,
          nihilmania: 40896,
          krea2: 40897,
          zimage: 40898,
          flux2: 40899,
        },
      },
      {
        key: 'ck-juniper',
        title: 'Juniper, forest guide (stoned guide)',
        asset: '',
        size: '832x1216',
        seed: 64103,
        prompt:
          'A curvy young woman in her twenties with messy auburn hair, freckles and a warm teasing smile stands barefoot on moss among giant redwood roots. She wears a layered thrift-store sweater and a long patchwork skirt, with a green ribbon and tiny ferns growing in her hair, lit by a soft green forest glow.',
        jobs: {
          arthemy: 40900,
          illustrij: 40901,
          novacomic: 40902,
          realism: 40903,
          nihilmania: 40904,
          krea2: 40905,
          zimage: 40906,
          flux2: 40907,
        },
      },
      {
        key: 'ck-cedar',
        title: 'Cedar, backroads mechanic (tripping guide)',
        asset: '',
        size: '832x1216',
        seed: 64104,
        prompt:
          'A rugged rural man in his thirties with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap, an oil-stained canvas work jacket and scuffed work boots, grins mischievously while holding a vintage CB radio handset on a coiled cord. He leans on an old pickup truck with a faded green ribbon tied to its antenna on a redwood backroad at dusk.',
        jobs: {
          arthemy: 40908,
          illustrij: 40909,
          novacomic: 40910,
          realism: 40911,
          nihilmania: 40912,
          krea2: 40913,
          zimage: 40914,
          flux2: 40915,
        },
      },
      {
        key: 'ck-grove',
        title: 'Setting, redwood grove in Sequoia Park',
        asset: '',
        size: '1344x768',
        seed: 64201,
        prompt:
          'An old-growth coast redwood grove with enormous red-brown trunks towering far overhead, ferns and redwood sorrel covering the forest floor, a winding dirt path and a small wooden footbridge over a creek, shafts of misty light falling between the trees. Quiet and ancient.',
        jobs: {
          arthemy: 40916,
          illustrij: 40917,
          novacomic: 40918,
          realism: 40919,
          nihilmania: 40920,
          zimage: 40922,
          flux2: 41206,
          krea2: 41205,
        },
      },
      {
        key: 'ck-bigfoot',
        title: 'Setting, Bigfoot family picnic at Moonstone Beach',
        asset: '',
        size: '1344x768',
        seed: 64202,
        prompt:
          'A family of three huge, gentle, shaggy brown sasquatches wearing straw sun hats sits on a checked picnic blanket on a wide sandy beach beside dark sea stacks on a foggy morning. There is a platter of deviled eggs and a blue cooler, and the smallest sasquatch holds up a smartphone for a family selfie. Wholesome and funny.',
        jobs: {
          arthemy: 40924,
          illustrij: 40925,
          novacomic: 40926,
          realism: 40927,
          nihilmania: 40928,
          krea2: 40929,
          zimage: 40930,
          flux2: 40931,
        },
      },
      {
        key: 'ck-plaza',
        title: 'Setting, Arcata Plaza at night',
        asset: '',
        size: '1344x768',
        seed: 64203,
        prompt:
          'A small-town college plaza at night, with a lawn square and a bronze statue in the middle, palm trees and redwoods, two-story brick and wooden storefronts with warm lit windows, and an art deco cinema marquee glowing down the block. Light fog, a few people on the sidewalks. Cozy and slightly uncanny.',
        jobs: {
          arthemy: 40932,
          illustrij: 40933,
          novacomic: 40934,
          realism: 40935,
          nihilmania: 40936,
          krea2: 40937,
          zimage: 40938,
          flux2: 40939,
        },
      },
      {
        key: 'ck-oldtown',
        title: 'Setting, Old Town Eureka waterfront',
        asset: '',
        size: '1344x768',
        seed: 64204,
        prompt:
          'A Victorian old town on a working bay, with ornate painted gingerbread houses and brick storefronts, a wooden boardwalk along the water, fishing boats tied up at a pier and gulls overhead, under overcast silver light with a faint green shimmer on the water.',
        jobs: {
          arthemy: 40940,
          illustrij: 40941,
          novacomic: 40942,
          realism: 40943,
          nihilmania: 40944,
          krea2: 40945,
          zimage: 40946,
          flux2: 40947,
        },
      },
    ],
    notes: {
      people:
        "Krea 2 and Z-Image are the only lanes whose four portraits read as the cast: Mara as a Native tattoo artist sketching flash, Kit as a Hmong American juggler in patchwork coveralls with her sea-serpent sculpture, Juniper barefoot among ferns with the green ribbon, Cedar with the CB handset and the ribboned antenna. Arthemy, Illustrij and Nova Comic give the three women one shared anime face; Realism makes Mara and Kit white; nihilmania painted Kit yellow-skinned in a hard hat (rejected). Krea 2 put garbled text on Mara's apron.",
      places:
        "Partial. Z-Image rendered all four settings well (redwood grove, Bigfoot family picnic under a sea stack, Arcata Plaza with palms, statue and a theater marquee, Old Town's Victorian waterfront). Krea 2 matched it on Bigfoot and the Plaza. nihilmania drew three tourists instead of Bigfoot. Realism and nihilmania are photographic; keep them in mind for Silas's later idea of photo-real backdrops for real locations.",
      recommendation:
        'Z-Image Turbo as the Ecotone house lane for people and places (non-anthro, fast, painterly), Krea 2 as the alternate. Retire Arthemy for Ecotone. Revisit when Flux 2 and the remaining settings finish.',
    },
  },
  {
    id: 'round-3',
    title: 'Round 3 (Z-Image)',
    blurb:
      'Story beats and the companions together, on the provisional house lane.',
    lanes: [
      {
        key: 'zimage',
        label: 'Z-Image Turbo (provisional house lane)',
        engine: 'zimage',
        checkpoint: 'zimage',
        steps: null,
        cfg: null,
        sampler: null,
      },
    ],
    subjects: [
      {
        key: 'eco3-friends',
        title: "The Friends Who Aren't Here, actors in a lantern-lit clearing",
        asset: 'encounters/friends-who-arent-here',
        size: '1344x768',
        seed: 65101,
        prompt:
          'At night in a lantern-lit redwood park clearing, a troupe of adult human physical-theatre performers puts on a tribute show for a small delighted audience sitting on blankets. One grown man wears a handmade papier-mache chimpanzee mask pushed up on his forehead and a shaggy costume coat, blowing a raspberry; a grown woman in a sleek painted otter costume runs along a wooden fence beside a laughing child; three adult actors in knitted prairie dog hoods pop up from behind hay bales. Their human faces show clearly, theatrical, warm and bittersweet.',
        jobs: {
          zimage: 40963,
        },
      },
      {
        key: 'eco3-gr2',
        title: "GR-2 Something to Share, the acrobats' blanket",
        asset: 'encounters/gr-2-something-to-share',
        size: '1344x768',
        seed: 65102,
        prompt:
          "A sunny festival lawn at the edge of a redwood forest. A group of circus acrobats rests on a big patchwork blanket sharing water bottles, sandwiches and a basket of food; a huge bearded man with a gentle smile holds out a wax-paper parcel. In the background a woman in patched coveralls balances upside down on a partner's shoulders, and a giant moss-covered wooden puppet towers over the crowd.",
        jobs: {
          zimage: 40964,
        },
      },
      {
        key: 'eco3-gr4',
        title: 'GR-4 The Path Behind the Stage, the looping trail',
        asset: 'encounters/gr-4-path-behind-the-stage',
        size: '1344x768',
        seed: 65103,
        prompt:
          'A narrow trail runs straight into old-growth redwoods, marked with green ribbons tied at eye level. A fallen mossy log and a fern curled like a question mark sit beside the path, and in the foreground a bright yellow banana slug wearing a tiny racing helmet crosses a root. Soft mist, the same log and ribbons repeating faintly into the distance, quietly uncanny.',
        jobs: {
          zimage: 40965,
        },
      },
      {
        key: 'eco3-gr5',
        title: 'GR-5 The Closing Bonfire, the last night of the fair',
        asset: 'encounters/gr-5-closing-bonfire',
        size: '1344x768',
        seed: 65104,
        prompt:
          'The last night of a forest-edge festival. A tall wicker sculpture of a redwood tree burns in a great bonfire in a meadow while a crowd watches, silhouetted. A giant moss-covered puppet bows beside the fire, two folding tables hold clipboards and lanterns, and the smoke rising over the flames forms the faint outline of a coastline.',
        jobs: {
          zimage: 40966,
        },
      },
      {
        key: 'eco3-kn2',
        title: 'KN-2 The Afterparty, the waterfront warehouse',
        asset: 'encounters/kn-2-the-afterparty',
        size: '1344x768',
        seed: 65105,
        prompt:
          'An old timber warehouse on a foggy bay waterfront at night, turned into a party. A brass band plays under strings of bulbs while dancers in wild homemade race costumes whirl past a pedal-powered sculpture parked inside. Through the open doors a pickup truck waits with its tailgate down and a CB antenna tied with a green ribbon.',
        jobs: {
          zimage: 40967,
        },
      },
      {
        key: 'eco3-kn4',
        title: 'KN-4 Conscripted, the Banana Slug Express',
        asset: 'encounters/kn-4-conscripted',
        size: '1344x768',
        seed: 65106,
        prompt:
          "Morning on a foggy bay waterfront. A twelve-foot yellow banana slug sculpture on bicycle wheels waits at the water's edge. A woman sits on a cooler with a bag of frozen peas on her ankle, pointing a crutch at the viewer with a grin, while her costumed race crew holds out a bicycle helmet with springy antennae on it.",
        jobs: {
          zimage: 40968,
        },
      },
      {
        key: 'eco3-kn5',
        title: 'KN-5 The Bay Crossing, slug and octopus in the fog',
        asset: 'encounters/kn-5-the-bay-crossing',
        size: '1344x768',
        seed: 65107,
        prompt:
          'A pedal-powered yellow banana slug sculpture floats and paddle-wheels across a wide foggy bay beside a pedal-powered purple octopus sculpture, both crewed by people in costumes. Small spectator boats follow, curious harbor seals watch from the water, and a bell buoy rings in a bank of fog ahead.',
        jobs: {
          zimage: 40969,
        },
      },
      {
        key: 'eco3-kn6',
        title: 'KN-6 The Ferndale Finish, Main Street and the cemetery hill',
        asset: 'encounters/kn-6-the-ferndale-finish',
        size: '1344x768',
        seed: 65108,
        prompt:
          'A Victorian village main street lined with ornate painted gingerbread houses and cheering crowds. A muddy yellow banana slug sculpture on bicycle wheels rolls toward a finish banner. On the green hillside above town, among old white headstones in an oak-shaded cemetery, a man in a black frock coat waves a checkered flag.',
        jobs: {
          zimage: 40970,
        },
      },
    ],
    notes: {},
  },
  {
    id: 'round-2',
    title: 'Round 2',
    blurb: 'New cards on the old house lane (Arthemy).',
    lanes: [
      {
        key: 'house',
        label: 'Arthemy Western Art v3.0 (house)',
        engine: 'comfy',
        checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
        steps: 30,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
    ],
    subjects: [
      {
        key: 'eco2-marsh',
        title: 'Arcata Marsh, the marsh that eats its words',
        asset: 'encounters/arcata-marsh',
        size: '1344x768',
        seed: 63101,
        prompt:
          'wide shot, a tidal freshwater marsh at golden dusk, still ponds with reflections, tall reeds and cattails, a wooden boardwalk path, egrets and ducks, a heron standing in the shallows, a distant small town and bay beyond, faint green radio-wave ripples glowing across the water, serene and quietly uncanny',
        jobs: {
          house: 40875,
        },
      },
      {
        key: 'eco2-fickle-hill',
        title: 'Fickle Hill, bad reception',
        asset: 'encounters/fickle-hill',
        size: '1344x768',
        seed: 63102,
        prompt:
          'wide shot, a narrow ridge road climbing through second-growth redwoods at night, thick fog pouring over the ridge, an old pickup truck parked on the shoulder with its dome light on, a cb radio antenna with a faded green ribbon, the lights of a small college town glowing far below through a gap in the fog, a thin beam of green light rising from the radio',
        jobs: {
          house: 40876,
        },
      },
      {
        key: 'eco2-latitude-1',
        title: 'WH-121, The Latitude Argument (seed 1)',
        asset: 'encounters/wh-121-latitude-argument',
        size: '1344x768',
        seed: 63111,
        prompt:
          'wide shot, (a ragged group of 1849 frontier explorers:1.2) in worn coats and battered hats at a foggy river mouth on the pacific coast, one bearded man stubbornly kneeling with a brass sextant and a notebook, the other exhausted men gesturing angrily toward the far bank, pack mules, driftwood, cold surf, comic exasperation, the fog faintly glowing as if from another century',
        jobs: {
          house: 40877,
        },
      },
      {
        key: 'eco2-latitude-2',
        title: 'WH-121, The Latitude Argument (seed 2)',
        asset: 'encounters/wh-121-latitude-argument',
        size: '1344x768',
        seed: 63112,
        prompt:
          'wide shot, (a ragged group of 1849 frontier explorers:1.2) in worn coats and battered hats at a foggy river mouth on the pacific coast, one bearded man stubbornly kneeling with a brass sextant and a notebook, the other exhausted men gesturing angrily toward the far bank, pack mules, driftwood, cold surf, comic exasperation, the fog faintly glowing as if from another century',
        jobs: {
          house: 40878,
        },
      },
      {
        key: 'eco2-friends-1',
        title: "The Friends Who Aren't Here (seed 1)",
        asset: 'encounters/friends-who-arent-here',
        size: '1344x768',
        seed: 63121,
        prompt:
          'wide shot, an outdoor physical theatre performance at night in a redwood park clearing lit by lanterns, (performers in handmade masks and costumes:1.3), one actor in a chimpanzee mask and furry coat pacing playfully, one actor in a sleek river otter costume running beside a laughing child, several small actors in prairie dog hoods popping up from behind hay bales, a small delighted audience, warm magical tribute mood',
        jobs: {
          house: 40879,
        },
      },
      {
        key: 'eco2-friends-2',
        title: "The Friends Who Aren't Here (seed 2)",
        asset: 'encounters/friends-who-arent-here',
        size: '1344x768',
        seed: 63122,
        prompt:
          'wide shot, an outdoor physical theatre performance at night in a redwood park clearing lit by lanterns, (performers in handmade masks and costumes:1.3), one actor in a chimpanzee mask and furry coat pacing playfully, one actor in a sleek river otter costume running beside a laughing child, several small actors in prairie dog hoods popping up from behind hay bales, a small delighted audience, warm magical tribute mood',
        jobs: {
          house: 40880,
        },
      },
      {
        key: 'eco2-anchor-stores-1',
        title: 'Anchor Stores, the mall after hours (seed 1)',
        asset: 'encounters/anchor-stores',
        size: '1344x768',
        seed: 63131,
        prompt:
          'wide shot, the interior of a half-empty 1980s shopping mall at night, dim skylights, a dry fountain, potted palms, rows of dark shuttered storefronts, but three of the storefronts glow with impossible scenes, one opens onto a green forest town with solar roofs, one onto a gleaming corporate warehouse, one onto a foggy abandoned food court, liminal and eerie and funny',
        jobs: {
          house: 40881,
        },
      },
      {
        key: 'eco2-anchor-stores-2',
        title: 'Anchor Stores, the mall after hours (seed 2)',
        asset: 'encounters/anchor-stores',
        size: '1344x768',
        seed: 63132,
        prompt:
          'wide shot, the interior of a half-empty 1980s shopping mall at night, dim skylights, a dry fountain, potted palms, rows of dark shuttered storefronts, but three of the storefronts glow with impossible scenes, one opens onto a green forest town with solar roofs, one onto a gleaming corporate warehouse, one onto a foggy abandoned food court, liminal and eerie and funny',
        jobs: {
          house: 40882,
        },
      },
      {
        key: 'eco2-behind-the-mall',
        title: 'Behind the Mall, the graffiti by the water',
        asset: 'encounters/behind-the-mall',
        size: '1344x768',
        seed: 63141,
        prompt:
          'wide shot, a concrete wall covered in colorful abstract graffiti murals beside a quiet bay slough at dusk, tall reeds, a student film crew with a camera on a tripod and a boom microphone, a homemade rubber monster costume standing in the reeds looking surprisingly real, string of work lights, purple and orange sky, comedic horror',
        jobs: {
          house: 40883,
        },
      },
    ],
    notes: {},
  },
  {
    id: 'round-1',
    title: 'Round 1',
    blurb: 'The first Ecotone ledger on the old house lane (Arthemy).',
    lanes: [
      {
        key: 'house',
        label: 'Arthemy Western Art v3.0 (house)',
        engine: 'comfy',
        checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
        steps: 30,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
    ],
    subjects: [
      {
        key: 'eco1-project-icon',
        title: 'Project icon',
        asset: 'project/icon',
        size: '1024x1024',
        seed: 61901,
        prompt:
          'app icon, centered emblem, a single giant redwood tree whose roots become a glowing radio wave, a crescent moon behind it, fog band across the trunk, bold simple silhouette, strong contrast, dark teal background',
        jobs: {
          house: 40841,
        },
      },
      {
        key: 'eco1-project-card',
        title: 'Project card',
        asset: 'project/card',
        size: '832x1216',
        seed: 61902,
        prompt:
          "vertical key art, four adult friends seen from behind on a forest trail at night, looking up at towering redwoods, a ribbon of green light running through the trees like a radio signal, festival lanterns far below, a pickup truck's headlights in the fog, sense of wonder and mild dread",
        jobs: {
          house: 40842,
        },
      },
      {
        key: 'eco1-project-hero',
        title: 'Project hero',
        asset: 'project/hero',
        size: '1344x768',
        seed: 61903,
        prompt:
          "wide establishing shot, humboldt bay at dusk seen from a redwood ridge, fog rolling in over the water, a small town's lights along the shore, a hand-built kinetic sculpture vehicle crossing the tide flats, a faint second skyline shimmering in the clouds like an alternate future, aurora-green static in the sky",
        jobs: {
          house: 40843,
        },
      },
      {
        key: 'eco1-title-1',
        title: 'Play title art (seed 1)',
        asset: 'title/key-art',
        size: '1344x768',
        seed: 61911,
        prompt:
          'wide shot, a forest-edge festival meadow at night, a huge handmade wooden puppet draped in moss, string lights, distant juggler silhouette, the redwood tree line glowing faintly from within, a shaft of green light in the fog, an old pickup with a radio antenna, magical realism, uncanny but welcoming',
        jobs: {
          house: 40844,
        },
      },
      {
        key: 'eco1-title-2',
        title: 'Play title art (seed 2)',
        asset: 'title/key-art',
        size: '1344x768',
        seed: 61912,
        prompt:
          'wide shot, a forest-edge festival meadow at night, a huge handmade wooden puppet draped in moss, string lights, distant juggler silhouette, the redwood tree line glowing faintly from within, a shaft of green light in the fog, an old pickup with a radio antenna, magical realism, uncanny but welcoming',
        jobs: {
          house: 40845,
        },
      },
      {
        key: 'eco1-mara-1',
        title: 'Mara, sober guide (seed 1)',
        asset: 'companions/mara',
        size: '832x1216',
        seed: 61921,
        prompt:
          'solo, adult woman, indigenous californian woman in her thirties, (fully clothed:1.2), long black hair tied back, sleeves of modern fine-line tattoos on both forearms, black t-shirt and canvas shop apron, pencil behind her ear, sketchbook of bird flash designs, dry knowing half smile, sitting at a festival tattoo flash table under string lights, cowboy shot, warm lamplight, redwood forest behind',
        jobs: {
          house: 40846,
        },
      },
      {
        key: 'eco1-mara-2',
        title: 'Mara, sober guide (seed 2)',
        asset: 'companions/mara',
        size: '832x1216',
        seed: 61922,
        prompt:
          'solo, adult woman, indigenous californian woman in her thirties, (fully clothed:1.2), long black hair tied back, sleeves of modern fine-line tattoos on both forearms, black t-shirt and canvas shop apron, pencil behind her ear, sketchbook of bird flash designs, dry knowing half smile, sitting at a festival tattoo flash table under string lights, cowboy shot, warm lamplight, redwood forest behind',
        jobs: {
          house: 40847,
        },
      },
      {
        key: 'eco1-kit-1',
        title: 'Kit, tipsy guide (seed 1)',
        asset: 'companions/kit',
        size: '832x1216',
        seed: 61931,
        prompt:
          'solo, adult woman, hmong american woman in her late twenties, (fully clothed:1.2), short asymmetric black hair, paint-splattered mechanic coveralls with bright fabric patches, juggling three clubs mid-air, laughing, athletic stance, beside a whimsical pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights, dynamic pose, cowboy shot',
        jobs: {
          house: 40848,
        },
      },
      {
        key: 'eco1-kit-2',
        title: 'Kit, tipsy guide (seed 2)',
        asset: 'companions/kit',
        size: '832x1216',
        seed: 61932,
        prompt:
          'solo, adult woman, hmong american woman in her late twenties, (fully clothed:1.2), short asymmetric black hair, paint-splattered mechanic coveralls with bright fabric patches, juggling three clubs mid-air, laughing, athletic stance, beside a whimsical pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights, dynamic pose, cowboy shot',
        jobs: {
          house: 40849,
        },
      },
      {
        key: 'eco1-juniper-1',
        title: 'Juniper, stoned guide (seed 1)',
        asset: 'companions/juniper',
        size: '832x1216',
        seed: 61941,
        prompt:
          'solo, adult woman, young woman in her twenties, curvy, (fully clothed:1.3), layered thrift-store sweater and long patchwork skirt, messy auburn hair with a green ribbon and tiny ferns growing in it, freckles, warm teasing smile, barefoot on moss among giant redwood roots, her reflection in a puddle has branches growing from its head, soft green forest glow, cowboy shot',
        jobs: {
          house: 40850,
        },
      },
      {
        key: 'eco1-juniper-2',
        title: 'Juniper, stoned guide (seed 2)',
        asset: 'companions/juniper',
        size: '832x1216',
        seed: 61942,
        prompt:
          'solo, adult woman, young woman in her twenties, curvy, (fully clothed:1.3), layered thrift-store sweater and long patchwork skirt, messy auburn hair with a green ribbon and tiny ferns growing in it, freckles, warm teasing smile, barefoot on moss among giant redwood roots, her reflection in a puddle has branches growing from its head, soft green forest glow, cowboy shot',
        jobs: {
          house: 40851,
        },
      },
      {
        key: 'eco1-cedar-1',
        title: 'Cedar, tripping guide (seed 1)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 61951,
        prompt:
          'solo, adult man, contemporary Humboldt working man in his early thirties, Hispanic paternal heritage, rural and mechanically skilled, (fully clothed:1.2), stubble, worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, toolbox in the bed, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40852,
        },
      },
      {
        key: 'eco1-cedar-2',
        title: 'Cedar, tripping guide (seed 2)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 61952,
        prompt:
          'solo, adult man, contemporary Humboldt working man in his early thirties, Hispanic paternal heritage, rural and mechanically skilled, (fully clothed:1.2), stubble, worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, toolbox in the bed, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40853,
        },
      },
      {
        key: 'eco1-ch1-arcata',
        title: 'Chapter 1, Arcata After Hours',
        asset: 'chapters/arcata-after-hours',
        size: '1344x768',
        seed: 61961,
        prompt:
          'wide shot, a small-town college plaza at midnight, a central statue on a lawn, palm and redwood trees, old brick storefronts with warm windows, an empty art deco cinema marquee glowing, fog, a single streetlight flickering green, scattered late-night people, cozy and uncanny',
        jobs: {
          house: 40854,
        },
      },
      {
        key: 'eco1-ch2-coast',
        title: 'Chapter 2, Coast of Improbable Tides',
        asset: 'chapters/coast-of-improbable-tides',
        size: '1344x768',
        seed: 61962,
        prompt:
          'wide shot, a wide sandy beach at a creek mouth with huge dark sea stacks, morning fog, the tide flowing backward out to sea leaving shimmering ripples, a picnic blanket and cooler abandoned on the sand, enormous footprints leading to the rocks, wistful and strange',
        jobs: {
          house: 40855,
        },
      },
      {
        key: 'eco1-ch3-eureka',
        title: 'Chapter 3, Eureka and the Bay',
        asset: 'chapters/eureka-and-the-bay',
        size: '1344x768',
        seed: 61963,
        prompt:
          "wide shot, an ornate victorian old town waterfront on a working bay, painted gingerbread mansion, fishing boats at a wooden pier, gulls, overcast silver light, a crowd in homemade costumes at the water's edge, a marching band, a faint green static shimmer on the water, civic and absurd",
        jobs: {
          house: 40856,
        },
      },
      {
        key: 'eco1-ch4-backroads',
        title: 'Chapter 4, Backroads and Bad Reception',
        asset: 'chapters/backroads-and-bad-reception',
        size: '1344x768',
        seed: 61964,
        prompt:
          'wide shot, a winding two-lane mountain highway through dark forested ridges at night, a lone roadside diner with a giant carved wooden sasquatch statue, a radio tower blinking red on the ridge, strange lights hovering above the trees, a pickup pulled over with headlights on, cryptid country mood',
        jobs: {
          house: 40857,
        },
      },
      {
        key: 'eco1-ch5-older-roads',
        title: 'Chapter 5, Southern Humboldt and Older Roads',
        asset: 'chapters/southern-humboldt-older-roads',
        size: '1344x768',
        seed: 61965,
        prompt:
          'wide shot, a narrow road through a cathedral grove of ancient giant redwoods, shafts of golden light through mist, a river glinting below, a tiny old car dwarfed by the trunks, ferns, a hush of deep time, rural surrealism, one tree trunk bearing a door that should not be there',
        jobs: {
          house: 40858,
        },
      },
      {
        key: 'eco1-ch6-festival',
        title: 'Chapter 6, The Impossible Festival',
        asset: 'chapters/the-impossible-festival',
        size: '1344x768',
        seed: 61966,
        prompt:
          'wide shot, a parade of fantastical human-powered kinetic sculpture vehicles racing across sand dunes toward the bay, crowds cheering, costumes, two different skies meeting overhead, one sunny and green, one stormy with industrial silhouettes, converging timelines, joyful chaos and high stakes',
        jobs: {
          house: 40859,
        },
      },
      {
        key: 'eco1-prologue',
        title: 'Prologue, the woman who knows the trail',
        asset: 'scenes/prologue-meadow',
        size: '1344x768',
        seed: 61971,
        prompt:
          'wide shot, a forest-edge festival meadow at twilight, a hand-painted wooden sign at the trail head, a young woman with a green ribbon in her hair waiting by the path, a puddle reflecting her with branches growing from her head, juggler with clubs in the background, string lights, moss-covered giant puppet',
        jobs: {
          house: 40860,
        },
      },
      {
        key: 'eco1-wh006-minor',
        title: 'WH-006, The Last Houdini Exit',
        asset: 'encounters/wh-006-last-exit',
        size: '1344x768',
        seed: 61981,
        prompt:
          'wide shot, an empty old art deco movie theater stage after midnight, red velvet curtain, a trapdoor lifted one inch with a white-gloved hand pushing up a folded note, dusty spotlight beam, empty seats, warm gold and deep red, comedic eerie mood',
        jobs: {
          house: 40861,
        },
      },
      {
        key: 'eco1-wh021-picnic',
        title: 'WH-021, Bigfoot Family Picnic',
        asset: 'encounters/wh-021-bigfoot-picnic',
        size: '1344x768',
        seed: 61982,
        prompt:
          'wide shot, a family of three enormous gentle sasquatches in sun hats having a beach picnic among sea stacks, a checked blanket, a cooler, a platter piled with deviled eggs, the youngest holding up a phone for a selfie, the tide flowing backward, foggy morning, wholesome and absurd',
        jobs: {
          house: 40862,
        },
      },
      {
        key: 'eco1-wh061-plunge',
        title: 'WH-061, The Perilous Plunge into Monday',
        asset: 'encounters/wh-061-perilous-plunge',
        size: '1344x768',
        seed: 61983,
        prompt:
          'wide shot, a waterfront charity plunge on a cold bay, costumed jumpers queued on a dock, a volunteer in a homemade squid costume surfacing holding a soggy newspaper aloft, a marching band, a steaming hot tub, overcast morning, a faint clock-shaped ripple in the water, joyful civic absurdity',
        jobs: {
          house: 40863,
        },
      },
      {
        key: 'eco1-card-back',
        title: 'Card back',
        asset: 'ui/card-back',
        size: '832x1216',
        seed: 61991,
        prompt:
          'ornamental card back design, symmetrical, a redwood tree in the center with roots and branches mirrored, a crescent moon, concentric radio-wave rings, dark teal and antique gold, art nouveau border, centered',
        jobs: {
          house: 40864,
        },
      },
      {
        key: 'eco1-cedar-r2-1',
        title: 'Cedar, tripping guide (reroll, seed 1)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 62051,
        prompt:
          '1boy, solo, (male focus:1.3), (mature man:1.2), rugged rural man in his thirties, short beard stubble, broad shoulders, (fully clothed:1.2), worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40865,
        },
      },
      {
        key: 'eco1-cedar-r2-2',
        title: 'Cedar, tripping guide (reroll, seed 2)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 62052,
        prompt:
          '1boy, solo, (male focus:1.3), (mature man:1.2), rugged rural man in his thirties, short beard stubble, broad shoulders, (fully clothed:1.2), worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40866,
        },
      },
      {
        key: 'eco1-ch5-r2',
        title: 'Chapter 5, Southern Humboldt and Older Roads (reroll)',
        asset: 'chapters/southern-humboldt-older-roads',
        size: '1344x768',
        seed: 62065,
        prompt:
          'wide shot, (giant ancient redwood trunks:1.3) towering like cathedral pillars, enormous red-brown bark, a narrow two-lane road winding between the giant trunks, a tiny vintage car dwarfed by the trees, golden sun rays through mist, ferns, one massive trunk with a small wooden door in its base, hush of deep time',
        jobs: {
          house: 40867,
        },
      },
      {
        key: 'eco1-ch6-r2',
        title: 'Chapter 6, The Impossible Festival (reroll)',
        asset: 'chapters/the-impossible-festival',
        size: '1344x768',
        seed: 62066,
        prompt:
          'wide shot, a race of whimsical (human-powered kinetic sculptures:1.3), giant pedal-powered contraptions shaped like a dragon, a snail and a fish, riders pedaling hard, racing across sand dunes toward a bay, cheering crowd in colorful costumes, split sky, sunny green sky on the left, storm clouds over smokestacks on the right, joyful chaos',
        jobs: {
          house: 40868,
        },
      },
      {
        key: 'eco1-wh021-r2',
        title: 'WH-021, Bigfoot Family Picnic (reroll)',
        asset: 'encounters/wh-021-bigfoot-picnic',
        size: '1344x768',
        seed: 62082,
        prompt:
          'wide shot, (three sasquatches:1.3), bigfoot family, huge gentle furry brown creatures wearing straw sun hats, sitting on a checked picnic blanket on a beach, a platter piled with deviled eggs, a blue cooler, the smallest sasquatch holding up a smartphone for a family selfie, dark sea stacks, foggy morning, wholesome and comedic',
        jobs: {
          house: 40869,
        },
      },
      {
        key: 'eco1-wh061-r2',
        title: 'WH-061, The Perilous Plunge into Monday (reroll)',
        asset: 'encounters/wh-061-perilous-plunge',
        size: '1344x768',
        seed: 62083,
        prompt:
          'wide shot, a crowd in homemade costumes on a wooden dock, a person in a (homemade red squid costume:1.3) with floppy tentacles bursting up out of cold grey water, holding a soggy newspaper high above their head, a marching band with brass instruments on the dock, overcast morning, splashes, festive civic absurdity',
        jobs: {
          house: 40870,
        },
      },
      {
        key: 'eco1-kit-r3-1',
        title: 'Kit, tipsy guide (Hmong American, seed 1)',
        asset: 'companions/kit',
        size: '832x1216',
        seed: 62131,
        prompt:
          'solo, adult woman, (hmong american woman:1.2) in her late twenties, southeast asian features, (fully clothed:1.2), short asymmetric black hair, paint-splattered mechanic coveralls with bright fabric patches, (juggling three clubs:1.2) mid-air, laughing, athletic stance, beside a whimsical pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights, dynamic pose, cowboy shot',
        jobs: {
          house: 40871,
        },
      },
      {
        key: 'eco1-kit-r3-2',
        title: 'Kit, tipsy guide (Hmong American, seed 2)',
        asset: 'companions/kit',
        size: '832x1216',
        seed: 62132,
        prompt:
          'solo, adult woman, (hmong american woman:1.2) in her late twenties, southeast asian features, (fully clothed:1.2), short asymmetric black hair, paint-splattered mechanic coveralls with bright fabric patches, (juggling three clubs:1.2) mid-air, laughing, athletic stance, beside a whimsical pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights, dynamic pose, cowboy shot',
        jobs: {
          house: 40872,
        },
      },
      {
        key: 'eco1-cedar-r3-1',
        title: 'Cedar, tripping guide (half Hispanic, seed 1)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 62151,
        prompt:
          '1boy, solo, (male focus:1.3), (mature man:1.2), rugged rural man in his thirties, (mixed latino heritage:1.2), warm light brown skin, dark hair, short beard stubble, broad shoulders, (fully clothed:1.2), worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40873,
        },
      },
      {
        key: 'eco1-cedar-r3-2',
        title: 'Cedar, tripping guide (half Hispanic, seed 2)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 62152,
        prompt:
          '1boy, solo, (male focus:1.3), (mature man:1.2), rugged rural man in his thirties, (mixed latino heritage:1.2), warm light brown skin, dark hair, short beard stubble, broad shoulders, (fully clothed:1.2), worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40874,
        },
      },
    ],
    notes: {},
  },
]

/** Every job id across the rounds, for one batched status read. */
export function artReviewJobIds(round: ArtReviewRound): number[] {
  return [
    ...new Set(
      round.subjects.flatMap((subject) => Object.values(subject.jobs)),
    ),
  ]
}
