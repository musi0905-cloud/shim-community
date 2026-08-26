/**
 * Supabase 환경변수 접근을 한 곳으로 모은다.
 *
 * 값이 없을 때 Supabase 내부에서 알아보기 어려운 에러가 나는 대신,
 * 무엇을 설정해야 하는지 알려주고 즉시 실패한다.
 *
 * 여기서는 NEXT_PUBLIC_ 변수만 다룬다. service_role key 는 Sprint 1 에서
 * 쓰지 않으며, 쓰게 되더라도 이 모듈을 통해 클라이언트로 새어나가지 않도록
 * 서버 전용 모듈에 따로 둔다.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `${name} 이 설정되지 않았다. .env.local.example 을 참고해 .env.local 을 만들어라.`,
    );
  }
  return value;
}

/**
 * Next.js 는 process.env.NEXT_PUBLIC_* 를 빌드 시점에 문자열로 치환한다.
 * 그래서 process.env[name] 같은 동적 접근이 아니라 직접 참조해야 한다.
 */
export function getSupabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

export function getSupabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** 매직 링크가 돌아올 주소. 설정이 없으면 요청 origin 으로 대체한다. */
export function getSiteUrl(fallbackOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return configured && configured.length > 0 ? configured : fallbackOrigin;
}
