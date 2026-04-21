import type { NewsItem } from "@/lib/types";
import { generateNews } from "@/lib/llm";
import { getCached, setCached } from "@/lib/cache";

const CACHE_KEY = "news:real";

const dummyFallback: NewsItem[] = [
  {
    id: "r-001",
    headline: "【独占】国会中継、議員の後方に映り込んだ観葉植物の葉が2枚黄ばんでいた",
    body: "21日午後、衆議院本会議場の映像に映り込んだ議長席裏のパキラの葉のうち下から3枚目と5枚目が黄色く変色していたことが判明した。法案の行方より重要な事実である可能性は低い。",
    yuruScore: 97,
    category: "政治の片隅",
    mainCategory: "政治・経済",
    source: "国会中継映像",
    sourceUrl: "https://example.com/diet-livestream",
    publishedAt: "2026-04-21T14:32:00+09:00",
  },
  {
    id: "r-002",
    headline: "【気象】台風接近報道中、キャスターの襟元に小さな糸くず付着を確認",
    body: "夕方のニュース番組で台風の進路を解説中の気象予報士のジャケット左襟に、白い糸くずと思われる繊維が付着していたことが、視聴者より本紙に寄せられた情報で判明した。",
    yuruScore: 93,
    category: "メディア観察",
    mainCategory: "エンタメ・芸能",
    source: "夕方ニュース",
    sourceUrl: "https://example.com/weather-news",
    publishedAt: "2026-04-21T18:45:00+09:00",
  },
];

export async function GET() {
  const cached = getCached<NewsItem[]>(CACHE_KEY);
  if (cached) {
    return Response.json({ items: cached, generated: true, cached: true });
  }
  try {
    const items = await generateNews("real");
    if (items.length === 0) throw new Error("空の配列");
    setCached(CACHE_KEY, items);
    return Response.json({ items, generated: true, cached: false });
  } catch (error) {
    console.error("[api/news/real] LLM失敗、ダミーにフォールバック:", error);
    return Response.json({ items: dummyFallback, generated: false, cached: false });
  }
}
