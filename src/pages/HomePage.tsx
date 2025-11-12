// Fix: Implemented the HomePage component.
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllApps } from '../services/api';
import { App } from '../types';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/StarRating';

const AppCard: React.FC<{ app: App }> = ({ app }) => (
  <Link to={`/app/${app.id}`} className="block bg-surface rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
    <div className="p-4 flex items-center space-x-4">
      <img src={app.icon_url} alt={`${app.name} icon`} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <h3 className="text-lg font-bold text-text-primary truncate">{app.name}</h3>
        <div className="flex items-center mt-1">
          <StarRating rating={app.average_rating} readOnly />
          <span className="text-xs text-slate-500 ml-2 truncate">({app.review_count} maoni)</span>
        </div>
        <p className="text-sm text-text-secondary mt-1 truncate">{app.category} &bull; {app.size}</p>
      </div>
      <div className="flex-shrink-0">
        <span className="text-primary font-semibold text-sm">Angalia</span>
      </div>
    </div>
  </Link>
);


const HomePage: React.FC = () => {
  const { profile, openAuthModal, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('zote');
  const [sortBy, setSortBy] = useState('mpya-zaidi');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const appData = await getAllApps();
        // Only show approved apps on the public homepage
        setApps(appData.filter(app => app.status === 'approved'));
      } catch (err: any) {
        console.error("Failed to fetch apps:", err);
        setError("Imeshindwa kupakia programu. Tafadhali jaribu tena.");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  // Get unique categories for the filter dropdown
  const categories = ['zote', ...Array.from(new Set(apps.map(app => app.category).filter(Boolean)))];

  const processedApps = apps
    .filter(app => {
      // Filter by category
      if (selectedCategory === 'zote') return true;
      return app.category === selectedCategory;
    })
    .filter(app => {
      // Filter by search term
      return app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             app.category?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // Sort the results
      switch (sortBy) {
        case 'ukadiriaji':
          return b.average_rating - a.average_rating;
        case 'maoni':
          return b.review_count - a.review_count;
        case 'mpya-zaidi':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">App Duka</h1>
          <div className="flex items-center space-x-4">
             {authLoading ? (
                <div className="w-24 h-9 bg-slate-200 rounded-full animate-pulse"></div>
            ) : profile ? (
              <Link to="/my-account" className="text-sm font-semibold text-text-primary bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2 rounded-full">
                Akaunti Yangu
              </Link>
            ) : (
              <button onClick={openAuthModal} className="text-sm font-semibold text-white bg-primary hover:bg-blue-700 transition-colors px-5 py-2 rounded-full shadow">
                Ingia
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-center md:space-x-4 md:flex-wrap md:gap-y-4">
            <div className="flex-grow md:flex-grow-0 md:w-full lg:w-1/2">
                <input
                    type="text"
                    placeholder="Tafuta programu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 rounded-full bg-surface text-text-primary border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
            </div>
            <div className="flex items-center space-x-4 w-full md:w-auto flex-grow md:flex-grow-0">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-full bg-surface text-text-primary border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    aria-label="Chuja kwa kategoria"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat} className="capitalize">{cat === 'zote' ? 'Kategoria Zote' : cat}</option>
                    ))}
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-full bg-surface text-text-primary border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    aria-label="Panga kwa"
                >
                    <option value="mpya-zaidi">Mpya Zaidi</option>
                    <option value="ukadiriaji">Ukadiriaji wa Juu</option>
                    <option value="maoni">Maoni Mengi</option>
                </select>
            </div>
        </div>

        {loading ? (
          <div className="text-center text-text-secondary">Inapakia programu...</div>
        ) : error ? (
            <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedApps.length > 0 ? (
              processedApps.map(app => <AppCard key={app.id} app={app} />)
            ) : (
              <p className="text-center text-text-secondary md:col-span-2 lg:col-span-3">Hakuna programu iliyopatikana.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;