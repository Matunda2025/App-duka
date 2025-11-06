import React, { useState } from 'react';

const fullSqlScript = `-- 1. Role and Status Type Definitions
CREATE TYPE public.app_role AS ENUM ('user', 'developer', 'admin');
CREATE TYPE public.app_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Profiles Table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  username text,
  role app_role NOT NULL DEFAULT 'user',
  PRIMARY KEY (id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow user to insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow user to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admins to update any profile role" ON public.profiles FOR UPDATE USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Apps Table
CREATE TABLE public.apps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  version text,
  category text,
  size text,
  icon_url text,
  apk_url text,
  short_description text,
  full_description text,
  screenshots text[],
  status app_status NOT NULL DEFAULT 'pending',
  PRIMARY KEY (id)
);
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public users can view approved apps, admins/devs can view all" ON public.apps FOR SELECT USING ( (status = 'approved') OR ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer')) );
CREATE POLICY "Allow admins/devs to manage apps" ON public.apps FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer') );

-- 4. Reviews Table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  app_id uuid NOT NULL REFERENCES public.apps ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rating int2 NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow user to insert their own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow user to update their own review" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- 5. Database Functions for Ratings
CREATE OR REPLACE FUNCTION public.get_apps_with_ratings()
RETURNS TABLE(id uuid, created_at timestamptz, name text, version text, category text, size text, icon_url text, apk_url text, short_description text, full_description text, screenshots text[], status app_status, average_rating numeric, review_count bigint) AS $$
BEGIN
  RETURN QUERY SELECT a.id, a.created_at, a.name, a.version, a.category, a.size, a.icon_url, a.apk_url, a.short_description, a.full_description, a.screenshots, a.status, COALESCE(avg(r.rating), 0) as average_rating, count(r.id) as review_count FROM public.apps a LEFT JOIN public.reviews r ON a.id = r.app_id GROUP BY a.id ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_app_by_id_with_ratings(p_app_id uuid)
RETURNS TABLE(id uuid, created_at timestamptz, name text, version text, category text, size text, icon_url text, apk_url text, short_description text, full_description text, screenshots text[], status app_status, average_rating numeric, review_count bigint) AS $$
BEGIN
  RETURN QUERY SELECT a.id, a.created_at, a.name, a.version, a.category, a.size, a.icon_url, a.apk_url, a.short_description, a.full_description, a.screenshots, a.status, COALESCE(avg(r.rating), 0) as average_rating, count(r.id) as review_count FROM public.apps a LEFT JOIN public.reviews r ON a.id = r.app_id WHERE a.id = p_app_id GROUP BY a.id;
END;
$$ LANGUAGE plpgsql;

-- 6. Supabase Storage Setup
-- Run this SQL, THEN go to Storage in Supabase dashboard, create a PUBLIC bucket named 'app_files'
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING ( bucket_id = 'app_files' );
CREATE POLICY "Allow admins/devs to upload files" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'app_files' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer') );
CREATE POLICY "Allow admins/devs to update files" ON storage.objects FOR UPDATE USING ( bucket_id = 'app_files' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer') );
CREATE POLICY "Allow admins/devs to delete files" ON storage.objects FOR DELETE USING ( bucket_id = 'app_files' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer') );

-- 7. Admin function to delete a user
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_role app_role;
BEGIN
  SELECT role INTO requesting_user_role FROM public.profiles WHERE id = auth.uid();
  IF requesting_user_role = 'admin' THEN
    DELETE FROM auth.users WHERE id = user_id_to_delete;
  ELSE
    RAISE EXCEPTION 'Only admins can delete users.';
  END IF;
END;
$$;
`;

export const DatabaseSetupError: React.FC = () => {
    const [copyStatus, setCopyStatus] = useState('Nakili Msimbo wa SQL');

    const handleCopy = () => {
        navigator.clipboard.writeText(fullSqlScript).then(() => {
            setCopyStatus('Imenakiliwa!');
            setTimeout(() => setCopyStatus('Nakili Msimbo wa SQL'), 2000);
        }, () => {
            setCopyStatus('Imeshindwa kunakili');
        });
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-4xl mx-auto my-8 bg-red-50 p-6 sm:p-8 rounded-xl shadow-lg border-2 border-red-200">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-700 mb-3">Hitilafu ya Usanidi wa Database</h2>
                    <p className="text-slate-700 mb-5">
                        Inaonekana kuna tatizo la usanidi. Majedwali (tables) au functions muhimu hazijatengenezwa kwenye database yako.
                    </p>
                </div>

                <div className="bg-slate-100 p-4 rounded-md text-left text-sm text-slate-800">
                    <p className="font-semibold text-slate-900 mb-2">Ili kurekebisha hili, fuata hatua hizi:</p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Nenda kwenye mradi wako wa Supabase na ufungue <strong className="font-bold">SQL Editor</strong>.</li>
                        <li>Bonyeza kitufe hapa chini ili kunakili msimbo wote wa SQL.</li>
                        <li>Bandika (paste) msimbo huo kwenye SQL Editor na ubonyeze <strong className="font-bold">RUN</strong>.</li>
                        <li>Nenda kwenye <strong className="font-bold">Storage</strong>, bonyeza "Create new bucket", ipe jina <code className="bg-red-100 text-red-800 font-mono p-1 rounded-md">app_files</code> na uhakikishe <strong className="font-bold">"Public bucket"</strong> imechaguliwa.</li>
                    </ol>
                </div>
                
                <div className="mt-6 flex flex-col items-center">
                    <button 
                        onClick={handleCopy}
                        className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-blue-300"
                    >
                        {copyStatus}
                    </button>
                    <p className="mt-4 text-sm text-slate-500">
                        Baada ya kukamilisha hatua zote, tafadhali onyesha upya (refresh) ukurasa huu.
                    </p>
                </div>
            </div>
        </div>
    );
};