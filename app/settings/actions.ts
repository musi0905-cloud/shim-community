"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { NICKNAME_ERROR_MESSAGE, validateNickname } from "@/lib/nickname";
import {
  PASSWORD_MIN_LENGTH,
  type SettingsActionState,
} from "@/lib/auth/form-state";

/**
 * 로그아웃.
 *
 * 실패하더라도 사용자를 로그인 상태로 붙잡아 두지 않는다. 로그아웃이 안 되는
 * 것은 마음 상태를 적는 서비스에서 특히 나쁜 실패다.
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[auth] 로그아웃 실패", {
      status: error.status,
      message: error.message,
    });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** 닉네임 변경. user_id 는 세션에서 온다. */
export async function updateNickname(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const profile = await requireProfile();

  const raw = formData.get("nickname");
  const result = validateNickname(typeof raw === "string" ? raw : "");
  if (!result.ok) {
    return {
      status: "error",
      field: "nickname",
      message: NICKNAME_ERROR_MESSAGE[result.error ?? "empty"],
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ nickname: result.value })
    .eq("user_id", profile.user_id);

  if (error) {
    console.error("[settings] 닉네임 변경 실패", { code: error.code });
    return {
      status: "error",
      field: "nickname",
      message: "이름을 바꾸지 못했어요. 잠시 후 다시 시도해주세요.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", field: "nickname", message: "이름을 바꿨어요." };
}

/**
 * 비밀번호 설정/변경.
 *
 * 매직 링크로만 가입해 아직 비밀번호가 없는 기존 사용자도 여기서 만든다.
 * 로그인된 세션에서 updateUser 를 부르므로 기존 계정과 profile 이 그대로
 * 유지된다 — 새 계정이 생기지 않는다.
 */
export async function updatePassword(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireProfile();

  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };
  const password = get("password");
  const confirm = get("passwordConfirm");

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      status: "error",
      field: "password",
      message: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상으로 만들어주세요.`,
    };
  }
  if (password.length > 72) {
    return {
      status: "error",
      field: "password",
      message: "비밀번호가 너무 길어요. 72자 이하로 만들어주세요.",
    };
  }
  if (password !== confirm) {
    return { status: "error", field: "password", message: "비밀번호가 서로 달라요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[settings] 비밀번호 변경 실패", {
      status: error.status,
      code: error.code,
    });
    if (error.code === "same_password") {
      return {
        status: "error",
        field: "password",
        message: "지금 쓰는 것과 같은 비밀번호예요.",
      };
    }
    return {
      status: "error",
      field: "password",
      message: "비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.",
    };
  }

  return {
    status: "success",
    field: "password",
    message: "이제 이메일과 비밀번호로 로그인할 수 있어요.",
  };
}
