# Runbook — Sprint 2 MVP Production 검증

Production: <https://shim-community.vercel.app>

> 개발 세션 컨테이너는 `*.vercel.app` / `*.supabase.co` 로 나갈 수 없다
> (CONNECT 403). 그래서 아래는 사람이 브라우저에서 수행한다.
> 코드·빌드·타입체크·DB 스키마·RLS 는 세션에서 검증했다.

---

## 0. 마이그레이션 적용 (먼저)

**Supabase Dashboard → SQL Editor → New query**

1. `supabase/migrations/20260827000000_mvp_core.sql` 전체를 붙여넣고 **Run**
2. `supabase/verify_mvp_schema.sql` 를 새 쿼리로 붙여넣고 **Run**
   → **14행 모두 PASS** 여야 한다

2번이 FAIL 이면 멈춘다. 특히 2행(RLS 활성화)과 12행(anon 권한 없음)이
FAIL 이면 데이터가 공개된 상태다.

기존 `profiles` 마이그레이션은 건드리지 않는다. 이 파일은 그 위에 얹힌다.

---

## 1. Vercel 재배포 확인

GitHub main 에 push 되면 자동 배포된다.
**Deployments → 최신 배포가 Ready** 인지 확인한다.

---

## 2. 신규 사용자 전체 흐름

| # | 하는 일 | 통과 기준 |
| --- | --- | --- |
| 1 | `/` 접속 | Landing |
| 2 | 「시작하기」 → 「처음이신가요? 가입하기」 | 이메일·비밀번호·확인 3칸 |
| 3 | 가입 | "메일을 보냈어요" |
| 4 | 메일 링크 클릭 | 닉네임 화면 |
| 5 | 이름 정하기 | Home, 상단에 그 이름 |
| 6 | 상태 하나 고르고 **[다음]** | `/write?state=…` 로 **이동** |
| 7 | 한 줄 적고 **[내려놓기]** | `/rest/suggestion/<id>` |
| 8 | 제안 화면 | 공감 / 쉼 행동 / 내려놓기 안내 3영역 |
| 9 | **[N분 쉬어가기]** | `/rest/session/<id>`, 타이머 감소 |
| 10 | 탭을 5분간 백그라운드 → 복귀 | 남은 시간이 **정확히 5분 줄어 있음** |
| 11 | **[그만 쉬기]** 또는 종료 대기 | 완료 문구 |
| 12 | 「다른 사람들의 하루 보기」 | `/community` 에 방금 글 |
| 13 | 반응 누르기 → 다시 누르기 | 켜짐 → 꺼짐 (toggle) |
| 14 | 「내 쉼」 | 오늘 글 + 쉼 완료 여부 + 7일 요약 |

### Supabase 에서 데이터 확인

**Table Editor** 로 `posts` / `ai_suggestions` / `rest_sessions` / `reactions`
각각에 방금 만든 row 가 있는지 본다. `posts` 에 **email 컬럼이 없는 것**도 확인.

```sql
select p.id, p.state, p.moderation_status, p.content,
       s.duration_minutes, r.completed_at is not null as rest_done
from public.posts p
left join public.ai_suggestions s on s.post_id = p.id
left join public.rest_sessions r on r.post_id = p.id
order by p.created_at desc limit 5;
```

---

## 3. 세션 / 재로그인

| 시나리오 | 통과 기준 |
| --- | --- |
| Home 에서 새로고침 | 로그인 유지, 같은 닉네임, 온보딩 반복 없음 |
| 브라우저 완전 종료 후 재접속 | 바로 Home |
| `/settings` → 로그아웃 | Landing. 이후 `/write` 직접 입력 시 `/auth` 로 튕김 |
| 같은 이메일 + 비밀번호로 로그인 | **인증 메일 없이** 바로 Home, 같은 닉네임 |
| 시크릿 창 / 폰에서 같은 계정 | 같은 닉네임 |

재로그인 후 row 가 늘지 않았는지:

```sql
select count(*) from public.profiles;   -- 가입자 수와 같아야 한다
```

---

## 4. 기존 매직링크 사용자 (중요)

이미 매직링크로 가입한 계정이 깨지지 않아야 한다.

1. 그 계정으로 **로그인된 상태**에서 `/settings` → 「비밀번호」
2. 비밀번호를 저장
3. 로그아웃 → 이메일 + 그 비밀번호로 로그인
4. **같은 닉네임, 같은 기록** 이어야 한다

로그인이 안 되는 상태라면 `/auth` → 「비밀번호를 아직 만들지 않았나요?」 로
재설정 메일을 받아 링크를 타면 `/settings` 로 도착한다.

```sql
select count(*) from public.profiles;   -- 위 과정에서 늘어나면 안 된다
```

---

## 5. Safety

테스트 계정으로 확인한다. **본인 계정으로 시험하지 않아도 된다.**

| 입력 | 기대 |
| --- | --- |
| 평범한 한 줄 | 정상 → Rest 제안 |
| 욕설이나 전화번호 포함 | 저장되지만 `/community` 에 **안 보임** |
| 자해·자살 표현 | Rest 제안 대신 **`/rest/safety` 안내 화면** |

```sql
select moderation_status, count(*) from public.posts group by 1;
```

`review` / `restricted` 는 Feed 에 없어야 한다. 「내 쉼」에서는
"이 글은 나만 볼 수 있어요" 로 표시된다.

---

## 6. RLS 실제 확인

계정 A, B 두 개로 각각 글을 쓴 뒤 SQL Editor 에서 확인한다.

> **반드시 `begin` … `rollback` 안에서 실행한다.** `set local` 은 트랜잭션
> 밖에서는 아무 일도 하지 않고, 역할이 `postgres` 인 채로 **RLS 를 통째로
> 우회한** 결과가 나온다.

```sql
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<A의 user_id>"}';

  select current_role;                                  -- authenticated 여야 한다
  select count(*) from public.posts;                    -- A 의 글 수만
  select count(*) from public.community_feed;           -- approved 전체 (A+B)
  select count(*) from public.reactions;                -- A 가 누른 것만

  savepoint s;
  insert into public.posts (user_id, state, content)
    values ('<B의 user_id>', 'okay_today', '가짜');      -- 정책 위반 에러
  rollback to savepoint s;
rollback;

begin;
  set local role anon; set local request.jwt.claims = '';
  select count(*) from public.community_feed;           -- 권한 거부여야 한다
rollback;
```

---

## 7. 보안 확인

- Vercel Environment Variables 에 `SUPABASE_SERVICE_ROLE_KEY` **없음**
- GitHub 저장소에 `.env.local` **없음**
- 배포 사이트 DevTools → Network: 응답에 **다른 사용자의 이메일 없음**
- `NEXT_PUBLIC_` 에는 publishable key(`sb_publishable_…`) 만.
  이건 브라우저에 노출되는 것이 정상이며 실제 통제는 RLS 가 한다.
  `sb_secret_…` / service_role 과 혼동하지 않는다.

---

## 8. 반응형

375 / 390 / 768 / 1024 / 1440 에서 Landing · `/auth` · Home · `/write` ·
제안 · 쉼 · `/community` · `/my-rest` · `/settings` 를 본다.

- 가로 스크롤 없음
- 모바일 하단 네비 5개, 데스크톱(≥1024) 좌측 사이드바
- 터치 타깃 44px 이상
- 콘솔 에러 없음

---

## 9. 막혔을 때

| 증상 | 확인 |
| --- | --- |
| 글 저장 실패 | 0번 마이그레이션 적용됐는지 (`verify_mvp_schema.sql` 14행 PASS) |
| Feed 가 비어 있음 | 글이 `approved` 인지. Safety 에 걸리면 안 보인다 |
| 반응이 안 눌림 | `reactions` RLS 정책 3종이 있는지 |
| 타이머가 어긋남 | `rest_sessions.ends_at` 이 채워져 있는지 |
| 가입 메일 안 옴 | Supabase 기본 SMTP 요율 제한. Authentication → Logs |
| 로그인 후 바로 튕김 | `proxy.ts` 배포됐는지. 빌드 로그에 `ƒ Proxy` |
