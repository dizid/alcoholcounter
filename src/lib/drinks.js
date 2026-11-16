// Drink types and sizes with their standard drinks (T-0588).
// A standard drink here is one "glass" as most health services count it; the
// numbers match the approved mockup (wine regular 1.2, wine large 1.8).
export const DRINK_TYPES = [
  { type: 'beer', label: 'Beer', sizes: { small: 0.8, regular: 1, large: 1.6 } },
  { type: 'wine', label: 'Wine', sizes: { small: 1, regular: 1.2, large: 1.8 } },
  { type: 'spirit', label: 'Spirit', sizes: { small: 0.7, regular: 1, large: 2 } },
  { type: 'other', label: 'Other', sizes: { small: 0.5, regular: 1, large: 1.5 } },
]

export const SIZES = [
  { size: 'small', label: 'Small' },
  { size: 'regular', label: 'Regular' },
  { size: 'large', label: 'Large' },
]

// The 3 quick tiles on Today when the user hasn't changed them in Me
export const DEFAULT_QUICK_DRINKS = [
  { type: 'beer', std: 1 },
  { type: 'wine', std: 1.2 },
  { type: 'spirit', std: 1 },
]

export const TRIGGERS = ['Stress', 'Social', 'Bored', 'Celebrating', 'Habit', 'Other']
export const MOODS = ['Calm', 'Happy', 'Tired', 'Stressed', 'Low']

// Label for a stored drink_type (older entries may hold free text)
export function typeLabel(type) {
  const known = DRINK_TYPES.find(d => d.type === type)
  if (known) return known.label
  if (!type) return 'Drink'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Standard drinks for a type and size
export function stdFor(type, size) {
  const known = DRINK_TYPES.find(d => d.type === type) || DRINK_TYPES[3]
  return known.sizes[size] ?? 1
}

// Icon name for a stored drink_type
export function iconFor(type) {
  return ['beer', 'wine', 'spirit'].includes(type) ? type : 'plus'
}
