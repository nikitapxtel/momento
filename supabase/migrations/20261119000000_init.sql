-- Momento: core schema, Row Level Security and storage rules.
--
-- Visibility model
--   * A profile is either public or private (private by default).
--   * Each memory is either shown on the profile or hidden (hidden by default).
--   * Someone else can see a memory only if the owner's profile is public AND the memory is shown.
--   * Owners can always see and change their own things. Nobody can change anyone else's.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null default '' check (char_length(display_name) <= 80),
  bio text not null default '' check (char_length(bio) <= 280),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: public ones are visible to everyone"
  on public.profiles for select
  using (is_public or id = auth.uid());

create policy "profiles: owners can update their own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Profiles are created by the trigger below, never directly by clients.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, handle)
  values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 12));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- memories
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('card', 'photo', 'ticket', 'letter', 'postcard', 'flower', 'object')),
  title text not null check (char_length(title) between 1 and 120),
  place text not null default '' check (char_length(place) <= 120),
  happened_on date,
  story text not null default '' check (char_length(story) <= 2000),
  is_shown boolean not null default false,
  created_at timestamptz not null default now()
);

create index memories_owner_idx on public.memories (owner_id, happened_on);

alter table public.memories enable row level security;

create or replace function public.memory_is_visible(m_owner uuid, m_shown boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select m_owner = auth.uid()
      or (m_shown and exists (
            select 1 from public.profiles p where p.id = m_owner and p.is_public
          ));
$$;

create policy "memories: visible to owner, or shown on a public profile"
  on public.memories for select
  using (public.memory_is_visible(owner_id, is_shown));

create policy "memories: owners can add their own"
  on public.memories for insert
  with check (owner_id = auth.uid());

create policy "memories: owners can update their own"
  on public.memories for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "memories: owners can delete their own"
  on public.memories for delete
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------- memory sides
create table public.memory_sides (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  position smallint not null check (position between 0 and 5),
  label text not null check (char_length(label) between 1 and 40),
  image_path text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),
  note text check (note is null or char_length(note) <= 4000),
  width integer check (width is null or width between 1 and 10000),
  height integer check (height is null or height between 1 and 10000),
  unique (memory_id, position)
);

alter table public.memory_sides enable row level security;

-- A side must belong to the same owner as its memory, and an image must live in that owner's folder.
create or replace function public.side_matches_memory(s_memory uuid, s_owner uuid, s_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memories m
    where m.id = s_memory and m.owner_id = s_owner
  )
  and (s_path is null or split_part(s_path, '/', 1) = s_owner::text
                       and split_part(s_path, '/', 2) = s_memory::text);
$$;

create policy "sides: visible when their memory is"
  on public.memory_sides for select
  using (exists (
    select 1 from public.memories m
    where m.id = memory_id and public.memory_is_visible(m.owner_id, m.is_shown)
  ));

create policy "sides: owners can add to their own memories"
  on public.memory_sides for insert
  with check (owner_id = auth.uid() and public.side_matches_memory(memory_id, owner_id, image_path));

create policy "sides: owners can update their own"
  on public.memory_sides for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.side_matches_memory(memory_id, owner_id, image_path));

create policy "sides: owners can delete their own"
  on public.memory_sides for delete
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------- privileges
revoke all on public.profiles, public.memories, public.memory_sides from anon, authenticated;
grant select on public.profiles, public.memories, public.memory_sides to anon, authenticated;
grant update (handle, display_name, bio, is_public) on public.profiles to authenticated;
grant insert, delete on public.memories, public.memory_sides to authenticated;
grant update (kind, title, place, happened_on, story, is_shown) on public.memories to authenticated;
grant update (label, note, position) on public.memory_sides to authenticated;

-- ---------------------------------------------------------------- storage
-- Private bucket: images are only ever served through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', false, 10485760, array['image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/webp'];

create policy "memory images: owners upload into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "memory images: owners can delete their own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "memory images: readable when the memory is visible"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'memories'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1
        from public.memory_sides s
        join public.memories m on m.id = s.memory_id
        where s.image_path = storage.objects.name
          and public.memory_is_visible(m.owner_id, m.is_shown)
      )
    )
  );
