import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Data Access Layer.
 *
 * 인가 판단은 전부 여기서 한다. proxy.ts 는 세션 갱신만 하고 접근을 막지 않는다.
 * Next.js 문서가 권고하는 구조다 — proxy 는 prefetch 를 포함한 모든 요청에서
 * 돌기 때문에 낙관적 확인 이상을 맡기지 않는다.
 *
 * 마지막 방어선은 Postgres RLS 다. 여기 로직에 구멍이 나도 다른 사용자의
 * row 는 DB 가 막는다.
 */

/**
 * 현재 로그인한 사용자. 없으면 null.
 *
 * getSession() 이 아니라 getUser() 를 쓴다. getSession() 은 쿠키에 담긴 JWT 를
 * 그대로 믿지만, getUser() 는 Supabase 에 검증을 요청한다. 쿠키는 위조될 수
 * 있으므로 서버에서 신뢰할 수 있는 것은 getUser() 뿐이다.
 *
 * cache() 로 감싸 한 번의 렌더에서 여러 번 불러도 요청은 한 번만 나간다.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    // 로그인하지 않은 상태에서도 에러가 나므로 여기서는 로그를 남기지 않는다.
    return null;
  }
  return data.user;
});

/** 로그인이 필요한 화면에서 쓴다. 없으면 /auth 로 보낸다. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}

/**
 * 현재 사용자의 profile. 없으면 null (= 아직 닉네임을 정하지 않은 사용자).
 *
 * RLS 가 자기 row 만 반환하므로 user_id 조건은 방어적 중복이다.
 * 정책이 잘못 바뀌어도 다른 사람 row 를 읽지 않도록 남겨 둔다.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, nickname, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // 원인 추적은 서버 로그로만. 사용자에게는 raw 메시지를 보여주지 않는다.
    console.error("[dal] profile 조회 실패", {
      code: error.code,
      message: error.message,
    });
    throw new Error("PROFILE_FETCH_FAILED");
  }

  return data;
});

/**
 * 로그인 + profile 이 모두 있어야 하는 화면에서 쓴다.
 * profile 이 없으면 닉네임 온보딩으로 보낸다.
 */
export async function requireProfile(): Promise<Profile> {
  await requireUser();
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding/nickname");
  return profile;
}
