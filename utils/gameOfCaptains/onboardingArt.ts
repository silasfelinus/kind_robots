export const COUCH_ONBOARDING_ART_IDS = {
  'origins/courier': 258444,
  'origins/refugee': 258445,
  'origins/archivist': 258446,
  'origins/mechanic': 258447,
  'origins/auditor': 258448,
  'origins/entertainer': 258449,
  'couchscope/question-01': 258450,
  'couchscope/question-02': 258451,
  'couchscope/question-03': 258452,
  'couchscope/question-04': 258453,
  'couchscope/question-01-answer-a': 258454,
  'couchscope/question-01-answer-b': 258455,
  'couchscope/question-01-answer-c': 258456,
  'couchscope/question-02-answer-a': 258457,
  'couchscope/question-02-answer-b': 258458,
  'couchscope/question-02-answer-c': 258459,
  'couchscope/question-03-answer-a': 258460,
  'couchscope/question-03-answer-b': 258461,
  'couchscope/question-03-answer-c': 258462,
  'couchscope/question-04-answer-a': 258463,
  'couchscope/question-04-answer-b': 258464,
  'couchscope/question-04-answer-c': 258465,
} as const

export type CouchOnboardingArtKey = keyof typeof COUCH_ONBOARDING_ART_IDS

export const COUCH_ONBOARDING_ART_COUNT = Object.keys(
  COUCH_ONBOARDING_ART_IDS,
).length
