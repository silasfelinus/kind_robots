export function useRandomSkills() {
  const skills = [
    'Expert swordsmanship',
    'Master of stealth',
    'Proficient in alchemy',
    'Unmatched archery skills',
    'Fluent in multiple ancient languages',
    'Exceptional tracking abilities',
  ]

  function randomSkills() {
    const skillCount = Math.floor(Math.random() * 3 + 1) // Random number of skills (1-3)
    const selectedSkills = new Set<string>()

    while (selectedSkills.size < skillCount) {
      selectedSkills.add(skills[Math.floor(Math.random() * skills.length)])
    }

    return Array.from(selectedSkills).join(', ')
  }

  return { randomSkills }
}
