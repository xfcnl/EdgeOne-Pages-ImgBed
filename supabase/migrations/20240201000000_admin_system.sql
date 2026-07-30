-- EdgeOne-Pages-ImgBed: Admin System
-- Run this in Supabase SQL Editor after the base migration

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_banned   BOOLEAN DEFAULT false,
  max_files   INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper: is_admin() (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (public.is_admin());

-- 2. Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Settings table (singleton)
CREATE TABLE settings (
  id                 INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  registration_mode  TEXT NOT NULL DEFAULT 'public' CHECK (registration_mode IN ('public', 'restricted', 'private')),
  updated_at         TIMESTAMPTZ DEFAULT now(),
  updated_by         UUID REFERENCES auth.users(id)
);

INSERT INTO settings (id, registration_mode) VALUES (1, 'public')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_all" ON settings
  FOR SELECT USING (true);

CREATE POLICY "settings_insert_admin" ON settings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "settings_update_admin" ON settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "settings_delete_admin" ON settings
  FOR DELETE USING (public.is_admin());

-- 4. Invite codes table
CREATE TABLE invite_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  used_by     UUID REFERENCES auth.users(id),
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  is_active   BOOLEAN DEFAULT true
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_codes_select_all" ON invite_codes
  FOR SELECT USING (true);

CREATE POLICY "invite_codes_admin_insert" ON invite_codes
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "invite_codes_admin_update" ON invite_codes
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "invite_codes_admin_delete" ON invite_codes
  FOR DELETE USING (public.is_admin());

-- 5. RPC: get_users_for_admin
CREATE OR REPLACE FUNCTION get_users_for_admin()
RETURNS TABLE (
  id          UUID,
  email       TEXT,
  role        TEXT,
  is_banned   BOOLEAN,
  max_files   INT,
  file_count  BIGINT,
  created_at  TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    p.role,
    p.is_banned,
    p.max_files,
    (SELECT COUNT(*)::BIGINT FROM images i WHERE i.user_id = p.id),
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- 6. RPC: set_user_role
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$;

-- 7. RPC: ban_user
CREATE OR REPLACE FUNCTION ban_user(target_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE profiles SET is_banned = true WHERE id = target_user_id;
END;
$$;

-- 8. RPC: unban_user
CREATE OR REPLACE FUNCTION unban_user(target_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE profiles SET is_banned = false WHERE id = target_user_id;
END;
$$;

-- 9. RPC: set_max_files
CREATE OR REPLACE FUNCTION set_max_files(target_user_id UUID, new_limit INT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF new_limit < 0 THEN
    UPDATE profiles SET max_files = NULL WHERE id = target_user_id;
  ELSE
    UPDATE profiles SET max_files = new_limit WHERE id = target_user_id;
  END IF;
END;
$$;

-- 10. RPC: create_my_profile (fallback - called when user IS logged in, auth.uid() works)
CREATE OR REPLACE FUNCTION create_my_profile()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role) VALUES (auth.uid(), 'user')
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- 11. RPC: set_admin_if_match (called right after signup, no session yet)
CREATE OR REPLACE FUNCTION set_admin_if_match(target_user_id UUID, admin_email TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;
  IF user_email = admin_email THEN
    INSERT INTO public.profiles (id, role) VALUES (target_user_id, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END;
$$;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
