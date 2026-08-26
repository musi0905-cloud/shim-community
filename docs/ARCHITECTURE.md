# Architecture

> 제품 기준은 `docs/PRODUCT.md`를 따른다. 이 문서는 기술 구조만 다룬다.

## 스택

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | RSC 기본, PWA/metadata 지원, 이후 서버 액션으로 Supabase 연결 용이 |
| Language | TypeScript (strict) | `noUncheckedIndexedAccess` 포함 |
| Styling | CSS Modules + CSS 변수 | 추가 의존성 0. 토큰을 한 곳에서 통제 |
| State | React local state | Sprint 0 범위에서 전역 상태가 필요 없다 |

의존성은 `next`, `react`, `react-dom` 셋뿐이다. UI 라이브러리를 넣지 않은 이유는
generic한 대시보드 느낌을 피하고 여백·밀도를 직접 통제하기 위해서다.

## 레이어

```
app/            라우팅 + 페이지 조립 (서버 컴포넌트 기본)
components/ui/      상태 없는 표현 단위
components/layout/  화면 골격
components/home/    화면별 조합
lib/            도메인 타입 / 상수 / 플랫폼 감지 (React 비의존)
```

규칙:

- `lib/`는 React를 import하지 않는다. (`usePlatformCapabilities`만 예외적으로
  `lib/usePlatformCapabilities.ts`에 분리)
- `components/ui/`는 도메인을 모른다. label과 상태를 props로만 받는다.
- 문구·목록 등 데이터는 `lib/constants.ts`에 모은다. 이후 DB로 옮길 때
  이 파일만 교체하면 된다.
- 서버 컴포넌트를 기본으로 두고, 상호작용이 필요한 곳만 `"use client"`를 붙인다.
  (`app/page.tsx`는 서버 컴포넌트, `AppShell`/`MoodStateSelector`는 클라이언트)

## Design Token

`app/globals.css`의 `:root`가 단일 출처다.

- Color: `--background`, `--surface`, `--surface-soft`, `--text-primary`,
  `--text-secondary`, `--primary`, `--primary-hover`, `--primary-soft`,
  `--border`, `--danger`
- Radius: `--radius-sm|md|lg|xl`
- Spacing: `--space-1`~`--space-9` (4/8/12/16/20/24/32/40/48)
- Typography: page title / section title / body / caption / button label
- Layout: `--layout-main-max`, `--layout-sidebar-width`,
  `--layout-context-width`, `--bottom-nav-height`, `--touch-target-min`
- Nav: `--font-size-nav-label` (12px 하한), `--safe-bottom`

색 조합은 모두 WCAG AA(4.5:1) 이상을 만족하도록 골랐다.

## Shell

```
<AppShell>
  DesktopSidebar     (>=1024px)
  contentArea
    main             (max 720px)
    RightContextPanel(>=1280px, optional)
  MobileBottomNav    (<1024px)
```

Sprint 0에는 실제 라우트가 하나(`/`)뿐이므로, 네비게이션은 `<button>`으로 두고
active state만 로컬에서 관리한다. Sprint 1에서 `next/link`의 `<Link>`와
`usePathname()`으로 교체한다 — `NAV_ITEMS`에 `href`는 이미 들어 있다.

## Platform Capability

`lib/platform.ts`는 feature detection을 우선한다.

- `supportsPush`는 `PushManager` **와** `serviceWorker`가 모두 있을 때만 true
- iPadOS는 `MacIntel` + `maxTouchPoints > 1`로 함께 판별
- OS 플래그(`isIOS`/`isAndroid`/`isDesktop`)는 기능 판단이 아니라
  **안내 문구 분기**에만 쓴다
- 권한 요청은 하지 않는다. 순수 조회 함수다.
- SSR에서는 `DEFAULT_CAPABILITIES`(전부 false)를 반환하고,
  `usePlatformCapabilities`가 hydration 이후 실제 값으로 교체한다.

## PWA

`public/manifest.webmanifest`를 `app/layout.tsx`의 `metadata.manifest`로 연결한다.
`viewport.themeColor`와 manifest의 `theme_color`는 `lib/constants.ts`의
`BRAND_COLORS`와 같은 값을 쓴다.

Service Worker와 실제 Push 발송은 Sprint 7 범위다. 현재는 PWA-ready 구조만 있다.
아이콘은 placeholder(단색 원)이며 디자인 확정 후 교체한다.

## 라우트 구조

| 경로 | 역할 | 접근 조건 |
| --- | --- | --- |
| `/` | auth-aware root. 비로그인이면 Landing, 로그인+닉네임이면 Home | 없음 |
| `/auth` | 이메일 입력 → 매직 링크 발송 | 로그인 상태면 `/` 로 보냄 |
| `/auth/confirm` | 매직 링크가 돌아오는 Route Handler. 세션을 세운다 | 없음 |
| `/auth/callback` | `/auth/confirm` 으로 넘기는 별칭 (OAuth 대비) | 없음 |
| `/auth/error` | 만료·잘못된 링크 안내 | 없음 |
| `/onboarding/nickname` | 닉네임 확정 | 로그인 필요. 닉네임이 이미 있으면 `/` |
| `/settings` | 닉네임 확인, 로그아웃 | 로그인 + 닉네임 필요 |

**`/` 를 auth-aware root 로 둔 이유.** `/home` 을 따로 만들면 로그인한 사용자가
접속할 때마다 `/` → `/home` 리다이렉트를 한 번 더 거친다. 지친 상태로 들어온
사람에게 그 한 단계가 그대로 지연으로 보인다. `/` 하나로 두면 재방문 시
세션 복원 후 바로 자기 자리가 나온다.

**네비게이션.** `NAV_ITEMS` 는 `routed: true | false` 로 갈라져 있다.
`routed: true` 인 항목만 `href` 를 가지며 `<Link>` 로 이동한다. 나머지(글쓰기,
함께한 하루, 내 쉼, 짧은 쉼)는 Sprint 2 이후에 만들 화면이라 지금 링크로
만들면 404 가 된다. `typedRoutes` 가 켜져 있어 존재하지 않는 route 를 타입
단계에서 거부하므로, 페이지를 만들기 전에는 `href` 를 넣을 수 없다.

## 인증 구조

```
요청
 → proxy.ts            세션 갱신만 (인가 판단 없음)
 → Server Component
 → lib/auth/dal.ts     requireUser / requireProfile — 실제 인가
 → Supabase
 → Postgres RLS        마지막 방어선
```

**proxy 에서 인가하지 않는 이유.** Next.js 문서가 명시한다 — proxy 는 prefetch
를 포함한 모든 요청에서 실행되므로 낙관적 확인 이상을 맡기면 안 된다.
그래서 `proxy.ts` 는 `updateSession()` 하나만 호출하고 리다이렉트하지 않는다.
접근 차단은 각 페이지가 `requireUser()` / `requireProfile()` 로 한다.

**`getUser()` 를 쓰고 `getSession()` 을 쓰지 않는 이유.** `getSession()` 은
쿠키에 담긴 JWT 를 그대로 믿는다. 쿠키는 위조될 수 있으므로 서버에서
신뢰할 수 있는 것은 Supabase 에 검증을 요청하는 `getUser()` 뿐이다.

**세션 저장 위치.** `@supabase/ssr` 은 세션을 쿠키에 담는다. localStorage 가
아니다. 그래서 SSR 이 첫 렌더부터 로그인 상태를 알고, 새로고침·브라우저
재시작에도 세션이 유지되며, hydration mismatch 가 생기지 않는다.

## 닉네임 중복 정책

**중복을 허용한다.**

익명 서비스에서 닉네임 uniqueness 를 강제하면 "이미 사용 중인 이름입니다" 를
반복해서 만나게 되고, 가입이라는 마찰 구간이 길어진다. 이 제품에서 그 비용은
특히 크다 — 지친 상태로 들어온 사람에게 이름 짓기 퍼즐을 시키는 셈이다.

실제 identity 는 `user_id` 이지 닉네임이 아니다. 닉네임은 표시용 이름일 뿐이다.
따라서 `profiles.nickname` 에 unique index 를 만들지 않는다.

Community Feed 에서 같은 닉네임이 여럿 보이는 상황은 이후 Sprint 에서
표시 방식으로 푼다 (예: 글 단위 구분). uniqueness 로 풀지 않는다.

## AI Rest 연결 지점 (PO-003)

Backend/Domain은 구조화된 Rest Plan을, Frontend는 3영역 표현을 다룬다.
타입은 `lib/types.ts`에 두고 화면이 스키마를 직접 만들지 않게 한다.

```ts
interface RestPlan {
  acknowledgement: string;
  action: { type: string; duration_minutes: number; instruction: string };
  closing: string;
}
```

확장 예정: `placeRecommendation`, `safetyLevel`, `fallbackType`.

## Supabase 설정 절차

코드만으로는 동작하지 않는다. Supabase 프로젝트에서 아래를 설정해야 한다.

1. **환경변수** — `.env.local.example` 를 복사해 `.env.local` 을 만들고
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를 채운다.
   (Supabase 대시보드 → Project Settings → API)

2. **마이그레이션 적용** — `supabase/migrations/20260826000000_create_profiles.sql`
   을 SQL Editor 에 붙여넣거나 `supabase db push` 로 적용한다.
   RLS 활성화와 정책이 이 파일에 들어 있다.

3. **Redirect URL 허용** — Authentication → URL Configuration 에
   `http://localhost:3000/auth/confirm` (배포 시 실제 도메인) 을 추가한다.

4. **이메일 템플릿** (권장) — Authentication → Email Templates 에서
   **두 개**를 모두 바꾼다.

   - **Confirm signup**
   - **Magic Link**

   둘 다 링크를 아래로 바꾼다.

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

   **두 개를 모두 바꿔야 하는 이유.** `signInWithOtp({ shouldCreateUser: true })`
   는 대상에 따라 서로 다른 메일을 보낸다. GoTrue 의 `magic_link.go` 는 사용자를
   찾지 못하면 `Signup` 경로로 넘기므로,

   - **처음 오는 사람** → Confirm signup 템플릿
   - **다시 오는 사람** → Magic Link 템플릿

   하나만 바꾸면 나머지 절반의 사용자에게서 로그인이 깨진다.

   **`type=email` 인 이유.** GoTrue 의 verify 는 `type=email`
   (`EmailOTPVerification`) 일 때 `confirmation_token` 과 `recovery_token` 을
   **모두** 확인한다. 그래서 두 템플릿 모두 같은 `type=email` 로 둘 수 있다.
   반면 Confirm signup 은 `confirmation_token`, Magic Link 는 `recovery_token`
   에 값을 넣으므로, `type=signup` / `type=magiclink` 로 각각 맞추면 서로
   바꿔 쓸 수 없다.

   > 위 변수명(`{{ .SiteURL }}` `{{ .TokenHash }}`)과 `type` 값은 추측이 아니라
   > GoTrue 소스(`supabase/auth`)의 `internal/mailer/templatemailer/templatemailer.go`
   > 와 `internal/api/verify.go` 에서 확인한 것이다.

   기본 템플릿(`{{ .ConfirmationURL }}`)도 동작하지만 PKCE 흐름이라
   **메일을 요청한 그 브라우저에서 링크를 열어야 한다.** code_verifier 가
   그 브라우저 쿠키에만 있기 때문이다. `token_hash` 방식은 다른 기기에서
   열어도 동작한다. `/auth/confirm` 은 두 형태를 모두 받는다.

5. **SMTP** — 기본 Supabase 메일 발송은 요율 제한이 낮다. 실사용 전에
   자체 SMTP 를 연결한다.

## 이후 Supabase 연결 지점

- `lib/types.ts`의 `MoodStateId`가 저장 key가 된다. UI 문구가 바뀌어도 유지한다.
- `MoodStateSelector`는 선택 결과를 `onNext(id)`로 위로 넘긴다.
  저장/라우팅은 상위(페이지 또는 서버 액션)에서 붙인다.
- 데이터 접근은 `lib/` 아래 별도 모듈로 추가하고, 컴포넌트가 직접 client를
  만들지 않게 한다.
