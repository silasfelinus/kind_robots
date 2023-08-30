import { defineStore } from 'pinia'

export const useDreamStore = defineStore('dreams', () => {
  const dreams = [
    'Walking on a rainbow bridge across the sky',
    'Floating in a bubble through a city in the clouds',
    'Dancing with shadows in a moonlit forest',
    'Sailing on an ocean of stars',
    'Discovering a secret door in your home that leads to another world',
    'Riding a bicycle on a path made of stardust',
    'Having a picnic with talking animals in a meadow of giant flowers',
    'Exploring an underwater city inhabited by mermaids',
    'Flying with a flock of brightly colored birds over a landscape of floating islands',
    'Walking through a forest where the leaves are made of crystal',
    'Finding a magical book that brings any story you write in it to life',
    'Climbing a mountain that grows taller with each step you take',
    'Discovering a garden where every flower sings a different song',
    'Wandering through a maze made of mirrors in the middle of the desert',
    'Attending a grand ball where everyone is wearing masks of the moon and stars',
    'Finding an old map that leads to a hidden kingdom in the clouds',
    'Stumbling upon a city where all the buildings are made of glass',
    'Visiting a market where people trade in dreams and memories',
    'Exploring a castle made of clouds in the sky',
    'Walking on a path that appears in front of you with each step you take',
    'Finding a tree that grows different kinds of fruit each day',
    'Discovering a lake where each drop of water tells a different story',
    'Stumbling upon a carnival that appears only once every hundred years',
    'Finding a field where each blade of grass whispers a secret',
    'Exploring a forest where the trees are made of books',
    'Discovering a river that flows with music instead of water',
    'Climbing an infinite ladder that reaches past the clouds into the stars',
    'Participating in a race with tortoises riding on hares',
    'Landing on a planet where the inhabitants speak in colors rather than sounds',
    'Finding a pocket watch that can turn back time, but only for one minute a day',
    'Exploring an underground cavern where stalactites and stalagmites are musical notes',
    'Wandering through a city where the buildings sway and dance to unseen rhythms',
    'Visiting a zoo where the animals are actually people, and the people are the exhibits',
    'Trapped in a sandcastle with rooms that shift with the tides',
    'Being a part of a choir where each voice contributes a different flavor instead of a note',
    'Finding a hidden valley where the trees are shaped like giant chess pieces',
    'Discovering a mountain peak that touches the northern lights',
    "Traveling in a hot air balloon that's guided by your thoughts",
    'Stumbling upon a beach where each grain of sand holds a different memory',
    'Playing a piano that paints a picture with each note',
    'Exploring an amusement park where the rides are real adventures',
    "Attending a banquet where every dish tells a story from its ingredients' perspectives",
    'Venturing into a forest where the wildlife is made entirely of origami',
    'Landing on an asteroid where gravity is a mere suggestion',
    'Juggling planets in the vast cosmos, each spin generating a new weather pattern',
    'Sliding down a rainbow into a pot of golden ideas instead of gold',
    'Riding a roller coaster with tracks made of laughter and joy',
    'Discovering a playground where the see-saws balance ideas and the swings oscillate between seasons',
    'Visiting a library where books whisper their stories to you',
    'Sailing on a sea of honey, guided by bees to an island of wildflowers',
    'Strolling through a city where street signs sing directions and traffic lights dance in sync',
    'Drawing a door on a wall and stepping through it to find an enchanted garden',
    'Running in a field where the dandelions are tiny suns and the grass blades are emerald dancers',
    'Discovering a world where rainbows are bridges and thunderstorms are orchestras',
    'Blowing soap bubbles that encase entire dreamlike realities within them',
    'Sitting in a theater where the screen projects your thoughts and the popcorn tastes like emotions',
    'Stargazing on a beach where the stars are grains of sand and the sky is the ocean',
    'Drinking from a stream that quenches not just thirst, but the deepest curiosities',
    'Riding a train whose tracks are laid out by your own imagination',
    'Living in a house where each door opens to a different time period',
    'Being a musician in an orchestra where each instrument plays a different scent',
    'Planting a seed that grows into a tree with your favorite childhood memories as fruits',
    'Eating a slice of cloud-pie that tastes like the sky on a crisp morning',
    'Playing hide-and-seek with the shadows in a town where the sun never sets'
  ]

  function randomDream() {
    const randomIndex = Math.floor(Math.random() * dreams.length)
    return dreams[randomIndex]
  }

  function loadStore() {
    return Promise.resolve(`Loaded ${dreams.length} dreams`)
  }

  return { dreams, randomDream }
})
