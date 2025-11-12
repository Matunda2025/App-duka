import React, { useState } from 'react';
import { signInUser, signUpUser } from '../services/api';
import { Modal } from '../components/Modal';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = isLogin 
        ? await signInUser(email, password) 
        : await signUpUser(email, password);
      if (authError) throw authError;
      
      onClose(); // Close modal on successful authentication
    } catch (err: any)
      {
      setError(err.message || `Imeshindwa ${isLogin ? 'kuingia' : 'kujisajili'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={isLogin ? 'Ingia' : 'Jisajili'} onClose={onClose}>
      <div className="w-full max-w-md mx-auto">
        <p className="text-center text-text-secondary mb-8 -mt-2">Karibu App Duka</p>
        
        <form onSubmit={handleSubmit}>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
          
          <div className="mb-4">
            <label htmlFor="email-modal" className="block text-text-secondary text-sm font-bold mb-2">Barua Pepe</label>
            <input
              type="email"
              id="email-modal"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 text-text-primary border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password-modal" className="block text-text-secondary text-sm font-bold mb-2">Nenosiri</label>
            <input
              type="password"
              id="password-modal"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 text-text-primary border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Inasubiri...' : (isLogin ? 'Ingia' : 'Jisajili')}
          </button>
        </form>
        
        <p className="text-center text-text-secondary mt-6">
          {isLogin ? "Huna akaunti?" : "Tayari una akaunti?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary hover:underline">
            {isLogin ? 'Jisajili hapa' : 'Ingia hapa'}
          </button>
        </p>
      </div>
    </Modal>
  );
};


// The page itself is no longer used, but we keep a default export to avoid potential import errors.
const AuthPage: React.FC = () => null;
export default AuthPage;