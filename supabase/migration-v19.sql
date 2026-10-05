  -- Store chess scores (1-0, 1/2-1/2, 0-1) instead of win/loss/draw.
  -- Run in the Supabase SQL Editor after migration-v18.sql.

  alter table public.game_results drop constraint if exists game_results_result_check;

  update public.game_results
  set result = case result
    when 'win' then '1-0'
    when 'loss' then '0-1'
    when 'draw' then '1/2-1/2'
    else result
  end;

  alter table public.game_results
    add constraint game_results_result_check
    check (result in ('1-0', '1/2-1/2', '0-1'));
