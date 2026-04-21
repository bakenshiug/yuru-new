"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MAIN_CATEGORIES, type NewsItem, type Tone, type UserProfile } from "@/lib/types";

const TONE_STYLES: Record<Tone, string> = {
  "ブラック": "bg-stone-900 text-stone-50 border-stone-900",
  "ほっこり": "bg-rose-50 text-rose-800 border-rose-200",
  "くだらない": "bg-amber-50 text-amber-800 border-amber-200",
  "ツッコミ": "bg-sky-50 text-sky-800 border-sky-200",
  "感動": "bg-emerald-50 text-emerald-800 border-emerald-200",
};
import { loadProfile, clearProfile, isUninterested } from "@/lib/profile";
import { Onboarding } from "@/components/Onboarding";

type TabKey = "real" | "fake";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Card className="border-stone-300 bg-white hover:shadow-md transition-shadow rounded-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2 text-xs text-stone-500 font-[family-name:var(--font-sans-jp)]">
          <span className="uppercase tracking-wider">{item.category}</span>
          <span>·</span>
          <span>{formatTime(item.publishedAt)}</span>
          <span>·</span>
          <span className="text-stone-400">[{item.mainCategory}]</span>
        </div>
        <CardTitle className="text-xl md:text-2xl leading-snug font-[family-name:var(--font-serif-jp)] font-bold text-stone-900">
          {item.headline}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[15px] leading-relaxed text-stone-700 font-[family-name:var(--font-serif-jp)]">
          {item.body}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-stone-200">
          <div className="flex items-center gap-2 flex-wrap">
            {item.tone && (
              <span
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold font-[family-name:var(--font-sans-jp)] border rounded-sm ${TONE_STYLES[item.tone]}`}
              >
                {item.tone}
              </span>
            )}
            <Badge variant="outline" className="border-stone-400 text-stone-600 font-[family-name:var(--font-sans-jp)] text-[10px]">
              ゆるスコア {item.yuruScore}
            </Badge>
            {item.source && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2 font-[family-name:var(--font-sans-jp)]"
              >
                元ネタ: {item.source}
              </a>
            )}
          </div>
          <span className="text-[10px] text-stone-400 italic font-[family-name:var(--font-sans-jp)]">
            このニュースから得られる学び：特になし
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card className="border-stone-300 bg-white rounded-sm">
      <CardHeader className="pb-3">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-7 w-full mb-2" />
        <Skeleton className="h-7 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}

function useNews(tab: TabKey) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    fetch(`/api/news/${tab}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { items: NewsItem[] }) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return { items, error };
}

function TabPanel({ tab, profile }: { tab: TabKey; profile: UserProfile }) {
  const { items, error } = useNews(tab);

  if (error) {
    return (
      <div className="py-12 text-center text-stone-500 font-[family-name:var(--font-sans-jp)]">
        読み込みに失敗しました: {error}
      </div>
    );
  }

  if (!items) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const filtered = items.filter((item) =>
    isUninterested(item.mainCategory, profile.interests)
  );

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-stone-300 rounded-sm bg-white">
        <p className="text-sm text-stone-600 font-[family-name:var(--font-serif-jp)]">
          あなたの興味カテゴリを除外した結果、配信可能な記事がありませんでした。
        </p>
        <p className="text-xs text-stone-400 font-[family-name:var(--font-sans-jp)] mt-2 italic">
          ※ 幅広く興味をお持ちのようです
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ExcludedBanner({ profile, onReset }: { profile: UserProfile; onReset: () => void }) {
  const excludedCategories = MAIN_CATEGORIES.filter(
    (cat) => !profile.interests.includes(cat)
  );

  return (
    <div className="mb-6 border-l-4 border-stone-900 bg-stone-100 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-widest text-stone-500 font-[family-name:var(--font-sans-jp)] mb-1">
            本日のお届けカテゴリ（あなたの興味以外）
          </p>
          <p className="text-sm font-[family-name:var(--font-serif-jp)] text-stone-800">
            {excludedCategories.map((c, i) => (
              <span key={c}>
                <span className="font-bold">{c}</span>
                {i < excludedCategories.length - 1 && <span className="text-stone-400 mx-1">／</span>}
              </span>
            ))}
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-[10px] text-stone-500 hover:text-stone-800 underline underline-offset-2 font-[family-name:var(--font-sans-jp)] whitespace-nowrap"
        >
          設定を変更
        </button>
      </div>
    </div>
  );
}

export function NewsFeed() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<TabKey>("real");

  useEffect(() => {
    setProfile(loadProfile());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!profile) {
    return <Onboarding onComplete={(p) => setProfile(p)} />;
  }

  return (
    <>
      <ExcludedBanner
        profile={profile}
        onReset={() => {
          clearProfile();
          setProfile(null);
        }}
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
        <TabsList className="w-full h-11 mb-6 bg-stone-100 border border-stone-300">
          <TabsTrigger value="real" className="text-sm font-[family-name:var(--font-sans-jp)]">
            リアルゆる
          </TabsTrigger>
          <TabsTrigger value="fake" className="text-sm font-[family-name:var(--font-sans-jp)]">
            AIゆる
          </TabsTrigger>
        </TabsList>
        <TabsContent value="real">
          <TabPanel tab="real" profile={profile} />
        </TabsContent>
        <TabsContent value="fake">
          <TabPanel tab="fake" profile={profile} />
        </TabsContent>
      </Tabs>
    </>
  );
}
