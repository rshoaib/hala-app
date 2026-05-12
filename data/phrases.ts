/**
 * Emirati Arabic phrasebook — organized by learner level.
 *
 * Three levels only:
 *   - beginner       (greetings, intros, numbers, food, basic verbs)
 *   - intermediate   (work, directions, shopping, weather, emotions, time)
 *   - expert         (idioms, complex Q&A, travel, cultural expressions)
 *
 * Transliterations follow the common Gulf/khaleeji convention (ch/sh/kh/gh).
 * Authenticity focus: colloquial Emirati, not MSA.
 */

export type Level = 'beginner' | 'intermediate' | 'expert';

export type Category =
  | 'greeting'
  | 'question'
  | 'response'
  | 'vocab'
  | 'expression';

export interface Phrase {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  category: Category;
  level: Level;
}

export interface PhraseTheme {
  id: string;
  title: string;
  emoji: string;
  level: Level;
  phrases: Phrase[];
}

export const LEVELS: { id: Level; title: string; description: string }[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'Greet, introduce yourself, count, order food.',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Work, directions, shopping, feelings, weather.',
  },
  {
    id: 'expert',
    title: 'Expert',
    description: 'Idioms, cultural nuance, complex conversation.',
  },
];

/* ─────────────────────────────────────────────────────────
   BEGINNER
   ───────────────────────────────────────────────────────── */

const greetings: Phrase[] = [
  { id: 'gr-001', arabic: 'السلام عليكم',   transliteration: 'as-salamu alaykum', english: 'Peace be upon you',          category: 'greeting',   level: 'beginner' },
  { id: 'gr-002', arabic: 'وعليكم السلام',  transliteration: 'wa alaykum as-salam', english: 'And peace be upon you',     category: 'greeting',   level: 'beginner' },
  { id: 'gr-003', arabic: 'هلا والله',       transliteration: 'hala wallah',        english: 'Hi / Welcome (warm)',       category: 'greeting',   level: 'beginner' },
  { id: 'gr-004', arabic: 'هلا بيك',         transliteration: 'hala beek',          english: 'Welcome to you',            category: 'greeting',   level: 'beginner' },
  { id: 'gr-005', arabic: 'حياك الله',       transliteration: 'hayyak allah',       english: 'May God give you life',     category: 'greeting',   level: 'beginner' },
  { id: 'gr-006', arabic: 'صباح الخير',      transliteration: 'sabah al-khair',     english: 'Good morning',              category: 'greeting',   level: 'beginner' },
  { id: 'gr-007', arabic: 'صباح النور',      transliteration: 'sabah an-noor',      english: 'Morning of light',          category: 'greeting',   level: 'beginner' },
  { id: 'gr-008', arabic: 'مساء الخير',      transliteration: 'masa al-khair',      english: 'Good evening',              category: 'greeting',   level: 'beginner' },
  { id: 'gr-009', arabic: 'مساء النور',      transliteration: 'masa an-noor',       english: 'Evening of light',          category: 'greeting',   level: 'beginner' },
  { id: 'gr-010', arabic: 'تصبح على خير',    transliteration: 'tisbah ala khair',   english: 'Good night',                category: 'greeting',   level: 'beginner' },
  { id: 'gr-012', arabic: 'شخبارك',          transliteration: 'shakhbarak',         english: 'How are you? (m)',          category: 'greeting',   level: 'beginner' },
  { id: 'gr-013', arabic: 'شخبارش',          transliteration: 'shakhbarich',        english: 'How are you? (f)',          category: 'greeting',   level: 'beginner' },
  { id: 'gr-014', arabic: 'شلونك',           transliteration: 'shlonak',            english: 'How are you? (m)',          category: 'greeting',   level: 'beginner' },
  { id: 'gr-015', arabic: 'شلونش',           transliteration: 'shlonich',           english: 'How are you? (f)',          category: 'greeting',   level: 'beginner' },
  { id: 'gr-016', arabic: 'زين',             transliteration: 'zain',               english: 'Good / Fine',               category: 'response',   level: 'beginner' },
  { id: 'gr-018', arabic: 'بخير',            transliteration: 'bikhair',            english: 'Fine / Well',               category: 'response',   level: 'beginner' },
  { id: 'gr-019', arabic: 'الحمدلله',        transliteration: 'al-hamdulillah',     english: 'Praise be to God',          category: 'response',   level: 'beginner' },
  { id: 'gr-024', arabic: 'يا هلا',          transliteration: 'ya hala',            english: 'Hi there!',                 category: 'greeting',   level: 'beginner' },
  { id: 'gr-025', arabic: 'مرحبا',           transliteration: 'marhaba',            english: 'Hello',                     category: 'greeting',   level: 'beginner' },
  { id: 'gr-026', arabic: 'أهلين',           transliteration: 'ahlain',             english: 'Hi (casual)',               category: 'greeting',   level: 'beginner' },
  { id: 'gr-027', arabic: 'أهلا وسهلا',      transliteration: 'ahlan wa sahlan',    english: 'Welcome',                   category: 'greeting',   level: 'beginner' },
  { id: 'gr-028', arabic: 'مع السلامة',      transliteration: 'maa as-salama',      english: 'Goodbye (safe travels)',    category: 'greeting',   level: 'beginner' },
  { id: 'gr-037', arabic: 'مشكور',           transliteration: 'mashkoor',           english: 'Thank you (m)',             category: 'expression', level: 'beginner' },
  { id: 'gr-038', arabic: 'مشكورة',          transliteration: 'mashkoora',          english: 'Thank you (f)',             category: 'expression', level: 'beginner' },
  { id: 'gr-039', arabic: 'شكراً',           transliteration: 'shukran',            english: 'Thanks',                    category: 'expression', level: 'beginner' },
  { id: 'gr-040', arabic: 'العفو',           transliteration: 'al-afu',             english: "You're welcome",            category: 'expression', level: 'beginner' },
  { id: 'gr-042', arabic: 'تفضل',            transliteration: 'tafadhal',           english: 'Please / Go ahead (m)',     category: 'expression', level: 'beginner' },
  { id: 'gr-043', arabic: 'تفضلي',           transliteration: 'tafadhali',          english: 'Please / Go ahead (f)',     category: 'expression', level: 'beginner' },
  { id: 'gr-044', arabic: 'لو سمحت',         transliteration: 'lo samaht',          english: 'If you please (m)',         category: 'expression', level: 'beginner' },
  { id: 'gr-045', arabic: 'لو سمحتي',        transliteration: 'lo samahti',         english: 'If you please (f)',         category: 'expression', level: 'beginner' },
];

const people: Phrase[] = [
  { id: 'pp-001', arabic: 'أنا',          transliteration: 'ana',          english: 'I',                         category: 'vocab',      level: 'beginner' },
  { id: 'pp-002', arabic: 'أنت',          transliteration: 'inta',         english: 'You (m)',                   category: 'vocab',      level: 'beginner' },
  { id: 'pp-003', arabic: 'أنتي',         transliteration: 'inti',         english: 'You (f)',                   category: 'vocab',      level: 'beginner' },
  { id: 'pp-004', arabic: 'هو',           transliteration: 'hu',           english: 'He',                        category: 'vocab',      level: 'beginner' },
  { id: 'pp-005', arabic: 'هي',           transliteration: 'hi',           english: 'She',                       category: 'vocab',      level: 'beginner' },
  { id: 'pp-006', arabic: 'احنا',         transliteration: 'ihna',         english: 'We',                        category: 'vocab',      level: 'beginner' },
  { id: 'pp-007', arabic: 'انتوا',        transliteration: 'intu',         english: 'You (pl)',                  category: 'vocab',      level: 'beginner' },
  { id: 'pp-008', arabic: 'هم',           transliteration: 'hum',          english: 'They',                      category: 'vocab',      level: 'beginner' },
  { id: 'pp-009', arabic: 'اسمي',         transliteration: 'ismi',         english: 'My name is',                category: 'expression', level: 'beginner' },
  { id: 'pp-010', arabic: 'شو اسمك',      transliteration: 'shoo ismak',   english: 'What is your name? (m)',    category: 'question',   level: 'beginner' },
  { id: 'pp-011', arabic: 'شو اسمش',      transliteration: 'shoo ismich',  english: 'What is your name? (f)',    category: 'question',   level: 'beginner' },
  { id: 'pp-012', arabic: 'تشرفنا',       transliteration: 'tsharafna',    english: 'Nice to meet you',          category: 'expression', level: 'beginner' },
  { id: 'pp-013', arabic: 'من وين انت',   transliteration: 'min wain inta', english: 'Where are you from? (m)',  category: 'question',   level: 'beginner' },
  { id: 'pp-015', arabic: 'من الإمارات',  transliteration: 'min al-imarat', english: 'From the Emirates',        category: 'response',   level: 'beginner' },
  { id: 'pp-016', arabic: 'أنا من',       transliteration: 'ana min',      english: 'I am from',                 category: 'expression', level: 'beginner' },
  { id: 'pp-017', arabic: 'رجال',         transliteration: 'rayyal',       english: 'Man',                       category: 'vocab',      level: 'beginner' },
  { id: 'pp-018', arabic: 'حرمة',         transliteration: 'hurma',        english: 'Woman',                     category: 'vocab',      level: 'beginner' },
  { id: 'pp-019', arabic: 'ولد',          transliteration: 'wald',         english: 'Boy / Son',                 category: 'vocab',      level: 'beginner' },
  { id: 'pp-020', arabic: 'بنت',          transliteration: 'bint',         english: 'Girl / Daughter',           category: 'vocab',      level: 'beginner' },
];

const numbers: Phrase[] = [
  { id: 'nm-001', arabic: 'صفر',  transliteration: 'sifr',    english: 'Zero',  category: 'vocab', level: 'beginner' },
  { id: 'nm-002', arabic: 'واحد', transliteration: 'wahid',   english: 'One',   category: 'vocab', level: 'beginner' },
  { id: 'nm-003', arabic: 'اثنين', transliteration: 'ithnain', english: 'Two',   category: 'vocab', level: 'beginner' },
  { id: 'nm-004', arabic: 'ثلاثة', transliteration: 'thalatha', english: 'Three', category: 'vocab', level: 'beginner' },
  { id: 'nm-005', arabic: 'أربعة', transliteration: 'arba\'a',  english: 'Four',  category: 'vocab', level: 'beginner' },
  { id: 'nm-006', arabic: 'خمسة', transliteration: 'khamsa',  english: 'Five',  category: 'vocab', level: 'beginner' },
  { id: 'nm-007', arabic: 'ستة',  transliteration: 'sitta',   english: 'Six',   category: 'vocab', level: 'beginner' },
  { id: 'nm-008', arabic: 'سبعة', transliteration: 'sab\'a',  english: 'Seven', category: 'vocab', level: 'beginner' },
  { id: 'nm-009', arabic: 'ثمانية', transliteration: 'thamanya', english: 'Eight', category: 'vocab', level: 'beginner' },
  { id: 'nm-010', arabic: 'تسعة', transliteration: 'tis\'a',  english: 'Nine',  category: 'vocab', level: 'beginner' },
  { id: 'nm-011', arabic: 'عشرة', transliteration: 'ashara',  english: 'Ten',   category: 'vocab', level: 'beginner' },
  { id: 'nm-012', arabic: 'مية',  transliteration: 'miya',    english: 'Hundred', category: 'vocab', level: 'beginner' },
  { id: 'nm-013', arabic: 'ألف',  transliteration: 'alf',     english: 'Thousand', category: 'vocab', level: 'beginner' },
];

const food: Phrase[] = [
  { id: 'fd-001', arabic: 'ماي',     transliteration: 'mai',     english: 'Water',         category: 'vocab',      level: 'beginner' },
  { id: 'fd-002', arabic: 'خبز',     transliteration: 'khubz',   english: 'Bread',         category: 'vocab',      level: 'beginner' },
  { id: 'fd-003', arabic: 'لحم',     transliteration: 'laham',   english: 'Meat',          category: 'vocab',      level: 'beginner' },
  { id: 'fd-004', arabic: 'دياي',    transliteration: 'diyay',   english: 'Chicken',       category: 'vocab',      level: 'beginner' },
  { id: 'fd-005', arabic: 'سمك',     transliteration: 'simach',  english: 'Fish',          category: 'vocab',      level: 'beginner' },
  { id: 'fd-006', arabic: 'رز',      transliteration: 'aysh',    english: 'Rice',          category: 'vocab',      level: 'beginner' },
  { id: 'fd-007', arabic: 'تمر',     transliteration: 'tamr',    english: 'Dates',         category: 'vocab',      level: 'beginner' },
  { id: 'fd-008', arabic: 'قهوة',    transliteration: 'gahwa',   english: 'Coffee (Arabic)', category: 'vocab',    level: 'beginner' },
  { id: 'fd-009', arabic: 'شاي',     transliteration: 'chai',    english: 'Tea',           category: 'vocab',      level: 'beginner' },
  { id: 'fd-010', arabic: 'حليب',    transliteration: 'haleeb',  english: 'Milk',          category: 'vocab',      level: 'beginner' },
  { id: 'fd-011', arabic: 'فطور',    transliteration: 'futoor',  english: 'Breakfast',     category: 'vocab',      level: 'beginner' },
  { id: 'fd-012', arabic: 'غدا',     transliteration: 'ghada',   english: 'Lunch',         category: 'vocab',      level: 'beginner' },
  { id: 'fd-013', arabic: 'عشا',     transliteration: 'asha',    english: 'Dinner',        category: 'vocab',      level: 'beginner' },
  { id: 'fd-014', arabic: 'لذيذ',    transliteration: 'ladheedh', english: 'Delicious',    category: 'response',   level: 'beginner' },
  { id: 'fd-015', arabic: 'جوعان',   transliteration: 'jou\'an', english: 'Hungry (m)',    category: 'expression', level: 'beginner' },
  { id: 'fd-016', arabic: 'عطشان',   transliteration: 'atshan',  english: 'Thirsty (m)',   category: 'expression', level: 'beginner' },
  { id: 'fd-017', arabic: 'أبا',     transliteration: 'aba',     english: 'I want',        category: 'expression', level: 'beginner' },
];

const verbsBasic: Phrase[] = [
  { id: 'vb-001', arabic: 'أبا',      transliteration: 'aba',       english: 'I want',          category: 'expression', level: 'beginner' },
  { id: 'vb-002', arabic: 'أحب',      transliteration: 'ahib',      english: 'I love / like',   category: 'expression', level: 'beginner' },
  { id: 'vb-003', arabic: 'أعرف',     transliteration: 'a\'arf',    english: 'I know',          category: 'expression', level: 'beginner' },
  { id: 'vb-004', arabic: 'ما أعرف',  transliteration: 'ma a\'arf', english: "I don't know",    category: 'expression', level: 'beginner' },
  { id: 'vb-005', arabic: 'أفهم',     transliteration: 'afham',     english: 'I understand',    category: 'expression', level: 'beginner' },
  { id: 'vb-006', arabic: 'ما أفهم',  transliteration: 'ma afham',  english: "I don't understand", category: 'expression', level: 'beginner' },
  { id: 'vb-007', arabic: 'روح',      transliteration: 'rooh',      english: 'Go',              category: 'vocab',      level: 'beginner' },
  { id: 'vb-008', arabic: 'تعال',     transliteration: 't\'aal',    english: 'Come',            category: 'vocab',      level: 'beginner' },
  { id: 'vb-009', arabic: 'أكل',      transliteration: 'akil',      english: 'Eat',             category: 'vocab',      level: 'beginner' },
  { id: 'vb-010', arabic: 'شرب',      transliteration: 'shrab',     english: 'Drink',           category: 'vocab',      level: 'beginner' },
  { id: 'vb-011', arabic: 'نعم',      transliteration: 'na\'am',    english: 'Yes',             category: 'response',   level: 'beginner' },
  { id: 'vb-012', arabic: 'لا',       transliteration: 'la',        english: 'No',              category: 'response',   level: 'beginner' },
  { id: 'vb-013', arabic: 'إيه',      transliteration: 'ee',        english: 'Yeah (casual)',   category: 'response',   level: 'beginner' },
];

/* ─────────────────────────────────────────────────────────
   INTERMEDIATE
   ───────────────────────────────────────────────────────── */

const family: Phrase[] = [
  { id: 'fm-001', arabic: 'أب',         transliteration: 'ab',         english: 'Father',           category: 'vocab',      level: 'intermediate' },
  { id: 'fm-002', arabic: 'أم',         transliteration: 'umm',        english: 'Mother',           category: 'vocab',      level: 'intermediate' },
  { id: 'fm-003', arabic: 'أخ',         transliteration: 'akh',        english: 'Brother',          category: 'vocab',      level: 'intermediate' },
  { id: 'fm-004', arabic: 'أخت',        transliteration: 'ukht',       english: 'Sister',           category: 'vocab',      level: 'intermediate' },
  { id: 'fm-005', arabic: 'يدّي',       transliteration: 'yiddi',      english: 'Grandfather',      category: 'vocab',      level: 'intermediate' },
  { id: 'fm-006', arabic: 'يدّتي',      transliteration: 'yiddati',    english: 'Grandmother',      category: 'vocab',      level: 'intermediate' },
  { id: 'fm-007', arabic: 'عم',         transliteration: 'amm',        english: 'Uncle (paternal)', category: 'vocab',      level: 'intermediate' },
  { id: 'fm-008', arabic: 'خال',        transliteration: 'khaal',      english: 'Uncle (maternal)', category: 'vocab',      level: 'intermediate' },
  { id: 'fm-009', arabic: 'عمة',        transliteration: 'amma',       english: 'Aunt (paternal)',  category: 'vocab',      level: 'intermediate' },
  { id: 'fm-010', arabic: 'خالة',       transliteration: 'khaala',     english: 'Aunt (maternal)',  category: 'vocab',      level: 'intermediate' },
  { id: 'fm-011', arabic: 'زوج',        transliteration: 'zoj',        english: 'Husband',          category: 'vocab',      level: 'intermediate' },
  { id: 'fm-012', arabic: 'زوجة',       transliteration: 'zoja',       english: 'Wife',             category: 'vocab',      level: 'intermediate' },
  { id: 'fm-013', arabic: 'يهال',       transliteration: 'yahaal',     english: 'Children',         category: 'vocab',      level: 'intermediate' },
  { id: 'fm-014', arabic: 'عيال',       transliteration: 'iyaal',      english: 'Kids',             category: 'vocab',      level: 'intermediate' },
];

const time: Phrase[] = [
  { id: 'tm-001', arabic: 'اليوم',      transliteration: 'al-yoom',    english: 'Today',            category: 'vocab',      level: 'intermediate' },
  { id: 'tm-002', arabic: 'أمس',        transliteration: 'ams',        english: 'Yesterday',        category: 'vocab',      level: 'intermediate' },
  { id: 'tm-003', arabic: 'باجر',       transliteration: 'baachir',    english: 'Tomorrow',         category: 'vocab',      level: 'intermediate' },
  { id: 'tm-004', arabic: 'الحين',      transliteration: 'al-heen',    english: 'Now',              category: 'vocab',      level: 'intermediate' },
  { id: 'tm-005', arabic: 'بعدين',      transliteration: 'ba\'dain',   english: 'Later',            category: 'vocab',      level: 'intermediate' },
  { id: 'tm-006', arabic: 'صبح',        transliteration: 'subh',       english: 'Morning',          category: 'vocab',      level: 'intermediate' },
  { id: 'tm-007', arabic: 'ظهر',        transliteration: 'dhuhr',      english: 'Noon',             category: 'vocab',      level: 'intermediate' },
  { id: 'tm-008', arabic: 'عصر',        transliteration: 'asr',        english: 'Afternoon',        category: 'vocab',      level: 'intermediate' },
  { id: 'tm-009', arabic: 'مغرب',       transliteration: 'maghrib',    english: 'Sunset',           category: 'vocab',      level: 'intermediate' },
  { id: 'tm-010', arabic: 'ليل',        transliteration: 'lail',       english: 'Night',            category: 'vocab',      level: 'intermediate' },
  { id: 'tm-011', arabic: 'كم الساعة',  transliteration: 'kam as-sa\'a', english: 'What time is it?', category: 'question', level: 'intermediate' },
  { id: 'tm-012', arabic: 'أسبوع',      transliteration: 'usbu\'',     english: 'Week',             category: 'vocab',      level: 'intermediate' },
  { id: 'tm-013', arabic: 'شهر',        transliteration: 'shahr',      english: 'Month',            category: 'vocab',      level: 'intermediate' },
  { id: 'tm-014', arabic: 'سنة',        transliteration: 'sana',       english: 'Year',             category: 'vocab',      level: 'intermediate' },
];

const shopping: Phrase[] = [
  { id: 'sh-001', arabic: 'كم؟',         transliteration: 'cham?',         english: 'How much?',           category: 'question',   level: 'intermediate' },
  { id: 'sh-002', arabic: 'بكم هذا',     transliteration: 'bikam hatha',   english: 'How much is this?',   category: 'question',   level: 'intermediate' },
  { id: 'sh-003', arabic: 'غالي',        transliteration: 'ghali',         english: 'Expensive',           category: 'response',   level: 'intermediate' },
  { id: 'sh-004', arabic: 'رخيص',        transliteration: 'rakhees',       english: 'Cheap',               category: 'response',   level: 'intermediate' },
  { id: 'sh-005', arabic: 'فلوس',        transliteration: 'floos',         english: 'Money',               category: 'vocab',      level: 'intermediate' },
  { id: 'sh-006', arabic: 'درهم',        transliteration: 'dirham',        english: 'Dirham',              category: 'vocab',      level: 'intermediate' },
  { id: 'sh-007', arabic: 'حق',          transliteration: 'haq',           english: 'For / belongs to',    category: 'expression', level: 'intermediate' },
  { id: 'sh-008', arabic: 'ممكن خصم',    transliteration: 'mumkin khasm',  english: 'Can I get a discount?', category: 'question', level: 'intermediate' },
  { id: 'sh-009', arabic: 'أبا أشتري',   transliteration: 'aba ashtri',    english: 'I want to buy',       category: 'expression', level: 'intermediate' },
  { id: 'sh-010', arabic: 'وين الكاشير', transliteration: 'wain al-cashier', english: 'Where is the cashier?', category: 'question', level: 'intermediate' },
  { id: 'sh-011', arabic: 'فاتورة',      transliteration: 'fatoora',       english: 'Bill / Invoice',      category: 'vocab',      level: 'intermediate' },
  { id: 'sh-012', arabic: 'كيس',         transliteration: 'chees',         english: 'Bag',                 category: 'vocab',      level: 'intermediate' },
];

const directions: Phrase[] = [
  { id: 'dr-001', arabic: 'وين',          transliteration: 'wain',          english: 'Where',                category: 'question',   level: 'intermediate' },
  { id: 'dr-002', arabic: 'يمين',         transliteration: 'yameen',        english: 'Right',                category: 'vocab',      level: 'intermediate' },
  { id: 'dr-003', arabic: 'يسار',         transliteration: 'yasaar',        english: 'Left',                 category: 'vocab',      level: 'intermediate' },
  { id: 'dr-004', arabic: 'سيدة',         transliteration: 'seeda',         english: 'Straight',             category: 'vocab',      level: 'intermediate' },
  { id: 'dr-005', arabic: 'قريب',         transliteration: 'qareeb',        english: 'Near',                 category: 'vocab',      level: 'intermediate' },
  { id: 'dr-006', arabic: 'بعيد',         transliteration: 'ba\'eed',       english: 'Far',                  category: 'vocab',      level: 'intermediate' },
  { id: 'dr-007', arabic: 'هني',          transliteration: 'hni',           english: 'Here',                 category: 'vocab',      level: 'intermediate' },
  { id: 'dr-008', arabic: 'هناك',         transliteration: 'hnaak',         english: 'There',                category: 'vocab',      level: 'intermediate' },
  { id: 'dr-009', arabic: 'كيف أوصل',     transliteration: 'kaif awsal',    english: 'How do I get to',      category: 'question',   level: 'intermediate' },
  { id: 'dr-010', arabic: 'شارع',         transliteration: 'shari\'',       english: 'Street',               category: 'vocab',      level: 'intermediate' },
  { id: 'dr-011', arabic: 'إشارة',        transliteration: 'ishara',        english: 'Traffic light',        category: 'vocab',      level: 'intermediate' },
  { id: 'dr-012', arabic: 'دوار',         transliteration: 'duwwaar',       english: 'Roundabout',           category: 'vocab',      level: 'intermediate' },
  { id: 'dr-013', arabic: 'وسط المدينة',  transliteration: 'wasat al-madeena', english: 'Downtown',          category: 'vocab',      level: 'intermediate' },
];

const work: Phrase[] = [
  { id: 'wk-001', arabic: 'شغل',         transliteration: 'shughl',         english: 'Work / Job',           category: 'vocab',      level: 'intermediate' },
  { id: 'wk-002', arabic: 'مكتب',        transliteration: 'maktab',         english: 'Office',               category: 'vocab',      level: 'intermediate' },
  { id: 'wk-003', arabic: 'اجتماع',      transliteration: 'ijtimaa\'',      english: 'Meeting',              category: 'vocab',      level: 'intermediate' },
  { id: 'wk-004', arabic: 'مدير',        transliteration: 'mudeer',         english: 'Manager',              category: 'vocab',      level: 'intermediate' },
  { id: 'wk-005', arabic: 'موظف',        transliteration: 'muwadhaf',       english: 'Employee',             category: 'vocab',      level: 'intermediate' },
  { id: 'wk-006', arabic: 'مشروع',       transliteration: 'mashroo\'',      english: 'Project',              category: 'vocab',      level: 'intermediate' },
  { id: 'wk-007', arabic: 'موعد',        transliteration: 'maw\'id',        english: 'Appointment',          category: 'vocab',      level: 'intermediate' },
  { id: 'wk-008', arabic: 'مشغول',       transliteration: 'mashghool',      english: 'Busy',                 category: 'response',   level: 'intermediate' },
  { id: 'wk-009', arabic: 'فاضي',        transliteration: 'faadhi',         english: 'Free / not busy',      category: 'response',   level: 'intermediate' },
  { id: 'wk-010', arabic: 'متى نلتقي',   transliteration: 'mata niltigi',   english: 'When do we meet?',     category: 'question',   level: 'intermediate' },
];

const weather: Phrase[] = [
  { id: 'we-001', arabic: 'حار',         transliteration: 'haar',           english: 'Hot',                  category: 'response',   level: 'intermediate' },
  { id: 'we-002', arabic: 'بارد',        transliteration: 'baarid',         english: 'Cold',                 category: 'response',   level: 'intermediate' },
  { id: 'we-003', arabic: 'مطر',         transliteration: 'matar',          english: 'Rain',                 category: 'vocab',      level: 'intermediate' },
  { id: 'we-004', arabic: 'شمس',         transliteration: 'shams',          english: 'Sun',                  category: 'vocab',      level: 'intermediate' },
  { id: 'we-005', arabic: 'ريح',         transliteration: 'reeh',           english: 'Wind',                 category: 'vocab',      level: 'intermediate' },
  { id: 'we-006', arabic: 'رطوبة',       transliteration: 'rutoba',         english: 'Humidity',             category: 'vocab',      level: 'intermediate' },
  { id: 'we-007', arabic: 'الجو حلو',    transliteration: 'al-jaw hilu',    english: 'The weather is nice',  category: 'expression', level: 'intermediate' },
  { id: 'we-008', arabic: 'وايد حار',    transliteration: 'wayid haar',     english: 'Very hot',             category: 'expression', level: 'intermediate' },
];

const emotions: Phrase[] = [
  { id: 'em-001', arabic: 'فرحان',       transliteration: 'farhaan',        english: 'Happy (m)',            category: 'response',   level: 'intermediate' },
  { id: 'em-002', arabic: 'فرحانة',      transliteration: 'farhaana',       english: 'Happy (f)',            category: 'response',   level: 'intermediate' },
  { id: 'em-003', arabic: 'زعلان',       transliteration: 'za\'laan',       english: 'Sad / upset (m)',      category: 'response',   level: 'intermediate' },
  { id: 'em-004', arabic: 'تعبان',       transliteration: 'ta\'baan',       english: 'Tired (m)',            category: 'response',   level: 'intermediate' },
  { id: 'em-005', arabic: 'مرتاح',       transliteration: 'murtaah',        english: 'Relaxed (m)',          category: 'response',   level: 'intermediate' },
  { id: 'em-006', arabic: 'خايف',        transliteration: 'khaayif',        english: 'Scared (m)',           category: 'response',   level: 'intermediate' },
  { id: 'em-007', arabic: 'متحمس',       transliteration: 'mithahmis',      english: 'Excited (m)',          category: 'response',   level: 'intermediate' },
  { id: 'em-008', arabic: 'ممل',         transliteration: 'mumill',         english: 'Boring',               category: 'response',   level: 'intermediate' },
  { id: 'em-009', arabic: 'حلو',         transliteration: 'hilu',           english: 'Nice / sweet',         category: 'response',   level: 'intermediate' },
  { id: 'em-010', arabic: 'وايد زين',    transliteration: 'wayid zain',     english: 'Very good',            category: 'response',   level: 'intermediate' },
];

/* ─────────────────────────────────────────────────────────
   EXPERT
   ───────────────────────────────────────────────────────── */

const idioms: Phrase[] = [
  { id: 'id-001', arabic: 'إن شاء الله',     transliteration: 'inshallah',         english: 'God willing',                       category: 'expression', level: 'expert' },
  { id: 'id-002', arabic: 'ما شاء الله',     transliteration: 'mashallah',         english: 'What God has willed (admiration)',  category: 'expression', level: 'expert' },
  { id: 'id-003', arabic: 'الله يبارك فيك',  transliteration: 'allah ybarik feek', english: 'May God bless you',                 category: 'expression', level: 'expert' },
  { id: 'id-004', arabic: 'يعطيك العافية',   transliteration: 'yaatik al-afya',    english: 'God give you health',               category: 'expression', level: 'expert' },
  { id: 'id-005', arabic: 'حياك الله',       transliteration: 'hayyak allah',      english: 'God grant you life (welcome)',      category: 'expression', level: 'expert' },
  { id: 'id-006', arabic: 'يلّا',            transliteration: 'yalla',             english: "Let's go / hurry up",               category: 'expression', level: 'expert' },
  { id: 'id-007', arabic: 'ولا يهمك',        transliteration: 'wala yhimmak',      english: "Don't worry about it",              category: 'expression', level: 'expert' },
  { id: 'id-008', arabic: 'ما عليه',         transliteration: 'ma alayh',          english: "It's okay / no problem",            category: 'expression', level: 'expert' },
  { id: 'id-009', arabic: 'الله كريم',       transliteration: 'allah kareem',      english: 'God is generous (it will work out)',category: 'expression', level: 'expert' },
  { id: 'id-010', arabic: 'على راسي',        transliteration: 'ala raasi',         english: 'On my head (gladly)',               category: 'expression', level: 'expert' },
  { id: 'id-011', arabic: 'أمرك',            transliteration: 'amrak',             english: 'Your command (at your service)',    category: 'expression', level: 'expert' },
  { id: 'id-012', arabic: 'تمام',            transliteration: 'tamaam',            english: 'Perfect / All good',                category: 'response',   level: 'expert' },
  { id: 'id-013', arabic: 'بيش الحال',       transliteration: 'bish al-haal',      english: 'How is it going?',                  category: 'question',   level: 'expert' },
  { id: 'id-014', arabic: 'الحمدلله على السلامة', transliteration: 'al-hamdulillah ala as-salama', english: 'Thank God for your safety', category: 'expression', level: 'expert' },
  { id: 'id-015', arabic: 'فدوة',            transliteration: 'fadwa',             english: '(Term of endearment)',              category: 'expression', level: 'expert' },
];

const conversation: Phrase[] = [
  { id: 'cv-001', arabic: 'شو رايك',          transliteration: 'shoo raayak',          english: 'What do you think?',           category: 'question',   level: 'expert' },
  { id: 'cv-002', arabic: 'بصراحة',           transliteration: 'b-saraaha',            english: 'Honestly',                     category: 'expression', level: 'expert' },
  { id: 'cv-003', arabic: 'يمكن',             transliteration: 'yimkin',               english: 'Maybe / perhaps',              category: 'response',   level: 'expert' },
  { id: 'cv-004', arabic: 'أكيد',             transliteration: 'akeed',                english: 'Sure / definitely',            category: 'response',   level: 'expert' },
  { id: 'cv-005', arabic: 'أبدا',             transliteration: 'abadan',               english: 'Never / not at all',           category: 'response',   level: 'expert' },
  { id: 'cv-006', arabic: 'يعني',             transliteration: 'ya\'ni',               english: 'I mean / sort of',             category: 'expression', level: 'expert' },
  { id: 'cv-007', arabic: 'على فكرة',         transliteration: 'ala fikra',            english: 'By the way',                   category: 'expression', level: 'expert' },
  { id: 'cv-008', arabic: 'قصدي',             transliteration: 'qasdi',                english: 'I mean (clarifying)',          category: 'expression', level: 'expert' },
  { id: 'cv-009', arabic: 'وش قصدك',          transliteration: 'wash qasdak',          english: 'What do you mean?',            category: 'question',   level: 'expert' },
  { id: 'cv-010', arabic: 'مو شرط',           transliteration: 'mu shart',             english: 'Not necessarily',              category: 'response',   level: 'expert' },
  { id: 'cv-011', arabic: 'بالضبط',           transliteration: 'b-adh-dhabt',          english: 'Exactly',                      category: 'response',   level: 'expert' },
  { id: 'cv-012', arabic: 'بالعكس',           transliteration: 'b-al-aks',             english: 'On the contrary',              category: 'response',   level: 'expert' },
  { id: 'cv-013', arabic: 'لازم',             transliteration: 'laazim',               english: 'Must / have to',               category: 'expression', level: 'expert' },
  { id: 'cv-014', arabic: 'مستحيل',           transliteration: 'mistaheel',            english: 'Impossible',                   category: 'response',   level: 'expert' },
];

const travel: Phrase[] = [
  { id: 'tr-001', arabic: 'مطار',           transliteration: 'mataar',           english: 'Airport',              category: 'vocab',      level: 'expert' },
  { id: 'tr-002', arabic: 'تذكرة',          transliteration: 'tadhkara',         english: 'Ticket',               category: 'vocab',      level: 'expert' },
  { id: 'tr-003', arabic: 'جواز سفر',       transliteration: 'jawaaz safar',     english: 'Passport',             category: 'vocab',      level: 'expert' },
  { id: 'tr-004', arabic: 'حقيبة',          transliteration: 'haqeeba',          english: 'Suitcase',             category: 'vocab',      level: 'expert' },
  { id: 'tr-005', arabic: 'فندق',           transliteration: 'funduq',           english: 'Hotel',                category: 'vocab',      level: 'expert' },
  { id: 'tr-006', arabic: 'حجز',            transliteration: 'hajz',             english: 'Reservation',          category: 'vocab',      level: 'expert' },
  { id: 'tr-007', arabic: 'وين السفارة',    transliteration: 'wain as-safara',   english: 'Where is the embassy?', category: 'question',  level: 'expert' },
  { id: 'tr-008', arabic: 'تأشيرة',         transliteration: 'ta\'sheera',       english: 'Visa',                 category: 'vocab',      level: 'expert' },
  { id: 'tr-009', arabic: 'متى الطيارة',    transliteration: 'mata at-tayyaara', english: 'When is the flight?',  category: 'question',   level: 'expert' },
  { id: 'tr-010', arabic: 'تأخر',           transliteration: 'ta\'akhar',        english: 'Delayed',              category: 'response',   level: 'expert' },
];

const culture: Phrase[] = [
  { id: 'cl-001', arabic: 'كم خوك',           transliteration: 'cham khook',           english: 'How many brothers do you have?',         category: 'question',   level: 'expert' },
  { id: 'cl-002', arabic: 'الله يطول عمرك',   transliteration: 'allah ytawwil umrak',  english: 'May God lengthen your life',             category: 'expression', level: 'expert' },
  { id: 'cl-003', arabic: 'تستاهل الخير',     transliteration: 'tistahil al-khair',     english: 'You deserve good',                       category: 'expression', level: 'expert' },
  { id: 'cl-004', arabic: 'الله يوفقك',       transliteration: 'allah ywafqak',         english: 'May God grant you success',              category: 'expression', level: 'expert' },
  { id: 'cl-005', arabic: 'سلم لي على الأهل', transliteration: 'sallim li ala al-ahl',  english: 'Give my regards to the family',          category: 'expression', level: 'expert' },
  { id: 'cl-006', arabic: 'نوّرتنا',          transliteration: 'nawwartna',             english: 'You lit up our place (welcome guest)',   category: 'expression', level: 'expert' },
  { id: 'cl-007', arabic: 'هذا واجبنا',       transliteration: 'hatha wajibna',         english: "This is our duty (you're welcome)",      category: 'expression', level: 'expert' },
  { id: 'cl-008', arabic: 'إجلس عندنا',       transliteration: 'iglis ‘andana',         english: 'Sit with us',                            category: 'expression', level: 'expert' },
  { id: 'cl-009', arabic: 'البيت بيتك',       transliteration: 'al-bait baitak',        english: 'My home is your home',                   category: 'expression', level: 'expert' },
  { id: 'cl-010', arabic: 'تفضل عندنا قهوة',  transliteration: 'tafadhal ‘andana gahwa', english: 'Please join us for coffee',             category: 'expression', level: 'expert' },
];

/* ─────────────────────────────────────────────────────────
   PUBLIC API
   ───────────────────────────────────────────────────────── */

export const phraseThemes: PhraseTheme[] = [
  // Beginner
  { id: 'theme-greetings', title: 'Greetings & Politeness', emoji: '👋', level: 'beginner',     phrases: greetings },
  { id: 'theme-people',    title: 'People & Self-Intro',    emoji: '🧑', level: 'beginner',     phrases: people },
  { id: 'theme-numbers',   title: 'Numbers',                emoji: '🔢', level: 'beginner',     phrases: numbers },
  { id: 'theme-food',      title: 'Food & Drink',           emoji: '🍽️', level: 'beginner',     phrases: food },
  { id: 'theme-verbs',     title: 'Basic Verbs & Words',    emoji: '🔁', level: 'beginner',     phrases: verbsBasic },

  // Intermediate
  { id: 'theme-family',    title: 'Family',                 emoji: '👨‍👩‍👧', level: 'intermediate', phrases: family },
  { id: 'theme-time',      title: 'Time & Days',            emoji: '⏰', level: 'intermediate', phrases: time },
  { id: 'theme-shopping',  title: 'Shopping & Money',       emoji: '🛍️', level: 'intermediate', phrases: shopping },
  { id: 'theme-directions',title: 'Directions',             emoji: '🧭', level: 'intermediate', phrases: directions },
  { id: 'theme-work',      title: 'Work & Office',          emoji: '💼', level: 'intermediate', phrases: work },
  { id: 'theme-weather',   title: 'Weather',                emoji: '☀️', level: 'intermediate', phrases: weather },
  { id: 'theme-emotions',  title: 'Emotions',               emoji: '💛', level: 'intermediate', phrases: emotions },

  // Expert
  { id: 'theme-idioms',    title: 'Idioms & Expressions',   emoji: '💬', level: 'expert',       phrases: idioms },
  { id: 'theme-conversation', title: 'Conversation Connectors', emoji: '🗣️', level: 'expert', phrases: conversation },
  { id: 'theme-travel',    title: 'Travel',                 emoji: '✈️', level: 'expert',       phrases: travel },
  { id: 'theme-culture',   title: 'Cultural Expressions',   emoji: '🕌', level: 'expert',       phrases: culture },
];

/** Flat list of every phrase across every theme. */
export const allPhrases: Phrase[] = phraseThemes.flatMap((t) => t.phrases);

/** Filter phrases for a single level. */
export function phrasesForLevel(level: Level): Phrase[] {
  return allPhrases.filter((p) => p.level === level);
}

/** Themes that belong to a single level. */
export function themesForLevel(level: Level): PhraseTheme[] {
  return phraseThemes.filter((t) => t.level === level);
}