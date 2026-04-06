/**
 * UAE Radio stations — curated list for the Radio tab
 * 3 verified working streams covering Quran, News, and Music
 */

export interface RadioStation {
  id: string;
  name: string;
  nameAr: string;
  frequency?: string;
  category: 'quran' | 'news' | 'music';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  streamUrl: string;
  description: string;
  emoji: string;
  color: string;
}

export const radioStations: RadioStation[] = [
  {
    id: 'quran-kareem',
    name: 'Quran Radio',
    nameAr: 'إذاعة القرآن الكريم',
    category: 'quran',
    difficulty: 'intermediate',
    streamUrl: 'https://Qurango.net/radio/tarateel',
    description: 'Clear Quranic recitation — perfect for training your ear to formal Arabic pronunciation.',
    emoji: '📖',
    color: '#059669',
  },
  {
    id: 'sky-news-arabia',
    name: 'Sky News Arabia',
    nameAr: 'سكاي نيوز عربية',
    frequency: 'News',
    category: 'news',
    difficulty: 'advanced',
    streamUrl: 'https://radio.skynewsarabia.com/stream/radio/skynewsarabia',
    description: '24/7 Arabic news covering the UAE and the Middle East.',
    emoji: '🇦🇪',
    color: '#2563EB',
  },
  {
    id: 'monte-carlo',
    name: 'Monte Carlo Arabic',
    nameAr: 'مونت كارلو الدولية',
    frequency: 'Music & Talk',
    category: 'music',
    difficulty: 'beginner',
    streamUrl: 'https://montecarlodoualiya128k.ice.infomaniak.ch/mc-doualiya.mp3',
    description: 'A great mix of Arabic music and light discussions — beginner-friendly.',
    emoji: '🎵',
    color: '#A855F7',
  },
];

export const DIFFICULTY_LABELS = {
  beginner: { label: 'Beginner-Friendly', emoji: '🟢', color: '#16A34A' },
  intermediate: { label: 'Intermediate', emoji: '🟡', color: '#D97706' },
  advanced: { label: 'Advanced', emoji: '🔴', color: '#DC2626' },
} as const;

export const TOTAL_STATIONS = radioStations.length;
