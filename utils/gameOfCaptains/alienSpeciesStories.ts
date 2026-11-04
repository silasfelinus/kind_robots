export type AlienSpeciesStory = {
  incident: string
  outcomes: Record<'retreat' | 'chaos' | 'bond', string>
}

export const ALIEN_SPECIES_STORIES: Readonly<Record<string, AlienSpeciesStory>> = {
  'ramray-of-the-rising-house': {
    incident:
      'A planetary sunrise is six minutes overdue. The Ramray waits beside an empty grandstand while an exhausted dawn technician holds a spotlight above its woolly fins. The morning shift wants permission to go home.',
    outcomes: {
      retreat:
        'The Ramray folds the empty grandstand beneath one fin and cancels sunrise without explanation. The technician files a darkness variance and promises to try again tomorrow.',
      chaos:
        'An improvised standing ovation triggers every sunrise on the planet at once. Astronomers request a refund, and the Ramray demands a curtain call from the western hemisphere.',
      bond:
        'The Ramray accepts a quiet, sincere round of applause from the couch. It releases the technician and sends the crew a sunrise that fits inside a teacup.',
    },
  },
  'taurus-tardigrade': {
    incident:
      'A sleeping village is built in the Taurus Tardigrade\'s moss. A municipal official has arrived with an evacuation order because its next snore is predicted to move the town three streets east.',
    outcomes: {
      retreat:
        'A raised voice makes the giant sleeper curl into itself. The village moves peacefully across the valley, and the official must update seventeen parking permits.',
      chaos:
        'The couch deploys a pillow the size of a stadium. Its stuffing escapes into orbit and briefly qualifies as a new moon. The village names it after the municipal official.',
      bond:
        'The crew matches the old creature\'s breathing until it rolls onto a safer side. The villagers leave a miniature municipal welcome mat on the couch.',
    },
  },
  'gemini-glass-eels': {
    incident:
      'The Gemini eels have disagreed about which way their river should flow. Both are pulling on the same transparent shadow while the downstream ferry waits with sixty-seven passengers and no useful compass.',
    outcomes: {
      retreat:
        'One eel slips beneath the ferry and the other follows its borrowed shadow. The river flows sideways until evening, leaving the ferry company to redefine downstream.',
      chaos:
        'The couch attempts to arbitrate with two identical maps. Each eel declares victory, the river turns in a complete circle, and the ferry arrives at its departure point as a new tourist attraction.',
      bond:
        'The crew gives each eel an uninterrupted turn to explain the other\'s position. They agree to alternate currents, and the ferry captain writes the couch a thank-you note in waterproof ink.',
    },
  },
  'cancer-lantern-crab': {
    incident:
      'A newborn star is blinking inside the Cancer Crab\'s shell. The celestial adoption office claims it has parents elsewhere, but its paperwork contains only a faint drawing of a lighthouse.',
    outcomes: {
      retreat:
        'The crab withdraws behind a closed shell, carrying the star and its unfinished paperwork. The adoption office enters the case as missing, whereabouts: somewhere warm.',
      chaos:
        'The couch broadcasts a search notice, attracting thirty thousand concerned constellations. The crab hides under an umbrella while the adoption office opens a temporary complaints galaxy.',
      bond:
        'Instead of taking the star, the crew helps the crab hang a safe beacon for the missing parents. The crab offers a tiny lantern in thanks, to be lit only for lost travelers.',
    },
  },
  'leo-mane-moth': {
    incident:
      'The Leo Mane-Moth has been hired to guard a nursery through the night, but its majestic roar wakes the children every time someone compliments the security arrangement. The night nurse looks near mutiny.',
    outcomes: {
      retreat:
        'The moth mistakes the captain\'s attention for an inspection and glides away to another nursery. The staff agrees not to mention its roaring on the reference form.',
      chaos:
        'The couch demonstrates a silent roar using the ship speakers on mute. An automatic translator amplifies it into six languages and every child wakes to request an encore.',
      bond:
        'The crew asks the moth to guard the nursery from outside the window and rewards its soft wingbeats instead. For the first time all week, the night nurse gets a nap.',
    },
  },
  'virgo-needle-shrew': {
    incident:
      'The Virgo Shrew is stitching a tear in local reality while a safety inspector insists the hole needs a permit before it can be repaired. A minor alternate Tuesday is already leaking through.',
    outcomes: {
      retreat:
        'The shrew pockets its needles and slips into next Tuesday to avoid the inspection. The hole remains, but the inspector officially certifies it as an educational window.',
      chaos:
        'An improvised repair patch sticks two Tuesdays together. Everyone in the district receives an extra lunch break, followed by a highly regrettable second Monday.',
      bond:
        'The crew holds the seams steady while the shrew stitches them without interruption. It gives the captain a silver thimble labeled FOR EMERGENCIES, NOT TIME TRAVEL.',
    },
  },
  'libra-balancing-ibis': {
    incident:
      'The Libra Ibis has built two nests for two eggs, precisely equal in every measurement. One egg has begun chirping that it wants a view, while the other prefers absolute privacy.',
    outcomes: {
      retreat:
        'The ibis folds both eggs beneath its wings and retreats to a third, deliberately average nest. The arguing chicks continue their architectural dispute from inside their shells.',
      chaos:
        'A spare couch cushion makes one nest taller. The ibis commissions a balance audit, the eggs begin competing for elevation, and the entire branch becomes a zoning hearing.',
      bond:
        'The crew helps the ibis ask each chick what it actually needs. One nest faces the stars and the other faces the leaves. The ibis records their unequal happiness as a triumph.',
    },
  },
  'scorpio-sugar-scorpion': {
    incident:
      'The Sugar Scorpion is rehearsing an elaborate courtship dance outside a ballroom. Its intended partner has left a note saying please do not sting the refreshments, which it has misunderstood as criticism of its technique.',
    outcomes: {
      retreat:
        'The scorpion stops dancing as the audience gathers and retreats behind the cake trolley. The partner saves it a dance card with no conditions beyond mutual consent.',
      chaos:
        'A well-meant flamboyant demonstration knocks the sugar bowl into the air. The ballroom becomes a sparkling snow globe and the venue bans all courtship involving cutlery.',
      bond:
        'The crew reads the note aloud without embellishment. Relieved, the scorpion requests a slower dance, and the pair shares a waltz with entirely unpoisoned refreshments.',
    },
  },
  'sagittarius-stagfish': {
    incident:
      'The Stagfish is chasing the shadow of an arrow that will not be fired until next week. Every leap sends it farther from its frightened school, which is trying to keep a migration appointment today.',
    outcomes: {
      retreat:
        'A sudden wave of attention breaks its concentration. It darts after tomorrow\'s shadow, and the school leaves a clear trail in case it decides to come home.',
      chaos:
        'The couch projects a target into the wrong decade. The fish catches it immediately, but the resulting time splash deposits next week\'s weather forecast over the captain.',
      bond:
        'The crew marks a safe return route before letting the fish continue its chase. It escorts the school home first, then gifts the couch a harmless arrow made of sunset.',
    },
  },
  'capricorn-reef-goat': {
    incident:
      'The Reef Goat is climbing an upside-down waterfall to visit an elderly cousin who lives above the clouds. It has reached the halfway point and is pretending the journey is part of an ordinary commute.',
    outcomes: {
      retreat:
        'The goat notices an audience and backs into the mist rather than accept help. A postcard reaches the couch weeks later: arrived eventually, please do not discuss the stairs.',
      chaos:
        'The couch deploys a miniature escalator that goes the wrong direction. The goat rides it to the bottom, announces a mechanical fault, and opens a formal complaint with gravity.',
      bond:
        'The crew holds a loose handrail steady without mentioning the climb. The goat reaches its cousin, and two generations invite the captain to tea above the rain.',
    },
  },
  'aquarius-rain-otter': {
    incident:
      'The Rain Otter is handing umbrellas to commuters on a cloudless platform before it releases a carefully scheduled shower. A child has returned an umbrella because the handle is shaped like a question mark.',
    outcomes: {
      retreat:
        'The otter takes the returned umbrella and vanishes into its cloud, postponing rain for another station. The commuters spend the afternoon arguing about whether forecasts count as invitations.',
      chaos:
        'The couch turns an umbrella inside out to entertain the child. The otter mistakes it for the official signal and releases all of tomorrow\'s rain before breakfast.',
      bond:
        'The crew asks the child what handle would work and helps the otter change it. Rain arrives after everyone is sheltered, and the otter writes the couch onto its weather committee.',
    },
  },
  'pisces-dream-koi': {
    incident:
      'Two elderly Dream Koi are asleep above a dry market square, dreaming different oceans into the same patch of sky. The merchants want water for their wells but have no interest in a surprise tidal economy.',
    outcomes: {
      retreat:
        'The koi retreat into a shared cloud before anyone can interrupt their sleep. The market remains dry, though every stallholder wakes with memories of swimming lessons.',
      chaos:
        'A couch-side lullaby makes both oceans arrive at once. The bubble keeps the crew dry while the merchants float their inventory and institute an emergency seafood tax.',
      bond:
        'The crew waits for a quiet moment and asks the koi for a single gentle tide. The wells refill, the square stays standing, and the fish leave a pearl filled with the sound of rain.',
    },
  },
}
