import { test } from "node:test";
import assert from "node:assert/strict";
import { safeRedirectPath, DEFAULT_REDIRECT } from "../lib/auth/safe-redirect.ts";

/**
 * QA-199 회귀 테스트.
 *
 * 예전 검사(raw.startsWith("/") && !raw.startsWith("//"))를 뚫던 값들이
 * 여기 전부 들어 있다. 실행: npm test
 */

const ORIGIN = "https://shim-community.vercel.app";

const TAB = "\t";
const LF = "\n";
const CR = "\r";
const NUL = "\u0000";

test("내부 경로는 그대로 통과한다", () => {
  for (const p of ["/", "/write", "/community", "/settings", "/my-rest", "/short-rest"]) {
    assert.equal(safeRedirectPath(p, ORIGIN), p);
  }
});

test("query 와 hash 는 보존한다", () => {
  assert.equal(safeRedirectPath("/community?page=2", ORIGIN), "/community?page=2");
  assert.equal(safeRedirectPath("/settings#password", ORIGIN), "/settings#password");
});

test("외부 호스트로 나가는 값은 전부 기본값이 된다", () => {
  const escapes: [string, string][] = [
    ["protocol-relative", "//evil.example"],
    ["slash 3개", "///evil.example"],
    ["백슬래시", "/\\evil.example"],
    ["백슬래시 + slash", "/\\/evil.example"],
    ["백슬래시 2개", "\\\\evil.example"],
    ["선행 탭", `/${TAB}/evil.example`],
    ["선행 개행", `/${LF}/evil.example`],
    ["선행 CR", `/${CR}/evil.example`],
    ["NUL", `/${NUL}/evil.example`],
    ["선행 공백", " //evil.example"],
    ["절대 URL https", "https://evil.example"],
    ["절대 URL http", "http://evil.example"],
    ["대문자 스킴", "HTTPS://evil.example"],
    ["경로까지", "//evil.example/write"],
    ["접두사만 같은 호스트", "https://shim-community.vercel.app.evil.example/"],
    ["userinfo 위장", "//shim-community.vercel.app@evil.example/"],
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["다른 포트", "https://shim-community.vercel.app:8443/settings"],
  ];
  for (const [label, c] of escapes) {
    assert.equal(
      safeRedirectPath(c, ORIGIN),
      DEFAULT_REDIRECT,
      `${label} 이 통과했다: ${JSON.stringify(c)}`,
    );
  }
});

test("차단된 값이 실제로 외부 호스트였음을 확인한다", () => {
  // 예전 검사가 왜 뚫렸는지를 테스트가 직접 보여 준다.
  for (const c of ["/\\evil.example", `/${TAB}/evil.example`]) {
    const oldCheckPasses = c.startsWith("/") && !c.startsWith("//");
    assert.equal(oldCheckPasses, true, "예전 검사는 이 값을 통과시켰다");
    assert.equal(new URL(c, ORIGIN).host, "evil.example", "실제로는 외부 호스트다");
    assert.equal(safeRedirectPath(c, ORIGIN), DEFAULT_REDIRECT, "지금은 막힌다");
  }
});

test("퍼센트 인코딩된 값은 같은 사이트 경로로 남는다", () => {
  // 이건 우리 origin 의 경로다. 외부로 나가지 않으므로 차단할 이유가 없다.
  const out = safeRedirectPath("/%2f%2fevil.example", ORIGIN);
  assert.ok(out.startsWith("/"), out);
  assert.equal(new URL(out, ORIGIN).origin, ORIGIN);
});

test("같은 origin 을 절대 URL 로 줘도 경로만 돌려준다", () => {
  assert.equal(
    safeRedirectPath("https://shim-community.vercel.app/settings", ORIGIN),
    "/settings",
  );
});

test("비어 있거나 망가진 입력은 기본값", () => {
  assert.equal(safeRedirectPath(null, ORIGIN), DEFAULT_REDIRECT);
  assert.equal(safeRedirectPath(undefined, ORIGIN), DEFAULT_REDIRECT);
  assert.equal(safeRedirectPath("", ORIGIN), DEFAULT_REDIRECT);
  assert.equal(safeRedirectPath("/write", "not-a-url"), DEFAULT_REDIRECT);
});

test("localhost origin 에서도 같은 규칙", () => {
  const local = "http://localhost:3000";
  assert.equal(safeRedirectPath("/settings", local), "/settings");
  assert.equal(safeRedirectPath("/\\evil.example", local), DEFAULT_REDIRECT);
  assert.equal(safeRedirectPath("http://localhost:9999/x", local), DEFAULT_REDIRECT);
});

test("돌려준 값은 항상 같은 origin 으로 해석된다", () => {
  const inputs = [
    "/",
    "/write",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/x",
    "javascript:alert(1)",
    "/%2f%2fevil.example",
    `/${TAB}/evil.example`,
  ];
  for (const c of inputs) {
    const out = safeRedirectPath(c, ORIGIN);
    assert.equal(
      new URL(out, ORIGIN).origin,
      ORIGIN,
      `${JSON.stringify(c)} → ${JSON.stringify(out)} 가 외부로 나갔다`,
    );
  }
});
