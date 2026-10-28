import type { PlaybookKitSpec } from '../types'

// The opening Vignette is a deliberately bounded tactical training slice.
// Six stages, four roles per each of 48 permanent heroes and bespoke routes
// are tracked separately by conductor/every-villain-tactics; not claimed done here.
export const EVERY_VILLAIN_TACTICS: PlaybookKitSpec = {
  id: 'every-villain-tactics',
  conductorSlug: 'every-villain-tactics',
  title: 'Every Villain Tactics',
  tagline: 'Somebody else is the hero.',
  premise: 'When everyone believes they are saving Comet City, whose version of victory survives First Bell?',
  tier: 'vignette',
  route: '/admin/every-villain-tactics',
  theme: 'forge',
  keyArt: {
    src: '/comet-city-academy/front/splash.webp',
    brief: 'Painted Comet City Academy skyline at dusk with rival superhero patrols crossing a floodlit rooftop tactical board, bold deep crimson and electric blue',
    alt: 'Comet City Academy towers under the comet at sunset',
  },
  acts: [
    { id: 1, title: 'First Bell', blurb: 'A rescue sounds like a threat from the other side of the door.' },
  ],
  meters: [
    { id: 'squad', label: 'Squad standing', min: 0, max: 12, start: 12 },
    { id: 'rivals', label: 'Rival standing', min: 0, max: 9, start: 9 },
    { id: 'round', label: 'Turn', min: 1, max: 20, start: 1 },
  ],
  factions: [],
  cast: [
    {
      id: 'backdraft', name: 'Backdraft', role: 'follower',
      tagline: 'Dez Okafor. His heat can shield a classmate or burn a bridge.',
      portrait: { brief: 'Dez Okafor, academy student with glowing orange forearms and heatproof gloves, illustrated dramatic comic portrait' },
    },
    {
      id: 'priya', name: 'Priya Raman', role: 'follower',
      tagline: 'Genius with a way into locked systems, and a dangerous reluctance to be seen.',
      portrait: { brief: 'Priya Raman in oversized purple academy hoodie, braid and glasses, striking comic character portrait' },
    },
    {
      id: 'hattie', name: 'Hattie Nkemelu', role: 'follower',
      tagline: 'The strongest student in the room remembers exactly who is getting crushed.',
      portrait: { brief: 'Hattie Nkemelu with slate mineral plates, oversized academy blazer, powerful superhero portrait' },
    },
    {
      id: 'pip', name: 'Pip Marchetti', role: 'villain', primary: true,
      tagline: 'A wind-scarred student holding the door against a rescue they believe will harm everyone.',
      portrait: { brief: 'Pip Marchetti, wiry skydiver with pixie-cut hair and a branching lightning scar, comet-lit comic portrait' },
    },
  ],
  reveals: [
    {
      id: 'rival-call', title: 'The second alarm',
      teaser: 'Why did the auditorium bell ring twice?',
      text: 'The rival patrol is containing a second threat. From their side, your rescue looks like an invasion.',
      act: 1, about: ['pip', 'backdraft'],
    },
  ],
  endings: [
    {
      id: 'doors-open', title: 'Doors Open', tone: 'hopeful',
      summary: 'Both squads stand down and let the trapped students decide whom to trust.',
      hint: 'There is more than one way through a locked door.',
      about: ['backdraft', 'pip'],
      art: { brief: 'School auditorium doors opening to safe students as two rival cape-wearing squads lower their weapons, comic panel' },
    },
    {
      id: 'broken-orders', title: 'Broken Orders', tone: 'bittersweet',
      summary: 'The rescue succeeds but the patrol follows orders that neither side can forgive.',
      hint: 'Winning a fight is not the same as ending it.',
      about: ['priya', 'pip'],
      art: { brief: 'A hero standing among cracked academy floor tiles as the rival patrol retreats beneath emergency lights' },
    },
    {
      id: 'someone-else', title: "Someone Else's Villain", tone: 'dark',
      summary: 'The school calls one team heroes; the witnesses remember a different story.',
      hint: 'Listen to the people defending the door.',
      about: ['hattie', 'pip'],
      art: { brief: 'Two costumed Comet City defenders reflected as heroes and antagonists in opposite shards of a broken school window' },
    },
  ],
  moments: [
    {
      id: 'first-bell', title: 'The First Bell', kind: 'scene', act: 1, about: [],
      caption: 'The assembly was supposed to be peaceful. The second bell sounded wrong.',
      art: { src: '/comet-city-academy/front/tutorial.webp', brief: 'The academy hall with the first alarm illuminated above crowded staircases' },
    },
    {
      id: 'shield-of-heat', title: 'Heat Shield', kind: 'follower', act: 1, about: ['backdraft'],
      caption: 'Backdraft holds the front line and wonders who needs protection.',
      art: { brief: 'Dez Okafor forming a glowing fire shield in a school hallway' },
    },
    {
      id: 'silent-door', title: 'The Silent Door', kind: 'scene', act: 1, about: ['priya'],
      caption: 'A locked door may be a rescue route or the last thing keeping danger in.',
      art: { brief: 'Electronic auditorium doors blinking red and blue below a hero shadow' },
    },
    {
      id: 'the-other-team', title: 'The Other Team', kind: 'villain', act: 1, about: ['pip'],
      caption: 'Pip says they are protecting the same students. Their weapon is still raised.',
      art: { brief: 'Pip Marchetti defending the school auditorium stairs against another patrol' },
    },
    {
      id: 'pressure-line', title: 'Pressure Line', kind: 'follower', act: 1, about: ['hattie'],
      caption: 'Hattie anchors the stairwell while rival squads trade accusations.',
      art: { brief: 'Hattie Nkemelu bracing broken masonry on academy stairs' },
    },
    {
      id: 'debrief', title: 'After the Sirens', kind: 'scene', act: 1, about: ['pip', 'backdraft'],
      caption: 'The story ends with both sides giving testimony.',
      art: { brief: 'Two heroic students under academy emergency lights writing incompatible incident reports' },
    },
  ],
  trailer: {
    tagline: 'Everyone has a mission. Nobody agrees on the target.',
    beats: [
      { moment: 'first-bell', line: 'The first bell was a warning.' },
      { moment: 'silent-door', line: 'The second was an accusation.' },
      { moment: 'shield-of-heat', line: 'Who gets to call themselves the hero?' },
    ],
  },
}
