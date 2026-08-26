"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * 로그아웃.
 *
 * 실패하더라도 사용자를 로그인 상태로 붙잡아 두지 않는다. 로그아웃이 안 되는
 * 것은 마음 상태를 적는 서비스에서 특히 나쁜 실패다. 서버 세션 해제가
 * 실패해도 쿠키는 정리되므로 그대로 진행한다.
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
