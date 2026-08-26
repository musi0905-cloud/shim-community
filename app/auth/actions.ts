"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import {
  PASSWORD_MIN_LENGTH,
  type AuthActionState,
} from "@/lib/auth/form-state";

/**
 * 이 요청이 실제로 도착한 주소를 알아낸다.
 *
 * NEXT_PUBLIC_SITE_URL 이 없을 때(= Vercel Preview 등) 인증 메일이 돌아올 곳을
 * 정하는 데 쓴다. localhost 를 하드코딩해 두면 Preview 배포에서 링크가
 * localhost 로 나가 버린다.
 *
 * 헤더를 그대로 믿어도 되는 이유: Supabase 가 redirect_to 를 Redirect URLs
 * 허용목록과 대조하고, 목록에 없으면 무시하고 Site URL 로 대체한다.
 * (GoTrue utilities.GetReferrer / IsRedirectURLValid)
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

async function confirmUrl(): Promise<string> {
  const headerList = await headers();
  return `${getSiteUrl(resolveOrigin(headerList))}/auth/confirm`;
}

/** 브라우저의 type="email" 검증은 우회할 수 있으므로 서버에서 다시 본다. */
function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function passwordProblem(password: string, confirm?: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상으로 만들어주세요.`;
  }
  if (password.length > 72) {
    // bcrypt 가 72 바이트에서 잘린다. 잘린 채로 저장되면 나중에 혼란스럽다.
    return "비밀번호가 너무 길어요. 72자 이하로 만들어주세요.";
  }
  if (confirm !== undefined && password !== confirm) {
    return "비밀번호가 서로 달라요.";
  }
  return null;
}

function readForm(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };
  return {
    email: get("email").trim().toLowerCase(),
    password: get("password"),
    passwordConfirm: get("passwordConfirm"),
  };
}

/**
 * 회원가입. 이메일 + 비밀번호.
 *
 * 이메일 인증은 최초 가입 때 한 번만 한다. 이후로는 비밀번호로 들어온다.
 */
export async function signUpWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password, passwordConfirm } = readForm(formData);

  if (!isValidEmail(email)) {
    return { status: "error", message: "이메일 주소를 다시 확인해주세요.", email };
  }
  const problem = passwordProblem(password, passwordConfirm);
  if (problem) return { status: "error", message: problem, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: await confirmUrl() },
  });

  if (error) {
    console.error("[auth] 가입 실패", { status: error.status, message: error.message });
    if (error.status === 429) {
      return { status: "error", message: "잠시 후에 다시 시도해주세요.", email };
    }
    return {
      status: "error",
      message: "가입하지 못했어요. 잠시 후 다시 시도해주세요.",
      email,
    };
  }

  // 이미 가입된 주소여도 Supabase 는 성공처럼 응답한다(사용자 열거 방지).
  // 우리도 같은 화면을 보여준다. 어떤 주소가 가입돼 있는지 알려주지 않는다.
  if (data.session) {
    // 이메일 확인이 꺼져 있는 프로젝트면 바로 세션이 생긴다.
    revalidatePath("/", "layout");
    redirect("/");
  }

  return { status: "sent", email };
}

/**
 * 로그인. 이메일 + 비밀번호.
 * 인증 메일을 다시 보내지 않는다.
 */
export async function signInWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = readForm(formData);

  if (!isValidEmail(email) || password.length === 0) {
    return { status: "error", message: "이메일과 비밀번호를 확인해주세요.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[auth] 로그인 실패", { status: error.status, code: error.code });

    // 아직 이메일을 확인하지 않은 계정만 따로 안내한다. 사용자가 할 일이 다르다.
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        message: "메일함에서 인증 링크를 먼저 눌러주세요.",
        email,
      };
    }
    // 그 외에는 "비밀번호가 틀렸다" 와 "그런 계정이 없다" 를 구분하지 않는다.
    // 구분하면 어떤 주소가 가입돼 있는지 알려주는 것과 같다.
    return {
      status: "error",
      message: "이메일 또는 비밀번호가 맞지 않아요.",
      email,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * 비밀번호 재설정 메일.
 *
 * 매직 링크로만 가입해 아직 비밀번호가 없는 기존 사용자도 이걸로 만든다.
 * 링크를 타고 오면 세션이 서고, /settings 에서 비밀번호를 정하면 된다.
 */
export async function sendPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email } = readForm(formData);

  if (!isValidEmail(email)) {
    return { status: "error", message: "이메일 주소를 다시 확인해주세요.", email };
  }

  const headerList = await headers();
  const siteUrl = getSiteUrl(resolveOrigin(headerList));

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // 링크를 타면 세션이 선다. 곧바로 비밀번호를 정할 수 있는 곳으로 보낸다.
    redirectTo: `${siteUrl}/auth/confirm?next=/settings`,
  });

  if (error) {
    console.error("[auth] 재설정 메일 실패", {
      status: error.status,
      message: error.message,
    });
    if (error.status === 429) {
      return { status: "error", message: "잠시 후에 다시 시도해주세요.", email };
    }
  }

  // 성공·실패를 구분해 알리지 않는다. 가입 여부가 드러나기 때문이다.
  return { status: "sent", email };
}
