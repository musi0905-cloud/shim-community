import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * 매 요청마다 Supabase 세션을 갱신하고, 갱신된 쿠키를 응답에 실어 보낸다.
 *
 * 이게 없으면 access token 이 만료된 뒤 Server Component 가 사용자를
 * 로그아웃 상태로 보게 된다. 브라우저를 닫았다 열어도 세션이 유지되는 이유가
 * 여기에 있다 — 세션이 localStorage 가 아니라 쿠키에 있기 때문이다.
 *
 * 여기서는 인가(authorization) 판단을 하지 않는다. Next.js 문서가 경고하듯
 * proxy 는 prefetch 를 포함한 모든 요청에서 돌기 때문에 낙관적 확인에만 쓴다.
 * 실제 접근 통제는 각 페이지/액션의 requireUser() 와 Postgres RLS 가 한다.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() 를 반드시 호출한다. 이 호출이 토큰 갱신을 실제로 일으킨다.
  // getSession() 은 쿠키를 그대로 믿기 때문에 여기서 쓰지 않는다.
  await supabase.auth.getUser();

  return response;
}
