/**
 * Daily 60-second challenge data
 * Rotating challenges for each day of the week
 */

export interface DailyChallenge {
  id: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  type: 'translate' | 'listen' | 'arrange' | 'fillBlank' | 'match';
  title: string;
  emoji: string;
  timeLimit: number; // seconds
  questions: ChallengeQuestion[];
}

export interface ChallengeQuestion {
  id: string;
  prompt: string;
  promptAr?: string;
  options?: string[];
  correctAnswer: string;
  xpReward: number;
}

export const dailyChallenges: DailyChallenge[] = [
  {
    id: 'dc-sunday',
    dayOfWeek: 0,
    type: 'translate',
    title: 'Translation Sprint',
    emoji: '🔄',
    timeLimit: 60,
    questions: [
      { id: 'dc-s1', prompt: 'Translate: "هلا"', options: ['Hello', 'Goodbye', 'Please', 'Sorry'], correctAnswer: 'Hello', xpReward: 10 },
      { id: 'dc-s2', prompt: 'Translate: "شخبارك"', options: ['How are you', 'What is this', 'Where are you', 'Who are you'], correctAnswer: 'How are you', xpReward: 10 },
      { id: 'dc-s3', prompt: 'Translate: "وايد"', options: ['Very / a lot', 'A little', 'Never', 'Sometimes'], correctAnswer: 'Very / a lot', xpReward: 10 },
      { id: 'dc-s4', prompt: 'Translate: "باجر"', options: ['Tomorrow', 'Yesterday', 'Today', 'Later'], correctAnswer: 'Tomorrow', xpReward: 15 },
      { id: 'dc-s5', prompt: 'Translate: "فلوس"', options: ['Money', 'Food', 'Water', 'House'], correctAnswer: 'Money', xpReward: 10 },
    ],
  },
  {
    id: 'dc-monday',
    dayOfWeek: 1,
    type: 'match',
    title: 'Match Madness',
    emoji: '🎯',
    timeLimit: 60,
    questions: [
      { id: 'dc-m1', prompt: 'Match: "شو"', options: ['Where', 'What', 'Why', 'How'], correctAnswer: 'What', xpReward: 10 },
      { id: 'dc-m2', prompt: 'Match: "وين"', options: ['Where', 'What', 'When', 'Who'], correctAnswer: 'Where', xpReward: 10 },
      { id: 'dc-m3', prompt: 'Match: "ليش"', options: ['How', 'What', 'Why', 'When'], correctAnswer: 'Why', xpReward: 10 },
      { id: 'dc-m4', prompt: 'Match: "متى"', options: ['What', 'Where', 'Why', 'When'], correctAnswer: 'When', xpReward: 10 },
      { id: 'dc-m5', prompt: 'Match: "منو"', options: ['What', 'Who', 'Where', 'When'], correctAnswer: 'Who', xpReward: 15 },
    ],
  },
  {
    id: 'dc-tuesday',
    dayOfWeek: 2,
    type: 'fillBlank',
    title: 'Fill the Gap',
    emoji: '✏️',
    timeLimit: 60,
    questions: [
      { id: 'dc-t1', prompt: '"I want a ___" (تاكسي)', options: ['Taxi', 'Bus', 'Train', 'Car'], correctAnswer: 'Taxi', xpReward: 10 },
      { id: 'dc-t2', prompt: '"I am ___, thank God" (زين)', options: ['Good', 'Bad', 'Tired', 'Hungry'], correctAnswer: 'Good', xpReward: 10 },
      { id: 'dc-t3', prompt: '"How much is the ___?" (سعره)', options: ['Price', 'Size', 'Color', 'Name'], correctAnswer: 'Price', xpReward: 15 },
      { id: 'dc-t4', prompt: '"This food is ___ delicious" (وايد)', options: ['Very', 'Not', 'A little', 'Sometimes'], correctAnswer: 'Very', xpReward: 10 },
    ],
  },
  {
    id: 'dc-wednesday',
    dayOfWeek: 3,
    type: 'translate',
    title: 'Reverse Translate',
    emoji: '🔃',
    timeLimit: 60,
    questions: [
      { id: 'dc-w1', prompt: 'Say "I want" in Emirati', options: ['أبا', 'أريد', 'أحب', 'أعرف'], correctAnswer: 'أبا', xpReward: 10 },
      { id: 'dc-w2', prompt: 'Say "Now" in Emirati', options: ['الآن', 'الحين', 'هسه', 'دلوقتي'], correctAnswer: 'الحين', xpReward: 10 },
      { id: 'dc-w3', prompt: 'Say "Good" in Emirati', options: ['جيد', 'كويس', 'زين', 'منيح'], correctAnswer: 'زين', xpReward: 10 },
      { id: 'dc-w4', prompt: 'Say "Tomorrow" in Emirati', options: ['غدًا', 'بكرة', 'باجر', 'بكره'], correctAnswer: 'باجر', xpReward: 15 },
    ],
  },
  {
    id: 'dc-thursday',
    dayOfWeek: 4,
    type: 'match',
    title: 'Quick Match',
    emoji: '⚡',
    timeLimit: 60,
    questions: [
      { id: 'dc-th1', prompt: 'Match: "مجبوس"', options: ['Tea', 'Rice dish', 'Bread', 'Soup'], correctAnswer: 'Rice dish', xpReward: 10 },
      { id: 'dc-th2', prompt: 'Match: "كرك"', options: ['Coffee', 'Juice', 'Spiced tea', 'Water'], correctAnswer: 'Spiced tea', xpReward: 10 },
      { id: 'dc-th3', prompt: 'Match: "لقيمات"', options: ['Rice balls', 'Sweet dumplings', 'Bread', 'Salad'], correctAnswer: 'Sweet dumplings', xpReward: 10 },
      { id: 'dc-th4', prompt: 'Match: "ماي"', options: ['Tea', 'Coffee', 'Juice', 'Water'], correctAnswer: 'Water', xpReward: 10 },
    ],
  },
  {
    id: 'dc-friday',
    dayOfWeek: 5,
    type: 'translate',
    title: 'Friday Challenge',
    emoji: '🌙',
    timeLimit: 60,
    questions: [
      { id: 'dc-f1', prompt: 'Translate: "إن شاء الله"', options: ['God willing', 'Thank God', 'God is great', 'God bless you'], correctAnswer: 'God willing', xpReward: 10 },
      { id: 'dc-f2', prompt: 'Translate: "ما شاء الله"', options: ['God has willed it', 'God willing', 'Thank God', 'God forgive me'], correctAnswer: 'God has willed it', xpReward: 10 },
      { id: 'dc-f3', prompt: 'Translate: "يزاك الله خير"', options: ['May God reward you', 'God bless you', 'God willing', 'Peace be upon you'], correctAnswer: 'May God reward you', xpReward: 15 },
      { id: 'dc-f4', prompt: 'Translate: "الله يسلمك"', options: ['God bless you', 'God willing', 'Thank God', 'God is great'], correctAnswer: 'God bless you', xpReward: 10 },
    ],
  },
  {
    id: 'dc-saturday',
    dayOfWeek: 6,
    type: 'match',
    title: 'Weekend Wrap-up',
    emoji: '🏖️',
    timeLimit: 60,
    questions: [
      { id: 'dc-sa1', prompt: 'Match: "روح سيدة"', options: ['Turn right', 'Go straight', 'Turn left', 'Stop here'], correctAnswer: 'Go straight', xpReward: 10 },
      { id: 'dc-sa2', prompt: 'Match: "لف يمين"', options: ['Turn left', 'Go straight', 'Turn right', 'Go back'], correctAnswer: 'Turn right', xpReward: 10 },
      { id: 'dc-sa3', prompt: 'Match: "وقف هني"', options: ['Go there', 'Stop here', 'Come here', 'Wait there'], correctAnswer: 'Stop here', xpReward: 10 },
      { id: 'dc-sa4', prompt: 'Match: "مشكور"', options: ['Sorry', 'Please', 'Thank you', 'Excuse me'], correctAnswer: 'Thank you', xpReward: 10 },
    ],
  },
];
