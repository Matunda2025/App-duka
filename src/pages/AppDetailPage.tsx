import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAppById, getReviewsByAppId, addReview } from '../services/api';
import { App, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/StarRating';

const AppDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const appData = await getAppById(id);
        if (appData) {
          setApp(appData);
        } else {
          setPageError("Programu haipatikani.");
        }
      } catch (error) {
        console.error("Failed to fetch app details:", error);
        setPageError("Imeshindwa kupakia maelezo ya programu.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
        if (!id) return;
        setLoadingReviews(true);
        try {
            const reviewsData = await getReviewsByAppId(id);
            setReviews(reviewsData);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoadingReviews(false);
        }
    };
    if (id) {
        fetchReviews();
    }
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0 || !newComment.trim()) {
        setReviewError('Tafadhali chagua ukadiriaji na uandike maoni.');
        return;
    }
    if (!id || !user) return;

    setIsSubmitting(true);
    setReviewError('');
    try {
        await addReview({
            app_id: id,
            rating: newRating,
            comment: newComment,
            user_id: user.id,
        });
        
        setNewRating(0);
        setNewComment('');
        const updatedReviews = await getReviewsByAppId(id);
        setReviews(updatedReviews);

        const updatedApp = await getAppById(id);
        if (updatedApp) {
            setApp(updatedApp);
        }

    } catch (error) {
        console.error("Failed to submit review", error);
        setReviewError('Imeshindwa kuwasilisha maoni. Jaribu tena.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-text-secondary">Inapakia...</div>;
  }

  if (pageError) {
    return <div className="flex items-center justify-center min-h-screen text-red-500 p-8">{pageError}</div>;
  }

  if (!app) {
    return <div className="flex items-center justify-center min-h-screen text-text-secondary">Programu haipatikani.</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-primary hover:underline mb-6 inline-block font-medium">&larr; Rudi kwenye orodha</Link>
        
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
          <header className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <img src={app.icon_url} alt={`${app.name} icon`} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-text-primary">{app.name}</h1>
               <div className="flex items-center mt-2 space-x-2">
                  <StarRating rating={app.average_rating} readOnly />
                  <span className="text-sm text-text-secondary">
                      {app.average_rating.toFixed(1)} kati ya 5 ({app.review_count} maoni)
                  </span>
              </div>
              <div className="flex items-center flex-wrap gap-x-4 text-sm text-text-secondary mt-2">
                <span>Toleo: {app.version}</span>
                <span>Ukubwa: {app.size}</span>
                <span>Iliwekwa: {new Date(app.created_at).toLocaleDateString('sw-TZ')}</span>
              </div>
            </div>
            <a 
              href={app.apk_url}
              download
              className="w-full sm:w-auto bg-secondary hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-center flex-shrink-0 mt-4 sm:mt-0"
            >
              Pakua APK
            </a>
          </header>

          <main className="p-6">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">Maelezo Kamili</h2>
              <p className="text-text-secondary leading-relaxed">{app.full_description}</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">Picha za Skrini</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {app.screenshots.map((shot, index) => (
                  <img key={index} src={shot} alt={`Screenshot ${index + 1}`} className="w-full h-auto rounded-lg shadow-md" />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">Ukadiriaji na Maoni</h2>
              
              {user ? (
                <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Acha maoni yako</h3>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-secondary mb-2">Ukadiriaji wako</label>
                      <StarRating rating={newRating} setRating={setNewRating} />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="comment" className="block text-sm font-medium text-text-secondary mb-2">Maoni yako</label>
                      <textarea
                        id="comment"
                        rows={4}
                        className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Andika maoni yako hapa..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    {reviewError && <p className="text-red-500 text-sm mb-4">{reviewError}</p>}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 disabled:bg-blue-300"
                    >
                      {isSubmitting ? 'Inatuma...' : 'Wasilisha Maoni'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200 text-center">
                    <p className="text-text-secondary">
                        <Link to="/auth" className="text-primary font-semibold hover:underline">Ingia</Link> ili uache maoni yako.
                    </p>
                </div>
              )}
              
              <div>
                {loadingReviews ? (
                  <p className="text-text-secondary">Inapakia maoni...</p>
                ) : reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                        <div className="flex items-center mb-2">
                          <StarRating rating={review.rating} readOnly />
                        </div>
                        <p className="text-text-secondary mb-2">{review.comment}</p>
                        <p className="text-xs text-slate-500">
                          Na <span className="font-semibold">{review.user_email}</span> mnamo {new Date(review.created_at).toLocaleDateString('sw-TZ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary">Hakuna maoni bado. Kuwa wa kwanza!</p>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppDetailPage;