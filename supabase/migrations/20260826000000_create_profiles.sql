-- 쉼 Community — profiles
--
-- 지속 익명 정체성(Persistent Anonymous Identity)의 저장소다.
-- 닉네임의 source of truth 는 이 테이블이며 localStorage 가 아니다.
-- 그래서 로그아웃 후 재로그인해도, 다른 기기에서 로그인해도 같은 이름이 유지된다.
--
-- email 은 여기에 복제하지 않는다. auth.users 에만 두고, 커뮤니티에 노출될 수
-- 있는 테이블에는 현실 신원과 이어지는 식별자를 두지 않는다.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 길이는 UI 검증(lib/nickname.ts)과 같은 규칙을 DB 에서도 강제한다.
  -- 클라이언트를 우회해 직접 호출해도 규칙이 깨지지 않게 한다.
  constraint profiles_nickname_length check (
    char_length(btrim(nickname)) between 2 and 16
  ),
  -- 앞뒤 공백이 남은 채로 저장되지 않게 한다.
  constraint profiles_nickname_trimmed check (nickname = btrim(nickname))
);

comment on table public.profiles is
  '지속 익명 정체성. 닉네임의 source of truth. email 을 복제하지 않는다.';

-- 닉네임 중복은 허용한다. (docs/ARCHITECTURE.md 「닉네임 중복 정책」)
-- 익명 서비스에서 uniqueness 를 강제하면 가입 UX 만 복잡해지고,
-- 실제 identity 는 user_id 이지 닉네임이 아니다.
-- 따라서 nickname 에 unique index 를 만들지 않는다.

-- ── updated_at 자동 갱신 ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────
-- 반드시 활성화한다. 활성화하지 않으면 anon key 로 전체 테이블이 읽힌다.
alter table public.profiles enable row level security;

-- 사용자는 자기 row 만 읽는다.
-- 다른 사용자의 닉네임 공개 조회는 Sprint 1 범위가 아니다.
-- 이후 Community Feed 에서 필요해지면 public-safe view 로 따로 설계한다.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- 자기 자신의 row 만 만들 수 있다. user_id 를 남의 것으로 넣을 수 없다.
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- using 과 with_check 를 모두 건다.
-- with_check 가 없으면 자기 row 를 남의 user_id 로 바꿔치기할 수 있다.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- anon 역할에는 어떤 정책도 주지 않는다.
-- 로그인하지 않은 요청은 이 테이블의 어떤 row 도 볼 수 없다.
