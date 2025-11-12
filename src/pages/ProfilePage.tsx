import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, getReviewsByUserId } from '../services/api';
import { UserReview } from '../types';
import { StarRating } from '../components/StarRating';

// A simple User Icon component for visual flair
const UserIcon = () => (
    <svg className="w-24 h-24 text-slate-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
    </svg>
);


const ProfilePage: React.FC = () => {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState(profile?.username || '');
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [loading, setLoading] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reviewsError, setReviewsError] = useState('');

    useEffect(() => {
        if (profile?.username) {
            setUsername(profile.username);
        }
    }, [profile]);

    useEffect(() => {
        const fetchUserReviews = async () => {
            if (user) {
                try {
                    setReviewsLoading(true);
                    const userReviews = await getReviewsByUserId(user.id);
                    setReviews(userReviews);
                } catch (err) {
                    console.error("Failed to fetch user reviews", err);
                    setReviewsError("Imeshindwa kupakia maoni.");
                } finally {
                    setReviewsLoading(false);
                }
            }
        };
        fetchUserReviews();
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile || username === profile.username) return;

        if (window.confirm("Una uhakika unataka kuhifadhi mabadiliko haya?")) {
            setLoading(true);
            setError('');
            setSuccess('');
            try {
                await updateUserProfile(user.id, { username });
                setSuccess('Wasifu umesasishwa kikamilifu!');
                // Manually update profile in context for immediate feedback
                // Note: A more robust solution might involve a dedicated context update function
                if (profile) profile.username = username;
                setTimeout(() => setSuccess(''), 3000);
            } catch (err: any) {
                setError(err.message || 'Imeshindwa kusasisha wasifu.');
            } finally {
                setLoading(false);
            }
        }
    };
    
    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };
    
    const getRoleDisplayName = (role: 'user' | 'admin' | 'developer' | undefined) => {
        switch (role) {
            case 'admin': return 'Msimamizi';
            case 'developer': return 'Msanidi';
            case 'user': return 'Mtumiaji';
            default: return '';
        }
    };

    return (
        <div className="min-h-screen bg-background">
             <header className="bg-surface shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary">Akaunti Yangu</h1>
                    <Link to="/" className="text-sm font-medium text-primary hover:underline">
                        &larr; Rudi Mwanzo
                    </Link>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface rounded-lg shadow-lg p-6 sticky top-24">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4 border-4 border-slate-200">
                                    <UserIcon />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary truncate max-w-full">{profile?.username || user?.email}</h2>
                                <p className="text-sm text-text-secondary capitalize font-semibold">{getRoleDisplayName(profile?.role)}</p>
                            </div>
                            
                            {(profile?.role === 'admin' || profile?.role === 'developer') && (
                                <div className="mb-6 border-b border-slate-200 pb-6">
                                    <Link to="/admin/dashboard" className="block w-full text-center bg-secondary hover:bg-teal-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                                        Jopo la Usimamizi
                                    </Link>
                                </div>
                            )}

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary">Barua Pepe</label>
                                    <p className="text-text-primary bg-slate-50 p-2 rounded-md mt-1 truncate">{user?.email}</p>
                                </div>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-text-secondary">Jina la Mtumiaji</label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                        placeholder="Weka jina la mtumiaji"
                                    />
                                </div>
                                
                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                {success && <p className="text-green-600 text-sm text-center">{success}</p>}

                                <button type="submit" disabled={loading || !username || username === profile?.username} className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed">
                                    {loading ? 'Inahifadhi...' : 'Hifadhi Mabadiliko'}
                                </button>
                                <button type="button" onClick={handleLogout} className="w-full mt-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                                    Ondoka
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Reviews List */}
                    <div className="lg:col-span-2">
                        <div className="bg-surface rounded-lg shadow-lg">
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-2xl font-bold text-text-primary">Historia ya Maoni Yako</h2>
                                <p className="text-text-secondary mt-1">
                                    Jumla ya maoni: <span className="font-bold text-primary">{reviews.length}</span>
                                </p>
                            </div>
                            <div className="p-6">
                                {reviewsLoading ? (
                                    <p className="text-text-secondary text-center py-8">Inapakia maoni yako...</p>
                                ) : reviewsError ? (
                                    <p className="text-red-500 text-center py-8">{reviewsError}</p>
                                ) : reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map(review => (
                                            <div key={review.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 transition-shadow hover:shadow-md">
                                                <div className="flex items-start space-x-4">
                                                    <img src={review.app.icon_url} alt={`${review.app.name} icon`} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 mt-1" />
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-start">
                                                          <Link to={`/app/${review.app.id}`} className="font-bold text-lg text-text-primary hover:text-primary transition-colors">{review.app.name}</Link>
                                                          <p className="text-xs text-slate-500 flex-shrink-0 ml-2">
                                                              {new Date(review.created_at).toLocaleDateString('sw-TZ')}
                                                          </p>
                                                        </div>
                                                        <div className="flex items-center my-1">
                                                            <StarRating rating={review.rating} readOnly />
                                                        </div>
                                                        <p className="text-text-secondary text-sm leading-relaxed">{review.comment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <h3 className="text-lg font-semibold text-text-primary">Bado Hujatoa Maoni</h3>
                                        <p className="text-text-secondary mt-2">Ukiacha maoni kwenye programu yoyote, yataonekana hapa.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;