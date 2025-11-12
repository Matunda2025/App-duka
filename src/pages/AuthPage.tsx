import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInUser, signUpUser, sendPasswordResetEmail } from '../services/api';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'auth' | 'reset'>('auth');
  
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = isLogin ? await signInUser(email, password) : await signUpUser(email, password);
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message || `Imeshindwa ${isLogin ? 'kuingia' : 'kujisajili'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
        await sendPasswordResetEmail(email);
        setSuccess('Tumekutumia maelekezo kwenye barua pepe yako. Tafadhali angalia kikasha chako.');
    } catch (err: any) {
        setError(err.message || 'Imeshindwa kutuma barua pepe ya kuweka nenosiri jipya.');
    } finally {
        setLoading(false);
    }
  };

  if (authLoading) {
      return <div className="min-h-screen flex items-center justify-center">Inasubiri...</div>;
  }

  if (profile) {
    return <Navigate to="/" replace />;
  }
  
  const resetFormState = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-lg relative">
        <Link to="/" className="absolute top-4 left-4 text-sm font-medium text-primary hover:underline" aria-label="Rudi Mwanzo">
            &larr; Rudi Mwanzo
        </Link>
        
        {view === 'reset' ? (
            <>
              <h2 className="text-3xl font-bold text-center text-text-primary mb-2 mt-8">Weka Upya Nenosiri</h2>
              <p className="text-center text-text-secondary mb-8">Weka barua pepe yako ili kupokea maelekezo.</p>
              <form onSubmit={handlePasswordReset}>
                  {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                  {success && <p className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm">{success}</p>}
                  <div className="mb-4">
                      <label htmlFor="email" className="block text-text-secondary text-sm font-bold mb-2">Barua Pepe</label>
                      <input
                          type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-slate-50 text-text-primary border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                      />
                  </div>
                  <button
                      type="submit" disabled={loading || !!success}
                      className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-blue-300"
                  >
                      {loading ? 'Inatuma...' : 'Tuma Maelekezo'}
                  </button>
              </form>
              <p className="text-center text-text-secondary mt-6">
                  <button onClick={() => { setView('auth'); resetFormState(); }} className="font-semibold text-primary hover:underline">
                      &larr; Rudi Kuingia
                  </button>
              </p>
            </>
        ) : (
            <>
              <h2 className="text-3xl font-bold text-center text-text-primary mb-2 mt-8">{isLogin ? 'Ingia' : 'Jisajili'}</h2>
              <p className="text-center text-text-secondary mb-8">Karibu App Duka</p>
              
              <form onSubmit={handleSubmit}>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                <div className="mb-4">
                  <label htmlFor="email-auth" className="block text-text-secondary text-sm font-bold mb-2">Barua Pepe</label>
                  <input
                    type="email" id="email-auth" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 text-text-primary border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label htmlFor="password" className="block text-text-secondary text-sm font-bold mb-2">Nenosiri</label>
                  <input
                    type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 text-text-primary border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="flex items-center justify-end mb-6 h-5">
                    {isLogin && (
                        <button type="button" onClick={() => { setView('reset'); resetFormState(); }} className="text-sm font-semibold text-primary hover:underline">
                            Umesahau nenosiri?
                        </button>
                    )}
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-blue-300"
                >
                  {loading ? 'Inasubiri...' : (isLogin ? 'Ingia' : 'Jisajili')}
                </button>
              </form>
              
              <p className="text-center text-text-secondary mt-6">
                {isLogin ? "Huna akaunti?" : "Tayari una akaunti?"}{' '}
                <button onClick={() => { setIsLogin(!isLogin); resetFormState(); }} className="font-semibold text-primary hover:underline">
                  {isLogin ? 'Jisajili hapa' : 'Ingia hapa'}
                </button>
              </p>
            </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;