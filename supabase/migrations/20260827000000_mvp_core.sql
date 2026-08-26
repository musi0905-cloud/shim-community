-- 쉼 Community — MVP core (Sprint 2)
--
-- posts / ai_suggestions / rest_sessions / reactions 와
-- Community Feed 가 쓸 최소 공개 view 를 만든다.
--
-- 기존 마이그레이션(20260826000000_create_profiles.sql)은 수정하지 않는다.
-- 이 파일은 그 위에 얹는다.
--
-- 원칙
--  - 모든 사용자 테이블에 RLS 를 켠다. anon 에는 어떤 정책도 주지 않는다.
--  - email 은 어디에도 복제하지 않는다. auth.users 에만 있다.
--  - 다른 사람의 글/닉네임은 테이블을 직접 열지 않고, 컬럼을 고정한
--    view 로만 내보낸다.

-- ── posts ─────────────────────────────────────────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  state text not null,
  content text not null,

  -- Safety 분류 결과. NORMAL→approved / REVIEW→review / HIGH_RISK→restricted
  -- approved 만 Community 에 나간다. 나머지도 본인에게는 계속 보인다.
  moderation_status text not null default 'approved',

  created_at timestamptz not null default now(),

  constraint posts_state_valid check (state in (
    'long_day', 'tired_of_people', 'too_many_thoughts',
    'no_energy', 'want_quiet', 'okay_today'
  )),
  -- UI 와 같은 규칙을 DB 에서도 강제한다. 클라이언트를 우회해도 깨지지 않게.
  constraint posts_content_length check (char_length(btrim(content)) between 1 and 200),
  constraint posts_content_trimmed check (content = btrim(content)),
  constraint posts_moderation_valid check (moderation_status in ('approved', 'review', 'restricted'))
);

comment on table public.posts is
  '사용자가 내려놓은 한 줄. email 을 복제하지 않는다.';

-- Community Feed 는 approved 를 최신순으로 훑는다.
create index posts_feed_idx
  on public.posts (created_at desc)
  where moderation_status = 'approved';

-- 내 쉼(최근 7일)은 본인 것만 최신순으로 훑는다.
create index posts_user_created_idx on public.posts (user_id, created_at desc);

alter table public.posts enable row level security;

create policy "posts_select_own" on public.posts
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "posts_insert_own" on public.posts
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "posts_update_own" on public.posts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "posts_delete_own" on public.posts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── ai_suggestions ────────────────────────────────────────────────────
create table public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,

  -- Rest Plan (PO-003). Backend 는 구조화된 형태로 들고,
  -- Frontend 는 3영역으로 렌더링한다.
  acknowledgement text not null,
  action_type text not null,
  duration_minutes integer not null,
  instruction text not null,
  closing text not null,

  -- 어떤 제공자가 만들었는지. 나중에 AI 로 교체해도 과거 기록을 구분할 수 있다.
  provider text not null default 'rule',

  created_at timestamptz not null default now(),

  constraint ai_suggestions_duration_valid check (duration_minutes in (3, 5, 10))
);

comment on table public.ai_suggestions is
  'AI Rest Director 가 만든 Rest Plan. provider 로 생성 주체를 구분한다.';

create index ai_suggestions_post_idx on public.ai_suggestions (post_id);

alter table public.ai_suggestions enable row level security;

create policy "ai_suggestions_select_own" on public.ai_suggestions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "ai_suggestions_insert_own" on public.ai_suggestions
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "ai_suggestions_delete_own" on public.ai_suggestions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── rest_sessions ─────────────────────────────────────────────────────
create table public.rest_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 글 없이 바로 짧은 쉼만 할 수도 있다.
  post_id uuid references public.posts (id) on delete set null,

  duration_minutes integer not null,
  started_at timestamptz not null default now(),

  -- 남은 시간은 ends_at - now() 로 계산한다. 클라이언트 타이머를 믿지 않는다.
  -- 브라우저가 백그라운드로 갔다 돌아와도 값이 흔들리지 않는다.
  ends_at timestamptz not null,
  completed_at timestamptz,

  created_at timestamptz not null default now(),

  constraint rest_sessions_duration_valid check (duration_minutes in (3, 5, 10)),
  constraint rest_sessions_ends_after_start check (ends_at > started_at)
);

comment on table public.rest_sessions is
  '실제 쉼 세션. 남은 시간은 ends_at 기준으로 계산한다.';

create index rest_sessions_user_created_idx
  on public.rest_sessions (user_id, created_at desc);

alter table public.rest_sessions enable row level security;

create policy "rest_sessions_select_own" on public.rest_sessions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "rest_sessions_insert_own" on public.rest_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "rest_sessions_update_own" on public.rest_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "rest_sessions_delete_own" on public.rest_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── reactions ─────────────────────────────────────────────────────────
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),

  constraint reactions_type_valid check (reaction_type in ('heart', 'leaf', 'cup')),
  -- 같은 사람이 같은 글에 같은 반응을 두 번 남기지 못한다. toggle 의 근거.
  constraint reactions_unique unique (post_id, user_id, reaction_type)
);

comment on table public.reactions is
  '나도 그래요 / 같이 쉬어요 / 오늘도 수고했어요. 숫자 경쟁을 만들지 않는다.';

create index reactions_post_idx on public.reactions (post_id);

alter table public.reactions enable row level security;

-- 자기 반응만 직접 읽는다. "누가 눌렀는지" 는 공개하지 않는다.
-- 합계는 아래 post_reaction_counts view 로만 나간다.
create policy "reactions_select_own" on public.reactions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "reactions_insert_own" on public.reactions
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "reactions_delete_own" on public.reactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── 공개 surface ──────────────────────────────────────────────────────
--
-- profiles 는 여전히 자기 row 만 SELECT 된다. Community 에서 남의 닉네임이
-- 필요하다고 profiles 를 열지 않는다.
--
-- 대신 컬럼을 고정한 view 두 개만 authenticated 에 연다.
-- view 는 소유자(postgres) 권한으로 실행되므로 밑단 RLS 를 통과하지만,
-- 나가는 컬럼과 행이 정의에 박혀 있어 그 밖은 새어나갈 수 없다.
-- (security_invoker 를 켜면 이 목적이 깨진다. 일부러 기본값을 쓴다.)

create view public.community_feed as
select
  po.id as post_id,
  po.user_id,
  pr.nickname,
  po.state,
  po.content,
  po.created_at
from public.posts po
join public.profiles pr on pr.user_id = po.user_id
where po.moderation_status = 'approved';

comment on view public.community_feed is
  'Community Feed 전용 공개 view. approved 글의 nickname 만 내보낸다. email 없음.';

create view public.post_reaction_counts as
select
  r.post_id,
  r.reaction_type,
  count(*)::integer as reaction_count
from public.reactions r
join public.posts po on po.id = r.post_id
where po.moderation_status = 'approved'
group by r.post_id, r.reaction_type;

comment on view public.post_reaction_counts is
  '반응 합계만 내보낸다. 누가 눌렀는지는 나가지 않는다.';

-- 비로그인에는 열지 않는다.
revoke all on public.community_feed from anon, public;
revoke all on public.post_reaction_counts from anon, public;

grant select on public.community_feed to authenticated;
grant select on public.post_reaction_counts to authenticated;
