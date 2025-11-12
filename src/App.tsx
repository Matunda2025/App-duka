import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import AppDetailPage from './pages/AppDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage';
import { isSupabaseConfigured } from './services/supabaseClient';
import { DatabaseSetupError } from './components/DatabaseSetupError';
import { AuthModal } from './pages/AuthPage';

const SupabaseNotConfigured: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border-2 border-red-200 text-center">
            <h1 className="text-3xl font-bold text-red-700 mb-4">Hitilafu ya Usanidi</h1>
            <p className="text-slate-700 mb-2">
                Muunganisho wa Supabase haujasanidiwa ipasavyo.
            </p>
            <p className="text-slate-600 mb-6">
                Tafadhali sasisha faili la <code className="bg-red-100 text-red-800 font-mono p-1 rounded-md">services/supabaseClient.ts</code> na vitambulisho vya mradi wako vya Supabase.
            </p>
            <div className="bg-slate-100 p-4 rounded-md text-left text-sm text-slate-800">
                <p><span className="font-semibold">Supabase URL:</span> 'YOUR_SUPABASE_URL'</p>
                <p><span className="font-semibold">Supabase Anon Key:</span> 'YOUR_SUPABASE_ANON_KEY'</p>
            </div>
        </div>
    </div>
);

const UserRoutes: React.FC = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/" replace />;
};

const AdminRoutes: React.FC = () => {
  const { user, profile } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (profile?.role !== 'admin' && profile?.role !== 'developer') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AppRoutes: React.FC = () => {
    const { loading, dbSetupError, isAuthModalOpen, closeAuthModal } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Inasubiri...</div>;
    }

    if (dbSetupError) {
        return <DatabaseSetupError />;
    }

    return (
        <>
            <HashRouter>
                <Routes>
                    {/* Public Routes - Accessible to everyone */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/app/:id" element={<AppDetailPage />} />
                    
                    {/* Protected User Routes - Require login */}
                    <Route element={<UserRoutes />}>
                        <Route path="/my-account" element={<ProfilePage />} />
                    </Route>

                    {/* Protected Admin/Developer Routes - Require specific roles */}
                    <Route element={<AdminRoutes />}>
                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    </Route>
                    
                    {/* Fallback Route - Redirects any unknown paths to the homepage */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </HashRouter>
            {isAuthModalOpen && <AuthModal onClose={closeAuthModal} />}
        </>
    );
};


const App: React.FC = () => {
  if (!isSupabaseConfigured) {
    return <SupabaseNotConfigured />;
  }
  
  return (
    <AuthProvider>
        <AppRoutes />
    </AuthProvider>
  );
};

export default App;