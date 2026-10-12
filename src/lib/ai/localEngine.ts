/**
 * URAAN AI — local intelligence engine (apna AI).
 * 100% on-device. Zero API calls. Zero cost. Zero expiry.
 *
 * Handles: greetings, study guidance, SOP, scholarships strategy,
 * careers, coding help, math tutoring, English, motivation, and
 * smart fallbacks that route to web search / documents / smart mode.
 */

import type { ChatMsg } from './types'

interface KBEntry {
  keywords: string[]
  /** higher = more specific */
  weight?: number
  response: (q: string) => string
}

const KB: KBEntry[] = [
  {
    keywords: ['salam', 'assalam', 'hello', 'hi ', ' hey', 'aoa', 'hey'],
    weight: 1,
    response: () => `Walaikum Assalam! 👋 Main **URAAN AI** hun — tumhara apna study companion.

Main kya kar sakta hun:
- 🔍 **Live web research** — current scholarships, deadlines, facts (sources ke sath)
- 📚 **Parhai** — concepts, math, science samjhao
- 💻 **Coding** — debugging aur concepts
- 🎓 **Scholarships** — strategy, SOP tips
- 📄 **Documents** — PDF/text upload karo, main parh ke jawab dunga
- 🧠 **Smart Mode** — zyada mushkil sawalon ke liye on-device AI (optional)

Kya poochna hai?`,
  },
  {
    keywords: ['sop', 'statement of purpose', 'personal statement'],
    weight: 3,
    response: () => `## ✍️ SOP likhne ka complete guide

**Structure (500–1000 words):**
1. **Hook** (1 para) — ek personal moment ya sawal jo reader ko pakray
2. **Academic journey** (2 para) — kya parha, kya seekha, kaunsa project
3. **Why this program** (1–2 para) — SPECIFIC professor, lab, course ka naam lo
4. **Future goals** (1 para) — degree ke baad kya karoge
5. **Closing** (1 para) — confident, short

**Golden rules:**
- ✅ Specific raho — "I love CS" nahi, "Dr. Ahmed's NLP lab ka X paper"
- ✅ Story sunao — facts nahi, journey
- ✅ Har paragraph ka ek point ho
- ❌ Clichés nahi — "since childhood", "passionate", "dream"
- ❌ Jhoot nahi — jo kiya wahi likho

💡 **Tip:** Apna draft yahan paste karo — main Smart Mode mein detailed feedback de sakta hun!`,
  },
  {
    keywords: ['scholarship', 'wazifa', 'funding', 'daad', 'chevening', 'fulbright'],
    weight: 3,
    response: () => `## 🎓 Scholarship jeetne ki strategy

**6 mahine pehle:**
- Target list banao (5–8 programs)
- Har ek ki requirements note karo
- Recommendation letters mango

**3 mahine pehle:**
- SOP ke 3–4 drafts likho
- Documents jama karo (transcripts, certificates)
- English test do (IELTS/TOEFL agar chahiye)

**1 mahina pehle:**
- Har application customize karo (copy-paste nahi!)
- 2 logon se proofread karwao
- Deadline se 1 hafta pehle submit karo

**Secret:** Kam log apply karte hain jitna tum sochte ho. Quality > Quantity!

🔍 **Current scholarships aur deadlines ke liye** mujhse poocho — main live web search kar ke verified sources dunga. Misal: *"DAAD scholarship 2026 deadline"*`,
  },
  {
    keywords: ['interview', 'interview prep'],
    weight: 3,
    response: () => `## 💼 Interview ki tayyari

**Top 5 sawal (har interview mein):**
1. "Apne baare mein batao" → 2-min story: past → present → future
2. "Why this program/company?" → SPECIFIC wajah, generic nahi
3. "Tumhari kamzori?" → real weakness + kaise improve kar rahe ho
4. "Ek challenge batao" → STAR method: Situation, Task, Action, Result
5. "Koi sawal?" → HAMESHA 2–3 sawal poocho (shows interest!)

**Tips:**
- ✅ Mirror ke samne practice karo
- ✅ "Um, uh" kam karo — pause lena OK hai
- ✅ Body language: seedha betho, eye contact
- ❌ Salary pehle mat poocho
- ❌ Jhoot mat bolo

**STAR method** har behavioral sawal ke liye use karo!`,
  },
  {
    keywords: ['study plan', 'schedule', 'routine', 'timetable', 'parhai'],
    weight: 2,
    response: () => `## ⚡ Realistic study plan

**Step 1:** Apna din likho — kitne free hours? (honest raho!)
**Step 2:** Subjects ko priority do — mushkil pehle
**Step 3:** Pomodoro — 25 min parhai, 5 min break

**Sample (4 hours/day):**
- 🌅 Subah: 1 hr — mushkil subject (fresh mind)
- 🌤️ Dopahar: 1 hr — practice/questions
- 🌙 Raat: 1 hr — revision
- 📝 1 hr — assignment ya weak topic

**Rules:**
- ✅ Roz ek hi time par parho (habit banti hai)
- ✅ Phone door rakho
- ✅ Hafte mein 1 din rest lo
- ❌ 8-hour plan mat banao agar 4 hour bhi mushkil hai

Chota plan jo follow ho > bara plan jo toot jaye!`,
  },
  {
    keywords: ['debug', 'error', 'bug', 'exception', 'traceback'],
    weight: 3,
    response: (q) => `## 💻 Debugging ka systematic tarika

**Step 1: Error PARHO** — wo batata hai kya masla hai:
| Error | Matlab |
|---|---|
| \`IndexError\` | List ke bahar access |
| \`TypeError\` | Ghalat type par operation |
| \`SyntaxError\` | Bracket/colon missing |
| \`NameError\` | Variable define nahi |
| \`KeyError\` | Dict mein key nahi mili |

**Step 2:** Print lagao — values dekho
**Step 3:** Chota test case banao — masla isolate karo
**Step 4:** EXACT error Google karo

${/```/.test(q) ? '💡 Tumne code bheja hai — **Smart Mode** on karo, main line-by-line analyze karunga!' : '💡 Apna code aur poora error message bhejo — behtar guide karunga!'}`,
  },
  {
    keywords: ['math', 'algebra', 'calculus', 'derivative', 'integral', 'equation', 'solve'],
    weight: 2,
    response: () => `## 📐 Math samajhne ka tarika

**Rule #1:** Formula ratta mat lagao — SAMJHO kyun kaam karta hai
**Rule #2:** Roz 5–10 sawal practice karo
**Rule #3:** Ghalat jawab se mat daro

**Problem-solving steps:**
1. **Given** kya hai? — likho
2. **Find** kya hai? — likho
3. Kaunsa formula/method? — socho
4. Step by step hal karo
5. Check karo — kya sense banta hai?

Koi specific sawal bhejo — step-by-step hal karunga! (Simple calculations ke liye main calculator bhi use kar sakta hun.)`,
  },
  {
    keywords: ['cv', 'resume', 'biodata'],
    weight: 3,
    response: () => `## 📄 CV jo standout kare

**Format:**
1. Name + contact (top, clear)
2. Objective (2 lines, specific)
3. Education (latest first)
4. Skills (relevant only!)
5. Projects (2–3 best, with results)
6. Experience/Internships

**Rules:**
- ✅ 1 page (freshers ke liye)
- ✅ Numbers — "50 students ko parhaya" > "teaching ki"
- ✅ Action words — Built, Led, Created, Improved
- ✅ Har job ke liye customize karo
- ❌ Photo mat lagao (unless asked)
- ❌ Jhoot mat likho

App ka **CV Atelier** try karo — 6 professional templates hain!`,
  },
  {
    keywords: ['english', 'ielts', 'toefl', 'improve english', 'grammar'],
    weight: 2,
    response: () => `## 🗣️ English improve karne ka tarika

**Roz 30 min:**
- 📖 10 min reading (BBC, Dawn, articles)
- 🎧 10 min listening (podcast, subtitles ke sath)
- ✍️ 10 min writing (diary ya paragraph)

**IELTS tips:**
- Speaking: roz 5 min mirror mein bolo
- Writing: hafte mein 2 essays
- Reading: time limit mein practice
- Listening: different accents suno

**Secret:** Ghalti se mat daro. Jo bolta hai, wahi seekhta hai! 💪`,
  },
  {
    keywords: ['motivat', 'demotivat', 'tired', 'give up', 'stress', 'depress', 'tension', 'tired'],
    weight: 2,
    response: () => `## 💪 Suno, jani

Thakna normal hai. Har successful student ne ye phase dekha hai.

**Aaj ke liye:**
- Bas **25 minute** parho. Sirf 25. Phir break.
- Apna "kyun" yaad karo — kyun shuru kiya tha?
- Kisi se baat karo — dost, family, mentor

**Yaad rakho:**
- Tum yahan tak aaye — ye khud achievement hai
- Slow progress bhi progress hai
- Kal ka tum, aaj se behtar hoga

Ab batao — kis cheez mein help chahiye? Mil kar karte hain! 🤗`,
  },
  {
    keywords: ['thank', 'shukriya', 'thanks'],
    weight: 1,
    response: () => `Khush amdeed, jani! 😊 Koi aur sawal ho to poochte raho — main yahin hun!`,
  },
  {
    keywords: ['who are you', 'tum kaun', 'your name', 'apna ai'],
    weight: 2,
    response: () => `Main **URAAN AI** hun — Pakistani students ka apna AI companion! 🇵🇰

**Mere baare mein sach:**
- 🧠 **Do dimagh:** tez local engine (hamesha ready) + Smart Mode (on-device AI, optional)
- 🔍 **Live web research** kar sakta hun — real sources ke sath
- 📄 **Documents** parh sakta hun (PDF/text upload karo)
- 🔒 **Private:** tumhara data tumhare browser mein rehta hai, koi paid API nahi, kabhi expire nahi

Main ChatGPT jaisa cloud AI nahi — main *tumhara apna* hun. Free, forever. ✨`,
  },
]

const FALLBACKS = [
  `Acha sawal hai! Is par mere paas ready-made guide nahi — lekin main madad kar sakta hun:

🔍 **"search:" se shuru karo** — main live web research karunga (misal: \`search: DAAD deadline 2026\`)
🧠 **Smart Mode** on karo — mushkil sawalon ke liye on-device AI
📄 **Document upload karo** — PDF/text parh ke jawab dunga

Ya sawal thoda detail se batao?`,
]

/** Detect math expressions like "12*8", "45/5", "sqrt(16)", "15% of 200" */
export function tryCalculate(q: string): string | null {
  const t = q.toLowerCase().replace(/,/g, '')
  // percent: "15% of 200" / "15 percent of 200"
  let m = t.match(/(\d+(?:\.\d+)?)\s*% (?:of )?(\d+(?:\.\d+)?)/)
  if (m) {
    const r = (parseFloat(m[1]) / 100) * parseFloat(m[2])
    return `**${m[1]}% of ${m[2]} = ${fmt(r)}**`
  }
  // sqrt
  m = t.match(/sqrt\s*\(\s*(\d+(?:\.\d+)?)\s*\)/)
  if (m) return `**√${m[1]} = ${fmt(Math.sqrt(parseFloat(m[1])))}**`
  // basic arithmetic: only digits, operators, spaces, parens, decimals
  const expr = t.match(/^[\d\s+\-*/().^%]+$/) ? t : null
  if (expr && /[+\-*/%^]/.test(expr)) {
    try {
      const js = expr.replace(/\^/g, '**')
      // safety: only numbers and operators
      if (!/^[\d\s+\-*/().%*]+$/.test(js)) return null
      const r = Function(`"use strict"; return (${js})`)() as number
      if (typeof r === 'number' && isFinite(r)) {
        return `**${expr.trim()} = ${fmt(r)}**`
      }
    } catch { /* not a valid expression */ }
  }
  return null
}
function fmt(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('en-US') : parseFloat(n.toFixed(4)).toLocaleString('en-US')
}

function findBestMatch(query: string): KBEntry | null {
  const q = ` ${query.toLowerCase()} `
  let best: KBEntry | null = null
  let bestScore = 0
  for (const entry of KB) {
    let score = 0
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) score += (entry.weight ?? 2) * kw.length
    }
    if (score > bestScore) { bestScore = score; best = entry }
  }
  return bestScore > 0 ? best : null
}

export function localAnswer(history: ChatMsg[]): { text: string; toolsUsed: string[] } {
  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  const q = lastUser?.content ?? ''
  const calc = tryCalculate(q)
  if (calc) return { text: `🧮 ${calc}`, toolsUsed: ['calculate'] }
  const match = findBestMatch(q)
  if (match) return { text: match.response(q), toolsUsed: [] }
  return { text: FALLBACKS[0], toolsUsed: [] }
}

/** Should this query trigger live web research? */
export function wantsSearch(q: string): boolean {
  const t = q.toLowerCase().trim()
  if (t.startsWith('search:')) return true
  return /\b(deadline|2026|2025|latest|current|news|apply|admission|fee|requirement|university|scholarship.*(open|announced)|result)\b/.test(t)
    && /(scholarship|university|admission|deadline|program|college|degree|visa|test|exam)/.test(t)
}

/** Strip the "search:" prefix if present */
export function searchQueryOf(q: string): string {
  return q.trim().replace(/^search:\s*/i, '')
}
