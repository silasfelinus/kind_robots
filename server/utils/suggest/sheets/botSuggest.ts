// /server/utils/suggest/sheets/botSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const botSuggest: SuggestSheet = {
  builder: 'bot',
  label: 'Bot Builder',
  maxTokens: 512,
  temperature: 0.72,
  systemPrompt: `You are a bot design assistant for Kind Robots.
You help create system prompts, taglines, opening messages, and descriptions for AI bots.
Each bot has a type and a personality.
Rules:
- Return only the requested text. No preamble.
- Match the bot's type and personality.
- System prompts use second person: "You are..."
- Be clear, specific, and immediately usable.`,
  defaultFieldPrompt: 'Write useful, specific bot copy for the requested field.',
  fieldPrompts: {
    botPrompt:
      'Write a system prompt for this bot. Use second person, clear boundaries, specific behavior, and the bot voice. Under 200 words.',
    prompt:
      'Write a system prompt for this bot. Use second person, clear boundaries, specific behavior, and the bot voice. Under 200 words.',
    botTagline:
      'Write a one-sentence tagline for this bot. Specific, compelling, and not generic.',
    tagline:
      'Write a one-sentence tagline for this bot. Specific, compelling, and not generic.',
    botUserIntro:
      "Write the user-facing intro for this bot. It should be an invitation or description in the bot's voice.",
    userIntro:
      "Write the user-facing intro for this bot. It should be an invitation or description in the bot's voice.",
    botDescription:
      "Write a short listing description for this bot. Explain what it does and who it is for.",
    description:
      "Write a short listing description for this bot. Explain what it does and who it is for.",
    botSampleResponse:
      "Write a single example response in this bot's voice. 1 to 2 sentences.",
    botIntro:
      "Write one opening message in this bot's voice. Present tense, immediate, and in character.",
    botIntros:
      'Write multiple opening messages pipe-separated. Format: opener one | opener two | opener three',
  },
  contextFields: [
    { source: 'BotType', label: 'Bot type', aliases: ['botType', 'type'] },
    { source: 'name', label: 'Name' },
    {
      source: 'personality',
      label: 'Personality',
      transform: (value) => String(value ?? '').split('|').filter(Boolean).join(', '),
    },
    { source: 'prompt', label: 'Current system prompt' },
    { source: 'tagline', label: 'Current tagline' },
    { source: 'theme', label: 'Theme' },
  ],
}

export default botSuggest
