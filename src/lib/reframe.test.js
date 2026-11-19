import { describe, it, expect } from 'vitest'
import { reframeThought } from './reframe'

describe('reframeThought (T-0623)', () => {
  it('matches common drinking thoughts by keyword', () => {
    expect(reframeThought('I need a drink to relax')).toMatch(/relax another way/)
    expect(reframeThought("I can't handle stress without alcohol")).toMatch(/Stress passes/)
    expect(reframeThought('Just one beer is fine')).toMatch(/One often turns into more/)
  })

  it('matches whole words only ("one" is not inside "someone")', () => {
    expect(reframeThought('Someone will be disappointed')).toMatch(/is a thought, not a fact/)
  })

  it('quotes the thought when nothing matches', () => {
    expect(reframeThought('Tonight is different!')).toBe(
      '"Tonight is different" is a thought, not a fact. What would you tell a friend who said this? Try: "I can find another way to handle this."'
    )
  })
})
