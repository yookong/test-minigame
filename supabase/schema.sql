-- 별똥별 피하기 랭킹 (Supabase)
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run 하세요. 여러 번 실행해도 안전하고, 기록을 지우지 않습니다.
--
-- 구조
--   runs   : 게임 한 판. 시작할 때 서버가 시각과 운석 시드를 정합니다.
--   beats  : 플레이 중 5초마다, 일시정지·재개·종료 때 오는 신호 (서버 시각으로 기록)
--   scores : 검증을 통과한 기록
--   세 테이블 모두 RLS 를 켜고 정책을 두지 않아서, 공개 키로는 직접 읽거나 쓸 수 없습니다.
--
-- 공개 키(anon)로 부를 수 있는 함수: start_run, heartbeat, get_leaderboard, set_nickname
-- 서버 전용(service_role) 함수: get_run_check, finalize_run
--   → Edge Function "verify-run" 이 게임을 서버에서 다시 돌려 점수를 직접 계산한 뒤 finalize_run 으로 기록합니다.
--
-- 관리
--   이상한 기록 숨기기:  update public.scores set hidden = true where nickname = '닉네임';
--   랭킹 초기화:        truncate table public.scores, public.runs, public.beats restart identity;

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  device text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.runs add column if not exists seed bigint;
alter table public.runs add column if not exists h int;
create index if not exists runs_device_started on public.runs (device, started_at desc);

create table if not exists public.beats (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.runs (id) on delete cascade,
  tick int not null,
  paused boolean not null,
  at timestamptz not null default now()
);
create index if not exists beats_run on public.beats (run_id, at);

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  run_id uuid not null unique references public.runs (id) on delete cascade,
  device text not null,
  nickname text not null,
  score int not null,
  time_s numeric(7, 1) not null,
  stars int not null,
  storms int not null,
  title text not null default '',
  look jsonb not null default '{}'::jsonb,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists scores_score on public.scores (score desc) where not hidden;
create index if not exists scores_device on public.scores (device);

alter table public.runs enable row level security;
alter table public.beats enable row level security;
alter table public.scores enable row level security;
revoke all on public.runs, public.beats, public.scores from anon, authenticated;

-- 이전 버전 함수 제거 (점수를 직접 받던 submit_score 는 더 이상 쓰지 않음)
drop function if exists public.start_run(text);
drop function if exists public.submit_score(uuid, text, text, int, numeric, int, int, text, jsonb);

-- 닉네임 정리: 제어문자와 꺾쇠 제거, 앞뒤 공백 제거, 1~12자
create or replace function public.clean_nickname(p text)
returns text language plpgsql immutable set search_path = public as $$
declare v text;
begin
  v := btrim(regexp_replace(coalesce(p, ''), '[[:cntrl:]<>]', '', 'g'));
  if char_length(v) < 1 or char_length(v) > 12 then
    raise exception 'bad nickname';
  end if;
  return v;
end $$;

create or replace function public.start_run(p_device text, p_h int)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_seed bigint;
begin
  if p_device is null or p_device !~ '^[A-Za-z0-9-]{16,64}$' then raise exception 'bad device'; end if;
  if p_h is null or p_h < 560 or p_h > 900 then raise exception 'bad size'; end if;
  if (select count(*) from runs where device = p_device and started_at > now() - interval '10 minutes') >= 40 then
    raise exception 'too many runs';
  end if;
  delete from runs where finished_at is null and started_at < now() - interval '1 day';
  v_seed := floor(random() * 2147483646)::bigint + 1;
  insert into runs (device, seed, h) values (p_device, v_seed, p_h) returning id into v_id;
  return json_build_object('id', v_id, 'seed', v_seed);
end $$;

create or replace function public.heartbeat(p_run uuid, p_device text, p_tick int, p_paused boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r runs;
begin
  select * into r from runs where id = p_run;
  if not found or r.device <> p_device or r.finished_at is not null then raise exception 'unknown run'; end if;
  if p_tick is null or p_tick < 0 or p_tick > 72000 or p_paused is null then raise exception 'bad tick'; end if;
  if (select count(*) from beats where run_id = p_run) >= 3000 then raise exception 'too many beats'; end if;
  insert into beats (run_id, tick, paused) values (p_run, p_tick, p_paused);
end $$;

create or replace function public.get_run_check(p_run uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'device', r.device,
    'seed', r.seed,
    'h', r.h,
    'started', extract(epoch from r.started_at),
    'now', extract(epoch from now()),
    'finished', r.finished_at is not null,
    'beats', coalesce((
      select json_agg(json_build_object('tick', b.tick, 'paused', b.paused, 'at', extract(epoch from b.at)) order by b.at, b.id)
      from beats b where b.run_id = r.id
    ), '[]'::json)
  )
  from runs r where r.id = p_run and r.seed is not null;
$$;

create or replace function public.finalize_run(
  p_run uuid, p_device text, p_nickname text, p_title text, p_look jsonb,
  p_score int, p_time numeric, p_stars int, p_storms int
) returns json language plpgsql security definer set search_path = public as $$
declare r runs; v_nick text; v_best int; v_rank int;
begin
  select * into r from runs where id = p_run for update;
  if not found or r.device <> p_device then raise exception 'unknown run'; end if;
  if r.finished_at is not null then raise exception 'already submitted'; end if;
  v_nick := clean_nickname(p_nickname);

  update runs set finished_at = now() where id = p_run;
  delete from beats where run_id = p_run;
  if p_score > 0 then
    insert into scores (run_id, device, nickname, score, time_s, stars, storms, title, look)
    values (
      p_run, p_device, v_nick, p_score, p_time, p_stars, p_storms,
      left(btrim(coalesce(p_title, '')), 20),
      jsonb_build_object(
        'skin', left(coalesce(p_look ->> 'skin', ''), 16),
        'hat', left(coalesce(p_look ->> 'hat', ''), 16),
        'face', left(coalesce(p_look ->> 'face', ''), 16)
      )
    );
  end if;
  update scores set nickname = v_nick where device = p_device and nickname <> v_nick;

  select max(score) into v_best from scores where device = p_device and not hidden;
  select 1 + count(*) into v_rank
  from (select device, max(score) as s from scores where not hidden group by device) b
  where b.s > coalesce(v_best, 0);
  return json_build_object('best', coalesce(v_best, 0), 'rank', v_rank);
end $$;

create or replace function public.get_leaderboard(p_device text default null)
returns json language sql stable security definer set search_path = public as $$
  with best as (
    select distinct on (device) device, nickname, score, time_s, title, look, created_at
    from scores
    where not hidden
    order by device, score desc, created_at asc
  ), ranked as (
    select *, rank() over (order by score desc) as rk from best
  )
  select json_build_object(
    'top', coalesce((
      select json_agg(json_build_object(
        'rank', rk, 'nickname', nickname, 'score', score, 'time', time_s, 'title', title, 'look', look
      ) order by rk, created_at)
      from (select * from ranked order by rk, created_at limit 10) t
    ), '[]'::json),
    'me', (select json_build_object('rank', rk, 'score', score, 'nickname', nickname) from ranked where device = p_device),
    'players', (select count(*) from best)
  );
$$;

create or replace function public.set_nickname(p_device text, p_nickname text)
returns text language plpgsql security definer set search_path = public as $$
declare v_nick text;
begin
  v_nick := clean_nickname(p_nickname);
  update scores set nickname = v_nick where device = p_device;
  return v_nick;
end $$;

revoke all on function public.clean_nickname(text) from public, anon, authenticated;
revoke all on function public.start_run(text, int) from public, anon, authenticated;
revoke all on function public.heartbeat(uuid, text, int, boolean) from public, anon, authenticated;
revoke all on function public.get_run_check(uuid) from public, anon, authenticated;
revoke all on function public.finalize_run(uuid, text, text, text, jsonb, int, numeric, int, int) from public, anon, authenticated;
revoke all on function public.get_leaderboard(text) from public, anon, authenticated;
revoke all on function public.set_nickname(text, text) from public, anon, authenticated;

grant execute on function public.start_run(text, int) to anon, authenticated;
grant execute on function public.heartbeat(uuid, text, int, boolean) to anon, authenticated;
grant execute on function public.get_leaderboard(text) to anon, authenticated;
grant execute on function public.set_nickname(text, text) to anon, authenticated;
grant execute on function public.get_run_check(uuid) to service_role;
grant execute on function public.finalize_run(uuid, text, text, text, jsonb, int, numeric, int, int) to service_role;
