# Runbook — Supabase 연결 및 E2E 검증 (Sprint 1.1)

이 문서 하나만 따라가면 Sprint 1 의 인증·프로필·세션·RLS 를 실제 환경에서
검증할 수 있다. 각 단계에 **무엇이 나오면 통과인지**를 적어 두었다.

> **왜 사람이 직접 실행하는가**
>
> 개발 세션이 도는 컨테이너는 egress 정책상 `*.supabase.co` 로 나갈 수 없다.
> 프록시가 CONNECT 에 403 을 돌려주고, Supabase 쪽 오류 메시지는 이렇게 나온다.
>
> ```
> Host not in allowlist: <project-ref>.supabase.co.
> Add this host to your network egress settings to allow access.
> ```
>
> 컨테이너 이미지 레지스트리의 blob CDN 도 막혀 있어 로컬 Supabase 스택도
> 띄울 수 없다. 그래서 실제 연결이 필요한 단계는 아래 둘 중 하나로 푼다.
>
> 1. **네트워크가 열린 로컬 환경에서 이 문서를 따라 실행한다.** (지금 바로 가능)
> 2. **환경의 network egress 설정에 `*.supabase.co` 를 추가한다.**
>    그러면 개발 세션에서도 검증을 수행할 수 있다.
>    (Claude Code on the web → 환경 설정 → 네트워크 접근)
>
> `npm run verify:supabase` 는 서버에 닿지 못하면 **exit 3 으로 즉시 중단**한다.
> 연결이 안 된 상태를 PASS 로 보고하지 않기 위해서다.

---

## 0. 준비

```bash
cp .env.local.example .env.local
```

`.env.local` 에 값을 채운다. (Supabase 대시보드 → Project Settings → API)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`service_role` key 는 넣지 않는다. 이 검증에 필요하지 않다.

`.env.local` 은 `.gitignore` 에 걸려 있다. commit 되지 않는지 확인:

```bash
git status --porcelain | grep -i env    # .env.local 이 나오면 안 된다
```

---

## 1. 마이그레이션 적용

**방법 A — SQL Editor (가장 확실)**

`supabase/migrations/20260826000000_create_profiles.sql` 전체를 복사해
Supabase 대시보드 → SQL Editor 에 붙여넣고 실행한다.

**방법 B — CLI**

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

### 적용 결과 확인

`supabase/verify_schema.sql` 을 SQL Editor 에 붙여넣고 실행한다.
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

3번이 FAIL 이면 **즉시 멈춘다.** RLS 가 꺼진 채로 두면 anon key 만으로
전체 테이블이 읽힌다.

---

## 2. Auth 설정

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000`
- Redirect URLs:
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/auth/callback`
  - (배포 시) `https://<도메인>/auth/confirm`, `https://<도메인>/auth/callback`

**Authentication → Email Templates — 두 개를 모두 바꾼다**

`Confirm signup` 과 `Magic Link` 의 링크를 각각 아래로 바꾼다.

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

두 개를 모두 바꿔야 하는 이유와 `type=email` 인 근거는
`docs/ARCHITECTURE.md`「Supabase 설정 절차」4번에 적어 두었다.
요약: 처음 오는 사람은 Confirm signup 메일을, 다시 오는 사람은 Magic Link
메일을 받는다. 하나만 바꾸면 나머지 절반에서 로그인이 깨진다.

---

## 3. E2E 시나리오

```bash
npm ci
npm run dev
```

### A. 신규 가입

1. `http://localhost:3000` → Landing 이 보인다
2. 「시작하기」 → `/auth`
3. 이메일 입력 → 「로그인 링크 받기」
4. 메일의 링크를 연다
5. **닉네임 화면(`/onboarding/nickname`)이 나와야 한다** — profile 이 없으므로
6. 추천 이름을 고르거나 직접 입력 → 「이 이름으로 시작하기」
7. **Home 으로 이동하고 상단에 그 닉네임이 보여야 한다**

SQL Editor 확인:

```sql
select u.id, u.email, p.nickname, p.created_at
from auth.users u
left join public.profiles p on p.user_id = u.id
order by u.created_at desc
limit 5;
```

`profiles.nickname` 이 채워져 있고 `user_id` 가 `auth.users.id` 와 같아야 한다.

### B. 새로고침

Home 에서 새로고침 → 로그인 상태와 닉네임 유지.
브라우저 콘솔에 hydration 경고가 없어야 한다.

### C. 브라우저 재시작

브라우저를 완전히 종료 → 다시 `http://localhost:3000` → 바로 Home.
(세션이 localStorage 가 아니라 쿠키에 있어서 유지된다.)

### D. Logout

`/settings` → 「로그아웃」 → Landing.
그 상태로 `/settings` 를 직접 입력하면 `/auth` 로 튕겨야 한다.

### E. 재로그인

같은 이메일로 다시 로그인.
**닉네임 화면이 다시 나오면 안 된다.** 바로 Home 이고 닉네임이 같아야 한다.

```sql
select count(*) from public.profiles;   -- 가입한 사람 수와 같아야 한다 (늘어나면 안 됨)
```

### F. 다른 브라우저

시크릿 창이나 다른 브라우저에서 같은 이메일로 로그인 →
같은 닉네임이 나와야 한다.

---

## 4. RLS 실제 검증

계정 두 개(A, B)를 각각 가입시킨 뒤 access token 을 얻는다.

DevTools → Application → Cookies → `sb-<project-ref>-auth-token` 값 안의
`access_token` 을 복사한다. 이 토큰은 실제 로그인이 발급한 것이므로
**진짜 authenticated JWT context** 다. service_role 우회가 아니다.

```bash
npm run verify:supabase -- --jwt-a <A토큰> --jwt-b <B토큰>
```

토큰 없이 실행하면 비로그인 검사만 수행한다.

```bash
npm run verify:supabase
```

검사 항목:

- 비로그인 SELECT / INSERT 차단
- A: 자기 profile SELECT / UPDATE 가능
- A: B 의 profile SELECT / UPDATE / DELETE 불가
- A: B 의 user_id 로 INSERT 불가
- A: 자기 row 의 user_id 를 B 로 바꿔치기 불가
- B: 자기 것만 보임
- 닉네임 길이 / 앞뒤 공백 → DB constraint 차단

**모두 PASS 여야 한다.** 스크립트는 토큰이나 키를 출력하지 않는다.

종료 코드:

| exit | 뜻 |
| --- | --- |
| 0 | 전부 통과 |
| 1 | 검사 항목 실패 (RLS 가 의도대로 동작하지 않음) |
| 2 | 환경변수 없음 |
| 3 | **서버에 닿지 못함 — 아무것도 검증되지 않았다** |

3번을 0번과 구분하는 것이 중요하다. 연결이 끊긴 채로 "차단됨" 을 성공으로
세면 아무 검사도 하지 않고 전부 통과한 것처럼 보인다.

---

## 5. 보안 재확인

```bash
npm run build
grep -rl "service_role\|SUPABASE_SERVICE" .next/static/ || echo "client bundle 유출 없음"
git status --porcelain | grep -i env || echo ".env.local 미추적"
```

브라우저에서도 확인:

- DevTools → Network → 응답 어디에도 이메일 주소가 실려 오지 않는다
  (본인이 입력한 로그인 화면 제외)
- `profiles` 를 공개로 조회하는 요청이 없다

---

## 6. 실패했을 때

| 증상 | 확인할 곳 |
| --- | --- |
| 링크를 눌렀는데 `/auth/error` | 링크 만료(기본 1시간) 또는 이미 사용됨. 다시 받으면 된다 |
| 링크를 눌렀는데 로그인이 안 됨 | Redirect URLs 에 `/auth/confirm` 이 있는지. 이메일 템플릿을 **두 개 다** 바꿨는지 |
| 메일이 안 옴 | Supabase 기본 SMTP 는 요율 제한이 낮다. Authentication → Logs 확인. 실사용 전 자체 SMTP 연결 |
| 닉네임 저장 실패 | 마이그레이션이 적용됐는지, RLS 정책 4종이 있는지 (`verify_schema.sql`) |
| 새로고침하면 로그아웃 | `proxy.ts` 가 동작하는지. `npm run build` 출력에 `Proxy (Middleware)` 가 보여야 한다 |
