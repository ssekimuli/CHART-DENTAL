import { getAuthToken } from './user';
import { getApiUrl } from './api-utils';

export interface ImportError {
  row: number;
  field: string;
  value: any;
  reason: string;
}

export interface MigrationStats {
  total: number;
  imported: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface MigrationResponse {
  success: boolean;
  stats: MigrationStats;
  errors?: ImportError[];
  warnings?: string[];
  import_id?: string;
}

export interface ValidationError {
  field: string;
  row?: number;
  reason: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationError[];
  stats: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
  };
}

export interface DuplicateRecord {
  row: number;
  matchedRecordId: string;
  matchedFields: string[];
  existingData: Record<string, any>;
}

export interface DuplicateCheckResult {
  duplicates: DuplicateRecord[];
  stats: {
    total: number;
    duplicates: number;
    unique: number;
  };
}

const getBaseUrl = () => getApiUrl();

const getHeaders = () => ({
  'Accept': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

/**
 * Upload and migrate data
 */
export const migrateData = async (file: File, section: string): Promise<MigrationResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('section', section);

  const response = await fetch(`${getBaseUrl()}/migrate`, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.reason || data.message || 'Migration failed');
  }

  return data as MigrationResponse;
};

/**
 * Validate CSV file before import
 */
export const validateFile = async (file: File, section: string): Promise<ValidationResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('section', section);

  const response = await fetch(`${getBaseUrl()}/migrate/validate`, {
    method: 'POST',
    body: formData,
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Validation failed');
  }

  return response.json();
};

/**
 * Preview CSV file content
 */
export const previewFile = async (file: File): Promise<{ columns: string[]; rows: string[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(0, 6);
      const data = lines.map(line => line.split(','));
      if (data.length > 0) {
        resolve({
          columns: data[0],
          rows: data.slice(1)
        });
      } else {
        reject(new Error('Empty CSV file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Check for duplicate records
 */
export const checkDuplicates = async (file: File, section: string, duplicateFields: string[]): Promise<DuplicateCheckResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('section', section);
  formData.append('duplicateFields', JSON.stringify(duplicateFields));

  const response = await fetch(`${getBaseUrl()}/migrate/check-duplicates`, {
    method: 'POST',
    body: formData,
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Duplicate check failed');
  }

  return response.json();
};

/**
 * Get migration progress
 */
export const getMigrationProgress = async (importId: string): Promise<{
  status: 'queued' | 'processing' | 'completed' | 'failed';
  processed: number;
  total: number;
  percentage: number;
  eta_seconds: number;
  current_row: number;
}> => {
  const response = await fetch(`${getBaseUrl()}/migrate/${importId}/progress`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to get progress');
  }

  return response.json();
};

/**
 * Get migration history
 */
export const getMigrationHistory = async (): Promise<Array<{
  id: string;
  section: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  imported: number;
  failed: number;
  started: string;
  completed?: string;
  duration?: number;
  user: string;
}>> => {
  const response = await fetch(`${getBaseUrl()}/migrate/history`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
};

/**
 * Rollback migration
 */
export const rollbackMigration = async (importId: string): Promise<{
  success: boolean;
  rolled_back_records: number;
}> => {
  const response = await fetch(`${getBaseUrl()}/migrate/${importId}/rollback`, {
    method: 'POST',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Rollback failed');
  }

  return response.json();
};

/**
 * Download error report
 */
export const exportErrorReport = (errors: ImportError[], stageId: string): void => {
  const csv = [
    ['Row', 'Field', 'Value', 'Reason'],
    ...errors.map(e => [
      e.row,
      e.field,
      e.value,
      e.reason
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(','))
   .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `migration-errors-${stageId}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Validate file format and size
 */
export const validateFileFormat = (file: File): { valid: boolean; error?: string } => {
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'Only CSV files are supported' };
  }

  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};

/**
 * Validation rules per section
 */
export const getValidationRules = (section: string): Record<string, any> => {
  const rules: Record<string, Record<string, any>> = {
    employees: {
      required: ['name', 'email', 'role'],
      unique: ['email'],
      formats: {
        email: 'email',
        phone: 'phone'
      }
    },
    patients: {
      required: ['first_name', 'last_name'],
      unique: ['email', 'phone'],
      formats: {
        email: 'email',
        phone: 'phone',
        date_of_birth: 'date'
      }
    },
    appointments: {
      required: ['patient_id', 'doctor_id', 'date', 'time'],
      references: {
        patient_id: 'patients',
        doctor_id: 'employees'
      }
    },
    clinical: {
      required: ['patient_id', 'doctor_id', 'visit_date'],
      references: {
        patient_id: 'patients',
        doctor_id: 'employees'
      }
    },
    financial: {
      required: ['patient_id', 'amount', 'date'],
      references: {
        patient_id: 'patients'
      },
      formats: {
        amount: 'number'
      }
    }
  };

  return rules[section] || {};
};
