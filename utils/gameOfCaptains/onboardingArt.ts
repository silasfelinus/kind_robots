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
  // COUCHSCOPE-AND-OPENING-ROUND-1 (Conductor): trolley question and the
  // twelve constellation reveal plates, DONE 2026-11, wired 2026-11-12.
  'couchscope/trolley': 261265,
  'couchscope/trolley-answer-a': 261266,
  'couchscope/trolley-answer-b': 261267,
  'couchscope/trolley-answer-c': 261268,
  'couchscope/sign-northern-sloth': 261269,
  'couchscope/sign-princess-mantic-shrimp': 261270,
  'couchscope/sign-velvet-comet': 261271,
  'couchscope/sign-clockwork-minnow': 261272,
  'couchscope/sign-royal-dust-bunny': 261273,
  'couchscope/sign-laughing-leviathan': 261274,
  'couchscope/sign-nebular-teapot': 261275,
  'couchscope/sign-three-headed-librarian': 261276,
  'couchscope/sign-feral-umbrella': 261277,
  'couchscope/sign-last-lantern': 261278,
  'couchscope/sign-moonlit-upholsterer': 261279,
  'couchscope/sign-cosmic-turnip': 261280,
} as const

export type CouchOnboardingArtKey = keyof typeof COUCH_ONBOARDING_ART_IDS

export const COUCH_ONBOARDING_ART_COUNT = Object.keys(
  COUCH_ONBOARDING_ART_IDS,
).length
