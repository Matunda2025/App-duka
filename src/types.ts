// Represents a user profile stored in the 'profiles' table.
export interface Profile {
  id: string; // Corresponds to Supabase auth user ID
  email: string;
  username?: string; // Optional username
  role: 'user' | 'admin' | 'developer';
}

export interface Review {
  id: string;
  app_id: string;
  user_id: string;
  // For display, we can join to get profile info
  user_email: string;
  rating: number; // 1 to 5
  comment: string;
  created_at: string;
}

// A review as returned by the API when fetching for a specific user.
// It includes details about the app that was reviewed.
export interface UserReview extends Omit<Review, 'user_email'> {
  app: {
    id: string;
    name: string;
    icon_url: string;
  };
}

export interface App {
  id: string;
  name: string;
  version: string;
  size: string;
  created_at: string;
  icon_url: string;
  apk_url: string;
  short_description: string;
  full_description: string;
  screenshots: string[];
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  // These fields will come from the database function/view
  average_rating: number;
  review_count: number;
}

/**
 * Represents the data structure for the app creation/editing form.
 * It omits server-generated and calculated fields.
 */
export type AppFormData = Omit<App, 'id' | 'created_at' | 'average_rating' | 'review_count' | 'status'>;