// ~/types/util

export type Timestamp = string

export enum ModelType {
  BOT = 'BOT',
  GALLERY = 'GALLERY',
  IMAGE = 'IMAGE',
  MESSAGE = 'MESSAGE',
  PROJECT = 'PROJECT',
  PROMPT = 'PROMPT',
  QUEST = 'QUEST',
  REACTION = 'REACTION',
  RESOURCE = 'RESOURCE',
  REVIEW = 'REVIEW',
  USER = 'USER'
}

export enum ResourceType {
  CHECKPOINT = 'CHECKPOINT',
  EMBEDDING = 'EMBEDDING',
  LORA = 'LORA',
  LYCORIS = 'LYCORIS',
  HYPERNETWORK = 'HYPERNETWORK',
  CONTROLNET = 'CONTROLNET',
  URL = 'URL'
}

export enum Role {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  ADMIN = 'ADMIN',
  GUEST = 'GUEST',
  BOT = 'BOT',
  DESIGNER = 'DESIGNER'
}

export enum StringType {
  TAG = 'TAG', // single unit tag phrase
  PROMPT = 'PROMPT', // combined nlp prompt message
  WILDCARD = 'WILDCARD', // list for randomized generations
  RESPONSE = 'RESPONSE', // message response nlp to human
  IMAGE_URL = 'IMAGE_URL', // image url
  URL = 'URL', // generic web url
  MASK_URL = 'MASK_URL', // url to an image mask
  CODE = 'CODE', // validated codewall
  ERROR = 'ERROR' // An Error message
}

export enum BotType {
  PROMPTBOT = 'PROMPTBOT',
  CHATBOT = 'CHATBOT',
  ARTBOT = 'ARTBOT'
}
