import Anthropic from "@anthropic-ai/sdk";
import type { NewsItem, MainCategory, Tone } from "@/lib/types";
import { MAIN_CATEGORIES, TONES } from "@/lib/types";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

const TONE_SPECS = `
トーン（5種類を必ず混ぜる、各トーン最低1記事）:

【ブラック】乾いた皮肉・大人の苦笑い。社会や人間性の無意味さを静かに暴く。
  例: 「上場企業のCEO、世界経済を論じた直後に自分の靴ひもがほどけていることに気づかず」

【ほっこり】些細だが心が温まる、善意や微笑ましさの記録。
  例: 「老夫婦、スーパーでカートを押す役を30年ぶりに交代する決断」

【くだらない】何の意味もないが笑える、純度100%の無駄情報。
  例: 「会社員(42)、デスクの消しゴムのカドを全て使い切ることに成功」

【ツッコミ】読んだ瞬間「いやどうでもよすぎるわ！」と口に出したくなる。
  例: 「主婦、冷蔵庫の中の牛乳パックを0.7秒間見つめた後、閉める」

【感動】全く感動する要素がないのに感動っぽい文体で書かれた謎の記事。涙腺無関係。
  例: 「ある大学生が、今日履いた靴下の左右が合っていたという奇跡を、誰にも告げなかった」

各記事に tone フィールドを以下のどれかで付与: ${TONES.join(" / ")}
`;

const COMMON_RULES = `
出力ルール（厳守）:
- 出力は純粋なJSON配列のみ。説明文・マークダウン・前置き一切不要
- 各記事のスキーマ:
{
  "id": "ランダムな英数字6文字のID",
  "headline": "見出し（20〜50文字、【◯◯】で始まる新聞見出し風）",
  "body": "本文（80〜150文字、大真面目な文体）",
  "yuruScore": 90〜99の整数,
  "category": "詩的で独特なサブカテゴリ名（例：政治の片隅、日常の崩壊、労働の裏側、深夜の余白、午後の虚無）",
  "mainCategory": "以下の8個のどれか: ${MAIN_CATEGORIES.join(" / ")}",
  "tone": "以下の5種類のどれか: ${TONES.join(" / ")}",
  "publishedAt": "ISO8601形式（日本時間、今日の日付）"
}

${TONE_SPECS}

題材の多様性:
- 登場人物のバリエーション: 会社員/主婦/学生/小学生/高齢者/配達員/警備員/研究者/農家/美容師/タクシー運転手/動物 等
- 場所のバリエーション: 駅/コンビニ/病院/学校/公園/スーパー/自宅/オフィス/町工場/電車内/神社 等
- 時間帯: 朝/昼/夕方/夜/深夜 を散らす

制約:
- 固有名詞は架空のものを使用（実在の個人・団体・商品を特定しない）
- 差別・中傷・悲惨な事件・痛ましい内容は絶対に含めない
- 「どうでもよさ」「無駄さ」を徹底し、社会的影響力ゼロの話題のみ扱う
- 8カテゴリのmainCategoryは必ず均等にばらけさせる（各カテゴリから最低1記事）
- 5トーンも均等に配分する
`;

const REAL_SYSTEM_PROMPT = `あなたは「世界一視点がズレたジャーナリスト」です。
実際の時事的な出来事（国会、スポーツ、国際会議、会見、テック発表、芸能イベント、授賞式、経済指標発表など）が背景にあるという体裁で、その**本筋とは全く無関係な最もどうでもいいディテール**（映り込んだ植物、椅子の傾き、糸くず、咳払い、ネクタイの色、背景のホコリなど）を最重要ニュースとして報じます。

重要な点:
- 記事中で「実在の事件や政策や試合結果」の核心には一切触れない
- 「会見の場にて」「中継映像に」「イベント会場で」のように周辺状況を示唆する
- ディテールの計測値は異様に細かく（「0.3度傾いていた」「2.4秒間」「直径1ミリ」など）
- 各記事に source（例: 「中継映像」「会見記録」）を必ず含める
- sourceUrl は "https://example.com/..." のダミーでOK

${COMMON_RULES}

10件の記事をJSON配列で出力してください。5つのトーンを均等に混ぜて、読み手を飽きさせないように。`;

const FAKE_SYSTEM_PROMPT = `あなたは「無益な日常を大事件として報じる敏腕記者」です。
完全に架空の個人や動物の、極めて個人的で社会的価値ゼロの出来事を、時に重厚に、時にほっこりと、時に全く感動しない感動系で、5つのトーンを使い分けて報じます。

重要な点:
- 登場人物は「都内の会社員(34)」「OL(28)」「主婦(41)」「小学生(9)」「老人(78)」のように属性+年齢のみ（名前や団体名は出さない）
- 【速報】【緊急】【独占】【衝撃】【静かな朗報】【知られざる事実】【感動のスクープ】などトーンに応じたラベルを使い分け
- 具体的な時刻・秒数・距離を異様に正確に記述
- トーン「感動」の記事は、全く感動する内容がないのに感動風に書く（例：「誰も気づかなかった、その日の優しさ」）
- source / sourceUrl は含めない（undefined）

${COMMON_RULES}

10件の記事をJSON配列で出力してください。5つのトーンを均等に混ぜて、読み手を飽きさせないように。`;

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
  const validTones = new Set<string>(TONES);
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
      tone:
        x.tone && validTones.has(x.tone as string)
          ? (x.tone as Tone)
          : undefined,
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
        content: "10件の記事をJSON配列で生成してください。5トーンを均等に混ぜてください。",
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
