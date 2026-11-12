// /utils/achievements/catalog/main/crystal-street.ts
//
// Terrors on Crystal Street. Judged by utils/crystalStreet/achievements.ts
// from a committed move in crystalStreetStore.commit(), never from a restored
// week.

import type { GameAchievementDef } from '../../gameAchievements'

const STYLE =
  'Retro suburban horror illustration in the style of a painted 1980s paperback cover, sodium streetlight orange, VHS magenta and moonlit teal palette, crisp shadows and soft film grain, centered emblem composition, no text or lettering, every surface bare and unmarked.'

export const CRYSTAL_STREET_ACHIEVEMENTS: GameAchievementDef[] = [
  {
    game: 'crystal-street',
    key: 'first-week',
    tier: 1,
    label: 'Made It to Sunday',
    message:
      'Seven nights on Crystal Street, and you are still around to tell somebody about it.',
    tooltip: 'In Terrors on Crystal Street, reach the end of a week.',
    subtleHint: 'Every week ends. Make sure you are there when it does.',
    icon: 'kind-icon:calendar',
    rule: { kind: 'event' },
    artPrompt: `A quiet suburban cul-de-sac at Sunday sunrise after a long week, a bicycle lying on a dewy lawn, a flashlight still switched on in the grass, porch lights clicking off one by one along the street. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'case-cracked',
    tier: 1,
    label: 'Case Cracked',
    message:
      'Three clues on the corkboard. You know exactly what is haunting Crystal Street this week.',
    tooltip:
      'In Terrors on Crystal Street, find all three clues to the week’s nightmare.',
    subtleHint: 'Search the places the town would rather you ignored.',
    icon: 'kind-icon:magnify',
    rule: { kind: 'event' },
    artPrompt: `A teenager's bedroom corkboard lit by a desk lamp at midnight, three polaroid clues pinned together with red yarn, a library book, a cassette tape and a torn newspaper photo of a shadowy shape behind the town water tower. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'second-chance',
    tier: 1,
    label: 'Second Chance',
    message:
      'The first roll went wrong. A friend gave you another, and this time it landed.',
    tooltip:
      "In Terrors on Crystal Street, succeed on a roll using a friend's reroll.",
    subtleHint: 'Some friends are good for one more try.',
    icon: 'kind-icon:refresh',
    rule: { kind: 'event' },
    artPrompt: `Two glowing dice bouncing across the hood of a station wagon under a streetlight, one hand catching them mid-air while a friend's hand rests on the shoulder of the roller, moths circling overhead. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'shopper',
    tier: 1,
    label: 'Mall Rat',
    message:
      'Quarters spent, supplies bagged. Nothing says preparedness like a trip to the shops.',
    tooltip: 'In Terrors on Crystal Street, buy something with your quarters.',
    subtleHint: 'The shop is open during the day.',
    icon: 'kind-icon:bag',
    rule: { kind: 'event' },
    artPrompt: `A neon-lit shopping mall corridor at closing time, a teenager walking out of a novelty shop with a paper bag holding a flashlight, garlic, a slingshot and a walkie-talkie, mannequins in the window watching a little too closely. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'rough-week',
    tier: 1,
    label: 'Rough Week',
    message:
      'The nightmare won this one. Crystal Street will remember the week it got bad.',
    tooltip: 'In Terrors on Crystal Street, reach a bad ending.',
    subtleHint: 'Not every week goes your way.',
    icon: 'kind-icon:ghost',
    rule: { kind: 'event' },
    artPrompt: `An empty suburban street at night with every porch light dark except one flickering bulb, a lone sneaker in the middle of the road, a long monstrous shadow stretching across the front lawns, its owner hidden beyond the last house. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'full-crew',
    tier: 2,
    label: 'Full Crew',
    message:
      'Three friends at your side. Nobody on Crystal Street walks into the dark alone.',
    tooltip: 'In Terrors on Crystal Street, have three friends in your crew.',
    subtleHint: 'Meet people around town during the day.',
    icon: 'kind-icon:users',
    rule: { kind: 'event' },
    artPrompt: `Four teenagers on bikes lined up at the top of a hill overlooking a sleepy suburb at dusk, flashlights in their handlebar baskets, one with a baseball bat and one with a camera, streetlights blinking on below them. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'arc-complete',
    tier: 2,
    label: 'Friend for Life',
    message:
      "You saw a friend's whole story through. Whatever comes next, they are in your corner.",
    tooltip:
      "In Terrors on Crystal Street, complete a friend's three-part story in one week.",
    subtleHint: 'Friends have their own troubles. Help with them.',
    icon: 'kind-icon:handshake',
    rule: { kind: 'event' },
    artPrompt: `Two friends sitting on a treehouse platform at night sharing a walkie-talkie and a bag of candy, a friendship bracelet tied around a branch, the town lights below and a thin crescent moon above the rooftops. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'burned-bridges',
    tier: 2,
    label: "Nobody's Side",
    message:
      'Family, officials or neighbors: one of them gave up on you completely, and the week ended its own way.',
    tooltip:
      'In Terrors on Crystal Street, reach a special ending where a faction collapses.',
    subtleHint: 'Standing with the town can run all the way out.',
    icon: 'kind-icon:fire',
    rule: { kind: 'event' },
    artPrompt: `A row of suburban houses at night with every curtain drawn and every door shut, a lone teenager standing on the sidewalk with a backpack, an abandoned town hall in the distance with its flag at half mast. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'best-ending',
    tier: 2,
    label: 'Happily Ever After',
    message:
      'The best ending: the nightmare is gone and Crystal Street wakes up to an ordinary Monday.',
    tooltip: 'In Terrors on Crystal Street, reach a best ending.',
    subtleHint: 'Clues, friends and wins add up by the finale.',
    icon: 'kind-icon:sun',
    rule: { kind: 'event' },
    artPrompt: `A bright Monday morning on a cheerful suburban street, kids walking to school with backpacks, a defeated monster's broken mask lying in a recycling bin, sprinklers making rainbows over green lawns. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'twelve-wins',
    tier: 2,
    label: 'Twelve Wins',
    message:
      'Twelve encounters won in a single week. The nightmares are starting to fear you.',
    tooltip: 'In Terrors on Crystal Street, win 12 encounters in one week.',
    subtleHint: 'Train, team up and pick your fights.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'event' },
    artPrompt: `A garage wall covered with twelve tally marks in spray paint above a workbench of homemade monster-hunting gear, a battered baseball bat, a crossbow made from a skateboard and a glowing lantern on the floor. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'five-nightmares',
    tier: 2,
    label: 'Five Nightmares',
    message:
      'Five different horrors have stalked Crystal Street on your watch. You are starting a collection.',
    tooltip:
      'In Terrors on Crystal Street, face five different nightmares across your weeks.',
    subtleHint: 'Every week brings a new villain to town.',
    icon: 'kind-icon:mask',
    rule: { kind: 'event' },
    artPrompt: `Five monstrous silhouettes in the windows of five different houses along a dark street, a swamp creature, a masked slasher, a vampire, a clown and a ghost, each lit by a different colored lamp. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'ten-friends',
    tier: 2,
    label: 'Ten Friends',
    message:
      'Ten people on Crystal Street have had your back. The scrapbook is getting crowded.',
    tooltip:
      'In Terrors on Crystal Street, recruit ten different friends across your weeks.',
    subtleHint: 'Different weeks, different people to meet.',
    icon: 'kind-icon:people',
    rule: { kind: 'event' },
    artPrompt: `A scrapbook page crowded with ten instant-camera photos of teenagers and neighbors posing with flashlights, bats and walkie-talkies, doodled stars and stickers around the edges, a pressed flower tucked in one corner. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'final-girl',
    tier: 3,
    label: 'Final Girl',
    message:
      'Everyone else ran. You stayed, and you won. Crystal Street has a Final Girl.',
    tooltip: 'In Terrors on Crystal Street, win the Final Girl ending.',
    subtleHint: 'Sometimes the last one standing is the one who wins.',
    icon: 'kind-icon:star',
    rule: { kind: 'event' },
    artPrompt: `A lone young woman standing victorious at dawn on a suburban lawn, holding a flashlight and a broken broom handle, her jacket torn, the shadow of a defeated monster dissolving behind her as the sun rises over the rooftops. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'best-five',
    tier: 3,
    label: 'Five Best Weeks',
    message:
      'Five nightmares sent packing with their best endings. The town sleeps better because of you.',
    tooltip:
      'In Terrors on Crystal Street, find the best ending against five different nightmares.',
    subtleHint: 'Each villain has a best ending of its own.',
    icon: 'kind-icon:crown',
    rule: { kind: 'event' },
    artPrompt: `Five trophies made from defeated monster props lined up on a teenager's bedroom shelf, a cracked hockey mask, a vampire fang, a swamp-weed crown, a clown nose and a ghostly sheet, a framed photo of the whole crew beside them. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'every-clique',
    tier: 3,
    label: 'Every Clique',
    message:
      'You have seen Crystal Street through the eyes of every clique in school.',
    tooltip:
      'In Terrors on Crystal Street, finish a week as every one of the six character types.',
    subtleHint: 'Try a different kind of kid next week.',
    icon: 'kind-icon:character',
    rule: { kind: 'event' },
    artPrompt: `A high school yearbook spread with six class portraits side by side, a jock, a brain, a rebel, a goth, a skater and a theater kid, each holding a different monster-fighting tool, a lunchroom table and lockers in the background. ${STYLE}`,
  },
  {
    game: 'crystal-street',
    key: 'all-nightmares',
    tier: 3,
    label: 'Street of Terrors',
    message:
      'Every nightmare that ever haunted Crystal Street has met you. None of them liked it.',
    tooltip:
      'In Terrors on Crystal Street, face every one of the nightmares across your weeks.',
    subtleHint: 'Keep coming back. The street has a long memory.',
    icon: 'kind-icon:moon',
    rule: { kind: 'event' },
    artPrompt: `An aerial view of a whole suburban street at midnight, every house hiding a different monster in a lit window, a lone flashlight beam sweeping the road from a teenager standing calmly at the center of the cul-de-sac. ${STYLE}`,
  },
]
