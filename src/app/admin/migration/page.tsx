'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Database } from 'lucide-react';

const stages = [
  { id: 'employees', title: '1. Staff & Employees', description: 'Upload Doctors, Nurses, and Administrative staff.' },
  { id: 'patients', title: '2. Patients', description: 'Upload patient demographic and contact information.' },
  { id: 'clinical', title: '3. Clinical Data', description: 'Upload medical histories, prescriptions, and appointments.' },
  { id: 'financial', title: '4. Financial Data', description: 'Upload invoices, payments, and transactions.' },
];

export default function MigrationPage() {
  const [activeStage, setActiveStage] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, stageId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(prev => ({ ...prev, [stageId]: 'uploading' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('section', stageId);

    try {
      // Assuming your Laravel backend is running on standard port 8000
      const response = await fetch('http://localhost:8000/api/migrate', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Note: Add Authorization header here if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setUploadStatus(prev => ({ ...prev, [stageId]: 'success' }));
        if (activeStage < stages.length - 1) {
          setActiveStage(prev => prev + 1);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error(error);
      setUploadStatus(prev => ({ ...prev, [stageId]: 'error' }));
    }
  };
  const handleDownloadTemplate = (stageId: string) => {
    let filename = '';
    if (stageId === 'employees') filename = 'employees_sample.csv';
    else if (stageId === 'patients') filename = 'patients_sample.csv';
    else if (stageId === 'clinical') filename = 'treatments_sample.csv';
    else if (stageId === 'financial') filename = 'financial_sample.csv';
    
    if (filename) {
      window.open(`http://localhost:8000/api/import/templates/download/${filename}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Data Migration Center</h1>
              <p className="text-slate-500 mt-1">Upload CSV templates to securely migrate legacy data into the system.</p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p><strong>Important:</strong> Data must be imported in the exact order shown below to preserve relational integrity (e.g., Doctors must exist before assigning them to Medical Histories).</p>
          </div>
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isEnabled = index <= activeStage;
            const status = uploadStatus[stage.id] || 'idle';
            
            return (
              <div 
                key={stage.id} 
                className={`bg-white rounded-xl border p-6 transition-all duration-300 ${isEnabled ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-60 bg-slate-50/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${status === 'success' ? 'bg-green-100 text-green-600' : isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                      {status === 'success' ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{stage.title}</h3>
                      <p className="text-sm text-slate-500">{stage.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleDownloadTemplate(stage.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-medium bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download Template</span>
                    </button>
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".csv"
                        disabled={!isEnabled || status === 'uploading'}
                        onChange={(e) => handleFileUpload(e, stage.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <button 
                        disabled={!isEnabled || status === 'uploading'}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
                          ${status === 'success' ? 'bg-green-500 text-white shadow-sm' 
                          : status === 'uploading' ? 'bg-blue-400 text-white cursor-wait'
                          : isEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>
                          {status === 'success' ? 'Imported' 
                           : status === 'uploading' ? 'Uploading...' 
                           : 'Upload CSV'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
