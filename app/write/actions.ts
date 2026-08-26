"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/dal";
import { createPostWithSuggestion } from "@/lib/data/posts";
import { isMoodStateId, POST_MAX_LENGTH } from "@/lib/constants";
import type { WriteActionState } from "@/lib/auth/form-state";
import type { SafetyLevel } from "@/lib/types";

/**
 * 한 줄을 저장하고 Rest Plan 화면으로 보낸다.
 *
 * state 는 query 에서 넘어오므로 신뢰하지 않는다. 서버에서 허용된 값인지
 * 다시 확인한다. user_id 는 폼이 아니라 세션에서 가져온다.
 */
export async function submitPost(
  _prevState: WriteActionState,
  formData: FormData,
): Promise<WriteActionState> {
  const profile = await requireProfile();

  const rawState = formData.get("state");
  if (!isMoodStateId(rawState)) {
    return { status: "error", message: "오늘의 상태를 다시 골라주세요." };
  }

  const raw = formData.get("content");
  const content = (typeof raw === "string" ? raw : "").normalize("NFC").trim();

  if (content.length === 0) {
    return { status: "error", message: "한 줄만 적어주세요.", value: content };
  }
  if ([...content].length > POST_MAX_LENGTH) {
    return {
      status: "error",
      message: `${POST_MAX_LENGTH}자 이하로 적어주세요.`,
      value: content,
    };
  }

  let suggestionId: string;
  let safety: SafetyLevel;
  try {
    const created = await createPostWithSuggestion(
      profile.user_id,
      rawState,
      content,
    );
    suggestionId = created.suggestion.id;
    safety = created.safety;
  } catch (error) {
    console.error("[write] 저장 실패", {
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      status: "error",
      message: "저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      value: content,
    };
  }

  revalidatePath("/", "layout");

  // 고위험 표현이 감지되면 일반 쉼 제안보다 도움 안내를 먼저 보여준다.
  // 글은 저장돼 있고(본인만 볼 수 있음), 제안도 만들어져 있다 —
  // 안내 화면에서 스스로 쉼을 고를 수 있게만 순서를 바꾼다.
  if (safety === "HIGH_RISK") redirect("/rest/safety");

  redirect(`/rest/suggestion/${suggestionId}`);
}
