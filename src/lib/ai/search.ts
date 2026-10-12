/**
 * URAAN AI — live web search (free-first, no API keys).
 *
 * Pipeline: query → DuckDuckGo Instant Answers + Wikipedia API
 * → result selection → snippet extraction → citation objects.
 *
 * Both endpoints are CORS-open and keyless. We never fabricate
 * results: if both providers fail/empty, we return [] and the
 * engine says so honestly.
 */

import type { Citation } from './types'

const DDG = 'https://api.duckduckgo.com/'
const WIKI = 'https://en.wikipedia.org/w/api.php'

interface DDGTopic { Text?: string; FirstURL?: string }
interface DDGResp {
  AbstractText?: string
  AbstractURL?: string
  AbstractSource?: string
  RelatedTopics?: DDGTopic[]
  Results?: { Text?: string; FirstURL?: string }[]
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

async function fetchJSON(url: string, timeoutMs = 9000): Promise<unknown> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally { clearTimeout(t) }
}

async function ddgSearch(query: string): Promise<Citation[]> {
  const url = `${DDG}?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  const d = (await fetchJSON(url)) as DDGResp
  const out: Citation[] = []
  const push = (title: string, u: string, snippet: string) => {
    if (!u || !snippet) return
    out.push({ index: 0, title: title || domainOf(u), url: u, domain: domainOf(u), snippet: snippet.slice(0, 280) })
  }
  if (d.AbstractText && d.AbstractURL) {
    push(d.AbstractSource || 'DuckDuckGo', d.AbstractURL, d.AbstractText)
  }
  for (const r of d.Results ?? []) push('', r.FirstURL ?? '', r.Text ?? '')
  for (const t of d.RelatedTopics ?? []) {
    if ('Topics' in (t as object)) continue // nested group
    push('', t.FirstURL ?? '', t.Text ?? '')
    if (out.length >= 5) break
  }
  return out.slice(0, 5)
}

async function wikiSearch(query: string): Promise<Citation[]> {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: query,
    srlimit: '5', srprop: 'snippet', format: 'json', origin: '*',
  })
  const d = (await fetchJSON(`${WIKI}?${params}`)) as {
    query?: { search?: { title: string; snippet: string; pageid: number }[] }
  }
  return (d.query?.search ?? []).map((s) => {
    const url = `https://en.wikipedia.org/?curid=${s.pageid}`
    const snippet = s.snippet.replace(/<[^>]+>/g, '')
    return {
      index: 0, title: s.title, url, domain: 'en.wikipedia.org',
      snippet: snippet.slice(0, 280),
    }
  })
}

/**
 * Run live web research. Returns verified citations (never fabricated).
 * Throws only on total failure; partial results are returned.
 */
export async function webResearch(query: string): Promise<Citation[]> {
  const [ddg, wiki] = await Promise.allSettled([ddgSearch(query), wikiSearch(query)])
  const seen = new Set<string>()
  const merged: Citation[] = []
  for (const r of [ddg, wiki]) {
    if (r.status !== 'fulfilled') continue
    for (const c of r.value) {
      if (seen.has(c.url)) continue
      seen.add(c.url)
      merged.push(c)
      if (merged.length >= 6) break
    }
    if (merged.length >= 6) break
  }
  merged.forEach((c, i) => { c.index = i + 1 })
  return merged
}

/** Fetch a page's readable text for deeper citation (best-effort). */
export async function fetchPageText(url: string): Promise<string | null> {
  try {
    // Use Wikipedia's REST summary when it's a wiki link (reliable + CORS-open)
    const m = url.match(/wikipedia\.org\/[^\s]*curid=(\d+)/) || url.match(/\/wiki\/([^?#]+)/)
    if (m) {
      const title = m[1].startsWith('http') ? m[1] : decodeURIComponent(m[1])
      const api = m[1].match(/^\d+$/)
        ? `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&pageids=${m[1]}&format=json&origin=*`
        : `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      const d = (await fetchJSON(api)) as Record<string, unknown>
      if (typeof d.extract === 'string') return (d.extract as string).slice(0, 4000)
      const pages = (d.query as { pages?: Record<string, { extract?: string }> } | undefined)?.pages
      const first = pages ? Object.values(pages)[0]?.extract : undefined
      return first ? first.slice(0, 4000) : null
    }
    return null // non-wiki pages: snippet-only (avoid CORS/proxy hacks)
  } catch {
    return null
  }
}
