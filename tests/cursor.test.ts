import { test } from "node:test";
import assert from "node:assert/strict";
import {
  encodeFeedCursor,
  decodeFeedCursor,
  type FeedCursor,
} from "../lib/community/cursor.ts";

/** QA-265 회귀 테스트 — 커서 왕복과 조작된 값 처리. */

const CURSOR: FeedCursor = {
  createdAt: "2026-08-26T12:34:56.789012+00:00",
  postId: "aaaaaaaa-0000-0000-0000-00000000000a",
};

test("왕복하면 같은 값이 나온다", () => {
  assert.deepEqual(decodeFeedCursor(encodeFeedCursor(CURSOR)), CURSOR);
});

test("URL 에 그대로 실을 수 있는 문자만 나온다", () => {
  const encoded = encodeFeedCursor(CURSOR);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.equal(encodeURIComponent(encoded), encoded, "인코딩이 더 필요해선 안 된다");
});

test("여러 타임스탬프 형태에서 왕복한다", () => {
  const shapes = [
    "2026-08-26T12:34:56.789012+00:00",
    "2026-08-26T12:34:56+00:00",
    "2026-01-01T00:00:00.000Z",
    "2026-12-31T23:59:59.999999+09:00",
  ];
  for (const createdAt of shapes) {
    const c = { createdAt, postId: CURSOR.postId };
    assert.deepEqual(decodeFeedCursor(encodeFeedCursor(c)), c, createdAt);
  }
});

test("망가진 커서는 null 이다 (첫 장으로 돌아간다)", () => {
  const bad = [
    undefined,
    null,
    "",
    "not-base64!!!",
    Buffer.from("구분자없음").toString("base64url"),
    Buffer.from("|").toString("base64url"),
    Buffer.from("|aaaaaaaa-0000-0000-0000-00000000000a").toString("base64url"),
    // uuid 가 아니다
    Buffer.from("2026-08-26T12:34:56Z|not-a-uuid").toString("base64url"),
    Buffer.from("2026-08-26T12:34:56Z|1; drop table posts").toString("base64url"),
    // 타임스탬프가 아니다
    Buffer.from("어제|aaaaaaaa-0000-0000-0000-00000000000a").toString("base64url"),
    Buffer.from("|" + "a".repeat(80)).toString("base64url"),
  ];
  for (const raw of bad) {
    assert.equal(
      decodeFeedCursor(raw as string | undefined),
      null,
      `통과하면 안 되는 값: ${String(raw)}`,
    );
  }
});

test("타임스탬프에 | 가 들어와도 마지막 구분자로 자른다", () => {
  const weird = { createdAt: "2026-08-26T12:34:56Z", postId: CURSOR.postId };
  const encoded = Buffer.from(
    `${weird.createdAt}|${weird.postId}`,
    "utf8",
  ).toString("base64url");
  assert.deepEqual(decodeFeedCursor(encoded), weird);
});

test("decode 는 절대 예외를 던지지 않는다", () => {
  const hostile = ["%%%", "====", "\u0000", "a".repeat(10000), "🌿🌿🌿"];
  for (const raw of hostile) {
    assert.doesNotThrow(() => decodeFeedCursor(raw), `던졌다: ${raw}`);
  }
});
