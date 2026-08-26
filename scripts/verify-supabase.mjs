#!/usr/bin/env node
/**
 * 쉼 — 실제 Supabase 환경 검증
 *
 * 실제 프로젝트에 붙어서 RLS 가 의도대로 동작하는지 확인한다.
 * service_role 을 쓰지 않는다. anon key 와 실제 로그인 사용자의 JWT 만 쓴다.
 *
 * 사용법
 *   1) .env.local 에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 설정
 *   2) 비로그인 검사만:
 *        node scripts/verify-supabase.mjs
 *   3) 사용자 간 RLS 까지 검사 (권장):
 *        node scripts/verify-supabase.mjs --jwt-a <A의 access token> --jwt-b <B의 access token>
 *
 * access token 얻는 법 (service_role 없이):
 *   앱에서 A 계정으로 로그인 → DevTools → Application → Cookies →
 *   sb-<project-ref>-auth-token 값 안의 access_token 을 복사한다.
 *   B 계정도 다른 브라우저(또는 시크릿 창)에서 같은 방식으로 얻는다.
 *   이 토큰은 실제 로그인이 발급한 것이므로 진짜 authenticated JWT context 다.
 *
 * 토큰은 출력하지 않는다. 로그에 남지 않게 한다.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ── .env.local 읽기 ───────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      const value = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  } catch {
    // 환경변수로 직접 넘겨도 된다.
  }
}
loadEnv();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL_ || !ANON) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없다.\n" +
      ".env.local.example 을 참고해 .env.local 을 만들어라.",
  );
  process.exit(2);
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const JWT_A = arg("--jwt-a");
const JWT_B = arg("--jwt-b");

/** 주어진 JWT 로 요청하는 client. 없으면 익명(anon) client. */
function client(jwt) {
  return createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : {},
  });
}

/** JWT 에서 sub(user_id) 만 꺼낸다. 서명 검증은 서버가 한다. */
function subOf(jwt) {
  try {
    const payload = JSON.parse(
      Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"),
    );
    return payload.sub;
  } catch {
    return undefined;
  }
}

let pass = 0;
let fail = 0;
const results = [];

function record(name, ok, detail) {
  if (ok) pass++;
  else fail++;
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "*** FAIL ***"}  ${name}\n        ${detail}`);
}

/**
 * 서버까지 닿지 못한 실패인지 구분한다.
 *
 * 이걸 구분하지 않으면 "RLS 가 막았다" 와 "서버에 닿지도 못했다" 가 똑같이
 * 차단으로 보인다. 네트워크가 끊긴 채로 전부 PASS 가 뜨는 것이 아무 검사도
 * 하지 않는 것보다 나쁘다 — 검증했다고 착각하게 만들기 때문이다.
 *
 * PostgREST 가 돌려주는 거부는 code(42501, PGRST301 …)를 갖는다.
 * 전송 자체가 실패하면 code 가 없고 메시지가 fetch 실패 계열이다.
 */
function isTransportFailure(error) {
  if (!error) return false;
  if (error.code) return false; // DB/PostgREST 가 응답한 것 = 서버에 닿았다
  return /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|allowlist|network|socket|EAI_AGAIN|certificate/i.test(
    `${error.message ?? ""} ${error.details ?? ""}`,
  );
}

// ── 1. 연결 확인 (preflight) ──────────────────────────────────────────
console.log(`\n대상: ${URL_}\n`);

const anon = client();

{
  // 어떤 검사보다 먼저, 실제 검사와 똑같은 경로로 서버에 닿는지 확인한다.
  //
  // 여기서 별도의 fetch 를 쓰면 안 된다. Node 내장 fetch 는 HTTPS_PROXY 를
  // 읽지 않아서 supabase-js 와 다른 경로로 나가고, 프록시가 돌려준 403 같은
  // 응답을 "연결됨" 으로 착각하게 된다. 실제로 그렇게 오판했다.
  // 그래서 supabase-js 클라이언트로 직접 찔러 본다.
  const { error } = await anon.from("profiles").select("user_id").limit(1);

  if (isTransportFailure(error)) {
    console.error(
      `*** 중단 ***  Supabase 에 연결할 수 없다.\n        ${error.message}\n\n` +
        "서버에 닿지 못한 상태에서는 어떤 것도 검증할 수 없다.\n" +
        "네트워크가 열린 곳에서 실행하거나, egress 설정에 이 호스트를 추가해라.\n" +
        "이 상태를 PASS 로 보고하지 않는다.",
    );
    process.exit(3);
  }
  record(
    "Supabase 연결",
    true,
    error ? `응답함 (${error.code})` : "응답함 (쿼리 성공)",
  );
}

{
  // 비로그인으로 profiles 를 읽으면 막혀야 한다.
  // RLS 가 꺼져 있거나 anon 정책이 열려 있으면 여기서 행이 돌아온다.
  const { data, error } = await anon.from("profiles").select("user_id").limit(1);
  if (isTransportFailure(error)) {
    record("비로그인 SELECT 차단", false, `검증 불가 — 서버에 닿지 못함: ${error.message}`);
  } else {
    const blocked = error !== null || (data ?? []).length === 0;
    record(
      "비로그인 SELECT 차단",
      blocked,
      error
        ? `차단됨 (${error.code}: ${error.message})`
        : `행 ${(data ?? []).length}개 반환 — 0이어야 안전`,
    );
  }
}

{
  // 비로그인 INSERT 도 막혀야 한다.
  const { error } = await anon
    .from("profiles")
    .insert({ user_id: "00000000-0000-0000-0000-000000000000", nickname: "침입" });
  if (isTransportFailure(error)) {
    record("비로그인 INSERT 차단", false, `검증 불가 — 서버에 닿지 못함: ${error.message}`);
  } else {
    record(
      "비로그인 INSERT 차단",
      error !== null,
      error ? `차단됨 (${error.code})` : "삽입이 성공했다 — 심각",
    );
  }
}

// ── 2. 사용자 간 RLS ──────────────────────────────────────────────────
if (!JWT_A || !JWT_B) {
  console.log(
    "\n--jwt-a / --jwt-b 가 없어 사용자 간 RLS 검사는 건너뛴다.\n" +
      "두 계정으로 로그인한 뒤 access token 을 넘기면 전체를 검사한다.\n",
  );
} else {
  const idA = subOf(JWT_A);
  const idB = subOf(JWT_B);
  record(
    "두 JWT 가 서로 다른 사용자",
    Boolean(idA && idB && idA !== idB),
    idA && idB ? `A=${idA.slice(0, 8)}… B=${idB.slice(0, 8)}…` : "sub 를 읽지 못했다",
  );

  const a = client(JWT_A);
  const b = client(JWT_B);

  {
    const { data, error } = await a.from("profiles").select("user_id, nickname");
    const rows = data ?? [];
    const onlyOwn = !error && rows.length === 1 && rows[0].user_id === idA;
    record(
      "A: 자기 profile SELECT 가능 (자기 것만)",
      onlyOwn,
      error ? `에러 ${error.code}` : `행 ${rows.length}개, 전부 A 소유=${rows.every((r) => r.user_id === idA)}`,
    );
  }

  {
    const { data, error } = await a
      .from("profiles")
      .select("user_id")
      .eq("user_id", idB);
    record(
      "A: B 의 profile SELECT 불가",
      !error && (data ?? []).length === 0,
      error ? `에러 ${error.code}` : `행 ${(data ?? []).length}개 — 0이어야 정상`,
    );
  }

  {
    // 자기 닉네임을 그대로 다시 써서 값이 바뀌지 않게 한다.
    const { data: mine } = await a
      .from("profiles")
      .select("nickname")
      .eq("user_id", idA)
      .maybeSingle();
    const { data, error } = await a
      .from("profiles")
      .update({ nickname: mine?.nickname ?? "조용한구름" })
      .eq("user_id", idA)
      .select("user_id");
    record(
      "A: 자기 profile UPDATE 가능",
      !error && (data ?? []).length === 1,
      error ? `에러 ${error.code}: ${error.message}` : `${(data ?? []).length}행 갱신`,
    );
  }

  {
    const { data, error } = await a
      .from("profiles")
      .update({ nickname: "탈취됨" })
      .eq("user_id", idB)
      .select("user_id");
    record(
      "A: B 의 profile UPDATE 불가",
      !error && (data ?? []).length === 0,
      error ? `차단됨 (${error.code})` : `${(data ?? []).length}행 갱신 — 0이어야 정상`,
    );
  }

  {
    const { error } = await a
      .from("profiles")
      .insert({ user_id: idB, nickname: "가짜" });
    record(
      "A: B 의 user_id 로 INSERT 불가",
      error !== null && !isTransportFailure(error),
      isTransportFailure(error)
        ? `검증 불가 — 서버에 닿지 못함: ${error.message}`
        : error
          ? `차단됨 (${error.code}: ${error.message})`
          : "삽입 성공 — 심각",
    );
  }

  {
    const { data, error } = await a
      .from("profiles")
      .update({ user_id: idB })
      .eq("user_id", idA)
      .select("user_id");
    record(
      "A: 자기 row 의 user_id 를 B 로 바꿔치기 불가",
      isTransportFailure(error)
        ? false
        : error !== null || (data ?? []).length === 0,
      isTransportFailure(error)
        ? `검증 불가 — 서버에 닿지 못함: ${error.message}`
        : error
          ? `차단됨 (${error.code})`
          : `${(data ?? []).length}행 — 0이어야 정상`,
    );
  }

  {
    const { data, error } = await a
      .from("profiles")
      .delete()
      .eq("user_id", idB)
      .select("user_id");
    record(
      "A: B 의 profile DELETE 불가",
      !error && (data ?? []).length === 0,
      error ? `차단됨 (${error.code})` : `${(data ?? []).length}행 삭제 — 0이어야 정상`,
    );
  }

  {
    const { data, error } = await b.from("profiles").select("user_id");
    const rows = data ?? [];
    record(
      "B: 자기 것만 보임",
      !error && rows.length === 1 && rows[0].user_id === idB,
      error ? `에러 ${error.code}` : `행 ${rows.length}개`,
    );
  }

  {
    // 닉네임 제약이 DB 에서도 걸리는지 (클라이언트 우회 시도)
    const { error } = await a
      .from("profiles")
      .update({ nickname: "가" })
      .eq("user_id", idA);
    record(
      "닉네임 1자 → DB check constraint 차단",
      error !== null && !isTransportFailure(error),
      isTransportFailure(error)
        ? `검증 불가 — 서버에 닿지 못함: ${error.message}`
        : error
          ? `차단됨 (${error.code})`
          : "통과됨 — constraint 누락",
    );
  }

  {
    const { error } = await a
      .from("profiles")
      .update({ nickname: "  공백  " })
      .eq("user_id", idA);
    record(
      "닉네임 앞뒤 공백 → DB check constraint 차단",
      error !== null && !isTransportFailure(error),
      isTransportFailure(error)
        ? `검증 불가 — 서버에 닿지 못함: ${error.message}`
        : error
          ? `차단됨 (${error.code})`
          : "통과됨 — constraint 누락",
    );
  }
}

// ── 결과 ──────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`${pass} PASS / ${fail} FAIL`);
if (fail > 0) {
  console.log("\n실패 항목:");
  for (const r of results.filter((r) => !r.ok)) {
    console.log(`  - ${r.name}: ${r.detail}`);
  }
}
process.exit(fail > 0 ? 1 : 0);
