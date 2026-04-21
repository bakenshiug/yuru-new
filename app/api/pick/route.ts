import type { NewsItem } from "@/lib/types";
import { generateNews } from "@/lib/llm";
import { getCached, setCached } from "@/lib/cache";

const SITE_URL = "https://yuru-new.vercel.app";

function composeTweet(item: NewsItem): string {
  const footer = `\n\n👉 もっと読む\n${SITE_URL}`;
  const maxBodyLen = 280 - item.headline.length - footer.length - 2;
  const trimmedBody =
    item.body.length > maxBodyLen
      ? item.body.slice(0, Math.max(0, maxBodyLen - 1)) + "…"
      : item.body;
  return `${item.headline}\n\n${trimmedBody}${footer}`;
}

async function pickArticle(): Promise<NewsItem | null> {
  const cachedReal = getCached<NewsItem[]>("news:real");
  const cachedFake = getCached<NewsItem[]>("news:fake");

  const [real, fake] = await Promise.all([
    cachedReal ? Promise.resolve(cachedReal) : generateNews("real").then((items) => {
      setCached("news:real", items);
      return items;
    }).catch(() => [] as NewsItem[]),
    cachedFake ? Promise.resolve(cachedFake) : generateNews("fake").then((items) => {
      setCached("news:fake", items);
      return items;
    }).catch(() => [] as NewsItem[]),
  ]);

  const pool = [...real, ...fake];
  if (pool.length === 0) return null;

  const sorted = [...pool].sort((a, b) => b.yuruScore - a.yuruScore);
  const topN = Math.min(5, sorted.length);
  const idx = Math.floor(Math.random() * topN);
  return sorted[idx];
}

export async function GET() {
  const item = await pickArticle();
  if (!item) {
    return Response.json({ error: "no article available" }, { status: 503 });
  }
  return Response.json({
    item,
    tweet: composeTweet(item),
    siteUrl: SITE_URL,
  });
}
