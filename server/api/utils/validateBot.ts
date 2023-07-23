// ~/server/utils/validate.ts
import { Bot } from '../bots'

export const validateBotData = (data: Partial<Bot>) => {
  const errors: string[] = []
  if (data.name && typeof data.name !== 'string') {
    errors.push('Invalid name.')
  }
  // Perform similar checks for other properties...

  if (errors.length > 0) {
    throw new Error(errors.join(' '))
  }
}
