"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { NICKNAME_ERROR_MESSAGE, validateNickname } from "@/lib/nickname";
import type { NicknameActionState } from "@/lib/auth/form-state";

/**
 * 닉네임을 확정하고 profiles row 를 만든다.
 *
 * user_id 는 폼에서 받지 않고 세션에서 가져온다. 폼 값을 믿으면 남의 profile 을
 * 만들 수 있다. RLS 의 with check 도 같은 것을 막지만, 서버에서 먼저 막는다.
 */
export async function createProfile(
  _prevState: NicknameActionState,
  formData: FormData,
): Promise<NicknameActionState> {
  const user = await requireUser();

  const raw = formData.get("nickname");
  const input = typeof raw === "string" ? raw : "";
  const result = validateNickname(input);

  if (!result.ok) {
    return {
      status: "error",
      message: NICKNAME_ERROR_MESSAGE[result.error ?? "empty"],
      value: input,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    nickname: result.value,
  });

  if (error) {
    console.error("[onboarding] profile 생성 실패", {
      code: error.code,
      message: error.message,
    });

    // 23505 = unique_violation. profile 은 user_id 가 PK 이므로 이미 만든
    // 사용자가 폼을 두 번 보낸 경우다. 실패가 아니라 이미 끝난 상태다.
    if (error.code === "23505") {
      revalidatePath("/", "layout");
      redirect("/");
    }

    return {
      status: "error",
      message: "이름을 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      value: input,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
