import React, { useState } from 'react';
import { Profile } from '../types';
import { Modal } from './Modal';

interface UserEditModalProps {
  user: Profile;
  onClose: () => void;
  onSave: (userId: string, newRole: Profile['role']) => Promise<void>;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onSave }) => {
  const [selectedRole, setSelectedRole] = useState<Profile['role']>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (selectedRole === user.role) {
      onClose();
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave(user.id, selectedRole);
    } catch (err: any) {
      setError(err.message || 'Imeshindwa kuhifadhi mabadiliko.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Hariri Jukumu la Mtumiaji" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary">Barua Pepe</label>
          <p className="mt-1 p-2 bg-slate-100 rounded-md text-text-primary">{user.email}</p>
        </div>
        <div>
          <label htmlFor="role-select" className="block text-sm font-medium text-text-secondary">Chagua Jukumu Jipya</label>
          <select
            id="role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Profile['role'])}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="user">Mtumiaji (User)</option>
            <option value="developer">Msanidi (Developer)</option>
            <option value="admin">Msimamizi (Admin)</option>
          </select>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            Ghairi
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 disabled:bg-blue-300"
          >
            {loading ? 'Inahifadhi...' : 'Hifadhi'}
          </button>
        </div>
      </div>
    </Modal>
  );
};