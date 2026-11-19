-- Row Level Security tests for Momento.
-- Run with:  psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- Every check raises an error on failure, so psql exits non-zero and CI fails.
-- Everything runs inside a transaction that is rolled back, leaving no test data behind.

begin;

create or replace function pg_temp.check(ok boolean, what text) returns void
language plpgsql as $$
begin
  if not coalesce(ok, false) then
    raise exception 'FAILED: %', what;
  end if;
  raise notice 'ok - %', what;
end $$;

create or replace function pg_temp.act_as(uid uuid) returns void
language plpgsql as $$
begin
  if uid is null then
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  else
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', uid::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  end if;
end $$;

grant execute on function pg_temp.check(boolean, text) to anon, authenticated;
grant execute on function pg_temp.act_as(uuid) to anon, authenticated;

-- Test people: Ava (public profile), Ben (private profile), Cat (a stranger).
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ava@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ben@example.test'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'cat@example.test');

select pg_temp.check((select count(*) = 3 from public.profiles
  where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','cccccccc-cccc-4ccc-8ccc-cccccccccccc')),
  'a profile is created for every new account');
select pg_temp.check((select bool_and(not is_public) from public.profiles
  where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')),
  'new profiles start private');

update public.profiles set is_public = true, handle = 'ava' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.profiles set handle = 'ben' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

-- Each owner adds one shown and one hidden memory.
select pg_temp.act_as('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.memories (id, owner_id, kind, title, is_shown) values
  ('a1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'card', 'Ava shown', true),
  ('a2222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'photo', 'Ava hidden', false);
insert into public.memory_sides (memory_id, owner_id, position, label, image_path) values
  ('a1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, 'Front',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a1111111-1111-4111-8111-111111111111/d1111111-1111-4111-8111-111111111111.webp'),
  ('a2222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, 'Front',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a2222222-2222-4222-8222-222222222222/d2222222-2222-4222-8222-222222222222.webp');
insert into storage.objects (bucket_id, name) values
  ('memories', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a1111111-1111-4111-8111-111111111111/d1111111-1111-4111-8111-111111111111.webp'),
  ('memories', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a2222222-2222-4222-8222-222222222222/d2222222-2222-4222-8222-222222222222.webp');

select pg_temp.act_as('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.memories (id, owner_id, kind, title, is_shown) values
  ('b1111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ticket', 'Ben shown', true),
  ('b2222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'letter', 'Ben hidden', false);

-- ------------------------------------------------ owners
select pg_temp.act_as('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
select pg_temp.check((select count(*) = 2 from public.memories where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'owner sees both their shown and hidden memories');
select pg_temp.check((select count(*) = 2 from storage.objects where bucket_id = 'memories'),
  'owner can read all of their own images');

select pg_temp.act_as('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
select pg_temp.check((select count(*) = 1 from public.profiles where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'owner can see their own private profile');

-- ------------------------------------------------ a stranger (signed in)
select pg_temp.act_as('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
select pg_temp.check((select array_agg(title order by title) = array['Ava shown'] from public.memories),
  'stranger sees only shown memories of public profiles');
select pg_temp.check((select count(*) = 0 from public.profiles where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'stranger cannot see a private profile');
select pg_temp.check((select count(*) = 1 from public.memory_sides),
  'stranger sees sides only of visible memories');
select pg_temp.check((select array_agg(name) from storage.objects) =
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a1111111-1111-4111-8111-111111111111/d1111111-1111-4111-8111-111111111111.webp'],
  'stranger can read only the image of the shown memory');

with changed as (
  update public.memories set title = 'hacked' where id = 'a1111111-1111-4111-8111-111111111111' returning 1
) select pg_temp.check((select count(*) = 0 from changed), 'stranger cannot edit someone else''s memory');

with gone as (
  delete from public.memories where id = 'a1111111-1111-4111-8111-111111111111' returning 1
) select pg_temp.check((select count(*) = 0 from gone), 'stranger cannot delete someone else''s memory');

with changed as (
  update public.profiles set is_public = false where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning 1
) select pg_temp.check((select count(*) = 0 from changed), 'stranger cannot change someone else''s profile');

do $$ begin
  insert into public.memories (owner_id, kind, title)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'card', 'forged');
  raise exception 'FAILED: stranger was able to add a memory to someone else''s box';
exception when insufficient_privilege then
  raise notice 'ok - stranger cannot add a memory to someone else''s box';
end $$;

do $$ begin
  insert into public.memory_sides (memory_id, owner_id, position, label)
  values ('a1111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 3, 'Sneaky');
  raise exception 'FAILED: stranger was able to attach a side to someone else''s memory';
exception when insufficient_privilege then
  raise notice 'ok - stranger cannot attach a side to someone else''s memory';
end $$;

do $$ begin
  insert into storage.objects (bucket_id, name)
  values ('memories', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/x/y.webp');
  raise exception 'FAILED: stranger was able to upload into someone else''s folder';
exception when insufficient_privilege then
  raise notice 'ok - stranger cannot upload into someone else''s folder';
end $$;

-- ------------------------------------------------ owners cannot cheat either
select pg_temp.act_as('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
do $$ begin
  update public.memories set owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  where id = 'a2222222-2222-4222-8222-222222222222';
  raise exception 'FAILED: owner was able to hand a memory to someone else';
exception when insufficient_privilege then
  raise notice 'ok - owner cannot move a memory into someone else''s box';
end $$;

do $$ begin
  insert into public.memory_sides (memory_id, owner_id, position, label, image_path)
  values ('a1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 4, 'Odd',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/a1111111-1111-4111-8111-111111111111/e1111111-1111-4111-8111-111111111111.webp');
  raise exception 'FAILED: a side was allowed to point at an image in another person''s folder';
exception when insufficient_privilege then
  raise notice 'ok - sides can only point at images in the owner''s own folder';
end $$;

-- ------------------------------------------------ visitors who are not signed in
select pg_temp.act_as(null);
select pg_temp.check((select array_agg(title) = array['Ava shown'] from public.memories),
  'visitor sees only shown memories of public profiles');
select pg_temp.check((select count(*) = 0 from public.profiles where not is_public),
  'visitor cannot see private profiles');

do $$ begin
  insert into public.memories (owner_id, kind, title) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'card', 'x');
  raise exception 'FAILED: visitor was able to add a memory';
exception when insufficient_privilege then
  raise notice 'ok - visitor cannot add memories';
end $$;

-- ------------------------------------------------ switching a profile to private hides everything
reset role;
update public.profiles set is_public = false where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select pg_temp.act_as('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
select pg_temp.check((select count(*) = 0 from public.memories),
  'making a profile private hides even its shown memories');
select pg_temp.check((select count(*) = 0 from storage.objects),
  'making a profile private hides its images too');

reset role;
rollback;
