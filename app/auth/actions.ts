"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import type { AuthActionState } from "@/lib/auth/form-state";

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
  const origin = headerList.get("origin") ?? "http://localhost:3000";

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
