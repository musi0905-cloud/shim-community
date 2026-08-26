import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * 서버용 Supabase client (Server Component / Server Action / Route Handler).
 *
 * Next.js 16 에서 cookies() 는 async 다. 그래서 이 함수도 async 다.
 *
 * Server Component 에서는 쿠키를 쓸 수 없다. 토큰 갱신으로 setAll 이
 * 호출되면 Next 가 예외를 던지는데, 이때는 무시해도 된다 — proxy.ts 가
 * 매 요청마다 세션을 갱신하고 쿠키를 다시 심기 때문이다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component 에서 호출된 경우. proxy 가 갱신을 대신 처리한다.
        }
      },
    },
  });
}
