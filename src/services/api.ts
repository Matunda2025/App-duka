import { supabase } from './supabaseClient';
import { App, AppFormData, Review, Profile, UserReview } from '../types';
import { GoogleGenAI } from '@google/genai';


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

// --- File Management (Storage) ---
const APP_FILES_BUCKET = 'app_files';

/**
 * Uploads a file to the Supabase storage bucket for app files.
 * @param file The file to upload.
 * @param appName The name of the app, used for creating a clean file path.
 * @returns The public URL of the uploaded file.
 */
export const uploadAppFile = async (file: File, appName: string): Promise<string> => {
    // Sanitize appName to create a safe folder name
    const safeAppName = appName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    // Create a unique file name to avoid collisions
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${safeAppName}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(APP_FILES_BUCKET)
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from(APP_FILES_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * Deletes a file from the Supabase storage bucket by its public URL.
 * @param publicUrl The public URL of the file to delete.
 */
export const deleteAppFileByUrl = async (publicUrl: string): Promise<void> => {
    if (!publicUrl) return;
    try {
        const url = new URL(publicUrl);
        // The path is everything after the bucket name in the URL's pathname
        const pathSegments = url.pathname.split('/');
        const bucketNameIndex = pathSegments.findIndex(segment => segment === APP_FILES_BUCKET);
        if (bucketNameIndex === -1 || bucketNameIndex + 1 >= pathSegments.length) {
            throw new Error('Invalid public URL, could not extract file path.');
        }
        const filePath = pathSegments.slice(bucketNameIndex + 1).join('/');

        const { error } = await supabase.storage
            .from(APP_FILES_BUCKET)
            .remove([filePath]);
        
        if (error && error.message !== 'The resource was not found') {
            console.error('Error deleting file:', error.message);
            // We don't throw here, as failing to delete an old file shouldn't block an update.
            // A more robust system might log this for manual cleanup.
        }
    } catch (e) {
        console.error("Could not parse URL to delete file:", e);
    }
};

// --- App Management ---

export const getAllApps = async (): Promise<App[]> => {
  // Use the RPC call to the database function for better performance
  const { data, error } = await supabase.rpc('get_apps_with_ratings');

  if (error) {
    console.error('Error fetching apps with ratings:', error);
    throw error;
  }
  return data || [];
};

export const getAppById = async (id: string): Promise<App | null> => {
  const { data, error } = await supabase
    .rpc('get_app_by_id_with_ratings', { p_app_id: id })
    .single();

  if (error) {
    console.error('Error fetching app by id with ratings:', error);
    // "JSON object requested, multiple (or no) rows returned" usually means not found for .single()
    if (error.code === 'PGRST116') {
        return null;
    }
    throw new Error(error.message);
  }

  return data;
};

// Admin-only functions
export const addApp = async (appData: AppFormData): Promise<App> => {
    const { data, error } = await supabase
        .from('apps')
        .insert([appData])
        .select()
        .single();
    if (error) throw error;
    return { ...data, average_rating: 0, review_count: 0 };
};

export const updateApp = async (appId: string, appData: Partial<AppFormData>): Promise<App> => {
    const { data, error } = await supabase
        .from('apps')
        .update(appData)
        .eq('id', appId)
        .select()
        .single();
    if (error) throw error;
    // Note: this doesn't refetch the rating. The UI should refetch the full app details if needed.
    return { ...data, average_rating: 0, review_count: 0 };
};

export const updateAppStatus = async (appId: string, status: App['status']): Promise<App> => {
    const { data, error } = await supabase
        .from('apps')
        .update({ status })
        .eq('id', appId)
        .select()
        .single();
    if (error) throw error;
    return data;
};


export const deleteApp = async (appId: string): Promise<void> => {
    const { error } = await supabase.from('apps').delete().eq('id', appId);
    if (error) throw error;
};

// --- Review Management ---

export const getReviewsByAppId = async (appId: string): Promise<Review[]> => {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            profile:profiles (email)
        `)
        .eq('app_id', appId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Flatten the result for our `Review` type
    return data.map((r: any) => ({
        ...r,
        user_email: r.profile?.email || 'Mtumiaji asiyejulikana'
    }));
};

export const getReviewsByUserId = async (userId: string): Promise<UserReview[]> => {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            app:apps (id, name, icon_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter out reviews where the associated app might have been deleted
    return data.filter((r: any): r is UserReview => r.app !== null);
};


type NewReview = Omit<Review, 'id' | 'created_at' | 'user_email'>
export const addReview = async (reviewData: NewReview): Promise<Review> => {
    const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// --- Auth & Profile Management ---
export const signUpUser = (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
};

export const signInUser = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
};

export const signOutUser = () => {
    return supabase.auth.signOut();
};

export const sendPasswordResetEmail = (email: string) => {
    // This uses the Site URL from Supabase Auth settings and a built-in email template
    // which takes the user to a Supabase-hosted password reset page.
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Redirect back to app after reset
    });
};

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            console.warn(`Profile not found for user ${userId}. This can happen for new users before their profile is created.`);
            return null;
        }
        console.error("Error fetching profile:", error.message);
        throw error;
    }
    return data;
};

/**
 * Creates a profile for the current user. Used for recovery if the
 * on_auth_user_created trigger failed or didn't exist at signup.
 * Sets the role to admin as a convenience for the first-time setup.
 */
export const createProfileForCurrentUser = async (userId: string, email: string): Promise<Profile> => {
    const { data, error } = await supabase
        .from('profiles')
        .insert({ id: userId, email: email, role: 'admin' })
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error);
        throw error;
    }
    return data;
};

export const updateUserProfile = async (userId: string, updates: { username?: string }): Promise<Profile> => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Admin-only function to get all user profiles
export const getAllProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email');
    if (error) throw error;
    return data;
};

// Admin-only function to update a user's role
export const updateUserProfileRole = async (userId: string, role: 'user' | 'admin' | 'developer'): Promise<Profile> => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Admin-only function to delete a user
export const deleteUser = async (userId: string): Promise<void> => {
    const { error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });
    if (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

// --- Gemini AI Functions ---

// Initialize Gemini
// Ensure process.env.API_KEY is available. For Vite, this is handled in vite.config.ts
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini to get an app recommendation based on a user query.
 * @param query The user's natural language query.
 * @param apps The list of available apps to recommend from.
 * @returns A string response from the AI.
 */
export const getAiAppRecommendation = async (query: string, apps: App[]): Promise<string> => {
    const appInfo = apps.map(app => 
        `ID: ${app.id}, Jina: ${app.name}, Kategoria: ${app.category}, Maelezo: ${app.short_description}`
    ).join('\n');

    const prompt = `Wewe ni msaidizi mtaalam wa duka la programu la "App Duka". Lugha yako iwe Kiswahili.
    Hii ni orodha ya programu zilizopo:\n${appInfo}\n\n
    Mtumiaji anatafuta: "${query}"\n\n
    Tafadhali, pendekeza programu moja au zaidi zinazolingana na ombi la mtumiaji. 
    Toa maelezo mafupi na ya kirafiki kwa nini unapendekeza programu hizo.
    Kama hakuna programu inayolingana, eleza kwa upole na upendekeze mtumiaji atafute kitu kingine.
    Jibu lako liwe la moja kwa moja na fupi.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Imeshindwa kupata pendekezo kutoka kwa AI.");
    }
};

/**
 * Provides a brief analysis of an app for admins to help with the approval process.
 */
export const getAiAppAnalysis = async (app: App): Promise<string> => {
    const appDetails = `Jina la Programu: ${app.name}\nKategoria: ${app.category}\nMaelezo Mafupi: ${app.short_description}\nMaelezo Kamili: ${app.full_description}`;
    
    const prompt = `Wewe ni mchambuzi msaidizi wa usalama na ubora wa programu.
    Umepewa jukumu la kukagua programu mpya iliyowasilishwa kwenye duka la programu.
    
    Maelezo ya Programu:
    ${appDetails}

    Tafadhali toa uchambuzi mfupi katika lugha ya Kiswahili, ukizingatia yafuatayo:
    1.  **Mapendekezo ya Jina na Maelezo:** Je, jina na maelezo ni mazuri na yanafaa? Toa mapendekezo ya kuboresha kama yapo.
    2.  **Uwezekano wa Maudhui Hatari:** Kulingana na maelezo, je, kuna uwezekano wa programu kuwa na maudhui yasiyofaa, ulaghai (scam), au kukiuka sera? (k.m., ahadi za uongo, maudhui ya watu wazima).
    3.  **Mapendekezo ya Mwisho:** Toa pendekezo fupi la mwisho: "Inaonekana salama kuidhinishwa," "Inahitaji ukaguzi wa kina," au "Inaashiria hatari, pendekeza kukataliwa."
    
    Jibu liwe fupi na lenye hoja wazi.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for analysis:", error);
        throw new Error("Imeshindwa kupata uchambuzi kutoka kwa AI.");
    }
};
