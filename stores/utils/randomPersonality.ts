export function useRandomPersonality() {
  const personalities = [
    // Expanded list of personality traits
    'Charismatic', 'Stoic', 'Energetic', 'Reserved', 'Ambitious', 'Curious',
    'Optimistic', 'Pessimistic', 'Cynical', 'Idealistic', 'Empathetic', 'Cold',
    'Charming', 'Calculating', 'Impulsive', 'Patient', 'Impatient',
    'Adventurous', 'Cautious', 'Confident', 'Shy', 'Generous', 'Selfish',
    'Loyal', 'Deceptive', 'Eccentric', 'Pragmatic', 'Dreamy', 'Sarcastic',
    'Polite', 'Rude', 'Hardworking', 'Lazy', 'Analytical', 'Emotional',
    'Introverted', 'Extroverted', 'Altruistic', 'Greedy', 'Humble', 'Arrogant',
    'Playful', 'Serious', 'Nervous', 'Calm', 'Aggressive', 'Gentle',
    'Romantic', 'Logical', 'Creative', 'Practical', 'Fearless', 'Timid',
    'Friendly', 'Hostile', 'Optimistic', 'Realistic', 'Visionary', 'Paranoid',
    'Innocent', 'Mischievous', 'Wise', 'Foolish', 'Passionate', 'Detached',
    'Whimsical', 'Melancholy', 'Euphoric', 'Suspicious', 'Loyal', 'Rebellious',
    'Obedient', 'Ambiguous', 'Tactful', 'Blunt', 'Sensitive', 'Insensitive',
    'Inquisitive', 'Forgetful', 'Meticulous', 'Carefree', 'Stoic', 'Theatrical',
    'Hotheaded', 'Coolheaded', 'Obsessive', 'Indifferent', 'Resourceful',
    'Clumsy', 'Gullible', 'Skeptical', 'Enthusiastic', 'Grumpy', 'Cheerful',
    'Moody', 'Predictable', 'Unpredictable', 'Optimistic', 'Gloomy', 'Quirky',
    'Intense', 'Relaxed', 'Bold', 'Cautious', 'Detached', 'Caring', 'Bubbly',
    'Demanding', 'Considerate', 'Stubborn', 'Flexible', 'Compassionate',
    'Ambivalent', 'Playful', 'Jovial', 'Scheming', 'Gregarious', 'Brooding',
    'Daring', 'Industrious', 'Resilient', 'Unyielding',
  ]

  function randomPersonality(): string {
    // Randomly decide if the personality should include 1 or 2 traits
    const traitCount = Math.random() > 0.5 ? 2 : 1

    // Shuffle the personality list and pick the desired number of traits
    const shuffled = [...personalities].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, traitCount).join(' and ')
  }

  return { randomPersonality }
}
