import type { SafetyLevel } from "@/lib/types";

/**
 * Safety 분류.
 *
 * 이건 진단이 아니다. 글의 공개 범위와 다음에 보여줄 화면을 고르기 위한
 * 분류일 뿐이다. `docs/PRODUCT.md` §13 이 정한 경계를 코드로 옮긴 것이다.
 *
 * 지금은 규칙 기반이다. 규칙 기반이라 놓치는 표현이 있다는 걸 전제로,
 * 놓쳤을 때 덜 위험한 쪽으로 기울여 둔다 — 애매하면 REVIEW 로 보낸다.
 * 나중에 AI moderation 으로 바꿀 때 이 파일의 classify() 만 갈아끼우면 된다.
 * (호출부는 SafetyResult 만 알고 구현을 모른다.)
 */

export interface SafetyResult {
  level: SafetyLevel;
  /** 어떤 규칙에 걸렸는지. 사용자에게 보여주지 않고 서버 로그용으로만 쓴다. */
  matched: string[];
}

/**
 * 즉각적인 위험 가능성이 있는 표현.
 * 걸리면 일반 Rest 흐름 대신 도움 안내 화면을 먼저 띄우고,
 * 글은 Community 로 내보내지 않는다.
 */
const HIGH_RISK_PATTERNS: readonly { id: string; re: RegExp }[] = [
  { id: "self_harm_ko", re: /자해|자살|죽고\s*싶|죽어\s*버리|사라지고\s*싶|목숨을?\s*끊/ },
  { id: "method_ko", re: /뛰어내리|목\s*매|약을?\s*모아|번개탄/ },
  { id: "self_harm_en", re: /\b(suicide|kill\s*myself|end\s*my\s*life|self\s*harm)\b/i },
];

/**
 * 곧바로 위험하지는 않지만 공개 Feed 에 그대로 두기 어려운 표현.
 * 본인 흐름은 그대로 두고 Community 공개만 막는다.
 */
const REVIEW_PATTERNS: readonly { id: string; re: RegExp }[] = [
  { id: "harm_others_ko", re: /죽이고\s*싶|때리고\s*싶|없애\s*버리/ },
  { id: "abuse_ko", re: /씨발|시발|병신|좆|지랄|개새|새끼/ },
  { id: "abuse_en", re: /\b(fuck|shit|bitch|cunt)\b/i },
  // 연락처·주소는 익명성을 스스로 깨뜨린다. 공개 전에 한 번 걸러 둔다.
  { id: "contact_info", re: /01[016-9][-\s]?\d{3,4}[-\s]?\d{4}|@[A-Za-z0-9_]{3,}|https?:\/\// },
];

/**
 * 글을 분류한다.
 *
 * HIGH_RISK 를 먼저 본다. 한 글에 둘 다 걸리면 위험한 쪽이 이긴다.
 */
export function classify(content: string): SafetyResult {
  const text = content.normalize("NFC");

  const high = HIGH_RISK_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.id);
  if (high.length > 0) return { level: "HIGH_RISK", matched: high };

  const review = REVIEW_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.id);
  if (review.length > 0) return { level: "REVIEW", matched: review };

  return { level: "NORMAL", matched: [] };
}

/**
 * 고위험일 때 보여줄 안내.
 *
 * 상담을 대신하지 않는다. 진단하지 않는다. 지금 연락할 수 있는 곳을 알려주고,
 * 혼자 있지 않아도 된다는 것만 전한다.
 */
export const HIGH_RISK_GUIDANCE = {
  title: "지금 혼자 견디지 않아도 괜찮아요",
  body:
    "적어주신 마음이 많이 무거워 보여요. 지금 이 순간에는 쉼보다 " +
    "이야기를 들어줄 사람이 먼저일 수 있어요.",
  contacts: [
    { name: "자살예방상담전화", number: "109", note: "24시간, 무료" },
    { name: "정신건강상담전화", number: "1577-0199", note: "24시간" },
    { name: "생명의전화", number: "1588-9191", note: "24시간" },
  ],
  note:
    "쉼은 의료·상담 서비스가 아니에요. 위급하다고 느껴지면 119 로 연락해주세요.",
} as const;
