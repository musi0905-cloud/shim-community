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

// ── 정규화 ────────────────────────────────────────────────────────────
//
// 분류는 원문이 아니라 "비교용 표현" 위에서 한다. 원문은 손대지 않는다.
// 사용자가 쓴 글은 쓴 그대로 저장돼야 하고, 공백을 지운 문자열이 DB 로
// 흘러가서는 안 된다. 그래서 normalizeForSafety() 는 새 문자열을 만들어
// 돌려주기만 하고, 호출부(createPostWithSuggestion)는 원문을 저장한다.

/**
 * 눈에 보이지 않는 문자.
 *
 * zero-width space 하나만 끼워 넣어도 "죽<ZWSP>고 싶다" 가 패턴을 빠져나간다.
 * 폭 없는 공백·결합자, 양방향 제어(RLO 등), 변이 선택자, 한글 채움 문자까지
 * 비교 전에 지운다. (lib/nickname.ts 가 닉네임에 대해 하는 일과 같은 방어를
 * 본문에도 적용하는 것이다.)
 */
const INVISIBLE_CHARS =
  /[­͏؜ᅟᅠ឴឵᠋-᠎​-‏‪-‮⁠-⁤⁪-⁯ㅤ︀-️﻿]/g;

/**
 * "한 글자마다 공백" 난독화 구간.
 *
 * "죽 고 싶 다" 처럼 한 글자 + 공백이 세 번 이상 이어지는 곳만 붙인다.
 * 어절 단위 공백("혼자 해결했다")은 건드리지 않는다 — 전부 지워 버리면
 * "혼자 해결" 이 "혼자해결" 이 되어 '자해' 로 오탐된다.
 */
const SPACED_OUT_RUN = /(?:[가-힣a-z0-9]\s){2,}[가-힣a-z0-9]/g;

/** 분류에만 쓰는 비교용 표현. 저장·표시에는 절대 쓰지 않는다. */
export interface SafetyText {
  /**
   * NFKC + 비표시 문자 제거 + 공백 축약 + 소문자.
   * NFKC 가 분해된 한글(NFD)과 호환 자모("ㅈㅏ살"), 전각 영문("ｓｕｉｃｉｄｅ")을
   * 모두 정규 형태로 합쳐 준다.
   */
  normalized: string;
  /** normalized 에서 위 난독화 구간만 붙인 것. */
  deobfuscated: string;
}

export function normalizeForSafety(content: string): SafetyText {
  // 지우기 → 합치기 → 다시 지우기 순서다. 자모 사이에 ZWSP 가 끼어 있으면
  // 먼저 지워야 NFKC 가 한 글자로 합칠 수 있고, 합치는 과정에서 새로 생긴
  // 채움 문자를 다시 한 번 걷어낸다.
  const normalized = content
    .replace(INVISIBLE_CHARS, "")
    .normalize("NFKC")
    .replace(INVISIBLE_CHARS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const deobfuscated = normalized.replace(SPACED_OUT_RUN, (run) =>
    run.replace(/\s+/g, ""),
  );

  return { normalized, deobfuscated };
}

// ── 규칙 ──────────────────────────────────────────────────────────────

/**
 * 자모 축약 패턴을 만든다.
 *
 * 본문은 normalizeForSafety() 를 거쳐 NFKC 형태가 되므로, 패턴도 같은
 * 정규화를 통과시켜야 코드포인트가 맞는다. 소스에는 사람이 읽을 수 있는
 * 호환 자모로 적어 둔다.
 */
function buildJamoPattern(sources: readonly string[]): RegExp {
  return new RegExp(sources.map((s) => s.normalize("NFKC")).join("|"));
}

interface SafetyPattern {
  id: string;
  re: RegExp;
}

/**
 * 즉각적인 위험 가능성이 있는 표현.
 * 걸리면 일반 Rest 흐름 대신 도움 안내 화면을 먼저 띄우고,
 * 글은 Community 로 내보내지 않는다.
 *
 * 여러 글자로 된 표현에는 글자 사이 공백을 허용한다("죽 고 싶"). 반면
 * '자해'·'자살' 같은 두 글자 표현에는 허용하지 않는다 — "혼자 살고",
 * "각자 해야" 같은 정상 문장과 부딪히기 때문이다. 그런 표현을 한 글자씩
 * 띄어 쓴 경우는 위 deobfuscated 쪽에서 잡는다.
 */
const HIGH_RISK_PATTERNS: readonly SafetyPattern[] = [
  {
    id: "self_harm_ko",
    re: /자해|자살|죽\s*고\s*싶|죽어\s*버리|사라지\s*고\s*싶|목숨을?\s*끊/,
  },
  { id: "method_ko", re: /뛰어\s*내리|목\s*매|약을?\s*모아|번개탄/ },
  { id: "self_harm_en", re: /\b(suicide|kill\s*myself|end\s*my\s*life|self\s*harm)\b/i },
];

/**
 * 곧바로 위험하지는 않지만 공개 Feed 에 그대로 두기 어려운 표현.
 * 본인 흐름은 그대로 두고 Community 공개만 막는다.
 */
const REVIEW_PATTERNS: readonly SafetyPattern[] = [
  { id: "harm_others_ko", re: /죽이고\s*싶|때리고\s*싶|없애\s*버리/ },
  { id: "abuse_ko", re: /씨발|시발|병신|좆|지랄|개새|새끼/ },
  // 자모만 쓴 축약형. NFKC 는 호환 자모(ㅅ U+3145)를 조합용 자모(U+1109)로
  // 바꾸므로, 소스에 읽기 좋은 형태로 적고 같은 정규화를 거쳐 패턴을 만든다.
  // 이렇게 하지 않으면 정규화된 본문과 패턴의 코드포인트가 어긋나 못 잡는다.
  { id: "abuse_jamo", re: buildJamoPattern(["ㅅㅂ", "ㅆㅂ", "ㅄ"]) },
  { id: "abuse_en", re: /\b(fuck|shit|bitch|cunt)\b/i },
  // 연락처·주소는 익명성을 스스로 깨뜨린다. 공개 전에 한 번 걸러 둔다.
  { id: "contact_info", re: /01[016-9][-\s]?\d{3,4}[-\s]?\d{4}|@[a-z0-9_]{3,}|https?:\/\// },
];

/**
 * HIGH_RISK 로 단정하기에는 모자라지만 그냥 두기도 어려운 표현.
 *
 * 여기 걸리면 REVIEW 다 — 도움 안내 화면으로 흐름을 바꾸지는 않고,
 * 공개 Feed 로만 내보내지 않는다. "애매하면 NORMAL 이 아니라 REVIEW" 라는
 * 이 파일의 원칙을 실제로 실행하는 자리다.
 */
const AMBIGUOUS_PATTERNS: readonly SafetyPattern[] = [
  { id: "weak_self_harm", re: /살기\s*싫|살고\s*싶지\s*않|없어지고\s*싶|다\s*끝내고\s*싶/ },
  { id: "weak_hopeless", re: /더\s*이상\s*못\s*버티|버틸\s*수\s*가?\s*없/ },
];

function match(
  patterns: readonly SafetyPattern[],
  text: SafetyText,
): string[] {
  return patterns
    .filter((p) => p.re.test(text.normalized) || p.re.test(text.deobfuscated))
    .map((p) => p.id);
}

/**
 * 글을 분류한다.
 *
 * 원문을 바꾸지 않는다. 비교용 표현 두 벌(정규화본, 난독화 해제본)을 만들어
 * 그 위에서만 규칙을 돌린다.
 *
 * HIGH_RISK 를 먼저 본다. 한 글에 여럿 걸리면 위험한 쪽이 이긴다.
 */
export function classify(content: string): SafetyResult {
  const text = normalizeForSafety(content);

  const high = match(HIGH_RISK_PATTERNS, text);
  if (high.length > 0) return { level: "HIGH_RISK", matched: high };

  const review = match(REVIEW_PATTERNS, text);
  const ambiguous = match(AMBIGUOUS_PATTERNS, text);
  if (review.length > 0 || ambiguous.length > 0) {
    return { level: "REVIEW", matched: [...review, ...ambiguous] };
  }

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
