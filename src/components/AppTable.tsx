import React from 'react';
import { App, Profile } from '../types';

interface AppTableProps {
  apps: App[];
  profile: Profile | null;
  onEdit: (app: App) => void;
  onDelete: (appId: string) => void;
  onStatusChange: (appId: string, status: App['status']) => void;
  onAnalyze: (app: App) => void;
}

const StatusBadge: React.FC<{ status: App['status'] }> = ({ status }) => {
    const statusStyles = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };
    const statusText = {
        pending: 'Inasubiri',
        approved: 'Imeidhinishwa',
        rejected: 'Imekataliwa',
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
            {statusText[status]}
        </span>
    );
};


export const AppTable: React.FC<AppTableProps> = ({ apps, profile, onEdit, onDelete, onStatusChange, onAnalyze }) => {
  if (apps.length === 0) {
    return <p className="text-center text-gray-500 py-4">Hakuna programu zilizoongezwa bado.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ikoni</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jina</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hadhi</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toleo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Iliwekwa</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vitendo</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {apps.map(app => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <img src={app.icon_url} alt={app.name} className="w-10 h-10 rounded-md object-cover" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{app.name}</div>
                 <div className="text-sm text-gray-500">{app.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {profile?.role === 'admin' ? (
                     <select
                        value={app.status}
                        onChange={(e) => onStatusChange(app.id, e.target.value as App['status'])}
                        className="block w-full pl-3 pr-8 py-1.5 text-xs border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                      >
                          <option value="pending">Inasubiri</option>
                          <option value="approved">Idhinisha</option>
                          <option value="rejected">Kataa</option>
                      </select>
                ) : (
                    <StatusBadge status={app.status} />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                  {app.version}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(app.created_at).toLocaleDateString('sw-TZ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {profile?.role === 'admin' && app.status === 'pending' && (
                    <button
                        onClick={() => onAnalyze(app)}
                        className="text-secondary hover:text-teal-700 mr-4 font-semibold"
                        title="Kagua na AI"
                    >
                       Kagua na AI
                    </button>
                )}
                <button
                  onClick={() => onEdit(app)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Hariri
                </button>
                <button
                  onClick={() => onDelete(app.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Futa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
