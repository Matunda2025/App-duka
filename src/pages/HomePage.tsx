import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllApps } from '../services/api';
import { App } from '../types';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/StarRating';
import AiAssistantModal from '../components/AiAssistantModal';

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
  const { profile, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('zote');
  const [sortBy, setSortBy] = useState('mpya-zaidi');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const appData = await getAllApps();
        setApps(appData);
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
                <div className="w-24 h-8 bg-slate-200 rounded-md animate-pulse"></div>
            ) : profile ? (
              <Link to="/my-account" className="text-sm font-semibold text-text-primary bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2 rounded-full">
                Akaunti Yangu
              </Link>
            ) : (
              <Link to="/auth" className="text-sm font-semibold text-white bg-primary hover:bg-blue-700 transition-colors px-5 py-2 rounded-full shadow">
                Ingia
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 p-4 bg-surface rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className='text-center md:text-left'>
                <h2 className='text-xl font-bold text-text-primary'>Tafuta Programu Unayoipenda</h2>
                <p className='text-sm text-text-secondary mt-1'>Au muulize msaidizi wetu wa AI akusaidie!</p>
            </div>
            <button 
                onClick={() => setIsAssistantOpen(true)}
                className="bg-secondary hover:bg-teal-600 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-300 flex items-center space-x-2"
            >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
                <span>Msaidizi wa AI</span>
            </button>
        </div>

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
      
      {isAssistantOpen && <AiAssistantModal apps={apps} onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
};

export default HomePage;