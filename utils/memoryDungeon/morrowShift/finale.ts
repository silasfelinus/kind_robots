import type { MorrowShiftSite } from './types'

/**
 * e03 finale. `risk` is the `morrow-magic-attempt` wish anchor: Morrow
 * speaks the working, so e04's arriving magic is at least partly his doing.
 * `care` leaves the working unspoken; e04 must then answer whose wish
 * opened the door instead. Neither choice makes magic work in e03.
 */
export const MORROW_SHIFT_FINALE: MorrowShiftSite = {
  key: '8,8',
  place: 'Floodlit Fountain',
  title: 'The Working Under the Floodlights',
  speaker: 'Morrow',
  kind: 'memory',
  opening:
    'The floodlights end a few steps short of the drained fountain, where Tilly drew the mouth. Morrow has carried one Briar working all month, folded small: the words that once opened a door between his life and someone else’s. Nothing on Earth has answered a spell yet. Nothing has forbidden one either.',
  artSubject:
    'An androgynous adult in their thirties with short dark hair and a grey cardigan stands alone at a drained stone fountain just beyond the edge of the park floodlights in light rain, one hand half-raised, breath visible.',
  choices: [
    {
      id: 'care',
      label: 'Leave the working unspoken and walk to the early train',
      outcome:
        'Morrow folds the words away. In the morning he arrives late with a train ticket, an apology and a lunch he packed himself. Nobody applauds. The life is still borrowed, but this hour was his.',
      effects: { trust: 2, danger: -1 },
      artSubject:
        'Morrow at dawn on a station platform holding a paper ticket and a wrapped sandwich, the night park floodlights switching off behind the railings.',
    },
    {
      id: 'risk',
      label: 'Speak the working into the rain, just once',
      outcome:
        'The words leave him and nothing happens. Then, for one breath, a single puddle holds a light the floodlights never cast. It is gone before he can be sure. Morrow tells no one, and the city goes on believing it is ordinary.',
      effects: { evidence: 2, danger: 1 },
      artSubject:
        'Morrow kneeling beside a rain puddle at the dry fountain, a faint pale-gold glint in the water that matches none of the white floodlights above.',
    },
  ],
  echoes: [
    {
      flag: 'e03:8,6:care',
      text: 'Tilly’s map calls this fountain a monster. You took her safe crossing, so you know she walks the long way around it every day.',
    },
    {
      flag: 'e03:8,6:risk',
      text: 'Tilly wanted the fountain renamed “the Sleeping One”. The name sits in your pocket next to the working.',
    },
    {
      flag: 'e03:3,3:care',
      text: 'Jun’s letter is still sealed. Whatever Rowan meant to say, it is still his to say.',
    },
    {
      flag: 'e03:3,3:risk',
      text: 'You read Jun’s letter. The working would carry you back to the person it was written by. That isn’t the same as an apology.',
    },
    {
      flag: 'e03:4,6:care',
      text: 'Sal knows you are not who she thought. She still left the stairwell light on for you tonight.',
    },
    {
      flag: 'e03:2,1:care',
      text: 'Mara wrote her name on the receipt when you admitted you could not remember her. You still carry it. She deserves an answer more useful than a miracle.',
    },
    {
      flag: 'e03:2,1:risk',
      text: 'Mara has stopped asking about the shift you missed. The bluff has held so long it has started to feel like a debt.',
    },
  ],
}
