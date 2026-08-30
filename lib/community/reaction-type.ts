/**
 * 클라이언트가 준 값이 실제 반응 타입 3종 중 하나인지 확인한다.
 * `app/community/actions.ts` 의 서버 액션에서 DB 에 넣기 전에 쓴다.
 *
 * "use server" 파일은 async export 만 허용하므로 순수 함수는 여기 둔다.
 * 값은 DB check constraint(`reactions_type_valid`)와 `lib/constants.ts` 의
 * REACTIONS 에도 있다 — 이 프로젝트는 같은 불변조건을 계층마다 따로 둔다
 * (닉네임 길이, 글자수 제한도 마찬가지). import 로 묶으면 이 파일이
 * lib/constants.ts 를 거쳐 결국 값이 있는 다른 모듈까지 끌고 오게 되어
 * `node --test` 로 직접 실행할 수 없게 된다(상대경로 확장자 문제로
 * 메인 tsconfig 와 tests 용 tsconfig 요구사항이 서로 맞지 않는다) — 그래서
 * 여기서는 일부러 아무것도 import 하지 않는다.
 */
const VALID_REACTION_TYPES = new Set(["heart", "leaf", "cup"]);

export function isReactionType(
  value: unknown,
): value is "heart" | "leaf" | "cup" {
  return typeof value === "string" && VALID_REACTION_TYPES.has(value);
}
