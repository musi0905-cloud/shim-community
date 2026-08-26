import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * 인증 메일의 링크가 돌아오는 곳.
 *
 * 두 가지 형태를 모두 받는다.
 *
 * 1. token_hash + type — 메일 템플릿을 {{ .TokenHash }} 로 바꾼 경우.
 *    링크를 연 브라우저가 메일을 요청한 브라우저와 달라도 동작한다. (권장)
 * 2. code — PKCE 흐름. 메일을 요청한 그 브라우저에서 열어야 한다.
 *
 * 세션만 세우고, 어디로 보낼지는 "/" 가 판단한다.
 * 비밀번호 재설정처럼 목적지가 정해진 경우에만 next 를 쓴다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  // 열린 리다이렉트를 만들지 않는다. 같은 사이트의 경로만 허용한다.
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));

    console.error("[auth] token_hash 검증 실패", {
      status: error.status,
      message: error.message,
    });
    return NextResponse.redirect(new URL("/auth/error?reason=expired", origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));

    console.error("[auth] code 교환 실패", {
      status: error.status,
      message: error.message,
    });
    return NextResponse.redirect(new URL("/auth/error?reason=expired", origin));
  }

  return NextResponse.redirect(new URL("/auth/error?reason=invalid", origin));
}
