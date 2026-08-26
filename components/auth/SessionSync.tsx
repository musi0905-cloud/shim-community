"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 탭 사이 세션 동기화.
 *
 * 한 탭에서 로그아웃했는데 다른 탭이 로그인 상태로 남아 있으면, 그 탭은
 * 이미 없는 세션으로 화면을 그리고 있는 셈이다. 로그인/로그아웃이 감지되면
 * 서버 컴포넌트를 다시 그려 서버가 판단한 상태로 맞춘다.
 *
 * TOKEN_REFRESHED 는 무시한다. 토큰 갱신은 proxy 가 조용히 처리하고,
 * 여기서 refresh 를 걸면 갱신마다 화면이 다시 그려진다.
 */
export function SessionSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
