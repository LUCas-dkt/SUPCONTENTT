-- Compte administrateur principal (apres inscription via /auth/sign-up)
update public.profiles
set is_admin = true, updated_at = now()
where id = (
  select id from auth.users where email = 'ldiakite641@gmail.com' limit 1
);
