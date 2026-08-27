import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, normalizeForSafety } from "../lib/rest/safety.ts";

/**
 * QA-078 회귀 테스트.
 *
 * Release QA 에서 확인된 우회(글자 사이 공백 / zero-width / 자모 분해)와,
 * 그 수정이 정상 문장을 오탐하지 않는지를 함께 고정한다.
 *
 * 실행: npm test
 */

const HIGH = [
  ["기본형", "죽고 싶다"],
  ["붙여쓰기", "죽고싶어"],
  ["글자마다 공백", "죽 고 싶 다"],
  ["한 칸만 벌림", "죽 고싶다"],
  ["zero-width 삽입", "죽\u200b고 싶다"],
  ["zero-width 여러 개", "자\u200b해\u200b를 생각했어"],
  ["호환 자모", "ㅈㅏ살을 생각했다"],
  ["NFD 분해", "자살".normalize("NFD") + "이 떠올랐다"],
  ["자모 + 공백 혼합", "나 는 자 해 를 했 다"],
  ["양방향 제어문자", "죽고\u202e 싶다"],
  ["soft hyphen", "자\u00ad살"],
  ["영문", "I want to kill myself"],
  ["영문 전각", "ｓｕｉｃｉｄｅ"],
  ["영문 대문자", "SUICIDE"],
  ["방법 표현", "뛰어 내리고 싶어"],
  ["사라지고 싶다", "사라지고 싶어"],
  ["HIGH 가 REVIEW 를 이긴다", "죽고 싶을 만큼 씨발 힘들다"],
] as const;

const REVIEW = [
  ["욕설", "씨발 진짜 힘들다"],
  ["욕설 자모 축약", "ㅅㅂ 진짜 힘들다"],
  ["전화번호", "연락줘 010-1234-5678"],
  ["핸들", "내 인스타 @myhandle 이야"],
  ["링크", "https://example.com 봐줘"],
  ["타인 가해", "죽이고 싶은 사람이 있어"],
  ["애매한 표현 — fail-safe", "이제 살기 싫다"],
  ["애매한 표현 2", "더 이상 못 버티겠어"],
] as const;

const NORMAL = [
  ["일반 피로", "오늘 회사에서 너무 지쳤어요"],
  ["무기력", "그냥 아무것도 하기 싫다"],
  ["괜찮은 날", "오늘은 괜찮았어 :)"],
  ["HTML 문자열", "<script>alert(1)</script>"],
  // 아래 셋이 오탐 방지의 핵심이다. 공백을 전부 지우면 전부 걸린다.
  ["혼자 해결 (자해 오탐 금지)", "오늘은 혼자 해결했다"],
  ["혼자 살고 (자살 오탐 금지)", "그냥 혼자 살고 싶은 날"],
  ["각자 해야 (자해 오탐 금지)", "각자 해야 할 일이 있다"],
  ["이모지", "오늘 하루 🌿 조용했어"],
  ["줄바꿈", "길었다\n하지만 버텼다"],
] as const;

test("HIGH_RISK — 우회 변형 포함", () => {
  for (const [label, input] of HIGH) {
    const r = classify(input);
    assert.equal(r.level, "HIGH_RISK", `${label}: ${JSON.stringify(input)} → ${r.level}`);
    assert.ok(r.matched.length > 0, `${label}: matched 비어 있음`);
  }
});

test("REVIEW — 공개만 막는 표현", () => {
  for (const [label, input] of REVIEW) {
    const r = classify(input);
    assert.equal(r.level, "REVIEW", `${label}: ${JSON.stringify(input)} → ${r.level}`);
  }
});

test("NORMAL — 오탐이 없어야 한다", () => {
  for (const [label, input] of NORMAL) {
    const r = classify(input);
    assert.equal(
      r.level,
      "NORMAL",
      `${label}: ${JSON.stringify(input)} → ${r.level} [${r.matched.join(",")}]`,
    );
  }
});

test("normalizeForSafety 는 원문을 바꾸지 않는다", () => {
  const original = "오늘은  혼자 해결했다";
  const before = original;
  const text = normalizeForSafety(original);

  assert.equal(original, before, "입력 문자열이 변형됐다");
  assert.equal(text.normalized, "오늘은 혼자 해결했다", "공백만 축약돼야 한다");
  assert.equal(text.deobfuscated, text.normalized, "정상 어절은 붙이지 않는다");
});

test("난독화 해제는 한 글자씩 띄운 구간에만 적용된다", () => {
  assert.equal(normalizeForSafety("죽 고 싶 다").deobfuscated, "죽고싶다");
  assert.equal(normalizeForSafety("혼자 해결했다").deobfuscated, "혼자 해결했다");
  assert.equal(normalizeForSafety("오늘 너무 길었다").deobfuscated, "오늘 너무 길었다");
});

test("matched 에 사용자 원문이 들어가지 않는다", () => {
  // 로그로 나가는 값이므로 규칙 id 만 담겨야 한다.
  const r = classify("죽 고 싶 다");
  for (const id of r.matched) {
    assert.match(id, /^[a-z_]+$/, `규칙 id 가 아닌 값: ${id}`);
  }
});
