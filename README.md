# 쉼 — 나만의 공간

> **오늘의 마음을 잠깐 내려놓는 곳.**
>
> 도파민보다, 쉼.

힘든 순간, 잠시 현실에서 거리를 두고 나에게 돌아올 수 있는 시간을 만드는
Responsive Web / PWA 서비스.

**브랜드는 「쉼」, 부제는 「나만의 공간」이다.** 두 줄 계층으로 쓰고
"쉼: 나만의 공간" 처럼 한 줄로 붙이지 않는다. 브랜드 메시지
「도파민보다, 쉼.」은 Landing 같은 브랜드 화면에서만 쓴다.

기술 식별자는 그대로 `shim-community` 다 — 저장소, Vercel 프로젝트,
npm package name, Supabase 프로젝트 모두. 브랜드를 바꿨다고 인프라를
rename 하지 않는다.

> **제품 기준**: `docs/PRODUCT.md`가 최상위 기준이다. 출처와 확정 결정은 `docs/SOURCE-OF-TRUTH.md`.
> `prototype.sprint0-reference.html`은 **Historical Sprint 0 Reference**이며 공식 Design
> Source of Truth가 아니다.
>
> **제품 지위**: 이 제품(웹/PWA)은 쉼 iOS의 보조 채널이 아니라 **독립 제품**이다. (PO-001)

## 제품 원칙

> 사용자를 오래 붙잡는 서비스가 아니라, 가능한 빨리 자기 자신에게 돌려보내는 서비스.

**영구 금지** (제품 차원 확정, PO-002): 댓글 / DM / Follow / 친구 추가 / 인기글 /
Trending / 조회수 경쟁 / Like 숫자 경쟁 / Ranking / Streak / Gamification /
Infinite Scroll / 자극적인 추천 알고리즘

Feed는 Community의 핵심 기능이지만 SNS Feed와 동일하게 설계하지 않는다.
Community의 목적은 사람을 붙잡는 것이 아니라 "내가 혼자가 아니라는 느낌을
잠깐 전달하는 것"이다.

AI는 상담 챗봇이 아니며 장시간 대화를 시작하지 않는다. Backend는 구조화된
Rest Plan을 다루고, Frontend는 이를 3영역으로 렌더링한다 (PO-003).

1. 짧은 공감
2. 구체적인 쉼 행동 1개
3. 휴대폰을 내려놓도록 안내하는 쉼의 메시지

## 실행

Supabase 프로젝트가 필요하다. 설정 절차는
`docs/ARCHITECTURE.md` 「Supabase 설정 절차」를 따른다.

```bash
cp .env.local.example .env.local   # 값을 채운다
npm ci
npm run dev     # http://localhost:3000
npm run build
npm run start
npm run typecheck
```

Node 20 이상, Next.js App Router, TypeScript strict.

## 구조

```
app/          라우트. auth-aware `/`, /auth, /onboarding/nickname, /settings
components/
  layout/     AppShell, DesktopSidebar, MobileBottomNav, RightContextPanel, AuthShell
  ui/         SurfaceCard, PrimaryButton, ButtonLink, StateCard, TextField
  home/       Landing, MoodStateSelector
  auth/       AuthForm, NicknameForm, SignOutButton, SessionSync
lib/
  supabase/   client.ts, server.ts, proxy.ts, env.ts
  auth/       dal.ts (인가), form-state.ts
  nickname.ts, platform.ts, constants.ts, types.ts
proxy.ts      세션 갱신 (Next 16에서 middleware 의 새 이름)
supabase/migrations/   profiles 테이블 + RLS
public/       manifest.webmanifest, icons/
docs/         PRODUCT.md, SOURCE-OF-TRUTH.md, ARCHITECTURE.md, SPRINTS.md
prototype.sprint0-reference.html   Historical Sprint 0 Reference (공식 기준 아님)
```

## 디자인 방향

Soft Green / Warm Beige / Off White. 넓은 여백, 낮은 정보 밀도, 최소한의 shadow.
명상 앱이나 심리상담 앱처럼 보이지 않는, 현대적이고 중립적인 웹 서비스.

색·간격·타이포는 전부 `app/globals.css`의 CSS 변수로만 정의한다.
컴포넌트에서 raw 색상값이나 magic number를 쓰지 않는다.

## 반응형 기준

375 / 390 / 768 / 1024 / 1440px

- Mobile(<1024px): Bottom Navigation, 1 column, touch target 44px 이상
- Desktop(≥1024px): 얇은 Left Sidebar + Main(최대 720px)
- ≥1280px: 선택적 Right Context Panel

## Mobile Bottom Navigation

라벨은 `--font-size-nav-label`(12px)이 하한이다. 375px에서 5탭이 들어가지 않으면
글자 크기를 줄이지 말고 좌우 padding과 gap을 먼저 조정한다.

`env(safe-area-inset-bottom)`은 `--safe-bottom` 토큰을 통해 Bottom Navigation의
`padding-bottom`과 본문 하단 여백에 함께 반영된다. `viewport-fit=cover`가 전제다.

## 배포

**Claude Cloud → GitHub → Vercel → Supabase.** 로컬 실행은 필요 없다.

배포와 Supabase 대시보드 설정 절차는 `docs/RUNBOOK-vercel-deploy.md` 를 따른다.
Vercel 전용 설정 파일(`vercel.json`)은 두지 않는다 — Next.js 는 zero-config 로
배포된다.

환경변수 3개가 필요하다. `NEXT_PUBLIC_SITE_URL` 은 **Production 에만** 넣는다.
Preview 에도 넣으면 Preview 에서 보낸 메일이 Production 으로 돌아온다.

## 검증

실제 Supabase 연결 후의 검증 절차는 `docs/RUNBOOK-supabase-e2e.md` 하나만
따라가면 된다.

```bash
npm run verify:supabase                                # 비로그인 RLS 검사
npm run verify:supabase -- --jwt-a <A토큰> --jwt-b <B토큰>   # 사용자 간 RLS 검사
```

스키마 검증은 `supabase/verify_schema.sql` 을 SQL Editor 에서 실행한다.

## 인증

Email Magic Link 방식이다. 비밀번호가 없다.

닉네임의 source of truth 는 서버의 `profiles` 테이블이며 localStorage 가
아니다. 로그아웃 후 재로그인해도, 다른 기기에서 로그인해도 같은 이름으로
이어진다. `email` 은 `profiles` 에 복제하지 않는다.

세션은 쿠키에 저장된다(`@supabase/ssr`). 인가는 `lib/auth/dal.ts` 에서만
하고, `proxy.ts` 는 세션 갱신만 한다. 마지막 방어선은 Postgres RLS 다.

## 현재 상태

Sprint 0 / 0.1 완료. Sprint 1 (Auth & 지속 익명 정체성) 코드 완료.
Supabase 프로젝트 연결 후 E2E 검증이 남아 있다.
상세는 `docs/SPRINTS.md` 참고.
