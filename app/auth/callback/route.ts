import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth / PKCE 콜백 주소로 흔히 쓰이는 경로.
 * 실제 처리는 /auth/confirm 한 곳에서만 한다. 같은 로직을 두 벌 두지 않는다.
 *
 * redirect() 대신 NextResponse.redirect 를 쓴다. typedRoutes 가 켜져 있어
 * 런타임에 조립한 문자열은 redirect() 에 넘길 수 없고, Route Handler 에서는
 * Response 를 돌려주는 쪽이 자연스럽다.
 */
export function GET(request: NextRequest) {
  const target = new URL("/auth/confirm", request.nextUrl.origin);
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target);
}
