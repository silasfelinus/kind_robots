export function randomColor() {
  const colors = [
    // Standard Colors
    'Red',
    'Blue',
    'Green',
    'Yellow',
    'Purple',
    'Orange',
    'Pink',
    'Brown',
    'Black',
    'White',
    'Gray',

    // Nature-Inspired Colors
    'Forest Green',
    'Sky Blue',
    'Sunset Orange',
    'Ocean Teal',
    'Mountain Gray',
    'Lava Red',
    'Sandstone',
    'Rose Petal',
    'Moss',
    'Coral',
    'Ice Blue',

    // Fantasy and Whimsical Colors
    'Dragon Scale',
    'Moonlit Silver',
    'Faerie Glow',
    'Witch’s Violet',
    'Phoenix Flame',
    'Unicorn Pastel',
    'Goblin Green',
    'Starlight White',
    'Twilight Purple',
    'Ethereal Gold',

    // Exotic and Artistic Colors
    'Midnight Blue',
    'Crimson',
    'Amber',
    'Sepia',
    'Turquoise',
    'Charcoal',
    'Ivory',
    'Chartreuse',
    'Indigo',
    'Cerulean',
    'Peach Blossom',

    // Gemstone-Inspired Colors
    'Ruby',
    'Emerald',
    'Sapphire',
    'Amethyst',
    'Topaz',
    'Opal White',
    'Onyx Black',
    'Jade Green',
    'Amber Glow',
    'Moonstone',

    // Fun and Imaginative Colors
    'Bubblegum Pink',
    'Electric Lime',
    'Neon Orange',
    'Cotton Candy',
    'Mystic Magenta',
    'Chocolate Truffle',
    'Cloud Blue',
    'Stormy Gray',
    'Cinnamon',
    'Vanilla Cream',

    // Subtle and Sophisticated Colors
    'Pewter',
    'Ash',
    'Lavender Mist',
    'Dove Gray',
    'Champagne Gold',
    'Blush Pink',
    'Muted Teal',
    'Sage',
    'Copper',
    'Pale Rose',

    // Futuristic and Metallic Colors
    'Neon Blue',
    'Cyber Purple',
    'Holographic Chrome',
    'Steel Gray',
    'Plasma Pink',
    'Galactic Gold',
    'Laser Green',
    'Photon Silver',
    'Cobalt',
    'Titanium White',

    // Cultural and Regional Colors
    'Ming Blue',
    'Persian Red',
    'Indian Yellow',
    'Japanese Indigo',
    'Moroccan Blue',
    'African Violet',
    'Mexican Pink',
    'Caribbean Aqua',
    'Scandinavian White',
    'Celtic Green',

    // Seasonal Colors
    'Autumn Maple',
    'Frostbite White',
    'Spring Blossom',
    'Summer Sky',
    'Harvest Gold',
    'Winter Mint',
    'Snowflake Silver',
    'Pumpkin Spice',
    'Holly Green',
    'Berry Red',

    // Abstract and Unusual Colors
    'Shadow',
    'Void Black',
    'Illuminating Yellow',
    'Cosmic Lavender',
    'Stormcloud',
    'Dreamscape',
    'Glimmer',
    'Dusky Rose',
    'Morning Dew',
    'Rust',

    // Food-Inspired Colors
    'Honey',
    'Caramel',
    'Espresso',
    'Blueberry',
    'Mint Green',
    'Lemon Drop',
    'Plum',
    'Grapefruit',
    'Pomegranate',
    'Chocolate Brown',
  ]

  function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)]
  }

  return { randomColor }
}
