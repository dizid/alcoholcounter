// reframe.js — the "Reframe" exercise (T-0623, from the old tracker's reframeThought).
// Matches a few common drinking thoughts by keyword and offers a more balanced line;
// anything else gets a general reframe that quotes the user's own words.

const REFRAMES = [
  { words: ['relax', 'unwind', 'switch off'], text: 'I can relax another way too: a few slow breaths, a shower or a short walk.' },
  { words: ['stress', 'cope', 'handle'], text: 'Stress passes, with or without a drink. Moving, writing it down or talking to someone helps too.' },
  { words: ['fun', 'boring', 'party'], text: 'I bring the fun myself. The people and the moment matter more than the glass.' },
  { words: ['deserve', 'earned', 'reward'], text: 'I do deserve something good. A treat that leaves me feeling well tomorrow counts too.' },
  { words: ['sleep'], text: 'Alcohol makes sleep lighter, not deeper. A calm routine gets me better rest.' },
  { words: ['just one', 'only one', 'just a', 'one drink', 'one beer', 'one glass'], text: 'One often turns into more. I can decide now how the evening ends.' },
  { words: ['everyone', 'social', 'friends'], text: 'Others mostly care that I am there, not what is in my glass.' },
]

// True when `phrase` appears in `text` as whole words ("one" doesn't match "someone")
function hasPhrase(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}`, 'i').test(text)
}

// Returns a balanced version of `thought` (a non-empty string)
export function reframeThought(thought) {
  const lower = String(thought).toLowerCase()
  const match = REFRAMES.find(r => r.words.some(word => hasPhrase(lower, word)))
  if (match) return match.text
  const quoted = String(thought).trim().replace(/[.!?]+$/, '')
  return `"${quoted}" is a thought, not a fact. What would you tell a friend who said this? Try: "I can find another way to handle this."`
}
