-- 쉼 — Release Fix Sprint 1
--
-- 고치는 것
--   QA-137  볼 수 없는 글(review/restricted/없는 글)에 반응이 들어가던 문제
--   QA-265  Community Feed 의 offset 페이지네이션을 keyset 으로 바꾸기 위한 인덱스
--
-- 기존 마이그레이션(20260826000000, 20260827000000)은 건드리지 않는다.
-- 이 파일은 그 위에 얹는다.

-- ── QA-137 ────────────────────────────────────────────────────────────
--
-- 기존 정책은 with check 로 auth.uid() = user_id 만 봤다. 대상 글이 내가
-- 볼 수 있는 글인지는 확인하지 않아서, post id 만 알면 approved 가 아닌
-- 글에도 반응 row 를 남길 수 있었다.
--
-- 정책 안에서 곧바로 posts 를 조회할 수는 없다. 정책 표현식은 호출자
-- 권한으로 평가되므로 posts_select_own 이 다시 걸리고, 그러면 "남의 글에
-- 반응하기" 라는 정상 동작까지 전부 막힌다.
--
-- 그래서 승인 여부만 돌려주는 security definer 함수를 하나 둔다.
-- 이 함수가 새로 흘리는 정보는 "이 post id 가 approved 인가" 한 비트뿐이고,
-- 그건 이미 community_feed 로 알 수 있는 사실이다. 글 내용도, 작성자도,
-- 다른 어떤 컬럼도 나가지 않는다.

create or replace function public.is_approved_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
-- search_path 를 고정한다. 고정하지 않으면 호출자가 만든 스키마의 같은 이름
-- 객체가 먼저 잡혀 definer 권한으로 실행될 수 있다.
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.posts
    where id = p_post_id
      and moderation_status = 'approved'
  );
$$;

comment on function public.is_approved_post(uuid) is
  '반응 정책 전용. 해당 글이 공개(approved) 상태인지만 돌려준다. 다른 컬럼은 내보내지 않는다.';

revoke all on function public.is_approved_post(uuid) from public;
revoke all on function public.is_approved_post(uuid) from anon;
grant execute on function public.is_approved_post(uuid) to authenticated;

drop policy if exists "reactions_insert_own" on public.reactions;

create policy "reactions_insert_own" on public.reactions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_approved_post(post_id)
  );

-- SELECT / DELETE 정책은 그대로 둔다.
--   - 자기 반응만 읽는다(누가 눌렀는지는 여전히 비공개)
--   - 자기 반응은 언제든 지울 수 있다. 글이 나중에 review/restricted 로
--     바뀌어도 이미 남긴 반응을 회수할 길은 열려 있어야 한다.

-- ── QA-265 ────────────────────────────────────────────────────────────
--
-- Feed 를 (created_at desc, id desc) keyset 으로 넘기기 위한 인덱스.
-- 기존 posts_feed_idx 는 created_at 단일 키라 동률에서 순서가 정해지지
-- 않았고, offset 방식이라 페이지 사이에 글이 들어오면 중복·누락이 났다.
-- 기존 인덱스는 지우지 않는다 — 다른 쿼리가 쓸 수 있다.

create index if not exists posts_feed_keyset_idx
  on public.posts (created_at desc, id desc)
  where moderation_status = 'approved';

-- Feed 한 장을 keyset 으로 가져온다.
--
-- offset 방식(range(from, from+n))은 페이지를 넘기는 사이에 글이 하나
-- 들어오면 전체가 한 칸씩 밀려, 앞 페이지의 마지막 글이 다음 페이지에 다시
-- 나온다. 글이 지워지면 반대로 한 건이 건너뛰어진다. (QA-265)
--
-- 그래서 "몇 번째부터" 가 아니라 "이 글 다음부터" 로 넘긴다.
-- 정렬 키는 (created_at, id) 두 개다. created_at 만으로는 같은 시각에 올라온
-- 글들의 순서가 정해지지 않아 keyset 자체가 성립하지 않는다.
--
-- 뒤로 가기("이전")도 같은 방식으로 처리하려고 방향 인자를 받는다.
-- 두 방향의 정렬이 반대라서 분기를 union all 로 나누고, 바깥에서 화면에
-- 보여줄 순서(최신순)로 다시 맞춘다.
--
-- security definer 가 아니다. community_feed view 자체가 이미 소유자 권한으로
-- 돌면서 approved 만 내보내므로, 이 함수는 그 view 를 그대로 읽기만 한다.
-- 즉 새로 열리는 데이터가 없다.

create or replace function public.community_feed_page(
  p_limit integer,
  p_cursor_created_at timestamptz default null,
  p_cursor_post_id uuid default null,
  p_backward boolean default false
)
returns setof public.community_feed
language sql
stable
set search_path = public, pg_temp
as $$
  with bounded as (
    select least(greatest(coalesce(p_limit, 16), 1), 51) as n
  ),
  forward as (
    select f.*
    from public.community_feed f, bounded
    where not coalesce(p_backward, false)
      and (
        p_cursor_created_at is null
        or p_cursor_post_id is null
        or (f.created_at, f.post_id) < (p_cursor_created_at, p_cursor_post_id)
      )
    order by f.created_at desc, f.post_id desc
    limit (select n from bounded)
  ),
  backward as (
    select f.*
    from public.community_feed f, bounded
    where coalesce(p_backward, false)
      and p_cursor_created_at is not null
      and p_cursor_post_id is not null
      and (f.created_at, f.post_id) > (p_cursor_created_at, p_cursor_post_id)
    order by f.created_at asc, f.post_id asc
    limit (select n from bounded)
  )
  select * from forward
  union all
  select * from backward
  order by created_at desc, post_id desc;
$$;

comment on function public.community_feed_page(integer, timestamptz, uuid, boolean) is
  'Community Feed keyset 페이지네이션. (created_at, post_id) 커서 기준. community_feed 가 내보내는 것만 내보낸다.';

revoke all on function public.community_feed_page(integer, timestamptz, uuid, boolean) from public;
revoke all on function public.community_feed_page(integer, timestamptz, uuid, boolean) from anon;
grant execute on function public.community_feed_page(integer, timestamptz, uuid, boolean) to authenticated;
