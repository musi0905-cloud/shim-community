import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 부터 middleware 는 proxy 로 이름이 바뀌었다.
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md)
 *
 * 하는 일은 세션 갱신 하나뿐이다. 리다이렉트나 권한 판단은 하지 않는다.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 정적 자산과 이미지 요청에서는 세션을 갱신할 필요가 없다.
     * 불필요한 갱신 호출을 줄이려고 제외한다.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
