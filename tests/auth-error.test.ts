import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyAuthFailure,
  authErrorForLog,
  type AuthErrorLike,
} from "../lib/auth/auth-error.ts";

/** QA-019 / QA-204 / QA-209 회귀 테스트. */

test("Supabase 에 닿지 못한 경우는 transport 다", () => {
  const cases: [string, AuthErrorLike][] = [
    // supabase-js 가 fetch 실패를 감싼 형태
    ["AuthRetryableFetchError", { name: "AuthRetryableFetchError", status: 0 }],
    // 프록시가 비 JSON 본문을 돌려줘 파싱에 실패한 형태 — QA-019 에서 실제로 관찰한 것
    [
      "비 JSON 응답",
      { name: "AuthUnknownError", message: `Unexpected token 'H', "Host not i"... is not valid JSON` },
    ],
    ["status 없음", { message: "fetch failed" }],
    ["status 0", { status: 0, message: "network error" }],
    ["502", { status: 502 }],
    ["503", { status: 503 }],
  ];
  for (const [label, err] of cases) {
    assert.equal(classifyAuthFailure(err), "transport", label);
  }
});

test("자격증명 오류는 credentials 다", () => {
  assert.equal(
    classifyAuthFailure({ status: 400, code: "invalid_credentials" }),
    "credentials",
  );
  assert.equal(classifyAuthFailure({ status: 400 }), "credentials");
  assert.equal(classifyAuthFailure({ status: 401 }), "credentials");
});

test("계정 상태 문제는 account_state 다", () => {
  assert.equal(
    classifyAuthFailure({ status: 400, code: "email_not_confirmed" }),
    "account_state",
  );
  assert.equal(classifyAuthFailure({ status: 403, code: "user_banned" }), "account_state");
});

test("429 는 rate_limited 다", () => {
  assert.equal(classifyAuthFailure({ status: 429 }), "rate_limited");
  assert.equal(
    classifyAuthFailure({ status: 429, code: "over_email_send_rate_limit" }),
    "rate_limited",
  );
});

test("transport 와 credentials 는 절대 섞이지 않는다", () => {
  // 이 테스트가 QA-019 의 본질이다.
  // 네트워크 실패가 credentials 로 분류되면 사용자는 비밀번호를 의심하게 된다.
  const transportShapes: AuthErrorLike[] = [
    { name: "AuthRetryableFetchError" },
    { message: "fetch failed" },
    { status: 500 },
    { status: 503, code: undefined },
  ];
  for (const err of transportShapes) {
    assert.notEqual(
      classifyAuthFailure(err),
      "credentials",
      `transport 를 credentials 로 분류했다: ${JSON.stringify(err)}`,
    );
  }
});

test("계정 열거 방지: 없는 계정과 틀린 비밀번호가 같은 종류로 분류된다", () => {
  // Supabase 는 두 경우 모두 invalid_credentials 를 준다. 우리도 나누지 않는다.
  const noSuchUser: AuthErrorLike = { status: 400, code: "invalid_credentials" };
  const wrongPassword: AuthErrorLike = { status: 400, code: "invalid_credentials" };
  assert.equal(classifyAuthFailure(noSuchUser), classifyAuthFailure(wrongPassword));
});

test("null 은 unknown 이고, unknown 도 사용자 입력 탓으로 돌리지 않는다", () => {
  assert.equal(classifyAuthFailure(null), "unknown");
  assert.equal(classifyAuthFailure({ status: 418 }), "unknown");
});

test("로그용 값에 raw message 가 들어가지 않는다", () => {
  const logged = authErrorForLog({
    name: "AuthApiError",
    status: 400,
    code: "invalid_credentials",
    message: "Invalid login credentials for someone@example.com",
  });
  assert.deepEqual(Object.keys(logged).sort(), ["code", "kind", "name", "status"]);
  assert.equal(JSON.stringify(logged).includes("@example.com"), false);
});
