/**
 * URAAN AI — APNA AI ASSISTANT 🇵🇰
 * 100% self-owned. Zero external API calls. Zero expiry. Zero cost.
 *
 * A local intelligence engine with a rich knowledge base covering
 * all student needs. Honest about its nature: not generative like
 * ChatGPT, but reliable, private, and forever ours.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── KNOWLEDGE BASE ──────────────────────────────────────────────

interface KBEntry {
  keywords: string[]
  response: (q: string) => string
}

const KB: KBEntry[] = [
  // ── GREETINGS ──
  {
    keywords: ['salam', 'assalam', 'hello', 'hi', 'hey', 'aoa'],
    response: () => `Walaikum Assalam! 👋 Main URAAN AI hun — tumhara apna study companion.

Main tumhari madad kar sakta hun:
📚 **Parhai** — concepts samjhao, math/science help
💻 **Coding** — debugging tips, concepts
🎓 **Scholarships** — strategy, checklist, SOP tips
💼 **Career** — CV tips, interview prep
✍️ **Writing** — SOP/essay guidance
⚡ **Study plans** — realistic schedules

Kya poochna hai?`,
  },
  // ── SOP ──
  {
    keywords: ['sop', 'statement of purpose', 'personal statement', 'essay'],
    response: () => `**✍️ SOP likhne ka complete guide:**

**Structure (500-1000 words):**
1. **Hook** (1 para) — ek personal moment ya sawal jo reader ko pakray
2. **Academic journey** (2 para) — kya parha, kya seekha, kaunsa project
3. **Why this program** (1-2 para) — SPECIFIC professor, lab, course ka naam lo
4. **Future goals** (1 para) — degree ke baad kya karoge
5. **Closing** (1 para) — confident, short

**Golden rules:**
✅ Specific raho — "I love CS" nahi, "Dr. Ahmed's NLP lab ka X paper" 
✅ Story sunao — facts nahi, journey
✅ Har paragraph ka ek point ho
❌ Clichés nahi — "since childhood", "passionate", "dream"
❌ Jhoot nahi — jo kiya wahi likho

**SOP Coach page** par apna draft paste karo — detailed feedback milega!`,
  },
  // ── SCHOLARSHIP STRATEGY ──
  {
    keywords: ['scholarship strategy', 'how to get scholarship', 'scholarship tips', 'apply scholarship'],
    response: () => `**🎓 Scholarship jeetne ki strategy:**

**6 mahine pehle:**
- Target list banao (5-8 programs)
- Har ek ki requirements note karo
- Professors se recommendation letters mango

**3 mahine pehle:**
- SOP ke 3-4 drafts likho
- Documents jama karo (transcripts, certificates)
- English test do (IELTS/TOEFL agar chahiye)

**1 mahina pehle:**
- Har application customize karo (copy-paste nahi!)
- 2 logon se proofread karwao
- Deadline se 1 hafta pehle submit karo

**Secret:** Kam log apply karte hain jitna tum sochte ho. Quality > Quantity. Ek strong application 10 weak se behtar hai!

App ke **Opportunities** section mein verified scholarships dekho.`,
  },
  // ── INTERVIEW PREP ──
  {
    keywords: ['interview', 'interview prep', 'interview questions'],
    response: () => `**💼 Interview ki tayyari:**

**Top 5 sawal (har interview mein):**
1. "Apne baare mein batao" → 2-min story: past → present → future
2. "Why this program/company?" → SPECIFIC wajah, generic nahi
3. "Tumhari kamzori?" → real weakness + kaise improve kar rahe ho
4. "Ek challenge batao" → STAR method: Situation, Task, Action, Result
5. "Koi sawal?" → HAMESHA 2-3 sawal poocho (shows interest!)

**Tips:**
✅ Pehle mirror ke samne practice karo
✅ "Um, uh" kam karo — pause lena OK hai
✅ Body language: seedha betho, eye contact
❌ Salary/paisa pehle mat poocho
❌ Jhoot mat bolo — pakray jao ge

**STAR method** har behavioral sawal ke liye use karo!`,
  },
  // ── STUDY PLAN ──
  {
    keywords: ['study plan', 'schedule', 'routine', 'timetable', 'parhai ka plan'],
    response: () => `**⚡ Realistic study plan banane ka tarika:**

**Step 1:** Apna din likho — kitne free hours hain? (honest raho!)
**Step 2:** Subjects ko priority do — mushkil pehle, aasan baad mein
**Step 3:** Pomodoro use karo — 25 min parhai, 5 min break

**Sample (4 hours/day):**
- 🌅 Subah: 1 hr — mushkil subject (fresh mind)
- 🌤️ Dopahar: 1 hr — practice/questions
- 🌙 Raat: 1 hr — revision (jo subah parha)
- 📝 1 hr — assignment ya weak topic

**Rules:**
✅ Roz ek hi time par parho (habit banti hai)
✅ Phone door rakho (ya silent)
✅ Hafte mein 1 din rest lo (burnout se bacho)
❌ 8-hour plan mat banao agar 4 hour bhi mushkil hai

Chota plan jo follow ho > bara plan jo toot jaye!`,
  },
  // ── CODING DEBUG ──
  {
    keywords: ['debug', 'error', 'bug', 'not working', 'indexerror', 'syntaxerror', 'typeerror'],
    response: () => `**💻 Debugging ka systematic tarika:**

**Step 1:** Error message PARHO — wo batata hai kya masla hai
- \`IndexError\` → list ke bahar access kar rahe ho
- \`TypeError\` → ghalat type par operation
- \`SyntaxError\` → bracket ya colon missing
- \`NameError\` → variable define nahi ki

**Step 2:** Print statements lagao — values dekho
**Step 3:** Chota test case banao — masla isolate karo
**Step 4:** Google the EXACT error message

**Golden rule:** Error tumhara dushman nahi, teacher hai. Har error kuch sikhati hai!

Apna specific error batao — main guide karunga!`,
  },
  // ── MATH ──
  {
    keywords: ['math', 'algebra', 'calculus', 'derivative', 'integral', 'equation'],
    response: () => `**📐 Math samajhne ka tarika:**

**Rule #1:** Formula ratta mat lagao — SAMJHO ke kyun kaam karta hai
**Rule #2:** Har roz 5-10 sawal practice karo (roz thoda > ek din zyada)
**Rule #3:** Ghalat jawab se mat daro — wahi se seekhte ho

**Problem-solving steps:**
1. Kya diya hai? (given) — likho
2. Kya nikalna hai? (find) — likho  
3. Kaunsa formula/method? — socho
4. Step by step hal karo
5. Jawab check karo — kya sense banta hai?

Koi specific topic batao — main step-by-step samjhaunga!`,
  },
  // ── MOTIVATION ──
  {
    keywords: ['demotivated', 'tired', 'give up', 'motivation', 'depressed', 'stress', 'tension'],
    response: () => `**💪 Suno, jani:**

Thakna normal hai. Har successful student ne ye phase dekha hai.

**Aaj ke liye:**
- Bas 25 minute parho. Sirf 25. Phir break lo.
- Apna "kyun" yaad karo — kyun shuru kiya tha?
- Kisi se baat karo — dost, family, mentor

**Yaad rakho:**
- Tum yahan tak aaye ho — ye khud ek achievement hai
- Slow progress bhi progress hai
- Kal ka tum, aaj ke tum se behtar hoga

**Agar serious stress hai:** Kisi trusted bande se baat karo. Madad mangna kamzori nahi, himmat hai. 🤗

Ab batao — kis cheez mein help chahiye? Mil kar karte hain!`,
  },
  // ── CV/RESUME ──
  {
    keywords: ['cv', 'resume', 'biodata'],
    response: () => `**📄 CV jo standout kare:**

**Format:**
1. Name + contact (top, clear)
2. Objective (2 lines, specific)
3. Education (latest first)
4. Skills (relevant only!)
5. Projects (2-3 best, with results)
6. Experience/Internships

**Rules:**
✅ 1 page (freshers ke liye)
✅ Numbers use karo — "50 students ko parhaya" > "teaching ki"
✅ Action words — "Built", "Led", "Created", "Improved"
✅ Har job ke liye customize karo
❌ Photo mat lagao (unless asked)
❌ Jhoot mat likho
❌ "Hardworking, punctual" jaise generic words nahi

**Pro tip:** Apne best project ko detail se likho — yehi interview mein discuss hoga!`,
  },
  // ── ENGLISH ──
  {
    keywords: ['english', 'ielts', 'toefl', 'improve english'],
    response: () => `**🗣️ English improve karne ka tarika:**

**Roz 30 min:**
- 📖 10 min reading (BBC, Dawn, ya koi article)
- 🎧 10 min listening (podcast ya YouTube, subtitles ke sath)
- ✍️ 10 min writing (diary ya koi paragraph)

**IELTS tips:**
- Speaking: roz 5 min khud se bolo (mirror mein)
- Writing: har hafta 2 essays likho
- Reading: time limit mein practice karo
- Listening: different accents suno

**Secret:** Ghalti karne se mat daro. Jo bolta hai, wahi seekhta hai!

Roman Urdu mein sochna band karo — English mein sochna shuru karo. Dheere dheere aayegi! 💪`,
  },
]

const FALLBACKS = [
  `Acha sawal hai! Is bare mein mere paas detailed guide nahi hai, lekin main tumhari madad kar sakta hun:\n\n📚 **Parhai** — concepts, math, science\n💻 **Coding** — debugging tips\n🎓 **Scholarships** — strategy aur SOP\n💼 **Career** — CV, interview\n✍️ **Writing** — essay guidance\n\nThoda specific batao — kis topic par help chahiye?`,
  `Hmm, ye mere knowledge se bahar hai. Lekin ye try karo:\n\n• **Opportunities** section — verified scholarships\n• **SOP Coach** — essay feedback\n• **Mentors** — real insan se poocho!\n\nYa apna sawal thoda detail se batao?`,
]

function findBestMatch(query: string): KBEntry | null {
  const q = query.toLowerCase()
  let best: KBEntry | null = null
  let bestScore = 0
  for (const entry of KB) {
    let score = 0
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += kw.length // Longer keyword matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }
  return bestScore > 0 ? best : null
}

let fallbackIndex = 0

export async function sendMessage(history: ChatMessage[]): Promise<string> {
  // Simulate brief "thinking" for natural feel
  await new Promise((r) => setTimeout(r, 400))

  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  if (!lastUser) return FALLBACKS[0]

  const match = findBestMatch(lastUser.content)
  if (match) {
    return match.response(lastUser.content)
  }

  // Rotate fallbacks so repeats feel less robotic
  const fb = FALLBACKS[fallbackIndex % FALLBACKS.length]
  fallbackIndex++
  return fb
}

export function getCapabilityLabel(text: string): string {
  const q = text.toLowerCase()
  if (/(sop|essay|write)/.test(q)) return '✍️ Writing'
  if (/(scholarship|apply|daad)/.test(q)) return '🎓 Scholarships'
  if (/(code|debug|error|bug)/.test(q)) return '💻 Coding'
  if (/(job|career|cv|interview|resume)/.test(q)) return '💼 Career'
  if (/(math|physics|explain)/.test(q)) return '📚 Tutor'
  if (/(plan|schedule|routine)/.test(q)) return '⚡ Productivity'
  if (/(english|ielts)/.test(q)) return '🗣️ English'
  if (/(motivation|stress|tired)/.test(q)) return '💪 Support'
  return '🤖 Assistant'
}

export const isAssistantLive = true
export const isOwnAI = true // Flag: this is OUR AI, no external API
