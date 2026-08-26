import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 매직 링크가 돌아오는 곳.
 *
 * 두 가지 형태를 모두 받는다.
 *
 * 1. token_hash + type — Supabase 메일 템플릿을 {{ .TokenHash }} 로 바꾼 경우.
 *    링크를 연 브라우저가 메일을 요청한 브라우저와 달라도 동작한다.
 *    (docs/ARCHITECTURE.md 「Auth 설정 절차」참고. 이쪽을 권장한다.)
 *
 * 2. code — PKCE 흐름. 메일을 요청한 그 브라우저에서 열어야 한다.
 *    code_verifier 가 그 브라우저 쿠키에만 있기 때문이다.
 *    기본 메일 템플릿({{ .ConfirmationURL }})은 이쪽으로 온다.
 *
 * 이 라우트는 세션만 세운다. 닉네임이 있는지에 따른 분기는 "/" 가 판단한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) redirect("/");

    console.error("[auth] token_hash 검증 실패", {
      status: error.status,
      message: error.message,
    });
    redirect("/auth/error?reason=expired");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/");

    console.error("[auth] code 교환 실패", {
      status: error.status,
      message: error.message,
    });
    redirect("/auth/error?reason=expired");
  }

  redirect("/auth/error?reason=invalid");
}
