import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    getAllApps, addApp, updateApp, deleteApp, uploadAppFile, 
    deleteAppFileByUrl, getAllProfiles, updateUserProfileRole, 
    updateAppStatus, deleteUser, createProfileForCurrentUser
} from '../services/api';
import { App, AppFormData, Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { AppTable } from '../components/AppTable';
import { Modal } from '../components/Modal';
import { AppForm } from '../components/AppForm';
import { UserEditModal } from '../components/UserEditModal';

const AdminDashboardPage: React.FC = () => {
  const { profile, user, logout } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const loadApps = async () => {
    try {
      setLoading(true);
      setError(null);
      const appData = await getAllApps();
      setApps(appData);
    } catch (err: any) {
      console.error("Failed to fetch apps:", err);
      setError(err.message || "Imeshindwa kupakia programu.");
    } finally {
      setLoading(false);
    }
  };
  
  const loadUsers = async () => {
      try {
          setLoadingUsers(true);
          setUserError(null);
          const userData = await getAllProfiles();
          setUsers(userData);
      } catch (err: any) {
          console.error("Failed to fetch users:", err);
          setUserError(err.message || "Imeshindwa kupakia watumiaji.");
      } finally {
          setLoadingUsers(false);
      }
  }

  useEffect(() => {
    loadApps();
    loadUsers();
  }, []);

  const handleOpenAppModal = (app?: App) => {
    setEditingApp(app || null);
    setIsAppModalOpen(true);
  };

  const handleCloseAppModal = () => {
    setEditingApp(null);
    setIsAppModalOpen(false);
  };
  
  const handleOpenUserModal = (user: Profile) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setEditingUser(null);
    setIsUserModalOpen(false);
  };

  const handleSaveApp = async (
    appData: AppFormData | App, 
    files: { iconFile?: File, apkFile?: File, screenshotFiles?: File[] }
  ) => {
    try {
      let submissionData = { ...appData };
      
      if (files.iconFile) {
        if ('id' in appData && appData.icon_url) {
          await deleteAppFileByUrl(appData.icon_url);
        }
        const newIconUrl = await uploadAppFile(files.iconFile, appData.name);
        submissionData.icon_url = newIconUrl;
      }

      if (files.apkFile) {
        if ('id' in appData && appData.apk_url) {
          await deleteAppFileByUrl(appData.apk_url);
        }
        const newApkUrl = await uploadAppFile(files.apkFile, appData.name);
        submissionData.apk_url = newApkUrl;
      }

      if (editingApp) {
        const originalUrls = editingApp.screenshots || [];
        const keptUrls = appData.screenshots || [];
        const urlsToDelete = originalUrls.filter(url => !keptUrls.includes(url));
        if (urlsToDelete.length > 0) {
          await Promise.all(urlsToDelete.map(url => deleteAppFileByUrl(url)));
        }
      }

      let newScreenshotUrls: string[] = [];
      if (files.screenshotFiles && files.screenshotFiles.length > 0) {
        newScreenshotUrls = await Promise.all(
          files.screenshotFiles.map(file => uploadAppFile(file, appData.name))
        );
      }
      
      submissionData.screenshots = [...(appData.screenshots || []), ...newScreenshotUrls];

      if ('id' in submissionData && submissionData.id) {
        const { id, created_at, average_rating, review_count, status, ...updateData } = submissionData as App;
        await updateApp(id, updateData);
      } else {
        if (!submissionData.icon_url || !submissionData.apk_url) {
          throw new Error("Tafadhali pakia faili la ikoni na APK kwa programu mpya.");
        }
        await addApp(submissionData as AppFormData);
      }
      handleCloseAppModal();
      await loadApps();
    } catch (err: any) {
        console.error("Failed to save app:", err);
        setError(err.message || "Imeshindwa kuhifadhi programu.");
        throw err;
    }
  };

  const handleDeleteApp = async (appId: string) => {
    const appToDelete = apps.find(app => app.id === appId);
    if (!appToDelete) return;

    if (window.confirm(`Una uhakika unataka kufuta programu "${appToDelete.name}"?`)) {
      try {
        await deleteAppFileByUrl(appToDelete.icon_url);
        await deleteAppFileByUrl(appToDelete.apk_url);
        if (appToDelete.screenshots && appToDelete.screenshots.length > 0) {
            await Promise.all(appToDelete.screenshots.map(url => deleteAppFileByUrl(url)));
        }
        await deleteApp(appId);
        await loadApps();
      } catch (err: any) {
        console.error("Failed to delete app:", err);
        setError(err.message || "Imeshindwa kufuta programu.");
      }
    }
  };
  
  const handleSaveUserRole = async (userId: string, newRole: Profile['role']) => {
      try {
          await updateUserProfileRole(userId, newRole);
          handleCloseUserModal();
          await loadUsers();
      } catch (err: any) {
          console.error("Failed to update role:", err);
          setUserError(err.message || "Imeshindwa kubadilisha jukumu.");
          throw err;
      }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Una uhakika unataka kuondoa akaunti hii? Kitendo hiki hakiwezi kutenduliwa.")) {
        try {
            await deleteUser(userId);
            await loadUsers();
        } catch (err: any) {
            console.error("Failed to delete user:", err);
            setUserError(err.message || "Imeshindwa kufuta mtumiaji.");
        }
    }
  }

  const handleStatusChange = async (appId: string, status: App['status']) => {
    try {
        await updateAppStatus(appId, status);
        await loadApps();
    } catch (err: any) {
        console.error("Failed to update app status:", err);
        setError(err.message || "Imeshindwa kubadilisha hadhi ya programu.");
    }
  };
  
  const handleCreateProfile = async () => {
    if (!user || !user.email) return;
    setIsCreatingProfile(true);
    setError(null);
    try {
        await createProfileForCurrentUser(user.id, user.email);
        // Success! Reload the page to refetch everything (auth context and user list).
        window.location.reload();
    } catch (err: any) {
        console.error("Failed to create profile:", err);
        setError("Imeshindwa kutengeneza wasifu wako. Tafadhali jaribu tena au wasiliana na usaidizi.");
    } finally {
        setIsCreatingProfile(false);
    }
  };

  const getRoleDisplayName = (role: Profile['role']) => {
    switch (role) {
        case 'admin': return 'Msimamizi';
        case 'developer': return 'Msanidi';
        case 'user': return 'Mtumiaji';
        default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-surface shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Jopo la Usimamizi</h1>
            <p className="text-sm text-gray-500 capitalize">{getRoleDisplayName(profile?.role || 'user')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/my-account" className="text-gray-600 hover:text-primary transition-colors hidden sm:block font-medium">
              Akaunti Yangu ({profile?.username || profile?.email})
            </Link>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
            >
              Ondoka
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {user && !profile && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md mb-8">
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg>
                    </div>
                    <div>
                        <p className="font-bold text-yellow-800">Wasifu Haupatikani</p>
                        <p className="text-sm text-yellow-700">Inaonekana wasifu wako haujatengenezwa. Hii inaweza kutokea kama ulijisajili kabla ya database kukamilika.</p>
                        <button
                            onClick={handleCreateProfile}
                            disabled={isCreatingProfile}
                            className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm disabled:bg-yellow-300"
                        >
                            {isCreatingProfile ? "Inatengeneza..." : "Tengeneza Wasifu na Jipe Cheo cha Admin"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-surface p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Orodha ya Programu</h2>
                <button
                    onClick={() => handleOpenAppModal()}
                    className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-300"
                >
                    Ongeza Programu
                </button>
            </div>
            
            {loading ? (
                <p className="text-center text-gray-500">Inapakia...</p>
            ) : error ? (
                <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>
            ) : (
                <AppTable 
                    apps={apps}
                    profile={profile}
                    onEdit={handleOpenAppModal} 
                    onDelete={handleDeleteApp}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
        
        {profile?.role === 'admin' && (
          <div className="bg-surface p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Usimamizi wa Watumiaji</h2>
              <p className="text-sm text-gray-500 mb-6">Gawa majukumu au ondoa watumiaji kutoka kwenye mfumo.</p>
              
              {loadingUsers ? (
                  <p className="text-center text-gray-500">Inapakia watumiaji...</p>
              ) : userError ? (
                  <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{userError}</p>
              ) : (
                  <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barua Pepe</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jina la Mtumiaji</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cheo</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vitendo</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                          {users.map(user => (
                              <tr key={user.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getRoleDisplayName(user.role)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                          onClick={() => handleOpenUserModal(user)}
                                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                                      >
                                          Hariri
                                      </button>
                                      <button
                                          onClick={() => handleDeleteUser(user.id)}
                                          className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                          disabled={user.id === profile?.id}
                                      >
                                          Ondoa
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
        )}
      </main>

      {isAppModalOpen && (
        <Modal
          title={editingApp ? 'Hariri Programu' : 'Ongeza Programu Mpya'}
          onClose={handleCloseAppModal}
        >
          <AppForm
            onSubmit={handleSaveApp}
            initialData={editingApp}
          />
        </Modal>
      )}
      
      {isUserModalOpen && editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={handleCloseUserModal}
          onSave={handleSaveUserRole}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;