-- 074: Deterministic seed for the local player account (GoTrue user).
--
-- Admin and player are equal for product access today: same authenticated RLS,
-- same library visibility, native assets for every account. Saga-scoped roles
-- are defined later inside each saga — not at the auth-user level.
--
-- Shortcut in the app: username `player` / password `1234` → this email.
-- Fixed UUID stays in sync with src/lib/localPlayer.ts LOCAL_PLAYER_USER_ID.
--
-- Idempotent: existing player row with a divergent id is normalized; missing
-- row is created.

do $$
declare
  v_seed_id  uuid := '00000000-0000-4000-8000-000000000002';
  v_email    text := 'player@sagadrive.local';
  v_password text := '1234';
  v_existing uuid;
begin
  select id into v_existing from auth.users where lower(email) = v_email;

  if v_existing = v_seed_id then
    update auth.users set
      encrypted_password = crypt(v_password, gen_salt('bf', 10)),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data  = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"username":"player","display_name":"Player"}'::jsonb,
      updated_at         = now()
    where id = v_seed_id;
    raise notice '074: player already seeded; password refreshed.';
  elsif v_existing is not null then
    update public.characters      set owner_user_id = v_seed_id where owner_user_id = v_existing;
    update public.projects        set gm_user_id    = v_seed_id where gm_user_id    = v_existing;
    update public.project_members set user_id       = v_seed_id where user_id       = v_existing;
    update public.session_players set user_id       = v_seed_id where user_id       = v_existing;
    update public.world_profiles  set owner_user_id = v_seed_id where owner_user_id = v_existing;
    update public.chat_messages   set user_id       = v_seed_id where user_id       = v_existing;
    update public.worlds          set creator_user_id = v_seed_id where creator_user_id = v_existing;
    update auth.mfa_factors       set user_id       = v_seed_id where user_id       = v_existing;
    update auth.refresh_tokens    set user_id       = v_seed_id::text where user_id = v_existing::text;

    delete from auth.identities where user_id = v_existing;
    delete from auth.sessions   where user_id = v_existing;

    update auth.users set
      id                 = v_seed_id,
      encrypted_password = crypt(v_password, gen_salt('bf', 10)),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data  = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"username":"player","display_name":"Player"}'::jsonb,
      updated_at         = now()
    where id = v_existing;
    raise notice '074: normalized player user % -> %', v_existing, v_seed_id;
  else
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_confirm_status, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_seed_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf', 10)),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"player","display_name":"Player"}'::jsonb,
      now(), now(),
      '', '', '', '',
      0, false
    );
    raise notice '074: created player user %', v_seed_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_seed_id and provider = 'email'
  ) then
    insert into auth.identities (
      id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_seed_id, 'email', v_email,
      jsonb_build_object('sub', v_seed_id::text, 'email', v_email),
      now(), now(), now()
    );
  end if;
end $$;
