/**
 * 닉네임 규칙.
 *
 * 현실 이름을 적도록 유도하지 않는다. 쉼 안에서만 쓰는 이름이다.
 * 같은 규칙을 DB check constraint 에도 걸어 두었다
 * (supabase/migrations/20260826000000_create_profiles.sql).
 */

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;

/** 가입 화면에서 제안하는 이름. 고르기만 해도 끝나게 한다. */
export const NICKNAME_SUGGESTIONS = [
  "조용한구름",
  "느린바람",
  "작은숲",
  "고요한밤",
  "담담한하루",
  "잔잔한파도",
] as const;

/**
 * 막을 표현.
 * 완전한 필터가 아니다 — 명백한 것만 걸러내고, 정교한 검열은 하지 않는다.
 * 익명 서비스에서 과한 필터링은 오탐으로 가입을 막는 쪽이 더 해롭다.
 */
const BLOCKED_PATTERNS: readonly RegExp[] = [
  /씨발|시발|병신|좆|지랄|개새|새끼|꺼져/i,
  /fuck|shit|bitch|asshole|cunt/i,
  /관리자|운영자|admin|administrator|모더레이터|moderator/i,
  /^쉼$|^shim$/i,
];

/**
 * 눈에 보이지 않는 문자로 이름을 위장하거나 레이아웃을 깨는 것을 막는다.
 * zero-width, 양방향 제어(RLO 등), word joiner, 폭 없는 공백들.
 */
const INVISIBLE_CHARS =
  /[​-‏‪-‮⁠-⁯﻿­ㅤᅟᅠ]/;

export type NicknameError =
  | "empty"
  | "too_short"
  | "too_long"
  | "invalid_characters"
  | "blocked";

export interface NicknameValidationResult {
  ok: boolean;
  /** 검증을 통과한 경우 저장에 쓸 값. 항상 trim 된 상태다. */
  value: string;
  error?: NicknameError;
}

/** 사용자에게 보여줄 문구. raw 에러를 그대로 노출하지 않는다. */
export const NICKNAME_ERROR_MESSAGE: Record<NicknameError, string> = {
  empty: "이름을 입력해주세요.",
  too_short: `${NICKNAME_MIN_LENGTH}자 이상으로 지어주세요.`,
  too_long: `${NICKNAME_MAX_LENGTH}자 이하로 지어주세요.`,
  invalid_characters: "사용할 수 없는 문자가 있어요.",
  blocked: "이 이름은 사용할 수 없어요. 다른 이름을 골라주세요.",
};

/**
 * 닉네임을 검증하고 저장할 값을 돌려준다.
 * 서버 액션과 클라이언트 입력 양쪽에서 같은 함수를 쓴다.
 */
export function validateNickname(input: string): NicknameValidationResult {
  // 유니코드 정규화 후 trim. 겉보기에 같은 이름이 다르게 저장되는 것을 줄인다.
  const value = input.normalize("NFC").trim();

  if (value.length === 0) return { ok: false, value, error: "empty" };
  if (INVISIBLE_CHARS.test(value)) {
    return { ok: false, value, error: "invalid_characters" };
  }
  // 한글·이모지를 코드 포인트 단위로 센다. 이모지는 .length 가 2 가 될 수
  // 있어서 [...value] 로 세야 사용자가 보는 글자 수와 맞는다.
  const length = [...value].length;
  if (length < NICKNAME_MIN_LENGTH) {
    return { ok: false, value, error: "too_short" };
  }
  if (length > NICKNAME_MAX_LENGTH) {
    return { ok: false, value, error: "too_long" };
  }
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(value))) {
    return { ok: false, value, error: "blocked" };
  }

  return { ok: true, value };
}
