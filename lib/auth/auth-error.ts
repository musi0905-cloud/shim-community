/**
 * Supabase 인증 실패를 종류별로 나눈다.
 *
 * 예전에는 로그인 실패를 하나로 뭉쳐 전부 "이메일 또는 비밀번호가 맞지
 * 않아요" 로 보여 줬다. 그래서 Supabase 에 아예 닿지 못하는 장애 상황에서도
 * 사용자는 자기 비밀번호를 의심하며 같은 값을 반복해서 넣게 됐다. (QA-019)
 *
 * 여기서 나누는 네 가지:
 *   credentials   이메일/비밀번호가 맞지 않다
 *   account_state 계정은 있으나 상태가 문제다 (예: 이메일 미인증)
 *   transport     Supabase 에 닿지 못했거나 서버가 5xx 를 줬다
 *   rate_limited  너무 잦은 요청
 *   unknown       그 밖의 것 — transport 와 같은 문구로 안내한다
 *
 * 계정 열거(enumeration)는 계속 막는다. "비밀번호가 틀렸다" 와 "그런 계정이
 * 없다" 는 Supabase 에서 똑같이 invalid_credentials 로 오고, 우리도 하나의
 * credentials 로 묶어 같은 문구를 쓴다. 새로 나누는 축은 "사용자 입력 문제냐,
 * 우리 쪽 문제냐" 이지 "그 계정이 있느냐" 가 아니다.
 */

export type AuthFailureKind =
  | "credentials"
  | "account_state"
  | "transport"
  | "rate_limited"
  | "unknown";

/**
 * supabase-js 의 AuthError 를 구조로만 본다.
 *
 * 클래스를 import 하지 않는 이유: 이 모듈을 supabase-js 없이 단위 테스트할 수
 * 있게 두기 위해서다. 필요한 필드는 세 개뿐이다.
 */
export interface AuthErrorLike {
  name?: string;
  status?: number;
  code?: string;
  message?: string;
}

/** 계정 상태 문제로 다뤄야 하는 코드. */
const ACCOUNT_STATE_CODES = new Set([
  "email_not_confirmed",
  "phone_not_confirmed",
  "user_banned",
]);

/** 입력한 자격증명이 맞지 않을 때 오는 코드. */
const CREDENTIAL_CODES = new Set([
  "invalid_credentials",
  "invalid_grant",
  "bad_json_web_token",
]);

export function classifyAuthFailure(error: AuthErrorLike | null): AuthFailureKind {
  if (!error) return "unknown";

  // supabase-js 가 fetch 실패를 감싸 주는 경우. 가장 분명한 transport 신호다.
  if (error.name === "AuthRetryableFetchError") return "transport";

  const { status, code } = error;

  if (status === 429) return "rate_limited";
  if (typeof status === "number" && status >= 500) return "transport";

  // 요청이 서버까지 가지 못했으면 GoTrue 가 붙여 주는 status/code 가 없다.
  // 프록시가 비 JSON 본문을 돌려주고 supabase-js 가 파싱에 실패한 경우도
  // 여기로 온다 — 실제로 QA-019 에서 관찰한 형태가 이것이다.
  if (status === undefined || status === 0) return "transport";

  if (code !== undefined) {
    if (ACCOUNT_STATE_CODES.has(code)) return "account_state";
    if (CREDENTIAL_CODES.has(code)) return "credentials";
  }

  // 400/401 인데 코드가 없으면 자격증명 문제로 본다. GoTrue 구버전 응답 형태다.
  if (status === 400 || status === 401) return "credentials";

  return "unknown";
}

/**
 * 로그로 남겨도 되는 형태.
 *
 * raw 메시지는 사용자에게 보여주지 않지만 서버 로그에는 필요하다.
 * 다만 메시지 안에 이메일이나 토큰이 섞여 들어올 수 있으므로 길이를 자른다.
 */
export function authErrorForLog(error: AuthErrorLike | null) {
  return {
    kind: classifyAuthFailure(error),
    name: error?.name,
    status: error?.status,
    code: error?.code,
  };
}
