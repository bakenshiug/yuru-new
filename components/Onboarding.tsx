"use client";

import { useState } from "react";
import { MAIN_CATEGORIES, type MainCategory, type UserProfile } from "@/lib/types";
import { saveProfile } from "@/lib/profile";
import { Button } from "@/components/ui/button";

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export function Onboarding({ onComplete }: Props) {
  const [selected, setSelected] = useState<Set<MainCategory>>(new Set());

  const toggle = (cat: MainCategory) => {
    const next = new Set(selected);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelected(next);
  };

  const canProceed = selected.size >= 1 && selected.size <= 5;

  const handleSubmit = () => {
    const profile: UserProfile = {
      interests: Array.from(selected),
    };
    saveProfile(profile);
    onComplete(profile);
  };

  return (
    <div className="bg-white border border-stone-300 rounded-sm p-6 md:p-8">
      <div className="mb-6 pb-6 border-b border-stone-200">
        <p className="text-[10px] text-stone-500 tracking-widest font-[family-name:var(--font-sans-jp)] mb-2">
          FIRST SETUP — 初期設定
        </p>
        <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-serif-jp)] text-stone-900 mb-3">
          あなたの興味を教えてください
        </h2>
        <p className="text-xs text-stone-600 font-[family-name:var(--font-sans-jp)] leading-relaxed">
          ※ 当紙は、お選びいただいたカテゴリ<strong className="text-stone-900">以外</strong>のニュースのみを配信いたします。<br />
          あなたに一切関係ない情報だけをお届けする、それが当紙の役割です。
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-bold font-[family-name:var(--font-serif-jp)] text-stone-800 mb-3">
          興味のあるカテゴリ <span className="text-xs font-normal text-stone-500 font-[family-name:var(--font-sans-jp)]">（1〜5個選択）</span>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MAIN_CATEGORIES.map((cat) => {
            const isSelected = selected.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                className={`px-3 py-4 text-sm font-[family-name:var(--font-sans-jp)] border rounded-sm transition-all text-left ${
                  isSelected
                    ? "border-stone-900 bg-stone-900 text-stone-50 font-bold"
                    : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-stone-200">
        <p className="text-xs text-stone-500 font-[family-name:var(--font-sans-jp)]">
          選択中: <span className="font-bold text-stone-800">{selected.size}</span> / 5
        </p>
        <Button
          onClick={handleSubmit}
          disabled={!canProceed}
          className="bg-stone-900 hover:bg-stone-700 text-stone-50 font-[family-name:var(--font-sans-jp)] rounded-sm px-6 disabled:opacity-40"
        >
          発行開始
        </Button>
      </div>

      <p className="text-center text-[10px] text-stone-400 font-[family-name:var(--font-sans-jp)] mt-6 italic">
        ※ 設定はあとから変更できます
      </p>
    </div>
  );
}
