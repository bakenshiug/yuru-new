export const MAIN_CATEGORIES = [
  "政治・経済",
  "スポーツ",
  "エンタメ・芸能",
  "テクノロジー",
  "グルメ",
  "ライフスタイル",
  "国際",
  "サイエンス",
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

export const TONES = [
  "ブラック",
  "ほっこり",
  "くだらない",
  "ツッコミ",
  "感動",
] as const;

export type Tone = (typeof TONES)[number];

export interface NewsItem {
  id: string;
  headline: string;
  body: string;
  yuruScore: number;
  category: string;
  mainCategory: MainCategory;
  tone?: Tone;
  source?: string;
  sourceUrl?: string;
  publishedAt: string;
}

export interface UserProfile {
  interests: MainCategory[];
  ageRange?: string;
  gender?: string;
  region?: string;
}
