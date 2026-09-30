// /utils/tzaddikBlacklist.ts
//
// People who must never be nominated to Tzaddikim, whether by a community
// submission, the admin seed import, or model discovery (Silas, 2026-09-30:
// "we should also have a blacklist section, so we don't get problematics like
// ghandi, mother teresa, thomas jefferson, etc."). Mirrors
// conductor/projects/tzaddik-gallery/blacklist.yaml, which carries the full
// editorial reasoning; conductor's tests/test_tzaddik_blacklist.py checks that
// the two name lists stay in sync.

export type TzaddikBlacklistEntry = {
  name: string
  aliases: string[]
  reason: string
}

export const TZADDIK_BLACKLIST: TzaddikBlacklistEntry[] = [
  {
    name: 'Mahatma Gandhi',
    aliases: [
      'Gandhi',
      'Ghandi',
      'Mohandas Gandhi',
      'Mohandas Karamchand Gandhi',
      'Mahatma Ghandi',
    ],
    reason:
      "Documented anti-Black racism in South Africa and coercive 'celibacy experiments' involving young female relatives.",
  },
  {
    name: 'Mother Teresa',
    aliases: [
      'Teresa of Calcutta',
      'Saint Teresa of Calcutta',
      'Anjezë Gonxhe Bojaxhiu',
    ],
    reason:
      'Well-documented substandard care and withheld pain relief in her homes for the dying, alongside cultivation of dictators and fraudsters as donors.',
  },
  {
    name: 'Thomas Jefferson',
    aliases: [],
    reason:
      'Enslaved more than 600 people over his lifetime, including Sally Hemings, with whom he fathered children beginning when she was a teenager.',
  },
  {
    name: 'George Washington',
    aliases: [],
    reason:
      'Enslaved hundreds of people and pursued those who escaped, including Ona Judge.',
  },
  {
    name: 'Andrew Jackson',
    aliases: [],
    reason:
      'Enslaver who signed the Indian Removal Act, leading to the Trail of Tears.',
  },
  {
    name: 'Woodrow Wilson',
    aliases: [],
    reason:
      'Resegregated the federal civil service and promoted Birth of a Nation-era white supremacist history.',
  },
  {
    name: 'Christopher Columbus',
    aliases: ['Cristoforo Colombo', 'Cristóbal Colón'],
    reason:
      'Governed Hispaniola through enslavement, mutilation, and brutality documented even by his contemporaries.',
  },
  {
    name: 'Winston Churchill',
    aliases: [],
    reason:
      'Openly racist imperial views and policy responsibility debated in the 1943 Bengal famine.',
  },
  {
    name: 'Martin Luther',
    aliases: [],
    reason:
      "Authored 'On the Jews and Their Lies' (1543), urging the burning of synagogues.",
  },
  {
    name: 'Maximilian Kolbe',
    aliases: [],
    reason: 'Publications he founded ran antisemitic content in 1930s Poland.',
  },
  {
    name: 'Henry Ford',
    aliases: [],
    reason:
      "Published and distributed 'The International Jew' and the Protocols of the Elders of Zion through the Dearborn Independent.",
  },
  {
    name: 'Charles Lindbergh',
    aliases: [],
    reason:
      'Antisemitic America First speeches and accepted a Nazi decoration in 1938.',
  },
  {
    name: 'Margaret Sanger',
    aliases: [],
    reason:
      "Promoted eugenics and addressed a women's auxiliary of the Ku Klux Klan.",
  },
  {
    name: 'Che Guevara',
    aliases: ['Ernesto Guevara', "Ernesto 'Che' Guevara"],
    reason: 'Oversaw summary executions at La Cabaña prison.',
  },
  {
    name: 'Aung San Suu Kyi',
    aliases: [],
    reason:
      "Defended Myanmar's military at the International Court of Justice against Rohingya genocide charges.",
  },
  {
    name: 'Henry Kissinger',
    aliases: [],
    reason:
      'Central role in the Cambodia bombing campaign and support for the Pinochet coup and Indonesian invasion of East Timor.',
  },
  {
    name: 'Abiy Ahmed',
    aliases: [],
    reason:
      'Nobel Peace laureate who led the Tigray war, with documented mass atrocities and a blockade that caused famine.',
  },
  {
    name: 'Cesar Chavez',
    aliases: ['César Chávez'],
    reason:
      "2026 New York Times investigation and later lawsuits alleging he sexually abused girls, and Dolores Huerta's account that he raped her.",
  },
  {
    name: 'Jean Vanier',
    aliases: [],
    reason:
      "L'Arche's own 2020 inquiry found he sexually abused women under his spiritual direction.",
  },
  {
    name: 'Abbé Pierre',
    aliases: ['Henri Grouès'],
    reason:
      "Emmaüs's own 2024 investigations documented dozens of sexual assault allegations.",
  },
  {
    name: 'Jimmy Savile',
    aliases: [],
    reason:
      'Charity fundraiser who used that access to commit hundreds of sexual offences.',
  },
  {
    name: 'Bill Cosby',
    aliases: [],
    reason:
      'Dozens of sexual assault allegations and a civil jury finding of sexual abuse.',
  },
  {
    name: 'Michael Jackson',
    aliases: [],
    reason: 'Multiple child sexual abuse allegations and settlements.',
  },
  {
    name: 'John Lennon',
    aliases: [],
    reason:
      'By his own account hit women, and was emotionally abusive toward his first family, undercutting the peace-icon framing.',
  },
  {
    name: 'Lance Armstrong',
    aliases: [],
    reason:
      'Built the Livestrong halo on a doping fraud and the bullying of whistleblowers.',
  },
  {
    name: 'Greg Mortenson',
    aliases: [],
    reason:
      "'Three Cups of Tea' charity fabrications and misuse of donor funds.",
  },
  {
    name: 'Paul Rusesabagina',
    aliases: [],
    reason:
      'Hotel Rwanda account disputed by survivors, plus later ties to an armed group. Too contested for a clean nomination.',
  },
  {
    name: 'J. K. Rowling',
    aliases: ['J.K. Rowling', 'JK Rowling', 'Joanne Rowling'],
    reason:
      "Sustained public campaigning against trans people's rights. Out of step with the gallery's queer-positive values.",
  },
  {
    name: 'Elon Musk',
    aliases: [],
    reason:
      'Amplifying antisemitic and far-right content, and a gesture at the 2025 inauguration widely read as a Nazi salute.',
  },
  {
    name: 'Leila Khaled',
    aliases: [],
    reason:
      'Took part in the 1969 TWA 840 and 1970 El Al 219 airliner hijackings as a PFLP member.',
  },
  {
    name: 'Tariq Ramadan',
    aliases: [],
    reason:
      'Convicted of rape by a Swiss appeals court in 2024, with further rape charges tried in France.',
  },
]

/** Case-, accent-, and punctuation-insensitive key ("Ghandi" and "J.K. Rowling" still match). */
export function tzaddikBlacklistKey(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

const BLACKLIST_INDEX = new Map<string, TzaddikBlacklistEntry>()
for (const entry of TZADDIK_BLACKLIST) {
  for (const alias of [entry.name, ...entry.aliases]) {
    const key = tzaddikBlacklistKey(alias)
    if (key) BLACKLIST_INDEX.set(key, entry)
  }
}

/** The blacklist entry a display name matches, or null. */
export function findTzaddikBlacklistEntry(
  name: string,
): TzaddikBlacklistEntry | null {
  return BLACKLIST_INDEX.get(tzaddikBlacklistKey(name)) ?? null
}
