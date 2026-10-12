/** Tests for the URAAN AI local engine: calculator, KB routing, search detection. */
import { describe, expect, it } from 'vitest'
import { localAnswer, searchQueryOf, tryCalculate, wantsSearch } from './localEngine'

describe('tryCalculate', () => {
  it('computes basic arithmetic', () => {
    expect(tryCalculate('12*8')).toContain('96')
    expect(tryCalculate('100/4')).toContain('25')
    expect(tryCalculate('2+3*4')).toContain('14')
  })
  it('computes percentages', () => {
    expect(tryCalculate('15% of 200')).toContain('30')
  })
  it('computes square roots', () => {
    expect(tryCalculate('sqrt(16)')).toContain('4')
  })
  it('returns null for non-math', () => {
    expect(tryCalculate('hello world')).toBeNull()
    expect(tryCalculate('what is photosynthesis')).toBeNull()
  })
  it('does not execute arbitrary code', () => {
    expect(tryCalculate('alert(1)')).toBeNull()
    expect(tryCalculate('process.exit()')).toBeNull()
  })
})

describe('localAnswer', () => {
  it('answers greetings', () => {
    const { text } = localAnswer([{ role: 'user', content: 'assalam o alaikum' }])
    expect(text).toMatch(/Walaikum Assalam/i)
  })
  it('answers SOP questions', () => {
    const { text } = localAnswer([{ role: 'user', content: 'how to write a strong SOP?' }])
    expect(text).toMatch(/SOP/i)
  })
  it('routes math to calculator tool', () => {
    const { text, toolsUsed } = localAnswer([{ role: 'user', content: '25*4' }])
    expect(toolsUsed).toContain('calculate')
    expect(text).toContain('100')
  })
  it('falls back gracefully on unknown input', () => {
    const { text } = localAnswer([{ role: 'user', content: 'xyzzy plugh qwerty' }])
    expect(text.length).toBeGreaterThan(20)
  })
})

describe('wantsSearch', () => {
  it('detects explicit search: prefix', () => {
    expect(wantsSearch('search: DAAD deadline 2026')).toBe(true)
  })
  it('detects current-info questions', () => {
    expect(wantsSearch('What is the DAAD scholarship deadline 2026?')).toBe(true)
  })
  it('does not trigger on general questions', () => {
    expect(wantsSearch('how to write a strong SOP?')).toBe(false)
    expect(wantsSearch('assalam o alaikum')).toBe(false)
  })
})

describe('searchQueryOf', () => {
  it('strips the search: prefix', () => {
    expect(searchQueryOf('search: DAAD deadline')).toBe('DAAD deadline')
    expect(searchQueryOf('Search:  hello ')).toBe('hello')
  })
})
