-- 쉼 — MVP core 마이그레이션 적용 결과 검증 (Sprint 2)
--
-- 20260827000000_mvp_core.sql 를 적용한 뒤 SQL Editor 에 붙여넣고 실행한다.
-- 모든 행의 result 가 PASS 여야 한다. 읽기만 하며 데이터를 바꾸지 않는다.
--
-- 주의: pg_catalog 의 "char" 컬럼(confdeltype, contype 등)은 문자열로 이어붙이기
-- 전에 반드시 ::text 로 캐스팅한다. 안 하면
--   ERROR: operator is not unique: text || "char"
-- 가 난다.

with checks as (

  select 1 as no, '테이블 4개 존재 (posts, ai_suggestions, rest_sessions, reactions)' as check_name,
    count(*) = 4 as passed,
    coalesce(string_agg(tablename, ', ' order by tablename), '(없음)') as detail
  from pg_tables
  where schemaname = 'public'
    and tablename in ('posts','ai_suggestions','rest_sessions','reactions')

  union all
  select 2, '4개 테이블 모두 RLS 활성화',
    count(*) = 4,
    coalesce(string_agg(c.relname || '=' || c.relrowsecurity::text, ', ' order by c.relname), '(없음)')
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('posts','ai_suggestions','rest_sessions','reactions')
    and c.relrowsecurity

  union all
  select 3, 'anon 역할에 정책 없음 (비로그인 접근 차단)',
    not exists (
      select 1 from pg_policies p, unnest(p.roles) r
      where p.schemaname = 'public'
        and p.tablename in ('posts','ai_suggestions','rest_sessions','reactions')
        and r = 'anon'
    ),
    coalesce((
      select string_agg(distinct r, ',')
      from pg_policies p, unnest(p.roles) r
      where p.schemaname='public'
        and p.tablename in ('posts','ai_suggestions','rest_sessions','reactions')
    ), '(없음)')

  union all
  select 4, 'posts 정책 4종',
    count(*) = 4,
    coalesce(string_agg(policyname || '(' || cmd || ')', ', ' order by policyname), '(없음)')
  from pg_policies where schemaname='public' and tablename='posts'

  union all
  select 5, 'UPDATE 정책에 with_check 존재 (posts, rest_sessions)',
    count(*) = 2,
    coalesce(string_agg(tablename, ', ' order by tablename), '(없음)')
  from pg_policies
  where schemaname='public' and cmd='UPDATE' and with_check is not null
    and tablename in ('posts','rest_sessions')

  union all
  select 6, 'posts check constraint 4종 (state/길이/trim/moderation)',
    count(*) = 4,
    coalesce(string_agg(conname, ', ' order by conname), '(없음)')
  from pg_constraint
  where conrelid = to_regclass('public.posts') and contype = 'c'

  union all
  select 7, 'reactions unique(post_id,user_id,reaction_type)',
    count(*) = 1,
    coalesce(string_agg(conname, ', '), '(없음)')
  from pg_constraint
  where conrelid = to_regclass('public.reactions') and contype = 'u'

  union all
  select 8, 'FK 는 모두 auth.users / posts 로 CASCADE',
    count(*) >= 6,
    coalesce(string_agg(
      conrelid::regclass::text || '.' || conname || ' → ' ||
      case confdeltype::text
        when 'c' then 'CASCADE' when 'n' then 'SET NULL'
        when 'r' then 'RESTRICT' when 'a' then 'NO ACTION'
        else confdeltype::text end,
      ', ' order by conrelid::regclass::text, conname), '(없음)')
  from pg_constraint
  where contype = 'f'
    and conrelid in (
      to_regclass('public.posts'), to_regclass('public.ai_suggestions'),
      to_regclass('public.rest_sessions'), to_regclass('public.reactions'))

  union all
  select 9, '공개 view 2개 존재 (community_feed, post_reaction_counts)',
    count(*) = 2,
    coalesce(string_agg(viewname, ', ' order by viewname), '(없음)')
  from pg_views
  where schemaname='public' and viewname in ('community_feed','post_reaction_counts')

  union all
  select 10, 'community_feed 에 email 컬럼 없음',
    count(*) = 0,
    case when count(*) = 0 then '없음 (정상)' else string_agg(column_name, ', ') end
  from information_schema.columns
  where table_schema='public' and table_name='community_feed'
    and column_name ilike '%email%'

  union all
  select 11, 'community_feed 컬럼이 6개로 고정',
    count(*) = 6,
    coalesce(string_agg(column_name, ', ' order by ordinal_position), '(없음)')
  from information_schema.columns
  where table_schema='public' and table_name='community_feed'

  union all
  select 12, 'anon 에 view 권한 없음',
    not exists (
      select 1 from information_schema.role_table_grants
      where table_schema='public'
        and table_name in ('community_feed','post_reaction_counts')
        and grantee = 'anon'
    ),
    coalesce((
      select string_agg(distinct grantee, ',')
      from information_schema.role_table_grants
      where table_schema='public'
        and table_name in ('community_feed','post_reaction_counts')
    ), '(없음)')

  union all
  select 13, 'authenticated 에 view SELECT 권한 있음',
    count(*) = 2,
    coalesce(string_agg(distinct table_name, ', '), '(없음)')
  from information_schema.role_table_grants
  where table_schema='public'
    and table_name in ('community_feed','post_reaction_counts')
    and grantee = 'authenticated' and privilege_type = 'SELECT'

  union all
  select 14, 'profiles 는 여전히 자기 row 만 (공개 정책 없음)',
    not exists (
      select 1 from pg_policies p, unnest(p.roles) r
      where p.schemaname='public' and p.tablename='profiles' and r = 'anon'
    ),
    coalesce((select string_agg(policyname, ', ' order by policyname)
              from pg_policies where schemaname='public' and tablename='profiles'), '(없음)')
)
select no,
  case when passed then 'PASS' else '*** FAIL ***' end as result,
  check_name, detail
from checks order by no;
