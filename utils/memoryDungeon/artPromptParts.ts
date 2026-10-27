/**
 * Shared pieces of Memory Dungeon's literal art prompts (Silas, 2026-10-27:
 * "no metaphors for krea2"). Krea 2 paints the nouns it is given, so every
 * brief names who is there, where, doing what, under which light and from
 * which camera, then closes on its realm's medium line. Recurring figures
 * reuse one physical description everywhere they appear.
 */
export const BRIAR_STYLE =
  'Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.'
export const HOUSE_STYLE =
  'Hand-painted gouache and ink illustration, warm candlelight and deep green shadows.'
export const DARK_STYLE =
  'Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.'

export const TRAVELER =
  'an androgynous fey traveller with long pointed ears, short silver hair and a dark green cloak'
export const RESEARCHER =
  'an androgynous adult in their thirties with short dark hair and a grey cardigan'

const STYLES = [BRIAR_STYLE, HOUSE_STYLE, DARK_STYLE]

/** The prompt without its closing medium line. */
export function subjectOf(prompt: string): string {
  const text = prompt.replace(/\s+/g, ' ').trim()
  for (const style of STYLES)
    if (text.endsWith(style)) return text.slice(0, -style.length).trim()
  return text
}

/** The first sentence of a prompt's subject: who and where. */
export function leadOf(prompt: string): string {
  const subject = subjectOf(prompt)
  const end = subject.search(/[.!?](?:\s|$)/)
  return end === -1 ? `${subject}.` : subject.slice(0, end + 1)
}

/**
 * What the traveller visibly does for choices whose label is a rule or a
 * refusal ("without opening it", "not the feather") rather than an action a
 * painter can show. Keyed `<realm>-<place>-<choice>`.
 */
export const VISIBLE_ACTIONS: Readonly<Record<string, string>> = {
  'briar-8-1-copy':
    'sketch the one inverted barb of a carved feather emblem into a notebook',
  'briar-2-2-report':
    'point at a line of muddy tracks while the villagers lean in to look',
  'briar-7-2-shade':
    'saw one low branch from the great oak so sunlight falls on the saplings below',
  'briar-2-3-pause': 'raise both open hands to halt the procession on the road',
  'briar-6-4-carry':
    'tuck a sealed apology letter into their satchel and push a red-sealed order back across the table',
  'briar-1-5-guide':
    'lead the sleepwalking elder home by the hand, stepping around the shadow that trails behind',
  'briar-3-5-listen': 'sit cross-legged in front of the stump, listening',
  'briar-4-5-pay': 'speak with open hands while the listener leans close',
  'briar-8-5-promise': 'shake hands with a raised palm, swearing to return',
  'briar-5-6-bargain':
    'speak close to the crow while it tilts its head to listen',
  'briar-6-6-audit':
    'lay seven dated receipts in a row on a stump and sort the coins into two piles',
  'briar-1-7-mediate':
    'stand between the arguing parties beside the old tree with both hands raised',
  'briar-4-7-listen': 'sit quietly on the bench beside the mourners',
  'briar-6-7-unfasten':
    'help the swan lower a closed wooden box onto the grass, its lid still tied shut',
  'briar-7-7-repair':
    'stitch a torn coat with needle and thread beside the courier',
  'briar-8-8-sketch':
    'sketch one reversed loop of the carved knot into a notebook',
  'house-HD-04-record':
    'write a list of names in a ledger at the end of the supper table',
  'house-HD-09-study':
    'watch the three glowing marks on the guardian and count the beats on their fingers',
  'house-HD-14-witness':
    'sit beside the speaker and listen, hands folded in their lap',
  'house-HD-24-retreat':
    'test the floor of the passage ahead with a long wooden staff',
  'house-HD-26-shelter':
    'hand bread and a lit lantern to the travellers at the door',
  'house-HD-28-cooperate':
    'wave the two guards to stand side by side in front of the same door',
  'house-HD-34-compare':
    'hold two marked objects side by side and compare the paired marks',
  'dark-6-3-records':
    'copy the shapes of the hanging bells into a notebook, the bells hanging still',
  'dark-7-5-listen':
    'kneel with eyes closed while whispered names drift past on the wind',
  'dark-1-6-retrieve':
    'lift a lost object out of the mud and hold it up to the moonlight',
  'dark-2-7-interpret':
    'trace the carved marks on the old stone with one finger',
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

/**
 * The consequence of a choice at an authored place: the place's own lead
 * sentence, then the traveller acting on the choice, closer in.
 */
export function consequencePrompt(
  placePrompt: string,
  action: string,
  style: string,
  shot: 'medium' | 'close' = 'medium',
): string {
  const deed = lowerFirst(action.trim().replace(/[.!?]+$/, ''))
  return shot === 'close'
    ? `${leadOf(placePrompt)} In the foreground, the gloved hands of ${TRAVELER} reach out to ${deed}. Close-up, centered. ${style}`
    : `${leadOf(placePrompt)} A moment later, closer in: ${TRAVELER} steps forward to ${deed}. Medium shot. ${style}`
}

/** A close-up of an authored place's lead subject, for a matching tile face. */
export function closeUpPrompt(placePrompt: string, style: string): string {
  return `${leadOf(placePrompt)} Close-up, centered against a dark backdrop of thorny briars. ${style}`
}
