import React, { useState } from 'react';
import { App, AppFormData } from '../types';

interface AppFormProps {
  onSubmit: (data: AppFormData | App, files: { iconFile?: File, apkFile?: File, screenshotFiles?: File[] }) => Promise<void>;
  initialData?: App | null;
}

const initialFormState: AppFormData = {
  name: '',
  version: '',
  category: '',
  size: '',
  icon_url: '',
  apk_url: '',
  short_description: '',
  full_description: '',
  screenshots: [],
};

export const AppForm: React.FC<AppFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState<App | AppFormData>(
    initialData || initialFormState
  );
  const [iconFile, setIconFile] = useState<File | undefined>();
  const [apkFile, setApkFile] = useState<File | undefined>();
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      if (name === 'icon_file') {
        setIconFile(files[0]);
      } else if (name === 'apk_file') {
        setApkFile(files[0]);
      } else if (name === 'screenshot_files') {
        setScreenshotFiles(prev => [...prev, ...Array.from(files)]);
      }
    }
  };
  
  const handleRemoveExistingScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };
  
  const handleRemoveNewScreenshot = (index: number) => {
    setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.name) {
      setError("Jina la programu ni lazima.");
      return;
    }
    if (!initialData && !iconFile) {
      setError("Tafadhali chagua faili la ikoni.");
      return;
    }
    if (!initialData && !apkFile) {
      setError("Tafadhali chagua faili la APK.");
      return;
    }

    setLoading(true);
    try {
        await onSubmit(formData, { iconFile, apkFile, screenshotFiles });
    } catch (err: any) {
        setError(err.message || 'Kuna hitilafu imetokea wakati wa kuhifadhi.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Jina la Programu</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
        </div>
        <div>
          <label htmlFor="version" className="block text-sm font-medium text-text-secondary">Toleo</label>
          <input type="text" name="version" id="version" value={formData.version} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-text-secondary">Kategoria</label>
          <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
        </div>
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-text-secondary">Ukubwa (e.g., 25 MB)</label>
          <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
        </div>
      </div>
      
      <div>
        <label htmlFor="icon_file" className="block text-sm font-medium text-text-secondary">Picha ya Ikoni</label>
        <input 
          type="file" 
          name="icon_file" 
          id="icon_file" 
          onChange={handleFileChange} 
          accept="image/*"
          className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
        />
        <p className="mt-2 text-xs text-slate-500">
          {iconFile ? `Umechagua: ${iconFile.name}` : (formData.icon_url ? `Ikoni ya sasa imepakiwa.` : 'Chagua picha ya ikoni.')}
        </p>
      </div>

      <div>
        <label htmlFor="apk_file" className="block text-sm font-medium text-text-secondary">Faili la APK</label>
        <input 
          type="file" 
          name="apk_file" 
          id="apk_file" 
          onChange={handleFileChange} 
          accept=".apk"
          className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
        />
        <p className="mt-2 text-xs text-slate-500">
           {apkFile ? `Umechagua: ${apkFile.name}` : (formData.apk_url ? `Faili la sasa limepakiwa.` : 'Chagua faili la APK.')}
        </p>
      </div>
      
       <div>
        <label htmlFor="short_description" className="block text-sm font-medium text-text-secondary">Maelezo Mafupi</label>
        <textarea name="short_description" id="short_description" value={formData.short_description} onChange={handleChange} required rows={2} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="Maelezo mafupi na ya kuvutia..."></textarea>
      </div>
      <div>
        <label htmlFor="full_description" className="block text-sm font-medium text-text-secondary">Maelezo Kamili</label>
        <textarea name="full_description" id="full_description" value={formData.full_description} onChange={handleChange} required rows={4} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="Andika maelezo kamili hapa..."></textarea>
      </div>
      
      <div>
        <label htmlFor="screenshot_files" className="block text-sm font-medium text-text-secondary">Picha za Skrini</label>
        <p className="text-xs text-slate-500 mb-2">Unaweza kupakia picha mpya za skrini hapa.</p>
        
        {formData.screenshots && formData.screenshots.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Picha Zilizopo:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {formData.screenshots.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingScreenshot(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Futa Picha"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {screenshotFiles.length > 0 && (
           <div className="mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Picha Mpya (hazijahifadhiwa):</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {screenshotFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img src={URL.createObjectURL(file)} alt={`New Screenshot ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                   <button
                    type="button"
                    onClick={() => handleRemoveNewScreenshot(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Ondoa Picha"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <input 
          type="file" 
          name="screenshot_files" 
          id="screenshot_files" 
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
        />
      </div>
      
      {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</p>}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 disabled:bg-blue-300"
        >
          {loading ? 'Inahifadhi...' : 'Hifadhi'}
        </button>
      </div>
    </form>
  );
};