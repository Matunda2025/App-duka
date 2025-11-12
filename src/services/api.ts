import { supabase } from './supabaseClient';
import { App, AppFormData, Review, Profile, UserReview } from '../types';
import { GoogleGenAI } from "@google/genai";

/*
  SETUP YOUR SUPABASE DATABASE WITH THE FOLLOWING SQL:
  Go to your Supabase project's "SQL Editor" and run these commands.

  -- FIRST, IF YOU RAN THE OLD SCRIPT, DROP THE OLD ROLE COLUMN and TYPE if it exists
  -- ALTER TABLE public.profiles DROP COLUMN role;
  -- DROP TYPE public.app_role;
  -- DROP TYPE public.app_status;
  
  -- 1. Role and Status Type Definitions
  CREATE TYPE public.app_role AS ENUM ('user', 'developer', 'admin');
  CREATE TYPE public.app_status AS ENUM ('pending', 'approved', 'rejected');


  -- 2. Profiles Table (for user roles and public data)
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

  -- Function to create a profile when a new user signs up
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
  -- *** CORRECTED RLS POLICIES FOR PUBLIC VIEWING ***
  -- DROP OLD POLICIES on public.apps IF THEY EXIST
  -- These two policies work together. Supabase combines multiple SELECT policies with OR.
  CREATE POLICY "Public users can view approved apps" ON public.apps FOR SELECT USING (status = 'approved');
  CREATE POLICY "Allow admins/devs to view any app" ON public.apps FOR SELECT USING ((auth.uid() IS NOT NULL) AND ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer')));
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


  -- 5. Database Functions for App Ratings
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
  -- In your Supabase dashboard, go to Storage and create a new PUBLIC bucket named 'app_files'.
  -- Then, run these policies in the SQL Editor.
  CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING ( bucket_id = 'app_files' );
  CREATE POLICY "Allow admins/devs to upload files" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'app_files' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer') );
  CREATE POLICY "Allow admins/devs to update files" ON storage.objects FOR UPDATE USING ( bucket_id = 'app_files' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer') );
  CREATE POLICY "Allow admins/devs to delete files" ON storage.objects FOR DELETE USING ( bucket_id = 'app_files' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'developer') );
  
  -- 7. Admin function to delete a user
  -- This function MUST be created by a superuser in the Supabase SQL Editor.
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

*/

// Initialize the Google AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- File Management (Storage) ---
const APP_FILES_BUCKET = 'app_files';

export const uploadAppFile = async (file: File, appName: string): Promise<string> => {
    const safeAppName = appName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${safeAppName}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(APP_FILES_BUCKET).upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(APP_FILES_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};

export const deleteAppFileByUrl = async (publicUrl: string): Promise<void> => {
    if (!publicUrl) return;
    try {
        const url = new URL(publicUrl);
        const pathSegments = url.pathname.split('/');
        const bucketNameIndex = pathSegments.findIndex(segment => segment === APP_FILES_BUCKET);
        if (bucketNameIndex === -1 || bucketNameIndex + 1 >= pathSegments.length) {
            throw new Error('Invalid public URL, could not extract file path.');
        }
        const filePath = pathSegments.slice(bucketNameIndex + 1).join('/');

        const { error } = await supabase.storage.from(APP_FILES_BUCKET).remove([filePath]);
        if (error && error.message !== 'The resource was not found') {
            console.error('Error deleting file:', error.message);
        }
    } catch (e) {
        console.error("Could not parse URL to delete file:", e);
    }
};

// --- App Management ---
export const getAllApps = async (): Promise<App[]> => {
  const { data, error } = await supabase.rpc('get_apps_with_ratings');
  if (error) throw error;
  return data || [];
};

export const getAppById = async (id: string): Promise<App | null> => {
  const { data, error } = await supabase.rpc('get_app_by_id_with_ratings', { p_app_id: id }).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const addApp = async (appData: AppFormData): Promise<App> => {
    const { data, error } = await supabase.from('apps').insert([appData]).select().single();
    if (error) throw error;
    return { ...data, average_rating: 0, review_count: 0 };
};

export const updateApp = async (appId: string, appData: Partial<AppFormData>): Promise<App> => {
    const { data, error } = await supabase.from('apps').update(appData).eq('id', appId).select().single();
    if (error) throw error;
    return { ...data, average_rating: 0, review_count: 0 };
};

export const updateAppStatus = async (appId: string, status: App['status']): Promise<App> => {
    const { data, error } = await supabase.from('apps').update({ status }).eq('id', appId).select().single();
    if (error) throw error;
    return data;
};

export const deleteApp = async (appId: string): Promise<void> => {
    const { error } = await supabase.from('apps').delete().eq('id', appId);
    if (error) throw error;
};

// --- Review Management ---
export const getReviewsByAppId = async (appId: string): Promise<Review[]> => {
    const { data, error } = await supabase.from('reviews').select(`*, profile:profiles (email)`).eq('app_id', appId).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((r: any) => ({ ...r, user_email: r.profile?.email || 'Mtumiaji asiyejulikana' }));
};

export const getReviewsByUserId = async (userId: string): Promise<UserReview[]> => {
    const { data, error } = await supabase.from('reviews').select(`*, app:apps (id, name, icon_url)`).eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data.filter((r: any): r is UserReview => r.app !== null);
};

type NewReview = Omit<Review, 'id' | 'created_at' | 'user_email'>
export const addReview = async (reviewData: NewReview): Promise<Review> => {
    const { data, error } = await supabase.from('reviews').insert([reviewData]).select().single();
    if (error) throw error;
    return data;
};

// --- Auth & Profile Management ---
export const signUpUser = (email: string, password: string) => supabase.auth.signUp({ email, password });
export const signInUser = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signOutUser = () => supabase.auth.signOut();
export const sendPasswordResetEmail = (email: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
};

export const createProfileForCurrentUser = async (userId: string, email: string): Promise<Profile> => {
    const { data, error } = await supabase.from('profiles').insert({ id: userId, email: email, role: 'admin' }).select().single();
    if (error) throw error;
    return data;
};

export const updateUserProfile = async (userId: string, updates: { username?: string }): Promise<Profile> => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
};

export const getAllProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('email');
    if (error) throw error;
    return data;
};

export const updateUserProfileRole = async (userId: string, role: Profile['role']): Promise<Profile> => {
    const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select().single();
    if (error) throw error;
    return data;
};

export const deleteUser = async (userId: string): Promise<void> => {
    const { error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });
    if (error) throw error;
};

// --- Gemini AI Functions ---
export const getAiAppAnalysis = async (app: App): Promise<string> => {
    try {
        const prompt = `You are an expert app store reviewer for a Swahili app store. Analyze the following app submission based on its metadata.
Provide a concise summary for an administrator, highlighting potential strengths, weaknesses, and any red flags (e.g., vague description, suspicious category, mismatch between name and description).
The response MUST be in Swahili.

App Details:
- Name: ${app.name}
- Category: ${app.category}
- Short Description: ${app.short_description}
- Full Description: ${app.full_description}

Your analysis:`;
        
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        throw new Error("Imeshindwa kuchambua programu kwa kutumia AI.");
    }
};

export const getAiAppRecommendation = async (query: string, apps: App[]): Promise<string> => {
    try {
        const appInfo = apps.map(app => `- Jina: ${app.name}, Maelezo: ${app.short_description} (Kategoria: ${app.category})`).join('\n');
        const prompt = `You are a friendly AI assistant for a Swahili app store called "App Duka". Help users find the best app for their needs.
The response MUST be in Swahili. Be conversational and helpful.

Available apps:
${appInfo}

User's request: "${query}"

Recommend suitable apps from the list. Explain why. If no app fits, politely say so.`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        throw new Error("Imeshindwa kupata pendekezo la programu kutoka kwa AI.");
    }
};