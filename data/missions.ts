/**
 * Mission-based curriculum for Emirati Arabic
 * Level 1: Survival Emirati — 5 missions, ~50 phrases
 */

export interface Phrase {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  category: 'greeting' | 'question' | 'response' | 'vocab' | 'expression';
  audioKey?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'arrange' | 'fillBlank' | 'translate';
  question: string;
  questionAr?: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface Mission {
  id: string;
  title: string;
  titleAr: string;
  emoji: string;
  description: string;
  scenario: string;
  level: number;
  order: number;
  xpReward: number;
  phrases: Phrase[];
  quiz: QuizQuestion[];
}

export const missions: Mission[] = [
  {
    id: 'mission-1-greetings',
    title: 'First Day in Dubai',
    titleAr: 'أول يوم في دبي',
    emoji: '🏢',
    description: 'Learn essential Emirati greetings and introductions',
    scenario: 'You just landed in Dubai and are meeting your new Emirati colleague for the first time. Learn how to greet, introduce yourself, and make a great first impression.',
    level: 1,
    order: 1,
    xpReward: 50,
    phrases: [
      { id: 'g1', arabic: 'هلا', transliteration: 'hala', english: 'Hello (Emirati)', category: 'greeting' },
      { id: 'g2', arabic: 'هلا والله', transliteration: 'hala wallah', english: 'Hello! (enthusiastic)', category: 'greeting' },
      { id: 'g3', arabic: 'السلام عليكم', transliteration: 'as-salāmu ʿalaykum', english: 'Peace be upon you', category: 'greeting' },
      { id: 'g4', arabic: 'وعليكم السلام', transliteration: 'wa ʿalaykum as-salām', english: 'And upon you peace', category: 'response' },
      { id: 'g5', arabic: 'شخبارك؟', transliteration: 'shakhbārak?', english: 'How are you? (Emirati)', category: 'question' },
      { id: 'g6', arabic: 'زين الحمد لله', transliteration: 'zēn il-ḥamdulillah', english: 'Good, thank God', category: 'response' },
      { id: 'g7', arabic: 'شلونك؟', transliteration: 'shlōnak?', english: 'How are you? (alt)', category: 'question' },
      { id: 'g8', arabic: 'اسمي...', transliteration: 'ismi...', english: 'My name is...', category: 'expression' },
      { id: 'g9', arabic: 'تشرفنا', transliteration: 'tsharrafna', english: 'Nice to meet you', category: 'expression' },
      { id: 'g10', arabic: 'مع السلامة', transliteration: 'maʿ as-salāma', english: 'Goodbye', category: 'greeting' },
    ],
    quiz: [
      { id: 'q1', type: 'mcq', question: 'What does "هلا" mean?', options: ['Goodbye', 'Hello', 'Thank you', 'Please'], correctAnswer: 'Hello', explanation: 'هلا (hala) is the most common Emirati greeting!' },
      { id: 'q2', type: 'mcq', question: 'How do you say "How are you?" in Emirati?', options: ['كيف حالك', 'شخبارك', 'ماذا تريد', 'أين أنت'], correctAnswer: 'شخبارك', explanation: 'شخبارك (shakhbārak) is the Emirati way. كيف حالك is MSA.' },
      { id: 'q3', type: 'mcq', question: 'What does "زين الحمد لله" mean?', options: ['Good, thank God', 'See you tomorrow', 'What\'s your name?', 'Sorry about that'], correctAnswer: 'Good, thank God', explanation: 'زين (zēn) means "good" in Emirati dialect.' },
      { id: 'q4', type: 'mcq', question: 'What is the response to "السلام عليكم"?', options: ['شكرًا', 'وعليكم السلام', 'مع السلامة', 'يلا'], correctAnswer: 'وعليكم السلام' },
    ],
  },
  {
    id: 'mission-2-taxi',
    title: 'Get a Taxi',
    titleAr: 'خذ تاكسي',
    emoji: '🚕',
    description: 'Navigate Dubai by taxi using Emirati directions',
    scenario: "You need to get from Dubai Mall to your hotel. The taxi driver is Emirati, and you want to give directions and chat in his language. Let's go!",
    level: 1,
    order: 2,
    xpReward: 60,
    phrases: [
      { id: 't1', arabic: 'أبا تاكسي', transliteration: 'abā tāksi', english: 'I want a taxi', category: 'expression' },
      { id: 't2', arabic: 'وين؟', transliteration: 'wēn?', english: 'Where?', category: 'question' },
      { id: 't3', arabic: 'أبا أروح...', transliteration: 'abā arūḥ...', english: 'I want to go to...', category: 'expression' },
      { id: 't4', arabic: 'روح سيدة', transliteration: 'rūḥ sīda', english: 'Go straight', category: 'vocab' },
      { id: 't5', arabic: 'لف يمين', transliteration: 'liff yamīn', english: 'Turn right', category: 'vocab' },
      { id: 't6', arabic: 'لف يسار', transliteration: 'liff yasār', english: 'Turn left', category: 'vocab' },
      { id: 't7', arabic: 'وقف هني', transliteration: 'wagif hni', english: 'Stop here', category: 'expression' },
      { id: 't8', arabic: 'كم؟', transliteration: 'kam?', english: 'How much?', category: 'question' },
      { id: 't9', arabic: 'شكرًا', transliteration: 'shukran', english: 'Thank you', category: 'expression' },
      { id: 't10', arabic: 'يزاك الله خير', transliteration: 'yizāk allāh khēr', english: 'May God reward you (thanks)', category: 'expression' },
    ],
    quiz: [
      { id: 'q1', type: 'mcq', question: 'How do you say "I want" in Emirati?', options: ['أريد', 'أبا', 'أحب', 'أعرف'], correctAnswer: 'أبا', explanation: 'أبا (abā) is Emirati for "I want". أريد is MSA.' },
      { id: 'q2', type: 'mcq', question: 'What does "لف يمين" mean?', options: ['Turn left', 'Go straight', 'Turn right', 'Stop here'], correctAnswer: 'Turn right' },
      { id: 'q3', type: 'mcq', question: 'How do you say "Stop here" in Emirati?', options: ['روح سيدة', 'لف يسار', 'وقف هني', 'كم'], correctAnswer: 'وقف هني' },
    ],
  },
  {
    id: 'mission-3-restaurant',
    title: 'Order Like a Local',
    titleAr: 'اطلب مثل الإماراتي',
    emoji: '🍽️',
    description: 'Order food and drinks using Emirati phrases',
    scenario: "You're at a traditional Emirati restaurant. Time to order machboos, luqaimat, and karak like a pro. Let's talk food!",
    level: 1,
    order: 3,
    xpReward: 60,
    phrases: [
      { id: 'r1', arabic: 'أبا أطلب', transliteration: 'abā aṭlib', english: 'I want to order', category: 'expression' },
      { id: 'r2', arabic: 'القائمة لو سمحت', transliteration: 'il-qāʾima law samaḥt', english: 'The menu please', category: 'expression' },
      { id: 'r3', arabic: 'مجبوس لحم', transliteration: 'machbūs laḥam', english: 'Machboos with meat', category: 'vocab' },
      { id: 'r4', arabic: 'مجبوس دياي', transliteration: 'machbūs diyāy', english: 'Machboos with chicken', category: 'vocab' },
      { id: 'r5', arabic: 'كرك', transliteration: 'karak', english: 'Karak tea (spiced tea)', category: 'vocab' },
      { id: 'r6', arabic: 'لقيمات', transliteration: 'lugaimāt', english: 'Luqaimat (sweet dumplings)', category: 'vocab' },
      { id: 'r7', arabic: 'هالأكل لذيذ وايد', transliteration: 'hal-akil ladhīdh wāyid', english: 'This food is very delicious', category: 'expression' },
      { id: 'r8', arabic: 'الحساب لو سمحت', transliteration: 'il-ḥisāb law samaḥt', english: 'The bill please', category: 'expression' },
      { id: 'r9', arabic: 'ماي', transliteration: 'māy', english: 'Water', category: 'vocab' },
      { id: 'r10', arabic: 'بعد شي؟', transliteration: 'baʿad shay?', english: 'Anything else?', category: 'question' },
    ],
    quiz: [
      { id: 'q1', type: 'mcq', question: 'What is "مجبوس"?', options: ['A drink', 'A rice dish', 'A dessert', 'A greeting'], correctAnswer: 'A rice dish', explanation: 'Machboos is the national dish of the UAE — spiced rice with meat or chicken.' },
      { id: 'q2', type: 'mcq', question: 'What does "وايد" mean?', options: ['A little', 'Very / a lot', 'Sometimes', 'Never'], correctAnswer: 'Very / a lot', explanation: 'وايد (wāyid) is one of the most common Emirati words. You\'ll hear it everywhere!' },
      { id: 'q3', type: 'mcq', question: 'What does "هالأكل لذيذ وايد" mean?', options: ['This food is very delicious', 'I want more food', 'The bill please', 'Anything else?'], correctAnswer: 'This food is very delicious' },
    ],
  },
  {
    id: 'mission-4-shopping',
    title: 'Mall Hunt',
    titleAr: 'في المول',
    emoji: '🛍️',
    description: 'Shop like a pro at Dubai Mall',
    scenario: "You're exploring a mall in Dubai. Ask about prices, sizes, and discounts. Let's practice your shopping vocabulary!",
    level: 1,
    order: 4,
    xpReward: 60,
    phrases: [
      { id: 's1', arabic: 'كم سعره؟', transliteration: 'kam siʿruh?', english: 'How much is it?', category: 'question' },
      { id: 's2', arabic: 'غالي وايد', transliteration: 'ghāli wāyid', english: 'Very expensive', category: 'expression' },
      { id: 's3', arabic: 'عندكم خصم؟', transliteration: 'ʿindikum khaṣm?', english: 'Do you have a discount?', category: 'question' },
      { id: 's4', arabic: 'أبا هذا', transliteration: 'abā hādha', english: 'I want this', category: 'expression' },
      { id: 's5', arabic: 'ما أبا', transliteration: 'mā abā', english: "I don't want (it)", category: 'expression' },
      { id: 's6', arabic: 'عندكم مقاس ثاني؟', transliteration: 'ʿindikum magās thāni?', english: 'Do you have another size?', category: 'question' },
      { id: 's7', arabic: 'فلوس', transliteration: 'flūs', english: 'Money', category: 'vocab' },
      { id: 's8', arabic: 'درهم', transliteration: 'dirham', english: 'Dirham (UAE currency)', category: 'vocab' },
      { id: 's9', arabic: 'وين المحل؟', transliteration: 'wēn il-maḥal?', english: 'Where is the shop?', category: 'question' },
      { id: 's10', arabic: 'أتريا شوي', transliteration: 'atrayya shway', english: 'Wait a bit', category: 'expression' },
    ],
    quiz: [
      { id: 'q1', type: 'mcq', question: 'What does "غالي وايد" mean?', options: ['Very cheap', 'Very expensive', 'Very good', 'Very big'], correctAnswer: 'Very expensive' },
      { id: 'q2', type: 'mcq', question: 'How do you ask "How much?" in Emirati?', options: ['شو هذا', 'كم سعره', 'وين المحل', 'ليش'], correctAnswer: 'كم سعره' },
      { id: 'q3', type: 'mcq', question: 'What is the UAE currency called?', options: ['Riyal', 'Dinar', 'Dirham', 'Pound'], correctAnswer: 'Dirham' },
    ],
  },
  {
    id: 'mission-5-phone',
    title: 'The Phone Call',
    titleAr: 'المكالمة',
    emoji: '📞',
    description: 'Handle phone calls and appointments',
    scenario: "You're calling an Emirati office to book an appointment. Learn phone etiquette and scheduling phrases in Emirati Arabic.",
    level: 1,
    order: 5,
    xpReward: 70,
    phrases: [
      { id: 'p1', arabic: 'ألو', transliteration: 'alō', english: 'Hello (on phone)', category: 'greeting' },
      { id: 'p2', arabic: 'منو معاي؟', transliteration: 'minū maʿāy?', english: 'Who is this? (Emirati)', category: 'question' },
      { id: 'p3', arabic: 'أبا أحجز موعد', transliteration: 'abā aḥjiz mawʿid', english: 'I want to book an appointment', category: 'expression' },
      { id: 'p4', arabic: 'متى؟', transliteration: 'mata?', english: 'When?', category: 'question' },
      { id: 'p5', arabic: 'اليوم', transliteration: 'il-yōm', english: 'Today', category: 'vocab' },
      { id: 'p6', arabic: 'باجر', transliteration: 'bāchir', english: 'Tomorrow (Emirati)', category: 'vocab' },
      { id: 'p7', arabic: 'إن شاء الله', transliteration: 'in shāʾ allāh', english: 'God willing', category: 'expression' },
      { id: 'p8', arabic: 'ما شاء الله', transliteration: 'mā shāʾ allāh', english: 'God has willed it (praise)', category: 'expression' },
      { id: 'p9', arabic: 'مشكور', transliteration: 'mashkūr', english: 'Thank you (Emirati)', category: 'expression' },
      { id: 'p10', arabic: 'الله يسلمك', transliteration: 'allāh ysallmak', english: 'God bless you (farewell)', category: 'expression' },
    ],
    quiz: [
      { id: 'q1', type: 'mcq', question: 'What does "باجر" mean?', options: ['Yesterday', 'Today', 'Tomorrow', 'Next week'], correctAnswer: 'Tomorrow', explanation: 'باجر (bāchir) is Emirati for "tomorrow". In MSA it\'s غداً (ghadan).' },
      { id: 'q2', type: 'mcq', question: 'How do you say "Who is this?" on the phone in Emirati?', options: ['من أنت', 'منو معاي', 'وين أنت', 'شو تبا'], correctAnswer: 'منو معاي' },
      { id: 'q3', type: 'mcq', question: 'What does "إن شاء الله" express?', options: ['Gratitude', 'Surprise', 'Hope / God willing', 'Apology'], correctAnswer: 'Hope / God willing' },
    ],
  },
];

export const LEVELS = [
  { id: 1, name: 'Survival Emirati', nameAr: 'الإماراتية للبقاء', color: '#4ADE80', missions: 5, unlocked: true },
  { id: 2, name: 'Social Emirati', nameAr: 'الإماراتية الاجتماعية', color: '#FBBF24', missions: 5, unlocked: false },
  { id: 3, name: 'Conversational', nameAr: 'المحادثة', color: '#FB923C', missions: 5, unlocked: false },
  { id: 4, name: 'Fluent', nameAr: 'الطلاقة', color: '#EF4444', missions: 5, unlocked: false },
];
