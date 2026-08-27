/**
 * 인증 흐름이 끝난 뒤 돌아갈 곳을 정한다.
 *
 * 열린 리다이렉트를 만들지 않는 것이 목적이다. 문자열 접두사 검사로는
 * 안 된다 — WHATWG URL 파서는 special scheme 에서 백슬래시를 슬래시로
 * 취급하고("/\evil.example" → 호스트 evil.example), 선행 탭·개행 같은
 * 제어문자를 조용히 지운다. 그래서 startsWith("/") 를 통과한 값이
 * 파싱 뒤에는 외부 호스트가 되어 버린다. (QA-199)
 *
 * 그래서 접두사가 아니라 파싱 결과를 본다. 실제로 URL 로 해석한 뒤
 * origin 이 우리 origin 과 정확히 같을 때만 통과시키고, 통과한 값도
 * 절대 URL 이 아니라 내부 경로로 바꿔 돌려준다.
 */

/** 판단이 서지 않으면 여기로 보낸다. */
export const DEFAULT_REDIRECT = "/";

/**
 * 파서가 조용히 지우거나 다르게 읽는 문자들.
 *
 * 검사한 문자열과 파싱된 문자열이 달라지는 순간 모든 검증이 무의미해진다.
 * 정상적인 내부 경로에는 나올 이유가 없으므로 파싱 전에 잘라낸다.
 * (C0 제어문자, 공백, DEL)
 */
const STRIPPED_BY_PARSER = /[\u0000-\u0020\u007f\s]/;

/**
 * candidate 를 안전한 내부 경로로 바꾼다.
 *
 * @param candidate  쿼리에서 온 값. 신뢰하지 않는다.
 * @param origin     이 요청이 실제로 도착한 origin.
 * @returns          항상 "/" 로 시작하는 같은 사이트 경로.
 */
export function safeRedirectPath(
  candidate: string | null | undefined,
  origin: string,
): string {
  if (!candidate) return DEFAULT_REDIRECT;
  if (STRIPPED_BY_PARSER.test(candidate)) return DEFAULT_REDIRECT;

  let base: URL;
  try {
    base = new URL(origin);
  } catch {
    return DEFAULT_REDIRECT;
  }

  let resolved: URL;
  try {
    resolved = new URL(candidate, base);
  } catch {
    return DEFAULT_REDIRECT;
  }

  // origin 비교 하나가 스킴·호스트·포트를 한꺼번에 본다.
  // javascript:/data: 같은 스킴은 origin 이 "null" 이라 여기서 함께 걸린다.
  if (resolved.origin !== base.origin) return DEFAULT_REDIRECT;

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;

  // 여기까지 왔으면 pathname 은 "/" 로 시작하지만, 방어적으로 한 번 더 본다.
  return path.startsWith("/") ? path : DEFAULT_REDIRECT;
}
