-- 별똥별 피하기 랭킹 (Supabase)
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
--
-- 구조
--   runs   : 게임 한 판. 시작할 때 서버가 시각을 기록합니다.
--   scores : 끝난 판의 기록. 아래 함수(submit_score)를 통해서만 들어옵니다.
--   두 테이블은 RLS 를 켜고 정책을 두지 않아서, 공개 키로는 직접 읽거나 쓸 수 없습니다.
--   게임은 SECURITY DEFINER 함수 4개만 호출합니다.
--
-- 검증 (submit_score)
--   - 서버가 잰 경과 시간보다 오래 버텼다고 할 수 없음
--   - 점수 <= 버틴 시간×10 + 별×50 + 폭풍×200
--   - 별 개수, 폭풍 횟수가 버틴 시간으로 가능한 범위 안
--   - 한 판은 한 번만 제출, 기기당 10분에 40판까지 시작 가능
--
-- 관리
--   이상한 기록 숨기기:  update public.scores set hidden = true where nickname = '닉네임';
--   (Table Editor → scores 에서 hidden 칸을 체크해도 됩니다.)

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  device text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists runs_device_started on public.runs (device, started_at desc);

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
alter table public.scores enable row level security;
revoke all on public.runs, public.scores from anon, authenticated;

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

create or replace function public.start_run(p_device text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_device is null or p_device !~ '^[A-Za-z0-9-]{16,64}$' then
    raise exception 'bad device';
  end if;
  if (select count(*) from runs where device = p_device and started_at > now() - interval '10 minutes') >= 40 then
    raise exception 'too many runs';
  end if;
  delete from runs where finished_at is null and started_at < now() - interval '1 day';
  insert into runs (device) values (p_device) returning id into v_id;
  return v_id;
end $$;

create or replace function public.submit_score(
  p_run uuid, p_device text, p_nickname text, p_score int, p_time numeric,
  p_stars int, p_storms int, p_title text, p_look jsonb
) returns json language plpgsql security definer set search_path = public as $$
declare
  r runs;
  v_elapsed numeric;
  v_nick text;
  v_best int;
  v_rank int;
begin
  select * into r from runs where id = p_run for update;
  if not found or r.device <> p_device then raise exception 'unknown run'; end if;
  if r.finished_at is not null then raise exception 'already submitted'; end if;

  v_elapsed := extract(epoch from now() - r.started_at);
  if p_time is null or p_time < 0 or p_time > v_elapsed + 3 or p_time > 7200 then
    raise exception 'time mismatch';
  end if;
  if p_stars is null or p_stars < 0 or p_stars > floor(p_time / 3) + 1 then
    raise exception 'stars mismatch';
  end if;
  if p_storms is null or p_storms < 0 or p_storms > floor((1 + floor(p_time / 15)) / 5) then
    raise exception 'storms mismatch';
  end if;
  if p_score is null or p_score < 0 or p_score > floor(p_time * 10) + p_stars * 50 + p_storms * 200 + 5 then
    raise exception 'score mismatch';
  end if;
  v_nick := clean_nickname(p_nickname);

  update runs set finished_at = now() where id = p_run;
  insert into scores (run_id, device, nickname, score, time_s, stars, storms, title, look)
  values (
    p_run, p_device, v_nick, p_score, round(p_time, 1), p_stars, p_storms,
    left(btrim(coalesce(p_title, '')), 20),
    jsonb_build_object(
      'skin', left(coalesce(p_look ->> 'skin', ''), 16),
      'hat', left(coalesce(p_look ->> 'hat', ''), 16),
      'face', left(coalesce(p_look ->> 'face', ''), 16)
    )
  );
  update scores set nickname = v_nick where device = p_device and nickname <> v_nick;

  select max(score) into v_best from scores where device = p_device and not hidden;
  select 1 + count(*) into v_rank
  from (select device, max(score) as s from scores where not hidden group by device) b
  where b.s > v_best;
  return json_build_object('best', v_best, 'rank', v_rank);
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
revoke all on function public.start_run(text) from public;
revoke all on function public.submit_score(uuid, text, text, int, numeric, int, int, text, jsonb) from public;
revoke all on function public.get_leaderboard(text) from public;
revoke all on function public.set_nickname(text, text) from public;
grant execute on function public.start_run(text) to anon, authenticated;
grant execute on function public.submit_score(uuid, text, text, int, numeric, int, int, text, jsonb) to anon, authenticated;
grant execute on function public.get_leaderboard(text) to anon, authenticated;
grant execute on function public.set_nickname(text, text) to anon, authenticated;
