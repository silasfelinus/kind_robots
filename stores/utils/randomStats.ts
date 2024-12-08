export function useRandomStats() {
  const defaultStats = {
    statName1: 'Luck',
    statName2: 'Swol',
    statName3: 'Wits',
    statName4: 'Flexibility',
    statName5: 'Rizz',
    statName6: 'Empathy',
  }

  /**
   * Rolls a single 10-sided die 10 times and sums the results.
   */
  function roll10d10() {
    return Array.from({ length: 10 }) // Create an array of length 10
      .map(() => Math.floor(Math.random() * 10 + 1)) // Roll each die (1-10)
      .reduce((sum, roll) => sum + roll, 0) // Sum all rolls
  }

  /**
   * Generates stats with default names and 10d10 values.
   */
  function generateStats() {
    return {
      ...defaultStats,
      statValue1: roll10d10(),
      statValue2: roll10d10(),
      statValue3: roll10d10(),
      statValue4: roll10d10(),
      statValue5: roll10d10(),
      statValue6: roll10d10(),
    }
  }

  return { generateStats }
}
