-- 쉼 Community — 마이그레이션 적용 결과 검증
--
-- Supabase SQL Editor 에 그대로 붙여넣고 실행한다.
-- 모든 행의 result 가 PASS 여야 한다.
--
-- 이 스크립트는 읽기만 한다. 데이터를 만들거나 바꾸지 않는다.

with checks as (

  -- 1. 테이블 존재
  select
    1 as no,
    'profiles 테이블 존재' as check_name,
    (to_regclass('public.profiles') is not null) as passed,
    coalesce(to_regclass('public.profiles')::text, '(없음)') as detail

  -- 2. 컬럼 구성
  union all
  select 2, 'profiles 컬럼 4개 (user_id, nickname, created_at, updated_at)',
    count(*) = 4,
    string_agg(column_name || ':' || data_type, ', ' order by ordinal_position)
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and column_name in ('user_id','nickname','created_at','updated_at')

  -- 3. RLS 활성화 — 이게 꺼져 있으면 anon key 로 전체 테이블이 읽힌다
  union all
  select 3, 'RLS 활성화',
    coalesce(bool_and(relrowsecurity), false),
    'relrowsecurity=' || coalesce(bool_and(relrowsecurity)::text, 'null')
  from pg_class
  where oid = to_regclass('public.profiles')

  -- 4. 정책 4종
  union all
  select 4, 'RLS 정책 4종 (SELECT/INSERT/UPDATE/DELETE)',
    count(*) = 4,
    coalesce(string_agg(policyname || '(' || cmd || ')', ', ' order by policyname), '(없음)')
  from pg_policies
  where schemaname = 'public' and tablename = 'profiles'

  -- 5. 정책이 authenticated 역할에만 걸려 있는가 (anon 에 열려 있으면 안 된다)
  union all
  select 5, 'anon 역할에 정책 없음',
    not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='profiles'
        and 'anon' = any(roles)
    ),
    coalesce((
      select string_agg(distinct r, ',')
      from pg_policies p, unnest(p.roles) r
      where p.schemaname='public' and p.tablename='profiles'
    ), '(없음)')

  -- 6. UPDATE 정책에 with check 가 있는가
  --    없으면 자기 row 의 user_id 를 남의 것으로 바꿔치기할 수 있다
  union all
  select 6, 'UPDATE 정책에 with_check 존재',
    exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='profiles'
        and cmd='UPDATE' and with_check is not null
    ),
    coalesce((
      select with_check from pg_policies
      where schemaname='public' and tablename='profiles' and cmd='UPDATE'
      limit 1
    ), '(없음)')

  -- 7. updated_at 트리거
  union all
  select 7, 'updated_at 트리거 존재',
    count(*) = 1,
    coalesce(string_agg(tgname, ', '), '(없음)')
  from pg_trigger
  where tgrelid = to_regclass('public.profiles')
    and not tgisinternal

  -- 8. check constraint 2종 (길이, trim)
  union all
  select 8, 'check constraint 2종 (길이, trim)',
    count(*) = 2,
    coalesce(string_agg(conname, ', ' order by conname), '(없음)')
  from pg_constraint
  where conrelid = to_regclass('public.profiles')
    and contype = 'c'
    and conname in ('profiles_nickname_length','profiles_nickname_trimmed')

  -- 9. user_id 가 auth.users 를 참조하고 CASCADE 인가
  union all
  select 9, 'user_id FK → auth.users ON DELETE CASCADE',
    count(*) = 1,
    coalesce(string_agg(conname || ' confdeltype=' || confdeltype, ', '), '(없음)')
  from pg_constraint
  where conrelid = to_regclass('public.profiles')
    and contype = 'f'
    and confrelid = to_regclass('auth.users')
    and confdeltype = 'c'

  -- 10. 닉네임에 unique index 가 없어야 한다 (중복 허용이 제품 결정)
  union all
  select 10, 'nickname unique index 없음 (중복 허용)',
    not exists (
      select 1 from pg_indexes
      where schemaname='public' and tablename='profiles'
        and indexdef ilike '%unique%' and indexdef ilike '%nickname%'
    ),
    coalesce((
      select string_agg(indexname, ', ') from pg_indexes
      where schemaname='public' and tablename='profiles'
    ), '(없음)')
)
select
  no,
  case when passed then 'PASS' else '*** FAIL ***' end as result,
  check_name,
  detail
from checks
order by no;
