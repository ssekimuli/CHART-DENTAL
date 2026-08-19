'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Database, Loader2, Download, Merge } from 'lucide-react';
import { getAuthToken } from '@/lib/user';
import { getApiUrl } from '@/lib/api-utils';
import { toast } from '@/hooks/use-toast';

interface ImportError {
  row: number;
  field: string;
  value: any;
  reason: string;
}

interface ImportResult {
  success: boolean;
  stats: {
    total: number;
    imported: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  errors?: ImportError[];
  warnings?: string[];
  import_type?: 'single' | 'combined';
}

interface ImportSummary {
  stageId: string;
  result: ImportResult;
}

const stages = [
  { id: 'employees', title: '1. Staff & Employees', description: 'Upload Doctors, Nurses, and Administrative staff.' },
  { id: 'patients', title: '2. Patients', description: 'Upload patient demographic and contact information.' },
  { id: 'appointments', title: '3. Appointments', description: 'Upload scheduled and completed appointments.' },
  { id: 'clinical', title: '4. Clinical Data', description: 'Upload medical histories, and prescriptions.' },
  { id: 'financial', title: '5. Financial Data', description: 'Upload invoices, payments, and transactions.' },
];

// Import Results Modal
function ImportResultsModal({
  summary,
  onClose,
  onExportErrors
}: {
  summary: ImportSummary;
  onClose: () => void;
  onExportErrors: () => void;
}) {
  const { result, stageId } = summary;
  const stage = stages.find(s => s.id === stageId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b p-6">
          <h3 className="font-bold text-lg text-slate-900">{stage?.title} - Import Complete</h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{result.stats.imported}</div>
              <div className="text-sm text-green-700">Records Imported</div>
            </div>
            {result.stats.failed > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{result.stats.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            )}
            {result.stats.skipped > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">{result.stats.skipped}</div>
                <div className="text-sm text-yellow-700">Skipped</div>
              </div>
            )}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-slate-600">{result.stats.total}</div>
              <div className="text-sm text-slate-700">Total Records</div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> Warnings
              </h4>
              <ul className="space-y-1 text-sm text-amber-800">
                {result.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Details */}
          {result.errors && result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> Errors ({result.errors.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
                {result.errors.slice(0, 10).map((error, i) => (
                  <div key={i} className="bg-white rounded p-2 border border-red-100">
                    <div className="font-semibold text-red-800">Row {error.row} - {error.field}</div>
                    <div className="text-red-700 text-xs">{error.reason}</div>
                    <div className="text-slate-600 text-xs">Value: {String(error.value).substring(0, 50)}</div>
                  </div>
                ))}
                {result.errors.length > 10 && (
                  <div className="text-slate-500 text-xs p-2">
                    ... and {result.errors.length - 10} more errors
                  </div>
                )}
              </div>
              <button
                onClick={onExportErrors}
                className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-1" /> Export Error Report
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <div>Duration: {result.stats.duration.toFixed(2)}s</div>
            <div>Success Rate: {((result.stats.imported / result.stats.total) * 100).toFixed(1)}%</div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MigrationPage() {
  const [activeStage, setActiveStage] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [selectedSummary, setSelectedSummary] = useState<ImportSummary | null>(null);
  const [summaries, setSummaries] = useState<Record<string, ImportSummary>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, stageId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setUploadErrors(prev => ({ ...prev, [stageId]: 'Only CSV files are supported' }));
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [stageId]: 'File size exceeds 50MB limit' }));
      toast({
        title: "File Too Large",
        description: "Maximum file size is 50MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadStatus(prev => ({ ...prev, [stageId]: 'uploading' }));
    setUploadErrors(prev => ({ ...prev, [stageId]: '' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('section', stageId);

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/migrate`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const data = await response.json() as ImportResult;

      if (response.ok && data.success) {
        setUploadStatus(prev => ({ ...prev, [stageId]: 'success' }));

        // Store summary
        setSummaries(prev => ({
          ...prev,
          [stageId]: { stageId, result: data }
        }));

        // Show success toast
        toast({
          title: "Success",
          description: `${data.stats.imported} records imported successfully.`
        });

        // Auto-advance to next stage
        if (activeStage < stages.length - 1) {
          setActiveStage(prev => prev + 1);
        }
      } else {
        const errorMsg = data.errors?.[0]?.reason || data.errors?.[0]?.field || 'Upload failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      setUploadStatus(prev => ({ ...prev, [stageId]: 'error' }));
      setUploadErrors(prev => ({ ...prev, [stageId]: errorMessage }));

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });

      console.error(error);
    }
  };

  const handleDownloadTemplate = (stageId: string) => {
    const baseUrl = getApiUrl();
    const templates: Record<string, string> = {
      employees: 'employees_sample.csv',
      patients: 'patients_sample.csv',
      appointments: 'appointments_sample.csv',
      clinical: 'treatments_sample.csv',
      financial: 'financial_sample.csv',
      combined: 'migrate/template/download'
    };

    if (stageId === 'combined') {
      window.location.href = `${baseUrl}/migrate/template/download`;
    } else if (templates[stageId]) {
      window.open(`${baseUrl}/import/templates/download/${templates[stageId]}`, '_blank');
    }
  };

  const handleExportErrors = (stageId: string) => {
    const summary = summaries[stageId];
    if (!summary?.result.errors) return;

    const csv = [
      ['Row', 'Field', 'Value', 'Reason'],
      ...summary.result.errors.map(e => [
        e.row,
        e.field,
        e.value,
        e.reason
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(','))
     .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${stageId}.csv`;
    a.click();
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

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p><strong>Sequential Import:</strong> Upload 5 separate CSVs one at a time.</p>
                <p className="mt-1 text-xs">Required for ordered data import.</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3 text-green-800 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p><strong>Combined Import:</strong> Upload 1 Excel file with all data.</p>
                <button
                  onClick={() => handleDownloadTemplate('combined')}
                  className="mt-2 inline-flex items-center gap-1 text-green-700 hover:text-green-900 font-medium text-xs bg-green-100 hover:bg-green-200 px-3 py-1 rounded transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download Template
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Import Upload Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Combined Import</h2>
          <p className="text-slate-600 mb-6">Upload your Excel file with all data types. The system will process automatically in the correct order.</p>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer group">
            <input
              type="file"
              accept=".xlsx,.csv"
              id="combined-import-input"
              className="hidden"
              disabled={uploadStatus.combined === 'uploading'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Validate file type
                if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
                  setUploadErrors(prev => ({ ...prev, combined: 'Only Excel (.xlsx) or CSV files are supported' }));
                  toast({
                    title: "Invalid File",
                    description: "Please upload an Excel or CSV file.",
                    variant: "destructive"
                  });
                  return;
                }

                // Validate file size (max 50MB)
                if (file.size > 50 * 1024 * 1024) {
                  setUploadErrors(prev => ({ ...prev, combined: 'File size exceeds 50MB limit' }));
                  toast({
                    title: "File Too Large",
                    description: "Maximum file size is 50MB.",
                    variant: "destructive"
                  });
                  return;
                }

                setUploadStatus(prev => ({ ...prev, combined: 'uploading' }));
                setUploadErrors(prev => ({ ...prev, combined: '' }));

                const formData = new FormData();
                formData.append('file', file);

                const baseUrl = getApiUrl();

                fetch(`${baseUrl}/migrate/combined`, {
                  method: 'POST',
                  body: formData,
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                  }
                })
                .then(response => response.json())
                .then(data => {
                  if (response.ok && data.success) {
                    setUploadStatus(prev => ({ ...prev, combined: 'success' }));
                    toast({
                      title: "Success",
                      description: `${data.stats.imported} records imported successfully.`
                    });
                  } else {
                    const errorMsg = data.errors?.[0]?.reason || data.errors?.[0]?.field || 'Upload failed';
                    throw new Error(errorMsg);
                  }
                })
                .catch(error => {
                  const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
                  setUploadStatus(prev => ({ ...prev, combined: 'error' }));
                  setUploadErrors(prev => ({ ...prev, combined: errorMessage }));
                  toast({
                    title: "Upload Failed",
                    description: errorMessage,
                    variant: "destructive"
                  });
                });
              }}
            />
            <label htmlFor="combined-import-input" className="cursor-pointer block">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4 group-hover:text-green-400 transition-colors" />
              <p className="text-slate-900 font-semibold mb-1">Click to upload or drag and drop</p>
              <p className="text-slate-500 text-sm">Excel (.xlsx) or CSV file up to 50MB</p>
            </label>
          </div>

          {uploadErrors.combined && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{uploadErrors.combined}</span>
            </div>
          )}

          {uploadStatus.combined === 'uploading' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading and processing...</span>
            </div>
          )}

          {uploadStatus.combined === 'success' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Upload successful! File processed.</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isEnabled = index <= activeStage;
            const status = uploadStatus[stage.id] || 'idle';
            const error = uploadErrors[stage.id];
            const summary = summaries[stage.id];

            return (
              <div
                key={stage.id}
                className={`bg-white rounded-xl border p-6 transition-all duration-300 ${
                  isEnabled ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      status === 'success' ? 'bg-green-100 text-green-600'
                      : status === 'error' ? 'bg-red-100 text-red-600'
                      : isEnabled ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-200 text-slate-400'
                    }`}>
                      {status === 'success' ? <CheckCircle2 className="w-6 h-6" />
                       : status === 'error' ? <AlertCircle className="w-6 h-6" />
                       : index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{stage.title}</h3>
                      <p className="text-sm text-slate-500">{stage.description}</p>

                      {/* Show error message if exists */}
                      {error && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Show summary if completed */}
                      {summary && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                          ✓ {summary.result.stats.imported} records imported
                          {summary.result.stats.failed > 0 && `, ${summary.result.stats.failed} failed`}
                          {summary.result.stats.skipped > 0 && `, ${summary.result.stats.skipped} skipped`}
                          <button
                            onClick={() => setSelectedSummary(summary)}
                            className="ml-2 underline hover:text-green-800 font-semibold"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadTemplate(stage.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-medium bg-blue-50 px-3 py-2 rounded-md transition-colors"
                      title="Download CSV template"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Template</span>
                    </button>

                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        disabled={!isEnabled || status === 'uploading'}
                        onChange={(e) => handleFileUpload(e, stage.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        aria-label={`Upload CSV for ${stage.title}`}
                      />
                      <button
                        disabled={!isEnabled || status === 'uploading'}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
                          ${status === 'success' ? 'bg-green-500 text-white shadow-sm'
                          : status === 'uploading' ? 'bg-blue-400 text-white cursor-wait'
                          : status === 'error' ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                          : isEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        {status === 'uploading' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>
                          {status === 'success' ? 'Imported'
                           : status === 'uploading' ? 'Uploading...'
                           : status === 'error' ? 'Retry'
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

        {/* Progress indicator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">Progress</h3>
          <div className="space-y-2">
            {stages.map((stage, index) => {
              const status = uploadStatus[stage.id] || 'idle';
              return (
                <div key={stage.id} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    status === 'success' ? 'bg-green-500 text-white'
                    : status === 'error' ? 'bg-red-500 text-white'
                    : status === 'uploading' ? 'bg-blue-500 text-white'
                    : index < activeStage ? 'bg-slate-400 text-white'
                    : 'bg-slate-200 text-slate-600'
                  }`}>
                    {status === 'success' ? '✓' : status === 'error' ? '✕' : index + 1}
                  </div>
                  <span className="text-sm text-slate-700">{stage.title}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Results Modal */}
      {selectedSummary && (
        <ImportResultsModal
          summary={selectedSummary}
          onClose={() => setSelectedSummary(null)}
          onExportErrors={() => handleExportErrors(selectedSummary.stageId)}
        />
      )}
    </div>
  );
}
