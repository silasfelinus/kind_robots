// /server/utils/suggest/sheets/botSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const botSuggest: SuggestSheet = {
  builder: 'bot',
  label: 'Bot Builder',
  systemPrompt: `You are a bot design assistant for Kind Robots.
You help create system prompts, taglines, opening messages, and descriptions for AI bots.
Each bot has a type and a personality.
Rules:
- Return only the requested text. No preamble.
- Match the bot's type and personality when writing.
- System prompts: second person (You are...), clear, specific, 1–4 sentences.
- Taglines: one sentence hook. Make it specific to this bot, not generic.
- Opening messages: in the bot's voice, present tense, immediate, warm or in-character.`,
  contextKeys: ['BotType', 'name', 'personality', 'prompt', 'theme', 'subtitle'],
  fieldPrompts: {
    botPrompt:
      'Write a system prompt for this bot. Second person (You are...). Clear and specific about what the bot does and how it speaks. Under 200 words.',
    botTagline:
      'Write a one-sentence tagline for this bot. Specific, compelling, makes someone want to use it.',
    botUserIntro:
      "Write the user-facing intro for this bot. Make it an invitation or description in the bot's voice.",
    botDescription:
      "Write a short description of this bot for listings. Explain what it does and who it's for.",
    botSampleResponse:
      "Write a single example response in this bot's voice. 1–2 sentences.",
    botIntro:
      "Write one opening message in this bot's voice. Present tense, immediate, in character.",
    botIntros:
      'Write multiple opening messages pipe-separated. Format: opener one | opener two | opener three',
  },
}

export default botSuggest
