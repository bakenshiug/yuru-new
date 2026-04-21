import type { NewsItem } from "@/lib/types";
import { generateNews } from "@/lib/llm";
import { getCached, setCached } from "@/lib/cache";

const SITE_URL = "https://yuru-new.vercel.app";
const SITE_TITLE = "ゆるニュー電子版";
const SITE_DESCRIPTION = "世界一どうでもいいニュースを、最高に真面目にお届けします。";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRSSDate(iso: string): string {
  try {
    return new Date(iso).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

async function getAllItems(): Promise<NewsItem[]> {
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

  return [...real, ...fake].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function renderItem(item: NewsItem): string {
  const tweetBody = `${item.headline}\n\n${item.body}`.slice(0, 220);
  return `    <item>
      <title>${escapeXml(item.headline)}</title>
      <description>${escapeXml(tweetBody)}</description>
      <link>${SITE_URL}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${toRSSDate(item.publishedAt)}</pubDate>
      <category>${escapeXml(item.mainCategory)}</category>
    </item>`;
}

export async function GET() {
  const items = await getAllItems();
  const rssItems = items.slice(0, 20).map(renderItem).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <link>${SITE_URL}</link>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
