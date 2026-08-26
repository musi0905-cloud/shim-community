"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { REACTIONS } from "@/lib/constants";
import type { ReactionType } from "@/lib/types";

function isReactionType(value: unknown): value is ReactionType {
  return typeof value === "string" && REACTIONS.some((r) => r.type === value);
}

/**
 * 반응 toggle.
 *
 * 이미 눌렀으면 지우고, 아니면 추가한다. unique(post_id,user_id,reaction_type)
 * 가 중복을 막으므로 경쟁 상태에서도 두 개가 생기지 않는다.
 * user_id 는 세션에서 가져온다. 폼 값을 믿지 않는다.
 */
export async function toggleReaction(formData: FormData) {
  const profile = await requireProfile();

  const postId = formData.get("postId");
  const reactionType = formData.get("reactionType");

  if (typeof postId !== "string" || !isReactionType(reactionType)) {
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
