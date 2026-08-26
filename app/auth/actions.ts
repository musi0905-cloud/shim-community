"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import type { AuthActionState } from "@/lib/auth/form-state";

/**
 * 이 요청이 실제로 도착한 주소를 알아낸다.
 *
 * NEXT_PUBLIC_SITE_URL 이 없을 때(= Vercel Preview 등) 매직 링크가 돌아올 곳을
 * 정하는 데 쓴다. localhost 를 하드코딩해 두면 Preview 배포에서 링크가
 * localhost 로 나가 버린다.
 *
 * origin → x-forwarded-proto + host → localhost 순으로 본다.
 * Vercel 은 프록시 뒤에 있으므로 host 만 보면 프로토콜을 알 수 없다.
 *
 * 이 값을 그대로 믿어도 되는 이유: Supabase 가 redirect_to 를 Redirect URLs
 * 허용목록과 대조하고, 목록에 없으면 무시하고 Site URL 로 대체한다.
 * (GoTrue utilities.GetReferrer / IsRedirectURLValid)
 * 즉 헤더를 위조해도 허용목록 밖으로는 메일이 나가지 않는다.
 */
function resolveOrigin(headerList: Headers): string {
  const origin = headerList.get("origin");
  if (origin) return origin;

  const host = headerList.get("host");
  if (host) {
    const proto = headerList.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

/**
 * 서버에서도 이메일 형식을 확인한다.
 * 브라우저의 type="email" 검증은 우회할 수 있으므로 신뢰하지 않는다.
 */
function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > 254) return false;
  // 완벽한 RFC 검증은 하지 않는다. 실제 확인은 메일이 도착하는지로 끝난다.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * 매직 링크를 보낸다.
 *
 * 계정이 있든 없든 같은 결과를 돌려준다. "가입되지 않은 이메일" 같은 응답은
 * 이 주소가 우리 서비스를 쓰는지 알려주는 것과 같다. 마음 상태를 적는
 * 서비스에서 그 사실 자체가 노출되면 안 된다.
 */
export async function sendMagicLink(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "이메일 주소를 다시 확인해주세요.",
      email,
    };
  }

  const headerList = await headers();
  const origin = resolveOrigin(headerList);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${getSiteUrl(origin)}/auth/confirm`,
    },
  });

  if (error) {
    console.error("[auth] 매직 링크 발송 실패", {
      status: error.status,
      message: error.message,
    });

    // 요청이 너무 잦은 경우만 따로 안내한다. 기다리면 해결되는 상황이라
    // 사용자가 원인을 알 수 있어야 한다.
    if (error.status === 429) {
      return {
        status: "error",
        message: "잠시 후에 다시 시도해주세요.",
        email,
      };
    }
    return {
      status: "error",
      message: "메일을 보내지 못했어요. 잠시 후 다시 시도해주세요.",
      email,
    };
  }

  return { status: "sent", email };
}
