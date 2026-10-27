import type { AcademyRun } from './rules'
import { identityFor } from './identityArcs'
import {
  signatureById,
  POWER_ORIGINS,
  POWER_AFFINITIES,
  type PowerVowId,
} from './specialPowers'

export type VowAction = 'protect' | 'bargain' | 'refuse'
export type VowMemory = { day: number; action: VowAction }

export function isVowMemory(raw: unknown, day: number): raw is VowMemory[] {
  return (
    Array.isArray(raw) &&
    raw.length <= 5 &&
    raw.every(
      (entry) =>
        entry !== null &&
        typeof entry === 'object' &&
        typeof entry.day === 'number' &&
        Number.isInteger(entry.day) &&
        [3, 10, 18, 25, 28].includes(entry.day) &&
        entry.day <= day &&
        ['protect', 'bargain', 'refuse'].includes(entry.action),
    ) &&
    new Set(raw.map((entry) => entry.day)).size === raw.length &&
    raw.every((entry, i) => i === 0 || entry.day > raw[i - 1].day)
  )
}

export function routeStanding(
  history: readonly VowMemory[] | undefined,
): number {
  return (history ?? []).reduce(
    (score, event) =>
      score +
      (event.action === 'protect' ? 2 : event.action === 'bargain' ? -2 : -1),
    0,
  )
}

export function routeMemoryLine(
  history: readonly VowMemory[] | undefined,
): string {
  const recent = history?.[history.length - 1]
  if (!recent) return 'The story of your promise has not begun.'
  return recent.action === 'protect'
    ? 'Your last choice saved people at personal cost. Former witnesses recognize you as someone who stays.'
    : recent.action === 'bargain'
      ? 'Your last deal bought an advantage, but somebody you disappointed is keeping the receipt.'
      : 'Walking away kept your hands free. Someone else now lives with the cost of that decision.'
}

export function routeEpilogue(
  vow: PowerVowId | undefined,
  history: readonly VowMemory[] | undefined,
): string {
  if (!vow || !history?.length) return ''
  const trust = routeStanding(history)
  const completed = history.length
  const outcome =
    trust >= 6
      ? 'The witnesses who survived your early decisions volunteer for the final rescue.'
      : trust <= -3
        ? 'Past bargains and abandoned allies surface at the worst possible moment.'
        : 'Your allies arrive divided over what your promises have meant.'
  const legacy =
    vow === 'shelter'
      ? 'The missing bus, dangerous clinic and harbor escape become a story Comet City will tell for years.'
      : vow === 'unmask'
        ? 'The erased yearbook, stolen faces and underground power source remain part of the public inquiry.'
        : 'The command key, automated policing and contested prom crown force the city to decide who may govern.'
  return `Your ${vow} adventure crossed ${completed} decisive chapters. ${legacy} ${outcome}`
}

type Episode = {
  day: number
  title: string
  location: string
  scene: string
  alternate: string
  rescue: string
  bargain: string
  refusal: string
}
const EPISODES: Record<PowerVowId, Episode[]> = {
  shelter: [
    {
      day: 3,
      title: 'The Bus That Never Arrived',
      location: 'Transit Exchange',
      scene:
        'A school bus full of scholarship students disappears between two consecutive traffic cameras. Mina traces the signal into a storm drain. The commissioner offers you exclusive hero coverage if you leave it to his private rescue crew.',
      alternate:
        'A second bus is approaching the same intersection with a friend at the wheel.',
      rescue:
        'You pull the passengers out through a drainage hatch and discover a tampered route chip. The commissioner publicly calls you reckless, but the families remember.',
      bargain:
        'The private drones save the bus and confiscate the evidence. A missing passenger is quietly removed from the passenger list.',
      refusal:
        'You secure the next bus. The first passengers are left for the night shift and their families learn exactly whom you did not rescue.',
    },
    {
      day: 10,
      title: 'The Ward Beneath the Water',
      location: 'Floating Clinic',
      scene:
        'The missing bus passenger is sedated at an illegal floating clinic. Their blood carries dormant silver nanites. The medicine is made by siphoning chemicals from the city water.',
      alternate:
        'The clinic manager is your ex and insists every patient deserves treatment.',
      rescue:
        'You let the patients vote on managed risk and force the clinic to open its records. A cure emerges but its manufacturer goes underground.',
      bargain:
        'You secure private medicine for the missing student and leave the contaminated water grid untouched.',
      refusal:
        'You save one patient and abandon the others to the clinic owners, who continue the experiment.',
    },
    {
      day: 18,
      title: 'A Shelter With Teeth',
      location: 'South Quay Housing',
      scene:
        'An evacuation shelter feeds and houses refugees, then locks its doors at night. Nanites embedded in its walls now digest metal implants while their owners are still wearing them.',
      alternate:
        'Imani has a sibling inside and begs you to let her lead rather than order her around.',
      rescue:
        'You let Imani lead a tunnel rescue. Residents emerge alive and Imani remembers you trusted her.',
      bargain:
        'The inventor releases the shelter in exchange for a sample of your own dangerous powers.',
      refusal:
        'Faculty rescuers arrive late and evacuate the donor wing first. Dock workers are injured cutting the gates free.',
    },
    {
      day: 25,
      title: 'Not Everyone Fits on the Ferry',
      location: 'Harbor Line',
      scene:
        'One boat can escape the collapsing harbor. It carries clinic patients and a mayor who promises to fund your rescue team. A second boat holds your oldest rival.',
      alternate:
        'Your rival shouts that they would rescue you even after everything you said about them.',
      rescue:
        'You organize an improvised second crossing and the rival joins the work. The mayor withdraws their offer.',
      bargain:
        'You sail with the mayor and win funding. The second boat drifts until after dark.',
      refusal:
        'You leave both boats to captains working without coordination. Rescue succeeds partially at the cost of injured dock workers.',
    },
    {
      day: 28,
      title: 'The Last Empty Seat',
      location: 'Prom Ballroom',
      scene:
        'A recovered passenger lays a paper place card for a friend who never returned from the bus. Somebody has sabotaged the emergency exits while officials prepare to give you a rescue award.',
      alternate:
        'The grieving survivor begs you to use your speech to find their missing friend.',
      rescue:
        'You open the exits and let the missing students become the real story. An orchestra member reveals the last captive location.',
      bargain:
        'Your acceptance speech covers a stealth search, but the families see you smiling beside their tormentors.',
      refusal:
        'A side exit opens quietly, yet nobody learns why the original passenger list was altered.',
    },
  ],
  unmask: [
    {
      day: 3,
      title: 'The Classmate Who Never Existed',
      location: 'Academy Yearbook Press',
      scene:
        'A missing face leaves a blank rectangle in the graduation photo. Sol can retrieve a ghost outline from the printer memory while the headmistress denies the student ever existed.',
      alternate:
        'The photo editor is dating the student council president, who might lose their scholarship.',
      rescue:
        'You publish the photo with protected witnesses and an erased classmate gets their name back.',
      bargain:
        'You surrender the evidence for access to a restricted archive; the photo editor is suspended for fabricating records.',
      refusal:
        'You quietly reassure the editor, but the erasure continues under your nose.',
    },
    {
      day: 10,
      title: 'The Perfect Attendance Plague',
      location: 'Digital Records Office',
      scene:
        'Every missing student is marked present on three dates. Microscopic metallic holes riddle the paper records. A repair nanovirus has started eating absence records as if they were damaged tissue.',
      alternate:
        'Sol confesses he wrote the virus detection software and failed to report a warning.',
      rescue:
        'Sol testifies and helps expose the financing. The clerk survives under witness protection and your friendship gets an honest bruise.',
      bargain:
        'You rewrite your friends out of the prediction engine but give the virus a route into the medical files.',
      refusal:
        'You leak the files anonymously. An innocent clerk is arrested as the presumed hacker.',
    },
    {
      day: 18,
      title: 'The Dance With the Wrong Face',
      location: 'Founders Ball',
      scene:
        'Investors test a face-swapping prototype at a glamorous alumni party. A married alumna sees somebody wearing her former lover’s face. The impersonator looks terrified.',
      alternate:
        'A jealous patron claims all three people in a complicated relationship consented to the stunt, but one says otherwise.',
      rescue:
        'You shut down the demonstration and let every participant speak. Investors scatter and the performer keeps control of their own identity.',
      bargain:
        'You acquire the disguise device and legitimize a show built on stolen faces.',
      refusal:
        'You follow the supplier into a secret elevator while the performer must continue the humiliating show.',
    },
    {
      day: 25,
      title: 'The Name Under the City',
      location: 'Municipal Undergrid',
      scene:
        'City blueprints list hundreds of people as renewable infrastructure. The names match the missing students. The shield draws energy from unwilling memory-scrubbed volunteers.',
      alternate:
        'The engineer who designed it is someone you trusted with your first confession of love.',
      rescue:
        'You reveal the system with an evacuation plan and put your friend on a path toward accountability.',
      bargain:
        'You blackmail the engineer for control codes; the volunteers stay connected.',
      refusal:
        'You publish the corporate accounts without exposing the human power source. The CEO resigns and nothing changes below ground.',
    },
    {
      day: 28,
      title: 'Everyone Is Invited Except the Truth',
      location: 'Guest List Control',
      scene:
        'Forty-eight anonymous entries appear on the prom guest list, and invitations double as surveillance tags. A tabloid offers you footage of your worst date to buy your silence.',
      alternate:
        'The person you want to impress has already accepted an invitation with a false name.',
      rescue:
        'You broadcast the list to the guests. The tags lose their leverage and missing students regain their names.',
      bargain:
        'You bury one humiliating memory and the censors keep their directory of prom attendees.',
      refusal:
        'You destroy the guest server without warning, including genuine evacuation access records.',
    },
  ],
  claim: [
    {
      day: 3,
      title: 'A Key to the Night',
      location: 'Patrol Tower',
      scene:
        'An anonymous donor leaves a bronze command key in your locker. It can redirect city rescue drones and overrule your fiercest academic rival, the night captain.',
      alternate:
        'The key carries the name of someone who graduated five years before they were born.',
      rescue:
        'You share access and demand a joint audit. Your rival begrudgingly becomes a witness.',
      bargain:
        'Your district gets every drone and poorer neighborhoods lose their emergency coverage.',
      refusal:
        'The academy pockets the key and gives it to a donor’s child. Your rival still believes you stole it.',
    },
    {
      day: 10,
      title: 'Terms of Service',
      location: 'Central Dataworks',
      scene:
        'City government offers you automated crime prediction, scoring people by family debts, romantic history and private friendships. Your best friend is flagged as a future felon.',
      alternate:
        'A network predicts you will be involved in a three-person relationship scandal before prom.',
      rescue:
        'You require independent oversight and genuine opt-in. The lucrative contract fails, but nobody is arrested on a prediction.',
      bargain:
        'You purge your friends’ names and leave everyone else at the mercy of the corrupt model.',
      refusal:
        'You reject the contract while leaving the software installed for the next contractor.',
    },
    {
      day: 18,
      title: 'The Palace Coup Committee',
      location: 'City Council Chamber',
      scene:
        'Three groups ask you to depose the negligent security commissioner. One wants civilian oversight, one wants corporate immunity and one wants your face on every checkpoint.',
      alternate:
        'Your ex attends the negotiation, prepared to disagree with you in front of everybody.',
      rescue:
        'You force all factions to sign an emergency rescue charter. Nobody gets absolute power.',
      bargain:
        'Your chosen faction hands you command and seals evacuation tunnels for leverage.',
      refusal:
        'You steal the commissioner’s evacuation routes and let the factions fight at the expense of residents.',
    },
    {
      day: 25,
      title: 'The City That Signed Itself Away',
      location: 'Board Exchange',
      scene:
        'A conglomerate promises to save the city shield in return for owning its hospitals, ferries and schools. The council is about to sign.',
      alternate:
        'A business rival asks to work beside you without demanding exclusivity or your affection.',
      rescue:
        'You build a transparent emergency bond. The city keeps its hospitals and your rival respects your restraint.',
      bargain:
        'You buy the decisive votes and become a new unaccountable ruler.',
      refusal:
        'You expose corruption but offer no replacement plan. A hospital loses emergency funding.',
    },
    {
      day: 28,
      title: 'The Prom Crown Is a Control Node',
      location: 'Ballroom Balcony',
      scene:
        'The prom crown is a miniature control relay. Its wearer can shield one neighborhood by exposing another to catastrophe. Student council asks you to wear it.',
      alternate:
        'Its original engineer begs you to destroy the device before the final dance.',
      rescue:
        'You turn the coronation into an emergency public council vote. The relay remains under collective oversight.',
      bargain:
        'You take the crown and protect your preferred district at someone else’s expense.',
      refusal: 'You smash the relay and the automatic city shield goes dark.',
    },
  ],
}
export function openingRouteFor(run: AcademyRun) {
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'campus' ||
    !run.signature ||
    !run.vow
  )
    return null
  const episode = EPISODES[run.vow].find((entry) => entry.day === run.day)
  if (!episode) return null
  const person = identityFor(run.signature)
  const signature = signatureById(run.signature)!
  const origin = POWER_ORIGINS.find((entry) => entry.id === signature.origin)!
  const affinity = POWER_AFFINITIES.find(
    (entry) => entry.id === signature.affinity,
  )!
  const variant = (Math.floor(run.seed / 7) + run.day * 11) % 2
  const memory = run.vowHistory ?? []
  const callback = routeMemoryLine(memory)
  const historyShift = routeStanding(memory)
  const reputation =
    historyShift >= 4
      ? 'Your reputation brings an unexpected volunteer to the scene.'
      : historyShift <= -3
        ? 'A former contact warns you that people have begun refusing your calls.'
        : 'Your classmates are still deciding what your promise is worth.'
  return {
    title: episode.title,
    location: episode.location,
    scene:
      person.realName +
      ' arrives at ' +
      episode.location +
      '. ' +
      episode.scene +
      ' ' +
      (variant
        ? episode.alternate
        : 'A live reporter broadcasts the emergency before anyone can prepare a statement. ') +
      ' ' +
      callback +
      ' ' +
      reputation +
      ' Your ' +
      origin.name +
      ' origin carries a risk: ' +
      origin.complication +
      ' Your ' +
      affinity.name +
      ' affinity carries another: ' +
      affinity.risk,
    options: [
      {
        id: 'vow-' + run.vow + '-' + run.day + '-protect',
        label: 'Take responsibility for the people at risk',
        text:
          episode.rescue +
          ' ' +
          signature.name +
          ' offers a path: ' +
          signature.action +
          '. Cost: ' +
          signature.cost,
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'vow-' + run.vow + '-' + run.day + '-bargain',
        label: 'Make the deal that gives you an advantage',
        text: episode.bargain,
        influence: -2,
        danger: 2,
        trust: -2,
      },
      {
        id: 'vow-' + run.vow + '-' + run.day + '-refuse',
        label: 'Refuse the terms and walk away',
        text: episode.refusal,
        influence: 0,
        danger: 1,
        trust: -1,
      },
    ],
  }
}
export const openingRouteDays = (vow: PowerVowId) =>
  EPISODES[vow].map((event) => event.day)
