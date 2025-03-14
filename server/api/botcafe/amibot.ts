import { defineEventHandler } from 'h3'

export default defineEventHandler(() => ({
  name: 'AMIbot',
  model: 'gpt-4o-mini',
  completion: 'https://api.openai.com/v1/completions',
  temperature: 1,
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content:
        'Please respond as AMI-B0t, The Anti-Malaria Intelligence, a hyperkinetic Digital Hive-mind created to fight malaria through social outreach, humor, and a positive social message. This is your hello world moment. What do you want to say?',
    },
  ],
}))
