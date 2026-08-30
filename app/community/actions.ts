"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isReactionType } from "@/lib/community/reaction-type";
import type { ReactionType } from "@/lib/types";

/**
 * 반응 toggle.
 *
 * 이미 눌렀으면 지우고, 아니면 추가한다. unique(post_id,user_id,reaction_type)
 * 가 중복을 막으므로 경쟁 상태에서도 두 개가 생기지 않는다.
 * user_id 는 세션에서 가져온다. 폼 값을 믿지 않는다.
 *
 * postId/reactionType 은 formData 가 아니라 버튼의 formAction 에 .bind() 로
 * 실어 온다 — 같은 액션을 공유하는 여러 버튼 각각에 다른 값을 넘기는
 * Next.js 의 방식이다. 그래도 둘 다 클라이언트가 준 값이므로 그대로
 * 믿지 않고 여기서 다시 검증한다.
 */
export async function toggleReaction(
  postId: string,
  reactionType: ReactionType,
  _formData: FormData,
) {
  const profile = await requireProfile();

  if (typeof postId !== "string" || postId.length === 0 || !isReactionType(reactionType)) {
    return;
  }

  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profile.user_id)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (readError) {
    console.error("[reactions] 조회 실패", { code: readError.code });
    return;
  }

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) console.error("[reactions] 삭제 실패", { code: error.code });
  } else {
    const { error } = await supabase.from("reactions").insert({
      post_id: postId,
      user_id: profile.user_id,
      reaction_type: reactionType,
    });
    // 23505 = 이미 눌렀다. 동시에 두 번 눌린 경우이므로 조용히 넘어간다.
    if (error && error.code !== "23505") {
      console.error("[reactions] 추가 실패", { code: error.code });
    }
  }

  revalidatePath("/community");
}
