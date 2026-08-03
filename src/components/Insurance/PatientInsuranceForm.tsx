import React, { useState, useEffect } from 'react';
import { insuranceApi } from '../../services/api/insurance';

interface Props {
  patientId: number;
  onSuccess: () => void;
}

export const PatientInsuranceForm: React.FC<Props> = ({ patientId, onSuccess }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    insurance_policy_id: '',
    relationship: 'principal',
    membership_number: '',
    coverage_start_date: '',
    coverage_end_date: '',
    is_primary: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    insuranceApi.getCompanies().then(res => setCompanies(res.data.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await insuranceApi.attachPolicyToPatient(patientId, formData);
      alert('Insurance attached successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to attach insurance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Add Insurance Coverage</h3>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Policy ID (Select from list)</label>
          <input 
            type="number" required 
            className="mt-1 block w-full border rounded p-2"
            value={formData.insurance_policy_id}
            onChange={(e) => setFormData({...formData, insurance_policy_id: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Membership Number</label>
          <input 
            type="text" required 
            className="mt-1 block w-full border rounded p-2"
            value={formData.membership_number}
            onChange={(e) => setFormData({...formData, membership_number: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Relationship to Principal</label>
          <select 
            className="mt-1 block w-full border rounded p-2"
            value={formData.relationship}
            onChange={(e) => setFormData({...formData, relationship: e.target.value})}
          >
            <option value="principal">Principal</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input 
              type="date" 
              className="mt-1 block w-full border rounded p-2"
              value={formData.coverage_start_date}
              onChange={(e) => setFormData({...formData, coverage_start_date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input 
              type="date" 
              className="mt-1 block w-full border rounded p-2"
              value={formData.coverage_end_date}
              onChange={(e) => setFormData({...formData, coverage_end_date: e.target.value})}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input 
            type="checkbox" id="is_primary"
            className="mr-2"
            checked={formData.is_primary}
            onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
          />
          <label htmlFor="is_primary" className="text-sm font-medium">Set as Primary Insurance</label>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Attach Insurance'}
        </button>
      </form>
    </div>
  );
};
