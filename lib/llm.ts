import Anthropic from "@anthropic-ai/sdk";
import type { NewsItem, MainCategory } from "@/lib/types";
import { MAIN_CATEGORIES } from "@/lib/types";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

const COMMON_RULES = `
出力ルール（厳守）:
- 出力は純粋なJSON配列のみ。説明文・マークダウン・前置き一切不要
- 各記事は以下のスキーマ:
{
  "id": "ランダムな英数字6文字のID",
  "headline": "見出し（20〜50文字、【◯◯】で始まる緊迫感ある新聞見出し風）",
  "body": "本文（80〜150文字、ピューリッツァー賞級の重厚な文体で社会的にどうでもいい内容を大真面目に報じる）",
  "yuruScore": 90〜99の整数,
  "category": "詩的で独特なサブカテゴリ名（例：政治の片隅、日常の崩壊、労働の裏側）",
  "mainCategory": "以下の8個のどれか: ${MAIN_CATEGORIES.join(" / ")}",
  "publishedAt": "ISO8601形式（日本時間、今日の日付）"
}

重要な制約:
- 固有名詞は架空のものを使用（実在の個人・団体・商品を特定しない、職業や属性のみ示唆）
- 差別・中傷・悲惨な内容は絶対に含めない
- 「どうでもよさ」「無駄さ」を徹底し、社会的影響力ゼロの話題のみ扱う
- 8カテゴリのmainCategoryは必ず均等にばらけさせる（各カテゴリから最低1記事）
`;

const REAL_SYSTEM_PROMPT = `あなたは「世界一視点がズレたジャーナリスト」です。
実際の時事的な出来事（国会、スポーツ試合、国際会議、記者会見、テック発表会、芸能イベント、学術授賞、経済指標発表など）が背景にあるという体裁で、その**本筋とは全く無関係な最もどうでもいいディテール**（映り込んだ植物、椅子の傾き、糸くず、咳払い、ネクタイの色、背景のホコリなど）を最重要ニュースとして報じます。

重要な点:
- 記事中で「実在の事件や政策や試合結果」の核心には一切触れない
- 「会見の場にて」「中継映像に」「イベント会場で」のように周辺状況を示唆する
- ディテールの計測値は異様に細かく（「0.3度傾いていた」「2.4秒間」「直径1ミリ」など）
- 各記事に source（例: 「中継映像」「会見記録」）を必ず含める
- sourceUrl は "https://example.com/..." のダミーでOK

${COMMON_RULES}

10件の記事をJSON配列で出力してください。`;

const FAKE_SYSTEM_PROMPT = `あなたは「無益な日常を大事件として報じる敏腕記者」です。
完全に架空の個人の、極めて個人的で社会的価値ゼロの出来事（靴下の穴、3秒ためらう、ガムを6秒噛まない、前髪をなでつける、など）を、ピューリッツァー賞受賞級の重厚で緊迫感ある文体で報じます。

重要な点:
- 登場人物は「都内の会社員(34)」「OL(28)」「主婦(41)」のように属性+年齢のみ（名前や団体名は出さない）
- 【速報】【緊急】【独占】【衝撃】などの無駄に仰々しいラベルを多用
- 具体的な時刻・秒数・距離を異様に正確に記述（「13時07分、約3秒間」など）
- 記事の末尾は「〜への影響は不明」「〜との相関は確認されていない」のような無意味な断言で締める
- source / sourceUrl は含めない（空欄）

${COMMON_RULES}

10件の記事をJSON配列で出力してください。`;

function extractJSON(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("JSON配列が見つかりません");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function validateItems(raw: unknown): NewsItem[] {
  if (!Array.isArray(raw)) throw new Error("配列ではありません");
  const validCategories = new Set<string>(MAIN_CATEGORIES);
  return raw
    .filter(
      (x): x is NewsItem =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as NewsItem).headline === "string" &&
        typeof (x as NewsItem).body === "string" &&
        typeof (x as NewsItem).mainCategory === "string" &&
        validCategories.has((x as NewsItem).mainCategory)
    )
    .map((x) => ({
      ...x,
      id: x.id || Math.random().toString(36).slice(2, 8),
      yuruScore:
        typeof x.yuruScore === "number"
          ? Math.max(90, Math.min(99, Math.round(x.yuruScore)))
          : 95,
      mainCategory: x.mainCategory as MainCategory,
      publishedAt: x.publishedAt || new Date().toISOString(),
    }));
}

export async function generateNews(kind: "real" | "fake"): Promise<NewsItem[]> {
  const systemPrompt = kind === "real" ? REAL_SYSTEM_PROMPT : FAKE_SYSTEM_PROMPT;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: "10件の記事をJSON配列で生成してください。",
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("テキストレスポンスが取得できませんでした");
  }

  const parsed = extractJSON(textBlock.text);
  return validateItems(parsed);
}
