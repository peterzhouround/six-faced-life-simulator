-- Run in YOUR Supabase SQL Editor. No credentials belong in this file.
begin;
create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 524288),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.game_saves enable row level security;
revoke all on public.game_saves from anon;
grant select, insert, update on public.game_saves to authenticated;
drop policy if exists own_save_read on public.game_saves;
create policy own_save_read on public.game_saves for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists own_save_insert on public.game_saves;
create policy own_save_insert on public.game_saves for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists own_save_update on public.game_saves;
create policy own_save_update on public.game_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.save_game(p_payload jsonb, p_expected_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare new_revision integer;
begin
  if auth.uid() is null then raise exception 'Login required' using errcode = '42501'; end if;
  if p_expected_revision = 0 then
    insert into public.game_saves(user_id, payload) values(auth.uid(), p_payload) returning revision into new_revision;
  else
    update public.game_saves set payload=p_payload, revision=revision+1, updated_at=now()
      where user_id=auth.uid() and revision=p_expected_revision returning revision into new_revision;
    if new_revision is null then raise exception 'Save conflict' using errcode = '40001'; end if;
  end if;
  return new_revision;
end $$;
revoke all on function public.save_game(jsonb, integer) from public, anon;
grant execute on function public.save_game(jsonb, integer) to authenticated;
commit;
