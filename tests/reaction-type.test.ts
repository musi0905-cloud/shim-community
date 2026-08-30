import { test } from "node:test";
import assert from "node:assert/strict";
import { isReactionType } from "../lib/community/reaction-type.ts";

/**
 * Reaction P1 회귀 테스트.
 *
 * 실제 결함은 브라우저의 form action 인자 전달 방식에 있었다(클라이언트가
 * postId/reactionType 을 formData 로 전혀 보내지 못했다) — 그 부분은 이
 * 테스트 도구로 재현할 수 있는 범위 밖이라 Production 브라우저에서 직접
 * 확인했다. 여기서는 수정 후에도 서버가 마지막 방어선으로 계속 지켜야 하는
 * 것 — 클라이언트가 준 reactionType 값이 실제 3종이 아니면 거부하는 것 —
 * 을 고정한다.
 */

test("실제 반응 타입 3종은 통과한다", () => {
  assert.equal(isReactionType("heart"), true);
  assert.equal(isReactionType("leaf"), true);
  assert.equal(isReactionType("cup"), true);
});

test("가짜/조작된 값은 거부한다", () => {
  assert.equal(isReactionType("HEART"), false);
  assert.equal(isReactionType("like"), false);
  assert.equal(isReactionType(""), false);
  assert.equal(isReactionType(" heart"), false);
});

test("문자열이 아닌 값도 거부한다 (직접 서버 액션을 호출하는 우회 시도 대비)", () => {
  assert.equal(isReactionType(null), false);
  assert.equal(isReactionType(undefined), false);
  assert.equal(isReactionType(123), false);
  assert.equal(isReactionType(["heart"]), false);
  assert.equal(isReactionType({ type: "heart" }), false);
});
