"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * 브라우저용 Supabase client.
 *
 * createBrowserClient 는 내부적으로 같은 인스턴스를 재사용하므로
 * 호출할 때마다 새 연결이 생기지 않는다. 그래도 client 생성 로직은
 * 이 파일 하나로 유지한다.
 *
 * anon key 만 사용한다. 실제 접근 통제는 Postgres RLS 가 한다.
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
