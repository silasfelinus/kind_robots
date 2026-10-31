import { earthRealityReady, type EarthReality } from './earthAct'
import { replayEarthJournal } from './earthJournal'

interface EarthMedal {
  id: string
  reality: EarthReality
  site: string
  choiceId?: string
  questId: string
  title: string
  description: string
  echo: string
  artPath: string
}

const EARTH_MEDALS: readonly EarthMedal[] = [
  {
    id: 'e03-transit-kindness',
    reality: 'e03',
    site: '1,3',
    choiceId: 'challenge',
    questId: 'e03:1,3',
    title: 'The Stranger at the Machine',
    description: 'Finish Morrow’s first Earth journey after examining the kindness in the transit photograph.',
    echo: 'Morrow eventually learns the ticket machine, but remembers the stranger who waited beside it. He begins helping other bewildered travelers without asking where they came from. The stolen face still belongs to someone else; the offered minute belonged to neither of them.',
    artPath: '/images/memory-dungeon/earth/medals/e03-transit-kindness.webp',
  },
  {
    id: 'e03-transit-patience',
    reality: 'e03',
    site: '1,3',
    choiceId: 'hold',
    questId: 'e03:1,3',
    title: 'A Minute Freely Given',
    description: 'Finish Morrow’s first Earth journey while recognizing the stranger as a person, not an obstacle.',
    echo: 'The older traveler never learns the true history of the person they helped. Morrow does not turn that small kindness into forgiveness for the exchange. He simply makes room on the platform for the next lost passenger, and remembers that being helped creates no ownership.',
    artPath: '/images/memory-dungeon/earth/medals/e03-transit-patience.webp',
  },
  {
    id: 'e03-gesture-question',
    reality: 'e03',
    site: '6,4',
    choiceId: 'challenge',
    questId: 'e03:6,4',
    title: 'The Spell That Did Nothing',
    description: 'Complete the ordinary Earth chapter after investigating Morrow’s failed attempt at magic.',
    echo: 'The glass of water never rises. Morrow records the failure with an exact time and an embarrassingly elaborate diagram, then asks a colleague how to design a better experiment. The first honest result of his new research career is an absence he cannot explain away.',
    artPath: '/images/memory-dungeon/earth/medals/e03-gesture-question.webp',
  },
  {
    id: 'e03-gesture-silence',
    reality: 'e03',
    site: '6,4',
    choiceId: 'hold',
    questId: 'e03:6,4',
    title: 'An Ordinary Hour',
    description: 'Complete the ordinary Earth chapter after allowing the failed spell to remain a failure.',
    echo: 'Nothing moves on the desk, and the silence hurts more than a spectacular punishment would have. Morrow stays, cleans up the papers and tries to understand the apparatus without magic. He has not earned the life he took, but he can still choose what to do with this hour.',
    artPath: '/images/memory-dungeon/earth/medals/e03-gesture-silence.webp',
  },
  {
    id: 'e03-ordinary-courage',
    reality: 'e03',
    site: '8,8',
    questId: 'e03:8,8',
    title: 'No Spell for the Commute',
    description: 'Finish the first Earth chapter with both photographs and twelve earned encounters.',
    echo: 'Morrow arrives at work late, carrying a train ticket, an apology and the lunch he packed himself. Nobody applauds. The small victory cannot undo the original theft of a life, but it proves that ordinary responsibility is not a consolation prize for losing magic.',
    artPath: '/images/memory-dungeon/earth/medals/e03-ordinary-courage.webp',
  },
  {
    id: 'e04-rain-question',
    reality: 'e04',
    site: '2,2',
    choiceId: 'challenge',
    questId: 'e04:2,2',
    title: 'Who Opened the Sky?',
    description: 'Survive the altered Earth chapter after questioning the cause of the impossible rain.',
    echo: 'The rain stops before anyone can agree who summoned it. Morrow collects witness accounts without treating a frightened neighbor as a suspect. The pharmacy keeps its door open for the next storm, whether it comes from weather, magic or somebody else’s wish.',
    artPath: '/images/memory-dungeon/earth/medals/e04-rain-question.webp',
  },
  {
    id: 'e04-rain-rescue',
    reality: 'e04',
    site: '2,2',
    choiceId: 'hold',
    questId: 'e04:2,2',
    title: 'Under the Pharmacy Awning',
    description: 'Survive the altered Earth chapter after remembering the neighbors who sheltered strangers.',
    echo: 'The impossible weather becomes a famous story, but the neighbors remember the wet coats and the weight of a stranger leaning on their arms. When the next warning sounds, they organize shelter before asking whose magic is responsible for the sky.',
    artPath: '/images/memory-dungeon/earth/medals/e04-rain-rescue.webp',
  },
  {
    id: 'e04-shelter-plan',
    reality: 'e04',
    site: '7,6',
    choiceId: 'challenge',
    questId: 'e04:7,6',
    title: 'A Whiteboard Against the Tide',
    description: 'Finish the broken-city chapter after studying the research shelter’s practical rescue plan.',
    echo: 'The laboratory staff cross out three elegant theories and keep the ugly schedule that actually delivers medicine. Morrow helps carry water while the volunteers revise their route. No one mistakes a clever explanation for an evacuation, least of all the people waiting on cots.',
    artPath: '/images/memory-dungeon/earth/medals/e04-shelter-plan.webp',
  },
  {
    id: 'e04-shelter-witness',
    reality: 'e04',
    site: '7,6',
    choiceId: 'hold',
    questId: 'e04:7,6',
    title: 'The Helpers Have Names',
    description: 'Finish the broken-city chapter after acknowledging the exhausted research shelter volunteers.',
    echo: 'The shelter records its helpers as people with shifts, limits and families, not an inexhaustible supply of heroism. Morrow takes the night inventory so somebody else can sleep. The emergency does not make consent or rest less necessary, only harder to protect.',
    artPath: '/images/memory-dungeon/earth/medals/e04-shelter-witness.webp',
  },
  {
    id: 'e04-gate-open',
    reality: 'e04',
    site: '8,8',
    choiceId: 'open-the-tide-gate',
    questId: 'e04:8,8',
    title: 'The Anchor Held',
    description: 'Complete the broken-city chapter by rescuing commuters at the cost of Char’s life.',
    echo: 'The commuters survive because Char held the failing anchor. Scylla keeps the names of the rescued beside the name of her sister, refusing to let either column cancel the other. The city owes Char a memorial and the survivors a future, not a tidy calculation.',
    artPath: '/images/memory-dungeon/earth/medals/e04-gate-open.webp',
  },
  {
    id: 'e04-gate-seal',
    reality: 'e04',
    site: '8,8',
    choiceId: 'seal-the-tide-gate',
    questId: 'e04:8,8',
    title: 'The People Behind the Gate',
    description: 'Complete the broken-city chapter with Char alive and commuters still awaiting rescue.',
    echo: 'Char survives the sealing, then demands a list of the people left on the other side. She will not accept a rescue story that ends with her safety. Scylla carries the unfinished list into the past, where every convenient prophecy now has names attached.',
    artPath: '/images/memory-dungeon/earth/medals/e04-gate-seal.webp',
  },
  {
    id: 'e04-gate-divert',
    reality: 'e04',
    site: '8,8',
    choiceId: 'divert-the-current',
    questId: 'e04:8,8',
    title: 'The District on the Map',
    description: 'Complete the broken-city chapter by diverting the surge into the maintenance district.',
    echo: 'The surge misses the crossing and floods a district the official map called empty. Char lives, but insists that empty on paper never meant uninhabited. Morrow begins searching for the people omitted from the evacuation model before anyone congratulates the planners.',
    artPath: '/images/memory-dungeon/earth/medals/e04-gate-divert.webp',
  },
]

export const MEMORY_EARTH_ACHIEVEMENTS = EARTH_MEDALS.map((medal) => ({
  id: medal.id,
  questId: medal.questId,
  title: medal.title,
  description: medal.description,
  echo: medal.echo,
  artPath: medal.artPath,
}))

/**
 * An Earth medal requires a fully playable, replay-validated route.
 * The caller must additionally confirm the campaign marked this reality
 * complete; merely reaching its exit does not grant an achievement.
 */
export function earnedEarthAchievementIds(
  reality: EarthReality,
  journal: unknown,
): string[] {
  const replayed = replayEarthJournal(reality, journal)
  if (!replayed || !earthRealityReady(reality, replayed.progress)) return []
  return EARTH_MEDALS.filter(
    (medal) =>
      medal.reality === reality &&
      (medal.choiceId === undefined ||
        replayed.progress.choices[medal.site] === medal.choiceId),
  ).map((medal) => medal.id)
}
