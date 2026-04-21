import { NewsFeed } from "@/components/NewsFeed";

export default function Home() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekdayStr = ["日", "月", "火", "水", "木", "金", "土"][today.getDay()];

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-[10px] text-stone-500 tracking-widest font-[family-name:var(--font-sans-jp)]">
              THE YURU NEW DIGITAL
            </p>
            <p className="text-[11px] text-stone-600 font-[family-name:var(--font-sans-jp)]">
              {dateStr}（{weekdayStr}曜日）第1号
            </p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-stone-900 font-[family-name:var(--font-serif-jp)]">
            ゆるニュー電子版
          </h1>
          <p className="mt-3 text-xs text-stone-600 font-[family-name:var(--font-serif-jp)] italic">
            世界一どうでもいいニュースを、最高に真面目にお届けします。
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <NewsFeed />
      </main>
      <footer className="border-t border-stone-300 mt-16 py-6">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-2">
          <p className="text-[11px] text-stone-600 font-[family-name:var(--font-sans-jp)]">
            <a
              href="https://x.com/yuru_new"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-stone-900 transition-colors"
            >
              @yuru_new
            </a>
            <span className="text-stone-400 mx-2">·</span>
            <span>毎日3回、どうでもいいニュース配信中</span>
          </p>
          <p className="text-[10px] text-stone-400 font-[family-name:var(--font-sans-jp)] tracking-wider">
            © 2026 ゆるニュー電子版 / 無駄を愛するすべての人へ
          </p>
        </div>
      </footer>
    </div>
  );
}
