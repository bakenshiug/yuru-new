import type { NewsItem } from "@/lib/types";
import { generateNews } from "@/lib/llm";
import { getCached, setCached } from "@/lib/cache";

const CACHE_KEY = "news:fake";

const dummyFallback: NewsItem[] = [
  {
    id: "f-001",
    headline: "【緊急】都内男性(34)、靴下に直径2ミリの穴を発見も履き続ける決断",
    body: "21日朝、都内在住の会社員男性が自宅玄関にて自身の右足靴下の小指部分に小さな穴が空いていることに気づいたものの、通勤時刻の切迫を理由にそのまま着用を続ける決断を下した。",
    yuruScore: 99,
    category: "日常の崩壊",
    mainCategory: "ライフスタイル",
    publishedAt: "2026-04-21T08:17:00+09:00",
  },
  {
    id: "f-002",
    headline: "【独占】犬(ポメラニアン・7歳)、昼寝から3回目の覚醒を果たす",
    body: "本日午後、都内マンションのリビングにて、ポメラニアンの「ポコ」(7歳)が通算3回目の昼寝覚醒を記録した。関係者は「まだ寝るつもり」との見方を示している。",
    yuruScore: 98,
    category: "ペットの現場",
    mainCategory: "ライフスタイル",
    publishedAt: "2026-04-21T15:08:00+09:00",
  },
];

export async function GET() {
  const cached = getCached<NewsItem[]>(CACHE_KEY);
  if (cached) {
    return Response.json({ items: cached, generated: true, cached: true });
  }
  try {
    const items = await generateNews("fake");
    if (items.length === 0) throw new Error("空の配列");
    setCached(CACHE_KEY, items);
    return Response.json({ items, generated: true, cached: false });
  } catch (error) {
    console.error("[api/news/fake] LLM失敗、ダミーにフォールバック:", error);
    return Response.json({ items: dummyFallback, generated: false, cached: false });
  }
}
