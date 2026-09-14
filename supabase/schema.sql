-- ===========================================================================
-- MatchHub schema
-- Run this once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- There is no email anywhere in MatchHub. Accounts are a username and a
-- password, and that is all that is stored. Supabase Auth is not used at all.
--
-- How the security works:
--   * Passwords are hashed with bcrypt (pgcrypto) and never stored in the clear.
--   * Signing in returns a random session token. Only its SHA-256 hash is kept.
--   * Every table has Row Level Security on with no policies, so the public API
--     key cannot read or write a single row directly.
--   * All access goes through the functions at the bottom of this file. Each one
--     takes the session token, resolves it to an account, and only then touches
--     data belonging to that account.
-- ===========================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
create table if not exists public.app_users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create unique index if not exists app_users_username_key
  on public.app_users (lower(username));

create table if not exists public.app_sessions (
  token_hash   text primary key,
  user_id      uuid not null references public.app_users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists app_sessions_user_idx on public.app_sessions (user_id);

-- ---------------------------------------------------------------------------
-- Player lists and matches
-- ---------------------------------------------------------------------------
create table if not exists public.friends (
  user_id    uuid not null references public.app_users (id) on delete cascade,
  friend_id  uuid not null references public.app_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint not_yourself check (user_id <> friend_id)
);

create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  player1_id    uuid not null references public.app_users (id) on delete cascade,
  player2_id    uuid not null references public.app_users (id) on delete cascade,
  player1_score integer not null check (player1_score between 0 and 99),
  player2_score integer not null check (player2_score between 0 and 99),
  played_on     date not null default current_date,
  created_by    uuid not null references public.app_users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  constraint different_players check (player1_id <> player2_id)
);

create index if not exists matches_player1_idx  on public.matches (player1_id);
create index if not exists matches_player2_idx  on public.matches (player2_id);
create index if not exists matches_played_on_idx on public.matches (played_on desc);

-- ---------------------------------------------------------------------------
-- Lock every table. No policies are created, so nothing is reachable with the
-- public key except through the functions below.
-- ---------------------------------------------------------------------------
alter table public.app_users    enable row level security;
alter table public.app_sessions enable row level security;
alter table public.friends      enable row level security;
alter table public.matches      enable row level security;

revoke all on public.app_users, public.app_sessions, public.friends, public.matches
  from anon, authenticated;

-- ===========================================================================
-- Session handling
-- ===========================================================================

-- Turn a session token into the account it belongs to, or null.
create or replace function public.app_user_for(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid;
begin
  if p_token is null or length(p_token) < 20 then
    return null;
  end if;

  update public.app_sessions
     set last_seen_at = now()
   where token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and last_seen_at > now() - interval '180 days'
  returning user_id into uid;

  return uid;
end;
$$;

create or replace function public.app_require_user(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_user_for(p_token);
begin
  if uid is null then
    raise exception 'Your session has expired. Sign in again.';
  end if;
  return uid;
end;
$$;

create or replace function public.app_issue_token(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  raw text := encode(gen_random_bytes(32), 'hex');
begin
  insert into public.app_sessions (token_hash, user_id)
  values (encode(digest(raw, 'sha256'), 'hex'), p_user_id);

  -- Tidy up anything long abandoned.
  delete from public.app_sessions where last_seen_at < now() - interval '180 days';

  return raw;
end;
$$;

-- ===========================================================================
-- Accounts
-- ===========================================================================

create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from public.app_users where lower(username) = lower(p_username)
  );
$$;

-- Create an account. Username must be free; that is the only check there is.
create or replace function public.app_signup(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := trim(p_username);
  v_id uuid;
  v_token text;
begin
  if v_name !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Usernames are 3-20 characters: letters, numbers and underscores.';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'Use a password of at least 6 characters.';
  end if;
  if exists (select 1 from public.app_users u where lower(u.username) = lower(v_name)) then
    raise exception 'That username is taken.';
  end if;

  insert into public.app_users (username, password_hash)
  values (v_name, crypt(p_password, gen_salt('bf', 10)))
  returning id into v_id;

  v_token := public.app_issue_token(v_id);
  return json_build_object('token', v_token, 'id', v_id, 'username', v_name);
end;
$$;

create or replace function public.app_login(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  found_user public.app_users;
  v_token text;
begin
  select * into found_user
    from public.app_users
   where lower(username) = lower(trim(p_username));

  if found_user.id is null
     or found_user.password_hash <> crypt(p_password, found_user.password_hash) then
    raise exception 'Wrong username or password.';
  end if;

  v_token := public.app_issue_token(found_user.id);
  return json_build_object('token', v_token, 'id', found_user.id,
                           'username', found_user.username);
end;
$$;

create or replace function public.app_me(p_token text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_user_for(p_token);
  u public.app_users;
begin
  if uid is null then
    return null;
  end if;
  select * into u from public.app_users where id = uid;
  return json_build_object('id', u.id, 'username', u.username,
                           'created_at', u.created_at);
end;
$$;

create or replace function public.app_logout(p_token text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.app_sessions
   where token_hash = encode(digest(p_token, 'sha256'), 'hex');
$$;

create or replace function public.app_set_username(p_token text, p_username text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
  v_name text := trim(p_username);
begin
  if v_name !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Usernames are 3-20 characters: letters, numbers and underscores.';
  end if;
  if exists (
    select 1 from public.app_users u
     where lower(u.username) = lower(v_name) and u.id <> uid
  ) then
    raise exception 'That username is taken.';
  end if;

  update public.app_users set username = v_name where id = uid;
  return json_build_object('id', uid, 'username', v_name);
end;
$$;

-- Changing a password needs the current one, and signs out other devices.
create or replace function public.app_set_password(
  p_token text,
  p_current text,
  p_new text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
  current_hash text;
begin
  if p_new is null or length(p_new) < 6 then
    raise exception 'Use a password of at least 6 characters.';
  end if;

  select password_hash into current_hash from public.app_users where id = uid;
  if current_hash <> crypt(p_current, current_hash) then
    raise exception 'Your current password is not right.';
  end if;

  update public.app_users
     set password_hash = crypt(p_new, gen_salt('bf', 10))
   where id = uid;

  delete from public.app_sessions
   where user_id = uid
     and token_hash <> encode(digest(p_token, 'sha256'), 'hex');
end;
$$;

-- ===========================================================================
-- Players
-- ===========================================================================

create or replace function public.app_players(p_token text)
returns table (id uuid, username text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
begin
  return query
    select u.id, u.username, u.created_at
      from public.friends f
      join public.app_users u on u.id = f.friend_id
     where f.user_id = uid
     order by lower(u.username);
end;
$$;

-- Add by username. The link is written both ways, so you land on their list too.
create or replace function public.app_add_player(p_token text, p_username text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
  target public.app_users;
begin
  select * into target
    from public.app_users
   where lower(username) = lower(trim(p_username));

  if target.id is null then
    raise exception 'No account with that username.';
  end if;
  if target.id = uid then
    raise exception 'That is your own username.';
  end if;

  insert into public.friends (user_id, friend_id) values (uid, target.id)
    on conflict do nothing;
  insert into public.friends (user_id, friend_id) values (target.id, uid)
    on conflict do nothing;

  return json_build_object('id', target.id, 'username', target.username,
                           'created_at', target.created_at);
end;
$$;

create or replace function public.app_remove_player(p_token text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
begin
  delete from public.friends
   where (user_id = uid and friend_id = p_id)
      or (user_id = p_id and friend_id = uid);
end;
$$;

-- ===========================================================================
-- Matches. A match belongs to both players: either can add, correct or delete.
-- ===========================================================================

create or replace function public.app_matches(p_token text)
returns setof public.matches
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
begin
  return query
    select * from public.matches
     where player1_id = uid or player2_id = uid
     order by played_on desc, created_at desc;
end;
$$;

create or replace function public.app_add_match(
  p_token text,
  p_opponent uuid,
  p_my_score integer,
  p_their_score integer,
  p_played_on date
)
returns public.matches
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
  v_match public.matches;
begin
  if p_opponent = uid then
    raise exception 'Pick someone other than yourself.';
  end if;
  if not exists (
    select 1 from public.friends where user_id = uid and friend_id = p_opponent
  ) then
    raise exception 'They are not on your player list.';
  end if;

  insert into public.matches (player1_id, player2_id, player1_score,
                              player2_score, played_on, created_by)
  values (uid, p_opponent, p_my_score, p_their_score,
          coalesce(p_played_on, current_date), uid)
  returning * into v_match;

  return v_match;
end;
$$;

-- Scores are given from the caller's side and stored the right way round.
create or replace function public.app_update_match(
  p_token text,
  p_match uuid,
  p_my_score integer,
  p_their_score integer,
  p_played_on date
)
returns public.matches
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
  v_match public.matches;
begin
  select * into v_match from public.matches where id = p_match;
  if v_match.id is null or uid not in (v_match.player1_id, v_match.player2_id) then
    raise exception 'That match is not yours.';
  end if;

  update public.matches
     set player1_score = case when player1_id = uid then p_my_score else p_their_score end,
         player2_score = case when player1_id = uid then p_their_score else p_my_score end,
         played_on     = coalesce(p_played_on, played_on)
   where id = p_match
  returning * into v_match;

  return v_match;
end;
$$;

create or replace function public.app_delete_match(p_token text, p_match uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public.app_require_user(p_token);
begin
  delete from public.matches
   where id = p_match and uid in (player1_id, player2_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- The app calls these with the public key. Everything else stays unreachable.
-- ---------------------------------------------------------------------------
-- Postgres grants EXECUTE on new functions to PUBLIC, so these internal helpers
-- have to be taken back explicitly. Without this, anyone holding the public key
-- could mint a session token for any account.
revoke execute on function public.app_user_for(text)    from public, anon, authenticated;
revoke execute on function public.app_require_user(text) from public, anon, authenticated;
revoke execute on function public.app_issue_token(uuid)  from public, anon, authenticated;

grant execute on function public.username_available(text)                        to anon;
grant execute on function public.app_signup(text, text)                          to anon;
grant execute on function public.app_login(text, text)                           to anon;
grant execute on function public.app_me(text)                                    to anon;
grant execute on function public.app_logout(text)                                to anon;
grant execute on function public.app_set_username(text, text)                    to anon;
grant execute on function public.app_set_password(text, text, text)              to anon;
grant execute on function public.app_players(text)                               to anon;
grant execute on function public.app_add_player(text, text)                      to anon;
grant execute on function public.app_remove_player(text, uuid)                   to anon;
grant execute on function public.app_matches(text)                               to anon;
grant execute on function public.app_add_match(text, uuid, integer, integer, date) to anon;
grant execute on function public.app_update_match(text, uuid, integer, integer, date) to anon;
grant execute on function public.app_delete_match(text, uuid)                    to anon;
