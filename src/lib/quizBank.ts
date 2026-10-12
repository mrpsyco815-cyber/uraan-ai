/** Test Arena — built-in question bank (no external API, 100% ours). */

export interface Question {
  q: string
  options: string[]
  answer: number // index of correct option
  explanation: string
}

export const QUESTION_BANK: Record<string, Question[]> = {
  'Computer Science': [
    {
      q: 'What does HTML stand for?',
      options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Main Language', 'Home Tool Markup Language'],
      answer: 0,
      explanation: 'HTML = HyperText Markup Language — the standard language for creating web pages.',
    },
    {
      q: 'Which data structure uses LIFO (Last In, First Out)?',
      options: ['Queue', 'Stack', 'Array', 'Linked List'],
      answer: 1,
      explanation: 'A Stack uses LIFO — the last item pushed is the first one popped, like a stack of plates.',
    },
    {
      q: 'What is the time complexity of binary search?',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      answer: 1,
      explanation: 'Binary search halves the search space each step → O(log n).',
    },
    {
      q: 'In Python, what does len([1,2,3]) return?',
      options: ['2', '3', '4', 'Error'],
      answer: 1,
      explanation: 'len() returns the number of items — this list has 3 items.',
    },
    {
      q: 'Which of these is NOT a programming paradigm?',
      options: ['Object-oriented', 'Functional', 'Procedural', 'Compilational'],
      answer: 3,
      explanation: 'OOP, Functional, and Procedural are real paradigms. "Compilational" is not one.',
    },
  ],
  'Mathematics': [
    {
      q: 'What is 15% of 200?',
      options: ['25', '30', '35', '20'],
      answer: 1,
      explanation: '15% of 200 = 0.15 × 200 = 30.',
    },
    {
      q: 'Solve: 2x + 5 = 15',
      options: ['x = 4', 'x = 5', 'x = 6', 'x = 10'],
      answer: 1,
      explanation: '2x = 10 → x = 5.',
    },
    {
      q: 'What is the derivative of x²?',
      options: ['x', '2x', 'x³', '2'],
      answer: 1,
      explanation: 'Power rule: d/dx(x²) = 2x.',
    },
    {
      q: 'What is √144?',
      options: ['10', '11', '12', '14'],
      answer: 2,
      explanation: '12 × 12 = 144, so √144 = 12.',
    },
    {
      q: 'A triangle has angles 90° and 45°. What is the third angle?',
      options: ['35°', '40°', '45°', '55°'],
      answer: 2,
      explanation: 'Angles sum to 180°: 180 − 90 − 45 = 45°.',
    },
  ],
  'English': [
    {
      q: 'Choose the correct sentence:',
      options: ['She don\'t like tea.', 'She doesn\'t likes tea.', 'She doesn\'t like tea.', 'She not like tea.'],
      answer: 2,
      explanation: 'Third-person singular: "doesn\'t" + base verb → "doesn\'t like".',
    },
    {
      q: 'What is the synonym of "rapid"?',
      options: ['Slow', 'Fast', 'Quiet', 'Lazy'],
      answer: 1,
      explanation: '"Rapid" means fast or quick.',
    },
    {
      q: 'Identify the verb: "The cat sleeps on the mat."',
      options: ['cat', 'sleeps', 'on', 'mat'],
      answer: 1,
      explanation: '"Sleeps" is the action word — the verb.',
    },
    {
      q: 'What is the past tense of "go"?',
      options: ['Goed', 'Gone', 'Went', 'Goes'],
      answer: 2,
      explanation: '"Go" → "went" (past), "gone" (past participle).',
    },
    {
      q: 'Choose the correctly spelled word:',
      options: ['Recieve', 'Receive', 'Receeve', 'Riceive'],
      answer: 1,
      explanation: '"I before E except after C" → receive.',
    },
  ],
  'General Knowledge': [
    {
      q: 'What is the capital of Pakistan?',
      options: ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'],
      answer: 2,
      explanation: 'Islamabad has been the capital since the 1960s.',
    },
    {
      q: 'How many provinces does Pakistan have?',
      options: ['3', '4', '5', '6'],
      answer: 1,
      explanation: 'Four provinces: Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan.',
    },
    {
      q: 'What is H₂O commonly known as?',
      options: ['Salt', 'Water', 'Oxygen', 'Sugar'],
      answer: 1,
      explanation: 'H₂O is the chemical formula for water.',
    },
    {
      q: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      answer: 1,
      explanation: 'Mars appears red due to iron oxide (rust) on its surface.',
    },
    {
      q: 'What is the largest ocean on Earth?',
      options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
      answer: 3,
      explanation: 'The Pacific Ocean covers about one-third of Earth\'s surface.',
    },
  ],
}

export const SUBJECTS = Object.keys(QUESTION_BANK)
