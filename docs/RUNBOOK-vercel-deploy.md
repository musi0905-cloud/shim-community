# Runbook — Vercel 배포 + Supabase Production 연결 (Sprint 1.2)

개발 방식은 **Claude Cloud → GitHub → Vercel → Supabase** 로 고정한다.
로컬 PC 실행은 필요 없다. 이 문서의 단계는 전부 브라우저에서 끝난다.

> **왜 사람이 브라우저에서 하는가**
>
> 개발 세션 컨테이너는 egress 정책상 `vercel.com` / `api.vercel.com` /
> `*.vercel.app` / `*.supabase.co` 로 나갈 수 없다(전부 CONNECT 403).
> 도달 가능한 것은 `github.com` 뿐이다. 그래서 코드·빌드·타입체크는 세션에서
> 검증하고, 배포와 대시보드 설정·실사용 검증은 사람이 수행한다.

---

## 1. Vercel 프로젝트 만들기

1. <https://vercel.com/new> 접속
2. **Import Git Repository** 목록에서 `musi0905-cloud/shim-community` 옆
   **Import** 클릭
   - 목록에 없으면 **Adjust GitHub App Permissions** → 이 저장소 접근 허용
3. 설정 화면에서 확인만 한다. **아무것도 바꾸지 않는다.**

   | 항목 | 값 |
   | --- | --- |
   | Framework Preset | **Next.js** (자동 감지) |
   | Root Directory | `./` |
   | Build Command | 비워 둔다 (기본 `next build`) |
   | Output Directory | 비워 둔다 |
   | Install Command | 비워 둔다 (`npm ci` 자동) |
   | Node.js Version | 20 이상 |

   저장소에 `vercel.json` 을 두지 않았다. Next.js 는 zero-config 로 배포된다.

4. **Environment Variables** 를 아래 2번대로 넣는다.
5. **Deploy** 클릭.

배포가 끝나면 production URL 이 나온다. 형태는 `https://<이름>.vercel.app`.
이 값을 아래에서 `<VERCEL_URL>` 로 쓴다.

---

## 2. Vercel 환경변수

**Project → Settings → Environment Variables**

| Name | Environment | 값 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase → Project Settings → API 의 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | 같은 화면의 publishable key (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | **Production 에만** | `https://<VERCEL_URL>` |

`NEXT_PUBLIC_SITE_URL` 을 **Production 에만** 넣는 것이 중요하다.
Preview 에도 넣으면 Preview 배포에서 보낸 메일이 Production 으로 돌아온다.
비워 두면 코드가 요청이 실제로 도착한 주소를 쓴다
(`app/auth/actions.ts` 의 `resolveOrigin`).

**`SUPABASE_SERVICE_ROLE_KEY` 는 넣지 않는다.** 이번 Sprint 에 필요 없고,
이 키는 RLS 를 전부 우회한다.

환경변수를 나중에 바꿨다면 **Deployments → 최신 → ⋯ → Redeploy** 를 해야
반영된다. `NEXT_PUBLIC_` 값은 빌드 시점에 코드로 박히기 때문이다.

---

## 3. Supabase — 마이그레이션 적용

**Dashboard → SQL Editor → New query**

1. 저장소의 `supabase/migrations/20260826000000_create_profiles.sql` 를
   **전체 복사**해 붙여넣고 **Run**
2. 이어서 `supabase/verify_schema.sql` 를 새 쿼리로 붙여넣고 **Run**

**10개 행이 모두 `PASS`** 여야 한다.

| # | 확인 항목 |
| --- | --- |
| 1 | `profiles` 테이블 존재 |
| 2 | 컬럼 4개 |
| 3 | **RLS 활성화** |
| 4 | 정책 4종 (SELECT/INSERT/UPDATE/DELETE) |
| 5 | anon 역할에 정책 없음 |
| 6 | UPDATE 정책에 `with_check` 존재 |
| 7 | `updated_at` 트리거 |
| 8 | check constraint 2종 |
| 9 | `user_id` FK → `auth.users` CASCADE |
| 10 | nickname unique index 없음 (중복 허용) |

**3번이 FAIL 이면 즉시 멈춘다.** RLS 가 꺼져 있으면 publishable key 만으로
전체 테이블이 읽힌다.

---

## 4. Supabase — Auth URL 설정

**Dashboard → Authentication → URL Configuration**

- **Site URL**: `https://<VERCEL_URL>`
- **Redirect URLs** — 아래를 각각 **Add URL** 로 추가

  ```
  https://<VERCEL_URL>/auth/confirm
  https://<VERCEL_URL>/auth/callback
  ```

  로컬 개발도 할 거라면 함께 둔다.

  ```
  http://localhost:3000/auth/confirm
  http://localhost:3000/auth/callback
  ```

**Save** 를 누른다.

---

## 5. Supabase — 이메일 템플릿 (두 개 모두)

**Dashboard → Authentication → Email Templates**

`Confirm signup` 과 `Magic Link` **둘 다** 링크를 아래로 바꾼다.

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

### 왜 두 개를 모두 바꾸는가

`signInWithOtp({ shouldCreateUser: true })` 는 대상에 따라 다른 메일을 보낸다.
GoTrue 의 `internal/api/magic_link.go` 는 사용자를 찾지 못하면 `Signup`
경로로 넘긴다.

- **처음 오는 사람** → `Confirm signup` 템플릿
- **다시 오는 사람** → `Magic Link` 템플릿

하나만 바꾸면 나머지 절반의 사용자에게서 로그인이 깨진다.

### 왜 `type=email` 인가

GoTrue 의 `internal/api/verify.go` 에서 `type=email`(`EmailOTPVerification`)
은 `confirmation_token` 과 `recovery_token` 을 **모두** 확인한다.
그래서 두 템플릿이 같은 `type` 을 쓸 수 있다.
(`Confirm signup` 은 `confirmation_token`, `Magic Link` 는 `recovery_token`
에 값을 넣으므로 `type=signup` / `type=magiclink` 로 각각 맞추면 서로 바꿔
쓸 수 없다.)

변수명과 동작은 전부 GoTrue 소스에서 확인한 것이다 —
`internal/mailer/templatemailer/templatemailer.go`, `internal/api/verify.go`.

---

## 6. Preview 배포의 redirect 전략 (선택)

위 5번 템플릿의 `{{ .SiteURL }}` 은 **대시보드에 설정한 Site URL 하나로 고정**
된다. 그래서 Preview 배포에서 로그인하면 메일 링크는 Production 으로 간다.

Preview 에서도 그 Preview 주소로 돌아오게 하려면 템플릿을 이렇게 바꾼다.

```
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email
```

`{{ .RedirectTo }}` 는 앱이 보낸 `emailRedirectTo`
(= `<요청이 도착한 주소>/auth/confirm`) 다. 경로가 이미 들어 있으므로
`/auth/confirm` 을 덧붙이지 않는다.

**대신 이런 성질이 있다.** GoTrue 는 `redirect_to` 가 Redirect URLs 허용목록에
없으면 무시하고 **Site URL 로 대체**한다(`utilities.GetReferrer`).
그러면 링크가 `https://<Site URL>?token_hash=…` 가 되어 `/auth/confirm` 경로가
빠지고, 사용자는 Landing 으로 떨어진다.

따라서 이 방식을 쓰려면 Preview 도메인을 허용목록에 넣어야 한다.
Vercel Preview URL 은 배포마다 바뀌므로 와일드카드를 쓴다.

```
https://shim-community-*-<team-slug>.vercel.app/auth/confirm
```

> 정확한 Preview 도메인 형태는 첫 Preview 배포 후 실제 URL 을 보고 맞춘다.
> 추측해서 넣지 말 것.

**권장**: Production 검증이 끝나기 전에는 5번(`{{ .SiteURL }}`)을 유지한다.
경로가 항상 올바르고, Production 흐름이 확실하게 동작한다.

---

> **참고**: 아래 7~9번은 Sprint 1.2 시점(매직 링크 로그인) 기준이다.
> Sprint 2 에서 이메일+비밀번호로 바뀌었으므로, 실제 E2E 는
> `docs/RUNBOOK-sprint2-verify.md` 를 따른다. 1~6번(배포·환경변수·Auth URL·
> 템플릿)과 12.5(도메인 전환)는 그대로 유효하다.

## 7. 배포 URL 기본 확인

브라우저에서 `https://<VERCEL_URL>` 로 접속한다.

| 경로 | 기대 결과 |
| --- | --- |
| `/` | Landing — "오늘의 마음을 잠깐 내려놓는 곳." |
| `/auth` | 이메일 입력 화면 |
| `/auth/error?reason=expired` | "링크를 열 수 없어요" |
| `/onboarding/nickname` | **`/auth` 로 튕겨야 한다** (비로그인) |
| `/settings` | **`/auth` 로 튕겨야 한다** (비로그인) |

마지막 두 개가 그대로 열리면 인증 가드가 깨진 것이다. 멈추고 알린다.

---

## 8. 실제 가입 E2E

1. `https://<VERCEL_URL>/auth` → 이메일 입력 → 「로그인 링크 받기」
2. 메일의 링크를 연다
3. **닉네임 화면이 나와야 한다** (profile 이 아직 없으므로)
4. 이름을 고르거나 입력 → 「이 이름으로 시작하기」
5. **Home 으로 이동하고 상단에 그 이름이 보여야 한다**

### Supabase 에서 데이터 확인

**Dashboard → Table Editor → `profiles`**

- 새 row 가 있다
- `user_id`, `nickname`, `created_at`, `updated_at` 이 채워져 있다
- **`email` 컬럼이 없다** (설계상 `profiles` 에 이메일을 복제하지 않는다)

**Dashboard → Authentication → Users** 에서 방금 가입한 이메일이 보인다.

두 값이 이어지는지는 SQL Editor 로 확인한다.

```sql
select u.id as auth_user_id, p.user_id as profile_user_id,
       p.nickname, (u.id = p.user_id) as ids_match
from auth.users u
join public.profiles p on p.user_id = u.id
order by p.created_at desc
limit 5;
```

`ids_match` 가 `true` 여야 한다.

---

## 9. 세션 / 재로그인

| 시나리오 | 방법 | 기대 결과 |
| --- | --- | --- |
| 새로고침 | Home 에서 F5 | 로그인 유지, 같은 닉네임, 온보딩 반복 없음 |
| 브라우저 재시작 | 완전히 종료 후 재접속 | 바로 Home, 같은 닉네임 |
| 로그아웃 | `/settings` → 로그아웃 | Landing 으로. 이후 `/settings` 직접 입력 시 `/auth` 로 튕김 |
| 재로그인 | 같은 이메일로 다시 로그인 | **닉네임 화면이 다시 나오면 안 된다.** 바로 Home |
| 다른 브라우저 / 모바일 | 시크릿 창 또는 폰에서 같은 이메일 | 같은 닉네임 |

재로그인 후 row 가 늘지 않았는지 확인한다.

```sql
select count(*) as profile_count from public.profiles;
```

가입한 사람 수와 같아야 한다. 늘었다면 profile 이 중복 생성된 것이다.

---

## 10. RLS 실제 확인

계정 **A, B** 두 개로 가입한 뒤 각각의 access token 을 얻는다.

브라우저 DevTools → Application → Cookies → `sb-<project-ref>-auth-token`
값 안의 `access_token` 을 복사한다. 실제 로그인이 발급한 토큰이므로
**진짜 authenticated JWT context** 다. service_role 우회가 아니다.

이 저장소의 검증 스크립트를 쓸 수 있는 환경(네트워크가 열린 곳)이 있으면:

```bash
npm run verify:supabase -- --jwt-a <A토큰> --jwt-b <B토큰>
```

없으면 SQL Editor 에서 아래로 확인한다. **service_role 이 아니라
authenticated 역할로 흉내 내는 것이 핵심이다.**

> **반드시 `begin` … `rollback` 안에서 실행한다.**
> `set local` 은 트랜잭션 블록 밖에서는 아무 일도 하지 않고
> `WARNING: SET LOCAL can only be used in transaction blocks` 만 남긴다.
> 그러면 역할이 SQL Editor 기본값(`postgres`) 그대로라 **RLS 를 통째로
> 우회한 채** 검사가 돌고, 결과가 전부 무의미해진다.
> `rollback` 으로 끝나므로 이 스크립트는 데이터를 바꾸지 않는다.

`<A의 user_id>` / `<B의 user_id>` 를 실제 값으로 바꿔 넣는다.

```sql
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<A의 user_id>"}';

  select current_role;                                    -- authenticated 여야 한다
  select count(*) from public.profiles;                   -- 1 (자기 것만)

  update public.profiles set nickname = nickname
    where user_id = '<A의 user_id>';                       -- UPDATE 1
  update public.profiles set nickname = '탈취'
    where user_id = '<B의 user_id>';                       -- UPDATE 0

  -- 정책 위반은 트랜잭션을 중단시키므로 savepoint 로 감싼다
  savepoint before_bad_insert;
  insert into public.profiles (user_id, nickname)
    values ('<B의 user_id>', '가짜');                       -- 정책 위반 에러
  rollback to savepoint before_bad_insert;
rollback;

begin;
  set local role anon;
  set local request.jwt.claims = '';
  select count(*) from public.profiles;                   -- 0 또는 권한 에러
rollback;
```

`select current_role` 이 `authenticated` 가 아니면 나머지 결과는 믿지 않는다.

기대값:

| 검사 | 기대 |
| --- | --- |
| `current_role` | `authenticated` (아니면 아래 결과는 무효) |
| A 자기 SELECT | 1행 |
| A 자기 UPDATE | `UPDATE 1` |
| A→B SELECT | 0행 |
| A→B UPDATE | `UPDATE 0` |
| A→B INSERT | policy 위반 에러 |
| 비로그인 SELECT | 0행 또는 권한 에러 |

---

## 11. 보안 확인

- **GitHub**: 저장소에 `.env.local` 이 없다 (`.gitignore` 의 `.env*.local`)
- **Vercel**: Environment Variables 에 `SUPABASE_SERVICE_ROLE_KEY` 가 없다
- `NEXT_PUBLIC_` 에는 publishable key 만 있다.
  `sb_publishable_…` 는 브라우저에 노출되는 것이 정상이며, 실제 접근 통제는
  RLS 가 한다. `sb_secret_…` / service_role 과 혼동하지 않는다.
- 배포 사이트에서 DevTools → Network → 응답에 다른 사용자의 이메일이나
  profile 이 실려 오지 않는다

---

## 12. Production 반응형 QA

배포 URL 을 실제 기기/DevTools 로 확인한다. 375 / 390 / 768 / 1024 / 1440.

화면: Landing, `/auth`, 닉네임 온보딩, Home, `/settings`

- 가로 스크롤 없음
- 모바일: 하단 네비게이션, 잘림 없음
- 데스크톱(≥1024): 좌측 사이드바
- 터치 타깃 44px 이상
- 콘솔 에러 없음

---

## 12.5 향후 Custom Domain 전환 (이번 작업 범위 아님)

현재 `https://shim-community.vercel.app` 는 **beta / technical domain** 으로
유지한다. 브랜드가 「쉼」으로 바뀌었어도 이 주소는 바꾸지 않는다.

브랜드 도메인을 구매하면 그때 아래 순서로 전환한다. **지금 하지 않는다.**

1. **Vercel** → Project → Settings → Domains → 새 도메인 추가, DNS 검증
2. **Vercel 환경변수** → `NEXT_PUBLIC_SITE_URL` 을 새 도메인으로 변경
   (Production 에만). 바꾼 뒤 **Redeploy** — `NEXT_PUBLIC_` 은 빌드 시점에
   코드로 박힌다
3. **Supabase** → Authentication → URL Configuration → **Site URL** 을
   새 도메인으로 변경
4. **Supabase** → 같은 화면 **Redirect URLs** 에 아래 두 개 추가
   ```
   https://<새 도메인>/auth/confirm
   https://<새 도메인>/auth/callback
   ```
   기존 vercel.app 항목은 전환이 끝날 때까지 **남겨 둔다**. 먼저 지우면
   그 사이에 발송된 메일 링크가 죽는다
5. **이메일 템플릿** — `{{ .SiteURL }}` 을 쓰고 있으므로 3번만 바꾸면 링크가
   따라간다. 템플릿 자체는 손대지 않아도 된다
   (`{{ .RedirectTo }}` 방식으로 바꿔 뒀다면 4번 허용목록이 더 중요해진다)
6. 전환 확인 후 옛 Redirect URL 정리

바꾸지 않는 것: 저장소 이름, Vercel 프로젝트 이름, Supabase 프로젝트 ref,
DB 스키마, 마이그레이션 이력. 도메인만 바뀐다.

---

## 13. 막혔을 때

| 증상 | 확인할 곳 |
| --- | --- |
| 빌드 실패 | Vercel → Deployments → 실패한 배포 → Build Logs |
| 사이트는 뜨는데 로그인 화면에서 에러 | 환경변수 3개가 들어갔는지. 넣은 뒤 **Redeploy** 했는지 |
| 링크를 눌렀는데 `/auth/error` | 링크 만료(기본 1시간) 또는 이미 사용됨. 다시 받는다 |
| 링크가 localhost 로 감 | `NEXT_PUBLIC_SITE_URL` 이 Production 에 설정됐는지, Site URL 이 Vercel 주소인지 |
| 링크를 눌렀는데 Landing 으로 감 | 템플릿에 `/auth/confirm` 경로가 빠졌는지. 6번의 fallback 성질 참고 |
| 메일이 안 옴 | Supabase 기본 SMTP 는 요율 제한이 낮다. Authentication → Logs 확인. 실사용 전 자체 SMTP 연결 |
| 닉네임 저장 실패 | 3번 마이그레이션이 적용됐는지 (`verify_schema.sql` 10행 PASS) |
| 새로고침하면 로그아웃 | `proxy.ts` 가 배포됐는지. 빌드 로그에 `ƒ Proxy` 가 보여야 한다 |
