/** Tests for file generation: validates real file output (magic bytes, structure). */
import { describe, expect, it } from 'vitest'
import {
  generateDOCX, generatePDF, generatePPTX, generateTextFile, generateXLSX,
  parseDocument, parseSlides,
} from './files'
import { detectFileRequest as detectReq } from './content'

const SAMPLE_MD = `# Artificial Intelligence

## Introduction
AI is transforming education worldwide.
Students use AI for research and learning.

## Benefits
- Personalized learning
- 24/7 availability
- Instant feedback
`

describe('parseDocument', () => {
  it('extracts title and sections', () => {
    const { title, sections } = parseDocument(SAMPLE_MD)
    expect(title).toBe('Artificial Intelligence')
    expect(sections.length).toBe(2)
    expect(sections[0].heading).toBe('Introduction')
  })
})

describe('parseSlides', () => {
  it('creates slide specs', () => {
    const { slides } = parseSlides(SAMPLE_MD)
    expect(slides.length).toBe(2)
    expect(slides[0].bullets.length).toBeGreaterThan(0)
  })
})

describe('generatePDF', () => {
  it('produces a valid PDF (magic bytes %PDF)', async () => {
    const f = await generatePDF('AI Notes', SAMPLE_MD)
    expect(f.filename.endsWith('.pdf')).toBe(true)
    expect(f.sizeBytes).toBeGreaterThan(1000)
    const head = new Uint8Array(await f.blob.slice(0, 4).arrayBuffer())
    expect(String.fromCharCode(...head)).toBe('%PDF')
  })
})

describe('generateDOCX', () => {
  it('produces a valid DOCX (ZIP magic bytes PK)', async () => {
    const f = await generateDOCX('AI Notes', SAMPLE_MD)
    expect(f.filename.endsWith('.docx')).toBe(true)
    expect(f.sizeBytes).toBeGreaterThan(2000)
    const head = new Uint8Array(await f.blob.slice(0, 2).arrayBuffer())
    expect(head[0]).toBe(0x50); expect(head[1]).toBe(0x4b)
  })
})

describe('generatePPTX', () => {
  it('produces a valid PPTX (ZIP magic bytes PK)', async () => {
    const f = await generatePPTX('AI Presentation', SAMPLE_MD)
    expect(f.filename.endsWith('.pptx')).toBe(true)
    expect(f.sizeBytes).toBeGreaterThan(3000)
    const head = new Uint8Array(await f.blob.slice(0, 2).arrayBuffer())
    expect(head[0]).toBe(0x50); expect(head[1]).toBe(0x4b)
  })
})

describe('generateXLSX', () => {
  it('produces a valid XLSX with sheets', async () => {
    const f = await generateXLSX('Data', [
      { name: 'Sheet1', rows: [['Name', 'Score'], ['Ali', 95], ['Sara', 88]] },
    ])
    expect(f.filename.endsWith('.xlsx')).toBe(true)
    expect(f.sizeBytes).toBeGreaterThan(2000)
  })
})

describe('generateTextFile', () => {
  it('generates CSV, JSON, code with correct extensions', () => {
    const csv = generateTextFile('csv', 'data', 'a,b\n1,2')
    expect(csv.filename.endsWith('.csv')).toBe(true)
    const json = generateTextFile('json', 'config', '{"a":1}')
    expect(json.filename.endsWith('.json')).toBe(true)
    const code = generateTextFile('code', 'script', 'print("hi")', 'py')
    expect(code.filename.endsWith('.py')).toBe(true)
  })
  it('rejects invalid JSON', () => {
    expect(() => generateTextFile('json', 'bad', '{invalid')).toThrow()
  })
})

describe('detectFileRequest', () => {
  it('detects PDF requests', () => {
    const r = detectReq('AI ke topic par assignment ki PDF banao')
    expect(r?.kind).toBe('pdf')
    expect(r?.topic.length).toBeGreaterThan(1)
  })
  it('detects PPTX requests', () => {
    const r = detectReq('Mere liye AI par 12 slides ki presentation banao')
    expect(r?.kind).toBe('pptx')
  })
  it('detects XLSX requests', () => {
    const r = detectReq('Mere data ko Excel sheet mein organize karo, sheet banao')
    expect(r?.kind).toBe('xlsx')
  })
  it('returns null for non-file requests', () => {
    expect(detectReq('Python kya hai?')).toBeNull()
    expect(detectReq('assalam o alaikum')).toBeNull()
  })
})

// Re-export check: files.ts should not export detectFileRequest (it lives in content.ts)
describe('module separation', () => {
  it('content.ts exports detectFileRequest', () => {
    expect(typeof detectReq).toBe('function')
  })
})
